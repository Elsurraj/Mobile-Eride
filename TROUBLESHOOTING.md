# E-Ride Troubleshooting Guide

## 🚫 Common Issues & Solutions

### 1. ExpoSecureStore Web Compatibility Error

**Error**: `ExpoSecureStore.default.getValueWithKeyAsync is not a function`

**✅ FIXED**: This has been resolved by implementing a platform-specific storage abstraction in `utils/enhancedTokenManager.ts` that uses:
- **Native (iOS/Android)**: ExpoSecureStore
- **Web**: localStorage with fallback to memory storage

### 2. Authentication API Errors

**Errors**: 
- `POST http://localhost:8000/api/v1/login/access-token 400 (Bad Request)`
- `POST http://localhost:8000/api/v1/password-recovery/elsurraj%40gmail.com 404 (Not Found)`

**✅ FIXED**: These issues were due to:
1. **Backend not running** - Start the backend server
2. **User doesn't exist** - Need to register first or use admin credentials

**Solutions:**
1. Start backend server:
   ```bash
   cd backend
   node server.js
   ```

2. Use admin credentials for testing:
   - Email: `admin@eride.com`
   - Password: `admin123`

3. Or register a new user first via the signup screen

### 3. Splash Screen Timer Issues

**Error**: Site fails to load early, setTimeout showing errors

**✅ FIXED**: Improved splash screen timer handling:
- Increased timeout from 5 to 7 seconds
- Added error handling with retry mechanism
- Improved cleanup of timers

### 4. Deprecated Style Props Warnings

**Warnings**:
- `"shadow*" style props are deprecated. Use "boxShadow"`
- `props.pointerEvents is deprecated. Use style.pointerEvents`

**✅ FIXED**: Replaced all deprecated shadow props with web-compatible `boxShadow` in:
- `components/SplashScreen.tsx`
- `components/Dashboard.tsx`
- `components/BottomNav.tsx`

## 🧪 Testing the Fixes

### Backend API Testing

Run the test script to verify all endpoints work:

```bash
# Install node-fetch if needed
npm install node-fetch

# Run the test
node test-backend.js
```

Expected output:
```
🧪 Testing E-Ride Backend APIs...

1. Testing Health Check...
✅ Health Check: E-Ride API is running

2. Testing User Registration...
✅ Registration: User created successfully

3. Testing User Login...
✅ Login successful: OTP sent to your email. Use code: 123456

4. Testing OTP Verification...
✅ OTP Verification successful
👤 User: Admin User (admin@eride.com)

5. Testing Password Recovery...
✅ Password Recovery: Password recovery email sent

🎉 Backend testing complete!
```

### Frontend Testing

1. **Start the backend**:
   ```bash
   cd backend
   node server.js
   ```

2. **Start the frontend**:
   ```bash
   npx expo start --web
   ```

3. **Test signup flow**:
   - Go to signup screen
   - Fill in form with valid data
   - Should successfully create account and auto-login

4. **Test login flow**:
   - Use admin credentials: `admin@eride.com` / `admin123`
   - Enter OTP code shown in backend console
   - Should successfully authenticate

## 🐛 If Issues Persist

### Check Environment Variables
Ensure `.env` file has correct API URL:
```
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### Clear Storage (Web)
If authentication is stuck, clear browser storage:
```javascript
// In browser console
localStorage.clear();
```

### Check Network Connection
Verify backend is accessible:
```bash
curl http://localhost:8000/api/v1/utils/health-check/
```

### Console Debugging
Check browser dev tools console for:
- Network requests and responses
- JavaScript errors
- Authentication flow logs

## 📊 Backend Database

The backend uses SQLite with default admin account:
- **Email**: admin@eride.com
- **Password**: admin123

Database file: `backend/eride.db`

## 🔧 Development Commands

```bash
# Start backend server
cd backend && node server.js

# Start frontend (web)
npx expo start --web

# Start frontend (mobile)
npx expo start

# Reset Expo cache
npx expo start -c

# Run tests
node test-backend.js
```

## 💡 Tips

1. **Always start backend first** before testing authentication
2. **Use admin account** for initial testing
3. **Check backend console** for OTP codes during development
4. **Use browser dev tools** to inspect network requests
5. **Clear storage** if authentication state gets corrupted

## 📝 Recent Fixes Applied

✅ Fixed ExpoSecureStore web compatibility
✅ Fixed splash screen timer issues  
✅ Replaced deprecated shadow style props
✅ Improved error handling in AuthContext
✅ Added comprehensive backend testing
✅ Improved authentication flow reliability
