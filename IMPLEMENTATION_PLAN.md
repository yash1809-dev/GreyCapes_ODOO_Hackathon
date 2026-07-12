# TransitOps Enterprise ERP - Complete Implementation Plan

## Executive Summary

This document structures the complete implementation of **TransitOps**, an enterprise-grade Transport Operations ERP system. This plan synthesizes the architectural vision, security requirements, workflow specifications, and professional frontend design standards to deliver production-ready software indistinguishable from work by an experienced engineering team.

---

## Part 1: System Architecture Overview

### Technology Stack

**Backend:**
- Node.js + TypeScript
- Express.js with security middleware
- PostgreSQL (primary database)
- Prisma ORM (type-safe database access)
- JWT authentication with bcrypt
- Winston (structured logging)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- React Router v6
- TanStack Query (data synchronization)
- Zustand (state management)
- Tailwind CSS (utility-first styling)
- Radix UI (accessible primitives)
- Framer Motion (intentional animations)

**Infrastructure:**
- Docker containerization
- Environment-based configuration
- Health check endpoints
- Structured logging
- Audit trail system

### Architectural Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  Components → Hooks → API Client → Auth Context         │
└─────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│                   API Gateway Layer                      │
│  Rate Limiting → CORS → Helmet → Request Validation     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 Authentication Layer                     │
│  JWT Verification → Token Refresh → Session Management  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    RBAC Middleware                       │
│  Role Resolution → Permission Check → Resource Access   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Controller Layer                       │
│  Route Handlers → DTO Validation → Response Formatting  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
│  Business Orchestration → Transaction Management        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Business Rule Engine                        │
│  State Machines → Validation Rules → Business Logic     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Repository Layer                        │
│  Data Access → Query Building → Transaction Context     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                PostgreSQL Database                       │
│  Normalized Schema → Constraints → Indexes → Triggers   │
└─────────────────────────────────────────────────────────┘
```


### Cross-Cutting Concerns

```
Analytics Engine ─────┐
Notification Engine ──┼──→ Subscribe to Domain Events
Audit Engine ─────────┘
```

---

## Part 2: Database Schema Design

### Core Principles
- Normalized to 3NF minimum
- Foreign keys with cascading rules
- Indexes on frequently queried fields
- Enums for fixed value sets
- Soft deletes for audit trail
- Timestamps on all tables
- Optimistic locking where needed

### Entity Relationship Diagram

```
Users ←──────→ Roles ←──────→ Permissions
  │
  └──→ AuditLogs
  
VehicleTypes ←──→ Vehicles ←──→ MaintenanceLogs
                     │              │
                     │              └──→ MaintenanceExpenses
                     │
                     └──→ FuelLogs
                     │
                     └──→ Trips ←──→ Drivers
                            │
                            └──→ TripHistory
                            │
                            └──→ TripExpenses

Regions ←──→ Vehicles
         └──→ Trips

Notifications ←──→ Users
```


### Database Tables (Prisma Schema)

**Identity Module:**
- `users` - id, email, password_hash, full_name, role_id, is_active, created_at, updated_at, deleted_at
- `roles` - id, name, description, created_at, updated_at
- `permissions` - id, resource, action, description
- `role_permissions` - role_id, permission_id

**Fleet Module:**
- `vehicle_types` - id, name, description, default_capacity, fuel_type
- `vehicles` - id, registration_number, vehicle_type_id, region_id, status (enum), purchase_date, current_odometer, last_maintenance_date, created_at, updated_at, deleted_at
- `regions` - id, name, code, created_at

**Driver Module:**
- `drivers` - id, user_id (nullable), full_name, license_number, license_expiry, phone, status (enum), hire_date, created_at, updated_at, deleted_at

**Trip Module:**
- `trips` - id, trip_number, vehicle_id, driver_id, origin, destination, scheduled_start, actual_start, scheduled_end, actual_end, status (enum), distance_km, cargo_weight, notes, created_by, created_at, updated_at
- `trip_history` - id, trip_id, status, changed_by, changed_at, notes

**Maintenance Module:**
- `maintenance_logs` - id, vehicle_id, maintenance_type (enum), description, cost, odometer_reading, performed_by, performed_at, created_at, updated_at
- `maintenance_expenses` - id, maintenance_log_id, category, amount, invoice_number, vendor, created_at


**Finance Module:**
- `fuel_logs` - id, vehicle_id, trip_id (nullable), fuel_type, quantity_liters, cost_per_liter, total_cost, odometer_reading, station_name, filled_by, filled_at, created_at
- `expenses` - id, category (enum), amount, description, expense_date, related_entity_type, related_entity_id, created_by, created_at

**System Module:**
- `audit_logs` - id, user_id, action, resource, resource_id, old_value (json), new_value (json), ip_address, user_agent, created_at
- `notifications` - id, user_id, type, title, message, is_read, related_resource_type, related_resource_id, created_at, read_at

### Enums

```typescript
enum VehicleStatus {
  AVAILABLE
  ON_TRIP
  IN_MAINTENANCE
  RETIRED
}

enum DriverStatus {
  AVAILABLE
  ON_TRIP
  ON_LEAVE
  SUSPENDED
  INACTIVE
}

enum TripStatus {
  DRAFT
  DISPATCHED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum MaintenanceType {
  ROUTINE
  REPAIR
  INSPECTION
  EMERGENCY
}

enum ExpenseCategory {
  FUEL
  MAINTENANCE
  TOLL
  PARKING
  OTHER
}
```


---

## Part 3: Backend Architecture

### Module Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.dto.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── jwt.strategy.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.dto.ts
│   │   │   └── users.routes.ts
│   │   ├── vehicles/
│   │   │   ├── vehicles.controller.ts
│   │   │   ├── vehicles.service.ts
│   │   │   ├── vehicles.repository.ts
│   │   │   ├── vehicles.dto.ts
│   │   │   ├── vehicles.rules.ts
│   │   │   └── vehicles.routes.ts
│   │   ├── drivers/
│   │   ├── trips/
│   │   ├── maintenance/
│   │   ├── fuel/
│   │   ├── expenses/
│   │   ├── analytics/
│   │   ├── notifications/
│   │   └── audit/
│   ├── core/
│   │   ├── database/
│   │   │   ├── prisma.service.ts
│   │   │   └── transaction.manager.ts
│   │   ├── validation/
│   │   │   ├── validation.schemas.ts
│   │   │   └── validation.middleware.ts
│   │   ├── security/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rbac.middleware.ts
│   │   │   ├── rate-limiter.ts
│   │   │   └── sanitizer.ts
│   │   ├── business-rules/
│   │   │   ├── state-machines/
│   │   │   │   ├── vehicle.state-machine.ts
│   │   │   │   ├── driver.state-machine.ts
│   │   │   │   └── trip.state-machine.ts
│   │   │   ├── rule-engine.ts
│   │   │   └── business-rules.ts
│   │   ├── events/
│   │   │   ├── event.emitter.ts
│   │   │   ├── event.types.ts
│   │   │   └── event.handlers.ts
│   │   ├── logger/
│   │   │   ├── logger.service.ts
│   │   │   └── logger.config.ts
│   │   └── errors/
│   │       ├── app.errors.ts
│   │       └── error.handler.ts
│   ├── shared/
│   │   ├── dto/
│   │   │   ├── pagination.dto.ts
│   │   │   └── response.dto.ts
│   │   ├── utils/
│   │   │   ├── date.utils.ts
│   │   │   └── crypto.utils.ts
│   │   └── constants/
│   │       ├── permissions.ts
│   │       └── roles.ts
│   ├── app.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
└── package.json
```


### Request Lifecycle Implementation

**1. Authentication Middleware:**
```typescript
// Verify JWT token
// Extract user ID and role
// Attach to request context
// Reject if invalid/expired
```

**2. RBAC Middleware:**
```typescript
// Load user permissions from database
// Check permission for requested resource + action
// Verify resource ownership if applicable
// Return 403 if unauthorized
```

**3. Validation Middleware:**
```typescript
// Schema validation (Zod)
// Business rule validation
// Data sanitization
// Return 400 if invalid
```

**4. Controller:**
```typescript
// Extract validated data
// Call service method
// Format response
// Handle service errors
```

**5. Service:**
```typescript
// Orchestrate business logic
// Begin transaction
// Call rule engine
// Call repositories
// Emit domain events
// Commit transaction
// Return result or rollback on error
```

**6. Repository:**
```typescript
// Execute database queries
// Map domain models
// Return data to service
```


### State Machine Implementation

**Vehicle State Machine:**
```typescript
const vehicleStateMachine = {
  AVAILABLE: ['ON_TRIP', 'IN_MAINTENANCE', 'RETIRED'],
  ON_TRIP: ['AVAILABLE'],
  IN_MAINTENANCE: ['AVAILABLE', 'RETIRED'],
  RETIRED: [] // Terminal state
};

function canTransitionVehicle(from: VehicleStatus, to: VehicleStatus): boolean {
  return vehicleStateMachine[from]?.includes(to) ?? false;
}
```

**Driver State Machine:**
```typescript
const driverStateMachine = {
  AVAILABLE: ['ON_TRIP', 'ON_LEAVE', 'SUSPENDED', 'INACTIVE'],
  ON_TRIP: ['AVAILABLE'],
  ON_LEAVE: ['AVAILABLE', 'INACTIVE'],
  SUSPENDED: ['AVAILABLE', 'INACTIVE'],
  INACTIVE: [] // Terminal state
};
```

**Trip State Machine:**
```typescript
const tripStateMachine = {
  DRAFT: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // Terminal state
  CANCELLED: []  // Terminal state
};
```


### Business Rules Engine

**Trip Dispatch Rules:**
```typescript
class TripDispatchRules {
  async validate(tripData: DispatchTripDTO): Promise<ValidationResult> {
    const rules = [
      this.vehicleAvailable(tripData.vehicleId),
      this.vehicleNotInMaintenance(tripData.vehicleId),
      this.driverAvailable(tripData.driverId),
      this.driverLicenseValid(tripData.driverId),
      this.vehicleCapacitySufficient(tripData.vehicleId, tripData.cargoWeight),
      this.noScheduleConflict(tripData.vehicleId, tripData.driverId, tripData.scheduledStart)
    ];
    
    const results = await Promise.all(rules);
    return combineValidationResults(results);
  }
}
```

**Maintenance Rules:**
```typescript
class MaintenanceRules {
  async validate(maintenanceData: CreateMaintenanceDTO): Promise<ValidationResult> {
    const rules = [
      this.vehicleExists(maintenanceData.vehicleId),
      this.vehicleNotOnTrip(maintenanceData.vehicleId),
      this.validOdometerReading(maintenanceData.vehicleId, maintenanceData.odometerReading)
    ];
    
    return combineValidationResults(await Promise.all(rules));
  }
}
```


### Event-Driven Architecture

**Domain Events:**
```typescript
enum DomainEvent {
  TRIP_DISPATCHED = 'trip.dispatched',
  TRIP_COMPLETED = 'trip.completed',
  TRIP_CANCELLED = 'trip.cancelled',
  VEHICLE_STATUS_CHANGED = 'vehicle.status_changed',
  DRIVER_STATUS_CHANGED = 'driver.status_changed',
  MAINTENANCE_STARTED = 'maintenance.started',
  MAINTENANCE_COMPLETED = 'maintenance.completed',
  FUEL_LOGGED = 'fuel.logged',
  EXPENSE_CREATED = 'expense.created'
}

// Event handlers automatically:
// - Create audit logs
// - Send notifications
// - Update analytics
// - Refresh dashboards
```

**Event Handler Example:**
```typescript
eventEmitter.on(DomainEvent.TRIP_DISPATCHED, async (data) => {
  await Promise.all([
    auditService.log('TRIP_DISPATCH', data),
    notificationService.notifyDispatch(data),
    analyticsService.recalculate(['fleet_utilization', 'driver_utilization']),
    dashboardService.invalidateCache(['trips', 'vehicles', 'drivers'])
  ]);
});
```


### API Endpoints Structure

**Authentication:**
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Invalidate session
- `GET /api/auth/me` - Get current user info

**Vehicles:**
- `GET /api/vehicles` - List vehicles (paginated, filtered)
- `GET /api/vehicles/:id` - Get vehicle details
- `POST /api/vehicles` - Create vehicle (Fleet Manager)
- `PATCH /api/vehicles/:id` - Update vehicle (Fleet Manager)
- `DELETE /api/vehicles/:id` - Soft delete (Fleet Manager)
- `GET /api/vehicles/:id/history` - Get vehicle trip/maintenance history
- `GET /api/vehicles/available` - List available vehicles for dispatch

**Drivers:**
- `GET /api/drivers` - List drivers
- `GET /api/drivers/:id` - Get driver details
- `POST /api/drivers` - Create driver (Safety Officer)
- `PATCH /api/drivers/:id` - Update driver (Safety Officer)
- `DELETE /api/drivers/:id` - Soft delete (Safety Officer)
- `GET /api/drivers/available` - List available drivers
- `GET /api/drivers/:id/trips` - Get driver trip history

**Trips:**
- `GET /api/trips` - List trips (role-filtered)
- `GET /api/trips/:id` - Get trip details
- `POST /api/trips` - Create draft trip (Dispatcher)
- `POST /api/trips/:id/dispatch` - Dispatch trip (Dispatcher)
- `POST /api/trips/:id/start` - Start trip (Dispatcher/Driver)
- `POST /api/trips/:id/complete` - Complete trip (Dispatcher)
- `POST /api/trips/:id/cancel` - Cancel trip (Dispatcher)
- `GET /api/trips/:id/history` - Get trip status history


**Maintenance:**
- `GET /api/maintenance` - List maintenance logs
- `GET /api/maintenance/:id` - Get maintenance details
- `POST /api/maintenance` - Create maintenance (Fleet Manager)
- `PATCH /api/maintenance/:id` - Update maintenance (Fleet Manager)
- `POST /api/maintenance/:id/complete` - Complete maintenance (Fleet Manager)
- `GET /api/vehicles/:id/maintenance` - Get vehicle maintenance history

**Fuel:**
- `GET /api/fuel` - List fuel logs
- `POST /api/fuel` - Create fuel log (Dispatcher/Driver)
- `GET /api/vehicles/:id/fuel` - Get vehicle fuel history
- `GET /api/fuel/analytics` - Fuel efficiency metrics

**Expenses:**
- `GET /api/expenses` - List expenses (Financial Analyst)
- `POST /api/expenses` - Create expense
- `GET /api/expenses/analytics` - Expense analytics

**Analytics:**
- `GET /api/analytics/dashboard` - Role-specific dashboard data
- `GET /api/analytics/fleet-utilization` - Fleet utilization metrics
- `GET /api/analytics/driver-performance` - Driver performance metrics
- `GET /api/analytics/operational-cost` - Cost breakdown
- `GET /api/analytics/roi` - Return on investment metrics
- `GET /api/analytics/fuel-efficiency` - Fuel efficiency trends

**Notifications:**
- `GET /api/notifications` - List user notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read

**Audit:**
- `GET /api/audit` - List audit logs (Admin only)
- `GET /api/audit/:resourceType/:resourceId` - Get resource audit trail


---

## Part 4: Frontend Architecture

### Module Structure

```
frontend/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── api/
│   │   │   │   └── authApi.ts
│   │   │   └── types/
│   │   │       └── auth.types.ts
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   ├── MetricCard.tsx
│   │   │   │   ├── FleetUtilizationChart.tsx
│   │   │   │   └── RecentActivityFeed.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useDashboardData.ts
│   │   │   └── pages/
│   │   │       └── DashboardPage.tsx
│   │   ├── vehicles/
│   │   │   ├── components/
│   │   │   │   ├── VehicleList.tsx
│   │   │   │   ├── VehicleCard.tsx
│   │   │   │   ├── VehicleForm.tsx
│   │   │   │   ├── VehicleDetail.tsx
│   │   │   │   ├── VehicleStatusBadge.tsx
│   │   │   │   └── VehicleFilters.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useVehicles.ts
│   │   │   │   └── useVehicleMutations.ts
│   │   │   ├── api/
│   │   │   │   └── vehiclesApi.ts
│   │   │   └── pages/
│   │   │       ├── VehiclesPage.tsx
│   │   │       └── VehicleDetailPage.tsx
│   │   ├── drivers/
│   │   ├── trips/
│   │   │   ├── components/
│   │   │   │   ├── TripList.tsx
│   │   │   │   ├── TripCard.tsx
│   │   │   │   ├── DispatchForm.tsx
│   │   │   │   ├── TripTimeline.tsx
│   │   │   │   └── TripStatusFlow.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useTrips.ts
│   │   │   │   └── useTripActions.ts
│   │   │   └── pages/
│   │   ├── maintenance/
│   │   ├── analytics/
│   │   └── notifications/
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   └── Toast.tsx
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── PageHeader.tsx
│   │   │   ├── feedback/
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   ├── SkeletonLoader.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   └── ErrorBoundary.tsx
│   │   │   └── data-display/
│   │   │       ├── DataTable.tsx
│   │   │       ├── Pagination.tsx
│   │   │       └── StatusIndicator.tsx
│   │   ├── hooks/
│   │   │   ├── usePermissions.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── useMediaQuery.ts
│   │   ├── lib/
│   │   │   ├── api-client.ts
│   │   │   ├── query-client.ts
│   │   │   ├── axios-instance.ts
│   │   │   └── error-handler.ts
│   │   ├── utils/
│   │   │   ├── date.utils.ts
│   │   │   ├── format.utils.ts
│   │   │   └── validation.utils.ts
│   │   └── types/
│   │       ├── api.types.ts
│   │       └── common.types.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── notificationStore.ts
│   │   └── uiStore.ts
│   ├── routes/
│   │   ├── index.tsx
│   │   └── PrivateRoutes.tsx
│   ├── styles/
│   │   ├── globals.css
│   │   └── theme.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```


### Design System & Visual Identity

**Theme: Industrial Precision**

The TransitOps design embodies the reliability and operational excellence of a modern transport fleet. The visual language draws from:
- Industrial dashboards and control systems
- Railway timetables and logistics tracking
- Aviation navigation instruments
- Manufacturing process monitoring

**Color Palette:**

```typescript
const colors = {
  // Primary - Deep Slate (Authority & Stability)
  slate900: '#0f172a',    // Main backgrounds, headers
  slate800: '#1e293b',    // Card backgrounds
  slate700: '#334155',    // Borders, dividers
  slate600: '#475569',    // Secondary text
  
  // Accent - Electric Amber (Action & Energy)
  amber500: '#f59e0b',    // Primary CTAs, active states
  amber400: '#fbbf24',    // Hover states
  amber600: '#d97706',    // Pressed states
  
  // Status Colors
  emerald500: '#10b981',  // Success, available, completed
  rose500: '#f43f5e',     // Error, critical, cancelled
  blue500: '#3b82f6',     // Info, in-progress
  orange500: '#f97316',   // Warning, maintenance
  
  // Neutral Scale
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray900: '#111827'
};
```


**Typography:**

```typescript
// Display: Inter Variable (Clean, Technical, Readable)
// Used for: Page titles, section headers, metric displays
// Weights: 600 (semibold) for headers, 700 (bold) for emphasis

// Body: Inter Variable
// Used for: Body text, form labels, table content
// Weights: 400 (regular), 500 (medium) for emphasis

// Mono: JetBrains Mono
// Used for: IDs, license plates, timestamps, technical data
// Weight: 400 (regular)

const typography = {
  display: {
    fontFamily: 'Inter Variable, system-ui, sans-serif',
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em'
  },
  heading: {
    fontFamily: 'Inter Variable, system-ui, sans-serif',
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.3
  },
  body: {
    fontFamily: 'Inter Variable, system-ui, sans-serif',
    fontSize: '0.9375rem',
    fontWeight: 400,
    lineHeight: 1.6
  },
  mono: {
    fontFamily: 'JetBrains Mono, Consolas, monospace',
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5
  }
};
```


**Layout Principles:**

1. **Dense Information Architecture**: Transport operations require monitoring multiple data streams simultaneously. Use compact cards, tables with good spacing, and efficient use of screen real estate.

2. **Status-First Design**: Vehicle/driver/trip status should be immediately visible through color-coded badges, status indicators, and clear visual hierarchy.

3. **Action-Oriented**: Primary actions (Dispatch Trip, Log Maintenance) are always prominent and accessible within context.

4. **Real-time Synchronization**: Loading states and optimistic updates show the system is always working, never stale.

5. **Grid-Based Layout**: 12-column grid for desktop, collapsing to single column on mobile. Cards and sections snap to grid for visual consistency.

**Signature Element: Live Operations Timeline**

A persistent timeline component in the dashboard showing real-time fleet activity:
- Vehicle dispatches (amber pulse)
- Trip completions (emerald checkmark)
- Maintenance alerts (orange indicator)
- Driver status changes (blue transition)

Animated with subtle motion, positioned prominently in the dashboard hero section, this becomes the "heartbeat" of the system showing operations as they happen.


### Component Implementation Standards

**Every component must handle:**

1. **Loading State**: Skeleton loaders matching component shape
2. **Empty State**: Contextual empty states with relevant actions
3. **Error State**: Clear error messages with retry actions
4. **Success Feedback**: Toast notifications for mutations
5. **Responsive Design**: Mobile-first, works on all screen sizes
6. **Accessibility**: Keyboard navigation, ARIA labels, focus management

**Example: Vehicle Card Component**

```typescript
interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export function VehicleCard({ vehicle, onEdit, onViewDetails }: VehicleCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      {/* Status indicator bar */}
      <div className={`h-1 ${getStatusColor(vehicle.status)}`} />
      
      <CardContent className="p-4">
        {/* Header: Registration + Type */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-mono font-semibold text-slate-900">
              {vehicle.registrationNumber}
            </h3>
            <p className="text-sm text-slate-600">{vehicle.vehicleType.name}</p>
          </div>
          <VehicleStatusBadge status={vehicle.status} />
        </div>
        
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <MetricItem 
            label="Odometer" 
            value={formatDistance(vehicle.currentOdometer)} 
          />
          <MetricItem 
            label="Region" 
            value={vehicle.region.name} 
          />
        </div>
```

        
        {/* Actions */}
        <div className="flex gap-2">
          {onViewDetails && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => onViewDetails(vehicle.id)}
            >
              View Details
            </Button>
          )}
          {onEdit && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(vehicle.id)}
            >
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Data Fetching Pattern (TanStack Query):**

```typescript
export function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => vehiclesApi.getAll(filters),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true
  });
}

export function useVehicleMutations() {
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  return { createMutation };
}
```


---

## Part 5: Core Workflows Implementation

### Workflow 1: User Login & Dashboard Load

**Frontend Flow:**
1. User enters credentials in LoginForm
2. Form validates input client-side
3. Submits POST /api/auth/login
4. Receives JWT token + user data
5. Stores token in memory + httpOnly cookie
6. Navigates to dashboard
7. Dashboard loads role-specific data
8. Displays appropriate metrics and actions

**Backend Flow:**
1. Validate credentials format
2. Query user by email (with role and permissions)
3. Verify password hash
4. Check user is_active status
5. Generate JWT with user ID + role
6. Create audit log entry
7. Return token + user profile
8. Dashboard endpoint checks permissions
9. Returns only authorized data

**Key Points:**
- Password never leaves hashed state
- Token contains minimal claims
- RBAC enforced on every dashboard data request
- Audit log records login time + IP


### Workflow 2: Dispatch Trip (Critical Transaction)

**Frontend Flow:**
1. Dispatcher opens "Dispatch Trip" form
2. Selects available vehicle (filtered by status)
3. Selects available driver (filtered by status + license validity)
4. Enters trip details (origin, destination, cargo weight, schedule)
5. Form validates all required fields
6. Submits POST /api/trips/:id/dispatch
7. Shows loading state
8. On success: Toast notification + navigate to trip details
9. Dashboard auto-refreshes (via query invalidation)

**Backend Flow:**
```
1. Authentication Middleware
   ↓
2. RBAC Middleware (check "trips:dispatch" permission)
   ↓
3. Validation Middleware (Zod schema)
   ↓
4. Controller receives validated DTO
   ↓
5. Service.dispatchTrip() begins
   ↓
6. BEGIN TRANSACTION
   ↓
7. Business Rules Engine validates:
   - Vehicle exists and is AVAILABLE
   - Vehicle not in maintenance
   - Driver exists and is AVAILABLE
   - Driver license not expired
   - No schedule conflicts for vehicle/driver
   - Cargo weight within vehicle capacity
   ↓
8. If validation fails → ROLLBACK + return 409 Conflict
   ↓
9. State Machine: Trip DRAFT → DISPATCHED
   ↓
10. Update trip status + actual_start time
    ↓
11. State Machine: Vehicle AVAILABLE → ON_TRIP
    ↓
```

```
12. State Machine: Driver AVAILABLE → ON_TRIP
    ↓
13. Create TripHistory record (status change)
    ↓
14. Create AuditLog entry
    ↓
15. COMMIT TRANSACTION
    ↓
16. Emit DomainEvent.TRIP_DISPATCHED
    ↓
17. Event handlers execute asynchronously:
    - Send notification to driver
    - Update analytics cache
    - Refresh dashboard data
    ↓
18. Return success response with updated trip
```

**Synchronization Impact:**
- Trip status: DRAFT → DISPATCHED
- Vehicle status: AVAILABLE → ON_TRIP (removed from available vehicles list)
- Driver status: AVAILABLE → ON_TRIP (removed from available drivers list)
- Dashboard "Active Trips" count: +1
- Dashboard "Available Vehicles" count: -1
- Dashboard "Available Drivers" count: -1
- Analytics "Fleet Utilization": recalculated
- Recent activity feed: new entry appears
- Notification sent to driver

**Failure Scenarios:**
- Invalid vehicle ID → 404 Not Found
- Vehicle already on trip → 409 Conflict
- Driver license expired → 409 Conflict
- Database error → 500 + ROLLBACK
- All state remains consistent (atomicity guaranteed)


### Workflow 3: Complete Trip (Complex Transaction)

**Frontend Flow:**
1. Dispatcher navigates to active trip
2. Clicks "Complete Trip"
3. Modal opens with completion form:
   - Final odometer reading (required)
   - Fuel consumed (optional, can link to fuel log)
   - Additional expenses (optional)
   - Notes
4. Validates odometer > start odometer
5. Submits POST /api/trips/:id/complete
6. Shows processing state
7. On success: Confetti animation + navigation to trip list
8. All related data auto-refreshes

**Backend Flow:**
```
BEGIN TRANSACTION

1. Validate trip exists and status = IN_PROGRESS
2. Validate odometer reading is greater than vehicle's current odometer
3. State Machine: Trip IN_PROGRESS → COMPLETED
4. Update trip:
   - actual_end = now()
   - final_odometer = provided value
   - distance_km = calculated from odometer readings
5. State Machine: Vehicle ON_TRIP → AVAILABLE
6. Update vehicle:
   - current_odometer = trip's final odometer
   - status = AVAILABLE
7. State Machine: Driver ON_TRIP → AVAILABLE
8. Update driver status = AVAILABLE
9. If fuel data provided:
   - Create FuelLog record linked to trip
   - Calculate fuel efficiency (distance / fuel consumed)
10. If expenses provided:
    - Create Expense records linked to trip
```

```
11. Create TripHistory record
12. Create AuditLog entry
13. COMMIT TRANSACTION

14. Emit DomainEvent.TRIP_COMPLETED
15. Event handlers:
    - Recalculate analytics (fleet utilization, ROI, fuel efficiency)
    - Send completion notification
    - Update dashboard cache
    - Check if vehicle needs maintenance (based on odometer/date)
    
16. Return success response
```

**Synchronization Impact:**
- Trip status: IN_PROGRESS → COMPLETED
- Vehicle: ON_TRIP → AVAILABLE, odometer updated
- Driver: ON_TRIP → AVAILABLE
- Dashboard metrics: all recalculated
- Analytics: ROI, fuel efficiency, operational cost updated
- Reports: trip included in completed trips reports
- Vehicle maintenance: may trigger "maintenance due" notification

**Data Integrity:**
- Odometer can only increase (enforced)
- Distance calculation is derived, not stored
- Fuel efficiency calculated from actual data
- All status transitions are atomic
- If any step fails, entire transaction rolls back


### Workflow 4: Create Maintenance (Vehicle Availability Impact)

**Frontend Flow:**
1. Fleet Manager navigates to vehicle detail page
2. Clicks "Schedule Maintenance"
3. Form displays:
   - Maintenance type (dropdown: Routine, Repair, Inspection, Emergency)
   - Description
   - Current odometer (pre-filled, editable)
   - Estimated cost
   - Scheduled date
4. Submits POST /api/maintenance
5. Shows loading state
6. On success: Vehicle card immediately shows "IN_MAINTENANCE" badge
7. Vehicle disappears from dispatch availability

**Backend Flow:**
```
BEGIN TRANSACTION

1. Validate vehicle exists
2. Validate vehicle not already IN_MAINTENANCE
3. Business rule: If vehicle ON_TRIP, reject with 409
   (maintenance can only be scheduled for AVAILABLE vehicles)
4. State Machine: Vehicle AVAILABLE → IN_MAINTENANCE
5. Create MaintenanceLog record:
   - vehicle_id
   - maintenance_type
   - description
   - cost
   - odometer_reading
   - performed_by (current user)
   - performed_at
6. Create AuditLog entry
7. COMMIT TRANSACTION

8. Emit DomainEvent.MAINTENANCE_STARTED
9. Event handlers:
   - Send notification to fleet manager
   - Update vehicle availability cache
   - Remove from dispatch options
   - Update dashboard "Vehicles in Maintenance" count
   - Recalculate fleet utilization metrics
```


10. Return success response
```

**Complete Maintenance:**
```
POST /api/maintenance/:id/complete

BEGIN TRANSACTION

1. Load maintenance record
2. Update maintenance record:
   - completed_at = now()
   - actual_cost (if different from estimate)
3. State Machine: Vehicle IN_MAINTENANCE → AVAILABLE
4. Update vehicle:
   - status = AVAILABLE
   - last_maintenance_date = now()
   - current_odometer (if changed during maintenance)
5. Create AuditLog entry
6. COMMIT TRANSACTION

7. Emit DomainEvent.MAINTENANCE_COMPLETED
8. Event handlers:
   - Add vehicle back to available pool
   - Update dispatch options
   - Recalculate maintenance cost metrics
   - Update fleet utilization
   
9. Return success response
```

**Business Rules Enforced:**
- Cannot dispatch vehicle IN_MAINTENANCE
- Cannot start maintenance on vehicle ON_TRIP
- Maintenance completion returns vehicle to AVAILABLE (unless retired)
- All maintenance has audit trail
- Maintenance costs tracked separately for analytics


---

## Part 6: Security Implementation

### Authentication System

**Password Security:**
```typescript
import bcrypt from 'bcryptjs';

async function hashPassword(password: string): Promise<string> {
  const SALT_ROUNDS = 12;
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**JWT Implementation:**
```typescript
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  roleId: string;
  iat: number;
  exp: number;
}

function generateAccessToken(userId: string, roleId: string): string {
  return jwt.sign(
    { userId, roleId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
}

function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
}
```


### Authorization System (RBAC)

**Permission Model:**
```typescript
// Permissions stored in database
interface Permission {
  id: string;
  resource: string;  // 'vehicles', 'trips', 'drivers', etc.
  action: string;    // 'create', 'read', 'update', 'delete', 'dispatch', etc.
}

// Example permissions:
// { resource: 'vehicles', action: 'create' }
// { resource: 'trips', action: 'dispatch' }
// { resource: 'analytics', action: 'read' }
```

**RBAC Middleware:**
```typescript
export function requirePermission(resource: string, action: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user.userId;
    
    // Load user's permissions from database (cached)
    const permissions = await permissionService.getUserPermissions(userId);
    
    // Check if user has required permission
    const hasPermission = permissions.some(
      p => p.resource === resource && p.action === action
    );
    
    if (!hasPermission) {
      throw new ForbiddenError(
        `You don't have permission to ${action} ${resource}`
      );
    }
    
    next();
  };
}

// Usage in routes:
router.post(
  '/vehicles',
  authenticate,
  requirePermission('vehicles', 'create'),
  vehiclesController.create
);
```


### Input Validation & Sanitization

**Schema Validation (Zod):**
```typescript
import { z } from 'zod';

const DispatchTripSchema = z.object({
  tripId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  origin: z.string().min(3).max(200),
  destination: z.string().min(3).max(200),
  scheduledStart: z.string().datetime(),
  cargoWeight: z.number().positive().max(50000), // max 50 tons
  notes: z.string().max(1000).optional()
});

// Validation middleware
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request data', error.errors);
      }
      throw error;
    }
  };
}

// Usage:
router.post(
  '/trips/:id/dispatch',
  authenticate,
  requirePermission('trips', 'dispatch'),
  validateRequest(DispatchTripSchema),
  tripsController.dispatch
);
```


### SQL Injection Prevention

**Using Prisma ORM (Parameterized Queries):**
```typescript
// SAFE - Prisma automatically parameterizes
async function getVehiclesByRegion(regionId: string) {
  return prisma.vehicle.findMany({
    where: { regionId } // Automatically parameterized
  });
}

// SAFE - Even with dynamic filters
async function searchVehicles(filters: VehicleFilters) {
  return prisma.vehicle.findMany({
    where: {
      AND: [
        filters.status ? { status: filters.status } : {},
        filters.regionId ? { regionId: filters.regionId } : {},
        filters.search ? {
          OR: [
            { registrationNumber: { contains: filters.search, mode: 'insensitive' } },
            { vehicleType: { name: { contains: filters.search, mode: 'insensitive' } } }
          ]
        } : {}
      ]
    }
  });
}

// NEVER do this (raw SQL with string interpolation):
// await prisma.$queryRaw`SELECT * FROM vehicles WHERE region_id = ${regionId}`
// Use parameterized queries if raw SQL is necessary:
// await prisma.$queryRaw`SELECT * FROM vehicles WHERE region_id = ${regionId}::uuid`
```


### XSS Prevention

**Frontend (React):**
```typescript
// React automatically escapes values in JSX
// This is SAFE:
<div>{vehicle.registrationNumber}</div>

// For HTML content, use DOMPurify:
import DOMPurify from 'dompurify';

function SafeHTML({ html }: { html: string }) {
  return (
    <div 
      dangerouslySetInnerHTML={{ 
        __html: DOMPurify.sanitize(html) 
      }} 
    />
  );
}
```

**Backend:**
```typescript
// Output sanitization for API responses
import sanitizeHtml from 'sanitize-html';

function sanitizeOutput(data: any): any {
  if (typeof data === 'string') {
    return sanitizeHtml(data, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeOutput);
  }
  if (typeof data === 'object' && data !== null) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, sanitizeOutput(value)])
    );
  }
  return data;
}
```


### Security Headers & CORS

**Express Security Setup:**
```typescript
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later'
});

app.use('/api/auth/login', authLimiter);
```


---

## Part 7: Analytics & Reporting

### Calculated Metrics (Never Stored)

**Fleet Utilization:**
```typescript
async function calculateFleetUtilization(
  startDate: Date, 
  endDate: Date
): Promise<number> {
  const totalVehicles = await prisma.vehicle.count({
    where: { status: { not: 'RETIRED' } }
  });
  
  const activeTrips = await prisma.trip.count({
    where: {
      status: { in: ['DISPATCHED', 'IN_PROGRESS'] },
      scheduledStart: { gte: startDate, lte: endDate }
    }
  });
  
  const totalPossibleVehicleHours = totalVehicles * 
    dateDifferenceInHours(startDate, endDate);
    
  const actualVehicleHours = await prisma.trip.aggregate({
    where: {
      status: 'COMPLETED',
      actualStart: { gte: startDate },
      actualEnd: { lte: endDate }
    },
    _sum: {
      durationHours: true // calculated field
    }
  });
  
  return (actualVehicleHours._sum.durationHours || 0) / 
         totalPossibleVehicleHours * 100;
}
```

**Fuel Efficiency:**
```typescript
async function calculateFuelEfficiency(vehicleId?: string) {
  const whereClause = vehicleId ? { vehicleId } : {};
  
  const fuelData = await prisma.fuelLog.aggregate({
    where: whereClause,
    _sum: {
      quantityLiters: true
    }
  });
  
  const tripData = await prisma.trip.aggregate({
    where: {
      ...whereClause,
      status: 'COMPLETED'
    },
    _sum: {
      distanceKm: true
    }
  });
```

  
  const totalDistance = tripData._sum.distanceKm || 0;
  const totalFuel = fuelData._sum.quantityLiters || 0;
  
  return totalFuel > 0 ? totalDistance / totalFuel : 0; // km per liter
}
```

**Operational Cost:**
```typescript
async function calculateOperationalCost(
  startDate: Date, 
  endDate: Date
): Promise<CostBreakdown> {
  const [fuelCost, maintenanceCost, otherExpenses] = await Promise.all([
    prisma.fuelLog.aggregate({
      where: { filledAt: { gte: startDate, lte: endDate } },
      _sum: { totalCost: true }
    }),
    prisma.maintenanceLog.aggregate({
      where: { performedAt: { gte: startDate, lte: endDate } },
      _sum: { cost: true }
    }),
    prisma.expense.aggregate({
      where: { 
        expenseDate: { gte: startDate, lte: endDate },
        category: { not: 'FUEL' }
      },
      _sum: { amount: true }
    })
  ]);
  
  return {
    fuel: fuelCost._sum.totalCost || 0,
    maintenance: maintenanceCost._sum.cost || 0,
    other: otherExpenses._sum.amount || 0,
    total: (fuelCost._sum.totalCost || 0) + 
           (maintenanceCost._sum.cost || 0) + 
           (otherExpenses._sum.amount || 0)
  };
}
```


**ROI Calculation:**
```typescript
async function calculateROI(
  vehicleId: string,
  startDate: Date,
  endDate: Date
): Promise<ROIMetrics> {
  // Revenue: sum of trip values (if revenue tracking exists)
  // For now, use trip count * average revenue per trip
  const completedTrips = await prisma.trip.count({
    where: {
      vehicleId,
      status: 'COMPLETED',
      actualEnd: { gte: startDate, lte: endDate }
    }
  });
  
  // Costs
  const costs = await calculateOperationalCost(startDate, endDate);
  
  // Assuming average revenue per trip (configurable)
  const AVERAGE_REVENUE_PER_TRIP = 5000; // currency units
  const totalRevenue = completedTrips * AVERAGE_REVENUE_PER_TRIP;
  
  const profit = totalRevenue - costs.total;
  const roi = costs.total > 0 ? (profit / costs.total) * 100 : 0;
  
  return {
    revenue: totalRevenue,
    costs: costs.total,
    profit,
    roi,
    tripCount: completedTrips
  };
}
```

**Dashboard Data Aggregation:**
```typescript
async function getDashboardData(userId: string): Promise<DashboardData> {
  const user = await getUserWithPermissions(userId);
  
  // Role-based data filtering
  const baseData = {
    metrics: await getMetrics(user.role),
    recentActivity: await getRecentActivity(user.role),
    notifications: await getUserNotifications(userId)
  };
  
  return baseData;
}
```


---

## Part 8: Error Handling & Logging

### Global Error Handler

```typescript
interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

class ValidationError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

class UnauthorizedError extends Error implements AppError {
  statusCode = 401;
  isOperational = true;
  
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends Error implements AppError {
  statusCode = 403;
  isOperational = true;
  
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends Error implements AppError {
  statusCode = 404;
  isOperational = true;
  
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends Error implements AppError {
  statusCode = 409;
  isOperational = true;
  
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
```


**Global Error Middleware:**
```typescript
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.userId
  });
  
  if (error instanceof AppError && error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.name,
        details: (error as ValidationError).details
      }
    });
  }
  
  // Unknown/unexpected errors
  res.status(500).json({
    success: false,
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR'
    }
  });
}
```

**Structured Logging (Winston):**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```


### Audit Logging

```typescript
interface AuditLogEntry {
  userId: string;
  action: string;        // 'CREATE', 'UPDATE', 'DELETE', 'DISPATCH', etc.
  resource: string;      // 'trip', 'vehicle', 'driver', etc.
  resourceId: string;
  oldValue?: any;        // JSON snapshot before change
  newValue?: any;        // JSON snapshot after change
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      oldValue: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
      newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      createdAt: entry.timestamp
    }
  });
  
  logger.info('Audit log created', {
    userId: entry.userId,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId
  });
}

// Usage in service:
async function updateVehicle(id: string, data: UpdateVehicleDTO, userId: string) {
  const oldVehicle = await vehicleRepository.findById(id);
  
  const updatedVehicle = await vehicleRepository.update(id, data);
  
  await auditService.log({
    userId,
    action: 'UPDATE',
    resource: 'vehicle',
    resourceId: id,
    oldValue: oldVehicle,
    newValue: updatedVehicle,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date()
  });
  
  return updatedVehicle;
}
```


---

## Part 9: Implementation Phases

### Phase 1: Foundation (Days 1-2)

**Backend:**
1. Initialize Node.js + TypeScript project
2. Set up Express with middleware (helmet, cors, rate limiting)
3. Configure Prisma ORM
4. Design and implement database schema
5. Create seed data for development
6. Implement authentication system (JWT)
7. Implement RBAC middleware
8. Create base error classes and global error handler
9. Set up structured logging (Winston)
10. Create health check endpoint

**Frontend:**
1. Initialize React + TypeScript + Vite project
2. Configure Tailwind CSS + design tokens
3. Set up TanStack Query
4. Create authentication context and hooks
5. Implement protected route system
6. Build core UI components (Button, Input, Card, Modal, etc.)
7. Create app layout (sidebar, header)
8. Build login page
9. Set up API client with interceptors

**Deliverable:** Login works, authentication is secure, basic UI framework exists


### Phase 2: Core Modules (Days 3-5)

**Vehicles Module:**
- Backend: Repository, Service, Controller, Routes, DTOs, Validation
- State machine implementation
- Frontend: List page, Detail page, Create/Edit forms, Status badges
- Full CRUD with proper authorization
- Loading/Empty/Error states

**Drivers Module:**
- Backend: Complete implementation with license validation
- Frontend: List, Detail, Forms
- License expiry warnings
- Status management

**Trips Module:**
- Backend: Trip lifecycle implementation
- State machine (DRAFT → DISPATCHED → IN_PROGRESS → COMPLETED)
- Business rules engine
- Frontend: Trip list, Dispatch form, Trip detail with timeline
- Status flow visualization

**Integration:**
- Vehicles, Drivers, and Trips interconnected
- Status changes synchronized
- Audit logging implemented for all actions

**Deliverable:** Can create vehicles/drivers, dispatch trips, complete trips. All state transitions working.


### Phase 3: Operations & Finance (Days 6-7)

**Maintenance Module:**
- Backend: Maintenance logging, Vehicle status integration
- Frontend: Maintenance schedule, History view
- Vehicle availability impact
- Cost tracking

**Fuel Module:**
- Backend: Fuel logging with trip association
- Frontend: Fuel entry form, History
- Fuel efficiency calculations

**Expenses Module:**
- Backend: Expense tracking by category
- Frontend: Expense entry, Category breakdown
- Integration with trips/maintenance

**Dashboard:**
- Role-specific dashboard implementation
- Real-time metrics (calculated, not stored)
- Recent activity feed
- Live operations timeline (signature element)
- Notification center

**Deliverable:** Complete operational workflow from dispatch to completion with all financial tracking


### Phase 4: Analytics & Polish (Days 8-9)

**Analytics Module:**
- Backend: All calculated metrics endpoints
- Frontend: Analytics dashboard with charts
- Fleet utilization visualization
- Fuel efficiency trends
- Cost breakdown charts
- ROI metrics
- Driver performance metrics

**Notifications System:**
- Backend: Notification creation on domain events
- Frontend: Notification center in header
- Real-time updates (polling or websockets)
- Mark as read functionality

**Audit Trail:**
- Backend: Audit log viewing API
- Frontend: Audit trail viewer (admin only)
- Resource-specific audit history

**Polish:**
- Responsive design refinement
- Loading state improvements
- Error message improvements
- Empty state enhancements
- Animations and transitions
- Accessibility improvements
- Performance optimization

**Deliverable:** Complete, polished, production-ready application


### Phase 5: Testing & Deployment (Day 10)

**Testing:**
- Manual testing of all workflows
- Cross-browser testing
- Mobile responsive testing
- Security testing (OWASP checklist)
- Performance testing
- Edge case testing

**Documentation:**
- API documentation
- Deployment guide
- User guide
- Architecture documentation

**Deployment:**
- Docker containerization
- Environment configuration
- Database migrations
- Production deployment
- Health monitoring setup

**Demo Preparation:**
- Demo data seeding
- Demo script preparation
- Key features showcase
- Performance metrics ready

**Deliverable:** Production-ready, deployed, documented application ready for demo


---

## Part 10: Quality Checklist

### Before Considering Any Feature "Complete"

**Functionality:**
- [ ] Feature works as specified
- [ ] All edge cases handled
- [ ] Integrates with related modules
- [ ] State synchronization works

**Security:**
- [ ] Authentication required
- [ ] RBAC enforced
- [ ] Input validated
- [ ] Output sanitized
- [ ] SQL injection prevented
- [ ] XSS prevented

**Transactions:**
- [ ] Critical operations use transactions
- [ ] Rollback on failure tested
- [ ] Data consistency guaranteed

**Frontend:**
- [ ] Loading state implemented
- [ ] Empty state implemented
- [ ] Error state implemented
- [ ] Success feedback shown
- [ ] Responsive design works
- [ ] Keyboard accessible

**Backend:**
- [ ] Follows service/repository pattern
- [ ] Business logic in service layer
- [ ] Validation in middleware
- [ ] Error handling implemented
- [ ] Audit logging added
- [ ] Structured logging present


**Code Quality:**
- [ ] TypeScript types defined
- [ ] No `any` types
- [ ] No hardcoded values
- [ ] No duplicated logic
- [ ] Meaningful variable names
- [ ] Clean function signatures
- [ ] Reusable components

**Performance:**
- [ ] No N+1 queries
- [ ] Pagination implemented
- [ ] Indexes on queried fields
- [ ] Unnecessary re-renders prevented

**Documentation:**
- [ ] Code comments where needed
- [ ] API endpoint documented
- [ ] Complex logic explained

---

## Part 11: Success Criteria

### What Makes This an Enterprise-Grade System?

**1. Professional Architecture:**
- Clean separation of concerns
- Service layer handles business logic
- Repository layer handles data access
- Controllers are thin and focused
- Middleware handles cross-cutting concerns

**2. Data Integrity:**
- Transactions protect critical operations
- State machines prevent invalid transitions
- Foreign keys enforce relationships
- Validation at multiple layers
- Audit trail for accountability


**3. Security First:**
- Authentication on all endpoints
- Authorization checked before every action
- Input validated and sanitized
- Passwords properly hashed
- Security headers configured
- Rate limiting prevents abuse

**4. Real Synchronization:**
- Single dispatch updates vehicle, driver, trip, dashboard, analytics
- Maintenance immediately removes vehicle from dispatch options
- Trip completion updates all related metrics
- No manual cache invalidation needed
- No stale data anywhere

**5. Production Quality:**
- Error handling never crashes the system
- Failures rollback safely
- Users see meaningful error messages
- Loading states prevent confusion
- Empty states guide next actions
- Responsive design works everywhere

**6. Maintainability:**
- Code is readable
- Logic is reusable
- Modules are independent
- Adding features doesn't require changing unrelated code
- Business rules are centralized
- Testing is straightforward

**7. Scalability:**
- Database queries are optimized
- Pagination prevents large payloads
- Indexes support common queries
- Caching can be added without refactoring
- Architecture supports horizontal scaling


**8. User Experience:**
- Interface is intuitive
- Actions have clear outcomes
- Feedback is immediate
- Errors are recoverable
- Design is consistent
- Interactions feel professional

---

## Part 12: Demo Talking Points

### What to Highlight

**"This is not a CRUD app":**
- Show how dispatching a trip updates 6+ parts of the system simultaneously
- Demonstrate that completing maintenance immediately affects dispatch options
- Show real-time dashboard updates

**"This is secure":**
- Show RBAC in action - different users see different things
- Demonstrate validation preventing invalid operations
- Show audit trail of all actions

**"This is production-ready":**
- Show error handling recovering gracefully
- Demonstrate transaction rollback on failure
- Show responsive design on mobile
- Demonstrate loading/empty/error states

**"This is maintainable":**
- Walk through clean architecture
- Show how business rules are centralized
- Demonstrate how adding a new feature wouldn't require touching unrelated code

**"This calculates everything dynamically":**
- Show analytics recalculating in real-time
- Demonstrate that metrics are never stale
- Show how ROI, fuel efficiency, and utilization are always current


---

## Part 13: Key Principles to Remember

### During Development

**Never:**
- Hardcode IDs, roles, or business logic
- Put business logic in controllers
- Skip validation
- Bypass RBAC
- Ignore error states
- Leave disconnected modules
- Store derived metrics
- Write duplicated code

**Always:**
- Use transactions for critical operations
- Enforce state machine transitions
- Validate at multiple layers
- Log audit trails
- Handle all states (loading/empty/error/success)
- Think about synchronization
- Calculate metrics dynamically
- Consider security first

**Question Every Decision:**
- Is this secure?
- Is this maintainable?
- Is this reusable?
- Is this synchronized?
- Would this pass code review?
- Will this scale?
- Is this production-ready?

---

## Conclusion

This implementation plan provides the complete blueprint for building TransitOps as an enterprise-grade ERP system. Every aspect has been designed with production quality, security, scalability, and maintainability in mind.

The system should feel like it was built by an experienced engineering team, not generated as a quick hackathon project. Every feature is fully integrated, every transaction is safe, every action is auditable, and every state is synchronized.

Follow this plan, apply the engineering philosophy throughout, and the result will be a professional transport operations management platform that demonstrates true enterprise software engineering principles.

