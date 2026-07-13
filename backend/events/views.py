"""
Events app views.

HTTP handling only — all logic delegated to events/services.py.

Public endpoints (no auth):
- GET  /api/events/          EventListView
- GET  /api/events/{slug}/   EventDetailView

Admin-only endpoints:
- POST   /api/events/                         EventListView
- PATCH  /api/events/{slug}/                 EventDetailView
- DELETE /api/events/{slug}/                 EventDetailView
- POST   /api/events/{id}/banner/            EventBannerView
- GET    /api/events/{id}/volunteers/        EventVolunteersView
- POST   /api/events/{id}/volunteers/        EventVolunteersView
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
    PastEventSerializer,
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

        # Status filter — only allow admins to filter by status, default to PUBLISHED otherwise
        is_admin = (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'admin'
        )
        if is_admin:
            status_param = request.query_params.get('status', None)
        else:
            status_param = EventStatus.PUBLISHED

        if status_param:
            qs = qs.filter(status=status_param)
        elif not is_admin:
            qs = qs.filter(status=EventStatus.PUBLISHED)

        # Event type filter
        event_type = request.query_params.get('event_type')
        if event_type:
            qs = qs.filter(event_type=event_type)

        # Upcoming filter — only future events
        if request.query_params.get('upcoming') == 'true':
            from django.utils import timezone
            qs = qs.filter(start_datetime__gte=timezone.now())

        # Assigned only filter (for volunteers checking their events)
        if request.query_params.get('assigned_only') == 'true' and request.user.is_authenticated:
            assigned_event_ids = VolunteerAssignment.objects.filter(
                volunteer=request.user
            ).values_list('event_id', flat=True)
            qs = qs.filter(id__in=assigned_event_ids)

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
# Public + Admin — Event detail, update, delete (by slug)
# ---------------------------------------------------------------------------

class EventDetailView(APIView):
    """
    GET    /api/events/{slug}/ — Public: get published event details
    PATCH  /api/events/{slug}/ — Admin: update event
    DELETE /api/events/{slug}/ — Admin: delete draft event
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

    def get(self, request, slug):
        is_admin = (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'admin'
        )
        if is_admin:
            event = services.get_event_or_404(slug)
        else:
            event = services.get_event_for_public(slug)
        return Response(EventDetailSerializer(event).data)

    def patch(self, request, slug):
        event = services.get_event_or_404(slug)
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

    def delete(self, request, slug):
        event = services.get_event_or_404(slug)
        services.delete_event(event)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Admin — Banner upload (by UUID for stability)
# ---------------------------------------------------------------------------

class EventBannerView(APIView):
    """
    POST /api/events/{id}/banner/
    Upload or replace the event banner image. Admin only.
    """
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        event = services.get_event_by_uuid(pk)

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
# Admin — Volunteer assignment (by UUID for stability)
# ---------------------------------------------------------------------------

class EventVolunteersView(APIView):
    """
    GET  /api/events/{id}/volunteers/ — List assigned volunteers. Admin only.
    POST /api/events/{id}/volunteers/ — Assign a volunteer. Admin only.
    """
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        event = services.get_event_by_uuid(pk)
        assignments = VolunteerAssignment.objects.filter(event=event).select_related(
            'volunteer', 'assigned_by'
        )
        serializer = VolunteerAssignmentSerializer(assignments, many=True)
        return Response({
            'event_id': str(event.id),
            'volunteers': serializer.data,
        })

    def post(self, request, pk):
        event = services.get_event_by_uuid(pk)

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
        event = services.get_event_by_uuid(pk)
        services.remove_volunteer(event, assignment_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Admin + Volunteer — Live check-in stats (by UUID for stability)
# ---------------------------------------------------------------------------

class EventCheckinStatsView(APIView):
    """
    GET /api/events/{id}/checkin-stats/
    Live check-in statistics. Admin always allowed; volunteer only if assigned.
    """
    permission_classes = [IsAdminOrVolunteer]

    def get(self, request, pk):
        event = services.get_event_by_uuid(pk)
        stats = services.get_checkin_stats(event, request.user)
        return Response(stats)


# ---------------------------------------------------------------------------
# Past Events Gallery
# ---------------------------------------------------------------------------

class PastEventListView(APIView):
    """
    GET /api/events/past/ — List all past events (public).
    POST /api/events/past/ — Create a new past event (Admin only).
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

    def get(self, request):
        from events.models import PastEvent
        events = PastEvent.objects.all()
        serializer = PastEventSerializer(events, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PastEventSerializer(data=request.data)
        if not serializer.is_valid():
            raise AppError('VALIDATION_ERROR', 'Invalid data', fields=serializer.errors)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PastEventDetailView(APIView):
    """
    PUT /api/events/past/{id}/ — Update past event (Admin only).
    DELETE /api/events/past/{id}/ — Delete past event (Admin only).
    """
    permission_classes = [IsAdmin]

    def put(self, request, pk):
        from events.models import PastEvent
        try:
            event = PastEvent.objects.get(id=pk)
        except PastEvent.DoesNotExist:
            raise AppError('NOT_FOUND', 'Past Event not found', status=404)
            
        serializer = PastEventSerializer(event, data=request.data, partial=True)
        if not serializer.is_valid():
            raise AppError('VALIDATION_ERROR', 'Invalid data', fields=serializer.errors)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        from events.models import PastEvent
        try:
            event = PastEvent.objects.get(id=pk)
        except PastEvent.DoesNotExist:
            raise AppError('NOT_FOUND', 'Past Event not found', status=404)
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PastEventLogoUploadView(APIView):
    """
    POST /api/events/past/{id}/logo/ — Upload a logo for a past event (Admin only).
    """
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        from events.models import PastEvent
        from core.storage import save_uploaded_file
        try:
            event = PastEvent.objects.get(id=pk)
        except PastEvent.DoesNotExist:
            raise AppError('NOT_FOUND', 'Past Event not found', status=404)

        if 'logo' not in request.FILES:
            raise AppError('VALIDATION_ERROR', 'No logo file provided.')

        file_obj = request.FILES['logo']
        # Simple local save
        file_url = save_uploaded_file(file_obj, 'past_events')
        event.logo_url = file_url
        event.save()
        return Response({'logo_url': file_url}, status=status.HTTP_200_OK)
