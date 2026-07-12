import { PrismaClient } from '@prisma/client';
import { prisma } from './prisma.service';
import { logger } from '../logger/logger.service';

export class TransactionManager {
  /**
   * Execute operations within a transaction
   * Automatically commits on success, rolls back on error
   */
  static async execute<T>(
    callback: (tx: PrismaClient) => Promise<T>,
    context?: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      logger.info('Transaction started', { context });
      
      const result = await prisma.$transaction(async (tx) => {
        return await callback(tx as PrismaClient);
      });
      
      const duration = Date.now() - startTime;
      logger.info('Transaction committed', { context, duration: `${duration}ms` });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Transaction rolled back', { 
        context, 
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }
}
