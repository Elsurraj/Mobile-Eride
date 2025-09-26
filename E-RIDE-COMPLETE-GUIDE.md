# 🚗 E-Ride - Complete Application Guide

## 📖 About E-Ride

E-Ride is a comprehensive ride-sharing application built with modern technologies, featuring a React Native frontend powered by Expo and a Node.js backend. The app supports multiple user roles (Riders, Drivers, and Couriers) with secure authentication, real-time ride management, and integrated wallet functionality.

## 🏗️ Architecture Overview

```
E-Ride Application
├── 📱 Frontend (Expo + React Native)
│   ├── Web: http://localhost:8156
│   ├── Mobile: iOS & Android support
│   └── Technologies: Expo Router, TypeScript, React Native
│
└── 🖥️ Backend (Node.js + Express)
    ├── API: http://localhost:8000
    ├── Database: SQLite (eride.db)
    └── Technologies: Express, JWT, bcrypt, SQLite3
```

## 🎯 Core Features

### 🔐 **Authentication System**
- **Multi-step Authentication**: Email/Password → OTP Verification → Dashboard
- **Role-based Access**: Rider, Driver, Courier, Admin
- **Secure JWT Tokens**: 24-hour expiration with refresh capability
- **Password Recovery**: Email-based reset with secure tokens
- **OTP System**: 6-digit codes with 5-minute expiration (shown in backend console)

### 👥 **User Management**
- **User Roles**: 
  - **Riders**: Request rides and deliveries
  - **Drivers**: Accept and complete ride requests
  - **Couriers**: Handle delivery requests
  - **Admins**: System management and oversight

### 🚗 **Ride Management** (API Ready)
- **Ride Types**: Standard rides, Premium rides, Deliveries
- **Real-time Status**: Pending → Active → Completed/Cancelled
- **Location Tracking**: Pickup and drop-off locations
- **Rating System**: 5-star rating with comments
- **History**: Complete ride history with filtering

### 💰 **Wallet System** (API Ready)
- **Balance Management**: Real-time wallet balance
- **Transaction History**: Detailed transaction logs
- **Top-up Functionality**: Multiple payment methods
- **Withdrawal System**: Bank account integration
- **Automated Payments**: Ride payments and earnings

## 🚀 Technology Stack

### **Frontend**
```json
{
  "framework": "Expo (SDK 54)",
  "language": "TypeScript",
  "navigation": "Expo Router v6",
  "ui": "React Native",
  "state": "@tanstack/react-query",
  "storage": "Expo Secure Store",
  "styling": "Custom theme system"
}
```

### **Backend**
```json
{
  "runtime": "Node.js",
  "framework": "Express.js",
  "database": "SQLite3",
  "authentication": "JWT + bcrypt",
  "email": "Nodemailer (Gmail)",
  "cors": "Enabled for cross-origin"
}
```

## 📱 Application Flow

### **1. Authentication Flow**
```
User Login → Backend Verification → OTP Generation → 
Console Display → User Entry → JWT Token → Dashboard
```

**Step-by-step:**
1. User enters email/password
2. Backend validates credentials
3. OTP generated and displayed in **backend console**
4. User copies OTP from console
5. Frontend verifies OTP with backend
6. JWT token issued
7. User redirected to role-based dashboard

### **2. Complete User Journey**
```
Splash Screen → Login → OTP Verification → 
Onboarding (if needed) → Dashboard → Features
```

## 📂 Project Structure

```
Eride/
├── 📱 Frontend
│   ├── app/                    # Expo Router pages
│   │   ├── (auth)/            # Login, Signup, OTP, Forgot Password
│   │   ├── (dashboard)/       # Main dashboard screens
│   │   ├── (onboarding)/      # User onboarding flow
│   │   └── index.tsx          # App entry point
│   │
│   ├── components/            # Reusable UI components
│   │   ├── common/            # Shared components (ErrorMessage, etc.)
│   │   ├── dashboards/        # Role-specific dashboards
│   │   └── layout/            # Layout components
│   │
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx    # Global authentication state
│   │
│   ├── services/              # API integration
│   │   ├── api.ts             # Base API client
│   │   ├── ridesService.ts    # Ride management APIs
│   │   ├── walletService.ts   # Wallet operation APIs
│   │   └── mockData.ts        # Offline development data
│   │
│   ├── utils/                 # Utility functions
│   │   └── enhancedTokenManager.ts # Secure token storage
│   │
│   └── constants/             # App constants
│       └── theme.ts           # Design system
│
├── 🖥️ Backend
│   ├── server.js              # Main Express server
│   ├── eride.db               # SQLite database file
│   ├── .env                   # Environment configuration
│   └── package.json           # Node.js dependencies
│
├── 📋 Configuration Files
│   ├── package.json           # Frontend dependencies
│   ├── app.json               # Expo configuration
│   ├── babel.config.js        # Babel transformation
│   ├── metro.config.js        # Metro bundler setup
│   └── tsconfig.json          # TypeScript configuration
│
└── 📚 Documentation & Tests
    ├── README.md              # Original project readme
    ├── E-RIDE-COMPLETE-GUIDE.md # This comprehensive guide
    ├── TROUBLESHOOTING.md     # Common issues & solutions
    └── test-otp.js           # OTP functionality test
```

## 🗄️ Database Schema

### **Users Table**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,           -- bcrypt hashed
    full_name TEXT,
    role TEXT DEFAULT 'rider',       -- 'rider', 'driver', 'courier', 'admin'
    is_active INTEGER DEFAULT 1,
    is_superuser INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **OTPs Table**
```sql
CREATE TABLE otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,              -- 6-digit code
    purpose TEXT DEFAULT 'login',    -- 'login', 'password_reset'
    expires_at DATETIME NOT NULL,    -- 5 minutes from creation
    is_used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Default Data**
- **Admin User**: admin@eride.com / admin123
- **Auto-created** on server startup

## 🔌 API Endpoints

### **Authentication**
```http
POST /api/v1/auth/register          # Register new user
POST /api/v1/login/access-token     # Login (triggers OTP)
POST /api/v1/auth/otp/verify        # Verify OTP code
POST /api/v1/auth/otp/resend        # Resend OTP
POST /api/v1/password-recovery/:email # Password reset request
POST /api/v1/reset-password/        # Reset password with token
```

### **User Management**
```http
GET  /api/v1/users/me               # Get current user profile
PATCH /api/v1/users/me              # Update user profile
```

### **Utility**
```http
GET  /api/v1/utils/health-check/    # API health status
GET  /docs                          # Interactive API documentation
GET  /redoc                         # Alternative API docs
```

### **Future API Endpoints** (Ready for Implementation)
```http
# Rides
GET  /api/v1/rides                  # Get user rides
POST /api/v1/rides/request          # Request new ride
GET  /api/v1/rides/:id              # Get ride details

# Wallet
GET  /api/v1/wallet                 # Get wallet data
POST /api/v1/wallet/top-up          # Add funds
POST /api/v1/wallet/withdraw        # Withdraw funds
```

## 🚀 Getting Started

### **Prerequisites**
```bash
Node.js (v16+)
npm or yarn
Expo CLI
```

### **Quick Start Guide**

#### **1. Installation**
```bash
# Clone the repository
git clone <your-repo-url>
cd Eride

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### **2. Environment Setup**
```bash
# Frontend (.env) - Already configured
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_DEV_MODE=true

# Backend (backend/.env) - Already configured
PORT=8000
JWT_SECRET=your-super-secret-jwt-key
EMAIL_USER=your-email@gmail.com  # Optional for production
EMAIL_PASS=your-app-password     # Optional for production
```

#### **3. Start Both Servers**
```bash
# Terminal 1: Backend Server
cd backend
node server.js
# ✅ Server starts on http://localhost:8000

# Terminal 2: Frontend App  
cd ..
npx expo start --web
# ✅ Frontend starts on http://localhost:8156
```

#### **4. Test the Application**
```bash
# Access the web app
# Open: http://localhost:8156

# Test API health
# Open: http://localhost:8000/api/v1/utils/health-check/
```

## 👤 Testing & Demo

### **Login Credentials**
```
Email: admin@eride.com
Password: admin123
Role: Admin
```

### **Authentication Test Flow**
1. **Open** http://localhost:8156
2. **Click** "Log In" 
3. **Enter** admin@eride.com / admin123
4. **Check backend console** for OTP code (e.g., "719442")
5. **Enter OTP** in frontend
6. **Success** → Dashboard appears

### **OTP System**
- **Development Mode**: OTP codes shown in backend console
- **Production Mode**: OTP codes sent to email (when configured)
- **Expiration**: 5 minutes
- **Resend**: Available with cooldown

### **API Testing**
```bash
# Test OTP generation
node test-otp.js

# Manual API test
curl -X POST http://localhost:8000/api/v1/login/access-token \
     -H "Content-Type: application/json" \
     -d '{"username":"admin@eride.com","password":"admin123"}'
```

## 🔧 Development Features

### **Mock Data System**
- **Purpose**: Offline development & testing
- **Location**: `services/mockData.ts`
- **Contains**: Realistic rides, wallet data, user profiles
- **Auto-fallback**: When API is unavailable

### **Enhanced Error Handling**
- **Real-time validation**: Immediate input feedback
- **Custom ErrorMessage component**: Consistent error display
- **Console logging**: Detailed development information
- **Graceful degradation**: App works with or without API

### **Development Tools**
- **Hot Reload**: Instant code changes
- **TypeScript**: Full type safety
- **OTP Debugging**: Console display of codes
- **API Response Logging**: Debug API interactions

## 🎨 Design System

### **Brand Colors**
```javascript
Colors.light.brand = {
  primary: '#2d1d0c',    // E-Ride Black
  secondary: '#fcd424',   // E-Ride Yellow  
}
```

### **Typography**
```javascript
Typography.fontFamily = {
  regular: 'Montserrat',
  bold: 'Montserrat-Bold',
  medium: 'Montserrat-Medium',
}
```

### **Component System**
- **Consistent spacing**: 4px base unit
- **Unified border radius**: 8px, 12px, 16px
- **Shadow system**: Elevation-based shadows
- **Responsive design**: Mobile-first approach

## 🔒 Security Implementation

### **Authentication Security**
- **JWT Tokens**: Signed with secret key
- **Password Hashing**: bcrypt with salt rounds
- **OTP Verification**: Time-limited 6-digit codes
- **Secure Storage**: Platform-specific encrypted storage

### **API Security**
- **CORS Protection**: Configured origins
- **Input Validation**: Server-side validation
- **Error Handling**: No sensitive data in responses
- **Token Expiration**: 24-hour token lifecycle

### **Development vs Production**
- **Development**: OTP codes in console/API response
- **Production**: OTP codes only via email
- **Environment Detection**: Automatic mode switching

## 📊 Application Status

### **✅ Completed Features**
- ✅ Complete authentication system with OTP
- ✅ Multi-role user management  
- ✅ Secure JWT token handling
- ✅ Password recovery system
- ✅ Role-based navigation structure
- ✅ Comprehensive error handling
- ✅ Mock data system for development
- ✅ Responsive design system
- ✅ API documentation
- ✅ Development tools & debugging

### **🚧 Ready for Implementation**
- 🚧 Ride booking system (API structure ready)
- 🚧 Real-time ride tracking
- 🚧 Wallet transactions (API structure ready)
- 🚧 Driver/Courier dashboards
- 🚧 Rating & review system
- 🚧 Push notifications
- 🚧 Payment integration

### **📧 Email Configuration (Optional)**
```bash
# For production email sending
# Update backend/.env:
EMAIL_USER=your-app-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Gmail App Password Setup:
# 1. Enable 2-factor authentication
# 2. Generate app-specific password
# 3. Use app password (not regular password)
```

## 🚀 Deployment Guide

### **Frontend Deployment**
```bash
# Build for web
npx expo export --platform web
# Deploy build folder to hosting service

# Build for mobile
npx expo build:android
npx expo build:ios
# Submit to app stores
```

### **Backend Deployment**
```bash
# Production setup
NODE_ENV=production
PORT=8000

# With process manager
pm2 start server.js --name "eride-backend"

# Or with Docker
# (Dockerfile can be created)
```

### **Database Management**
```bash
# SQLite database file: backend/eride.db
# Automatic table creation on startup
# Backup: Copy eride.db file
# Reset: Delete eride.db file (auto-recreated)
```

## 🔧 Troubleshooting

### **Common Issues**
```bash
# Backend not starting
# Solution: Check port 8000 availability
netstat -ano | findstr :8000

# Frontend Metro errors
# Solution: Clear cache
npx expo start -c

# OTP not working
# Solution: Check backend console for OTP codes

# API connection issues
# Solution: Verify EXPO_PUBLIC_API_URL in .env
```

### **Debug Commands**
```bash
# Check API health
curl http://localhost:8000/api/v1/utils/health-check/

# View active processes
Get-Process -Name "node"

# Kill specific process
Stop-Process -Id <process-id> -Force

# Clear Expo cache
npx expo start --clear
```

### **Log Locations**
- **Backend logs**: Console output
- **Frontend logs**: Browser console (web) or device logs
- **API logs**: Backend console shows all requests

## 📈 Future Enhancements

### **Phase 1: Core Functionality**
- Complete ride booking system
- Real-time GPS tracking
- Driver assignment algorithm
- Basic payment processing

### **Phase 2: Advanced Features**
- Push notifications
- Advanced rating system  
- Ride scheduling
- Multi-language support

### **Phase 3: Business Features**
- Analytics dashboard
- Revenue management
- Driver onboarding flow
- Customer support system

## 🤝 Contributing

### **Development Workflow**
```bash
# 1. Fork repository
# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Make changes
# 4. Test thoroughly
npm test

# 5. Commit with clear message  
git commit -m "Add amazing feature"

# 6. Push and create PR
git push origin feature/amazing-feature
```

### **Code Standards**
- **TypeScript**: All new code in TypeScript
- **ESLint**: Follow existing linting rules
- **Comments**: Document complex logic
- **Testing**: Add tests for new features

## 📞 Support

### **Documentation**
- **API Docs**: http://localhost:8000/docs
- **Troubleshooting**: TROUBLESHOOTING.md
- **Architecture**: This guide

### **Getting Help**
- **Check console logs**: Both frontend and backend
- **API testing**: Use provided test scripts
- **Common issues**: See troubleshooting section

---

## 🎯 **Quick Reference**

### **Start Development**
```bash
# Terminal 1: Backend
cd backend && node server.js

# Terminal 2: Frontend  
npx expo start --web
```

### **Test Login**
```
URL: http://localhost:8156
Email: admin@eride.com
Password: admin123
OTP: Check backend console
```

### **API Base**
```
Backend: http://localhost:8000
Health: http://localhost:8000/api/v1/utils/health-check/
Docs: http://localhost:8000/docs
```

---

**🚗 E-Ride - Your Complete Ride-Sharing Solution**

*Built with React Native, Node.js, and modern development practices*
