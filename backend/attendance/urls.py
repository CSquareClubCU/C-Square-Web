from django.urls import path
from .views import QRCheckinView, ManualCheckinView, AttendanceListView

urlpatterns = [
    path('checkin/', QRCheckinView.as_view(), name='qr-checkin'),
    path('<uuid:event_id>/list/', AttendanceListView.as_view(), name='attendance-list'),
    path('<uuid:registration_id>/manual-checkin/', ManualCheckinView.as_view(), name='manual-checkin'),
]
