from django.contrib import admin
from .models import (
    SubscriptionPlan, TenantSubscription, Invoice,
    SupportTicket, TicketReply, AuditLog,
    ImpersonationSession, FeatureFlag, SystemHealth,
    GlobalUser, APIKey, PaymentGateway, PaymentTransaction,
    Lead, Backup, Content, ContentSubscription, Contract,
    GlobalAnnouncement, KnowledgeBaseArticle, OnboardingChecklist
)


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price_monthly', 'price_yearly', 'max_students', 'is_active', 'is_featured']
    list_filter = ['is_active', 'is_featured']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(TenantSubscription)
class TenantSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'plan', 'status', 'billing_cycle', 'amount', 'start_date', 'end_date']
    list_filter = ['status', 'billing_cycle', 'plan']
    search_fields = ['tenant__name', 'tenant__code']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'tenant', 'total', 'status', 'issue_date', 'due_date', 'paid_date']
    list_filter = ['status', 'issue_date']
    search_fields = ['invoice_number', 'tenant__name']
    readonly_fields = ['invoice_number', 'created_at', 'updated_at']


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'tenant', 'subject', 'priority', 'status', 'assigned_to', 'created_at']
    list_filter = ['status', 'priority', 'category']
    search_fields = ['ticket_number', 'subject', 'tenant__name']
    readonly_fields = ['ticket_number', 'created_at', 'updated_at']


@admin.register(TicketReply)
class TicketReplyAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'author', 'is_internal', 'created_at']
    list_filter = ['is_internal', 'created_at']
    search_fields = ['ticket__ticket_number', 'message']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action_type', 'resource_type', 'resource_name', 'created_at', 'ip_address']
    list_filter = ['action_type', 'resource_type', 'created_at']
    search_fields = ['user__email', 'resource_name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(ImpersonationSession)
class ImpersonationSessionAdmin(admin.ModelAdmin):
    list_display = ['superadmin', 'tenant', 'target_user', 'started_at', 'ended_at', 'is_active', 'actions_count']
    list_filter = ['is_active', 'started_at']
    search_fields = ['superadmin__email', 'tenant__name']
    readonly_fields = ['started_at', 'created_at', 'updated_at']


@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ['name', 'key', 'is_enabled', 'rollout_percentage']
    list_filter = ['is_enabled']
    search_fields = ['name', 'key', 'description']
    filter_horizontal = ['enabled_tenants', 'enabled_plans']


@admin.register(SystemHealth)
class SystemHealthAdmin(admin.ModelAdmin):
    list_display = ['recorded_at', 'response_time_avg', 'error_rate', 'cpu_usage', 'memory_usage', 'active_users']
    list_filter = ['recorded_at']
    readonly_fields = ['recorded_at', 'created_at', 'updated_at']
    date_hierarchy = 'recorded_at'


@admin.register(GlobalUser)
class GlobalUserAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'department', 'is_active', 'last_activity']
    list_filter = ['role', 'is_active', 'department']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'is_active', 'last_used_at', 'usage_count']
    list_filter = ['is_active', 'tenant']
    search_fields = ['name', 'key', 'tenant__name']
    readonly_fields = ['key', 'secret', 'created_at', 'updated_at']


@admin.register(PaymentGateway)
class PaymentGatewayAdmin(admin.ModelAdmin):
    list_display = ['name', 'gateway_type', 'is_active', 'success_rate', 'total_transactions']
    list_filter = ['gateway_type', 'is_active']
    filter_horizontal = ['enabled_tenants']


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'tenant', 'amount', 'status', 'gateway', 'created_at']
    list_filter = ['status', 'gateway', 'created_at']
    search_fields = ['transaction_id', 'tenant__name', 'gateway_transaction_id']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'school_name', 'status', 'assigned_to', 'created_at']
    list_filter = ['status', 'source', 'created_at']
    search_fields = ['name', 'email', 'school_name', 'phone']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Backup)
class BackupAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'backup_type', 'status', 'file_size_mb', 'started_at', 'completed_at']
    list_filter = ['backup_type', 'status', 'created_at']
    search_fields = ['tenant__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = ['title', 'content_type', 'is_approved', 'is_published', 'price', 'created_by']
    list_filter = ['content_type', 'is_approved', 'is_published']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ContentSubscription)
class ContentSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'content', 'amount_paid', 'purchase_date', 'is_active']
    list_filter = ['is_active', 'purchase_date']
    search_fields = ['tenant__name', 'content__title']


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ['title', 'document_type', 'tenant', 'version', 'is_current', 'effective_date']
    list_filter = ['document_type', 'is_current', 'is_signed']
    search_fields = ['title', 'tenant__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(GlobalAnnouncement)
class GlobalAnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_published', 'published_at', 'sent_count', 'read_count']
    list_filter = ['is_published', 'created_at']
    filter_horizontal = ['target_tenants']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(KnowledgeBaseArticle)
class KnowledgeBaseArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'is_public', 'is_internal', 'view_count', 'author']
    list_filter = ['category', 'is_public', 'is_internal']
    search_fields = ['title', 'content']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_at', 'updated_at']


@admin.register(OnboardingChecklist)
class OnboardingChecklistAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'completed_items', 'total_items', 'is_completed', 'assigned_to']
    list_filter = ['is_completed', 'created_at']
    search_fields = ['tenant__name']
    readonly_fields = ['created_at', 'updated_at']

