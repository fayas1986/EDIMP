-- CreateEnum
CREATE TYPE "MigrationJobStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MigrationConfigVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "MigrationRunStatus" AS ENUM ('QUEUED', 'EXTRACTING', 'TRANSFORMING', 'LOADING', 'COMPLETED', 'FAILED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('EXTRACTED', 'TRANSFORMED', 'VALIDATED', 'LOADED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "LoadOperation" AS ENUM ('NONE', 'INSERT', 'UPDATE', 'UPSERT');

-- CreateEnum
CREATE TYPE "LoadStrategy" AS ENUM ('INSERT', 'UPDATE', 'UPSERT');

-- CreateEnum
CREATE TYPE "ErrorCategory" AS ENUM ('TRANSIENT', 'RATE_LIMIT', 'CONNECTIVITY', 'AUTHENTICATION', 'VALIDATION', 'MAPPING', 'TARGET_BUSINESS_RULE', 'PERMANENT');

-- CreateTable
CREATE TABLE "MigrationJob" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "MigrationJobStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MigrationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationConfigurationVersion" (
    "id" TEXT NOT NULL,
    "migrationJobId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "MigrationConfigVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceConnectionId" TEXT NOT NULL,
    "targetConnectionId" TEXT NOT NULL,
    "sourceDataModelVersionId" TEXT NOT NULL,
    "targetDataModelVersionId" TEXT NOT NULL,
    "mappingVersionId" TEXT NOT NULL,
    "transformationVersionId" TEXT NOT NULL,
    "validationVersionId" TEXT NOT NULL,
    "configurationHash" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigrationConfigurationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationIdentity" (
    "id" TEXT NOT NULL,
    "migrationConfigurationVersionId" TEXT NOT NULL,
    "sourceConnectionId" TEXT NOT NULL,
    "sourceEntityIdentifier" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "targetEntityIdentifier" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "lastSourceRecordHash" TEXT NOT NULL,
    "lastTargetRecordId" TEXT,
    "lastStatus" "RecordStatus" NOT NULL DEFAULT 'EXTRACTED',
    "lastLoadOperation" "LoadOperation" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MigrationIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationRun" (
    "id" TEXT NOT NULL,
    "migrationConfigurationVersionId" TEXT NOT NULL,
    "status" "MigrationRunStatus" NOT NULL DEFAULT 'QUEUED',
    "workerLeaseId" TEXT,
    "workerHeartbeatAt" TIMESTAMP(3),
    "leaseExpiresAt" TIMESTAMP(3),
    "recordsExtracted" BIGINT NOT NULL DEFAULT 0,
    "recordsProcessed" BIGINT NOT NULL DEFAULT 0,
    "recordsTransformed" BIGINT NOT NULL DEFAULT 0,
    "recordsValidated" BIGINT NOT NULL DEFAULT 0,
    "recordsLoaded" BIGINT NOT NULL DEFAULT 0,
    "recordsInserted" BIGINT NOT NULL DEFAULT 0,
    "recordsUpdated" BIGINT NOT NULL DEFAULT 0,
    "recordsSkipped" BIGINT NOT NULL DEFAULT 0,
    "recordsFailed" BIGINT NOT NULL DEFAULT 0,
    "recordsRetried" BIGINT NOT NULL DEFAULT 0,
    "batchesTotal" INTEGER NOT NULL DEFAULT 0,
    "batchesCompleted" INTEGER NOT NULL DEFAULT 0,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigrationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobBatch" (
    "id" TEXT NOT NULL,
    "migrationRunId" TEXT NOT NULL,
    "batchIndex" INTEGER NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'QUEUED',
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "checkpointCursor" TEXT,
    "workerLeaseId" TEXT,
    "workerHeartbeatAt" TIMESTAMP(3),
    "leaseExpiresAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationRecord" (
    "id" TEXT NOT NULL,
    "migrationRunId" TEXT NOT NULL,
    "jobBatchId" TEXT NOT NULL,
    "migrationIdentityId" TEXT NOT NULL,
    "sourceRecordHash" TEXT NOT NULL,
    "targetRecordId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'EXTRACTED',
    "loadOperation" "LoadOperation" NOT NULL DEFAULT 'NONE',
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MigrationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordError" (
    "id" TEXT NOT NULL,
    "migrationRecordId" TEXT NOT NULL,
    "errorCategory" "ErrorCategory" NOT NULL DEFAULT 'PERMANENT',
    "errorCode" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "failedStage" TEXT NOT NULL,
    "sanitizedDiagnostics" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MigrationJob_workspaceId_idx" ON "MigrationJob"("workspaceId");

-- CreateIndex
CREATE INDEX "MigrationJob_environmentId_idx" ON "MigrationJob"("environmentId");

-- CreateIndex
CREATE UNIQUE INDEX "MigrationConfigurationVersion_migrationJobId_version_key" ON "MigrationConfigurationVersion"("migrationJobId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "MigrationIdentity_idempotencyKey_key" ON "MigrationIdentity"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MigrationIdentity_migrationConfigurationVersionId_idx" ON "MigrationIdentity"("migrationConfigurationVersionId");

-- CreateIndex
CREATE INDEX "MigrationIdentity_sourceRecordId_idx" ON "MigrationIdentity"("sourceRecordId");

-- CreateIndex
CREATE INDEX "MigrationRun_migrationConfigurationVersionId_idx" ON "MigrationRun"("migrationConfigurationVersionId");

-- CreateIndex
CREATE INDEX "MigrationRun_status_idx" ON "MigrationRun"("status");

-- CreateIndex
CREATE INDEX "JobBatch_status_idx" ON "JobBatch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "JobBatch_migrationRunId_batchIndex_key" ON "JobBatch"("migrationRunId", "batchIndex");

-- CreateIndex
CREATE INDEX "MigrationRecord_migrationRunId_idx" ON "MigrationRecord"("migrationRunId");

-- CreateIndex
CREATE INDEX "MigrationRecord_jobBatchId_idx" ON "MigrationRecord"("jobBatchId");

-- CreateIndex
CREATE INDEX "MigrationRecord_migrationIdentityId_idx" ON "MigrationRecord"("migrationIdentityId");

-- CreateIndex
CREATE INDEX "MigrationRecord_status_idx" ON "MigrationRecord"("status");

-- CreateIndex
CREATE INDEX "RecordError_migrationRecordId_idx" ON "RecordError"("migrationRecordId");

-- CreateIndex
CREATE INDEX "RecordError_errorCategory_idx" ON "RecordError"("errorCategory");

-- AddForeignKey
ALTER TABLE "MigrationJob" ADD CONSTRAINT "MigrationJob_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationJob" ADD CONSTRAINT "MigrationJob_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationConfigurationVersion" ADD CONSTRAINT "MigrationConfigurationVersion_migrationJobId_fkey" FOREIGN KEY ("migrationJobId") REFERENCES "MigrationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationConfigurationVersion" ADD CONSTRAINT "MigrationConfigurationVersion_sourceConnectionId_fkey" FOREIGN KEY ("sourceConnectionId") REFERENCES "Connection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationConfigurationVersion" ADD CONSTRAINT "MigrationConfigurationVersion_targetConnectionId_fkey" FOREIGN KEY ("targetConnectionId") REFERENCES "Connection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationConfigurationVersion" ADD CONSTRAINT "MigrationConfigurationVersion_sourceDataModelVersionId_fkey" FOREIGN KEY ("sourceDataModelVersionId") REFERENCES "DataModelVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationConfigurationVersion" ADD CONSTRAINT "MigrationConfigurationVersion_targetDataModelVersionId_fkey" FOREIGN KEY ("targetDataModelVersionId") REFERENCES "DataModelVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationConfigurationVersion" ADD CONSTRAINT "MigrationConfigurationVersion_mappingVersionId_fkey" FOREIGN KEY ("mappingVersionId") REFERENCES "MappingVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationConfigurationVersion" ADD CONSTRAINT "MigrationConfigurationVersion_transformationVersionId_fkey" FOREIGN KEY ("transformationVersionId") REFERENCES "TransformationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationConfigurationVersion" ADD CONSTRAINT "MigrationConfigurationVersion_validationVersionId_fkey" FOREIGN KEY ("validationVersionId") REFERENCES "ValidationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationConfigurationVersion" ADD CONSTRAINT "MigrationConfigurationVersion_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationIdentity" ADD CONSTRAINT "MigrationIdentity_migrationConfigurationVersionId_fkey" FOREIGN KEY ("migrationConfigurationVersionId") REFERENCES "MigrationConfigurationVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationRun" ADD CONSTRAINT "MigrationRun_migrationConfigurationVersionId_fkey" FOREIGN KEY ("migrationConfigurationVersionId") REFERENCES "MigrationConfigurationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobBatch" ADD CONSTRAINT "JobBatch_migrationRunId_fkey" FOREIGN KEY ("migrationRunId") REFERENCES "MigrationRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationRecord" ADD CONSTRAINT "MigrationRecord_migrationRunId_fkey" FOREIGN KEY ("migrationRunId") REFERENCES "MigrationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationRecord" ADD CONSTRAINT "MigrationRecord_jobBatchId_fkey" FOREIGN KEY ("jobBatchId") REFERENCES "JobBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationRecord" ADD CONSTRAINT "MigrationRecord_migrationIdentityId_fkey" FOREIGN KEY ("migrationIdentityId") REFERENCES "MigrationIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordError" ADD CONSTRAINT "RecordError_migrationRecordId_fkey" FOREIGN KEY ("migrationRecordId") REFERENCES "MigrationRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create Partial Unique Index for Published Migration Configuration Version
CREATE UNIQUE INDEX "MigrationConfigVer_migrationJobId_published_idx" ON "MigrationConfigurationVersion" ("migrationJobId") WHERE status = 'PUBLISHED';

