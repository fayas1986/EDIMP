# EDIMP Backend Architecture Reference
## Next.js + Prisma + PostgreSQL + Redis/BullMQ + Worker Runtime

> **Architectural position:** Next.js is the EDIMP **Control Plane**. Migration execution belongs in a separate **Data Plane / Worker Runtime**. Prisma is the primary ORM for control-plane data, not the bulk migration engine.

## 1. Target Architecture

```text
React Web
   |
   | HTTPS / WebSocket / SSE
   v
Next.js Control Plane
   |
   +-- PostgreSQL + Prisma
   +-- Redis + BullMQ
   +-- Object Storage
   +-- Secrets / KMS / Vault
   |
   v
Worker Runtime
   |
   +-- Extraction Workers
   +-- Validation Workers
   +-- Transformation Workers
   +-- Loading Workers
   +-- Reconciliation Workers
   +-- Connector Workers
   |
   v
Connector SDK
   |
   +-- Business Central
   +-- Dynamics 365
   +-- SAP
   +-- Salesforce
   +-- PostgreSQL / SQL Server
   +-- REST / SOAP
   +-- Excel / CSV / SFTP
```

## 2. Core Principles

1. Separate Control Plane and Data Plane.
2. Never execute long-running migrations inside Next.js request handlers.
3. Use durable asynchronous queues.
4. Scale APIs and workers independently.
5. Use PostgreSQL for control-plane metadata.
6. Use object storage for large datasets/artifacts.
7. Use a canonical data model between source and target systems.
8. Build a reusable Connector SDK.
9. Make migrations resumable with checkpoints.
10. Design migration operations for idempotency.
11. Implement retry, backoff, rate limiting, and circuit breakers.
12. Make data quality and reconciliation first-class features.
13. Enforce tenant isolation at the application and database layers.
14. Version mappings.
15. Protect secrets with a dedicated secret-management system.
16. Add auditability, lineage, and distributed observability.
17. Avoid premature microservices, Kafka, and Kubernetes.

## 3. Control Plane

Next.js should own:

- Authentication
- Authorization
- Tenants
- Users
- Roles and permissions
- Connector registration/configuration
- Schema registry
- Mapping definitions and versions
- Migration projects
- Migration jobs/runs
- Approval workflows
- Audit
- Billing
- Dashboard APIs
- Notifications
- Job orchestration

Example:

```text
POST /api/v1/migrations/:id/start
        |
        +-- Validate configuration
        +-- Create MigrationRun
        +-- Create stages
        +-- Enqueue job
        |
        +-- Return 202 Accepted
```

## 4. Data Plane

Workers own:

- Extraction
- File parsing
- Profiling
- Validation
- Cleansing
- Transformation
- Batching
- Loading
- Retry
- Checkpointing
- Reconciliation
- Large dataset processing

Example:

```text
Queue
  |
  +-- Extract
  +-- Profile
  +-- Validate
  +-- Transform
  +-- Load
  +-- Reconcile
  +-- Report
```

## 5. Repository Structure

Use a monorepo, preferably pnpm + Turborepo.

```text
edimp/
|
+-- apps/
|   +-- web/
|   +-- api/
|   +-- worker/
|
+-- packages/
|   +-- db/
|   +-- auth/
|   +-- domain/
|   +-- contracts/
|   +-- connector-sdk/
|   +-- transformation-engine/
|   +-- queue/
|   +-- storage/
|   +-- telemetry/
|   +-- logging/
|   +-- config/
|
+-- connectors/
|   +-- business-central/
|   +-- dynamics/
|   +-- postgres/
|   +-- sql-server/
|   +-- rest/
|   +-- excel/
|   +-- csv/
|   +-- sftp/
|
+-- infrastructure/
|   +-- docker/
|   +-- terraform/
|   +-- deployment/
|
+-- docs/
```

## 6. Next.js Backend Structure

```text
apps/api/
|
+-- app/
|   +-- api/
|       +-- v1/
|           +-- auth/
|           +-- tenants/
|           +-- users/
|           +-- connectors/
|           +-- schemas/
|           +-- mappings/
|           +-- projects/
|           +-- migrations/
|           +-- reports/
|
+-- modules/
|   +-- auth/
|   +-- tenants/
|   +-- users/
|   +-- connectors/
|   +-- schemas/
|   +-- mappings/
|   +-- migrations/
|   +-- reconciliation/
|   +-- audit/
|   +-- billing/
|
+-- domain/
|   +-- tenant/
|   +-- migration/
|   +-- connector/
|   +-- mapping/
|
+-- infrastructure/
|   +-- database/
|   +-- queue/
|   +-- storage/
|   +-- secrets/
|   +-- telemetry/
|
+-- lib/
|   +-- auth/
|   +-- validation/
|   +-- errors/
|   +-- logging/
|
+-- middleware.ts
```

## 7. Layered Architecture

Keep responsibilities separated:

```text
HTTP / Route Handler
        |
        v
Application Service
        |
        v
Domain Rules
        |
        v
Repository
        |
        v
Prisma
        |
        v
PostgreSQL
```

Do not put complex business logic inside route handlers.

## 8. Prisma Strategy

Create a dedicated database package:

```text
packages/db/
+-- prisma/
|   +-- schema.prisma
|   +-- migrations/
|   +-- seed.ts
+-- client.ts
```

Use Prisma for:

- Tenants
- Users
- Roles/permissions
- Connectors
- Migration projects/jobs/runs/stages
- Checkpoints
- Schema/mapping metadata
- Audit
- Reconciliation summaries
- Artifact metadata

Avoid using Prisma as the only data-movement mechanism for millions of records. Use native bulk APIs, PostgreSQL COPY, bulk inserts, or target-specific bulk APIs where appropriate.

Reuse a PrismaClient per process.

## 9. Core Domain Entities

```text
Tenant
User
Role
Permission

Connector
ConnectorCredentialReference

SchemaDefinition

MappingDefinition
MappingVersion
MappingRule

MigrationProject
MigrationJob
MigrationRun
MigrationStage
MigrationBatch
MigrationCheckpoint

MigrationError
MigrationArtifact
MigrationReconciliation

AuditLog
DataLineage
MigrationEvent
```

Logical hierarchy:

```text
Tenant
  |
  +-- Users
  +-- Connectors
  +-- Projects
  +-- Schemas
  +-- Mappings
  +-- Migration Jobs
        |
        +-- Runs
        +-- Stages
        +-- Batches
        +-- Checkpoints
        +-- Errors
        +-- Reconciliation
  |
  +-- Audit
```

## 10. Tenant Isolation

Every tenant-owned table should have `tenantId`.

Example:

```prisma
model MigrationJob {
  id        String   @id @default(cuid())
  tenantId  String
  projectId String

  status    MigrationStatus

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@index([tenantId, createdAt])
  @@index([tenantId, status])
}
```

Request flow:

```text
Request
  |
  v
Authenticate
  |
  v
Resolve User/Tenant
  |
  v
Authorize
  |
  v
Tenant-scoped service
  |
  v
Repository
  |
  v
PostgreSQL
```

Evaluate PostgreSQL Row Level Security for stronger isolation.

## 11. Request Context

Every request should have:

```ts
type RequestContext = {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  requestId: string;
  correlationId: string;
};
```

Prefer:

```ts
migrationService.getJob(ctx, jobId);
```

over:

```ts
migrationService.getJob(jobId);
```

This makes tenant isolation part of the architecture.

## 12. Authentication

Initial:

```text
Email + Password
        |
        v
Session/JWT
        |
        v
HttpOnly + Secure Cookie
```

Enterprise-ready:

```text
OIDC
SAML
Microsoft Entra ID
Okta
Google Workspace
```

Suggested roles:

```text
PlatformAdmin
TenantAdmin
MigrationManager
DataEngineer
Reviewer
Operator
Viewer
```

## 13. API Versioning

Start with:

```text
/api/v1/...
```

Recommended migration endpoints:

```text
POST   /api/v1/migrations
GET    /api/v1/migrations/:id
POST   /api/v1/migrations/:id/start
POST   /api/v1/migrations/:id/pause
POST   /api/v1/migrations/:id/resume
POST   /api/v1/migrations/:id/cancel
GET    /api/v1/migrations/:id/progress
GET    /api/v1/migrations/:id/errors
GET    /api/v1/migrations/:id/reconciliation
GET    /api/v1/migrations/:id/artifacts
```

## 14. API Validation

Validate all inputs at the boundary.

A good option for this stack is Zod.

```ts
const CreateMigrationSchema = z.object({
  projectId: z.string(),
  sourceConnectorId: z.string(),
  targetConnectorId: z.string(),
});
```

Flow:

```text
HTTP
  |
  v
Validation
  |
  v
Application Service
  |
  v
Domain
```

## 15. Standard API Response

Success:

```json
{
  "success": true,
  "data": {},
  "requestId": "REQ-123"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "MIGRATION_NOT_READY",
    "message": "Migration cannot be started before validation is complete."
  },
  "requestId": "REQ-123"
}
```

Use stable machine-readable error codes.

## 16. Queue Architecture

Recommended first implementation:

```text
Redis + BullMQ
```

Queues:

```text
extraction
validation
transformation
loading
reconciliation
notification
cleanup
```

Centralize queue names.

```ts
export const QUEUES = {
  EXTRACTION: "extraction",
  VALIDATION: "validation",
  TRANSFORMATION: "transformation",
  LOADING: "loading",
  RECONCILIATION: "reconciliation",
} as const;
```

Queues should support:

- Persistence
- Retry
- Exponential backoff
- Delayed jobs
- Priority
- Concurrency
- Rate limiting
- Dead-letter handling
- Cancellation
- Pause/resume
- Job dependencies

## 17. Worker Runtime

Separate worker application:

```text
apps/worker/
+-- src/
    +-- bootstrap.ts
    +-- workers/
    |   +-- extraction.worker.ts
    |   +-- validation.worker.ts
    |   +-- transformation.worker.ts
    |   +-- loading.worker.ts
    |   +-- reconciliation.worker.ts
    +-- services/
    +-- connectors/
    +-- infrastructure/
```

Worker processes must be deployable independently of Next.js.

## 18. Migration State Machine

Use explicit states:

```text
DRAFT
  ↓
VALIDATING
  ↓
READY
  ↓
APPROVAL_REQUIRED
  ↓
APPROVED
  ↓
QUEUED
  ↓
EXTRACTING
  ↓
TRANSFORMING
  ↓
VALIDATING_DATA
  ↓
LOADING
  ↓
RECONCILING
  ↓
COMPLETED
```

Failure states:

```text
PAUSED
FAILED
CANCELLED
```

Implement explicit valid transitions. Do not allow arbitrary status updates.

## 19. Migration Pipeline

```text
Source
  ↓
Extract
  ↓
Raw Artifact
  ↓
Profile
  ↓
Validate
  ↓
Transform
  ↓
Validated Artifact
  ↓
Load
  ↓
Reconcile
  ↓
Report
```

## 20. Checkpointing

Example:

```text
Batch 001   SUCCESS
Batch 002   SUCCESS
Batch 003   SUCCESS
Batch 004   SUCCESS
Batch 005   FAILED
Batch 006   PENDING
```

After remediation:

```text
Resume from Batch 005
```

Checkpoint fields:

```text
id
jobId
stage
batchNumber
sourceCursor
lastProcessedKey
recordsProcessed
workerId
status
createdAt
updatedAt
```

Prefer cursor/keyset continuation for large sources when supported.

## 21. Idempotency

Assume at-least-once execution.

Potential duplicate scenario:

```text
Worker
  ↓
Target accepts record
  ↓
Worker crashes
  ↓
Retry
```

Create deterministic idempotency keys using:

```text
tenant
source system
source entity
source record ID
target system
migration project
```

Example:

```text
EDIMP-{tenant}-{entity}-{sourceRecordId}-{target}
```

Use target-side upsert/idempotency capabilities wherever possible.

## 22. Batch Processing

Avoid:

```text
1 record = 1 request
1 record = 1 transaction
```

Prefer:

```text
batchSize = 100/500/1000
concurrency = benchmarked
```

Always respect target connector rate limits.

## 23. Retry Strategy

Retryable:

```text
Timeout
Connection reset
HTTP 429
Temporary HTTP 5xx
Transient network failure
```

Non-retryable:

```text
Invalid field
Missing mandatory value
Invalid reference
Business-rule rejection
Malformed data
```

Use:

```text
maxAttempts
backoff
initialDelay
maxDelay
jitter
```

## 24. Dead-Letter Handling

Repeatedly failing jobs or batches should enter a dead-letter state.

The UI should support:

```text
View Error
  ↓
Fix Data / Mapping
  ↓
Retry Failed Batch
```

Never restart the complete migration for an isolated failure.

## 25. Connector SDK

Source contract:

```ts
interface SourceConnector {
  testConnection(): Promise<Result>;
  discoverSchema(): Promise<Schema>;
  extract(request: ExtractRequest): AsyncIterable<Record>;
  supportsPagination(): boolean;
  supportsIncrementalSync(): boolean;
  supportsCDC(): boolean;
  getRateLimits(): RateLimit;
}
```

Target contract:

```ts
interface TargetConnector {
  testConnection(): Promise<Result>;
  validate(record: Record): Promise<ValidationResult>;
  insertBatch(records: Record[]): Promise<LoadResult>;
  updateBatch(records: Record[]): Promise<LoadResult>;
  upsertBatch(records: Record[]): Promise<LoadResult>;
}
```

## 26. Connector Architecture

```text
Migration Engine
       |
       v
Connector Interface
       |
+------+------+------+------+
|      |      |      |      |
BC    SAP    SQL    REST   Excel
```

Never spread connector-specific behavior across controllers and migration services.

## 27. Connector Isolation

Future model:

```text
Queue
  |
  +-- Business Central Worker Pool
  +-- Dynamics Worker Pool
  +-- Salesforce Worker Pool
  +-- Database Worker Pool
  +-- File Worker Pool
```

A broken connector should not crash the main API.

## 28. Connector Rate Limiting

Each connector should define:

```text
maxConcurrency
requestsPerSecond
batchSize
timeout
retryPolicy
circuitBreaker
```

Flow:

```text
429
 ↓
Backoff
 ↓
Retry
 ↓
Retry
 ↓
Pause / Dead Letter
```

## 29. Object Storage

Use:

```text
S3
MinIO
Azure Blob
```

Logical structure:

```text
/raw/tenant/{tenantId}/migration/{migrationId}/
/staging/tenant/{tenantId}/migration/{migrationId}/
/validated/tenant/{tenantId}/migration/{migrationId}/
/failed/tenant/{tenantId}/migration/{migrationId}/
/reports/tenant/{tenantId}/migration/{migrationId}/
```

Store:

- Excel
- CSV
- JSON
- Raw extracts
- Transformed datasets
- Rejected records
- Reports

PostgreSQL stores metadata and references.

## 30. Object Storage Abstraction

Do not spread provider-specific SDK calls everywhere.

```ts
interface ObjectStorage {
  upload(...): Promise<void>;
  download(...): Promise<ReadableStream>;
  delete(...): Promise<void>;
  getSignedUrl(...): Promise<string>;
}
```

Implement:

```text
S3Storage
MinioStorage
AzureBlobStorage
```

## 31. Excel/CSV Pipeline

```text
User Upload
  ↓
Object Storage
  ↓
File Validation
  ↓
Parsing Worker
  ↓
Canonical Dataset
  ↓
Schema Detection
  ↓
Data Profiling
  ↓
Validation
  ↓
Transformation
  ↓
Approval
  ↓
Target Load
  ↓
Reconciliation
```

Do not route large files repeatedly through the Next.js application.

## 32. Canonical Data Model

Create an internal enterprise language:

```text
Customer
Vendor
Item
Employee
Warehouse
Currency
TaxCode
ChartOfAccounts
SalesOrder
PurchaseOrder
Invoice
InvoiceLine
Payment
Journal
Asset
```

Example:

```text
Business Central Customer
        ↓
BC Connector
        ↓
CanonicalCustomer
        ↓
Mapping
        ↓
Target Customer
```

Benefits:

- Reduced connector complexity
- Reusable transformation logic
- Easier connector development
- Better testing
- Better lineage

## 33. Transformation Engine

Create a dedicated package.

Primitive operations:

```text
trim
uppercase
lowercase
dateFormat
numberFormat
round
split
concatenate
replace
regex
lookup
conditional
default
coalesce
```

Example:

```text
source.amount
    ↓
ROUND(source.amount * exchangeRate, 2)
    ↓
target.amount
```

## 34. Mapping Versioning

Mappings must be immutable by version.

```text
Customer Mapping
    v1
    v2
    v3
    v4
```

A migration records the exact version used:

```text
jobId = JOB-105
mappingVersion = 4
```

## 35. Custom Transformation Sandbox

If customer scripts are supported later:

Do not run arbitrary customer code in the primary worker with `eval()`.

Use:

```text
CPU limit
Memory limit
Timeout
Network disabled by default
Restricted filesystem
No host credential access
```

## 36. Data Quality Engine

Recommended:

```text
Profile
  ↓
Validate
  ↓
Clean
  ↓
Transform
  ↓
Review
  ↓
Approve
  ↓
Load
```

Checks can include:

```text
Invalid email
Invalid tax number
Duplicate customer
Missing currency
Invalid country
Invalid UOM
Invalid date
Missing mandatory field
Invalid GL account
Invalid reference
```

## 37. Reconciliation

Migration completion should require meaningful reconciliation.

Compare:

```text
Source Count
Target Count
Successful
Failed
Skipped
Duplicates
Financial Totals
Business Totals
Hash totals where useful
```

Example:

```text
Source:
Invoices = 1,250,000
Amount   = 18,450,000,000

Target:
Invoices = 1,249,982
Amount   = 18,449,998,500

Difference:
18 invoices
1,500 amount variance
```

## 38. Data Lineage

Example:

```text
Target Customer 10293
       ↓
Migration JOB-1004
       ↓
Canonical Customer
       ↓
Excel row 82931
       ↓
Customer.xlsx
```

Use lineage for:

- Support
- Audit
- Compliance
- Root-cause analysis
- Reprocessing

## 39. Audit Trail

Capture:

```text
tenantId
actorId
action
resourceType
resourceId
timestamp
IP
userAgent
correlationId
relevant change information
```

Audit actions such as:

```text
Migration approved
Mapping changed
Connector changed
Credential rotated
Migration cancelled
Migration resumed
User role changed
```

## 40. Secrets Management

Avoid generic raw credential storage:

```prisma
authDetails Json
```

Prefer:

```text
Connector
   ↓
Secret Reference
   ↓
KMS / Vault / Secret Manager
```

Database stores:

```text
secretProvider
secretRef
```

## 41. Real-Time Progress

Do not send one event per record.

Instead publish progress snapshots:

```json
{
  "jobId": "JOB123",
  "stage": "LOAD",
  "processed": 450000,
  "total": 1000000,
  "errors": 120,
  "throughput": 1850,
  "timestamp": "2026-08-17T00:00:00Z"
}
```

Recommended:

```text
Worker
  ↓
Redis/Event
  ↓
Realtime Gateway
  ↓
WebSocket/SSE
  ↓
React
```

## 42. Redis Responsibilities

Use Redis for:

- BullMQ
- Rate limiting
- Progress snapshots
- Cache
- Temporary state
- Pub/Sub

Do not make Redis the authoritative store for critical migration metadata.

## 43. Database Transactions

Use transactions for control-plane state changes.

Good:

```text
BEGIN
  create migration
  create run
  create first stage
COMMIT
```

Then call external ERP.

Then persist the result in another transaction.

Never keep a PostgreSQL transaction open while waiting on a slow external system.

## 44. Bulk Processing

Avoid:

```text
for each record:
    prisma.create()
```

Prefer:

```text
Batch APIs
Native bulk operations
PostgreSQL COPY
Bulk insert
Target-specific bulk APIs
```

## 45. Indexing

Typical indexes:

```text
MigrationJob
  (tenantId, createdAt)
  (tenantId, status)

MigrationBatch
  (jobId, batchNumber)
  (jobId, status)

MigrationError
  (jobId, severity)
  (tenantId, jobId)

AuditLog
  (tenantId, createdAt)
```

Add indexes based on observed queries.

## 46. Partitioning

Do not partition everything initially.

Potential high-volume candidates:

```text
MigrationEvent
MigrationError
AuditLog
MigrationRecord
```

Possible strategies:

```text
Time
Job
Tenant
Hybrid
```

Introduce partitioning after measuring actual volume.

## 47. Connection Management

Potential database clients include:

```text
Next.js API instances
Workers
Scheduled tasks
Admin tools
```

Use appropriate connection pooling and a managed PostgreSQL service where practical.

Do not solve database pressure simply by increasing connection limits.

## 48. Dashboard Architecture

Avoid expensive raw-data scans on every dashboard request.

Prefer:

```text
Raw Processing
  ↓
Summary Counters
  ↓
Reporting Tables / Materialized Views
  ↓
Dashboard
```

Metrics:

```text
Active Jobs
Queued Jobs
Failed Jobs
Records/sec
Success Rate
Average Duration
Worker Health
Connector Health
Tenant Usage
```

## 49. Observability

Use:

```text
OpenTelemetry
Structured Logging
Metrics
Distributed Tracing
```

Propagate:

```text
requestId
correlationId
traceId
tenantId
jobId
```

Trace example:

```text
JOB-123
  |
  +-- API request
  +-- Queue message
  +-- Worker
  +-- Connector request
  +-- Retry
  +-- Reconciliation
```

## 50. Performance Testing

Measure:

```text
API p95/p99
Queue wait time
Worker startup time
Records/sec
Batch duration
Memory/worker
CPU/worker
Target API latency
Database latency
Database connections
Retry rate
429 rate
```

Test:

```text
10K records
100K records
1M records
Multiple tenants
Multiple concurrent jobs
Slow APIs
429 responses
5xx responses
Worker crash/restart
Database failure scenarios
```

## 51. Backpressure

Example:

```text
Source = 10,000 records/sec
Target = 1,000 records/sec
```

Without backpressure the system can become unstable.

Use:

```text
Batch limits
Queue limits
Concurrency limits
Rate limiting
Flow control
Object-storage spillover
```

## 52. API vs Worker Scaling

Scale independently.

```text
API:
2 → 5 → 10 replicas

Workers:
2 → 10 → 50 replicas
```

Worker autoscaling should consider:

- Queue depth
- Queue age
- Throughput
- CPU
- Memory
- Connector limits

## 53. Frontend Integration

Recommended frontend:

```text
React
Vite
TypeScript
React Router
TanStack Query
Zustand
Tailwind
React Hook Form
Zod
```

Use TanStack Query for server state.

Use Zustand for transient UI state.

Do not duplicate server state in Zustand unless necessary.

## 54. Large Data UI

For migration result tables use:

- Server-side pagination
- Server-side filtering
- Server-side sorting
- Debounced search
- Virtualized rows
- Incremental loading
- Worker-based exports

Never render hundreds of thousands of DOM rows.

## 55. Security Requirements

At minimum:

```text
HTTPS
Strict CORS
Secure cookies
CSRF strategy where applicable
Input validation
Rate limiting
Security headers
Strong password hashing
Tenant isolation
Secret rotation
Audit logs
Least privilege
SAST
Dependency scanning
Container scanning
File validation
```

## 56. File Security

Uploaded files are untrusted.

Consider:

```text
File size limits
MIME/type validation
Extension validation
Malware scanning
Macro policy
Safe parsing
Restricted processing
```

## 57. Migration Reports

Generate:

```text
migration-summary.json
success.csv
failed.csv
warnings.csv
reconciliation.xlsx
audit.json
lineage.json
```

Store in object storage.

Store only metadata/references in PostgreSQL.

Use signed URLs for downloads.

## 58. Business Central Reference Connector

Suggested structure:

```text
connectors/business-central/
├── auth/
├── metadata/
├── schema/
├── pagination/
├── batching/
├── rate-limit/
├── retry/
├── customers/
├── vendors/
├── items/
├── invoices/
└── reconciliation/
```

Keep Business Central-specific logic inside this connector.

## 59. First Vertical Slice

Build one complete working path:

```text
Tenant
  ↓
Create Connector
  ↓
Upload Excel
  ↓
Profile
  ↓
Schema Detection
  ↓
Map Customer
  ↓
Validate
  ↓
Create Migration
  ↓
Queue Job
  ↓
Worker
  ↓
Transform
  ↓
Load PostgreSQL
  ↓
Reconcile
  ↓
Report
```

Then replace the target connector with Business Central.

## 60. Development Sequence

### M01 — Foundation

```text
Next.js API
PostgreSQL
Prisma
Authentication
Tenant
User
RBAC
API versioning
```

### M02 — Platform

```text
Connector registry
Secret references
Object storage
Schema registry
```

### M03 — Migration Control Plane

```text
MigrationProject
MigrationJob
MigrationRun
MigrationStage
State machine
Approval
```

### M04 — Worker Engine

```text
Redis
BullMQ
Worker runtime
Batch processing
Checkpointing
Retry
Idempotency
Pause/resume
```

### M05 — Data Pipeline

```text
Canonical model
Transformation engine
Validation
Data quality
Reconciliation
```

### M06 — Initial Connectors

```text
Excel
PostgreSQL
SQL Server
REST
```

### M07 — Enterprise Connector

```text
Business Central
Rate limiting
Circuit breaker
Retry
Idempotency
```

### M08 — Enterprise Readiness

```text
SSO
Secrets Manager
Audit
Lineage
OpenTelemetry
Metrics
Alerts
DR
```

## 61. What Not To Do

```text
❌ Long-running work inside Next.js route handlers
❌ Store all raw migration data in PostgreSQL
❌ One Prisma create() per record at high volume
❌ Connector logic inside controllers
❌ Raw secrets inside generic JSON
❌ Server state duplicated unnecessarily in Zustand
❌ Per-second polling for every migration
❌ Restart complete migrations for small failures
❌ Mutable mappings without versions
❌ eval() for customer transformations
❌ Dozens of microservices from day one
❌ Kubernetes before it is operationally justified
❌ Kafka before event scale requires it
❌ Unbounded worker concurrency
```

## 62. Deployment Roadmap

### MVP

```text
Web
 ↓
Next.js
 ↓
Managed PostgreSQL
 ↓
Redis
 ↓
Object Storage
 ↓
Worker
```

### Production

```text
Load Balancer
   |
   +-- API #1
   +-- API #2
   +-- API #3

Worker Pool
   |
   +-- Worker #1
   +-- Worker #2
   +-- Worker #3
   +-- Worker #4
```

### Enterprise

Only when required:

```text
WAF/CDN
Load Balancer
API pool
Control Plane
Queue/Event layer
Independent worker pools
Connector runtimes
Private networking
Dedicated customer environments
```

Possible later technologies:

```text
Kubernetes
Kafka/Redpanda
CDC
Multi-region
Dedicated databases
Dedicated environments
```

## 63. Testing Strategy

### Unit

Test:

```text
Mapping
Transformation
Validation
State machine
Retry classification
Idempotency
```

### Integration

Test:

```text
PostgreSQL
Redis
Object storage
Worker
Connector SDK
Queue
```

### Connector Contract Tests

Every connector should pass a common connector contract test suite.

### E2E

```text
Upload
 ↓
Profile
 ↓
Map
 ↓
Validate
 ↓
Approve
 ↓
Migrate
 ↓
Reconcile
 ↓
Download
```

## 64. CI/CD

Recommended:

```text
Pull Request
  ↓
Lint
  ↓
Type Check
  ↓
Unit Tests
  ↓
Integration Tests
  ↓
Security Scan
  ↓
Build
  ↓
Container Scan
  ↓
Staging
  ↓
E2E
  ↓
Approval
  ↓
Production
```

## 65. Disaster Recovery

PostgreSQL:

```text
Automated backup
Point-in-time recovery
Encryption
Restore testing
Retention
```

Object storage:

```text
Versioning
Lifecycle policies
Replication where required
Retention
Encryption
```

Define per customer tier:

```text
RPO
RTO
```

## 66. Architecture Rules

### Rule 1
Next.js API never executes long-running migration work synchronously.

### Rule 2
All migration workloads are asynchronous.

### Rule 3
Every stage is resumable where practical.

### Rule 4
Migration processing is idempotent.

### Rule 5
Large datasets live in object storage.

### Rule 6
PostgreSQL is the control-plane source of truth.

### Rule 7
Every tenant-owned record is tenant-scoped.

### Rule 8
Connector credentials never appear in logs.

### Rule 9
Connector failures cannot crash the API.

### Rule 10
Every migration is auditable.

### Rule 11
Critical migrations require reconciliation.

### Rule 12
Mappings are versioned.

### Rule 13
Customer code runs in a sandbox.

### Rule 14
Critical operations have correlation IDs.

### Rule 15
Microservices are introduced only when measured requirements justify them.

## 67. Technology Stack

### Frontend

```text
React
Vite
TypeScript
React Router
TanStack Query
Zustand
Tailwind
React Hook Form
Zod
```

### Backend / Control Plane

```text
Next.js
TypeScript
REST API
WebSocket/SSE
Prisma
PostgreSQL
```

### Worker

```text
Node.js
TypeScript
BullMQ
Redis
```

### Storage

```text
S3
MinIO
Azure Blob
```

### Security

```text
OIDC
SAML
KMS
Vault
Secret Manager
```

### Observability

```text
OpenTelemetry
Structured Logs
Metrics
Distributed Tracing
```

### Delivery

```text
Docker
GitHub Actions
Infrastructure as Code
```

## 68. Architecture Sign-Off Checklist

```text
[ ] Next.js is the Control Plane
[ ] Long-running work is outside Next.js requests
[ ] Prisma controls metadata/control-plane persistence
[ ] Redis/BullMQ handles durable execution
[ ] Workers scale independently
[ ] Object storage handles large datasets
[ ] Tenant isolation is enforced
[ ] RBAC is implemented
[ ] Connector SDK exists
[ ] Canonical model exists for priority entities
[ ] Mappings are versioned
[ ] Checkpointing exists
[ ] Idempotency exists
[ ] Retry/backoff exists
[ ] Dead-letter handling exists
[ ] Reconciliation exists
[ ] Audit trail exists
[ ] Data lineage exists
[ ] Secrets are managed securely
[ ] OpenTelemetry/structured logs exist
[ ] Large-table UI is paginated/virtualized
[ ] Backups and restore procedures exist
[ ] Performance testing exists
[ ] CI/CD gates exist
```

## 69. Final Architectural Guidance

Build EDIMP as a **migration platform**, not a normal CRUD application.

The CRUD/control-plane portion is relatively straightforward.

The difficult engineering is:

```text
Reliable execution
+
High-volume data movement
+
External-system instability
+
Checkpointing
+
Idempotency
+
Data quality
+
Reconciliation
+
Tenant isolation
+
Auditability
+
Observability
```

The recommended progression is:

```text
Next.js Control Plane
        ↓
Redis/BullMQ
        ↓
Worker Runtime
        ↓
Object Storage
        ↓
Canonical Model
        ↓
Connector SDK
        ↓
Target Systems
```

This architecture allows EDIMP to start simply while retaining a clear path toward enterprise scale without replacing the foundational design later.
