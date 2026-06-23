from django.contrib import admin
from .models import Event, VolunteerAssignment


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type', 'status', 'start_datetime', 'capacity', 'created_by']
    list_filter = ['status', 'event_type', 'is_team_event', 'is_open_to_external']
    search_fields = ['title', 'venue']
    readonly_fields = ['id', 'created_at', 'updated_at', 'created_by']
    ordering = ['-start_datetime']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(VolunteerAssignment)
class VolunteerAssignmentAdmin(admin.ModelAdmin):
    list_display = ['volunteer', 'event', 'assigned_by', 'created_at']
    list_filter = ['event']
    search_fields = ['volunteer__email', 'volunteer__full_name', 'event__title']
    readonly_fields = ['id', 'created_at']
