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
    
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.full_name', read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class MessageTemplateSerializer(serializers.ModelSerializer):
    """Serializer for MessageTemplate."""
    
    class Meta:
        model = MessageTemplate
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')



