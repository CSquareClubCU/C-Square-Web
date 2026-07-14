"""
Root URL Configuration.
All app URLs are namespaced under /api/.
"""

from django.contrib import admin
from django.urls import path, include
from core.views import PublicStatsView, SettingsView, SettingsAdminView

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/auth/', include('users.urls.auth', namespace='auth')),
    path('api/users/', include('users.urls.users', namespace='users')),
    path('api/events/', include('events.urls', namespace='events')),
    path('api/registrations/', include('registrations.urls', namespace='registrations')),
    path('api/attendance/', include('attendance.urls', namespace='attendance')),
    path('api/team/', include('team.urls', namespace='team')),
    path('api/stats/', PublicStatsView.as_view(), name='public-stats'),
    path('api/settings/', SettingsView.as_view(), name='public-settings'),
    path('api/admin/settings/', SettingsAdminView.as_view(), name='admin-settings'),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
