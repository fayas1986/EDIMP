# Enterprise Data Integration & Migration Platform (EDIMP) — User Manual & Service Catalogue

Welcome to the **Enterprise Data Integration & Migration Platform (EDIMP)**. This user manual catalogue provides a comprehensive guide to navigating, configuring, and executing enterprise-scale data migration and integration operations.

---

## 📖 Table of Contents
1. [🏢 Multi-Tenant Organization & Workspaces](#multi-tenant-org)
2. [🔌 Connector Management & Data Profiling](#connector-management)
3. [🗺️ Schema Registry & Mapping Studio](#schema-registry)
4. [⚙️ Expression Engine & Transformations](#expression-engine)
5. [🚀 Ingestion Pipelines & Migration Wizard](#ingestion-pipelines)
6. [🔍 Reconciliation & Discrepancy Engine](#reconciliation-engine)
7. [🤖 AI Co-Pilot & Anomaly Detection](#ai-copilot)
8. [📊 Enterprise Observability & System Health](#enterprise-observability)
9. [🧪 Data Quality Studio](#data-quality-studio)
10. [🛡️ Migration Sandbox & Production Promotion](#migration-sandbox)
11. [🗼 Migration Control Tower](#control-tower)

---

## <a id="multi-tenant-org"></a>🏢 1. Multi-Tenant Organization & Workspaces

EDIMP supports a multi-tenant hierarchy designed to match complex corporate structures while ensuring complete data isolation.

```text
Corporate Tenant (e.g., Enterprise Corp)
  └── Workspace (e.g., Finance Department)
        └── Environment (e.g., Staging / Production)
```

### Key Operations
* **Tenant Switching**: Utilize the top-right Tenant Selector to switch contexts. All visible dashboards, connectors, and jobs automatically update to your active tenant.
* **Workspace Management**: Group related migration projects together. You can invite team members to workspaces with dedicated roles (e.g., `Owner`, `Contributor`, `Viewer`).
* **Environment Provisioning**: Assign target endpoints to distinct environments (Development, QA, Staging, Production). Production environments enforce stricter execution rules, approval steps, and audit tracking.

---

## <a id="connector-management"></a>🔌 2. Connector Management & Data Profiling

Connectors serve as the bridges between EDIMP and your source/target systems.

### Supported Systems
* **Databases**: PostgreSQL, Microsoft SQL Server, Oracle.
* **ERPs / CRMs**: SAP, Dynamics 365, Business Central, Salesforce.
* **Files & Streams**: Excel, CSV, JSON, REST Webhooks, SFTP folders.

### Working with Connectors
1. **Configure Connection**: Access the **Connectors** tab, click **New Connector**, select the type, and enter the connection details (e.g., URL, credentials). All secrets are cryptographically secured.
2. **Test Connection**: Run a diagnostic ping to ensure credentials and firewall settings allow communication.
3. **Data Profiling**: Once connected, trigger **Profile Schema**. The profiling engine analyzes cardinality, null ratios, data types, and row counts to assess source data quality before any migration is planned.

---

## <a id="schema-registry"></a>🗺️ 3. Schema Registry & Mapping Studio

The Mapping Studio is where you align heterogeneous source data models with your target system's canonical records.

```text
Source Field (e.g., cust_no)  ──────> Transformation Engine ──────> Target Field (e.g., CustomerID)
```

### Key Capabilities
* **Target Schema Registry**: View defined target structures (e.g., Customer, Vendor, Ledger, Invoice) and their associated validation requirements.
* **Visual Field Mapping**: Map fields using drag-and-drop or select menus. Track source-to-target field associations in real-time.
* **Mapping Sets**: Save mapping configurations as versioned files (e.g., `v1.0.0-draft`). Publish mappings to freeze configurations before migration execution.

---

## <a id="expression-engine"></a>⚙️ 4. Expression Engine & Transformations

EDIMP features a safe transformation engine that allows you to clean and alter data in transit without security risks.

### Transformation Operations
* **String Functions**: Concatenation, casing alignment, substring extraction, trimming.
* **Math & Formatting**: Date format normalization (e.g., `YYYY-MM-DD`), numeric rounding, currency conversions.
* **Lookup Tables**: Map source enumeration codes (e.g., `US-EAST`) to target equivalents (e.g., `East_Region`) using key-value lookup dictionaries.
* **Mapping Preview**: Preview how your transformations affect sample rows instantly before running the pipeline.

---

## <a id="ingestion-pipelines"></a>🚀 5. Ingestion Pipelines & Migration Wizard

The Migration Wizard guides you through configuring, scheduling, and running bulk data migrations.

### Running a Migration
1. **Pipeline Selection**: Select your source connector, target connector, and the mapping set version.
2. **Execution Strategy**: Define chunk limits (e.g., batch sizes of 1,000 records) and retry parameters.
3. **Lease & Run**: Click **Start Migration**. The task is placed in the background worker queue. You can safely close your browser or navigate to other tabs; workers handle execution asynchronously.
4. **Resumable Runs**: If a network interruption occurs, the migration engine resumes from the last successfully written database checkpoint, preventing duplicate inserts.

---

## <a id="reconciliation-engine"></a>🔍 6. Reconciliation & Discrepancy Engine

Ensure absolute data integrity after ingestion using the reconciliation module.

### Reconciliation Steps
* **Hash Verification**: Compares source and target record counts and digital checksums to identify missing or altered records.
* **Discrepancy Inspector**: Mismatched records are logged in the discrepancy table, detailing exactly which field failed parity.
* **Delta Patches**: Generate execution patches to update only the modified or missing items, eliminating the need to re-run the entire migration.

---

## <a id="ai-copilot"></a>🤖 7. AI Co-Pilot & Anomaly Detection

Leverage Google Gemini AI to automate tedious mapping work and detect system anomalies.

### AI Features
* **Auto-Mapping Recommendations**: The AI engine scans source and target field descriptions and automatically suggests maps, assigning a confidence score (e.g., 95% Match).
* **Schema Drift Alarms**: Detects when source schemas change (e.g., a new database column is added) and recommends corresponding layout adjustments.
* **Fallback Hardening**: Under high loads or API rate limits (HTTP 429), the AI engine automatically falls back to deterministic rule-based mapping to prevent process blocks.

---

## <a id="enterprise-observability"></a>📊 8. Enterprise Observability & System Health

Monitor system performance and view logs in real-time to ensure operational health.

### Observability Utilities
* **System Metrics Dashboard**: Monitor throughput (records/sec), queue length, and worker node scaling patterns.
* **Live Log Stream**: View real-time output from execution workers during active migrations.
* **Error Center & Dead-Letter Queue (DLQ)**: Failed records are parked in the DLQ. You can inspect errors (e.g., "Invalid foreign key constraint"), modify mapping records, and replay them from the UI.
* **Audit Trail**: View immutable audit trails showing which user ran a migration, updated credentials, or altered mappings.

---

## <a id="data-quality-studio"></a>🧪 9. Data Quality Studio

The **Data Quality Studio** serves as the central gatekeeper for data validation before load operations, analyzing and exposing comprehensive record quality metrics.

### Key Data Quality Metrics
* **Completeness**: Measures the presence of mandatory fields (e.g., non-null constraints, missing customer names).
* **Validity**: Verifies data formatting rules (e.g., email patterns, zip code structures, currency formats).
* **Uniqueness**: Identifies duplicate records within source datasets.
* **Consistency**: Verifies logic compatibility (e.g., transaction timestamps preceding billing dates).
* **Referential Integrity**: Checks that all foreign references (e.g., customer IDs in an invoice) point to existing records.

### Sample Quality Report
```text
DATA QUALITY STUDIO

Completeness            94%
Validity                89%
Uniqueness              97%
Consistency             91%
Referential Integrity   86%
───────────────────────────
Overall                 91%
```

### Detected Issues Log
* `2,341` invalid currency codes (Validity mismatch)
* `817` duplicate customer records (Uniqueness mismatch)
* `412` missing tax identification numbers (Completeness mismatch)
* `183` orphan invoices with missing customer links (Referential Integrity mismatch)

### Direct Data Remediation Workflow
EDIMP features a circular feedback loop allowing data engineers to remediate issues on the fly:
$$\text{Fix} \longrightarrow \text{Preview} \longrightarrow \text{Approve} \longrightarrow \text{Apply}$$
1. **Fix**: Map static fallback variables or filter rules directly in the issue log to overwrite incorrect inputs.
2. **Preview**: Instantly preview the updated records against the canonical schema rules.
3. **Approve**: Confirm the override rule logic is correct.
4. **Apply**: Write changes to the in-memory staging pipeline (without touching the source database).

---

## <a id="migration-sandbox"></a>🛡️ 10. Migration Sandbox & Production Promotion

To minimize risk, EDIMP mandates a staging dry-run using isolated sandboxes before write permissions are granted on live production databases.

### Sandbox Execution Flow
```text
SOURCE ──> EDIMP ──> TRANSFORM ──> TARGET SANDBOX ──> RECONCILIATION
```

### Migration Simulation Report
Every sandbox run yields a detailed diagnostic run breakdown:

```text
Migration Simulation Report
-----------------------------------------
Records Processed           1,250,000
Successfully Transformed    1,241,892
Transformation Errors           8,108
Duplicates                      2,421
Missing References                781
Target Validation Failures      3,204
-----------------------------------------
Estimated Production Success Rate: 98.7%
```

### Promotion Gate Workflow
* Once execution completes in the Target Sandbox, the discrepancy engine verifies the reconciliation rate.
* **Promote Migration to Production**: An executive approval button becomes active only if the simulation report meets the target workspace SLA threshold (e.g., > 98% Success Rate). Clicking this promotes the frozen mapping configuration to the live production database environment.

---

## <a id="control-tower"></a>🗼 11. Migration Control Tower

The **Migration Control Tower** provides an executive dashboard visualizing overall health across all active projects, serving both managers and technical teams.

```text
┌─────────────────────────────────────────────────┐
│              MIGRATION CONTROL TOWER            │
├─────────────────────────────────────────────────┤
│                                                 │
│  Active Migrations        12                    │
│  Records Processed        48.7M                 │
│  Success Rate             99.21%                │
│  Reconciliation           99.94%                │
│  Data Quality             94%                   │
│                                                 │
├─────────────────────────────────────────────────┤
│ Migration Projects                              │
│                                                 │
│ AX → BC              ████████████  94%          │
│ SAP → D365            ██████████   87%          │
│ SQL → PostgreSQL      ███████████  91%          │
│ Legacy → SaaS         ███████      73%          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Features
* **Key Performance Indicators**: Get a consolidated overview of active jobs, aggregate volume, execution success rate, and data quality indexes.
* **Consolidated Progress Trackers**: Tracks multi-project stages with visual horizontal progress bars, mapping status from extraction up to reconciliation.
