"""
Events URL patterns — mounted at /api/events/
"""

from django.urls import path

from events.views import (
    EventBannerView,
    EventCheckinStatsView,
    EventDetailView,
    EventListView,
    EventVolunteerDetailView,
    EventVolunteersView,
)

app_name = 'events'

urlpatterns = [
    # Public + Admin
    path('', EventListView.as_view(), name='event-list'),
    path('<uuid:pk>/', EventDetailView.as_view(), name='event-detail'),

    # Admin only
    path('<uuid:pk>/banner/', EventBannerView.as_view(), name='event-banner'),
    path('<uuid:pk>/volunteers/', EventVolunteersView.as_view(), name='event-volunteers'),
    path(
        '<uuid:pk>/volunteers/<uuid:assignment_id>/',
        EventVolunteerDetailView.as_view(),
        name='event-volunteer-detail',
    ),

    # Admin + Volunteer
    path('<uuid:pk>/checkin-stats/', EventCheckinStatsView.as_view(), name='checkin-stats'),
]
