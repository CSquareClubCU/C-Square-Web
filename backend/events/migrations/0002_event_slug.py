"""
Migration: Add slug field to events_event table.
Backfills slugs for existing events using Django's slugify.
"""

from django.db import migrations, models
from django.utils.text import slugify


def backfill_slugs(apps, schema_editor):
    """Generate slugs for any existing events that don't have one."""
    Event = apps.get_model('events', 'Event')
    used_slugs = set()

    for event in Event.objects.order_by('created_at'):
        base_slug = slugify(event.title) or 'event'
        slug = base_slug
        counter = 2
        while slug in used_slugs:
            slug = f'{base_slug}-{counter}'
            counter += 1
        event.slug = slug
        event.save(update_fields=['slug'])
        used_slugs.add(slug)


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0001_initial'),
    ]

    operations = [
        # Step 1: Add slug as nullable to allow backfill
        migrations.AddField(
            model_name='event',
            name='slug',
            field=models.SlugField(max_length=280, blank=True, default=''),
            preserve_default=False,
        ),
        # Step 2: Backfill slugs for existing events
        migrations.RunPython(backfill_slugs, migrations.RunPython.noop),
        # Step 3: Make unique and non-nullable
        migrations.AlterField(
            model_name='event',
            name='slug',
            field=models.SlugField(max_length=280, unique=True),
        ),
    ]
