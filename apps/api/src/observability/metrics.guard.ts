import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MetricsGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req) return true;

    const expectedToken = this.configService.get<string>('METRICS_AUTH_TOKEN') || 'edimp_metrics_secret_token';
    const providedToken = req.headers['x-metrics-token'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!providedToken || providedToken !== expectedToken) {
      throw new UnauthorizedException('Access to Prometheus metrics endpoint requires valid authentication credentials');
    }

    return true;
  }
}
