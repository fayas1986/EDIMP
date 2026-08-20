import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as https from 'https';
import * as http from 'http';

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
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || typeof decodedHeader === 'string' || !decodedHeader.header) {
      throw new UnauthorizedException('Invalid JWT structure');
    }

    const secretOrKey = await this.getSigningKey(decodedHeader);

    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        secretOrKey,
        {
          algorithms: ['RS256', 'HS256'],
        },
        (err, decoded) => {
          if (err || !decoded) {
            this.logger.error(`JWT Verification Failed: ${err?.message}`);
            return reject(new UnauthorizedException(`Invalid or expired token: ${err?.message}`));
          }
          resolve(decoded as DecodedJwtPayload);
        }
      );
    });
  }

  private async getSigningKey(decodedHeader: jwt.Jwt): Promise<string> {
    const jwksUri = this.configService.get<string>('OIDC_JWKS_URI');
    const secret = this.configService.get<string>('JWT_SECRET') || 'edimp-test-jwt-secret-key-2026';

    const kid = decodedHeader.header.kid;
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
            if (keyObj && keyObj.x5c && keyObj.x5c.length > 0) {
              const cert = `-----BEGIN CERTIFICATE-----\n${keyObj.x5c[0]}\n-----END CERTIFICATE-----`;
              resolve(cert);
              return;
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
