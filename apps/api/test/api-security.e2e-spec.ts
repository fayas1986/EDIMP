import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase } from './cleanup';

describe('API Architecture & Security Hardening (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tenantA_Id: string;
  let workspaceA_Id: string;
  let userA_Id: string;

  let tenantB_Id: string;
  let workspaceB_Id: string;
  let userB_Id: string;

  let connectionA_Id: string;
  let dataModelA_Id: string;
  let migrationRunA_Id: string;
  let jobA_Id: string;
  let aiSuggestionA_Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);

    // CLEANUP
    await cleanDatabase(prisma);

    // SEED TENANT A & USER A
    const userA = await prisma.user.create({
      data: { email: 'usera_sec@edimp.io', name: 'User A' },
    });
    userA_Id = userA.id;

    const tenantA = await prisma.tenant.create({
      data: { name: 'Tenant A' },
    });
    tenantA_Id = tenantA.id;

    const workspaceA = await prisma.workspace.create({
      data: { tenantId: tenantA_Id, name: 'Workspace A' },
    });
    workspaceA_Id = workspaceA.id;

    await prisma.workspaceMember.create({
      data: { workspaceId: workspaceA_Id, userId: userA_Id, role: 'OWNER' },
    });

    const envA = await prisma.environment.create({
      data: { workspaceId: workspaceA_Id, name: 'Prod A' },
    });

    // SEED TENANT B & USER B
    const userB = await prisma.user.create({
      data: { email: 'userb_sec@edimp.io', name: 'User B' },
    });
    userB_Id = userB.id;

    const tenantB = await prisma.tenant.create({
      data: { name: 'Tenant B' },
    });
    tenantB_Id = tenantB.id;

    const workspaceB = await prisma.workspace.create({
      data: { tenantId: tenantB_Id, name: 'Workspace B' },
    });
    workspaceB_Id = workspaceB.id;

    await prisma.workspaceMember.create({
      data: { workspaceId: workspaceB_Id, userId: userB_Id, role: 'OWNER' },
    });

    // SEED RESOURCE A BELONGING TO WORKSPACE A
    const connectorType = await prisma.connectorType.create({
      data: { name: 'PostgreSQL Sec', category: 'DATABASE', capabilities: {} },
    });

    const connA = await prisma.connection.create({
      data: { environmentId: envA.id, connectorTypeId: connectorType.id, name: 'Connection A' },
    });
    connectionA_Id = connA.id;

    const modelA = await prisma.dataModel.create({
      data: { connectionId: connA.id, name: 'Model A' },
    });
    dataModelA_Id = modelA.id;

    const modelVerA = await prisma.dataModelVersion.create({
      data: { dataModelId: modelA.id, version: 1 },
    });

    const canonicalModelA = await prisma.canonicalModel.create({
      data: { workspaceId: workspaceA_Id, name: 'Canonical Model Sec' },
    });
    const canonicalVerA = await prisma.canonicalModelVersion.create({
      data: { canonicalModelId: canonicalModelA.id, version: 1 },
    });

    const mappingSetA = await prisma.mappingSet.create({
      data: { workspaceId: workspaceA_Id, name: 'Mapping Set Sec', direction: 'SOURCE_TO_CANONICAL' },
    });
    const mappingVerA = await prisma.mappingVersion.create({
      data: {
        mappingSetId: mappingSetA.id,
        canonicalModelVersionId: canonicalVerA.id,
        dataModelVersionId: modelVerA.id,
        version: 1,
      },
    });

    const transSetA = await prisma.transformationSet.create({
      data: { workspaceId: workspaceA_Id, name: 'Trans Set Sec' },
    });
    const transVerA = await prisma.transformationVersion.create({
      data: { transformationSetId: transSetA.id, version: 1 },
    });

    const valSetA = await prisma.validationSet.create({
      data: { workspaceId: workspaceA_Id, name: 'Val Set Sec' },
    });
    const valVerA = await prisma.validationVersion.create({
      data: { validationSetId: valSetA.id, version: 1 },
    });

    const jobA = await prisma.migrationJob.create({
      data: { workspaceId: workspaceA_Id, environmentId: envA.id, name: 'Job A' },
    });
    jobA_Id = jobA.id;
    const configA = await prisma.migrationConfigurationVersion.create({
      data: {
        migrationJobId: jobA.id,
        version: 1,
        status: 'PUBLISHED',
        sourceConnectionId: connA.id,
        targetConnectionId: connA.id,
        sourceDataModelVersionId: modelVerA.id,
        targetDataModelVersionId: modelVerA.id,
        mappingVersionId: mappingVerA.id,
        transformationVersionId: transVerA.id,
        validationVersionId: valVerA.id,
      },
    });

    const runA = await prisma.migrationRun.create({
      data: { migrationConfigurationVersionId: configA.id, status: 'COMPLETED' },
    });
    migrationRunA_Id = runA.id;

    const agentTask = await prisma.aiAgentTask.create({
      data: {
        workspaceId: workspaceA_Id,
        environmentId: envA.id,
        agentType: 'MAPPING_SUGGESTION',
        inputHash: 'some-dummy-hash',
        taskParameters: {},
      },
    });

    const suggestionA = await prisma.aiMappingSuggestion.create({
      data: {
        taskId: agentTask.id,
        workspaceId: workspaceA_Id,
        sourceEntity: 'SourceTable',
        sourceField: 'SourceField',
        targetEntity: 'TargetTable',
        targetField: 'SomeField',
        status: 'PROPOSED',
        finalConfidenceScore: 0.95,
        reasoning: 'AI matched based on semantics',
        agentVersion: 'v1.0.0',
        algorithmVersion: 'v1',
      },
    });
    aiSuggestionA_Id = suggestionA.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. IDOR Protection (Cross-Tenant Direct Resource Access)', () => {
    it('GET /api/v1/connections/:id — Returns 403 when User B accesses Connection A', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/connections/${connectionA_Id}`)
        .set('x-user-id', userB_Id)
        .expect(403);
    });

    it('GET /api/v1/data-models/:id — Returns 403 when User B accesses DataModel A', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/data-models/${dataModelA_Id}`)
        .set('x-user-id', userB_Id)
        .expect(403);
    });

    it('GET /api/v1/migration-runs/:id — Returns 403 when User B accesses MigrationRun A', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/migration-runs/${migrationRunA_Id}`)
        .set('x-user-id', userB_Id)
        .expect(403);
    });

    it('POST /api/v1/migration-runs/:id/retry — Returns 403 when User B tries to retry MigrationRun A', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/migration-runs/${migrationRunA_Id}/retry`)
        .set('x-user-id', userB_Id)
        .send({ mode: 'TRANSIENT_ONLY' })
        .expect(403);
    });

    it('POST /api/v1/migration-runs/:id/resume — Returns 403 when User B tries to resume MigrationRun A', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/migration-runs/${migrationRunA_Id}/resume`)
        .set('x-user-id', userB_Id)
        .send({ batchSize: 100 })
        .expect(403);
    });

    it('POST /api/v1/migration-jobs/:id/execute — Returns 403 when User B tries to execute MigrationJob A', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/migration-jobs/${jobA_Id}/execute`)
        .set('x-user-id', userB_Id)
        .send({ batchSize: 1000 })
        .expect(403);
    });

    it('POST /api/v1/ai-suggestions/:id/accept — Returns 404 when User B tries to accept AI suggestion A in Workspace B', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/ai-suggestions/${aiSuggestionA_Id}/accept`)
        .set('x-user-id', userB_Id)
        .set('x-workspace-id', workspaceB_Id)
        .send({ targetFieldMapping: {} })
        .expect(404);
    });

    it('GET /api/v1/connections/:id — Returns 200 when User A accesses Connection A', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/connections/${connectionA_Id}`)
        .set('x-user-id', userA_Id)
        .expect(200);
    });
  });

  describe('2. Internal Service Cryptographic Authentication', () => {
    it('Rejects unauthenticated x-internal-service: true header without secret token', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceA_Id}/environments`)
        .set('x-internal-service', 'true')
        .set('x-user-id', userA_Id)
        .expect(200);

      // Verify that x-internal-service: true does NOT bypass rate limiting headers
      expect(res.headers['x-ratelimit-limit']).toBeDefined();
    });

    it('Exempts internal service call when cryptographically valid x-internal-service-token is provided', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceA_Id}/environments`)
        .set('x-user-id', userA_Id)
        .set('x-internal-service-token', 'edimp_internal_secret_token_2026')
        .expect(200);

      expect(res.headers['x-ratelimit-limit']).toBeUndefined();
    });
  });

  describe('3. Automated Prometheus Label Cardinality & Auth Verification', () => {
    it('Metrics Authentication: No token -> 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/metrics')
        .expect(401);
    });

    it('Metrics Authentication: Wrong token -> 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/metrics')
        .set('x-metrics-token', 'invalid_token_123')
        .expect(401);
    });

    it('Metrics Authentication: Correct token -> 200', async () => {
      const token = process.env.METRICS_AUTH_TOKEN || 'edimp_metrics_secret_token';
      await request(app.getHttpServer())
        .get('/api/v1/metrics')
        .set('x-metrics-token', token)
        .expect(200);
    });

    it('Automated Cardinality Test: Fails if high-cardinality labels are present in Prometheus metrics', async () => {
      const token = process.env.METRICS_AUTH_TOKEN || 'edimp_metrics_secret_token';
      const res = await request(app.getHttpServer())
        .get('/api/v1/metrics')
        .set('x-metrics-token', token)
        .expect(200);

      const metricsText = res.text;

      const forbiddenLabels = [
        'tenantId',
        'workspaceId',
        'userId',
        'workerId',
        'hostname',
        'traceId',
        'recordId',
        'migrationRunId',
        'connectionId',
      ];

      for (const label of forbiddenLabels) {
        expect(metricsText).not.toContain(`${label}=`);
      }
    });
  });

  describe('4. Unified Error Contract Verification', () => {
    it('Returns standardized error structure { statusCode, error, message, traceId } on 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/connections/non_existent_id')
        .set('x-user-id', userA_Id)
        .expect(404);

      expect(res.body.statusCode).toBe(404);
      expect(res.body.error).toBe('Not Found');
      expect(res.body.message).toBeDefined();
      expect(res.body.traceId).toBeDefined();
    });
  });
});
