# PowerShell Virtual Environment Activation

## Issue
PowerShell doesn't recognize `.\venv\Scripts\activate` because PowerShell uses `.ps1` files, not shell scripts.

## Solution

### Option 1: Use Activate.ps1 (Recommended)
```powershell
.\venv\Scripts\Activate.ps1
```

### Option 2: Use activate.bat
```powershell
.\venv\Scripts\activate.bat
```

### Option 3: If you get execution policy error
If you get an error about execution policy, run this first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then activate:
```powershell
.\venv\Scripts\Activate.ps1
```

### Option 4: Direct Python Path (No Activation)
If activation doesn't work, you can use the Python directly:
```powershell
.\venv\Scripts\python.exe manage.py runserver
```

## Quick Check
To verify your virtual environment exists:
```powershell
Test-Path .\venv\Scripts\Activate.ps1
```

If it returns `True`, the venv exists. If `False`, create it:
```powershell
python -m venv venv
```

## For Your Current Issue
Since you're trying to run the backend server, you can either:

1. **Activate first, then run:**
   ```powershell
   .\venv\Scripts\Activate.ps1
   python manage.py runserver
   ```

2. **Run directly without activation:**
   ```powershell
   .\venv\Scripts\python.exe manage.py runserver
   ```

3. **Use the full path:**
   ```powershell
   & ".\venv\Scripts\python.exe" manage.py runserver
   ```



