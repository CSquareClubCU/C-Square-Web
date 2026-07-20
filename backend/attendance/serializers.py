"""
Attendance app serializers.
"""

from rest_framework import serializers
from attendance.models import AttendanceRecord, DailyCheckIn


class DailyCheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyCheckIn
        fields = ['date', 'checked_in_at', 'check_in_method']


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """
    Full attendance record for GET /attendance/{event_id}/list/
    """
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_student_uid = serializers.CharField(source='user.student_uid', read_only=True)
    registration_id = serializers.UUIDField(source='registration.id', read_only=True)
    marked_by_email = serializers.SerializerMethodField()
    daily_checkins = DailyCheckInSerializer(many=True, read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id',
            'registration_id',
            'user_full_name',
            'user_email',
            'user_student_uid',
            'is_checked_in',
            'checked_in_at',
            'check_in_method',
            'marked_by_email',
            'daily_checkins',
        ]
        read_only_fields = fields

    def get_marked_by_email(self, obj):
        return obj.marked_by.email if obj.marked_by else None


class QRCheckinSerializer(serializers.Serializer):
    """Validates POST /attendance/checkin/ — just a qr_token."""
    qr_token = serializers.CharField()


class ManualCheckinSerializer(serializers.Serializer):
    """Validates POST /attendance/{registration_id}/manual-checkin/"""
    # No body needed — registration_id is in the URL; marked_by from request.user
    pass


class CheckinResponseSerializer(serializers.Serializer):
    """Response shape for both QR and manual check-in."""
    registration_id = serializers.UUIDField()
    user_full_name = serializers.CharField()
    user_email = serializers.CharField()
    is_checked_in = serializers.BooleanField()
    checked_in_at = serializers.DateTimeField()
    check_in_method = serializers.CharField()
    already_checked_in = serializers.BooleanField()
