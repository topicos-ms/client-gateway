import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobData } from '../../interceptors/interfaces/job-data.interface';
import { QueueDefinition } from '../../queues/queue-config.interface';
import { RedisService } from '../../redis/redis.service';
import { MessageDispatcherService } from './message-dispatcher.service';
import { JobCacheService } from '../cache/job-cache.service';
import {
  CacheMetadata,
  JobErrorInfo,
  JobErrorType,
  JobResultRecord,
} from '../interfaces/job-result.interface';

@Injectable()
export class JobProcessorService {
  private readonly logger = new Logger(JobProcessorService.name);
  private readonly resultHistoryLimit: number;
  private readonly resultTtlSeconds: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly dispatcher: MessageDispatcherService,
    private readonly cache: JobCacheService,
  ) {
    this.resultHistoryLimit = this.resolveNumberFromEnv(
      'QUEUE_RESULT_HISTORY_LIMIT',
      100,
      1,
    );
    this.resultTtlSeconds = this.resolveNumberFromEnv('QUEUE_RESULT_TTL', 86400, 60);
  }

  async processJob(
    job: Job,
    queueName: string,
    queueDef: QueueDefinition,
    workerId?: number,
  ): Promise<any> {
    const jobData = job.data as JobData;
    const timeoutMs = this.getTimeoutMs(queueDef);
    const workerInfo = workerId ? ` [Worker #${workerId}]` : '';

    this.logger.log(
      `[${queueName}]${workerInfo} Processing job ${job.id}: ${jobData.method} ${jobData.rawUrl}`,
    );

    try {
      const cached = await this.processFromCache(
        job,
        queueName,
        jobData,
        workerId,
      );
      if (cached !== undefined) return cached;

      const result = await this.dispatchAndPersist(
        job,
        queueName,
        jobData,
        workerId,
        timeoutMs,
      );
      return result;
    } catch (error) {
      const normalizedError = this.normalizeError(error);

      this.logger.error(
        `[${queueName}]${workerInfo} Job ${job.id} failed: ${normalizedError.message}`,
      );

      await this.saveJobResult(
        job,
        queueName,
        jobData,
        workerId,
        null,
        normalizedError,
      );

      throw error;
    }
  }

  private async processFromCache(
    job: Job,
    queueName: string,
    jobData: JobData,
    workerId?: number,
  ): Promise<any | undefined> {
    const cached = await this.cache.tryGetFromCache(jobData);
    if (!cached) return undefined;

    const workerInfo = workerId ? ` [Worker #${workerId}]` : '';
    this.logger.log(
      `[${queueName}]${workerInfo} Job ${job.id} served from CACHE`,
    );

    await this.saveJobResult(
      job,
      queueName,
      jobData,
      workerId,
      cached,
      null,
    );
    return cached;
  }

  private async dispatchAndPersist(
    job: Job,
    queueName: string,
    jobData: JobData,
    workerId: number | undefined,
    timeoutMs: number,
  ) {
    const workerInfo = workerId ? ` [Worker #${workerId}]` : '';
    this.logger.debug(
      `[${queueName}]${workerInfo} Cache miss - dispatching job ${job.id} via NATS`,
    );

    const result = await Promise.race([
      this.dispatcher.dispatch(jobData, timeoutMs),
      this.createTimeoutPromise(timeoutMs),
    ]);

    this.cache
      .tryStoreInCache(jobData, result)
      .catch((cacheError: Error) => {
        this.logger.warn(
          `Cache store failed for job ${job.id}: ${cacheError.message}`,
        );
      });

    await this.saveJobResult(job, queueName, jobData, workerId, result, null);

    this.logger.log(
      `[${queueName}]${workerInfo} Job ${job.id} completed successfully`,
    );
    return result;
  }

  private getTimeoutMs(queueDef: QueueDefinition): number {
    return Math.max(1, (queueDef.timeout ?? 60) * 1000);
  }

  private createTimeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Job timeout after ${ms}ms`));
      }, ms);
    });
  }

  private async saveJobResult(
    job: Job,
    queueName: string,
    jobData: JobData,
    workerId: number | undefined,
    result: any,
    error: JobErrorInfo | null,
  ) {
    const record: JobResultRecord = {
      jobId: job.id!,
      queueName,
      method: jobData.method,
      url: jobData.rawUrl ?? jobData.url,
      status: error ? 'failed' : 'completed',
      success: !error,
      statusCode: error?.statusCode,
      responseBody: result,
      responseHeaders: undefined,
      executedAt: new Date(jobData.timestamp).toISOString(),
      requestBody: jobData.data,
      query: jobData.queryParams,
      cache: this.extractCacheMeta(result),
      error,
      attemptsMade: job.attemptsMade ?? 0,
      finishedAt: new Date().toISOString(),
      workerId,
      result,
    };

    try {
      const resultKey = `job:result:${job.id}`;
      const listKey = `job:history:${queueName}`;
      const payload = JSON.stringify(record);

      await this.redisService.set(resultKey, payload, this.resultTtlSeconds);
      await this.redisService.lpush(listKey, payload);

      if (this.resultHistoryLimit > 0) {
        await this.redisService.ltrim(listKey, 0, this.resultHistoryLimit - 1);
      }

      this.logger.debug(`Job result saved in Redis: ${resultKey}`);
    } catch (redisError: any) {
      this.logger.error(
        `Failed to persist job result in Redis for ${job.id}: ${redisError?.message ?? redisError}`,
      );
    }
  }

  private normalizeError(error: unknown): JobErrorInfo {
    if (error instanceof Error) {
      const type: JobErrorType = error.name === 'TimeoutError' ? 'timeout' : 'exception';
      const info: JobErrorInfo = {
        message: error.message,
        type,
        stack: error.stack,
      };

      const maybeStatus = (error as any)?.statusCode;
      if (typeof maybeStatus === 'number') {
        info.statusCode = maybeStatus;
      }

      const maybeData = (error as any)?.response?.data ?? (error as any)?.data;
      if (maybeData !== undefined) {
        info.data = maybeData;
      }

      return info;
    }

    if (typeof error === 'string') {
      return { message: error, type: 'unknown' };
    }

    if (error && typeof error === 'object') {
      return {
        message: JSON.stringify(error),
        type: 'unknown',
      };
    }

    return { message: 'Unknown error', type: 'unknown' };
  }

  private extractCacheMeta(result: any): CacheMetadata | null {
    if (!result || typeof result !== 'object') {
      return null;
    }

    const cache = (result as any)._cache;
    if (!cache || typeof cache !== 'object') {
      return null;
    }

    const hit = Boolean(cache.hit ?? cache.cached ?? false);
    const key = typeof cache.key === 'string' ? cache.key : undefined;
    let timestamp: string | undefined;

    if (typeof cache.timestamp === 'string') {
      timestamp = cache.timestamp;
    } else if (typeof cache.cachedAt === 'string') {
      timestamp = cache.cachedAt;
    }

    return {
      hit,
      key,
      timestamp,
    };
  }

  private resolveNumberFromEnv(
    key: string,
    defaultValue: number,
    minValue: number,
  ): number {
    const raw = process.env[key];

    if (!raw) {
      return defaultValue;
    }

    const parsed = parseInt(raw, 10);

    if (Number.isNaN(parsed) || parsed < minValue) {
      return defaultValue;
    }

    return parsed;
  }
}


