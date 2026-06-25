"""Team URL patterns — mounted at /api/team/"""

from django.urls import path
from team.views import TeamMemberDetailView, TeamMemberListView, TeamMemberPhotoView

app_name = 'team'

urlpatterns = [
    path('', TeamMemberListView.as_view(), name='team-list'),
    path('<uuid:pk>/', TeamMemberDetailView.as_view(), name='team-detail'),
    path('<uuid:pk>/photo/', TeamMemberPhotoView.as_view(), name='team-photo'),
]
