import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { CryptoUtils } from '../src/shared/utils/crypto.utils';
import { ROLES, ROLE_PERMISSIONS } from '../src/shared/constants/roles';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // Clean existing data (in development only)
  // ============================================
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Cleaning existing data...');
    
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.tripHistory.deleteMany();
    await prisma.fuelLog.deleteMany();
    await prisma.maintenanceExpense.deleteMany();
    await prisma.maintenanceLog.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.vehicleType.deleteMany();
    await prisma.region.deleteMany();
    await prisma.user.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
  }

  // ============================================
  // Create Roles
  // ============================================

  console.log('Creating roles...');

  const roles = await Promise.all([
    prisma.role.create({
      data: {
        name: ROLES.ADMIN,
        description: 'Full system access'
      }
    }),
    prisma.role.create({
      data: {
        name: ROLES.FLEET_MANAGER,
        description: 'Manages vehicles and maintenance'
      }
    }),
    prisma.role.create({
      data: {
        name: ROLES.DISPATCHER,
        description: 'Manages trips and dispatch operations'
      }
    }),
    prisma.role.create({
      data: {
        name: ROLES.SAFETY_OFFICER,
        description: 'Manages drivers and compliance'
      }
    }),
    prisma.role.create({
      data: {
        name: ROLES.FINANCIAL_ANALYST,
        description: 'Views financial data and analytics'
      }
    }),
    prisma.role.create({
      data: {
        name: ROLES.DRIVER,
        description: 'Driver access to assigned trips'
      }
    })
  ]);

  console.log(`✓ Created ${roles.length} roles`);

  // ============================================
  // Create Permissions
  // ============================================

  console.log('Creating permissions...');

  const permissionsList = [
    // Vehicles
    { resource: 'vehicles', action: 'create' },
    { resource: 'vehicles', action: 'read' },
    { resource: 'vehicles', action: 'update' },
    { resource: 'vehicles', action: 'delete' },
    
    // Drivers
    { resource: 'drivers', action: 'create' },
    { resource: 'drivers', action: 'read' },
    { resource: 'drivers', action: 'update' },
    { resource: 'drivers', action: 'delete' },
    
    // Trips
    { resource: 'trips', action: 'create' },
    { resource: 'trips', action: 'read' },
    { resource: 'trips', action: 'update' },
    { resource: 'trips', action: 'delete' },
    { resource: 'trips', action: 'dispatch' },
    { resource: 'trips', action: 'complete' },
    { resource: 'trips', action: 'cancel' },
    
    // Maintenance
    { resource: 'maintenance', action: 'create' },
    { resource: 'maintenance', action: 'read' },
    { resource: 'maintenance', action: 'update' },
    { resource: 'maintenance', action: 'delete' },
    
    // Fuel
    { resource: 'fuel', action: 'create' },
    { resource: 'fuel', action: 'read' },
    { resource: 'fuel', action: 'update' },
    { resource: 'fuel', action: 'delete' },
    
    // Expenses
    { resource: 'expenses', action: 'create' },
    { resource: 'expenses', action: 'read' },
    { resource: 'expenses', action: 'update' },
    { resource: 'expenses', action: 'delete' },
    
    // Analytics
    { resource: 'analytics', action: 'read' },
    { resource: 'analytics', action: 'export' },
    
    // Audit
    { resource: 'audit', action: 'read' },
    
    // Users
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' }
  ];

  const permissions = await Promise.all(
    permissionsList.map(p =>
      prisma.permission.create({ data: p })
    )
  );

  console.log(`✓ Created ${permissions.length} permissions`);

  // ============================================
  // Assign Permissions to Roles
  // ============================================

  console.log('Assigning permissions to roles...');

  const rolePermissionMap: Record<string, string[]> = {
    [ROLES.ADMIN]: permissionsList.map(p => `${p.resource}:${p.action}`),
    [ROLES.FLEET_MANAGER]: [
      'vehicles:create', 'vehicles:read', 'vehicles:update', 'vehicles:delete',
      'maintenance:create', 'maintenance:read', 'maintenance:update', 'maintenance:delete',
      'analytics:read', 'fuel:read', 'expenses:read', 'trips:read'
    ],
    [ROLES.DISPATCHER]: [
      'trips:create', 'trips:read', 'trips:update', 'trips:dispatch', 
      'trips:complete', 'trips:cancel',
      'vehicles:read', 'drivers:read',
      'fuel:create', 'fuel:read',
      'expenses:create', 'expenses:read'
    ],
    [ROLES.SAFETY_OFFICER]: [
      'drivers:create', 'drivers:read', 'drivers:update', 'drivers:delete',
      'trips:read', 'vehicles:read', 'analytics:read'
    ],
    [ROLES.FINANCIAL_ANALYST]: [
      'expenses:read', 'fuel:read', 'maintenance:read', 'trips:read',
      'analytics:read', 'analytics:export'
    ],
    [ROLES.DRIVER]: [
      'trips:read', 'fuel:create', 'fuel:read'
    ]
  };

  for (const role of roles) {
    const permissionStrings = rolePermissionMap[role.name] || [];
    
    for (const permString of permissionStrings) {
      const [resource, action] = permString.split(':');
      const permission = permissions.find(
        p => p.resource === resource && p.action === action
      );
      
      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id
          }
        });
      }
    }
  }

  console.log('✓ Assigned permissions to roles');

  // ============================================
  // Create Demo Users
  // ============================================

  console.log('Creating demo users...');

  const password = await CryptoUtils.hashPassword('password123');

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@transitops.com',
        passwordHash: password,
        fullName: 'Admin User',
        roleId: roles.find(r => r.name === ROLES.ADMIN)!.id,
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'fleet@transitops.com',
        passwordHash: password,
        fullName: 'Fleet Manager',
        roleId: roles.find(r => r.name === ROLES.FLEET_MANAGER)!.id,
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'dispatcher@transitops.com',
        passwordHash: password,
        fullName: 'Dispatch Manager',
        roleId: roles.find(r => r.name === ROLES.DISPATCHER)!.id,
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'safety@transitops.com',
        passwordHash: password,
        fullName: 'Safety Officer',
        roleId: roles.find(r => r.name === ROLES.SAFETY_OFFICER)!.id,
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'finance@transitops.com',
        passwordHash: password,
        fullName: 'Financial Analyst',
        roleId: roles.find(r => r.name === ROLES.FINANCIAL_ANALYST)!.id,
        isActive: true
      }
    })
  ]);

  console.log(`✓ Created ${users.length} demo users`);
  console.log('\n📧 Demo User Credentials:');
  users.forEach(user => {
    console.log(`   ${user.email} / password123`);
  });

  // ============================================
  // Create Regions
  // ============================================

  console.log('\nCreating regions...');

  const regions = await Promise.all([
    prisma.region.create({ data: { name: 'North Region', code: 'NR' } }),
    prisma.region.create({ data: { name: 'South Region', code: 'SR' } }),
    prisma.region.create({ data: { name: 'East Region', code: 'ER' } }),
    prisma.region.create({ data: { name: 'West Region', code: 'WR' } }),
    prisma.region.create({ data: { name: 'Central Region', code: 'CR' } })
  ]);

  console.log(`✓ Created ${regions.length} regions`);

  // ============================================
  // Create Vehicle Types
  // ============================================

  console.log('Creating vehicle types...');

  const vehicleTypes = await Promise.all([
    prisma.vehicleType.create({
      data: {
        name: 'Heavy Truck',
        description: '20-ton capacity truck',
        defaultCapacity: 20000,
        fuelType: 'DIESEL'
      }
    }),
    prisma.vehicleType.create({
      data: {
        name: 'Medium Truck',
        description: '10-ton capacity truck',
        defaultCapacity: 10000,
        fuelType: 'DIESEL'
      }
    }),
    prisma.vehicleType.create({
      data: {
        name: 'Light Van',
        description: '3-ton capacity van',
        defaultCapacity: 3000,
        fuelType: 'PETROL'
      }
    }),
    prisma.vehicleType.create({
      data: {
        name: 'Electric Van',
        description: '2-ton capacity electric van',
        defaultCapacity: 2000,
        fuelType: 'ELECTRIC'
      }
    })
  ]);

  console.log(`✓ Created ${vehicleTypes.length} vehicle types`);

  // ============================================
  // Create Vehicles
  // ============================================

  console.log('Creating vehicles...');

  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TRK-001',
        vehicleTypeId: vehicleTypes[0].id,
        regionId: regions[0].id,
        status: 'AVAILABLE',
        purchaseDate: new Date('2020-01-15'),
        currentOdometer: 125000
      }
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TRK-002',
        vehicleTypeId: vehicleTypes[0].id,
        regionId: regions[0].id,
        status: 'AVAILABLE',
        purchaseDate: new Date('2020-03-20'),
        currentOdometer: 98000
      }
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'TRK-003',
        vehicleTypeId: vehicleTypes[1].id,
        regionId: regions[1].id,
        status: 'AVAILABLE',
        purchaseDate: new Date('2021-05-10'),
        currentOdometer: 67000
      }
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'VAN-001',
        vehicleTypeId: vehicleTypes[2].id,
        regionId: regions[2].id,
        status: 'AVAILABLE',
        purchaseDate: new Date('2022-01-05'),
        currentOdometer: 45000
      }
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'VAN-002',
        vehicleTypeId: vehicleTypes[2].id,
        regionId: regions[2].id,
        status: 'AVAILABLE',
        purchaseDate: new Date('2022-06-15'),
        currentOdometer: 32000
      }
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: 'EV-001',
        vehicleTypeId: vehicleTypes[3].id,
        regionId: regions[3].id,
        status: 'AVAILABLE',
        purchaseDate: new Date('2023-03-01'),
        currentOdometer: 15000
      }
    })
  ]);

  console.log(`✓ Created ${vehicles.length} vehicles`);

  // ============================================
  // Create Drivers
  // ============================================

  console.log('Creating drivers...');

  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        fullName: 'John Smith',
        licenseNumber: 'DL-001-2024',
        licenseExpiry: new Date('2025-12-31'),
        phone: '+1-555-0101',
        status: 'AVAILABLE',
        hireDate: new Date('2020-01-15')
      }
    }),
    prisma.driver.create({
      data: {
        fullName: 'Sarah Johnson',
        licenseNumber: 'DL-002-2024',
        licenseExpiry: new Date('2026-06-30'),
        phone: '+1-555-0102',
        status: 'AVAILABLE',
        hireDate: new Date('2020-06-01')
      }
    }),
    prisma.driver.create({
      data: {
        fullName: 'Michael Brown',
        licenseNumber: 'DL-003-2024',
        licenseExpiry: new Date('2025-09-15'),
        phone: '+1-555-0103',
        status: 'AVAILABLE',
        hireDate: new Date('2021-03-10')
      }
    }),
    prisma.driver.create({
      data: {
        fullName: 'Emily Davis',
        licenseNumber: 'DL-004-2024',
        licenseExpiry: new Date('2026-03-20'),
        phone: '+1-555-0104',
        status: 'AVAILABLE',
        hireDate: new Date('2021-08-15')
      }
    }),
    prisma.driver.create({
      data: {
        fullName: 'David Wilson',
        licenseNumber: 'DL-005-2024',
        licenseExpiry: new Date('2025-11-30'),
        phone: '+1-555-0105',
        status: 'AVAILABLE',
        hireDate: new Date('2022-02-01')
      }
    })
  ]);

  console.log(`✓ Created ${drivers.length} drivers`);

  console.log('\n✅ Database seed completed successfully!\n');
  
  console.log('Summary:');
  console.log(`  - ${roles.length} roles`);
  console.log(`  - ${permissions.length} permissions`);
  console.log(`  - ${users.length} users`);
  console.log(`  - ${regions.length} regions`);
  console.log(`  - ${vehicleTypes.length} vehicle types`);
  console.log(`  - ${vehicles.length} vehicles`);
  console.log(`  - ${drivers.length} drivers`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
