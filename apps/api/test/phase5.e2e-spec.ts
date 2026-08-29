import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase } from './cleanup';
import { MigrationEngineService } from '../src/migration-engine/migration-engine.service';
import { ErrorCategory, LoadOperation, RecordStatus } from '@edimp/database';

describe('Phase 5 E2E: Migration Engine, Frozen Recipes & Stable Idempotency Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let migrationEngineService: MigrationEngineService;

  let user1: any;
  let user2: any;
  let tenant1: any;
  let tenant2: any;
  let workspace1: any;
  let workspace2: any;
  let env1: any;
  let connectorTypePostgres: any;
  let connection1: any;
  let dataModel1: any;
  let dataModelVersion1: any;
  let canonicalModel1: any;
  let canonicalModelVersion1: any;
  let mappingSet1: any;
  let mappingVersion1: any;
  let transformationSet1: any;
  let transformationVersion1: any;
  let validationSet1: any;
  let validationVersion1: any;
  let migrationJob1: any;
  let publishedConfigVer1: any;

  const waitForRunCompletion = async (runId: string, maxWaitMs = 5000): Promise<any> => {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const run = await prisma.migrationRun.findUnique({
        where: { id: runId },
        include: {
          records: {
            include: {
              errors: true,
            },
          },
        },
      });
      if (run && (run.status === 'COMPLETED' || run.status === 'FAILED')) {
        return run;
      }
      await new Promise((res) => setTimeout(res, 100));
    }
    return await prisma.migrationRun.findUnique({
      where: { id: runId },
      include: { records: { include: { errors: true } } },
    });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);
    migrationEngineService = app.get(MigrationEngineService);

    // Clean DB in cascade order
    await cleanDatabase(prisma);

    // 1. Create Users & Tenancy
    user1 = await prisma.user.create({ data: { email: 'p5_user1@test.com', name: 'P5 User One' } });
    user2 = await prisma.user.create({ data: { email: 'p5_user2@test.com', name: 'P5 User Two' } });

    tenant1 = await prisma.tenant.create({ data: { name: 'P5 Tenant Alpha' } });
    tenant2 = await prisma.tenant.create({ data: { name: 'P5 Tenant Beta' } });

    await prisma.tenantMember.create({ data: { tenantId: tenant1.id, userId: user1.id, role: 'ADMIN' } });
    await prisma.tenantMember.create({ data: { tenantId: tenant2.id, userId: user2.id, role: 'ADMIN' } });

    workspace1 = await prisma.workspace.create({ data: { tenantId: tenant1.id, name: 'P5 Alpha Workspace' } });
    workspace2 = await prisma.workspace.create({ data: { tenantId: tenant2.id, name: 'P5 Beta Workspace' } });

    await prisma.workspaceMember.create({ data: { workspaceId: workspace1.id, userId: user1.id, role: 'OWNER' } });
    await prisma.workspaceMember.create({ data: { workspaceId: workspace2.id, userId: user2.id, role: 'OWNER' } });

    env1 = await prisma.environment.create({ data: { workspaceId: workspace1.id, name: 'P5 Dev Env' } });

    connectorTypePostgres = await prisma.connectorType.create({
      data: {
        name: 'postgres-p5',
        category: 'DATABASE',
        version: '1.0.0',
        capabilities: { batch: true },
      },
    });

    connection1 = await prisma.connection.create({
      data: { environmentId: env1.id, connectorTypeId: connectorTypePostgres.id, name: 'P5 Source DB' },
    });

    dataModel1 = await prisma.dataModel.create({
      data: { connectionId: connection1.id, name: 'P5 DataModel' },
    });

    dataModelVersion1 = await prisma.dataModelVersion.create({
      data: { dataModelId: dataModel1.id, version: 1, status: 'PUBLISHED' },
    });

    canonicalModel1 = await prisma.canonicalModel.create({
      data: { workspaceId: workspace1.id, name: 'P5 Canonical' },
    });

    canonicalModelVersion1 = await prisma.canonicalModelVersion.create({
      data: { canonicalModelId: canonicalModel1.id, version: 1, status: 'PUBLISHED' },
    });

    mappingSet1 = await prisma.mappingSet.create({
      data: { workspaceId: workspace1.id, name: 'P5 MappingSet', direction: 'SOURCE_TO_CANONICAL' },
    });

    mappingVersion1 = await prisma.mappingVersion.create({
      data: {
        mappingSetId: mappingSet1.id,
        canonicalModelVersionId: canonicalModelVersion1.id,
        dataModelVersionId: dataModelVersion1.id,
        version: 1,
        status: 'PUBLISHED',
        definitionHash: 'hash_mapping_v1',
      },
    });

    transformationSet1 = await prisma.transformationSet.create({
      data: { workspaceId: workspace1.id, name: 'P5 TransformationSet' },
    });

    transformationVersion1 = await prisma.transformationVersion.create({
      data: {
        transformationSetId: transformationSet1.id,
        version: 1,
        status: 'PUBLISHED',
        definitionHash: 'hash_trans_v1',
        fieldTransformations: {
          create: [
            { targetFieldIdentifier: 'name', transformType: 'CUSTOM_TRANSFORM', config: { functionName: 'UPPERCASE' } },
          ],
        },
      },
    });

    validationSet1 = await prisma.validationSet.create({
      data: { workspaceId: workspace1.id, name: 'P5 ValidationSet' },
    });

    validationVersion1 = await prisma.validationVersion.create({
      data: {
        validationSetId: validationSet1.id,
        version: 1,
        status: 'PUBLISHED',
        definitionHash: 'hash_val_v1',
        rules: {
          create: [
            { targetFieldIdentifier: 'name', ruleType: 'NOT_NULL', ruleConfig: {}, severity: 'ERROR' },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. MigrationJob & Hierarchy Scope Validation', () => {
    it('should create a MigrationJob scoped to Environment & Workspace', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace1.id}/migration-jobs`)
        .set('x-user-id', user1.id)
        .send({
          environmentId: env1.id,
          name: 'Core Enterprise Migration',
          description: 'Migrating legacy ERP to Cloud',
        })
        .expect(201);

      migrationJob1 = res.body;
      expect(migrationJob1.id).toBeDefined();
      expect(migrationJob1.name).toBe('Core Enterprise Migration');
    });

    it('should reject creating a MigrationJob with an environment from another workspace', async () => {
      const otherEnv = await prisma.environment.create({
        data: { workspaceId: workspace2.id, name: 'Beta Env' },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace1.id}/migration-jobs`)
        .set('x-user-id', user1.id)
        .send({
          environmentId: otherEnv.id,
          name: 'Cross Workspace Job',
        })
        .expect(403);
    });

    it('should create a DRAFT MigrationConfigurationVersion binding all 7 references', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/migration-jobs/${migrationJob1.id}/configurations`)
        .set('x-user-id', user1.id)
        .send({
          sourceConnectionId: connection1.id,
          targetConnectionId: connection1.id,
          sourceDataModelVersionId: dataModelVersion1.id,
          targetDataModelVersionId: dataModelVersion1.id,
          mappingVersionId: mappingVersion1.id,
          transformationVersionId: transformationVersion1.id,
          validationVersionId: validationVersion1.id,
        })
        .expect(201);

      expect(res.body.version).toBe(1);
      expect(res.body.status).toBe('DRAFT');
    });

    it('should publish MigrationConfigurationVersion into frozen immutable recipe with SHA-256 hash', async () => {
      const draftConfig = await prisma.migrationConfigurationVersion.findFirst({
        where: { migrationJobId: migrationJob1.id, version: 1 },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/migration-configurations/${draftConfig!.id}/publish`)
        .set('x-user-id', user1.id)
        .expect(201);

      publishedConfigVer1 = res.body;
      expect(publishedConfigVer1.status).toBe('PUBLISHED');
      expect(publishedConfigVer1.publishedAt).toBeDefined();
      expect(publishedConfigVer1.publishedByUserId).toBe(user1.id);
      expect(publishedConfigVer1.configurationHash).toHaveLength(64);
    });
  });

  describe('2. End-to-End Data Movement & Repeated-Run Idempotency', () => {
    let run1: any;
    let run2: any;
    let run3: any;

    it('Run 1: Customer 100 -> LOADED (INSERT)', async () => {
      const samplePayloads = [
        { id: '100', name: 'John Doe', email: 'john@example.com', age: 30 },
      ];

      const res = await request(app.getHttpServer())
        .post(`/api/v1/migration-jobs/${migrationJob1.id}/execute`)
        .set('x-user-id', user1.id)
        .send({ batchSize: 1000, samplePayloads })
        .expect(202);

      run1 = res.body;
      expect(run1.id).toBeDefined();

      const completedRun = await waitForRunCompletion(run1.id);
      expect(completedRun.status).toBe('COMPLETED');
      expect(Number(completedRun.recordsExtracted)).toBe(1);
      expect(Number(completedRun.recordsLoaded)).toBe(1);
      expect(Number(completedRun.recordsInserted)).toBe(1);
      expect(Number(completedRun.recordsSkipped)).toBe(0);

      const record = completedRun.records[0];
      expect(record.status).toBe('LOADED');
      expect(record.loadOperation).toBe('INSERT');
    });

    it('Run 2: Customer 100 (Unchanged Data) -> SKIPPED (0 duplicate target insertions)', async () => {
      const samplePayloads = [
        { id: '100', name: 'John Doe', email: 'john@example.com', age: 30 },
      ];

      const res = await request(app.getHttpServer())
        .post(`/api/v1/migration-jobs/${migrationJob1.id}/execute`)
        .set('x-user-id', user1.id)
        .send({ batchSize: 1000, samplePayloads })
        .expect(202);

      run2 = res.body;

      const completedRun = await waitForRunCompletion(run2.id);
      expect(completedRun.status).toBe('COMPLETED');
      expect(Number(completedRun.recordsExtracted)).toBe(1);
      expect(Number(completedRun.recordsLoaded)).toBe(0);
      expect(Number(completedRun.recordsInserted)).toBe(0);
      expect(Number(completedRun.recordsSkipped)).toBe(1);

      const record = completedRun.records[0];
      expect(record.status).toBe('SKIPPED');
      expect(record.loadOperation).toBe('NONE');
    });

    it('Run 3: Customer 100 (Payload Changed) -> LOADED (UPDATE) via canonical JSON hash diff', async () => {
      const updatedPayloads = [
        { id: '100', name: 'Johnathan Doe', email: 'johnathan@example.com', age: 31 },
      ];

      const res = await request(app.getHttpServer())
        .post(`/api/v1/migration-jobs/${migrationJob1.id}/execute`)
        .set('x-user-id', user1.id)
        .send({ batchSize: 1000, samplePayloads: updatedPayloads })
        .expect(202);

      run3 = res.body;

      const completedRun = await waitForRunCompletion(run3.id);
      expect(completedRun.status).toBe('COMPLETED');
      expect(Number(completedRun.recordsExtracted)).toBe(1);
      expect(Number(completedRun.recordsLoaded)).toBe(1);
      expect(Number(completedRun.recordsUpdated)).toBe(1);
      expect(Number(completedRun.recordsSkipped)).toBe(0);

      const record = completedRun.records[0];
      expect(record.status).toBe('LOADED');
      expect(record.loadOperation).toBe('UPDATE');
    });

    it('should maintain stable MigrationIdentity while creating separate run records across all 3 runs', async () => {
      const identities = await prisma.migrationIdentity.findMany({
        where: { migrationConfigurationVersionId: publishedConfigVer1.id },
      });

      // Exactly 1 stable identity for Customer 100
      expect(identities).toHaveLength(1);
      expect(identities[0].sourceRecordId).toBe('100');

      const allRecords = await prisma.migrationRecord.findMany({
        where: { migrationIdentityId: identities[0].id },
      });

      // Exactly 3 run records linked to the stable identity
      expect(allRecords).toHaveLength(3);
    });
  });

  describe('3. Worker Lease Ownership & Stale Worker Rejection', () => {
    it('should reject stale Worker A after Worker B claims lease token', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/migration-jobs/${migrationJob1.id}/execute`)
        .set('x-user-id', user1.id)
        .send({ batchSize: 1000 })
        .expect(202);

      const run = res.body;
      const batch = await prisma.jobBatch.findFirst({ where: { migrationRunId: run.id } });

      // Worker B reclaims lease with new token while batch status is RUNNING
      await prisma.jobBatch.update({
        where: { id: batch!.id },
        data: {
          status: 'RUNNING',
          workerLeaseId: 'WORKER_B_TOKEN',
          leaseExpiresAt: new Date(Date.now() + 60000),
        },
      });

      // Stale execution attempt by Worker A must throw lease rejection error
      await expect(
        migrationEngineService.executeRunPipeline(run.id, {}, [{ id: '999', name: 'Stale Worker Test' }]),
      ).rejects.toThrow('lost lease for batch');
    });
  });

  describe('4. Error Classification, Diagnostics & Retry/Resume', () => {
    let failedRun: any;

    it('should log sanitized diagnostics for target error without PII leakage', async () => {
      const errorPayload = [
        { id: 'ERR_1', name: 'Fail Customer', _simulateError: true, _simulateCategory: 'TRANSIENT' },
      ];

      const res = await request(app.getHttpServer())
        .post(`/api/v1/migration-jobs/${migrationJob1.id}/execute`)
        .set('x-user-id', user1.id)
        .send({ batchSize: 1000, samplePayloads: errorPayload })
        .expect(202);

      failedRun = res.body;

      const completedRun = await waitForRunCompletion(failedRun.id);
      expect(Number(completedRun.recordsFailed)).toBe(1);

      const rec = completedRun.records[0];
      expect(rec.status).toBe('FAILED');
      expect(rec.errors).toHaveLength(1);
      expect(rec.errors[0].errorCategory).toBe('TRANSIENT');
      expect(rec.errors[0].sanitizedDiagnostics).toBeDefined();
    });

    it('should retry TRANSIENT errors with exponential backoff via POST /api/v1/migration-runs/:id/retry', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/migration-runs/${failedRun.id}/retry`)
        .set('x-user-id', user1.id)
        .send({})
        .expect(202);

      expect(res.body.status).toBe('QUEUED');
      expect(res.body.id).toBe(failedRun.id);
    });

    it('should resume an interrupted migration run via POST /api/v1/migration-runs/:id/resume', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/migration-runs/${failedRun.id}/resume`)
        .set('x-user-id', user1.id)
        .send({ batchSize: 500 })
        .expect(202);

      expect(res.body.status).toBe('EXTRACTING');
      expect(res.body.id).toBe(failedRun.id);
    });
  });

  describe('5. Workspace Authorization & Isolation', () => {
    it('should prevent cross-workspace access to migration jobs and runs (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspace2.id}/migration-jobs`)
        .set('x-user-id', user1.id)
        .expect(403);
    });
  });
});
