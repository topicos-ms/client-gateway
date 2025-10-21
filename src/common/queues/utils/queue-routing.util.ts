import { Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QueueDefinition, QueueSystemConfig } from '../queue-config.interface';

export class QueueRouter {
  constructor(
    private readonly config: QueueSystemConfig,
    private readonly queues: Map<string, Queue>,
    private readonly logger: Logger,
  ) {}

  async determineQueueForUrl(url: string): Promise<string> {
    const matching: { def: QueueDefinition; load: number }[] = [];

    for (const queueDef of this.config.queues) {
      if (!queueDef.enabled) continue;
      const matches = queueDef.urlPatterns?.some((p) => this.matches(url, p));
      if (!matches) continue;
      const q = this.queues.get(queueDef.name);
      if (!q) {
        this.logger.warn(`Queue '${queueDef.name}' matches URL '${url}' but is not initialized`);
        continue;
      }
      const load = await this.getLoad(queueDef.name, q);
      matching.push({ def: queueDef, load });
    }

    if (matching.length) {
      let selected = matching[0];
      for (let i = 1; i < matching.length; i++) {
        const cand = matching[i];
        if (cand.load < selected.load) {
          selected = cand;
          continue;
        }
        if (cand.load === selected.load) {
          if ((cand.def.priority ?? 0) > (selected.def.priority ?? 0)) {
            selected = cand;
          }
        }
      }
      this.logger.debug(`URL '${url}' routed to queue '${selected.def.name}' (load: ${selected.load})`);
      return selected.def.name;
    }

    this.logger.debug(`URL '${url}' no pattern match -> default queue '${this.config.defaultQueue}'`);
    return this.config.defaultQueue;
  }

  private matches(url: string, pattern: string) {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return url.startsWith(prefix);
    }
    return url === pattern;
  }

  private async getLoad(queueName: string, queue: Queue): Promise<number> {
    try {
      const counts = await queue.getJobCounts('waiting', 'active', 'delayed', 'paused');
      return (
        (counts.waiting ?? 0) +
        (counts.active ?? 0) +
        (counts.delayed ?? 0) +
        (counts.paused ?? 0)
      );
    } catch (error: any) {
      this.logger.warn(`Failed to read load for queue '${queueName}': ${error?.message || error}`);
      return Number.MAX_SAFE_INTEGER;
    }
  }
}

