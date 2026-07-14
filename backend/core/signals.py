from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from events.models import Event
from registrations.models import Registration
from attendance.models import AttendanceRecord


def invalidate_public_stats(sender, **kwargs):
    cache.delete('public_stats')


@receiver(post_save, sender=Event)
@receiver(post_delete, sender=Event)
@receiver(post_save, sender=Registration)
@receiver(post_delete, sender=Registration)
@receiver(post_save, sender=AttendanceRecord)
@receiver(post_delete, sender=AttendanceRecord)
def handle_model_changes(sender, **kwargs):
    invalidate_public_stats(sender, **kwargs)

