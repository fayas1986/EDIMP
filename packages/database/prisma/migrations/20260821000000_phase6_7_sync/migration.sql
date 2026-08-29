-- CreateEnum
CREATE TYPE "AiAgentType" AS ENUM ('MAPPING_SUGGESTION', 'SCHEMA_DRIFT_REPAIR', 'ANOMALY_DETECTION', 'NATURAL_LANGUAGE_QUERY');

-- CreateEnum
CREATE TYPE "AiSuggestionStatus" AS ENUM ('PROPOSED', 'NO_RECOMMENDATION', 'ACCEPTED', 'REJECTED', 'SUPERSEDED', 'STALE');

-- CreateEnum
CREATE TYPE "AiTaskStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AnomalyType" AS ENUM ('NUMERIC_OUTLIER', 'PATTERN_MUTATION', 'NULL_SPIKE', 'TIMEZONE_OFFSET', 'CURRENCY_CONVERSION', 'TRUNCATION_RISK', 'INSUFFICIENT_BASELINE');

-- CreateEnum
CREATE TYPE "DiscrepancyStatus" AS ENUM ('OPEN', 'RESOLVED', 'IGNORED');

-- CreateEnum
CREATE TYPE "DiscrepancyType" AS ENUM ('MISSING_IN_TARGET', 'ORPHAN_IN_TARGET', 'ATTRIBUTE_MISMATCH', 'RECORD_COUNT_MISMATCH', 'AGGREGATE_SUM_MISMATCH');

-- CreateEnum
CREATE TYPE "DriftCategory" AS ENUM ('ADDED_FIELD', 'REMOVED_FIELD', 'RENAME_CANDIDATE', 'TYPE_MUTATION', 'NULLABILITY_CHANGE', 'ENTITY_REMOVED');

-- CreateEnum
CREATE TYPE "DriftSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ErrorResolutionAction" AS ENUM ('INVESTIGATE', 'ASSIGN', 'MANUAL_OVERRIDE', 'REPLAY', 'IGNORE');

-- CreateEnum
CREATE TYPE "ErrorResolutionStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED_REPLAYED', 'RESOLVED_MANUAL_OVERRIDE', 'IGNORED');

-- CreateEnum
CREATE TYPE "ObservationState" AS ENUM ('NEW', 'PERSISTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ReconciliationConfigVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ReconciliationMode" AS ENUM ('FULL', 'INCREMENTAL', 'SAMPLED');

-- CreateEnum
CREATE TYPE "ReconciliationRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "MigrationJob" ADD COLUMN     "loadStrategy" "LoadStrategy" NOT NULL DEFAULT 'UPSERT';

-- AlterTable
ALTER TABLE "RecordError" ADD COLUMN     "assignedToUserId" TEXT,
ADD COLUMN     "resolutionStatus" "ErrorResolutionStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedByUserId" TEXT;

-- CreateTable
CREATE TABLE "AiAgentTask" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "agentType" "AiAgentType" NOT NULL,
    "status" "AiTaskStatus" NOT NULL DEFAULT 'PENDING',
    "agentVersion" TEXT NOT NULL DEFAULT 'agent-v1.0',
    "algorithmVersion" TEXT NOT NULL DEFAULT 'algo-v1.0',
    "providerName" TEXT NOT NULL DEFAULT 'DETERMINISTIC',
    "inputHash" TEXT NOT NULL,
    "taskParameters" JSONB NOT NULL,
    "errorMessage" TEXT,
    "executionTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAnomalyAnalysis" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "reconciliationDiscrepancyId" TEXT,
    "dataProfileRunId" TEXT,
    "anomalyType" "AnomalyType" NOT NULL,
    "status" "AiSuggestionStatus" NOT NULL DEFAULT 'PROPOSED',
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER,
    "meanValue" DOUBLE PRECISION,
    "stdDevValue" DOUBLE PRECISION,
    "medianValue" DOUBLE PRECISION,
    "iqrValue" DOUBLE PRECISION,
    "zScoreValue" DOUBLE PRECISION,
    "thresholdUsed" DOUBLE PRECISION,
    "statisticalEvidence" JSONB NOT NULL DEFAULT '{}',
    "rootCauseAnalysis" TEXT NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "agentVersion" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAnomalyAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDriftRepairSuggestion" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "baselineModelVerId" TEXT NOT NULL,
    "targetModelVerId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "fieldName" TEXT,
    "renamedToFieldName" TEXT,
    "category" "DriftCategory" NOT NULL,
    "severity" "DriftSeverity" NOT NULL,
    "status" "AiSuggestionStatus" NOT NULL DEFAULT 'PROPOSED',
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "suggestedRepairPlan" JSONB NOT NULL DEFAULT '{}',
    "agentVersion" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdDraftVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiDriftRepairSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMappingSuggestion" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceDataModelVerId" TEXT,
    "targetDataModelVerId" TEXT,
    "canonicalModelVerId" TEXT,
    "mappingVersionId" TEXT,
    "profileRunId" TEXT,
    "sourceEntity" TEXT NOT NULL,
    "sourceField" TEXT NOT NULL,
    "targetEntity" TEXT NOT NULL,
    "targetField" TEXT,
    "suggestedTransform" TEXT,
    "suggestedValidation" TEXT,
    "status" "AiSuggestionStatus" NOT NULL DEFAULT 'PROPOSED',
    "nameScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "semanticScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "typeCompatibilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "profileScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "finalConfidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reasoning" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '{}',
    "agentVersion" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "acceptedByUserId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "newDraftMappingVerId" TEXT,
    "rejectedByUserId" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMappingSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiQueryMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "naturalText" TEXT NOT NULL,
    "queryPlanJson" JSONB,
    "isReadOnly" BOOLEAN NOT NULL DEFAULT true,
    "executionError" TEXT,
    "resultSummary" JSONB,
    "agentVersion" TEXT,
    "algorithmVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiQueryMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiQuerySession" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiQuerySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorManualOverride" (
    "id" TEXT NOT NULL,
    "recordErrorId" TEXT NOT NULL,
    "originalPayload" JSONB NOT NULL,
    "overridePayload" JSONB NOT NULL,
    "overrideReason" TEXT NOT NULL,
    "overriddenByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorManualOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorResolutionLog" (
    "id" TEXT NOT NULL,
    "recordErrorId" TEXT NOT NULL,
    "action" "ErrorResolutionAction" NOT NULL,
    "fromStatus" "ErrorResolutionStatus" NOT NULL,
    "toStatus" "ErrorResolutionStatus" NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorResolutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationBatch" (
    "id" TEXT NOT NULL,
    "reconciliationRunId" TEXT NOT NULL,
    "batchIndex" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "checkpointCursor" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationConfigurationVersion" (
    "id" TEXT NOT NULL,
    "reconciliationJobId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ReconciliationConfigVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceConnectionId" TEXT NOT NULL,
    "targetConnectionId" TEXT NOT NULL,
    "sourceDataModelVersionId" TEXT NOT NULL,
    "targetDataModelVersionId" TEXT NOT NULL,
    "sourceEntityIdentifier" TEXT NOT NULL DEFAULT 'default_source_entity',
    "targetEntityIdentifier" TEXT NOT NULL DEFAULT 'default_target_entity',
    "identityMapping" JSONB NOT NULL DEFAULT '{}',
    "comparisonFields" JSONB NOT NULL DEFAULT '[]',
    "aggregateFields" JSONB NOT NULL DEFAULT '[]',
    "mode" "ReconciliationMode" NOT NULL DEFAULT 'FULL',
    "samplingConfig" JSONB NOT NULL DEFAULT '{}',
    "watermarkConfig" JSONB NOT NULL DEFAULT '{}',
    "configurationHash" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationConfigurationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationDiscrepancy" (
    "id" TEXT NOT NULL,
    "reconciliationConfigurationVersionId" TEXT NOT NULL,
    "discrepancyIdentityKey" TEXT NOT NULL,
    "sourceRecordId" TEXT,
    "targetRecordId" TEXT,
    "fieldIdentifier" TEXT,
    "discrepancyType" "DiscrepancyType" NOT NULL,
    "status" "DiscrepancyStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReconciliationDiscrepancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationJob" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ReconciliationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationObservation" (
    "id" TEXT NOT NULL,
    "reconciliationDiscrepancyId" TEXT NOT NULL,
    "reconciliationRunId" TEXT NOT NULL,
    "state" "ObservationState" NOT NULL DEFAULT 'NEW',
    "payloadDiff" JSONB NOT NULL DEFAULT '{}',
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationRun" (
    "id" TEXT NOT NULL,
    "reconciliationConfigurationVersionId" TEXT NOT NULL,
    "migrationRunId" TEXT,
    "status" "ReconciliationRunStatus" NOT NULL DEFAULT 'QUEUED',
    "workerLeaseId" TEXT,
    "workerHeartbeatAt" TIMESTAMP(3),
    "leaseExpiresAt" TIMESTAMP(3),
    "totalRecordsCompared" BIGINT NOT NULL DEFAULT 0,
    "discrepanciesFound" BIGINT NOT NULL DEFAULT 0,
    "missingCount" BIGINT NOT NULL DEFAULT 0,
    "orphanCount" BIGINT NOT NULL DEFAULT 0,
    "attributeMismatchCount" BIGINT NOT NULL DEFAULT 0,
    "aggregateMismatchCount" BIGINT NOT NULL DEFAULT 0,
    "batchesTotal" INTEGER NOT NULL DEFAULT 0,
    "batchesCompleted" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiAgentTask_agentType_status_idx" ON "AiAgentTask"("agentType" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "AiAgentTask_inputHash_idx" ON "AiAgentTask"("inputHash" ASC);

-- CreateIndex
CREATE INDEX "AiAgentTask_workspaceId_environmentId_idx" ON "AiAgentTask"("workspaceId" ASC, "environmentId" ASC);

-- CreateIndex
CREATE INDEX "AiAnomalyAnalysis_anomalyType_idx" ON "AiAnomalyAnalysis"("anomalyType" ASC);

-- CreateIndex
CREATE INDEX "AiAnomalyAnalysis_taskId_idx" ON "AiAnomalyAnalysis"("taskId" ASC);

-- CreateIndex
CREATE INDEX "AiAnomalyAnalysis_workspaceId_idx" ON "AiAnomalyAnalysis"("workspaceId" ASC);

-- CreateIndex
CREATE INDEX "AiDriftRepairSuggestion_category_severity_idx" ON "AiDriftRepairSuggestion"("category" ASC, "severity" ASC);

-- CreateIndex
CREATE INDEX "AiDriftRepairSuggestion_taskId_idx" ON "AiDriftRepairSuggestion"("taskId" ASC);

-- CreateIndex
CREATE INDEX "AiDriftRepairSuggestion_workspaceId_idx" ON "AiDriftRepairSuggestion"("workspaceId" ASC);

-- CreateIndex
CREATE INDEX "AiMappingSuggestion_status_idx" ON "AiMappingSuggestion"("status" ASC);

-- CreateIndex
CREATE INDEX "AiMappingSuggestion_taskId_idx" ON "AiMappingSuggestion"("taskId" ASC);

-- CreateIndex
CREATE INDEX "AiMappingSuggestion_workspaceId_idx" ON "AiMappingSuggestion"("workspaceId" ASC);

-- CreateIndex
CREATE INDEX "AiQueryMessage_sessionId_idx" ON "AiQueryMessage"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "AiQuerySession_workspaceId_userId_idx" ON "AiQuerySession"("workspaceId" ASC, "userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ErrorManualOverride_recordErrorId_key" ON "ErrorManualOverride"("recordErrorId" ASC);

-- CreateIndex
CREATE INDEX "ErrorResolutionLog_recordErrorId_idx" ON "ErrorResolutionLog"("recordErrorId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ReconciliationBatch_reconciliationRunId_batchIndex_key" ON "ReconciliationBatch"("reconciliationRunId" ASC, "batchIndex" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ReconciliationConfigurationVersion_reconciliationJobId_vers_key" ON "ReconciliationConfigurationVersion"("reconciliationJobId" ASC, "version" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ReconciliationDiscrepancy_discrepancyIdentityKey_key" ON "ReconciliationDiscrepancy"("discrepancyIdentityKey" ASC);

-- CreateIndex
CREATE INDEX "ReconciliationDiscrepancy_reconciliationConfigurationVersio_idx" ON "ReconciliationDiscrepancy"("reconciliationConfigurationVersionId" ASC);

-- CreateIndex
CREATE INDEX "ReconciliationDiscrepancy_status_idx" ON "ReconciliationDiscrepancy"("status" ASC);

-- CreateIndex
CREATE INDEX "ReconciliationJob_environmentId_idx" ON "ReconciliationJob"("environmentId" ASC);

-- CreateIndex
CREATE INDEX "ReconciliationJob_workspaceId_idx" ON "ReconciliationJob"("workspaceId" ASC);

-- CreateIndex
CREATE INDEX "ReconciliationObservation_reconciliationDiscrepancyId_idx" ON "ReconciliationObservation"("reconciliationDiscrepancyId" ASC);

-- CreateIndex
CREATE INDEX "ReconciliationObservation_reconciliationRunId_idx" ON "ReconciliationObservation"("reconciliationRunId" ASC);

-- CreateIndex
CREATE INDEX "ReconciliationRun_reconciliationConfigurationVersionId_idx" ON "ReconciliationRun"("reconciliationConfigurationVersionId" ASC);

-- CreateIndex
CREATE INDEX "ReconciliationRun_status_idx" ON "ReconciliationRun"("status" ASC);

-- CreateIndex
CREATE INDEX "RecordError_resolutionStatus_idx" ON "RecordError"("resolutionStatus" ASC);

-- AddForeignKey
ALTER TABLE "AiAgentTask" ADD CONSTRAINT "AiAgentTask_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgentTask" ADD CONSTRAINT "AiAgentTask_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnomalyAnalysis" ADD CONSTRAINT "AiAnomalyAnalysis_reconciliationDiscrepancyId_fkey" FOREIGN KEY ("reconciliationDiscrepancyId") REFERENCES "ReconciliationDiscrepancy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnomalyAnalysis" ADD CONSTRAINT "AiAnomalyAnalysis_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnomalyAnalysis" ADD CONSTRAINT "AiAnomalyAnalysis_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AiAgentTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnomalyAnalysis" ADD CONSTRAINT "AiAnomalyAnalysis_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDriftRepairSuggestion" ADD CONSTRAINT "AiDriftRepairSuggestion_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDriftRepairSuggestion" ADD CONSTRAINT "AiDriftRepairSuggestion_baselineModelVerId_fkey" FOREIGN KEY ("baselineModelVerId") REFERENCES "DataModelVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDriftRepairSuggestion" ADD CONSTRAINT "AiDriftRepairSuggestion_targetModelVerId_fkey" FOREIGN KEY ("targetModelVerId") REFERENCES "DataModelVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDriftRepairSuggestion" ADD CONSTRAINT "AiDriftRepairSuggestion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AiAgentTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDriftRepairSuggestion" ADD CONSTRAINT "AiDriftRepairSuggestion_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMappingSuggestion" ADD CONSTRAINT "AiMappingSuggestion_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMappingSuggestion" ADD CONSTRAINT "AiMappingSuggestion_canonicalModelVerId_fkey" FOREIGN KEY ("canonicalModelVerId") REFERENCES "CanonicalModelVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMappingSuggestion" ADD CONSTRAINT "AiMappingSuggestion_mappingVersionId_fkey" FOREIGN KEY ("mappingVersionId") REFERENCES "MappingVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMappingSuggestion" ADD CONSTRAINT "AiMappingSuggestion_rejectedByUserId_fkey" FOREIGN KEY ("rejectedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMappingSuggestion" ADD CONSTRAINT "AiMappingSuggestion_sourceDataModelVerId_fkey" FOREIGN KEY ("sourceDataModelVerId") REFERENCES "DataModelVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMappingSuggestion" ADD CONSTRAINT "AiMappingSuggestion_targetDataModelVerId_fkey" FOREIGN KEY ("targetDataModelVerId") REFERENCES "DataModelVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMappingSuggestion" ADD CONSTRAINT "AiMappingSuggestion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AiAgentTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMappingSuggestion" ADD CONSTRAINT "AiMappingSuggestion_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQueryMessage" ADD CONSTRAINT "AiQueryMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AiQuerySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQuerySession" ADD CONSTRAINT "AiQuerySession_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQuerySession" ADD CONSTRAINT "AiQuerySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQuerySession" ADD CONSTRAINT "AiQuerySession_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorManualOverride" ADD CONSTRAINT "ErrorManualOverride_overriddenByUserId_fkey" FOREIGN KEY ("overriddenByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorManualOverride" ADD CONSTRAINT "ErrorManualOverride_recordErrorId_fkey" FOREIGN KEY ("recordErrorId") REFERENCES "RecordError"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorResolutionLog" ADD CONSTRAINT "ErrorResolutionLog_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorResolutionLog" ADD CONSTRAINT "ErrorResolutionLog_recordErrorId_fkey" FOREIGN KEY ("recordErrorId") REFERENCES "RecordError"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationBatch" ADD CONSTRAINT "ReconciliationBatch_reconciliationRunId_fkey" FOREIGN KEY ("reconciliationRunId") REFERENCES "ReconciliationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationConfigurationVersion" ADD CONSTRAINT "ReconciliationConfigurationVersion_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationConfigurationVersion" ADD CONSTRAINT "ReconciliationConfigurationVersion_reconciliationJobId_fkey" FOREIGN KEY ("reconciliationJobId") REFERENCES "ReconciliationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationConfigurationVersion" ADD CONSTRAINT "ReconciliationConfigurationVersion_sourceConnectionId_fkey" FOREIGN KEY ("sourceConnectionId") REFERENCES "Connection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationConfigurationVersion" ADD CONSTRAINT "ReconciliationConfigurationVersion_sourceDataModelVersionI_fkey" FOREIGN KEY ("sourceDataModelVersionId") REFERENCES "DataModelVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationConfigurationVersion" ADD CONSTRAINT "ReconciliationConfigurationVersion_targetConnectionId_fkey" FOREIGN KEY ("targetConnectionId") REFERENCES "Connection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationConfigurationVersion" ADD CONSTRAINT "ReconciliationConfigurationVersion_targetDataModelVersionI_fkey" FOREIGN KEY ("targetDataModelVersionId") REFERENCES "DataModelVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationDiscrepancy" ADD CONSTRAINT "ReconciliationDiscrepancy_reconciliationConfigurationVersi_fkey" FOREIGN KEY ("reconciliationConfigurationVersionId") REFERENCES "ReconciliationConfigurationVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationJob" ADD CONSTRAINT "ReconciliationJob_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationJob" ADD CONSTRAINT "ReconciliationJob_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationObservation" ADD CONSTRAINT "ReconciliationObservation_reconciliationDiscrepancyId_fkey" FOREIGN KEY ("reconciliationDiscrepancyId") REFERENCES "ReconciliationDiscrepancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationObservation" ADD CONSTRAINT "ReconciliationObservation_reconciliationRunId_fkey" FOREIGN KEY ("reconciliationRunId") REFERENCES "ReconciliationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationRun" ADD CONSTRAINT "ReconciliationRun_migrationRunId_fkey" FOREIGN KEY ("migrationRunId") REFERENCES "MigrationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationRun" ADD CONSTRAINT "ReconciliationRun_reconciliationConfigurationVersionId_fkey" FOREIGN KEY ("reconciliationConfigurationVersionId") REFERENCES "ReconciliationConfigurationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordError" ADD CONSTRAINT "RecordError_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordError" ADD CONSTRAINT "RecordError_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
