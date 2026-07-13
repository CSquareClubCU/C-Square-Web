"""
Team app serializers.
"""

from rest_framework import serializers
from team.models import TeamMember


class TeamMemberSerializer(serializers.ModelSerializer):
    """Public representation of a team member."""
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = TeamMember
        fields = ['id', 'full_name', 'designation', 'photo_url', 'display_order', 'is_active', 'user', 'user_email', 'github_url', 'linkedin_url', 'twitter_url']
        read_only_fields = fields


class TeamMemberCreateUpdateSerializer(serializers.ModelSerializer):
    """Validates create/update requests for team members."""
    user_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = TeamMember
        fields = ['full_name', 'designation', 'photo_url', 'display_order', 'is_active', 'user_id', 'github_url', 'linkedin_url', 'twitter_url']


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
