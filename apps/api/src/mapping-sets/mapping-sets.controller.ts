import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { MappingSetsService } from './mapping-sets.service';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { TenantWorkspaceGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { CreateMappingSetSchema, UpdateMappingDraftSchema, PaginationQuerySchema, PaginationQueryDto, PaginatedResult, MappingSetResponse, MappingVersionResponse, CreateMappingSetDto, UpdateMappingDraftDto } from '@edimp/contracts';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('mapping-sets')
@Controller()
@UseGuards(AuthGuard, TenantWorkspaceGuard)
export class MappingSetsController {
  constructor(private readonly mappingSetsService: MappingSetsService) {}

  @Post('workspaces/:workspaceId/mapping-sets')
  @ApiOperation({ summary: 'Create a new MappingSet with initial DRAFT version 1' })
  @ApiResponse({ status: 201, description: 'MappingSet created successfully' })
  @ApiResponse({ status: 400, description: 'Validation or boundary compatibility error' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to workspace' })
  @ApiResponse({ status: 409, description: 'Conflict - Name already exists in workspace' })
  create(
    @Param('workspaceId') workspaceId: string,
    @Body(new ZodValidationPipe(CreateMappingSetSchema)) dto: Record<string, unknown>,
    @CurrentUser() user: RequestUser,
  ): Promise<MappingSetResponse> {
    return this.mappingSetsService.create(workspaceId, dto as CreateMappingSetDto, user);
  }

  @Get('workspaces/:workspaceId/mapping-sets')
  @ApiOperation({ summary: 'List MappingSets in a workspace with optional pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of mapping sets or paginated result' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to workspace' })
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQueryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<PaginatedResult<MappingSetResponse>> {
    return this.mappingSetsService.findAll(workspaceId, user, query);
  }

  @Get('mapping-sets/:id')
  @ApiOperation({ summary: 'Get MappingSet details by ID' })
  @ApiResponse({ status: 200, description: 'MappingSet details' })
  @ApiResponse({ status: 404, description: 'MappingSet not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<MappingSetResponse> {
    return this.mappingSetsService.findOne(id, user);
  }

  @Patch('mapping-sets/:id/draft')
  @ApiOperation({ summary: 'Update the DRAFT version of a MappingSet' })
  @ApiResponse({ status: 200, description: 'DRAFT version updated successfully' })
  @ApiResponse({ status: 400, description: 'No DRAFT version exists or referenced entity/field does not exist' })
  updateDraft(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateMappingDraftSchema)) dto: Record<string, unknown>,
    @CurrentUser() user: RequestUser,
  ): Promise<MappingSetResponse> {
    return this.mappingSetsService.updateDraft(id, dto as UpdateMappingDraftDto, user);
  }

  @Post('mapping-sets/:id/versions/:versionId/publish')
  @ApiOperation({ summary: 'Publish a DRAFT MappingVersion using atomic pessimistic locking and pre-publication validation' })
  @ApiResponse({ status: 201, description: 'MappingVersion published successfully' })
  @ApiResponse({ status: 400, description: 'Pre-publication validation error or not in DRAFT state' })
  publishVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<MappingVersionResponse> {
    return this.mappingSetsService.publishVersion(id, versionId, user);
  }
}
