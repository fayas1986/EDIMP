-- CreateEnum
CREATE TYPE "TransformationVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ValidationVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('NOT_NULL', 'REGEX', 'RANGE', 'TYPE_CHECK', 'ENUM_MATCH');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('ERROR', 'WARNING');

-- CreateEnum
CREATE TYPE "PipelineJobStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExecutionRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR', 'DEBUG');

-- CreateTable
CREATE TABLE "TransformationSet" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TransformationSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransformationVersion" (
    "id" TEXT NOT NULL,
    "transformationSetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "TransformationVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "definitionHash" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransformationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldTransformation" (
    "id" TEXT NOT NULL,
    "transformationVersionId" TEXT NOT NULL,
    "targetFieldIdentifier" TEXT NOT NULL,
    "transformType" "TransformType" NOT NULL DEFAULT 'DIRECT',
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldTransformation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationSet" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ValidationSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationVersion" (
    "id" TEXT NOT NULL,
    "validationSetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ValidationVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "definitionHash" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldValidationRule" (
    "id" TEXT NOT NULL,
    "validationVersionId" TEXT NOT NULL,
    "targetFieldIdentifier" TEXT NOT NULL,
    "ruleType" "RuleType" NOT NULL,
    "ruleConfig" JSONB NOT NULL DEFAULT '{}',
    "severity" "Severity" NOT NULL DEFAULT 'ERROR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldValidationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineJob" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "mappingVersionId" TEXT NOT NULL,
    "transformationVersionId" TEXT NOT NULL,
    "validationVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "PipelineJobStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PipelineJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineExecutionRun" (
    "id" TEXT NOT NULL,
    "pipelineJobId" TEXT NOT NULL,
    "mappingVersionId" TEXT NOT NULL,
    "transformationVersionId" TEXT NOT NULL,
    "validationVersionId" TEXT NOT NULL,
    "mappingDefinitionHash" TEXT,
    "transformationDefinitionHash" TEXT,
    "validationDefinitionHash" TEXT,
    "status" "ExecutionRunStatus" NOT NULL DEFAULT 'QUEUED',
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "recordsProcessed" BIGINT NOT NULL DEFAULT 0,
    "recordsTransformed" BIGINT NOT NULL DEFAULT 0,
    "recordsValidated" BIGINT NOT NULL DEFAULT 0,
    "recordsValidationFailed" BIGINT NOT NULL DEFAULT 0,
    "recordsTransformationFailed" BIGINT NOT NULL DEFAULT 0,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PipelineExecutionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineExecutionLog" (
    "id" TEXT NOT NULL,
    "pipelineExecutionRunId" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PipelineExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransformationSet_workspaceId_idx" ON "TransformationSet"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "TransformationVersion_transformationSetId_version_key" ON "TransformationVersion"("transformationSetId", "version");

-- CreateIndex
CREATE INDEX "FieldTransformation_transformationVersionId_idx" ON "FieldTransformation"("transformationVersionId");

-- CreateIndex
CREATE INDEX "ValidationSet_workspaceId_idx" ON "ValidationSet"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ValidationVersion_validationSetId_version_key" ON "ValidationVersion"("validationSetId", "version");

-- CreateIndex
CREATE INDEX "FieldValidationRule_validationVersionId_idx" ON "FieldValidationRule"("validationVersionId");

-- CreateIndex
CREATE INDEX "PipelineJob_workspaceId_idx" ON "PipelineJob"("workspaceId");

-- CreateIndex
CREATE INDEX "PipelineJob_environmentId_idx" ON "PipelineJob"("environmentId");

-- CreateIndex
CREATE INDEX "PipelineExecutionRun_pipelineJobId_idx" ON "PipelineExecutionRun"("pipelineJobId");

-- CreateIndex
CREATE INDEX "PipelineExecutionRun_status_idx" ON "PipelineExecutionRun"("status");

-- CreateIndex
CREATE INDEX "PipelineExecutionLog_pipelineExecutionRunId_idx" ON "PipelineExecutionLog"("pipelineExecutionRunId");

-- AddForeignKey
ALTER TABLE "TransformationSet" ADD CONSTRAINT "TransformationSet_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransformationVersion" ADD CONSTRAINT "TransformationVersion_transformationSetId_fkey" FOREIGN KEY ("transformationSetId") REFERENCES "TransformationSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransformationVersion" ADD CONSTRAINT "TransformationVersion_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldTransformation" ADD CONSTRAINT "FieldTransformation_transformationVersionId_fkey" FOREIGN KEY ("transformationVersionId") REFERENCES "TransformationVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationSet" ADD CONSTRAINT "ValidationSet_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationVersion" ADD CONSTRAINT "ValidationVersion_validationSetId_fkey" FOREIGN KEY ("validationSetId") REFERENCES "ValidationSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationVersion" ADD CONSTRAINT "ValidationVersion_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldValidationRule" ADD CONSTRAINT "FieldValidationRule_validationVersionId_fkey" FOREIGN KEY ("validationVersionId") REFERENCES "ValidationVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineJob" ADD CONSTRAINT "PipelineJob_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineJob" ADD CONSTRAINT "PipelineJob_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineJob" ADD CONSTRAINT "PipelineJob_mappingVersionId_fkey" FOREIGN KEY ("mappingVersionId") REFERENCES "MappingVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineJob" ADD CONSTRAINT "PipelineJob_transformationVersionId_fkey" FOREIGN KEY ("transformationVersionId") REFERENCES "TransformationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineJob" ADD CONSTRAINT "PipelineJob_validationVersionId_fkey" FOREIGN KEY ("validationVersionId") REFERENCES "ValidationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineExecutionRun" ADD CONSTRAINT "PipelineExecutionRun_pipelineJobId_fkey" FOREIGN KEY ("pipelineJobId") REFERENCES "PipelineJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineExecutionLog" ADD CONSTRAINT "PipelineExecutionLog_pipelineExecutionRunId_fkey" FOREIGN KEY ("pipelineExecutionRunId") REFERENCES "PipelineExecutionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Partial Unique Indexes for Published Version Invariant
CREATE UNIQUE INDEX "TransformationVersion_transformationSetId_published_idx"
ON "TransformationVersion" ("transformationSetId")
WHERE status = 'PUBLISHED';

CREATE UNIQUE INDEX "ValidationVersion_validationSetId_published_idx"
ON "ValidationVersion" ("validationSetId")
WHERE status = 'PUBLISHED';

-- Partial Unique Indexes for Soft-Deleted Names
CREATE UNIQUE INDEX "TransformationSet_workspaceId_name_deletedAt_idx"
ON "TransformationSet" ("workspaceId", "name")
WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "ValidationSet_workspaceId_name_deletedAt_idx"
ON "ValidationSet" ("workspaceId", "name")
WHERE "deletedAt" IS NULL;

