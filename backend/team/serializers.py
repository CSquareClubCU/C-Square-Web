"""
Team app serializers.
"""

from rest_framework import serializers
from team.models import TeamMember


class TeamMemberSerializer(serializers.ModelSerializer):
    """Public representation of a team member."""
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = TeamMember
        fields = ['id', 'full_name', 'designation', 'category', 'photo_url', 'display_order', 'is_active', 'github_url', 'linkedin_url']
        read_only_fields = fields

    def get_photo_url(self, obj):
        if obj.photo_url:
            return f"{obj.photo_url}?t={int(obj.updated_at.timestamp())}"
        return None


class TeamMemberAdminSerializer(serializers.ModelSerializer):
    """Admin representation of a team member, including user linkage."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = TeamMember
        fields = ['id', 'full_name', 'designation', 'category', 'photo_url', 'display_order', 'is_active', 'github_url', 'linkedin_url', 'user', 'user_email']
        read_only_fields = fields

    def get_photo_url(self, obj):
        if obj.photo_url:
            return f"{obj.photo_url}?t={int(obj.updated_at.timestamp())}"
        return None


class TeamMemberCreateUpdateSerializer(serializers.ModelSerializer):
    """Validates create/update requests for team members."""
    user_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = TeamMember
        fields = ['full_name', 'designation', 'category', 'photo_url', 'display_order', 'is_active', 'user_id', 'github_url', 'linkedin_url']

    def validate_user_id(self, value):
        if value:
            from users.models import User
            if not User.objects.filter(id=value).exists():
                raise serializers.ValidationError("User not found.")
        return value


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
