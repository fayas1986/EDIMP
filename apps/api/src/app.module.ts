import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_GUARD, APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenantsModule } from './tenants/tenants.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { EnvironmentsModule } from './environments/environments.module';
import { ConnectorTypesModule } from './connector-types/connector-types.module';
import { ConnectionsModule } from './connections/connections.module';
import { DataModelsModule } from './data-models/data-models.module';
import { DataProfilesModule } from './data-profiles/data-profiles.module';
import { CanonicalModelsModule } from './canonical-models/canonical-models.module';
import { MappingSetsModule } from './mapping-sets/mapping-sets.module';
import { TransformationsModule } from './transformations/transformations.module';
import { ValidationsModule } from './validations/validations.module';
import { PipelineJobsModule } from './pipeline-jobs/pipeline-jobs.module';
import { MigrationEngineModule } from './migration-engine/migration-engine.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { ErrorManagementModule } from './error-management/error-management.module';
import { AiAgentsModule } from './ai-agents/ai-agents.module';
import { ObservabilityModule } from './observability/observability.module';
import { HealthModule } from './health/health.module';
import { WorkerClusterModule } from './worker-cluster/worker-cluster.module';
import { TraceInterceptor } from './observability/trace.interceptor';
import { RateLimiterGuard } from './common/guards/rate-limiter.guard';

import { AuthModule } from './common/auth/auth.module';
import { SecretsModule } from './common/secrets/secrets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    SecretsModule,
    TenantsModule,
    WorkspacesModule,
    EnvironmentsModule,
    ConnectorTypesModule,
    ConnectionsModule,
    DataModelsModule,
    DataProfilesModule,
    CanonicalModelsModule,
    MappingSetsModule,
    TransformationsModule,
    ValidationsModule,
    PipelineJobsModule,
    MigrationEngineModule,
    ReconciliationModule,
    ErrorManagementModule,
    AiAgentsModule,
    ObservabilityModule,
    HealthModule,
    WorkerClusterModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TraceInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}

