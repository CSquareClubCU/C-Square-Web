"""
Registrations app models.

Tables:
- registrations_registration
- registrations_team
- registrations_teammember
"""

from django.conf import settings
from django.db import models

from core.models import BaseModel
from events.models import Event


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
    """
    Groups individual registrations for team events.
    """
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='teams',
        db_index=True,
    )
    name = models.CharField(max_length=255)
    leader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='led_teams',
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=TeamStatus.choices,
        default=TeamStatus.PENDING_CONFIRMATION,
        db_index=True,
    )

    class Meta:
        db_table = 'registrations_team'
        ordering = ['-created_at']
        verbose_name = 'Team'
        verbose_name_plural = 'Teams'

    def __str__(self):
        return f'{self.name} ({self.event.title})'


class TeamMember(BaseModel):
    """
    Links individual users to a team.
    """
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='members',
        db_index=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='team_memberships',
    )
    email = models.EmailField(max_length=254)
    has_confirmed = models.BooleanField(default=False)
    confirmation_token = models.UUIDField(unique=True, null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'registrations_teammember'
        ordering = ['-created_at']
        verbose_name = 'Team Member'
        verbose_name_plural = 'Team Members'
        constraints = [
            models.UniqueConstraint(
                fields=['team', 'email'],
                name='unique_email_per_team',
            )
        ]

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.email} -> {self.team.name}'


class Registration(BaseModel):
    """
    Core registration table. Links a user to an event with a status and QR token.
    """
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='registrations',
        db_index=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='registrations',
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.PENDING,
        db_index=True,
    )
    qr_token = models.UUIDField(unique=True, null=True, blank=True)
    qr_image_url = models.CharField(max_length=500, null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    waitlist_position = models.IntegerField(null=True, blank=True, db_index=True)
    
    is_team_registration = models.BooleanField(default=False)
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='registrations',
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
                name='unique_user_per_event',
            )
        ]

    def __str__(self):
        return f'{self.user.email} -> {self.event.title}'

from django.db.models.signals import pre_delete
from django.dispatch import receiver

@receiver(pre_delete, sender=Registration)
def cleanup_registration_qr(sender, instance, **kwargs):
    if instance.qr_image_url:
        from django.conf import settings
        from django.core.files.storage import default_storage
        
        from urllib.parse import urlparse
        parsed_url = urlparse(instance.qr_image_url)
        
        # Check if local storage
        if parsed_url.netloc == 'localhost:8000' and parsed_url.path.startswith('/media/'):
            path = parsed_url.path.replace('/media/', '', 1)
            if default_storage.exists(path):
                default_storage.delete(path)
        elif parsed_url.netloc.endswith('.blob.core.windows.net'):
            # Delete from Azure blob
            from azure.storage.blob import BlobServiceClient
            if getattr(settings, 'AZURE_STORAGE_CONNECTION_STRING', None):
                try:
                    blob_service_client = BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)
                    blob_client = blob_service_client.get_blob_client(
                        container=settings.AZURE_STORAGE_CONTAINER_NAME,
                        blob=f'qr-codes/{instance.id}/qr.png'
                    )
                    blob_client.delete_blob()
                except Exception:
                    pass
