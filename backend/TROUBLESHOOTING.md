# Troubleshooting Guide - Windows Installation Issues

## Common Installation Problems

### 1. Pillow Build Errors

**Error:** `KeyError: '__version__'` or build failures

**Solution:**
```powershell
python -m pip install --upgrade pip setuptools wheel
pip install numpy
pip install Pillow
pip install -r requirements.txt
```

### 2. Pandas/NumPy Build Errors

**Error:** C++ compilation errors, `ninja: build stopped`, or `metadata-generation-failed`

**Solution:**
```powershell
# Step 1: Update build tools
python -m pip install --upgrade pip setuptools wheel

# Step 2: Install NumPy first (usually has pre-built wheels)
pip install numpy

# Step 3: Install pandas (should now use pre-built wheels)
pip install pandas

# Step 4: Install remaining packages
pip install -r requirements.txt
```

### 3. Python Version Compatibility

**Issue:** Packages failing with Python 3.12+

**Solution:**
- Use Python 3.11 (recommended for compatibility)
- Or update packages to latest versions:
  ```powershell
  pip install --upgrade numpy pandas Pillow
  ```

### 4. Visual C++ Build Tools Required

**Error:** C++ compilation errors, missing compiler

**Solution:**
1. Download [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Install "Desktop development with C++" workload
3. Restart terminal
4. Try installation again

### 5. Using Pre-built Wheels Only

**If all else fails, force pre-built wheels:**

```powershell
pip install --only-binary :all: numpy pandas Pillow
pip install -r requirements.txt
```

**Note:** This will fail if pre-built wheels aren't available for your Python version/architecture.

## Quick Fix Script

Run the installation script which handles these issues:

**PowerShell:**
```powershell
cd backend
.\install-windows.ps1
```

**Command Prompt:**
```cmd
cd backend
install-windows.bat
```

## Step-by-Step Manual Fix

1. **Activate virtual environment:**
   ```powershell
   venv\Scripts\activate
   ```

2. **Update pip and build tools:**
   ```powershell
   python -m pip install --upgrade pip setuptools wheel
   ```

3. **Install problematic packages separately:**
   ```powershell
   pip install numpy
   pip install Pillow
   pip install pandas
   ```

4. **Install remaining dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

## Check Installation

Verify packages are installed correctly:

```powershell
python -c "import numpy; import pandas; import PIL; print('All packages installed successfully!')"
```

## Alternative: Skip Problematic Packages

If you don't need image processing or data analysis immediately:

1. Comment out in `requirements.txt`:
   ```
   # Pillow>=10.2.0
   # pandas>=2.2.0
   # numpy>=1.26.0
   ```

2. Install other dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

3. Install them later when needed:
   ```powershell
   pip install numpy pandas Pillow
   ```

### 6. psycopg2-binary Build Errors

**Error:** `fatal error LNK1104: cannot open file 'python313t.lib'` or build failures

**Cause:** Python 3.13 is very new and `psycopg2-binary` may not have pre-built wheels yet.

**Solution 1: Use Python 3.11 or 3.12 (Recommended)**
```powershell
# Check your Python version
python --version

# If you have Python 3.13, consider using Python 3.11 or 3.12
# Download from: https://www.python.org/downloads/
```

**Solution 2: Install psycopg2-binary separately**
```powershell
pip install psycopg2-binary
```

**Solution 3: Use psycopg3 (alternative PostgreSQL adapter)**
```powershell
# Edit requirements.txt and replace:
# psycopg2-binary>=2.9.9
# with:
# psycopg[binary]>=3.1.0

pip install psycopg[binary]
```

**Solution 4: Install Visual C++ Build Tools**
- Required if building from source
- Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Install "Desktop development with C++" workload

## Still Having Issues?

1. **Check Python version:**
   ```powershell
   python --version
   ```
   **Recommended: Python 3.11.x or 3.12.x**
   - Python 3.13 is very new and many packages don't have wheels yet
   - If using 3.13, consider downgrading to 3.11 or 3.12

2. **Check pip version:**
   ```powershell
   pip --version
   ```
   Should be 23.0 or higher

3. **Clear pip cache:**
   ```powershell
   pip cache purge
   ```

4. **Try fresh virtual environment:**
   ```powershell
   deactivate
   Remove-Item -Recurse -Force venv
   python -m venv venv
   venv\Scripts\activate
   python -m pip install --upgrade pip setuptools wheel
   pip install numpy Pillow pandas
   pip install -r requirements.txt
   ```

