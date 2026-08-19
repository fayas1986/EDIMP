import { Controller, Post, Get, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import {
  CreateReconciliationJobDto,
  CreateReconciliationConfigVersionDto,
  TriggerReconciliationRunDto,
} from '@edimp/contracts';

@Controller('reconciliation-jobs')
export class ReconciliationController {
  constructor(private readonly reconService: ReconciliationService) {}

  @Post()
  async createJob(
    @Headers('x-workspace-id') workspaceId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateReconciliationJobDto
  ) {
    return this.reconService.createJob(workspaceId || 'workspace-1', userId || 'user-1', dto);
  }

  @Post(':id/versions')
  async createConfigVersion(
    @Param('id') jobId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateReconciliationConfigVersionDto
  ) {
    return this.reconService.createConfigurationVersion(jobId, userId || 'user-1', dto);
  }

  @Post(':id/versions/:versionId/publish')
  async publishConfigVersion(
    @Param('id') jobId: string,
    @Param('versionId') versionId: string,
    @Headers('x-user-id') userId: string
  ) {
    return this.reconService.publishConfigurationVersion(jobId, versionId, userId || 'user-1');
  }

  @Post(':id/versions/:versionId/execute')
  async triggerRun(
    @Param('id') jobId: string,
    @Param('versionId') versionId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: TriggerReconciliationRunDto
  ) {
    return this.reconService.triggerRun(jobId, versionId, userId || 'user-1', dto);
  }

  @Get('runs/:runId')
  async getRunDetails(@Param('runId') runId: string) {
    return this.reconService.getRunDetails(runId);
  }
}
