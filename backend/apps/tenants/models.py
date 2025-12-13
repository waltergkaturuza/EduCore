"""
Tenant (School) models.
"""
from django.db import models
from django.core.validators import RegexValidator
from apps.core.models import BaseModel


class Tenant(BaseModel):
    """Represents a school (tenant) in the multi-tenant system."""
    
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, help_text="Used in subdomain")
    code = models.CharField(max_length=50, unique=True, help_text="School code/registration number")
    
    # Contact Information
    email = models.EmailField()
    phone = models.CharField(
        max_length=20,
        validators=[RegexValidator(regex=r'^\+?263\d{9}$', message="Invalid Zimbabwe phone number")]
    )
    address = models.TextField()
    city = models.CharField(max_length=100, default='Harare')
    province = models.CharField(max_length=100, default='Harare')
    
    # School Details
    school_type = models.CharField(
        max_length=20,
        choices=[
            ('primary', 'Primary School'),
            ('secondary', 'Secondary School'),
            ('combined', 'Combined (Primary & Secondary)'),
        ],
        default='combined'
    )
    established_year = models.IntegerField(null=True, blank=True)
    logo = models.ImageField(upload_to='tenants/logos/', null=True, blank=True)
    
    # Subscription & Billing
    subscription_plan = models.CharField(
        max_length=50,
        choices=[
            ('free', 'Free'),
            ('basic', 'Basic'),
            ('premium', 'Premium'),
            ('enterprise', 'Enterprise'),
        ],
        default='free'
    )
    subscription_start = models.DateField(null=True, blank=True)
    subscription_end = models.DateField(null=True, blank=True)
    max_students = models.IntegerField(default=100)
    max_teachers = models.IntegerField(default=10)
    
    # Settings
    is_active = models.BooleanField(default=True)
    timezone = models.CharField(max_length=50, default='Africa/Harare')
    language = models.CharField(max_length=10, default='en', choices=[
        ('en', 'English'),
        ('sn', 'Shona'),
        ('nd', 'Ndebele'),
    ])
    
    # Academic Year Settings
    current_academic_year = models.ForeignKey(
        'academics.AcademicYear',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_tenants'
    )
    
    class Meta:
        db_table = 'tenants'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @property
    def is_subscription_active(self):
        """Check if subscription is active."""
        if not self.subscription_end:
            return True
        from django.utils import timezone
        return self.subscription_end >= timezone.now().date()


class TenantSettings(BaseModel):
    """Per-tenant configuration settings."""
    
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='settings')
    
    # Attendance Settings
    attendance_required = models.BooleanField(default=True)
    late_arrival_threshold = models.IntegerField(default=15, help_text="Minutes after start time")
    
    # Assessment Settings
    grading_scale = models.CharField(
        max_length=20,
        choices=[
            ('percentage', 'Percentage (0-100)'),
            ('letter', 'Letter Grade (A-F)'),
            ('points', 'Points'),
        ],
        default='percentage'
    )
    
    # Communication Settings
    sms_enabled = models.BooleanField(default=True)
    whatsapp_enabled = models.BooleanField(default=False)
    email_notifications = models.BooleanField(default=True)
    
    # Fee Settings
    currency = models.CharField(max_length=3, default='USD')
    payment_gateway = models.CharField(
        max_length=50,
        choices=[
            ('ecocash', 'EcoCash'),
            ('paynow', 'Paynow'),
            ('bank', 'Bank Transfer'),
            ('manual', 'Manual/Cash'),
        ],
        default='manual'
    )
    
    class Meta:
        db_table = 'tenant_settings'
    
    def __str__(self):
        return f"Settings for {self.tenant.name}"



