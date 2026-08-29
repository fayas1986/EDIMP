import { PrismaService } from '../src/prisma/prisma.service';

export async function cleanDatabase(prisma: PrismaService) {
  // Clean all tables in reverse dependency (cascade) order to prevent FK violations
  await prisma.auditLog.deleteMany().catch(() => {});
  await prisma.workerNode.deleteMany().catch(() => {});
  await prisma.aiQueryMessage.deleteMany().catch(() => {});
  await prisma.aiQuerySession.deleteMany().catch(() => {});
  await prisma.aiAnomalyAnalysis.deleteMany().catch(() => {});
  await prisma.aiDriftRepairSuggestion.deleteMany().catch(() => {});
  await prisma.aiMappingSuggestion.deleteMany().catch(() => {});
  await prisma.aiAgentTask.deleteMany().catch(() => {});

  await prisma.errorResolutionLog.deleteMany().catch(() => {});
  await prisma.errorManualOverride.deleteMany().catch(() => {});
  await prisma.recordError.deleteMany().catch(() => {});
  await prisma.reconciliationObservation.deleteMany().catch(() => {});
  await prisma.reconciliationDiscrepancy.deleteMany().catch(() => {});
  await prisma.reconciliationBatch.deleteMany().catch(() => {});
  await prisma.reconciliationRun.deleteMany().catch(() => {});
  await prisma.reconciliationConfigurationVersion.deleteMany().catch(() => {});
  await prisma.reconciliationJob.deleteMany().catch(() => {});
  await prisma.migrationRecord.deleteMany().catch(() => {});
  await prisma.jobBatch.deleteMany().catch(() => {});
  await prisma.migrationRun.deleteMany().catch(() => {});
  await prisma.migrationIdentity.deleteMany().catch(() => {});
  await prisma.migrationConfigurationVersion.deleteMany().catch(() => {});
  await prisma.migrationJob.deleteMany().catch(() => {});
  await prisma.pipelineExecutionLog.deleteMany().catch(() => {});
  await prisma.pipelineExecutionRun.deleteMany().catch(() => {});
  await prisma.pipelineJob.deleteMany().catch(() => {});
  await prisma.fieldValidationRule.deleteMany().catch(() => {});
  await prisma.validationVersion.deleteMany().catch(() => {});
  await prisma.validationSet.deleteMany().catch(() => {});
  await prisma.fieldTransformation.deleteMany().catch(() => {});
  await prisma.transformationVersion.deleteMany().catch(() => {});
  await prisma.transformationSet.deleteMany().catch(() => {});
  await prisma.fieldMapping.deleteMany().catch(() => {});
  await prisma.entityMapping.deleteMany().catch(() => {});
  await prisma.mappingVersion.deleteMany().catch(() => {});
  await prisma.mappingSet.deleteMany().catch(() => {});
  await prisma.canonicalField.deleteMany().catch(() => {});
  await prisma.canonicalEntity.deleteMany().catch(() => {});
  await prisma.canonicalModelVersion.deleteMany().catch(() => {});
  await prisma.canonicalModel.deleteMany().catch(() => {});
  await prisma.dataProfileMetric.deleteMany().catch(() => {});
  await prisma.dataProfileRun.deleteMany().catch(() => {});
  await prisma.dataField.deleteMany().catch(() => {});
  await prisma.dataEntity.deleteMany().catch(() => {});
  await prisma.dataModelVersion.deleteMany().catch(() => {});
  await prisma.dataModel.deleteMany().catch(() => {});
  await prisma.connection.deleteMany().catch(() => {});
  await prisma.connectorType.deleteMany().catch(() => {});
  await prisma.workspaceMember.deleteMany().catch(() => {});
  await prisma.tenantMember.deleteMany().catch(() => {});
  await prisma.environment.deleteMany().catch(() => {});
  await prisma.workspace.deleteMany().catch(() => {});
  await prisma.tenant.deleteMany().catch(() => {});
}
