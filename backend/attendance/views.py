"""
Attendance app views.
Delegates all logic to attendance/services.py.

Endpoints:
- POST /api/attendance/checkin/                        QR check-in
- POST /api/attendance/{registration_id}/manual-checkin/ Manual check-in
- GET  /api/attendance/{event_id}/list/               Attendance list
- GET  /api/attendance/{event_id}/export/             CSV export
"""

import logging

from django.http import StreamingHttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from attendance import services
from attendance.serializers import AttendanceRecordSerializer, QRCheckinSerializer
from core.exceptions import AppError
from core.pagination import StandardPagination
from core.permissions import IsAdminOrVolunteer
from events.services import get_event_or_404

logger = logging.getLogger(__name__)


def _build_checkin_response(record, was_already_checked_in: bool) -> dict:
    return {
        'registration_id': str(record.registration.id),
        'user_full_name': record.user.full_name,
        'user_email': record.user.email,
        'is_checked_in': record.is_checked_in,
        'checked_in_at': record.checked_in_at,
        'check_in_method': record.check_in_method,
        'already_checked_in': was_already_checked_in,
    }


class QRCheckinView(APIView):
    """
    POST /api/attendance/checkin/
    Check in an attendee by scanning their QR code.
    Admin and assigned volunteers only.
    """
    permission_classes = [IsAdminOrVolunteer]

    def post(self, request):
        serializer = QRCheckinSerializer(data=request.data)
        if not serializer.is_valid():
            raise AppError('VALIDATION_ERROR', 'Invalid input.', fields=serializer.errors)

        qr_token = serializer.validated_data['qr_token']
        
        # Track if already checked in before calling service
        was_already = False
        try:
            import uuid
            from registrations.models import Registration
            reg = Registration.objects.get(qr_token=uuid.UUID(qr_token))
            was_already = reg.attendance_record.is_checked_in
        except Exception:
            pass

        record = services.checkin_by_qr(qr_token=qr_token, marked_by=request.user)
        return Response(_build_checkin_response(record, was_already))


class ManualCheckinView(APIView):
    """
    POST /api/attendance/{registration_id}/manual-checkin/
    Check in an attendee manually by registration ID (from the attendance list).
    Admin and assigned volunteers only.
    """
    permission_classes = [IsAdminOrVolunteer]

    def post(self, request, registration_id):
        try:
            from attendance.models import AttendanceRecord
            was_already = AttendanceRecord.objects.get(
                registration_id=registration_id
            ).is_checked_in
        except Exception:
            was_already = False

        record = services.checkin_manual(
            registration_id=registration_id,
            marked_by=request.user,
        )
        return Response(_build_checkin_response(record, was_already))


class AttendanceListView(APIView):
    """
    GET /api/attendance/{event_id}/list/
    List all attendance records for an event. Searchable.
    Admin and assigned volunteers only.
    """
    permission_classes = [IsAdminOrVolunteer]

    def get(self, request, event_id):
        event = get_event_or_404(event_id)
        search = request.query_params.get('search')
        records = services.get_attendance_list(event=event, marked_by=request.user, search=search)
        
        paginator = StandardPagination()
        page = paginator.paginate_queryset(records, request)
        serializer = AttendanceRecordSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AttendanceExportView(APIView):
    """
    GET /api/attendance/{event_id}/export/
    Stream a CSV export of attendance records. Admin only.
    """
    permission_classes = [IsAdminOrVolunteer]

    def get(self, request, event_id):
        event = get_event_or_404(event_id)
        buffer = services.export_attendance_csv(event=event, marked_by=request.user)

        filename = f'attendance_{event.title.replace(" ", "_")}_{event_id}.csv'
        response = StreamingHttpResponse(
            iter([buffer.getvalue()]),
            content_type='text/csv',
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
