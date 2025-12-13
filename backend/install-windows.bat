@echo off
echo Installing EduCore Backend Dependencies for Windows...
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Upgrade pip, setuptools, and wheel
echo Upgrading pip, setuptools, and wheel...
python -m pip install --upgrade pip setuptools wheel

REM Install NumPy first (required for pandas, often has pre-built wheels)
echo Installing NumPy...
pip install numpy

REM Install Pillow separately (often has issues on Windows)
echo Installing Pillow...
pip install Pillow

REM Install psycopg2-binary separately (PostgreSQL adapter)
echo Installing psycopg2-binary...
pip install psycopg2-binary

REM Install remaining dependencies
echo Installing other dependencies...
pip install -r requirements.txt

echo.
echo Installation complete!
echo.
echo Next steps:
echo 1. Create .env file from .env.example
echo 2. Configure database settings in .env
echo 3. Run: python manage.py migrate
echo 4. Run: python manage.py createsuperuser
echo 5. Run: python manage.py runserver
pause

