import { Module } from '@nestjs/common';
import { ErrorManagementService } from './error-management.service';
import { ErrorManagementController } from './error-management.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MigrationEngineModule } from '../migration-engine/migration-engine.module';

@Module({
  imports: [PrismaModule, MigrationEngineModule],
  controllers: [ErrorManagementController],
  providers: [ErrorManagementService],
  exports: [ErrorManagementService],
})
export class ErrorManagementModule {}
