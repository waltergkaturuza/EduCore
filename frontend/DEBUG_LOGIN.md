# Debugging Login Issues

## Issue: Frontend fails to login but backend returns 200

### Check Browser Console

Open browser DevTools (F12) and check:
1. **Console tab** - Look for error messages
2. **Network tab** - Check the `/api/auth/login/` request:
   - Click on the request
   - Check "Response" tab to see what the backend actually returned
   - Check "Headers" to see request/response headers

### Expected Response Format

The backend should return:
```json
{
  "user": {
    "id": 1,
    "email": "admin@educore.co.zw",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin",
    ...
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

### Common Issues

1. **Response format mismatch**
   - Backend might be returning `{ "access": "...", "refresh": "...", "user": {...} }`
   - Frontend expects `{ "user": {...}, "tokens": { "access": "...", "refresh": "..." } }`

2. **CORS issues**
   - Check if OPTIONS request is successful
   - Check CORS headers in response

3. **Authentication failure**
   - Verify user exists in database
   - Check password is correct
   - Verify user is active

### Testing Steps

1. **Test backend directly:**
   ```bash
   curl -X POST http://localhost:8000/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@educore.co.zw","password":"yourpassword"}'
   ```

2. **Check browser console:**
   - Look for the login response
   - Check if response structure matches expected format

3. **Verify user exists:**
   ```bash
   python manage.py shell
   >>> from apps.users.models import User
   >>> User.objects.filter(email='admin@educore.co.zw').exists()
   ```




