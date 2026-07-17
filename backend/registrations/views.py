"""
Registrations app views.
Delegates all business logic to services.py.
"""

import logging
import uuid

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.exceptions import AppError
from core.pagination import StandardPagination
from core.permissions import IsAdmin
from events.models import Event
from registrations import services
from registrations.models import Registration, Team, RegistrationStatus
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


class CreateTeamView(APIView):
    """
    POST /api/registrations/team/
    Create a team for an existing registration.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        registration_id = request.data.get('registration_id')
        team_name = request.data.get('team_name')

        if not registration_id or not team_name:
            raise AppError('VALIDATION_ERROR', 'registration_id and team_name are required.', 400)

        try:
            reg_id = uuid.UUID(registration_id)
        except ValueError:
            raise AppError('VALIDATION_ERROR', 'Invalid registration_id.', 400)

        team = services.create_team_from_registration(
            registration_id=reg_id,
            team_name=team_name,
            user=request.user
        )
        return Response(
            TeamSerializer(team).data,
            status=status.HTTP_201_CREATED,
        )


class JoinTeamView(APIView):
    """
    POST /api/registrations/team/join/
    Join a team using a join code.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        registration_id = request.data.get('registration_id')
        join_code = request.data.get('join_code')

        if not registration_id or not join_code:
            raise AppError('VALIDATION_ERROR', 'registration_id and join_code are required.', 400)

        try:
            reg_id = uuid.UUID(registration_id)
        except ValueError:
            raise AppError('VALIDATION_ERROR', 'Invalid registration_id.', 400)

        team = services.join_team_with_code(
            registration_id=reg_id,
            join_code=join_code,
            user=request.user
        )
        return Response(
            TeamSerializer(team).data,
            status=status.HTTP_200_OK,
        )


class LeaveTeamView(APIView):
    """
    POST /api/registrations/team/leave/
    Leaves a team.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        registration_id = request.data.get('registration_id')
        if not registration_id:
            raise AppError('VALIDATION_ERROR', 'registration_id is required.', 400)

        try:
            reg_id = uuid.UUID(registration_id)
        except ValueError:
            raise AppError('VALIDATION_ERROR', 'Invalid registration_id.', 400)

        registration = services.leave_team(registration_id=reg_id, user=request.user)
        return Response(
            RegistrationDetailSerializer(registration).data,
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


class AdminEventTeamsView(APIView):
    """
    GET /api/registrations/event/{event_id}/teams/
    List all teams for a specific event. Admin only. Paginated.
    Supports ?search= query param.
    """
    permission_classes = [IsAdmin]

    def get(self, request, event_id):
        from django.db.models import Q
        from registrations.serializers import TeamSerializer
        from registrations.models import Team

        search = request.query_params.get('search')
        qs = Team.objects.filter(event_id=event_id).select_related('event', 'leader').prefetch_related('registrations', 'registrations__user', 'members', 'members__user')

        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(leader__full_name__icontains=search)
                | Q(leader__email__icontains=search)
            )

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = TeamSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ApproveTeamView(APIView):
    """
    POST /api/registrations/team/{id}/approve/
    Approve all pending members of a team. Admin only.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        team = services.approve_team(team_id=pk, admin_user=request.user)
        return Response(
            {
                'id': str(team.id),
                'message': 'Team approved successfully.',
            },
            status=status.HTTP_200_OK,
        )


class RejectTeamView(APIView):
    """
    POST /api/registrations/team/{id}/reject/
    Reject all pending members of a team. Admin only.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        reason = request.data.get('reason')
        if not reason:
            raise AppError('VALIDATION_ERROR', 'A reason is required for rejection.', 400)
            
        team = services.reject_team(team_id=pk, reason=reason, admin_user=request.user)
        return Response(
            {
                'id': str(team.id),
                'message': 'Team rejected successfully.',
            },
            status=status.HTTP_200_OK,
        )


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
    Works for both individual and team registrations.
    """
    permission_classes = [IsAdmin]

    def delete(self, request, pk):
        from registrations.models import Registration
        from django.db import transaction
        try:
            with transaction.atomic():
                registration = Registration.objects.select_for_update().get(id=pk)
                was_approved = registration.status == RegistrationStatus.APPROVED
                event = registration.event
                
                # Safely detach/cleanup team logic first
                if registration.team:
                    services.leave_team(registration_id=registration.id, user=registration.user)
                    registration.refresh_from_db()

                if registration.status == RegistrationStatus.APPROVED:
                    from attendance.models import AttendanceRecord
                    if hasattr(registration, 'attendance_record'):
                        record = registration.attendance_record
                        if record.is_checked_in:
                            from django.db.models import F, Value
                            from django.db.models.functions import Greatest
                            from django.contrib.auth import get_user_model
                            get_user_model().objects.filter(pk=record.user.pk).update(
                                club_points=Greatest(F('club_points') - event.points, Value(0))
                            )
                        AttendanceRecord.objects.filter(registration=registration).delete()
                        
                if registration.qr_image_url:
                    from core.utils.storage import delete_blob_from_url
                    try:
                        delete_blob_from_url(registration.qr_image_url)
                    except Exception as exc:
                        logger.warning('Failed to delete QR blob for registration %s: %s', registration.id, exc)

                registration.delete()

            # Outside transaction: promote waitlist if spot opened
            if was_approved:
                from registrations import services as reg_services
                reg_services.promote_waitlist(event)

            return Response({'success': True, 'message': 'Registration completely removed.'}, status=status.HTTP_200_OK)
        except Registration.DoesNotExist:
            return Response({'error': 'Registration not found'}, status=status.HTTP_404_NOT_FOUND)


class AdminDeleteTeamView(APIView):
    """
    DELETE /api/registrations/team/{id}/admin-delete/
    Completely remove a team and all its member registrations. Admin only.
    """
    permission_classes = [IsAdmin]

    def delete(self, request, pk):
        from registrations.models import Team, Registration
        from django.db import transaction
        try:
            with transaction.atomic():
                team = Team.objects.select_related('event').prefetch_related('registrations').get(id=pk)
                event = team.event

                # Track how many approved registrations are being removed
                approved_count = team.registrations.filter(status=RegistrationStatus.APPROVED).count()

                # Clean up attendance records and deduct points for any checked-in members
                for reg in team.registrations.all():
                    if reg.status == RegistrationStatus.APPROVED:
                        from attendance.models import AttendanceRecord
                        if hasattr(reg, 'attendance_record'):
                            record = reg.attendance_record
                            if record.is_checked_in:
                                from django.db.models import F, Value
                                from django.db.models.functions import Greatest
                                from django.contrib.auth import get_user_model
                                get_user_model().objects.filter(pk=record.user.pk).update(
                                    club_points=Greatest(F('club_points') - event.points, Value(0))
                                )
                            AttendanceRecord.objects.filter(registration=reg).delete()
                            
                    if reg.qr_image_url:
                        from core.utils.storage import delete_blob_from_url
                        try:
                            delete_blob_from_url(reg.qr_image_url)
                        except Exception as exc:
                            logger.warning('Failed to delete QR blob for registration %s: %s', reg.id, exc)

                # Delete the team (cascades to registrations via FK if set, otherwise explicit)
                team.registrations.all().delete()
                team.delete()

            if approved_count > 0:
                from registrations import services as reg_services
                for _ in range(approved_count):
                    reg_services.promote_waitlist(event)

            return Response({'success': True, 'message': 'Team and all member registrations removed.'}, status=status.HTTP_200_OK)
        except Team.DoesNotExist:
            return Response({'error': 'Team not found'}, status=status.HTTP_404_NOT_FOUND)
