"""
Views for Tenant app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from apps.students.models import Student
from apps.core.permissions import IsTenantAdmin, IsSuperAdmin
from .models import Tenant, TenantSettings
from .serializers import TenantSerializer, TenantCreateSerializer, TenantSettingsSerializer


class TenantViewSet(viewsets.ModelViewSet):
    """ViewSet for Tenant management."""
    
    queryset = Tenant.objects.filter(is_deleted=False)
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['subscription_plan', 'is_active', 'school_type']
    search_fields = ['name', 'code', 'email', 'city']
    ordering_fields = ['name', 'created_at', 'subscription_plan']
    ordering = ['name']
    
    def get_permissions(self):
        """Allow superadmin to create/update/delete, others can only view their tenant."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TenantCreateSerializer
        return TenantSerializer
    
    def get_queryset(self):
        """Filter by current user's tenant with advanced filtering."""
        user = self.request.user
        queryset = self.queryset
        
        # Superadmin can see all tenants with enhanced features
        if user.role == 'superadmin':
            # Annotate with usage stats (use distinct to avoid duplicates)
            queryset = queryset.annotate(
                student_count=Count('students', distinct=True),
                teacher_count=Count('users', filter=Q(users__role='teacher', users__is_active=True), distinct=True)
            )
            return queryset
        
        # Regular users can only see their own tenant
        if hasattr(user, 'tenant_id') and user.tenant_id:
            return queryset.filter(id=user.tenant_id)
        
        # If user has no tenant, return empty queryset
        return queryset.none()
    
    @action(detail=True, methods=['get', 'patch'])
    def settings(self, request, pk=None):
        """Get or update tenant settings."""
        tenant = self.get_object()
        settings, created = TenantSettings.objects.get_or_create(tenant=tenant)
        
        if request.method == 'GET':
            serializer = TenantSettingsSerializer(settings)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = TenantSettingsSerializer(settings, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a tenant."""
        tenant = self.get_object()
        tenant.is_active = True
        tenant.save()
        return Response({'status': 'Tenant activated'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a tenant."""
        tenant = self.get_object()
        tenant.is_active = False
        tenant.save()
        return Response({'status': 'Tenant deactivated'})

