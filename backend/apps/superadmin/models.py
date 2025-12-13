"""
Superadmin/Platform Owner models.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from apps.core.models import BaseModel
from apps.tenants.models import Tenant


class SubscriptionPlan(BaseModel):
    """Subscription plan configuration."""
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    
    # Pricing
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_yearly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Limits
    max_students = models.IntegerField(default=100, help_text="Use -1 for unlimited")
    max_teachers = models.IntegerField(default=10, help_text="Use -1 for unlimited")
    max_storage_gb = models.IntegerField(default=10)
    sms_quota = models.IntegerField(default=1000)
    
    # Features
    features = models.JSONField(default=dict, help_text="List of enabled features/modules")
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'subscription_plans'
        ordering = ['price_monthly']
    
    def __str__(self):
        return self.name


class TenantSubscription(BaseModel):
    """Tenant subscription tracking."""
    
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name='subscriptions')
    
    # Billing
    billing_cycle = models.CharField(
        max_length=20,
        choices=[('monthly', 'Monthly'), ('yearly', 'Yearly')],
        default='monthly'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Dates
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    trial_ends_at = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('trial', 'Trial'),
            ('active', 'Active'),
            ('expired', 'Expired'),
            ('cancelled', 'Cancelled'),
            ('suspended', 'Suspended'),
        ],
        default='trial'
    )
    
    # Payment
    auto_renew = models.BooleanField(default=True)
    last_payment_date = models.DateField(null=True, blank=True)
    next_billing_date = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'tenant_subscriptions'
    
    def __str__(self):
        return f"{self.tenant.name} - {self.plan.name}"


class Invoice(BaseModel):
    """Invoice for tenant subscriptions."""
    
    invoice_number = models.CharField(max_length=50, unique=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='invoices')
    subscription = models.ForeignKey(TenantSubscription, on_delete=models.SET_NULL, null=True, related_name='invoices')
    
    # Amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Dates
    issue_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('pending', 'Pending'),
            ('paid', 'Paid'),
            ('overdue', 'Overdue'),
            ('cancelled', 'Cancelled'),
        ],
        default='pending'
    )
    
    # Payment
    payment_method = models.CharField(max_length=50, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'invoices'
        ordering = ['-issue_date']
    
    def __str__(self):
        return self.invoice_number


class SupportTicket(BaseModel):
    """Support ticket from schools."""
    
    ticket_number = models.CharField(max_length=50, unique=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='tickets')
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='created_tickets')
    
    # Details
    subject = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(
        max_length=50,
        choices=[
            ('technical', 'Technical'),
            ('billing', 'Billing'),
            ('feature_request', 'Feature Request'),
            ('bug', 'Bug Report'),
            ('other', 'Other'),
        ],
        default='technical'
    )
    
    # Status
    priority = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('urgent', 'Urgent'),
        ],
        default='medium'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('open', 'Open'),
            ('in_progress', 'In Progress'),
            ('resolved', 'Resolved'),
            ('closed', 'Closed'),
        ],
        default='open'
    )
    
    # Assignment
    assigned_to = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets'
    )
    
    # SLA
    first_response_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'support_tickets'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.ticket_number} - {self.subject}"


class TicketReply(BaseModel):
    """Reply to a support ticket."""
    
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='replies')
    author = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='ticket_replies')
    message = models.TextField()
    is_internal = models.BooleanField(default=False, help_text="Internal note visible only to support staff")
    attachments = models.JSONField(default=list, blank=True)
    
    class Meta:
        db_table = 'ticket_replies'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Reply to {self.ticket.ticket_number}"


class AuditLog(BaseModel):
    """Comprehensive audit logging for all actions."""
    
    ACTION_TYPES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('impersonate', 'Impersonate'),
        ('export', 'Export'),
        ('import', 'Import'),
        ('activate', 'Activate'),
        ('deactivate', 'Deactivate'),
        ('suspend', 'Suspend'),
        ('unsuspend', 'Unsuspend'),
    ]
    
    # User & Session
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='superadmin_audit_logs')
    impersonated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='superadmin_impersonation_logs',
        help_text="If this action was performed while impersonating"
    )
    session_key = models.CharField(max_length=40, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Action Details
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    resource_type = models.CharField(max_length=100, help_text="Model name (e.g., 'Tenant', 'User')")
    resource_id = models.IntegerField(null=True, blank=True)
    resource_name = models.CharField(max_length=200, blank=True, help_text="Human-readable identifier")
    
    # Changes
    changes = models.JSONField(default=dict, help_text="Field changes (before/after)")
    description = models.TextField(blank=True)
    
    # Context
    tenant = models.ForeignKey(Tenant, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    metadata = models.JSONField(default=dict, help_text="Additional context data")
    
    class Meta:
        db_table = 'superadmin_audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['tenant', '-created_at']),
            models.Index(fields=['action_type', '-created_at']),
            models.Index(fields=['resource_type', 'resource_id']),
        ]
    
    def __str__(self):
        return f"{self.action_type} {self.resource_type} by {self.user}"


class ImpersonationSession(BaseModel):
    """Track impersonation sessions for audit and security."""
    
    superadmin = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='impersonation_sessions',
        help_text="The superadmin performing impersonation"
    )
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='impersonation_sessions')
    target_user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='impersonated_sessions',
        help_text="The user being impersonated (usually tenant admin)"
    )
    
    # Session
    session_key = models.CharField(max_length=40, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    
    # Status
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Actions
    actions_count = models.IntegerField(default=0)
    last_action_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'impersonation_sessions'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.superadmin.email} → {self.tenant.name}"


class FeatureFlag(BaseModel):
    """Feature flags for gradual rollout and A/B testing."""
    
    name = models.CharField(max_length=100, unique=True)
    key = models.SlugField(unique=True, help_text="Used in code")
    description = models.TextField(blank=True)
    
    # Rollout
    is_enabled = models.BooleanField(default=False)
    rollout_percentage = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage of tenants to enable for (0-100)"
    )
    
    # Targeting
    enabled_tenants = models.ManyToManyField(
        Tenant,
        blank=True,
        related_name='feature_flags',
        help_text="Specific tenants to enable for"
    )
    enabled_plans = models.ManyToManyField(
        SubscriptionPlan,
        blank=True,
        related_name='feature_flags',
        help_text="Subscription plans to enable for"
    )
    
    class Meta:
        db_table = 'feature_flags'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class SystemHealth(BaseModel):
    """System health metrics snapshot."""
    
    # Performance
    response_time_avg = models.FloatField(help_text="Average API response time in ms")
    response_time_p95 = models.FloatField(help_text="95th percentile response time")
    error_rate = models.FloatField(help_text="Error rate percentage")
    
    # Resources
    cpu_usage = models.FloatField(help_text="CPU usage percentage")
    memory_usage = models.FloatField(help_text="Memory usage percentage")
    storage_used_gb = models.FloatField()
    storage_total_gb = models.FloatField()
    
    # Activity
    active_users = models.IntegerField()
    api_requests_24h = models.IntegerField()
    background_jobs_queued = models.IntegerField()
    background_jobs_failed = models.IntegerField()
    
    # Timestamp
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'system_health'
        ordering = ['-recorded_at']
        get_latest_by = 'recorded_at'
    
    def __str__(self):
        return f"Health check at {self.recorded_at}"


class GlobalUser(BaseModel):
    """Platform owner's internal staff users."""
    
    ROLE_CHOICES = [
        ('superadmin', 'Super Admin'),
        ('support_agent', 'Support Agent'),
        ('finance_manager', 'Finance Manager'),
        ('sales_agent', 'Sales Agent'),
        ('technical_admin', 'Technical Admin'),
    ]
    
    user = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='global_profile')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='support_agent')
    department = models.CharField(max_length=100, blank=True)
    phone_extension = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    two_factor_enabled = models.BooleanField(default=False)
    last_activity = models.DateTimeField(null=True, blank=True)
    
    # Permissions
    permissions = models.JSONField(default=dict, help_text="Custom permissions for this user")
    
    class Meta:
        db_table = 'global_users'
        ordering = ['user__email']
    
    def __str__(self):
        return f"{self.user.email} - {self.get_role_display()}"


class APIKey(BaseModel):
    """API keys for tenant integrations."""
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='api_keys')
    name = models.CharField(max_length=100, help_text="Key identifier/name")
    key = models.CharField(max_length=64, unique=True, help_text="Generated API key")
    secret = models.CharField(max_length=64, help_text="API secret for signing")
    
    # Limits
    rate_limit_per_minute = models.IntegerField(default=60)
    rate_limit_per_hour = models.IntegerField(default=1000)
    rate_limit_per_day = models.IntegerField(default=10000)
    
    # Permissions
    allowed_ips = models.JSONField(default=list, help_text="IP whitelist (empty = all)")
    scopes = models.JSONField(default=list, help_text="Allowed API scopes")
    
    # Status
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    usage_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'api_keys'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.tenant.name}"


class PaymentGateway(BaseModel):
    """Payment gateway configuration."""
    
    GATEWAY_TYPES = [
        ('ecocash', 'EcoCash'),
        ('paynow', 'Paynow'),
        ('bank', 'Bank Transfer'),
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    gateway_type = models.CharField(max_length=50, choices=GATEWAY_TYPES)
    is_active = models.BooleanField(default=True)
    
    # Configuration
    config = models.JSONField(default=dict, help_text="Gateway-specific configuration")
    
    # Statistics
    total_transactions = models.IntegerField(default=0)
    successful_transactions = models.IntegerField(default=0)
    failed_transactions = models.IntegerField(default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Per-tenant enablement
    enabled_tenants = models.ManyToManyField(Tenant, blank=True, related_name='payment_gateways')
    
    class Meta:
        db_table = 'payment_gateways'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @property
    def success_rate(self):
        if self.total_transactions == 0:
            return 0
        return (self.successful_transactions / self.total_transactions) * 100


class PaymentTransaction(BaseModel):
    """Payment transaction logs."""
    
    transaction_id = models.CharField(max_length=100, unique=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='payment_transactions')
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, related_name='transactions')
    gateway = models.ForeignKey(PaymentGateway, on_delete=models.SET_NULL, null=True)
    
    # Amount
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
            ('refunded', 'Refunded'),
            ('cancelled', 'Cancelled'),
        ],
        default='pending'
    )
    
    # Gateway response
    gateway_response = models.JSONField(default=dict)
    gateway_transaction_id = models.CharField(max_length=100, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict)
    error_message = models.TextField(blank=True)
    
    class Meta:
        db_table = 'payment_transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['gateway', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.transaction_id} - {self.amount} {self.currency}"


class Lead(BaseModel):
    """Sales leads and trial tracking."""
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('trial', 'Trial'),
        ('converted', 'Converted'),
        ('lost', 'Lost'),
    ]
    
    # Contact Info
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    school_name = models.CharField(max_length=200, blank=True)
    location = models.CharField(max_length=200, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    source = models.CharField(max_length=100, blank=True, help_text="Lead source")
    
    # Assignment
    assigned_to = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    
    # Trial
    trial_started_at = models.DateTimeField(null=True, blank=True)
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    converted_at = models.DateTimeField(null=True, blank=True)
    converted_to_tenant = models.ForeignKey(Tenant, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    
    # Notes
    notes = models.TextField(blank=True)
    follow_up_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'leads'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.get_status_display()}"


class Backup(BaseModel):
    """Backup records for tenant data."""
    
    BACKUP_TYPES = [
        ('full', 'Full Backup'),
        ('incremental', 'Incremental'),
        ('database', 'Database Only'),
        ('files', 'Files Only'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='backups')
    backup_type = models.CharField(max_length=20, choices=BACKUP_TYPES, default='full')
    
    # Storage
    file_path = models.CharField(max_length=500)
    file_size_mb = models.FloatField()
    storage_location = models.CharField(max_length=200, default='local')
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    
    # Metadata
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    metadata = models.JSONField(default=dict)
    
    class Meta:
        db_table = 'backups'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.tenant.name} - {self.backup_type} - {self.created_at}"


class Content(BaseModel):
    """Content marketplace items."""
    
    CONTENT_TYPES = [
        ('course', 'Course'),
        ('lesson', 'Lesson'),
        ('video', 'Video'),
        ('document', 'Document'),
        ('quiz', 'Quiz'),
        ('other', 'Other'),
    ]
    
    title = models.CharField(max_length=200)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES)
    description = models.TextField(blank=True)
    
    # Creator
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='created_content')
    is_platform_content = models.BooleanField(default=False, help_text="Created by platform vs third-party")
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_free = models.BooleanField(default=False)
    revenue_split = models.FloatField(default=0, help_text="Percentage for creator")
    
    # Status
    is_approved = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    
    # Metadata
    tags = models.JSONField(default=list)
    metadata = models.JSONField(default=dict)
    
    class Meta:
        db_table = 'content'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class ContentSubscription(BaseModel):
    """Tenant subscriptions to content."""
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='content_subscriptions')
    content = models.ForeignKey(Content, on_delete=models.CASCADE, related_name='subscriptions')
    
    # Pricing
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    purchase_date = models.DateField()
    
    # Access
    expires_at = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'content_subscriptions'
        unique_together = ['tenant', 'content']
        ordering = ['-purchase_date']
    
    def __str__(self):
        return f"{self.tenant.name} - {self.content.title}"


class Contract(BaseModel):
    """Legal contracts and documents."""
    
    DOCUMENT_TYPES = [
        ('sla', 'Service Level Agreement'),
        ('terms', 'Terms & Conditions'),
        ('privacy', 'Privacy Policy'),
        ('agreement', 'School Agreement'),
        ('other', 'Other'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name='contracts')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    title = models.CharField(max_length=200)
    
    # File
    file_path = models.CharField(max_length=500)
    file_name = models.CharField(max_length=200)
    
    # Versioning
    version = models.CharField(max_length=20, default='1.0')
    is_current = models.BooleanField(default=True)
    effective_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    
    # Status
    is_signed = models.BooleanField(default=False)
    signed_at = models.DateTimeField(null=True, blank=True)
    signed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict)
    
    class Meta:
        db_table = 'contracts'
        ordering = ['-effective_date']
    
    def __str__(self):
        return f"{self.title} v{self.version}"


class GlobalAnnouncement(BaseModel):
    """Global announcements to schools."""
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Targeting
    target_tenants = models.ManyToManyField(Tenant, blank=True, related_name='announcements')
    target_roles = models.JSONField(default=list, help_text="['admin', 'teacher'] or empty for all")
    
    # Delivery
    send_email = models.BooleanField(default=False)
    send_sms = models.BooleanField(default=False)
    send_in_app = models.BooleanField(default=True)
    
    # Status
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Statistics
    sent_count = models.IntegerField(default=0)
    read_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'global_announcements'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class KnowledgeBaseArticle(BaseModel):
    """Knowledge base articles."""
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    
    # Categorization
    category = models.CharField(max_length=100, blank=True)
    tags = models.JSONField(default=list)
    
    # Visibility
    is_public = models.BooleanField(default=True)
    is_internal = models.BooleanField(default=False, help_text="Only visible to platform staff")
    
    # Author
    author = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='kb_articles')
    
    # Versioning
    version = models.IntegerField(default=1)
    parent_article = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='versions')
    
    # Statistics
    view_count = models.IntegerField(default=0)
    helpful_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'knowledge_base_articles'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class OnboardingChecklist(BaseModel):
    """Onboarding checklist for new schools."""
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='onboarding_checklist')
    
    # Checklist items
    items = models.JSONField(default=list, help_text="List of {task: str, completed: bool, completed_at: datetime}")
    
    # Progress
    completed_items = models.IntegerField(default=0)
    total_items = models.IntegerField(default=0)
    
    # Status
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Assignment
    assigned_to = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='onboarding_checklists')
    
    class Meta:
        db_table = 'onboarding_checklists'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Onboarding: {self.tenant.name}"
    
    @property
    def progress_percentage(self):
        if self.total_items == 0:
            return 0
        return (self.completed_items / self.total_items) * 100

