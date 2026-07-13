"""
Registrations URL patterns — mounted at /api/registrations/
"""

from django.urls import path

from registrations.views import (
    AdminEventRegistrationsView,
    ApproveRegistrationView,
    CancelRegistrationView,
    ConfirmTeamMemberView,
    MoveFromWaitlistView,
    MyRegistrationsView,
    RegisterIndividualView,
    RegisterTeamView,
    RegistrationDetailView,
    RejectRegistrationView,
    AdminDeleteRegistrationView,
)

app_name = 'registrations'

urlpatterns = [
    # Student endpoints
    path('', RegisterIndividualView.as_view(), name='register-individual'),
    path('team/', RegisterTeamView.as_view(), name='register-team'),
    path('team/confirm/', ConfirmTeamMemberView.as_view(), name='confirm-team-member'),
    path('me/', MyRegistrationsView.as_view(), name='my-registrations'),
    path('<uuid:pk>/', RegistrationDetailView.as_view(), name='registration-detail'),
    path('<uuid:pk>/cancel/', CancelRegistrationView.as_view(), name='cancel-registration'),
    
    # Admin endpoints
    path('event/<uuid:event_id>/', AdminEventRegistrationsView.as_view(), name='admin-event-registrations'),
    path('<uuid:pk>/approve/', ApproveRegistrationView.as_view(), name='approve-registration'),
    path('<uuid:pk>/reject/', RejectRegistrationView.as_view(), name='reject-registration'),
    path('<uuid:pk>/move-from-waitlist/', MoveFromWaitlistView.as_view(), name='move-from-waitlist'),
    path('<uuid:pk>/admin-delete/', AdminDeleteRegistrationView.as_view(), name='admin-delete-registration'),
]
