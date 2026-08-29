import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { DataProfilesService } from './data-profiles.service';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { TenantWorkspaceGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { CreateDataProfileRunSchema, AsyncOperationResponse, DataProfileRunResponse, CreateDataProfileRunDto } from '@edimp/contracts';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('data-profiles')
@Controller()
@UseGuards(AuthGuard, TenantWorkspaceGuard)
export class DataProfilesController {
  constructor(private readonly dataProfilesService: DataProfilesService) {}

  @Post('data-profile-runs')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger an asynchronous DataProfileRun for a DataModelVersion' })
  @ApiResponse({ status: 202, description: 'DataProfileRun queued successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid DataModelVersion' })
  createRun(
    @Body(new ZodValidationPipe(CreateDataProfileRunSchema)) dto: Record<string, unknown>,
    @CurrentUser() user: RequestUser,
  ): Promise<AsyncOperationResponse> {
    return this.dataProfilesService.createRun(dto as CreateDataProfileRunDto, user);
  }

  @Get('data-profile-runs/:id')
  @ApiOperation({ summary: 'Get DataProfileRun details and metric results by ID' })
  @ApiResponse({ status: 200, description: 'DataProfileRun details and metric snapshots' })
  @ApiResponse({ status: 404, description: 'DataProfileRun not found' })
  getRun(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<DataProfileRunResponse> {
    return this.dataProfilesService.getRun(id, user);
  }
}
