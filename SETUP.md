# EduCore Setup Guide

## Prerequisites

- **Python 3.11 or 3.12** (recommended - Python 3.13 may have compatibility issues)
- Node.js 18+
- PostgreSQL 14+
- Redis (for Celery)
- Docker & Docker Compose (optional)

**Important:** If you're using Python 3.13, some packages (like `psycopg2-binary`) may not have pre-built wheels yet. Consider using Python 3.11 or 3.12 for better compatibility.

## Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   
   # On Windows PowerShell:
   venv\Scripts\activate
   
   # On Windows CMD:
   venv\Scripts\activate.bat
   
   # On Linux/Mac:
   source venv/bin/activate
   ```

3. **Update pip, setuptools, and wheel (recommended):**
   ```bash
   python -m pip install --upgrade pip setuptools wheel
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   
      **Note for Windows users:** If Pillow or pandas installation fails, try:
   ```bash
   # Install NumPy first (uses pre-built wheels)
   pip install numpy
   # Install Pillow separately (uses pre-built wheels)
   pip install Pillow
   # Install pandas (should now use pre-built wheels)
   pip install pandas
   # Then install the rest
   pip install -r requirements.txt
   ```
   
   **Or use the provided installation script:**
   - PowerShell: `.\install-windows.ps1`
   - CMD: `install-windows.bat`

4. **Create .env file:**
   ```bash
   # On Windows PowerShell:
   Copy-Item .env.example .env
   
   # On Windows CMD:
   copy .env.example .env
   
   # On Linux/Mac:
   cp .env.example .env
   ```
   
   Then edit `.env` with your configuration. See `backend/CREATE_ENV.md` for detailed instructions.
   
   **Minimum required settings:**
   - `SECRET_KEY` - Generate one using: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
   - `DB_PASSWORD` - Your PostgreSQL password

5. **Create database:**
   ```bash
   # Make sure PostgreSQL is running
   createdb educore
   ```

6. **Run migrations:**
   ```bash
   # If you get "relation 'users' does not exist" error, run in this order:
   python manage.py migrate contenttypes
   python manage.py migrate auth
   python manage.py migrate tenants
   python manage.py migrate users
   python manage.py migrate
   
   # Or try all at once:
   python manage.py migrate
   ```
   
   **Note:** If migrations fail, see `backend/MIGRATION_FIX.md` for troubleshooting.

7. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

8. **Run development server:**
   ```bash
   python manage.py runserver
   ```

## Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

4. **Run development server:**
   ```bash
   npm start
   ```

## Docker Setup (Alternative)

1. **Build and start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Run migrations:**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

3. **Create superuser:**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

## Initial Configuration

1. **Access Django Admin:**
   - URL: http://localhost:8000/admin
   - Login with superuser credentials

2. **Create a Tenant (School):**
   - Go to Tenants section
   - Create a new tenant
   - Note the slug (used for subdomain)

3. **Create Users:**
   - Create admin, teacher, parent, and student users
   - Assign them to the tenant

4. **Set up Academic Year:**
   - Create an academic year
   - Create terms within the year
   - Set as current year in tenant settings

5. **Create Classes and Subjects:**
   - Create classes for the academic year
   - Create subjects
   - Set up timetable slots

## API Documentation

Once the backend is running, access API documentation at:
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Production Deployment

1. **Set DEBUG=False in settings.py**
2. **Configure ALLOWED_HOSTS**
3. **Set up proper database (PostgreSQL)**
4. **Configure static files (S3 or CDN)**
5. **Set up SSL/TLS certificates**
6. **Configure environment variables**
7. **Run collectstatic:**
   ```bash
   python manage.py collectstatic
   ```

## Troubleshooting

### Package Installation Issues on Windows

#### Pillow Installation Errors

If you encounter `KeyError: '__version__'` or build errors with Pillow:

**Solution 1: Update build tools first (Recommended)**
```bash
python -m pip install --upgrade pip setuptools wheel
pip install numpy  # Install NumPy first
pip install Pillow
pip install -r requirements.txt
```

**Solution 2: Use pre-built wheels**
```bash
pip install --only-binary :all: numpy Pillow pandas
pip install -r requirements.txt
```

**Solution 3: Install Visual C++ Build Tools**
- Download and install [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Or install [Visual Studio Community](https://visualstudio.microsoft.com/) with C++ workload
- Restart your terminal and try again

**Solution 4: Skip temporarily (if not using those features yet)**
```bash
# Comment out problematic packages in requirements.txt temporarily
pip install -r requirements.txt
# Install them later when needed
```

#### Pandas/NumPy Build Errors

If you see C++ compilation errors when installing pandas:

**Solution 1: Install NumPy first (Recommended)**
```bash
python -m pip install --upgrade pip setuptools wheel
pip install numpy  # NumPy usually has pre-built wheels
pip install pandas  # Pandas should now use pre-built wheels
pip install -r requirements.txt
```

**Solution 2: Use pre-built wheels only**
```bash
pip install --only-binary :all: numpy pandas
pip install -r requirements.txt
```

**Solution 3: Check Python version**
- Pandas 2.1.3 may have issues with Python 3.12+
- Consider using Python 3.11 or update to pandas 2.2.0+
- Check: `python --version`

**Solution 4: Install Visual C++ Build Tools**
- Required if packages must be built from source
- Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Install "Desktop development with C++" workload

#### psycopg2-binary Build Errors

If you see `fatal error LNK1104: cannot open file 'python313t.lib'`:

**This indicates you're using Python 3.13**, which is very new and many packages don't have pre-built wheels yet.

**Solution 1: Use Python 3.11 or 3.12 (Strongly Recommended)**
- Download Python 3.11 or 3.12 from https://www.python.org/downloads/
- Create a new virtual environment with the older Python version
- Most packages have pre-built wheels for Python 3.11/3.12

**Solution 2: Install psycopg2-binary separately**
```bash
pip install psycopg2-binary
```

**Solution 3: Use psycopg3 instead (alternative)**
```bash
# In requirements.txt, replace psycopg2-binary with:
# psycopg[binary]>=3.1.0
pip install psycopg[binary]
```

**Solution 4: Install Visual C++ Build Tools**
- Required if building from source
- Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in .env
- Verify database exists
- On Windows, make sure PostgreSQL service is running: `services.msc`

### CORS Issues
- Add frontend URL to CORS_ALLOWED_ORIGINS in settings.py

### SMS Not Working
- Configure Twilio credentials in .env
- Check SMS logs in admin panel

### Static Files Not Loading
- Run `python manage.py collectstatic`
- Configure STATIC_ROOT and STATIC_URL

### Virtual Environment Issues
- If activation doesn't work, make sure you're using the correct command:
  - PowerShell: `venv\Scripts\activate`
  - CMD: `venv\Scripts\activate.bat`
  - Git Bash: `source venv/Scripts/activate`

## Support

For issues and questions, please refer to the documentation or contact support.

