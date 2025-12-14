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
    
    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """Get all conversations (grouped by other user)."""
        from django.db.models import Max, Count, Value, IntegerField
        from django.db.models.functions import Coalesce
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        user = request.user
        
        # Get all unique conversation partners with their latest message time
        sent_messages = self.get_queryset().filter(sender=user)
        received_messages = self.get_queryset().filter(recipient=user)
        
        # Combine all partner IDs
        sent_partner_ids = sent_messages.values_list('recipient_id', flat=True).distinct()
        received_partner_ids = received_messages.values_list('sender_id', flat=True).distinct()
        all_partner_ids = set(list(sent_partner_ids) + list(received_partner_ids))
        
        if not all_partner_ids:
            return Response([])
        
        # Get partner users
        partners = User.objects.filter(id__in=all_partner_ids)
        
        # Build conversation list
        conversations = []
        for partner in partners:
            # Get messages between user and this partner
            conversation_messages = self.get_queryset().filter(
                Q(sender=user, recipient=partner) | Q(sender=partner, recipient=user)
            )
            
            # Get last message
            last_message = conversation_messages.order_by('-created_at').first()
            
            # Count unread messages (messages sent by partner to user that are unread)
            unread_count = conversation_messages.filter(
                sender=partner, recipient=user, is_read=False
            ).count()
            
            conversations.append({
                'partner_id': partner.id,
                'partner_name': partner.get_full_name() if hasattr(partner, 'get_full_name') else f"{partner.first_name or ''} {partner.last_name or ''}".strip() or partner.email,
                'partner_email': partner.email,
                'partner_role': getattr(partner, 'role', None),
                'last_message': MessageSerializer(last_message).data if last_message else None,
                'unread_count': unread_count,
                'last_message_time': last_message.created_at.isoformat() if last_message else None
            })
        
        # Sort by last message time (most recent first)
        conversations.sort(
            key=lambda x: x['last_message_time'] if x['last_message_time'] else '',
            reverse=True
        )
        
        return Response(conversations)
    
    @action(detail=False, methods=['get'])
    def conversation(self, request):
        """Get messages with a specific user."""
        partner_id = request.query_params.get('partner_id')
        if not partner_id:
            return Response({'error': 'partner_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            partner_id_int = int(partner_id)
        except ValueError:
            return Response({'error': 'Invalid partner_id'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        messages = self.get_queryset().filter(
            Q(sender=user, recipient_id=partner_id_int) | Q(sender_id=partner_id_int, recipient=user)
        ).order_by('created_at')
        
        # Mark messages as read
        from django.utils import timezone
        messages.filter(recipient=user, is_read=False).update(is_read=True, read_at=timezone.now())
        
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)


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

