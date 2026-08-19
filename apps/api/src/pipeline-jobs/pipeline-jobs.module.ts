import { Module } from '@nestjs/common';
import { TransformationsModule } from '../transformations/transformations.module';
import { ValidationsModule } from '../validations/validations.module';
import { PipelineQueueService } from './pipeline-queue.service';
import { PipelineJobsService } from './pipeline-jobs.service';
import { PipelineJobsController } from './pipeline-jobs.controller';

@Module({
  imports: [TransformationsModule, ValidationsModule],
  controllers: [PipelineJobsController],
  providers: [PipelineQueueService, PipelineJobsService],
  exports: [PipelineQueueService, PipelineJobsService],
})
export class PipelineJobsModule {}
