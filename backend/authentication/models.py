import secrets
import string

from django.db import models
from django.contrib.auth.hashers import make_password


def _generate_access_code():
    """Generate a unique 5-character alphanumeric access code, e.g. MINI-8072A."""
    alphabet = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(alphabet) for _ in range(5))
    return f"MINI-{suffix}"


class UserDetails(models.Model):
    # Core
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)  # stored as hashed value
    access_code = models.CharField(max_length=20, unique=True, blank=True)

    # Extended profile
    display_name = models.CharField(max_length=100, blank=True, default="")
    phone = models.CharField(max_length=30, blank=True, default="")
    date_of_birth = models.DateField(null=True, blank=True)
    about = models.TextField(blank=True, default="")
    avatar_url = models.TextField(blank=True, default="")  # stores base64 data URL or remote URL

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_details'
        verbose_name = 'User Detail'
        verbose_name_plural = 'User Details'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} <{self.email}>"

    def save(self, *args, **kwargs):
        # Auto-generate a unique access code on first save
        if not self.access_code:
            code = _generate_access_code()
            while UserDetails.objects.filter(access_code=code).exists():
                code = _generate_access_code()
            self.access_code = code

        # Hash the password only if it's not already hashed
        if self.password and not self.password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2')):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)
