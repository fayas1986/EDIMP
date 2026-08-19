export type HierarchyLevel = 'Platform' | 'Partner' | 'Customer' | 'Project';

export type TenantIsolationMode = 
  | 'Dedicated Database Instance'
  | 'Dedicated Schema / Shared DB'
  | 'Shared Schema with RLS (Row-Level Security)';

export type KmsKeyType = 
  | 'Platform Managed KMS'
  | 'Partner Vault KMS'
  | 'Customer Managed BYOK';

export type TenantRegion = 
  | 'US-East (Virginia)'
  | 'EU-Central (Frankfurt)'
  | 'APAC-South (Singapore)'
  | 'LATAM-East (Sao Paulo)';

export type TenantSlaTier = 
  | '99.99% Enterprise Gold'
  | '99.95% Platinum 24/7'
  | '99.9% Partner Managed'
  | 'Standard Business';

export interface TenantRealtimeMetrics {
  activePipelines: number;
  throughputRecordsSec: number;
  throughputMbSec: number;
  activeConnections: number;
  latencyMs: number;
  rlsEnforcedCount: number;
  healthScore: number; // 0 - 100
  rateLimitQuotaRps: number;
  currentRps: number;
  storageUsageGb: number;
  storageQuotaGb: number;
  activeWorkerNodes: number;
}

export interface TenantNode {
  id: string;
  name: string;
  level: HierarchyLevel;
  code: string;
  parentId?: string;
  childrenIds: string[];
  isolationMode: TenantIsolationMode;
  kmsKeyType: KmsKeyType;
  region: TenantRegion;
  slaTier: TenantSlaTier;
  status: 'Active' | 'Provisioning' | 'Degraded' | 'Suspended';
  createdAt: string;
  contactEmail: string;
  primaryAdmin: string;
  realtimeMetrics: TenantRealtimeMetrics;
  assignedConnectorsCount?: number;
  notes?: string;
}

export interface TenantRealtimeEvent {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeName: string;
  level: HierarchyLevel;
  eventType: 
    | 'RLS_POLICY_ENFORCED'
    | 'THROUGHPUT_SPIKE'
    | 'ISOLATION_CHECK_PASSED'
    | 'KMS_KEY_ROTATED'
    | 'RATE_LIMIT_ADJUSTED'
    | 'PROJECT_MIGRATION_CUTOVER'
    | 'TENANT_PROVISIONED';
  severity: 'Info' | 'Success' | 'Warning' | 'Critical';
  message: string;
  metricsSnapshot?: {
    rps: number;
    latencyMs: number;
    recordsProcessed: number;
  };
}

export interface RequestContextTraceability {
  who: {
    principalId: string;
    principalName: string;
    role: string;
    authMethod: string;
  };
  whichPartner: {
    partnerId: string;
    partnerName: string;
    code: string;
  };
  whichTenant: {
    tenantId: string;
    tenantName: string;
    code: string;
  };
  whichOrganization: {
    orgId: string;
    orgName: string;
    division: string;
  };
  whichProject: {
    projectId: string;
    projectName: string;
    code: string;
  };
  whichMigration: {
    migrationId: string;
    jobName: string;
    batchRunId: string;
  };
  whichRecords: {
    recordRange: string;
    partitionKey: string;
    primaryKeySet: string[];
    recordCount: number;
  };
}

export type EnforcementLayerType =
  | 'Database'
  | 'API Gateway'
  | 'Service'
  | 'Event Queue'
  | 'Storage'
  | 'Authorization';

export interface EnforcementLayerDetail {
  layer: EnforcementLayerType;
  status: 'Enforced' | 'Validating' | 'Bypassed' | 'Blocked';
  mechanism: string;
  codeSnippet: string;
  enforcementMetrics: {
    evaluationsSec: number;
    blockedAttempts: number;
    avgLatencyMs: number;
  };
  details: string;
}

export interface TenantBreadcrumb {
  id: string;
  name: string;
  level: HierarchyLevel;
  code: string;
}
