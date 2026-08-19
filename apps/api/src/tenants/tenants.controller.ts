import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { PaginationQuerySchema, PaginationQueryDto, PaginatedResult, Tenant } from '@edimp/contracts';
import { ZodValidationPipe } from 'nestjs-zod';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 409, description: 'Conflict - Tenant name already exists' })
  create(@Body() createTenantDto: CreateTenantDto, @CurrentUser() user: RequestUser): Promise<Tenant> {
    return this.tenantsService.create(createTenantDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List all Tenants for the authenticated user with optional pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of tenants or paginated result' })
  findAll(
    @Query(new ZodValidationPipe(PaginationQuerySchema)) query: PaginationQueryDto,
    @CurrentUser() user: RequestUser
  ): Promise<Tenant[] | PaginatedResult<Tenant>> {
    return this.tenantsService.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Tenant details by ID' })
  @ApiResponse({ status: 200, description: 'Tenant details' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not belong to tenant' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<Tenant> {
    return this.tenantsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Tenant details' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  update(
    @Param('id') id: string, 
    @Body() updateTenantDto: UpdateTenantDto,
    @CurrentUser() user: RequestUser
  ): Promise<Tenant> {
    return this.tenantsService.update(id, updateTenantDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a Tenant' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<Tenant> {
    return this.tenantsService.remove(id, user);
  }
}
