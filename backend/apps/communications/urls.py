"""
URLs for Communications app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationViewSet, SMSLogViewSet,
    MessageViewSet, MessageTemplateViewSet
)

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'sms-logs', SMSLogViewSet, basename='sms-log')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'message-templates', MessageTemplateViewSet, basename='message-template')

urlpatterns = [
    path('', include(router.urls)),
]



