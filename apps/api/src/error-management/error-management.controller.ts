import { Controller, Get, Post, Patch, Body, Param, Query, Headers, HttpCode } from '@nestjs/common';
import { ErrorManagementService } from './error-management.service';
import {
  UpdateErrorStatusDto,
  ResolveErrorOverrideDto,
  ResolveErrorReplayDto,
  BulkResolveErrorsDto,
} from '@edimp/contracts';
import { ErrorResolutionStatus } from '@edimp/database';

@Controller('errors')
export class ErrorManagementController {
  constructor(private readonly errorService: ErrorManagementService) {}

  @Get()
  async listErrors(
    @Headers('x-workspace-id') workspaceId: string,
    @Query('status') status?: ErrorResolutionStatus,
    @Query('category') category?: string
  ) {
    return this.errorService.listErrors(workspaceId || 'workspace-1', status, category);
  }

  @Get(':id')
  async getErrorDetails(@Param('id') id: string) {
    return this.errorService.getErrorDetails(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: UpdateErrorStatusDto
  ) {
    return this.errorService.updateStatus(id, userId || 'user-1', dto);
  }

  @Post(':id/override')
  async applyManualOverride(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: ResolveErrorOverrideDto
  ) {
    return this.errorService.applyManualOverride(id, userId || 'user-1', dto);
  }

  @Post(':id/replay')
  async replayError(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: ResolveErrorReplayDto
  ) {
    return this.errorService.replayError(id, userId || 'user-1', dto);
  }

  @Post('bulk-resolve')
  @HttpCode(202)
  async bulkResolveErrors(
    @Headers('x-user-id') userId: string,
    @Body() dto: BulkResolveErrorsDto
  ) {
    return this.errorService.bulkResolveErrors(userId || 'user-1', dto);
  }
}
