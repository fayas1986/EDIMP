import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { TenantWorkspaceGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { CreateConnectionSchema, UpdateConnectionSchema, PaginationQuerySchema, PaginationQueryDto, PaginatedResult, TestConnectionResult, ConnectionResponse, CreateConnectionDto, UpdateConnectionDto } from '@edimp/contracts';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('connections')
@Controller()
@UseGuards(AuthGuard, TenantWorkspaceGuard)
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post('environments/:environmentId/connections')
  @ApiOperation({ summary: 'Create a new Connection in an Environment' })
  @ApiResponse({ status: 201, description: 'Connection created successfully (credentials sanitized)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not belong to Environment' })
  @ApiResponse({ status: 409, description: 'Conflict - Connection name exists in Environment' })
  create(
    @Param('environmentId') environmentId: string,
    @Body(new ZodValidationPipe(CreateConnectionSchema)) createConnectionDto: Record<string, unknown>,
    @CurrentUser() user: RequestUser,
  ): Promise<ConnectionResponse> {
    return this.connectionsService.create(environmentId, createConnectionDto as CreateConnectionDto, user);
  }

  @Get('environments/:environmentId/connections')
  @ApiOperation({ summary: 'List Connections in an Environment with optional pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of connections or paginated result' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not belong to Environment' })
  findAll(
    @Param('environmentId') environmentId: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQueryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<PaginatedResult<ConnectionResponse>> {
    return this.connectionsService.findAll(environmentId, user, query);
  }

  @Get('connections/:id')
  @ApiOperation({ summary: 'Get Connection details by ID' })
  @ApiResponse({ status: 200, description: 'Connection details' })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<ConnectionResponse> {
    return this.connectionsService.findOne(id, user);
  }

  @Patch('connections/:id')
  @ApiOperation({ summary: 'Update Connection details' })
  @ApiResponse({ status: 200, description: 'Connection updated successfully' })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateConnectionSchema)) updateConnectionDto: Record<string, unknown>,
    @CurrentUser() user: RequestUser,
  ): Promise<ConnectionResponse> {
    return this.connectionsService.update(id, updateConnectionDto as UpdateConnectionDto, user);
  }

  @Delete('connections/:id')
  @ApiOperation({ summary: 'Soft-delete a Connection' })
  @ApiResponse({ status: 200, description: 'Connection deleted successfully' })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<void> {
    return this.connectionsService.delete(id, user);
  }

  @Post('connections/:id/test')
  @ApiOperation({ summary: 'Test connectivity for a Connection' })
  @ApiResponse({ status: 200, description: 'Connectivity test result' })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  testConnection(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<TestConnectionResult> {
    return this.connectionsService.testConnection(id, user);
  }
}
