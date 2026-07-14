"""
User management URL patterns — mounted at /api/users/
"""

from django.urls import path

from users.views import UserListView, UserProfileView, UserRoleView, AwardBonusPointsView

app_name = 'users'

urlpatterns = [
    path('me/', UserProfileView.as_view(), name='me'),
    path('', UserListView.as_view(), name='user-list'),
    path('<uuid:pk>/role/', UserRoleView.as_view(), name='user-role'),
    path('<uuid:pk>/bonus-points/', AwardBonusPointsView.as_view(), name='award-bonus-points'),
]
