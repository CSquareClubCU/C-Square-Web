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
    faqs = models.JSONField(null=True, blank=True)
    contact_name = models.CharField(max_length=255, null=True, blank=True)
    contact_email = models.EmailField(null=True, blank=True)
    is_registration_open = models.BooleanField(default=True)
    is_checkin_active = models.BooleanField(
        default=False,
        help_text="If True, volunteers can check in users. Admins can always check in."
    )
    requires_approval = models.BooleanField(
        default=True,
        help_text="If True, registrations require admin approval. If False, they are automatically Approved (unless capacity is full)."
    )
    registration_fee = models.PositiveIntegerField(
        default=0,
        help_text="Registration fee in INR. 0 means free."
    )

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


# ---------------------------------------------------------------------------
# Storage cleanup signals
# ---------------------------------------------------------------------------

from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
from django.db import transaction


@receiver(post_delete, sender=Event)
def cleanup_event_banner(sender, instance, **kwargs):
    """Delete the event banner from Azure Blob Storage when an Event is deleted."""
    if instance.banner_image_url:
        url = instance.banner_image_url
        from core.utils.storage import delete_blob_from_url
        def _delete():
            try:
                delete_blob_from_url(url)
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning(
                    'Failed to delete banner for event %s: %s', instance.id, exc
                )
        transaction.on_commit(_delete)


@receiver(pre_save, sender=Event)
def cleanup_old_event_banner_on_replace(sender, instance, **kwargs):
    """
    When a banner is replaced with a new file, delete the old blob.
    Handles the case where the extension changes (e.g. jpg -> webp),
    since upload_to_blob uses overwrite=True only for the same path.
    """
    if not instance.pk:
        return  # New event, nothing to clean up
    try:
        old = Event.objects.only('banner_image_url').get(pk=instance.pk)
    except Event.DoesNotExist:
        return
    if old.banner_image_url and old.banner_image_url != instance.banner_image_url:
        url = old.banner_image_url
        from core.utils.storage import delete_blob_from_url
        def _delete():
            try:
                delete_blob_from_url(url)
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning(
                    'Failed to delete old banner for event %s: %s', instance.id, exc
                )
        transaction.on_commit(_delete)


@receiver(post_delete, sender=PastEvent)
def cleanup_past_event_logo(sender, instance, **kwargs):
    """Delete the past event logo from Azure Blob Storage when a PastEvent is deleted."""
    if instance.logo_url:
        url = instance.logo_url
        from core.utils.storage import delete_blob_from_url
        def _delete():
            try:
                delete_blob_from_url(url)
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning(
                    'Failed to delete logo for past event %s: %s', instance.id, exc
                )
        transaction.on_commit(_delete)

@receiver(post_delete, sender=PastEvent)
@receiver(post_save, sender=PastEvent)
def normalize_past_event_order(sender, instance, **kwargs):
    """
    Ensure order has no gaps or duplicates.
    When a collision occurs, the most recently updated event wins.
    If order is 0, it is moved to the front.
    """
    from django.db import transaction

    def _do_normalize():
        # Fetch all events
        events = list(PastEvent.objects.all())
        # Sort: order directly, then newest updated_at wins tiebreakers
        events.sort(key=lambda m: (m.order, -m.updated_at.timestamp()))
        
        updates = []
        for index, evt in enumerate(events, start=1):
            if evt.order != index:
                evt.order = index
                updates.append(evt)
        
        if updates:
            # bulk_update avoids recursion since it doesn't trigger save() or signals
            PastEvent.objects.bulk_update(updates, ['order'])

    transaction.on_commit(_do_normalize)
