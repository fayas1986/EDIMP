export type UserRole =
  | 'Admin'
  | 'Data Analyst'
  | 'Super Admin'
  | 'Partner Admin'
  | 'Super Administrator'
  | 'Platform Administrator'
  | 'Partner Administrator'
  | 'Customer Administrator'
  | 'Project Manager'
  | 'Migration Consultant'
  | 'Data Engineer'
  | 'Functional Consultant'
  | 'Auditor'
  | 'Business User'
  | 'Read Only';

export type SystemType = 'Source' | 'Destination' | 'Both';

export type ConnectorCategory = 'ERP' | 'CRM' | 'Database' | 'Files' | 'Cloud Storage' | 'Custom API' | 'HRMS/Accounting';

export type ConnectorStatus = 'Connected' | 'Disconnected' | 'Error' | 'Testing';

export interface BenchmarkScenario {
  id: string;
  name: string;
  type: 'Light Baseline' | 'Medium Peak' | 'Heavy Migration Stress' | 'Custom Load';
  concurrency: number;
  targetRps: number;
  batchSizeRecords: number;
  payloadSizeKb: number;
  durationSeconds: number;
}

export interface ConnectorBenchmarkResult {
  id: string;
  connectorId: string;
  connectorName: string;
  scenarioName: string;
  timestamp: string;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  achievedRps: number;
  achievedThroughputRecordsSec: number;
  dataThroughputMbSec: number;
  successRatePercent: number;
  throttling429Count: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'F';
}

export interface ThrottlingConfig {
  isEnabled: boolean;
  maxRequestsPerSecond: number; // e.g. 50 req/sec
  maxConcurrentRequests: number; // e.g. 10
  retryStrategy: 'ExponentialBackoff' | 'Linear' | 'ImmediateRetry';
  maxRetries: number;
  burstLimit?: number;
  autoCooldownOn429: boolean;
  cooldownPeriodSeconds?: number;
}

export interface Connector {
  id: string;
  name: string;
  category: ConnectorCategory;
  systemType: SystemType;
  provider: string; // e.g. "Business Central", "SQL Server", "Excel", "SAP S/4HANA"
  status: ConnectorStatus;
  authType: 'OAuth 2.0' | 'API Key' | 'SQL Auth' | 'Service Principal' | 'Basic' | 'None';
  latencyMs?: number;
  icon: string;
  hostUrl?: string;
  dbName?: string;
  tenantId?: string;
  lastTested?: string;
  throttlingConfig?: ThrottlingConfig;
  isTransferring?: boolean;
  transferRateKbps?: number;
  activeJobName?: string;
  isAutoDiscovered?: boolean;
  discoveryTimestamp?: string;
  dataProfile?: ConnectorDataProfile;
  failurePrediction?: ConnectorFailurePrediction;
}

export interface ConnectorLatencyHistoricalPoint {
  timestamp: string; // e.g. "08:00 AM", "09:00 AM"
  fullTimeLabel: string;
  isoTimestamp: string;
  latencyMs: number;
  baselineLatencyMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  jitterMs: number;
  errorRatePct: number;
  throttling429Count: number;
  isSpike: boolean;
  spikeMagnitudePct: number;
  activeSockets: number;
  throughputRps: number;
  spikeSeverity?: 'Critical' | 'Warning' | 'None';
  triggerReason?: string;
  consecutiveSpikes?: number;
}

export interface LatencyForecastPoint {
  timestamp: string; // e.g. "+1h (12:00 PM)", "+2h (01:00 PM)"
  predictedLatencyMs: number;
  upperConfidenceMs: number;
  lowerConfidenceMs: number;
  failureThresholdMs: number;
  predictedErrorRatePct: number;
  isBreachExpected: boolean;
}

export interface SpikeRootCause {
  id: string;
  factor: string;
  severity: 'Critical' | 'Warning' | 'Info';
  metricValue: string;
  impactSummary: string;
  recommendedAction: string;
}

export interface ProactiveMitigationAction {
  id: string;
  title: string;
  actionType: 'AUTO_RATE_LIMIT' | 'INCREASE_POOL' | 'ENABLE_COMPRESSION' | 'FAILOVER_REPLICA' | 'SOCKET_RECYCLE';
  estimatedRiskReductionPct: number;
  description: string;
  isApplied: boolean;
  appliedAt?: string;
}

export interface ConnectorFailurePrediction {
  connectorId: string;
  connectorName: string;
  calculatedAt: string;
  riskScore: number; // 0 - 100
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Nominal';
  predictedFailureWindow: string; // e.g. "~25 - 45 mins", "Within 2h", "Nominal (>48h)"
  failureProbability: number; // percentage (e.g. 88.5)
  primaryRiskFactor: string;
  baselineLatencyMs: number;
  currentLatencyMs: number;
  p99LatencyMs: number;
  spikeVelocityMsPerHour: number; // rate of latency acceleration
  jitterMs: number;
  consecutiveSpikeCount: number;
  timeSeriesTrends: ConnectorLatencyHistoricalPoint[];
  forecastPoints: LatencyForecastPoint[];
  rootCauses: SpikeRootCause[];
  recommendedMitigations: ProactiveMitigationAction[];
  spikeFrequencyLast24h: number;
  meanTimeToRecoveryEstimateMin: number;
  healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  isMitigated?: boolean;
}

export interface DataTypeDistribution {
  type: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface EntityProfileSummary {
  entityName: string;
  entityType?: string;
  rowCount: number;
  columnCount: number;
  totalNullValues: number;
  nullPercentage: number;
  completenessPercentage: number;
  estimatedSizeBytes?: number;
  lastProfiledAt: string;
  dataTypeDistribution: DataTypeDistribution[];
  columns: ColumnProfile[];
}

export interface FieldCorrelationCell {
  sourceField: string;
  targetField: string;
  sourceType: string;
  targetType: string;
  coefficient: number; // -1.0 to 1.0 (or 0.0 to 1.0 for Cramer's V)
  absCoefficient: number;
  pVal: number;
  sampleSize: number;
  strength: 'Very Strong' | 'Strong' | 'Moderate' | 'Weak' | 'None' | 'Inverse Strong' | 'Inverse Moderate';
  metricMethod: 'Pearson (Numeric)' | 'Cramér’s V (Categorical)' | 'Correlation Ratio (η)' | 'Functional Dependency';
  relationshipCategory: 'Direct Positive' | 'Inverse Negative' | 'Categorical Association' | 'Orthogonal / Independent';
  significance: 'High (p<0.001)' | 'Moderate (p<0.05)' | 'Low / Insignificant';
  description: string;
  coOccurrencePct?: number;
  scatterPreview?: Array<{ x: number | string; y: number | string; label?: string }>;
}

export interface MultivariateDependency {
  targetField: string;
  dependentOn: string[];
  rSquared: number;
  explanation: string;
  riskFactor: 'Low' | 'Medium' | 'High';
}

export interface EntityCorrelationMatrix {
  entityName: string;
  fields: string[];
  fieldTypes: Record<string, string>;
  correlations: FieldCorrelationCell[];
  calculatedAt: string;
  strongestCorrelations: FieldCorrelationCell[];
  multivariateDependencies: MultivariateDependency[];
}

export interface ProfilingHistoricalDataPoint {
  date: string; // e.g. "Jul 16", "Aug 14"
  fullDate: string; // e.g. "2026-07-16"
  timestamp: string;
  rowCount: number;
  rowGrowthDelta: number;
  nullCount: number;
  nullPercentage: number;
  completenessPercentage: number;
  dataQualityScore: number;
  anomaliesCount: number;
  // Data type column breakdowns for stacked charts
  stringColumns: number;
  decimalColumns: number;
  integerColumns: number;
  dateTimeColumns: number;
  booleanColumns: number;
  otherColumns: number;
  dataTypeDistribution: DataTypeDistribution[];
}

export interface ConnectorDataProfile {
  connectorId: string;
  connectorName: string;
  profiledAt: string;
  status: 'Profiling' | 'Completed' | 'Failed';
  totalEntities: number;
  totalRowCount: number;
  totalColumns: number;
  totalNullValues: number;
  totalPopulatedValues: number;
  overallNullPercentage: number;
  overallCompletenessPercentage: number;
  dataTypeDistribution: DataTypeDistribution[];
  entityProfiles: EntityProfileSummary[];
  anomaliesDetectedCount: number;
  dataQualityScore: number;
  profilingDurationMs: number;
  sampleRowsPreview?: Record<string, any>[];
  historicalTrends?: ProfilingHistoricalDataPoint[];
  correlationMatrices?: EntityCorrelationMatrix[];
}

export interface DiscoveryLogEntry {
  id: string;
  timestamp: string;
  isoTimestamp: string;
  connectorId?: string;
  connectorName?: string;
  category?: string;
  subnet?: string;
  eventType: 'SUBNET_PROBE' | 'OAUTH_VERIFIED' | 'CONNECTOR_DISCOVERED' | 'ODATA_INDEXED' | 'VAULT_CREDENTIALS_SYNCED' | 'SYSTEM_INITIALIZED';
  status: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  details?: {
    latencyMs?: number;
    authType?: string;
    hostUrl?: string;
    discoveredEntitiesCount?: number;
    entitiesList?: string[];
    securityStandard?: string;
    ipAddress?: string;
    protocol?: string;
  };
}

export interface FieldSchema {
  fieldName: string;
  dataType: 'String' | 'Integer' | 'Decimal' | 'Boolean' | 'Date' | 'DateTime' | 'Enum' | 'JSON';
  isNullable: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  sampleValue?: string;
  description?: string;
  maxLength?: number;
}

export interface DataObject {
  id: string;
  connectorId: string;
  name: string; // e.g. "Customer", "tbl_Customers", "Item Ledger"
  type: 'Table' | 'View' | 'Sheet' | 'API Object' | 'Collection';
  recordCount: number;
  fields: FieldSchema[];
  qualityScore?: number;
}

export type AnonymizationTechnique =
  | 'PartialMask'
  | 'SHA256_Salted'
  | 'HMAC_Tokenization'
  | 'FormatPreservingToken'
  | 'SyntheticData'
  | 'Nullification'
  | 'GeneralizationBucket'
  | 'DifferentialPrivacyNoise';

export type PIICategory =
  | 'SSN/Tax'
  | 'CreditCard'
  | 'Email'
  | 'Phone'
  | 'Address'
  | 'PersonalName'
  | 'Financial'
  | 'Health'
  | 'GeneralPII';

export interface AnonymizationRule {
  id: string;
  entityName: string;
  fieldName: string;
  piiCategory: PIICategory;
  technique: AnonymizationTechnique;
  maskChar?: string;
  preserveLength?: boolean;
  preserveFormat?: boolean;
  saltKey?: string;
  syntheticGeneratorType?:
    | 'FakerName'
    | 'FakerEmail'
    | 'FakerSSN'
    | 'FakerPhone'
    | 'FakerAddress'
    | 'FakerCreditCard'
    | 'FakerIBAN'
    | 'NumericPerturbation';
  bucketRange?: string;
  complianceTags: ('GDPR' | 'HIPAA' | 'CCPA' | 'PCI-DSS')[];
  isActive: boolean;
  connectorId?: string;
  connectorName?: string;
  targetProvider?: string;
}

export interface AnonymizationAuditLogEntry {
  id: string;
  timestamp: string;
  connectorId: string;
  connectorName: string;
  targetProvider: string;
  entityName: string;
  recordId: string;
  fieldName: string;
  originalValue: string;
  anonymizedValue: string;
  technique: string;
  piiCategory: PIICategory;
  status: 'Success' | 'Flagged' | 'Bypassed';
  executionTimeMs: number;
  complianceTags: ('GDPR' | 'HIPAA' | 'CCPA' | 'PCI-DSS')[];
  saltOrMaskDetail?: string;
}

export type MaskingRuleType = 'None' | 'FullRedact' | 'HashSHA256' | 'PartialMask' | 'Truncate' | 'Tokenize' | 'RandomNoise';

export interface MaskingConfig {
  isEnabled: boolean;
  ruleType: MaskingRuleType;
  customMaskChar?: string;
  visibleCharacters?: number;
  maskPosition?: 'FirstN' | 'LastN' | 'EmailDomainPreserve';
  piiCategory?: 'SSN/Tax' | 'CreditCard' | 'Email' | 'Phone' | 'Address' | 'PersonalName' | 'GeneralPII';
}

export interface MappingRule {
  id: string;
  sourceField: string;
  targetField: string;
  confidence: number; // 0 to 1
  transformation: 'None' | 'Trim' | 'Uppercase' | 'Lowercase' | 'CurrencyConvert' | 'DateFormat' | 'RegexReplace' | 'CustomExpression';
  transformationCode?: string;
  isRequired?: boolean;
  reasoning?: string;
  maskingConfig?: MaskingConfig;
}

export interface ValidationRule {
  id: string;
  fieldName: string;
  ruleType: 'Mandatory' | 'DataType' | 'Email' | 'Phone' | 'Regex' | 'ForeignKey' | 'Unique' | 'TaxID';
  severity: 'Error' | 'Warning';
  message: string;
  parameters?: string;
}

export interface CleansingRule {
  id: string;
  fieldName: string;
  action: 'Trim' | 'Uppercase' | 'Lowercase' | 'StripSpecial' | 'DefaultValue' | 'NormalizeCountry' | 'FormatPhone';
  defaultValue?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'Fixed' | 'Linear' | 'Exponential' | 'ExponentialWithJitter';
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
  dlqAction: 'QuarantineToDLQ' | 'PauseJob' | 'IgnoreAndContinue';
  dlqThresholdPct: number;
  retryableErrors: {
    transientNetwork: boolean;
    rateLimits: boolean;
    timeout: boolean;
    databaseDeadlocks: boolean;
    schemaValidation: boolean;
  };
}

export interface MigrationJob {
  id: string;
  jobName: string;
  sourceConnectorId: string;
  sourceConnectorName: string;
  sourceEntity: string;
  destConnectorId: string;
  destConnectorName: string;
  destEntity: string;
  mode: 'Full' | 'Incremental' | 'Delta' | 'RealTime';
  status: 'Idle' | 'Running' | 'Completed' | 'Failed' | 'Paused' | 'DryRun' | 'Rolled Back';
  progressPct: number;
  totalRecords: number;
  processedRecords: number;
  errorCount: number;
  warningCount: number;
  throughputRps: number;
  startTime?: string;
  endTime?: string;
  cronSchedule?: string;
  recurringInterval?: 'One-time' | 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom Cron';
  dependsOnJobIds?: string[];
  scheduleType?: 'Manual' | 'Scheduled' | 'DependencyTrigger';
  scheduledTimeWindow?: string;
  timezone?: string;
  lastRunStatus?: 'Success' | 'Failed' | 'Warning';
  retryPolicy?: RetryPolicy;
  batchProcessingEnabled?: boolean;
  batchSize?: number;
  isRolledBack?: boolean;
}

export type ErrorCategory = 'Network' | 'Auth' | 'Data Mapping' | 'Schema' | 'Database' | 'Validation';

export interface ErrorRecord {
  id: string;
  jobId: string;
  recordRowNumber?: number;
  rowNumber?: number;
  entityName?: string;
  pipelineName?: string;
  sourceConnector?: string;
  destinationConnector?: string;
  timestamp?: string;
  fieldName: string;
  rawValue: string;
  errorCode: string;
  errorMessage: string;
  severity: 'Critical' | 'Error' | 'Warning' | 'Info' | 'Healthy';
  status: 'Open' | 'Unresolved' | 'Acknowledged' | 'Resolved' | 'Ignored';
  category?: ErrorCategory;
  isFlagged?: boolean;
  patternGroup?: string;
  sourceRecordData?: Record<string, any>;
  recordData?: Record<string, any>;
  stackTrace?: string;
  impactScore?: number;
  affectedRecords?: number;
  assignedTo?: string;
  tags?: string[];
  aiExplanation?: {
    rootCause: string;
    impact: string;
    remediationSteps: string[];
  };
}

export type ErrorLog = ErrorRecord;


// Interface for Pattern Cluster
export interface PatternCluster {
  id: string;
  patternTitle: string;
  ruleCategory: 'Transient Noise' | 'Validation Anomaly' | 'Formatting Typo' | 'Reference Failure' | 'Constraint Collision';
  heuristicReason: string;
  confidenceScore: number; // Percentage
  suggestedAction: 'Bulk Ignore' | 'Bulk Flag' | 'Bulk Auto-Resolve';
  sampleStackTrace?: string;
  matchedErrors: ErrorLog[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  status: 'Success' | 'Warning' | 'Failed';
  details: string;
  ipAddress: string;
}

export interface PrdChapter {
  id: string;
  chapterNumber: number;
  title: string;
  category: string;
  summary: string;
  contentMarkdown: string;
  mermaidDiagram?: string;
}

export interface HistoricalPartition {
  id: string;
  yearRange: string; // e.g., "2004 - 2008"
  tier: 'Cold Archive' | 'Warm Tier' | 'Hot Delta' | 'RealTime CDC';
  recordCountBillions: number; // e.g. 3.8
  dataVolumeTB: number; // e.g. 12.4
  shardsCount: number; // e.g. 32
  status: 'Migrated' | 'In Progress' | 'Queued' | 'Verifying';
  throughputGbps: number;
  workerNodesAssigned: number;
}

export interface DistributedClusterState {
  clusterName: string;
  totalWorkerNodes: number;
  activeNodes: number;
  totalDataVolumeTB: number;
  migratedDataTB: number;
  totalBillionsRecords: number;
  processedBillionsRecords: number;
  clusterThroughputGbps: number;
  historicalYearsCovered: string; // e.g. "2004 - 2026 (22 Years)"
  partitioningStrategy: 'Date Partition + Hash Sharding' | 'Range Partitioning' | 'CDC Delta Streaming';
  storageEngine: 'Apache Iceberg / Delta Lake' | 'PostgreSQL Multi-Node Shard' | 'BigQuery Enterprise Lake';
}

export interface ColumnProfile {
  columnName: string;
  dataType: string;
  totalCount: number;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  uniquenessPercentage: number;
  sampleValues: string[];
  hasAnomalies: boolean;
  anomalyDescription?: string;
}

export interface JobLiveLog {
  id: string;
  jobId: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'TRACE';
  node: string;
  module: string;
  message: string;
  details?: Record<string, any>;
}

export interface DataDictionaryField {
  id: string;
  fieldName: string;
  physicalColumn: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignTable?: string;
  piiSensitivity: 'Public' | 'Internal' | 'Confidential' | 'PII/Sensitive';
  description: string;
  validationRule?: string;
  exampleValue?: string;
}

export interface DataDictionaryVersion {
  version: string;
  releasedAt: string;
  author: string;
  changesDescription: string;
  fieldCount: number;
}

export interface DataDictionaryEntity {
  id: string;
  entityName: string;
  system: string;
  category: 'Master Data' | 'Transactional Data' | 'Configuration' | 'Analytics';
  version: string;
  versionHistory: DataDictionaryVersion[];
  description: string;
  aiSummary?: string;
  governance?: {
    classification: string;
    piiRisk: string;
    complianceScope: string[];
    ownerDepartment: string;
  };
  fields: DataDictionaryField[];
  tags: string[];
  lastUpdated: string;
}

export type ExportFormat = 'Parquet (Snappy)' | 'Parquet (ZSTD)' | 'CSV (Gstandard)' | 'CSV (Zip Compressed)';
export type StorageDestinationType = 'AWS S3' | 'Google Cloud Storage' | 'Azure Blob Storage' | 'SFTP Server' | 'Local Download';

export interface ExportRetryPolicy {
  maxAttempts: number;
  backoffDurationMinutes: number;
  backoffStrategy: 'Fixed' | 'Linear' | 'Exponential' | 'ExponentialWithJitter';
  retryOnTimeout: boolean;
  retryOnNetworkError: boolean;
  retryOnStorageQuota: boolean;
  retryOnSchemaMismatch?: boolean;
}

export interface ExportConfigSnapshot {
  name: string;
  targetEntities: string[];
  exportScopeType?: 'Specific Data Sets' | 'Migration Outputs' | 'Hybrid Combined';
  exportDeltaMode?: 'Full Snapshot' | 'Incremental Delta (24h)' | 'Since Last Export' | 'Modified Records Only';
  format: ExportFormat;
  destinationType: StorageDestinationType;
  destinationUri: string;
  scheduleFrequency: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom Cron';
  cronExpression?: string;
  runTimeUtc?: string;
  dayOfWeek?: string;
  partitioning: 'Year/Month/Day' | 'System/Entity' | 'Flat Single File';
  compressionLevel: 'High' | 'Standard' | 'Uncompressed';
  maxRetentionDays: number;
  encryptionMethod?: 'AES-256 KMS' | 'PGP Key' | 'Standard TLS' | 'None';
  minQualityThreshold?: number;
  notificationWebhook?: string;
  notificationEmails?: string[];
  retryPolicy?: ExportRetryPolicy;
}

export interface ExportScheduleVersion {
  versionNumber: number;
  versionLabel: string;
  createdAt: string;
  createdBy: string;
  changeSummary: string;
  configSnapshot: ExportConfigSnapshot;
}

export interface ExportSchedule {
  id: string;
  name: string;
  targetEntities: string[];
  exportScopeType?: 'Specific Data Sets' | 'Migration Outputs' | 'Hybrid Combined';
  exportDeltaMode?: 'Full Snapshot' | 'Incremental Delta (24h)' | 'Since Last Export' | 'Modified Records Only';
  format: ExportFormat;
  destinationType: StorageDestinationType;
  destinationUri: string;
  scheduleFrequency: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom Cron';
  cronExpression?: string;
  runTimeUtc?: string;
  dayOfWeek?: string;
  nextRunAt: string;
  status: 'Active' | 'Paused' | 'Executing' | 'Failed';
  partitioning: 'Year/Month/Day' | 'System/Entity' | 'Flat Single File';
  compressionLevel: 'High' | 'Standard' | 'Uncompressed';
  maxRetentionDays: number;
  encryptionMethod?: 'AES-256 KMS' | 'PGP Key' | 'Standard TLS' | 'None';
  minQualityThreshold?: number;
  notificationWebhook?: string;
  notificationEmails?: string[];
  lastExecutedAt?: string;
  lastSnapshotSizeMb?: number;
  lastRowCount?: number;
  currentVersion?: number;
  versions?: ExportScheduleVersion[];
  retryPolicy?: ExportRetryPolicy;
}

export interface SchemaFieldDefinition {
  fieldName: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  description: string;
  piiTag?: string;
  defaultValue?: string;
}

export interface SchemaVersion {
  versionId: string;
  publishedAt: string;
  publishedBy: string;
  commitMessage: string;
  migrationJobRef?: string;
  breakingChangesCount: number;
  fieldCount: number;
  fields: SchemaFieldDefinition[];
}

export interface SchemaRegistryItem {
  id: string;
  systemName: string;
  systemType: 'Source' | 'Destination';
  entityName: string;
  environment: 'Production' | 'Staging' | 'Development';
  latestVersion: string;
  updatedAt: string;
  versions: SchemaVersion[];
}

export interface SchemaVersionDiff {
  baseVersion: string;
  targetVersion: string;
  addedFields: SchemaFieldDefinition[];
  removedFields: SchemaFieldDefinition[];
  modifiedFields: {
    fieldName: string;
    changes: string[];
    oldType?: string;
    newType?: string;
    oldNullable?: boolean;
    newNullable?: boolean;
  }[];
  breakingChanges: string[];
}

export interface ExportSnapshotJob {
  id: string;
  scheduleId?: string;
  scheduleName: string;
  entityName: string;
  format: ExportFormat;
  destinationUri: string;
  status: 'Completed' | 'Processing' | 'Failed';
  rowCount: number;
  fileSizeBytes: number;
  checksumSha256: string;
  startedAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

export type QualityAlertChannel = 'Webhook' | 'Email' | 'Slack' | 'Teams' | 'PagerDuty';

export interface DataQualityAlertConfig {
  id: string;
  pipelineId: string;
  pipelineName: string;
  entityName: string;
  isEnabled: boolean;
  minQualityScoreThreshold: number; // e.g., 85 (%)
  alertChannels: QualityAlertChannel[];
  webhookUrl?: string;
  emailRecipients?: string[];
  slackChannel?: string;
  autoPausePipelineOnBreach: boolean;
  consecutiveBreachTolerance: number;
  lastAlertSentAt?: string;
  lastScoreEvaluated?: number;
}

export interface DataQualityAlertLog {
  id: string;
  alertConfigId: string;
  pipelineName: string;
  entityName: string;
  triggeredAt: string;
  qualityScore: number;
  thresholdScore: number;
  channelUsed: QualityAlertChannel;
  destinationTarget: string;
  status: 'Delivered' | 'Failed' | 'Pending';
  payloadSummary: string;
  resolvedAt?: string;
  isResolved?: boolean;
}

export interface DependencyNode {
  id: string;
  system: 'Source (D365/SAP)' | 'Destination (S/4HANA/Salesforce)' | 'Staging Lakehouse';
  tableName: string;
  recordCount: number;
  primaryKey: string;
  migrationOrder: number; // e.g. Level 1, Level 2, Level 3
  isOrphanRisk: boolean;
  fieldsCount: number;
}

export type RelationType = 'OneToOne' | 'OneToMany' | 'ManyToMany' | 'SelfReferential' | 'Polymorphic';

export interface DependencyEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  foreignKey: string;
  referencedKey: string;
  relationType: RelationType;
  isMandatory: boolean;
  hasCircularDependency: boolean;
  hasCascadeRisk: boolean;
}

export type ConflictSeverity = 'Critical' | 'Warning' | 'Info';

export interface MigrationConflict {
  id: string;
  title: string;
  severity: ConflictSeverity;
  sourceTable: string;
  targetTable: string;
  conflictType:
    | 'Circular Dependency Loop'
    | 'Orphan Record Risk (Missing Parent FK)'
    | 'Type Mismatch Across Boundary'
    | 'Composite Key Unmapped'
    | 'Null Constraint Violation';
  description: string;
  recommendedFix: string;
  autoFixAvailable: boolean;
  status: 'Detected' | 'Resolved' | 'Ignored';
}

export interface ActivityFeedItem {
  id: string;
  userName: string;
  userAvatar?: string;
  userRole: 'Lead Architect' | 'Data Engineer' | 'Security Admin' | 'System Auto' | 'Compliance Officer';
  actionType: 'MIGRATION' | 'CONFIG' | 'MAPPING' | 'SECURITY' | 'SCALE' | 'SYSTEM' | 'EXPORT';
  title: string;
  details: string;
  timestamp: string;
  relativeTime: string;
  status: 'SUCCESS' | 'WARNING' | 'INFO' | 'CRITICAL' | 'IN_PROGRESS';
  targetResource?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Lead Architect' | 'Data Engineer' | 'Migration Lead' | 'QA Lead' | 'Compliance Officer' | 'Project Manager';
  capacityPercent: number;
  assignedProjectsCount: number;
  skills?: string[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  phase: 'Phase 1: Discovery' | 'Phase 2: Mapping & Cleansing' | 'Phase 3: Validation & Dry-Run' | 'Phase 4: Cutover & Sync' | 'Phase 5: Signoff & Audit';
  dueDate: string;
  status: 'Completed' | 'In Progress' | 'Delayed' | 'Upcoming';
  completionPct: number;
  assignedTeamMemberIds: string[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ERP' | 'CRM' | 'Database' | 'Financial' | 'Healthcare' | 'HRMS';
  estimatedDurationDays: number;
  phases: {
    name: string;
    durationDays: number;
    description: string;
    milestonesCount: number;
  }[];
  defaultConnectorsRequired: string[];
  recommendedTeamRoles: string[];
}

export interface MigrationProject {
  id: string;
  customerId: string;
  customerName: string;
  projectName: string;
  code: string;
  description: string;
  templateId?: string;
  status: 'Planned' | 'In Progress' | 'Testing' | 'In Cutover' | 'Completed' | 'Delayed' | 'On Hold';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  progressPct: number;
  sourceConnectorName: string;
  targetConnectorName: string;
  startDate: string;
  targetCutoverDate: string;
  actualCompletionDate?: string;
  totalRecordsToMigrate: number;
  recordsMigrated: number;
  team: {
    memberId: string;
    memberName: string;
    memberEmail: string;
    avatar: string;
    role: string;
    allocationPct: number;
    allocatedHours?: number;
    workedHours?: number;
  }[];
  milestones: Milestone[];
  auditLogs: {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    details: string;
  }[];
}

export interface CustomerAccount {
  id: string;
  name: string;
  code: string;
  industry: 'Financial Services' | 'Healthcare & Pharma' | 'Manufacturing & Retail' | 'Logistics & Supply' | 'Technology & SaaS' | 'Energy & Utilities';
  tierSla: 'Enterprise Gold (99.99%)' | 'Enterprise Platinum (24/7)' | 'Standard Business' | 'Partner Managed';
  primaryContact: string;
  contactEmail: string;
  contactPhone: string;
  accountManager: string;
  region: 'North America (US-East)' | 'EMEA (Frankfurt)' | 'APAC (Singapore)' | 'LATAM (Sao Paulo)' | 'Global Cross-Region';
  healthScore: number;
  targetCutoverDate: string;
  status: 'Active' | 'Onboarding' | 'Maintenance' | 'Archived';
  projectsCount: number;
  totalRecordsToMigrate: number;
  notes: string;
  createdAt: string;
}



