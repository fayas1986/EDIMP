import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WorkerClusterService } from './worker-cluster.service';
import { RegisterWorkerHeartbeatDto } from '@edimp/contracts';
import { WorkerStatus } from '@edimp/database';

@ApiTags('Worker Cluster & DLQ Management')
@Controller('worker-nodes')
export class WorkerClusterController {
  constructor(private readonly workerClusterService: WorkerClusterService) {}

  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Worker process health & heartbeat registration' })
  @ApiResponse({ status: 200, description: 'Worker node status updated' })
  async heartbeat(@Body() dto: RegisterWorkerHeartbeatDto) {
    return this.workerClusterService.registerWorkerHeartbeat(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List active worker nodes in cluster' })
  @ApiResponse({ status: 200, description: 'List of worker nodes' })
  async listWorkerNodes() {
    return this.workerClusterService.listWorkerNodes();
  }

  @Post(':workerId/drain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set worker node to DRAINING status' })
  @ApiResponse({ status: 200, description: 'Worker node set to DRAINING' })
  async drainWorker(@Param('workerId') workerId: string) {
    return this.workerClusterService.updateWorkerStatus(workerId, WorkerStatus.DRAINING);
  }

  @Post('dlq/:batchId/replay')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Replay DLQ item by creating a new recovery execution context (Preserves history)' })
  @ApiResponse({ status: 202, description: 'Recovery run created without modifying original run history' })
  async replayDlq(@Param('batchId') batchId: string) {
    return this.workerClusterService.replayDlqBatch(batchId);
  }
}
