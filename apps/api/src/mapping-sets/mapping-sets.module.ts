import { Module } from '@nestjs/common';
import { MappingSetsService } from './mapping-sets.service';
import { MappingSetsController } from './mapping-sets.controller';
import { MappingValidatorService } from './mapping-validator.service';

@Module({
  controllers: [MappingSetsController],
  providers: [MappingSetsService, MappingValidatorService],
  exports: [MappingSetsService, MappingValidatorService],
})
export class MappingSetsModule {}
