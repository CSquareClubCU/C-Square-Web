"""
Custom User model.

Extends AbstractBaseUser for full control over the field set.
email is the USERNAME_FIELD — required by django-sesame for magic link lookup.
role controls what the user can do in the system.
is_cu_student is set automatically from the email domain on first login.
"""

import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from users.managers import UserManager


class UserRole(models.TextChoices):
    STUDENT = 'student', 'Student'
    VOLUNTEER = 'volunteer', 'Volunteer'
    ADMIN = 'admin', 'Admin'


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model for C Square Club.

    All person who log in via magic link get a record here.
    UUID primary key — never auto-increment.
    No username field — email is the unique identifier.
    """

    # Primary key — UUID v4 as required by CONVENTIONS.md
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    # Core identity
    email = models.EmailField(
        max_length=254,
        unique=True,
        db_index=True,
    )
    full_name = models.CharField(max_length=255)

    # Role — controls access level
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.STUDENT,
        db_index=True,
    )

    # CU vs external distinction — set from email domain at first login
    is_cu_student = models.BooleanField(default=False)

    # Student profile fields — NULL on first login, filled at first registration
    student_uid = models.CharField(max_length=20, null=True, blank=True)
    branch = models.CharField(max_length=100, null=True, blank=True)
    year = models.IntegerField(null=True, blank=True)
    semester = models.IntegerField(null=True, blank=True)
    batch = models.CharField(max_length=20, null=True, blank=True)
    phone = models.CharField(max_length=15, null=True, blank=True)

    # Django internals
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # Required for Django Admin access

    # Timestamps
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'users_user'
        ordering = ['-date_joined']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f'{self.full_name} <{self.email}>'

    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN

    @property
    def is_volunteer(self):
        return self.role == UserRole.VOLUNTEER
