import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PipelineJobsService } from './pipeline-jobs.service';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { CreatePipelineJobSchema, PreviewTransformSchema, PaginationQuerySchema, PaginationQueryDto, PaginatedResult } from '@edimp/contracts';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('pipeline-jobs')
@Controller()
@UseGuards(AuthGuard)
export class PipelineJobsController {
  constructor(private readonly pipelineJobsService: PipelineJobsService) {}

  @Post('workspaces/:workspaceId/pipeline-jobs')
  @ApiOperation({ summary: 'Create a new PipelineJob bound to published mapping, transformation, and validation versions' })
  @ApiResponse({ status: 201, description: 'PipelineJob created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or versions are not PUBLISHED' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to Workspace' })
  @ApiResponse({ status: 409, description: 'Conflict - Name already exists in Workspace' })
  create(
    @Param('workspaceId') workspaceId: string,
    @Body(new ZodValidationPipe(CreatePipelineJobSchema)) dto: any,
    @CurrentUser() user: RequestUser,
  ): Promise<any> {
    return this.pipelineJobsService.create(workspaceId, dto, user);
  }

  @Get('workspaces/:workspaceId/pipeline-jobs')
  @ApiOperation({ summary: 'List PipelineJobs in a Workspace with optional pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of pipeline jobs or paginated result' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to Workspace' })
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQueryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<any[] | PaginatedResult<any>> {
    return this.pipelineJobsService.findAll(workspaceId, user, query);
  }

  @Post('workspaces/:workspaceId/pipeline-jobs/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dry-run preview transformation and validation against sample records with zero DB side effects' })
  @ApiResponse({ status: 200, description: 'Preview transformed records and validation results' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid versions' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to Workspace' })
  preview(
    @Param('workspaceId') workspaceId: string,
    @Body(new ZodValidationPipe(PreviewTransformSchema)) dto: any,
    @CurrentUser() user: RequestUser,
  ): Promise<any> {
    return this.pipelineJobsService.preview(workspaceId, dto, user);
  }

  @Get('pipeline-jobs/:id')
  @ApiOperation({ summary: 'Get PipelineJob details by ID' })
  @ApiResponse({ status: 200, description: 'PipelineJob details' })
  @ApiResponse({ status: 404, description: 'PipelineJob not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<any> {
    return this.pipelineJobsService.findOne(id, user);
  }

  @Post('pipeline-jobs/:id/execute')
  @ApiOperation({ summary: 'Trigger production execution run for a PipelineJob (requires PUBLISHED versions)' })
  @ApiResponse({ status: 201, description: 'Execution run queued successfully' })
  @ApiResponse({ status: 400, description: 'Job versions are not PUBLISHED' })
  @ApiResponse({ status: 404, description: 'PipelineJob not found' })
  executeRun(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: RequestUser,
  ): Promise<any> {
    return this.pipelineJobsService.executeRun(id, user, body);
  }

  @Get('pipeline-jobs/:id/runs')
  @ApiOperation({ summary: 'List ExecutionRuns for a PipelineJob with optional pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of execution runs or paginated result' })
  @ApiResponse({ status: 404, description: 'PipelineJob not found' })
  findRuns(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQueryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<any[] | PaginatedResult<any>> {
    return this.pipelineJobsService.findRuns(id, user, query);
  }
}
