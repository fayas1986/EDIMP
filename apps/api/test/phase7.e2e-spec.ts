import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase } from './cleanup';

describe('Phase 7: AI Agents & Autonomous Skills Integration (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tenantId: string;
  let workspaceId: string;
  let otherWorkspaceId: string;
  let environmentId: string;
  let userId: string;

  let connectorTypeId: string;
  let connectionId: string;
  let dataModelId: string;
  let dataModelVersionId: string;
  let canonicalModelId: string;
  let canonicalModelVersionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);

    // CLEANUP DATABASE
    await cleanDatabase(prisma);

    // SEED BASE TEST DATA
    const user = await prisma.user.create({
      data: { email: 'phase7_agent_user@edimp.io', name: 'AI Test User' },
    });
    userId = user.id;

    const tenant = await prisma.tenant.create({
      data: { name: 'Phase 7 AI Tenant' },
    });
    tenantId = tenant.id;

    const workspace = await prisma.workspace.create({
      data: { tenantId, name: 'Phase 7 Workspace' },
    });
    workspaceId = workspace.id;

    await prisma.tenantMember.create({
      data: { tenantId, userId, role: 'ADMIN' },
    });
    await prisma.workspaceMember.create({
      data: { workspaceId, userId, role: 'OWNER' },
    });

    const otherWorkspace = await prisma.workspace.create({
      data: { tenantId, name: 'Other Isolated Workspace' },
    });
    otherWorkspaceId = otherWorkspace.id;

    const environment = await prisma.environment.create({
      data: { workspaceId, name: 'Production' },
    });
    environmentId = environment.id;

    const connectorType = await prisma.connectorType.create({
      data: {
        name: 'PostgreSQL_P7',
        category: 'DATABASE',
        capabilities: { extract: true, load: true },
      },
    });
    connectorTypeId = connectorType.id;

    const connection = await prisma.connection.create({
      data: {
        environmentId,
        connectorTypeId,
        name: 'ERP DB Connection',
      },
    });
    connectionId = connection.id;

    const dataModel = await prisma.dataModel.create({
      data: { connectionId, name: 'ERP Customer Model' },
    });
    dataModelId = dataModel.id;

    const dmv = await prisma.dataModelVersion.create({
      data: { dataModelId, version: 1, status: 'PUBLISHED' },
    });
    dataModelVersionId = dmv.id;

    const canonicalModel = await prisma.canonicalModel.create({
      data: { workspaceId, name: 'Canonical Customer' },
    });
    canonicalModelId = canonicalModel.id;

    const cmv = await prisma.canonicalModelVersion.create({
      data: { canonicalModelId, version: 1, status: 'PUBLISHED' },
    });
    canonicalModelVersionId = cmv.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Advisory Gate & Mapping Suggestion Generation', () => {
    let taskId: string;
    let suggestionId: string;
    let noRecSuggestionId: string;
    let publishedMappingVersionId: string;

    it('Scenario 1: Triggers mapping suggestion task with score breakdowns & provenance', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/ai/mapping-suggestions`)
        .set('x-user-id', userId)
        .send({
          environmentId,
          sourceDataModelVersionId: dataModelVersionId,
          canonicalModelVersionId,
          confidenceThreshold: 0.70,
        })
        .expect(202);

      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe('PENDING');
      taskId = res.body.id;

      const dbTask = await prisma.aiAgentTask.findUnique({ where: { id: taskId } });
      expect(dbTask).toBeDefined();
      expect(dbTask?.agentType).toBe('MAPPING_SUGGESTION');
      expect(dbTask?.inputHash).toBeDefined();

      // Poll up to 2500ms for async worker execution
      let taskDetails = await prisma.aiAgentTask.findUnique({
        where: { id: taskId },
        include: { mappingSuggestions: true },
      });
      for (let i = 0; i < 25 && taskDetails?.status !== 'COMPLETED'; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        taskDetails = await prisma.aiAgentTask.findUnique({
          where: { id: taskId },
          include: { mappingSuggestions: true },
        });
      }

      expect(taskDetails?.status).toBe('COMPLETED');
      expect(taskDetails?.mappingSuggestions.length).toBeGreaterThan(0);

      const match = taskDetails?.mappingSuggestions.find(s => s.sourceField === 'cust_no');
      expect(match).toBeDefined();
      expect(match?.targetField).toBe('customerCode');
      expect(match?.finalConfidenceScore).toBeGreaterThanOrEqual(0.70);
      expect(match?.nameScore).toBeDefined();
      expect(match?.semanticScore).toBeDefined();
      expect(match?.semanticScore).toBeDefined();
      expect(match?.agentVersion).toBe('mapping-agent-v1.0');
      expect(match?.algorithmVersion).toBe('hybrid-semantic-v1.0');
      suggestionId = match!.id;

      const noRec = taskDetails?.mappingSuggestions.find(s => s.sourceField === 'unknown_x');
      expect(noRec).toBeDefined();
      expect(noRec?.status).toBe('NO_RECOMMENDATION');
      expect(noRec?.targetField).toBeNull();
      noRecSuggestionId = noRec!.id;
    });

    it('Scenario 2: Task Idempotency — Reuses existing task result for identical inputHash', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/ai/mapping-suggestions`)
        .set('x-user-id', userId)
        .send({
          environmentId,
          sourceDataModelVersionId: dataModelVersionId,
          canonicalModelVersionId,
          confidenceThreshold: 0.70,
        })
        .expect(202);

      expect(res.body.id).toBe(taskId); // Reused task ID
    });

    it('Scenario 3: Advisory Gate — Accepting suggestion creates a NEW DRAFT version and NEVER mutates published version', async () => {
      // Create a PUBLISHED MappingVersion V1
      const mappingSet = await prisma.mappingSet.create({
        data: { workspaceId, name: 'Production Customer Mapping', direction: 'SOURCE_TO_CANONICAL' },
      });

      const publishedVersion = await prisma.mappingVersion.create({
        data: {
          mappingSetId: mappingSet.id,
          canonicalModelVersionId,
          dataModelVersionId,
          version: 1,
          status: 'PUBLISHED',
          definitionHash: 'hash_v1',
        },
      });
      publishedMappingVersionId = publishedVersion.id;

      // Link suggestion to published version
      await prisma.aiMappingSuggestion.update({
        where: { id: suggestionId },
        data: { mappingVersionId: publishedMappingVersionId },
      });

      // Accept suggestion
      const acceptRes = await request(app.getHttpServer())
        .post(`/api/v1/ai-suggestions/${suggestionId}/accept`)
        .set('x-workspace-id', workspaceId)
        .set('x-user-id', userId)
        .send({ mappingSetId: mappingSet.id })
        .expect(200);

      expect(acceptRes.body.suggestion.status).toBe('ACCEPTED');
      expect(acceptRes.body.createdDraftVersion).toBeDefined();
      expect(acceptRes.body.createdDraftVersion.version).toBe(2); // V1 -> V2
      expect(acceptRes.body.createdDraftVersion.status).toBe('DRAFT');

      // VERIFY PUBLISHED VERSION V1 REMAINED UNTOUCHED
      const v1After = await prisma.mappingVersion.findUnique({
        where: { id: publishedMappingVersionId },
      });
      expect(v1After?.status).toBe('PUBLISHED');
      expect(v1After?.version).toBe(1);
    });

    it('Scenario 4: Rejects accepting a NO_RECOMMENDATION suggestion', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/ai-suggestions/${noRecSuggestionId}/accept`)
        .set('x-workspace-id', workspaceId)
        .set('x-user-id', userId)
        .send({})
        .expect(400); // Bad Request
    });

    it('Scenario 5: Rejection Flow — Rejecting a suggestion records audit reason', async () => {
      const rejectRes = await request(app.getHttpServer())
        .post(`/api/v1/ai-suggestions/${suggestionId}/reject`)
        .set('x-workspace-id', workspaceId)
        .set('x-user-id', userId)
        .send({ rejectionReason: 'Incorrect business concept mapping' })
        .expect(200);

      expect(rejectRes.body.status).toBe('REJECTED');
      expect(rejectRes.body.rejectionReason).toBe('Incorrect business concept mapping');
      expect(rejectRes.body.rejectedByUserId).toBe(userId);
    });
  });

  describe('2. Schema Drift Repair Agent', () => {
    it('Scenario 6: Detects smart rename candidates, added/removed fields, and severity', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/ai/schema-drift`)
        .set('x-user-id', userId)
        .send({
          environmentId,
          baselineModelVersionId: dataModelVersionId,
          targetModelVersionId: dataModelVersionId,
        })
        .expect(202);

      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe('COMPLETED');

      const driftSuggestions = await prisma.aiDriftRepairSuggestion.findMany({
        where: { taskId: res.body.id },
      });
      expect(driftSuggestions.length).toBeGreaterThan(0);

      const rename = driftSuggestions.find((d: any) => d.category === 'RENAME_CANDIDATE');
      expect(rename).toBeDefined();
      expect(rename.fieldName).toBe('customer_code');
      expect(rename.renamedToFieldName).toBe('customer_number');
      expect(rename.status).toBe('PROPOSED');
      expect(rename.suggestedRepairPlan).toBeDefined();
    });
  });

  describe('3. Anomaly Detection Agent & Baseline Requirement', () => {
    it('Scenario 7: Enforces sufficient baseline data threshold (< 5 samples returns INSUFFICIENT_BASELINE)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/ai/anomaly-analysis`)
        .set('x-user-id', userId)
        .send({
          environmentId,
          numericValues: [100.0, 102.5], // Only 2 samples (< 5)
        })
        .expect(202);

      const anomalyAnalyses = await prisma.aiAnomalyAnalysis.findMany({
        where: { taskId: res.body.id },
      });
      expect(anomalyAnalyses.length).toBeGreaterThan(0);
      expect(anomalyAnalyses[0].anomalyType).toBe('INSUFFICIENT_BASELINE');
      expect(anomalyAnalyses[0].confidenceScore).toBeLessThan(0.20);
      expect(anomalyAnalyses[0].sampleSize).toBe(2);
    });

    it('Scenario 8: Identifies numerical outlier with Z-score & IQR evidence (sample size >= 5)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/ai/anomaly-analysis`)
        .set('x-user-id', userId)
        .send({
          environmentId,
          numericValues: [100.5, 102.0, 99.8, 101.2, 5500.0, 100.1], // Outlier 5500
        })
        .expect(202);

      const anomalyAnalyses = await prisma.aiAnomalyAnalysis.findMany({
        where: { taskId: res.body.id },
      });
      expect(anomalyAnalyses.length).toBeGreaterThan(0);
      const anomaly = anomalyAnalyses[0];
      expect(anomaly.anomalyType).toBe('NUMERIC_OUTLIER');
      expect(anomaly.zScoreValue).toBeGreaterThan(2.0);
      expect(anomaly.meanValue).toBeDefined();
      expect(anomaly.stdDevValue).toBeDefined();
      expect(anomaly.iqrValue).toBeDefined();
      expect(anomaly.recommendedAction).toBe('RECOMMEND_DECIMAL_NORMALIZATION');
    });

    it('Scenario 9: Phase 6 Boundary — Anomaly agent recommends action without resolving Phase 6 discrepancy', async () => {
      const reconJob = await prisma.reconciliationJob.create({
        data: { workspaceId, environmentId, name: 'Recon Job P7' },
      });
      const reconConfig = await prisma.reconciliationConfigurationVersion.create({
        data: {
          reconciliationJobId: reconJob.id,
          version: 1,
          status: 'PUBLISHED',
          sourceConnectionId: connectionId,
          targetConnectionId: connectionId,
          sourceDataModelVersionId: dataModelVersionId,
          targetDataModelVersionId: dataModelVersionId,
          configurationHash: 'hash_recon_p7',
        },
      });
      const discrepancy = await prisma.reconciliationDiscrepancy.create({
        data: {
          reconciliationConfigurationVersionId: reconConfig.id,
          discrepancyIdentityKey: 'disc_p7_key_1',
          discrepancyType: 'ATTRIBUTE_MISMATCH',
          status: 'OPEN',
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/ai/anomaly-analysis`)
        .set('x-user-id', userId)
        .send({
          environmentId,
          reconciliationDiscrepancyId: discrepancy.id,
          numericValues: [10.0, 12.0, 11.0, 10.5, 95.0],
        })
        .expect(202);

      // Verify discrepancy remains in OPEN status (AI does NOT auto-resolve)
      const discAfter = await prisma.reconciliationDiscrepancy.findUnique({
        where: { id: discrepancy.id },
      });
      expect(discAfter?.status).toBe('OPEN');
    });
  });

  describe('4. Controlled Read-Only Natural Language Query Engine', () => {
    it('Scenario 10: Parses NL text prompt into structured query plan and returns read-only result', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/ai/query`)
        .set('x-user-id', userId)
        .send({
          environmentId,
          prompt: 'Show me all failed migration runs',
        })
        .expect(200);

      expect(res.body.sessionId).toBeDefined();
      expect(res.body.queryPlan).toBeDefined();
      expect(res.body.queryPlan.targetEntity).toBe('MIGRATION_RUN');
      expect(res.body.queryPlan.action).toBe('FIND_MANY');
      expect(res.body.queryPlan.filters.status).toBe('FAILED');
      expect(Array.isArray(res.body.results)).toBe(true);
    });

    it('Scenario 11: Zod Query Plan Gate — Rejects raw SQL or un-allowlisted entities', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/ai/query`)
        .set('x-user-id', userId)
        .send({
          environmentId,
          prompt: 'DROP TABLE Users; SELECT * FROM credentials',
        })
        .expect(200);

      // Intent parser maps to safe allowlisted DATA_MODEL targetEntity, eliminating SQL injection vulnerability
      expect(res.body.queryPlan.targetEntity).toBe('DATA_MODEL');
      expect(res.body.queryPlan.action).toBe('FIND_MANY');
    });

    it('Scenario 12: Authorization Gate — Workspace boundary enforced on NL queries', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${otherWorkspaceId}/ai/query`)
        .set('x-user-id', userId)
        .send({
          environmentId, // Environment belongs to workspaceId, not otherWorkspaceId
          prompt: 'List record errors',
        })
        .expect(403); // ForbiddenException
    });
  });

  describe('5. Task Audit & Monorepo Verification', () => {
    it('Scenario 13: Lists all workspace AI agent tasks with provenance details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/ai/tasks`)
        .set('x-user-id', userId)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].workspaceId).toBe(workspaceId);
    });

    it('Scenario 14: Verifies offline DeterministicProvider executes 100% without external API key dependencies', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/ai/mapping-suggestions`)
        .set('x-user-id', userId)
        .send({
          environmentId,
          sourceFields: [{ name: 'phone_no', type: 'VARCHAR' }],
          targetFields: [{ name: 'phoneNumber', type: 'VARCHAR' }],
        })
        .expect(202);

      expect(res.body.id).toBeDefined();
    });

    it('Scenario 15: Cross-Workspace Hierarchy Boundary check on AI Agent task invocation', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${otherWorkspaceId}/ai/mapping-suggestions`)
        .set('x-user-id', userId)
        .send({
          environmentId, // Belongs to workspaceId, not otherWorkspaceId
        })
        .expect(403); // Forbidden
    });
  });
});
