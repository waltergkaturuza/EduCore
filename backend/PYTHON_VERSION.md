# Python Version Compatibility

## Recommended Python Versions

**For EduCore, we recommend:**
- **Python 3.11.x** (Best compatibility)
- **Python 3.12.x** (Good compatibility)

## Python 3.13 Compatibility Issues

If you're using **Python 3.13**, you may encounter build errors with:
- `psycopg2-binary` - No pre-built wheels yet
- `pandas` - May need to build from source
- `numpy` - May need to build from source
- Other packages with C extensions

### Why This Happens

Python 3.13 was released recently (October 2024), and many packages haven't released pre-built wheels (binary distributions) for it yet. When pip can't find a pre-built wheel, it tries to build from source, which requires:
- Visual C++ Build Tools
- Proper build environment
- More time and resources

### Solutions

#### Option 1: Use Python 3.11 or 3.12 (Recommended)

1. **Download Python 3.11 or 3.12:**
   - Visit: https://www.python.org/downloads/
   - Download Python 3.11.9 or Python 3.12.7

2. **Create new virtual environment:**
   ```powershell
   # Remove old venv
   Remove-Item -Recurse -Force venv
   
   # Create new venv with Python 3.11/3.12
   py -3.11 -m venv venv
   # or
   py -3.12 -m venv venv
   
   # Activate
   venv\Scripts\activate
   
   # Verify version
   python --version
   ```

3. **Install dependencies:**
   ```powershell
   python -m pip install --upgrade pip setuptools wheel
   .\install-windows.ps1
   ```

#### Option 2: Install Visual C++ Build Tools

If you must use Python 3.13:

1. **Download Microsoft C++ Build Tools:**
   - https://visualstudio.microsoft.com/visual-cpp-build-tools/

2. **Install "Desktop development with C++" workload**

3. **Restart your terminal**

4. **Try installation again:**
   ```powershell
   pip install -r requirements.txt
   ```

#### Option 3: Use Alternative Packages

For `psycopg2-binary`, you can use `psycopg3` instead:

1. **Edit `requirements.txt`:**
   ```python
   # Replace this line:
   # psycopg2-binary>=2.9.9
   
   # With this:
   psycopg[binary]>=3.1.0
   ```

2. **Update Django settings** (if needed):
   - `psycopg3` uses a slightly different connection string format
   - Most Django code works without changes

## Checking Your Python Version

```powershell
python --version
```

## Installing Multiple Python Versions

You can have multiple Python versions installed:

```powershell
# Check available Python versions
py --list

# Create venv with specific version
py -3.11 -m venv venv
py -3.12 -m venv venv
```

## Summary

- **Best choice:** Python 3.11 or 3.12
- **If using 3.13:** Install Visual C++ Build Tools or use alternative packages
- **Most packages:** Have pre-built wheels for Python 3.11/3.12




