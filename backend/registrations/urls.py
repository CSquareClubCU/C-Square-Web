"""
Registrations URL patterns — mounted at /api/registrations/
"""

from django.urls import path

from registrations.views import (
    AdminEventRegistrationsView,
    AdminEventTeamsView,
    ApproveTeamView,
    RejectTeamView,
    AdminDeleteTeamView,
    ApproveRegistrationView,
    CancelRegistrationView,
    CreateTeamView,
    JoinTeamView,
    LeaveTeamView,
    MoveFromWaitlistView,
    MyRegistrationsView,
    RegisterIndividualView,
    RegistrationDetailView,
    RejectRegistrationView,
    AdminDeleteRegistrationView,
)

app_name = 'registrations'

urlpatterns = [
    # Student endpoints
    path('', RegisterIndividualView.as_view(), name='register-individual'),
    path('team/create/', CreateTeamView.as_view(), name='create-team'),
    path('team/join/', JoinTeamView.as_view(), name='join-team'),
    path('team/leave/', LeaveTeamView.as_view(), name='leave-team'),
    path('me/', MyRegistrationsView.as_view(), name='my-registrations'),
    path('<uuid:pk>/', RegistrationDetailView.as_view(), name='registration-detail'),
    path('<uuid:pk>/cancel/', CancelRegistrationView.as_view(), name='cancel-registration'),
    
    # Admin endpoints
    path('event/<uuid:event_id>/', AdminEventRegistrationsView.as_view(), name='admin-event-registrations'),
    path('event/<uuid:event_id>/teams/', AdminEventTeamsView.as_view(), name='admin-event-teams'),
    path('team/<uuid:pk>/approve/', ApproveTeamView.as_view(), name='approve-team'),
    path('team/<uuid:pk>/reject/', RejectTeamView.as_view(), name='reject-team'),
    path('team/<uuid:pk>/admin-delete/', AdminDeleteTeamView.as_view(), name='admin-delete-team'),
    path('<uuid:pk>/approve/', ApproveRegistrationView.as_view(), name='approve-registration'),
    path('<uuid:pk>/reject/', RejectRegistrationView.as_view(), name='reject-registration'),
    path('<uuid:pk>/move-from-waitlist/', MoveFromWaitlistView.as_view(), name='move-from-waitlist'),
    path('<uuid:pk>/admin-delete/', AdminDeleteRegistrationView.as_view(), name='admin-delete-registration'),
]
