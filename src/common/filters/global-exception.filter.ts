import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any = {
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error interno del servidor',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      errorResponse = {
        success: false,
        error:
          typeof exceptionResponse === 'object'
            ? (exceptionResponse as any).error || 'HTTP_EXCEPTION'
            : 'HTTP_EXCEPTION',
        message: exception.message,
        details: exceptionResponse,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    } else if (exception instanceof Error) {
      this.logger.error(`Error interno: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`Error desconocido: ${exception}`);
    }

    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} Error: ${JSON.stringify(errorResponse)}`,
        exception instanceof Error ? exception.stack : 'No stack trace',
      );
    } else {
      this.logger.warn(
        `HTTP ${status} Client Error: ${JSON.stringify({
          path: request.url,
          method: request.method,
          error: errorResponse.error,
          message: errorResponse.message,
        })}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
