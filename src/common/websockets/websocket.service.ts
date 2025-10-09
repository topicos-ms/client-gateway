import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JobStatusService, JobStatusUpdate } from './job-status.service';

export interface WebSocketClient {
  socket: Socket;
  jobIds: Set<string>;
  connectedAt: number;
}

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private server: Server;
  private clients = new Map<string, WebSocketClient>();

  constructor(private readonly jobStatusService: JobStatusService) {
    // Escuchar actualizaciones de estado de jobs
    this.jobStatusService.on('job-status-update', (update: JobStatusUpdate) => {
      this.broadcastJobUpdate(update);
    });
  }

  /**
   * Establece la instancia del servidor WebSocket
   */
  setServer(server: Server): void {
    this.server = server;
    this.logger.log('🔌 WebSocket server configured');
  }

  /**
   * Registra un nuevo cliente WebSocket
   */
  registerClient(socket: Socket): void {
    const client: WebSocketClient = {
      socket,
      jobIds: new Set(),
      connectedAt: Date.now(),
    };

    this.clients.set(socket.id, client);
    this.logger.log(`👤 Client ${socket.id} connected`);

    // Configurar event listeners del cliente
    this.setupClientListeners(socket, client);
  }

  /**
   * Configura los event listeners para un cliente
   */
  private setupClientListeners(socket: Socket, client: WebSocketClient): void {
    // Cliente se suscribe a un job especifico
    socket.on('subscribe-job', (jobId: string) => {
      try {
        this.subscribeClientToJob(socket, jobId);
      } catch (error: any) {
        this.handleClientError(socket, error, 'subscribe-job');
      }
    });

    // Cliente se desuscribe de un job
    socket.on('unsubscribe-job', (jobId: string) => {
      try {
        this.unsubscribeClientFromJob(socket, jobId);
      } catch (error: any) {
        this.handleClientError(socket, error, 'unsubscribe-job');
      }
    });

    // Cliente solicita el estado actual de un job
    socket.on('get-job-status', (jobId: string) => {
      try {
        this.sendJobStatus(socket, jobId);
      } catch (error: any) {
        this.handleClientError(socket, error, 'get-job-status');
      }
    });

    // Cliente solicita estadisticas generales
    socket.on('get-statistics', () => {
      try {
        this.sendStatistics(socket);
      } catch (error: any) {
        this.handleClientError(socket, error, 'get-statistics');
      }
    });

    // Ping/Pong para mantener conexion
    socket.on('ping', () => {
      this.respondToPing(socket);
    });

    // Manejar desconexion
    socket.on('disconnect', (reason) => {
      this.unregisterClient(socket.id, reason);
    });
  }
  subscribeClientToJob(socket: Socket, jobId: string): void {
    const normalizedJobId =
      typeof jobId === 'string' ? jobId.trim() : '';

    if (!normalizedJobId) {
      throw new Error('Job ID is required');
    }

    const client = this.clients.get(socket.id);
    if (!client) {
      throw new Error('Client session not registered');
    }

    client.jobIds.add(normalizedJobId);
    this.logger.debug(`?? Client ${socket.id} subscribed to job ${normalizedJobId}`);

    const currentStatus = this.jobStatusService.getJobStatus(normalizedJobId);
    if (currentStatus) {
      socket.emit('job-update', currentStatus);
    }

    socket.emit('subscription-confirmed', { jobId: normalizedJobId });
  }

  unsubscribeClientFromJob(socket: Socket, jobId: string): void {
    const normalizedJobId =
      typeof jobId === 'string' ? jobId.trim() : '';

    if (!normalizedJobId) {
      throw new Error('Job ID is required');
    }

    const client = this.clients.get(socket.id);
    if (!client) {
      throw new Error('Client session not registered');
    }

    if (client.jobIds.delete(normalizedJobId)) {
      this.logger.debug(`?? Client ${socket.id} unsubscribed from job ${normalizedJobId}`);
    }

    socket.emit('unsubscription-confirmed', { jobId: normalizedJobId });
  }

  sendJobStatus(socket: Socket, jobId: string): void {
    const normalizedJobId =
      typeof jobId === 'string' ? jobId.trim() : '';

    if (!normalizedJobId) {
      throw new Error('Job ID is required');
    }

    const status = this.jobStatusService.getJobStatus(normalizedJobId);

    socket.emit('job-status-response', {
      jobId: normalizedJobId,
      status: status || null,
    });
  }

  sendStatistics(socket: Socket): void {
    const stats = {
      ...this.jobStatusService.getJobStatistics(),
      clients: this.clients.size,
      uptime: process.uptime(),
    };

    socket.emit('statistics-response', stats);
  }

  respondToPing(socket: Socket): void {
    socket.emit('pong', { timestamp: Date.now() });
  }

  private handleClientError(socket: Socket, error: any, context: string): void {
    const message = (
      error?.message && typeof error.message === 'string'
        ? error.message
        : 'Unexpected error while processing request'
    );

    this.logger.warn(
      `?? Client ${socket.id} ${context} handler failed: ${message}`
    );

    socket.emit('error', { message });
  }
  /**
   * Desregistra un cliente WebSocket
   */
  unregisterClient(socketId: string, reason?: string): void {
    const client = this.clients.get(socketId);
    if (client) {
      this.clients.delete(socketId);
      this.logger.log(
        `👋 Client ${socketId} disconnected (${reason || 'unknown reason'}) - was subscribed to ${client.jobIds.size} jobs`,
      );
    }
  }

  /**
   * Envía una actualización de job a todos los clientes suscritos
   */
  private broadcastJobUpdate(update: JobStatusUpdate): void {
    let sentCount = 0;

    const clients = Array.from(this.clients.entries());
    for (const [socketId, client] of clients) {
      if (client.jobIds.has(update.jobId)) {
        try {
          client.socket.emit('job-update', update);
          sentCount++;
        } catch (error) {
          this.logger.warn(
            `❌ Failed to send update to client ${socketId}: ${error.message}`,
          );
          // Cliente probablemente desconectado, limpiarlo
          this.unregisterClient(socketId, 'send-error');
        }
      }
    }

    if (sentCount > 0) {
      this.logger.debug(
        `📡 Job ${update.jobId} update sent to ${sentCount} clients`,
      );
    }
  }

  /**
   * Envía un mensaje a todos los clientes conectados
   */
  broadcastToAll(event: string, data: any): void {
    if (!this.server) {
      this.logger.warn('❌ Cannot broadcast: WebSocket server not initialized');
      return;
    }

    this.server.emit(event, data);
    this.logger.debug(`📡 Broadcasted ${event} to all clients`);
  }

  /**
   * Obtiene estadísticas de conexiones WebSocket
   */
  getConnectionStats(): {
    totalClients: number;
    clientDetails: Array<{
      socketId: string;
      subscribedJobs: number;
      connectedFor: number;
    }>;
    averageSubscriptions: number;
  } {
    const clientDetails = Array.from(this.clients.entries()).map(
      ([socketId, client]) => ({
        socketId,
        subscribedJobs: client.jobIds.size,
        connectedFor: Date.now() - client.connectedAt,
      }),
    );

    const totalSubscriptions = clientDetails.reduce(
      (sum, client) => sum + client.subscribedJobs,
      0,
    );

    return {
      totalClients: this.clients.size,
      clientDetails,
      averageSubscriptions: this.clients.size > 0 ? totalSubscriptions / this.clients.size : 0,
    };
  }

  /**
   * Limpia clientes inactivos (más de 5 minutos sin actividad)
   */
  cleanupInactiveClients(): void {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    let cleaned = 0;

    const clients = Array.from(this.clients.entries());
    for (const [socketId, client] of clients) {
      if (client.connectedAt < fiveMinutesAgo) {
        try {
          client.socket.disconnect(true);
        } catch (error) {
          // Socket ya desconectado
        }
        this.unregisterClient(socketId, 'inactive-cleanup');
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`🧹 Cleaned up ${cleaned} inactive WebSocket clients`);
    }
  }
}