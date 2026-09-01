from django.contrib import admin
from .models import UserDetails


@admin.register(UserDetails)
class UserDetailsAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'created_at', 'updated_at')
    search_fields = ('name', 'email')
    readonly_fields = ('password', 'created_at', 'updated_at')
    ordering = ('-created_at',)
