"""
User models for authentication and authorization.
"""
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.core.validators import RegexValidator
from apps.core.models import TimeStampedModel, BaseModel
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """Custom User model."""
    
    ROLE_CHOICES = [
        ('superadmin', 'Super Admin'),
        ('admin', 'School Administrator'),
        ('teacher', 'Teacher'),
        ('parent', 'Parent/Guardian'),
        ('student', 'Student'),
    ]
    
    email = models.EmailField(unique=True)
    phone = models.CharField(
        max_length=20,
        validators=[RegexValidator(regex=r'^\+?263\d{9}$', message="Invalid Zimbabwe phone number")],
        null=True,
        blank=True
    )
    
    # Basic Info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    
    # Role & Tenant
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True
    )
    
    # Authentication
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    # Profile
    avatar = models.ImageField(upload_to='users/avatars/', null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=10,
        choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
        null=True,
        blank=True
    )
    
    # Security
    last_login = models.DateTimeField(null=True, blank=True)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    two_factor_enabled = models.BooleanField(default=False)
    
    # Metadata
    last_password_change = models.DateTimeField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = UserManager()
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    @property
    def full_name(self):
        """Return full name."""
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"
    
    def get_short_name(self):
        """Return short name."""
        return self.first_name


class RolePermission(TimeStampedModel):
    """Custom role permissions (for tenant-specific roles)."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='role_permissions')
    role_name = models.CharField(max_length=50)
    permissions = models.JSONField(default=dict, help_text="Dictionary of permission flags")
    
    class Meta:
        db_table = 'role_permissions'
        unique_together = ['tenant', 'role_name']
    
    def __str__(self):
        return f"{self.role_name} @ {self.tenant.name}"


class AuditLog(TimeStampedModel):
    """Audit log for tracking user actions."""
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    resource_type = models.CharField(max_length=50)
    resource_id = models.CharField(max_length=100)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['tenant', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.created_at}"

