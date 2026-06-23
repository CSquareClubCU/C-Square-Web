from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from core.permissions import IsAdmin
from core.exceptions import AppError
from .models import User, UserRole


class UserListView(APIView):
    """GET /api/users/ — Admin only: list all users."""
    permission_classes = [IsAdmin]

    def get(self, request):
        queryset = User.objects.all()

        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                email__icontains=search
            ) | queryset.filter(full_name__icontains=search)

        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(queryset, request)
        data = [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "is_cu_student": u.is_cu_student,
                "date_joined": u.date_joined,
            }
            for u in page
        ]
        return paginator.get_paginated_response(data)


class UserRoleView(APIView):
    """PATCH /api/users/{id}/role/ — Admin only: change a user's role."""
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        new_role = request.data.get('role')

        valid_roles = [r.value for r in UserRole]
        if not new_role or new_role not in valid_roles:
            return Response(
                {
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Invalid role.",
                        "fields": {"role": f"Must be one of: {', '.join(valid_roles)}."}
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user.role = new_role
        # Sync is_staff for admin role — required for Django Admin access
        user.is_staff = (new_role == UserRole.ADMIN)
        user.save(update_fields=['role', 'is_staff'])

        return Response({"id": str(user.id), "email": user.email, "role": user.role})
