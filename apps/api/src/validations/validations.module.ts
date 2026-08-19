import { Module } from '@nestjs/common';
import { ValidationEngineService } from './validation-engine.service';
import { ValidationsService } from './validations.service';
import { ValidationsController } from './validations.controller';

@Module({
  controllers: [ValidationsController],
  providers: [ValidationEngineService, ValidationsService],
  exports: [ValidationEngineService, ValidationsService],
})
export class ValidationsModule {}
