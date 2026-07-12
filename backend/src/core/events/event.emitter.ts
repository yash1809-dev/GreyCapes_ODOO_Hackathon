import { EventEmitter } from 'events';
import { DomainEvent, DomainEventData, EventPayload } from './event.types';
import { logger } from '../logger/logger.service';

class DomainEventEmitter extends EventEmitter {
  private static instance: DomainEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(50); // Increase for production
  }

  public static getInstance(): DomainEventEmitter {
    if (!DomainEventEmitter.instance) {
      DomainEventEmitter.instance = new DomainEventEmitter();
    }
    return DomainEventEmitter.instance;
  }

  /**
   * Emit a domain event
   */
  emitEvent<T = EventPayload>(
    event: DomainEvent,
    data: T,
    userId?: string
  ): void {
    const eventData: DomainEventData<T> = {
      event,
      data,
      timestamp: new Date(),
      userId
    };

    logger.info('Domain event emitted', {
      event,
      userId,
      dataKeys: Object.keys(data as any)
    });

    this.emit(event, eventData);
  }

  /**
   * Subscribe to a domain event
   */
  onEvent<T = EventPayload>(
    event: DomainEvent,
    handler: (eventData: DomainEventData<T>) => void | Promise<void>
  ): void {
    this.on(event, async (eventData: DomainEventData<T>) => {
      try {
        await handler(eventData);
      } catch (error) {
        logger.error('Event handler error', {
          event,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }
}

export const domainEvents = DomainEventEmitter.getInstance();
