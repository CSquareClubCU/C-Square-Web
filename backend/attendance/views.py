from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from core.permissions import IsAdminOrVolunteer
from core.exceptions import AppError
from .serializers import QRCheckinSerializer, AttendanceRecordSerializer
from . import services


class QRCheckinView(APIView):
    """POST /api/attendance/checkin/ — Admin or assigned Volunteer."""
    permission_classes = [IsAdminOrVolunteer]

    def post(self, request):
        serializer = QRCheckinSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": "Invalid input.", "fields": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            record = services.checkin_by_qr(
                token=str(serializer.validated_data['token']),
                checked_in_by=request.user
            )
        except AppError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message, "fields": e.fields}},
                status=e.http_status
            )

        return Response({
            "message": "Check-in successful.",
            "student_name": record.user.full_name,
            "event": record.event.title,
            "checked_in_at": record.checked_in_at,
        })


class ManualCheckinView(APIView):
    """POST /api/attendance/{registration_id}/manual-checkin/ — Admin or assigned Volunteer."""
    permission_classes = [IsAdminOrVolunteer]

    def post(self, request, registration_id):
        try:
            record = services.checkin_manual(
                registration_id=str(registration_id),
                checked_in_by=request.user
            )
        except AppError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message, "fields": e.fields}},
                status=e.http_status
            )
        return Response({
            "message": "Attendance marked successfully.",
            "student_name": record.user.full_name,
            "checked_in_at": record.checked_in_at,
        })


class AttendanceListView(APIView):
    """GET /api/attendance/{event_id}/list/ — Admin or assigned Volunteer."""
    permission_classes = [IsAdminOrVolunteer]

    def get(self, request, event_id):
        try:
            records = services.get_attendance_list(
                event_id=str(event_id),
                checked_in_by=request.user
            )
        except AppError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message, "fields": e.fields}},
                status=e.http_status
            )

        serializer = AttendanceRecordSerializer(records, many=True)
        return Response({"count": len(serializer.data), "results": serializer.data})
