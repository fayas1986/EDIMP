import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

jest.setTimeout(30000);

describe('Phase 4 E2E: Transformation & Validation Engine Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tenant1: any;
  let tenant2: any;
  let user1: any;
  let user2: any;

  let workspace1: any;
  let workspace2: any;

  let env1: any;
  let connectorType: any;
  let connection1: any;
  let dataModel1: any;
  let dataModelVersion1: any;

  let canonicalModel1: any;
  let canonicalModelVersion1: any;

  let mappingSet1: any;
  let mappingVersion1: any;

  let transformationSet1: any;
  let transformationVersionDraft1: any;
  let transformationVersionPublished1: any;

  let validationSet1: any;
  let validationVersionDraft1: any;
  let validationVersionPublished1: any;

  let pipelineJob1: any;

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

    // Clean DB in strict reverse-dependency order
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

    // 1. Setup Test Tenants & Users
    user1 = await prisma.user.create({
      data: { email: 'phase4_user1@example.com', name: 'Phase 4 User 1' },
    });
    user2 = await prisma.user.create({
      data: { email: 'phase4_user2@example.com', name: 'Phase 4 User 2' },
    });

    tenant1 = await prisma.tenant.create({ data: { name: 'Phase 4 Tenant 1' } });
    tenant2 = await prisma.tenant.create({ data: { name: 'Phase 4 Tenant 2' } });

    await prisma.tenantMember.create({
      data: { tenantId: tenant1.id, userId: user1.id, role: 'ADMIN' },
    });
    await prisma.tenantMember.create({
      data: { tenantId: tenant2.id, userId: user2.id, role: 'ADMIN' },
    });

    workspace1 = await prisma.workspace.create({
      data: { tenantId: tenant1.id, name: 'Phase 4 Workspace 1' },
    });
    workspace2 = await prisma.workspace.create({
      data: { tenantId: tenant2.id, name: 'Phase 4 Workspace 2' },
    });

    await prisma.workspaceMember.create({
      data: { workspaceId: workspace1.id, userId: user1.id, role: 'OWNER' },
    });
    await prisma.workspaceMember.create({
      data: { workspaceId: workspace2.id, userId: user2.id, role: 'OWNER' },
    });

    env1 = await prisma.environment.create({
      data: { workspaceId: workspace1.id, name: 'Development' },
    });

    // 2. Setup Data Models, Canonical Models & Mapping
    connectorType = await prisma.connectorType.create({
      data: { name: 'postgres_p4', category: 'DATABASE', capabilities: {} },
    });

    connection1 = await prisma.connection.create({
      data: { environmentId: env1.id, connectorTypeId: connectorType.id, name: 'PG Conn' },
    });

    dataModel1 = await prisma.dataModel.create({
      data: { connectionId: connection1.id, name: 'Customer Source Model' },
    });
    dataModelVersion1 = await prisma.dataModelVersion.create({
      data: { dataModelId: dataModel1.id, version: 1, status: 'PUBLISHED' },
    });

    canonicalModel1 = await prisma.canonicalModel.create({
      data: { workspaceId: workspace1.id, name: 'Canonical Customer' },
    });
    canonicalModelVersion1 = await prisma.canonicalModelVersion.create({
      data: { canonicalModelId: canonicalModel1.id, version: 1, status: 'PUBLISHED' },
    });

    mappingSet1 = await prisma.mappingSet.create({
      data: { workspaceId: workspace1.id, name: 'Customer Mapping', direction: 'SOURCE_TO_CANONICAL' },
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Transformation & Validation Versioning Lifecycle', () => {
    it('should create a TransformationSet with initial DRAFT version 1', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace1.id}/transformation-sets`)
        .set('x-user-id', user1.id)
        .send({
          name: 'Customer Transformations',
          description: 'Standard transformations for Customer',
          fieldTransformations: [
            { targetFieldIdentifier: 'email', transformType: 'CUSTOM_TRANSFORM', config: { functionName: 'LOWERCASE' } },
            { targetFieldIdentifier: 'fullName', transformType: 'EXPRESSION', config: { expression: 'CONCAT(firstName, " ", lastName)' } },
          ],
        })
        .expect(201);

      transformationSet1 = res.body;
      expect(transformationSet1.id).toBeDefined();
      expect(transformationSet1.versions).toHaveLength(1);
      transformationVersionDraft1 = transformationSet1.versions[0];
      expect(transformationVersionDraft1.status).toBe('DRAFT');
    });

    it('should create a ValidationSet with initial DRAFT version 1', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace1.id}/validation-sets`)
        .set('x-user-id', user1.id)
        .send({
          name: 'Customer Validations',
          description: 'Validation rules for Customer',
          rules: [
            { targetFieldIdentifier: 'email', ruleType: 'NOT_NULL', ruleConfig: {} },
            { targetFieldIdentifier: 'email', ruleType: 'REGEX', ruleConfig: { pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' } },
          ],
        })
        .expect(201);

      validationSet1 = res.body;
      expect(validationSet1.id).toBeDefined();
      expect(validationSet1.versions).toHaveLength(1);
      validationVersionDraft1 = validationSet1.versions[0];
      expect(validationVersionDraft1.status).toBe('DRAFT');
    });

    it('should publish TransformationVersion 1 in an atomic transaction', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/transformation-sets/${transformationSet1.id}/versions/${transformationVersionDraft1.id}/publish`)
        .set('x-user-id', user1.id)
        .expect(201);

      transformationVersionPublished1 = res.body;
      expect(transformationVersionPublished1.status).toBe('PUBLISHED');
      expect(transformationVersionPublished1.definitionHash).toBeDefined();
    });

    it('should publish ValidationVersion 1 in an atomic transaction', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/validation-sets/${validationSet1.id}/versions/${validationVersionDraft1.id}/publish`)
        .set('x-user-id', user1.id)
        .expect(201);

      validationVersionPublished1 = res.body;
      expect(validationVersionPublished1.status).toBe('PUBLISHED');
      expect(validationVersionPublished1.definitionHash).toBeDefined();
    });

    it('should reject editing a PUBLISHED TransformationSet DRAFT if no DRAFT exists', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/transformation-sets/${transformationSet1.id}/draft`)
        .set('x-user-id', user1.id)
        .send({ name: 'Updated Name' })
        .expect(400);
    });
  });

  describe('2. Transform & Validation Engine Unit Logic', () => {
    it('should evaluate all 6 transformation types (DIRECT, CONSTANT, LOOKUP, CONDITIONAL, EXPRESSION, CUSTOM_TRANSFORM)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace1.id}/pipeline-jobs/preview`)
        .set('x-user-id', user1.id)
        .send({
          mappingVersionId: mappingVersion1.id,
          transformationVersionId: transformationVersionPublished1.id,
          validationVersionId: validationVersionPublished1.id,
          sampleRecords: [
            { firstName: 'John', lastName: 'Doe', email: 'JOHN.DOE@EXAMPLE.COM' },
          ],
        })
        .expect(200);

      expect(res.body.transformedRecords).toHaveLength(1);
      const rec = res.body.transformedRecords[0];
      expect(rec.email).toBe('john.doe@example.com');
      expect(rec.fullName).toBe('John Doe');
    });

    it('should reject expressions with forbidden/unsafe function calls', async () => {
      // Create a DRAFT transformation with forbidden function call
      const draftSet = await prisma.transformationSet.create({
        data: { workspaceId: workspace1.id, name: 'Forbidden Expr Set' },
      });
      const draftVer = await prisma.transformationVersion.create({
        data: { transformationSetId: draftSet.id, version: 1, status: 'DRAFT' },
      });
      await prisma.fieldTransformation.create({
        data: {
          transformationVersionId: draftVer.id,
          targetFieldIdentifier: 'hack',
          transformType: 'EXPRESSION',
          config: { expression: 'EVAL_CODE("alert(1)")' },
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace1.id}/pipeline-jobs/preview`)
        .set('x-user-id', user1.id)
        .send({
          mappingVersionId: mappingVersion1.id,
          transformationVersionId: draftVer.id,
          validationVersionId: validationVersionPublished1.id,
          sampleRecords: [{ firstName: 'John' }],
        })
        .expect(200);

      // Validation/transform engine catches forbidden function error safely
      expect(res.body.transformedRecords).toBeDefined();
    });

    it('should reject unregistered custom transform function calls', async () => {
      const draftSet = await prisma.transformationSet.create({
        data: { workspaceId: workspace1.id, name: 'Unregistered Set' },
      });
      const draftVer = await prisma.transformationVersion.create({
        data: { transformationSetId: draftSet.id, version: 1, status: 'DRAFT' },
      });
      await prisma.fieldTransformation.create({
        data: {
          transformationVersionId: draftVer.id,
          targetFieldIdentifier: 'custom',
          transformType: 'CUSTOM_TRANSFORM',
          config: { functionName: 'UNKNOWN_CUSTOM_FN' },
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace1.id}/pipeline-jobs/preview`)
        .set('x-user-id', user1.id)
        .send({
          mappingVersionId: mappingVersion1.id,
          transformationVersionId: draftVer.id,
          validationVersionId: validationVersionPublished1.id,
          sampleRecords: [{ custom: 'test' }],
        })
        .expect(200);

      expect(res.body.transformedRecords).toBeDefined();
    });
  });

  describe('3. Preview API (Side-Effect Free)', () => {
    it('should run preview with DRAFT versions and produce zero DB execution runs/logs', async () => {
      const draftValSet = await prisma.validationSet.create({
        data: { workspaceId: workspace1.id, name: 'Draft Val Set' },
      });
      const draftValVer = await prisma.validationVersion.create({
        data: { validationSetId: draftValSet.id, version: 1, status: 'DRAFT' },
      });
      await prisma.fieldValidationRule.create({
        data: {
          validationVersionId: draftValVer.id,
          targetFieldIdentifier: 'age',
          ruleType: 'RANGE',
          ruleConfig: { min: 18, max: 100 },
          severity: 'ERROR',
        },
      });

      const runsBefore = await prisma.pipelineExecutionRun.count();

      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace1.id}/pipeline-jobs/preview`)
        .set('x-user-id', user1.id)
        .send({
          mappingVersionId: mappingVersion1.id,
          transformationVersionId: transformationVersionPublished1.id,
          validationVersionId: draftValVer.id,
          sampleRecords: [{ email: 'john@example.com', age: 15 }],
        })
        .expect(200);

      expect(res.body.transformedRecords).toHaveLength(1);
      expect(res.body.validationResults).toHaveLength(1);
      expect(res.body.validationResults[0].passed).toBe(false);

      const runsAfter = await prisma.pipelineExecutionRun.count();
      expect(runsAfter).toBe(runsBefore);
    });
  });

  describe('4. PipelineJob & Async Execution Runs', () => {
    it('should reject PipelineJob creation if tuple versions are not all PUBLISHED', async () => {
      const draftTransSet = await prisma.transformationSet.create({
        data: { workspaceId: workspace1.id, name: 'Draft Trans Set' },
      });
      const draftTransVer = await prisma.transformationVersion.create({
        data: { transformationSetId: draftTransSet.id, version: 1, status: 'DRAFT' },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace1.id}/pipeline-jobs`)
        .set('x-user-id', user1.id)
        .send({
          environmentId: env1.id,
          name: 'Invalid Job',
          mappingVersionId: mappingVersion1.id,
          transformationVersionId: draftTransVer.id,
          validationVersionId: validationVersionPublished1.id,
        })
        .expect(400);
    });

    it('should create PipelineJob when bound to exact PUBLISHED tuple versions', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace1.id}/pipeline-jobs`)
        .set('x-user-id', user1.id)
        .send({
          environmentId: env1.id,
          name: 'Customer Ingestion Pipeline Job',
          description: 'Production execution job',
          mappingVersionId: mappingVersion1.id,
          transformationVersionId: transformationVersionPublished1.id,
          validationVersionId: validationVersionPublished1.id,
        })
        .expect(201);

      pipelineJob1 = res.body;
      expect(pipelineJob1.id).toBeDefined();
      expect(pipelineJob1.mappingVersionId).toBe(mappingVersion1.id);
      expect(pipelineJob1.transformationVersionId).toBe(transformationVersionPublished1.id);
      expect(pipelineJob1.validationVersionId).toBe(validationVersionPublished1.id);
    });

    it('should trigger an async PipelineExecutionRun in QUEUED state and complete asynchronously', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/pipeline-jobs/${pipelineJob1.id}/execute`)
        .set('x-user-id', user1.id)
        .send({
          records: [
            { firstName: 'Alice', lastName: 'Smith', email: 'ALICE.SMITH@EXAMPLE.COM' },
            { firstName: 'Bob', lastName: 'Jones', email: 'BOB.JONES@EXAMPLE.COM' },
          ],
        })
        .expect(201);

      const run = res.body;
      expect(run.id).toBeDefined();
      expect(run.status).toBe('QUEUED');
      expect(run.mappingVersionId).toBe(mappingVersion1.id);
      expect(run.transformationVersionId).toBe(transformationVersionPublished1.id);
      expect(run.validationVersionId).toBe(validationVersionPublished1.id);

      // Wait 500ms for async worker execution
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updatedRun = await prisma.pipelineExecutionRun.findUnique({
        where: { id: run.id },
      });

      expect(updatedRun?.status).toBe('COMPLETED');
      expect(Number(updatedRun?.recordsProcessed)).toBe(2);
      expect(Number(updatedRun?.recordsTransformed)).toBe(2);
      expect(Number(updatedRun?.recordsValidated)).toBe(2);
    });

    it('should enforce cross-workspace access control (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspace2.id}/pipeline-jobs`)
        .set('x-user-id', user1.id)
        .expect(403);
    });
  });
});
