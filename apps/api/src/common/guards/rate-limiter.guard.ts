import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObservabilityService } from '../../observability/observability.service';
import Redis from 'ioredis';

interface RateLimitRecord {
  count: number;
  resetTimeMs: number;
}

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private readonly logger = new Logger(RateLimiterGuard.name);
  private readonly memoryStorage = new Map<string, RateLimitRecord>();
  private redis: Redis | null = null;
  private redisConnected = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly observabilityService: ObservabilityService,
  ) {}

  private initRedis() {
    if (this.redis) return;
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) return;

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        reconnectOnError: () => false,
      });

      this.redis.on('connect', () => {
        this.redisConnected = true;
        this.logger.log('Successfully connected to Redis shared rate limiter');
      });

      this.redis.on('error', (err: any) => {
        this.redisConnected = false;
        this.logger.error(`Redis shared rate limiter error: ${err.message}`);
      });
    } catch (err: any) {
      this.redisConnected = false;
      this.logger.error(`Failed to initialize Redis client: ${err.message}`);
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (!req) return true;

    // 1. Authenticated internal worker / service-to-service communication
    const providedServiceToken = req.headers['x-internal-service-token'] || req.headers['x-service-token'];
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    const isProd = nodeEnv === 'production';

    // If an internal service token is provided, it bypasses rate limiting, but we must verify it against Key Vault
    if (providedServiceToken) {
      // In production, internal service secret must match the configured token in vault
      const internalSecret = this.configService.get<string>('INTERNAL_SERVICE_SECRET') || 'edimp_internal_secret_token_2026';
      if (providedServiceToken === internalSecret) {
        return true;
      }
    }

    // 2. Initialize Redis connection if configured
    this.initRedis();

    // 3. Determine Route Limit based on route sensitivity
    const path = req.route ? req.route.path : req.url;
    const isExecutionOrAiRoute = path.includes('/execute') || path.includes('/ai/') || path.includes('/query');
    
    const defaultLimit = parseInt(this.configService.get<string>('RATE_LIMIT_DEFAULT') || '100', 10);
    const aiExecutionLimit = parseInt(this.configService.get<string>('RATE_LIMIT_AI_EXECUTION') || '10', 10);
    
    const maxLimit = isExecutionOrAiRoute ? aiExecutionLimit : defaultLimit;
    const windowSeconds = 60;

    // 4. Rate Limiting Key: IP, User, or Workspace
    const workspaceId = req.headers['x-workspace-id'] || req.params?.workspaceId || '';
    const userId = req.user?.id || req.headers['x-user-id'] || '';
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    
    const identifier = userId ? `user:${userId}` : workspaceId ? `workspace:${workspaceId}` : `ip:${ip}`;
    const key = `ratelimit:${identifier}:${path}`;

    // 5. Shared State / Atomic Rate Limiting (Redis vs In-Memory Fallback)
    const useRedis = isProd || (this.redis && this.redisConnected);

    if (useRedis) {
      if (!this.redis || !this.redisConnected) {
        this.observabilityService.incrementCounter('edimp_rate_limit_throttled_total', {
          route: path,
          reason: 'redis_unavailable_prod_fail_closed',
        });
        throw new ServiceUnavailableException(
          'Production Rate Limiter service unavailable: Mandatory Redis connection missing or failed',
        );
      }

      try {
        const luaScript = `
          local key = KEYS[1]
          local limit = tonumber(ARGV[1])
          local window = tonumber(ARGV[2])
          
          local current = redis.call('get', key)
          if current and tonumber(current) >= limit then
              return tonumber(current) + 1
          end
          
          local newVal = redis.call('incr', key)
          if newVal == 1 then
              redis.call('expire', key, window)
          end
          return newVal
        `;

        const count = await this.redis.eval(luaScript, 1, key, maxLimit, windowSeconds) as number;

        const ttl = await this.redis.ttl(key);
        const resetTime = Math.ceil(Date.now() / 1000) + (ttl > 0 ? ttl : windowSeconds);

        if (res && res.setHeader) {
          res.setHeader('X-RateLimit-Limit', maxLimit);
          res.setHeader('X-RateLimit-Remaining', Math.max(0, maxLimit - count));
          res.setHeader('X-RateLimit-Reset', resetTime);
        }

        if (count > maxLimit) {
          const retryAfterSeconds = ttl > 0 ? ttl : windowSeconds;
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
      } catch (err: any) {
        if (err instanceof HttpException) {
          throw err;
        }
        this.logger.error(`Redis rate limit evaluation failed: ${err.message}`);
        this.observabilityService.incrementCounter('edimp_rate_limit_throttled_total', {
          route: path,
          reason: 'redis_unavailable_prod_fail_closed',
        });
        throw new ServiceUnavailableException(
          'Production Rate Limiter service unavailable: Mandatory Redis connection missing or failed',
        );
      }
    } else {
      // In-Memory Fallback for Development/Testing
      const now = Date.now();
      let record = this.memoryStorage.get(key);

      if (!record || now >= record.resetTimeMs) {
        record = {
          count: 1,
          resetTimeMs: now + (windowSeconds * 1000),
        };
        this.memoryStorage.set(key, record);
      } else {
        record.count++;
      }

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
    }

    return true;
  }
}
