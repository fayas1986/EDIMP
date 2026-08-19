import { Module } from '@nestjs/common';
import { TransformRegistryService } from './transform-registry.service';
import { SafeExpressionEngineService } from './safe-expression-engine.service';
import { TransformationEngineService } from './transformation-engine.service';
import { TransformationsService } from './transformations.service';
import { TransformationsController } from './transformations.controller';

@Module({
  controllers: [TransformationsController],
  providers: [
    TransformRegistryService,
    SafeExpressionEngineService,
    TransformationEngineService,
    TransformationsService,
  ],
  exports: [
    TransformRegistryService,
    SafeExpressionEngineService,
    TransformationEngineService,
    TransformationsService,
  ],
})
export class TransformationsModule {}
