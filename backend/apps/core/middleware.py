"""
Custom middleware for request tracking and audit logging.
"""
from threading import local
from django.utils.deprecation import MiddlewareMixin

_thread_locals = local()


def get_current_request():
    """Get the current request from thread local storage."""
    return getattr(_thread_locals, 'request', None)


class ThreadLocalMiddleware(MiddlewareMixin):
    """Store request in thread local for audit logging."""
    
    def process_request(self, request):
        """Store request in thread local."""
        _thread_locals.request = request
    
    def process_response(self, request, response):
        """Clear request from thread local."""
        if hasattr(_thread_locals, 'request'):
            delattr(_thread_locals, 'request')
        return response


class TenantMiddleware(MiddlewareMixin):
    """Middleware to set tenant context from authenticated user."""
    
    def process_request(self, request):
        """Set tenant on request from authenticated user."""
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Set tenant on request for easy access
            request.tenant = getattr(request.user, 'tenant', None)
        else:
            request.tenant = None
        return None
