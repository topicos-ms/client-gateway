import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { Request, Response } from 'express';
import { DynamicQueueService } from '../queues/dynamic-queue.service';
import { QueueConfigService } from './queue-config.service';
import { JobStatusService } from '../websockets/job-status.service';
import { JobData, QueueResponse } from './interfaces/job-data.interface';
import { RequestRoutingService } from '../messaging/request-routing.service';

@Injectable()
export class QueueInterceptor implements NestInterceptor {
  private readonly logger = new Logger(QueueInterceptor.name);

  constructor(
    private readonly queueService: DynamicQueueService,
    private readonly queueConfig: QueueConfigService,
    private readonly jobStatusService: JobStatusService,
    private readonly routingService: RequestRoutingService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const { method, url } = request;

    if (!this.queueConfig.isQueueEnabled()) {
      return next.handle();
    }

    if (request.headers['x-internal-request'] === 'true') {
      this.logger.debug(`Internal worker request bypassed: ${method} ${url}`);
      return next.handle();
    }

    if (this.shouldExcludeFromQueue(request.path ?? url)) {
      this.logger.debug(`Excluded from queue: ${method} ${url}`);
      return next.handle();
    }

    try {
      const jobId = this.generateJobId();
      const jobData: JobData = {
        id: jobId,
        method,
        url: request.path ?? url,
        rawUrl: request.originalUrl ?? url,
        data: this.extractRequestData(method, request.body, request.query),
        queryParams: Object.keys(request.query).length > 0 ? request.query : undefined,
        params: Object.keys(request.params || {}).length > 0 ? request.params : undefined,
        headers: this.normalizeHeaders(request.headers),
        userId: this.extractUserId(request.headers),
        timestamp: Date.now(),
        clientIp: this.extractClientIp(request),
        context: this.extractRequestContext(request),
      };

      if (jobData.context && Object.keys(jobData.context).length === 0) {
        delete jobData.context;
      }

      const routeResolution = this.routingService.resolve(jobData);
      if (!routeResolution) {
        this.logger.warn(
          `No async routing configured for ${method} ${request.path ?? url}, processing synchronously`,
        );
        return next.handle();
      }

      jobData.message = routeResolution.message;
      jobData.payload = routeResolution.payload;

      const queueName = await this.queueService.determineQueueForUrl(jobData.url);
      const queueDef = this.queueService.getQueueDefinition(queueName);

      if (!this.queueService.isQueueAvailable(queueName)) {
        this.logger.warn(`Queue '${queueName}' not available, falling back to processing`);
        return next.handle();
      }

      await this.queueService.addJobToQueue(queueName, jobData, {
        priority: queueDef?.priority,
        timeout: queueDef ? queueDef.timeout * 1000 : 60000,
      });

      this.logger.log(
        `Job ${jobId} queued in '${queueName}' queue for ${method} ${request.originalUrl ?? url}`,
      );

      this.jobStatusService.markJobQueued(jobId, queueName);

      const queueResponse: QueueResponse = {
        jobId,
        status: 'queued',
        estimatedTime: queueDef?.estimatedTime || 'Unknown',
        checkStatusUrl: `/queues/job/${jobId}/status`,
        queueType: queueName as any,
        timestamp: new Date().toISOString(),
        metadata: {
          timeout: queueDef?.timeout || 60,
          priority: queueDef?.priority || 1,
          retryCount: 0,
        },
      };

      response.status(202);
      return of(queueResponse);
    } catch (error) {
      this.logger.error(
        `Error intercepting request ${method} ${url}:`,
        error,
      );
      return next.handle();
    }
  }

  private shouldExcludeFromQueue(url: string): boolean {
    return this.queueConfig.shouldExcludeFromQueue(url);
  }

  private generateJobId(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${random}`;
  }

  private extractUserId(headers: any): string | undefined {
    try {
      const authHeader = headers.authorization ?? headers.Authorization;
      if (!authHeader?.toString().startsWith('Bearer ')) return undefined;

      const token = authHeader.toString().substring(7);
      const parts = token.split('.');
      if (parts.length < 2) return undefined;
      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);
      return payload.sub || payload.userId || payload.id;
    } catch {
      return undefined;
    }
  }

  private extractClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.toString().split(',')[0] ||
      request.headers['x-real-ip']?.toString() ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  private normalizeHeaders(headers: Request['headers']): Record<string, string> {
    const normalized: Record<string, string> = {};
    Object.entries(headers || {}).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      if (Array.isArray(value)) {
        normalized[key.toLowerCase()] = value.join(', ');
      } else {
        normalized[key.toLowerCase()] = value.toString();
      }
    });
    return normalized;
  }

  private extractRequestContext(request: Request): Record<string, any> | undefined {
    const context: Record<string, any> = {};
    const authValidation = (request as any)['authValidation'];
    if (authValidation) {
      context.authValidation = authValidation;
    }
    return Object.keys(context).length > 0 ? context : undefined;
  }

  private extractRequestData(method: string, body: any, queryParams: any): any {
    switch (method.toUpperCase()) {
      case 'GET':
      case 'DELETE':
        return undefined;
      case 'POST':
      case 'PUT':
      case 'PATCH':
        return body ?? {};
      default:
        return body ?? {};
    }
  }
}
