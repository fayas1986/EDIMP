import {
  Controller,
  Get,
  Param,
  Query,
  Header,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ObservabilityService } from './observability.service';
import { AuditLogQueryDto, AuditLogResponse, PaginatedResult } from '@edimp/contracts';
import { MetricsGuard } from './metrics.guard';

@ApiTags('Observability, Metrics & Audit')
@Controller()
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Get('metrics')
  @UseGuards(MetricsGuard)
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Expose Prometheus metrics format (Secured by METRICS_AUTH_TOKEN)' })
  @ApiHeader({ name: 'x-metrics-token', required: false, description: 'Dedicated metrics authentication credential' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics text exposition format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing metrics token' })
  getMetrics(): string {
    return this.observabilityService.getPrometheusMetrics();
  }

  @Get('workspaces/:workspaceId/audit-logs')
  @ApiOperation({ summary: 'List workspace append-only audit log history' })
  @ApiResponse({ status: 200, description: 'List of sanitized audit log records' })
  async listAuditLogs(
    @Param('workspaceId') workspaceId: string,
    @Query() query: AuditLogQueryDto,
  ): Promise<PaginatedResult<AuditLogResponse>> {
    return this.observabilityService.listAuditLogs(workspaceId, query);
  }
}
