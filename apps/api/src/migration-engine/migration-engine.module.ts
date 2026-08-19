import { Module } from '@nestjs/common';
import { MigrationEngineService } from './migration-engine.service';
import { MigrationEngineController } from './migration-engine.controller';
import { CanonicalJsonService } from './canonical-json.service';
import { SourceExtractorService } from './source-extractor.service';
import { TargetLoaderService } from './target-loader.service';
import { RetryStrategyService } from './retry-strategy.service';
import { MigrationValidationService } from './migration-validation.service';
import { TransformationsModule } from '../transformations/transformations.module';
import { ValidationsModule } from '../validations/validations.module';

@Module({
  imports: [TransformationsModule, ValidationsModule],
  controllers: [MigrationEngineController],
  providers: [
    MigrationEngineService,
    CanonicalJsonService,
    SourceExtractorService,
    TargetLoaderService,
    RetryStrategyService,
    MigrationValidationService,
  ],
  exports: [
    MigrationEngineService,
    CanonicalJsonService,
    SourceExtractorService,
    TargetLoaderService,
    RetryStrategyService,
    MigrationValidationService,
  ],
})
export class MigrationEngineModule {}
