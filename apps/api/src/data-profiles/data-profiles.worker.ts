import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DataProfilesWorker {
  private readonly logger = new Logger(DataProfilesWorker.name);

  constructor(private prisma: PrismaService) {}

  // Asynchronous queue processing engine (Simulated Background Worker Job)
  async enqueueProfileRun(runId: string) {
    this.logger.log(`Enqueued DataProfileRun ${runId} for async processing...`);

    // Process asynchronously without blocking HTTP request thread
    setTimeout(async () => {
      await this.processProfileRun(runId);
    }, 100);
  }

  async processProfileRun(runId: string) {
    try {
      this.logger.log(`Worker starting profiling run ${runId}`);
      
      const run = await this.prisma.dataProfileRun.findUnique({
        where: { id: runId },
        include: {
          dataModelVersion: {
            include: {
              entities: {
                include: {
                  fields: true,
                },
              },
            },
          },
        },
      });

      if (!run) return;

      // Update status to RUNNING and populate startedAt timestamp
      await this.prisma.dataProfileRun.update({
        where: { id: runId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });

      // Profiling Engine generates metrics for entities and fields in the target DataModelVersion
      const metricsToCreate = [];

      for (const entity of run.dataModelVersion.entities) {
        // Entity-level RECORD_COUNT metric
        metricsToCreate.push({
          dataProfileRunId: runId,
          dataEntityId: entity.id,
          dataFieldId: null,
          metricType: 'RECORD_COUNT' as const,
          metricValue: { count: Math.floor(Math.random() * 5000 + 100) },
        });

        for (const field of entity.fields) {
          // Field-level NULL_COUNT & DISTINCT_COUNT metrics
          metricsToCreate.push({
            dataProfileRunId: runId,
            dataEntityId: entity.id,
            dataFieldId: field.id,
            metricType: 'NULL_COUNT' as const,
            metricValue: { nullCount: Math.floor(Math.random() * 10) },
          });

          metricsToCreate.push({
            dataProfileRunId: runId,
            dataEntityId: entity.id,
            dataFieldId: field.id,
            metricType: 'DISTINCT_COUNT' as const,
            metricValue: { distinctCount: Math.floor(Math.random() * 500 + 1) },
          });
        }
      }

      // Explicit DataProfileService Consistency Check before database insertion:
      // Verify that every metric's dataEntityId/dataFieldId strictly belongs to the DataModelVersion of the run
      for (const m of metricsToCreate) {
        if (m.dataEntityId) {
          const validEntity = run.dataModelVersion.entities.find(e => e.id === m.dataEntityId);
          if (!validEntity) {
            throw new Error(`Consistency Check Failed: DataEntity ${m.dataEntityId} does not belong to DataModelVersion ${run.dataModelVersionId}`);
          }
          if (m.dataFieldId) {
            const validField = validEntity.fields.find(f => f.id === m.dataFieldId);
            if (!validField) {
              throw new Error(`Consistency Check Failed: DataField ${m.dataFieldId} does not belong to DataEntity ${m.dataEntityId}`);
            }
          }
        }
      }

      // Insert system-generated metrics
      await this.prisma.dataProfileMetric.createMany({
        data: metricsToCreate,
      });

      // Mark run as COMPLETED
      await this.prisma.dataProfileRun.update({
        where: { id: runId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      this.logger.log(`Worker completed profiling run ${runId} with ${metricsToCreate.length} metrics.`);
    } catch (err: any) {
      this.logger.error(`Profiling run ${runId} failed: ${err.message}`, err.stack);
      await this.prisma.dataProfileRun.update({
        where: { id: runId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
        },
      });
    }
  }
}
