"""
Registrations app Django Admin registration.
"""

from django.contrib import admin
from registrations.models import Registration, Team, TeamMember


class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 0
    readonly_fields = ('confirmed_at',)


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'event', 'leader', 'status', 'created_at')
    list_filter = ('status', 'event')
    search_fields = ('name', 'leader__email')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [TeamMemberInline]


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'status', 'is_team_registration', 'registered_at')
    list_filter = ('status', 'is_team_registration', 'event')
    search_fields = ('user__email', 'event__title', 'qr_token')
    readonly_fields = ('id', 'qr_token', 'qr_image_url', 'registered_at', 'approved_at', 'created_at', 'updated_at')

    fieldsets = (
        (None, {'fields': ('id', 'event', 'user', 'status')}),
        ('Team Info', {'fields': ('is_team_registration', 'team')}),
        ('Rejection', {'fields': ('rejection_reason',)}),
        ('Waitlist', {'fields': ('waitlist_position',)}),
        ('QR Info', {'fields': ('qr_token', 'qr_image_url')}),
        ('Timestamps', {'fields': ('registered_at', 'approved_at', 'created_at', 'updated_at')}),
    )
