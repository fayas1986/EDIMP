import { Module } from '@nestjs/common';
import { ConnectorTypesService } from './connector-types.service';
import { ConnectorTypesController } from './connector-types.controller';

@Module({
  controllers: [ConnectorTypesController],
  providers: [ConnectorTypesService],
  exports: [ConnectorTypesService],
})
export class ConnectorTypesModule {}
