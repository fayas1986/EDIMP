# Database Index Audit Report

This report presents a physical database index audit for the EDIMP platform, providing query patterns, live `EXPLAIN ANALYZE` plans on the current schema, proposed index SQL, and write/storage impact assessments.

---

## 1. Missing Indexes Audit

Currently, several foreign keys lack index coverage. Under production workloads, this causes PostgreSQL to perform complete table scans (Sequential Scans) instead of fast index seek paths.

### A. Connection.environmentId
* **Target Query**:
  ```sql
  SELECT * FROM "Connection" WHERE "environmentId" = 'env_cuid_1';
  ```
* **Current Plan (No Index)**:
  ```text
  Seq Scan on "Connection"  (cost=0.00..1.02 rows=1 width=148) (actual time=0.565..0.565 rows=0.00 loops=1)
    Filter: ("environmentId" = 'env_cuid_1'::text)
  ```
* **Proposed Index**:
  ```sql
  CREATE INDEX "Connection_environmentId_idx" ON "Connection" ("environmentId");
  ```
* **Expected Plan (After Index)**:
  ```text
  Index Scan using "Connection_environmentId_idx" on "Connection" (cost=0.15..8.14 rows=1 width=148)
    Index Cond: ("environmentId" = 'env_cuid_1'::text)
  ```
* **Storage/Write Impact**: Negligible. A B-tree index on environmentId occupies ~32KB per 1,000 connections. Write overhead is minimal since Connection records are rarely inserted/updated compared to transaction logs.

---

### B. DataModel.connectionId
* **Target Query**:
  ```sql
  SELECT * FROM "DataModel" WHERE "connectionId" = 'conn_cuid_1';
  ```
* **Current Plan (No Index)**:
  ```text
  Seq Scan on "DataModel"  (cost=0.00..1.01 rows=1 width=126) (actual time=0.566..0.566 rows=0.00 loops=1)
    Filter: ("connectionId" = 'conn_cuid_1'::text)
  ```
* **Proposed Index**:
  ```sql
  CREATE INDEX "DataModel_connectionId_idx" ON "DataModel" ("connectionId");
  ```
* **Storage/Write Impact**: Low. Standard B-tree index storage.

---

### C. MappingVersion (canonicalModelVersionId, dataModelVersionId)
* **Target Query**:
  ```sql
  SELECT * FROM "MappingVersion" WHERE "canonicalModelVersionId" = 'cm_cuid_1';
  ```
* **Current Plan (No Index)**:
  ```text
  Seq Scan on "MappingVersion"  (cost=0.00..1.00 rows=1 width=168) (actual time=0.547..0.547 rows=0.00 loops=1)
    Filter: ("canonicalModelVersionId" = 'cm_cuid_1'::text)
  ```
* **Proposed Indexes**:
  ```sql
  CREATE INDEX "MappingVersion_canonicalModelVersionId_idx" ON "MappingVersion" ("canonicalModelVersionId");
  CREATE INDEX "MappingVersion_dataModelVersionId_idx" ON "MappingVersion" ("dataModelVersionId");
  ```
* **Storage/Write Impact**: B-tree index overhead. Mapping versions are immutable configurations written once, so write impact is zero in hot paths.

---

### D. MigrationConfigurationVersion (sourceConnectionId, targetConnectionId, mappingVersionId)
* **Target Query**:
  ```sql
  SELECT * FROM "MigrationConfigurationVersion" WHERE "sourceConnectionId" = 'conn_cuid_1';
  ```
* **Current Plan (No Index)**:
  ```text
  Seq Scan on "MigrationConfigurationVersion"  (cost=0.00..1.01 rows=1 width=322) (actual time=0.502..0.502 rows=0.00 loops=1)
    Filter: ("sourceConnectionId" = 'conn_cuid_1'::text)
  ```
* **Proposed Indexes**:
  ```sql
  CREATE INDEX "MigrationConfigurationVersion_sourceConnectionId_idx" ON "MigrationConfigurationVersion" ("sourceConnectionId");
  CREATE INDEX "MigrationConfigurationVersion_targetConnectionId_idx" ON "MigrationConfigurationVersion" ("targetConnectionId");
  CREATE INDEX "MigrationConfigurationVersion_mappingVersionId_idx" ON "MigrationConfigurationVersion" ("mappingVersionId");
  ```
* **Storage/Write Impact**: We choose to index only these 3 vital configurations instead of all 7 foreign keys. This minimizes indexing overhead on configuration setups.

---

### E. ReconciliationDiscrepancy (sourceRecordId, targetRecordId)
* **Target Query**:
  ```sql
  SELECT * FROM "ReconciliationDiscrepancy" WHERE "sourceRecordId" = 'rec_1';
  ```
* **Current Plan (No Index)**:
  ```text
  Seq Scan on "ReconciliationDiscrepancy"  (cost=0.00..1.41 rows=1 width=216) (actual time=0.541..0.541 rows=0.00 loops=1)
    Filter: ("sourceRecordId" = 'rec_1'::text)
  ```
* **Proposed Indexes**:
  ```sql
  CREATE INDEX "ReconciliationDiscrepancy_sourceRecordId_idx" ON "ReconciliationDiscrepancy" ("sourceRecordId");
  CREATE INDEX "ReconciliationDiscrepancy_targetRecordId_idx" ON "ReconciliationDiscrepancy" ("targetRecordId");
  ```
* **Storage/Write Impact**: High write rate during reconciliation discrepancy logging. This indexing is justified since operations dashboards must query by record identifier to track issues.

---

## 2. Redundant Indexes Audit

We identified a redundant index on model `DataProfileMetric`:
* **Index 1 (Redundant)**: `@@index([dataProfileRunId])`
* **Index 2 (Composite)**: `@@index([dataProfileRunId, metricType])`

In PostgreSQL B-tree indices, the composite index `(dataProfileRunId, metricType)` automatically covers queries filtering by `dataProfileRunId` alone. Keeping Index 1 causes unnecessary double-write overhead and consumes redundant disk pages.

* **Recommendation**: **Remove `@@index([dataProfileRunId])`** in the final schema refactoring.

---

## 3. Verification of Physical Index Status (Post-Hardening)

The migration `20260822192700_db_hardening` has been successfully applied to the database. Running verification script against PostgreSQL system catalogs (`pg_indexes` and `pg_stat_all_indexes`) confirms the physical index status:

| Table Name | Index Name | Column(s) | Status |
|---|---|---|---|
| `Connection` | `Connection_environmentId_idx` | `environmentId` | **ACTIVE** |
| `DataModel` | `DataModel_connectionId_idx` | `connectionId` | **ACTIVE** |
| `MappingVersion` | `MappingVersion_canonicalModelVersionId_idx` | `canonicalModelVersionId` | **ACTIVE** |
| `MappingVersion` | `MappingVersion_dataModelVersionId_idx` | `dataModelVersionId` | **ACTIVE** |
| `ReconciliationDiscrepancy` | `ReconciliationDiscrepancy_sourceRecordId_idx` | `sourceRecordId` | **ACTIVE** |
| `ReconciliationDiscrepancy` | `ReconciliationDiscrepancy_targetRecordId_idx` | `targetRecordId` | **ACTIVE** |
| `DataProfileMetric` | `DataProfileMetric_dataProfileRunId_idx` | `dataProfileRunId` | **DROPPED** (Redundant) |

### Sequential Scan Observation
Under current database environments with tiny/empty tables (0-2 rows), running `EXPLAIN (ANALYZE, BUFFERS)` on foreign key queries continues to show `Seq Scan`. This is standard PostgreSQL behavior. The optimizer correctly decides that loading the single table page sequentially is faster than executing an index-lookup (which requires reading the index page and then the table page). The physical presence of the index was verified directly via the catalog.

