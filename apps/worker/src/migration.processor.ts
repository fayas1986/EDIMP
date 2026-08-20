import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MigrationEngineService } from '../../api/src/migration-engine/migration-engine.service';

@Processor('migration-queue')
export class MigrationProcessor extends WorkerHost {
  private readonly logger = new Logger(MigrationProcessor.name);

  constructor(private readonly migrationEngineService: MigrationEngineService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`[Worker Process] Processing migration job '${job.id}' for Run ID '${job.data.runId}'`);
    
    try {
      await this.migrationEngineService.executeRunPipeline(
        job.data.runId,
        job.data.dto,
        job.data.samplePayloads
      );
      this.logger.log(`[Worker Process] Successfully completed MigrationRun '${job.data.runId}'`);
      return { success: true, runId: job.data.runId };
    } catch (err: any) {
      this.logger.error(`[Worker Process] MigrationRun '${job.data.runId}' failed: ${err?.message}`, err?.stack);
      throw err;
    }
  }
}
