import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as https from 'https';
import * as http from 'http';
import * as crypto from 'crypto';

export interface DecodedJwtPayload {
  sub?: string;
  email?: string;
  upn?: string;
  oid?: string;
  tid?: string;
  roles?: string[];
  iss?: string;
  aud?: string;
  [key: string]: any;
}

@Injectable()
export class JwtVerifierService {
  private readonly logger = new Logger(JwtVerifierService.name);
  private jwksCache = new Map<string, string>();

  constructor(private configService: ConfigService) {}

  async verifyToken(token: string): Promise<DecodedJwtPayload> {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || typeof decodedHeader === 'string' || !decodedHeader.header) {
      throw new UnauthorizedException('Invalid JWT structure');
    }

    const secretOrKey = await this.getSigningKey(decodedHeader, isProd);

    const verifyOptions: jwt.VerifyOptions = {
      algorithms: isProd ? ['RS256'] : ['RS256', 'HS256'],
    };

    const issuer = this.configService.get<string>('OIDC_ISSUER');
    if (issuer) {
      verifyOptions.issuer = issuer;
    }

    const audience = this.configService.get<string>('OIDC_AUDIENCE');
    if (audience) {
      verifyOptions.audience = audience;
    }

    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        secretOrKey,
        verifyOptions,
        (err, decoded) => {
          if (err || !decoded) {
            this.logger.error(`JWT Verification Failed: ${err?.message}`);
            return reject(new UnauthorizedException(`Invalid or expired token: ${err?.message}`));
          }
          
          const payload = decoded as DecodedJwtPayload;
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && now >= payload.exp) {
            return reject(new UnauthorizedException('Token has expired'));
          }
          if (payload.nbf && now < payload.nbf) {
            return reject(new UnauthorizedException('Token is not active yet'));
          }

          resolve(payload);
        }
      );
    });
  }

  private async getSigningKey(decodedHeader: jwt.Jwt, isProd: boolean): Promise<string> {
    const jwksUri = this.configService.get<string>('OIDC_JWKS_URI');
    const kid = decodedHeader.header.kid;

    if (isProd) {
      if (!jwksUri) {
        throw new UnauthorizedException('OIDC_JWKS_URI is not configured in production');
      }
      if (!kid) {
        throw new UnauthorizedException('JWT header missing key ID (kid)');
      }
      if (this.jwksCache.has(kid)) {
        return this.jwksCache.get(kid)!;
      }
      try {
        const fetchedKey = await this.fetchJwksKey(jwksUri, kid);
        if (fetchedKey) {
          this.jwksCache.set(kid, fetchedKey);
          return fetchedKey;
        }
      } catch (err: any) {
        this.logger.error(`JWKS key fetch failed for kid '${kid}' in production: ${err?.message}`);
      }
      throw new UnauthorizedException(`JWKS signing key not found or endpoint unavailable for kid '${kid}'`);
    }

    // Non-production fallback
    const secret = this.configService.get<string>('JWT_SECRET') || 'edimp-test-jwt-secret-key-2026';
    if (jwksUri && kid) {
      if (this.jwksCache.has(kid)) {
        return this.jwksCache.get(kid)!;
      }
      try {
        const fetchedKey = await this.fetchJwksKey(jwksUri, kid);
        if (fetchedKey) {
          this.jwksCache.set(kid, fetchedKey);
          return fetchedKey;
        }
      } catch (err: any) {
        this.logger.warn(`JWKS key fetch failed for kid '${kid}': ${err?.message}. Falling back to configured secret.`);
      }
    }

    return secret;
  }

  private fetchJwksKey(urlStr: string, kid: string): Promise<string | null> {
    return new Promise((resolve) => {
      const client = urlStr.startsWith('https') ? https : http;
      client.get(urlStr, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            const keyObj = parsed.keys?.find((k: any) => k.kid === kid);
            if (keyObj) {
              if (keyObj.x5c && keyObj.x5c.length > 0) {
                const cert = `-----BEGIN CERTIFICATE-----\n${keyObj.x5c[0]}\n-----END CERTIFICATE-----`;
                resolve(cert);
                return;
              }
              try {
                const pubKey = crypto.createPublicKey({
                  key: keyObj,
                  format: 'jwk',
                });
                const pem = pubKey.export({ format: 'pem', type: 'spki' }) as string;
                resolve(pem);
                return;
              } catch (err: any) {
                this.logger.error(`Failed to construct PEM from JWK components: ${err.message}`);
              }
            }
          } catch {
            // parse error
          }
          resolve(null);
        });
      }).on('error', () => resolve(null));
    });
  }
}
