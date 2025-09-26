# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

E-Ride is a complete ride-sharing mobile application built with React Native (Expo) and a Node.js/Express backend. It replicates the His-eride project functionality with exact color matching and design patterns.

## Architecture

### Frontend Structure
- **React Native/Expo** app with TypeScript
- **File-based routing** using Expo Router with dual navigation systems:
  - Custom navigation (`components/AppNavigator.tsx`) for auth flow
  - Tab-based navigation (`app/(tabs)/`) for main app screens
- **Authentication flow**: Splash → Login → OTP Verification → Dashboard
- **State management**: React Context for auth, React Query for API calls
- **Token management**: Secure storage with automatic expiration handling

### Backend Structure
- **Node.js/Express** API server (`backend/server.js`)
- **SQLite database** with in-memory OTP storage for demo
- **JWT authentication** with 2-factor OTP verification
- **RESTful API** following `/api/v1/` pattern

## Development Commands

### Frontend
```powershell
# Install dependencies
npm install

# Start development server
npm start

# Platform-specific runs
npm run android
npm run ios  
npm run web

# Linting
npm run lint

# Reset project (clean start)
npm run reset-project
```

### Backend
```powershell
cd backend

# Install backend dependencies
npm install

# Start development server
npm run dev

# Production start
npm start
```

## Key Architecture Patterns

### Authentication Flow
The app uses a dual-layer authentication system:
1. **Login**: Email/password → temporary JWT token
2. **OTP Verification**: 6-digit code → verified JWT token
3. **Token Storage**: `enhancedTokenManager` handles secure storage and automatic expiration

**Key Files:**
- `contexts/AuthContext.tsx` - Global auth state
- `utils/enhancedTokenManager.ts` - Token management utilities
- `components/AppNavigator.tsx` - Auth flow orchestration

### Navigation Architecture
The app uses a hybrid navigation approach:
- **Custom Navigator** (`AppNavigator.tsx`) handles pre-auth screens (splash, login, signup, OTP)
- **Expo Router** (`app/(tabs)/`) handles post-auth tabbed navigation
- **Custom Bottom Navigation** (`BottomNav.tsx`) overlays the default tab bar

### API Architecture
Backend follows RESTful patterns with consistent error handling:
- `/api/v1/login/access-token` - Login endpoint
- `/api/v1/auth/otp/verify` - OTP verification
- `/api/v1/users/me` - Current user data
- JWT middleware on protected routes

### Design System
Comprehensive design system in `constants/theme.ts`:
- **Brand Colors**: Primary (`#2d1d0c`), Secondary (`#fcd424`)
- **Typography**: Montserrat font family with structured scale
- **Component Styles**: Reusable button and input styles
- **Theme Support**: Light/dark mode with consistent brand colors

## Environment Configuration

### Frontend (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_APP_NAME=E-Ride
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### Backend (.env)
```
PORT=8000
JWT_SECRET=your-secret-key-change-in-production
```

## Database Schema

### Users Table
- `id`, `email`, `password` (bcrypt hashed)
- `full_name`, `role` (rider/driver/courier)
- `is_active`, `is_superuser`, `created_at`

### Default Admin User
- Email: `admin@eride.com`
- Password: `admin123`

## Testing & Demo

### Demo Credentials
- **Any email/password combination** works for login
- **OTP Code**: Use `123456` for demo purposes
- **Backend generates** 6-digit OTP codes (logged to console)

### API Testing
- Health check: `GET http://localhost:8000/api/v1/utils/health-check/`
- Backend logs generated OTP codes to console for testing

## Development Guidelines

### Component Structure
- **Screen components** in `components/` (LoginScreen, Dashboard, etc.)
- **Navigation components** handle state transitions
- **Reusable UI components** follow theme system patterns

### State Management
- **Global auth state** via AuthContext
- **API calls** via React Query with error handling
- **Token management** via enhancedTokenManager utility

### Error Handling
- **API errors** automatically clear tokens on 401/403
- **React Query** configured with retry logic
- **User feedback** via Alert dialogs

## File Structure Highlights

```
/
├── app/                    # Expo Router file-based routing
│   ├── _layout.tsx        # Root layout with providers
│   └── (tabs)/            # Tab-based navigation
├── components/            # Screen and UI components
├── contexts/              # React Context providers
├── utils/                 # Utility functions
├── constants/            # Theme and configuration
├── backend/              # Node.js API server
│   ├── server.js         # Main server file
│   └── eride.db          # SQLite database
└── README.md             # Detailed setup instructions
```

## Common Debugging

### OTP Issues
- Check backend console for generated OTP codes
- Demo OTP `123456` always works
- OTP expires after 5 minutes

### Token Issues
- Tokens automatically cleared on API errors
- Check `enhancedTokenManager` for token validation
- JWT tokens expire after 24 hours

### Navigation Issues
- `AppNavigator` handles pre-auth flow
- Expo Router handles post-auth tabs
- Auth state changes trigger navigation updates

## Recent Updates & Fixes Applied

### ✅ Completed Major Fixes
1. **Backend API Integration** - Updated all API calls to use His-Eride endpoints
   - `/api/v1/login/access-token` with OAuth2 FormData
   - `/api/v1/login/verify-otp` for OTP verification 
   - `/api/v1/password-recovery/{email}` and `/api/v1/reset-password/`
   - Proper error handling with `data.detail` format

2. **Forgot Password Flow** - Complete implementation
   - Email-based password reset request
   - Token validation and new password setting
   - Multi-step UI with proper validation

3. **OTP Screen Fixes** - Fully functional 6-digit input
   - Auto-focus and auto-advance
   - Proper validation and error handling
   - Resend functionality with cooldown timer

4. **Dashboard Implementation** - Complete user dashboard
   - User info display with badges
   - Session management and token info
   - Statistics cards and quick actions
   - Logout functionality

5. **Splash Screen Updates** - Match His-Eride design
   - Image integration and responsive layout
   - Auto-advance timer with manual controls
   - Proper slide indicators and navigation

6. **Navigation Flow** - Complete app navigation
   - Splash → Login → OTP → Dashboard flow
   - Forgot password integration
   - Proper state management

### 🔨 Current State
The app now has **complete authentication functionality** matching His-Eride:
- ✅ Splash screen with onboarding
- ✅ Login with email/password
- ✅ Forgot password flow (email → token → reset)
- ✅ OTP verification (6-digit input)
- ✅ Dashboard with user info
- ✅ Backend API integration
- ✅ Navigation between all screens

### 🧪 Testing Instructions

#### 1. Start His-Eride Backend
```powershell
# Navigate to His-Eride backend
cd "C:\Users\Dell\Desktop\His-Eride"

# Start with Docker
docker-compose up -d

# Or start manually if configured
python -m app.main
```

#### 2. Start E-Ride Frontend
```powershell
# Navigate to this project
cd "C:\Users\Dell\Desktop\Eride"

# Install and start
npm install
npm start
```

#### 3. Test Authentication Flow
1. **Splash Screen** - Wait for auto-advance or click Continue
2. **Login** - Use any email/password (or His-Eride test credentials)
3. **OTP** - Check backend logs for OTP code or use generated codes
4. **Dashboard** - View user info and session details
5. **Forgot Password** - Test email reset flow
6. **Logout** - Test logout and return to login

### ⚠️ Known Limitations
- Email service needs to be configured in His-Eride backend for actual email delivery
- OTP codes are logged to console for testing
- Some UI components use placeholder data
- Backend health status is simulated in dashboard

### 🎯 Remaining Tasks
- Fine-tune design system to exactly match His-Eride colors
- Add comprehensive error handling for edge cases
- Performance testing and optimization
- Add loading animations and better UX feedback

## Production Considerations

- Change JWT secret in production
- Configure email service (SendGrid/SMTP) in His-Eride backend
- Add proper error logging and monitoring
- Implement refresh token mechanism
- Add proper environment variable validation
