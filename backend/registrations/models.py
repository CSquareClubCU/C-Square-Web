import uuid
from django.db import models
from django.conf import settings
from core.models import BaseModel


class RegistrationStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'
    WAITLISTED = 'waitlisted', 'Waitlisted'
    CANCELLED = 'cancelled', 'Cancelled'


class TeamStatus(models.TextChoices):
    PENDING_CONFIRMATION = 'pending_confirmation', 'Pending Confirmation'
    PENDING_APPROVAL = 'pending_approval', 'Pending Approval'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'
    CANCELLED = 'cancelled', 'Cancelled'


class Team(BaseModel):
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='teams'
    )
    name = models.CharField(max_length=255)
    leader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='led_teams'
    )
    status = models.CharField(
        max_length=30,
        choices=TeamStatus.choices,
        default=TeamStatus.PENDING_CONFIRMATION
    )

    class Meta:
        db_table = 'registrations_team'
        ordering = ['-created_at']
        verbose_name = 'Team'
        verbose_name_plural = 'Teams'
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['leader']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.name} — {self.event.title}"


class Registration(BaseModel):
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='registrations'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='registrations'
    )
    status = models.CharField(
        max_length=20,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.PENDING
    )
    qr_token = models.UUIDField(unique=True, null=True, blank=True)
    qr_image_url = models.CharField(max_length=500, null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    waitlist_position = models.IntegerField(null=True, blank=True)
    is_team_registration = models.BooleanField(default=False)
    team = models.ForeignKey(
        Team,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registrations'
    )
    registered_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'registrations_registration'
        ordering = ['-created_at']
        verbose_name = 'Registration'
        verbose_name_plural = 'Registrations'
        constraints = [
            models.UniqueConstraint(
                fields=['event', 'user'],
                name='unique_event_user_registration'
            )
        ]
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['qr_token']),
            models.Index(fields=['waitlist_position']),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.event.title} ({self.status})"


class TeamMember(BaseModel):
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='members'
    )
    # NULL until the teammate confirms and logs in
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='team_memberships'
    )
    email = models.EmailField(max_length=254)
    has_confirmed = models.BooleanField(default=False)
    confirmation_token = models.UUIDField(unique=True, null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'registrations_teammember'
        ordering = ['created_at']
        verbose_name = 'Team Member'
        verbose_name_plural = 'Team Members'
        constraints = [
            models.UniqueConstraint(
                fields=['team', 'email'],
                name='unique_team_email'
            )
        ]
        indexes = [
            models.Index(fields=['team']),
            models.Index(fields=['confirmation_token']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return f"{self.email} in {self.team.name}"
