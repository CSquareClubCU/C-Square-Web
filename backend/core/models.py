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
