"""
core/views.py

Public utility endpoints.

Endpoints:
- GET /api/stats/  — Public aggregate stats for the homepage
"""

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class PublicStatsView(APIView):
    """
    GET /api/stats/
    Returns aggregate counts for the public homepage stats bar.
    No auth required.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        from events.models import Event
        from registrations.models import Registration
        from team.models import TeamMember

        total_events = Event.objects.count()
        total_registrations = Registration.objects.count()
        active_team_members = TeamMember.objects.filter(is_active=True).count()

        # Count checked-in attendees across all events
        try:
            from attendance.models import AttendanceRecord
            total_checkins = AttendanceRecord.objects.filter(is_checked_in=True).count()
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error("Failed to count attendance records: %s", str(e))
            total_checkins = 0

        return Response({
            'total_registrations': total_registrations,
            'total_events': total_events,
            'total_checkins': total_checkins,
            'active_team_members': active_team_members,
        })
