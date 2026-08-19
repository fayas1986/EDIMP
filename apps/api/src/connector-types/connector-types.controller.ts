import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ConnectorTypesService } from './connector-types.service';
import { AuthGuard } from '../common/auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('connector-types')
@Controller('connector-types')
@UseGuards(AuthGuard)
export class ConnectorTypesController {
  constructor(private readonly connectorTypesService: ConnectorTypesService) {}

  @Get()
  findAll() {
    return this.connectorTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.connectorTypesService.findOne(id);
  }
}
