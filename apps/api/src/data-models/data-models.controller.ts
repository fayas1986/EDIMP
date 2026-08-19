import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { DataModelsService } from './data-models.service';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { CreateDataModelSchema, UpdateDataModelSchema, PaginationQuerySchema, PaginationQueryDto, PaginatedResult } from '@edimp/contracts';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('data-models')
@Controller()
@UseGuards(AuthGuard)
export class DataModelsController {
  constructor(private readonly dataModelsService: DataModelsService) {}

  @Post('connections/:connectionId/data-models')
  @ApiOperation({ summary: 'Create a new DataModel with initial DRAFT version 1' })
  @ApiResponse({ status: 201, description: 'DataModel created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to Connection' })
  @ApiResponse({ status: 409, description: 'Conflict - Name already exists in Connection' })
  create(
    @Param('connectionId') connectionId: string,
    @Body(new ZodValidationPipe(CreateDataModelSchema)) createDataModelDto: any,
    @CurrentUser() user: RequestUser,
  ): Promise<any> {
    return this.dataModelsService.create(connectionId, createDataModelDto, user);
  }

  @Get('connections/:connectionId/data-models')
  @ApiOperation({ summary: 'List DataModels in a Connection with optional pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of data models or paginated result' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to Connection' })
  findAll(
    @Param('connectionId') connectionId: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQueryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<any[] | PaginatedResult<any>> {
    return this.dataModelsService.findAll(connectionId, user, query);
  }

  @Get('data-models/:id')
  @ApiOperation({ summary: 'Get DataModel details by ID' })
  @ApiResponse({ status: 200, description: 'DataModel details' })
  @ApiResponse({ status: 404, description: 'DataModel not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<any> {
    return this.dataModelsService.findOne(id, user);
  }

  @Patch('data-models/:id/draft')
  @ApiOperation({ summary: 'Update the DRAFT version of a DataModel' })
  @ApiResponse({ status: 200, description: 'DRAFT version updated successfully' })
  @ApiResponse({ status: 400, description: 'No DRAFT version exists or published version cannot be modified' })
  updateDraft(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateDataModelSchema)) updateDataModelDto: any,
    @CurrentUser() user: RequestUser,
  ): Promise<any> {
    return this.dataModelsService.updateDraft(id, updateDataModelDto, user);
  }

  @Post('data-models/:id/versions/:versionId/publish')
  @ApiOperation({ summary: 'Publish a DRAFT DataModelVersion into PUBLISHED state in an atomic transaction' })
  @ApiResponse({ status: 201, description: 'DataModelVersion published successfully' })
  @ApiResponse({ status: 400, description: 'Only DRAFT version can be published' })
  publishVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<any> {
    return this.dataModelsService.publishVersion(id, versionId, user);
  }
}
