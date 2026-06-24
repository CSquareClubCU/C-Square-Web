"""
Attendance app models.

Table: attendance_attendancerecord
One record per approved registration, created automatically on approval.
"""

from django.conf import settings
from django.db import models

from core.models import BaseModel
from events.models import Event
from registrations.models import Registration


class CheckInMethod(models.TextChoices):
    QR = 'qr', 'QR Scan'
    MANUAL = 'manual', 'Manual'


class AttendanceRecord(BaseModel):
    """
    Tracks check-in status for each approved registration.

    Created automatically when a Registration is approved.
    Updated by admin/volunteer at the event via QR or manual check-in.

    event and user are denormalised here to avoid JOINs in the dashboard query.
    """
    registration = models.OneToOneField(
        Registration,
        on_delete=models.CASCADE,
        related_name='attendance_record',
        db_index=True,
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='attendance_records',
        db_index=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendance_records',
        db_index=True,
    )
    is_checked_in = models.BooleanField(default=False, db_index=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    check_in_method = models.CharField(
        max_length=10,
        choices=CheckInMethod.choices,
        null=True,
        blank=True,
    )
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='marked_attendance_records',
    )

    class Meta:
        db_table = 'attendance_attendancerecord'
        ordering = ['-checked_in_at', 'user__full_name']
        verbose_name = 'Attendance Record'
        verbose_name_plural = 'Attendance Records'

    def __str__(self):
        status = 'checked in' if self.is_checked_in else 'not checked in'
        return f'{self.user.email} @ {self.event.title} — {status}'
