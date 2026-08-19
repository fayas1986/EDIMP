import {
  TenantNode,
  TenantRealtimeEvent,
  TenantBreadcrumb,
  HierarchyLevel,
  TenantIsolationMode,
  KmsKeyType,
  TenantRegion,
  TenantSlaTier,
} from '../types/tenantHierarchy';

// Initial Hierarchy Tree according to EDMP Architecture Model
const INITIAL_TENANT_NODES: TenantNode[] = [
  // 1. ROOT LEVEL
  {
    id: 'root-edmp',
    name: 'EDMP Platform',
    level: 'Platform',
    code: 'EDMP-ROOT',
    childrenIds: ['partner-a', 'partner-b', 'direct-enterprise'],
    isolationMode: 'Dedicated Database Instance',
    kmsKeyType: 'Platform Managed KMS',
    region: 'US-East (Virginia)',
    slaTier: '99.99% Enterprise Gold',
    status: 'Active',
    createdAt: '2025-01-01',
    contactEmail: 'ops-admin@edmp-platform.io',
    primaryAdmin: 'Global Platform Operations',
    realtimeMetrics: {
      activePipelines: 18,
      throughputRecordsSec: 24850,
      throughputMbSec: 48.2,
      activeConnections: 142,
      latencyMs: 14,
      rlsEnforcedCount: 1892000,
      healthScore: 99,
      rateLimitQuotaRps: 10000,
      currentRps: 2480,
      storageUsageGb: 3420,
      storageQuotaGb: 10000,
      activeWorkerNodes: 24,
    },
    notes: 'Global Master Root Node for multi-tenant enterprise data migration orchestration.',
  },

  // 2. PARTNER A
  {
    id: 'partner-a',
    parentId: 'root-edmp',
    name: 'Partner A',
    level: 'Partner',
    code: 'PARTNER-A',
    childrenIds: ['cust-001', 'cust-002', 'cust-003'],
    isolationMode: 'Dedicated Schema / Shared DB',
    kmsKeyType: 'Partner Vault KMS',
    region: 'US-East (Virginia)',
    slaTier: '99.95% Platinum 24/7',
    status: 'Active',
    createdAt: '2025-02-15',
    contactEmail: 'partner-a-admin@cloudmsp.com',
    primaryAdmin: 'Partner A Solutions Architect',
    realtimeMetrics: {
      activePipelines: 8,
      throughputRecordsSec: 12400,
      throughputMbSec: 22.4,
      activeConnections: 64,
      latencyMs: 18,
      rlsEnforcedCount: 940000,
      healthScore: 98,
      rateLimitQuotaRps: 4000,
      currentRps: 1240,
      storageUsageGb: 1280,
      storageQuotaGb: 4000,
      activeWorkerNodes: 10,
    },
    notes: 'Tier-1 Systems Integrator servicing Customer 001, 002, and 003.',
  },

  // CUSTOMER 001 (Under Partner A)
  {
    id: 'cust-001',
    parentId: 'partner-a',
    name: 'Customer 001',
    level: 'Customer',
    code: 'CUST-001',
    childrenIds: ['proj-001-a', 'proj-001-b'],
    isolationMode: 'Shared Schema with RLS (Row-Level Security)',
    kmsKeyType: 'Customer Managed BYOK',
    region: 'US-East (Virginia)',
    slaTier: '99.99% Enterprise Gold',
    status: 'Active',
    createdAt: '2025-03-01',
    contactEmail: 'it-lead@customer001.corp',
    primaryAdmin: 'Customer 001 Lead Architect',
    realtimeMetrics: {
      activePipelines: 5,
      throughputRecordsSec: 8200,
      throughputMbSec: 15.1,
      activeConnections: 38,
      latencyMs: 16,
      rlsEnforcedCount: 620000,
      healthScore: 100,
      rateLimitQuotaRps: 2000,
      currentRps: 820,
      storageUsageGb: 850,
      storageQuotaGb: 2000,
      activeWorkerNodes: 6,
    },
    notes: 'Major retail client undergoing dual ERP & CRM migration.',
  },
  {
    id: 'proj-001-a',
    parentId: 'cust-001',
    name: 'Project A',
    level: 'Project',
    code: 'PROJ-001-A',
    childrenIds: [],
    isolationMode: 'Shared Schema with RLS (Row-Level Security)',
    kmsKeyType: 'Customer Managed BYOK',
    region: 'US-East (Virginia)',
    slaTier: '99.99% Enterprise Gold',
    status: 'Active',
    createdAt: '2025-03-10',
    contactEmail: 'pm-projA@customer001.corp',
    primaryAdmin: 'Project A Lead Engineer',
    realtimeMetrics: {
      activePipelines: 3,
      throughputRecordsSec: 5100,
      throughputMbSec: 9.4,
      activeConnections: 22,
      latencyMs: 15,
      rlsEnforcedCount: 380000,
      healthScore: 99,
      rateLimitQuotaRps: 1200,
      currentRps: 510,
      storageUsageGb: 520,
      storageQuotaGb: 1000,
      activeWorkerNodes: 4,
    },
    notes: 'Dynamics 365 Business Central Core Financials Migration.',
  },
  {
    id: 'proj-001-b',
    parentId: 'cust-001',
    name: 'Project B',
    level: 'Project',
    code: 'PROJ-001-B',
    childrenIds: [],
    isolationMode: 'Shared Schema with RLS (Row-Level Security)',
    kmsKeyType: 'Customer Managed BYOK',
    region: 'US-East (Virginia)',
    slaTier: '99.99% Enterprise Gold',
    status: 'Active',
    createdAt: '2025-04-01',
    contactEmail: 'pm-projB@customer001.corp',
    primaryAdmin: 'Project B Data Architect',
    realtimeMetrics: {
      activePipelines: 2,
      throughputRecordsSec: 3100,
      throughputMbSec: 5.7,
      activeConnections: 16,
      latencyMs: 17,
      rlsEnforcedCount: 240000,
      healthScore: 98,
      rateLimitQuotaRps: 800,
      currentRps: 310,
      storageUsageGb: 330,
      storageQuotaGb: 1000,
      activeWorkerNodes: 2,
    },
    notes: 'Salesforce CRM Customer Master Synchronization Pipeline.',
  },

  // CUSTOMER 002 (Under Partner A)
  {
    id: 'cust-002',
    parentId: 'partner-a',
    name: 'Customer 002',
    level: 'Customer',
    code: 'CUST-002',
    childrenIds: ['proj-002-a'],
    isolationMode: 'Dedicated Schema / Shared DB',
    kmsKeyType: 'Partner Vault KMS',
    region: 'US-East (Virginia)',
    slaTier: '99.95% Platinum 24/7',
    status: 'Active',
    createdAt: '2025-03-15',
    contactEmail: 'cio@customer002.com',
    primaryAdmin: 'Customer 002 Admin',
    realtimeMetrics: {
      activePipelines: 3,
      throughputRecordsSec: 4200,
      throughputMbSec: 7.3,
      activeConnections: 26,
      latencyMs: 20,
      rlsEnforcedCount: 320000,
      healthScore: 96,
      rateLimitQuotaRps: 1500,
      currentRps: 420,
      storageUsageGb: 430,
      storageQuotaGb: 1500,
      activeWorkerNodes: 4,
    },
    notes: 'Logistics provider shifting legacy SQL Server to SAP S/4HANA.',
  },
  {
    id: 'proj-002-a',
    parentId: 'cust-002',
    name: 'Project A',
    level: 'Project',
    code: 'PROJ-002-A',
    childrenIds: [],
    isolationMode: 'Dedicated Schema / Shared DB',
    kmsKeyType: 'Partner Vault KMS',
    region: 'US-East (Virginia)',
    slaTier: '99.95% Platinum 24/7',
    status: 'Active',
    createdAt: '2025-03-20',
    contactEmail: 'migration-lead@customer002.com',
    primaryAdmin: 'Project A Lead',
    realtimeMetrics: {
      activePipelines: 3,
      throughputRecordsSec: 4200,
      throughputMbSec: 7.3,
      activeConnections: 26,
      latencyMs: 20,
      rlsEnforcedCount: 320000,
      healthScore: 96,
      rateLimitQuotaRps: 1500,
      currentRps: 420,
      storageUsageGb: 430,
      storageQuotaGb: 1500,
      activeWorkerNodes: 4,
    },
    notes: 'SAP S/4HANA Supply Chain & Inventory Ingestion.',
  },

  // CUSTOMER 003 (Under Partner A)
  {
    id: 'cust-003',
    parentId: 'partner-a',
    name: 'Customer 003',
    level: 'Customer',
    code: 'CUST-003',
    childrenIds: [],
    isolationMode: 'Shared Schema with RLS (Row-Level Security)',
    kmsKeyType: 'Platform Managed KMS',
    region: 'US-East (Virginia)',
    slaTier: 'Standard Business',
    status: 'Provisioning',
    createdAt: '2025-07-01',
    contactEmail: 'onboarding@customer003.net',
    primaryAdmin: 'Partner A Onboarding Team',
    realtimeMetrics: {
      activePipelines: 0,
      throughputRecordsSec: 0,
      throughputMbSec: 0,
      activeConnections: 0,
      latencyMs: 0,
      rlsEnforcedCount: 0,
      healthScore: 100,
      rateLimitQuotaRps: 500,
      currentRps: 0,
      storageUsageGb: 0,
      storageQuotaGb: 500,
      activeWorkerNodes: 0,
    },
    notes: 'Newly onboarded client in initial schema discovery phase.',
  },

  // 3. PARTNER B
  {
    id: 'partner-b',
    parentId: 'root-edmp',
    name: 'Partner B',
    level: 'Partner',
    code: 'PARTNER-B',
    childrenIds: ['cust-004', 'cust-005'],
    isolationMode: 'Dedicated Schema / Shared DB',
    kmsKeyType: 'Partner Vault KMS',
    region: 'EU-Central (Frankfurt)',
    slaTier: '99.9% Partner Managed',
    status: 'Active',
    createdAt: '2025-03-01',
    contactEmail: 'admin@partner-b-solutions.eu',
    primaryAdmin: 'Partner B Regional Director',
    realtimeMetrics: {
      activePipelines: 4,
      throughputRecordsSec: 5850,
      throughputMbSec: 11.2,
      activeConnections: 36,
      latencyMs: 24,
      rlsEnforcedCount: 412000,
      healthScore: 97,
      rateLimitQuotaRps: 3000,
      currentRps: 585,
      storageUsageGb: 890,
      storageQuotaGb: 3000,
      activeWorkerNodes: 6,
    },
    notes: 'European Managed Service Partner covering Customer 004 and Customer 005.',
  },
  {
    id: 'cust-004',
    parentId: 'partner-b',
    name: 'Customer 004',
    level: 'Customer',
    code: 'CUST-004',
    childrenIds: ['proj-004-a'],
    isolationMode: 'Shared Schema with RLS (Row-Level Security)',
    kmsKeyType: 'Partner Vault KMS',
    region: 'EU-Central (Frankfurt)',
    slaTier: '99.9% Partner Managed',
    status: 'Active',
    createdAt: '2025-04-10',
    contactEmail: 'data@customer004.de',
    primaryAdmin: 'Customer 004 Data Manager',
    realtimeMetrics: {
      activePipelines: 2,
      throughputRecordsSec: 3200,
      throughputMbSec: 6.1,
      activeConnections: 20,
      latencyMs: 22,
      rlsEnforcedCount: 215000,
      healthScore: 97,
      rateLimitQuotaRps: 1200,
      currentRps: 320,
      storageUsageGb: 480,
      storageQuotaGb: 1500,
      activeWorkerNodes: 3,
    },
    notes: 'German Automotive Supplier migrating to Cloud ERP.',
  },
  {
    id: 'proj-004-a',
    parentId: 'cust-004',
    name: 'Project Alpha',
    level: 'Project',
    code: 'PROJ-004-A',
    childrenIds: [],
    isolationMode: 'Shared Schema with RLS (Row-Level Security)',
    kmsKeyType: 'Partner Vault KMS',
    region: 'EU-Central (Frankfurt)',
    slaTier: '99.9% Partner Managed',
    status: 'Active',
    createdAt: '2025-04-15',
    contactEmail: 'project-alpha@customer004.de',
    primaryAdmin: 'Project Alpha Tech Lead',
    realtimeMetrics: {
      activePipelines: 2,
      throughputRecordsSec: 3200,
      throughputMbSec: 6.1,
      activeConnections: 20,
      latencyMs: 22,
      rlsEnforcedCount: 215000,
      healthScore: 97,
      rateLimitQuotaRps: 1200,
      currentRps: 320,
      storageUsageGb: 480,
      storageQuotaGb: 1500,
      activeWorkerNodes: 3,
    },
    notes: 'SAP ERP Material Master & Vendor Ledger Migration.',
  },

  {
    id: 'cust-005',
    parentId: 'partner-b',
    name: 'Customer 005',
    level: 'Customer',
    code: 'CUST-005',
    childrenIds: ['proj-005-a'],
    isolationMode: 'Dedicated Schema / Shared DB',
    kmsKeyType: 'Partner Vault KMS',
    region: 'EU-Central (Frankfurt)',
    slaTier: '99.9% Partner Managed',
    status: 'Active',
    createdAt: '2025-05-01',
    contactEmail: 'tech@customer005.ch',
    primaryAdmin: 'Customer 005 Systems Admin',
    realtimeMetrics: {
      activePipelines: 2,
      throughputRecordsSec: 2650,
      throughputMbSec: 5.1,
      activeConnections: 16,
      latencyMs: 26,
      rlsEnforcedCount: 197000,
      healthScore: 96,
      rateLimitQuotaRps: 1000,
      currentRps: 265,
      storageUsageGb: 410,
      storageQuotaGb: 1500,
      activeWorkerNodes: 3,
    },
    notes: 'Swiss Financial Technology provider under GDPR isolation rules.',
  },
  {
    id: 'proj-005-a',
    parentId: 'cust-005',
    name: 'Project ERP Cutover',
    level: 'Project',
    code: 'PROJ-005-A',
    childrenIds: [],
    isolationMode: 'Dedicated Schema / Shared DB',
    kmsKeyType: 'Partner Vault KMS',
    region: 'EU-Central (Frankfurt)',
    slaTier: '99.9% Partner Managed',
    status: 'Active',
    createdAt: '2025-05-10',
    contactEmail: 'cutover@customer005.ch',
    primaryAdmin: 'Project ERP Cutover Manager',
    realtimeMetrics: {
      activePipelines: 2,
      throughputRecordsSec: 2650,
      throughputMbSec: 5.1,
      activeConnections: 16,
      latencyMs: 26,
      rlsEnforcedCount: 197000,
      healthScore: 96,
      rateLimitQuotaRps: 1000,
      currentRps: 265,
      storageUsageGb: 410,
      storageQuotaGb: 1500,
      activeWorkerNodes: 3,
    },
    notes: 'General Ledger & Payment Reconciliation Cutover Sync.',
  },

  // 4. DIRECT ENTERPRISE CUSTOMER
  {
    id: 'direct-enterprise',
    parentId: 'root-edmp',
    name: 'Direct Enterprise Customer',
    level: 'Customer',
    code: 'DIRECT-ENT',
    childrenIds: ['proj-direct-a', 'proj-direct-b'],
    isolationMode: 'Dedicated Database Instance',
    kmsKeyType: 'Customer Managed BYOK',
    region: 'US-East (Virginia)',
    slaTier: '99.99% Enterprise Gold',
    status: 'Active',
    createdAt: '2025-01-20',
    contactEmail: 'enterprise-data@directcorp.global',
    primaryAdmin: 'Direct Enterprise VP of Engineering',
    realtimeMetrics: {
      activePipelines: 6,
      throughputRecordsSec: 6600,
      throughputMbSec: 14.6,
      activeConnections: 42,
      latencyMs: 12,
      rlsEnforcedCount: 540000,
      healthScore: 100,
      rateLimitQuotaRps: 3000,
      currentRps: 660,
      storageUsageGb: 1250,
      storageQuotaGb: 3000,
      activeWorkerNodes: 8,
    },
    notes: 'Direct Tier-1 Enterprise contract with dedicated Cloud SQL cluster and custom BYOK.',
  },
  {
    id: 'proj-direct-a',
    parentId: 'direct-enterprise',
    name: 'Project A',
    level: 'Project',
    code: 'PROJ-DIR-A',
    childrenIds: [],
    isolationMode: 'Dedicated Database Instance',
    kmsKeyType: 'Customer Managed BYOK',
    region: 'US-East (Virginia)',
    slaTier: '99.99% Enterprise Gold',
    status: 'Active',
    createdAt: '2025-02-01',
    contactEmail: 'proj-a@directcorp.global',
    primaryAdmin: 'Project A Lead Architect',
    realtimeMetrics: {
      activePipelines: 4,
      throughputRecordsSec: 4200,
      throughputMbSec: 9.2,
      activeConnections: 28,
      latencyMs: 11,
      rlsEnforcedCount: 340000,
      healthScore: 100,
      rateLimitQuotaRps: 2000,
      currentRps: 420,
      storageUsageGb: 800,
      storageQuotaGb: 2000,
      activeWorkerNodes: 5,
    },
    notes: 'Enterprise Core SAP to Business Central Cloud Engine.',
  },
  {
    id: 'proj-direct-b',
    parentId: 'direct-enterprise',
    name: 'Project B',
    level: 'Project',
    code: 'PROJ-DIR-B',
    childrenIds: [],
    isolationMode: 'Dedicated Database Instance',
    kmsKeyType: 'Customer Managed BYOK',
    region: 'US-East (Virginia)',
    slaTier: '99.99% Enterprise Gold',
    status: 'Active',
    createdAt: '2025-03-01',
    contactEmail: 'proj-b@directcorp.global',
    primaryAdmin: 'Project B Lead Engineer',
    realtimeMetrics: {
      activePipelines: 2,
      throughputRecordsSec: 2400,
      throughputMbSec: 5.4,
      activeConnections: 14,
      latencyMs: 13,
      rlsEnforcedCount: 200000,
      healthScore: 100,
      rateLimitQuotaRps: 1000,
      currentRps: 240,
      storageUsageGb: 450,
      storageQuotaGb: 1000,
      activeWorkerNodes: 3,
    },
    notes: 'Global Data Lake Ingestion & Real-Time Sync Stream.',
  },
];

const INITIAL_REALTIME_EVENTS: TenantRealtimeEvent[] = [
  {
    id: 'evt-101',
    timestamp: '2026-08-12 04:40:15',
    nodeId: 'cust-001',
    nodeName: 'Customer 001',
    level: 'Customer',
    eventType: 'RLS_POLICY_ENFORCED',
    severity: 'Success',
    message: 'Row-Level Security boundary verified for Customer 001. 620,000 queries scoped.',
    metricsSnapshot: { rps: 820, latencyMs: 16, recordsProcessed: 8200 },
  },
  {
    id: 'evt-102',
    timestamp: '2026-08-12 04:39:50',
    nodeId: 'partner-a',
    nodeName: 'Partner A',
    level: 'Partner',
    eventType: 'THROUGHPUT_SPIKE',
    severity: 'Info',
    message: 'Partner A aggregated throughput reached peak 12.4K records/sec across sub-tenants.',
    metricsSnapshot: { rps: 1240, latencyMs: 18, recordsProcessed: 12400 },
  },
  {
    id: 'evt-103',
    timestamp: '2026-08-12 04:38:12',
    nodeId: 'direct-enterprise',
    nodeName: 'Direct Enterprise Customer',
    level: 'Customer',
    eventType: 'KMS_KEY_ROTATED',
    severity: 'Success',
    message: 'Customer BYOK Key rotation completed successfully via AWS KMS Hardware Vault.',
  },
  {
    id: 'evt-104',
    timestamp: '2026-08-12 04:35:00',
    nodeId: 'proj-001-a',
    nodeName: 'Project A',
    level: 'Project',
    eventType: 'ISOLATION_CHECK_PASSED',
    severity: 'Success',
    message: 'Database isolation audit passed. Zero cross-tenant data leakage detected.',
  },
];

class TenantContextService {
  private nodes: TenantNode[] = INITIAL_TENANT_NODES;
  private activeNodeId: string = 'root-edmp'; // Default to Root EDMP Scope
  private events: TenantRealtimeEvent[] = INITIAL_REALTIME_EVENTS;
  private subscribers: Set<() => void> = new Set();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startRealtimeLoop();
  }

  // Subscribe to real-time state changes
  public subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    this.subscribers.forEach((cb) => cb());
  }

  // Get active node
  public getActiveNode(): TenantNode {
    return this.nodes.find((n) => n.id === this.activeNodeId) || this.nodes[0];
  }

  // Set active node
  public setActiveNodeId(nodeId: string) {
    const found = this.nodes.find((n) => n.id === nodeId);
    if (found) {
      this.activeNodeId = nodeId;
      this.notify();
    }
  }

  // Get all nodes
  public getAllNodes(): TenantNode[] {
    return this.nodes;
  }

  // Get node by ID
  public getNodeById(id: string): TenantNode | undefined {
    return this.nodes.find((n) => n.id === id);
  }

  // Get Breadcrumbs path from Root to active node
  public getBreadcrumbs(nodeId: string = this.activeNodeId): TenantBreadcrumb[] {
    const crumbs: TenantBreadcrumb[] = [];
    let current = this.getNodeById(nodeId);

    while (current) {
      crumbs.unshift({
        id: current.id,
        name: current.name,
        level: current.level,
        code: current.code,
      });

      if (!current.parentId) break;
      current = this.getNodeById(current.parentId);
    }

    return crumbs;
  }

  // Get direct children of a node
  public getChildrenOf(parentId: string): TenantNode[] {
    return this.nodes.filter((n) => n.parentId === parentId);
  }

  // Get all descendant nodes recursively
  public getDescendantsOf(parentId: string): TenantNode[] {
    const descendants: TenantNode[] = [];
    const direct = this.getChildrenOf(parentId);

    direct.forEach((child) => {
      descendants.push(child);
      descendants.push(...this.getDescendantsOf(child.id));
    });

    return descendants;
  }

  // Get real-time events (optional filter by node)
  public getRealtimeEvents(nodeId?: string): TenantRealtimeEvent[] {
    if (!nodeId || nodeId === 'root-edmp') return this.events;

    const descendantIds = new Set([nodeId, ...this.getDescendantsOf(nodeId).map((d) => d.id)]);
    return this.events.filter((e) => descendantIds.has(e.nodeId));
  }

  // Add new node (Partner, Customer, or Project)
  public addNode(
    newNode: Omit<TenantNode, 'id' | 'createdAt' | 'realtimeMetrics' | 'childrenIds'>
  ): TenantNode {
    const id = `node-${Date.now()}`;
    const created: TenantNode = {
      ...newNode,
      id,
      createdAt: new Date().toISOString().split('T')[0],
      childrenIds: [],
      realtimeMetrics: {
        activePipelines: 1,
        throughputRecordsSec: 1000,
        throughputMbSec: 2.0,
        activeConnections: 10,
        latencyMs: 15,
        rlsEnforcedCount: 50000,
        healthScore: 100,
        rateLimitQuotaRps: 1000,
        currentRps: 100,
        storageUsageGb: 100,
        storageQuotaGb: 1000,
        activeWorkerNodes: 2,
      },
    };

    // Add node
    this.nodes.push(created);

    // Update parent's childrenIds
    if (newNode.parentId) {
      const parent = this.getNodeById(newNode.parentId);
      if (parent) {
        parent.childrenIds.push(id);
      }
    }

    // Push event
    this.pushEvent({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      nodeId: id,
      nodeName: created.name,
      level: created.level,
      eventType: 'TENANT_PROVISIONED',
      severity: 'Success',
      message: `New ${created.level} "${created.name}" provisioned with ${created.isolationMode}.`,
    });

    this.notify();
    return created;
  }

  // Update existing node
  public updateNode(nodeId: string, updates: Partial<TenantNode>) {
    const node = this.getNodeById(nodeId);
    if (node) {
      Object.assign(node, updates);
      this.notify();
    }
  }

  // Push event
  public pushEvent(evt: TenantRealtimeEvent) {
    this.events.unshift(evt);
    if (this.events.length > 50) this.events.pop();
    this.notify();
  }

  // Real-time telemetry tick loop (simulates live throughput variations & RLS checks)
  private startRealtimeLoop() {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      // Fluctuate metrics slightly
      this.nodes.forEach((node) => {
        if (node.status === 'Active') {
          const delta = (Math.random() - 0.48) * 0.1; // -4.8% to +5.2%
          const baseRecords = node.realtimeMetrics.throughputRecordsSec;
          const newRecords = Math.max(100, Math.round(baseRecords * (1 + delta)));

          node.realtimeMetrics.throughputRecordsSec = newRecords;
          node.realtimeMetrics.throughputMbSec = Number((newRecords / 512).toFixed(1));
          node.realtimeMetrics.rlsEnforcedCount += Math.floor(newRecords / 10);
          node.realtimeMetrics.currentRps = Math.round(newRecords / 10);
        }
      });

      // Randomly spawn a telemetry event every ~10s
      if (Math.random() > 0.7) {
        const activeNodes = this.nodes.filter((n) => n.status === 'Active');
        const randomNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
        if (randomNode) {
          const eventTypes: TenantRealtimeEvent['eventType'][] = [
            'RLS_POLICY_ENFORCED',
            'THROUGHPUT_SPIKE',
            'ISOLATION_CHECK_PASSED',
            'RATE_LIMIT_ADJUSTED',
          ];
          const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

          this.pushEvent({
            id: `evt-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            nodeId: randomNode.id,
            nodeName: randomNode.name,
            level: randomNode.level,
            eventType: selectedType,
            severity: selectedType === 'THROUGHPUT_SPIKE' ? 'Info' : 'Success',
            message: `Real-time pulse: ${selectedType.replace(/_/g, ' ')} verified for ${randomNode.name} (${randomNode.realtimeMetrics.throughputRecordsSec.toLocaleString()} rec/s).`,
            metricsSnapshot: {
              rps: randomNode.realtimeMetrics.currentRps,
              latencyMs: randomNode.realtimeMetrics.latencyMs,
              recordsProcessed: randomNode.realtimeMetrics.throughputRecordsSec,
            },
          });
        }
      }

      this.notify();
    }, 3000);
  }
}

export const tenantContextService = new TenantContextService();
