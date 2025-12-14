"""
Admin configuration for Communications app.
"""
from django.contrib import admin
from .models import Notification, SMSLog, Message, MessageTemplate


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__email']


@admin.register(SMSLog)
class SMSLogAdmin(admin.ModelAdmin):
    list_display = ['recipient_phone', 'status', 'provider', 'sent_at', 'created_at']
    list_filter = ['status', 'provider', 'tenant']
    search_fields = ['recipient_phone', 'message']
    readonly_fields = ['provider_message_id', 'sent_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'recipient', 'subject', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['subject', 'body', 'sender__email', 'recipient__email']


@admin.register(MessageTemplate)
class MessageTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template_type', 'tenant']
    list_filter = ['template_type', 'tenant']
    search_fields = ['name', 'subject', 'body']




