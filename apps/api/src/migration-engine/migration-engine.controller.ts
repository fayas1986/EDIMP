import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MigrationEngineService } from './migration-engine.service';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { TenantWorkspaceGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import {
  CreateMigrationJobSchema,
  CreateMigrationConfigVersionSchema,
  TriggerMigrationRunSchema,
  RetryMigrationRunSchema,
  ResumeMigrationRunSchema,
  PaginationQuerySchema,
  PaginationQueryDto,
  PaginatedResult,
  MigrationJobResponse,
  MigrationConfigurationVersionResponse,
  MigrationRunResponse,
  AsyncOperationResponse,
  CreateMigrationJobDto,
  CreateMigrationConfigVersionDto,
  TriggerMigrationRunDto,
  RetryMigrationRunDto,
  ResumeMigrationRunDto,
} from '@edimp/contracts';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('migration-jobs')
@Controller()
@UseGuards(AuthGuard, TenantWorkspaceGuard)
export class MigrationEngineController {
  constructor(private readonly migrationEngineService: MigrationEngineService) {}

  @Post('workspaces/:workspaceId/migration-jobs')
  @ApiOperation({ summary: 'Create a new MigrationJob scoped to Environment & Workspace' })
  @ApiResponse({ status: 201, description: 'MigrationJob created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or job name conflict' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to Workspace' })
  createJob(
    @Param('workspaceId') workspaceId: string,
    @Body(new ZodValidationPipe(CreateMigrationJobSchema)) dto: CreateMigrationJobDto,
    @CurrentUser() user: RequestUser,
  ): Promise<MigrationJobResponse> {
    return this.migrationEngineService.createJob(workspaceId, dto, user);
  }

  @Get('workspaces/:workspaceId/migration-jobs')
  @ApiOperation({ summary: 'List MigrationJobs in a Workspace with optional pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of migration jobs or paginated result' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to Workspace' })
  findAllJobs(
    @Param('workspaceId') workspaceId: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQueryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<PaginatedResult<MigrationJobResponse>> {
    return this.migrationEngineService.findAllJobs(workspaceId, user, query);
  }

  @Get('migration-jobs/:id')
  @ApiOperation({ summary: 'Get MigrationJob details by ID' })
  @ApiResponse({ status: 200, description: 'MigrationJob details' })
  @ApiResponse({ status: 404, description: 'MigrationJob not found' })
  findOneJob(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<MigrationJobResponse> {
    return this.migrationEngineService.findOneJob(id, user);
  }

  @Post('migration-jobs/:id/configurations')
  @ApiOperation({ summary: 'Create a draft MigrationConfigurationVersion freezing all 7 referenced entities' })
  @ApiResponse({ status: 201, description: 'Draft configuration version created' })
  @ApiResponse({ status: 400, description: 'Hierarchy validation failed' })
  createConfigVersion(
    @Param('id') jobId: string,
    @Body(new ZodValidationPipe(CreateMigrationConfigVersionSchema)) dto: CreateMigrationConfigVersionDto,
    @CurrentUser() user: RequestUser,
  ): Promise<MigrationConfigurationVersionResponse> {
    return this.migrationEngineService.createConfigVersion(jobId, dto, user);
  }

  @Post('migration-configurations/:id/publish')
  @ApiOperation({ summary: 'Publish MigrationConfigurationVersion into frozen immutable recipe' })
  @ApiResponse({ status: 201, description: 'Configuration version published with SHA-256 hash' })
  @ApiResponse({ status: 400, description: 'Already published or invalid version' })
  publishConfigVersion(
    @Param('id') configId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<MigrationConfigurationVersionResponse> {
    return this.migrationEngineService.publishConfigVersion(configId, user);
  }

  @Post('migration-jobs/:id/execute')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger production MigrationRun bound to published MigrationConfigurationVersion' })
  @ApiResponse({ status: 202, description: 'MigrationRun queued and async pipeline triggered' })
  @ApiResponse({ status: 400, description: 'No published configuration version exists' })
  triggerRun(
    @Param('id') jobId: string,
    @Body(new ZodValidationPipe(TriggerMigrationRunSchema)) dto: TriggerMigrationRunDto,
    @CurrentUser() user: RequestUser,
  ): Promise<AsyncOperationResponse> {
    return this.migrationEngineService.triggerRun(jobId, dto, user);
  }

  @Get('migration-jobs/:id/runs')
  @ApiOperation({ summary: 'List MigrationRuns for a MigrationJob with optional pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of migration runs or paginated result' })
  findRuns(
    @Param('id') jobId: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQueryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<PaginatedResult<MigrationRunResponse>> {
    return this.migrationEngineService.findRuns(jobId, user, query);
  }

  @Get('migration-runs/:id')
  @ApiOperation({ summary: 'Get details, batch metrics, and record errors for a MigrationRun' })
  @ApiResponse({ status: 200, description: 'MigrationRun details' })
  @ApiResponse({ status: 404, description: 'MigrationRun not found' })
  findOneRun(@Param('id') runId: string, @CurrentUser() user: RequestUser): Promise<MigrationRunResponse> {
    return this.migrationEngineService.findOneRun(runId, user);
  }

  @Post('migration-runs/:id/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Retry retryable failed records (TRANSIENT, RATE_LIMIT, CONNECTIVITY) with exponential backoff' })
  @ApiResponse({ status: 202, description: 'Retry initiated for eligible records' })
  retryRun(
    @Param('id') runId: string,
    @Body(new ZodValidationPipe(RetryMigrationRunSchema)) dto: RetryMigrationRunDto,
    @CurrentUser() user: RequestUser,
  ): Promise<AsyncOperationResponse> {
    return this.migrationEngineService.retryRun(runId, dto, user);
  }

  @Post('migration-runs/:id/resume')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Resume an interrupted/paused MigrationRun from its last completed batch checkpoint' })
  @ApiResponse({ status: 202, description: 'MigrationRun resumed' })
  resumeRun(
    @Param('id') runId: string,
    @Body(new ZodValidationPipe(ResumeMigrationRunSchema)) dto: ResumeMigrationRunDto,
    @CurrentUser() user: RequestUser,
  ): Promise<AsyncOperationResponse> {
    return this.migrationEngineService.resumeRun(runId, dto, user);
  }
}
