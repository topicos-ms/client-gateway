import { Injectable, Logger } from '@nestjs/common';
import { Worker } from 'bullmq';
import { QueueDefinition } from '../../queues/queue-config.interface';
import { JobProcessorService } from '../processing/job-processor.service';
import { RedisService } from '../../redis/redis.service';
import { JobStatusService } from '../../websockets/job-status.service';

export interface WorkerInfo {
  id: string;
  queueName: string;
  strategy: string;
  concurrency: number;
  status: 'active' | 'paused' | 'stopped';
  createdAt: string;
  worker: Worker;
}

@Injectable()
export class WorkerFactoryService {
  private readonly logger = new Logger(WorkerFactoryService.name);

  constructor(
    private readonly jobProcessor: JobProcessorService,
    private readonly redisService: RedisService,
    private readonly jobStatusService: JobStatusService,
  ) {}

  async createWorker(
    queueDef: QueueDefinition,
    workerNumber: number,
    strategy: string,
  ): Promise<WorkerInfo> {
    const workerId = `${queueDef.name}-${strategy}-${workerNumber}`;

    try {
      const bullMQConnection = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        maxRetriesPerRequest: null,
        lazyConnect: true,
        connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000', 10),
        retryDelayOnFailure: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
        family: 4,
      };

      const worker = new Worker(
        queueDef.name,
        async (job) => this.jobProcessor.processJob(job, queueDef.name, queueDef, workerNumber),
        {
          connection: bullMQConnection,
          concurrency: queueDef.concurrency,
          maxStalledCount: 1,
          stalledInterval: 30000,
        },
      );

      this.setupWorkerEventHandlers(worker, workerId, queueDef.name);

      const workerInfo: WorkerInfo = {
        id: workerId,
        queueName: queueDef.name,
        strategy,
        concurrency: queueDef.concurrency,
        status: 'active',
        createdAt: new Date().toISOString(),
        worker,
      };

      this.logger.log(`Worker '${workerId}' created successfully`);
      return workerInfo;
    } catch (error) {
      const message = error instanceof Error ? error.message : `${error}`;
      this.logger.error(`Failed to create worker '${workerId}': ${message}`);
      throw error;
    }
  }

  private setupWorkerEventHandlers(worker: Worker, workerId: string, queueName: string): void {
    worker.on('completed', async (job) => {
      this.logger.debug(`[${workerId}] Job ${job.id} completed`);

      try {
        const resultKey = `job:result:${job.id}`;
        let result: any;

        try {
          const stored = await this.redisService.get(resultKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            result = parsed?.result;
          }
        } catch (readErr) {
          const message = readErr instanceof Error ? readErr.message : `${readErr}`;
          this.logger.debug(
            `[${workerId}] Could not read cached result for job ${job.id}: ${message}`,
          );
        }

        this.jobStatusService.markJobCompleted(job.id!, result);
        // explicit server console log
        // eslint-disable-next-line no-console
        console.log(`[WS] Job ${job.id} completed on queue '${queueName}' - notifying clients`);
      } catch (notifyErr) {
        const message = notifyErr instanceof Error ? notifyErr.message : `${notifyErr}`;
        this.logger.warn(`Could not notify completion for job ${job.id}: ${message}`);
      }
    });

    worker.on('failed', (job, err) => {
      const jobId = job?.id ?? 'unknown';
      const errorMessage = err instanceof Error ? err.message : `${err}`;
      this.logger.error(`[${workerId}] Job ${jobId} failed: ${errorMessage}`);
    });

    worker.on('error', (err) => {
      const errorMessage = err instanceof Error ? err.message : `${err}`;
      this.logger.error(`[${workerId}] Worker error: ${errorMessage}`);
    });

    worker.on('stalled', (jobId) => {
      this.logger.warn(`[${workerId}] Job ${jobId} stalled`);
    });

    worker.on('paused', () => {
      this.logger.log(`[${workerId}] Worker paused`);
    });

    worker.on('resumed', () => {
      this.logger.log(`[${workerId}] Worker resumed`);
    });

    worker.on('closed', () => {
      this.logger.log(`[${workerId}] Worker closed`);
    });
  }

  async shutdownWorker(workerInfo: WorkerInfo): Promise<void> {
    try {
      this.logger.log(`Shutting down worker '${workerInfo.id}'...`);
      await workerInfo.worker.close();
      this.logger.log(`Worker '${workerInfo.id}' shut down successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : `${error}`;
      this.logger.error(`Error shutting down worker '${workerInfo.id}': ${message}`);
    }
  }

  getWorkerCountForQueue(queueDef: QueueDefinition): number {
    const envKey = `QUEUE_${queueDef.name.toUpperCase()}_WORKERS`;
    const envWorkerCount = process.env[envKey];

    if (envWorkerCount) {
      const count = parseInt(envWorkerCount, 10);
      if (!Number.isNaN(count) && count > 0) {
        return Math.min(count, this.getMaxWorkersPerQueue());
      }
    }

    const configWorkers = queueDef.workers || 1;
    return Math.min(configWorkers, this.getMaxWorkersPerQueue());
  }

  getWorkerStrategy(): string {
    return process.env.WORKER_STRATEGY || 'multiple';
  }

  getMaxWorkersPerQueue(): number {
    return parseInt(process.env.WORKER_MAX_PER_QUEUE || '5', 10);
  }
}
