-- CreateEnum
CREATE TYPE "CanonicalModelVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "MappingDirection" AS ENUM ('SOURCE_TO_CANONICAL', 'CANONICAL_TO_TARGET');

-- CreateEnum
CREATE TYPE "MappingVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "TransformType" AS ENUM ('DIRECT', 'CONSTANT', 'LOOKUP', 'CONDITIONAL', 'EXPRESSION', 'CUSTOM_TRANSFORM');

-- CreateTable
CREATE TABLE "CanonicalModel" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CanonicalModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalModelVersion" (
    "id" TEXT NOT NULL,
    "canonicalModelId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "CanonicalModelVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "definitionHash" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanonicalModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalEntity" (
    "id" TEXT NOT NULL,
    "canonicalModelVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanonicalEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalField" (
    "id" TEXT NOT NULL,
    "canonicalEntityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataType" "DataType" NOT NULL DEFAULT 'UNKNOWN',
    "isNullable" BOOLEAN NOT NULL DEFAULT true,
    "isPrimaryKey" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanonicalField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MappingSet" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "direction" "MappingDirection" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MappingSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MappingVersion" (
    "id" TEXT NOT NULL,
    "mappingSetId" TEXT NOT NULL,
    "canonicalModelVersionId" TEXT NOT NULL,
    "dataModelVersionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "MappingVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "definitionHash" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MappingVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityMapping" (
    "id" TEXT NOT NULL,
    "mappingVersionId" TEXT NOT NULL,
    "sourceEntityId" TEXT,
    "canonicalEntityId" TEXT,
    "targetEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldMapping" (
    "id" TEXT NOT NULL,
    "entityMappingId" TEXT NOT NULL,
    "sourceFieldId" TEXT,
    "canonicalFieldId" TEXT,
    "targetFieldId" TEXT,
    "transformType" "TransformType" NOT NULL DEFAULT 'DIRECT',
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CanonicalModel_workspaceId_idx" ON "CanonicalModel"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalModelVersion_canonicalModelId_version_key" ON "CanonicalModelVersion"("canonicalModelId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalEntity_canonicalModelVersionId_name_key" ON "CanonicalEntity"("canonicalModelVersionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalField_canonicalEntityId_name_key" ON "CanonicalField"("canonicalEntityId", "name");

-- CreateIndex
CREATE INDEX "MappingSet_workspaceId_idx" ON "MappingSet"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "MappingVersion_mappingSetId_version_key" ON "MappingVersion"("mappingSetId", "version");

-- CreateIndex
CREATE INDEX "EntityMapping_mappingVersionId_idx" ON "EntityMapping"("mappingVersionId");

-- CreateIndex
CREATE INDEX "FieldMapping_entityMappingId_idx" ON "FieldMapping"("entityMappingId");

-- AddForeignKey
ALTER TABLE "CanonicalModel" ADD CONSTRAINT "CanonicalModel_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalModelVersion" ADD CONSTRAINT "CanonicalModelVersion_canonicalModelId_fkey" FOREIGN KEY ("canonicalModelId") REFERENCES "CanonicalModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalModelVersion" ADD CONSTRAINT "CanonicalModelVersion_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalEntity" ADD CONSTRAINT "CanonicalEntity_canonicalModelVersionId_fkey" FOREIGN KEY ("canonicalModelVersionId") REFERENCES "CanonicalModelVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalField" ADD CONSTRAINT "CanonicalField_canonicalEntityId_fkey" FOREIGN KEY ("canonicalEntityId") REFERENCES "CanonicalEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingSet" ADD CONSTRAINT "MappingSet_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingVersion" ADD CONSTRAINT "MappingVersion_mappingSetId_fkey" FOREIGN KEY ("mappingSetId") REFERENCES "MappingSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingVersion" ADD CONSTRAINT "MappingVersion_canonicalModelVersionId_fkey" FOREIGN KEY ("canonicalModelVersionId") REFERENCES "CanonicalModelVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingVersion" ADD CONSTRAINT "MappingVersion_dataModelVersionId_fkey" FOREIGN KEY ("dataModelVersionId") REFERENCES "DataModelVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingVersion" ADD CONSTRAINT "MappingVersion_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMapping" ADD CONSTRAINT "EntityMapping_mappingVersionId_fkey" FOREIGN KEY ("mappingVersionId") REFERENCES "MappingVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMapping" ADD CONSTRAINT "EntityMapping_sourceEntityId_fkey" FOREIGN KEY ("sourceEntityId") REFERENCES "DataEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMapping" ADD CONSTRAINT "EntityMapping_canonicalEntityId_fkey" FOREIGN KEY ("canonicalEntityId") REFERENCES "CanonicalEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMapping" ADD CONSTRAINT "EntityMapping_targetEntityId_fkey" FOREIGN KEY ("targetEntityId") REFERENCES "DataEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldMapping" ADD CONSTRAINT "FieldMapping_entityMappingId_fkey" FOREIGN KEY ("entityMappingId") REFERENCES "EntityMapping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldMapping" ADD CONSTRAINT "FieldMapping_sourceFieldId_fkey" FOREIGN KEY ("sourceFieldId") REFERENCES "DataField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldMapping" ADD CONSTRAINT "FieldMapping_canonicalFieldId_fkey" FOREIGN KEY ("canonicalFieldId") REFERENCES "CanonicalField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldMapping" ADD CONSTRAINT "FieldMapping_targetFieldId_fkey" FOREIGN KEY ("targetFieldId") REFERENCES "DataField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Partial Unique Indexes
CREATE UNIQUE INDEX "CanonicalModelVersion_canonicalModelId_published_idx"
ON "CanonicalModelVersion" ("canonicalModelId")
WHERE status = 'PUBLISHED';

CREATE UNIQUE INDEX "MappingVersion_mappingSetId_published_idx"
ON "MappingVersion" ("mappingSetId")
WHERE status = 'PUBLISHED';

CREATE UNIQUE INDEX "CanonicalModel_workspaceId_name_deletedAt_idx"
ON "CanonicalModel" ("workspaceId", "name")
WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "MappingSet_workspaceId_name_deletedAt_idx"
ON "MappingSet" ("workspaceId", "name")
WHERE "deletedAt" IS NULL;

-- PostgreSQL CHECK Constraints
ALTER TABLE "EntityMapping" ADD CONSTRAINT "chk_entity_mapping_references" CHECK (
  ("sourceEntityId" IS NOT NULL AND "canonicalEntityId" IS NOT NULL AND "targetEntityId" IS NULL) OR
  ("canonicalEntityId" IS NOT NULL AND "targetEntityId" IS NOT NULL AND "sourceEntityId" IS NULL)
);

ALTER TABLE "FieldMapping" ADD CONSTRAINT "chk_field_mapping_references" CHECK (
  ("canonicalFieldId" IS NOT NULL) AND (
    ("sourceFieldId" IS NOT NULL OR "transformType" = 'CONSTANT') OR
    ("targetFieldId" IS NOT NULL)
  )
);
