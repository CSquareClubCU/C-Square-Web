"""Team app Django Admin."""

from django.contrib import admin
from team.models import TeamMember


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'designation', 'display_order', 'is_active')
    list_filter = ('is_active',)
    list_editable = ('display_order', 'is_active')
    search_fields = ('full_name', 'designation')
    readonly_fields = ('id', 'created_at', 'updated_at')
