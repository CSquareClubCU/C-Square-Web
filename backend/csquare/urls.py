"""
Root URL Configuration.
All app URLs are namespaced under /api/.
"""

from django.contrib import admin
from django.urls import path, include
<<<<<<< HEAD
from core.views import PublicStatsView, SettingsView, SettingsAdminView
=======
from core.views import PublicStatsView
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/auth/', include('users.urls.auth', namespace='auth')),
    path('api/users/', include('users.urls.users', namespace='users')),
    path('api/events/', include('events.urls', namespace='events')),
    path('api/registrations/', include('registrations.urls', namespace='registrations')),
    path('api/attendance/', include('attendance.urls', namespace='attendance')),
    path('api/team/', include('team.urls', namespace='team')),
    path('api/stats/', PublicStatsView.as_view(), name='public-stats'),
<<<<<<< HEAD
    path('api/settings/', SettingsView.as_view(), name='public-settings'),
    path('api/admin/settings/', SettingsAdminView.as_view(), name='admin-settings'),
=======
>>>>>>> 924843c4bd9c8afe7286d6f65a6f03f12023d59f
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
