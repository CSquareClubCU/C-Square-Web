from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework import serializers as drf_serializers
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

from core.permissions import IsAdmin
from core.exceptions import AppError
from .models import TeamMember


class TeamMemberSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = ['id', 'full_name', 'designation', 'photo_url', 'display_order']


class TeamMemberListView(APIView):
    """GET /api/team/ — Public listing of active club members."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        members = TeamMember.objects.filter(is_active=True)
        serializer = TeamMemberSerializer(members, many=True)
        return Response({"count": len(serializer.data), "results": serializer.data})


class TeamMemberPhotoView(APIView):
    """POST /api/team/{id}/photo/ — Admin only: upload member photo."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        member = get_object_or_404(TeamMember, pk=pk)
        file = request.FILES.get('photo')
        if not file:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "No file provided.", "fields": {"photo": "This field is required."}}},
                status=status.HTTP_400_BAD_REQUEST
            )

        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if file.content_type not in allowed_types:
            return Response(
                {"error": {"code": "INVALID_FILE", "message": "File must be jpg, png, or webp and under 5MB.", "fields": {}}},
                status=status.HTTP_400_BAD_REQUEST
            )
        if file.size > 5 * 1024 * 1024:
            return Response(
                {"error": {"code": "INVALID_FILE", "message": "File must be jpg, png, or webp and under 5MB.", "fields": {}}},
                status=status.HTTP_400_BAD_REQUEST
            )

        ext = file.name.split('.')[-1].lower()
        file_name = f"team-photos/{member.id}/photo.{ext}"
        path = default_storage.save(file_name, ContentFile(file.read()))
        url = default_storage.url(path)

        member.photo_url = url
        member.save(update_fields=['photo_url'])
        return Response({"photo_url": url})
