import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { DataProfilesService } from './data-profiles.service';
import { AuthGuard, RequestUser } from '../common/auth/auth.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { CreateDataProfileRunSchema } from '@edimp/contracts';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('data-profiles')
@Controller()
@UseGuards(AuthGuard)
export class DataProfilesController {
  constructor(private readonly dataProfilesService: DataProfilesService) {}

  @Post('data-profile-runs')
  @ApiOperation({ summary: 'Trigger an asynchronous DataProfileRun for a DataModelVersion' })
  @ApiResponse({ status: 201, description: 'DataProfileRun queued successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid DataModelVersion' })
  createRun(
    @Body(new ZodValidationPipe(CreateDataProfileRunSchema)) dto: any,
    @CurrentUser() user: RequestUser,
  ): Promise<any> {
    return this.dataProfilesService.createRun(dto, user);
  }

  @Get('data-profile-runs/:id')
  @ApiOperation({ summary: 'Get DataProfileRun details and metric results by ID' })
  @ApiResponse({ status: 200, description: 'DataProfileRun details and metric snapshots' })
  @ApiResponse({ status: 404, description: 'DataProfileRun not found' })
  getRun(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<any> {
    return this.dataProfilesService.getRun(id, user);
  }
}
