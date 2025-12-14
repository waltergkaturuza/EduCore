# Migration Guide for Superadmin App

## Step 1: Install New Dependencies

```bash
cd backend
pip install django-filter==23.3
```

## Step 2: Create Migrations

```bash
python manage.py makemigrations superadmin
```

This will create migrations for:
- SubscriptionPlan
- TenantSubscription
- Invoice
- SupportTicket
- TicketReply
- AuditLog
- ImpersonationSession
- FeatureFlag
- SystemHealth

## Step 3: Run Migrations

```bash
python manage.py migrate superadmin
```

## Step 4: Create Initial Subscription Plans

```python
# Run in Django shell: python manage.py shell
from apps.superadmin.models import SubscriptionPlan

plans = [
    {
        'name': 'Free',
        'slug': 'free',
        'description': 'Basic features for small schools',
        'price_monthly': 0,
        'price_yearly': 0,
        'max_students': 50,
        'max_teachers': 5,
        'max_storage_gb': 5,
        'sms_quota': 100,
        'features': {'basic_features': True},
        'is_active': True,
    },
    {
        'name': 'Basic',
        'slug': 'basic',
        'description': 'Essential features for growing schools',
        'price_monthly': 50,
        'price_yearly': 500,
        'max_students': 200,
        'max_teachers': 15,
        'max_storage_gb': 20,
        'sms_quota': 1000,
        'features': {'basic_features': True, 'sms': True, 'priority_support': True},
        'is_active': True,
    },
    {
        'name': 'Premium',
        'slug': 'premium',
        'description': 'Advanced features for established schools',
        'price_monthly': 150,
        'price_yearly': 1500,
        'max_students': 1000,
        'max_teachers': 50,
        'max_storage_gb': 100,
        'sms_quota': 5000,
        'features': {
            'basic_features': True,
            'sms': True,
            'priority_support': True,
            'advanced_analytics': True,
            'api_access': True,
            'custom_branding': True,
        },
        'is_active': True,
        'is_featured': True,
    },
    {
        'name': 'Enterprise',
        'slug': 'enterprise',
        'description': 'Full-featured solution for large institutions',
        'price_monthly': 500,
        'price_yearly': 5000,
        'max_students': -1,  # Unlimited
        'max_teachers': -1,  # Unlimited
        'max_storage_gb': 500,
        'sms_quota': 20000,
        'features': {
            'basic_features': True,
            'sms': True,
            'priority_support': True,
            'advanced_analytics': True,
            'api_access': True,
            'custom_branding': True,
            'dedicated_support': True,
            'custom_integrations': True,
            'white_label': True,
        },
        'is_active': True,
        'is_featured': True,
    },
]

for plan_data in plans:
    SubscriptionPlan.objects.get_or_create(
        slug=plan_data['slug'],
        defaults=plan_data
    )
    print(f"Created/Updated plan: {plan_data['name']}")
```

## Step 5: Verify Installation

```bash
# Check that all models are accessible
python manage.py shell
>>> from apps.superadmin.models import SubscriptionPlan, AuditLog
>>> SubscriptionPlan.objects.count()
>>> # Should return 0 or the number of plans you created
```

## Step 6: Test API Endpoints

```bash
# Start server
python manage.py runserver

# Test metrics endpoint (requires superadmin user)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/superadmin/metrics/
```

## Troubleshooting

### Import Errors
- Ensure `apps.superadmin` is in `INSTALLED_APPS`
- Check that all imports in views.py are correct

### Migration Errors
- Make sure all dependencies are installed
- Check that Tenant and User models exist (they should)
- Run `python manage.py makemigrations` first, then migrate

### Permission Errors
- Ensure you're logged in as a superadmin user
- Check that `IsSuperAdmin` permission class is working




