"""
WebSocket routing for superadmin app.
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/superadmin/monitoring/$', consumers.SystemMonitoringConsumer.as_asgi()),
    re_path(r'ws/superadmin/updates/$', consumers.PlatformUpdatesConsumer.as_asgi()),
]



