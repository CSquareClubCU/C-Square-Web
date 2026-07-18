"""
Team app models.

Table: team_teammember
Public club team page listing. No relation to the volunteer system — purely for display.
Managed through Django Admin.
"""

from django.conf import settings
from django.db import models
from core.models import BaseModel


class TeamMember(BaseModel):
    CATEGORY_CHOICES = [
        ('Leadership', 'Leadership'),
        ('Technical', 'Technical'),
        ('Design', 'Design'),
        ('Media', 'Media'),
        ('Marketing', 'Marketing'),
        ('Volunteers', 'Volunteers'),
        ('Faculty', 'Faculty'),
    ]

    """
    A club team member shown on the public /team page.
    Soft-deleted by setting is_active=False.
    """
    full_name = models.CharField(max_length=255)
    designation = models.CharField(max_length=100)  # Free text: President, Technical Lead, etc.
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Volunteers')
    photo_url = models.CharField(max_length=500, null=True, blank=True)
    display_order = models.IntegerField(default=0, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    # User relation (optional, allows linking Core Team card to an actual account for volunteer access, etc.)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='team_profile')

    # Social links
    github_url = models.URLField(max_length=500, null=True, blank=True)
    linkedin_url = models.URLField(max_length=500, null=True, blank=True)

    class Meta:
        db_table = 'team_teammember'
        ordering = ['display_order', 'full_name']
        verbose_name = 'Team Member'
        verbose_name_plural = 'Team Members'

    def __str__(self):
        return f'{self.full_name} — {self.designation}'

    def save(self, *args, **kwargs):
        # Auto-fetch socials from the linked user profile if they aren't set
        if self.user:
            new_fields = []
            if not self.github_url and self.user.github_url:
                self.github_url = self.user.github_url
                new_fields.append('github_url')
            if not self.linkedin_url and self.user.linkedin_url:
                self.linkedin_url = self.user.linkedin_url
                new_fields.append('linkedin_url')
            
            if new_fields and 'update_fields' in kwargs:
                kwargs['update_fields'] = list(set(kwargs['update_fields']) | set(new_fields))
        super().save(*args, **kwargs)



# ---------------------------------------------------------------------------
# Storage cleanup signals
# ---------------------------------------------------------------------------

from django.db.models.signals import post_delete, pre_save, post_save
from django.dispatch import receiver
from django.db import transaction


@receiver(post_delete, sender=TeamMember)
def cleanup_team_member_photo(sender, instance, **kwargs):
    """Delete the team member photo from Azure Blob Storage when a member is deleted."""
    if instance.photo_url:
        url = instance.photo_url
        from core.utils.storage import delete_blob_from_url
        def _delete():
            try:
                delete_blob_from_url(url)
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning(
                    'Failed to delete photo for team member %s: %s', instance.id, exc
                )
        transaction.on_commit(_delete)


@receiver(post_delete, sender=TeamMember)
@receiver(post_save, sender=TeamMember)
def normalize_team_display_order(sender, instance, **kwargs):
    """
    Ensure display_order has no gaps or duplicates.
    When a collision occurs, the most recently updated member wins.
    If display_order is 0, it is moved to the end.
    """
    from django.db import transaction

    def _do_normalize():
        # Fetch all members
        members = list(TeamMember.objects.all())
        # Sort: display_order > 0 first, then newest updated_at wins tiebreakers
        members.sort(key=lambda m: (m.display_order if m.display_order > 0 else 999999, -m.updated_at.timestamp()))
        
        updates = []
        for index, member in enumerate(members, start=1):
            if member.display_order != index:
                member.display_order = index
                updates.append(member)
        
        if updates:
            # bulk_update avoids recursion since it doesn't trigger save() or signals
            TeamMember.objects.bulk_update(updates, ['display_order'])

    transaction.on_commit(_do_normalize)

@receiver(pre_save, sender=TeamMember)
def cleanup_old_team_member_photo_on_replace(sender, instance, **kwargs):
    """
    When a team member's photo is replaced, delete the old blob.
    Handles extension changes (jpg -> webp etc.) since upload_to_blob
    uses overwrite=True only for the exact same path.
    """
    if not instance.pk:
        return
    try:
        old = TeamMember.objects.only('photo_url').get(pk=instance.pk)
    except TeamMember.DoesNotExist:
        return
    if old.photo_url and old.photo_url != instance.photo_url:
        url = old.photo_url
        from core.utils.storage import delete_blob_from_url
        def _delete():
            try:
                delete_blob_from_url(url)
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning(
                    'Failed to delete old photo for team member %s: %s', instance.id, exc
                )
        transaction.on_commit(_delete)
