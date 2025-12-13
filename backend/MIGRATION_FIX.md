# Django Migration Fix

## Issue: "relation 'users' does not exist"

This error occurs when Django tries to run admin migrations before the users table is created.

## Solution

Run migrations in the correct order:

```powershell
# Step 1: Run migrations for core apps first
python manage.py migrate contenttypes
python manage.py migrate auth

# Step 2: Run migrations for your custom apps
python manage.py migrate tenants
python manage.py migrate users

# Step 3: Run remaining migrations
python manage.py migrate
```

## Alternative: Reset and Start Fresh

If you're in development and can reset the database:

```powershell
# Delete migration files (except __init__.py)
# Then recreate:
python manage.py makemigrations
python manage.py migrate
```

## Or: Run All Migrations at Once

Sometimes running all migrations together works:

```powershell
python manage.py migrate --run-syncdb
```

## If Using SQLite

If you switched to SQLite, delete the database file and start fresh:

```powershell
# Delete db.sqlite3 if it exists
Remove-Item db.sqlite3 -ErrorAction SilentlyContinue

# Run migrations
python manage.py migrate
```



