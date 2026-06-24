"""
Custom UserManager required by AbstractBaseUser.
Provides create_user() and create_superuser() methods.
"""

from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    """
    Custom manager for the User model.
    Email is used instead of username.
    """

    def create_user(self, email: str, full_name: str = '', password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required.')
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        # We don't use passwords — set an unusable password for compatibility
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, full_name: str = '', password=None, **extra_fields):
        """
        Creates a Django superuser for admin access.
        Used for the initial admin seed — sets role=admin and is_staff=True.
        """
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        return self.create_user(email, full_name, password, **extra_fields)
