"""
Custom DRF permission classes.

These are the building blocks used across all apps.
Each view sets permission_classes = [IsAdmin] or [IsAdminOrVolunteer] etc.

Role enforcement lives here — never in views or serializers.
Frontend middleware.ts provides UX protection; these classes are the real security gate.
"""

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Allows access only to users with role='admin'.
    Admins also have is_staff=True for Django Admin access.
    """

    message = 'You do not have permission to perform this action.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsVolunteer(BasePermission):
    """
    Allows access only to users with role='volunteer'.
    Note: volunteers have scoped event access via VolunteerAssignment —
    this class only checks the role, not the event assignment.
    Event-level scoping is enforced in the attendance service layer.
    """

    message = 'You do not have permission to perform this action.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'volunteer'
        )


class IsAdminOrVolunteer(BasePermission):
    """
    Allows access to admins and volunteers.
    Used for check-in endpoints where both roles need access.
    Volunteer's event-level scoping is enforced separately in services.
    """

    message = 'You do not have permission to perform this action.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('admin', 'volunteer')
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission.
    Allows access if the user owns the object or is an admin.
    The view must call check_object_permissions(request, obj).
    The object must have a 'user' attribute pointing to the owner.
    """

    message = 'You do not have permission to access this resource.'

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
            return True
        return obj.user == request.user
