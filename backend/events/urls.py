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
    PastEventListView,
    PastEventDetailView,
    PastEventLogoUploadView,
)

app_name = 'events'

urlpatterns = [
    # Public + Admin — list and create
    path('', EventListView.as_view(), name='event-list'),

    # Past Events (Must be before slug)
    path('past/', PastEventListView.as_view(), name='past-event-list'),
    path('past/<uuid:pk>/', PastEventDetailView.as_view(), name='past-event-detail'),
    path('past/<uuid:pk>/logo/', PastEventLogoUploadView.as_view(), name='past-event-logo'),

    # Slug-based detail/update/delete
    path('<slug:slug>/', EventDetailView.as_view(), name='event-detail'),

    # Admin only — sub-resources use UUID for stability (slugs can change)
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
