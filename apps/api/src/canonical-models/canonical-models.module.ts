import { Module } from '@nestjs/common';
import { CanonicalModelsService } from './canonical-models.service';
import { CanonicalModelsController } from './canonical-models.controller';

@Module({
  controllers: [CanonicalModelsController],
  providers: [CanonicalModelsService],
  exports: [CanonicalModelsService],
})
export class CanonicalModelsModule {}
