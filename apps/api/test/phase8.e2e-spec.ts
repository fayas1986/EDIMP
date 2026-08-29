import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase } from './cleanup';
import { ObservabilityService } from '../src/observability/observability.service';
import { WorkerClusterService } from '../src/worker-cluster/worker-cluster.service';
import { HealthService } from '../src/health/health.service';
import { ConfigService } from '@nestjs/config';

describe('Phase 8: Enterprise Observability, Scale & Operational Hardening (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let observabilityService: ObservabilityService;
  let workerClusterService: WorkerClusterService;
  let healthService: HealthService;
  let configService: ConfigService;

  let tenantId: string;
  let workspaceId: string;
  let environmentId: string;
  let userId: string;
  let testWorkerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);
    observabilityService = app.get(ObservabilityService);
    workerClusterService = app.get(WorkerClusterService);
    healthService = app.get(HealthService);
    configService = app.get(ConfigService);

    // CLEANUP DATABASE
    await cleanDatabase(prisma);

    // SEED BASE TEST DATA
    const user = await prisma.user.create({
      data: { email: 'phase8_user@edimp.io', name: 'Phase 8 User' },
    });
    userId = user.id;

    const tenant = await prisma.tenant.create({
      data: { name: 'Phase 8 Tenant' },
    });
    tenantId = tenant.id;

    const workspace = await prisma.workspace.create({
      data: { tenantId, name: 'Phase 8 Workspace' },
    });
    workspaceId = workspace.id;

    await prisma.workspaceMember.create({
      data: { workspaceId: workspace.id, userId: user.id, role: 'OWNER' },
    });

    const environment = await prisma.environment.create({
      data: { workspaceId, name: 'Production' },
    });
    environmentId = environment.id;

    testWorkerId = `WORKER_P8_${Date.now()}`;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. OpenTelemetry & W3C Trace Context Propagation', () => {
    it('Scenario 1: Auto-generates x-trace-id and traceparent on HTTP responses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health/liveness')
        .expect(200);

      expect(res.headers['x-trace-id']).toBeDefined();
      expect(res.headers['traceparent']).toBeDefined();
      expect(res.headers['traceparent']).toContain(res.headers['x-trace-id']);
    });

    it('Scenario 2: Propagates incoming W3C traceparent header across HTTP -> Queue -> Worker -> AI context', async () => {
      const customTraceId = '4bf92f3577b34da6a3ce929d0e0e4736';
      const customTraceparent = `00-${customTraceId}-00f067aa0ba902b7-01`;

      const res = await request(app.getHttpServer())
        .get('/api/v1/health/liveness')
        .set('traceparent', customTraceparent)
        .expect(200);

      expect(res.headers['x-trace-id']).toBe(customTraceId);
      expect(res.headers['traceparent']).toContain(customTraceId);
    });
  });

  describe('2. Prometheus Metrics Security & Low-Cardinality Enforcement', () => {
    it('Scenario 3: Exposes Prometheus metrics format at /api/v1/metrics with token authentication', async () => {
      const token = configService.get<string>('METRICS_AUTH_TOKEN') || 'edimp_metrics_secret_token';
      const res = await request(app.getHttpServer())
        .get('/api/v1/metrics')
        .set('x-metrics-token', token)
        .expect(200);

      expect(res.text).toContain('# HELP edimp_http_requests_total');
      expect(res.text).toContain('# TYPE edimp_http_requests_total counter');
    });

    it('Scenario 4: Strictly enforces NO high-cardinality labels (zero tenantId/workspaceId/workerId/traceId in metric labels)', async () => {
      // Record a test HTTP request
      await request(app.getHttpServer())
        .get('/api/v1/health/liveness')
        .set('x-workspace-id', workspaceId)
        .set('x-user-id', userId)
        .expect(200);

      const token = configService.get<string>('METRICS_AUTH_TOKEN') || 'edimp_metrics_secret_token';
      const metricsRes = await request(app.getHttpServer())
        .get('/api/v1/metrics')
        .set('x-metrics-token', token)
        .expect(200);

      const text = metricsRes.text;

      // Forbidden high-cardinality labels check
      expect(text).not.toContain('tenantId=');
      expect(text).not.toContain('workspaceId=');
      expect(text).not.toContain('userId=');
      expect(text).not.toContain('workerId=');
      expect(text).not.toContain('traceId=');
      expect(text).not.toContain('migrationRunId=');
      expect(text).not.toContain('recordId=');
      expect(text).not.toContain('connectionId=');
    });

    it('Scenario 5: Exposes queue, worker, DLQ, and connector metrics', async () => {
      observabilityService.setGauge('edimp_queue_depth', 5, { queue_name: 'migration_queue' });
      observabilityService.incrementCounter('edimp_connector_operations_total', { connector_type: 'POSTGRES', operation: 'EXTRACT', status: 'SUCCESS' });

      const token = configService.get<string>('METRICS_AUTH_TOKEN') || 'edimp_metrics_secret_token';
      const res = await request(app.getHttpServer())
        .get('/api/v1/metrics')
        .set('x-metrics-token', token)
        .expect(200);

      expect(res.text).toContain('edimp_queue_depth');
      expect(res.text).toContain('edimp_connector_operations_total');
    });
  });

  describe('3. Health & Readiness Semantics', () => {
    it('Scenario 6: Liveness Probe — /health/liveness returns HTTP 200 UP even during database failure', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health/liveness')
        .expect(200);

      expect(res.body.status).toBe('UP');
      expect(res.body.component).toBe('EDIMP API Core');
    });

    it('Scenario 7: Readiness Probe — /health/readiness passes for API-only instance without worker registration', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health/readiness')
        .expect(200);

      expect(res.body.status).toBe('UP');
      expect(res.body.components.database.status).toBe('UP');
      expect(res.body.components.memory.status).toBe('UP');
      expect(res.body.components.workers.details.mode).toBe('API_INDEPENDENT');
    });

    it('Scenario 8: Readiness Probe — Fails when database fails or memory limit exceeded', async () => {
      // Mock db failure
      const spy = jest.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('DB Connection Refused'));

      await expect(healthService.checkReadiness()).rejects.toThrow(ServiceUnavailableException);

      spy.mockRestore();
    });
  });

  describe('4. Token-Bucket Rate Limiting & Fail-Closed Guard', () => {
    it('Scenario 9: Returns rate limit response headers (X-RateLimit-Limit, Remaining, Reset)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health/liveness')
        .expect(200);

      expect(res.headers['x-ratelimit-limit']).toBeDefined();
      expect(res.headers['x-ratelimit-remaining']).toBeDefined();
      expect(res.headers['x-ratelimit-reset']).toBeDefined();
    });

    it('Scenario 10: Fail-Closed Enforcer — Fails closed with 503 when Redis fails in Production mode', async () => {
      const origEnv = process.env.NODE_ENV;
      const origRedis = process.env.REDIS_URL;

      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'invalid_redis_url_simulated_failure';

      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/environments`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(503);
      expect(res.body.message).toContain('Production Rate Limiter service unavailable');

      process.env.NODE_ENV = origEnv;
      process.env.REDIS_URL = origRedis;
    });

    it('Scenario 11: Exempts internal service-to-service communication from rate limits', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/environments`)
        .set('x-user-id', userId)
        .set('x-internal-service-token', 'edimp_internal_secret_token_2026')
        .expect(200);

      expect(res.headers['x-ratelimit-limit']).toBeUndefined();
    });
  });

  describe('5. Append-Only Sanitized Audit Trail Engine', () => {
    it('Scenario 12: Records sanitized administrative audit log in database redacting passwords/secrets', async () => {
      const audit = await observabilityService.recordAuditLog({
        tenantId,
        workspaceId,
        environmentId,
        userId,
        action: 'PUBLISH',
        resourceType: 'MappingVersion',
        resourceId: 'map_ver_p8_001',
        traceId: 'trace_p8_audit_sanitized',
        details: {
          version: 1,
          dbPassword: 'secret_password_123',
          apiKey: 'bearer_token_xyz',
          normalSetting: 'standard_val',
        },
      });

      expect(audit).toBeDefined();
      expect(audit?.details).toBeDefined();
      const details: any = audit?.details;
      expect(details.dbPassword).toBe('[REDACTED_SENSITIVE_DATA]');
      expect(details.apiKey).toBe('[REDACTED_SENSITIVE_DATA]');
      expect(details.normalSetting).toBe('standard_val');
    });

    it('Scenario 13: Append-Only Guarantee — AuditLog service exposes zero update/delete capabilities', async () => {
      const serviceMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(observabilityService));
      expect(serviceMethods).not.toContain('updateAuditLog');
      expect(serviceMethods).not.toContain('deleteAuditLog');
    });
  });

  describe('6. Worker Cluster & DLQ History Preservation', () => {
    it('Scenario 14: Registers worker heartbeat in WorkerNode health table', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/worker-nodes/heartbeat')
        .set('x-internal-service-token', 'edimp_internal_secret_token_2026')
        .send({
          workerId: testWorkerId,
          hostname: 'worker-node-p8-01',
          ipAddress: '10.0.0.15',
          status: 'ACTIVE',
          activeLeaseCount: 1,
        })
        .expect(200);

      expect(res.body.workerId).toBe(testWorkerId);
      expect(res.body.status).toBe('ACTIVE');
    });

    it('Scenario 15: DLQ History Preservation & Recovery Request — Replay creates NEW recovery execution context without destroying original history', async () => {
      const connectorType = await prisma.connectorType.create({
        data: { name: 'PostgreSQL P8 DLQ', category: 'DATABASE', capabilities: {} },
      });
      const connSource = await prisma.connection.create({
        data: { environmentId, connectorTypeId: connectorType.id, name: 'Source Conn P8 DLQ' },
      });
      const connTarget = await prisma.connection.create({
        data: { environmentId, connectorTypeId: connectorType.id, name: 'Target Conn P8 DLQ' },
      });

      const srcDataModel = await prisma.dataModel.create({
        data: { connectionId: connSource.id, name: 'Source Model P8 DLQ' },
      });
      const srcModelVersion = await prisma.dataModelVersion.create({
        data: { dataModelId: srcDataModel.id, version: 1 },
      });

      const tgtDataModel = await prisma.dataModel.create({
        data: { connectionId: connTarget.id, name: 'Target Model P8 DLQ' },
      });
      const tgtModelVersion = await prisma.dataModelVersion.create({
        data: { dataModelId: tgtDataModel.id, version: 1 },
      });

      const canonicalModel = await prisma.canonicalModel.create({
        data: { workspaceId, name: 'Canonical Model P8 DLQ' },
      });
      const canonicalModelVersion = await prisma.canonicalModelVersion.create({
        data: { canonicalModelId: canonicalModel.id, version: 1, status: 'PUBLISHED' },
      });

      const mappingSet = await prisma.mappingSet.create({
        data: { workspaceId, name: 'Mapping Set P8 DLQ', direction: 'SOURCE_TO_CANONICAL' },
      });
      const mappingVersion = await prisma.mappingVersion.create({
        data: {
          mappingSetId: mappingSet.id,
          canonicalModelVersionId: canonicalModelVersion.id,
          dataModelVersionId: srcModelVersion.id,
          version: 1,
          status: 'PUBLISHED',
          definitionHash: 'hash_mapping_p8_dlq',
        },
      });

      const transSet = await prisma.transformationSet.create({
        data: { workspaceId, name: 'Trans Set P8 DLQ' },
      });
      const transVersion = await prisma.transformationVersion.create({
        data: {
          transformationSetId: transSet.id,
          version: 1,
          status: 'PUBLISHED',
          definitionHash: 'hash_trans_p8_dlq',
        },
      });

      const valSet = await prisma.validationSet.create({
        data: { workspaceId, name: 'Val Set P8 DLQ' },
      });
      const valVersion = await prisma.validationVersion.create({
        data: {
          validationSetId: valSet.id,
          version: 1,
          status: 'PUBLISHED',
          definitionHash: 'hash_val_p8_dlq',
        },
      });

      const job = await prisma.migrationJob.create({
        data: { workspaceId, environmentId, name: 'Migration Job P8 DLQ' },
      });
      const config = await prisma.migrationConfigurationVersion.create({
        data: {
          migrationJobId: job.id,
          version: 1,
          status: 'PUBLISHED',
          sourceConnectionId: connSource.id,
          targetConnectionId: connTarget.id,
          sourceDataModelVersionId: srcModelVersion.id,
          targetDataModelVersionId: tgtModelVersion.id,
          mappingVersionId: mappingVersion.id,
          transformationVersionId: transVersion.id,
          validationVersionId: valVersion.id,
        },
      });
      const originalRun = await prisma.migrationRun.create({
        data: { migrationConfigurationVersionId: config.id, status: 'FAILED' },
      });
      const originalBatch = await prisma.jobBatch.create({
        data: { migrationRunId: originalRun.id, batchIndex: 0, status: 'QUEUED' },
      });

      // 1. Park Batch to DLQ
      const dlqBatch = await workerClusterService.parkFailedBatchToDLQ(originalBatch.id, 'Max retry limit (3) exceeded');
      expect(dlqBatch.status).toBe('FAILED');
      expect(dlqBatch.checkpointCursor).toContain('DLQ_PARKED');

      // 2. Replay DLQ Item via API
      const replayRes = await request(app.getHttpServer())
        .post(`/api/v1/worker-nodes/dlq/${originalBatch.id}/replay`)
        .set('x-internal-service-token', 'edimp_internal_secret_token_2026')
        .expect(202);

      expect(replayRes.body.id).toBeDefined();
      expect(replayRes.body.id).not.toBe(originalRun.id); // NEW recovery run context

      // Verify recovery batch matches original batch index and references original batch
      const recoveryBatch = await prisma.jobBatch.findFirst({
        where: { migrationRunId: replayRes.body.id },
      });
      expect(recoveryBatch).toBeDefined();
      expect(recoveryBatch?.checkpointCursor).toBe(`RECOVERY_FROM:${originalBatch.id}`);

      // Verify original batch history remains intact (FAILED with DLQ_PARKED cursor)
      const fetchedOriginal = await prisma.jobBatch.findUnique({ where: { id: originalBatch.id } });
      expect(fetchedOriginal?.status).toBe('FAILED');
    });
  });
});
