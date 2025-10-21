import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DynamicQueueService } from '../queues/dynamic-queue.service';
import { WorkerFactoryService, WorkerInfo } from './factory/worker-factory.service';
import { WorkerLifecycleService } from './lifecycle/worker-lifecycle.service';
import { WorkerControlService } from './control/worker-control.service';
import { JobCacheService } from './cache/job-cache.service';

export { WorkerInfo } from './factory/worker-factory.service';

@Injectable()
export class DynamicWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DynamicWorkerService.name);
  private readonly workers: Map<string, WorkerInfo> = new Map();
  private isShuttingDown = false;

  constructor(
    private readonly queueService: DynamicQueueService,
    private readonly workerFactory: WorkerFactoryService,
    private readonly lifecycle: WorkerLifecycleService,
    private readonly control: WorkerControlService,
    private readonly cacheService: JobCacheService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Dynamic Worker Service...');
    try {
      const created = await this.lifecycle.initialize(this.workers);
      this.logger.log(`Dynamic Worker Service initialized with ${created} workers`);
    } catch (err: any) {
      this.logger.error(`Failed to initialize workers: ${err?.message || err}`);
    }
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down Dynamic Worker Service...');
    this.isShuttingDown = true;
    await this.lifecycle.shutdownAll(this.workers);
    this.logger.log('All workers shut down gracefully');
  }

  // ===== Helpers =====
  private getAllWorkers(): WorkerInfo[] {
    return Array.from(this.workers.values());
  }

  private getWorkersByQueue(queueName: string): WorkerInfo[] {
    return this.getAllWorkers().filter((w) => w.queueName === queueName);
  }

  private ensureNotShuttingDown(): void {
    if (this.isShuttingDown) throw new Error('Workers are shutting down');
  }

  // ===== Public API =====
  async addWorkerForQueue(queueName: string): Promise<void> {
    this.ensureNotShuttingDown();
    const queueDef = this.queueService.getQueueDefinition(queueName);
    if (!queueDef) throw new Error(`Queue '${queueName}' not found`);
    if (!queueDef.enabled) throw new Error(`Queue '${queueName}' is disabled`);

    const strategy = this.workerFactory.getWorkerStrategy();
    const existing = this.getWorkersByQueue(queueName).length;
    const wi = await this.workerFactory.createWorker(queueDef, existing + 1, strategy);
    this.workers.set(wi.id, wi);
  }

  async removeWorkerForQueue(queueName: string): Promise<void> {
    const queueWorkers = this.getWorkersByQueue(queueName);
    if (queueWorkers.length === 0) throw new Error(`No workers found for queue '${queueName}'`);
    const workerToRemove = queueWorkers[queueWorkers.length - 1];
    await this.workerFactory.shutdownWorker(workerToRemove);
    this.workers.delete(workerToRemove.id);
  }

  async reloadWorkers(): Promise<void> {
    await this.lifecycle.shutdownAll(this.workers);
    await this.lifecycle.initialize(this.workers);
  }

  async getWorkerStats() {
    const workers = this.getAllWorkers();
    const active = workers.filter((w) => w.status === 'active').length;
    const mem = process.memoryUsage();
    const heapUsedMB = Number((mem.heapUsed / 1024 / 1024).toFixed(1));
    const heapTotalMB = Number((mem.heapTotal / 1024 / 1024).toFixed(1));
    const usagePercent = Number(
      ((mem.heapUsed / Math.max(mem.heapTotal, 1)) * 100).toFixed(1),
    );

    return {
      workers: {
        total: workers.length,
        active,
        details: workers.map((w) => ({
          id: w.id,
          queueName: w.queueName,
          status: w.status,
          concurrency: w.concurrency,
        })),
      },
      memory: { heapUsedMB, heapTotalMB, usagePercent },
      uptime: process.uptime(),
      jobs: { total: 0 },
      timestamp: new Date().toISOString(),
    };
  }

  async ensureWorkersForQueue(queueName: string): Promise<{ queueName: string; desired: number; final: number }>{
    this.ensureNotShuttingDown();
    const queueDef = this.queueService.getQueueDefinition(queueName);
    if (!queueDef) throw new Error(`Queue '${queueName}' not found`);
    if (!queueDef.enabled) return { queueName, desired: 0, final: 0 };

    const desired = Math.max(0, this.workerFactory.getWorkerCountForQueue(queueDef));
    const existing = this.getWorkersByQueue(queueName).length;
    if (existing < desired) {
      for (let i = 0; i < desired - existing; i++) await this.addWorkerForQueue(queueName);
    } else if (existing > desired) {
      for (let i = 0; i < existing - desired; i++) await this.removeWorkerForQueue(queueName);
    }
    const final = this.getWorkersByQueue(queueName).length;
    return { queueName, desired, final };
  }

  async removeAllWorkersForQueue(queueName: string): Promise<number> {
    let removed = 0;
    while (true) {
      const qWorkers = this.getWorkersByQueue(queueName);
      if (qWorkers.length === 0) break;
      await this.removeWorkerForQueue(queueName);
      removed++;
    }
    return removed;
  }

  async getCacheStats() { return await this.cacheService.getStats(); }
  async clearCache(): Promise<void> { await this.cacheService.clear(); }

  // Control
  async pauseAllWorkers(): Promise<{ success: boolean; details: any }> {
    const ids = await this.control.pauseAll(this.workers);
    return { success: true, details: { pausedWorkers: ids.length, workerIds: ids, message: 'All workers paused', timestamp: new Date().toISOString() } };
  }

  async resumeAllWorkers(): Promise<{ success: boolean; details: any }> {
    const ids = await this.control.resumeAll(this.workers);
    return { success: true, details: { resumedWorkers: ids.length, workerIds: ids, message: 'All workers resumed', timestamp: new Date().toISOString() } };
  }

  async pauseWorkersByQueue(queueName: string): Promise<{ success: boolean; details: any }> {
    const qWorkers = this.getWorkersByQueue(queueName);
    if (qWorkers.length === 0) throw new Error(`No workers found for queue '${queueName}'`);
    for (const wi of qWorkers) { await wi.worker.pause(); const w = this.workers.get(wi.id); if (w) w.status = 'paused'; }
    return { success: true, details: { queueName, pausedWorkers: qWorkers.length, workerIds: qWorkers.map(w=>w.id), timestamp: new Date().toISOString() } };
  }

  async resumeWorkersByQueue(queueName: string): Promise<{ success: boolean; details: any }> {
    const qWorkers = this.getWorkersByQueue(queueName);
    if (qWorkers.length === 0) throw new Error(`No workers found for queue '${queueName}'`);
    for (const wi of qWorkers) { await wi.worker.resume(); const w = this.workers.get(wi.id); if (w) w.status = 'active'; }
    return { success: true, details: { queueName, resumedWorkers: qWorkers.length, workerIds: qWorkers.map(w=>w.id), timestamp: new Date().toISOString() } };
  }

  async getWorkersStatus(): Promise<{ global: string; byQueue: Record<string, { active: number; paused: number; total: number }> }> {
    const workers = this.getAllWorkers();
    const byQueue: Record<string, { active: number; paused: number; total: number }> = {};
    let totalActive = 0; let totalPaused = 0;
    for (const w of workers) {
      byQueue[w.queueName] = byQueue[w.queueName] || { active: 0, paused: 0, total: 0 };
      byQueue[w.queueName].total++;
      if (w.status === 'active') { byQueue[w.queueName].active++; totalActive++; }
      if (w.status === 'paused') { byQueue[w.queueName].paused++; totalPaused++; }
    }
    const global = workers.length === 0 ? 'all-paused' : totalPaused === workers.length ? 'all-paused' : totalActive === workers.length ? 'all-active' : 'mixed';
    return { global, byQueue };
  }
}

