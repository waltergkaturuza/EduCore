# Database Setup Guide

## PostgreSQL Connection Error Fix

If you see: `psycopg2.OperationalError: password authentication failed for user "postgres"`

This means your `.env` file has incorrect database credentials.

## Step 1: Check PostgreSQL is Running

**Windows:**
1. Press `Win + R`, type `services.msc`, press Enter
2. Look for "postgresql" service
3. Make sure it's "Running"
4. If not, right-click and select "Start"

**Or check via command:**
```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*
```

## Step 2: Find Your PostgreSQL Password

If you installed PostgreSQL, you set a password during installation. You need to use that password.

**If you forgot the password:**

### Option A: Reset PostgreSQL Password (Windows)

1. **Stop PostgreSQL service:**
   ```powershell
   Stop-Service postgresql-x64-14  # Adjust version number if different
   ```

2. **Edit `pg_hba.conf`:**
   - Location: `C:\Program Files\PostgreSQL\14\data\pg_hba.conf` (adjust version/path)
   - Find line: `host all all 127.0.0.1/32 md5`
   - Change to: `host all all 127.0.0.1/32 trust`
   - Save file

3. **Start PostgreSQL:**
   ```powershell
   Start-Service postgresql-x64-14
   ```

4. **Connect and reset password:**
   ```powershell
   psql -U postgres
   ```
   Then in psql:
   ```sql
   ALTER USER postgres WITH PASSWORD 'newpassword';
   \q
   ```

5. **Revert pg_hba.conf:**
   - Change back to: `host all all 127.0.0.1/32 md5`
   - Restart PostgreSQL

### Option B: Use Default/Common Passwords

Try these common defaults:
- `postgres`
- `admin`
- `password`
- (empty/blank)

## Step 3: Update .env File

Edit `backend/.env` and update the database password:

```env
DB_NAME=educore
DB_USER=postgres
DB_PASSWORD=your_actual_password_here  # Update this!
DB_HOST=localhost
DB_PORT=5432
```

## Step 4: Create the Database

If the database doesn't exist, create it:

```powershell
# Connect to PostgreSQL
psql -U postgres

# In psql prompt, create database:
CREATE DATABASE educore;

# Exit psql
\q
```

**Or using SQL command directly:**
```powershell
psql -U postgres -c "CREATE DATABASE educore;"
```

## Step 5: Test Connection

Test if you can connect:

```powershell
psql -U postgres -d educore
```

If it asks for a password and accepts it, you're good!

## Step 6: Run Migrations

Now try migrations again:

```powershell
python manage.py migrate
```

## Alternative: Use SQLite for Development (Quick Fix)

If you want to skip PostgreSQL setup for now, you can use SQLite:

1. **Edit `backend/educore/settings.py`:**
   Find the DATABASES section and replace with:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.sqlite3',
           'NAME': BASE_DIR / 'db.sqlite3',
       }
   }
   ```

2. **Remove psycopg2-binary from requirements.txt temporarily:**
   ```python
   # psycopg2-binary>=2.9.9  # Comment this out
   ```

3. **Run migrations:**
   ```powershell
   python manage.py migrate
   ```

**Note:** SQLite is fine for development, but use PostgreSQL for production.

## Troubleshooting

### "psql: command not found"

PostgreSQL bin directory is not in PATH. Add it:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\14\bin"  # Adjust version
```

### "FATAL: database 'educore' does not exist"

Create the database (see Step 4 above).

### "Connection refused"

PostgreSQL service is not running. Start it (see Step 1).

### Still having issues?

1. Check PostgreSQL is installed:
   ```powershell
   Get-Command psql -ErrorAction SilentlyContinue
   ```

2. Check PostgreSQL version:
   ```powershell
   psql --version
   ```

3. Try connecting with different credentials:
   ```powershell
   psql -U postgres -h localhost
   ```



