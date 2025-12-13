# PowerShell script for installing EduCore backend dependencies on Windows

Write-Host "Installing EduCore Backend Dependencies for Windows..." -ForegroundColor Green
Write-Host ""

# Activate virtual environment
& .\venv\Scripts\Activate.ps1

# Upgrade pip, setuptools, and wheel
Write-Host "Upgrading pip, setuptools, and wheel..." -ForegroundColor Yellow
python -m pip install --upgrade pip setuptools wheel

# Install NumPy first (required for pandas, often has pre-built wheels)
Write-Host "Installing NumPy..." -ForegroundColor Yellow
pip install numpy

# Install Pillow separately (often has issues on Windows)
Write-Host "Installing Pillow..." -ForegroundColor Yellow
pip install Pillow

# Install psycopg2-binary separately (PostgreSQL adapter)
Write-Host "Installing psycopg2-binary..." -ForegroundColor Yellow
pip install psycopg2-binary

# Install remaining dependencies
Write-Host "Installing other dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create .env file from .env.example"
Write-Host "2. Configure database settings in .env"
Write-Host "3. Run: python manage.py migrate"
Write-Host "4. Run: python manage.py createsuperuser"
Write-Host "5. Run: python manage.py runserver"

