import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface ComponentHealth {
  status: 'UP' | 'DOWN';
  latencyMs?: number;
  details?: Record<string, any>;
  error?: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Liveness Probe (/api/v1/health/liveness)
   * Process ping check. Must NOT fail when PostgreSQL is temporarily unavailable.
   */
  checkLiveness() {
    return {
      status: 'UP',
      component: 'EDIMP API Core',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness Probe (/api/v1/health/readiness)
   * Deep dependency check evaluating PostgreSQL connectivity and configurable memory heap usage.
   * API-only instances remain healthy without requiring local worker registration.
   */
  async checkReadiness() {
    const timestamp = new Date().toISOString();
    const details: Record<string, ComponentHealth> = {};
    let overallStatus: 'UP' | 'DOWN' = 'UP';

    // 1. PostgreSQL Database Check
    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      details.database = {
        status: 'UP',
        latencyMs: Date.now() - dbStart,
        details: { provider: 'postgresql' },
      };
    } catch (err: any) {
      overallStatus = 'DOWN';
      details.database = {
        status: 'DOWN',
        latencyMs: Date.now() - dbStart,
        error: err.message,
      };
    }

    // 2. Configurable Node.js Memory Heap Threshold Check
    const memThresholdMb = parseInt(
      this.configService.get<string>('MEMORY_HEAP_THRESHOLD_MB') || '1024',
      10,
    );
    const memUsage = process.memoryUsage();
    const heapUsedMb = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMb = Math.round(memUsage.rss / 1024 / 1024);

    const isMemoryOk = heapUsedMb < memThresholdMb;
    if (!isMemoryOk) {
      overallStatus = 'DOWN';
    }

    details.memory = {
      status: isMemoryOk ? 'UP' : 'DOWN',
      details: { heapUsedMb, heapTotalMb, rssMb, thresholdLimitMb: memThresholdMb },
    };

    // 3. Optional Worker Cluster Monitoring (Non-blocking for API-only instances)
    try {
      const activeWorkers = await this.prisma.workerNode.count({
        where: {
          status: 'ACTIVE',
          lastHeartbeatAt: {
            gte: new Date(Date.now() - 60000),
          },
        },
      });

      details.workers = {
        status: 'UP',
        details: { activeWorkerCount: activeWorkers, mode: 'API_INDEPENDENT' },
      };
    } catch {
      details.workers = {
        status: 'UP',
        details: { activeWorkerCount: 0, mode: 'API_INDEPENDENT' },
      };
    }

    const result = {
      status: overallStatus,
      timestamp,
      components: details,
    };

    if (overallStatus === 'DOWN') {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}
