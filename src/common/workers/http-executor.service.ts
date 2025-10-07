import { Injectable, Logger } from '@nestjs/common';
import { JobData } from '../interceptors/interfaces/job-data.interface';

@Injectable()
export class HttpExecutorService {
  private readonly logger = new Logger(HttpExecutorService.name);
  private readonly baseUrl: string;

  constructor() {
    // URL base del propio servidor (interno)
    this.baseUrl = process.env.INTERNAL_BASE_URL || 'http://localhost:3000';
  }

  async executeRequest(jobData: JobData): Promise<any> {
    const url = `${this.baseUrl}${jobData.url}`;
    const method = jobData.method.toUpperCase();

    this.logger.debug(`🌐 Executing real HTTP request: ${method} ${url}`);

    try {
      // Preparar headers
      const headers: Record<string, string> = {
        'User-Agent': 'Internal-Queue-Worker',
        'X-Internal-Request': 'true', // Marca para identificar peticiones internas
      };

      const forwardedHeaders = jobData.headers ?? {};

      if (forwardedHeaders['content-type']) {
        headers['Content-Type'] = forwardedHeaders['content-type'];
      } else {
        headers['Content-Type'] = 'application/json';
      }

      if (forwardedHeaders.authorization) {
        headers['Authorization'] = forwardedHeaders.authorization;
      }

      if (forwardedHeaders['user-agent']) {
        headers['X-Original-User-Agent'] = forwardedHeaders['user-agent'];
      }

      if (jobData.clientIp) {
        headers['X-Forwarded-For'] = jobData.clientIp;
      }

      headers['X-Job-Id'] = jobData.id;

      // Preparar opciones de fetch
      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(30000), // 30 segundos timeout
      };

      // Agregar body para métodos que lo permiten
      if (['POST', 'PUT', 'PATCH'].includes(method) && jobData.data) {
        fetchOptions.body = JSON.stringify(jobData.data);
      }

      // Agregar query params para GET/DELETE
      let fullUrl = url;
      if (jobData.queryParams && Object.keys(jobData.queryParams).length > 0) {
        const queryString = new URLSearchParams(jobData.queryParams).toString();
        fullUrl = `${url}?${queryString}`;
      }

      const response = await fetch(fullUrl, fetchOptions);
      
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      this.logger.log(`✅ HTTP request completed: ${method} ${url} -> ${response.status}`);
      
      return {
        success: response.ok,
        statusCode: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
        executedAt: new Date().toISOString(),
      };

    } catch (error) {
      this.logger.error(`❌ HTTP request failed: ${method} ${url}`, error.message);
      
      // Error de red o timeout
      throw new Error(`HTTP execution failed: ${error.message}`);
    }
  }

  /**
   * Verifica si una petición debería ejecutarse realmente o solo simularse
   */
  shouldExecuteReal(jobData: JobData): boolean {
    // Por seguridad, solo ejecutar endpoints conocidos y seguros
    const safeEndpoints = [
      '/auth/register',
      '/auth/login',
      '/auth/users',
      '/courses',
      '/programs',
      '/enrollments',
      '/schedules',
      // Agregar más endpoints según necesidad
    ];

    return safeEndpoints.some(endpoint => jobData.url.includes(endpoint));
  }

  /**
   * Lista de endpoints que nunca deben ejecutarse realmente (solo simular)
   */
  private isRestrictedEndpoint(url: string): boolean {
    const restrictedPatterns = [
      '/admin/', // Endpoints administrativos
      '/queue-admin/', // Control de colas
      '/health', // Health checks
      '/metrics', // Métricas
    ];

    return restrictedPatterns.some(pattern => url.includes(pattern));
  }
}