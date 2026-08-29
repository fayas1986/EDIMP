import { Controller, Get, Post, Patch, Body, Param, Query, Headers, HttpCode, UseGuards } from '@nestjs/common';
import { ErrorManagementService } from './error-management.service';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { TenantWorkspaceGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import {
  UpdateErrorStatusDto,
  ResolveErrorOverrideDto,
  ResolveErrorReplayDto,
  BulkResolveErrorsDto,
  PaginationQueryDto,
  PaginatedResult,
  RecordErrorResponse,
  ErrorManualOverrideResponse,
  ErrorReplayResponse,
  BulkResolveErrorsResponse,
} from '@edimp/contracts';
import { ErrorResolutionStatus } from '@edimp/database';

@Controller('errors')
@UseGuards(AuthGuard, TenantWorkspaceGuard)
export class ErrorManagementController {
  constructor(private readonly errorService: ErrorManagementService) {}

  @Get()
  async listErrors(
    @Headers('x-workspace-id') workspaceId: string,
    @Query() query: PaginationQueryDto & { status?: ErrorResolutionStatus; category?: string }
  ): Promise<PaginatedResult<RecordErrorResponse>> {
    return this.errorService.listErrors(workspaceId, query);
  }

  @Get(':id')
  async getErrorDetails(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<RecordErrorResponse> {
    return this.errorService.getErrorDetails(id, user);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateErrorStatusDto
  ): Promise<RecordErrorResponse> {
    return this.errorService.updateStatus(id, user.id, dto);
  }

  @Post(':id/override')
  async applyManualOverride(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: ResolveErrorOverrideDto
  ): Promise<ErrorManualOverrideResponse> {
    return this.errorService.applyManualOverride(id, user.id, dto);
  }

  @Post(':id/replay')
  async replayError(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: ResolveErrorReplayDto
  ): Promise<ErrorReplayResponse> {
    return this.errorService.replayError(id, user.id, dto);
  }

  @Post('bulk-resolve')
  @HttpCode(202)
  async bulkResolveErrors(
    @CurrentUser() user: RequestUser,
    @Body() dto: BulkResolveErrorsDto
  ): Promise<BulkResolveErrorsResponse> {
    return this.errorService.bulkResolveErrors(user.id, dto);
  }
}
