"""
Signals for automatic audit logging.
"""
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone
from apps.core.middleware import get_current_request
from .models import AuditLog


def get_client_ip(request):
    """Get client IP address from request."""
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_action(request, action_type, instance, changes=None, description=''):
    """Create an audit log entry."""
    if not request or not hasattr(request, 'user') or not request.user.is_authenticated:
        return
    
    user = request.user
    impersonated_by = getattr(request, 'impersonated_by', None)
    
    # Get resource info
    resource_type = instance.__class__.__name__
    resource_id = instance.pk
    resource_name = str(instance)
    
    # Get tenant
    tenant = None
    if hasattr(instance, 'tenant'):
        tenant = instance.tenant
    elif hasattr(instance, 'user') and hasattr(instance.user, 'tenant'):
        tenant = instance.user.tenant
    
    # Create audit log
    try:
        AuditLog.objects.create(
            user=user,
            impersonated_by=impersonated_by,
            session_key=request.session.session_key if hasattr(request, 'session') else '',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            action_type=action_type,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_name=resource_name,
            changes=changes or {},
            description=description,
            tenant=tenant,
        )
    except Exception as e:
        # Silently fail to avoid breaking the main operation
        pass


@receiver(pre_save)
def track_changes(sender, instance, **kwargs):
    """Track field changes before save."""
    # Exclude audit logs and system health to avoid recursion
    if sender.__name__ in ['AuditLog', 'SystemHealth']:
        return
    
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            changes = {}
            
            for field in instance._meta.fields:
                field_name = field.name
                if field_name in ['created_at', 'updated_at', 'password']:
                    continue
                
                old_value = getattr(old_instance, field_name, None)
                new_value = getattr(instance, field_name, None)
                
                if old_value != new_value:
                    # Convert to serializable format
                    try:
                        old_value = str(old_value) if old_value is not None else None
                        new_value = str(new_value) if new_value is not None else None
                    except:
                        old_value = repr(old_value) if old_value is not None else None
                        new_value = repr(new_value) if new_value is not None else None
                    
                    changes[field_name] = {
                        'old': old_value,
                        'new': new_value
                    }
            
            if changes:
                instance._audit_changes = changes
        except sender.DoesNotExist:
            pass
        except Exception:
            pass


@receiver(post_save)
def log_create_update(sender, instance, created, **kwargs):
    """Log create and update actions."""
    # Exclude audit logs and system health
    if sender.__name__ in ['AuditLog', 'SystemHealth']:
        return
    
    # Get request from thread local
    try:
        request = get_current_request()
        
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            action_type = 'create' if created else 'update'
            changes = getattr(instance, '_audit_changes', {})
            log_action(request, action_type, instance, changes=changes)
    except Exception:
        pass


@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    """Log delete actions."""
    # Exclude audit logs and system health
    if sender.__name__ in ['AuditLog', 'SystemHealth']:
        return
    
    try:
        request = get_current_request()
        
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            log_action(request, 'delete', instance)
    except Exception:
        pass

