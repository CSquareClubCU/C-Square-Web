"""
Registrations app views.
Delegates all business logic to services.py.
"""

import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.exceptions import AppError
from core.pagination import StandardPagination
from core.permissions import IsAdmin
from events.models import Event
from registrations import services
from registrations.models import Registration, Team
from users.models import UserRole
from registrations.serializers import (
    RegistrationAdminListSerializer,
    RegistrationCreateSerializer,
    RegistrationDetailSerializer,
    RegistrationMyListSerializer,
    RegistrationRejectSerializer,
    TeamCreateSerializer,
    TeamSerializer,
)

logger = logging.getLogger(__name__)


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
            RegistrationDetailSerializer(registration).data,
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
    POST /api/registrations/team/confirm/
    Confirm a team invitation using a token from the invite email link.
    Auth required: Yes (teammate must be logged in)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        raw_token = request.data.get('token')
        token = raw_token.strip() if isinstance(raw_token, str) else ''
        
        if not token:
            raise AppError(
                code='INVALID_TOKEN',
                message='Confirmation token is required.',
                status=400,
            )

        import uuid
        try:
            parsed_token = uuid.UUID(token)
        except ValueError:
            raise AppError(
                code='INVALID_TOKEN',
                message='Invalid token format.',
                status=400,
            )

        member = services.confirm_teammate(token=parsed_token, user=request.user)

        team = member.team
        return Response(
            {
                'message': f'You have confirmed your participation in {team.name}.',
                'team_id': str(team.id),
                'team_name': team.name,
                'event': {
                    'id': str(team.event.id),
                    'title': team.event.title,
                },
            },
            status=status.HTTP_200_OK,
        )


class MyRegistrationsView(APIView):
    """
    GET /api/registrations/me/
    List all registrations for the current user. Paginated.
    Supports ?status= and ?upcoming= query params.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone as tz

        qs = Registration.objects.filter(user=request.user).select_related(
            'event', 'user'
        )

        status_param = request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        if request.query_params.get('upcoming') == 'true':
            qs = qs.filter(event__start_datetime__gte=tz.now())

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = RegistrationMyListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class RegistrationDetailView(APIView):
    """
    GET /api/registrations/{id}/
    Get details of a specific registration.
    Auth required: Yes — Owner, Admin, or assigned Volunteer
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            registration = Registration.objects.select_related(
                'event', 'user'
            ).get(pk=pk)
        except Registration.DoesNotExist:
            raise AppError('NOT_FOUND', 'Registration not found.', status=404) from None

        user = request.user
        is_owner = registration.user == user
        is_admin = user.role == UserRole.ADMIN

        # Volunteers can access if assigned to the event
        is_assigned_volunteer = False
        if user.role == UserRole.VOLUNTEER:
            from events.models import VolunteerAssignment
            is_assigned_volunteer = VolunteerAssignment.objects.filter(
                event=registration.event, volunteer=user
            ).exists()

        if not (is_owner or is_admin or is_assigned_volunteer):
            raise AppError(
                code='FORBIDDEN',
                message='You do not have permission to view this registration.',
                status=403,
            )

        return Response(RegistrationDetailSerializer(registration).data)


class CancelRegistrationView(APIView):
    """
    POST /api/registrations/{id}/cancel/
    Cancel own registration or admin cancels any.
    Auth required: Yes — Owner or Admin
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # Admins can cancel any registration; students only their own
        if request.user.role == UserRole.ADMIN:
            try:
                registration = Registration.objects.get(pk=pk)
            except Registration.DoesNotExist:
                raise AppError('NOT_FOUND', 'Registration not found.', status=404) from None
            services.cancel_registration(registration_id=pk, user=registration.user)
        else:
            services.cancel_registration(registration_id=pk, user=request.user)

        return Response(
            {
                'id': str(pk),
                'status': 'cancelled',
                'message': 'Registration cancelled successfully.',
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Admin Views
# ---------------------------------------------------------------------------

class AdminEventRegistrationsView(APIView):
    """
    GET /api/registrations/event/{event_id}/
    List all registrations for a specific event. Admin only. Paginated.
    Supports ?status= and ?search= query params.
    """
    permission_classes = [IsAdmin]

    def get(self, request, event_id):
        from django.db.models import Q

        status_param = request.query_params.get('status')
        search = request.query_params.get('search')

        qs = Registration.objects.filter(event_id=event_id).select_related(
            'event', 'user'
        )

        if status_param:
            qs = qs.filter(status=status_param)

        if search:
            qs = qs.filter(
                Q(user__full_name__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__student_uid__icontains=search)
            )

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = RegistrationAdminListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ApproveRegistrationView(APIView):
    """
    POST /api/registrations/{id}/approve/
    Approve a pending registration. Admin only.
    Generates QR code, creates AttendanceRecord, sends email.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        registration = services.approve_registration(registration_id=pk, admin_user=request.user)
        return Response(
            {
                'id': str(registration.id),
                'status': registration.status,
                'qr_token': str(registration.qr_token) if registration.qr_token else None,
                'qr_image_url': registration.qr_image_url,
                'approved_at': registration.approved_at,
                'message': 'Registration approved. Confirmation email sent.',
            },
            status=status.HTTP_200_OK,
        )


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
        return Response(
            {
                'id': str(registration.id),
                'status': registration.status,
                'rejection_reason': registration.rejection_reason,
                'message': 'Registration rejected. Notification email sent.',
            },
            status=status.HTTP_200_OK,
        )


class MoveFromWaitlistView(APIView):
    """
    POST /api/registrations/{id}/move-from-waitlist/
    Move a registration from waitlist to pending. Admin only.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        registration = services.move_from_waitlist(registration_id=pk, admin_user=request.user)
        return Response(
            {
                'id': str(registration.id),
                'status': registration.status,
                'message': 'Registration moved from waitlist to pending. Student notified.',
            },
            status=status.HTTP_200_OK,
        )



class AdminDeleteRegistrationView(APIView):
    """
    DELETE /api/registrations/{id}/admin-delete/
    Completely remove a registration and its attendance data. Admin only.
    """
    permission_classes = [IsAdmin]

    def delete(self, request, pk):
        from registrations.models import Registration
        from django.db import transaction
        try:
            with transaction.atomic():
                registration = Registration.objects.get(id=pk)
                
                try:
                    record = registration.attendance_record
                    if record.is_checked_in:
                        user = record.user
                        user.club_points = max(0, user.club_points - record.event.points)
                        user.save(update_fields=['club_points', 'updated_at'])
                except Exception as e:
                    # Narrow exception: usually RelatedObjectDoesNotExist or AttendanceRecordDoesNotExist
                    if type(e).__name__ not in ('RelatedObjectDoesNotExist', 'AttendanceRecordDoesNotExist'):
                        raise e

                if registration.status in ['approved', 'pending', 'waitlisted']:
                    from registrations import services as reg_services
                    reg_services.cancel_registration(registration_id=pk, user=registration.user)

                registration.delete()

            return Response({'success': True, 'message': 'Registration completely removed.'}, status=status.HTTP_200_OK)
        except Registration.DoesNotExist:
            return Response({'error': 'Registration not found'}, status=status.HTTP_404_NOT_FOUND)

