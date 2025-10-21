import { Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../../redis/redis.service';
import { JobResultRecord } from '../../workers/interfaces/job-result.interface';

export class JobHistoryRepository {
  constructor(
    private readonly redis: RedisService,
    private readonly queues: Map<string, Queue>,
    private readonly logger: Logger,
    private readonly historyLimit: number,
  ) {}

  async getJobStatus(jobId: string) {
    for (const [queueName, queue] of this.queues) {
      const job = await queue.getJob(jobId);
      if (!job) continue;
      const state = await job.getState();

      let result: any = null;
      let error: any = null;

      if (state === 'completed' || state === 'failed') {
        try {
          const resultKey = `job:result:${jobId}`;
          const resultData = await this.redis.get(resultKey);
          if (resultData) {
            const parsed = JSON.parse(resultData);
            result = parsed.result;
            error = parsed.error;
          }
        } catch (err: any) {
          this.logger.error(`Error fetching job result from Redis: ${err.message}`);
        }
      }

      return {
        id: job.id,
        queueName,
        status: state,
        progress: job.progress,
        data: job.data,
        result,
        error,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      };
    }
    return null;
  }

  async getCompletedJobResults(limit = 50, queueName?: string) {
    return this.fetchJobHistory('jobs:history:completed', limit, queueName);
  }

  async getFailedJobResults(limit = 50, queueName?: string) {
    return this.fetchJobHistory('jobs:history:failed', limit, queueName);
  }

  private async fetchJobHistory(
    listKey: string,
    limit: number,
    queueName?: string,
  ): Promise<JobResultRecord[]> {
    const requested = Number.isFinite(limit) ? limit : this.historyLimit;
    const finalLimit = Math.max(1, Math.min(Math.trunc(requested), this.historyLimit));
    try {
      const rawEntries = await this.redis.lrange(listKey, 0, finalLimit - 1);
      const records = rawEntries
        .map((entry) => this.parseJobHistoryEntry(entry))
        .filter((record): record is JobResultRecord => !!record && (!queueName || record.queueName === queueName));
      return records;
    } catch (error: any) {
      this.logger.error(`Failed to fetch job history from ${listKey}: ${error?.message || error}`);
      return [];
    }
  }

  private parseJobHistoryEntry(entry: string): JobResultRecord | null {
    if (!entry) return null;
    try {
      const parsed = JSON.parse(entry) as JobResultRecord;
      if (!parsed.finishedAt) parsed.finishedAt = new Date().toISOString();
      return parsed;
    } catch (error: any) {
      this.logger.warn(`Could not parse job history entry: ${error?.message || error}`);
      return null;
    }
  }
}

