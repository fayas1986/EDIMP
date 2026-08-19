import { Module, Global } from '@nestjs/common';
import { ObservabilityService } from './observability.service';
import { ObservabilityController } from './observability.controller';
import { StructuredLoggerService } from './structured-logger.service';
import { TraceInterceptor } from './trace.interceptor';

@Global()
@Module({
  controllers: [ObservabilityController],
  providers: [
    ObservabilityService,
    StructuredLoggerService,
    TraceInterceptor,
  ],
  exports: [
    ObservabilityService,
    StructuredLoggerService,
    TraceInterceptor,
  ],
})
export class ObservabilityModule {}
