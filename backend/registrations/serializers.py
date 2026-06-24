"""
Registrations app serializers.
Validation only. Business logic lives in services.py.
"""

from rest_framework import serializers

from events.models import EventStatus
from registrations.models import Registration, RegistrationStatus, Team, TeamMember


# ---------------------------------------------------------------------------
# Individual Registrations
# ---------------------------------------------------------------------------

class RegistrationSerializer(serializers.ModelSerializer):
    """
    Full representation of a registration.
    """
    event_title = serializers.CharField(source='event.title', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_student_uid = serializers.CharField(source='user.student_uid', read_only=True)

    class Meta:
        model = Registration
        fields = [
            'id',
            'event',
            'event_title',
            'user',
            'user_email',
            'user_full_name',
            'user_student_uid',
            'status',
            'qr_image_url',
            'rejection_reason',
            'waitlist_position',
            'is_team_registration',
            'team',
            'registered_at',
            'approved_at',
        ]
        read_only_fields = fields


class RegistrationCreateSerializer(serializers.Serializer):
    """
    Validates individual registration requests.
    """
    event_id = serializers.UUIDField()


# ---------------------------------------------------------------------------
# Team Registrations
# ---------------------------------------------------------------------------

class TeamMemberCreateSerializer(serializers.Serializer):
    """
    Validates a teammate email input during team creation.
    """
    email = serializers.EmailField()


class TeamCreateSerializer(serializers.Serializer):
    """
    Validates team registration requests.
    """
    event_id = serializers.UUIDField()
    team_name = serializers.CharField(max_length=255)
    members = TeamMemberCreateSerializer(many=True)

    def validate_members(self, members):
        """Ensure no duplicate emails in the input list."""
        emails = [m['email'].lower() for m in members]
        if len(emails) != len(set(emails)):
            raise serializers.ValidationError('Duplicate emails found in members list.')
        return members


class TeamMemberSerializer(serializers.ModelSerializer):
    """
    Representation of a team member.
    """
    class Meta:
        model = TeamMember
        fields = [
            'id',
            'email',
            'has_confirmed',
            'confirmed_at',
            'user',
        ]
        read_only_fields = fields


class TeamSerializer(serializers.ModelSerializer):
    """
    Full representation of a team.
    """
    event_title = serializers.CharField(source='event.title', read_only=True)
    leader_email = serializers.CharField(source='leader.email', read_only=True)
    leader_full_name = serializers.CharField(source='leader.full_name', read_only=True)
    members = TeamMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = [
            'id',
            'event',
            'event_title',
            'name',
            'leader',
            'leader_email',
            'leader_full_name',
            'status',
            'members',
            'created_at',
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Admin Actions
# ---------------------------------------------------------------------------

class RegistrationRejectSerializer(serializers.Serializer):
    """
    Validates rejection reason for POST /registrations/{id}/reject/
    """
    reason = serializers.CharField(required=True)
