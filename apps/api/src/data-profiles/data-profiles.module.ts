import { Module } from '@nestjs/common';
import { DataProfilesService } from './data-profiles.service';
import { DataProfilesController } from './data-profiles.controller';
import { DataProfilesWorker } from './data-profiles.worker';

@Module({
  controllers: [DataProfilesController],
  providers: [DataProfilesService, DataProfilesWorker],
  exports: [DataProfilesService, DataProfilesWorker],
})
export class DataProfilesModule {}
