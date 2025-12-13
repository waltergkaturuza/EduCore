"""
Admin configuration for User app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, RolePermission, AuditLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'role', 'tenant', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'tenant', 'email_verified']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    readonly_fields = ['last_login', 'created_at', 'updated_at']
    ordering = ['email']  # Use email instead of username
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'middle_name', 'last_name', 'phone', 'avatar', 'date_of_birth', 'gender')}),
        ('Permissions', {'fields': ('role', 'tenant', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Security', {'fields': ('email_verified', 'phone_verified', 'two_factor_enabled', 'last_password_change')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'role', 'tenant'),
        }),
    )


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ['role_name', 'tenant', 'created_at']
    list_filter = ['tenant']
    search_fields = ['role_name']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'resource_type', 'tenant', 'created_at']
    list_filter = ['action', 'resource_type', 'created_at']
    search_fields = ['user__email', 'action']
    readonly_fields = ['user', 'tenant', 'action', 'resource_type', 'resource_id', 'details', 'ip_address', 'user_agent', 'created_at']
    date_hierarchy = 'created_at'

