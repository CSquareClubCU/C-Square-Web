from django.urls import path
from .views import (
    RegistrationCreateView,
    TeamRegistrationCreateView,
    TeamConfirmView,
    MyRegistrationsView,
    RegistrationDetailView,
    RegistrationApproveView,
    RegistrationRejectView,
    RegistrationCancelView,
    EventRegistrationsView,
)

urlpatterns = [
    path('', RegistrationCreateView.as_view(), name='registration-create'),
    path('team/', TeamRegistrationCreateView.as_view(), name='team-registration-create'),
    path('team/<uuid:team_id>/confirm/', TeamConfirmView.as_view(), name='team-confirm'),
    path('me/', MyRegistrationsView.as_view(), name='my-registrations'),
    path('event/<uuid:event_id>/', EventRegistrationsView.as_view(), name='event-registrations'),
    path('<uuid:pk>/', RegistrationDetailView.as_view(), name='registration-detail'),
    path('<uuid:pk>/approve/', RegistrationApproveView.as_view(), name='registration-approve'),
    path('<uuid:pk>/reject/', RegistrationRejectView.as_view(), name='registration-reject'),
    path('<uuid:pk>/cancel/', RegistrationCancelView.as_view(), name='registration-cancel'),
]
