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
    """
    A club team member shown on the public /team page.
    Soft-deleted by setting is_active=False.
    """
    full_name = models.CharField(max_length=255)
    designation = models.CharField(max_length=100)  # Free text: President, Technical Lead, etc.
    photo_url = models.CharField(max_length=500, null=True, blank=True)
    display_order = models.IntegerField(default=0, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    # User relation (optional, allows linking Core Team card to an actual account for volunteer access, etc.)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='team_profile')

    # Social links
    github_url = models.URLField(max_length=500, null=True, blank=True)
    linkedin_url = models.URLField(max_length=500, null=True, blank=True)
    twitter_url = models.URLField(max_length=500, null=True, blank=True)

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
            if not self.github_url and self.user.github_url:
                self.github_url = self.user.github_url
            if not self.linkedin_url and self.user.linkedin_url:
                self.linkedin_url = self.user.linkedin_url
        super().save(*args, **kwargs)
