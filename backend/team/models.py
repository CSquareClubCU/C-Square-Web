import uuid
from django.db import models
from core.models import BaseModel


class TeamMember(BaseModel):
    """Public team page listing — no FK to users_user."""
    full_name = models.CharField(max_length=255)
    designation = models.CharField(max_length=100)
    photo_url = models.CharField(max_length=500, null=True, blank=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'team_teammember'
        ordering = ['display_order']
        verbose_name = 'Team Member'
        verbose_name_plural = 'Team Members'
        indexes = [
            models.Index(fields=['display_order']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.full_name} — {self.designation}"
