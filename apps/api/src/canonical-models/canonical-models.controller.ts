import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { CanonicalModelsService } from './canonical-models.service';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { TenantWorkspaceGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { CreateCanonicalModelSchema, UpdateCanonicalModelSchema, PaginationQuerySchema, PaginationQueryDto, PaginatedResult, CanonicalModelResponse, CanonicalModelVersionResponse, CreateCanonicalModelDto, UpdateCanonicalModelDto } from '@edimp/contracts';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('canonical-models')
@Controller()
@UseGuards(AuthGuard, TenantWorkspaceGuard)
export class CanonicalModelsController {
  constructor(private readonly canonicalModelsService: CanonicalModelsService) {}

  @Post('workspaces/:workspaceId/canonical-models')
  @ApiOperation({ summary: 'Create a new Canonical Data Model with initial DRAFT version 1' })
  @ApiResponse({ status: 201, description: 'CanonicalModel created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to workspace' })
  @ApiResponse({ status: 409, description: 'Conflict - Name already exists in workspace' })
  create(
    @Param('workspaceId') workspaceId: string,
    @Body(new ZodValidationPipe(CreateCanonicalModelSchema)) dto: Record<string, unknown>,
    @CurrentUser() user: RequestUser,
  ): Promise<CanonicalModelResponse> {
    return this.canonicalModelsService.create(workspaceId, dto as CreateCanonicalModelDto, user);
  }

  @Get('workspaces/:workspaceId/canonical-models')
  @ApiOperation({ summary: 'List Canonical Data Models in a workspace with optional pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of canonical models or paginated result' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to workspace' })
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQueryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<PaginatedResult<CanonicalModelResponse>> {
    return this.canonicalModelsService.findAll(workspaceId, user, query);
  }

  @Get('canonical-models/:id')
  @ApiOperation({ summary: 'Get Canonical Data Model details by ID' })
  @ApiResponse({ status: 200, description: 'Canonical model details' })
  @ApiResponse({ status: 404, description: 'Canonical model not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<CanonicalModelResponse> {
    return this.canonicalModelsService.findOne(id, user);
  }

  @Patch('canonical-models/:id/draft')
  @ApiOperation({ summary: 'Update the DRAFT version of a Canonical Data Model' })
  @ApiResponse({ status: 200, description: 'DRAFT version updated successfully' })
  @ApiResponse({ status: 400, description: 'No DRAFT version exists or published version cannot be modified' })
  updateDraft(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCanonicalModelSchema)) dto: Record<string, unknown>,
    @CurrentUser() user: RequestUser,
  ): Promise<CanonicalModelResponse> {
    return this.canonicalModelsService.updateDraft(id, dto as UpdateCanonicalModelDto, user);
  }

  @Post('canonical-models/:id/versions/:versionId/publish')
  @ApiOperation({ summary: 'Publish a DRAFT CanonicalModelVersion using atomic pessimistic locking' })
  @ApiResponse({ status: 201, description: 'CanonicalModelVersion published successfully' })
  @ApiResponse({ status: 400, description: 'Only DRAFT version can be published' })
  publishVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<CanonicalModelVersionResponse> {
    return this.canonicalModelsService.publishVersion(id, versionId, user);
  }
}
