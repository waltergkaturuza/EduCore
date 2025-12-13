"""
Extended ViewSets for additional superadmin models.
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
import secrets
import hashlib

from apps.core.permissions import IsSuperAdmin
from apps.tenants.models import Tenant
from apps.users.models import User
from .models import (
    GlobalUser, APIKey, PaymentGateway, PaymentTransaction,
    Lead, Backup, Content, ContentSubscription, Contract,
    GlobalAnnouncement, KnowledgeBaseArticle, OnboardingChecklist
)
try:
    from .serializers_extended import (
        GlobalUserSerializer, APIKeySerializer, PaymentGatewaySerializer,
        PaymentTransactionSerializer, LeadSerializer, BackupSerializer,
        ContentSerializer, ContentSubscriptionSerializer, ContractSerializer,
        GlobalAnnouncementSerializer, KnowledgeBaseArticleSerializer,
        OnboardingChecklistSerializer
    )
except ImportError:
    # Fallback to importing from main serializers if extended doesn't exist
    from .serializers import (
        GlobalUserSerializer, APIKeySerializer, PaymentGatewaySerializer,
        PaymentTransactionSerializer, LeadSerializer, BackupSerializer,
        ContentSerializer, ContentSubscriptionSerializer, ContractSerializer,
        GlobalAnnouncementSerializer, KnowledgeBaseArticleSerializer,
        OnboardingChecklistSerializer
    )
from .utils import export_to_excel, get_client_ip


class GlobalUserViewSet(viewsets.ModelViewSet):
    """ViewSet for Global User (Platform Staff) management."""
    
    queryset = GlobalUser.objects.select_related('user').all()
    serializer_class = GlobalUserSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'department', 'is_active']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'department']
    ordering_fields = ['user__email', 'last_activity', 'created_at']
    ordering = ['user__email']
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a global user."""
        global_user = self.get_object()
        global_user.is_active = True
        global_user.save()
        return Response({'status': 'User activated'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a global user."""
        global_user = self.get_object()
        global_user.is_active = False
        global_user.save()
        return Response({'status': 'User deactivated'})
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export global users to Excel."""
        queryset = self.filter_queryset(self.get_queryset())
        excel_file = export_to_excel(queryset, 'global_users')
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="global_users_export.xlsx"'
        return response


class APIKeyViewSet(viewsets.ModelViewSet):
    """ViewSet for API Key management."""
    
    queryset = APIKey.objects.select_related('tenant').all()
    serializer_class = APIKeySerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tenant', 'is_active']
    search_fields = ['name', 'key', 'tenant__name']
    ordering_fields = ['created_at', 'last_used_at', 'usage_count']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        """Generate API key and secret on creation."""
        # Generate secure key and secret
        key = secrets.token_urlsafe(32)
        secret = secrets.token_urlsafe(32)
        
        serializer.save(key=key, secret=secret)
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate API key and secret."""
        api_key = self.get_object()
        api_key.key = secrets.token_urlsafe(32)
        api_key.secret = secrets.token_urlsafe(32)
        api_key.save()
        
        serializer = self.get_serializer(api_key)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """Revoke an API key."""
        api_key = self.get_object()
        api_key.is_active = False
        api_key.save()
        return Response({'status': 'API key revoked'})
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export API keys to Excel."""
        queryset = self.filter_queryset(self.get_queryset())
        excel_file = export_to_excel(queryset, 'api_keys')
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="api_keys_export.xlsx"'
        return response


class PaymentGatewayViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment Gateway management."""
    
    queryset = PaymentGateway.objects.prefetch_related('enabled_tenants').all()
    serializer_class = PaymentGatewaySerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['gateway_type', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'total_transactions', 'total_amount']
    ordering = ['name']
    
    @action(detail=True, methods=['post'])
    def enable_for_tenant(self, request, pk=None):
        """Enable gateway for a tenant."""
        gateway = self.get_object()
        tenant_id = request.data.get('tenant_id')
        tenant = get_object_or_404(Tenant, id=tenant_id)
        gateway.enabled_tenants.add(tenant)
        return Response({'status': f'Gateway enabled for {tenant.name}'})
    
    @action(detail=True, methods=['post'])
    def disable_for_tenant(self, request, pk=None):
        """Disable gateway for a tenant."""
        gateway = self.get_object()
        tenant_id = request.data.get('tenant_id')
        tenant = get_object_or_404(Tenant, id=tenant_id)
        gateway.enabled_tenants.remove(tenant)
        return Response({'status': f'Gateway disabled for {tenant.name}'})
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get payment gateway statistics."""
        gateways = self.get_queryset()
        stats = []
        for gateway in gateways:
            stats.append({
                'id': gateway.id,
                'name': gateway.name,
                'gateway_type': gateway.gateway_type,
                'total_transactions': gateway.total_transactions,
                'successful_transactions': gateway.successful_transactions,
                'failed_transactions': gateway.failed_transactions,
                'success_rate': gateway.success_rate,
                'total_amount': float(gateway.total_amount),
            })
        return Response(stats)


class PaymentTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Payment Transaction viewing."""
    
    queryset = PaymentTransaction.objects.select_related('tenant', 'invoice', 'gateway').all()
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'tenant', 'gateway', 'currency']
    search_fields = ['transaction_id', 'gateway_transaction_id', 'tenant__name']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export transactions to Excel."""
        queryset = self.filter_queryset(self.get_queryset())
        excel_file = export_to_excel(queryset, 'payment_transactions')
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="payment_transactions_export.xlsx"'
        return response
    
    @action(detail=False, methods=['get'])
    def reconciliation(self, request):
        """Get reconciliation report."""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = self.get_queryset()
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        # Calculate totals
        total_amount = queryset.aggregate(total=Sum('amount'))['total'] or 0
        successful = queryset.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0
        failed = queryset.filter(status='failed').aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'period': {'start': start_date, 'end': end_date},
            'total_transactions': queryset.count(),
            'total_amount': float(total_amount),
            'successful_amount': float(successful),
            'failed_amount': float(failed),
            'success_rate': (float(successful) / float(total_amount) * 100) if total_amount > 0 else 0,
        })


class LeadViewSet(viewsets.ModelViewSet):
    """ViewSet for Lead management."""
    
    queryset = Lead.objects.select_related('assigned_to', 'converted_to_tenant').all()
    serializer_class = LeadSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'source', 'assigned_to']
    search_fields = ['name', 'email', 'school_name', 'phone']
    ordering_fields = ['created_at', 'follow_up_date']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def convert_to_trial(self, request, pk=None):
        """Convert lead to trial tenant."""
        lead = self.get_object()
        
        # Create tenant from lead
        tenant = Tenant.objects.create(
            name=lead.school_name or f"School from {lead.name}",
            code=f"TRIAL-{lead.id}",
            email=lead.email,
            phone=lead.phone or '',
            address=lead.location or '',
            subscription_plan='free',
        )
        
        # Update lead
        lead.status = 'trial'
        lead.trial_started_at = timezone.now()
        lead.trial_ends_at = timezone.now() + timedelta(days=30)
        lead.converted_to_tenant = tenant
        lead.save()
        
        # Create onboarding checklist
        OnboardingChecklist.objects.create(
            tenant=tenant,
            items=[
                {'task': 'Complete school profile', 'completed': False},
                {'task': 'Add students', 'completed': False},
                {'task': 'Configure academic year', 'completed': False},
                {'task': 'Set up classes', 'completed': False},
                {'task': 'Invite teachers', 'completed': False},
            ],
            total_items=5,
            assigned_to=lead.assigned_to,
        )
        
        serializer = self.get_serializer(lead)
        return Response({
            'lead': serializer.data,
            'tenant': {
                'id': tenant.id,
                'name': tenant.name,
                'code': tenant.code,
            }
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def mark_converted(self, request, pk=None):
        """Mark lead as converted to paid."""
        lead = self.get_object()
        lead.status = 'converted'
        lead.converted_at = timezone.now()
        lead.save()
        
        serializer = self.get_serializer(lead)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def conversion_stats(self, request):
        """Get lead conversion statistics."""
        total = self.get_queryset().count()
        by_status = self.get_queryset().values('status').annotate(count=Count('id'))
        conversion_rate = 0
        if total > 0:
            converted = self.get_queryset().filter(status='converted').count()
            conversion_rate = (converted / total) * 100
        
        return Response({
            'total_leads': total,
            'by_status': list(by_status),
            'conversion_rate': conversion_rate,
        })
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export leads to Excel."""
        queryset = self.filter_queryset(self.get_queryset())
        excel_file = export_to_excel(queryset, 'leads')
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="leads_export.xlsx"'
        return response


class BackupViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Backup management (read-only, backups created via tasks)."""
    
    queryset = Backup.objects.select_related('tenant').all()
    serializer_class = BackupSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['backup_type', 'status', 'tenant']
    search_fields = ['tenant__name']
    ordering_fields = ['created_at', 'file_size_mb']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Trigger restore from backup (placeholder for actual restore logic)."""
        backup = self.get_object()
        if backup.status != 'completed':
            return Response(
                {'error': 'Backup is not completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Implement actual restore logic
        return Response({
            'status': 'Restore initiated',
            'backup_id': backup.id,
            'tenant_id': backup.tenant.id,
        })
    
    @action(detail=False, methods=['post'])
    def create_backup(self, request):
        """Create a new backup for a tenant."""
        tenant_id = request.data.get('tenant_id')
        backup_type = request.data.get('backup_type', 'full')
        
        tenant = get_object_or_404(Tenant, id=tenant_id)
        
        # Create backup record (actual backup will be done by Celery task)
        backup = Backup.objects.create(
            tenant=tenant,
            backup_type=backup_type,
            status='pending',
            file_path='',  # Will be set by backup task
        )
        
        # TODO: Queue Celery task for actual backup
        # create_backup_task.delay(backup.id)
        
        serializer = self.get_serializer(backup)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export backup records to Excel."""
        queryset = self.filter_queryset(self.get_queryset())
        excel_file = export_to_excel(queryset, 'backups')
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="backups_export.xlsx"'
        return response


class ContentViewSet(viewsets.ModelViewSet):
    """ViewSet for Content marketplace management."""
    
    queryset = Content.objects.select_related('created_by').prefetch_related('subscriptions').all()
    serializer_class = ContentSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['content_type', 'is_approved', 'is_published', 'is_platform_content']
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'price', 'created_at']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve content for publishing."""
        content = self.get_object()
        content.is_approved = True
        content.save()
        return Response({'status': 'Content approved'})
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish content."""
        content = self.get_object()
        if not content.is_approved:
            return Response(
                {'error': 'Content must be approved before publishing'},
                status=status.HTTP_400_BAD_REQUEST
            )
        content.is_published = True
        content.save()
        return Response({'status': 'Content published'})
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get content marketplace statistics."""
        total = self.get_queryset().count()
        published = self.get_queryset().filter(is_published=True).count()
        total_revenue = ContentSubscription.objects.filter(is_active=True).aggregate(
            total=Sum('amount_paid')
        )['total'] or 0
        
        return Response({
            'total_content': total,
            'published_content': published,
            'total_revenue': float(total_revenue),
        })


class ContentSubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Content Subscription viewing."""
    
    queryset = ContentSubscription.objects.select_related('tenant', 'content').all()
    serializer_class = ContentSubscriptionSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tenant', 'content', 'is_active']
    search_fields = ['tenant__name', 'content__title']
    ordering_fields = ['purchase_date', 'amount_paid']
    ordering = ['-purchase_date']
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export subscriptions to Excel."""
        queryset = self.filter_queryset(self.get_queryset())
        excel_file = export_to_excel(queryset, 'content_subscriptions')
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="content_subscriptions_export.xlsx"'
        return response


class ContractViewSet(viewsets.ModelViewSet):
    """ViewSet for Contract management."""
    
    queryset = Contract.objects.select_related('tenant', 'signed_by').all()
    serializer_class = ContractSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['document_type', 'tenant', 'is_current', 'is_signed']
    search_fields = ['title', 'tenant__name']
    ordering_fields = ['effective_date', 'created_at']
    ordering = ['-effective_date']
    
    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        """Mark contract as signed."""
        contract = self.get_object()
        contract.is_signed = True
        contract.signed_at = timezone.now()
        contract.signed_by = request.user
        contract.save()
        
        serializer = self.get_serializer(contract)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def set_current(self, request, pk=None):
        """Set contract as current version (deactivate others)."""
        contract = self.get_object()
        
        # Deactivate other versions
        Contract.objects.filter(
            tenant=contract.tenant,
            document_type=contract.document_type
        ).update(is_current=False)
        
        contract.is_current = True
        contract.save()
        
        serializer = self.get_serializer(contract)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export contracts to Excel."""
        queryset = self.filter_queryset(self.get_queryset())
        excel_file = export_to_excel(queryset, 'contracts')
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="contracts_export.xlsx"'
        return response


class GlobalAnnouncementViewSet(viewsets.ModelViewSet):
    """ViewSet for Global Announcement management."""
    
    queryset = GlobalAnnouncement.objects.prefetch_related('target_tenants').all()
    serializer_class = GlobalAnnouncementSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_published']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'published_at']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish announcement."""
        announcement = self.get_object()
        announcement.is_published = True
        announcement.published_at = timezone.now()
        announcement.save()
        
        # TODO: Send emails/SMS/in-app notifications via Celery
        # send_announcement_task.delay(announcement.id)
        
        serializer = self.get_serializer(announcement)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish announcement."""
        announcement = self.get_object()
        announcement.is_published = False
        announcement.save()
        return Response({'status': 'Announcement unpublished'})
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export announcements to Excel."""
        queryset = self.filter_queryset(self.get_queryset())
        excel_file = export_to_excel(queryset, 'announcements')
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="announcements_export.xlsx"'
        return response


class KnowledgeBaseArticleViewSet(viewsets.ModelViewSet):
    """ViewSet for Knowledge Base Article management."""
    
    queryset = KnowledgeBaseArticle.objects.select_related('author', 'parent_article').all()
    serializer_class = KnowledgeBaseArticleSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_public', 'is_internal']
    search_fields = ['title', 'content', 'tags']
    ordering_fields = ['title', 'view_count', 'created_at']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        """Auto-generate slug and set author."""
        article = serializer.save(author=self.request.user)
        if not article.slug:
            from django.utils.text import slugify
            article.slug = slugify(article.title)
            article.save()
    
    @action(detail=True, methods=['post'])
    def increment_view(self, request, pk=None):
        """Increment view count (called from frontend)."""
        article = self.get_object()
        article.view_count += 1
        article.save()
        return Response({'view_count': article.view_count})
    
    @action(detail=True, methods=['post'])
    def mark_helpful(self, request, pk=None):
        """Mark article as helpful."""
        article = self.get_object()
        article.helpful_count += 1
        article.save()
        return Response({'helpful_count': article.helpful_count})
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export articles to Excel."""
        queryset = self.filter_queryset(self.get_queryset())
        excel_file = export_to_excel(queryset, 'kb_articles')
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="kb_articles_export.xlsx"'
        return response


class OnboardingChecklistViewSet(viewsets.ModelViewSet):
    """ViewSet for Onboarding Checklist management."""
    
    queryset = OnboardingChecklist.objects.select_related('tenant', 'assigned_to').all()
    serializer_class = OnboardingChecklistSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tenant', 'is_completed', 'assigned_to']
    search_fields = ['tenant__name']
    ordering_fields = ['created_at', 'completed_at']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def complete_item(self, request, pk=None):
        """Mark a checklist item as completed."""
        checklist = self.get_object()
        item_index = request.data.get('item_index')
        
        if item_index is None or item_index >= len(checklist.items):
            return Response(
                {'error': 'Invalid item index'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update item
        checklist.items[item_index]['completed'] = True
        checklist.items[item_index]['completed_at'] = timezone.now().isoformat()
        
        # Update counts
        checklist.completed_items = sum(1 for item in checklist.items if item.get('completed', False))
        checklist.total_items = len(checklist.items)
        
        # Check if all completed
        if checklist.completed_items == checklist.total_items:
            checklist.is_completed = True
            checklist.completed_at = timezone.now()
        
        checklist.save()
        
        serializer = self.get_serializer(checklist)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add a new item to checklist."""
        checklist = self.get_object()
        task = request.data.get('task')
        
        if not task:
            return Response(
                {'error': 'Task is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        checklist.items.append({
            'task': task,
            'completed': False,
        })
        checklist.total_items = len(checklist.items)
        checklist.save()
        
        serializer = self.get_serializer(checklist)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get onboarding statistics."""
        total = self.get_queryset().count()
        completed = self.get_queryset().filter(is_completed=True).count()
        in_progress = total - completed
        
        avg_completion_time = None
        completed_checklists = self.get_queryset().filter(is_completed=True, completed_at__isnull=False)
        if completed_checklists.exists():
            # Calculate average days to complete
            times = []
            for checklist in completed_checklists:
                if checklist.completed_at and checklist.created_at:
                    delta = checklist.completed_at - checklist.created_at
                    times.append(delta.days)
            if times:
                avg_completion_time = sum(times) / len(times)
        
        return Response({
            'total_checklists': total,
            'completed': completed,
            'in_progress': in_progress,
            'completion_rate': (completed / total * 100) if total > 0 else 0,
            'avg_completion_days': avg_completion_time,
        })
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export checklists to Excel."""
        queryset = self.filter_queryset(self.get_queryset())
        excel_file = export_to_excel(queryset, 'onboarding_checklists')
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="onboarding_checklists_export.xlsx"'
        return response

