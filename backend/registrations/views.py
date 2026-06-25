"""
Registrations app views.
Delegates all business logic to services.py.
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.exceptions import AppError
from core.permissions import IsAdmin
from events.models import Event
from registrations import services
from registrations.models import Registration, Team
from users.models import UserRole
from registrations.serializers import (
    RegistrationCreateSerializer,
    RegistrationRejectSerializer,
    RegistrationSerializer,
    TeamCreateSerializer,
    TeamSerializer,
)


# ---------------------------------------------------------------------------
# Student Views
# ---------------------------------------------------------------------------

class RegisterIndividualView(APIView):
    """
    POST /api/registrations/
    Register the current user for an event.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RegistrationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            raise AppError('VALIDATION_ERROR', 'Invalid input.', fields=serializer.errors)

        registration = services.register_individual(
            event_id=serializer.validated_data['event_id'],
            user=request.user,
        )
        return Response(
            RegistrationSerializer(registration).data,
            status=status.HTTP_201_CREATED,
        )


class RegisterTeamView(APIView):
    """
    POST /api/registrations/team/
    Submit a team registration.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TeamCreateSerializer(data=request.data)
        if not serializer.is_valid():
            raise AppError('VALIDATION_ERROR', 'Invalid input.', fields=serializer.errors)

        team = services.register_team(
            event_id=serializer.validated_data['event_id'],
            team_name=serializer.validated_data['team_name'],
            leader=request.user,
            members_data=serializer.validated_data['members'],
        )
        return Response(
            TeamSerializer(team).data,
            status=status.HTTP_201_CREATED,
        )


class ConfirmTeamMemberView(APIView):
    """
    POST /api/registrations/confirm/
    Confirm a team invitation using a token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            raise AppError('MISSING_TOKEN', 'Confirmation token is required.', 400)

        member = services.confirm_teammate(token=token, user=request.user)
        return Response({'message': 'Team membership confirmed.'})


class MyRegistrationsView(APIView):
    """
    GET /api/registrations/me/
    List all registrations for the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        registrations = Registration.objects.filter(user=request.user).select_related('event', 'user')
        return Response(RegistrationSerializer(registrations, many=True).data)


class RegistrationDetailView(APIView):
    """
    GET /api/registrations/{id}/
    Get details of a specific registration.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            # Users can see their own; Admins can see any
            if request.user.role == UserRole.ADMIN:
                registration = Registration.objects.get(pk=pk)
            else:
                registration = Registration.objects.get(pk=pk, user=request.user)
        except Registration.DoesNotExist:
            raise AppError('NOT_FOUND', 'Registration not found.', 404)

        return Response(RegistrationSerializer(registration).data)


class CancelRegistrationView(APIView):
    """
    POST /api/registrations/{id}/cancel/
    Cancel own registration.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        services.cancel_registration(registration_id=pk, user=request.user)
        return Response({'message': 'Registration cancelled.'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Admin Views
# ---------------------------------------------------------------------------

class AdminEventRegistrationsView(APIView):
    """
    GET /api/registrations/event/{event_id}/
    List all registrations for a specific event. Admin only.
    """
    permission_classes = [IsAdmin]

    def get(self, request, event_id):
        # Allow filtering by status
        status_param = request.query_params.get('status')
        qs = Registration.objects.filter(event_id=event_id).select_related('event', 'user')
        if status_param:
            qs = qs.filter(status=status_param)
            
        return Response(RegistrationSerializer(qs, many=True).data)


class ApproveRegistrationView(APIView):
    """
    POST /api/registrations/{id}/approve/
    Approve a pending registration. Admin only.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        registration = services.approve_registration(registration_id=pk, admin_user=request.user)
        return Response(RegistrationSerializer(registration).data)


class RejectRegistrationView(APIView):
    """
    POST /api/registrations/{id}/reject/
    Reject a pending registration. Admin only.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        serializer = RegistrationRejectSerializer(data=request.data)
        if not serializer.is_valid():
            raise AppError('VALIDATION_ERROR', 'Invalid input.', fields=serializer.errors)

        registration = services.reject_registration(
            registration_id=pk,
            reason=serializer.validated_data['reason'],
            admin_user=request.user,
        )
        return Response(RegistrationSerializer(registration).data)


class MoveFromWaitlistView(APIView):
    """
    POST /api/registrations/{id}/move-from-waitlist/
    Move a registration from waitlist to pending. Admin only.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        registration = services.move_from_waitlist(registration_id=pk, admin_user=request.user)
        return Response(RegistrationSerializer(registration).data)
