"""
Auth URL patterns — mounted at /api/auth/
"""

from django.urls import path

from users.views import (
    CSRFTokenView,
    LogoutView,
    MagicLinkVerifyView,
    MagicLinkView,
    MeView,
)

app_name = 'auth'

urlpatterns = [
    path('magic-link/', MagicLinkView.as_view(), name='magic-link'),
    path('verify/', MagicLinkVerifyView.as_view(), name='verify'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('csrf/', CSRFTokenView.as_view(), name='csrf'),
]
