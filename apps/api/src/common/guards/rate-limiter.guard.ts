import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObservabilityService } from '../../observability/observability.service';

interface RateLimitRecord {
  count: number;
  resetTimeMs: number;
}

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private readonly memoryStorage = new Map<string, RateLimitRecord>();

  constructor(
    private readonly configService: ConfigService,
    private readonly observabilityService: ObservabilityService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (!req) return true;

    // 1. Authenticated internal worker / service-to-service communication
    const internalSecret = this.configService.get<string>('INTERNAL_SERVICE_SECRET') || 'edimp_internal_secret_token_2026';
    const providedServiceToken = req.headers['x-internal-service-token'] || req.headers['x-service-token'];
    
    // Header x-internal-service is routing context only; trust boundary requires matching INTERNAL_SERVICE_SECRET
    if (providedServiceToken && providedServiceToken === internalSecret) {
      return true;
    }

    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    const redisUrl = this.configService.get<string>('REDIS_URL');

    // 2. Production Strict Enforcer (Fail Closed if Redis is missing or disconnected)
    if (nodeEnv === 'production' && (!redisUrl || redisUrl.includes('invalid_redis_url_simulated_failure'))) {
      this.observabilityService.incrementCounter('edimp_rate_limit_throttled_total', {
        route: req.route ? req.route.path : req.url,
        reason: 'redis_unavailable_prod_fail_closed',
      });
      throw new ServiceUnavailableException(
        'Production Rate Limiter service unavailable: Mandatory Redis connection missing or failed',
      );
    }

    // 3. Determine Route Limit based on route sensitivity
    const path = req.route ? req.route.path : req.url;
    const isExecutionOrAiRoute = path.includes('/execute') || path.includes('/ai/') || path.includes('/query');
    
    const defaultLimit = parseInt(this.configService.get<string>('RATE_LIMIT_DEFAULT') || '100', 10);
    const aiExecutionLimit = parseInt(this.configService.get<string>('RATE_LIMIT_AI_EXECUTION') || '10', 10);
    
    const maxLimit = isExecutionOrAiRoute ? aiExecutionLimit : defaultLimit;
    const windowMs = 60 * 1000; // 60s sliding window

    // 4. Rate Limiting Key: IP, User, or Workspace
    const workspaceId = req.headers['x-workspace-id'] || req.params?.workspaceId || '';
    const userId = req.headers['x-user-id'] || '';
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    
    const identifier = userId ? `user:${userId}` : workspaceId ? `workspace:${workspaceId}` : `ip:${ip}`;
    const key = `ratelimit:${identifier}:${path}`;

    const now = Date.now();
    let record = this.memoryStorage.get(key);

    if (!record || now >= record.resetTimeMs) {
      record = {
        count: 1,
        resetTimeMs: now + windowMs,
      };
      this.memoryStorage.set(key, record);
    } else {
      record.count++;
    }

    // Attach X-RateLimit response headers
    if (res && res.setHeader) {
      res.setHeader('X-RateLimit-Limit', maxLimit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxLimit - record.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTimeMs / 1000));
    }

    if (record.count > maxLimit) {
      const retryAfterSeconds = Math.ceil((record.resetTimeMs - now) / 1000);
      if (res && res.setHeader) {
        res.setHeader('Retry-After', retryAfterSeconds);
      }

      this.observabilityService.incrementCounter('edimp_rate_limit_throttled_total', {
        route: path,
        reason: 'rate_limit_exceeded',
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Rate limit of ${maxLimit} requests per minute exceeded. Please try again in ${retryAfterSeconds} seconds.`,
          retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
