import uuid
from django.db import models
from django.conf import settings
from core.models import BaseModel


class EventType(models.TextChoices):
    HACKATHON = 'hackathon', 'Hackathon'
    COMPETITION = 'competition', 'Competition'
    WORKSHOP = 'workshop', 'Workshop'
    SEMINAR = 'seminar', 'Seminar'


class EventStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    PUBLISHED = 'published', 'Published'
    CANCELLED = 'cancelled', 'Cancelled'
    COMPLETED = 'completed', 'Completed'


class Event(BaseModel):
    # Required fields
    title = models.CharField(max_length=255)
    description = models.TextField()
    event_type = models.CharField(max_length=20, choices=EventType.choices)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    venue = models.CharField(max_length=255)
    capacity = models.IntegerField()
    registration_deadline = models.DateTimeField()

    # Optional flags
    is_open_to_external = models.BooleanField(default=False)
    is_team_event = models.BooleanField(default=False)
    min_team_size = models.IntegerField(null=True, blank=True)
    max_team_size = models.IntegerField(null=True, blank=True)
    banner_image_url = models.CharField(max_length=500, null=True, blank=True)

    # Status
    status = models.CharField(
        max_length=20,
        choices=EventStatus.choices,
        default=EventStatus.DRAFT
    )

    # FK fields
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_events'
    )

    class Meta:
        db_table = 'events_event'
        ordering = ['-created_at']
        verbose_name = 'Event'
        verbose_name_plural = 'Events'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['start_datetime']),
            models.Index(fields=['event_type']),
        ]

    def __str__(self):
        return self.title

    @property
    def registered_count(self):
        """Count of approved registrations — not pending or waitlisted."""
        return self.registrations.filter(status='approved').count()


class VolunteerAssignment(BaseModel):
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='volunteer_assignments'
    )
    volunteer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='volunteer_assignments'
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='assigned_volunteers'
    )

    class Meta:
        db_table = 'events_volunteerassignment'
        ordering = ['-created_at']
        verbose_name = 'Volunteer Assignment'
        verbose_name_plural = 'Volunteer Assignments'
        constraints = [
            models.UniqueConstraint(
                fields=['event', 'volunteer'],
                name='unique_event_volunteer'
            )
        ]
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['volunteer']),
        ]

    def __str__(self):
        return f"{self.volunteer.email} → {self.event.title}"
