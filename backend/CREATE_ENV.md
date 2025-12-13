# How to Create .env File

## Quick Method (PowerShell)

In your PowerShell terminal, navigate to the `backend` directory and run:

```powershell
cd backend
Copy-Item .env.example .env
```

## Alternative Method (Manual)

1. **Navigate to the backend directory:**
   ```powershell
   cd backend
   ```

2. **Copy the example file:**
   - **PowerShell:**
     ```powershell
     Copy-Item .env.example .env
     ```
   
   - **Command Prompt:**
     ```cmd
     copy .env.example .env
     ```
   
   - **Or manually:**
     - Copy `.env.example` file
     - Rename it to `.env`

3. **Edit the .env file:**
   - Open `.env` in any text editor (Notepad, VS Code, etc.)
   - Update the values with your actual configuration

## Required Configuration

### Minimum Required Settings

For development, you need to configure at least:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_NAME=educore
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_HOST=localhost
DB_PORT=5432
```

### Generate a Secret Key

You can generate a Django secret key using Python:

```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copy the output and paste it as your `SECRET_KEY` value.

## Database Setup

### If PostgreSQL is Already Installed

1. **Make sure PostgreSQL is running:**
   ```powershell
   # Check service status
   Get-Service -Name postgresql*
   # If not running, start it
   Start-Service postgresql-x64-14  # Adjust version if different
   ```

2. **Update `.env` with your PostgreSQL credentials:**
   ```env
   DB_NAME=educore
   DB_USER=postgres
   DB_PASSWORD=your_actual_password  # Use the password you set during installation
   DB_HOST=localhost
   DB_PORT=5432
   ```
   
   **Important:** If you forgot the password, see `DATABASE_SETUP.md` for password reset instructions.

3. **Create the database:**
   ```powershell
   # Using psql command line
   psql -U postgres
   CREATE DATABASE educore;
   \q
   ```

### If PostgreSQL is Not Installed

1. **Download PostgreSQL:**
   - Visit: https://www.postgresql.org/download/windows/
   - Download and install PostgreSQL 14 or later

2. **During installation:**
   - **Remember the password you set for the `postgres` user** - you'll need this!
   - Use this password in your `.env` file

3. **Create the database:**
   ```powershell
   psql -U postgres
   CREATE DATABASE educore;
   \q
   ```

### Password Authentication Failed?

If you see `password authentication failed for user "postgres"`:

1. **Check your `.env` file** - make sure `DB_PASSWORD` matches your PostgreSQL password
2. **Try common defaults:** `postgres`, `admin`, `password`, or blank
3. **Reset password:** See `DATABASE_SETUP.md` for detailed instructions
4. **Use SQLite temporarily:** See `DATABASE_SETUP.md` for SQLite setup (development only)

## Optional Settings

### SMS (Twilio) - Optional for Development

If you want to test SMS functionality:
1. Sign up at https://www.twilio.com/
2. Get your Account SID and Auth Token
3. Update `.env`:
   ```env
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### Payment Gateways - Optional

These are only needed if you're testing payment integrations:
```env
ECOCASH_API_KEY=your-key
PAYNOW_INTEGRATION_ID=your-id
PAYNOW_INTEGRATION_KEY=your-key
```

### AWS S3 - Optional (Production Only)

Only needed for production deployment:
```env
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=your-bucket
```

## Verify .env File

After creating and configuring `.env`, verify it exists:

```powershell
# Check if file exists
Test-Path .env

# View contents (be careful - contains secrets!)
Get-Content .env
```

## Security Notes

⚠️ **Important:**
- Never commit `.env` to version control (it's in `.gitignore`)
- Never share your `.env` file
- Use different values for development and production
- Keep your `SECRET_KEY` secret!

## Next Steps

After creating `.env`:

1. **Run migrations:**
   ```powershell
   python manage.py migrate
   ```

2. **Create superuser:**
   ```powershell
   python manage.py createsuperuser
   ```

3. **Run development server:**
   ```powershell
   python manage.py runserver
   ```

