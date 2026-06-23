from django.urls import path
from .views import MagicLinkView, VerifyMagicLinkView, LogoutView, MeView
from .admin_views import UserListView, UserRoleView

urlpatterns = [
    # Auth
    path('auth/magic-link/', MagicLinkView.as_view(), name='magic-link'),
    path('auth/verify/', VerifyMagicLinkView.as_view(), name='magic-link-verify'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', MeView.as_view(), name='auth-me'),

    # Users
    path('users/me/', MeView.as_view(), name='me'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<uuid:pk>/role/', UserRoleView.as_view(), name='user-role'),
]
