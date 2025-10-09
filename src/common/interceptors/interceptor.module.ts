import { Module } from '@nestjs/common';
import { QueueInterceptor } from './queue.interceptor';
import { QueueConfigService } from './queue-config.service';
import { QueueControlController } from './queue-control.controller';
import { QueueModule } from '../queues/queue.module';
import { WebSocketModule } from '../websockets/websocket.module';
import { RequestRoutingService } from '../messaging/request-routing.service';

@Module({
  imports: [QueueModule, WebSocketModule],
  controllers: [QueueControlController],
  providers: [QueueInterceptor, QueueConfigService, RequestRoutingService],
  exports: [QueueInterceptor, QueueConfigService, RequestRoutingService],
})
export class InterceptorModule {}
