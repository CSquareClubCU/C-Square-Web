"""
Users app views.

Rules (from CONVENTIONS.md):
- Views handle HTTP only — request parsing, permission checks, response formatting
- All business logic is delegated to users/services.py
- Never put logic in views
"""

import logging

from django.contrib.auth import login, logout
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.exceptions import AppError
from core.permissions import IsAdmin
from users import services
from users.serializers import (
    MagicLinkRequestSerializer,
    UserListSerializer,
    UserRoleSerializer,
    UserSerializer,
    UserUpdateSerializer,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Auth views — /api/auth/
# ---------------------------------------------------------------------------

class MagicLinkView(APIView):
    """
    POST /api/auth/magic-link/
    Request a magic link. Sends email with one-time login link.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MagicLinkRequestSerializer(data=request.data)
        if not serializer.is_valid():
            raise AppError(
                code='VALIDATION_ERROR',
                message='Invalid input.',
                fields=serializer.errors,
            )

        email = serializer.validated_data['email']
        services.send_magic_link(email)

        # Always return 200 — never reveal whether email exists (per API spec)
        return Response(
            {
                'message': 'Magic link sent. Check your email.',
                'email': email,
            },
            status=status.HTTP_200_OK,
        )


class MagicLinkVerifyView(APIView):
    """
    GET /api/auth/verify/?token=<sesame_token>
    Validate the token, establish a session, return the user.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get('token', '').strip()

        if not token:
            raise AppError(
                code='INVALID_TOKEN',
                message='This link is invalid or has expired. Please request a new one.',
            )

        # Service validates token and returns user (or raises AppError)
        user = services.verify_magic_link(token, request)

        # Establish Django session
        login(request, user, backend='sesame.backends.ModelBackend')

        return Response(
            {'user': UserSerializer(user).data},
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Clear the session and log out.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(
            {'message': 'Logged out successfully.'},
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    """
    GET /api/auth/me/
    Return the currently authenticated user's profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            UserSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# User management views — /api/users/
# ---------------------------------------------------------------------------

class UserProfileView(APIView):
    """
    PATCH /api/users/me/
    Update the current user's mutable profile fields.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            raise AppError(
                code='VALIDATION_ERROR',
                message='Invalid input.',
                fields=serializer.errors,
            )

        user = services.update_user_profile(request.user, serializer.validated_data)
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_200_OK,
        )


class UserListView(APIView):
    """
    GET /api/users/
    List all users. Admin only.
    Supports ?role= and ?search= query params.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        from core.pagination import StandardPagination

        role = request.query_params.get('role')
        search = request.query_params.get('search')

        queryset = services.get_user_list(role=role, search=search)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = UserListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class UserRoleView(APIView):
    """
    PATCH /api/users/{id}/role/
    Change a user's role. Admin only.
    """
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        from users.models import User

        # Get the target user
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            raise AppError(
                code='NOT_FOUND',
                message='User not found.',
                status=404,
            )

        serializer = UserRoleSerializer(data=request.data)
        if not serializer.is_valid():
            raise AppError(
                code='VALIDATION_ERROR',
                message='Invalid role.',
                fields=serializer.errors,
            )

        updated_user = services.change_user_role(
            target_user=target_user,
            new_role=serializer.validated_data['role'],
            changed_by=request.user,
        )

        return Response(
            {
                'id': str(updated_user.id),
                'email': updated_user.email,
                'role': updated_user.role,
            },
            status=status.HTTP_200_OK,
        )
