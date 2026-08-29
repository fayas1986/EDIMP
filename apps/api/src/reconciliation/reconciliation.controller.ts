import { Controller, Post, Get, Body, Param, Headers, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { TenantWorkspaceGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import {
  CreateReconciliationJobDto,
  CreateReconciliationConfigVersionDto,
  TriggerReconciliationRunDto,
  ReconciliationJobResponse,
  ReconciliationConfigurationVersionResponse,
  ReconciliationRunResponse,
  AsyncOperationResponse,
} from '@edimp/contracts';

@Controller('reconciliation-jobs')
@UseGuards(AuthGuard, TenantWorkspaceGuard)
export class ReconciliationController {
  constructor(private readonly reconService: ReconciliationService) {}

  @Post()
  async createJob(
    @Headers('x-workspace-id') workspaceId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateReconciliationJobDto
  ): Promise<ReconciliationJobResponse> {
    return this.reconService.createJob(workspaceId, user.id, dto);
  }

  @Post(':id/versions')
  async createConfigVersion(
    @Param('id') jobId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateReconciliationConfigVersionDto
  ): Promise<ReconciliationConfigurationVersionResponse> {
    return this.reconService.createConfigurationVersion(jobId, user.id, dto);
  }

  @Post(':id/versions/:versionId/publish')
  async publishConfigVersion(
    @Param('id') jobId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: RequestUser
  ): Promise<ReconciliationConfigurationVersionResponse> {
    return this.reconService.publishConfigurationVersion(jobId, versionId, user.id);
  }

  @Post(':id/versions/:versionId/execute')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerRun(
    @Param('id') jobId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: TriggerReconciliationRunDto
  ): Promise<AsyncOperationResponse> {
    return this.reconService.triggerRun(jobId, versionId, user.id, dto);
  }

  @Get('runs/:runId')
  async getRunDetails(@Param('runId') runId: string, @CurrentUser() user: RequestUser): Promise<ReconciliationRunResponse> {
    return this.reconService.getRunDetails(runId, user);
  }
}
