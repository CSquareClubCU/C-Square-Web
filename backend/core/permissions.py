from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Allow access only to admin-role users."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )


class IsVolunteer(permissions.BasePermission):
    """Allow access only to volunteer-role users."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'volunteer'
        )


class IsAdminOrVolunteer(permissions.BasePermission):
    """Allow access to admins and volunteers."""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ('admin', 'volunteer')
        )
