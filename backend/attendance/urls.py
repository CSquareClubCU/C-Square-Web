"""
Attendance URL patterns — mounted at /api/attendance/
"""

from django.urls import path
from attendance.views import (
    AttendanceExportView,
    AttendanceListView,
    ManualCheckinView,
    QRCheckinView,
)

app_name = 'attendance'

urlpatterns = [
    path('checkin/', QRCheckinView.as_view(), name='qr-checkin'),
    path('<uuid:registration_id>/manual-checkin/', ManualCheckinView.as_view(), name='manual-checkin'),
    path('<uuid:event_id>/list/', AttendanceListView.as_view(), name='attendance-list'),
    path('<uuid:event_id>/export/', AttendanceExportView.as_view(), name='attendance-export'),
]
