import { ErrorLog, ErrorCategory } from '../../types';
import { SAMPLE_ERRORS } from '../../data/mockData';
import { getErrorCategory } from './CategoryConfig';

export const INITIAL_EXTENDED_ERRORS: ErrorLog[] = [
  ...SAMPLE_ERRORS.map((e) => ({ ...e, category: getErrorCategory(e) })),
  {
    id: 'err-1004',
    jobId: 'job-101',
    entityName: 'Customers',
    rowNumber: 618,
    fieldName: 'Tax_Registration_Number',
    rawValue: 'INVALID_TAX_N/A',
    errorCode: 'VAL-TAX-002',
    errorMessage: 'Tax registration number format invalid for country code US',
    severity: 'Warning',
    status: 'Unresolved',
    category: 'Validation',
    timestamp: '1 min ago',
    stackTrace: `Error [VAL-TAX-002]: Tax registration number format invalid for country code US
  at TaxValidationRule.verifyEinFormat (/src/engine/validation/taxRules.ts:42:15)
  at DataTransformationPipeline.processRow (/src/pipeline/transformStage.ts:114:24)
  at BatchEngine.dispatchJobChunk (/src/runtime/batchScheduler.ts:95:5)`,
  },
  {
    id: 'err-1005',
    jobId: 'job-102',
    entityName: 'ItemLedger',
    rowNumber: 890,
    fieldName: 'Table_Lock',
    rawValue: 'LOCK_TIMEOUT_30S',
    errorCode: 'ERR_TIMEOUT_LOCK',
    errorMessage: 'Table lock wait timeout exceeded after 30000ms on MARA_Material_Master',
    severity: 'Error',
    status: 'Unresolved',
    category: 'Database',
    timestamp: '2 mins ago',
    stackTrace: `Error [ERR_TIMEOUT_LOCK]: Table lock wait timeout exceeded after 30000ms
  at PostgresTransactionManager.acquireTableLock (/src/db/transactionLock.ts:88:12)
  at EntityWorker.processChunkBatch (/src/workers/entityWorker.ts:140:18)
  at CloudRunRunner.execute (/src/server/runner.ts:92:4)`,
  },
  {
    id: 'err-1006',
    jobId: 'job-102',
    entityName: 'ItemLedger',
    rowNumber: 1042,
    fieldName: 'Table_Lock',
    rawValue: 'LOCK_TIMEOUT_30S',
    errorCode: 'ERR_TIMEOUT_LOCK',
    errorMessage: 'Table lock wait timeout exceeded after 30000ms on MARA_Material_Master',
    severity: 'Error',
    status: 'Unresolved',
    category: 'Database',
    timestamp: '3 mins ago',
    stackTrace: `Error [ERR_TIMEOUT_LOCK]: Table lock wait timeout exceeded after 30000ms
  at PostgresTransactionManager.acquireTableLock (/src/db/transactionLock.ts:88:12)
  at EntityWorker.processChunkBatch (/src/workers/entityWorker.ts:140:18)`,
  },
  {
    id: 'err-1007',
    jobId: 'job-103',
    entityName: 'Vendors',
    rowNumber: 120,
    fieldName: 'Cust_Name',
    rawValue: 'Acme Logistics Corp   ',
    errorCode: 'VAL-STRING-TRIM',
    errorMessage: 'Trailing whitespace padding detected on required string field',
    severity: 'Warning',
    status: 'Unresolved',
    category: 'Validation',
    timestamp: '5 mins ago',
    stackTrace: `Warning [VAL-STRING-TRIM]: Trailing whitespace padding detected on field Cust_Name
  at StringSanitizerRule.checkWhitespacePadding (/src/engine/validation/stringRules.ts:19:8)
  at DataTransformationPipeline.processRow (/src/pipeline/transformStage.ts:120:14)`,
  },
  {
    id: 'err-1008',
    jobId: 'job-103',
    entityName: 'Vendors',
    rowNumber: 245,
    fieldName: 'Cust_Name',
    rawValue: 'Global Tech Systems  ',
    errorCode: 'VAL-STRING-TRIM',
    errorMessage: 'Trailing whitespace padding detected on required string field',
    severity: 'Warning',
    status: 'Unresolved',
    category: 'Validation',
    timestamp: '6 mins ago',
    stackTrace: `Warning [VAL-STRING-TRIM]: Trailing whitespace padding detected on field Cust_Name
  at StringSanitizerRule.checkWhitespacePadding (/src/engine/validation/stringRules.ts:19:8)`,
  },
  {
    id: 'err-1009',
    jobId: 'job-101',
    entityName: 'Customers',
    rowNumber: 780,
    fieldName: 'Contact_Email',
    rawValue: 'support..service@acme.com',
    errorCode: 'VAL-EMAIL-001',
    errorMessage: 'Email format validation error: Consecutive dots found in domain portion.',
    severity: 'Warning',
    status: 'Unresolved',
    category: 'Validation',
    timestamp: '8 mins ago',
    stackTrace: `Error [VAL-EMAIL-001]: Email format validation error: Consecutive dots found
  at EmailValidator.checkConsecutiveDots (/src/engine/validation/emailValidator.ts:32:10)
  at DataTransformationPipeline.processRow (/src/pipeline/transformStage.ts:128:20)`,
  },
  {
    id: 'err-1010',
    jobId: 'job-104',
    entityName: 'SalesOrders',
    rowNumber: 902,
    fieldName: 'Payment_Terms_Code',
    rawValue: 'NET90_CUSTOM_OFFER',
    errorCode: 'FK-LOOKUP-004',
    errorMessage: 'Foreign key lookup failed: Payment Terms Code "NET90_CUSTOM_OFFER" not found in BC target table.',
    severity: 'Error',
    status: 'Unresolved',
    category: 'Data Mapping',
    timestamp: '10 mins ago',
    stackTrace: `Error [FK-LOOKUP-004]: Foreign key lookup failed for Payment Terms Code
  at TargetRelationalLookup.resolveReferenceKey (/src/engine/lookup/foreignKeyResolver.ts:65:14)
  at DataTransformationPipeline.processRow (/src/pipeline/transformStage.ts:145:18)`,
  },
  {
    id: 'err-1011',
    jobId: 'job-long-1',
    entityName: 'GL_Transactions',
    rowNumber: 4210,
    fieldName: 'API_Gateway',
    rawValue: 'HTTP_503_SERVICE_UNAVAILABLE',
    errorCode: 'NET-HTTP-503',
    errorMessage: 'Gateway connection timed out: Target Business Central OData API returned 503 Service Unavailable.',
    severity: 'Critical',
    status: 'Unresolved',
    category: 'Network',
    timestamp: '12 mins ago',
    stackTrace: `Error [NET-HTTP-503]: OData HTTP 503 Service Unavailable
  at ODataHttpClient.executePostRequest (/src/connectors/odataClient.ts:112:18)
  at BatchIngestionPipeline.transmitChunk (/src/pipeline/transmitStage.ts:89:12)`,
  },
  {
    id: 'err-1012',
    jobId: 'job-104',
    entityName: 'SalesOrders',
    rowNumber: 154,
    fieldName: 'OAuth_Header',
    rawValue: 'TOKEN_EXPIRED_401',
    errorCode: 'AUTH-TOKEN-401',
    errorMessage: 'Authentication token expired: Dynamics 365 OAuth bearer token invalid or expired.',
    severity: 'Critical',
    status: 'Unresolved',
    category: 'Auth',
    timestamp: '15 mins ago',
    stackTrace: `Error [AUTH-TOKEN-401]: OAuth Token Authorization Failed
  at OAuth2TokenManager.getValidBearerHeader (/src/auth/oauthManager.ts:45:10)
  at ApiServiceConnector.sendRequest (/src/connectors/apiConnector.ts:78:22)`,
  },
  {
    id: 'err-1013',
    jobId: 'job-101',
    entityName: 'Customers',
    rowNumber: 1204,
    fieldName: 'Customer_Posting_Group',
    rawValue: 'NULL',
    errorCode: 'SCHEMA-NULL-VIOLATION',
    errorMessage: 'Schema non-null constraint violated: Required target field "Customer Posting Group" cannot be null.',
    severity: 'Error',
    status: 'Unresolved',
    category: 'Schema',
    timestamp: '18 mins ago',
    stackTrace: `Error [SCHEMA-NULL-VIOLATION]: Non-null field Customer Posting Group is NULL
  at SchemaValidator.checkNullability (/src/engine/validation/schemaValidator.ts:54:14)
  at TransformEngine.validateTargetRecord (/src/engine/transformEngine.ts:98:8)`,
  }
];

export const ERROR_RCA_REGISTRY: Record<string, {
  title: string;
  category: ErrorCategory;
  rootCause: string;
  remediation: string;
}> = {
  'VAL-TAX-002': {
    title: 'Tax Registration Number Format Failure',
    category: 'Validation',
    rootCause: 'Values do not conform to the US Employer Identification Number (EIN) format (XX-XXXXXXX) or include placeholder strings like "INVALID_TAX".',
    remediation: 'Apply regex validation cleansers to replace invalid strings with empty/null, or verify input data formats prior to pipeline ingestion.'
  },
  'FK-LOOKUP-004': {
    title: 'Foreign Key Lookup Reference Miss',
    category: 'Data Mapping',
    rootCause: 'The referenced lookup key (e.g. "NET90_SPECIAL") does not exist in the destination system (Dynamics 365 BC / Payment Terms).',
    remediation: 'Update the Mapping Studio lookup crosswalk to map legacy terms to standard target codes, or create the missing records in target ERP.'
  },
  'VAL-EMAIL-001': {
    title: 'Email Format Validation Check Fail',
    category: 'Validation',
    rootCause: 'Data contains typographic formatting errors in mail addresses, such as double consecutive dots (e.g. "..com") or illegal characters.',
    remediation: 'Utilize string parsing sanitizers or regex cleansing rules to strip consecutive periods and enforce RFC 5322 compliance.'
  },
  'ERR_TIMEOUT_LOCK': {
    title: 'Database Table Concurrency Lock Timeout',
    category: 'Database',
    rootCause: 'Concurrent bulk import worker processes attempting to write records to target tables (e.g. MARA_Material_Master) simultaneously, leading to lock wait timeouts (30s).',
    remediation: 'Implement exponential backoff retry policies, reduce worker thread concurrency during peak ingestion, or process updates in smaller batches.'
  },
  'VAL-STRING-TRIM': {
    title: 'Trailing/Leading String Whitespace Padding',
    category: 'Validation',
    rootCause: 'String values contain un-trimmed trailing or leading whitespace, triggering integration warnings in standard schema strict modes.',
    remediation: 'Configure global string auto-trimming sanitizers in the staging pipeline before forwarding payloads to ERP ingestion.'
  }
};
