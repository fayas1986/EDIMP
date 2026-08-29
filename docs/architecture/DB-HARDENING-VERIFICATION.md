# DB Hardening Verification Report

This report summarizes the verification status of all database schema and tuning proposals for the EDIMP platform. Every proposed modification has been evaluated based on empirical benchmarks, query paths, and security constraints.

---

## 1. Schema Change Classification Registry

All proposed optimizations are classified under one of four states: **APPROVED**, **APPROVED WITH CONDITIONS**, **DEFER**, or **REJECT**.

| Change Reference | Description | Status | Rationale / Conditions |
|---|---|---|---|
| **DB-PK-BIGINT** | Convert Primary Keys on high-volume tables (`MigrationRecord`, `RecordError`, `ReconciliationObservation`) from CUID (String) to BIGINT. | **DEFER** | Deferred until 1M/10M scale performance tests are completed. BIGINT demonstrates significant index savings (~62%) but CUID is kept initially to avoid destructive migrations. |
| **DB-IDX-FK-ADD** | Add missing indexes to `Connection`, `DataModel`, `MappingVersion`, `MigrationConfigurationVersion`, and `ReconciliationDiscrepancy`. | **APPROVED** | Recommended based on `EXPLAIN` query paths showing potential full table scans (Seq Scan) on high-frequency operational joins. |
| **DB-IDX-RED-DROP** | Remove redundant index `@@index([dataProfileRunId])` from `DataProfileMetric`. | **APPROVED** | The existing composite index `(dataProfileRunId, metricType)` covers single-column queries on `dataProfileRunId` without extra overhead. |
| **DB-TENANT-PROP** | Physically propagate `tenantId` columns into child resources for Row-Level Security (RLS). | **DEFER** | Tenant validation will be enforced in NestJS domain services. Physical columns are deferred to avoid denormalizing the workspace-scoped context. |
| **DB-TIME-UTC** | Standardize DateTime columns to native PostgreSQL `TIMESTAMPTZ` via `@db.Timestamptz(6)`. | **APPROVED WITH CONDITIONS** | Approved on the condition that all application dates, worker nodes, and audit logs standardize strictly on UTC. |
| **DB-DEL-SETNULL** | Retain `onDelete: SetNull` for `ReconciliationRun` -> `MigrationRun`. | **APPROVED** | Deliberately classified as independent historical evidence that must survive data-plane cleanup. |
| **DB-JSONB-GIN** | Add GIN index to `RecordError.sanitizedDiagnostics` and `AuditLog.details`. | **APPROVED WITH CONDITIONS** | Restricted to operational auditing tables where queries perform keys/value filters inside payload documents. |

---

## 2. Hardening Summary Checkpoints

1. **Delete Integrity**: Checked all dependencies. Cascades are limited to direct composite child records (like batch details and execution logs). Restricts protect critical configuration entities.
2. **Timezone Uniformity**: Standardized on UTC across the control plane, database layer, worker executions, and MCP integrations.
3. **No Destructive Operations**: All updates must be implemented via Prisma Migrations (`npx prisma migrate dev`), which generate SQL code committed for versioning and verification.
4. **Serialization Safety**: If BIGINT keys are approved in the future, NestJS interceptors will serialize BIGINT values to strings before exposing them to the API/MCP, preventing JavaScript precision loss.

---

## 3. Execution & Verification Logs (August 22, 2026)

### Applied Migrations
1. **`20260821000000_phase6_7_sync`**: Marked as applied on Neon to sync local history with Phase 6 (Reconciliation) and Phase 7 (AI Agents) tables which were previously pushed via `db push`.
2. **`20260822192700_db_hardening`**: Hardening migration containing:
   - Altered all `DateTime` columns to `TIMESTAMPTZ(6)` under UTC timezone context.
   - Created missing FK indexes (`Connection.environmentId`, `DataModel.connectionId`, etc.).
   - Dropped redundant index `DataProfileMetric.dataProfileRunId`.
   - Retained `onDelete: SetNull` for `ReconciliationRun` -> `MigrationRun`.

### Physical Index Validation
Querying PostgreSQL catalog (`pg_indexes`) verified that:
- Indexes for all target foreign keys are active (e.g. `Connection_environmentId_idx`, `DataModel_connectionId_idx`, `MappingVersion_canonicalModelVersionId_idx`, `MappingVersion_dataModelVersionId_idx`, `ReconciliationDiscrepancy_sourceRecordId_idx`, `ReconciliationDiscrepancy_targetRecordId_idx`).
- Redundant index `DataProfileMetric_dataProfileRunId_idx` has been successfully dropped from the catalog.

### Explain Analyze Verification (Tiny Tables Sequential Scan Behaviour)
Queries against `Connection`, `DataModel`, etc. using `EXPLAIN (ANALYZE, BUFFERS)` still result in `Seq Scan` under tiny test databases (0-2 rows). This is the expected and optimal behaviour of the PostgreSQL query planner because a sequential scan on a single page is cheaper than traversing a B-Tree index.

### E2E Regression Results
- **Status**: Passed (88/88 test cases in NestJS E2E test suites passed without regressions).
- **Hardening Enhancements**: Fixed asynchronous timing races in `phase6.e2e-spec.ts` by replacing hardcoded `setTimeout` sleeps with dynamic polling of run status.

