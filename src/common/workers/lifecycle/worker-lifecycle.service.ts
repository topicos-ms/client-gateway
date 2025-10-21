import { Injectable, Logger } from '@nestjs/common';
import { QueueDefinition } from '../../queues/queue-config.interface';
import { DynamicQueueService } from '../../queues/dynamic-queue.service';
import { WorkerFactoryService, WorkerInfo } from '../factory/worker-factory.service';


@Injectable()
export class WorkerLifecycleService {
  constructor(
    private readonly queueService: DynamicQueueService,
    private readonly workerFactory: WorkerFactoryService,
  ) {}

  async initialize(workers: Map<string, WorkerInfo>): Promise<number> {
    const config = this.queueService.getQueueConfig();
    let created = 0;
    for (const queueDef of config.queues) {
      if (!queueDef.enabled) {
        continue;
      }
      created += await this.createWorkersForQueue(workers, queueDef);
    }
    return created;
  }

  async shutdownAll(workers: Map<string, WorkerInfo>): Promise<void> {
    const shutdowns = Array.from(workers.values()).map((wi) => wi.worker.close());
    await Promise.all(shutdowns);
    workers.clear();
  }

  private async createWorkersForQueue(
    workers: Map<string, WorkerInfo>,
    queueDef: QueueDefinition,
  ): Promise<number> {
    const workerCount = this.workerFactory.getWorkerCountForQueue(queueDef);
    const strategy = this.workerFactory.getWorkerStrategy();
    let created = 0;
    for (let i = 0; i < workerCount; i++) {
      const wi = await this.workerFactory.createWorker(queueDef, i + 1, strategy);
      workers.set(wi.id, wi);
      this.setupWorkerStatusHandlers(workers, wi);
      created++;
    }
    return created;
  }

  private setupWorkerStatusHandlers(workers: Map<string, WorkerInfo>, workerInfo: WorkerInfo): void {
    const { worker, id } = workerInfo;
    worker.on('paused', () => {
      const wi = workers.get(id); if (wi) wi.status = 'paused';
    });
    worker.on('resumed', () => {
      const wi = workers.get(id); if (wi) wi.status = 'active';
    });
    worker.on('closed', () => {
      const wi = workers.get(id); if (wi) wi.status = 'stopped';
    });
  }
}




