import { MaskingConfig } from './index';

export type MigrationStrategyType = 'DirectMapping' | 'CanonicalDataModel';

export type MappingMode =
  | 'SourceToDestination' // Mode 1: Source -> Destination
  | 'SourceToCanonical'   // Mode 2: Source -> Canonical
  | 'CanonicalToDestination'; // Mode 3: Canonical -> Destination

export type MappingType =
  | 'One-to-One'
  | 'One-to-Many'
  | 'Many-to-One'
  | 'Constant Value'
  | 'Default Value'
  | 'Lookup Mapping'
  | 'Conditional Mapping'
  | 'Formula Mapping'
  | 'Composite Mapping';

export type TemplateCategory =
  | 'ERP-to-ERP'
  | 'Excel-to-ERP'
  | 'CSV-to-ERP'
  | 'Database-to-ERP'
  | 'Legacy-to-ERP'
  | 'ERP-to-Database'
  | 'Database-to-Database'
  | 'Custom Application-to-ERP'
  | 'ERP-to-Custom Application';

export type CDMEntityName =
  | 'Customer'
  | 'Vendor'
  | 'Item'
  | 'Employee'
  | 'Sales Order'
  | 'Purchase Order'
  | 'Sales Invoice'
  | 'Purchase Invoice'
  | 'Inventory Transaction'
  | 'Journal Entry'
  | 'Fixed Asset'
  | 'Project'
  | 'Work Order'
  | 'Asset';

export interface CDMAttribute {
  id: string;
  attributeName: string;
  displayName: string;
  dataType: 'String' | 'Integer' | 'Decimal' | 'Date' | 'DateTime' | 'Boolean' | 'Enum' | 'Lookup';
  isRequired: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  maxLength?: number;
  defaultValue?: string;
  lookupEntity?: string;
  isExtension?: boolean; // Customer-specific extension attribute
  description?: string;
}

export interface CDMEntity {
  id: string;
  entityName: CDMEntityName;
  displayName: string;
  category: 'Master Data' | 'Transactional' | 'Financial' | 'Operations';
  description: string;
  standardAttributes: CDMAttribute[];
  customAttributes: CDMAttribute[];
  updatedAt: string;
}

export interface DualMappingRule {
  id: string;
  mode: MappingMode;
  mappingType: MappingType;
  sourceFields: string[]; // Single or multiple fields
  canonicalField?: string;
  targetFields: string[]; // Single or multiple fields
  constantValue?: string;
  defaultValue?: string;
  lookupTableId?: string;
  conditionExpression?: string;
  formulaExpression?: string;
  confidence: number;
  isRequired: boolean;
  validationRule?: string;
  maskingConfig?: MaskingConfig;
  reasoning?: string;
  transformations?: { type: 'Uppercase' | 'Lowercase' | 'Trim' | 'Replace' | 'Regex' | 'Prefix' | 'Suffix'; param?: string }[];
  lookups?: { source: string; target: string }[];
  lookupFallback?: 'Default' | 'Fail' | 'Pass-through';
  businessRules?: { type: 'Required' | 'RegexMatch' | 'MinLength' | 'MaxLength' | 'RangeMin' | 'RangeMax'; value?: string; severity: 'Warn' | 'Fail' }[];
  calculatedFormula?: string;
  conditionalMapping?: { field: string; operator: string; value: string; thenVal: string; elseVal: string }[];
}

export interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  strategy: MigrationStrategyType;
  sourceSystem: string;
  targetSystem: string;
  entityName: string;
  version: string; // e.g., "v1.2.0"
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Published' | 'Archived';
  author: string;
  updatedAt: string;
  rulesCount: number;
  rules: DualMappingRule[];
}

export interface SystemMetadataField {
  fieldName: string;
  displayName: string;
  dataType: 'String' | 'Integer' | 'Decimal' | 'Date' | 'DateTime' | 'Boolean' | 'Enum' | 'Lookup';
  maxLength?: number;
  isRequired: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  defaultValue?: string;
  lookupTable?: string;
  relationships?: string;
  validationRules?: string;
}

export interface SystemMetadata {
  systemId: string;
  systemName: string;
  systemType: 'Source ERP' | 'Destination ERP' | 'File System' | 'Database' | 'Custom API';
  entityName: string;
  displayName: string;
  version: string;
  apiEndpoint?: string;
  fields: SystemMetadataField[];
}

export interface ImportProfile {
  id: string;
  profileName: string;
  sourceType: 'Excel' | 'CSV' | 'JSON' | 'XML' | 'Flat File' | 'Database Table' | 'REST API';
  sourceLocation: string;
  sourceEntity: string;
  sheetName?: string;
  headerRow: number;
  fileEncoding: 'UTF-8' | 'ASCII' | 'UTF-16' | 'ISO-8859-1';
  delimiter: 'Comma' | 'Semicolon' | 'Tab' | 'Pipe';
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD.MM.YYYY' | 'ISO-8601';
  numberFormat: '1,234.56' | '1.234,56' | 'Standard';
  mappingTemplateId: string;
  validationRulesetId: string;
  destinationConnectorId: string;
  batchSize: number;
  lastRun?: string;
}

export interface PipelineStageExecution {
  stepNumber: number;
  stageName:
    | 'Read Source'
    | 'Data Cleansing'
    | 'Field Mapping'
    | 'Lookup Conversion'
    | 'Data Transformation'
    | 'Validation'
    | 'Reference Validation'
    | 'Dependency Resolution'
    | 'Migration'
    | 'Verification'
    | 'Audit Logging';
  status: 'SUCCESS' | 'RUNNING' | 'PENDING' | 'WARNING' | 'FAILED';
  durationMs: number;
  processedRecords: number;
  errorCount: number;
  details: string;
}

export interface ConnectorInterfaceMethod {
  methodName:
    | 'Connect()'
    | 'TestConnection()'
    | 'ReadMetadata()'
    | 'ReadEntities()'
    | 'ReadFields()'
    | 'ReadLookupValues()'
    | 'Validate()'
    | 'Transform()'
    | 'Upload()'
    | 'BulkUpload()'
    | 'Retry()'
    | 'Rollback()'
    | 'GetStatus()'
    | 'GetLogs()'
    | 'Disconnect()';
  description: string;
  implemented: boolean;
  status: 'READY' | 'PASSED' | 'TESTING' | 'WARN';
  avgResponseMs: number;
}
