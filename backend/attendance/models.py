import uuid
from django.db import models
from core.models import BaseModel


class AttendanceRecord(BaseModel):
    registration = models.OneToOneField(
        'registrations.Registration',
        on_delete=models.CASCADE,
        related_name='attendance_record'
    )
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    is_checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    check_in_method = models.CharField(
        max_length=10,
        choices=[('qr', 'QR'), ('manual', 'Manual')],
        null=True,
        blank=True
    )
    marked_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='marked_attendances'
    )

    class Meta:
        db_table = 'attendance_attendancerecord'
        ordering = ['-created_at']
        verbose_name = 'Attendance Record'
        verbose_name_plural = 'Attendance Records'
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['is_checked_in']),
        ]

    def __str__(self):
        status = "✓" if self.is_checked_in else "✗"
        return f"{status} {self.user.email} @ {self.event.title}"
