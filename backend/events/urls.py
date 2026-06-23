from django.urls import path
from .views import (
    EventListView,
    EventDetailView,
    EventBannerView,
    EventVolunteerView,
    EventVolunteerDetailView,
    EventCheckinStatsView,
)

urlpatterns = [
    path('', EventListView.as_view(), name='event-list'),
    path('<uuid:pk>/', EventDetailView.as_view(), name='event-detail'),
    path('<uuid:pk>/banner/', EventBannerView.as_view(), name='event-banner'),
    path('<uuid:pk>/volunteers/', EventVolunteerView.as_view(), name='event-volunteers'),
    path('<uuid:pk>/volunteers/<uuid:assignment_id>/', EventVolunteerDetailView.as_view(), name='event-volunteer-detail'),
    path('<uuid:pk>/checkin-stats/', EventCheckinStatsView.as_view(), name='event-checkin-stats'),
]
