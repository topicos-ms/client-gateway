import { Injectable } from '@nestjs/common';
import { WorkerInfo } from '../factory/worker-factory.service';


@Injectable()
export class WorkerControlService {
  async pauseAll(workersMap: Map<string, WorkerInfo>): Promise<string[]> {
    const workers = Array.from(workersMap.values());
    const tasks = workers.map(async (wi) => {
      await wi.worker.pause();
      const worker = workersMap.get(wi.id);
      if (worker) worker.status = 'paused';
      return wi.id;
    });
    return Promise.all(tasks);
  }

  async resumeAll(workersMap: Map<string, WorkerInfo>): Promise<string[]> {
    const workers = Array.from(workersMap.values());
    const tasks = workers.map(async (wi) => {
      await wi.worker.resume();
      const worker = workersMap.get(wi.id);
      if (worker) worker.status = 'active';
      return wi.id;
    });
    return Promise.all(tasks);
  }
}


