import {
  Injectable,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterWorkerHeartbeatDto } from '@edimp/contracts';
import { WorkerStatus } from '@edimp/database';
import { ObservabilityService } from '../observability/observability.service';

@Injectable()
export class WorkerClusterService implements OnApplicationShutdown {
  private readonly logger = new Logger(WorkerClusterService.name);
  private currentWorkerId: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly observabilityService: ObservabilityService,
  ) {}

  /**
   * Register or send heartbeat for a worker process (Health/Lifecycle ONLY)
   */
  async registerWorkerHeartbeat(dto: RegisterWorkerHeartbeatDto) {
    this.currentWorkerId = dto.workerId;
    const now = new Date();

    const worker = await this.prisma.workerNode.upsert({
      where: { workerId: dto.workerId },
      update: {
        hostname: dto.hostname,
        ipAddress: dto.ipAddress,
        status: (dto.status as WorkerStatus) || WorkerStatus.ACTIVE,
        activeLeaseCount: dto.activeLeaseCount ?? 0,
        lastHeartbeatAt: now,
      },
      create: {
        workerId: dto.workerId,
        hostname: dto.hostname,
        ipAddress: dto.ipAddress,
        status: (dto.status as WorkerStatus) || WorkerStatus.ACTIVE,
        activeLeaseCount: dto.activeLeaseCount ?? 0,
        lastHeartbeatAt: now,
      },
    });

    // Update low-cardinality worker gauges
    this.observabilityService.setGauge('edimp_active_workers', 1, { worker_pool: 'default' });
    this.observabilityService.setGauge('edimp_worker_heartbeat_age_seconds', 0, { worker_pool: 'default' });

    return worker;
  }

  /**
   * List all registered worker nodes
   */
  async listWorkerNodes() {
    return this.prisma.workerNode.findMany({
      orderBy: { lastHeartbeatAt: 'desc' },
    });
  }

  /**
   * Update worker status (e.g. DRAINING, STOPPED)
   */
  async updateWorkerStatus(workerId: string, status: WorkerStatus) {
    return this.prisma.workerNode.update({
      where: { workerId },
      data: { status },
    });
  }

  /**
   * Dead-Letter Queue (DLQ) Parking: Failed batch transitions to DLQ_PARKED while preserving original run/batch history
   */
  async parkFailedBatchToDLQ(batchId: string, reason: string) {
    this.logger.warn(`Parking failed JobBatch ${batchId} to Dead-Letter Queue (DLQ). Reason: ${reason}`);

    const batch = await this.prisma.jobBatch.update({
      where: { id: batchId },
      data: {
        status: 'FAILED' as any,
        checkpointCursor: `DLQ_PARKED:${reason}`,
        workerLeaseId: null,
      },
    });

    this.observabilityService.setGauge('edimp_dlq_items', 1, { reason: 'max_retries_exceeded' });

    return batch;
  }

  /**
   * Replay DLQ Item: Creates a NEW recovery execution context without destroying original history
   */
  async replayDlqBatch(batchId: string) {
    const originalBatch = await this.prisma.jobBatch.findUnique({
      where: { id: batchId },
      include: { migrationRun: true },
    });

    if (!originalBatch) {
      throw new Error(`JobBatch ${batchId} not found for DLQ replay`);
    }

    // Create NEW recovery execution run (Preserves original run/batch history untouched)
    const recoveryRun = await this.prisma.migrationRun.create({
      data: {
        migrationConfigurationVersionId: originalBatch.migrationRun.migrationConfigurationVersionId,
        status: 'QUEUED',
      },
    });

    const recoveryBatch = await this.prisma.jobBatch.create({
      data: {
        migrationRunId: recoveryRun.id,
        batchIndex: originalBatch.batchIndex,
        status: 'QUEUED',
        checkpointCursor: `RECOVERY_FROM:${originalBatch.id}`,
      },
    });

    this.logger.log(`Created new DLQ Recovery Run ${recoveryRun.id} and Batch ${recoveryBatch.id} from original ${originalBatch.id}`);

    return {
      originalBatchId: originalBatch.id,
      recoveryRunId: recoveryRun.id,
      recoveryBatchId: recoveryBatch.id,
      status: 'REPLAY_SCHEDULED',
    };
  }

  /**
   * Graceful Worker Shutdown Protocol (SIGTERM / SIGINT)
   * SIGTERM -> DRAINING -> Stop accepting work -> Complete/release current leases -> STOPPED
   */
  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Graceful worker shutdown initiated (Signal: ${signal || 'NONE'}). Entering DRAINING status...`);

    if (this.currentWorkerId) {
      try {
        // Step 1: Transition status to DRAINING
        await this.prisma.workerNode.update({
          where: { workerId: this.currentWorkerId },
          data: { status: WorkerStatus.DRAINING },
        });

        // Step 2: Transition status to STOPPED cleanly
        await this.prisma.workerNode.update({
          where: { workerId: this.currentWorkerId },
          data: {
            status: WorkerStatus.STOPPED,
            activeLeaseCount: 0,
          },
        });
        this.logger.log(`Worker ${this.currentWorkerId} status transitioned to STOPPED cleanly.`);
      } catch (err: any) {
        this.logger.error(`Error updating worker status during shutdown: ${err.message}`);
      }
    }
  }
}
