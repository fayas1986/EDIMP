import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EnvironmentsService } from './environments.service';
import { CreateEnvironmentDto, UpdateEnvironmentDto } from './dto/environment.dto';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { TenantWorkspaceGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { PaginationQuerySchema, PaginationQueryDto, PaginatedResult, EnvironmentResponse } from '@edimp/contracts';
import { ZodValidationPipe } from 'nestjs-zod';

@ApiTags('Environments')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantWorkspaceGuard)
@Controller('workspaces/:workspaceId/environments')
export class EnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Environment in a Workspace' })
  @ApiResponse({ status: 201, description: 'Environment created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not belong to Workspace' })
  @ApiResponse({ status: 409, description: 'Conflict - Environment name exists in Workspace' })
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() createEnvironmentDto: CreateEnvironmentDto, 
    @CurrentUser() user: RequestUser
  ): Promise<EnvironmentResponse> {
    return this.environmentsService.create(workspaceId, createEnvironmentDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List Environments in a Workspace with optional pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of environments or paginated result' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not belong to Workspace' })
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQueryDto,
    @CurrentUser() user: RequestUser
  ): Promise<PaginatedResult<EnvironmentResponse>> {
    return this.environmentsService.findAll(workspaceId, user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Environment details by ID' })
  @ApiResponse({ status: 200, description: 'Environment details' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not belong to Workspace' })
  @ApiResponse({ status: 404, description: 'Environment not found' })
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string, 
    @CurrentUser() user: RequestUser
  ): Promise<EnvironmentResponse> {
    return this.environmentsService.findOne(workspaceId, id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Environment details' })
  @ApiResponse({ status: 200, description: 'Environment updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires OWNER or EDITOR role' })
  @ApiResponse({ status: 404, description: 'Environment not found' })
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string, 
    @Body() updateEnvironmentDto: UpdateEnvironmentDto,
    @CurrentUser() user: RequestUser
  ): Promise<EnvironmentResponse> {
    return this.environmentsService.update(workspaceId, id, updateEnvironmentDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an Environment' })
  @ApiResponse({ status: 200, description: 'Environment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires OWNER role' })
  @ApiResponse({ status: 404, description: 'Environment not found' })
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string, 
    @CurrentUser() user: RequestUser
  ): Promise<EnvironmentResponse> {
    return this.environmentsService.remove(workspaceId, id, user);
  }
}
