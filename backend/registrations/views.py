from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404

from core.permissions import IsAdmin, IsAdminOrVolunteer
from core.exceptions import AppError
from .models import Registration, RegistrationStatus, Team
from .serializers import (
    RegistrationCreateSerializer,
    TeamRegistrationCreateSerializer,
    RegistrationListSerializer,
    RegistrationDetailSerializer,
    ApproveRejectSerializer,
    TeamMemberOutputSerializer,
)
from . import services


class RegistrationCreateView(APIView):
    """POST /api/registrations/ — Individual registration."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RegistrationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Invalid input.", "fields": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            registration = services.create_individual_registration(
                event_id=str(serializer.validated_data['event_id']),
                user=request.user,
                data=serializer.validated_data
            )
        except AppError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message, "fields": e.fields}},
                status=e.http_status
            )

        message = (
            'Registration submitted. You will be notified once reviewed.'
            if registration.status == RegistrationStatus.PENDING
            else f'Event is full. You are on the waitlist at position {registration.waitlist_position}.'
        )

        return Response({
            "id": str(registration.id),
            "event_id": str(registration.event.id),
            "status": registration.status,
            "registered_at": registration.registered_at,
            "message": message
        }, status=status.HTTP_201_CREATED)


class TeamRegistrationCreateView(APIView):
    """POST /api/registrations/team/ — Team registration."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TeamRegistrationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Invalid input.", "fields": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            team = services.create_team_registration(
                event_id=str(serializer.validated_data['event_id']),
                leader=request.user,
                data=serializer.validated_data
            )
        except AppError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message, "fields": e.fields}},
                status=e.http_status
            )

        members = team.members.all()
        return Response({
            "team_id": str(team.id),
            "team_name": team.name,
            "status": team.status,
            "message": "Team registration submitted. Invite emails sent to teammates.",
            "teammates": TeamMemberOutputSerializer(members, many=True).data
        }, status=status.HTTP_201_CREATED)


class TeamConfirmView(APIView):
    """GET /api/registrations/team/{team_id}/confirm/?token=<token>"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, team_id):
        token = request.query_params.get('token')
        if not token:
            return Response(
                {"error": {"code": "INVALID_TOKEN", "message": "Token is required.", "fields": {}}},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            member = services.confirm_team_membership(
                team_id=str(team_id),
                token=token,
                user=request.user
            )
        except AppError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message, "fields": e.fields}},
                status=e.http_status
            )

        return Response({
            "message": f"You have confirmed your participation in {member.team.name}.",
            "team_id": str(member.team.id),
            "team_name": member.team.name,
            "event": {
                "id": str(member.team.event.id),
                "title": member.team.event.title
            }
        })


class MyRegistrationsView(APIView):
    """GET /api/registrations/me/ — Current user's registrations."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = Registration.objects.filter(user=request.user).select_related('event')

        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        upcoming = request.query_params.get('upcoming')
        if upcoming == 'true':
            from django.utils import timezone
            queryset = queryset.filter(event__start_datetime__gte=timezone.now())

        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(queryset, request)
        serializer = RegistrationListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class RegistrationDetailView(APIView):
    """GET /api/registrations/{id}/ — Single registration detail."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        registration = get_object_or_404(
            Registration.objects.select_related('event', 'user'), pk=pk
        )
        # Owner, admin, or assigned volunteer can view
        is_owner = registration.user == request.user
        is_admin = request.user.role == 'admin'
        is_assigned_volunteer = (
            request.user.role == 'volunteer' and
            registration.event.volunteer_assignments.filter(volunteer=request.user).exists()
        )
        if not (is_owner or is_admin or is_assigned_volunteer):
            return Response(
                {"error": {"code": "FORBIDDEN", "message": "You do not have permission to view this registration.", "fields": {}}},
                status=status.HTTP_403_FORBIDDEN
            )
        return Response(RegistrationDetailSerializer(registration).data)


class RegistrationApproveView(APIView):
    """POST /api/registrations/{id}/approve/ — Admin only."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            registration = services.approve_registration(
                registration_id=str(pk),
                approved_by=request.user
            )
        except AppError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message, "fields": e.fields}},
                status=e.http_status
            )
        return Response(RegistrationDetailSerializer(registration).data)


class RegistrationRejectView(APIView):
    """POST /api/registrations/{id}/reject/ — Admin only."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        serializer = ApproveRejectSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Invalid input.", "fields": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            registration = services.reject_registration(
                registration_id=str(pk),
                reason=serializer.validated_data.get('reason', ''),
                rejected_by=request.user
            )
        except AppError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message, "fields": e.fields}},
                status=e.http_status
            )
        return Response(RegistrationDetailSerializer(registration).data)


class RegistrationCancelView(APIView):
    """POST /api/registrations/{id}/cancel/ — Owner or Admin."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            registration = services.cancel_registration(
                registration_id=str(pk),
                cancelled_by=request.user
            )
        except AppError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message, "fields": e.fields}},
                status=e.http_status
            )
        return Response(RegistrationDetailSerializer(registration).data)


class EventRegistrationsView(APIView):
    """GET /api/registrations/event/{event_id}/ — Admin only: all registrations for an event."""
    permission_classes = [IsAdmin]

    def get(self, request, event_id):
        from events.models import Event
        event = get_object_or_404(Event, pk=event_id)
        queryset = Registration.objects.filter(event=event).select_related('user', 'event')

        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(queryset, request)
        serializer = RegistrationDetailSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
