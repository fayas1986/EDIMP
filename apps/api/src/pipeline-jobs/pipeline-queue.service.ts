import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransformationEngineService } from '../transformations/transformation-engine.service';
import { ValidationEngineService } from '../validations/validation-engine.service';

export interface QueueJobRunPayload {
  runId: string;
  jobId: string;
  records: Record<string, any>[];
  lookupTables?: Record<string, Record<string, any>>;
}

@Injectable()
export class PipelineQueueService {
  private readonly logger = new Logger(PipelineQueueService.name);

  constructor(
    private prisma: PrismaService,
    private transformationEngine: TransformationEngineService,
    private validationEngine: ValidationEngineService,
  ) {}

  enqueueRun(payload: QueueJobRunPayload): void {
    setImmediate(() => {
      this.processRun(payload).catch((err) => {
        this.logger.error(`Error processing background pipeline run ${payload.runId}: ${err.message}`, err.stack);
      });
    });
  }

  private async processRun(payload: QueueJobRunPayload): Promise<void> {
    const { runId, jobId, records = [], lookupTables = {} } = payload;

    // 1. Update status to RUNNING
    await this.prisma.pipelineExecutionRun.update({
      where: { id: runId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    await this.prisma.pipelineExecutionLog.create({
      data: {
        pipelineExecutionRunId: runId,
        level: 'INFO',
        message: `Pipeline execution run ${runId} started for job ${jobId}`,
      },
    });

    try {
      // 2. Load PipelineJob and exact published version snapshots
      const job = await this.prisma.pipelineJob.findUnique({
        where: { id: jobId },
        include: {
          transformationVersion: {
            include: { fieldTransformations: true },
          },
          validationVersion: {
            include: { rules: true },
          },
        },
      });

      if (!job) {
        throw new Error(`PipelineJob ${jobId} not found`);
      }

      let recordsProcessed = BigInt(0);
      let recordsTransformed = BigInt(0);
      let recordsValidated = BigInt(0);
      let recordsValidationFailed = BigInt(0);
      let recordsTransformationFailed = BigInt(0);

      const fieldTransformations = (job.transformationVersion?.fieldTransformations || []).map((t) => ({
        targetFieldIdentifier: t.targetFieldIdentifier,
        transformType: t.transformType as any,
        config: (t.config as any) || {},
      }));

      const validationRules = (job.validationVersion?.rules || []).map((r) => ({
        targetFieldIdentifier: r.targetFieldIdentifier,
        ruleType: r.ruleType as any,
        ruleConfig: (r.ruleConfig as any) || {},
        severity: r.severity as any,
      }));

      const executionMetadata = {
        jobId,
        runId,
        workspaceId: job.workspaceId,
        environmentId: job.environmentId,
        timestamp: new Date(),
      };

      for (const rawRecord of records) {
        recordsProcessed++;

        // Transformation
        const { transformedRecord, errors } = this.transformationEngine.transformRecord(
          rawRecord,
          fieldTransformations,
          executionMetadata,
          lookupTables
        );

        if (errors.length > 0) {
          recordsTransformationFailed++;
        } else {
          recordsTransformed++;
        }

        // Validation
        const validationResults = this.validationEngine.validateRecord(transformedRecord, validationRules);
        const hasFailedRule = validationResults.some((vr) => !vr.passed && vr.severity === 'ERROR');

        if (hasFailedRule) {
          recordsValidationFailed++;
        } else {
          recordsValidated++;
        }
      }

      // 3. Mark COMPLETED
      await this.prisma.pipelineExecutionRun.update({
        where: { id: runId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          recordsProcessed,
          recordsTransformed,
          recordsValidated,
          recordsValidationFailed,
          recordsTransformationFailed,
        },
      });

      await this.prisma.pipelineExecutionLog.create({
        data: {
          pipelineExecutionRunId: runId,
          level: 'INFO',
          message: `Pipeline execution run ${runId} completed successfully. Processed ${recordsProcessed} records.`,
          metadata: {
            recordsProcessed: Number(recordsProcessed),
            recordsTransformed: Number(recordsTransformed),
            recordsValidated: Number(recordsValidated),
          },
        },
      });
    } catch (err: any) {
      await this.prisma.pipelineExecutionRun.update({
        where: { id: runId },
        data: {
          status: 'FAILED',
          errorCode: 'EXECUTION_ERROR',
          errorMessage: err.message || 'An unexpected execution error occurred',
          completedAt: new Date(),
        },
      });

      await this.prisma.pipelineExecutionLog.create({
        data: {
          pipelineExecutionRunId: runId,
          level: 'ERROR',
          message: `Pipeline execution run ${runId} failed: ${err.message}`,
        },
      });
    }
  }
}
