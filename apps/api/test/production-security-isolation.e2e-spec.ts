import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RateLimiterGuard } from '../src/common/guards/rate-limiter.guard';

jest.setTimeout(30000);

describe('Production Security & Hierarchical Isolation E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenant1: any;
  let tenant2: any;
  let workspace1: any;
  let workspace2: any;
  let user1: any;
  let user2: any;
  let validTokenUser1: string;
  let validTokenUser2: string;
  let rateLimitSpy: jest.SpyInstance;

  const testSecret = 'edimp-test-jwt-secret-key-2026';

  beforeAll(async () => {
    rateLimitSpy = jest.spyOn(RateLimiterGuard.prototype, 'canActivate')
      .mockImplementation(() => Promise.resolve(true));

    process.env.JWT_SECRET = testSecret;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);

    // Clean DB in complete cascade order
    await prisma.aiQueryMessage.deleteMany();
    await prisma.aiQuerySession.deleteMany();
    await prisma.aiAnomalyAnalysis.deleteMany();
    await prisma.aiDriftRepairSuggestion.deleteMany();
    await prisma.aiMappingSuggestion.deleteMany();
    await prisma.aiAgentTask.deleteMany();

    await prisma.errorResolutionLog.deleteMany();
    await prisma.errorManualOverride.deleteMany();
    await prisma.recordError.deleteMany();
    await prisma.reconciliationObservation.deleteMany();
    await prisma.reconciliationDiscrepancy.deleteMany();
    await prisma.reconciliationBatch.deleteMany();
    await prisma.reconciliationRun.deleteMany();
    await prisma.reconciliationConfigurationVersion.deleteMany();
    await prisma.reconciliationJob.deleteMany();
    await prisma.migrationRecord.deleteMany();
    await prisma.jobBatch.deleteMany();
    await prisma.migrationRun.deleteMany();
    await prisma.migrationIdentity.deleteMany();
    await prisma.migrationConfigurationVersion.deleteMany();
    await prisma.migrationJob.deleteMany();
    await prisma.pipelineExecutionLog.deleteMany();
    await prisma.pipelineExecutionRun.deleteMany();
    await prisma.pipelineJob.deleteMany();
    await prisma.fieldValidationRule.deleteMany();
    await prisma.validationVersion.deleteMany();
    await prisma.validationSet.deleteMany();
    await prisma.fieldTransformation.deleteMany();
    await prisma.transformationVersion.deleteMany();
    await prisma.transformationSet.deleteMany();
    await prisma.fieldMapping.deleteMany();
    await prisma.entityMapping.deleteMany();
    await prisma.mappingVersion.deleteMany();
    await prisma.mappingSet.deleteMany();
    await prisma.canonicalField.deleteMany();
    await prisma.canonicalEntity.deleteMany();
    await prisma.canonicalModelVersion.deleteMany();
    await prisma.canonicalModel.deleteMany();

    await prisma.dataProfileMetric.deleteMany();
    await prisma.dataProfileRun.deleteMany();
    await prisma.dataField.deleteMany();
    await prisma.dataEntity.deleteMany();
    await prisma.dataModelVersion.deleteMany();
    await prisma.dataModel.deleteMany();
    await prisma.credentialReference.deleteMany();
    await prisma.connection.deleteMany();
    await prisma.connectorType.deleteMany();
    await prisma.environment.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.tenantMember.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.user.deleteMany();

    // Create Tenant 1 & User 1
    tenant1 = await prisma.tenant.create({ data: { name: 'Tenant Alpha' } });
    user1 = await prisma.user.create({ data: { email: 'alpha.user@tenant1.com', name: 'Alpha User' } });
    await prisma.tenantMember.create({ data: { tenantId: tenant1.id, userId: user1.id, role: 'ADMIN' } });
    workspace1 = await prisma.workspace.create({ data: { tenantId: tenant1.id, name: 'Alpha Workspace 1' } });
    await prisma.workspaceMember.create({ data: { workspaceId: workspace1.id, userId: user1.id, role: 'OWNER' } });

    // Create Tenant 2 & User 2
    tenant2 = await prisma.tenant.create({ data: { name: 'Tenant Beta' } });
    user2 = await prisma.user.create({ data: { email: 'beta.user@tenant2.com', name: 'Beta User' } });
    await prisma.tenantMember.create({ data: { tenantId: tenant2.id, userId: user2.id, role: 'ADMIN' } });
    workspace2 = await prisma.workspace.create({ data: { tenantId: tenant2.id, name: 'Beta Workspace 2' } });
    await prisma.workspaceMember.create({ data: { workspaceId: workspace2.id, userId: user2.id, role: 'OWNER' } });

    // Issue JWTs
    validTokenUser1 = jwt.sign({ email: user1.email, sub: user1.id }, testSecret, { expiresIn: '1h' });
    validTokenUser2 = jwt.sign({ email: user2.email, sub: user2.id }, testSecret, { expiresIn: '1h' });
  });

  afterAll(async () => {
    rateLimitSpy.mockRestore();
    await app.close();
  });

  describe('1. Authentication Guard Hardening', () => {
    it('MUST reject requests with x-user-id header and missing Bearer token with 401 Unauthorized', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const res = await request(app.getHttpServer())
          .get('/api/v1/tenants')
          .set('x-user-id', user1.id);

        expect(res.status).toBe(401);
        expect(res.body.message).toContain('x-user-id header authentication is prohibited in production.');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('MUST reject missing Authorization header with 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/tenants');
      expect(res.status).toBe(401);
    });

    it('MUST reject invalid JWT token with 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/tenants')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(res.status).toBe(401);
    });

    it('MUST reject expired JWT token with 401 Unauthorized', async () => {
      const expiredToken = jwt.sign({ email: user1.email, sub: user1.id }, testSecret, { expiresIn: '-1s' });
      const res = await request(app.getHttpServer())
        .get('/api/v1/tenants')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it('MUST accept valid OIDC/Entra ID JWT token and return authenticated user tenant data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/tenants')
        .set('Authorization', `Bearer ${validTokenUser1}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('2. Hierarchical Tenant & Workspace Isolation', () => {
    it('MUST allow User 1 to access Tenant 1 resources', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenant1.id}`)
        .set('Authorization', `Bearer ${validTokenUser1}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(tenant1.id);
    });

    it('MUST reject User 1 attempting to access Tenant 2 resources with 403 Forbidden (Cross-Tenant Isolation)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenant2.id}`)
        .set('Authorization', `Bearer ${validTokenUser1}`);

      expect(res.status).toBe(403);
    });

    it('MUST reject User 1 attempting to create resource in Workspace 2 with 403 Forbidden (Cross-Workspace Isolation)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace2.id}/migration-jobs`)
        .set('Authorization', `Bearer ${validTokenUser1}`)
        .send({
          environmentId: 'env-fake',
          name: 'Unauthorized Job Creation Attempt',
        });

      expect(res.status).toBe(403);
    });

    it('MUST allow User 2 to access Workspace 2 and isolate it from User 1', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenant2.id}/workspaces/${workspace2.id}`)
        .set('Authorization', `Bearer ${validTokenUser2}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(workspace2.id);
    });
  });
});
