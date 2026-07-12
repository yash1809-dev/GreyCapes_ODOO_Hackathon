# TransitOps - Enterprise Transport Operations ERP

A production-ready, enterprise-grade Transport Operations Management System built with modern technologies and clean architecture principles.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (via Docker)
- npm or yarn

### Setup (5 minutes)

1. **Clone and Install**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

2. **Start Database**
```bash
cd backend
docker-compose up -d
```

3. **Setup Database**
```bash
# Run migrations
npm run prisma:migrate

# Seed demo data
npm run prisma:seed
```

4. **Start Services**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

5. **Access Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

## 🔐 Demo Credentials

**All passwords:** `password123`

| Email | Role | Access Level |
|-------|------|--------------|
| admin@transitops.com | Admin | Full system access |
| dispatcher@transitops.com | Dispatcher | Trip operations |
| fleet@transitops.com | Fleet Manager | Fleet management |
| safety@transitops.com | Safety Officer | Compliance |
| finance@transitops.com | Financial Analyst | Analytics |

## 🏗️ Architecture

### Backend
- **Framework:** Node.js + Express + TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** JWT with refresh tokens
- **Security:** RBAC, rate limiting, helmet
- **Architecture:** Clean architecture with state machines

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v3
- **State:** TanStack Query + Zustand
- **Routing:** React Router v6
- **Design:** Custom "Industrial Precision" theme

## 📁 Project Structure

```
odoo_hackathon/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── core/           # Infrastructure (auth, events, errors)
│   │   ├── modules/        # Business modules
│   │   └── shared/         # Shared utilities
│   └── prisma/             # Database schema & migrations
│
├── frontend/               # React frontend
│   └── src/
│       ├── features/       # Feature modules
│       ├── shared/         # Shared components
│       └── stores/         # State management
│
└── TransitOps_Master_Goals_*.md  # Architecture docs
```

## ✨ Features

### Phase 1 (Complete)
- ✅ Authentication & Authorization (JWT + RBAC)
- ✅ User Management
- ✅ Role-Based Access Control (6 roles, 38 permissions)
- ✅ Professional Dashboard
- ✅ Responsive UI

### Phase 2 (In Development)
- 🚧 Vehicles Management
- 🚧 Drivers Management
- 🚧 Trip Management
- 🚧 Maintenance Tracking
- 🚧 Fuel Management
- 🚧 Expense Tracking
- 🚧 Analytics & Reports

## 🛠️ Development

### Backend Commands
```bash
cd backend

# Development
npm run dev                 # Start dev server
npm run build              # Build for production

# Database
npm run prisma:migrate     # Run migrations
npm run prisma:seed        # Seed data
npm run prisma:studio      # Open Prisma Studio

# Docker
docker-compose up -d       # Start PostgreSQL
docker-compose down        # Stop PostgreSQL
```

### Frontend Commands
```bash
cd frontend

# Development
npm run dev                # Start dev server
npm run build             # Build for production
npm run preview           # Preview production build

# Cleanup
rm -rf node_modules/.vite # Clear Vite cache
```

## 🔍 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get profile
- `POST /api/auth/logout` - Logout

### Health
- `GET /health` - Health check

## 🧪 Testing

### Test Login Flow
1. Open http://localhost:5173
2. Click demo credential button
3. Click "Sign In"
4. Should redirect to dashboard

### Test API
```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@transitops.com","password":"password123"}'
```

## 📊 Database Schema

15+ tables including:
- Users & Roles
- Vehicles & Vehicle Types
- Drivers
- Trips
- Maintenance
- Fuel Logs
- Expenses
- Audit Logs
- Notifications

## 🔒 Security Features

- Password hashing (bcrypt, 12 rounds)
- JWT tokens (15 min expiry)
- Refresh tokens
- Rate limiting (100 req/15min)
- RBAC on all endpoints
- SQL injection prevention (Prisma)
- XSS prevention
- CORS configuration
- Security headers (Helmet)

## 🎨 Design System

### Colors
- Primary: Amber
- Background: Slate
- Success: Emerald
- Error: Rose
- Warning: Orange

### Components
- Buttons, Inputs, Cards
- Badges, Loading spinners
- Empty states, Error states
- Responsive layouts

## 📚 Documentation

Essential reading order:
1. This README
2. `TransitOps_Master_Goals_1.md` - Vision & Architecture
3. `TransitOps_Master_Goals_2.md` - Security & Quality
4. `TransitOps_Master_Goals_3.md` - Workflows & RBAC

## 🐛 Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### Backend can't connect to DB
```bash
cd backend
docker-compose down
docker-compose up -d
sleep 5
npm run prisma:migrate
```

### Port already in use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

## 🤝 Contributing

This is a hackathon project demonstrating enterprise architecture patterns.

## 📄 License

MIT

## 🎯 Built With

Enterprise-grade patterns:
- Clean Architecture
- SOLID Principles
- State Machines
- Event-Driven Design
- RBAC
- Transaction Management

---

**Status:** Phase 1 Complete ✅ | Phase 2 In Progress 🚧

**Built for:** Enterprise Transport Operations Management
