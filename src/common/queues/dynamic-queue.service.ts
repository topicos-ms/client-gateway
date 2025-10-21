import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import { IQueueConfigRepository, QUEUE_CONFIG_REPOSITORY } from './queue-config.repository';
import { JobData } from '../interceptors/interfaces/job-data.interface';
import { QueueSystemConfig, QueueDefinition, loadQueueConfig } from './queue-config.interface';
import { buildQueueConfig as buildQueueConfigUtil } from './utils/queue-config.util';
import { QueueRouter } from './utils/queue-routing.util';
import { JobHistoryRepository } from './utils/job-history.repository';
import * as fs from 'fs';
import * as path from 'path';

export interface QueueJobOptions {
  priority?: number;
  delay?: number;
  timeout?: number;
}

@Injectable()
export class DynamicQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DynamicQueueService.name);

  private queues: Map<string, Queue> = new Map();
  private queueConfig: QueueSystemConfig;
  private queueDefinitions: Map<string, QueueDefinition> = new Map();
  private readonly resultHistoryLimit: number;
  private router!: QueueRouter;
  private historyRepo!: JobHistoryRepository;

  constructor(
    private readonly redisService: RedisService,
    @Inject(QUEUE_CONFIG_REPOSITORY) private readonly configRepo: IQueueConfigRepository,
  ) {
    this.queueConfig = loadQueueConfig();
    this.resultHistoryLimit = this.resolveHistoryLimit();
    this.logger.log(`Loaded configuration for ${this.queueConfig.queues.length} queues`);
    this.router = new QueueRouter(this.queueConfig, this.queues, this.logger);
    this.historyRepo = new JobHistoryRepository(this.redisService, this.queues, this.logger, this.resultHistoryLimit);
  }

  async onModuleInit() {
    try {
      await this.initializeQueues();
      this.setupQueueEventListeners();
      this.logger.log(`${this.queues.size} dynamic queues initialized successfully`);
    } catch (error) {
      this.logger.error('Error initializing dynamic queues:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    const closePromises = Array.from(this.queues.values()).map((queue) => queue.close());
    await Promise.all(closePromises);
    this.logger.log(`All ${this.queues.size} queues closed`);
  }

  private async initializeQueues() {
    for (const queueDef of this.queueConfig.queues) {
      if (!queueDef.enabled) {
        this.logger.debug(`Skipping disabled queue: ${queueDef.name}`);
        continue;
      }

      try {
        const queueConfig = this.buildQueueConfig(queueDef);
        const queue = new Queue(queueDef.name, queueConfig);

        this.queues.set(queueDef.name, queue);
        this.queueDefinitions.set(queueDef.name, queueDef);

        this.logger.log(
          `Queue '${queueDef.name}' initialized (concurrency: ${queueDef.concurrency})`,
        );
      } catch (error) {
        this.logger.error(`Failed to initialize queue '${queueDef.name}':`, error);
        throw error;
      }
    }
  }

  private buildQueueConfig(queueDef: QueueDefinition) {
    return buildQueueConfigUtil(queueDef);
  }

  private setupQueueEventListeners() {
    // Keep listeners minimal: only log errors to avoid noisy output
    this.queues.forEach((queue, queueName) => {
      queue.on('error', (error) => {
        this.logger.error(`[${queueName}] Queue error:`, error);
      });
    });
  }

  async addJobToQueue(
    queueName: string,
    jobData: JobData,
    options?: QueueJobOptions,
  ) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const queueDef = this.queueDefinitions.get(queueName);
    const job = await queue.add('process-request', jobData, {
      ...options,
      jobId: jobData.id,
      priority: options?.priority || queueDef?.priority || 1,
    });

    this.logger.log(`Job ${job.id} queued in '${queueName}' queue`);
    return job;
  }

  async determineQueueForUrl(url: string): Promise<string> {
    return this.router.determineQueueForUrl(url);
  }

  async getJobStatus(jobId: string) {
    return this.historyRepo.getJobStatus(jobId);
  }

  async getQueuesStats() {
    const stats: Record<string, any> = {};

    for (const [queueName, queue] of this.queues) {
      const queueDef = this.queueDefinitions.get(queueName);
      const waiting = await queue.getWaiting();

      stats[queueName] = {
        name: queueName,
        displayName: queueDef?.displayName || queueName,
        waiting: waiting.length,
        timeout: queueDef?.timeout || 60,
        priority: queueDef?.priority || 1,
        concurrency: queueDef?.concurrency || 1,
        enabled: queueDef?.enabled || false,
        estimatedTime: queueDef?.estimatedTime || 'Unknown',
      };
    }

    return {
      queues: stats,
      timestamp: new Date().toISOString(),
      totalQueues: this.queues.size,
      defaultQueue: this.queueConfig.defaultQueue,
    };
  }

  async getCompletedJobResults(limit = 50, queueName?: string) {
    return this.historyRepo.getCompletedJobResults(limit, queueName);
  }

  async getFailedJobResults(limit = 50, queueName?: string) {
    return this.historyRepo.getFailedJobResults(limit, queueName);
  }

  getQueueConfig(): QueueSystemConfig {
    return this.queueConfig;
  }

  getQueueDefinition(queueName: string): QueueDefinition | undefined {
    return this.queueDefinitions.get(queueName);
  }

  async setQueueWorkers(queueName: string, workers: number, persist = true): Promise<QueueDefinition> {
    const existing = this.queueDefinitions.get(queueName);
    if (!existing) throw new Error(`Queue '${queueName}' not found`);

    const sanitized = Math.max(0, Math.floor(workers));
    const updated: QueueDefinition = { ...existing, workers: sanitized } as QueueDefinition;

    this.queueDefinitions.set(queueName, updated);
    const idx = this.queueConfig.queues.findIndex((q) => q.name === queueName);
    if (idx >= 0) this.queueConfig.queues[idx] = updated;

    if (persist) {
      await this.configRepo.saveConfig(this.queueConfig);
      await this.saveConfigToFile();
      await this.configRepo.publishUpdate({ type: 'queue-updated', queueName, timestamp: new Date().toISOString() });
    }

    this.logger.log(`Queue '${queueName}' workers updated in config: ${existing.workers ?? 0} -> ${sanitized}`);
    return updated;
  }

  async setQueueConcurrency(queueName: string, concurrency: number, persist = true): Promise<QueueDefinition> {
    const existing = this.queueDefinitions.get(queueName);
    if (!existing) throw new Error(`Queue '${queueName}' not found`);

    const sanitized = Math.max(1, Math.floor(concurrency));
    const updated: QueueDefinition = { ...existing, concurrency: sanitized } as QueueDefinition;

    this.queueDefinitions.set(queueName, updated);
    const idx = this.queueConfig.queues.findIndex((q) => q.name === queueName);
    if (idx >= 0) this.queueConfig.queues[idx] = updated;

    if (persist) {
      await this.configRepo.saveConfig(this.queueConfig);
      await this.saveConfigToFile();
      await this.configRepo.publishUpdate({ type: 'queue-updated', queueName, timestamp: new Date().toISOString() });
    }

    this.logger.log(`Queue '${queueName}' concurrency updated in config: ${existing.concurrency ?? 1} -> ${sanitized}`);
    return updated;
  }

  getAvailableQueues(): string[] {
    return Array.from(this.queues.keys());
  }

  isQueueAvailable(queueName: string): boolean {
    return this.queues.has(queueName);
  }

  // Removed getQueue(): not used externally; keep surface small

  private async saveConfigToFile() {
    try {
      const configPath = path.join(process.cwd(), 'config', 'queues.json');
      await fs.promises.writeFile(configPath, JSON.stringify(this.queueConfig, null, 2));
      this.logger.log(`Queue configuration saved to ${configPath}`);
    } catch (error: any) {
      this.logger.error(`Failed to save queue configuration: ${error.message}`);
      throw error;
    }
  }

  async createQueue(queueDef: QueueDefinition, persist = true) {
    if (this.queues.has(queueDef.name)) {
      throw new Error(`Queue '${queueDef.name}' already exists`);
    }

    const queueConfig = this.buildQueueConfig(queueDef);
    const queue = new Queue(queueDef.name, queueConfig);

    this.queues.set(queueDef.name, queue);
    this.queueDefinitions.set(queueDef.name, queueDef);
    this.queueConfig.queues.push(queueDef);

    if (persist) {
      await this.saveConfigToFile();
    }

    this.logger.log(`Queue '${queueDef.name}' created dynamically`);
    return queueDef;
  }

  async removeQueue(queueName: string, persist = true) {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue '${queueName}' not found`);

    await queue.close();
    this.queues.delete(queueName);
    this.queueDefinitions.delete(queueName);
    this.queueConfig.queues = this.queueConfig.queues.filter((q) => q.name !== queueName);

    if (persist) {
      await this.saveConfigToFile();
    }

    this.logger.log(`Queue '${queueName}' removed dynamically`);
  }

  async updateQueue(queueName: string, newDef: Partial<QueueDefinition>, persist = true) {
    const existing = this.queueDefinitions.get(queueName);
    if (!existing) throw new Error(`Queue '${queueName}' not found`);

    const updatedDef: QueueDefinition = { ...existing, ...newDef, name: queueName } as QueueDefinition;
    await this.removeQueue(queueName, false);
    await this.createQueue(updatedDef, false);

    if (persist) {
      await this.saveConfigToFile();
    }

    this.logger.log(`Queue '${queueName}' updated dynamically`);
    return updatedDef;
  }

  // Removed reloadConfiguration(): not used by controllers

  private resolveHistoryLimit(): number {
    const raw = process.env.QUEUE_RESULT_HISTORY_LIMIT;
    if (!raw) return 100;
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed <= 0) return 100;
    return parsed;
  }
}
