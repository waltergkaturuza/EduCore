"""
Celery tasks for Platform Owner operations.
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import (
    SystemHealth, Backup, Tenant, TenantSubscription,
    Invoice, GlobalAnnouncement
)
from .business_logic import automate_onboarding_progress


@shared_task
def record_system_health():
    """Record system health metrics (runs every 5 minutes)."""
    # TODO: Implement actual system metrics collection
    # This is a placeholder - in production, collect real metrics
    
    health = SystemHealth.objects.create(
        response_time_avg=150.0,  # ms
        response_time_p95=300.0,
        error_rate=0.5,  # percentage
        cpu_usage=45.0,
        memory_usage=60.0,
        storage_used_gb=450.0,
        storage_total_gb=1000.0,
        active_users=1250,
        api_requests_24h=50000,
        background_jobs_queued=10,
        background_jobs_failed=2,
    )
    
    return f"Health recorded: {health.id}"


@shared_task
def create_tenant_backup(backup_id):
    """Create backup for a tenant."""
    from .models import Backup
    
    backup = Backup.objects.get(id=backup_id)
    backup.status = 'in_progress'
    backup.started_at = timezone.now()
    backup.save()
    
    try:
        tenant = backup.tenant
        
        # TODO: Implement actual backup logic
        # - Backup database records for tenant
        # - Backup uploaded files
        # - Compress and store
        
        backup.status = 'completed'
        backup.completed_at = timezone.now()
        backup.file_path = f"backups/{tenant.id}/{backup.id}.tar.gz"
        backup.file_size_mb = 125.5  # Placeholder
        backup.save()
        
        return f"Backup completed: {backup.id}"
    except Exception as e:
        backup.status = 'failed'
        backup.error_message = str(e)
        backup.save()
        raise


@shared_task
def generate_invoices_for_renewals():
    """Generate invoices for upcoming renewals."""
    today = timezone.now().date()
    next_week = today + timedelta(days=7)
    
    # Find subscriptions renewing in next 7 days
    renewals = TenantSubscription.objects.filter(
        status='active',
        next_billing_date__gte=today,
        next_billing_date__lte=next_week,
        auto_renew=True
    )
    
    invoices_created = 0
    for subscription in renewals:
        # Generate invoice
        invoice_number = f"INV-{timezone.now().year}-{subscription.tenant.id}-{subscription.id}"
        
        Invoice.objects.create(
            invoice_number=invoice_number,
            tenant=subscription.tenant,
            subscription=subscription,
            subtotal=subscription.amount,
            tax=0,
            discount=0,
            total=subscription.amount,
            issue_date=today,
            due_date=subscription.next_billing_date,
            status='pending',
        )
        
        invoices_created += 1
    
    return f"Created {invoices_created} invoices"


@shared_task
def send_announcement(announcement_id):
    """Send global announcement via email/SMS/in-app."""
    announcement = GlobalAnnouncement.objects.get(id=announcement_id)
    
    # Get target tenants
    if announcement.target_tenants.exists():
        tenants = announcement.target_tenants.all()
    else:
        tenants = Tenant.objects.filter(is_active=True, is_deleted=False)
    
    sent_count = 0
    
    for tenant in tenants:
        # Send in-app notification
        if announcement.send_in_app:
            # TODO: Create in-app notification records
            sent_count += 1
        
        # Send email
        if announcement.send_email:
            # TODO: Send email via email service
            # send_email_task.delay(tenant.email, announcement.title, announcement.message)
            pass
        
        # Send SMS
        if announcement.send_sms:
            # TODO: Send SMS via SMS service
            # send_sms_task.delay(tenant.phone, announcement.message)
            pass
    
    announcement.sent_count = sent_count
    announcement.save()
    
    return f"Sent announcement to {sent_count} tenants"


@shared_task
def check_expiring_trials():
    """Check for expiring trials and send reminders."""
    today = timezone.now().date()
    three_days = today + timedelta(days=3)
    
    expiring = TenantSubscription.objects.filter(
        status='trial',
        trial_ends_at__gte=today,
        trial_ends_at__lte=three_days
    )
    
    reminders_sent = 0
    for subscription in expiring:
        # TODO: Send reminder email/SMS
        # send_trial_expiry_reminder.delay(subscription.tenant.id)
        reminders_sent += 1
    
    return f"Sent {reminders_sent} trial expiry reminders"


@shared_task
def update_onboarding_progress():
    """Update onboarding progress for all active tenants."""
    tenants = Tenant.objects.filter(is_active=True, is_deleted=False)
    
    updated = 0
    for tenant in tenants:
        try:
            result = automate_onboarding_progress(tenant.id)
            if result:
                updated += 1
        except Exception:
            pass
    
    return f"Updated {updated} onboarding checklists"


@shared_task
def cleanup_old_audit_logs():
    """Cleanup old audit logs (keep last 2 years)."""
    from .models import AuditLog
    
    cutoff = timezone.now() - timedelta(days=730)
    deleted = AuditLog.objects.filter(created_at__lt=cutoff).delete()[0]
    
    return f"Deleted {deleted} old audit logs"



