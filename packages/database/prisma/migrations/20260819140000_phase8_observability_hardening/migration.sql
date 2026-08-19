DO $$ BEGIN
    CREATE TYPE "WorkerStatus" AS ENUM ('ACTIVE', 'IDLE', 'LEASE_EXPIRED', 'DRAINING', 'STOPPED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'EXECUTE', 'OVERRIDE', 'REPLAY', 'ACCEPT_SUGGESTION', 'REJECT_SUGGESTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "WorkerNode" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "ipAddress" TEXT,
    "status" "WorkerStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeLeaseCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "workspaceId" TEXT,
    "environmentId" TEXT,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "traceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkerNode_workerId_key" ON "WorkerNode"("workerId");
CREATE INDEX IF NOT EXISTS "WorkerNode_status_idx" ON "WorkerNode"("status");
CREATE INDEX IF NOT EXISTS "WorkerNode_lastHeartbeatAt_idx" ON "WorkerNode"("lastHeartbeatAt");

CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_traceId_idx" ON "AuditLog"("traceId");

DO $$ BEGIN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
