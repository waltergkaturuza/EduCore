"""
Views for Superadmin/Platform Owner functionality.
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Avg, F
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
import json

from apps.core.permissions import IsSuperAdmin
from apps.tenants.models import Tenant
from apps.users.models import User
from apps.students.models import Student
from .models import (
    SubscriptionPlan, TenantSubscription, Invoice,
    SupportTicket, TicketReply, AuditLog,
    ImpersonationSession, FeatureFlag, SystemHealth
)
from .serializers import (
    SubscriptionPlanSerializer, TenantSubscriptionSerializer, InvoiceSerializer,
    SupportTicketSerializer, SupportTicketDetailSerializer, TicketReplySerializer,
    AuditLogSerializer, ImpersonationSessionSerializer, FeatureFlagSerializer,
    SystemHealthSerializer, PlatformMetricsSerializer
)
from .utils import generate_invoice_pdf, export_to_excel
from apps.core.middleware import get_current_request

def get_client_ip(request):
    """Get client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """ViewSet for Subscription Plan management."""
    
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'is_featured']
    search_fields = ['name', 'description']
    ordering_fields = ['price_monthly', 'created_at']
    ordering = ['price_monthly']


class TenantSubscriptionViewSet(viewsets.ModelViewSet):
    """ViewSet for Tenant Subscription management."""
    
    queryset = TenantSubscription.objects.select_related('tenant', 'plan').all()
    serializer_class = TenantSubscriptionSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'billing_cycle', 'plan']
    search_fields = ['tenant__name', 'tenant__code']
    ordering_fields = ['start_date', 'end_date', 'amount']
    ordering = ['-start_date']
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a subscription."""
        subscription = self.get_object()
        subscription.status = 'cancelled'
        subscription.auto_renew = False
        subscription.save()
        
        # Log action
        AuditLog.objects.create(
            user=request.user,
            action_type='update',
            resource_type='TenantSubscription',
            resource_id=subscription.id,
            resource_name=str(subscription),
            changes={'status': {'old': 'active', 'new': 'cancelled'}},
            description=f'Subscription cancelled by {request.user.email}',
            tenant=subscription.tenant,
        )
        
        return Response({'status': 'Subscription cancelled'})
    
    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        """Renew a subscription."""
        subscription = self.get_object()
        # Renewal logic here
        return Response({'status': 'Subscription renewed'})


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for Invoice management."""
    
    queryset = Invoice.objects.select_related('tenant', 'subscription').all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'tenant']
    search_fields = ['invoice_number', 'tenant__name']
    ordering_fields = ['issue_date', 'due_date', 'total']
    ordering = ['-issue_date']
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download invoice as PDF."""
        invoice = self.get_object()
        pdf = generate_invoice_pdf(invoice)
        
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
        return response
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export invoices to Excel."""
        queryset = self.filter_queryset(self.get_queryset())
        excel_file = export_to_excel(queryset, 'invoices')
        
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="invoices_export.xlsx"'
        return response


class SupportTicketViewSet(viewsets.ModelViewSet):
    """ViewSet for Support Ticket management."""
    
    queryset = SupportTicket.objects.select_related(
        'tenant', 'created_by', 'assigned_to'
    ).prefetch_related('replies').all()
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'category', 'tenant', 'assigned_to']
    search_fields = ['ticket_number', 'subject', 'description', 'tenant__name']
    ordering_fields = ['created_at', 'priority', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SupportTicketDetailSerializer
        return SupportTicketSerializer
    
    def perform_create(self, serializer):
        """Auto-generate ticket number."""
        ticket = serializer.save()
        if not ticket.ticket_number:
            ticket.ticket_number = f"TKT-{timezone.now().year}-{ticket.id:04d}"
            ticket.save()
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign ticket to support staff."""
        ticket = self.get_object()
        assigned_to_id = request.data.get('assigned_to')
        
        if assigned_to_id:
            assigned_to = get_object_or_404(User, id=assigned_to_id)
            ticket.assigned_to = assigned_to
            ticket.save()
            
            # Create internal note
            TicketReply.objects.create(
                ticket=ticket,
                author=request.user,
                message=f"Ticket assigned to {assigned_to.full_name}",
                is_internal=True
            )
            
            return Response({'status': 'Ticket assigned'})
        return Response({'error': 'assigned_to is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Add reply to ticket."""
        ticket = self.get_object()
        message = request.data.get('message')
        is_internal = request.data.get('is_internal', False)
        
        if not message:
            return Response({'error': 'message is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        reply = TicketReply.objects.create(
            ticket=ticket,
            author=request.user,
            message=message,
            is_internal=is_internal
        )
        
        # Update ticket status if first reply
        if not ticket.first_response_at:
            ticket.first_response_at = timezone.now()
            ticket.save()
        
        # Update ticket status if resolved
        if 'resolved' in message.lower() or 'fixed' in message.lower():
            ticket.status = 'resolved'
            ticket.resolved_at = timezone.now()
            ticket.save()
        
        serializer = TicketReplySerializer(reply)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Audit Log viewing (read-only)."""
    
    queryset = AuditLog.objects.select_related('user', 'tenant', 'impersonated_by').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['action_type', 'resource_type', 'user', 'tenant']
    search_fields = ['resource_name', 'description', 'user__email']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export audit logs to Excel."""
        queryset = self.filter_queryset(self.get_queryset())
        excel_file = export_to_excel(queryset, 'audit_logs')
        
        response = HttpResponse(
            excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="audit_logs_export.xlsx"'
        return response


class ImpersonationSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for Impersonation Session management."""
    
    queryset = ImpersonationSession.objects.select_related(
        'superadmin', 'tenant', 'target_user'
    ).all()
    serializer_class = ImpersonationSessionSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_active', 'tenant', 'superadmin']
    ordering_fields = ['started_at', 'ended_at']
    ordering = ['-started_at']
    
    @action(detail=False, methods=['post'])
    def start(self, request):
        """Start impersonation session."""
        tenant_id = request.data.get('tenant_id')
        target_user_id = request.data.get('target_user_id')
        
        if not tenant_id:
            return Response({'error': 'tenant_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        tenant = get_object_or_404(Tenant, id=tenant_id)
        target_user = None
        
        if target_user_id:
            target_user = get_object_or_404(User, id=target_user_id, tenant=tenant)
        else:
            # Get tenant admin
            target_user = User.objects.filter(tenant=tenant, role='admin').first()
            if not target_user:
                return Response(
                    {'error': 'No admin user found for this tenant'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Create impersonation session
        session = ImpersonationSession.objects.create(
            superadmin=request.user,
            tenant=tenant,
            target_user=target_user,
            session_key=request.session.session_key,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        
        # Log action
        AuditLog.objects.create(
            user=request.user,
            action_type='impersonate',
            resource_type='Tenant',
            resource_id=tenant.id,
            resource_name=tenant.name,
            description=f'Started impersonation session for {tenant.name}',
            tenant=tenant,
            metadata={'session_id': session.id, 'target_user_id': target_user.id}
        )
        
        # Generate token for impersonated user (simplified - use JWT in production)
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(target_user)
        
        serializer = self.get_serializer(session)
        return Response({
            'session': serializer.data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'target_user': {
                'id': target_user.id,
                'email': target_user.email,
                'full_name': target_user.full_name,
                'role': target_user.role,
            }
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        """End impersonation session."""
        session = self.get_object()
        session.is_active = False
        session.ended_at = timezone.now()
        session.save()
        
        # Log action
        AuditLog.objects.create(
            user=request.user,
            action_type='impersonate',
            resource_type='ImpersonationSession',
            resource_id=session.id,
            resource_name=f"Session {session.id}",
            description=f'Ended impersonation session for {session.tenant.name}',
            tenant=session.tenant,
        )
        
        return Response({'status': 'Impersonation session ended'})


class FeatureFlagViewSet(viewsets.ModelViewSet):
    """ViewSet for Feature Flag management."""
    
    queryset = FeatureFlag.objects.prefetch_related('enabled_tenants', 'enabled_plans').all()
    serializer_class = FeatureFlagSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_enabled']
    search_fields = ['name', 'key', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class SystemHealthViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for System Health metrics."""
    
    queryset = SystemHealth.objects.all()
    serializer_class = SystemHealthSerializer
    permission_classes = [IsSuperAdmin]
    ordering = ['-recorded_at']
    
    def get_queryset(self):
        """Get latest health metrics."""
        hours = int(self.request.query_params.get('hours', 24))
        since = timezone.now() - timedelta(hours=hours)
        return self.queryset.filter(recorded_at__gte=since)


class PlatformMetricsView(generics.RetrieveAPIView):
    """Get platform overview metrics."""
    
    permission_classes = [IsSuperAdmin]
    serializer_class = PlatformMetricsSerializer
    
    def get_object(self):
        """Calculate and return platform metrics."""
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        # Schools
        total_schools = Tenant.objects.filter(is_deleted=False).count()
        active_schools = Tenant.objects.filter(is_deleted=False, is_active=True).count()
        active_last_7d = Tenant.objects.filter(
            is_deleted=False,
            is_active=True,
            updated_at__gte=now - timedelta(days=7)
        ).count()
        active_last_30d = Tenant.objects.filter(
            is_deleted=False,
            is_active=True,
            updated_at__gte=thirty_days_ago
        ).count()
        
        # Users
        total_students = Student.objects.filter(is_deleted=False).count()
        total_teachers = User.objects.filter(role='teacher', is_active=True).count()
        total_parents = User.objects.filter(role='parent', is_active=True).count()
        
        # Revenue
        active_subscriptions = TenantSubscription.objects.filter(
            status='active',
            end_date__gte=now.date()
        )
        mrr = active_subscriptions.filter(billing_cycle='monthly').aggregate(
            total=Sum('amount')
        )['total'] or 0
        yearly_revenue = active_subscriptions.filter(billing_cycle='yearly').aggregate(
            total=Sum('amount')
        )['total'] or 0
        arr = (mrr * 12) + yearly_revenue
        
        # Subscriptions
        trial_schools = TenantSubscription.objects.filter(status='trial').count()
        paid_schools = TenantSubscription.objects.filter(status='active').count()
        
        # SMS (mock - implement with actual SMS service)
        sms_sent = 125000  # Replace with actual count
        sms_remaining = 875000  # Replace with actual quota
        
        # Storage (mock - implement with actual storage tracking)
        storage_used = 450.0
        storage_total = 1000.0
        
        # System health
        latest_health = SystemHealth.objects.first()
        uptime = 99.98  # Calculate from health records
        error_rate = latest_health.error_rate if latest_health else 0.02
        
        # New signups
        new_signups = Tenant.objects.filter(
            created_at__gte=now - timedelta(days=7)
        ).count()
        
        # Payment success rate (mock)
        payment_success_rate = 98.5
        
        return {
            'total_schools': total_schools,
            'active_schools': active_schools,
            'active_last_7d': active_last_7d,
            'active_last_30d': active_last_30d,
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_parents': total_parents,
            'mrr': float(mrr),
            'arr': float(arr),
            'trial_schools': trial_schools,
            'paid_schools': paid_schools,
            'sms_sent': sms_sent,
            'sms_remaining': sms_remaining,
            'storage_used': storage_used,
            'storage_total': storage_total,
            'uptime': uptime,
            'error_rate': error_rate,
            'new_signups': new_signups,
            'payment_success_rate': payment_success_rate,
        }


# Business Logic Views
from .business_logic import (
    calculate_churn_rate, calculate_ltv, predict_churn_risk,
    calculate_conversion_rate, reconcile_payments, generate_revenue_forecast
)


class ChurnAnalysisView(generics.RetrieveAPIView):
    """Get churn analysis."""
    permission_classes = [IsSuperAdmin]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        churn_rate = calculate_churn_rate(days)
        
        return Response({
            'churn_rate': churn_rate,
            'period_days': days,
        })


class TenantLTVView(generics.RetrieveAPIView):
    """Get Lifetime Value for a tenant."""
    permission_classes = [IsSuperAdmin]
    
    def get(self, request, tenant_id):
        ltv_data = calculate_ltv(tenant_id)
        return Response(ltv_data)


class ChurnRiskView(generics.RetrieveAPIView):
    """Get churn risk prediction for a tenant."""
    permission_classes = [IsSuperAdmin]
    
    def get(self, request, tenant_id):
        risk_data = predict_churn_risk(tenant_id)
        return Response(risk_data)


class ConversionRateView(generics.RetrieveAPIView):
    """Get conversion rate statistics."""
    permission_classes = [IsSuperAdmin]
    
    def get(self, request):
        source = request.query_params.get('source')
        days = int(request.query_params.get('days', 30))
        conversion_data = calculate_conversion_rate(source, days)
        return Response(conversion_data)


class PaymentReconciliationView(generics.RetrieveAPIView):
    """Get payment reconciliation report."""
    permission_classes = [IsSuperAdmin]
    
    def get(self, request):
        from datetime import datetime
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'error': 'start_date and end_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        gateway_id = request.query_params.get('gateway_id')
        reconciliation = reconcile_payments(start_date, end_date, gateway_id)
        return Response(reconciliation)


class RevenueForecastView(generics.RetrieveAPIView):
    """Get revenue forecast."""
    permission_classes = [IsSuperAdmin]
    
    def get(self, request):
        months = int(request.query_params.get('months', 12))
        forecast = generate_revenue_forecast(months)
        return Response(forecast)

