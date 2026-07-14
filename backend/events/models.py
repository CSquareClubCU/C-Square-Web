"""
Events app models.

Tables:
- events_event           — all club events
- events_volunteerassignment — links volunteers to specific events
"""

from django.conf import settings
from django.db import models
from django.utils.text import slugify

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
    """
    Stores all club events — hackathons, competitions, workshops, seminars.

    Only 'published' events appear on the public listing.
    'capacity' counts approved registrations only.
    Team size fields are only relevant when is_team_event=True.
    """

    # Required fields
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    description = models.TextField()
    event_type = models.CharField(
        max_length=20,
        choices=EventType.choices,
        db_index=True,
    )
    start_datetime = models.DateTimeField(db_index=True)
    end_datetime = models.DateTimeField()
    venue = models.CharField(max_length=255)
    capacity = models.PositiveIntegerField()
    registration_deadline = models.DateTimeField()

    # Access control
    is_open_to_external = models.BooleanField(default=False)

    # Team event flags
    is_team_event = models.BooleanField(default=False)
    min_team_size = models.PositiveIntegerField(null=True, blank=True)
    max_team_size = models.PositiveIntegerField(null=True, blank=True)

    # Engagement & Features
    is_flagship = models.BooleanField(default=False)
    points = models.IntegerField(default=100)

    # Media
    banner_image_url = models.CharField(max_length=500, null=True, blank=True)

    # Enhancements
    prizes = models.JSONField(null=True, blank=True)
    rules = models.TextField(null=True, blank=True)
    contact_name = models.CharField(max_length=255, null=True, blank=True)
    contact_email = models.EmailField(null=True, blank=True)
    is_registration_open = models.BooleanField(default=True)

    # Status
    status = models.CharField(
        max_length=20,
        choices=EventStatus.choices,
        default=EventStatus.DRAFT,
        db_index=True,
    )

    # FK fields
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_events',
    )

    class Meta:
        db_table = 'events_event'
        ordering = ['-start_datetime']
        verbose_name = 'Event'
        verbose_name_plural = 'Events'
        indexes = [
            models.Index(fields=['status', 'start_datetime']),
        ]

    def _generate_unique_slug(self):
        """Generate a URL-safe slug from the title, appending a counter to ensure uniqueness."""
        base_slug = slugify(self.title)
        if not base_slug:
            base_slug = 'event'
        slug = base_slug
        counter = 2
        qs = Event.objects.exclude(pk=self.pk) if self.pk else Event.objects.all()
        while slug == 'past' or qs.filter(slug=slug).exists():
            slug = f'{base_slug}-{counter}'
            counter += 1
        return slug

    def save(self, *args, **kwargs):
        from django.db import IntegrityError
        if self.slug:
            super().save(*args, **kwargs)
            return

        self.slug = self._generate_unique_slug()
        max_retries = 5
        for _ in range(max_retries):
            try:
                super().save(*args, **kwargs)
                return
            except IntegrityError:
                # To bypass transaction isolation issues, we can just append a random string
                import uuid
                self.slug = f"{self._generate_unique_slug()}-{uuid.uuid4().hex[:6]}"
        
        # Final attempt
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class VolunteerAssignment(BaseModel):
    """
    Links a volunteer (role=volunteer) to a specific event.

    A volunteer can ONLY access check-in for events they are assigned to.
    This is checked on every attendance API request.
    UNIQUE constraint on (event, volunteer) — one assignment per volunteer per event.
    """

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='volunteer_assignments',
        db_index=True,
    )
    volunteer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='volunteer_assignments',
        db_index=True,
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_volunteers',
    )

    class Meta:
        db_table = 'events_volunteerassignment'
        ordering = ['-created_at']
        verbose_name = 'Volunteer Assignment'
        verbose_name_plural = 'Volunteer Assignments'
        constraints = [
            models.UniqueConstraint(
                fields=['event', 'volunteer'],
                name='unique_volunteer_per_event',
            )
        ]

    def __str__(self):
        return f"{self.volunteer.email} -> {self.event.title}"


class PastEvent(BaseModel):
    """
    Model for the homepage's Scroll Gallery of past events.
    Completely independent from the main Event model to allow adding purely historical events.
    """
    title = models.CharField(max_length=255)
    logo_url = models.CharField(max_length=500, null=True, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'events_pastevent'
        ordering = ['order', '-created_at']
        verbose_name = 'Past Event'
        verbose_name_plural = 'Past Events'

    def __str__(self):
        return self.title
