# TransitOps Backend API

Enterprise-grade Transport Operations ERP backend built with Node.js, TypeScript, Express, and PostgreSQL.

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Zod
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run database migrations:
```bash
npm run prisma:migrate
```

4. Seed the database with demo data:
```bash
npm run prisma:seed
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Demo Credentials

After seeding, you can log in with:

- **Admin**: `admin@transitops.com` / `password123`
- **Fleet Manager**: `fleet@transitops.com` / `password123`
- **Dispatcher**: `dispatcher@transitops.com` / `password123`
- **Safety Officer**: `safety@transitops.com` / `password123`
- **Financial Analyst**: `finance@transitops.com` / `password123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout

### Health Check
- `GET /health` - API health status

## Architecture

### Layers

1. **Routes** - HTTP routing and endpoint definition
2. **Controllers** - Request/response handling
3. **Services** - Business logic orchestration
4. **Repositories** - Data access layer
5. **Business Rules** - State machines and validation
6. **Database** - Prisma ORM with PostgreSQL

### Key Concepts

- **RBAC**: Role-based access control on every endpoint
- **State Machines**: Enforce valid state transitions
- **Transactions**: ACID transactions for critical operations
- **Event-Driven**: Domain events for cross-module synchronization
- **Audit Trail**: Complete audit logging of all changes

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with demo data

### Project Structure

```
backend/
├── src/
│   ├── core/               # Core infrastructure
│   │   ├── database/       # Database connection
│   │   ├── security/       # Auth & RBAC middleware
│   │   ├── validation/     # Input validation
│   │   ├── business-rules/ # State machines & rules
│   │   ├── events/         # Domain events
│   │   ├── logger/         # Logging
│   │   └── errors/         # Error handling
│   ├── modules/            # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── vehicles/       # Fleet management
│   │   ├── drivers/        # Driver management
│   │   ├── trips/          # Trip operations
│   │   ├── maintenance/    # Maintenance tracking
│   │   ├── fuel/           # Fuel logging
│   │   ├── expenses/       # Expense tracking
│   │   ├── analytics/      # Analytics & reporting
│   │   ├── notifications/  # Notifications
│   │   └── audit/          # Audit logs
│   ├── shared/             # Shared utilities
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts             # Seed data
└── package.json
```

## Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting on all endpoints
- CORS configuration
- Security headers (Helmet)
- Input validation and sanitization
- SQL injection prevention (Prisma)
- XSS prevention

## License

Proprietary - TransitOps ERP
