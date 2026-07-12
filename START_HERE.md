# 🚀 TransitOps - Quick Start Guide

Welcome to **TransitOps**, an enterprise-grade Transport Operations ERP built with modern technologies and production-ready architecture.

## ✅ What's Complete

**Phase 1: Foundation (100% Complete)**
- ✅ Backend API with JWT authentication, RBAC, and complete database schema
- ✅ Frontend with login, dashboard, and responsive layout
- ✅ State machines for Vehicle, Driver, and Trip lifecycle management
- ✅ Event-driven architecture for cross-module synchronization
- ✅ Professional UI with Tailwind CSS and custom design system

## 🏃 Quick Start (5 minutes)

### 1. Start the Backend

```bash
cd backend

# Start PostgreSQL database
docker-compose up -d

# Install dependencies (if not done)
npm install

# Generate Prisma client and run migrations
npm run prisma:generate
npm run prisma:migrate

# Seed database with demo data
npm run prisma:seed

# Start the backend server
npm run dev
```

**Backend will run on:** `http://localhost:5000`
**Health check:** `http://localhost:5000/health`

### 2. Start the Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies (if not done)
npm install

# IMPORTANT: If you see Tailwind CSS errors, run this fix:
npm uninstall tailwindcss
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0

# Start the development server
npm run dev
```

**Frontend will run on:** `http://localhost:5173`

**Note:** If you see PostCSS/Tailwind errors, the fix above resolves Tailwind v4 compatibility issues.

### 3. Login

Navigate to `http://localhost:5173` and login with:

**Demo Accounts** (all use password: `password123`):

- 🔑 **admin@transitops.com** - Full system access (Admin)
- 📋 **dispatcher@transitops.com** - Trip dispatch and operations (Dispatcher)
- 🚛 **fleet@transitops.com** - Vehicle and maintenance management (Fleet Manager)
- 👮 **safety@transitops.com** - Driver and compliance management (Safety Officer)
- 💰 **finance@transitops.com** - Financial analytics (Financial Analyst)

## 📁 Project Structure

```
odoo_hackathon/
├── backend/                    # Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── core/              # Infrastructure (auth, RBAC, events, etc.)
│   │   ├── modules/           # Feature modules (auth, vehicles, etc.)
│   │   └── shared/            # Shared utilities
│   ├── prisma/                # Database schema and migrations
│   └── docker-compose.yml     # PostgreSQL setup
│
├── frontend/                   # React + TypeScript + Vite
│   ├── src/
│   │   ├── features/          # Feature modules
│   │   ├── shared/            # Shared components and utilities
│   │   ├── stores/            # Zustand stores
│   │   └── routes/            # Route configuration
│   └── tailwind.config.js     # Design system configuration
│
├── IMPLEMENTATION_PLAN.md     # Complete architecture blueprint
├── PROGRESS.md                # Development progress tracker
└── START_HERE.md              # This file
```

## 🎯 Key Features Implemented

### Backend
- **Authentication**: JWT with refresh tokens, bcrypt password hashing
- **Authorization**: RBAC with permission caching
- **Database**: Normalized PostgreSQL schema with 15+ tables
- **State Machines**: Vehicle, Driver, and Trip lifecycle enforcement
- **Events**: Domain event system for cross-module synchronization
- **Security**: Rate limiting, helmet, CORS, input validation
- **Error Handling**: Global error handler with structured logging
- **Transactions**: ACID transactions for critical operations

### Frontend
- **Authentication**: Login with automatic token refresh
- **Layout**: Responsive sidebar with permission-based navigation
- **Dashboard**: Overview with stats and recent activity
- **Components**: Professional UI components (Button, Input, Card, Badge, etc.)
- **State Management**: Zustand for global state, TanStack Query for server state
- **Design System**: Industrial Precision theme with custom color palette
- **Routing**: Protected routes with RBAC integration

## 🔐 Security Features

1. **Password Security**: Bcrypt with 12 salt rounds
2. **Token Management**: Access tokens (15min) + refresh tokens (7 days)
3. **Rate Limiting**: 100 requests/15min general, 5 requests/15min for auth
4. **RBAC**: Every endpoint checks permissions
5. **Input Validation**: Zod schemas on all requests
6. **SQL Injection Prevention**: Prisma parameterized queries
7. **Audit Trail**: All actions logged to database

## 📊 Database Schema

**Core Tables:**
- Users, Roles, Permissions, RolePermissions
- Vehicles, VehicleTypes, Regions
- Drivers
- Trips, TripHistory
- MaintenanceLogs, MaintenanceExpenses
- FuelLogs
- Expenses
- AuditLogs, Notifications

**Demo Data Seeded:**
- 6 Roles with proper permissions
- 5 Demo users (one per main role)
- 5 Regions
- 4 Vehicle types
- 6 Vehicles
- 5 Drivers

## 🧪 Testing the System

### Test Authentication
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@transitops.com","password":"password123"}'
```

### Test Protected Endpoint
```bash
# First login and get token, then:
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🎨 Design System

**Theme: Industrial Precision**

Inspired by industrial dashboards, railway timetables, and aviation instruments.

**Colors:**
- Deep Slate (backgrounds, surfaces)
- Electric Amber (primary actions)
- Emerald (success/available)
- Rose (error/critical)
- Blue (info/in-progress)
- Orange (warning/maintenance)

**Typography:**
- Inter Variable (display and body text)
- JetBrains Mono (technical data, IDs, timestamps)

## 🚧 What's Next (Phase 2)

The foundation is complete. Phase 2 will implement:

1. **Vehicles Module** - Full CRUD with status management
2. **Drivers Module** - Driver management with license tracking
3. **Trips Module** - Complete dispatch and completion workflow
4. **Maintenance Module** - Maintenance scheduling and tracking
5. **Fuel Module** - Fuel logging with efficiency calculations
6. **Expenses Module** - Expense tracking and categorization
7. **Analytics Module** - Real-time metrics and dashboards

Each module will be fully integrated with:
- Backend service + repository layers
- State machine enforcement
- Event emission for synchronization
- Frontend CRUD pages
- Loading/empty/error states
- Real-time updates via TanStack Query

## 📝 Architecture Principles

This is **not a CRUD app**. Every feature follows enterprise principles:

1. **Clean Architecture**: Controllers → Services → Repositories
2. **State Machines**: Invalid transitions are impossible
3. **Event-Driven**: One action updates all affected modules
4. **Transactional**: Critical operations are ACID
5. **RBAC Everywhere**: Permissions checked on every endpoint
6. **Real Synchronization**: No stale data, no manual cache invalidation
7. **Production Quality**: Logging, error handling, security built-in

## 🐛 Troubleshooting

### Backend won't start
- Check if PostgreSQL is running: `docker ps`
- Check database connection: `DATABASE_URL` in `.env`
- Run migrations: `npm run prisma:migrate`

### Frontend shows connection error
- Check backend is running on port 5000
- Check CORS settings in backend `app.ts`
- Check `VITE_API_URL` in frontend `.env`

### Can't login
- Check database is seeded: `npm run prisma:seed`
- Check password: all demo accounts use `password123`
- Check browser console for detailed errors

## 📚 Documentation

- **Backend**: `/backend/README.md`
- **Frontend**: `/frontend/README.md`
- **Full Implementation Plan**: `/IMPLEMENTATION_PLAN.md`
- **Progress Tracker**: `/PROGRESS.md`

## 🤝 Contributing

This is a production-quality codebase. When adding features:

1. Follow the existing architectural patterns
2. Use state machines for status transitions
3. Emit events for cross-module updates
4. Implement all UI states (loading, empty, error, success)
5. Add RBAC permissions
6. Create audit logs for sensitive operations
7. Write meaningful commit messages

## 📧 Demo Credentials Summary

| Email | Password | Role | Access |
|-------|----------|------|--------|
| admin@transitops.com | password123 | Admin | Everything |
| dispatcher@transitops.com | password123 | Dispatcher | Trips, Dispatch |
| fleet@transitops.com | password123 | Fleet Manager | Vehicles, Maintenance |
| safety@transitops.com | password123 | Safety Officer | Drivers, Compliance |
| finance@transitops.com | password123 | Financial Analyst | Analytics, Reports |

---

**Built with** ❤️ **for the Odoo Hackathon**

**Status**: Phase 1 Complete ✅ | Ready for Phase 2 Implementation 🚀
