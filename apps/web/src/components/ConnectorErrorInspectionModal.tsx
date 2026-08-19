import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  ArrowRight,
  ExternalLink,
  Search,
  RefreshCw,
  Copy,
  Check,
  Filter,
  Layers,
  FileCode,
  Terminal,
  Server,
  Play,
  RotateCcw,
  ShieldAlert,
  Code,
  Hourglass,
  Flame,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  Sliders,
  Radio,
  Tag,
  Hash,
  Activity,
  ArrowUpRight,
  FileText,
} from 'lucide-react';
import { HeatmapPipelineEntity } from './PipelineErrorLatencyHeatmapWidget';

export interface ConnectorErrorLog {
  id: string;
  timestamp: string;
  level: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
  errorCode: string;
  exceptionClass: string;
  targetEntity: string;
  message: string;
  retryAttempt: number;
  maxRetries: number;
  httpStatus?: number;
  latencyMs: number;
  stackTrace: string;
  affectedSegmentId: string;
  recordKeyRange: string;
}

export interface AffectedRecordSegment {
  segmentId: string;
  partitionKey: string;
  targetTable: string;
  recordOffset: string;
  primaryKeyRange: string;
  totalRecordsInSegment: number;
  failedRecordsCount: number;
  status: 'Failed' | 'Quarantined' | 'Retrying' | 'Resolved';
  errorCategory: string;
  sampleFailedRecord: {
    primaryKey: string;
    recordData: Record<string, any>;
    validationError: string;
    fieldViolations: string[];
  };
}

interface ConnectorErrorInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: HeatmapPipelineEntity | null;
  onNavigateTab: (tab: string) => void;
}

// Generate realistic error logs per connector
function generateErrorLogsForEntity(entity: HeatmapPipelineEntity): ConnectorErrorLog[] {
  if (entity.id === 'pipe-sap-d365') {
    return [
      {
        id: 'log-sap-001',
        timestamp: '2026-08-13 23:24:12.412',
        level: 'CRITICAL',
        errorCode: 'HTTP_429_TOO_MANY_REQUESTS',
        exceptionClass: 'Microsoft.Dynamics.Nav.Types.Exceptions.NavODataThrottledException',
        targetEntity: 'dbo.CustomerLedgerEntries',
        message: 'HTTP 429: Dynamics 365 BC tenant quota exceeded. Rate limit of 600 req/min saturated during bulk UPSERT.',
        retryAttempt: 3,
        maxRetries: 3,
        httpStatus: 429,
        latencyMs: 1420,
        stackTrace: `Microsoft.Dynamics.Nav.Service.OData.ODataRequestProcessor.ProcessBulkBatch(ODataBatchRequest batch)
   at Microsoft.Dynamics.Nav.Service.OData.ODataWriter.WriteEntitySet(IEntityCollection entities)
   at MigrationEngine.Connectors.D365BCWriter.ExecuteBatchAsync(BatchPayload payload) in /src/connectors/d365/writer.cs:line 384
   at MigrationEngine.Pipeline.WorkerPool.ProcessSegmentAsync(RecordSegment segment) in /src/pipeline/worker.cs:line 129`,
        affectedSegmentId: 'SEG-SAP-CUST-8840',
        recordKeyRange: 'CUST-8840001 .. CUST-8849999',
      },
      {
        id: 'log-sap-002',
        timestamp: '2026-08-13 23:23:45.109',
        level: 'ERROR',
        errorCode: 'CONN_POOL_TIMEOUT',
        exceptionClass: 'System.TimeoutException',
        targetEntity: 'dbo.CustomerLedgerEntries',
        message: 'Connection pool exhausted while waiting for available SAP RFC gateway socket (Pool size: 32).',
        retryAttempt: 2,
        maxRetries: 3,
        latencyMs: 30000,
        stackTrace: `SAP.Middleware.Connector.RfcConnectionPool.GetConnection()
   at MigrationEngine.Connectors.SapRfcReader.FetchPartitionBatch(PartitionQuery query) in /src/connectors/sap/rfc_reader.cs:line 210
   at MigrationEngine.Pipeline.ExtractWorker.Execute() in /src/pipeline/extract.cs:line 95`,
        affectedSegmentId: 'SEG-SAP-CUST-8841',
        recordKeyRange: 'CUST-8850001 .. CUST-8859999',
      },
      {
        id: 'log-sap-003',
        timestamp: '2026-08-13 23:22:18.891',
        level: 'WARNING',
        errorCode: 'AUTO_BACKOFF_ACTIVE',
        exceptionClass: 'MigrationEngine.Policies.ExponentialBackoffWarning',
        targetEntity: 'dbo.CustomerLedgerEntries',
        message: 'Throttling backoff triggered: worker concurrency scaled down from 16 to 4 threads for 45 seconds.',
        retryAttempt: 1,
        maxRetries: 5,
        latencyMs: 640,
        stackTrace: `MigrationEngine.Policies.AdaptiveThrottler.ApplyBackoffCooldown(String connectorId, TimeSpan duration)
   at MigrationEngine.Pipeline.WorkerPool.HandleThrottlingEvent(ThrottlingEvent e)`,
        affectedSegmentId: 'SEG-SAP-CUST-8842',
        recordKeyRange: 'CUST-8860001 .. CUST-8869999',
      },
      {
        id: 'log-sap-004',
        timestamp: '2026-08-13 23:20:05.340',
        level: 'ERROR',
        errorCode: 'ODATA_PAYLOAD_CHUNK_FAILURE',
        exceptionClass: 'System.Net.Http.HttpRequestException',
        targetEntity: 'dbo.CustomerPostingGroups',
        message: 'Failed to stream binary multipart OData chunk to endpoint https://api.businesscentral.dynamics.com/v2.0/tenant/production/ODataV4.',
        retryAttempt: 3,
        maxRetries: 3,
        httpStatus: 504,
        latencyMs: 8200,
        stackTrace: `System.Net.Http.HttpClient.SendAsyncCore(HttpRequestMessage request)
   at MigrationEngine.Connectors.ODataStreamingClient.PostBatch(String url, Stream stream)
   at MigrationEngine.Pipeline.StageWriter.Commit()`,
        affectedSegmentId: 'SEG-SAP-POSTING-019',
        recordKeyRange: 'PG-00101 .. PG-00999',
      },
    ];
  }

  if (entity.id === 'pipe-oracle-fno') {
    return [
      {
        id: 'log-ora-001',
        timestamp: '2026-08-13 23:24:50.012',
        level: 'CRITICAL',
        errorCode: 'ORA-00060_DEADLOCK_DETECTED',
        exceptionClass: 'Oracle.ManagedDataAccess.Client.OracleException',
        targetEntity: 'GL_JE_LINES_STAGING',
        message: 'ORA-00060: Deadlock detected while waiting for resource on GL Journal Entry Lines concurrent staging table lock.',
        retryAttempt: 3,
        maxRetries: 3,
        latencyMs: 820,
        stackTrace: `OracleInternal.SqlEngine.SqlStatement.Execute()
   at Oracle.ManagedDataAccess.Client.OracleCommand.ExecuteNonQuery()
   at MigrationEngine.Connectors.OracleReader.BatchRead(String sql) in /src/connectors/oracle/reader.cs:line 144
   at MigrationEngine.Pipeline.StageExecutor.RunPartition() in /src/pipeline/stage.cs:line 78`,
        affectedSegmentId: 'SEG-ORA-GL-BATCH-994',
        recordKeyRange: 'JE_LINE_ID: 10485760 .. 10585760',
      },
      {
        id: 'log-ora-002',
        timestamp: '2026-08-13 23:21:30.450',
        level: 'ERROR',
        errorCode: 'ORA-01555_SNAPSHOT_TOO_OLD',
        exceptionClass: 'Oracle.ManagedDataAccess.Client.OracleException',
        targetEntity: 'GL_BALANCES_HISTORICAL',
        message: 'ORA-01555: Snapshot too old: rollback segment too small for prolonged flashback query window.',
        retryAttempt: 2,
        maxRetries: 2,
        latencyMs: 12400,
        stackTrace: `Oracle.ManagedDataAccess.Client.OracleDataReader.Read()
   at MigrationEngine.Connectors.OracleCdcStream.FetchRows()
   at MigrationEngine.Pipeline.ExtractWorker.Pump()`,
        affectedSegmentId: 'SEG-ORA-GL-BAL-042',
        recordKeyRange: 'PERIOD_ID: 2024-Q1 .. 2024-Q4',
      },
    ];
  }

  if (entity.id === 'pipe-sfdc-dataverse') {
    return [
      {
        id: 'log-sfdc-001',
        timestamp: '2026-08-13 23:22:10.120',
        level: 'ERROR',
        errorCode: 'SCHEMA_FIELD_TRUNCATION',
        exceptionClass: 'Microsoft.Xrm.Sdk.InvalidPluginExecutionException',
        targetEntity: 'contact',
        message: 'Length of string attribute "tax_identification_number" (32 chars) exceeds maximum allowed length of 20 chars.',
        retryAttempt: 3,
        maxRetries: 3,
        httpStatus: 400,
        latencyMs: 290,
        stackTrace: `Microsoft.Xrm.Sdk.Client.OrganizationServiceProxy.Execute(OrganizationRequest request)
   at MigrationEngine.Connectors.DataverseWriter.UpsertContactRecord(Entity record) in /src/connectors/dataverse/writer.cs:line 192
   at MigrationEngine.Pipeline.TransformWorker.Flush()`,
        affectedSegmentId: 'SEG-SFDC-CONT-4412',
        recordKeyRange: '0035000000abc10 .. 0035000000abc99',
      },
      {
        id: 'log-sfdc-002',
        timestamp: '2026-08-13 23:19:44.890',
        level: 'WARNING',
        errorCode: 'NULLABLE_FOREIGN_KEY_LOOKUP',
        exceptionClass: 'MigrationEngine.Validation.ForeignKeyNotFoundException',
        targetEntity: 'account_lead_mapping',
        message: 'Lookup ParentAccountId "0015000000XYZ" not yet present in target Dataverse staging table. Row buffered for second-pass linking.',
        retryAttempt: 1,
        maxRetries: 5,
        latencyMs: 145,
        stackTrace: `MigrationEngine.Validation.ForeignKeyResolver.Resolve(String sourceKey)
   at MigrationEngine.Pipeline.TransformationGraph.ProcessNode()`,
        affectedSegmentId: 'SEG-SFDC-ACC-1109',
        recordKeyRange: '0015000000XYZ01 .. 0015000000XYZ80',
      },
    ];
  }

  if (entity.id === 'pipe-mysql-blob') {
    return [
      {
        id: 'log-my-001',
        timestamp: '2026-08-13 23:23:01.210',
        level: 'CRITICAL',
        errorCode: 'ENCODING_CODEPAGE_MISMATCH',
        exceptionClass: 'System.Text.DecoderFallbackException',
        targetEntity: 'customer_review_archive_blob',
        message: 'Unable to translate bytes [F0 9F 98 8A] at index 842 from specified code page to UTF-8 without data loss.',
        retryAttempt: 3,
        maxRetries: 3,
        latencyMs: 510,
        stackTrace: `System.Text.UTF8Encoding.GetCharCount(Byte* bytes, Int32 count)
   at MigrationEngine.Connectors.BlobStreamWriter.EncodePayload(Byte[] buffer)
   at MigrationEngine.Pipeline.StreamPipeline.Pump()`,
        affectedSegmentId: 'SEG-MYSQL-ARCH-901',
        recordKeyRange: 'ARCH_ROW_ID: 9010001 .. 9019999',
      },
    ];
  }

  // Generic fallback logs for healthy / other connectors
  return [
    {
      id: `log-${entity.id}-001`,
      timestamp: '2026-08-13 23:24:00.000',
      level: entity.status === 'Healthy' ? 'INFO' : 'WARNING',
      errorCode: entity.status === 'Healthy' ? 'SYNC_HEARTBEAT_NOMINAL' : 'TRANSIENT_SOCKET_RETRY',
      exceptionClass: entity.status === 'Healthy' ? 'System.Diagnostics.HealthCheck' : 'System.IO.IOException',
      targetEntity: 'dbo.StagingTablePrimary',
      message: entity.status === 'Healthy'
        ? `Streaming sync healthy. P95 latency: ${entity.p95LatencyMs}ms, Throughput: ${entity.throughputRecSec} rec/s.`
        : `${entity.topErrorMessage}`,
      retryAttempt: entity.status === 'Healthy' ? 0 : 1,
      maxRetries: 3,
      latencyMs: entity.p95LatencyMs,
      stackTrace: `MigrationEngine.Connectors.PipelineStream.InspectHealth()
   at MigrationEngine.Pipeline.Monitor.Tick() in /src/pipeline/monitor.cs:line 42`,
      affectedSegmentId: `SEG-${entity.id.toUpperCase()}-001`,
      recordKeyRange: 'ROW: 00000001 .. 00050000',
    },
  ];
}

// Generate affected record segments for connector
function generateAffectedSegmentsForEntity(entity: HeatmapPipelineEntity): AffectedRecordSegment[] {
  if (entity.id === 'pipe-sap-d365') {
    return [
      {
        segmentId: 'SEG-SAP-CUST-8840',
        partitionKey: 'POSTING_YEAR_2024_Q3_PART_04',
        targetTable: 'dbo.CustomerLedgerEntries',
        recordOffset: '1,420,000 - 1,510,000',
        primaryKeyRange: 'CUST-8840001 .. CUST-8849999',
        totalRecordsInSegment: 90000,
        failedRecordsCount: 14820,
        status: 'Failed',
        errorCategory: 'API Rate Limit & Throttling (HTTP 429)',
        sampleFailedRecord: {
          primaryKey: 'CUST-8840912',
          recordData: {
            Entry_No: 8840912,
            Customer_No: 'DE-CUST-99210',
            Posting_Date: '2024-09-14T00:00:00Z',
            Document_Type: 'Invoice',
            Document_No: 'INV-2024-88401',
            Amount_LCY: 14920.50,
            Currency_Code: 'EUR',
            Open: true,
            Remaining_Amount: 14920.50,
            Global_Dimension_1_Code: 'SALES_EMEA',
            Applies_To_Doc_No: '',
          },
          validationError: 'HTTP 429: Target Dynamics 365 OData worker rejected batch. Retry-After header: 45 seconds.',
          fieldViolations: ['HTTP_QUOTA_EXCEEDED (Max 600 req/min)', 'Batch rejected at index 142'],
        },
      },
      {
        segmentId: 'SEG-SAP-CUST-8841',
        partitionKey: 'POSTING_YEAR_2024_Q3_PART_05',
        targetTable: 'dbo.CustomerLedgerEntries',
        recordOffset: '1,510,001 - 1,600,000',
        primaryKeyRange: 'CUST-8850001 .. CUST-8859999',
        totalRecordsInSegment: 90000,
        failedRecordsCount: 6420,
        status: 'Retrying',
        errorCategory: 'SAP RFC Connection Pool Starvation',
        sampleFailedRecord: {
          primaryKey: 'CUST-8850021',
          recordData: {
            Entry_No: 8850021,
            Customer_No: 'US-CUST-41209',
            Posting_Date: '2024-09-16T00:00:00Z',
            Document_Type: 'Payment',
            Document_No: 'PMT-2024-0912',
            Amount_LCY: -3500.00,
            Currency_Code: 'USD',
            Open: false,
          },
          validationError: 'Connection pool timeout waiting for available SAP JCo / RFC thread.',
          fieldViolations: ['RFC_SOCKET_POOL_EXHAUSTED'],
        },
      },
      {
        segmentId: 'SEG-SAP-POSTING-019',
        partitionKey: 'METADATA_CONFIG_MASTER',
        targetTable: 'dbo.CustomerPostingGroups',
        recordOffset: '1 - 890',
        primaryKeyRange: 'PG-00101 .. PG-00999',
        totalRecordsInSegment: 890,
        failedRecordsCount: 89,
        status: 'Quarantined',
        errorCategory: 'Missing Chart of Accounts Reference',
        sampleFailedRecord: {
          primaryKey: 'PG-00142',
          recordData: {
            Code: 'EU_RETAIL',
            Receivables_Account: '12100-UNKNOWN',
            Service_Charge_Acc: '70200',
            Payment_Disc_Debit_Acc: '50100',
          },
          validationError: 'GL Account "12100-UNKNOWN" does not exist in Chart of Accounts table.',
          fieldViolations: ['Receivables_Account (Foreign Key Missing)'],
        },
      },
    ];
  }

  if (entity.id === 'pipe-oracle-fno') {
    return [
      {
        segmentId: 'SEG-ORA-GL-BATCH-994',
        partitionKey: 'GL_JE_PARTITION_2024_08',
        targetTable: 'GL_JE_LINES_STAGING',
        recordOffset: '10,485,760 - 10,585,760',
        primaryKeyRange: 'JE_LINE_ID: 10485760 .. 10585760',
        totalRecordsInSegment: 100000,
        failedRecordsCount: 9810,
        status: 'Failed',
        errorCategory: 'Database Deadlock Lock Timeout (ORA-00060)',
        sampleFailedRecord: {
          primaryKey: 'JE_LINE_ID: 10485901',
          recordData: {
            JE_HEADER_ID: 994012,
            JE_LINE_NUM: 48,
            LEDGER_ID: 2021,
            CODE_COMBINATION_ID: 48102,
            ENTERED_DR: 154000.00,
            ENTERED_CR: 0.00,
            ACCOUNTED_DR: 154000.00,
            ACCOUNTED_CR: 0.00,
            DESCRIPTION: 'Nocturnal Intercompany GL Accrual Reversal',
          },
          validationError: 'ORA-00060 Deadlock detected while acquiring exclusive row lock.',
          fieldViolations: ['CONCURRENT_UPDATE_CONFLICT (Wait timeout > 30s)'],
        },
      },
    ];
  }

  if (entity.id === 'pipe-sfdc-dataverse') {
    return [
      {
        segmentId: 'SEG-SFDC-CONT-4412',
        partitionKey: 'PART_CONTACT_EMEA_WEST',
        targetTable: 'contact',
        recordOffset: '440,000 - 452,000',
        primaryKeyRange: '0035000000abc10 .. 0035000000abc99',
        totalRecordsInSegment: 12000,
        failedRecordsCount: 6240,
        status: 'Failed',
        errorCategory: 'String Attribute Truncation & ISO Validation',
        sampleFailedRecord: {
          primaryKey: '0035000000abc44',
          recordData: {
            contactid: '0035000000abc44',
            firstname: 'Maximilian',
            lastname: 'von Bernstorff-Gutenberg',
            emailaddress1: 'm.bernstorff@enterprise-tech.de',
            tax_identification_number: 'DE-TAX-ID-9948201948201-SPECIAL-V1',
            address1_country: 'Germany (Federal Republic)',
            telephone1: '+49 89 2019482',
          },
          validationError: 'tax_identification_number length (34 chars) exceeds target column limit of 20 chars. address1_country not a valid 2-letter ISO-3166 code.',
          fieldViolations: ['tax_identification_number (Max 20 chars)', 'address1_country (Expected ISO-2 "DE")'],
        },
      },
    ];
  }

  if (entity.id === 'pipe-mysql-blob') {
    return [
      {
        segmentId: 'SEG-MYSQL-ARCH-901',
        partitionKey: 'CUSTOMER_REVIEWS_BLOB_CHUNK_9',
        targetTable: 'customer_review_archive_blob',
        recordOffset: '9,010,001 - 9,020,000',
        primaryKeyRange: 'ARCH_ROW_ID: 9010001 .. 9019999',
        totalRecordsInSegment: 10000,
        failedRecordsCount: 7320,
        status: 'Failed',
        errorCategory: 'Codepage Encoding Mismatch (Latin1 vs UTF-8)',
        sampleFailedRecord: {
          primaryKey: 'ARCH_ROW_ID: 9010482',
          recordData: {
            review_id: 9010482,
            customer_id: 489102,
            rating: 5,
            review_text_blob: 'Great migration platform! \xF0\x9F\x9A\x80\xF0\x9F\x94\xA5 Excellent performance.',
            submitted_date: '2024-05-18 14:22:01',
          },
          validationError: 'Byte sequence contains 4-byte UTF-8 emoji which failed Latin1 character decoding table.',
          fieldViolations: ['review_text_blob (DecoderFallbackException)'],
        },
      },
    ];
  }

  return [
    {
      segmentId: `SEG-${entity.id.toUpperCase()}-001`,
      partitionKey: 'PRIMARY_PARTITION_01',
      targetTable: 'dbo.StagingTablePrimary',
      recordOffset: '1 - 50,000',
      primaryKeyRange: 'ROW: 00000001 .. 00050000',
      totalRecordsInSegment: 50000,
      failedRecordsCount: entity.unresolvedExceptions,
      status: entity.unresolvedExceptions > 0 ? 'Failed' : 'Resolved',
      errorCategory: entity.topErrorCategory,
      sampleFailedRecord: {
        primaryKey: 'REC-000142',
        recordData: {
          id: 'REC-000142',
          entityName: entity.sourceConnectorName,
          status: entity.status,
          latency: entity.p95LatencyMs,
        },
        validationError: entity.topErrorMessage,
        fieldViolations: ['Transient Network Jitter / Retry Queue'],
      },
    },
  ];
}

export const ConnectorErrorInspectionModal: React.FC<ConnectorErrorInspectionModalProps> = ({
  isOpen,
  onClose,
  entity,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'segments' | 'forecast'>('logs');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [selectedLogLevel, setSelectedLogLevel] = useState<'ALL' | 'CRITICAL' | 'ERROR' | 'WARNING'>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isRetryingSegment, setIsRetryingSegment] = useState<string | null>(null);
  const [retriedSuccessList, setRetriedSuccessList] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'drawer' | 'modal'>('drawer');

  // Logs and segments data memoized for this entity
  const errorLogs = useMemo(() => {
    if (!entity) return [];
    return generateErrorLogsForEntity(entity);
  }, [entity]);

  const affectedSegments = useMemo(() => {
    if (!entity) return [];
    return generateAffectedSegmentsForEntity(entity);
  }, [entity]);

  // Default select first segment
  React.useEffect(() => {
    if (affectedSegments.length > 0 && !selectedSegmentId) {
      setSelectedSegmentId(affectedSegments[0].segmentId);
    }
  }, [affectedSegments, selectedSegmentId]);

  // Filtered error logs
  const filteredLogs = useMemo(() => {
    return errorLogs.filter((log) => {
      if (selectedLogLevel !== 'ALL' && log.level !== selectedLogLevel) return false;
      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase();
        const matchesCode = log.errorCode.toLowerCase().includes(q);
        const matchesMsg = log.message.toLowerCase().includes(q);
        const matchesTarget = log.targetEntity.toLowerCase().includes(q);
        const matchesClass = log.exceptionClass.toLowerCase().includes(q);
        if (!matchesCode && !matchesMsg && !matchesTarget && !matchesClass) return false;
      }
      return true;
    });
  }, [errorLogs, selectedLogLevel, logSearchQuery]);

  const activeSegment = useMemo(() => {
    return affectedSegments.find((s) => s.segmentId === selectedSegmentId) || affectedSegments[0];
  }, [affectedSegments, selectedSegmentId]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleRetrySegment = (segmentId: string) => {
    setIsRetryingSegment(segmentId);
    setTimeout(() => {
      setIsRetryingSegment(null);
      setRetriedSuccessList((prev) => [...prev, segmentId]);
    }, 1200);
  };

  const handleExportJsonBundle = () => {
    if (!entity) return;
    const bundle = {
      pipelineId: entity.id,
      pipelineName: entity.pipelineName,
      source: entity.sourceConnectorName,
      target: entity.destConnectorName,
      exportTimestamp: new Date().toISOString(),
      predictiveImpactScore: entity.predictiveImpactScore,
      projectedDelayHours: entity.projectedDelayHours,
      errorLogs,
      affectedSegments,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-error-bundle-${entity.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !entity) return null;

  const isCritical = entity.status === 'Critical' || entity.errorRatePercent >= 5.0;
  const isWarning = !isCritical && (entity.status === 'Warning' || entity.errorRatePercent >= 2.0);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end transition-opacity duration-300"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, x: viewMode === 'drawer' ? 60 : 0, scale: viewMode === 'modal' ? 0.95 : 1 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: viewMode === 'drawer' ? 60 : 0, scale: viewMode === 'modal' ? 0.95 : 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white shadow-2xl flex flex-col overflow-hidden ${
          viewMode === 'drawer'
            ? 'h-full w-full max-w-3xl border-l border-slate-200'
            : 'm-auto h-[90vh] w-full max-w-5xl rounded-2xl border border-slate-200'
        }`}
      >
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/90 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 ${
                  isCritical
                    ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse-critical'
                    : isWarning
                    ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse-warning'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}
              >
                {(isCritical || isWarning) && (
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-rose-600' : 'bg-amber-600'}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isCritical ? 'bg-rose-600' : 'bg-amber-600'}`} />
                  </span>
                )}
                {entity.status.toUpperCase()} SEVERITY
              </span>

              {entity.isPrimaryBottleneck && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-rose-600 text-white border border-rose-700 shadow-2xs flex items-center gap-1 animate-pulse-critical">
                  <Flame className="w-3 h-3 text-amber-200 fill-current" />
                  <span>Primary Delay Bottleneck</span>
                </span>
              )}

              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-mono font-bold rounded border border-indigo-200 flex items-center gap-1">
                <Hourglass className="w-3 h-3 text-indigo-600" />
                <span>Predictive Impact: {entity.predictiveImpactScore}/100</span>
              </span>

              <span className="text-xs text-rose-600 font-mono font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                +{entity.projectedDelayHours}h Delay
              </span>
            </div>

            {/* Window control buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setViewMode(viewMode === 'drawer' ? 'modal' : 'drawer')}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title={viewMode === 'drawer' ? 'Expand to Centered Modal' : 'Dock as Side Drawer'}
              >
                {viewMode === 'drawer' ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleExportJsonBundle}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Export Diagnostic Log Bundle (.json)"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                id="close-heatmap-inspector-btn"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Close Inspector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Pipeline Details & Route */}
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600" />
              {entity.pipelineName}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono">
              <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                Source: {entity.sourceConnectorName}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                Target: {entity.destConnectorName}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-rose-600 font-bold">{entity.errorRatePercent}% Error Rate</span>
              <span className="text-slate-400">|</span>
              <span className="text-amber-600 font-bold">{entity.p95LatencyMs}ms P95</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">{entity.throughputRecSec.toLocaleString()} rec/s</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 pt-2 border-t border-slate-200/80">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Specific Error Logs ({errorLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('segments')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'segments'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Affected Record Segments ({affectedSegments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'forecast'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Hourglass className="w-3.5 h-3.5" />
              <span>Schedule Impact &amp; Remediation</span>
            </button>
          </div>
        </div>

        {/* Modal / Drawer Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: SPECIFIC ERROR LOGS STREAM */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Log Search & Severity Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="Search by error code, exception class, SQL table, or message..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {logSearchQuery && (
                    <button
                      onClick={() => setLogSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Severity:</span>
                  {(['ALL', 'CRITICAL', 'ERROR', 'WARNING'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLogLevel(lvl)}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                        selectedLogLevel === lvl
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logs List Table / Cards */}
              <div className="space-y-3">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const isCriticalLog = log.level === 'CRITICAL';
                  const isErrorLog = log.level === 'ERROR';

                  return (
                    <div
                      key={log.id}
                      className={`rounded-xl border transition-all ${
                        isCriticalLog
                          ? 'bg-rose-50/20 border-rose-200'
                          : isErrorLog
                          ? 'bg-amber-50/20 border-amber-200'
                          : 'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      <div
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-3.5 flex flex-col gap-2 cursor-pointer select-none"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${
                                isCriticalLog
                                  ? 'bg-rose-100 text-rose-700 border-rose-300'
                                  : isErrorLog
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-blue-100 text-blue-800 border-blue-200'
                              }`}
                            >
                              {log.level}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-900">{log.errorCode}</span>
                            {log.httpStatus && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded font-semibold">
                                HTTP {log.httpStatus}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                            <span>Latency: {log.latencyMs}ms</span>
                            <span>Retry: {log.retryAttempt}/{log.maxRetries}</span>
                            <span className="text-slate-400">{log.timestamp}</span>
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {/* Error Message summary */}
                        <div className="text-xs text-slate-800 font-mono bg-white/80 p-2 rounded-lg border border-slate-200/80 leading-relaxed">
                          {log.message}
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Target:</span>
                            <span className="text-indigo-600 font-semibold">{log.targetEntity}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Segment:</span>
                            <span className="text-slate-700 font-semibold">{log.affectedSegmentId}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details: Stack trace, Payload inspection */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-200/80 p-3.5 bg-slate-900 text-slate-200 rounded-b-xl space-y-3 text-xs font-mono overflow-hidden"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                <Code className="w-3.5 h-3.5 text-indigo-400" />
                                Exception Stack Trace &amp; Caller Frame:
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyText(log.stackTrace, log.id);
                                }}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedCodeId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedCodeId === log.id ? 'Copied' : 'Copy Trace'}</span>
                              </button>
                            </div>

                            <div className="p-3 bg-slate-950 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
                              {log.stackTrace}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                              <div>
                                <span className="text-slate-500">Exception Class: </span>
                                <span className="text-amber-400">{log.exceptionClass}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Primary Key Span: </span>
                                <span className="text-indigo-400">{log.recordKeyRange}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs font-mono">
                    No error logs matched the active query "{logSearchQuery}".
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AFFECTED RECORD SEGMENTS & PARTITION BATCHES */}
          {activeTab === 'segments' && (
            <div className="space-y-4">
              {/* Overview summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800">
                    {affectedSegments.length} Affected Migration Segments Identified
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-rose-600 font-bold">
                    {affectedSegments.reduce((s, a) => s + a.failedRecordsCount, 0).toLocaleString()} Total Failed Records
                  </span>
                </div>
              </div>

              {/* Segment Selector & Inspection Split Pane */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column: Segments List */}
                <div className="lg:col-span-5 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">Select Segment Batch</span>
                  {affectedSegments.map((segment) => {
                    const isSelected = selectedSegmentId === segment.segmentId;
                    const isRetriedSuccess = retriedSuccessList.includes(segment.segmentId);

                    return (
                      <div
                        key={segment.segmentId}
                        onClick={() => setSelectedSegmentId(segment.segmentId)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/50 border-indigo-400 shadow-2xs ring-1 ring-indigo-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono font-extrabold text-xs text-slate-900 truncate">
                            {segment.segmentId}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              isRetriedSuccess
                                ? 'bg-emerald-100 text-emerald-800'
                                : segment.status === 'Failed'
                                ? 'bg-rose-100 text-rose-700'
                                : segment.status === 'Retrying'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {isRetriedSuccess ? 'Resolved' : segment.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          Table: <strong className="text-slate-700">{segment.targetTable}</strong>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-100">
                          <span className="text-rose-600 font-bold">{segment.failedRecordsCount.toLocaleString()} failed</span>
                          <span>of {segment.totalRecordsInSegment.toLocaleString()} total</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: Segment Inspection Detail */}
                <div className="lg:col-span-7 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
                  {activeSegment ? (
                    <div className="space-y-4">
                      {/* Segment Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-900 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-indigo-600" />
                            {activeSegment.segmentId}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Partition: {activeSegment.partitionKey}
                          </div>
                        </div>

                        <button
                          onClick={() => handleRetrySegment(activeSegment.segmentId)}
                          disabled={isRetryingSegment === activeSegment.segmentId || retriedSuccessList.includes(activeSegment.segmentId)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                        >
                          {isRetryingSegment === activeSegment.segmentId ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Re-queuing...</span>
                            </>
                          ) : retriedSuccessList.includes(activeSegment.segmentId) ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Batch Retried</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Retry Segment Batch</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Segment Specs Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-400 uppercase">Target Schema Table</div>
                          <div className="font-bold text-slate-800 truncate">{activeSegment.targetTable}</div>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-400 uppercase">Record Offset Range</div>
                          <div className="font-bold text-slate-800">{activeSegment.recordOffset}</div>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-400 uppercase">Primary Key Span</div>
                          <div className="font-bold text-slate-800 truncate">{activeSegment.primaryKeyRange}</div>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-400 uppercase">Failure Root Cause</div>
                          <div className="font-bold text-rose-600 truncate">{activeSegment.errorCategory}</div>
                        </div>
                      </div>

                      {/* Sample Failed Record Payload Inspector */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5 font-mono">
                            <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                            Sample Failed Record Payload (PK: {activeSegment.sampleFailedRecord.primaryKey})
                          </span>
                          <button
                            onClick={() =>
                              handleCopyText(
                                JSON.stringify(activeSegment.sampleFailedRecord.recordData, null, 2),
                                activeSegment.segmentId
                              )
                            }
                            className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-600 text-[10px] font-mono rounded border border-slate-200 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedCodeId === activeSegment.segmentId ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedCodeId === activeSegment.segmentId ? 'Copied' : 'Copy JSON'}</span>
                          </button>
                        </div>

                        {/* Validation Errors flagged */}
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-mono text-rose-800 space-y-1">
                          <div className="font-bold text-rose-900">Validation Failure:</div>
                          <div>{activeSegment.sampleFailedRecord.validationError}</div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {activeSegment.sampleFailedRecord.fieldViolations.map((v, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-rose-200/80 text-rose-900 rounded text-[10px] font-bold">
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* JSON Viewer */}
                        <div className="p-3 bg-slate-950 rounded-lg text-emerald-400 font-mono text-[11px] max-h-56 overflow-y-auto whitespace-pre border border-slate-800">
                          {JSON.stringify(activeSegment.sampleFailedRecord.recordData, null, 2)}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOWNSTREAM SCHEDULE IMPACT & TOPOLOGY FORECAST */}
          {activeTab === 'forecast' && (
            <div className="space-y-4">
              {/* Big Predictive Impact Card */}
              <div className="p-4 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hourglass className="w-5 h-5 text-indigo-400" />
                    <span className="font-extrabold text-sm tracking-tight">Downstream Migration Delay Calculation</span>
                  </div>
                  <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full font-mono text-xs font-black">
                    +{entity.projectedDelayHours}h Schedule Slippage
                  </span>
                </div>

                <p className="text-xs text-indigo-200/90 leading-relaxed">
                  Based on the active error volume ({entity.errorRatePercent}%), unhandled retries ({entity.unresolvedExceptions} active exceptions), and P95 latency ({entity.p95LatencyMs}ms), downstream workers processing dependent staging schemas are experiencing queuing bottlenecks.
                </p>

                <div className="grid grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-xs">
                    <div className="text-[10px] text-indigo-300">Base Estimated Duration</div>
                    <div className="text-base font-black">{entity.baseEstimatedHours}h</div>
                  </div>
                  <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-lg">
                    <div className="text-[10px] text-rose-300">Projected Error Delay</div>
                    <div className="text-base font-black text-rose-400">+{entity.projectedDelayHours}h</div>
                  </div>
                  <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-xs">
                    <div className="text-[10px] text-indigo-300">Revised Total Timeframe</div>
                    <div className="text-base font-black text-amber-300">
                      {(entity.baseEstimatedHours + entity.projectedDelayHours).toFixed(1)}h
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Action Plan & Time Savings */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Recommended Remediation Strategy
                  </span>
                  <span className="font-mono font-bold text-emerald-800">{entity.remediationTimeSavings}</span>
                </div>
                <div className="text-xs text-emerald-900 leading-relaxed font-sans">
                  Apply adaptive thread-pool throttling and schema type coercion directly in the connector configuration settings to eliminate {entity.topErrorCategory} errors and recover schedule predictability.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateTab('error-center');
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Open Full Error Center</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-mono">
            Pipeline ID: <span className="font-semibold text-slate-700">{entity.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigateTab('error-center');
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Investigate in Error Center</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
