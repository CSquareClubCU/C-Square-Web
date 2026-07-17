"""
core/views.py

Public utility endpoints.

Endpoints:
- GET /api/stats/  — Public aggregate stats for the homepage
"""

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.cache import cache
from django.db import Error as DBError
import logging
from core.models import SiteSettings
from core.serializers import SiteSettingsSerializer
from core.permissions import IsAdmin

logger = logging.getLogger(__name__)


class PublicStatsView(APIView):
    """
    GET /api/stats/
    Returns aggregate counts for the public homepage stats bar.
    No auth required.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        cached_data = cache.get('public_stats')
        if cached_data:
            return Response(cached_data)
        from events.models import Event
        from django.contrib.auth import get_user_model
        from team.models import TeamMember

        settings = SiteSettings.load()
        total_events = Event.objects.count() + settings.previous_events_count
        total_registrations = get_user_model().objects.count()
        active_team_members = TeamMember.objects.filter(is_active=True).count()

        # Count checked-in attendees across all events
        try:
            from attendance.models import AttendanceRecord
            total_checkins = AttendanceRecord.objects.filter(is_checked_in=True).count()
        except (ImportError, DBError) as e:
            logger.error("Failed to count attendance records: %s", str(e))
            total_checkins = 0

        data = {
            'total_registrations': total_registrations,
            'total_events': total_events,
            'total_checkins': total_checkins,
            'active_team_members': active_team_members,
        }
        
        cache.set('public_stats', data, timeout=300)
        return Response(data)

class SettingsView(APIView):
    """
    GET /api/settings/
    Returns global site settings (e.g. WhatsApp group link).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        settings = SiteSettings.load()
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)


class SettingsAdminView(APIView):
    """
    GET /api/admin/settings/
    PUT /api/admin/settings/
    Manage global site settings.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        settings = SiteSettings.load()
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        from core.exceptions import AppError
        settings_obj = SiteSettings.load()
        serializer = SiteSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        raise AppError('VALIDATION_ERROR', 'Invalid input.', 400, fields=serializer.errors)

