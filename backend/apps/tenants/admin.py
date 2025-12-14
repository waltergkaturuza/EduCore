"""
Admin configuration for Tenant app.
"""
from django.contrib import admin
from .models import Tenant, TenantSettings


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'slug', 'school_type', 'subscription_plan', 'is_active']
    list_filter = ['school_type', 'subscription_plan', 'is_active', 'province']
    search_fields = ['name', 'code', 'email']
    readonly_fields = ['slug', 'created_at', 'updated_at']


@admin.register(TenantSettings)
class TenantSettingsAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'grading_scale', 'sms_enabled', 'payment_gateway']
    list_filter = ['grading_scale', 'sms_enabled', 'payment_gateway']




