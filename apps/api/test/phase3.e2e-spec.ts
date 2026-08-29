import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

jest.setTimeout(30000);

describe('Phase 3 E2E & Mapping Architecture Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tenant1: any;
  let tenant2: any;
  let user1: any;
  let user2: any;

  let workspace1: any;
  let workspace2: any;

  let env1: any;
  let connectorTypePostgres: any;
  let connection1: any;
  let dataModel1: any;
  let dataModelVersion1: any;

  let canonicalModel1: any;
  let canonicalModelVersion1: any;

  let mappingSetSourceToCanonical: any;
  let mappingSetCanonicalToTarget: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);

    // Clean DB in cascade order
    await prisma.aiQueryMessage.deleteMany();
    await prisma.aiQuerySession.deleteMany();
    await prisma.aiAnomalyAnalysis.deleteMany();
    await prisma.aiDriftRepairSuggestion.deleteMany();
    await prisma.aiMappingSuggestion.deleteMany();
    await prisma.aiAgentTask.deleteMany();

    // Clean DB cascade order including Phase 6, Phase 5, Phase 4 tables
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

    // 1. Create Users & Tenancy
    user1 = await prisma.user.create({ data: { email: 'p3_user1@test.com', name: 'P3 User One' } });
    user2 = await prisma.user.create({ data: { email: 'p3_user2@test.com', name: 'P3 User Two' } });

    tenant1 = await prisma.tenant.create({ data: { name: 'P3 Tenant Alpha' } });
    tenant2 = await prisma.tenant.create({ data: { name: 'P3 Tenant Beta' } });

    await prisma.tenantMember.create({ data: { tenantId: tenant1.id, userId: user1.id, role: 'ADMIN' } });
    await prisma.tenantMember.create({ data: { tenantId: tenant2.id, userId: user2.id, role: 'ADMIN' } });

    workspace1 = await prisma.workspace.create({ data: { tenantId: tenant1.id, name: 'P3 Alpha Workspace' } });
    workspace2 = await prisma.workspace.create({ data: { tenantId: tenant2.id, name: 'P3 Beta Workspace' } });

    await prisma.workspaceMember.create({ data: { workspaceId: workspace1.id, userId: user1.id, role: 'OWNER' } });
    await prisma.workspaceMember.create({ data: { workspaceId: workspace2.id, userId: user2.id, role: 'OWNER' } });

    env1 = await prisma.environment.create({ data: { workspaceId: workspace1.id, name: 'P3 Dev Env' } });

    connectorTypePostgres = await prisma.connectorType.create({
      data: {
        name: 'postgres-p3',
        category: 'DATABASE',
        version: '1.0.0',
        capabilities: { batch: true },
      },
    });

    connection1 = await prisma.connection.create({
      data: {
        environmentId: env1.id,
        connectorTypeId: connectorTypePostgres.id,
        name: 'P3 Core DB',
      },
    });

    // Create DataModel & DataModelVersion
    dataModel1 = await prisma.dataModel.create({
      data: { connectionId: connection1.id, name: 'Physical Sales DB' },
    });

    dataModelVersion1 = await prisma.dataModelVersion.create({
      data: { dataModelId: dataModel1.id, version: 1, status: 'PUBLISHED' },
    });

    await prisma.dataEntity.create({
      data: {
        dataModelVersionId: dataModelVersion1.id,
        name: 'raw_customers',
        fields: {
          create: [
            { name: 'cust_id', dataType: 'STRING', isPrimaryKey: true },
            { name: 'cust_name', dataType: 'STRING' },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Canonical Model Versioning & Immutability', () => {
    it('should create a CanonicalModel with initial DRAFT version 1', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace1.id}/canonical-models`)
        .set('x-user-id', user1.id)
        .send({
          name: 'Global Customer Domain',
          description: 'Standardized Customer Definition',
          entities: [
            {
              name: 'Customer',
              description: 'Canonical Customer Entity',
              fields: [
                { name: 'id', dataType: 'STRING', isPrimaryKey: true },
                { name: 'fullName', dataType: 'STRING' },
              ],
            },
          ],
        })
        .expect(201);

      canonicalModel1 = res.body;
      expect(canonicalModel1.id).toBeDefined();
      expect(canonicalModel1.versions).toHaveLength(1);
      expect(canonicalModel1.versions[0].status).toBe('DRAFT');
    });

    it('should publish CanonicalModelVersion into PUBLISHED state with SHA-256 definitionHash', async () => {
      const draftVer = canonicalModel1.versions[0];
      const res = await request(app.getHttpServer())
        .post(`/api/v1/canonical-models/${canonicalModel1.id}/versions/${draftVer.id}/publish`)
        .set('x-user-id', user1.id)
        .expect(201);

      canonicalModelVersion1 = res.body;
      expect(canonicalModelVersion1.status).toBe('PUBLISHED');
      expect(canonicalModelVersion1.publishedAt).toBeDefined();
      expect(canonicalModelVersion1.publishedByUserId).toBe(user1.id);
      expect(canonicalModelVersion1.definitionHash).toHaveLength(64); // SHA-256 hex string length
    });

    it('should prevent modifying an already PUBLISHED CanonicalModelVersion', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/canonical-models/${canonicalModel1.id}/draft`)
        .set('x-user-id', user1.id)
        .send({ name: 'Should Fail Edit' })
        .expect(400);
    });
  });

  describe('MappingSet Direction & DataModelVersion Binding', () => {
    it('should create SOURCE_TO_CANONICAL MappingSet with draft version 1', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace1.id}/mapping-sets`)
        .set('x-user-id', user1.id)
        .send({
          name: 'SAP ECC -> Canonical Customer',
          direction: 'SOURCE_TO_CANONICAL',
          canonicalModelVersionId: canonicalModelVersion1.id,
          dataModelVersionId: dataModelVersion1.id,
        })
        .expect(201);

      mappingSetSourceToCanonical = res.body;
      expect(mappingSetSourceToCanonical.id).toBeDefined();
      expect(mappingSetSourceToCanonical.direction).toBe('SOURCE_TO_CANONICAL');
      expect(mappingSetSourceToCanonical.versions[0].status).toBe('DRAFT');
    });

    it('should create CANONICAL_TO_TARGET MappingSet with draft version 1', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace1.id}/mapping-sets`)
        .set('x-user-id', user1.id)
        .send({
          name: 'Canonical Customer -> Salesforce',
          direction: 'CANONICAL_TO_TARGET',
          canonicalModelVersionId: canonicalModelVersion1.id,
          dataModelVersionId: dataModelVersion1.id,
        })
        .expect(201);

      mappingSetCanonicalToTarget = res.body;
      expect(mappingSetCanonicalToTarget.id).toBeDefined();
      expect(mappingSetCanonicalToTarget.direction).toBe('CANONICAL_TO_TARGET');
    });

    it('should prevent cross-workspace access to CanonicalModel and MappingSet', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspace2.id}/mapping-sets`)
        .set('x-user-id', user1.id)
        .expect(403);

      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspace2.id}/canonical-models`)
        .set('x-user-id', user1.id)
        .expect(403);
    });
  });

  describe('Mapping Validation & Atomic Publishing', () => {
    it('should reject updating draft mapping with non-existent foreign key entity ID (400 Bad Request)', async () => {
      const fullCmVer = await prisma.canonicalModelVersion.findUnique({
        where: { id: canonicalModelVersion1.id },
        include: { entities: { include: { fields: true } } },
      });
      const canonicalEntity = fullCmVer!.entities[0];
      const canonicalField = canonicalEntity.fields[0];

      await request(app.getHttpServer())
        .patch(`/api/v1/mapping-sets/${mappingSetSourceToCanonical.id}/draft`)
        .set('x-user-id', user1.id)
        .send({
          entityMappings: [
            {
              sourceEntityId: 'non-existent-source-entity-id',
              canonicalEntityId: canonicalEntity.id,
              fieldMappings: [
                { canonicalFieldId: canonicalField.id, transformType: 'DIRECT' }
              ],
            },
          ],
        })
        .expect(400);
    });

    it('should reject publishing a draft mapping when entity belongs to an unlinked DataModelVersion (400 pre-publication validation error)', async () => {
      const otherDmVer = await prisma.dataModelVersion.create({
        data: { dataModelId: dataModel1.id, version: 2, status: 'DRAFT' },
      });
      const unlinkedEntity = await prisma.dataEntity.create({
        data: {
          dataModelVersionId: otherDmVer.id,
          name: 'unlinked_entity',
          fields: {
            create: [{ name: 'col1', dataType: 'STRING' }],
          },
        },
      });

      const fullCmVer = await prisma.canonicalModelVersion.findUnique({
        where: { id: canonicalModelVersion1.id },
        include: { entities: { include: { fields: true } } },
      });
      const canonicalEntity = fullCmVer!.entities[0];

      // Patch draft with unlinked entity (DB FK is valid, but doesn't match mappingSet's dataModelVersionId)
      await request(app.getHttpServer())
        .patch(`/api/v1/mapping-sets/${mappingSetSourceToCanonical.id}/draft`)
        .set('x-user-id', user1.id)
        .send({
          entityMappings: [
            {
              sourceEntityId: unlinkedEntity.id,
              canonicalEntityId: canonicalEntity.id,
            },
          ],
        })
        .expect(200);

      const draftVer = mappingSetSourceToCanonical.versions[0];
      // Pre-publication validator must reject unlinked entity reference with 400
      await request(app.getHttpServer())
        .post(`/api/v1/mapping-sets/${mappingSetSourceToCanonical.id}/versions/${draftVer.id}/publish`)
        .set('x-user-id', user1.id)
        .expect(400);
    });

    it('should validate and publish a valid SOURCE_TO_CANONICAL draft mapping', async () => {
      const fullDmVer = await prisma.dataModelVersion.findUnique({
        where: { id: dataModelVersion1.id },
        include: { entities: { include: { fields: true } } },
      });
      const sourceEntity = fullDmVer!.entities[0];
      const sourceField = sourceEntity.fields[0];

      const fullCmVer = await prisma.canonicalModelVersion.findUnique({
        where: { id: canonicalModelVersion1.id },
        include: { entities: { include: { fields: true } } },
      });
      const canonicalEntity = fullCmVer!.entities[0];
      const canonicalField = canonicalEntity.fields[0];

      // Update draft with valid references
      await request(app.getHttpServer())
        .patch(`/api/v1/mapping-sets/${mappingSetSourceToCanonical.id}/draft`)
        .set('x-user-id', user1.id)
        .send({
          entityMappings: [
            {
              sourceEntityId: sourceEntity.id,
              canonicalEntityId: canonicalEntity.id,
              fieldMappings: [
                {
                  sourceFieldId: sourceField.id,
                  canonicalFieldId: canonicalField.id,
                  transformType: 'DIRECT',
                },
              ],
            },
          ],
        })
        .expect(200);

      const draftVer = mappingSetSourceToCanonical.versions[0];
      const res = await request(app.getHttpServer())
        .post(`/api/v1/mapping-sets/${mappingSetSourceToCanonical.id}/versions/${draftVer.id}/publish`)
        .set('x-user-id', user1.id)
        .expect(201);

      expect(res.body.status).toBe('PUBLISHED');
      expect(res.body.publishedAt).toBeDefined();
      expect(res.body.publishedByUserId).toBe(user1.id);
      expect(res.body.definitionHash).toHaveLength(64);
    });

    it('should enforce immutability of PUBLISHED MappingVersions', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/mapping-sets/${mappingSetSourceToCanonical.id}/draft`)
        .set('x-user-id', user1.id)
        .send({ name: 'Should Fail Modify Published' })
        .expect(400);
    });
  });
});
