import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto/workspace.dto';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { TenantWorkspaceGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { PaginationQuerySchema, PaginationQueryDto, PaginatedResult, WorkspaceResponse } from '@edimp/contracts';
import { ZodValidationPipe } from 'nestjs-zod';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantWorkspaceGuard)
@Controller('tenants/:tenantId/workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Workspace in a Tenant' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not belong to Tenant' })
  @ApiResponse({ status: 409, description: 'Conflict - Workspace name exists in Tenant' })
  create(
    @Param('tenantId') tenantId: string,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @CurrentUser() user: RequestUser,
  ): Promise<WorkspaceResponse> {
    return this.workspacesService.create(tenantId, createWorkspaceDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List Workspaces in a Tenant with optional pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of workspaces or paginated result' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not belong to Tenant' })
  findAll(
    @Param('tenantId') tenantId: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQueryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<PaginatedResult<WorkspaceResponse>> {
    return this.workspacesService.findAll(tenantId, user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Workspace details by ID' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not belong to Workspace' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  findOne(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<WorkspaceResponse> {
    return this.workspacesService.findOne(tenantId, id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Workspace details' })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires OWNER or EDITOR role' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @CurrentUser() user: RequestUser,
  ): Promise<WorkspaceResponse> {
    return this.workspacesService.update(tenantId, id, updateWorkspaceDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a Workspace' })
  @ApiResponse({ status: 200, description: 'Workspace deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires OWNER role' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  remove(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<WorkspaceResponse> {
    return this.workspacesService.remove(tenantId, id, user);
  }
}
