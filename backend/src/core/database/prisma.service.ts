import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { logger } from '../logger/logger.service';
import * as dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

class PrismaService {
  private static instance: PrismaClient;
  private static pool: Pool;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      // Create PostgreSQL connection pool
      PrismaService.pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });

      // Create Prisma adapter
      const adapter = new PrismaPg(PrismaService.pool);

      PrismaService.instance = new PrismaClient({
        adapter,
        log: [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' }
        ]
      });

      // Log queries in development
      if (process.env.NODE_ENV === 'development') {
        PrismaService.instance.$on('query' as never, (e: any) => {
          logger.debug('Query', { 
            query: e.query, 
            params: e.params,
            duration: `${e.duration}ms`
          });
        });
      }

      PrismaService.instance.$on('error' as never, (e: any) => {
        logger.error('Prisma Error', { error: e });
      });
    }

    return PrismaService.instance;
  }

  public static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
    }
    if (PrismaService.pool) {
      await PrismaService.pool.end();
    }
  }
}

export const prisma = PrismaService.getInstance();
