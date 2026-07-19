"""
Team app views.
Delegates all logic to team/services.py.

Endpoints:
- GET  /api/team/         Public list of active members
- POST /api/team/         Admin: create member
- PATCH /api/team/{id}/   Admin: update member
- DELETE /api/team/{id}/  Admin: permanent deletion
- POST /api/team/{id}/photo/  Admin: upload photo
"""

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.exceptions import AppError
from core.permissions import IsAdmin
from team import services
from team.models import TeamMember
from team.serializers import (
    TeamMemberCreateUpdateSerializer,
    TeamMemberSerializer,
    TeamMemberAdminSerializer,
    TeamPhotoSerializer,
)


class TeamMemberListView(APIView):
    """
    GET  /api/team/  — Public: list active members ordered by display_order
    POST /api/team/  — Admin: create a new team member
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

    def get(self, request):
        is_admin = (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'admin'
        )
        if is_admin:
            members = TeamMember.objects.select_related('user').all()
            serializer = TeamMemberAdminSerializer(members, many=True)
        else:
            members = TeamMember.objects.filter(is_active=True)
            serializer = TeamMemberSerializer(members, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TeamMemberCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            raise AppError('VALIDATION_ERROR', 'Invalid input.', fields=serializer.errors)
        member = services.create_team_member(serializer.validated_data)
        return Response(TeamMemberAdminSerializer(member).data, status=status.HTTP_201_CREATED)


class TeamMemberDetailView(APIView):
    """
    PATCH  /api/team/{id}/  — Admin: partial update
    DELETE /api/team/{id}/  — Admin: permanent deletion
    """
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        member = services.get_team_member_or_404(pk)
        serializer = TeamMemberCreateUpdateSerializer(member, data=request.data, partial=True)
        if not serializer.is_valid():
            raise AppError('VALIDATION_ERROR', 'Invalid input.', fields=serializer.errors)
        updated = services.update_team_member(member, serializer.validated_data)
        return Response(TeamMemberAdminSerializer(updated).data)

    def delete(self, request, pk):
        member = services.get_team_member_or_404(pk)
        services.delete_team_member(member)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeamMemberPhotoView(APIView):
    """
    POST /api/team/{id}/photo/  — Admin: upload or replace photo
    """
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        member = services.get_team_member_or_404(pk)
        serializer = TeamPhotoSerializer(data=request.data)
        if not serializer.is_valid():
            raise AppError('INVALID_FILE', 'File must be jpg, png, or webp and under 5MB.', fields=serializer.errors)
        updated = services.upload_team_photo(member, serializer.validated_data['photo'])
        return Response({'photo_url': f"{updated.photo_url}?t={int(updated.updated_at.timestamp())}"})
