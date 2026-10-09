from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from django.contrib.auth.models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    UserDetailsSerializer,
    UserDetailsRegisterSerializer,
    UserDetailsLoginSerializer,
    ProfileUpdateSerializer,
)


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """Disable CSRF enforcement for JSON API endpoints."""
    def enforce_csrf(self, request):
        return


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            "message": "User registered successfully."
        }, status=status.HTTP_201_CREATED)


class CurrentUserView(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ── UserDetails Views ──────────────────────────────────────────────────────────

class UserDetailsRegisterView(APIView):
    """
    POST /api/auth/user-details/register/
    Body: { name, email, password }
    Returns the newly generated access_code — user must save this to sign in.
    """
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = UserDetailsRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "Account created successfully.",
                "access_code": user.access_code,
                "user": UserDetailsSerializer(user).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailsLoginView(APIView):
    """
    POST /api/auth/user-details/login/
    Body: { access_code }
    """
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = UserDetailsLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            return Response({
                "message": "Logged in successfully.",
                "user": UserDetailsSerializer(user).data,
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailsListView(generics.ListAPIView):
    """
    GET /api/auth/user-details/  — list all UserDetails records (admin use)
    """
    from .models import UserDetails as _UserDetails
    queryset = _UserDetails.objects.all()
    serializer_class = UserDetailsSerializer
    permission_classes = (IsAuthenticated,)


class UserDetailsProfileView(APIView):
    """
    GET   /api/auth/user-details/<id>/profile/  — fetch full profile
    PATCH /api/auth/user-details/<id>/profile/  — update editable fields
    """
    permission_classes = (AllowAny,)

    def _get_user(self, pk):
        from .models import UserDetails
        try:
            return UserDetails.objects.get(pk=pk)
        except UserDetails.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self._get_user(pk)
        if user is None:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserDetailsSerializer(user).data)

    def patch(self, request, pk):
        user = self._get_user(pk)
        if user is None:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProfileUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response({
                "message": "Profile updated successfully.",
                "user": UserDetailsSerializer(updated).data,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetAccessCodeView(APIView):
    """
    POST /api/auth/user-details/<id>/reset-code/
    Generates a brand-new 5-char access code. The old code becomes invalid immediately.
    """
    permission_classes = (AllowAny,)

    def post(self, request, pk):
        from .models import UserDetails, _generate_access_code
        try:
            user = UserDetails.objects.get(pk=pk)
        except UserDetails.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        new_code = _generate_access_code()
        while UserDetails.objects.exclude(pk=pk).filter(access_code=new_code).exists():
            new_code = _generate_access_code()

        user.access_code = new_code
        user.save(update_fields=["access_code", "updated_at"])
        return Response({
            "message": "Access code reset successfully.",
            "access_code": new_code,
            "user": UserDetailsSerializer(user).data,
        })
