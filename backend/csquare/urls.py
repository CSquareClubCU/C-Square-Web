"""
Root URL Configuration.
All app URLs are namespaced under /api/.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls.auth', namespace='auth')),
    path('api/users/', include('users.urls.users', namespace='users')),
    path('api/events/', include('events.urls', namespace='events')),
    path('api/registrations/', include('registrations.urls', namespace='registrations')),
    path('api/attendance/', include('attendance.urls', namespace='attendance')),
    path('api/team/', include('team.urls', namespace='team')),
]
