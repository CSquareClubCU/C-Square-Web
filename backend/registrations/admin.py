from django.contrib import admin
from .models import Registration, Team, TeamMember


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ['user', 'event', 'status', 'registered_at', 'approved_at']
    list_filter = ['status', 'is_team_registration']
    search_fields = ['user__email', 'user__full_name', 'event__title']
    readonly_fields = ['id', 'qr_token', 'qr_image_url', 'registered_at', 'approved_at', 'created_at', 'updated_at']
    ordering = ['-registered_at']


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'event', 'leader', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['name', 'leader__email', 'event__title']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ['email', 'team', 'has_confirmed', 'confirmed_at']
    list_filter = ['has_confirmed']
    search_fields = ['email', 'team__name']
    readonly_fields = ['id', 'confirmation_token', 'confirmed_at', 'created_at']
