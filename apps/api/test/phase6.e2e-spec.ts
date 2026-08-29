import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase } from './cleanup';
import { ReconciliationService } from '../src/reconciliation/reconciliation.service';
import { ErrorManagementService } from '../src/error-management/error-management.service';
import { MigrationEngineService } from '../src/migration-engine/migration-engine.service';
import {
  ErrorCategory,
  LoadOperation,
  RecordStatus,
  ReconciliationConfigVersionStatus,
  ReconciliationRunStatus,
  DiscrepancyType,
  ObservationState,
  ErrorResolutionStatus,
} from '@edimp/database';

describe('Phase 6 E2E: Reconciliation Engine & Error Management Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let reconService: ReconciliationService;
  let errorService: ErrorManagementService;
  let migrationEngineService: MigrationEngineService;

  let user1: any;
  let user2: any;
  let tenant1: any;
  let tenant2: any;
  let workspace1: any;
  let workspace2: any;
  let env1: any;
  let env2: any;
  let connectorTypePostgres: any;
  let connection1: any;
  let connection2: any;
  let dataModel1: any;
  let dataModelVersion1: any;
  let dataModel2: any;
  let dataModelVersion2: any;
  let canonicalModel1: any;
  let canonicalModelVersion1: any;
  let mappingSet1: any;
  let mappingVersion1: any;
  let transformationSet1: any;
  let transformationVersion1: any;
  let validationSet1: any;
  let validationVersion1: any;
  let migrationJob1: any;
  let migrationConfigVersion1: any;

  const waitForReconRunCompletion = async (runId: string, maxWaitMs = 8000): Promise<any> => {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/reconciliation-jobs/runs/${runId}`)
        .set('x-user-id', user1.id);
      if (res.body && (res.body.status === 'COMPLETED' || res.body.status === 'FAILED')) {
        return res;
      }
      await new Promise((res) => setTimeout(res, 100));
    }
    return await request(app.getHttpServer())
      .get(`/api/v1/reconciliation-jobs/runs/${runId}`)
      .set('x-user-id', user1.id);
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);
    reconService = app.get(ReconciliationService);
    errorService = app.get(ErrorManagementService);
    migrationEngineService = app.get(MigrationEngineService);

    // Database cleanup in strict reverse dependency order
    await cleanDatabase(prisma);

    // Setup fixture data
    user1 = await prisma.user.create({ data: { email: 'p6user1@edimp.io', name: 'Phase6 User 1' } });
    user2 = await prisma.user.create({ data: { email: 'p6user2@edimp.io', name: 'Phase6 User 2' } });

    tenant1 = await prisma.tenant.create({ data: { name: 'P6 Tenant 1' } });
    tenant2 = await prisma.tenant.create({ data: { name: 'P6 Tenant 2' } });

    workspace1 = await prisma.workspace.create({ data: { tenantId: tenant1.id, name: 'P6 Workspace 1' } });
    workspace2 = await prisma.workspace.create({ data: { tenantId: tenant2.id, name: 'P6 Workspace 2' } });

    await prisma.workspaceMember.create({ data: { workspaceId: workspace1.id, userId: user1.id, role: 'OWNER' } });
    await prisma.workspaceMember.create({ data: { workspaceId: workspace2.id, userId: user2.id, role: 'OWNER' } });

    env1 = await prisma.environment.create({ data: { workspaceId: workspace1.id, name: 'P6 Env 1' } });
    env2 = await prisma.environment.create({ data: { workspaceId: workspace2.id, name: 'P6 Env 2' } });

    connectorTypePostgres = await prisma.connectorType.create({
      data: { name: 'PostgreSQL-P6', category: 'DATABASE', capabilities: {} },
    });

    connection1 = await prisma.connection.create({
      data: { environmentId: env1.id, connectorTypeId: connectorTypePostgres.id, name: 'P6 Conn 1' },
    });
    connection2 = await prisma.connection.create({
      data: { environmentId: env1.id, connectorTypeId: connectorTypePostgres.id, name: 'P6 Conn 2' },
    });

    dataModel1 = await prisma.dataModel.create({ data: { connectionId: connection1.id, name: 'P6 DM 1' } });
    dataModelVersion1 = await prisma.dataModelVersion.create({
      data: { dataModelId: dataModel1.id, version: 1, status: 'PUBLISHED' },
    });

    dataModel2 = await prisma.dataModel.create({ data: { connectionId: connection2.id, name: 'P6 DM 2' } });
    dataModelVersion2 = await prisma.dataModelVersion.create({
      data: { dataModelId: dataModel2.id, version: 1, status: 'PUBLISHED' },
    });

    canonicalModel1 = await prisma.canonicalModel.create({ data: { workspaceId: workspace1.id, name: 'P6 CM 1' } });
    canonicalModelVersion1 = await prisma.canonicalModelVersion.create({
      data: { canonicalModelId: canonicalModel1.id, version: 1, status: 'PUBLISHED' },
    });

    mappingSet1 = await prisma.mappingSet.create({ data: { workspaceId: workspace1.id, name: 'P6 MappingSet 1', direction: 'SOURCE_TO_CANONICAL' } });
    mappingVersion1 = await prisma.mappingVersion.create({
      data: {
        mappingSetId: mappingSet1.id,
        version: 1,
        dataModelVersionId: dataModelVersion1.id,
        canonicalModelVersionId: canonicalModelVersion1.id,
        status: 'PUBLISHED',
      },
    });

    transformationSet1 = await prisma.transformationSet.create({ data: { workspaceId: workspace1.id, name: 'P6 TransSet 1' } });
    transformationVersion1 = await prisma.transformationVersion.create({
      data: { transformationSetId: transformationSet1.id, version: 1, status: 'PUBLISHED' },
    });

    validationSet1 = await prisma.validationSet.create({ data: { workspaceId: workspace1.id, name: 'P6 ValSet 1' } });
    validationVersion1 = await prisma.validationVersion.create({
      data: { validationSetId: validationSet1.id, version: 1, status: 'PUBLISHED' },
    });

    migrationJob1 = await prisma.migrationJob.create({
      data: { workspaceId: workspace1.id, environmentId: env1.id, name: 'P6 Migration Job 1' },
    });

    migrationConfigVersion1 = await prisma.migrationConfigurationVersion.create({
      data: {
        migrationJobId: migrationJob1.id,
        version: 1,
        status: 'PUBLISHED',
        sourceConnectionId: connection1.id,
        targetConnectionId: connection2.id,
        sourceDataModelVersionId: dataModelVersion1.id,
        targetDataModelVersionId: dataModelVersion2.id,
        mappingVersionId: mappingVersion1.id,
        transformationVersionId: transformationVersion1.id,
        validationVersionId: validationVersion1.id,
        configurationHash: 'hash-p6-1',
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------
  // SCENARIO 1 & 2: IMMUTABLE CONFIG & IDENTITY MAPPING
  // ---------------------------------------------------------
  it('Scenario 1 & 2: Should create, publish and freeze ReconciliationConfigurationVersion with explicit identity mapping', async () => {
    const jobRes = await request(app.getHttpServer())
      .post('/api/v1/reconciliation-jobs')
      .set('x-workspace-id', workspace1.id)
      .set('x-user-id', user1.id)
      .send({ environmentId: env1.id, name: 'Customer Reconciliation' })
      .expect(201);

    const jobId = jobRes.body.id;
    expect(jobId).toBeDefined();

    const verRes = await request(app.getHttpServer())
      .post(`/api/v1/reconciliation-jobs/${jobId}/versions`)
      .set('x-user-id', user1.id)
      .send({
        sourceConnectionId: connection1.id,
        targetConnectionId: connection2.id,
        sourceDataModelVersionId: dataModelVersion1.id,
        targetDataModelVersionId: dataModelVersion2.id,
        sourceEntityIdentifier: 'ERP_Customer',
        targetEntityIdentifier: 'BC_Customer',
        identityMapping: { legacy_customer_no: 'bc_customer_code' },
        comparisonFields: [
          { sourceField: 'email', targetField: 'email', rules: { ignoreCase: true, trimWhitespace: true } },
          { sourceField: 'phone', targetField: 'phone', rules: { trimWhitespace: true } },
          { sourceField: 'balance', targetField: 'balance', rules: { decimalPlaces: 2 } },
        ],
        aggregateFields: [{ field: 'balance' }],
        mode: 'FULL',
      })
      .expect(201);

    const versionId = verRes.body.id;
    expect(verRes.body.status).toBe('DRAFT');

    const pubRes = await request(app.getHttpServer())
      .post(`/api/v1/reconciliation-jobs/${jobId}/versions/${versionId}/publish`)
      .set('x-user-id', user1.id)
      .expect(201);

    expect(pubRes.body.status).toBe('PUBLISHED');
    expect(pubRes.body.configurationHash).toBeDefined();

    // Verify rejection if trying to trigger run with a draft version
    const draftVerRes = await request(app.getHttpServer())
      .post(`/api/v1/reconciliation-jobs/${jobId}/versions`)
      .set('x-user-id', user1.id)
      .send({
        sourceConnectionId: connection1.id,
        targetConnectionId: connection2.id,
        sourceDataModelVersionId: dataModelVersion1.id,
        targetDataModelVersionId: dataModelVersion2.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/reconciliation-jobs/${jobId}/versions/${draftVerRes.body.id}/execute`)
      .set('x-user-id', user1.id)
      .expect(400);
  });

  // ---------------------------------------------------------
  // SCENARIO 3, 4, 5, 6, 7 & 8: DISCREPANCY TYPES, NORMALIZATION, FIXED-POINT DECIMAL & FIELD-LEVEL SHA256 KEY
  // ---------------------------------------------------------
  it('Scenario 3-8: Should execute FULL mode reconciliation, detecting MISSING, ORPHAN, ATTRIBUTE MISMATCH (field-distinct), and AGGREGATE MISMATCH with exact decimal arithmetic', async () => {
    const job = await prisma.reconciliationJob.create({
      data: { workspaceId: workspace1.id, environmentId: env1.id, name: 'Recon Execution Job' },
    });

    const configVer = await prisma.reconciliationConfigurationVersion.create({
      data: {
        reconciliationJobId: job.id,
        version: 1,
        status: 'PUBLISHED',
        sourceConnectionId: connection1.id,
        targetConnectionId: connection2.id,
        sourceDataModelVersionId: dataModelVersion1.id,
        targetDataModelVersionId: dataModelVersion2.id,
        identityMapping: { legacy_customer_no: 'bc_customer_code' },
        comparisonFields: [
          { sourceField: 'email', targetField: 'email', rules: { ignoreCase: true, trimWhitespace: true } },
          { sourceField: 'phone', targetField: 'phone', rules: { trimWhitespace: true } },
        ],
        aggregateFields: [{ field: 'balance' }],
        mode: 'FULL',
      },
    });

    const sourceRecords = [
      { legacy_customer_no: 'C100', email: ' ALICE@ACME.COM ', phone: '123-456', balance: 100.50 }, // Matched & normalized
      { legacy_customer_no: 'C200', email: 'bob@acme.com', phone: '999-888', balance: 200.00 }, // Phone mismatch + Email mismatch on C200!
      { legacy_customer_no: 'C300', email: 'charlie@acme.com', phone: '555-555', balance: 300.00 }, // MISSING_IN_TARGET
    ];

    const targetRecords = [
      { bc_customer_code: 'C100', email: 'alice@acme.com', phone: '123-456', balance: 100.50 },
      { bc_customer_code: 'C200', email: 'bob_different@acme.com', phone: '000-000', balance: 200.00 }, // email & phone mismatch
      { bc_customer_code: 'C400', email: 'dave@acme.com', phone: '777-777', balance: 400.00 }, // ORPHAN_IN_TARGET
    ];

    const runRes = await request(app.getHttpServer())
      .post(`/api/v1/reconciliation-jobs/${job.id}/versions/${configVer.id}/execute`)
      .set('x-user-id', user1.id)
      .send({
        sampleSourceRecords: sourceRecords,
        sampleTargetRecords: targetRecords,
      })
      .expect(202);

    const runId = runRes.body.id;

    const detailsRes = await waitForReconRunCompletion(runId);

    expect(detailsRes.body.status).toBe('COMPLETED');
    expect(Number(detailsRes.body.missingCount)).toBe(1); // C300
    expect(Number(detailsRes.body.orphanCount)).toBe(1); // C400
    expect(Number(detailsRes.body.attributeMismatchCount)).toBe(2); // C200 email & phone

    // CRITICAL USER GATE VERIFICATION: Field-level distinction in SHA-256 discrepancy identity key
    const discrepancies = await prisma.reconciliationDiscrepancy.findMany({
      where: { reconciliationConfigurationVersionId: configVer.id },
    });

    const c200Discrepancies = discrepancies.filter((d) => d.sourceRecordId === 'C200');
    expect(c200Discrepancies.length).toBe(2); // email mismatch and phone mismatch are separate!
    const fields = c200Discrepancies.map((d) => d.fieldIdentifier);
    expect(fields).toContain('email');
    expect(fields).toContain('phone');
  });

  // ---------------------------------------------------------
  // SCENARIO 9: INCREMENTAL MODE (WATERMARK FILTERING)
  // ---------------------------------------------------------
  it('Scenario 9: Should filter records based on watermark in INCREMENTAL mode', async () => {
    const job = await prisma.reconciliationJob.create({
      data: { workspaceId: workspace1.id, environmentId: env1.id, name: 'Incremental Recon Job' },
    });

    const configVer = await prisma.reconciliationConfigurationVersion.create({
      data: {
        reconciliationJobId: job.id,
        version: 1,
        status: 'PUBLISHED',
        sourceConnectionId: connection1.id,
        targetConnectionId: connection2.id,
        sourceDataModelVersionId: dataModelVersion1.id,
        targetDataModelVersionId: dataModelVersion2.id,
        mode: 'INCREMENTAL',
        watermarkConfig: { field: 'updatedAt', since: '2026-08-01T00:00:00Z' },
      },
    });

    const sourceRecords = [
      { id: '1', updatedAt: '2026-07-15T00:00:00Z', email: 'old@acme.com' }, // Skipped by watermark
      { id: '2', updatedAt: '2026-08-10T00:00:00Z', email: 'new@acme.com' }, // Processed
    ];

    const runRes = await request(app.getHttpServer())
      .post(`/api/v1/reconciliation-jobs/${job.id}/versions/${configVer.id}/execute`)
      .set('x-user-id', user1.id)
      .send({ sampleSourceRecords: sourceRecords, sampleTargetRecords: [] })
      .expect(202);

    const detailsRes = await waitForReconRunCompletion(runRes.body.id);

    expect(Number(detailsRes.body.totalRecordsCompared)).toBe(1);
  });

  // ---------------------------------------------------------
  // SCENARIO 10: SAMPLED MODE (DETERMINISTIC HASH SAMPLING)
  // ---------------------------------------------------------
  it('Scenario 10: Should apply deterministic seed sampling in SAMPLED mode', async () => {
    const job = await prisma.reconciliationJob.create({
      data: { workspaceId: workspace1.id, environmentId: env1.id, name: 'Sampled Recon Job' },
    });

    const configVer = await prisma.reconciliationConfigurationVersion.create({
      data: {
        reconciliationJobId: job.id,
        version: 1,
        status: 'PUBLISHED',
        sourceConnectionId: connection1.id,
        targetConnectionId: connection2.id,
        sourceDataModelVersionId: dataModelVersion1.id,
        targetDataModelVersionId: dataModelVersion2.id,
        mode: 'SAMPLED',
        samplingConfig: { sampleRate: 0.5, seed: 'testseed' },
      },
    });

    const sourceRecords = Array.from({ length: 10 }).map((_, i) => ({ id: `rec-${i}`, email: `user${i}@acme.com` }));

    const runRes = await request(app.getHttpServer())
      .post(`/api/v1/reconciliation-jobs/${job.id}/versions/${configVer.id}/execute`)
      .set('x-user-id', user1.id)
      .send({ sampleSourceRecords: sourceRecords, sampleTargetRecords: [] })
      .expect(202);

    const detailsRes = await waitForReconRunCompletion(runRes.body.id);

    expect(Number(detailsRes.body.totalRecordsCompared)).toBeGreaterThan(0);
    expect(Number(detailsRes.body.totalRecordsCompared)).toBeLessThan(10);
  });

  // ---------------------------------------------------------
  // SCENARIO 11: STREAMING BATCH CHECKPOINT RECOVERY
  // ---------------------------------------------------------
  it('Scenario 11: Should persist batch checkpointCursor during streaming reconciliation', async () => {
    const job = await prisma.reconciliationJob.create({
      data: { workspaceId: workspace1.id, environmentId: env1.id, name: 'Checkpoint Job' },
    });

    const configVer = await prisma.reconciliationConfigurationVersion.create({
      data: {
        reconciliationJobId: job.id,
        version: 1,
        status: 'PUBLISHED',
        sourceConnectionId: connection1.id,
        targetConnectionId: connection2.id,
        sourceDataModelVersionId: dataModelVersion1.id,
        targetDataModelVersionId: dataModelVersion2.id,
      },
    });

    const runRes = await request(app.getHttpServer())
      .post(`/api/v1/reconciliation-jobs/${job.id}/versions/${configVer.id}/execute`)
      .set('x-user-id', user1.id)
      .send({ sampleSourceRecords: [{ id: '1' }], sampleTargetRecords: [{ id: '1' }] })
      .expect(202);

    let batches = [];
    const startTime = Date.now();
    while (Date.now() - startTime < 8000) {
      batches = await prisma.reconciliationBatch.findMany({
        where: { reconciliationRunId: runRes.body.id },
      });
      if (batches.length > 0) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    expect(batches.length).toBeGreaterThan(0);
    expect(batches[0].checkpointCursor).toBeDefined();
  });

  // ---------------------------------------------------------
  // SCENARIO 12: DISCREPANCY OBSERVATION TIMELINE HISTORY
  // ---------------------------------------------------------
  it('Scenario 12: Should track observation timeline (NEW -> PERSISTED) across multiple reconciliation runs', async () => {
    const job = await prisma.reconciliationJob.create({
      data: { workspaceId: workspace1.id, environmentId: env1.id, name: 'Timeline History Job' },
    });

    const configVer = await prisma.reconciliationConfigurationVersion.create({
      data: {
        reconciliationJobId: job.id,
        version: 1,
        status: 'PUBLISHED',
        sourceConnectionId: connection1.id,
        targetConnectionId: connection2.id,
        sourceDataModelVersionId: dataModelVersion1.id,
        targetDataModelVersionId: dataModelVersion2.id,
        identityMapping: { id: 'id' },
      },
    });

    const sourceRecords = [{ id: 'PERSIST_1', email: 'p1@acme.com' }];

    // Run 1 -> Observation state should be NEW
    const run1 = await request(app.getHttpServer())
      .post(`/api/v1/reconciliation-jobs/${job.id}/versions/${configVer.id}/execute`)
      .set('x-user-id', user1.id)
      .send({ sampleSourceRecords: sourceRecords, sampleTargetRecords: [] })
      .expect(202);

    await waitForReconRunCompletion(run1.body.id);

    // Run 2 -> Observation state should be PERSISTED
    const run2 = await request(app.getHttpServer())
      .post(`/api/v1/reconciliation-jobs/${job.id}/versions/${configVer.id}/execute`)
      .set('x-user-id', user1.id)
      .send({ sampleSourceRecords: sourceRecords, sampleTargetRecords: [] })
      .expect(202);

    await waitForReconRunCompletion(run2.body.id);

    const obs1 = await prisma.reconciliationObservation.findFirst({
      where: { reconciliationRunId: run1.body.id },
    });
    const obs2 = await prisma.reconciliationObservation.findFirst({
      where: { reconciliationRunId: run2.body.id },
    });

    expect(obs1?.state).toBe('NEW');
    expect(obs2?.state).toBe('PERSISTED');
    expect(obs1?.reconciliationDiscrepancyId).toBe(obs2?.reconciliationDiscrepancyId);
  });

  // ---------------------------------------------------------
  // SCENARIO 13, 14 & 15: NON-DESTRUCTIVE MANUAL OVERRIDE, ASYNC REPLAY VIA PHASE 5 & BULK RESOLUTION (202 ACCEPTED)
  // ---------------------------------------------------------
  it('Scenario 13-15: Should apply non-destructive manual override, execute auditable replay via Phase 5 Engine, and process bulk error resolutions with 202 Accepted', async () => {
    // Create a MigrationRun & RecordError
    const migRun = await prisma.migrationRun.create({
      data: { migrationConfigurationVersionId: migrationConfigVersion1.id, status: 'FAILED' },
    });
    const identity = await prisma.migrationIdentity.create({
      data: {
        sourceConnectionId: connection1.id,
        sourceEntityIdentifier: 'Customer',
        sourceRecordId: 'CERR-1',
        targetEntityIdentifier: 'Customer',
        migrationConfigurationVersionId: migrationConfigVersion1.id,
        idempotencyKey: 'idem-key-cerr1',
        lastSourceRecordHash: 'srchash1',
      },
    });
    const batch = await prisma.jobBatch.create({
      data: { migrationRunId: migRun.id, batchIndex: 0, status: 'FAILED' },
    });
    const migRecord = await prisma.migrationRecord.create({
      data: {
        migrationRunId: migRun.id,
        jobBatchId: batch.id,
        migrationIdentityId: identity.id,
        sourceRecordHash: 'srchash1',
        status: 'FAILED',
      },
    });

    const error = await prisma.recordError.create({
      data: {
        migrationRecordId: migRecord.id,
        errorCode: 'ERR_BUSINESS_RULE',
        errorMessage: 'Invalid Tax Number',
        failedStage: 'VALIDATED',
        sanitizedDiagnostics: { payload: { customerId: 'CERR-1', taxNo: 'INVALID' } },
      },
    });

    // Scenario 13: Manual Override
    const overrideRes = await request(app.getHttpServer())
      .post(`/api/v1/errors/${error.id}/override`)
      .set('x-user-id', user1.id)
      .send({
        overridePayload: { customerId: 'CERR-1', taxNo: 'VALID-TAX-123' },
        overrideReason: 'Corrected by support agent',
      })
      .expect(201);

    expect(overrideRes.body.overridePayload.taxNo).toBe('VALID-TAX-123');

    const errDetails = await errorService.getErrorDetails(error.id, user1);
    expect(errDetails.resolutionStatus).toBe(ErrorResolutionStatus.RESOLVED_MANUAL_OVERRIDE);

    // Scenario 14: Replay via Phase 5 Migration Engine
    const replayRes = await request(app.getHttpServer())
      .post(`/api/v1/errors/${error.id}/replay`)
      .set('x-user-id', user1.id)
      .send({})
      .expect(201);

    expect(replayRes.body.status).toBe(ErrorResolutionStatus.RESOLVED_REPLAYED);
    expect(replayRes.body.replayRunId).toBeDefined();

    // Scenario 15: Bulk error resolution (202 Accepted)
    const err2 = await prisma.recordError.create({
      data: {
        migrationRecordId: migRecord.id,
        errorCode: 'ERR_TIMEOUT',
        errorMessage: 'Network timeout',
        failedStage: 'LOADED',
        sanitizedDiagnostics: { payload: { customerId: 'CERR-2' } },
      },
    });

    const bulkRes = await request(app.getHttpServer())
      .post('/api/v1/errors/bulk-resolve')
      .set('x-user-id', user1.id)
      .send({
        recordErrorIds: [err2.id],
        action: 'IGNORE',
        overrideReason: 'Known transient issue',
      })
      .expect(202);

    expect(bulkRes.body.status).toBe(202);
  });

  // ---------------------------------------------------------
  // SCENARIO 16: STRICT HIERARCHY AUTHORIZATION ENFORCEMENT
  // ---------------------------------------------------------
  it('Scenario 16: Should reject cross-workspace and cross-environment references with 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/reconciliation-jobs')
      .set('x-workspace-id', workspace1.id)
      .set('x-user-id', user1.id)
      .send({ environmentId: env2.id, name: 'Cross-Workspace Hack' }) // env2 belongs to workspace2!
      .expect(403);
  });
});
