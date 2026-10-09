from django.contrib import admin
from .models import UserDetails


@admin.register(UserDetails)
class UserDetailsAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'access_code', 'created_at', 'updated_at')
    search_fields = ('name', 'email', 'access_code')
    readonly_fields = ('password', 'access_code', 'created_at', 'updated_at')
    ordering = ('-created_at',)
