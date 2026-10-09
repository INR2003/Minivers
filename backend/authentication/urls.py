from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from .views import (
    RegisterView,
    CurrentUserView,
    LogoutView,
    UserDetailsRegisterView,
    UserDetailsLoginView,
    UserDetailsListView,
    UserDetailsProfileView,
    ResetAccessCodeView,
)

urlpatterns = [
    # Standard JWT auth
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('me/', CurrentUserView.as_view(), name='auth_me'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),

    # UserDetails endpoints
    path('user-details/register/', UserDetailsRegisterView.as_view(), name='user_details_register'),
    path('user-details/login/', UserDetailsLoginView.as_view(), name='user_details_login'),
    path('user-details/', UserDetailsListView.as_view(), name='user_details_list'),
    path('user-details/<int:pk>/profile/', UserDetailsProfileView.as_view(), name='user_details_profile'),
    path('user-details/<int:pk>/reset-code/', ResetAccessCodeView.as_view(), name='user_details_reset_code'),
]
