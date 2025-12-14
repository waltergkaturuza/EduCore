"""
Communication models: SMS, Notifications, Messages.
"""
from django.db import models
from apps.core.models import BaseModel


class Notification(BaseModel):
    """In-app notification."""
    
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='notifications')
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=50,
        choices=[
            ('info', 'Information'),
            ('success', 'Success'),
            ('warning', 'Warning'),
            ('error', 'Error'),
            ('attendance', 'Attendance'),
            ('fee', 'Fee'),
            ('assignment', 'Assignment'),
            ('grade', 'Grade'),
        ],
        default='info'
    )
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    action_url = models.URLField(blank=True, help_text="URL to navigate when clicked")
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"


class SMSLog(BaseModel):
    """SMS sending log."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='sms_logs', null=True, blank=True)
    recipient_phone = models.CharField(max_length=20)
    message = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('sent', 'Sent'),
            ('delivered', 'Delivered'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    provider = models.CharField(max_length=50, default='twilio')
    provider_message_id = models.CharField(max_length=100, blank=True)
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'sms_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['recipient_phone']),
        ]
    
    def __str__(self):
        return f"SMS to {self.recipient_phone} - {self.status}"


class Message(BaseModel):
    """In-app messaging between users."""
    
    sender = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    recipient = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='received_messages'
    )
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    
    subject = models.CharField(max_length=200, blank=True)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Threading
    parent_message = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replies'
    )
    
    class Meta:
        db_table = 'messages'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sender', 'recipient']),
            models.Index(fields=['recipient', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.sender.email} -> {self.recipient.email}"


class MessageTemplate(BaseModel):
    """Message templates for common communications."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='message_templates', null=True, blank=True)
    name = models.CharField(max_length=100)
    template_type = models.CharField(
        max_length=50,
        choices=[
            ('sms', 'SMS'),
            ('email', 'Email'),
            ('notification', 'Notification'),
        ],
        default='sms'
    )
    subject = models.CharField(max_length=200, blank=True)
    body = models.TextField()
    variables = models.JSONField(
        default=list,
        help_text="List of available variables (e.g., {student_name}, {fee_amount})"
    )
    
    class Meta:
        db_table = 'message_templates'
        unique_together = ['tenant', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.template_type})"




