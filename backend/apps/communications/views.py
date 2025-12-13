"""
Views for Communications app.
"""
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification, SMSLog, Message, MessageTemplate
from .serializers import (
    NotificationSerializer, SMSLogSerializer,
    MessageSerializer, MessageTemplateSerializer
)
from .services import sms_service, notification_service


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for Notification."""
    
    queryset = Notification.objects.filter(is_deleted=False)
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by current user."""
        return self.queryset.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read."""
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all marked as read'})


class SMSLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for SMSLog (read-only for admins)."""
    
    queryset = SMSLog.objects.filter(is_deleted=False)
    serializer_class = SMSLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        if user.tenant:
            return self.queryset.filter(tenant=user.tenant)
        return self.queryset.none()


class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet for Message."""
    
    queryset = Message.objects.filter(is_deleted=False)
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by current user (sent or received)."""
        user = self.request.user
        return self.queryset.filter(
            Q(sender=user) | Q(recipient=user)
        )
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark message as read."""
        message = self.get_object()
        if message.recipient == request.user:
            message.is_read = True
            message.save()
            return Response({'status': 'marked as read'})
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)


class MessageTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for MessageTemplate."""
    
    queryset = MessageTemplate.objects.filter(is_deleted=False)
    serializer_class = MessageTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        queryset = self.queryset
        if user.tenant:
            queryset = queryset.filter(Q(tenant=user.tenant) | Q(tenant__isnull=True))
        return queryset

