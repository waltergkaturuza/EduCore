# Super Admin / Platform Owner Guide

## Overview

The **Super Admin** role is for the platform owner who manages multiple schools (tenants) on the EduCore platform. This role has access to platform-wide management features.

## Features

### 1. Platform Dashboard (`/superadmin`)
- Overview of all schools on the platform
- Key statistics:
  - Total Schools
  - Active Schools
  - Total Capacity (students across all schools)
  - Premium Schools (paid subscriptions)
- Table listing all schools with their details

### 2. School Management (`/superadmin/tenants`)
- View all schools
- Create new schools
- Edit school details
- Activate/Deactivate schools
- Manage subscription plans
- Set school capacity limits

### 3. Platform Analytics (`/superadmin/analytics`)
- Platform-wide statistics
- Growth trends
- Revenue analytics
- User activity across all schools

## Creating a Super Admin User

### Option 1: Using Django Admin

1. Go to: http://localhost:8000/admin
2. Navigate to **Users** → **Add User**
3. Fill in:
   - **Email**: `superadmin@educore.com`
   - **First Name**: `Super`
   - **Last Name**: `Admin`
   - **Role**: Select `superadmin`
   - **Tenant**: Leave empty (superadmin doesn't belong to a tenant)
   - **Is Staff**: ✓ Check this
   - **Is Superuser**: ✓ Check this
   - **Is Active**: ✓ Check this
4. Set a password
5. Save

### Option 2: Using the Test User Script

Run the script to create a superadmin user:

```bash
cd backend
python manage.py shell
```

Then paste the contents of `create_test_users.py` or run:

```python
exec(open('create_test_users.py').read())
```

This creates: `superadmin@demo.com` / `super123`

### Option 3: Using Django Shell

```bash
cd backend
python manage.py shell
```

```python
from apps.users.models import User
from apps.tenants.models import Tenant

# Create superadmin user
superadmin = User.objects.create_user(
    email='superadmin@educore.com',
    password='your_secure_password',
    first_name='Super',
    last_name='Admin',
    role='superadmin',
    tenant=None,  # Superadmin doesn't belong to a tenant
    is_staff=True,
    is_superuser=True,
    is_active=True
)
print(f"Created superadmin: {superadmin.email}")
```

## Accessing Super Admin Views

1. **Login** with superadmin credentials
2. You'll be automatically redirected to `/superadmin` (Platform Dashboard)
3. The navigation menu will show:
   - **Platform Dashboard** - Overview of all schools
   - **School Management** - Manage all schools
   - **Platform Analytics** - Platform statistics

## API Endpoints

Superadmin has access to all tenant endpoints:

- `GET /api/tenants/` - List all tenants (superadmin sees all, others see only their tenant)
- `POST /api/tenants/` - Create a new tenant
- `GET /api/tenants/{id}/` - Get tenant details
- `PATCH /api/tenants/{id}/` - Update tenant
- `DELETE /api/tenants/{id}/` - Delete tenant (soft delete)
- `POST /api/tenants/{id}/activate/` - Activate a tenant
- `POST /api/tenants/{id}/deactivate/` - Deactivate a tenant
- `GET /api/tenants/{id}/settings/` - Get tenant settings
- `PATCH /api/tenants/{id}/settings/` - Update tenant settings

## Permissions

Superadmin has:
- ✅ Access to all tenants (no tenant filtering)
- ✅ Can create, read, update, delete any tenant
- ✅ Can activate/deactivate any tenant
- ✅ Can manage tenant settings
- ✅ Access to Django admin panel
- ✅ Can manage all users across all tenants (via Django admin)

## Differences from Regular Admin

| Feature | Super Admin | Regular Admin |
|---------|-------------|---------------|
| **Scope** | All schools | One school only |
| **Tenant** | None (platform-wide) | Belongs to one tenant |
| **Dashboard** | Platform Dashboard | School Dashboard |
| **Can Create Schools** | Yes | No |
| **Can See Other Schools** | Yes | No |
| **Menu Items** | Platform management | School management |

## Testing Super Admin

1. Create a superadmin user (see above)
2. Login with superadmin credentials
3. You should see:
   - Platform Dashboard with all schools
   - School Management menu item
   - Platform Analytics menu item
4. Try creating a new school via School Management
5. Try viewing different schools' details

## Troubleshooting

### Superadmin sees regular dashboard
- Check that user role is `superadmin` (not `admin`)
- Check that `Dashboard.tsx` redirect logic is working
- Clear browser cache and reload

### Superadmin can't see all schools
- Check backend `TenantViewSet.get_queryset()` method
- Verify user role is `superadmin` in database
- Check API response in browser DevTools

### Menu shows wrong items
- Check `Layout.tsx` menu filtering logic
- Verify user role in `AuthContext`
- Check browser console for errors

## Next Steps

Future features for superadmin:
- Billing and subscription management
- Platform-wide analytics with charts
- Bulk operations on schools
- System configuration
- User management across all tenants
- Audit logs and activity tracking



