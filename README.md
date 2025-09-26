# Welcome to your Expo app 👋

# E-Ride React Native App

A complete ride-sharing mobile application built with React Native (Expo) and FastAPI backend, exactly replicating the His-eride project functionality.

## 🚀 Features

### Frontend (React Native)
- **Splash Screen**: Beautiful onboarding experience with auto-advance slides
- **Authentication Flow**: Login, Sign Up, and Forgot Password screens
- **OTP Verification**: 6-digit SMS/Email verification system
- **Dashboard**: User dashboard with session info, security status, and quick actions
- **Bottom Navigation**: Role-based navigation (Rider, Driver, Courier)
- **Exact His-eride Design**: Perfect color matching (#2d1d0c, #fcd424) and Montserrat typography

### Backend (FastAPI)
- **JWT Authentication**: Secure token-based authentication
- **OTP System**: Redis-powered OTP generation and verification
- **User Management**: Role-based user system (Rider, Driver, Courier)
- **Profile Management**: Driver and Courier profile creation
- **Database**: PostgreSQL with SQLModel/Alembic migrations
- **Background Tasks**: Celery with Redis for email/SMS sending
- **API Documentation**: Auto-generated OpenAPI docs

## 📱 App Flow

1. **Splash Screen** → Auto-advance slides showcasing app features
2. **Login Screen** → Email/Password authentication
3. **OTP Verification** → 6-digit code verification (use `123456` for demo)
4. **Dashboard** → Main user interface with bottom navigation

## 🛠️ Tech Stack

### Mobile App
- **React Native** with Expo
- **TypeScript** for type safety
- **Expo Router** for navigation
- **React Query** for data fetching
- **Expo SecureStore** for token storage
- **Expo Linear Gradient** for beautiful backgrounds

### Backend
- **Node.js** with Express.js
- **SQLite** database (file-based)
- **JWT** authentication
- **bcryptjs** for password hashing
- **In-memory OTP** storage
- **CORS** enabled for React Native

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)

### 1. Clone and Setup Frontend

```bash
cd Eride
npm install
```

### 2. Start Backend Server

```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Start the backend server
npm run dev
```

### 3. Run React Native App

```bash
# Start Expo development server
npm start

# Or run directly on platform
npm run android  # Android
npm run ios      # iOS
npm run web      # Web
```

## 🔧 Backend API Endpoints

### Authentication
- `POST /api/v1/login/access-token` - Login and get JWT token
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/otp/generate` - Generate OTP code
- `POST /api/v1/auth/otp/verify` - Verify OTP code

### Users
- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/me` - Update current user
- `POST /api/v1/users/` - Create new user (Admin)

### Health
- `GET /api/v1/utils/health-check/` - API health check

## 🎨 Design System

The app uses the exact same design system as His-eride:

### Colors
- **Primary**: `#2d1d0c` (E-Ride Black)
- **Secondary**: `#fcd424` (E-Ride Yellow)
- **Background**: `#FFFFFF` / `#F9FAFB`
- **Text**: `#1F2937` / `#6B7280` / `#9CA3AF`

### Typography
- **Font Family**: Montserrat
- **Sizes**: 12px - 36px scale
- **Weights**: Regular (400), Medium (500), SemiBold (600), Bold (700)

### Spacing
- **Scale**: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px

## 🔐 Authentication Flow

1. User enters email/password on login screen
2. Backend validates credentials and generates JWT token
3. App navigates to OTP verification screen
4. User enters 6-digit OTP code (use `123456` for demo)
5. Backend verifies OTP and marks token as verified
6. App navigates to dashboard with authenticated state

## 📱 Demo Credentials

For testing purposes, you can use any email/password combination. The OTP verification code is `123456`.

## 🐳 Docker Services

- **PostgreSQL**: Database on port 5432
- **Redis**: Cache/Session storage on port 6379
- **FastAPI Backend**: API server on port 8000
- **Celery Worker**: Background task processor
- **Flower**: Task monitoring on port 5555

## 📊 API Documentation

Once the backend is running, visit:
- **API Docs**: http://localhost:8000/docs
- **OpenAPI Schema**: http://localhost:8000/api/v1/openapi.json
- **Flower Monitor**: http://localhost:5555

## 🔧 Development

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run linting
npm run lint

# Reset project (clean start)
npm run reset-project
```

### Backend Development
```bash
# Enter backend container
docker-compose exec backend bash

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"

# Run tests
pytest

# Format code
ruff format .

# Lint code
ruff check .
```

## 🌍 Environment Variables

### Frontend (.env)
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_APP_NAME=E-Ride
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### Backend (docker-compose.yml)
- Database credentials
- Redis connection
- JWT secret key
- Email service (SendGrid)
- CORS origins

## 🚀 Production Deployment

### Frontend
```bash
# Build for production
expo build

# Or use EAS Build
eas build --platform all
```

### Backend
```bash
# Build and deploy containers
docker-compose -f docker-compose.prod.yml up -d
```

## 📄 License

This project is a learning replica of the His-eride application. Please respect the original project's licensing terms.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Happy Coding! 🚗💨**
