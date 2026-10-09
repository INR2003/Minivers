from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

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
        fields = (
            'id', 'name', 'email', 'access_code',
            'display_name', 'phone', 'date_of_birth', 'about', 'avatar_url',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'access_code', 'created_at', 'updated_at')


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Allows updating editable profile fields only."""
    class Meta:
        model = UserDetails
        fields = ('name', 'display_name', 'phone', 'date_of_birth', 'about', 'avatar_url')

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save(update_fields=list(validated_data.keys()) + ['updated_at'])
        return instance


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
        # model.save() will hash the password and generate the access_code automatically
        return UserDetails.objects.create(**validated_data)


class UserDetailsLoginSerializer(serializers.Serializer):
    """Sign-in using only the special access code."""
    access_code = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        access_code = attrs.get('access_code', '').strip().upper()
        try:
            user = UserDetails.objects.get(access_code=access_code)
        except UserDetails.DoesNotExist:
            raise serializers.ValidationError({"access_code": "Invalid access code. Please check and try again."})

        attrs['user'] = user
        return attrs

