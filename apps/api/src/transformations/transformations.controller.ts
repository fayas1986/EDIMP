import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { TransformationsService } from './transformations.service';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { CreateTransformationSetSchema, UpdateTransformationDraftSchema, PaginationQuerySchema, PaginationQueryDto, PaginatedResult } from '@edimp/contracts';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('transformations')
@Controller()
@UseGuards(AuthGuard)
export class TransformationsController {
  constructor(private readonly transformationsService: TransformationsService) {}

  @Post('workspaces/:workspaceId/transformation-sets')
  @ApiOperation({ summary: 'Create a new TransformationSet with initial DRAFT version 1' })
  @ApiResponse({ status: 201, description: 'TransformationSet created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to Workspace' })
  @ApiResponse({ status: 409, description: 'Conflict - Name already exists in Workspace' })
  create(
    @Param('workspaceId') workspaceId: string,
    @Body(new ZodValidationPipe(CreateTransformationSetSchema)) dto: any,
    @CurrentUser() user: RequestUser,
  ): Promise<any> {
    return this.transformationsService.create(workspaceId, dto, user);
  }

  @Get('workspaces/:workspaceId/transformation-sets')
  @ApiOperation({ summary: 'List TransformationSets in a Workspace with optional pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of transformation sets or paginated result' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to Workspace' })
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQueryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<any[] | PaginatedResult<any>> {
    return this.transformationsService.findAll(workspaceId, user, query);
  }

  @Get('transformation-sets/:id')
  @ApiOperation({ summary: 'Get TransformationSet details by ID' })
  @ApiResponse({ status: 200, description: 'TransformationSet details' })
  @ApiResponse({ status: 404, description: 'TransformationSet not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<any> {
    return this.transformationsService.findOne(id, user);
  }

  @Patch('transformation-sets/:id/draft')
  @ApiOperation({ summary: 'Update the DRAFT version of a TransformationSet' })
  @ApiResponse({ status: 200, description: 'DRAFT version updated successfully' })
  @ApiResponse({ status: 400, description: 'No DRAFT version exists or published version cannot be modified' })
  updateDraft(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTransformationDraftSchema)) dto: any,
    @CurrentUser() user: RequestUser,
  ): Promise<any> {
    return this.transformationsService.updateDraft(id, dto, user);
  }

  @Post('transformation-sets/:id/versions/:versionId/publish')
  @ApiOperation({ summary: 'Publish a DRAFT TransformationVersion into PUBLISHED state in an atomic transaction' })
  @ApiResponse({ status: 201, description: 'TransformationVersion published successfully' })
  @ApiResponse({ status: 400, description: 'Only DRAFT version can be published' })
  publishVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<any> {
    return this.transformationsService.publishVersion(id, versionId, user);
  }
}
