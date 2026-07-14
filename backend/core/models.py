import uuid
from django.db import models


class BaseModel(models.Model):
    """
    Abstract base model inherited by every model in the project.

    Provides:
    - id: UUID v4 primary key (never auto-increment integers)
    - created_at: set once on creation
    - updated_at: auto-updated on every save
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']

class SiteSettings(BaseModel):
    """
    Singleton model for global site settings.
    We just use the first object (or create one if it doesn't exist).
    """
    whatsapp_group_link = models.URLField(max_length=500, blank=True, null=True, help_text="Link to join the WhatsApp Community")

    class Meta:
        verbose_name_plural = "Site Settings"

    @classmethod
    def load(cls):
        from django.db import transaction
        with transaction.atomic():
            obj = cls.objects.select_for_update().first()
            if not obj:
                obj = cls.objects.create()
            return obj
