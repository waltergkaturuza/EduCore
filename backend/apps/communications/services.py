"""
Communication services: SMS, Email, Notifications.
"""
import logging
from django.conf import settings
from twilio.rest import Client as TwilioClient
from .models import SMSLog, Notification, Message

logger = logging.getLogger(__name__)


class SMSService:
    """Service for sending SMS messages."""
    
    def __init__(self):
        self.twilio_client = None
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            try:
                self.twilio_client = TwilioClient(
                    settings.TWILIO_ACCOUNT_SID,
                    settings.TWILIO_AUTH_TOKEN
                )
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")
    
    def send_sms(self, phone_number, message, tenant=None):
        """Send SMS message."""
        if not self.twilio_client:
            logger.warning("Twilio client not configured")
            return None
        
        try:
            # Log SMS attempt
            sms_log = SMSLog.objects.create(
                tenant=tenant,
                recipient_phone=phone_number,
                message=message,
                status='pending',
                provider='twilio'
            )
            
            # Send via Twilio
            twilio_message = self.twilio_client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number
            )
            
            # Update log
            sms_log.status = 'sent'
            sms_log.provider_message_id = twilio_message.sid
            sms_log.sent_at = twilio_message.date_sent
            sms_log.save()
            
            return sms_log
        
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            if sms_log:
                sms_log.status = 'failed'
                sms_log.error_message = str(e)
                sms_log.save()
            return None


class NotificationService:
    """Service for creating notifications."""
    
    @staticmethod
    def create_notification(user, title, message, notification_type='info', tenant=None, action_url=''):
        """Create a notification for a user."""
        return Notification.objects.create(
            user=user,
            tenant=tenant,
            title=title,
            message=message,
            notification_type=notification_type,
            action_url=action_url
        )
    
    @staticmethod
    def create_bulk_notifications(users, title, message, notification_type='info', tenant=None):
        """Create notifications for multiple users."""
        notifications = []
        for user in users:
            notifications.append(
                Notification(
                    user=user,
                    tenant=tenant,
                    title=title,
                    message=message,
                    notification_type=notification_type
                )
            )
        return Notification.objects.bulk_create(notifications)


# Singleton instances
sms_service = SMSService()
notification_service = NotificationService()




