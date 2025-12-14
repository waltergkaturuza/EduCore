"""
Business logic for Platform Owner operations.
"""
from django.db.models import Q, Count, Sum, Avg, F
from django.utils import timezone
from datetime import timedelta
from .models import (
    Tenant, TenantSubscription, Lead, OnboardingChecklist,
    PaymentTransaction, Invoice, SystemHealth
)


def calculate_churn_rate(days=30):
    """Calculate churn rate for the last N days."""
    cutoff_date = timezone.now().date() - timedelta(days=days)
    
    # Get subscriptions that were active but are now cancelled/expired
    total_active_start = TenantSubscription.objects.filter(
        start_date__lte=cutoff_date,
        status__in=['active', 'trial']
    ).count()
    
    churned = TenantSubscription.objects.filter(
        start_date__lte=cutoff_date,
        status__in=['cancelled', 'expired'],
        updated_at__gte=timezone.now() - timedelta(days=days)
    ).count()
    
    if total_active_start == 0:
        return 0
    
    return (churned / total_active_start) * 100


def calculate_ltv(tenant_id):
    """Calculate Lifetime Value for a tenant."""
    tenant = Tenant.objects.get(id=tenant_id)
    
    # Get all payments
    total_paid = PaymentTransaction.objects.filter(
        tenant=tenant,
        status='completed'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Get subscription months
    subscriptions = TenantSubscription.objects.filter(tenant=tenant)
    total_months = 0
    for sub in subscriptions:
        if sub.start_date and sub.end_date:
            delta = sub.end_date - sub.start_date
            total_months += delta.days / 30
        elif sub.start_date:
            delta = timezone.now().date() - sub.start_date
            total_months += delta.days / 30
    
    return {
        'total_revenue': float(total_paid),
        'total_months': total_months,
        'ltv': float(total_paid),
        'avg_monthly_revenue': float(total_paid / total_months) if total_months > 0 else 0,
    }


def predict_churn_risk(tenant_id):
    """Predict churn risk for a tenant (simple algorithm)."""
    tenant = Tenant.objects.get(id=tenant_id)
    risk_score = 0
    factors = []
    
    # Check subscription status
    subscription = getattr(tenant, 'subscription', None)
    if subscription:
        if subscription.status == 'trial' and subscription.trial_ends_at:
            days_until_trial_end = (subscription.trial_ends_at - timezone.now().date()).days
            if days_until_trial_end < 7:
                risk_score += 30
                factors.append('Trial ending soon')
        
        if subscription.status == 'expired':
            risk_score += 50
            factors.append('Subscription expired')
        
        # Check payment history
        recent_payments = PaymentTransaction.objects.filter(
            tenant=tenant,
            status='completed',
            created_at__gte=timezone.now() - timedelta(days=90)
        ).count()
        
        if recent_payments == 0 and subscription.status == 'active':
            risk_score += 20
            factors.append('No recent payments')
    
    # Check onboarding completion
    checklist = OnboardingChecklist.objects.filter(tenant=tenant).first()
    if checklist:
        if not checklist.is_completed:
            progress = checklist.progress_percentage
            if progress < 50:
                risk_score += 15
                factors.append('Low onboarding progress')
    
    # Check support tickets
    from .models import SupportTicket
    open_tickets = SupportTicket.objects.filter(
        tenant=tenant,
        status__in=['open', 'in_progress']
    ).count()
    
    if open_tickets > 3:
        risk_score += 10
        factors.append('Multiple open support tickets')
    
    # Determine risk level
    if risk_score >= 70:
        risk_level = 'high'
    elif risk_score >= 40:
        risk_level = 'medium'
    else:
        risk_level = 'low'
    
    return {
        'risk_score': risk_score,
        'risk_level': risk_level,
        'factors': factors,
    }


def calculate_conversion_rate(source=None, days=30):
    """Calculate trial to paid conversion rate."""
    cutoff_date = timezone.now() - timedelta(days=days)
    
    # Get leads that started trials
    trial_leads = Lead.objects.filter(
        status='trial',
        trial_started_at__gte=cutoff_date
    )
    
    if source:
        trial_leads = trial_leads.filter(source=source)
    
    total_trials = trial_leads.count()
    
    # Get converted leads
    converted = Lead.objects.filter(
        status='converted',
        converted_at__gte=cutoff_date
    )
    
    if source:
        converted = converted.filter(source=source)
    
    converted_count = converted.count()
    
    conversion_rate = (converted_count / total_trials * 100) if total_trials > 0 else 0
    
    return {
        'total_trials': total_trials,
        'converted': converted_count,
        'conversion_rate': conversion_rate,
        'period_days': days,
    }


def automate_onboarding_progress(tenant_id):
    """Automatically update onboarding progress based on tenant activity."""
    tenant = Tenant.objects.get(id=tenant_id)
    checklist = OnboardingChecklist.objects.filter(tenant=tenant).first()
    
    if not checklist:
        return None
    
    # Check various completion criteria
    items = checklist.items.copy()
    updated = False
    
    # Check if school profile is complete
    if tenant.name and tenant.email and tenant.address:
        for item in items:
            if 'profile' in item.get('task', '').lower() and not item.get('completed'):
                item['completed'] = True
                item['completed_at'] = timezone.now().isoformat()
                updated = True
    
    # Check if students exist
    from apps.students.models import Student
    student_count = Student.objects.filter(tenant=tenant, is_deleted=False).count()
    if student_count > 0:
        for item in items:
            if 'student' in item.get('task', '').lower() and not item.get('completed'):
                item['completed'] = True
                item['completed_at'] = timezone.now().isoformat()
                updated = True
    
    # Check if classes exist
    from apps.academics.models import Class
    class_count = Class.objects.filter(tenant=tenant, is_deleted=False).count()
    if class_count > 0:
        for item in items:
            if 'class' in item.get('task', '').lower() and not item.get('completed'):
                item['completed'] = True
                item['completed_at'] = timezone.now().isoformat()
                updated = True
    
    # Check if teachers exist
    teacher_count = tenant.users.filter(role='teacher', is_active=True).count()
    if teacher_count > 0:
        for item in items:
            if 'teacher' in item.get('task', '').lower() and not item.get('completed'):
                item['completed'] = True
                item['completed_at'] = timezone.now().isoformat()
                updated = True
    
    if updated:
        checklist.items = items
        checklist.completed_items = sum(1 for item in items if item.get('completed', False))
        checklist.total_items = len(items)
        
        if checklist.completed_items == checklist.total_items:
            checklist.is_completed = True
            checklist.completed_at = timezone.now()
        
        checklist.save()
    
    return checklist


def reconcile_payments(start_date, end_date, gateway_id=None):
    """Reconcile payments for a period."""
    transactions = PaymentTransaction.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
        status='completed'
    )
    
    if gateway_id:
        transactions = transactions.filter(gateway_id=gateway_id)
    
    # Group by gateway
    by_gateway = transactions.values('gateway__name').annotate(
        count=Count('id'),
        total=Sum('amount'),
        successful=Count('id', filter=Q(status='completed')),
        failed=Count('id', filter=Q(status='failed')),
    )
    
    # Calculate totals
    total_amount = transactions.aggregate(total=Sum('amount'))['total'] or 0
    total_count = transactions.count()
    
    return {
        'period': {'start': start_date, 'end': end_date},
        'total_transactions': total_count,
        'total_amount': float(total_amount),
        'by_gateway': list(by_gateway),
    }


def generate_revenue_forecast(months=12):
    """Generate revenue forecast for next N months."""
    now = timezone.now()
    forecast = []
    
    # Get current MRR
    active_subscriptions = TenantSubscription.objects.filter(
        status='active',
        end_date__gte=now.date()
    )
    
    monthly_revenue = active_subscriptions.filter(
        billing_cycle='monthly'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    yearly_revenue = active_subscriptions.filter(
        billing_cycle='yearly'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    current_mrr = float(monthly_revenue) + (float(yearly_revenue) / 12)
    
    # Simple forecast (can be enhanced with ML)
    churn_rate = calculate_churn_rate(days=30) / 100
    growth_rate = 0.05  # 5% monthly growth (assumption)
    
    for i in range(months):
        month_date = now + timedelta(days=30 * (i + 1))
        
        # Apply churn and growth
        if i == 0:
            forecasted_mrr = current_mrr
        else:
            forecasted_mrr = forecasted_mrr * (1 - churn_rate) * (1 + growth_rate)
        
        forecast.append({
            'month': month_date.strftime('%Y-%m'),
            'mrr': forecasted_mrr,
            'arr': forecasted_mrr * 12,
        })
    
    return {
        'current_mrr': current_mrr,
        'forecast': forecast,
        'assumptions': {
            'churn_rate': churn_rate * 100,
            'growth_rate': growth_rate * 100,
        }
    }




