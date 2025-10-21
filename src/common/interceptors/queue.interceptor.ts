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
import { QueueDefinition } from '../queues/queue-config.interface';

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
    context: ExecutionContext, // Contexto Nest de la petición
    next: CallHandler, // Siguiente manejador si no encolamos
  ): Promise<Observable<any>> {
    const httpContext = context.switchToHttp(); // Cambia a contexto HTTP
    const request = httpContext.getRequest<Request>(); // Obtiene Request de Express
    const response = httpContext.getResponse<Response>(); // Obtiene Response de Express

    const { method, url } = request; // Método y URL originales
    const path = request.path ?? url; // Path normalizado (sin querystring)

    if (!this.queueConfig.isQueueEnabled()) {
      return next.handle(); // Si colas deshabilitadas, procesa directo
    }

    // All requests pass through the queue system. No internal bypass.

    if (this.shouldExcludeFromQueue(path)) {
      this.logger.debug(`Excluded from queue: ${method} ${path}`); // Ruta excluida
      return next.handle(); // Procesa directo
    }

    try {
      const jobId = this.generateJobId(); // ID único del job
      const jobData = this.buildJobData(request, method, url, jobId); // Construye JobData

      const routeResolution = this.routingService.resolve(jobData); // Resuelve patrón NATS y payload
      if (!routeResolution) {
        this.logger.warn(
          `No async routing configured for ${method} ${path}, processing synchronously`, // Sin regla → directo
        );
        return next.handle();
      }

      jobData.message = routeResolution.message; // Asigna patrón
      jobData.payload = routeResolution.payload; // Asigna payload

      const queueName = await this.queueService.determineQueueForUrl(jobData.url); // Elige cola
      const queueDef = this.queueService.getQueueDefinition(queueName); // Lee definición de la cola

      if (!this.queueService.isQueueAvailable(queueName)) {
        this.logger.warn(`Queue '${queueName}' not available, falling back to processing`); // Cola no disponible
        return next.handle();
      }

      await this.queueService.addJobToQueue(queueName, jobData, {
        priority: queueDef?.priority, // Prioridad
        timeout: queueDef ? queueDef.timeout * 1000 : 60000, // Timeout ms
      });

      this.logger.log(
        `Job ${jobId} queued in '${queueName}' queue for ${method} ${request.originalUrl ?? url}`, // Log encolado
      );

      this.jobStatusService.markJobQueued(jobId, queueName); // Marca estado 'queued'

      response.status(202); // 202 Accepted
      return of(this.buildQueueResponse(jobId, queueName, queueDef)); // Devuelve metadata del job
    } catch (error) {
      this.logger.error(
        `Error intercepting request ${method} ${url}:`, // Log de error
        error,
      );
      return next.handle(); // No bloquea: procesa directo
    }
  }

  private buildJobData(request: Request, method: string, url: string, jobId: string): JobData {
    const queryParams = Object.keys(request.query).length > 0 ? request.query : undefined;
    const routeParams = Object.keys(request.params || {}).length > 0 ? request.params : undefined;
    const headers = this.normalizeHeaders(request.headers);
    const userId = this.extractUserId(request.headers);
    const context = this.extractRequestContext(request);

    return {
      id: jobId,
      method,
      url: request.path ?? url,
      rawUrl: request.originalUrl ?? url,
      data: this.extractRequestData(method, request.body),
      queryParams,
      params: routeParams,
      headers,
      userId,
      timestamp: Date.now(),
      context,
    };
  }

  private buildQueueResponse(jobId: string, queueName: string, queueDef?: QueueDefinition): QueueResponse {
    return {
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

  private extractRequestData(method: string, body: any): any {
    const writeMethods = method ? method.toUpperCase() : '';
    return writeMethods === 'POST' || writeMethods === 'PUT' || writeMethods === 'PATCH'
      ? (body ?? {})
      : undefined;
  }
}
