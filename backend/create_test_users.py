"""
Script to create test users with different roles for testing.
Run with: python manage.py shell < create_test_users.py
Or: python manage.py shell, then copy-paste this code
"""
from apps.users.models import User
from apps.tenants.models import Tenant

# Get or create a tenant
tenant, created = Tenant.objects.get_or_create(
    name="Demo School",
    slug="demo-school",
    defaults={
        'code': 'DEMO001',
        'email': 'demo@school.com',
        'phone': '+263771234567',
        'address': '123 Demo Street',
        'city': 'Harare',
        'province': 'Harare',
        'school_type': 'combined'
    }
)

if created:
    print(f"Created tenant: {tenant.name}")
else:
    print(f"Using existing tenant: {tenant.name}")

# Test users to create
test_users = [
    {
        'email': 'superadmin@demo.com',
        'password': 'super123',
        'first_name': 'Super',
        'last_name': 'Admin',
        'role': 'superadmin',
        'tenant': None  # Superadmin doesn't need a tenant
    },
    {
        'email': 'admin@demo.com',
        'password': 'admin123',
        'first_name': 'Admin',
        'last_name': 'User',
        'role': 'admin'
    },
    {
        'email': 'teacher@demo.com',
        'password': 'teacher123',
        'first_name': 'Teacher',
        'last_name': 'User',
        'role': 'teacher'
    },
    {
        'email': 'parent@demo.com',
        'password': 'parent123',
        'first_name': 'Parent',
        'last_name': 'User',
        'role': 'parent'
    },
    {
        'email': 'student@demo.com',
        'password': 'student123',
        'first_name': 'Student',
        'last_name': 'User',
        'role': 'student'
    },
]

print("\nCreating test users...")
for user_data in test_users:
    # Superadmin doesn't need a tenant
    user_tenant = user_data.get('tenant') if user_data.get('tenant') is None else tenant
    
    user, created = User.objects.get_or_create(
        email=user_data['email'],
        defaults={
            'first_name': user_data['first_name'],
            'last_name': user_data['last_name'],
            'role': user_data['role'],
            'tenant': user_tenant,
            'is_active': True,
            'is_staff': user_data['role'] == 'superadmin',  # Superadmin is staff
            'is_superuser': user_data['role'] == 'superadmin',  # Superadmin is superuser
        }
    )
    
    # Set password
    user.set_password(user_data['password'])
    user.save()
    
    if created:
        print(f"✓ Created {user_data['role']}: {user_data['email']}")
    else:
        print(f"→ Updated {user_data['role']}: {user_data['email']}")

print("\n" + "="*50)
print("Test Users Created Successfully!")
print("="*50)
print("\nLogin credentials:")
for user_data in test_users:
    print(f"  {user_data['email']} / {user_data['password']} (Role: {user_data['role']})")
print("\n")

