from rest_framework import serializers
from .models import Registration, Team, TeamMember


class RegistrationCreateSerializer(serializers.Serializer):
    """Validate input for creating an individual registration."""
    event_id = serializers.UUIDField()
    full_name = serializers.CharField(max_length=255, required=False)
    student_uid = serializers.CharField(max_length=20, required=False)
    branch = serializers.CharField(max_length=100, required=False)
    year = serializers.IntegerField(min_value=1, max_value=5, required=False)
    semester = serializers.IntegerField(min_value=1, max_value=10, required=False)
    batch = serializers.CharField(max_length=20, required=False)
    phone = serializers.CharField(max_length=15, required=False)


class TeamMemberInputSerializer(serializers.Serializer):
    """Single teammate email in team registration input."""
    email = serializers.EmailField()


class LeaderDetailsSerializer(serializers.Serializer):
    """Leader's profile details for team registration."""
    full_name = serializers.CharField(max_length=255, required=False)
    student_uid = serializers.CharField(max_length=20, required=False)
    branch = serializers.CharField(max_length=100, required=False)
    year = serializers.IntegerField(min_value=1, max_value=5, required=False)
    semester = serializers.IntegerField(min_value=1, max_value=10, required=False)
    batch = serializers.CharField(max_length=20, required=False)
    phone = serializers.CharField(max_length=15, required=False)


class TeamRegistrationCreateSerializer(serializers.Serializer):
    """Validate input for creating a team registration."""
    event_id = serializers.UUIDField()
    team_name = serializers.CharField(max_length=255)
    leader_details = LeaderDetailsSerializer(required=False)
    teammates = TeamMemberInputSerializer(many=True)


class RegistrationListSerializer(serializers.ModelSerializer):
    """Compact registration with nested event summary for /registrations/me/."""
    event = serializers.SerializerMethodField()

    class Meta:
        model = Registration
        fields = [
            'id', 'event', 'status', 'qr_image_url',
            'registered_at', 'approved_at', 'waitlist_position'
        ]

    def get_event(self, obj):
        return {
            'id': str(obj.event.id),
            'title': obj.event.title,
            'start_datetime': obj.event.start_datetime,
            'venue': obj.event.venue,
        }


class RegistrationDetailSerializer(serializers.ModelSerializer):
    """Full registration detail."""
    event = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = Registration
        fields = [
            'id', 'event', 'user', 'status', 'qr_token', 'qr_image_url',
            'rejection_reason', 'waitlist_position', 'is_team_registration',
            'registered_at', 'approved_at', 'created_at'
        ]

    def get_event(self, obj):
        return {
            'id': str(obj.event.id),
            'title': obj.event.title,
            'start_datetime': obj.event.start_datetime,
            'venue': obj.event.venue,
        }

    def get_user(self, obj):
        return {
            'id': str(obj.user.id),
            'email': obj.user.email,
            'full_name': obj.user.full_name,
        }


class ApproveRejectSerializer(serializers.Serializer):
    """Payload for rejection (reason is required for rejection)."""
    reason = serializers.CharField(required=False, allow_blank=True)


class TeamMemberOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = ['email', 'has_confirmed']
