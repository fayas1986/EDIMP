# Tenant Boundary Matrix

This document maps all 42+ database models of the EDIMP platform to their respective tenancy levels, defines access resolution paths, and outlines boundary validation constraints to ensure complete tenant isolation.

---

## 1. Model Tenancy Classification

Every database entity is mapped to its tenancy scoping boundary:

| Model | Tenancy Level | Scoping Link / Parent |
|---|---|---|
| `Tenant` | **TENANT** | Self (Root Tenant) |
| `TenantMember` | **TENANT** | `Tenant` |
| `User` | **GLOBAL / TENANT** | User registry is global, memberships are tenant-scoped |
| `Workspace` | **WORKSPACE** | `Tenant` |
| `WorkspaceMember` | **WORKSPACE** | `Workspace` |
| `Environment` | **ENVIRONMENT** | `Workspace` |
| `ConnectorType` | **GLOBAL** | Shared reference catalog |
| `Connection` | **ENVIRONMENT** | `Environment` |
| `CredentialReference` | **EXECUTION** | `Connection` (Secret Vault mapping) |
| `DataModel` | **ENVIRONMENT** | `Connection` |
| `DataModelVersion` | **REFERENCE** | `DataModel` |
| `DataEntity` | **REFERENCE** | `DataModelVersion` |
| `DataField` | **REFERENCE** | `DataEntity` |
| `DataProfileRun` | **EXECUTION** | `DataModelVersion` |
| `DataProfileMetric` | **EXECUTION** | `DataProfileRun` |
| `CanonicalModel` | **WORKSPACE** | `Workspace` |
| `CanonicalModelVersion`| **REFERENCE** | `CanonicalModel` |
| `CanonicalEntity` | **REFERENCE** | `CanonicalModelVersion` |
| `CanonicalField` | **REFERENCE** | `CanonicalEntity` |
| `MappingSet` | **WORKSPACE** | `Workspace` |
| `MappingVersion` | **REFERENCE** | `MappingSet` |
| `EntityMapping` | **REFERENCE** | `MappingVersion` |
| `FieldMapping` | **REFERENCE** | `EntityMapping` |
| `TransformationSet` | **WORKSPACE** | `Workspace` |
| `TransformationVersion`| **REFERENCE** | `TransformationSet` |
| `FieldTransformation` | **REFERENCE** | `TransformationVersion` |
| `ValidationSet` | **WORKSPACE** | `Workspace` |
| `ValidationVersion` | **REFERENCE** | `ValidationSet` |
| `FieldValidationRule` | **REFERENCE** | `ValidationVersion` |
| `PipelineJob` | **ENVIRONMENT** | `Environment` |
| `PipelineExecutionRun` | **EXECUTION** | `PipelineJob` |
| `PipelineExecutionLog` | **EXECUTION** | `PipelineExecutionRun` |
| `MigrationJob` | **ENVIRONMENT** | `Environment` |
| `MigrationConfigurationVersion` | **REFERENCE** | `MigrationJob` |
| `MigrationIdentity` | **EXECUTION** | `MigrationConfigurationVersion` |
| `MigrationRun` | **EXECUTION** | `MigrationConfigurationVersion` |
| `JobBatch` | **EXECUTION** | `MigrationRun` |
| `MigrationRecord` | **EXECUTION** | `MigrationRun` |
| `RecordError` | **AUDIT** | `MigrationRecord` |
| `ReconciliationJob` | **ENVIRONMENT** | `Environment` |
| `ReconciliationConfigurationVersion`| **REFERENCE** | `ReconciliationJob` |
| `ReconciliationRun` | **EXECUTION** | `ReconciliationConfigurationVersion` |
| `ReconciliationBatch` | **EXECUTION** | `ReconciliationRun` |
| `ReconciliationDiscrepancy` | **AUDIT** | `ReconciliationConfigurationVersion` |
| `ReconciliationObservation` | **AUDIT** | `ReconciliationDiscrepancy` |
| `ErrorManualOverride` | **AUDIT** | `RecordError` |
| `ErrorResolutionLog` | **AUDIT** | `RecordError` |
| `AiAgentTask` | **WORKSPACE** | `Workspace` |
| `AiMappingSuggestion` | **REFERENCE** | `AiAgentTask` |
| `AiDriftRepairSuggestion` | **REFERENCE** | `AiAgentTask` |
| `AiAnomalyAnalysis` | **AUDIT** | `AiAgentTask` |
| `AiQuerySession` | **WORKSPACE** | `Workspace` |
| `AiQueryMessage` | **REFERENCE** | `AiQuerySession` |
| `WorkerNode` | **GLOBAL** | Shared background worker registry |
| `AuditLog` | **AUDIT** | Workspace-scoped audit trails |

---

## 2. Tenancy Resolution Logic

Tenant boundary validation is resolved dynamically at the application runtime layer via NestJS Interceptors and Guards:

```text
HTTP / MCP Request
       │
       ▼
Resolve JWT / Session API Key
       │
       ▼
Tenant Auth Guard
  ├── 1. Read 'x-tenant-id' header or context
  ├── 2. Verify User membership in Tenant (TenantMember check)
  └── 3. Bind 'tenantId' to request context
       │
       ▼
Workspace / Environment Guard (Optional)
  ├── 1. Verify target Workspace/Environment belongs to the bound tenantId
  └── 2. Throw 403 Forbidden if workspace.tenantId != currentTenantId
```

---

## 3. Boundary Consistency Enforcement

To prevent cross-tenant references (e.g. a Connection in Tenant A pointing to an Environment in Tenant B), the database enforces constraints using composite references:

### Database-Level Composite Keys
When a child record links to its parent, we reference both the parent ID and the tenant ID:
1. **Unique Constraint**: The parent table defines a unique composite key on `(id, tenantId)`.
2. **Foreign Key**: The child table references this composite key.
   ```sql
   ALTER TABLE "Environment" ADD CONSTRAINT "env_tenant_uq" UNIQUE (id, tenant_id);
   
   ALTER TABLE "Connection" ADD CONSTRAINT "conn_env_tenant_fk" 
     FOREIGN KEY (environment_id, tenant_id) REFERENCES "Environment"(id, tenant_id);
   ```

This architecture ensures that tenant isolation is guaranteed at the physical database storage layer, completely eliminating isolation breaches.
