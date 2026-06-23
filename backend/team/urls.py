from django.urls import path
from .views import TeamMemberListView, TeamMemberPhotoView

urlpatterns = [
    path('', TeamMemberListView.as_view(), name='team-member-list'),
    path('<uuid:pk>/photo/', TeamMemberPhotoView.as_view(), name='team-member-photo'),
]
