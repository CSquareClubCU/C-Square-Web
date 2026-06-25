"""
Events app Django Admin registration.
Admins manage events, registrations, and volunteer assignments here.
"""

from django.contrib import admin

from events.models import Event, VolunteerAssignment


class VolunteerAssignmentInline(admin.TabularInline):
    """Show volunteer assignments inline on the Event admin page."""
    model = VolunteerAssignment
    extra = 0
    readonly_fields = ('assigned_by', 'created_at')
    fields = ('volunteer', 'assigned_by', 'created_at')


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'event_type', 'status', 'start_datetime',
        'capacity', 'is_team_event', 'is_open_to_external',
    )
    list_filter = ('status', 'event_type', 'is_team_event', 'is_open_to_external')
    search_fields = ('title', 'venue')
    ordering = ('-start_datetime',)
    readonly_fields = ('id', 'created_by', 'created_at', 'updated_at')
    inlines = [VolunteerAssignmentInline]

    fieldsets = (
        (None, {'fields': ('id', 'title', 'event_type', 'status')}),
        ('Details', {'fields': ('description', 'venue', 'capacity')}),
        ('Schedule', {'fields': ('start_datetime', 'end_datetime', 'registration_deadline')}),
        ('Access', {'fields': ('is_open_to_external', 'is_team_event', 'min_team_size', 'max_team_size')}),
        ('Media', {'fields': ('banner_image_url',)}),
        ('Meta', {'fields': ('created_by', 'created_at', 'updated_at')}),
    )


@admin.register(VolunteerAssignment)
class VolunteerAssignmentAdmin(admin.ModelAdmin):
    list_display = ('volunteer', 'event', 'assigned_by', 'created_at')
    list_filter = ('event',)
    search_fields = ('volunteer__email', 'volunteer__full_name', 'event__title')
    readonly_fields = ('id', 'created_at')
