"""
Attendance app Django Admin.
"""

from django.contrib import admin
from attendance.models import AttendanceRecord


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'is_checked_in', 'checked_in_at', 'check_in_method', 'marked_by')
    list_filter = ('is_checked_in', 'check_in_method', 'event')
    search_fields = ('user__email', 'user__full_name', 'user__student_uid')
    readonly_fields = ('id', 'registration', 'event', 'user', 'created_at', 'updated_at')
    ordering = ('-checked_in_at',)
