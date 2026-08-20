import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../api/src/prisma/prisma.module';
import { MigrationEngineModule } from '../../api/src/migration-engine/migration-engine.module';
import { SecretsModule } from '../../api/src/common/secrets/secrets.module';
import { MigrationProcessor } from './migration.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SecretsModule,
    MigrationEngineModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'migration-queue',
    }),
  ],
  providers: [MigrationProcessor],
})
export class WorkerModule {}
