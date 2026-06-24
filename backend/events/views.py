"""
Events app views.

HTTP handling only — all logic delegated to events/services.py.

Public endpoints (no auth):
- GET  /api/events/          EventListView
- GET  /api/events/{id}/     EventDetailView

Admin-only endpoints:
- POST   /api/events/                     EventListView
- PATCH  /api/events/{id}/               EventDetailView
- DELETE /api/events/{id}/               EventDetailView
- POST   /api/events/{id}/banner/        EventBannerView
- GET    /api/events/{id}/volunteers/    EventVolunteersView
- POST   /api/events/{id}/volunteers/    EventVolunteersView
- DELETE /api/events/{id}/volunteers/{assignment_id}/  EventVolunteerDetailView

Admin + Volunteer:
- GET /api/events/{id}/checkin-stats/    EventCheckinStatsView
"""

import logging

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.exceptions import AppError
from core.pagination import StandardPagination
from core.permissions import IsAdmin, IsAdminOrVolunteer
from events import services
from events.models import Event, EventStatus, VolunteerAssignment
from events.serializers import (
    AssignVolunteerSerializer,
    EventBannerSerializer,
    EventCreateUpdateSerializer,
    EventDetailSerializer,
    EventListSerializer,
    VolunteerAssignmentSerializer,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public + Admin — Event list and create
# ---------------------------------------------------------------------------

class EventListView(APIView):
    """
    GET  /api/events/  — Public: list published events
    POST /api/events/  — Admin: create a new event
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

    def get(self, request):
        """
        List events. Publicly returns only published by default.
        Supports ?status=, ?event_type=, ?upcoming= query params.
        """
        qs = Event.objects.all()

        # Status filter — default to published for public listing
        status_param = request.query_params.get('status', EventStatus.PUBLISHED)
        if status_param:
            qs = qs.filter(status=status_param)

        # Event type filter
        event_type = request.query_params.get('event_type')
        if event_type:
            qs = qs.filter(event_type=event_type)

        # Upcoming filter — only future events
        if request.query_params.get('upcoming') == 'true':
            from django.utils import timezone
            qs = qs.filter(start_datetime__gte=timezone.now())

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = EventListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        """Create a new event. Admin only."""
        serializer = EventCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            raise AppError(
                code='VALIDATION_ERROR',
                message='Invalid input.',
                fields=serializer.errors,
            )
        event = services.create_event(
            validated_data=serializer.validated_data,
            created_by=request.user,
        )
        return Response(
            EventDetailSerializer(event).data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Public + Admin — Event detail, update, delete
# ---------------------------------------------------------------------------

class EventDetailView(APIView):
    """
    GET    /api/events/{id}/ — Public: get published event details
    PATCH  /api/events/{id}/ — Admin: update event
    DELETE /api/events/{id}/ — Admin: delete draft event
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

    def _get_event_public(self, pk):
        """For public GET — only published events."""
        return services.get_event_for_public(pk)

    def _get_event_admin(self, pk):
        """For admin PATCH/DELETE — any event."""
        return services.get_event_or_404(pk)

    def get(self, request, pk):
        event = self._get_event_public(pk)
        return Response(EventDetailSerializer(event).data)

    def patch(self, request, pk):
        event = self._get_event_admin(pk)
        serializer = EventCreateUpdateSerializer(
            event,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            raise AppError(
                code='VALIDATION_ERROR',
                message='Invalid input.',
                fields=serializer.errors,
            )
        updated = services.update_event(event, serializer.validated_data)
        return Response(EventDetailSerializer(updated).data)

    def delete(self, request, pk):
        event = self._get_event_admin(pk)
        services.delete_event(event)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Admin — Banner upload
# ---------------------------------------------------------------------------

class EventBannerView(APIView):
    """
    POST /api/events/{id}/banner/
    Upload or replace the event banner image. Admin only.
    """
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        event = services.get_event_or_404(pk)

        serializer = EventBannerSerializer(data=request.data)
        if not serializer.is_valid():
            raise AppError(
                code='INVALID_FILE',
                message='File must be jpg, png, or webp and under 5MB.',
                fields=serializer.errors,
            )

        updated = services.upload_event_banner(event, serializer.validated_data['banner'])
        return Response(
            {'banner_image_url': updated.banner_image_url},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Admin — Volunteer assignment
# ---------------------------------------------------------------------------

class EventVolunteersView(APIView):
    """
    GET  /api/events/{id}/volunteers/ — List assigned volunteers. Admin only.
    POST /api/events/{id}/volunteers/ — Assign a volunteer. Admin only.
    """
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        event = services.get_event_or_404(pk)
        assignments = VolunteerAssignment.objects.filter(event=event).select_related(
            'volunteer', 'assigned_by'
        )
        serializer = VolunteerAssignmentSerializer(assignments, many=True)
        return Response({
            'event_id': str(event.id),
            'volunteers': serializer.data,
        })

    def post(self, request, pk):
        event = services.get_event_or_404(pk)

        serializer = AssignVolunteerSerializer(data=request.data)
        if not serializer.is_valid():
            raise AppError(
                code='VALIDATION_ERROR',
                message='Invalid input.',
                fields=serializer.errors,
            )

        assignment = services.assign_volunteer(
            event=event,
            user_id=serializer.validated_data['user_id'],
            assigned_by=request.user,
        )

        return Response(
            {
                'assignment_id': str(assignment.id),
                'event_id': str(event.id),
                'volunteer': {
                    'id': str(assignment.volunteer.id),
                    'full_name': assignment.volunteer.full_name,
                    'email': assignment.volunteer.email,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class EventVolunteerDetailView(APIView):
    """
    DELETE /api/events/{id}/volunteers/{assignment_id}/
    Remove a volunteer from an event. Admin only.
    """
    permission_classes = [IsAdmin]

    def delete(self, request, pk, assignment_id):
        event = services.get_event_or_404(pk)
        services.remove_volunteer(event, assignment_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Admin + Volunteer — Live check-in stats
# ---------------------------------------------------------------------------

class EventCheckinStatsView(APIView):
    """
    GET /api/events/{id}/checkin-stats/
    Live check-in statistics. Admin always allowed; volunteer only if assigned.
    """
    permission_classes = [IsAdminOrVolunteer]

    def get(self, request, pk):
        event = services.get_event_or_404(pk)
        stats = services.get_checkin_stats(event, request.user)
        return Response(stats)
