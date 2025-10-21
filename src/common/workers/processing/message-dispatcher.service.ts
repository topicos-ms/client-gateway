import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, TimeoutError } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { NATS_SERVICE } from '../../../config';
import { JobData } from '../../interceptors/interfaces/job-data.interface';

const INTERNAL_ECHO_PATTERN = 'queue.test';

@Injectable()
export class MessageDispatcherService {
  private readonly logger = new Logger(MessageDispatcherService.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async dispatch(job: JobData, timeoutMs: number): Promise<any> {
    if (!job.message) {
      this.logger.warn(`Job ${job.id} missing message metadata - returning payload directly`);
      return job.payload ?? job.data ?? {};
    }

    const payload = job.payload ?? job.data ?? {};
    const pattern = job.message.pattern;

    if (pattern === INTERNAL_ECHO_PATTERN) {
      this.logger.debug(`Job ${job.id} uses internal echo pattern`);
      return {
        success: true,
        echo: payload,
        jobId: job.id,
        processedAt: new Date().toISOString(),
      };
    }

    this.logger.debug(
      `Dispatching job ${job.id} using pattern '${pattern}' (timeout: ${timeoutMs}ms)`,
    );

    try {
      const result = await firstValueFrom(
        this.client.send(pattern, payload).pipe(timeout({ each: timeoutMs })),
      );

      this.logger.log(`Job ${job.id} completed via '${pattern}'`);
      return result;
    } catch (error: any) {
      if (error instanceof TimeoutError) {
        throw new Error(`Dispatch timeout after ${timeoutMs}ms for pattern '${pattern}'`);
      }
      throw error;
    }
  }
}


