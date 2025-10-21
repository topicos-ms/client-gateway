import { QueueDefinition } from '../queue-config.interface';

export function getRedisConnectionOptions() {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
    lazyConnect: true,
    family: 4,
    enableReadyCheck: false,
  } as const;
}

export function getDefaultJobOptions(queueDef: QueueDefinition) {
  return {
    removeOnComplete: queueDef.removeOnComplete || 100,
    removeOnFail: queueDef.removeOnFail || 50,
    attempts: queueDef.attempts,
    backoff: {
      type: 'exponential' as const,
      delay: queueDef.retryDelay,
    },
    delay: queueDef.processingDelay || 0,
  };
}

export function buildQueueConfig(queueDef: QueueDefinition) {
  return {
    connection: getRedisConnectionOptions(),
    defaultJobOptions: getDefaultJobOptions(queueDef),
  };
}

