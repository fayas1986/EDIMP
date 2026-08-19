import { Module } from '@nestjs/common';
import { DataModelsService } from './data-models.service';
import { DataModelsController } from './data-models.controller';
import { DataModelDiscoveryService } from './data-model-discovery.service';

@Module({
  controllers: [DataModelsController],
  providers: [DataModelsService, DataModelDiscoveryService],
  exports: [DataModelsService, DataModelDiscoveryService],
})
export class DataModelsModule {}
