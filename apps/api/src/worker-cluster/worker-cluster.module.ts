import { Module } from '@nestjs/common';
import { WorkerClusterService } from './worker-cluster.service';
import { WorkerClusterController } from './worker-cluster.controller';

@Module({
  controllers: [WorkerClusterController],
  providers: [WorkerClusterService],
  exports: [WorkerClusterService],
})
export class WorkerClusterModule {}
