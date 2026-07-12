import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './core/errors/error.handler';
import { logger } from './core/logger/logger.service';
import authRoutes from './modules/auth/auth.routes';
import vehicleRoutes from './modules/vehicles/vehicles.routes';
import driverRoutes from './modules/drivers/drivers.routes';
import tripRoutes from './modules/trips/trips.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

export function createApp(): Application {
  const app = express();

  // ============================================
  // Security Middleware
  // ============================================
  
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ============================================
  // Rate Limiting
  // ============================================

  // General rate limiter
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Strict limiter for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiters
  app.use('/api/', generalLimiter);
  app.use('/api/auth/login', authLimiter);

  // ============================================
  // Request Logging
  // ============================================
  
  app.use((req, res, next) => {
    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    next();
  });

  // ============================================
  // Health Check
  // ============================================

  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // ============================================
  // API Routes
  // ============================================

  app.use('/api/auth', authRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/drivers', driverRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'TransitOps API',
      version: '1.0.0',
      description: 'Enterprise Transport Operations ERP',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        vehicles: '/api/vehicles',
        drivers: '/api/drivers',
        trips: '/api/trips',
        maintenance: '/api/maintenance',
        fuel: '/api/fuel',
        expenses: '/api/expenses',
        analytics: '/api/analytics',
        notifications: '/api/notifications',
        audit: '/api/audit'
      }
    });
  });

  // ============================================
  // Error Handling
  // ============================================

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Endpoint not found',
        code: 'NOT_FOUND'
      }
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
