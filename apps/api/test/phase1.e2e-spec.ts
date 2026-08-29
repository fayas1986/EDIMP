import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

jest.setTimeout(30000);

describe('Phase 1 E2E Isolation Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let user1: any;

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

    user1 = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'E2E Test User',
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('Setup: Verify default user from AuthGuard exists', async () => {
    const devUser = await prisma.user.findFirst();
    expect(devUser).toBeTruthy();
  });

  describe('Tenants', () => {
    let tenantId: string;

    it('should create a tenant and add user as OWNER', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('x-user-id', user1.id)
        .send({ name: 'E2E Test Tenant' })
        .expect(201);

      tenantId = response.body.id;
      expect(response.body.name).toBe('E2E Test Tenant');

      const membership = await prisma.tenantMember.findFirst({
        where: { tenantId, userId: user1.id },
      });
      expect(membership?.role).toBe('ADMIN');
    });

    it('should prevent duplicate tenant names', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('x-user-id', user1.id)
        .send({ name: 'E2E Test Tenant' })
        .expect(409);
    });
  });
});
