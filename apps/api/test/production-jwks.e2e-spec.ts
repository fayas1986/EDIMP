import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as crypto from 'crypto';
import * as http from 'http';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RateLimiterGuard } from '../src/common/guards/rate-limiter.guard';

jest.setTimeout(30000);

describe('Production OIDC & JWKS Key Rotation E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwksServer: http.Server;
  let jwksPort: number;
  let rateLimitSpy: jest.SpyInstance;
  let originalCanActivate: any;
  
  // JWKS keystore
  const keys: any[] = [];
  let shouldFail = false;

  // RSA Key Pairs
  let privateKey1: crypto.KeyObject;
  let publicKey1: crypto.KeyObject;
  let privateKey2: crypto.KeyObject;
  let publicKey2: crypto.KeyObject;

  let tenant: any;
  let workspace: any;
  let user: any;

  beforeAll(async () => {
    // Save original RateLimiterGuard method to prevent infinite recursion
    originalCanActivate = RateLimiterGuard.prototype.canActivate;

    // 1. Generate RSA Keypairs
    const keypair1 = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    privateKey1 = keypair1.privateKey;
    publicKey1 = keypair1.publicKey;

    const keypair2 = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    privateKey2 = keypair2.privateKey;
    publicKey2 = keypair2.publicKey;

    // Export public keys as JWK
    const jwk1 = publicKey1.export({ format: 'jwk' });
    keys.push({
      ...jwk1,
      kid: 'key-1',
      use: 'sig',
      alg: 'RS256',
    });

    // 2. Start mock JWKS HTTP server
    jwksServer = http.createServer((req, res) => {
      if (shouldFail) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
        return;
      }
      if (req.url === '/jwks') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ keys }));
        return;
      }
      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) => {
      jwksServer.listen(0, '127.0.0.1', () => {
        const addr = jwksServer.address() as any;
        jwksPort = addr.port;
        resolve();
      });
    });

    // 3. Configure environment variables for Production Mode
    process.env.NODE_ENV = 'production';
    process.env.OIDC_JWKS_URI = `http://127.0.0.1:${jwksPort}/jwks`;
    process.env.JWT_ISSUER = 'https://login.microsoftonline.com/test-tenant/v2.0';
    process.env.JWT_AUDIENCE = 'api://test-audience';

    // 4. Mock RateLimiterGuard globally to bypass rate limiting for auth tests
    rateLimitSpy = jest.spyOn(RateLimiterGuard.prototype, 'canActivate')
      .mockImplementation(() => Promise.resolve(true));

    // 5. Initialize NestJS App
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);

    // 6. Clean up previous runs if any
    await prisma.workspaceMember.deleteMany({ where: { user: { email: 'prod.user@tenant.com' } } });
    await prisma.tenantMember.deleteMany({ where: { user: { email: 'prod.user@tenant.com' } } });
    await prisma.user.deleteMany({ where: { email: 'prod.user@tenant.com' } });
    await prisma.workspace.deleteMany({ where: { name: 'Prod Workspace' } });
    await prisma.tenant.deleteMany({ where: { name: 'Prod Tenant' } });

    // 7. Seed user and organization membership with externalIdentityId matching our OIDC token
    tenant = await prisma.tenant.create({ data: { name: 'Prod Tenant' } });
    user = await prisma.user.create({
      data: {
        email: 'prod.user@tenant.com',
        name: 'Prod User',
        externalIdentityId: 'oid-prod-user-123',
      },
    });
    await prisma.tenantMember.create({ data: { tenantId: tenant.id, userId: user.id, role: 'ADMIN' } });
    workspace = await prisma.workspace.create({ data: { tenantId: tenant.id, name: 'Prod Workspace' } });
    await prisma.workspaceMember.create({ data: { workspaceId: workspace.id, userId: user.id, role: 'OWNER' } });
  });

  afterAll(async () => {
    rateLimitSpy.mockRestore();
    await app.close();
    await new Promise<void>((resolve) => jwksServer.close(() => resolve()));
    
    // Cleanup env
    delete process.env.OIDC_JWKS_URI;
    delete process.env.JWT_ISSUER;
    delete process.env.JWT_AUDIENCE;
    process.env.NODE_ENV = 'development';
  });

  describe('OIDC RS256 Verification in Production', () => {
    it('MUST accept valid RS256 token signed by key in JWKS and match user by externalIdentityId', async () => {
      const privatePem = privateKey1.export({ format: 'pem', type: 'pkcs8' }) as string;
      const token = jwt.sign(
        {
          email: user.email,
          oid: user.externalIdentityId,
          iss: 'https://login.microsoftonline.com/test-tenant/v2.0',
          aud: 'api://test-audience',
        },
        privatePem,
        {
          algorithm: 'RS256',
          keyid: 'key-1',
          expiresIn: '1h',
        }
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/tenants')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('MUST reject symmetric HS256 tokens in production mode (No secret fallback)', async () => {
      const hs256Token = jwt.sign(
        {
          email: user.email,
          oid: user.externalIdentityId,
          iss: 'https://login.microsoftonline.com/test-tenant/v2.0',
          aud: 'api://test-audience',
        },
        'some-random-symmetric-secret-key-that-should-never-be-used',
        {
          algorithm: 'HS256',
          keyid: 'key-1',
          expiresIn: '1h',
        }
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/tenants')
        .set('Authorization', `Bearer ${hs256Token}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('invalid algorithm');
    });

    it('MUST reject token signed with a key not listed in the JWKS (Fail Closed)', async () => {
      // Use privateKey2 but don't add publicKey2 to JWKS yet
      const privatePem2 = privateKey2.export({ format: 'pem', type: 'pkcs8' }) as string;
      const token = jwt.sign(
        {
          email: user.email,
          oid: user.externalIdentityId,
          iss: 'https://login.microsoftonline.com/test-tenant/v2.0',
          aud: 'api://test-audience',
        },
        privatePem2,
        {
          algorithm: 'RS256',
          keyid: 'key-2',
          expiresIn: '1h',
        }
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/tenants')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
    });

    it('MUST reject requests and fail closed with 401 if JWKS endpoint is offline or errors out', async () => {
      shouldFail = true;

      const privatePem = privateKey1.export({ format: 'pem', type: 'pkcs8' }) as string;
      const token = jwt.sign(
        {
          email: user.email,
          oid: user.externalIdentityId,
          iss: 'https://login.microsoftonline.com/test-tenant/v2.0',
          aud: 'api://test-audience',
        },
        privatePem,
        {
          algorithm: 'RS256',
          keyid: 'key-offline', // Use non-cached kid
          expiresIn: '1h',
        }
      );

      try {
        const res = await request(app.getHttpServer())
          .get('/api/v1/tenants')
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(401);
      } finally {
        shouldFail = false;
      }
    });

    it('MUST support JWKS Key Rotation by dynamically fetching newly appended keys', async () => {
      // 1. Add key-2 to active JWKS keys list
      const jwk2 = publicKey2.export({ format: 'jwk' });
      keys.push({
        ...jwk2,
        kid: 'key-2',
        use: 'sig',
        alg: 'RS256',
      });

      // 2. Sign token with privateKey2
      const privatePem2 = privateKey2.export({ format: 'pem', type: 'pkcs8' }) as string;
      const token = jwt.sign(
        {
          email: user.email,
          oid: user.externalIdentityId,
          iss: 'https://login.microsoftonline.com/test-tenant/v2.0',
          aud: 'api://test-audience',
        },
        privatePem2,
        {
          algorithm: 'RS256',
          keyid: 'key-2',
          expiresIn: '1h',
        }
      );

      // 3. Request should succeed as JWKS now contains key-2 public key
      const res = await request(app.getHttpServer())
        .get('/api/v1/tenants')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Production Rate Limiting Fail-Closed Validation', () => {
    it('MUST fail closed and return 503 Service Unavailable if Redis is not configured or down in production', async () => {
      // Temporarily delegate implementation back to original method to run real logic
      rateLimitSpy.mockImplementation(function(context) {
        return originalCanActivate.call(this, context);
      });

      const privatePem = privateKey1.export({ format: 'pem', type: 'pkcs8' }) as string;
      const token = jwt.sign(
        {
          email: user.email,
          oid: user.externalIdentityId,
          iss: 'https://login.microsoftonline.com/test-tenant/v2.0',
          aud: 'api://test-audience',
        },
        privatePem,
        {
          algorithm: 'RS256',
          keyid: 'key-1',
          expiresIn: '1h',
        }
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/tenants')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(503);
      expect(res.body.message).toContain('Production Rate Limiter service unavailable');
      
      // Re-enable mock bypass
      rateLimitSpy.mockImplementation(() => Promise.resolve(true));
    });
  });
});
