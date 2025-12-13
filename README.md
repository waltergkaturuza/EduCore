# EduCore - Multi-Tenant School Management System

A comprehensive, cloud-first School Management System designed for Zimbabwean primary and secondary schools.

## Features

### Core Administration
- Multi-school tenant onboarding
- Role-based access control (RBAC)
- Academic year & term management
- Student data management with bulk import/export
- Attendance tracking (daily/period, offline sync)
- Timetable builder
- Staff management

### Academic & Assessment
- Lesson plans & curriculum mapping
- Assignments & homework
- Flexible gradebooks & assessments
- Automatic report cards (PDF export)
- Learning analytics

### Parent & Student Portals
- Student dashboard (attendance, marks, timetable)
- Parent portal (payments, messages, reports)
- Multi-language support (English, Shona, Ndebele)

### Communication
- SMS gateway integration
- WhatsApp Business notifications
- In-app messaging
- Parent-teacher meeting scheduler

### Finance
- Fee structures & invoicing
- Payment gateway integrations (EcoCash, Paynow)
- Finance reports & dashboards

### e-Learning
- LMS module with course materials
- Video lessons
- Quizzes with auto-grading
- Offline content support

## Tech Stack

### Backend
- Django + Django REST Framework
- PostgreSQL
- Redis (caching)
- Celery (background tasks)

### Frontend
- React + TypeScript
- Material UI / Tailwind CSS
- React Router

### Mobile
- React Native (future)

### Infrastructure
- Docker + Kubernetes
- AWS/GCP/Azure
- GitHub Actions (CI/CD)

## Project Structure

```
EduCore/
├── backend/          # Django backend
├── frontend/         # React frontend
├── mobile/          # React Native app (future)
├── docs/            # Documentation
└── docker/          # Docker configurations
```

## Getting Started

### Prerequisites
- **Python 3.11 or 3.12** (recommended - Python 3.13 may have compatibility issues)
- Node.js 18+
- PostgreSQL 14+
- Redis

**Note:** If you're using Python 3.13, some packages may not have pre-built wheels yet. Consider using Python 3.11 or 3.12 for better compatibility. See `backend/PYTHON_VERSION.md` for details.

### Backend Setup
```bash
cd backend
python -m venv venv

# On Windows PowerShell:
venv\Scripts\activate

# On Windows CMD:
venv\Scripts\activate.bat

# On Linux/Mac:
source venv/bin/activate

# Update pip and build tools (recommended):
python -m pip install --upgrade pip setuptools wheel

# Install dependencies:
pip install -r requirements.txt

# If Pillow or pandas installation fails on Windows, try:
# pip install numpy
# pip install Pillow
# pip install pandas
# pip install -r requirements.txt

# Create .env file from example:
# PowerShell: Copy-Item .env.example .env
# CMD: copy .env.example .env
# Then edit .env with your database credentials

# Then continue with:
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Windows Users:** If you encounter Pillow installation issues, use the provided install scripts:
- PowerShell: `.\install-windows.ps1`
- CMD: `install-windows.bat`

### Frontend Setup
```bash
cd frontend
npm install
# If you get TypeScript version conflicts, use:
# npm install --legacy-peer-deps
npm start
```

**Note:** If you encounter TypeScript version conflicts, see `frontend/INSTALL_FIX.md` for solutions.

## Testing Different User Roles

To see different views (Admin, Teacher, Parent, Student):

1. **Create test users:**
   ```bash
   cd backend
   python manage.py shell
   # Then run the code from backend/create_test_users.py
   ```

2. **Or use Django Admin:**
   - Go to http://localhost:8000/admin
   - Create users with different roles
   - See `USER_ROLES_GUIDE.md` for detailed instructions

3. **Login with different users:**
   - Logout from current session
   - Login with different credentials
   - Menu items and dashboard will change based on role

See `USER_ROLES_GUIDE.md` for complete guide on roles and permissions.

## MVP Features (Phase 1)
- ✅ Tenant onboarding
- ✅ User management (admin/teacher/parent/student)
- ✅ Student registration & enrollment
- ✅ Timetable builder
- ✅ Daily attendance
- ✅ Basic gradebook
- ✅ Parent portal
- ✅ SMS notifications
- ✅ Fee invoices
- ✅ e-Learning module
- ✅ In-app messaging
- ✅ Report cards

## Frontend Pages
- ✅ Login & Authentication
- ✅ Dashboard with statistics
- ✅ Students management
- ✅ Classes management
- ✅ Attendance tracking
- ✅ Assessments & Grades
- ✅ Fee management
- ✅ Messages
- ✅ e-Learning portal

## License
Proprietary - All rights reserved

