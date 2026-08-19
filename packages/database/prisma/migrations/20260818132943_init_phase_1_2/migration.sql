-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('ADMIN', 'MEMBER', 'BILLING');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "EnvironmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ConnectorCategory" AS ENUM ('ERP', 'CRM', 'DATABASE', 'API', 'FILE', 'CLOUD_STORAGE', 'DATA_WAREHOUSE');

-- CreateEnum
CREATE TYPE "ConnectorDirection" AS ENUM ('SOURCE', 'TARGET', 'BOTH');

-- CreateEnum
CREATE TYPE "ConnectorStatus" AS ENUM ('ACTIVE', 'DEPRECATED', 'SUNSET');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TESTING', 'ERROR');

-- CreateEnum
CREATE TYPE "DataModelVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ProfileRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProfileMetricType" AS ENUM ('RECORD_COUNT', 'NULL_COUNT', 'DISTINCT_COUNT', 'DUPLICATE_COUNT', 'MIN_VALUE', 'MAX_VALUE', 'DATA_TYPE_DISTRIBUTION', 'FORMAT_DISTRIBUTION');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('OAUTH', 'BASIC', 'API_KEY', 'BEARER_TOKEN');

-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'DATETIME', 'JSON', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantMember" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TenantRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Environment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "EnvironmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Environment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ConnectorCategory" NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "direction" "ConnectorDirection" NOT NULL DEFAULT 'BOTH',
    "status" "ConnectorStatus" NOT NULL DEFAULT 'ACTIVE',
    "capabilities" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectorType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "connectorTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredentialReference" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "credentialType" "CredentialType" NOT NULL,
    "vaultPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CredentialReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataModel" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DataModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataModelVersion" (
    "id" TEXT NOT NULL,
    "dataModelId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "DataModelVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataEntity" (
    "id" TEXT NOT NULL,
    "dataModelVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataField" (
    "id" TEXT NOT NULL,
    "dataEntityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataType" "DataType" NOT NULL DEFAULT 'UNKNOWN',
    "isNullable" BOOLEAN NOT NULL DEFAULT true,
    "isPrimaryKey" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataProfileRun" (
    "id" TEXT NOT NULL,
    "dataModelVersionId" TEXT NOT NULL,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "ProfileRunStatus" NOT NULL DEFAULT 'QUEUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataProfileRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataProfileMetric" (
    "id" TEXT NOT NULL,
    "dataProfileRunId" TEXT NOT NULL,
    "dataEntityId" TEXT,
    "dataFieldId" TEXT,
    "metricType" "ProfileMetricType" NOT NULL,
    "metricValue" JSONB NOT NULL,
    "snapshotName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataProfileMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TenantMember_userId_idx" ON "TenantMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantMember_tenantId_userId_key" ON "TenantMember"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "Workspace_tenantId_idx" ON "Workspace"("tenantId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "Environment_workspaceId_idx" ON "Environment"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectorType_name_key" ON "ConnectorType"("name");

-- CreateIndex
CREATE INDEX "Connection_connectorTypeId_idx" ON "Connection"("connectorTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialReference_connectionId_key" ON "CredentialReference"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "DataModelVersion_dataModelId_version_key" ON "DataModelVersion"("dataModelId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "DataEntity_dataModelVersionId_name_key" ON "DataEntity"("dataModelVersionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "DataField_dataEntityId_name_key" ON "DataField"("dataEntityId", "name");

-- CreateIndex
CREATE INDEX "DataProfileRun_dataModelVersionId_status_idx" ON "DataProfileRun"("dataModelVersionId", "status");

-- CreateIndex
CREATE INDEX "DataProfileMetric_dataProfileRunId_idx" ON "DataProfileMetric"("dataProfileRunId");

-- CreateIndex
CREATE INDEX "DataProfileMetric_dataProfileRunId_metricType_idx" ON "DataProfileMetric"("dataProfileRunId", "metricType");

-- CreateIndex
CREATE INDEX "DataProfileMetric_dataEntityId_idx" ON "DataProfileMetric"("dataEntityId");

-- CreateIndex
CREATE INDEX "DataProfileMetric_dataFieldId_idx" ON "DataProfileMetric"("dataFieldId");

-- AddForeignKey
ALTER TABLE "TenantMember" ADD CONSTRAINT "TenantMember_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantMember" ADD CONSTRAINT "TenantMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Environment" ADD CONSTRAINT "Environment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_connectorTypeId_fkey" FOREIGN KEY ("connectorTypeId") REFERENCES "ConnectorType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredentialReference" ADD CONSTRAINT "CredentialReference_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataModel" ADD CONSTRAINT "DataModel_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataModelVersion" ADD CONSTRAINT "DataModelVersion_dataModelId_fkey" FOREIGN KEY ("dataModelId") REFERENCES "DataModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataEntity" ADD CONSTRAINT "DataEntity_dataModelVersionId_fkey" FOREIGN KEY ("dataModelVersionId") REFERENCES "DataModelVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataField" ADD CONSTRAINT "DataField_dataEntityId_fkey" FOREIGN KEY ("dataEntityId") REFERENCES "DataEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataProfileRun" ADD CONSTRAINT "DataProfileRun_dataModelVersionId_fkey" FOREIGN KEY ("dataModelVersionId") REFERENCES "DataModelVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataProfileMetric" ADD CONSTRAINT "DataProfileMetric_dataProfileRunId_fkey" FOREIGN KEY ("dataProfileRunId") REFERENCES "DataProfileRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataProfileMetric" ADD CONSTRAINT "DataProfileMetric_dataEntityId_fkey" FOREIGN KEY ("dataEntityId") REFERENCES "DataEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataProfileMetric" ADD CONSTRAINT "DataProfileMetric_dataFieldId_fkey" FOREIGN KEY ("dataFieldId") REFERENCES "DataField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- 1. Partial unique index ensuring only one PUBLISHED DataModelVersion exists per DataModel
CREATE UNIQUE INDEX "DataModelVersion_dataModelId_published_key" 
ON "DataModelVersion"("dataModelId") 
WHERE "status" = 'PUBLISHED';

-- 2. Partial unique index for Tenant name (soft delete support)
CREATE UNIQUE INDEX "Tenant_name_key" 
ON "Tenant"("name") 
WHERE "deletedAt" IS NULL;

-- 3. Partial unique index for Workspace (tenantId, name)
CREATE UNIQUE INDEX "Workspace_tenantId_name_key" 
ON "Workspace"("tenantId", "name") 
WHERE "deletedAt" IS NULL;

-- 4. Partial unique index for Environment (workspaceId, name)
CREATE UNIQUE INDEX "Environment_workspaceId_name_key" 
ON "Environment"("workspaceId", "name") 
WHERE "deletedAt" IS NULL;

-- 5. Partial unique index for Connection (environmentId, name)
CREATE UNIQUE INDEX "Connection_environmentId_name_key" 
ON "Connection"("environmentId", "name") 
WHERE "deletedAt" IS NULL;

-- 6. Partial unique index for DataModel (connectionId, name)
CREATE UNIQUE INDEX "DataModel_connectionId_name_key" 
ON "DataModel"("connectionId", "name") 
WHERE "deletedAt" IS NULL;
