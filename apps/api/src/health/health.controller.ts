import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health & Readiness Probes')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('liveness')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe (Process ping check - survives DB downtime)' })
  @ApiResponse({ status: 200, description: 'Process is alive and accepting HTTP connections' })
  checkLiveness() {
    return this.healthService.checkLiveness();
  }

  @Get('readiness')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness probe (Evaluates DB connection & memory thresholds)' })
  @ApiResponse({ status: 200, description: 'Instance is ready to serve traffic' })
  @ApiResponse({ status: 503, description: 'One or more critical dependencies unavailable' })
  checkReadiness() {
    return this.healthService.checkReadiness();
  }
}
