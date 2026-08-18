import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Server,
  Database,
  Cpu,
  HardDrive,
  Lock,
  Layers,
  ArrowRight,
  User,
  Building2,
  Briefcase,
  FolderGit2,
  Activity,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  Sliders,
  Terminal,
  Zap,
  Radio,
  FileCode,
  ShieldAlert,
  Key,
  Globe,
  Network
} from 'lucide-react';
import { tenantContextService } from '../services/tenantContextService';
import {
  TenantNode,
  RequestContextTraceability,
  EnforcementLayerType,
  EnforcementLayerDetail
} from '../types/tenantHierarchy';

export const RequestIsolationEnforcementMatrix: React.FC = () => {
  const [activeNode, setActiveNode] = useState<TenantNode>(tenantContextService.getActiveNode());
  const [selectedLayer, setSelectedLayer] = useState<EnforcementLayerType>('Database');
  const [simulationRunning, setSimulationRunning] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulatedViolation, setSimulatedViolation] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = tenantContextService.subscribe(() => {
      setActiveNode(tenantContextService.getActiveNode());
    });
    return () => unsubscribe();
  }, []);

  // Compute active context based on selected active node
  const activeContext: RequestContextTraceability = {
    who: {
      principalId: 'usr_sarah_arch_8842',
      principalName: 'Sarah Jenkins (Lead Data Engineer)',
      role: 'Partner Systems Architect & Security Admin',
      authMethod: 'OAuth2 mTLS / JWT Bearer',
    },
    whichPartner: {
      partnerId: activeNode.level === 'Platform' ? 'PARTNER-A' : activeNode.parentId || 'PARTNER-A',
      partnerName: 'Partner A (Managed Service Provider)',
      code: 'PARTNER-A',
    },
    whichTenant: {
      tenantId: activeNode.level === 'Customer' ? activeNode.id : 'CUST-001',
      tenantName: activeNode.level === 'Customer' ? activeNode.name : 'Customer 001 (Retail Enterprise)',
      code: activeNode.level === 'Customer' ? activeNode.code : 'CUST-001',
    },
    whichOrganization: {
      orgId: 'ORG-NA-RETAIL-01',
      orgName: 'North America Retail Division',
      division: 'Finance & Supply Chain',
    },
    whichProject: {
      projectId: activeNode.level === 'Project' ? activeNode.id : 'PROJ-001-A',
      projectName: activeNode.level === 'Project' ? activeNode.name : 'Project A (ERP Cutover)',
      code: activeNode.level === 'Project' ? activeNode.code : 'PROJ-001-A',
    },
    whichMigration: {
      migrationId: 'MIG-RUN-99824',
      jobName: 'SAP_TO_BC_GENERAL_LEDGER_SYNC',
      batchRunId: 'BATCH-20260812-0444',
    },
    whichRecords: {
      recordRange: 'PK-STAGE-10001 .. PK-STAGE-10050',
      partitionKey: 'TENANT#CUST-001#PROJ#001A',
      primaryKeySet: ['GL_TX_1001', 'GL_TX_1002', 'GL_TX_1003', 'GL_TX_1004', 'GL_TX_1005'],
      recordCount: 50,
    },
  };

  // 6 Architecture Enforcement Layers Definitions
  const enforcementLayers: EnforcementLayerDetail[] = [
    {
      layer: 'Database',
      status: simulatedViolation ? 'Blocked' : 'Enforced',
      mechanism: 'PostgreSQL Row-Level Security (RLS) & Session Variable Scoping',
      codeSnippet: `-- PostgreSQL RLS Policy Enforcement
SET LOCAL app.current_partner_id = 'PARTNER-A';
SET LOCAL app.current_tenant_id = 'CUST-001';
SET LOCAL app.current_org_id = 'ORG-NA-RETAIL-01';
SET LOCAL app.current_project_id = 'PROJ-001-A';

CREATE POLICY tenant_isolation_policy ON migration_ledger_records
FOR ALL USING (
  partner_id = current_setting('app.current_partner_id') AND
  tenant_id  = current_setting('app.current_tenant_id')  AND
  project_id = current_setting('app.current_project_id')
);`,
      enforcementMetrics: {
        evaluationsSec: 18450,
        blockedAttempts: simulatedViolation ? 1 : 0,
        avgLatencyMs: 0.4,
      },
      details: 'Evaluated directly at the database execution engine. Queries lacking tenant predicate context return 0 records.',
    },
    {
      layer: 'API Gateway',
      status: 'Enforced',
      mechanism: 'Kong / Envoy Gateway Header Injection & JWT Scope Validation',
      codeSnippet: `// Envoy / API Gateway Request Context Verification
onRequest(req, res) {
  const jwt = verifyJWT(req.headers['authorization']);
  req.headers['X-Partner-ID']   = jwt.claims.partner_id;
  req.headers['X-Tenant-ID']    = jwt.claims.tenant_id;
  req.headers['X-Org-ID']       = jwt.claims.org_id;
  req.headers['X-Project-ID']   = jwt.claims.project_id;
  req.headers['X-Migration-ID'] = jwt.claims.migration_id;
  
  validateRateLimitQuota(jwt.claims.tenant_id, 2000 /* RPS */);
}`,
      enforcementMetrics: {
        evaluationsSec: 24800,
        blockedAttempts: 0,
        avgLatencyMs: 1.2,
      },
      details: 'Intercepts incoming ingress HTTP requests, decodes signed JWT claims, and injects mandatory immutable tenant headers.',
    },
    {
      layer: 'Service',
      status: 'Enforced',
      mechanism: 'Thread-Local Context Propagation & Async Context Holders',
      codeSnippet: `// Service & Worker Thread-Local Context Binding
export async function executePipelineStep(stepId, records) {
  const ctx = RequestContextHolder.getRequiredContext();
  logger.info("Executing step", {
    principal: ctx.who.principalId,
    tenant: ctx.whichTenant.tenantId,
    project: ctx.whichProject.projectId,
    records: records.length
  });
  
  return pipelineWorkerPool.dispatch(ctx, stepId, records);
}`,
      enforcementMetrics: {
        evaluationsSec: 19200,
        blockedAttempts: 0,
        avgLatencyMs: 0.1,
      },
      details: 'Ensures background thread pools and Node async local storage propagate tenant context across all internal function calls.',
    },
    {
      layer: 'Event Queue',
      status: 'Enforced',
      mechanism: 'Kafka CloudEvents Metadata Header Isolation Envelopes',
      codeSnippet: `// Kafka Producer Message Envelope Context Headers
kafkaProducer.send({
  topic: 'edmp.migration.events.v1',
  headers: {
    'ce_partner_id':   ctx.whichPartner.partnerId,
    'ce_tenant_id':    ctx.whichTenant.tenantId,
    'ce_org_id':       ctx.whichOrganization.orgId,
    'ce_project_id':   ctx.whichProject.projectId,
    'ce_migration_id': ctx.whichMigration.migrationId,
  },
  value: JSON.stringify(recordBatchPayload)
});`,
      enforcementMetrics: {
        evaluationsSec: 15600,
        blockedAttempts: 0,
        avgLatencyMs: 0.3,
      },
      details: 'Appends mandatory CloudEvents context metadata headers to every event message. Consumers discard payloads violating tenant scope.',
    },
    {
      layer: 'Storage',
      status: 'Enforced',
      mechanism: 'Dynamic Bucket Prefix Pathing & BYOK KMS Key Scope Enforcer',
      codeSnippet: `// Object Storage (S3 / GCS) Prefix Path Isolation
const objectKey = \`vault/\${ctx.whichPartner.partnerId}/\${ctx.whichTenant.tenantId}/\${ctx.whichProject.projectId}/\${ctx.whichMigration.migrationId}/staging_chunk_001.parquet\`;

const s3Client = new S3Client({
  kmsKeyId: ctx.getKmsKeyForTenant(ctx.whichTenant.tenantId),
  prefixPolicy: objectKey
});`,
      enforcementMetrics: {
        evaluationsSec: 8400,
        blockedAttempts: 0,
        avgLatencyMs: 2.1,
      },
      details: 'Stores staging parquet/CSV files inside tenant-isolated folder trees encrypted with customer-managed BYOK KMS keys.',
    },
    {
      layer: 'Authorization',
      status: 'Enforced',
      mechanism: 'Open Policy Agent (OPA) ABAC Attribute-Based Policy Engine',
      codeSnippet: `// OPA / Rego Attribute-Based Access Control (ABAC)
package edmp.authz

default allow = false

allow {
  input.action == "MIGRATION_READ_RECORDS"
  input.principal.partner_id == input.resource.partner_id
  input.principal.tenant_id  == input.resource.tenant_id
  input.principal.project_id == input.resource.project_id
  input.resource.record_count <= 1000
}`,
      enforcementMetrics: {
        evaluationsSec: 22100,
        blockedAttempts: 0,
        avgLatencyMs: 0.8,
      },
      details: 'Evaluates the 7 request dimensions against real-time ABAC security policies before granting operational execution permission.',
    },
  ];

  const currentLayerDetail = enforcementLayers.find((l) => l.layer === selectedLayer) || enforcementLayers[0];

  const runRequestSimulation = () => {
    setSimulationRunning(true);
    setSimulationStep(0);

    const interval = setInterval(() => {
      setSimulationStep((prev) => {
        if (prev >= 6) {
          clearInterval(interval);
          setSimulationRunning(false);
          return 6;
        }
        return prev + 1;
      });
    }, 600);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 space-y-6 shadow-xs">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-mono font-semibold rounded-full uppercase flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> End-to-End Isolation Engine
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-mono font-semibold rounded-full">
              6 Architecture Layers Active
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" /> 7-Step Request Context Traceability &amp; Enforcement
          </h2>

          <p className="text-slate-600 text-xs max-w-3xl leading-relaxed">
            Every incoming request is parsed through 7 contextual questions and enforced across Database, API Gateway, Service, Event Queue, Storage, and Authorization layers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={runRequestSimulation}
            disabled={simulationRunning}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {simulationRunning ? (
              <RefreshCw className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
            <span>{simulationRunning ? 'Simulating Pipeline Request...' : 'Simulate Request Flow'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: THE 7 REQUEST CONTEXT QUESTIONS (FLOW DIAGRAM) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2 font-mono">
            <Terminal className="w-4 h-4 text-indigo-600" /> Step-by-Step Request Context Resolution Path
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            Active Scope: <strong className="text-slate-800">{activeNode.name}</strong> ({activeNode.code})
          </span>
        </div>

        {/* 7 Questions Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {[
            {
              step: 1,
              question: 'Who?',
              label: 'Principal / Identity',
              value: (activeContext?.who?.principalName || '').split(' ')[0] + ' ' + ((activeContext?.who?.principalName || '').split(' ')[1] || ''),
              sub: (activeContext?.who?.role || '').split(' ')[0],
              icon: User,
              color: 'text-indigo-600',
              borderColor: 'border-indigo-200',
            },
            {
              step: 2,
              question: 'Which partner?',
              label: 'Partner MSP',
              value: activeContext.whichPartner.code,
              sub: 'MSP Tier-1',
              icon: Building2,
              color: 'text-sky-600',
              borderColor: 'border-sky-200',
            },
            {
              step: 3,
              question: 'Which tenant?',
              label: 'Customer Tenant',
              value: activeContext.whichTenant.code,
              sub: 'Retail Tenant',
              icon: Briefcase,
              color: 'text-emerald-600',
              borderColor: 'border-emerald-200',
            },
            {
              step: 4,
              question: 'Which organization?',
              label: 'Division / Org',
              value: 'ORG-NA-01',
              sub: 'North America',
              icon: Globe,
              color: 'text-purple-600',
              borderColor: 'border-purple-200',
            },
            {
              step: 5,
              question: 'Which project?',
              label: 'Project Workspace',
              value: activeContext.whichProject.code,
              sub: 'ERP Migration',
              icon: FolderGit2,
              color: 'text-amber-600',
              borderColor: 'border-amber-200',
            },
            {
              step: 6,
              question: 'Which migration?',
              label: 'Migration Run',
              value: 'MIG-99824',
              sub: 'Batch Sync',
              icon: Activity,
              color: 'text-rose-600',
              borderColor: 'border-rose-200',
            },
            {
              step: 7,
              question: 'Which records?',
              label: 'Partition Range',
              value: '50 Rows',
              sub: 'PK-STAGE-10001..',
              icon: FileCode,
              color: 'text-blue-600',
              borderColor: 'border-blue-200',
            },
          ].map((q, idx) => {
            const QIcon = q.icon;
            const isHighlighted = simulationRunning && simulationStep >= idx;
            return (
              <div
                key={q.question}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 relative overflow-hidden ${
                  isHighlighted
                    ? 'bg-indigo-50 border-indigo-300 shadow-sm ring-2 ring-indigo-400/40 text-indigo-950'
                    : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[10px] font-extrabold ${isHighlighted ? 'text-indigo-700' : q.color}`}>
                    #{q.step} {q.question}
                  </span>
                  <QIcon className={`w-3.5 h-3.5 ${isHighlighted ? 'text-indigo-700' : q.color}`} />
                </div>

                <div>
                  <div className={`text-xs font-bold font-mono truncate ${isHighlighted ? 'text-indigo-950' : 'text-slate-900'}`}>{q.value}</div>
                  <div className="text-[9px] text-slate-500 font-mono truncate">{q.label}</div>
                </div>

                <div className="text-[9px] text-slate-500 font-mono truncate pt-1 border-t border-slate-200">
                  {q.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: 6 ARCHITECTURAL ENFORCEMENT LAYERS TABS */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2 font-mono">
            <Lock className="w-4 h-4 text-emerald-600" /> Multi-Layer Isolation Enforcement Matrix
          </h3>

          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <span>Toggle Layer to Inspect Logic &amp; Code:</span>
          </div>
        </div>

        {/* Layers Selectors */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 font-mono text-xs">
          {[
            { name: 'Database' as EnforcementLayerType, icon: Database, color: 'text-emerald-600' },
            { name: 'API Gateway' as EnforcementLayerType, icon: Network, color: 'text-sky-600' },
            { name: 'Service' as EnforcementLayerType, icon: Cpu, color: 'text-indigo-600' },
            { name: 'Event Queue' as EnforcementLayerType, icon: Radio, color: 'text-purple-600' },
            { name: 'Storage' as EnforcementLayerType, icon: HardDrive, color: 'text-amber-600' },
            { name: 'Authorization' as EnforcementLayerType, icon: ShieldCheck, color: 'text-rose-600' },
          ].map((l) => {
            const LIcon = l.icon;
            const isSelected = selectedLayer === l.name;
            return (
              <button
                key={l.name}
                type="button"
                onClick={() => setSelectedLayer(l.name)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs ring-2 ring-indigo-400/30'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <LIcon className={`w-4 h-4 ${isSelected ? 'text-white' : l.color}`} />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="font-bold text-xs">{l.name} Layer</div>
              </button>
            );
          })}
        </div>

        {/* Selected Layer Code Snippet & Policy Inspector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 font-mono">{currentLayerDetail.layer} Layer Policy</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold rounded">
                  Status: {currentLayerDetail.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">{currentLayerDetail.mechanism}</p>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 shadow-2xs">
                <span className="text-slate-500 text-[9px] uppercase block font-bold">Evaluations</span>
                <span className="font-black text-emerald-700">{currentLayerDetail.enforcementMetrics.evaluationsSec.toLocaleString()}/s</span>
              </div>

              <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 shadow-2xs">
                <span className="text-slate-500 text-[9px] uppercase block font-bold">Avg Latency</span>
                <span className="font-black text-indigo-700">{currentLayerDetail.enforcementMetrics.avgLatencyMs} ms</span>
              </div>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 font-bold">
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-slate-900 font-black">Enforcement Implementation Blueprint</span>
              </span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                Layer Type: {currentLayerDetail.layer}
              </span>
            </div>

            <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed shadow-inner">
              <code>{currentLayerDetail.codeSnippet}</code>
            </pre>
          </div>

          <p className="text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
            <strong className="text-slate-900">Execution Mechanism:</strong> {currentLayerDetail.details}
          </p>
        </div>
      </div>
    </div>
  );
};
