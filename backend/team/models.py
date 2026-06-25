"""
Team app models.

Table: team_teammember
Public club team page listing. No relation to the volunteer system — purely for display.
Managed through Django Admin.
"""

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

    class Meta:
        db_table = 'team_teammember'
        ordering = ['display_order', 'full_name']
        verbose_name = 'Team Member'
        verbose_name_plural = 'Team Members'

    def __str__(self):
        return f'{self.full_name} — {self.designation}'
