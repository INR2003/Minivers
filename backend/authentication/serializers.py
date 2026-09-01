from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import check_password

from .models import UserDetails


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user


# ── UserDetails Serializers ────────────────────────────────────────────────────

class UserDetailsSerializer(serializers.ModelSerializer):
    """Read-only serializer – never exposes the password hash."""
    class Meta:
        model = UserDetails
        fields = ('id', 'name', 'email', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class UserDetailsRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    class Meta:
        model = UserDetails
        fields = ('id', 'name', 'email', 'password')

    def validate_email(self, value):
        if UserDetails.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        # model.save() will hash the password automatically
        return UserDetails.objects.create(**validated_data)


class UserDetailsLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        try:
            user = UserDetails.objects.get(email=email)
        except UserDetails.DoesNotExist:
            raise serializers.ValidationError({"email": "No account found with this email."})

        if not check_password(password, user.password):
            raise serializers.ValidationError({"password": "Incorrect password."})

        attrs['user'] = user
        return attrs

