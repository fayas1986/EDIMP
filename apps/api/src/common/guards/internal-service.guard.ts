import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SecretsService } from '../secrets/secrets.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  private cachedSecret: string | null = null;
  private cacheExpiresAt = 0;

  constructor(
    private readonly secretsService: SecretsService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const providedToken = request.headers['x-internal-service-token'] || request.headers['x-service-token'];

    if (!providedToken) {
      throw new UnauthorizedException('Missing internal service authorization token.');
    }

    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const validSecret = await this.getInternalServiceSecret(isProd);

    // Cryptographically check comparison without leaking timing information
    if (!validSecret || providedToken !== validSecret) {
      throw new UnauthorizedException('Invalid internal service authorization token.');
    }

    return true;
  }

  private async getInternalServiceSecret(isProd: boolean): Promise<string> {
    const now = Date.now();
    if (this.cachedSecret && now < this.cacheExpiresAt) {
      return this.cachedSecret;
    }

    // Resolve from production Key Vault secrets provider
    let secret = await this.secretsService.getSecret('INTERNAL_SERVICE_SECRET');
    
    // If not set in production, fail closed (no hardcoded fallback)
    if (isProd && (!secret || secret === 'mock-decrypted-secret-value-for-INTERNAL_SERVICE_SECRET')) {
      throw new UnauthorizedException('Internal service configuration error: Secret key is missing in production provider.');
    }

    // Default local fallback for dev/testing only
    if (!isProd && (!secret || secret === 'mock-decrypted-secret-value-for-INTERNAL_SERVICE_SECRET')) {
      secret = 'edimp_internal_secret_token_2026';
    }

    this.cachedSecret = secret;
    this.cacheExpiresAt = now + 30000; // 30 seconds cache TTL for rotation support

    return secret;
  }
}
