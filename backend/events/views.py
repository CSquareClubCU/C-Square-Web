from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.utils import timezone

from core.permissions import IsAdmin, IsAdminOrVolunteer
from core.exceptions import AppError
from .models import Event, VolunteerAssignment, EventStatus
from .serializers import (
    EventListSerializer,
    EventDetailSerializer,
    EventWriteSerializer,
    VolunteerAssignmentSerializer,
)
from . import services


class EventListView(APIView):
    """
    GET  /api/events/  — Public listing of published events
    POST /api/events/  — Admin only: create a new event
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [permissions.AllowAny()]

    def get(self, request):
        queryset = Event.objects.all()

        # Filtering
        status_filter = request.query_params.get('status', 'published')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        event_type = request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)

        upcoming = request.query_params.get('upcoming')
        if upcoming == 'true':
            queryset = queryset.filter(start_datetime__gte=timezone.now())

        # Pagination via DRF default paginator
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(queryset, request)
        serializer = EventListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = EventWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Invalid input.", "fields": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            event = services.create_event(serializer.validated_data, created_by=request.user)
        except AppError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message, "fields": e.fields}},
                status=e.http_status
            )
        return Response(EventDetailSerializer(event).data, status=status.HTTP_201_CREATED)


class EventDetailView(APIView):
    """
    GET    /api/events/{id}/  — Public: full event detail
    PATCH  /api/events/{id}/  — Admin only: partial update
    DELETE /api/events/{id}/  — Admin only: delete if draft
    """
    def get_permissions(self):
        if self.request.method in ('PATCH', 'DELETE'):
            return [IsAdmin()]
        return [permissions.AllowAny()]

    def _get_event(self, pk, public=False):
        if public:
            return get_object_or_404(Event, pk=pk, status=EventStatus.PUBLISHED)
        return get_object_or_404(Event, pk=pk)

    def get(self, request, pk):
        event = get_object_or_404(Event, pk=pk, status=EventStatus.PUBLISHED)
        serializer = EventDetailSerializer(event)
        return Response(serializer.data)

    def patch(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        serializer = EventWriteSerializer(event, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Invalid input.", "fields": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            event = services.update_event(event, serializer.validated_data)
        except AppError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message, "fields": e.fields}},
                status=e.http_status
            )
        return Response(EventDetailSerializer(event).data)

    def delete(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        try:
            services.delete_event(event)
        except AppError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message, "fields": e.fields}},
                status=e.http_status
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventBannerView(APIView):
    """POST /api/events/{id}/banner/ — Admin only: upload banner image."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        file = request.FILES.get('banner')
        if not file:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "No file provided.", "fields": {"banner": "This field is required."}}},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            url = services.upload_event_banner(event, file)
        except AppError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message, "fields": e.fields}},
                status=e.http_status
            )
        return Response({"banner_image_url": url})


class EventVolunteerView(APIView):
    """
    GET  /api/events/{id}/volunteers/  — Admin only: list volunteers
    POST /api/events/{id}/volunteers/  — Admin only: assign a volunteer
    """
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        assignments = event.volunteer_assignments.select_related('volunteer', 'assigned_by')
        serializer = VolunteerAssignmentSerializer(assignments, many=True)
        return Response({"event_id": str(event.id), "volunteers": serializer.data})

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "user_id is required.", "fields": {"user_id": "This field is required."}}},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            assignment = services.assign_volunteer(event, user_id, assigned_by=request.user)
        except AppError as e:
            http_status = 409 if e.code == 'ALREADY_ASSIGNED' else e.http_status
            return Response(
                {"error": {"code": e.code, "message": e.message, "fields": e.fields}},
                status=http_status
            )
        return Response(
            {
                "assignment_id": str(assignment.id),
                "event_id": str(event.id),
                "volunteer": {
                    "id": str(assignment.volunteer.id),
                    "full_name": assignment.volunteer.full_name,
                    "email": assignment.volunteer.email,
                }
            },
            status=status.HTTP_201_CREATED
        )


class EventVolunteerDetailView(APIView):
    """DELETE /api/events/{id}/volunteers/{assignment_id}/ — Admin only."""
    permission_classes = [IsAdmin]

    def delete(self, request, pk, assignment_id):
        assignment = get_object_or_404(VolunteerAssignment, pk=assignment_id, event_id=pk)
        services.remove_volunteer(assignment)
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventCheckinStatsView(APIView):
    """GET /api/events/{id}/checkin-stats/ — Admin or assigned Volunteer."""
    permission_classes = [IsAdminOrVolunteer]

    def get(self, request, pk):
        event = get_object_or_404(Event, pk=pk)

        # Volunteers can only check events they are assigned to
        if request.user.role == 'volunteer':
            if not VolunteerAssignment.objects.filter(event=event, volunteer=request.user).exists():
                return Response(
                    {"error": {"code": "FORBIDDEN", "message": "You are not assigned to this event.", "fields": {}}},
                    status=status.HTTP_403_FORBIDDEN
                )

        stats = services.get_checkin_stats(event)
        return Response(stats)
