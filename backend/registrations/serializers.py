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

class EventSummarySerializer(serializers.Serializer):
    """
    Compact event representation nested inside a registration.
    Used by RegistrationMyListSerializer and RegistrationDetailSerializer.
    """
    id = serializers.UUIDField(read_only=True)
    slug = serializers.SlugField(read_only=True)
    title = serializers.CharField(read_only=True)
    event_type = serializers.CharField(read_only=True)
    start_datetime = serializers.DateTimeField(read_only=True)
    end_datetime = serializers.DateTimeField(read_only=True)
    venue = serializers.CharField(read_only=True)


class RegistrationMyListSerializer(serializers.ModelSerializer):
    """
    Compact registration for GET /registrations/me/ — student's own list.
    Nests the full event summary inline.
    """
    event = EventSummarySerializer(read_only=True)

    class Meta:
        model = Registration
        fields = [
            'id',
            'event',
            'status',
            'qr_token',
            'qr_image_url',
            'waitlist_position',
            'is_team_registration',
            'team',
            'registered_at',
            'approved_at',
        ]
        read_only_fields = fields


class RegistrationDetailSerializer(serializers.ModelSerializer):
    """
    Full registration detail — for GET /registrations/{id}/.
    Visible to owner, admin, or assigned volunteer.
    """
    event = EventSummarySerializer(read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_student_uid = serializers.CharField(source='user.student_uid', read_only=True)

    class Meta:
        model = Registration
        fields = [
            'id',
            'event',
            'user_email',
            'user_full_name',
            'user_student_uid',
            'status',
            'qr_token',
            'qr_image_url',
            'rejection_reason',
            'waitlist_position',
            'is_team_registration',
            'team',
            'registered_at',
            'approved_at',
        ]
        read_only_fields = fields


class RegistrationAdminListSerializer(serializers.ModelSerializer):
    """
    Full registration representation for admin views.
    GET /registrations/event/{event_id}/ — paginated, with user and event data.
    """
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_type = serializers.CharField(source='event.event_type', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_student_uid = serializers.CharField(source='user.student_uid', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)

    class Meta:
        model = Registration
        fields = [
            'id',
            'event',
            'event_title',
            'event_type',
            'user',
            'user_email',
            'user_full_name',
            'user_student_uid',
            'user_phone',
            'status',
            'qr_token',
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
