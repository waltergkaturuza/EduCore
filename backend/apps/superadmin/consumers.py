"""
WebSocket consumers for real-time updates.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from channels.auth import get_user
from apps.superadmin.models import SystemHealth, AuditLog
from apps.tenants.models import Tenant


class SystemMonitoringConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time system monitoring."""
    
    async def connect(self):
        """Accept connection and add to monitoring group."""
        # Get user from scope (authentication handled by AuthMiddlewareStack)
        user = await get_user(self.scope)
        
        # Only allow authenticated superadmin users
        if not user or not user.is_authenticated or user.role != 'superadmin':
            await self.close()
            return
        
        self.group_name = 'system_monitoring'
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial system health data
        health_data = await self.get_latest_health()
        await self.send(text_data=json.dumps({
            'type': 'system_health',
            'data': health_data
        }))
    
    async def disconnect(self, close_code):
        """Remove from group on disconnect."""
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle messages from client."""
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        if message_type == 'subscribe':
            # Client wants to subscribe to specific updates
            await self.channel_layer.group_add(
                f"monitoring_{message_type}",
                self.channel_name
            )
    
    async def system_health_update(self, event):
        """Send system health update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'system_health',
            'data': event['data']
        }))
    
    async def audit_log_update(self, event):
        """Send audit log update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'audit_log',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_latest_health(self):
        """Get latest system health data."""
        health = SystemHealth.objects.first()
        if health:
            return {
                'response_time_avg': getattr(health, 'response_time_avg', 0),
                'response_time_p95': getattr(health, 'response_time_p95', 0),
                'error_rate': getattr(health, 'error_rate', 0),
                'cpu_usage': getattr(health, 'cpu_usage', 0),
                'memory_usage': getattr(health, 'memory_usage', 0),
                'storage_used_gb': getattr(health, 'storage_used_gb', 0),
                'storage_total_gb': getattr(health, 'storage_total_gb', 0),
                'active_users': getattr(health, 'active_users', 0),
                'api_requests_24h': getattr(health, 'api_requests_24h', 0),
                'background_jobs_queued': getattr(health, 'background_jobs_queued', 0),
                'background_jobs_failed': getattr(health, 'background_jobs_failed', 0),
            }
        return {}


class PlatformUpdatesConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for platform-wide updates."""
    
    async def connect(self):
        """Accept connection for platform updates."""
        # Get user from scope (authentication handled by AuthMiddlewareStack)
        user = await get_user(self.scope)
        
        # Only allow authenticated superadmin users
        if not user or not user.is_authenticated or user.role != 'superadmin':
            await self.close()
            return
        
        self.group_name = 'platform_updates'
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Remove from group on disconnect."""
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def tenant_update(self, event):
        """Send tenant update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'tenant_update',
            'data': event['data']
        }))
    
    async def subscription_update(self, event):
        """Send subscription update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'subscription_update',
            'data': event['data']
        }))
    
    async def ticket_update(self, event):
        """Send support ticket update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'ticket_update',
            'data': event['data']
        }))

