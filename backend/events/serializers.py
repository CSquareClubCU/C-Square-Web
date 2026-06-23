from rest_framework import serializers
from .models import Event, VolunteerAssignment


class EventListSerializer(serializers.ModelSerializer):
    """Compact serializer for listing events publicly."""
    registered_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'start_datetime', 'end_datetime',
            'venue', 'capacity', 'status', 'is_team_event',
            'is_open_to_external', 'banner_image_url',
            'registration_deadline', 'registered_count'
        ]


class EventDetailSerializer(serializers.ModelSerializer):
    """Full serializer for a single event detail view."""
    registered_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type',
            'start_datetime', 'end_datetime', 'venue', 'capacity',
            'status', 'is_team_event', 'min_team_size', 'max_team_size',
            'is_open_to_external', 'banner_image_url',
            'registration_deadline', 'registered_count', 'created_at'
        ]


class EventWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating events (Admin only)."""

    class Meta:
        model = Event
        fields = [
            'title', 'description', 'event_type',
            'start_datetime', 'end_datetime', 'venue', 'capacity',
            'registration_deadline', 'is_open_to_external', 'is_team_event',
            'min_team_size', 'max_team_size', 'status'
        ]

    def validate(self, data):
        is_team_event = data.get('is_team_event', False)
        min_size = data.get('min_team_size')
        max_size = data.get('max_team_size')

        if is_team_event:
            if not min_size or not max_size:
                raise serializers.ValidationError({
                    'min_team_size': 'min_team_size and max_team_size are required for team events.'
                })
            if min_size < 2:
                raise serializers.ValidationError({
                    'min_team_size': 'Minimum team size must be at least 2.'
                })
            if max_size < min_size:
                raise serializers.ValidationError({
                    'max_team_size': 'max_team_size must be greater than or equal to min_team_size.'
                })

        start = data.get('start_datetime')
        end = data.get('end_datetime')
        if start and end and end <= start:
            raise serializers.ValidationError({
                'end_datetime': 'end_datetime must be after start_datetime.'
            })

        return data


class VolunteerUserSerializer(serializers.Serializer):
    """Nested user detail for volunteer assignment responses."""
    id = serializers.UUIDField()
    full_name = serializers.CharField()
    email = serializers.EmailField()


class VolunteerAssignmentSerializer(serializers.ModelSerializer):
    user = VolunteerUserSerializer(source='volunteer', read_only=True)
    assignment_id = serializers.UUIDField(source='id', read_only=True)

    class Meta:
        model = VolunteerAssignment
        fields = ['assignment_id', 'user', 'assigned_by', 'created_at']
