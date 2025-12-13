# User Roles Guide - Testing Different Views

## Current Role

You're currently logged in. Check your role in the top-right corner of the dashboard, or look at the menu items available in the sidebar.

## Available Roles

The system supports these roles:
- **Super Admin** - Platform owner (sees all tenants, manages platform)
- **Admin** - School administrator (full access to their school)
- **Teacher** - Can manage classes, attendance, assessments
- **Parent** - Can view child's progress, pay fees, receive messages
- **Student** - Can view assignments, grades, timetable, e-learning

## Super Admin / Platform Owner

The **Super Admin** role has access to platform-wide management:

### Super Admin Features:
- **Platform Dashboard** - Overview of all schools
- **School Management** - Create, edit, and manage all schools (tenants)
- **Platform Analytics** - View platform-wide statistics and trends
- **Billing Management** - Manage subscriptions and billing (future)
- **System Settings** - Platform-wide configuration (future)

### Accessing Super Admin View:
1. Create a superadmin user (see below)
2. Login with superadmin credentials
3. You'll automatically see the Platform Dashboard instead of regular dashboard
4. Menu will show: Platform Dashboard, School Management, Platform Analytics

## How to Create Users with Different Roles

### Option 1: Using Django Admin (Recommended)

1. **Access Admin Panel:**
   - Go to: http://localhost:8000/admin
   - Login with your superuser credentials

2. **Create a Tenant (School) first:**
   - Go to "Tenants" → "Add Tenant"
   - Fill in school details
   - Save

3. **Create Users:**
   - Go to "Users" → "Add User"
   - Fill in user details:
     - Email
     - First Name, Last Name
     - **Role** (select: admin, teacher, parent, or student)
     - **Tenant** (select the school)
     - Password (set a password)
   - Save

4. **Login with different users:**
   - Logout from current session
   - Login with the new user's email and password
   - You'll see different menu items based on their role

### Option 2: Using Django Shell

```powershell
cd backend
python manage.py shell
```

Then run:

```python
from apps.users.models import User
from apps.tenants.models import Tenant

# Get or create a tenant
tenant, _ = Tenant.objects.get_or_create(
    name="Test School",
    slug="test-school",
    code="TS001",
    email="school@test.com",
    phone="+263771234567"
)

# Create Admin User
admin = User.objects.create_user(
    email="admin@test.com",
    password="admin123",
    first_name="Admin",
    last_name="User",
    role="admin",
    tenant=tenant
)

# Create Teacher User
teacher = User.objects.create_user(
    email="teacher@test.com",
    password="teacher123",
    first_name="Teacher",
    last_name="User",
    role="teacher",
    tenant=tenant
)

# Create Parent User
parent = User.objects.create_user(
    email="parent@test.com",
    password="parent123",
    first_name="Parent",
    last_name="User",
    role="parent",
    tenant=tenant
)

# Create Student User
student = User.objects.create_user(
    email="student@test.com",
    password="student123",
    first_name="Student",
    last_name="User",
    role="student",
    tenant=tenant
)

print("Users created successfully!")
```

## What Each Role Sees

### Admin Role
- **Menu Items:** Dashboard, Students, Classes, Attendance, Assessments, Fees, Messages, e-Learning, Settings
- **Can:** Manage all school data, create users, configure settings

### Teacher Role
- **Menu Items:** Dashboard, Students, Classes, Attendance, Assessments, Messages, e-Learning
- **Can:** Mark attendance, create assignments, enter grades, view their classes

### Parent Role
- **Menu Items:** Dashboard, Fees, Messages, e-Learning
- **Can:** View child's progress, pay fees, communicate with teachers

### Student Role
- **Menu Items:** Dashboard, Messages, e-Learning
- **Can:** View assignments, grades, timetable, access e-learning content

## What Each Role Sees

### Super Admin Role (Platform Owner)
- **Menu Items:** Platform Dashboard, School Management, Platform Analytics
- **Can:** Manage all schools, view platform analytics, configure platform settings
- **Access:** All tenants, no tenant restriction

### Admin Role

```powershell
cd backend
python manage.py shell
```

Then paste:

```python
from apps.users.models import User
from apps.tenants.models import Tenant

# Get first tenant or create one
tenant = Tenant.objects.first()
if not tenant:
    tenant = Tenant.objects.create(
        name="Demo School",
        slug="demo-school",
        code="DEMO001",
        email="demo@school.com",
        phone="+263771234567"
    )

# Create test users
users = [
    {"email": "admin@demo.com", "role": "admin", "name": "Admin"},
    {"email": "teacher@demo.com", "role": "teacher", "name": "Teacher"},
    {"email": "parent@demo.com", "role": "parent", "name": "Parent"},
    {"email": "student@demo.com", "role": "student", "name": "Student"},
]

for u in users:
    User.objects.get_or_create(
        email=u["email"],
        defaults={
            "password": "demo123",
            "first_name": u["name"],
            "last_name": "User",
            "role": u["role"],
            "tenant": tenant
        }
    )
    # Set password properly
    user = User.objects.get(email=u["email"])
    user.set_password("demo123")
    user.save()

print("Test users created!")
print("Login with:")
for u in users:
    print(f"  {u['email']} / demo123 (Role: {u['role']})")
```

## Switching Between Roles

1. **Logout** from current session (click avatar → Logout)
2. **Login** with a different user's credentials
3. The menu and dashboard will automatically adjust based on the role

## Current User Info

To see your current role:
- Check the **Dashboard** - it shows your role in the top-right
- Check the **sidebar menu** - only role-appropriate items are shown
- Check browser **console** - type: `localStorage.getItem('user')` to see user data

