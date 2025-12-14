"""
Serializers for Communications app.
"""
from rest_framework import serializers
from .models import Notification, SMSLog, Message, MessageTemplate


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification."""
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class SMSLogSerializer(serializers.ModelSerializer):
    """Serializer for SMSLog."""
    
    class Meta:
        model = SMSLog
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message."""
    
    sender_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    sender = serializers.IntegerField(source='sender.id', read_only=True)
    recipient = serializers.IntegerField(source='recipient.id', read_only=True)
    
    def get_sender_name(self, obj):
        if hasattr(obj.sender, 'get_full_name'):
            return obj.sender.get_full_name()
        return f"{obj.sender.first_name or ''} {obj.sender.last_name or ''}".strip() or obj.sender.email
    
    def get_recipient_name(self, obj):
        if hasattr(obj.recipient, 'get_full_name'):
            return obj.recipient.get_full_name()
        return f"{obj.recipient.first_name or ''} {obj.recipient.last_name or ''}".strip() or obj.recipient.email
    
    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_name', 'recipient', 'recipient_name',
            'tenant', 'subject', 'body', 'is_read', 'read_at',
            'parent_message', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at', 'read_at')


class MessageTemplateSerializer(serializers.ModelSerializer):
    """Serializer for MessageTemplate."""
    
    class Meta:
        model = MessageTemplate
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')




