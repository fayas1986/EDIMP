import { PrdChapter } from '../types';

export interface ArchitectureRule {
  id: number;
  title: string;
  rule: string;
  rationale: string;
  category: 'Control/Data Plane' | 'Data Integrity' | 'Security & Isolation' | 'Resiliency & Scale' | 'Governance';
  enforcementStatus: 'Enforced' | 'Active Guardrail' | 'Monitoring';
}

export interface RoadmapPhase {
  phase: number;
  name: string;
  priority: 'Critical' | 'Very High' | 'High' | 'Later';
  status: 'In Progress' | 'Completed' | 'Planned' | 'Upcoming';
  completionPct: number;
  deliverable: string;
  items: string[];
}

export const ARCHITECTURE_RULES: ArchitectureRule[] = [
  {
    id: 1,
    title: 'Asynchronous Long-Running Execution',
    rule: 'The API must never perform long-running migration work synchronously.',
    rationale: 'Prevents HTTP connection timeouts, memory spikes on application servers, and thread starvation.',
    category: 'Control/Data Plane',
    enforcementStatus: 'Enforced',
  },
  {
    id: 2,
    title: 'Durable Asynchronous Processing',
    rule: 'All large migration workloads must execute asynchronously in worker threads or dedicated containers.',
    rationale: 'Guarantees horizontal worker scalability without degrading control plane responsiveness.',
    category: 'Control/Data Plane',
    enforcementStatus: 'Enforced',
  },
  {
    id: 3,
    title: 'Resumable Migration Stages',
    rule: 'All migration stages must be checkpointed and fully resumable.',
    rationale: 'Enables recovery from batch failures without re-ingesting or duplicating previously completed batches.',
    category: 'Resiliency & Scale',
    enforcementStatus: 'Enforced',
  },
  {
    id: 4,
    title: 'Idempotency Guarantee',
    rule: 'Migration processing must be strictly idempotent using composite idempotency keys.',
    rationale: 'Ensures at-least-once delivery guarantees without creating duplicate target records.',
    category: 'Data Integrity',
    enforcementStatus: 'Enforced',
  },
  {
    id: 5,
    title: 'Object Storage offloading',
    rule: 'Raw large datasets, staging files, and exports belong in object storage, not relational database blobs.',
    rationale: 'Keeps PostgreSQL lean and prevents database bloat during multi-gigabyte migrations.',
    category: 'Resiliency & Scale',
    enforcementStatus: 'Enforced',
  },
  {
    id: 6,
    title: 'PostgreSQL Metadata Authority',
    rule: 'PostgreSQL is the single source of truth for control-plane metadata, tenant rules, and mapping schemas.',
    rationale: 'Provides ACID compliance, strong transaction boundaries, and relational integrity.',
    category: 'Data Integrity',
    enforcementStatus: 'Enforced',
  },
  {
    id: 7,
    title: 'Tenant Isolation Context',
    rule: 'Every tenant-owned resource must carry a verified tenant_id context and RLS policy guard.',
    rationale: 'Prevents cross-tenant data leakage in multi-tenant shared-schema deployments.',
    category: 'Security & Isolation',
    enforcementStatus: 'Enforced',
  },
  {
    id: 8,
    title: 'Credential Logging Sanitization',
    rule: 'Connector credentials and auth tokens must NEVER appear in application logs or telemetry streams.',
    rationale: 'Complies with SOC 2 Type II, ISO 27001, and GDPR zero-trust security standards.',
    category: 'Security & Isolation',
    enforcementStatus: 'Enforced',
  },
  {
    id: 9,
    title: 'Connector Fault Isolation',
    rule: 'Connector rate-limit and network failures must be isolated and must never crash the main Control Plane API.',
    rationale: 'Ensures system availability even when external target APIs go offline.',
    category: 'Resiliency & Scale',
    enforcementStatus: 'Enforced',
  },
  {
    id: 10,
    title: 'Immutable Audit Logging',
    rule: 'Every migration execution, configuration modification, and user approval must generate an immutable audit log.',
    rationale: 'Provides strict regulatory provenance and forensic auditability.',
    category: 'Governance',
    enforcementStatus: 'Enforced',
  },
  {
    id: 11,
    title: 'Mandatory Reconciliation Output',
    rule: 'Every production migration run must produce automated financial and record-count reconciliation results.',
    rationale: 'Validates source-to-target record equivalence before final sign-off.',
    category: 'Governance',
    enforcementStatus: 'Enforced',
  },
  {
    id: 12,
    title: 'Versioned Mapping Rules',
    rule: 'Mapping definitions must be immutable by version number for every execution run.',
    rationale: 'Guarantees historic replay accuracy and prevents silent drift in active transformations.',
    category: 'Data Integrity',
    enforcementStatus: 'Enforced',
  },
  {
    id: 13,
    title: 'Sandboxed Script Execution',
    rule: 'Custom transformation scripts must run inside isolated process sandboxes with resource caps.',
    rationale: 'Mitigates code injection and infinite loop vulnerabilities from custom scripts.',
    category: 'Security & Isolation',
    enforcementStatus: 'Enforced',
  },
  {
    id: 14,
    title: 'End-to-End Correlation Tracking',
    rule: 'All API requests, queue tasks, and log events must propagate a uniform correlation_id and trace_id.',
    rationale: 'Enables distributed tracing across frontend, gateway, workers, and connectors.',
    category: 'Resiliency & Scale',
    enforcementStatus: 'Enforced',
  },
  {
    id: 15,
    title: 'Pragmatic Monolith-First Topology',
    rule: 'Do not split into uncontrolled microservices or Kubernetes clusters without operational throughput justification.',
    rationale: 'Avoids distributed system overhead while the modular monolith worker pattern scales cleanly.',
    category: 'Control/Data Plane',
    enforcementStatus: 'Enforced',
  },
];

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    phase: 1,
    name: 'Stabilize the Control Plane Foundation',
    priority: 'Critical',
    status: 'Completed',
    completionPct: 100,
    deliverable: 'Stable Control Plane API & Routing',
    items: [
      'Modular NestJS backend structure',
      'React Router & TanStack Query integration',
      'Tenant context isolation model',
      'Role-Based Access Control (RBAC)',
      'Deterministic migration state machine',
      'PostgreSQL indexing & Prisma optimization',
    ],
  },
  {
    phase: 2,
    name: 'Build the Asynchronous Migration Engine',
    priority: 'Critical',
    status: 'In Progress',
    completionPct: 88,
    deliverable: 'Reliable Asynchronous Migration Execution',
    items: [
      'Redis + BullMQ queue orchestration',
      'Worker pool process management',
      'Parallel batch chunking engine',
      'Exponential backoff & retry handlers',
      'Checkpointing & resume-from-failure',
      'Pause, cancel, and replay capabilities',
    ],
  },
  {
    phase: 3,
    name: 'Add Object Storage & File Ingestion Pipeline',
    priority: 'Critical',
    status: 'In Progress',
    completionPct: 75,
    deliverable: 'Enterprise File Ingestion Pipeline',
    items: [
      'MinIO / S3 object storage integration',
      'Large Excel/CSV chunk parsing worker',
      'Raw, staging, and validated bucket partitioning',
      'Malware and macro-enabled file security filters',
      'Export artifact generation (PDF/XLSX reports)',
    ],
  },
  {
    phase: 4,
    name: 'Canonical Data Model & Connector SDK',
    priority: 'Very High',
    status: 'Planned',
    completionPct: 60,
    deliverable: 'Reusable Connector Platform',
    items: [
      'Standardized Source & Target Connector SDK',
      'Canonical entity models (Customer, Vendor, Invoice, etc.)',
      'Rate-limiting & circuit breaker wrappers',
      'Dynamics 365 / Business Central native connector',
      'PostgreSQL & SQL Server bulk loaders',
    ],
  },
  {
    phase: 5,
    name: 'Mapping Studio & Data Quality Engine',
    priority: 'Very High',
    status: 'Planned',
    completionPct: 50,
    deliverable: 'Migration Preparation Platform',
    items: [
      'Visual Mapping Studio with AI auto-suggestions',
      'Immutable mapping version control',
      'Data profiling (null frequency, cardinality)',
      'Data cleansing & regex rule engine',
      'Pre-flight simulation & dry-run runner',
    ],
  },
  {
    phase: 6,
    name: 'Reconciliation Engine, Lineage & Audit',
    priority: 'Very High',
    status: 'Planned',
    completionPct: 40,
    deliverable: 'Enterprise-Grade Migration Governance',
    items: [
      'Source-to-target financial control totals',
      'Record-level lineage & provenance tracking',
      'Immutable audit logging service',
      'Reconciliation discrepancy report generator',
    ],
  },
  {
    phase: 7,
    name: 'Enterprise Security & IAM',
    priority: 'High',
    status: 'Upcoming',
    completionPct: 30,
    deliverable: 'Enterprise Security Posture',
    items: [
      'SSO via OIDC, SAML, and Microsoft Entra ID',
      'HashiCorp Vault / Azure Key Vault integration',
      'PostgreSQL Row-Level Security (RLS) enforcement',
      'Automated SAST & DAST security scans',
    ],
  },
  {
    phase: 8,
    name: 'Observability & Distributed Scaling',
    priority: 'High',
    status: 'Upcoming',
    completionPct: 20,
    deliverable: 'Operable & Horizontally Scalable Platform',
    items: [
      'OpenTelemetry distributed tracing setup',
      'Prometheus queue depth & worker metrics',
      'Centralized log aggregation with correlation IDs',
      'Autoscaling worker pools based on backlog',
    ],
  },
  {
    phase: 9,
    name: 'Advanced Capabilities (CDC & Cutover)',
    priority: 'Later',
    status: 'Upcoming',
    completionPct: 10,
    deliverable: 'Zero-Downtime Migration Engine',
    items: [
      'Incremental Change Data Capture (CDC)',
      'Live stream synchronization & cutover manager',
      'Private VPC networking endpoints',
      'Dedicated multi-region deployments',
    ],
  },
];

export const FULL_SCALE_PLAN_MARKDOWN = `# EDIMP Platform — Enterprise Architecture Optimization & Scale-Up Plan

## 1. Executive Summary

The current EDIMP architecture provides a high-performance foundation: React + Vite + Tailwind frontend, NestJS API Control Plane, PostgreSQL + Prisma metadata, and multi-model LLM co-pilot integrations. 

However, enterprise data migrations processing 10M+ records require strict architectural separation:

> **NestJS acts strictly as the Control Plane / Orchestration Layer. Migration execution runs in dedicated, durable, asynchronous worker processes.**

### Target Architecture Overview
- **Control Plane (NestJS):** Auth, Tenants, RBAC, Connectors, Schemas, Mappings, Approvals, Audit Logs.
- **Data Plane (Workers):** Extraction, Validation, Transformation, Loading, Reconciliation, CDC Streaming.
- **Storage Strategy:** PostgreSQL for Control Metadata; S3/MinIO Object Storage for Large Data Sets.
- **Queue Layer:** Redis + BullMQ for durable job orchestration with exponential backoff.

---

## 2. Current Architecture Assessment

| Architecture Domain | Current State | Assessment | Enterprise Target Standard |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Excellent | Retain with TanStack Query + Virtualization |
| **Control Plane** | NestJS | Good | Strict Control Plane / Data Plane separation |
| **Metadata DB** | PostgreSQL + Prisma | Good | Add RLS policies & query indexing |
| **Queue & Workers** | Redis + BullMQ | Active | Dedicated extraction/loader worker pools |
| **Object Storage** | S3 / MinIO | Configured | Bucket partitioning (/raw, /staging, /reports) |
| **Checkpointing** | Keyset pagination | Active | Resumable batch cursors with retry logs |
| **Idempotency** | Composite key constraints | Implemented | System-wide unique deduplication keys |
| **Reconciliation** | Control totals | Active | Record-level hash and financial balance audits |

---

## 3. Core Architectural Principle: Control Plane vs Data Plane

### Control Plane Responsibilities
- Authentication, Tenant Context, RBAC Controls, SSO Integration
- Migration Project Management, Schema Registry, Versioned Mappings
- Job Scheduling, Approvals, Billing, Real-Time Progress Broadcasting

### Data Plane Responsibilities
- High-throughput extraction, file parsing, data profiling
- Data validation, cleansing, transformation expression execution
- Chunked batch loading, retry execution, reconciliation audits

### Why Separation Matters
Processing 10 million records inside the API server degrades API latency, causes memory spikes, and risks thread starvation. Separating Control Plane from Data Plane allows independent horizontal scaling:
- **API Control Plane:** 2 → 5 → 10 Replicas
- **Data Plane Workers:** 2 → 20 → 100 Worker Nodes

---

## 4. Recommended Target Architecture

\`\`\`mermaid
flowchart TB
    subgraph UI ["Experience Layer"]
        WEB["React + Vite Single-Page Application"]
    end

    subgraph CONTROL ["Control Plane (NestJS)"]
        API["Control Plane API Gateway"]
        AUTH["IAM / RBAC / Tenant Context"]
        JOB["Migration Job Orchestrator"]
        SCHEMA["Schema Registry & Mapper"]
        AUDIT["Immutable Audit Log"]
    end

    subgraph PLATFORM ["Platform Infrastructure"]
        QUEUE["Redis + BullMQ Queue Engine"]
        CACHE["Redis Distributed Cache"]
        OBJECT["S3 / MinIO Object Storage"]
        SECRETS["KMS / HashiCorp Vault"]
    end

    subgraph DATA ["Data Plane Worker Pool"]
        EXTRACT["Extraction Workers"]
        VALIDATE["Validation Workers"]
        TRANSFORM["Transformation Workers"]
        LOAD["Batch Loading Workers"]
        RECON["Reconciliation Workers"]
    end

    subgraph TARGETS ["Enterprise Target Systems"]
        BC["Dynamics 365 Business Central"]
        SAP["SAP S/4HANA"]
        SFDC["Salesforce CRM"]
        PG["PostgreSQL / SQL Server"]
    end

    WEB --> API
    API --> AUTH & JOB & SCHEMA & AUDIT
    JOB --> QUEUE
    QUEUE --> EXTRACT & VALIDATE & TRANSFORM & LOAD & RECON
    EXTRACT --> OBJECT
    LOAD --> TARGETS
\`\`\`

---

## 5. Job Queue Architecture

Durable queues handle all async tasks via BullMQ on Redis:
1. \`extraction.queue\` - Source record extraction and file streaming
2. \`validation.queue\` - Regex checks, foreign key lookups, data quality profiling
3. \`transformation.queue\` - Canonical model mapping and expression evaluations
4. \`loading.queue\` - Rate-limited batch target upserts
5. \`reconciliation.queue\` - Financial balance audits and record count totals

---

## 6. Object Storage Structure

All raw, intermediate, and exported data sets are offloaded to object storage:
- \`/raw/tenant/{id}/migration/{id}/\` - Ingested Excel, CSV, and raw extracts
- \`/staging/tenant/{id}/\` - Normalized canonical JSON streams
- \`/validated/tenant/{id}/\` - Cleansed, ready-for-load datasets
- \`/failed/tenant/{id}/\` - Error records with detailed failure reasons
- \`/reports/tenant/{id}/\` - Generated PDF/XLSX reconciliation reports

---

## 7. Migration Job Domain Model

The migration domain hierarchy maintains strict parent-child relationships:
\`\`\`
MigrationProject
  ├── Source Connector Reference
  ├── Target Connector Reference
  ├── Schema Definition & Mapping Version
  └── Migration Job
        ├── Migration Run
        │     ├── Migration Stage (Extract -> Validate -> Load)
        │     ├── Migration Batch (Chunks of 1,000 records)
        │     │     ├── Checkpoint Cursor
        │     │     └── Failure Logs
        └── Migration Reconciliation Result
\`\`\`

---

## 8. Checkpointing & Resumability

Jobs track completed batch numbers using keyset pagination:
\`\`\`text
Batch 001 - SUCCESS
Batch 002 - SUCCESS
Batch 003 - SUCCESS
Batch 004 - FAILED (Worker interrupted)
Batch 005 - PENDING
\`\`\`
Upon resumption, the engine inspects the checkpoint state and resumes directly from **Batch 004**, preventing duplicate ingestion or re-reading.

---

## 9. Idempotency Guarantees

Idempotency keys prevent record duplication during retries:
\`\`\`text
IdempotencyKey = SHA256(tenant_id + source_system + source_record_id + target_system)
\`\`\`
Target connectors utilize native upsert mechanisms or idempotency headers to guarantee Exactly-Once Processing semantics.

---

## 10. Canonical Data Model

EDIMP normalizes incoming data into standardized canonical entities:
- **Financials:** ChartOfAccounts, JournalEntry, Invoice, Payment, TaxCode
- **Master Data:** Customer, Vendor, Item, Employee, Warehouse
- **Sales & Purchasing:** SalesOrder, PurchaseOrder, SalesLine, PurchaseLine

---

## 11. Connector SDK Contracts

Target and Source connectors implement uniform contracts:
\`\`\`typescript
export interface SourceConnector {
  testConnection(): Promise<ConnectionResult>;
  discoverSchema(): Promise<SchemaDefinition>;
  extractStream(request: ExtractRequest): AsyncIterable<RecordBatch>;
  getRateLimits(): RateLimitConfig;
}

export interface TargetConnector {
  testConnection(): Promise<ConnectionResult>;
  validateRecords(records: CanonicalRecord[]): Promise<ValidationResult>;
  upsertBatch(records: CanonicalRecord[]): Promise<LoadResult>;
}
\`\`\`

---

## 12. 15 Enforced Architecture Rules

1. **Rule 1:** API must never run long migrations synchronously.
2. **Rule 2:** All migration workloads must run in async worker pools.
3. **Rule 3:** All migration stages must be checkpointed and resumable.
4. **Rule 4:** Migration processing must be idempotent.
5. **Rule 5:** Raw datasets belong in Object Storage, not relational DB.
6. **Rule 6:** PostgreSQL is the single source of truth for Control Plane metadata.
7. **Rule 7:** Every tenant resource must carry a tenant_id and RLS policy guard.
8. **Rule 8:** Connector credentials must NEVER appear in logs or telemetry.
9. **Rule 9:** Connector failures must be isolated from the Control Plane API.
10. **Rule 10:** Every execution must generate an immutable audit log.
11. **Rule 11:** Production migrations must generate financial reconciliation totals.
12. **Rule 12:** Mapping definitions must be immutable by version number.
13. **Rule 13:** Custom transformation scripts must run in isolated sandboxes.
14. **Rule 14:** All requests and tasks must propagate correlation_id and trace_id.
15. **Rule 15:** Follow a modular monolith-first topology before microservice splitting.
`;

export const ARCHITECTURE_PLAN_CHAPTERS: PrdChapter[] = [
  {
    id: 'arch-plan-ch1',
    chapterNumber: 1,
    title: '1. Executive Summary & Scale-Up Vision',
    category: 'Architecture Plan',
    summary: 'Core principle of Control Plane / Data Plane separation, worker pool isolation, and horizontal target metrics.',
    contentMarkdown: `
# 1. Executive Summary & Scale-Up Vision

The **Enterprise Data Integration & Migration Platform (EDIMP)** scale-up strategy transitions the system into a high-throughput, enterprise-grade data platform.

## Core Mandate
- **Control Plane (NestJS):** Manages API requests, metadata, auth, tenant scoping, mapping studio, and state orchestration.
- **Data Plane (Worker Nodes):** Executes chunked extraction, parsing, transformation, batch loading, and reconciliation asynchronously in isolated worker containers.
- **Storage Strategy:** PostgreSQL for metadata control plane; Object Storage (S3 / MinIO) for raw datasets and staging buffers.
`,
  },
  {
    id: 'arch-plan-ch2',
    chapterNumber: 2,
    title: '2. Control Plane vs Data Plane Architecture',
    category: 'Architecture Plan',
    summary: 'Detailed separation of concerns between NestJS orchestration and worker execution layers.',
    contentMarkdown: `
# 2. Control Plane vs Data Plane Architecture

## Control Plane Responsibilities
- Auth & SSO (OIDC, SAML, Entra ID)
- Tenant Hierarchy & RLS Policies
- Schema Registry & Versioned Mapping Studio
- Job Scheduling, Approvals & Audit Trail

## Data Plane Responsibilities
- Large File Stream Parsing (Excel / CSV / Parquet)
- Data Quality Profiling & Expression Evaluation
- Chunked Batch Loading & Target API Retries
- Financial Control Totals & Hash Reconciliation
`,
  },
  {
    id: 'arch-plan-ch3',
    chapterNumber: 3,
    title: '3. Queue & Worker Pool Architecture',
    category: 'Architecture Plan',
    summary: 'Redis + BullMQ queue specifications, retry handling, and rate-limiting wrappers.',
    contentMarkdown: `
# 3. Queue & Worker Pool Architecture

## Queue Channels
- \`extraction.queue\`
- \`validation.queue\`
- \`transformation.queue\`
- \`loading.queue\`
- \`reconciliation.queue\`

## Resiliency Patterns
- Exponential backoff (1s, 2s, 4s, 8s, 16s)
- Circuit breakers for third-party rate limits (429 HTTP response codes)
- Dead-letter queues for unrecoverable errors
`,
  },
  {
    id: 'arch-plan-ch4',
    chapterNumber: 4,
    title: '4. Checkpointing, Idempotency & Resumability',
    category: 'Architecture Plan',
    summary: 'Keyset cursor tracking, batch resume logic, and SHA256 idempotency key generation.',
    contentMarkdown: `
# 4. Checkpointing, Idempotency & Resumability

## Checkpointing Logic
Jobs track batch state in PostgreSQL metadata. If worker Node 3 experiences a transient shutdown, the job orchestrator re-assigns the uncompleted batch to Node 4 starting from the exact cursor point.

## Idempotency Key
\`\`\`text
IdempotencyKey = SHA256(tenant_id + source_system + source_record_id + target_system)
\`\`\`
`,
  },
  {
    id: 'arch-plan-ch5',
    chapterNumber: 5,
    title: '5. Phased Implementation Roadmap & Governance Rules',
    category: 'Architecture Plan',
    summary: '9-Phase implementation roadmap and 15 enforced architecture rules.',
    contentMarkdown: `
# 5. Phased Implementation Roadmap & Governance Rules

## 15 Enforced Architecture Rules
1. API must never run long migrations synchronously.
2. Workloads execute asynchronously in worker pools.
3. All migration stages must be checkpointed and resumable.
4. Idempotency guarantees on all mutations.
5. Offload raw files to Object Storage.
6. PostgreSQL is Control Plane source of truth.
7. Tenant context + RLS enforcement on all tables.
8. Credentials sanitized from logs and traces.
9. Connector failures isolated from Control Plane.
10. Immutable audit logging for all mutations.
11. Financial reconciliation totals required.
12. Mapping definitions immutable by version.
13. Custom scripts executed in sandboxed runtimes.
14. End-to-end trace_id and correlation_id tracking.
15. Modular monolith topology prior to microservices.
`,
  },
];
