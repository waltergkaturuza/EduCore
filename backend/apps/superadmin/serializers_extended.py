"""
Extended serializers for additional superadmin models.
"""
from rest_framework import serializers
from .models import (
    GlobalUser, APIKey, PaymentGateway, PaymentTransaction,
    Lead, Backup, Content, ContentSubscription, Contract,
    GlobalAnnouncement, KnowledgeBaseArticle, OnboardingChecklist
)


class GlobalUserSerializer(serializers.ModelSerializer):
    """Serializer for GlobalUser."""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = GlobalUser
        fields = [
            'id', 'user', 'user_email', 'user_name', 'role', 'department',
            'phone_extension', 'is_active', 'two_factor_enabled', 'last_activity',
            'permissions', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at', 'last_activity')


class APIKeySerializer(serializers.ModelSerializer):
    """Serializer for APIKey."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = APIKey
        fields = [
            'id', 'tenant', 'tenant_name', 'name', 'key', 'secret',
            'rate_limit_per_minute', 'rate_limit_per_hour', 'rate_limit_per_day',
            'allowed_ips', 'scopes', 'is_active', 'expires_at',
            'last_used_at', 'usage_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'key', 'secret', 'created_at', 'updated_at', 'last_used_at', 'usage_count')


class PaymentGatewaySerializer(serializers.ModelSerializer):
    """Serializer for PaymentGateway."""
    
    success_rate = serializers.ReadOnlyField()
    enabled_tenants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentGateway
        fields = [
            'id', 'name', 'gateway_type', 'is_active', 'config',
            'total_transactions', 'successful_transactions', 'failed_transactions',
            'total_amount', 'success_rate', 'enabled_tenants', 'enabled_tenants_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'total_transactions', 'successful_transactions', 'failed_transactions', 'total_amount', 'created_at', 'updated_at')
    
    def get_enabled_tenants_count(self, obj):
        return obj.enabled_tenants.count()


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Serializer for PaymentTransaction."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True, allow_null=True)
    gateway_name = serializers.CharField(source='gateway.name', read_only=True, allow_null=True)
    
    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'transaction_id', 'tenant', 'tenant_name', 'invoice', 'invoice_number',
            'gateway', 'gateway_name', 'amount', 'currency', 'status',
            'gateway_response', 'gateway_transaction_id', 'metadata', 'error_message',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'transaction_id', 'created_at', 'updated_at')


class LeadSerializer(serializers.ModelSerializer):
    """Serializer for Lead."""
    
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, allow_null=True)
    converted_to_tenant_name = serializers.CharField(source='converted_to_tenant.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Lead
        fields = [
            'id', 'name', 'email', 'phone', 'school_name', 'location',
            'status', 'source', 'assigned_to', 'assigned_to_name',
            'trial_started_at', 'trial_ends_at', 'converted_at',
            'converted_to_tenant', 'converted_to_tenant_name', 'notes',
            'follow_up_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class BackupSerializer(serializers.ModelSerializer):
    """Serializer for Backup."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Backup
        fields = [
            'id', 'tenant', 'tenant_name', 'backup_type', 'file_path',
            'file_size_mb', 'storage_location', 'status', 'started_at',
            'completed_at', 'error_message', 'metadata', 'progress_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_progress_percentage(self, obj):
        if obj.status == 'completed':
            return 100
        elif obj.status == 'in_progress':
            return 50
        return 0


class ContentSerializer(serializers.ModelSerializer):
    """Serializer for Content."""
    
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, allow_null=True)
    subscriptions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Content
        fields = [
            'id', 'title', 'content_type', 'description', 'created_by',
            'created_by_name', 'is_platform_content', 'price', 'is_free',
            'revenue_split', 'is_approved', 'is_published', 'tags', 'metadata',
            'subscriptions_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_subscriptions_count(self, obj):
        return obj.subscriptions.filter(is_active=True).count()


class ContentSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for ContentSubscription."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    content_title = serializers.CharField(source='content.title', read_only=True)
    
    class Meta:
        model = ContentSubscription
        fields = [
            'id', 'tenant', 'tenant_name', 'content', 'content_title',
            'amount_paid', 'purchase_date', 'expires_at', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class ContractSerializer(serializers.ModelSerializer):
    """Serializer for Contract."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True, allow_null=True)
    signed_by_name = serializers.CharField(source='signed_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Contract
        fields = [
            'id', 'tenant', 'tenant_name', 'document_type', 'title',
            'file_path', 'file_name', 'version', 'is_current',
            'effective_date', 'expiry_date', 'is_signed', 'signed_at',
            'signed_by', 'signed_by_name', 'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class GlobalAnnouncementSerializer(serializers.ModelSerializer):
    """Serializer for GlobalAnnouncement."""
    
    target_tenants_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GlobalAnnouncement
        fields = [
            'id', 'title', 'message', 'target_tenants', 'target_roles',
            'send_email', 'send_sms', 'send_in_app', 'is_published',
            'published_at', 'expires_at', 'sent_count', 'read_count',
            'target_tenants_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'published_at', 'sent_count', 'read_count', 'created_at', 'updated_at')
    
    def get_target_tenants_count(self, obj):
        return obj.target_tenants.count()


class KnowledgeBaseArticleSerializer(serializers.ModelSerializer):
    """Serializer for KnowledgeBaseArticle."""
    
    author_name = serializers.CharField(source='author.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = KnowledgeBaseArticle
        fields = [
            'id', 'title', 'slug', 'content', 'category', 'tags',
            'is_public', 'is_internal', 'author', 'author_name', 'version',
            'parent_article', 'view_count', 'helpful_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'slug', 'view_count', 'helpful_count', 'created_at', 'updated_at')


class OnboardingChecklistSerializer(serializers.ModelSerializer):
    """Serializer for OnboardingChecklist."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, allow_null=True)
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = OnboardingChecklist
        fields = [
            'id', 'tenant', 'tenant_name', 'items', 'completed_items',
            'total_items', 'is_completed', 'completed_at', 'assigned_to',
            'assigned_to_name', 'progress_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'completed_items', 'is_completed', 'completed_at', 'progress_percentage', 'created_at', 'updated_at')




