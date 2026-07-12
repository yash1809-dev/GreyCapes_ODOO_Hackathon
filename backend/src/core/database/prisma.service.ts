import { PrismaClient } from '@prisma/client';
import { logger } from '../logger/logger.service';

class PrismaService {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
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
  }
}

export const prisma = PrismaService.getInstance();
