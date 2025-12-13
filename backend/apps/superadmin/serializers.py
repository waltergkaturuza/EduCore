"""
Serializers for Superadmin app.
"""
from rest_framework import serializers
from apps.tenants.models import Tenant
from apps.users.models import User
from .models import (
    SubscriptionPlan, TenantSubscription, Invoice,
    SupportTicket, TicketReply, AuditLog,
    ImpersonationSession, FeatureFlag, SystemHealth,
    GlobalUser, APIKey, PaymentGateway, PaymentTransaction,
    Lead, Backup, Content, ContentSubscription, Contract,
    GlobalAnnouncement, KnowledgeBaseArticle, OnboardingChecklist
)


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for SubscriptionPlan."""
    
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'slug', 'description', 'price_monthly', 'price_yearly',
            'max_students', 'max_teachers', 'max_storage_gb', 'sms_quota',
            'features', 'is_active', 'is_featured', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at', 'slug')


class TenantSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for TenantSubscription."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    
    class Meta:
        model = TenantSubscription
        fields = [
            'id', 'tenant', 'tenant_name', 'plan', 'plan_name',
            'billing_cycle', 'amount', 'start_date', 'end_date',
            'trial_ends_at', 'status', 'auto_renew', 'last_payment_date',
            'next_billing_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    invoice_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'tenant', 'tenant_name', 'subscription',
            'subtotal', 'tax', 'discount', 'total', 'issue_date', 'due_date',
            'paid_date', 'status', 'payment_method', 'payment_reference',
            'notes', 'invoice_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'invoice_number', 'created_at', 'updated_at')
    
    def get_invoice_url(self, obj):
        """Generate invoice download URL."""
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/superadmin/invoices/{obj.id}/download/')
        return None


class TicketReplySerializer(serializers.ModelSerializer):
    """Serializer for TicketReply."""
    
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    author_email = serializers.CharField(source='author.email', read_only=True)
    
    class Meta:
        model = TicketReply
        fields = [
            'id', 'ticket', 'author', 'author_name', 'author_email',
            'message', 'is_internal', 'attachments', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class SupportTicketSerializer(serializers.ModelSerializer):
    """Serializer for SupportTicket."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    replies_count = serializers.SerializerMethodField()
    last_reply_at = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number', 'tenant', 'tenant_name', 'created_by',
            'created_by_name', 'subject', 'description', 'category', 'priority',
            'status', 'assigned_to', 'assigned_to_name', 'first_response_at',
            'resolved_at', 'replies_count', 'last_reply_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'ticket_number', 'created_at', 'updated_at')
    
    def get_replies_count(self, obj):
        return obj.replies.count()
    
    def get_last_reply_at(self, obj):
        last_reply = obj.replies.order_by('-created_at').first()
        return last_reply.created_at if last_reply else None


class SupportTicketDetailSerializer(SupportTicketSerializer):
    """Detailed serializer with replies."""
    
    replies = TicketReplySerializer(many=True, read_only=True)
    
    class Meta(SupportTicketSerializer.Meta):
        fields = SupportTicketSerializer.Meta.fields + ['replies']


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog."""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    impersonated_by_email = serializers.CharField(source='impersonated_by.email', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'user_name', 'impersonated_by',
            'impersonated_by_email', 'session_key', 'ip_address', 'user_agent',
            'action_type', 'resource_type', 'resource_id', 'resource_name',
            'changes', 'description', 'tenant', 'tenant_name', 'metadata',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class ImpersonationSessionSerializer(serializers.ModelSerializer):
    """Serializer for ImpersonationSession."""
    
    superadmin_email = serializers.CharField(source='superadmin.email', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    target_user_email = serializers.CharField(source='target_user.email', read_only=True)
    
    class Meta:
        model = ImpersonationSession
        fields = [
            'id', 'superadmin', 'superadmin_email', 'tenant', 'tenant_name',
            'target_user', 'target_user_email', 'session_key', 'ip_address',
            'user_agent', 'started_at', 'ended_at', 'is_active', 'actions_count',
            'last_action_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'started_at', 'created_at', 'updated_at')


class FeatureFlagSerializer(serializers.ModelSerializer):
    """Serializer for FeatureFlag."""
    
    enabled_tenants_count = serializers.SerializerMethodField()
    enabled_plans_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FeatureFlag
        fields = [
            'id', 'name', 'key', 'description', 'is_enabled', 'rollout_percentage',
            'enabled_tenants', 'enabled_plans', 'enabled_tenants_count',
            'enabled_plans_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_enabled_tenants_count(self, obj):
        return obj.enabled_tenants.count()
    
    def get_enabled_plans_count(self, obj):
        return obj.enabled_plans.count()


class SystemHealthSerializer(serializers.ModelSerializer):
    """Serializer for SystemHealth."""
    
    class Meta:
        model = SystemHealth
        fields = [
            'id', 'response_time_avg', 'response_time_p95', 'error_rate',
            'cpu_usage', 'memory_usage', 'storage_used_gb', 'storage_total_gb',
            'active_users', 'api_requests_24h', 'background_jobs_queued',
            'background_jobs_failed', 'recorded_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'recorded_at', 'created_at', 'updated_at')


class PlatformMetricsSerializer(serializers.Serializer):
    """Serializer for platform overview metrics."""
    
    total_schools = serializers.IntegerField()
    active_schools = serializers.IntegerField()
    total_students = serializers.IntegerField()
    total_teachers = serializers.IntegerField()
    total_parents = serializers.IntegerField()
    mrr = serializers.DecimalField(max_digits=10, decimal_places=2)
    arr = serializers.DecimalField(max_digits=10, decimal_places=2)
    trial_schools = serializers.IntegerField()
    paid_schools = serializers.IntegerField()
    sms_sent = serializers.IntegerField()
    sms_remaining = serializers.IntegerField()
    storage_used = serializers.FloatField()
    storage_total = serializers.FloatField()
    uptime = serializers.FloatField()
    error_rate = serializers.FloatField()
    new_signups = serializers.IntegerField()
    payment_success_rate = serializers.FloatField()

