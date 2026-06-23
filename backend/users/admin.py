from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'full_name', 'role', 'is_cu_student', 'is_active', 'date_joined']
    list_filter = ['role', 'is_cu_student', 'is_active']
    search_fields = ['email', 'full_name', 'student_uid']
    readonly_fields = ['id', 'date_joined', 'last_login', 'created_at', 'updated_at', 'is_cu_student']
    ordering = ['-date_joined']
    fieldsets = (
        ('Account', {'fields': ('id', 'email', 'role', 'is_active', 'is_staff', 'is_cu_student', 'date_joined', 'last_login')}),
        ('Profile', {'fields': ('full_name', 'student_uid', 'branch', 'year', 'semester', 'batch', 'phone')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
