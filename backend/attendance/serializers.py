from rest_framework import serializers
from .models import AttendanceRecord


class QRCheckinSerializer(serializers.Serializer):
    token = serializers.UUIDField()


class AttendanceRecordSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    registration_id = serializers.UUIDField(source='registration.id', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'registration_id', 'user',
            'is_checked_in', 'checked_in_at', 'check_in_method'
        ]

    def get_user(self, obj):
        return {
            'id': str(obj.user.id),
            'email': obj.user.email,
            'full_name': obj.user.full_name,
            'student_uid': obj.user.student_uid,
        }
