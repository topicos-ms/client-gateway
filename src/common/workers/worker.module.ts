import { Module, forwardRef } from '@nestjs/common';
import { DynamicWorkerService } from './dynamic-worker.service';
import { WorkerFactoryService } from './factory/worker-factory.service';
import { WorkerLifecycleService } from './lifecycle/worker-lifecycle.service';
import { WorkerControlService } from './control/worker-control.service';
import { JobProcessorService } from './processing/job-processor.service';
import { MessageDispatcherService } from './processing/message-dispatcher.service';
import { JobCacheService } from './cache/job-cache.service';
import { QueueModule } from '../queues/queue.module';
import { RedisModule } from '../redis/redis.module';
import { CacheModule } from '../cache/cache.module';
import { WebSocketModule } from '../websockets/websocket.module';
import { NatsModule } from '../../transports/nats.module';

@Module({
  imports: [
    forwardRef(() => QueueModule),
    RedisModule,
    CacheModule.forRoot(),
    forwardRef(() => WebSocketModule),
    NatsModule,
  ],
  providers: [
    DynamicWorkerService,
    WorkerFactoryService,
    WorkerLifecycleService,
    WorkerControlService,
    JobProcessorService,
    MessageDispatcherService,
    JobCacheService,
  ],
  exports: [
    DynamicWorkerService,
    WorkerFactoryService,
    WorkerLifecycleService,
    WorkerControlService,
    JobProcessorService,
    MessageDispatcherService,
    JobCacheService,
  ],
})
export class WorkerModule {}
