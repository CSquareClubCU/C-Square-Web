"""
Users app Django Admin registration.

Admins use this to manage users, change roles, and view registration history.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from users.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin for the User model.
    Extends Django's built-in UserAdmin for change password support.
    """

    list_display = ('email', 'full_name', 'role', 'is_cu_student', 'is_active', 'date_joined')
    list_filter = ('role', 'is_cu_student', 'is_active', 'is_staff')
    search_fields = ('email', 'full_name', 'student_uid')
    ordering = ('-date_joined',)

    # Fields shown when viewing/editing a specific user
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'phone')}),
        ('Student Info', {'fields': ('student_uid', 'branch', 'year', 'semester', 'batch')}),
        ('Roles & Access', {'fields': ('role', 'is_cu_student', 'is_active', 'is_staff', 'is_superuser')}),
        ('Permissions', {'fields': ('groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    # Fields shown when creating a new user via admin
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'role', 'is_cu_student', 'is_active', 'is_staff'),
        }),
    )

    # email replaces username as the primary identifier
    filter_horizontal = ('groups', 'user_permissions')
    readonly_fields = ('date_joined', 'last_login')
