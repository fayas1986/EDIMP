import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { DataProfilesService } from './../src/data-profiles/data-profiles.service';

jest.setTimeout(30000);

describe('Phase 2 E2E & Isolation Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dataProfilesService: DataProfilesService;

  let tenant1: any;
  let tenant2: any;
  let user1: any;
  let user2: any;

  let workspace1: any;
  let workspace2: any;

  let env1: any;
  let env2: any;

  let connectorTypePostgres: any;
  let connection1: any;
  let dataModel1: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);
    dataProfilesService = app.get(DataProfilesService);

    // Clean DB in cascade order
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

    // 1. Create Users
    user1 = await prisma.user.create({ data: { email: 'user1@test.com', name: 'User One' } });
    user2 = await prisma.user.create({ data: { email: 'user2@test.com', name: 'User Two' } });

    // 2. Create Tenants & Memberships
    tenant1 = await prisma.tenant.create({ data: { name: 'Tenant Alpha' } });
    tenant2 = await prisma.tenant.create({ data: { name: 'Tenant Beta' } });

    await prisma.tenantMember.create({ data: { tenantId: tenant1.id, userId: user1.id, role: 'ADMIN' } });
    await prisma.tenantMember.create({ data: { tenantId: tenant2.id, userId: user2.id, role: 'ADMIN' } });

    // 3. Create Workspaces & Environments
    workspace1 = await prisma.workspace.create({ data: { tenantId: tenant1.id, name: 'Alpha Workspace' } });
    workspace2 = await prisma.workspace.create({ data: { tenantId: tenant2.id, name: 'Beta Workspace' } });

    await prisma.workspaceMember.create({ data: { workspaceId: workspace1.id, userId: user1.id, role: 'OWNER' } });
    await prisma.workspaceMember.create({ data: { workspaceId: workspace2.id, userId: user2.id, role: 'OWNER' } });

    env1 = await prisma.environment.create({ data: { workspaceId: workspace1.id, name: 'Dev Env' } });
    env2 = await prisma.environment.create({ data: { workspaceId: workspace2.id, name: 'Prod Env' } });

    // 4. Create ConnectorType catalog entry
    connectorTypePostgres = await prisma.connectorType.create({
      data: {
        name: 'postgres-e2e',
        category: 'DATABASE',
        version: '1.0.0',
        capabilities: { batch: true },
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Connections & Security', () => {
    it('should create a connection with credentials securely without leaking vaultPath in response', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/environments/${env1.id}/connections`)
        .send({
          connectorTypeId: connectorTypePostgres.id,
          name: 'Postgres Core DB',
          description: 'Primary database',
          credentialType: 'BASIC',
          vaultPath: 'vault://secrets/db-password-secret-12345',
        })
        .expect(201);

      connection1 = res.body;
      expect(connection1.id).toBeDefined();
      expect(connection1.name).toBe('Postgres Core DB');
      expect(connection1.hasCredential).toBe(true);
      expect(connection1.credentialType).toBe('BASIC');
      // Verify security rule: vaultPath and secrets must NOT be in the API payload response
      expect(connection1.vaultPath).toBeUndefined();
      expect(connection1.credential?.vaultPath).toBeUndefined();
    });

    it('should test connectivity for a connection via POST /api/v1/connections/:id/test', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/connections/${connection1.id}/test`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Postgres Core DB');
    });

    it('should prevent cross-tenant/cross-workspace connection access', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/environments/${env2.id}/connections`)
        .expect(403);
    });
  });

  describe('DataModels & Versioning Immutability', () => {
    it('should create a DataModel with an initial DRAFT version 1', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/connections/${connection1.id}/data-models`)
        .send({
          name: 'Core DataModel',
          description: 'E2E Model',
        })
        .expect(201);

      dataModel1 = res.body;
      expect(dataModel1.id).toBeDefined();
      expect(dataModel1.versions).toHaveLength(1);
      expect(dataModel1.versions[0].version).toBe(1);
      expect(dataModel1.versions[0].status).toBe('DRAFT');
    });

    it('should update DRAFT DataModel version', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/data-models/${dataModel1.id}/draft`)
        .send({
          name: 'Core DataModel Updated',
        })
        .expect(200);

      expect(res.body.versions[0].status).toBe('DRAFT');
    });

    it('should publish DRAFT version into PUBLISHED in a single transaction', async () => {
      const draftVersion = dataModel1.versions[0];
      const res = await request(app.getHttpServer())
        .post(`/api/v1/data-models/${dataModel1.id}/versions/${draftVersion.id}/publish`)
        .expect(201);

      expect(res.body.status).toBe('PUBLISHED');
    });

    it('should reject updating or re-publishing an already PUBLISHED version', async () => {
      const draftVersion = dataModel1.versions[0];

      // Attempting to re-publish a PUBLISHED version must fail
      await request(app.getHttpServer())
        .post(`/api/v1/data-models/${dataModel1.id}/versions/${draftVersion.id}/publish`)
        .expect(400);

      // Attempting to modify draft when no DRAFT exists must fail
      await request(app.getHttpServer())
        .patch(`/api/v1/data-models/${dataModel1.id}/draft`)
        .send({ name: 'Should Fail' })
        .expect(400);
    });
  });

  describe('Data Profiling Engine & Consistency Check', () => {
    let profileRun: any;
    let publishedVersionId: string;

    it('should queue an asynchronous DataProfileRun in QUEUED state', async () => {
      const fullModel = await prisma.dataModel.findUnique({
        where: { id: dataModel1.id },
        include: { versions: { include: { entities: true } } },
      });
      publishedVersionId = fullModel!.versions[0].id;

      const res = await request(app.getHttpServer())
        .post('/api/v1/data-profile-runs')
        .send({ dataModelVersionId: publishedVersionId })
        .expect(201);

      profileRun = res.body;
      expect(profileRun.id).toBeDefined();
      expect(profileRun.status).toBe('QUEUED');
      expect(profileRun.queuedAt).toBeDefined();
      expect(profileRun.startedAt).toBeNull();
    });

    it('should verify DataProfileService consistency check (valid case)', async () => {
      const isValid = await dataProfilesService.verifyMetricConsistency(profileRun.id);
      expect(isValid).toBe(true);
    });

    it('should reject cross-version invalid metric consistency checks', async () => {
      await expect(
        dataProfilesService.verifyMetricConsistency(profileRun.id, 'invalid-cross-version-entity-id')
      ).rejects.toThrow();
    });
  });
});
