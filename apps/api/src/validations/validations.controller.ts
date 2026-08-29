import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ValidationsService } from './validations.service';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { TenantWorkspaceGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { CreateValidationSetSchema, UpdateValidationDraftSchema, PaginationQuerySchema, PaginationQueryDto, PaginatedResult, ValidationSetResponse, ValidationVersionResponse, CreateValidationSetDto, UpdateValidationDraftDto } from '@edimp/contracts';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('validations')
@Controller()
@UseGuards(AuthGuard, TenantWorkspaceGuard)
export class ValidationsController {
  constructor(private readonly validationsService: ValidationsService) {}

  @Post('workspaces/:workspaceId/validation-sets')
  @ApiOperation({ summary: 'Create a new ValidationSet with initial DRAFT version 1' })
  @ApiResponse({ status: 201, description: 'ValidationSet created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to Workspace' })
  @ApiResponse({ status: 409, description: 'Conflict - Name already exists in Workspace' })
  create(
    @Param('workspaceId') workspaceId: string,
    @Body(new ZodValidationPipe(CreateValidationSetSchema)) dto: CreateValidationSetDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ValidationSetResponse> {
    return this.validationsService.create(workspaceId, dto, user);
  }

  @Get('workspaces/:workspaceId/validation-sets')
  @ApiOperation({ summary: 'List ValidationSets in a Workspace with optional pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of validation sets or paginated result' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to Workspace' })
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQueryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<PaginatedResult<ValidationSetResponse>> {
    return this.validationsService.findAll(workspaceId, user, query);
  }

  @Get('validation-sets/:id')
  @ApiOperation({ summary: 'Get ValidationSet details by ID' })
  @ApiResponse({ status: 200, description: 'ValidationSet details' })
  @ApiResponse({ status: 404, description: 'ValidationSet not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<ValidationSetResponse> {
    return this.validationsService.findOne(id, user);
  }

  @Patch('validation-sets/:id/draft')
  @ApiOperation({ summary: 'Update the DRAFT version of a ValidationSet' })
  @ApiResponse({ status: 200, description: 'DRAFT version updated successfully' })
  @ApiResponse({ status: 400, description: 'No DRAFT version exists or published version cannot be modified' })
  updateDraft(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateValidationDraftSchema)) dto: UpdateValidationDraftDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ValidationSetResponse> {
    return this.validationsService.updateDraft(id, dto, user);
  }

  @Post('validation-sets/:id/versions/:versionId/publish')
  @ApiOperation({ summary: 'Publish a DRAFT ValidationVersion into PUBLISHED state in an atomic transaction' })
  @ApiResponse({ status: 201, description: 'ValidationVersion published successfully' })
  @ApiResponse({ status: 400, description: 'Only DRAFT version can be published' })
  publishVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ValidationVersionResponse> {
    return this.validationsService.publishVersion(id, versionId, user);
  }
}
