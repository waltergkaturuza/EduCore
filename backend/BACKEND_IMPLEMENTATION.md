# Backend Implementation Guide

## Overview

This document describes the comprehensive backend implementation for the EduCore Platform Owner/Super Admin module with advanced features.

## New App: `apps.superadmin`

A complete Django app for platform management with the following models and features:

### Models Created

1. **SubscriptionPlan** - Subscription plan configurations
2. **TenantSubscription** - Track school subscriptions
3. **Invoice** - Invoice management and generation
4. **SupportTicket** - Support ticket system
5. **TicketReply** - Replies to support tickets
6. **AuditLog** - Comprehensive audit logging
7. **ImpersonationSession** - Track impersonation sessions
8. **FeatureFlag** - Feature flags for gradual rollout
9. **SystemHealth** - System health metrics

### API Endpoints

All endpoints are prefixed with `/api/superadmin/` and require `IsSuperAdmin` permission.

#### Subscription Management
- `GET /api/superadmin/subscription-plans/` - List all plans
- `POST /api/superadmin/subscription-plans/` - Create plan
- `GET /api/superadmin/subscriptions/` - List subscriptions
- `POST /api/superadmin/subscriptions/{id}/cancel/` - Cancel subscription
- `POST /api/superadmin/subscriptions/{id}/renew/` - Renew subscription

#### Invoice Management
- `GET /api/superadmin/invoices/` - List invoices
- `GET /api/superadmin/invoices/{id}/download/` - Download PDF invoice
- `POST /api/superadmin/invoices/export/` - Export to Excel

#### Support Tickets
- `GET /api/superadmin/support-tickets/` - List tickets
- `POST /api/superadmin/support-tickets/{id}/assign/` - Assign ticket
- `POST /api/superadmin/support-tickets/{id}/reply/` - Add reply

#### Audit Logs
- `GET /api/superadmin/audit-logs/` - View audit logs
- `POST /api/superadmin/audit-logs/export/` - Export to Excel

#### Impersonation
- `POST /api/superadmin/impersonation-sessions/start/` - Start impersonation
- `POST /api/superadmin/impersonation-sessions/{id}/end/` - End impersonation

#### Feature Flags
- `GET /api/superadmin/feature-flags/` - List feature flags
- `POST /api/superadmin/feature-flags/` - Create feature flag

#### System Health
- `GET /api/superadmin/system-health/` - Get health metrics

#### Platform Metrics
- `GET /api/superadmin/metrics/` - Get platform overview metrics

## Advanced Features Implemented

### 1. Audit Logging System

**Automatic Logging:**
- All create, update, delete operations are automatically logged
- Tracks user, IP address, user agent, session key
- Records field-level changes (before/after)
- Supports impersonation tracking

**Manual Logging:**
```python
from apps.superadmin.models import AuditLog

AuditLog.objects.create(
    user=request.user,
    action_type='export',
    resource_type='Invoice',
    description='Exported invoices to Excel',
    metadata={'count': 150}
)
```

### 2. Impersonation Functionality

**How it works:**
1. Superadmin calls `/api/superadmin/impersonation-sessions/start/`
2. System creates an `ImpersonationSession` record
3. Returns JWT tokens for the target user
4. All actions are logged with `impersonated_by` field
5. Session can be ended via API

**Security:**
- All impersonation actions are audited
- Session tracking with IP and user agent
- Action count tracking
- Automatic session timeout (can be configured)

### 3. Advanced Filtering & Search

**Django Filter Backend:**
- Filter by any model field
- Multiple filter backends supported
- URL-based filtering: `?status=active&subscription_plan=premium`

**Search:**
- Full-text search across multiple fields
- Case-insensitive search
- URL-based: `?search=greenwood`

**Ordering:**
- Sort by any field
- Multiple fields: `?ordering=-created_at,name`
- Default ordering configured per ViewSet

**Example Queries:**
```
GET /api/superadmin/invoices/?status=pending&ordering=-due_date
GET /api/superadmin/support-tickets/?priority=urgent&status=open&search=payment
GET /api/superadmin/tenants/?subscription_plan=enterprise&is_active=true
```

### 4. Export Functionality

**PDF Export:**
- Invoice PDF generation using ReportLab
- Professional formatting
- Download via: `GET /api/superadmin/invoices/{id}/download/`

**Excel Export:**
- Bulk export using openpyxl
- Auto-formatted headers
- Auto-adjusted column widths
- Export via: `POST /api/superadmin/invoices/export/`

**Usage:**
```python
# In views
excel_file = export_to_excel(queryset, 'invoices')
response = HttpResponse(
    excel_file,
    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
)
response['Content-Disposition'] = 'attachment; filename="invoices.xlsx"'
return response
```

### 5. WebSocket Support (Real-time Updates)

**Channels Setup:**
- System monitoring consumer for real-time health metrics
- Platform updates consumer for tenant/subscription changes
- Group-based broadcasting

**WebSocket Endpoints:**
- `ws://localhost:8000/ws/superadmin/monitoring/` - System health updates
- `ws://localhost:8000/ws/superadmin/updates/` - Platform-wide updates

**Note:** Requires Django Channels to be installed and configured. Add to requirements:
```
channels==4.0.0
channels-redis==4.1.0
```

### 6. Enhanced Tenant Management

**New Features:**
- Advanced search across name, code, email, city
- Filter by subscription plan, status, school type
- Usage statistics (student_count, teacher_count) via annotations
- Bulk operations support

**Enhanced Queryset:**
```python
# Automatically includes usage stats
queryset = queryset.annotate(
    student_count=Count('students'),
    teacher_count=Count('users', filter=Q(users__role='teacher'))
)
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

New dependencies added:
- `django-filter==23.3` - For advanced filtering

### 2. Run Migrations

```bash
python manage.py makemigrations superadmin
python manage.py migrate superadmin
```

### 3. Configure Settings

The `superadmin` app is already added to `INSTALLED_APPS` and URLs are configured.

### 4. Create Initial Data

```python
# Create default subscription plans
from apps.superadmin.models import SubscriptionPlan

plans = [
    {'name': 'Free', 'price_monthly': 0, 'max_students': 50},
    {'name': 'Basic', 'price_monthly': 50, 'max_students': 200},
    {'name': 'Premium', 'price_monthly': 150, 'max_students': 1000},
    {'name': 'Enterprise', 'price_monthly': 500, 'max_students': -1},
]

for plan_data in plans:
    SubscriptionPlan.objects.create(**plan_data)
```

## Frontend Integration

### Update API Services

Replace mock data in frontend with real API calls:

```typescript
// frontend/src/services/superadmin.ts
import apiService from './api';

export const superadminService = {
  getMetrics: () => apiService.get('/superadmin/metrics/'),
  getTenants: (params?: any) => apiService.get('/superadmin/tenants/', { params }),
  getSubscriptions: () => apiService.get('/superadmin/subscriptions/'),
  getInvoices: (params?: any) => apiService.get('/superadmin/invoices/', { params }),
  downloadInvoice: (id: number) => apiService.get(`/superadmin/invoices/${id}/download/`, { responseType: 'blob' }),
  exportInvoices: () => apiService.post('/superadmin/invoices/export/', {}, { responseType: 'blob' }),
  getSupportTickets: (params?: any) => apiService.get('/superadmin/support-tickets/', { params }),
  assignTicket: (id: number, userId: number) => apiService.post(`/superadmin/support-tickets/${id}/assign/`, { assigned_to: userId }),
  replyToTicket: (id: number, message: string, isInternal?: boolean) => 
    apiService.post(`/superadmin/support-tickets/${id}/reply/`, { message, is_internal: isInternal }),
  startImpersonation: (tenantId: number, targetUserId?: number) => 
    apiService.post('/superadmin/impersonation-sessions/start/', { tenant_id: tenantId, target_user_id: targetUserId }),
  endImpersonation: (sessionId: number) => 
    apiService.post(`/superadmin/impersonation-sessions/${sessionId}/end/`),
  getAuditLogs: (params?: any) => apiService.get('/superadmin/audit-logs/', { params }),
  exportAuditLogs: () => apiService.post('/superadmin/audit-logs/export/', {}, { responseType: 'blob' }),
  getFeatureFlags: () => apiService.get('/superadmin/feature-flags/'),
  getSystemHealth: (hours?: number) => apiService.get('/superadmin/system-health/', { params: { hours } }),
};
```

## Testing

### Test Impersonation

```python
# In Django shell
from apps.superadmin.views import ImpersonationSessionViewSet
from apps.tenants.models import Tenant
from apps.users.models import User

# Start impersonation
tenant = Tenant.objects.first()
superadmin = User.objects.filter(role='superadmin').first()

# Use the API endpoint
```

### Test Export

```bash
# Export invoices
curl -X POST http://localhost:8000/api/superadmin/invoices/export/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o invoices.xlsx
```

## Next Steps

1. **Run Migrations**: Create database tables
2. **Create Initial Plans**: Set up subscription plans
3. **Connect Frontend**: Update frontend services to use real APIs
4. **Test Impersonation**: Verify impersonation flow
5. **Configure WebSockets**: Set up Channels for real-time updates (optional)
6. **Add Background Jobs**: Create Celery tasks for health monitoring

## Security Considerations

- All endpoints require `IsSuperAdmin` permission
- Impersonation sessions are fully audited
- Audit logs cannot be deleted (read-only ViewSet)
- IP addresses and user agents are tracked
- Session keys are stored for security analysis

## Performance

- Database indexes on audit logs for fast queries
- Annotated querysets to avoid N+1 queries
- Efficient filtering using Django Filter
- Pagination support (configure in DRF settings)



