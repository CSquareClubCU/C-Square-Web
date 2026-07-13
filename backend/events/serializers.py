"""
Events app serializers.

Rules: validate and transform only — no business logic.
Business logic lives in events/services.py.
"""

from rest_framework import serializers

from events.models import Event, EventStatus, EventType, VolunteerAssignment, PastEvent
from users.serializers import UserSerializer


class EventListSerializer(serializers.ModelSerializer):
    """
    Compact event representation for GET /events/ list.
    No description — reduces payload size on listing pages.
    registered_count is computed from approved registrations.
    """
    registered_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id',
            'slug',
            'title',
            'event_type',
            'start_datetime',
            'end_datetime',
            'venue',
            'capacity',
            'status',
            'is_team_event',
            'is_open_to_external',
            'is_flagship',
            'points',
            'banner_image_url',
            'registration_deadline',
            'registered_count',
            'prizes',
            'rules',
            'contact_name',
            'contact_email',
            'is_registration_open',
        ]
        read_only_fields = fields

    def get_registered_count(self, obj):
        """
        Count approved registrations for this event.
        Uses the reverse FK from registrations app (wired up in Step 5).
        Returns 0 gracefully if the relation doesn't exist yet.
        """
        try:
            return obj.registrations.filter(status='approved').count()
        except Exception:
            return 0


class EventDetailSerializer(serializers.ModelSerializer):
    """
    Full event details for GET /events/{id}/.
    Includes description (rich text HTML).
    """
    registered_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id',
            'slug',
            'title',
            'description',
            'event_type',
            'start_datetime',
            'end_datetime',
            'venue',
            'capacity',
            'status',
            'is_team_event',
            'min_team_size',
            'max_team_size',
            'is_open_to_external',
            'is_flagship',
            'points',
            'banner_image_url',
            'registration_deadline',
            'registered_count',
            'prizes',
            'rules',
            'contact_name',
            'contact_email',
            'is_registration_open',
            'created_at',
        ]
        read_only_fields = fields

    def get_registered_count(self, obj):
        try:
            return obj.registrations.filter(status='approved').count()
        except Exception:
            return 0


class EventCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Validates event creation and update requests.
    Used by POST /events/ and PATCH /events/{id}/.
    """

    class Meta:
        model = Event
        fields = [
            'title',
            'description',
            'event_type',
            'start_datetime',
            'end_datetime',
            'venue',
            'capacity',
            'registration_deadline',
            'is_open_to_external',
            'is_team_event',
            'min_team_size',
            'max_team_size',
            'is_flagship',
            'points',
            'status',
            'prizes',
            'rules',
            'contact_name',
            'contact_email',
            'is_registration_open',
        ]

    def validate(self, data):
        # end_datetime must be after start_datetime
        start = data.get('start_datetime') or getattr(self.instance, 'start_datetime', None)
        end = data.get('end_datetime') or getattr(self.instance, 'end_datetime', None)
        if start and end and end <= start:
            raise serializers.ValidationError({
                'end_datetime': 'End datetime must be after start datetime.'
            })

        # registration_deadline must be before start_datetime
        deadline = data.get('registration_deadline') or getattr(
            self.instance, 'registration_deadline', None
        )
        if start and deadline and deadline >= start:
            raise serializers.ValidationError({
                'registration_deadline': 'Registration deadline must be before the event start.'
            })

        # Team size fields required if is_team_event=True
        is_team = data['is_team_event'] if 'is_team_event' in data else getattr(self.instance, 'is_team_event', False)
        min_size = data['min_team_size'] if 'min_team_size' in data else getattr(self.instance, 'min_team_size', None)
        max_size = data['max_team_size'] if 'max_team_size' in data else getattr(self.instance, 'max_team_size', None)

        if is_team:
            if min_size is None:
                raise serializers.ValidationError({
                    'min_team_size': 'Required when is_team_event is True.'
                })
            if max_size is None:
                raise serializers.ValidationError({
                    'max_team_size': 'Required when is_team_event is True.'
                })
            if min_size < 2:
                raise serializers.ValidationError({
                    'min_team_size': 'Minimum team size must be at least 2.'
                })
            if max_size < min_size:
                raise serializers.ValidationError({
                    'max_team_size': 'Max team size must be >= min team size.'
                })

        return data


class EventBannerSerializer(serializers.Serializer):
    """Validates banner image upload — type and size only."""
    banner = serializers.ImageField()

    def validate_banner(self, file):
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        content_type = getattr(file, 'content_type', '')
        if content_type not in allowed_types:
            raise serializers.ValidationError(
                'File must be jpg, png, or webp.'
            )
        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024
        if file.size > max_size:
            raise serializers.ValidationError(
                'File size must be under 5MB.'
            )
        return file


class VolunteerUserSerializer(serializers.Serializer):
    """Compact user info embedded in volunteer assignment responses."""
    id = serializers.UUIDField()
    full_name = serializers.CharField()
    email = serializers.EmailField()


class VolunteerAssignmentSerializer(serializers.ModelSerializer):
    """
    Full volunteer assignment — used in GET /events/{id}/volunteers/ response.
    """
    user = serializers.SerializerMethodField()

    class Meta:
        model = VolunteerAssignment
        fields = ['id', 'user', 'assigned_by', 'created_at']

    def get_user(self, obj):
        return {
            'id': str(obj.volunteer.id),
            'full_name': obj.volunteer.full_name,
            'email': obj.volunteer.email,
        }


class AssignVolunteerSerializer(serializers.Serializer):
    """Validates POST /events/{id}/volunteers/ — just a user_id."""
    user_id = serializers.UUIDField()


class PastEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = PastEvent
        fields = ['id', 'title', 'logo_url', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
