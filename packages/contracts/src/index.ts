import { z } from 'zod';

// ==========================================
// COMMON / ERROR & PAGINATION CONTRACTS
// ==========================================

export const ErrorResponseSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
  details: z.array(z.any()).optional(),
  traceId: z.string().optional(),
});

export class ErrorResponseDto {
  statusCode!: number;
  error!: string;
  message!: string;
  details?: any[];
  traceId?: string;
}

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

export class PaginationQueryDto {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items?: T[];
  data?: T[];
  pagination: {
    limit?: number;
    offset?: number;
    total?: number;
    page?: number;
    pageSize?: number;
    totalItems?: number;
    totalPages?: number;
  };
}

// ==========================================
// PHASE 1: IDENTITY, TENANCY & ENVIRONMENTS
// ==========================================

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(255),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export const CreateTenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
});

export const UpdateTenantSchema = CreateTenantSchema.partial();

export const WorkspaceSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1, 'Name is required').max(255),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
});

export const UpdateWorkspaceSchema = CreateWorkspaceSchema.partial();

export const EnvironmentSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string().min(1, 'Name is required').max(255),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export const CreateEnvironmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
});

export const UpdateEnvironmentSchema = CreateEnvironmentSchema.partial();

export type Tenant = z.infer<typeof TenantSchema>;
export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantDto = z.infer<typeof UpdateTenantSchema>;

export type Workspace = z.infer<typeof WorkspaceSchema>;
export type CreateWorkspaceDto = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspaceDto = z.infer<typeof UpdateWorkspaceSchema>;

export type Environment = z.infer<typeof EnvironmentSchema>;
export type CreateEnvironmentDto = z.infer<typeof CreateEnvironmentSchema>;
export type UpdateEnvironmentDto = z.infer<typeof UpdateEnvironmentSchema>;

// ==========================================
// PHASE 2: CONNECTORS, DATA MODELS & PROFILING
// ==========================================

export const ConnectorCategoryEnum = z.enum(['ERP', 'CRM', 'DATABASE', 'API', 'FILE', 'CLOUD_STORAGE', 'DATA_WAREHOUSE']);
export const ConnectorDirectionEnum = z.enum(['SOURCE', 'TARGET', 'BOTH']);
export const ConnectorStatusEnum = z.enum(['ACTIVE', 'DEPRECATED', 'SUNSET']);
export const ConnectionStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'TESTING', 'ERROR']);
export const DataModelVersionStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'SUPERSEDED']);
export const ProfileRunStatusEnum = z.enum(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export const ProfileMetricTypeEnum = z.enum([
  'RECORD_COUNT',
  'NULL_COUNT',
  'DISTINCT_COUNT',
  'DUPLICATE_COUNT',
  'MIN_VALUE',
  'MAX_VALUE',
  'DATA_TYPE_DISTRIBUTION',
  'FORMAT_DISTRIBUTION'
]);
export const CredentialTypeEnum = z.enum(['OAUTH', 'BASIC', 'API_KEY', 'BEARER_TOKEN']);
export const DataTypeEnum = z.enum(['STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'DATETIME', 'JSON', 'UNKNOWN']);

export const ConnectorTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: ConnectorCategoryEnum,
  version: z.string(),
  direction: ConnectorDirectionEnum,
  status: ConnectorStatusEnum,
  capabilities: z.record(z.any()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type ConnectorType = z.infer<typeof ConnectorTypeSchema>;

export const ConnectionSchema = z.object({
  id: z.string(),
  environmentId: z.string(),
  connectorTypeId: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  status: ConnectionStatusEnum.default('ACTIVE'),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const CreateConnectionSchema = z.object({
  connectorTypeId: z.string(),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  credentialType: CredentialTypeEnum.optional(),
  vaultPath: z.string().optional(),
});

export const UpdateConnectionSchema = CreateConnectionSchema.partial();

export const TestConnectionResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  latencyMs: z.number().optional(),
});

export type Connection = z.infer<typeof ConnectionSchema>;
export type CreateConnectionDto = z.infer<typeof CreateConnectionSchema>;
export type UpdateConnectionDto = z.infer<typeof UpdateConnectionSchema>;
export type TestConnectionResult = z.infer<typeof TestConnectionResultSchema>;

export const DataFieldSchema = z.object({
  id: z.string(),
  dataEntityId: z.string(),
  name: z.string(),
  dataType: DataTypeEnum.default('UNKNOWN'),
  isNullable: z.boolean().default(true),
  isPrimaryKey: z.boolean().default(false),
  createdAt: z.coerce.date(),
});

export const DataEntitySchema = z.object({
  id: z.string(),
  dataModelVersionId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  fields: z.array(DataFieldSchema).optional(),
});

export const DataModelVersionSchema = z.object({
  id: z.string(),
  dataModelId: z.string(),
  version: z.number().int(),
  status: DataModelVersionStatusEnum,
  createdAt: z.coerce.date(),
  entities: z.array(DataEntitySchema).optional(),
});

export const DataModelSchema = z.object({
  id: z.string(),
  connectionId: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
  versions: z.array(DataModelVersionSchema).optional(),
});

export const CreateDataModelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  entities: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      fields: z.array(
        z.object({
          name: z.string(),
          dataType: DataTypeEnum.default('UNKNOWN'),
          isNullable: z.boolean().default(true),
          isPrimaryKey: z.boolean().default(false),
        })
      ).optional(),
    })
  ).optional(),
});

export const UpdateDataModelSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  entities: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      fields: z.array(
        z.object({
          name: z.string(),
          dataType: DataTypeEnum.default('UNKNOWN'),
          isNullable: z.boolean().default(true),
          isPrimaryKey: z.boolean().default(false),
        })
      ).optional(),
    })
  ).optional(),
});

export type DataField = z.infer<typeof DataFieldSchema>;
export type DataEntity = z.infer<typeof DataEntitySchema>;
export type DataModelVersion = z.infer<typeof DataModelVersionSchema>;
export type DataModel = z.infer<typeof DataModelSchema>;
export type CreateDataModelDto = z.infer<typeof CreateDataModelSchema>;
export type UpdateDataModelDto = z.infer<typeof UpdateDataModelSchema>;

export const DataProfileMetricSchema = z.object({
  id: z.string(),
  dataProfileRunId: z.string(),
  dataEntityId: z.string().nullable().optional(),
  dataFieldId: z.string().nullable().optional(),
  metricType: ProfileMetricTypeEnum,
  metricValue: z.any(),
  snapshotName: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
});

export const DataProfileRunSchema = z.object({
  id: z.string(),
  dataModelVersionId: z.string(),
  queuedAt: z.coerce.date(),
  startedAt: z.coerce.date().nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
  status: ProfileRunStatusEnum,
  createdAt: z.coerce.date(),
  metrics: z.array(DataProfileMetricSchema).optional(),
});

export const CreateDataProfileRunSchema = z.object({
  dataModelVersionId: z.string(),
});

export type DataProfileMetric = z.infer<typeof DataProfileMetricSchema>;
export type DataProfileRun = z.infer<typeof DataProfileRunSchema>;
export type CreateDataProfileRunDto = z.infer<typeof CreateDataProfileRunSchema>;

// ==========================================
// PHASE 3: CANONICAL MODELS & MAPPING ENGINE
// ==========================================

export const CanonicalModelVersionStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'SUPERSEDED']);
export const MappingDirectionEnum = z.enum(['SOURCE_TO_CANONICAL', 'CANONICAL_TO_TARGET']);
export const MappingVersionStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'SUPERSEDED']);
export const TransformTypeEnum = z.enum([
  'DIRECT',
  'CONSTANT',
  'LOOKUP',
  'CONDITIONAL',
  'EXPRESSION',
  'CUSTOM_TRANSFORM'
]);

export const CanonicalFieldSchema = z.object({
  id: z.string(),
  canonicalEntityId: z.string(),
  name: z.string(),
  dataType: DataTypeEnum.default('UNKNOWN'),
  isNullable: z.boolean().default(true),
  isPrimaryKey: z.boolean().default(false),
  createdAt: z.coerce.date(),
});

export const CanonicalEntitySchema = z.object({
  id: z.string(),
  canonicalModelVersionId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  fields: z.array(CanonicalFieldSchema).optional(),
});

export const CanonicalModelVersionSchema = z.object({
  id: z.string(),
  canonicalModelId: z.string(),
  version: z.number().int(),
  status: CanonicalModelVersionStatusEnum,
  definitionHash: z.string().nullable().optional(),
  publishedAt: z.coerce.date().nullable().optional(),
  publishedByUserId: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  entities: z.array(CanonicalEntitySchema).optional(),
});

export const CanonicalModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
  versions: z.array(CanonicalModelVersionSchema).optional(),
});

export const CreateCanonicalModelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  entities: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      fields: z.array(
        z.object({
          name: z.string(),
          dataType: DataTypeEnum.default('UNKNOWN'),
          isNullable: z.boolean().default(true),
          isPrimaryKey: z.boolean().default(false),
        })
      ).optional(),
    })
  ).optional(),
});

export const UpdateCanonicalModelSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  entities: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      fields: z.array(
        z.object({
          name: z.string(),
          dataType: DataTypeEnum.default('UNKNOWN'),
          isNullable: z.boolean().default(true),
          isPrimaryKey: z.boolean().default(false),
        })
      ).optional(),
    })
  ).optional(),
});

export type CanonicalField = z.infer<typeof CanonicalFieldSchema>;
export type CanonicalEntity = z.infer<typeof CanonicalEntitySchema>;
export type CanonicalModelVersion = z.infer<typeof CanonicalModelVersionSchema>;
export type CanonicalModel = z.infer<typeof CanonicalModelSchema>;
export type CreateCanonicalModelDto = z.infer<typeof CreateCanonicalModelSchema>;
export type UpdateCanonicalModelDto = z.infer<typeof UpdateCanonicalModelSchema>;

export const CreateFieldMappingSchema = z.object({
  sourceFieldId: z.string().optional(),
  canonicalFieldId: z.string().optional(),
  targetFieldId: z.string().optional(),
  transformType: TransformTypeEnum.default('DIRECT'),
  config: z.record(z.any()).default({}),
});

export const CreateEntityMappingSchema = z.object({
  sourceEntityId: z.string().optional(),
  canonicalEntityId: z.string().optional(),
  targetEntityId: z.string().optional(),
  fieldMappings: z.array(CreateFieldMappingSchema).optional(),
});

export const CreateMappingSetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  direction: MappingDirectionEnum,
  canonicalModelVersionId: z.string(),
  dataModelVersionId: z.string(),
  entityMappings: z.array(CreateEntityMappingSchema).optional(),
});

export const UpdateMappingDraftSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  entityMappings: z.array(CreateEntityMappingSchema).optional(),
});

export type CreateFieldMappingDto = z.infer<typeof CreateFieldMappingSchema>;
export type CreateEntityMappingDto = z.infer<typeof CreateEntityMappingSchema>;
export type CreateMappingSetDto = z.infer<typeof CreateMappingSetSchema>;
export type UpdateMappingDraftDto = z.infer<typeof UpdateMappingDraftSchema>;

// ==========================================
// PHASE 4: TRANSFORMATION, VALIDATION & EXECUTION
// ==========================================

export const TransformationVersionStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'SUPERSEDED']);
export const ValidationVersionStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'SUPERSEDED']);
export const RuleTypeEnum = z.enum(['NOT_NULL', 'REGEX', 'RANGE', 'TYPE_CHECK', 'ENUM_MATCH']);
export const SeverityEnum = z.enum(['ERROR', 'WARNING']);
export const PipelineJobStatusEnum = z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']);
export const ExecutionRunStatusEnum = z.enum(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']);

export const CreateFieldTransformationSchema = z.object({
  targetFieldIdentifier: z.string().min(1, 'Target field identifier is required'),
  transformType: TransformTypeEnum.default('DIRECT'),
  config: z.record(z.any()).default({}),
});

export const CreateTransformationSetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  fieldTransformations: z.array(CreateFieldTransformationSchema).optional(),
});

export const UpdateTransformationDraftSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  fieldTransformations: z.array(CreateFieldTransformationSchema).optional(),
});

export const CreateFieldValidationRuleSchema = z.object({
  targetFieldIdentifier: z.string().min(1, 'Target field identifier is required'),
  ruleType: RuleTypeEnum,
  ruleConfig: z.record(z.any()).default({}),
  severity: SeverityEnum.default('ERROR'),
});

export const CreateValidationSetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  rules: z.array(CreateFieldValidationRuleSchema).optional(),
});

export const UpdateValidationDraftSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  rules: z.array(CreateFieldValidationRuleSchema).optional(),
});

export const CreatePipelineJobSchema = z.object({
  environmentId: z.string(),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  mappingVersionId: z.string(),
  transformationVersionId: z.string(),
  validationVersionId: z.string(),
});

export const PreviewTransformSchema = z.object({
  mappingVersionId: z.string(),
  transformationVersionId: z.string(),
  validationVersionId: z.string(),
  sampleRecords: z.array(z.record(z.any())),
  lookupTables: z.record(z.record(z.any())).optional(),
});

export class CreateTransformationSetDto {
  name!: string;
  description?: string;
  fieldTransformations?: {
    targetFieldIdentifier: string;
    transformType: z.infer<typeof TransformTypeEnum>;
    config: Record<string, any>;
  }[];
}

export class UpdateTransformationDraftDto {
  name?: string;
  description?: string;
  fieldTransformations?: {
    targetFieldIdentifier: string;
    transformType: z.infer<typeof TransformTypeEnum>;
    config: Record<string, any>;
  }[];
}

export class CreateValidationSetDto {
  name!: string;
  description?: string;
  rules?: {
    targetFieldIdentifier: string;
    ruleType: z.infer<typeof RuleTypeEnum>;
    ruleConfig: Record<string, any>;
    severity?: z.infer<typeof SeverityEnum>;
  }[];
}

export class UpdateValidationDraftDto {
  name?: string;
  description?: string;
  rules?: {
    targetFieldIdentifier: string;
    ruleType: z.infer<typeof RuleTypeEnum>;
    ruleConfig: Record<string, any>;
    severity?: z.infer<typeof SeverityEnum>;
  }[];
}

export class CreatePipelineJobDto {
  environmentId!: string;
  name!: string;
  description?: string;
  mappingVersionId!: string;
  transformationVersionId!: string;
  validationVersionId!: string;
}

export class PreviewTransformDto {
  mappingVersionId!: string;
  transformationVersionId!: string;
  validationVersionId!: string;
  sampleRecords!: Record<string, any>[];
  lookupTables?: Record<string, Record<string, any>>;
}

export interface ValidationResult {
  field: string;
  rule: string;
  severity: 'ERROR' | 'WARNING';
  passed: boolean;
  actualValue: any;
  message: string;
  metadata?: Record<string, any>;
}

export interface ExecutionMetadata {
  jobId: string;
  runId?: string;
  workspaceId: string;
  environmentId: string;
  timestamp: Date;
}

export class TransformationContext {
  constructor(
    public readonly record: Record<string, any>,
    public readonly fieldName: string,
    public readonly value: any,
    public readonly sourceRecord: Record<string, any>,
    public readonly canonicalRecord: Record<string, any>,
    public readonly targetRecord: Record<string, any>,
    public readonly sourceSchemaContext: Record<string, any>,
    public readonly targetSchemaContext: Record<string, any>,
    public readonly lookupTables: Record<string, Record<string, any>>,
    public readonly metadata: ExecutionMetadata
  ) {}

  getValue(path: string): any {
    return this.record[path];
  }
}

// ---------------------------------------------------------
// PHASE 5: MIGRATION ENGINE, BATCHES & IDEMPOTENCY CONTRACTS
// ---------------------------------------------------------

export const MigrationJobStatusEnum = z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']);
export const MigrationConfigVersionStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'SUPERSEDED']);
export const MigrationRunStatusEnum = z.enum(['QUEUED', 'EXTRACTING', 'TRANSFORMING', 'LOADING', 'COMPLETED', 'FAILED', 'PAUSED', 'CANCELLED']);
export const BatchStatusEnum = z.enum(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED']);
export const RecordStatusEnum = z.enum(['EXTRACTED', 'TRANSFORMED', 'VALIDATED', 'LOADED', 'SKIPPED', 'FAILED']);
export const LoadOperationEnum = z.enum(['NONE', 'INSERT', 'UPDATE', 'UPSERT']);
export const LoadStrategyEnum = z.enum(['INSERT', 'UPDATE', 'UPSERT']);
export type LoadStrategy = z.infer<typeof LoadStrategyEnum>;
export const ErrorCategoryEnum = z.enum(['TRANSIENT', 'RATE_LIMIT', 'CONNECTIVITY', 'AUTHENTICATION', 'VALIDATION', 'MAPPING', 'TARGET_BUSINESS_RULE', 'PERMANENT']);

export const CreateMigrationJobSchema = z.object({
  environmentId: z.string().min(1, 'Environment ID is required'),
  name: z.string().min(1, 'Migration job name is required'),
  description: z.string().optional(),
});

export class CreateMigrationJobDto {
  environmentId!: string;
  name!: string;
  description?: string;
}

export const CreateMigrationConfigVersionSchema = z.object({
  sourceConnectionId: z.string().min(1, 'Source connection ID is required'),
  targetConnectionId: z.string().min(1, 'Target connection ID is required'),
  sourceDataModelVersionId: z.string().min(1, 'Source data model version ID is required'),
  targetDataModelVersionId: z.string().min(1, 'Target data model version ID is required'),
  mappingVersionId: z.string().min(1, 'Mapping version ID is required'),
  transformationVersionId: z.string().min(1, 'Transformation version ID is required'),
  validationVersionId: z.string().min(1, 'Validation version ID is required'),
});

export class CreateMigrationConfigVersionDto {
  sourceConnectionId!: string;
  targetConnectionId!: string;
  sourceDataModelVersionId!: string;
  targetDataModelVersionId!: string;
  mappingVersionId!: string;
  transformationVersionId!: string;
  validationVersionId!: string;
}

export const TriggerMigrationRunSchema = z.object({
  sourceEntityIdentifier: z.string().default('default_source_entity'),
  targetEntityIdentifier: z.string().default('default_target_entity'),
  batchSize: z.number().int().positive().default(1000),
  loadStrategy: LoadStrategyEnum.default('UPSERT'),
  samplePayloads: z.array(z.record(z.any())).optional(),
});

export class TriggerMigrationRunDto {
  sourceEntityIdentifier?: string;
  targetEntityIdentifier?: string;
  batchSize?: number;
  loadStrategy?: z.infer<typeof LoadStrategyEnum>;
  samplePayloads?: Record<string, any>[];
}

export const RetryMigrationRunSchema = z.object({
  errorCategories: z.array(ErrorCategoryEnum).optional(),
});

export class RetryMigrationRunDto {
  errorCategories?: z.infer<typeof ErrorCategoryEnum>[];
}

export const ResumeMigrationRunSchema = z.object({
  batchSize: z.number().int().positive().optional(),
});

export class ResumeMigrationRunDto {
  batchSize?: number;
}

// ---------------------------------------------------------
// PHASE 6: RECONCILIATION & ERROR MANAGEMENT CONTRACTS
// ---------------------------------------------------------

export const ReconciliationModeEnum = z.enum(['FULL', 'INCREMENTAL', 'SAMPLED']);
export const ReconciliationConfigVersionStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'SUPERSEDED']);
export const ReconciliationRunStatusEnum = z.enum(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export const DiscrepancyTypeEnum = z.enum(['MISSING_IN_TARGET', 'ORPHAN_IN_TARGET', 'ATTRIBUTE_MISMATCH', 'RECORD_COUNT_MISMATCH', 'AGGREGATE_SUM_MISMATCH']);
export const DiscrepancyStatusEnum = z.enum(['OPEN', 'RESOLVED', 'IGNORED']);
export const ObservationStateEnum = z.enum(['NEW', 'PERSISTED', 'RESOLVED']);
export const ErrorResolutionStatusEnum = z.enum(['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED_REPLAYED', 'RESOLVED_MANUAL_OVERRIDE', 'IGNORED']);
export const ErrorResolutionActionEnum = z.enum(['INVESTIGATE', 'ASSIGN', 'MANUAL_OVERRIDE', 'REPLAY', 'IGNORE']);

export const CreateReconciliationJobSchema = z.object({
  environmentId: z.string().min(1, 'Environment ID is required'),
  name: z.string().min(1, 'Reconciliation job name is required'),
  description: z.string().optional(),
});

export class CreateReconciliationJobDto {
  environmentId!: string;
  name!: string;
  description?: string;
}

export const CreateReconciliationConfigVersionSchema = z.object({
  sourceConnectionId: z.string().min(1, 'Source connection ID is required'),
  targetConnectionId: z.string().min(1, 'Target connection ID is required'),
  sourceDataModelVersionId: z.string().min(1, 'Source data model version ID is required'),
  targetDataModelVersionId: z.string().min(1, 'Target data model version ID is required'),
  sourceEntityIdentifier: z.string().default('default_source_entity'),
  targetEntityIdentifier: z.string().default('default_target_entity'),
  identityMapping: z.record(z.string()).default({}), // e.g. { legacy_customer_no: 'bc_customer_code' }
  comparisonFields: z.array(z.record(z.any())).default([]),
  aggregateFields: z.array(z.record(z.any())).default([]),
  mode: ReconciliationModeEnum.default('FULL'),
  samplingConfig: z.record(z.any()).default({}),
  watermarkConfig: z.record(z.any()).default({}),
});

export class CreateReconciliationConfigVersionDto {
  sourceConnectionId!: string;
  targetConnectionId!: string;
  sourceDataModelVersionId!: string;
  targetDataModelVersionId!: string;
  sourceEntityIdentifier?: string;
  targetEntityIdentifier?: string;
  identityMapping?: Record<string, string>;
  comparisonFields?: Record<string, any>[];
  aggregateFields?: Record<string, any>[];
  mode?: z.infer<typeof ReconciliationModeEnum>;
  samplingConfig?: Record<string, any>;
  watermarkConfig?: Record<string, any>;
}

export const TriggerReconciliationRunSchema = z.object({
  migrationRunId: z.string().optional(),
  batchSize: z.number().int().positive().default(500),
  sampleSourceRecords: z.array(z.record(z.any())).optional(),
  sampleTargetRecords: z.array(z.record(z.any())).optional(),
});

export class TriggerReconciliationRunDto {
  migrationRunId?: string;
  batchSize?: number;
  sampleSourceRecords?: Record<string, any>[];
  sampleTargetRecords?: Record<string, any>[];
}

export const UpdateErrorStatusSchema = z.object({
  status: ErrorResolutionStatusEnum,
  assignedToUserId: z.string().optional(),
  details: z.record(z.any()).optional(),
});

export class UpdateErrorStatusDto {
  status!: z.infer<typeof ErrorResolutionStatusEnum>;
  assignedToUserId?: string;
  details?: Record<string, any>;
}

export const ResolveErrorOverrideSchema = z.object({
  overridePayload: z.record(z.any()),
  overrideReason: z.string().min(1, 'Reason is required'),
});

export class ResolveErrorOverrideDto {
  overridePayload!: Record<string, any>;
  overrideReason!: string;
}

export const ResolveErrorReplaySchema = z.object({
  overridePayload: z.record(z.any()).optional(),
  overrideReason: z.string().optional(),
});

export class ResolveErrorReplayDto {
  overridePayload?: Record<string, any>;
  overrideReason?: string;
}

export const BulkResolveErrorsSchema = z.object({
  recordErrorIds: z.array(z.string()).min(1, 'At least one RecordError ID is required'),
  action: ErrorResolutionActionEnum,
  overrideReason: z.string().optional(),
});

export class BulkResolveErrorsDto {
  recordErrorIds!: string[];
  action!: z.infer<typeof ErrorResolutionActionEnum>;
  overrideReason?: string;
}

// ---------------------------------------------------------
// PHASE 7: AI AGENTS & AUTONOMOUS SKILLS INTEGRATION CONTRACTS
// ---------------------------------------------------------

export const AiAgentTypeEnum = z.enum(['MAPPING_SUGGESTION', 'SCHEMA_DRIFT_REPAIR', 'ANOMALY_DETECTION', 'NATURAL_LANGUAGE_QUERY']);
export const AiTaskStatusEnum = z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']);
export const AiSuggestionStatusEnum = z.enum(['PROPOSED', 'NO_RECOMMENDATION', 'ACCEPTED', 'REJECTED', 'SUPERSEDED', 'STALE']);
export const DriftCategoryEnum = z.enum(['ADDED_FIELD', 'REMOVED_FIELD', 'RENAME_CANDIDATE', 'TYPE_MUTATION', 'NULLABILITY_CHANGE', 'ENTITY_REMOVED']);
export const DriftSeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const AnomalyTypeEnum = z.enum(['NUMERIC_OUTLIER', 'PATTERN_MUTATION', 'NULL_SPIKE', 'TIMEZONE_OFFSET', 'CURRENCY_CONVERSION', 'TRUNCATION_RISK', 'INSUFFICIENT_BASELINE']);

// Entity-Specific Allowlisted Filter Schemas for Controlled Query Plans
export const MigrationRunFilterSchema = z.object({
  status: z.string().optional(),
  loadStrategy: z.string().optional(),
  migrationJobId: z.string().optional(),
});

export const RecordErrorFilterSchema = z.object({
  errorCategory: z.string().optional(),
  resolutionStatus: z.string().optional(),
  migrationRunId: z.string().optional(),
});

export const ReconciliationDiscrepancyFilterSchema = z.object({
  discrepancyType: z.string().optional(),
  status: z.string().optional(),
  fieldIdentifier: z.string().optional(),
});

export const MappingSetFilterSchema = z.object({
  direction: z.string().optional(),
  name: z.string().optional(),
});

export const DataModelFilterSchema = z.object({
  connectionId: z.string().optional(),
  name: z.string().optional(),
});

export const StructuredQueryPlanSchema = z.object({
  targetEntity: z.enum(['MIGRATION_RUN', 'RECONCILIATION_DISCREPANCY', 'RECORD_ERROR', 'MAPPING_SET', 'DATA_MODEL']),
  action: z.enum(['FIND_MANY', 'COUNT', 'AGGREGATE']),
  filters: z.union([
    MigrationRunFilterSchema,
    RecordErrorFilterSchema,
    ReconciliationDiscrepancyFilterSchema,
    MappingSetFilterSchema,
    DataModelFilterSchema,
    z.object({}),
  ]).default({}),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const TriggerAiMappingSuggestionSchema = z.object({
  environmentId: z.string().min(1, 'Environment ID is required'),
  sourceDataModelVersionId: z.string().optional(),
  targetDataModelVersionId: z.string().optional(),
  canonicalModelVersionId: z.string().optional(),
  mappingVersionId: z.string().optional(),
  profileRunId: z.string().optional(),
  sourceFields: z.array(z.object({
    name: z.string(),
    type: z.string(),
    nullable: z.boolean().default(true),
    sampleValues: z.array(z.string()).optional(),
  })).optional(),
  targetFields: z.array(z.object({
    name: z.string(),
    type: z.string(),
    nullable: z.boolean().default(true),
  })).optional(),
  confidenceThreshold: z.number().min(0).max(1).default(0.70),
});

export class TriggerAiMappingSuggestionDto {
  environmentId!: string;
  sourceDataModelVersionId?: string;
  targetDataModelVersionId?: string;
  canonicalModelVersionId?: string;
  mappingVersionId?: string;
  profileRunId?: string;
  sourceFields?: { name: string; type: string; nullable?: boolean; sampleValues?: string[] }[];
  targetFields?: { name: string; type: string; nullable?: boolean }[];
  confidenceThreshold?: number;
}

export const TriggerAiDriftRepairSchema = z.object({
  environmentId: z.string().min(1, 'Environment ID is required'),
  baselineModelVersionId: z.string().min(1, 'Baseline model version ID is required'),
  targetModelVersionId: z.string().min(1, 'Target model version ID is required'),
});

export class TriggerAiDriftRepairDto {
  environmentId!: string;
  baselineModelVersionId!: string;
  targetModelVersionId!: string;
}

export const TriggerAiAnomalyAnalysisSchema = z.object({
  environmentId: z.string().min(1, 'Environment ID is required'),
  reconciliationDiscrepancyId: z.string().optional(),
  dataProfileRunId: z.string().optional(),
  numericValues: z.array(z.number()).optional(),
});

export class TriggerAiAnomalyAnalysisDto {
  environmentId!: string;
  reconciliationDiscrepancyId?: string;
  dataProfileRunId?: string;
  numericValues?: number[];
}

export const ExecuteNaturalLanguageQuerySchema = z.object({
  environmentId: z.string().min(1, 'Environment ID is required'),
  prompt: z.string().min(1, 'Natural language prompt is required'),
  sessionId: z.string().optional(),
});

export class ExecuteNaturalLanguageQueryDto {
  environmentId!: string;
  prompt!: string;
  sessionId?: string;
}

export const AcceptAiSuggestionSchema = z.object({
  mappingSetId: z.string().optional(),
});

export class AcceptAiSuggestionDto {
  mappingSetId?: string;
}

export const RejectAiSuggestionSchema = z.object({
  rejectionReason: z.string().optional(),
});

export class RejectAiSuggestionDto {
  rejectionReason?: string;
}

// ---------------------------------------------------------
// PHASE 8: OBSERVABILITY, AUDIT & WORKER CLUSTER CONTRACTS
// ---------------------------------------------------------

export const WorkerStatusEnum = z.enum(['ACTIVE', 'IDLE', 'LEASE_EXPIRED', 'DRAINING', 'STOPPED']);
export const AuditActionEnum = z.enum(['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'EXECUTE', 'OVERRIDE', 'REPLAY', 'ACCEPT_SUGGESTION', 'REJECT_SUGGESTION']);

export const AuditLogQuerySchema = z.object({
  action: AuditActionEnum.optional(),
  resourceType: z.string().optional(),
  traceId: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export class AuditLogQueryDto {
  action?: z.infer<typeof AuditActionEnum>;
  resourceType?: string;
  traceId?: string;
  limit?: number;
  offset?: number;
}

export const RegisterWorkerHeartbeatSchema = z.object({
  workerId: z.string().min(1, 'Worker ID is required'),
  hostname: z.string().min(1, 'Hostname is required'),
  ipAddress: z.string().optional(),
  status: WorkerStatusEnum.default('ACTIVE'),
  activeLeaseCount: z.number().int().min(0).default(0),
});

export class RegisterWorkerHeartbeatDto {
  workerId!: string;
  hostname!: string;
  ipAddress?: string;
  status?: z.infer<typeof WorkerStatusEnum>;
  activeLeaseCount?: number;
}



