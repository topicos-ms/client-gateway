import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WebSocketService } from './websocket.service';
import { JobStatusService } from './job-status.service';

@WSGateway({
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/jobs',
  transports: ['websocket', 'polling'],
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebSocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly webSocketService: WebSocketService,
    private readonly jobStatusService: JobStatusService,
  ) {}

  afterInit(server: Server) {
    this.webSocketService.setServer(server);
    this.logger.log('?? WebSocket Gateway initialized');

    // Configurar cleanup automatico cada 5 minutos
    setInterval(() => {
      this.webSocketService.cleanupInactiveClients();
      this.jobStatusService.cleanupOldJobs();
    }, 5 * 60 * 1000);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`?? Client connected: ${client.id}`);
    this.webSocketService.registerClient(client);

    // Enviar mensaje de bienvenida
    client.emit('welcome', {
      message: 'Connected to job status updates',
      clientId: client.id,
      timestamp: Date.now(),
      server: 'FASE-2 Queue System',
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`?? Client disconnected: ${client.id}`);
    this.webSocketService.unregisterClient(client.id, 'client-disconnect');
  }

  /**
   * Cliente solicita suscribirse a actualizaciones de un job
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const jobId = data?.jobId;

    if (!jobId) {
      client.emit('error', { message: 'Job ID is required' });
      return;
    }

    this.logger.debug(`?? Subscription request for job ${jobId} from client ${client.id}`);

    try {
      this.webSocketService.subscribeClientToJob(client, jobId);
    } catch (error: any) {
      const message =
        error?.message && typeof error.message === 'string'
          ? error.message
          : 'Failed to subscribe client to job';

      this.logger.warn(`Subscription error for client ${client.id}: ${message}`);
      client.emit('error', { message });
    }
  }

  /**
   * Cliente solicita desuscribirse de un job
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const jobId = data?.jobId;

    if (!jobId) {
      client.emit('error', { message: 'Job ID is required' });
      return;
    }

    this.logger.debug(`?? Unsubscription request for job ${jobId} from client ${client.id}`);

    try {
      this.webSocketService.unsubscribeClientFromJob(client, jobId);
    } catch (error: any) {
      const message =
        error?.message && typeof error.message === 'string'
          ? error.message
          : 'Failed to unsubscribe client from job';

      this.logger.warn(`Unsubscription error for client ${client.id}: ${message}`);
      client.emit('error', { message });
    }
  }

  /**
   * Cliente solicita el estado actual de un job
   */
  @SubscribeMessage('status')
  handleGetStatus(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const jobId = data?.jobId;

    if (!jobId) {
      client.emit('error', { message: 'Job ID is required' });
      return;
    }

    this.logger.debug(`?? Status request for job ${jobId} from client ${client.id}`);

    try {
      this.webSocketService.sendJobStatus(client, jobId);
    } catch (error: any) {
      const message =
        error?.message && typeof error.message === 'string'
          ? error.message
          : 'Failed to retrieve job status';

      this.logger.warn(`Status request error for client ${client.id}: ${message}`);
      client.emit('error', { message });
    }
  }

  /**
   * Cliente solicita estadisticas generales del sistema
   */
  @SubscribeMessage('stats')
  handleGetStats(@ConnectedSocket() client: Socket) {
    this.logger.debug(`?? Stats request from client ${client.id}`);

    try {
      this.webSocketService.sendStatistics(client);
    } catch (error: any) {
      const message =
        error?.message && typeof error.message === 'string'
          ? error.message
          : 'Failed to retrieve gateway statistics';

      this.logger.warn(`Statistics request error for client ${client.id}: ${message}`);
      client.emit('error', { message });
    }
  }

  /**
   * Ping para mantener conexion activa
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    this.webSocketService.respondToPing(client);
  }

  /**
   * Metodo para enviar actualizaciones desde otros servicios
   */
  notifyJobUpdate(jobId: string, status: any) {
    this.jobStatusService.updateJobStatus({
      jobId,
      ...status,
      timestamp: Date.now(),
    });
  }

  /**
   * Obtener estadisticas del gateway
   */
  getGatewayStats() {
    return {
      connectedClients: this.server?.engine?.clientsCount || 0,
      namespace: '/jobs',
      ...this.webSocketService.getConnectionStats(),
    };
  }
}