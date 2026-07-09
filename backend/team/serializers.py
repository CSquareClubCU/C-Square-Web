"""
Team app serializers.
"""

from rest_framework import serializers
from team.models import TeamMember


class TeamMemberSerializer(serializers.ModelSerializer):
    """Public representation of a team member."""

    class Meta:
        model = TeamMember
        fields = ['id', 'full_name', 'designation', 'photo_url', 'display_order', 'is_active']
        read_only_fields = fields


class TeamMemberCreateUpdateSerializer(serializers.ModelSerializer):
    """Validates create/update requests for team members."""

    class Meta:
        model = TeamMember
        fields = ['full_name', 'designation', 'photo_url', 'display_order', 'is_active']


class TeamPhotoSerializer(serializers.Serializer):
    """Validates photo upload — type and size."""
    photo = serializers.ImageField()

    def validate_photo(self, file):
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if getattr(file, 'content_type', '') not in allowed_types:
            raise serializers.ValidationError('File must be jpg, png, or webp.')
        if file.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('File size must be under 5MB.')
        return file
