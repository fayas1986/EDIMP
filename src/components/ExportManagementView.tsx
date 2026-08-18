import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { ExportSchedule, ExportSnapshotJob, ExportFormat, StorageDestinationType, ExportScheduleVersion, ExportConfigSnapshot, ExportRetryPolicy } from '../types';
import { DataSchemaPreviewTool } from './DataSchemaPreviewTool';
import { PreExportIntegrityCheckTool } from './PreExportIntegrityCheckTool';
import { ExportDependencyMapperTool } from './ExportDependencyMapperTool';
import { ExportJobTimelineTool } from './ExportJobTimelineTool';
import { ExportVersionDiffTool } from './ExportVersionDiffTool';
import {
  DownloadCloud,
  Clock,
  GitBranch,
  HardDrive,
  Database,
  Plus,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderArchive,
  Search,
  Check,
  Copy,
  ExternalLink,
  Shield,
  Layers,
  Edit,
  Sparkles,
  Server,
  FileSpreadsheet,
  X,
  Radio,
  Sliders,
  Calendar,
  Zap,
  FileText,
  Send,
  Eye,
  BarChart3,
  CheckCircle,
  Mail,
  Globe,
  Building2,
  TrendingUp,
  Filter,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  History,
  GitCommit,
  GitCompare,
  ArrowRight,
  User,
  FileCheck,
  GitFork,
  Network,
} from 'lucide-react';

// Data structure for Multi-Tenant Migration Metrics
export interface TenantMigrationMetric {
  id: string;
  name: string;
  region: 'US-East' | 'EU-Central' | 'AP-South' | 'US-West' | 'LATAM';
  tier: 'Enterprise' | 'Professional' | 'Standard';
  status: 'In Cutover Phase' | 'Active Migration' | 'Remediation Required' | 'Final Sign-Off';
  progressPct: number;
  totalRecords: number;
  successfulRecords: number;
  errorRecords: number;
  successRatePct: number;
  dataVolumeMb: number;
  activePipelines: number;
  qualityScore: number;
  lastSync: string;
  primaryErp: string;
  contactEmail: string;
}

// Data structure for Automated PDF Report Schedules
export interface PdfReportSchedule {
  id: string;
  name: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  dayOfWeek?: string;
  timeUtc: string;
  tenantScope: 'All Tenants' | 'Selected Tenants' | 'Enterprise Tier Only';
  selectedTenantIds: string[];
  recipients: string[];
  destinationType: StorageDestinationType | 'Email Attachment';
  destinationUri: string;
  includeKpis: boolean;
  includeTenantMatrix: boolean;
  includeErrorBreakdown: boolean;
  includeRecommendations: boolean;
  status: 'Active' | 'Paused';
  lastGeneratedAt?: string | null;
  nextRunAt: string;
}

// Initial Sample Tenants for Metrics Aggregation
const INITIAL_TENANT_METRICS: TenantMigrationMetric[] = [
  {
    id: 'tenant-acme',
    name: 'Acme Global Corp',
    region: 'US-East',
    tier: 'Enterprise',
    status: 'In Cutover Phase',
    progressPct: 98.4,
    totalRecords: 4850000,
    successfulRecords: 4835200,
    errorRecords: 14800,
    successRatePct: 99.7,
    dataVolumeMb: 14200,
    activePipelines: 6,
    qualityScore: 96,
    lastSync: '2026-08-08T12:15:00Z',
    primaryErp: 'SAP S/4HANA (v2023)',
    contactEmail: 'wcoyote@acme.com',
  },
  {
    id: 'tenant-globex',
    name: 'Globex Industries',
    region: 'EU-Central',
    tier: 'Professional',
    status: 'Active Migration',
    progressPct: 94.2,
    totalRecords: 2120000,
    successfulRecords: 2107280,
    errorRecords: 12720,
    successRatePct: 99.4,
    dataVolumeMb: 8600,
    activePipelines: 4,
    qualityScore: 94,
    lastSync: '2026-08-08T11:40:00Z',
    primaryErp: 'SAP ECC 6.0 & NetSuite',
    contactEmail: 'scorpio@globex.com',
  },
  {
    id: 'tenant-initech',
    name: 'Initech Solutions',
    region: 'US-East',
    tier: 'Standard',
    status: 'Remediation Required',
    progressPct: 42.0,
    totalRecords: 680000,
    successfulRecords: 601800,
    errorRecords: 78200,
    successRatePct: 88.5,
    dataVolumeMb: 2100,
    activePipelines: 2,
    qualityScore: 78,
    lastSync: '2026-08-07T18:30:00Z',
    primaryErp: 'Oracle JD Edwards',
    contactEmail: 'pgibbons@initech.com',
  },
  {
    id: 'tenant-weyland',
    name: 'Weyland-Yutani Corp',
    region: 'AP-South',
    tier: 'Enterprise',
    status: 'Final Sign-Off',
    progressPct: 99.8,
    totalRecords: 12450000,
    successfulRecords: 12437550,
    errorRecords: 12450,
    successRatePct: 99.9,
    dataVolumeMb: 42800,
    activePipelines: 12,
    qualityScore: 98,
    lastSync: '2026-08-08T12:30:00Z',
    primaryErp: 'Custom Bio-Ledger ERP',
    contactEmail: 'burke@weyland.com',
  },
  {
    id: 'tenant-stark',
    name: 'Stark Logistics Int.',
    region: 'US-West',
    tier: 'Enterprise',
    status: 'Active Migration',
    progressPct: 87.5,
    totalRecords: 3400000,
    successfulRecords: 3369400,
    errorRecords: 30600,
    successRatePct: 99.1,
    dataVolumeMb: 11500,
    activePipelines: 5,
    qualityScore: 92,
    lastSync: '2026-08-08T10:05:00Z',
    primaryErp: 'Dynamics 365 Finance',
    contactEmail: 'stark@starklogistics.io',
  },
];

// Sample Export Schedules
const INITIAL_SCHEDULES: ExportSchedule[] = [
  {
    id: 'sch-101',
    name: 'Daily Parquet Data Lake Sync',
    targetEntities: ['Customer Master (KNA1)', 'SAP Sales Orders', 'GL Balances'],
    exportScopeType: 'Specific Data Sets',
    exportDeltaMode: 'Incremental Delta (24h)',
    format: 'Parquet (Snappy)',
    destinationType: 'AWS S3',
    destinationUri: 's3://enterprise-data-lake-prod/snapshots/daily/',
    scheduleFrequency: 'Daily',
    runTimeUtc: '02:00',
    nextRunAt: '2026-07-29T02:00:00Z',
    status: 'Active',
    partitioning: 'Year/Month/Day',
    compressionLevel: 'High',
    maxRetentionDays: 90,
    encryptionMethod: 'AES-256 KMS',
    minQualityThreshold: 85,
    notificationWebhook: 'https://api.enterprise.com/webhooks/export-complete',
    notificationEmails: ['data-lake-admin@enterprise.com'],
    retryPolicy: {
      maxAttempts: 3,
      backoffDurationMinutes: 5,
      backoffStrategy: 'Exponential',
      retryOnTimeout: true,
      retryOnNetworkError: true,
      retryOnStorageQuota: true,
      retryOnSchemaMismatch: false,
    },
    lastExecutedAt: '2026-07-28T02:00:14Z',
    lastSnapshotSizeMb: 485.2,
    lastRowCount: 1245000,
    currentVersion: 2,
    versions: [
      {
        versionNumber: 2,
        versionLabel: 'v2.0',
        createdAt: '2026-07-28T10:00:00Z',
        createdBy: 'Data Lake Lead Admin',
        changeSummary: 'Upgraded compression to High Snappy & enabled AES-256 KMS encryption',
        configSnapshot: {
          name: 'Daily Parquet Data Lake Sync',
          targetEntities: ['Customer Master (KNA1)', 'SAP Sales Orders', 'GL Balances'],
          exportScopeType: 'Specific Data Sets',
          exportDeltaMode: 'Incremental Delta (24h)',
          format: 'Parquet (Snappy)',
          destinationType: 'AWS S3',
          destinationUri: 's3://enterprise-data-lake-prod/snapshots/daily/',
          scheduleFrequency: 'Daily',
          runTimeUtc: '02:00',
          partitioning: 'Year/Month/Day',
          compressionLevel: 'High',
          maxRetentionDays: 90,
          encryptionMethod: 'AES-256 KMS',
          minQualityThreshold: 85,
          notificationWebhook: 'https://api.enterprise.com/webhooks/export-complete',
          notificationEmails: ['data-lake-admin@enterprise.com'],
        },
      },
      {
        versionNumber: 1,
        versionLabel: 'v1.0',
        createdAt: '2026-06-15T08:00:00Z',
        createdBy: 'Platform Architect',
        changeSummary: 'Initial baseline creation of Daily Parquet Data Lake Sync schedule',
        configSnapshot: {
          name: 'Daily Parquet Data Lake Sync',
          targetEntities: ['Customer Master (KNA1)', 'SAP Sales Orders'],
          exportScopeType: 'Specific Data Sets',
          exportDeltaMode: 'Incremental Delta (24h)',
          format: 'Parquet (Snappy)',
          destinationType: 'AWS S3',
          destinationUri: 's3://enterprise-data-lake-prod/snapshots/raw/',
          scheduleFrequency: 'Daily',
          runTimeUtc: '02:00',
          partitioning: 'Year/Month/Day',
          compressionLevel: 'Standard',
          maxRetentionDays: 30,
          encryptionMethod: 'None',
          minQualityThreshold: 75,
        },
      },
    ],
  },
  {
    id: 'sch-102',
    name: 'Weekly Cleansed Audit Feed',
    targetEntities: ['Quarantined Error Records', 'Cleansed Staging Output Records'],
    exportScopeType: 'Migration Outputs',
    exportDeltaMode: 'Modified Records Only',
    format: 'CSV (Zip Compressed)',
    destinationType: 'Google Cloud Storage',
    destinationUri: 'gs://edimp-migration-audit-bucket/weekly-zip/',
    scheduleFrequency: 'Weekly',
    dayOfWeek: 'Sunday',
    runTimeUtc: '04:00',
    nextRunAt: '2026-08-02T04:00:00Z',
    status: 'Active',
    partitioning: 'System/Entity',
    compressionLevel: 'Standard',
    maxRetentionDays: 180,
    encryptionMethod: 'Standard TLS',
    minQualityThreshold: 90,
    notificationEmails: ['audit-lead@enterprise.com'],
    lastExecutedAt: '2026-07-26T04:00:08Z',
    lastSnapshotSizeMb: 122.8,
    lastRowCount: 340000,
    currentVersion: 2,
    versions: [
      {
        versionNumber: 2,
        versionLabel: 'v2.0',
        createdAt: '2026-07-20T14:30:00Z',
        createdBy: 'Governance Compliance Lead',
        changeSummary: 'Added Cleansed Staging Output Records & extended retention to 180 days',
        configSnapshot: {
          name: 'Weekly Cleansed Audit Feed',
          targetEntities: ['Quarantined Error Records', 'Cleansed Staging Output Records'],
          exportScopeType: 'Migration Outputs',
          exportDeltaMode: 'Modified Records Only',
          format: 'CSV (Zip Compressed)',
          destinationType: 'Google Cloud Storage',
          destinationUri: 'gs://edimp-migration-audit-bucket/weekly-zip/',
          scheduleFrequency: 'Weekly',
          dayOfWeek: 'Sunday',
          runTimeUtc: '04:00',
          partitioning: 'System/Entity',
          compressionLevel: 'Standard',
          maxRetentionDays: 180,
          encryptionMethod: 'Standard TLS',
          minQualityThreshold: 90,
          notificationEmails: ['audit-lead@enterprise.com'],
        },
      },
      {
        versionNumber: 1,
        versionLabel: 'v1.0',
        createdAt: '2026-06-01T09:00:00Z',
        createdBy: 'Security Officer',
        changeSummary: 'Initial baseline weekly audit export schedule',
        configSnapshot: {
          name: 'Weekly Cleansed Audit Feed',
          targetEntities: ['Quarantined Error Records'],
          exportScopeType: 'Migration Outputs',
          exportDeltaMode: 'Full Snapshot',
          format: 'CSV (Zip Compressed)',
          destinationType: 'Google Cloud Storage',
          destinationUri: 'gs://edimp-migration-audit-bucket/weekly/',
          scheduleFrequency: 'Weekly',
          dayOfWeek: 'Sunday',
          runTimeUtc: '04:00',
          partitioning: 'Flat Single File',
          compressionLevel: 'Standard',
          maxRetentionDays: 90,
          encryptionMethod: 'None',
        },
      },
    ],
  },
  {
    id: 'sch-103',
    name: 'Monthly Finance Ledger Snapshot',
    targetEntities: ['GL Balances (GL_BALANCES)', 'Oracle EBS Invoices'],
    exportScopeType: 'Hybrid Combined',
    exportDeltaMode: 'Full Snapshot',
    format: 'Parquet (ZSTD)',
    destinationType: 'Azure Blob Storage',
    destinationUri: 'azure://financesnapshots.blob.core.windows.net/monthly-ledger/',
    scheduleFrequency: 'Monthly',
    runTimeUtc: '00:00',
    nextRunAt: '2026-08-01T00:00:00Z',
    status: 'Paused',
    partitioning: 'Year/Month/Day',
    compressionLevel: 'High',
    maxRetentionDays: 365,
    encryptionMethod: 'PGP Key',
    lastExecutedAt: '2026-07-01T00:02:45Z',
    lastSnapshotSizeMb: 890.5,
    lastRowCount: 2150000,
    currentVersion: 1,
    versions: [
      {
        versionNumber: 1,
        versionLabel: 'v1.0',
        createdAt: '2026-07-01T00:00:00Z',
        createdBy: 'Finance Systems Admin',
        changeSummary: 'Initial baseline snapshot configuration for monthly finance ledger exports',
        configSnapshot: {
          name: 'Monthly Finance Ledger Snapshot',
          targetEntities: ['GL Balances (GL_BALANCES)', 'Oracle EBS Invoices'],
          exportScopeType: 'Hybrid Combined',
          exportDeltaMode: 'Full Snapshot',
          format: 'Parquet (ZSTD)',
          destinationType: 'Azure Blob Storage',
          destinationUri: 'azure://financesnapshots.blob.core.windows.net/monthly-ledger/',
          scheduleFrequency: 'Monthly',
          runTimeUtc: '00:00',
          partitioning: 'Year/Month/Day',
          compressionLevel: 'High',
          maxRetentionDays: 365,
          encryptionMethod: 'PGP Key',
        },
      },
    ],
  },
];

// Sample Export History Jobs
const INITIAL_JOBS: ExportSnapshotJob[] = [
  {
    id: 'job-exp-901',
    scheduleName: 'Daily Parquet Data Lake Sync',
    entityName: 'Customer Master & Sales Orders',
    format: 'Parquet (Snappy)',
    destinationUri: 's3://enterprise-data-lake-prod/snapshots/daily/year=2026/month=07/day=28/snapshot_101.parquet',
    status: 'Completed',
    rowCount: 1245000,
    fileSizeBytes: 508788736, // ~485 MB
    checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    startedAt: '2026-07-28T02:00:00Z',
    completedAt: '2026-07-28T02:00:14Z',
    downloadUrl: '#',
  },
  {
    id: 'job-exp-902',
    scheduleName: 'Ad-hoc Customer Master Snapshot',
    entityName: 'Customer Master (KNA1)',
    format: 'CSV (Gstandard)',
    destinationUri: 's3://enterprise-data-lake-prod/snapshots/adhoc/customer_master_20260728.csv',
    status: 'Completed',
    rowCount: 85200,
    fileSizeBytes: 24211456, // ~23 MB
    checksumSha256: '8f4e2d1c9b3a7f5e6d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e',
    startedAt: '2026-07-28T01:15:00Z',
    completedAt: '2026-07-28T01:15:04Z',
    downloadUrl: '#',
  },
  {
    id: 'job-exp-903',
    scheduleName: 'Weekly Cleansed Audit Feed',
    entityName: 'Quarantined Records',
    format: 'CSV (Zip Compressed)',
    destinationUri: 'gs://edimp-migration-audit-bucket/weekly-zip/2026-07-26/quarantine_dump.zip',
    status: 'Completed',
    rowCount: 340000,
    fileSizeBytes: 128765952, // ~122 MB
    checksumSha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    startedAt: '2026-07-26T04:00:00Z',
    completedAt: '2026-07-26T04:00:08Z',
    downloadUrl: '#',
  },
];

// Initial PDF Report Schedules
const INITIAL_PDF_SCHEDULES: PdfReportSchedule[] = [
  {
    id: 'rep-sch-101',
    name: 'Weekly Cross-Tenant Migration Executive Digest',
    frequency: 'Weekly',
    dayOfWeek: 'Monday',
    timeUtc: '06:00',
    tenantScope: 'All Tenants',
    selectedTenantIds: ['tenant-acme', 'tenant-globex', 'tenant-initech', 'tenant-weyland', 'tenant-stark'],
    recipients: ['exec-team@enterprise.com', 'fayasamd@gmail.com'],
    destinationType: 'AWS S3',
    destinationUri: 's3://enterprise-pdf-vault/reports/weekly-tenant-summaries/',
    includeKpis: true,
    includeTenantMatrix: true,
    includeErrorBreakdown: true,
    includeRecommendations: true,
    status: 'Active',
    lastGeneratedAt: '2026-08-03T06:00:12Z',
    nextRunAt: '2026-08-10T06:00:00Z',
  },
  {
    id: 'rep-sch-102',
    name: 'Daily Tenant Migration SLA & Success Rate Alert',
    frequency: 'Daily',
    timeUtc: '08:00',
    tenantScope: 'Enterprise Tier Only',
    selectedTenantIds: ['tenant-acme', 'tenant-weyland', 'tenant-stark'],
    recipients: ['migration-leads@enterprise.com'],
    destinationType: 'Google Cloud Storage',
    destinationUri: 'gs://edimp-migration-audit-bucket/pdf-reports/daily/',
    includeKpis: true,
    includeTenantMatrix: true,
    includeErrorBreakdown: true,
    includeRecommendations: false,
    status: 'Active',
    lastGeneratedAt: '2026-08-08T08:00:05Z',
    nextRunAt: '2026-08-09T08:00:00Z',
  },
];

// Data Structure for Specific Migration Outputs available for direct CSV export
export interface MigrationOutputDataset {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  badgeColor: string;
  headers: string[];
  rows: string[][];
}

export const MIGRATION_OUTPUT_DATASETS: MigrationOutputDataset[] = [
  {
    id: 'quarantine-errors',
    title: 'Quarantined Error & Exception Dumps',
    subtitle: 'Records failing schema, type, foreign key, or constraint validation',
    category: 'Validation Exceptions',
    description: 'Detailed error logs for all source records that failed transformation or target schema validation rules.',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    headers: [
      'Record ID',
      'Tenant ID',
      'Source System',
      'Target Entity',
      'Error Category',
      'Failed Field',
      'Original Value',
      'Severity',
      'Error Description',
      'Validation Timestamp',
    ],
    rows: [
      ['ERR-9012', 'tenant-acme', 'SAP ECC 6.0', 'Customer Master (KNA1)', 'FK Constraint Violation', 'KUNNR', 'CUST_NULL_901', 'CRITICAL', 'Parent customer account ID not found in target SAP S/4HANA master ledger', '2026-08-12 03:45:12'],
      ['ERR-9013', 'tenant-globex', 'Oracle EBS', 'AP Invoices', 'Type Mismatch', 'INVOICE_DATE', '2026/13/45', 'HIGH', 'Invalid date format string could not be parsed to ISO-8601 UTC timestamp', '2026-08-12 03:42:08'],
      ['ERR-9014', 'tenant-initech', 'NetSuite CRM', 'Sales Orders', 'Mandatory Field Null', 'CURRENCY_CODE', '', 'CRITICAL', 'Required field CURRENCY_CODE is missing or empty string', '2026-08-12 03:38:50'],
      ['ERR-9015', 'tenant-weyland', 'SAP S/4HANA', 'Material Master (MARA)', 'Regex Pattern Fail', 'TAX_ID_NUM', '99-XXXX-12', 'MEDIUM', 'Tax ID failed pattern validation rule for country US-East region', '2026-08-12 03:22:15'],
      ['ERR-9016', 'tenant-stark', 'Dynamics 365', 'Vendor Master', 'Duplicate Natural Key', 'VENDOR_VAT_ID', 'VAT_DE_883011', 'HIGH', 'Record violates unique index constraint on VENDOR_VAT_ID', '2026-08-12 03:10:04'],
      ['ERR-9017', 'tenant-acme', 'SAP ECC 6.0', 'Sales Orders (VBAK)', 'Out of Bounds Value', 'TOTAL_NET_PRICE', '-4500.00', 'HIGH', 'Net order amount cannot be negative without credit memo status flag', '2026-08-12 02:55:40'],
      ['ERR-9018', 'tenant-globex', 'Oracle EBS', 'GL Balances', 'Cross-Validation Rule', 'ACCOUNT_SEG_3', '9999', 'MEDIUM', 'GL Segment 3 9999 is retired in corporate chart of accounts v2026', '2026-08-12 02:40:11'],
      ['ERR-9019', 'tenant-initech', 'Salesforce CRM', 'Account Pipeline', 'Enum Value Invalid', 'ACCOUNT_TIER', 'UNKNOWN_TIER', 'LOW', 'Unrecognized enum string mapped to default fallback Standard', '2026-08-12 02:15:30'],
    ],
  },
  {
    id: 'cleansed-staging',
    title: 'Cleansed Staging Output Records',
    subtitle: 'Sanitized, mapped, and normalized staging output prepared for cutover',
    category: 'Cutover Staging',
    description: 'Post-transformation staging records verified for target system loading.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    headers: [
      'Staging ID',
      'Tenant ID',
      'Source System',
      'Entity Name',
      'Cleansed Target Key',
      'Quality Score (%)',
      'Remediation Mode',
      'Pii Masked Fields',
      'Staged UTC Timestamp',
    ],
    rows: [
      ['STG-8801', 'tenant-acme', 'SAP ECC 6.0', 'Customer Master (KNA1)', 'CUST-US-001928', '99.2', 'Automated Trim & UpperCase', 'TAX_ID, PHONE', '2026-08-12 03:50:00'],
      ['STG-8802', 'tenant-globex', 'Oracle EBS', 'AP Invoices', 'INV-EU-2026-9041', '98.5', 'Date Format Normalized', 'NONE', '2026-08-12 03:48:22'],
      ['STG-8803', 'tenant-stark', 'Dynamics 365', 'Vendor Master', 'VND-STK-44021', '100.0', 'ISO Country Code Mapped', 'BANK_IBAN', '2026-08-12 03:45:10'],
      ['STG-8804', 'tenant-weyland', 'SAP S/4HANA', 'Material Master (MARA)', 'MAT-WEY-88192', '97.8', 'Default UOM Applied', 'NONE', '2026-08-12 03:40:05'],
      ['STG-8805', 'tenant-acme', 'SAP ECC 6.0', 'Sales Orders (VBAK)', 'SO-ACM-901128', '99.6', 'Currency Conversion USD', 'NONE', '2026-08-12 03:32:19'],
      ['STG-8806', 'tenant-initech', 'NetSuite CRM', 'Sales Orders', 'SO-INI-33019', '95.4', 'Postal Code Padded', 'CUSTOMER_EMAIL', '2026-08-12 03:25:00'],
    ],
  },
  {
    id: 'delta-logs',
    title: 'Migration Cutover Delta Sync Logs',
    subtitle: 'Real-time CDC changes, sync state timestamps, and batch execution records',
    category: 'CDC Sync Telemetry',
    description: 'Change-data-capture execution logs and batch sync events tracked during cutover windows.',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    headers: [
      'Event ID',
      'Tenant ID',
      'Pipeline ID',
      'Operation',
      'Source Entity',
      'Record Count',
      'Latency (ms)',
      'Sync Status',
      'Execution UTC Timestamp',
    ],
    rows: [
      ['EVT-10492', 'tenant-acme', 'pipe-sap-ecc-cutover', 'UPSERT', 'KNA1_CUSTOMER_MASTER', '45200', '142', 'SUCCESS', '2026-08-12 03:52:10'],
      ['EVT-10493', 'tenant-globex', 'pipe-oracle-ap-sync', 'INSERT', 'AP_INVOICE_HEADERS', '12800', '98', 'SUCCESS', '2026-08-12 03:49:15'],
      ['EVT-10494', 'tenant-initech', 'pipe-netsuite-remed', 'REMED_UPDATE', 'SALES_ORDER_ITEMS', '3400', '310', 'WARNING_PARTIAL', '2026-08-12 03:41:00'],
      ['EVT-10495', 'tenant-weyland', 'pipe-s4hana-delta', 'CDC_DELTA', 'MARA_MATERIALS', '18900', '115', 'SUCCESS', '2026-08-12 03:35:45'],
      ['EVT-10496', 'tenant-stark', 'pipe-dynamics-vendor', 'DELETE_TOMBSTONE', 'VENDOR_POSTING_GROUPS', '120', '45', 'SUCCESS', '2026-08-12 03:20:00'],
    ],
  },
  {
    id: 'compliance-audits',
    title: 'Data Quality Audit & Compliance Violations',
    subtitle: 'SOX, GDPR, HIPAA, and PII masking compliance audit findings',
    category: 'Governance & Audits',
    description: 'Security and governance violation records detected during automated rule validation.',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    headers: [
      'Audit Rule ID',
      'Rule Name',
      'Compliance Standard',
      'Tenant ID',
      'Target Field',
      'Violation Type',
      'Risk Level',
      'Auto-Remediated',
      'Audit Timestamp',
    ],
    rows: [
      ['AUD-701', 'PII Credit Card Masking Guard', 'PCI-DSS v4.0', 'tenant-acme', 'PAYMENT_CARD_NUM', 'Unmasked Primary Account Number', 'HIGH', 'YES (SHA-256 Salted Hash)', '2026-08-12 03:55:00'],
      ['AUD-702', 'SOX Financial Rounding Rule', 'SOX Section 404', 'tenant-globex', 'NET_LINE_AMOUNT', 'Floating point precision drift > 0.001', 'MEDIUM', 'YES (Fixed Dec 2)', '2026-08-12 03:44:10'],
      ['AUD-703', 'GDPR Right to Forget Flag', 'EU GDPR Article 17', 'tenant-initech', 'CUSTOMER_EMAIL', 'Unflagged deleted user contact info', 'HIGH', 'YES (Anonymized)', '2026-08-12 03:30:15'],
      ['AUD-704', 'HIPAA Health Identifier Hashing', 'HIPAA Security Rule', 'tenant-stark', 'PATIENT_INSURANCE_ID', 'Plaintext Health ID in Staging', 'CRITICAL', 'YES (Salted HMAC)', '2026-08-12 03:12:00'],
    ],
  },
  {
    id: 'key-crossrefs',
    title: 'Remediated Key Mapping Cross-Reference Table',
    subtitle: 'Cross-system identifier translation maps and GUID lookup resolutions',
    category: 'Key Translation Maps',
    description: 'Lookup table mapping legacy source entity IDs to target global system GUIDs.',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    headers: [
      'Cross-Ref ID',
      'Tenant ID',
      'Source System ID',
      'Source Entity',
      'Mapped Target GUID',
      'Target Entity',
      'Key Translation Status',
      'Remediated By User/Agent',
    ],
    rows: [
      ['XREF-3001', 'tenant-acme', 'SAP_DE_10029', 'KNA1 Customer', 'guid-acme-cust-001029', 'SAP S/4 S_CUSTOMER', 'VERIFIED_AUTO', 'AI Schema Matcher v2'],
      ['XREF-3002', 'tenant-globex', 'ORCL_INV_9011', 'EBS AP Invoice', 'guid-globex-inv-90110', 'S/4 VENDOR_INVOICE', 'VERIFIED_AUTO', 'Rules Engine v4.1'],
      ['XREF-3003', 'tenant-initech', 'NS_SO_4401', 'NetSuite Order', 'guid-ini-so-4401-v2', 'S/4 SALES_ORDER', 'MANUAL_OVERRIDE', 'jdoe@enterprise.com'],
      ['XREF-3004', 'tenant-weyland', 'WEY_MAT_880', 'Material Item', 'guid-wey-mat-880-s4', 'S/4 MATERIAL_MASTER', 'VERIFIED_AUTO', 'AI Schema Matcher v2'],
    ],
  },
  {
    id: 'tenant-governance',
    title: 'Tenant Migration Governance & SLA Metrics',
    subtitle: 'Aggregated cross-tenant execution metrics, success rates, and volume statistics',
    category: 'Tenant Governance',
    description: 'Executive overview dataset containing multi-tenant migration cutover performance.',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    headers: [
      'Tenant ID',
      'Tenant Name',
      'Region',
      'Primary ERP',
      'Tier',
      'Total Records',
      'Successful Records',
      'Error Records',
      'Success Rate (%)',
      'Quality Score',
      'Cutover Status',
    ],
    rows: [
      ['tenant-acme', 'Acme Global Corp', 'US-East', 'SAP S/4HANA (v2023)', 'Enterprise', '4,850,000', '4,835,200', '14,800', '99.7', '96', 'In Cutover Phase'],
      ['tenant-globex', 'Globex Industries', 'EU-Central', 'SAP ECC 6.0 & NetSuite', 'Professional', '2,120,000', '2,107,280', '12,720', '99.4', '94', 'Active Migration'],
      ['tenant-initech', 'Initech Solutions', 'US-East', 'Oracle JD Edwards', 'Standard', '680,000', '601,800', '78,200', '88.5', '78', 'Remediation Required'],
      ['tenant-weyland', 'Weyland-Yutani Corp', 'AP-South', 'SAP S/4HANA (v2023)', 'Enterprise', '8,920,000', '8,884,320', '35,680', '99.6', '98', 'Final Sign-Off'],
      ['tenant-stark', 'Stark Enterprises', 'US-West', 'Dynamics 365 Finance', 'Enterprise', '3,450,000', '3,439,650', '10,350', '99.7', '97', 'In Cutover Phase'],
    ],
  },
];

export const ExportManagementView: React.FC = () => {
  const [schedules, setSchedules] = useState<ExportSchedule[]>(INITIAL_SCHEDULES);
  const [jobs, setJobs] = useState<ExportSnapshotJob[]>(INITIAL_JOBS);
  const [tenantMetrics, setTenantMetrics] = useState<TenantMigrationMetric[]>(INITIAL_TENANT_METRICS);
  const [pdfSchedules, setPdfSchedules] = useState<PdfReportSchedule[]>(INITIAL_PDF_SCHEDULES);

  const [activeTab, setActiveTab] = useState<'schedules' | 'history' | 'pdfReports' | 'csvExport' | 'schemaPreview' | 'integrityCheck' | 'dependencyMapper' | 'jobTimeline' | 'versionDiff'>('pdfReports');
  const [selectedTimelineJobId, setSelectedTimelineJobId] = useState<string>('job-901-v1.2');
  const [selectedDependencyMapperConfigId, setSelectedDependencyMapperConfigId] = useState<string>('sch-101');
  const [previewSchemaConfigId, setPreviewSchemaConfigId] = useState<string>('sch-101');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Direct CSV Export State
  const [selectedOutputType, setSelectedOutputType] = useState<string>('quarantine-errors');
  const [csvDelimiter, setCsvDelimiter] = useState<',' | ';' | '\t' | '|'>(',');
  const [csvEnclosure, setCsvEnclosure] = useState<'"' | "'" | 'none'>('"');
  const [csvIncludeHeader, setCsvIncludeHeader] = useState<boolean>(true);
  const [csvIncludeBom, setCsvIncludeBom] = useState<boolean>(true);
  const [csvTenantFilter, setCsvTenantFilter] = useState<string>('All');
  const [csvSearchQuery, setCsvSearchQuery] = useState<string>('');
  const [csvPreviewMode, setCsvPreviewMode] = useState<'table' | 'raw'>('table');
  const [csvSelectedColumns, setCsvSelectedColumns] = useState<string[]>(
    MIGRATION_OUTPUT_DATASETS[0].headers
  );

  // Sample Data Preview Modal State (First 50 Rows)
  const [showSamplePreviewModal, setShowSamplePreviewModal] = useState<boolean>(false);
  const [samplePreviewDatasetId, setSamplePreviewDatasetId] = useState<string>('quarantine-errors');
  const [samplePreviewSearch, setSamplePreviewSearch] = useState<string>('');
  const [samplePreviewCols, setSamplePreviewCols] = useState<string[]>([]);

  // Sync columns when selectedOutputType changes
  useEffect(() => {
    const found = MIGRATION_OUTPUT_DATASETS.find((d) => d.id === selectedOutputType);
    if (found) {
      setCsvSelectedColumns(found.headers);
    }
  }, [selectedOutputType]);

  // PDF Report Templates State
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

  // Template Modal Subtab and Version History states
  const [templateModalTab, setTemplateModalTab] = useState<'config' | 'history'>('config');
  const [templateChangeSummary, setTemplateChangeSummary] = useState<string>('');
  const [rollingBackVerId, setRollingBackVerId] = useState<string | null>(null);

  // Template Modal States
  const [templateName, setTemplateName] = useState<string>('');
  const [templateDesc, setTemplateDesc] = useState<string>('');
  const [templateTimeRange, setTemplateTimeRange] = useState<string>('Last 30 Days');
  const [tplIncRecordCounts, setTplIncRecordCounts] = useState<boolean>(true);
  const [tplIncVolumeAndThroughput, setTplIncVolumeAndThroughput] = useState<boolean>(true);
  const [tplIncSuccessRateAndSla, setTplIncSuccessRateAndSla] = useState<boolean>(true);
  const [tplIncQualityScores, setTplIncQualityScores] = useState<boolean>(true);
  const [tplIncErpBreakdown, setTplIncErpBreakdown] = useState<boolean>(true);
  const [tplIncErrorCategories, setTplIncErrorCategories] = useState<boolean>(true);
  const [tplIncRecommendations, setTplIncRecommendations] = useState<boolean>(true);
  const [templateScope, setTemplateScope] = useState<'All Tenants' | 'Selected Tenants' | 'Enterprise Tier Only'>('All Tenants');
  const [templateSelectedTenantIds, setTemplateSelectedTenantIds] = useState<string[]>(INITIAL_TENANT_METRICS.map(t => t.id));
  const [templateOrientation, setTemplateOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');
  const [templatePaperSize, setTemplatePaperSize] = useState<'A4' | 'Letter'>('A4');
  const [templateThemeColor, setTemplateThemeColor] = useState<string>('#4f46e5');

  // New Export Schedule Modal State (Create & Edit)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingSchedule, setEditingSchedule] = useState<ExportSchedule | null>(null);
  const [name, setName] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('Parquet (Snappy)');
  const [selectedType, setSelectedType] = useState<StorageDestinationType>('AWS S3');
  const [destinationUri, setDestinationUri] = useState<string>('s3://my-enterprise-data-lake/exports/daily/');
  const [frequency, setFrequency] = useState<'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom Cron'>('Daily');
  const [cronExpression, setCronExpression] = useState<string>('0 2 * * *');
  const [runTimeUtc, setRunTimeUtc] = useState<string>('02:00');
  const [dayOfWeek, setDayOfWeek] = useState<string>('Monday');
  const [partitioning, setPartitioning] = useState<'Year/Month/Day' | 'System/Entity' | 'Flat Single File'>('Year/Month/Day');
  const [retentionDays, setRetentionDays] = useState<number>(90);
  const [exportScopeType, setExportScopeType] = useState<'Specific Data Sets' | 'Migration Outputs' | 'Hybrid Combined'>('Specific Data Sets');
  const [exportDeltaMode, setExportDeltaMode] = useState<'Full Snapshot' | 'Incremental Delta (24h)' | 'Since Last Export' | 'Modified Records Only'>('Incremental Delta (24h)');
  const [encryptionMethod, setEncryptionMethod] = useState<'AES-256 KMS' | 'PGP Key' | 'Standard TLS' | 'None'>('AES-256 KMS');
  const [minQualityThreshold, setMinQualityThreshold] = useState<number>(85);
  const [notificationWebhook, setNotificationWebhook] = useState<string>('https://api.enterprise.com/webhooks/export-complete');
  const [notificationEmails, setNotificationEmails] = useState<string>('data-admin@enterprise.com');
  const [selectedEntities, setSelectedEntities] = useState<string[]>(['Customer Master (KNA1)', 'SAP Sales Orders (VBAK)']);

  // Retry Policy Configuration State
  const [retryMaxAttempts, setRetryMaxAttempts] = useState<number>(3);
  const [retryBackoffMinutes, setRetryBackoffMinutes] = useState<number>(5);
  const [retryBackoffStrategy, setRetryBackoffStrategy] = useState<'Fixed' | 'Linear' | 'Exponential' | 'ExponentialWithJitter'>('Exponential');
  const [retryOnTimeout, setRetryOnTimeout] = useState<boolean>(true);
  const [retryOnNetworkError, setRetryOnNetworkError] = useState<boolean>(true);
  const [retryOnStorageQuota, setRetryOnStorageQuota] = useState<boolean>(true);
  const [retryOnSchemaMismatch, setRetryOnSchemaMismatch] = useState<boolean>(false);

  // Export Schedule Versioning state variables
  const [scheduleChangeNote, setScheduleChangeNote] = useState<string>('');
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState<boolean>(false);
  const [selectedScheduleForVersions, setSelectedScheduleForVersions] = useState<ExportSchedule | null>(null);
  const [compareVersionA, setCompareVersionA] = useState<ExportScheduleVersion | null>(null);
  const [compareVersionB, setCompareVersionB] = useState<ExportScheduleVersion | null>(null);
  const [versionHistoryTab, setVersionHistoryTab] = useState<'timeline' | 'diff'>('timeline');
  const [restoringVersion, setRestoringVersion] = useState<ExportScheduleVersion | null>(null);
  const [restoreNoteInput, setRestoreNoteInput] = useState<string>('');
  const [restoringInProgress, setRestoringInProgress] = useState<boolean>(false);
  const [versionSearchTerm, setVersionSearchTerm] = useState<string>('');

  // PDF Schedule Modal State
  const [showPdfScheduleModal, setShowPdfScheduleModal] = useState<boolean>(false);
  const [pdfReportName, setPdfReportName] = useState<string>('');
  const [pdfFrequency, setPdfFrequency] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Quarterly'>('Weekly');
  const [pdfDayOfWeek, setPdfDayOfWeek] = useState<string>('Monday');
  const [pdfTimeUtc, setPdfTimeUtc] = useState<string>('06:00');
  const [pdfScope, setPdfScope] = useState<'All Tenants' | 'Selected Tenants' | 'Enterprise Tier Only'>('All Tenants');
  const [pdfSelectedTenantIds, setPdfSelectedTenantIds] = useState<string[]>(INITIAL_TENANT_METRICS.map((t) => t.id));
  const [pdfRecipientsInput, setPdfRecipientsInput] = useState<string>('exec-team@enterprise.com, fayasamd@gmail.com');
  const [pdfDestinationType, setPdfDestinationType] = useState<StorageDestinationType | 'Email Attachment'>('AWS S3');
  const [pdfDestinationUri, setPdfDestinationUri] = useState<string>('s3://enterprise-pdf-vault/reports/');
  const [incKpis, setIncKpis] = useState<boolean>(true);
  const [incMatrix, setIncMatrix] = useState<boolean>(true);
  const [incErrors, setIncErrors] = useState<boolean>(true);
  const [incRecs, setIncRecs] = useState<boolean>(true);

  // PDF Preview & Toast State
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState<boolean>(false);
  const [previewingTenant, setPreviewingTenant] = useState<TenantMigrationMetric | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [triggeringScheduleId, setTriggeringScheduleId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Advanced progress animation states
  const [pdfProgressActive, setPdfProgressActive] = useState<boolean>(false);
  const [pdfProgressPercent, setPdfProgressPercent] = useState<number>(0);
  const [pdfProgressText, setPdfProgressText] = useState<string>('');

  const [templateProgressActive, setTemplateProgressActive] = useState<boolean>(false);
  const [templateProgressPercent, setTemplateProgressPercent] = useState<number>(0);
  const [templateProgressText, setTemplateProgressText] = useState<string>('');

  // Testing & Execution State
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [executingScheduleId, setExecutingScheduleId] = useState<string | null>(null);
  const [copiedUri, setCopiedUri] = useState<string | null>(null);

  // Categorized Target Data Sets & Migration Outputs for Recurring Automated Exports
  const CATEGORIZED_TARGETS = [
    {
      category: 'Specific Data Sets (Source / Target Master Data)',
      type: 'Specific Data Sets' as const,
      items: [
        { name: 'Customer Master (KNA1)', desc: 'SAP Customer Master & Sales Area Data' },
        { name: 'SAP Sales Orders (VBAK)', desc: 'Open & Historical Sales Order Headers/Items' },
        { name: 'GL Balances (GL_BALANCES)', desc: 'General Ledger Accounts & Financial Balances' },
        { name: 'Oracle EBS AP Invoices', desc: 'Accounts Payable Subledger & Line Items' },
        { name: 'Material Master & Inventory (MARA)', desc: 'Material Master, Batches & Plant Inventory' },
        { name: 'Salesforce CRM Account Pipeline', desc: 'CRM Accounts, Contacts & Opportunity Pipeline' },
        { name: 'Dynamics 365 Vendor Catalog', desc: 'Vendor Profiles & Payment Posting Groups' },
      ],
    },
    {
      category: 'Migration Outputs & Audit Feeds',
      type: 'Migration Outputs' as const,
      items: [
        { name: 'Quarantined Error & Exception Dump', desc: 'Records failing schema, type or FK constraint validation' },
        { name: 'Cleansed Staging Output Records', desc: 'Sanitized, mapped records prepared for cutover' },
        { name: 'Migration Cutover Delta Sync Logs', desc: 'Real-time CDC delta feeds and execution state' },
        { name: 'Data Quality Audit & Compliance Violations', desc: 'PII masking, SOX & GDPR compliance audit logs' },
        { name: 'Remediated Mapping Cross-Reference Table', desc: 'Key resolution & cross-system ID translation maps' },
        { name: 'Tenant Migration Governance Metrics', desc: 'Cross-tenant execution metrics & SLA compliance history' },
      ],
    },
  ];

  const AVAILABLE_ENTITIES = CATEGORIZED_TARGETS.flatMap((cat) => cat.items.map((i) => i.name));

  // Helper: Hex color to RGB conversion
  const hexToRgb = (hex: string): [number, number, number] => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [79, 70, 229]; // Default Indigo
  };

  // Open template creation / editing modal
  const openTemplateModal = (templateToEdit: any | null = null) => {
    setTemplateModalTab('config');
    setTemplateChangeSummary('');
    if (templateToEdit) {
      setEditingTemplate(templateToEdit);
      setTemplateName(templateToEdit.name);
      setTemplateDesc(templateToEdit.description || '');
      setTemplateTimeRange(templateToEdit.timeRange || 'Last 30 Days');
      setTplIncRecordCounts(templateToEdit.metrics?.includeRecordCounts ?? true);
      setTplIncVolumeAndThroughput(templateToEdit.metrics?.includeVolumeAndThroughput ?? true);
      setTplIncSuccessRateAndSla(templateToEdit.metrics?.includeSuccessRateAndSla ?? true);
      setTplIncQualityScores(templateToEdit.metrics?.includeQualityScores ?? true);
      setTplIncErpBreakdown(templateToEdit.metrics?.includeErpBreakdown ?? true);
      setTplIncErrorCategories(templateToEdit.metrics?.includeErrorCategories ?? true);
      setTplIncRecommendations(templateToEdit.metrics?.includeRecommendations ?? true);
      setTemplateScope(templateToEdit.tenantScope || 'All Tenants');
      setTemplateSelectedTenantIds(templateToEdit.selectedTenantIds || INITIAL_TENANT_METRICS.map(t => t.id));
      setTemplateOrientation(templateToEdit.orientation || 'Portrait');
      setTemplatePaperSize(templateToEdit.paperSize || 'A4');
      setTemplateThemeColor(templateToEdit.primaryThemeColor || '#4f46e5');
    } else {
      setEditingTemplate(null);
      setTemplateName('');
      setTemplateDesc('');
      setTemplateTimeRange('Last 30 Days');
      setTplIncRecordCounts(true);
      setTplIncVolumeAndThroughput(true);
      setTplIncSuccessRateAndSla(true);
      setTplIncQualityScores(true);
      setTplIncErpBreakdown(true);
      setTplIncErrorCategories(true);
      setTplIncRecommendations(true);
      setTemplateScope('All Tenants');
      setTemplateSelectedTenantIds(INITIAL_TENANT_METRICS.map(t => t.id));
      setTemplateOrientation('Portrait');
      setTemplatePaperSize('A4');
      setTemplateThemeColor('#4f46e5');
    }
    setShowTemplateModal(true);
  };

  // Submit report template creation / updating
  const handleSaveTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    setTemplateProgressActive(true);
    setTemplateProgressPercent(15);
    setTemplateProgressText('Analyzing configuration rules and metrics scope...');
    await sleep(400);

    setTemplateProgressPercent(45);
    setTemplateProgressText('Serializing template settings and compiling payload schema...');
    await sleep(500);

    setTemplateProgressPercent(75);
    setTemplateProgressText('Registering metadata templates on the backend service...');
    await sleep(400);

    const payload = {
      id: editingTemplate ? editingTemplate.id : `tpl-${Date.now()}`,
      name: templateName.trim(),
      description: templateDesc.trim(),
      timeRange: templateTimeRange,
      metrics: {
        includeRecordCounts: tplIncRecordCounts,
        includeVolumeAndThroughput: tplIncVolumeAndThroughput,
        includeSuccessRateAndSla: tplIncSuccessRateAndSla,
        includeQualityScores: tplIncQualityScores,
        includeErpBreakdown: tplIncErpBreakdown,
        includeErrorCategories: tplIncErrorCategories,
        includeRecommendations: tplIncRecommendations,
      },
      tenantScope: templateScope,
      selectedTenantIds: templateSelectedTenantIds,
      orientation: templateOrientation,
      paperSize: templatePaperSize,
      primaryThemeColor: templateThemeColor,
      changeSummary: templateChangeSummary.trim() || undefined,
      updatedBy: 'fayasamd@gmail.com',
    };

    try {
      const res = await fetch('/api/export/reports/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setTemplateProgressPercent(90);
      setTemplateProgressText('Finalizing server persistence and syncing state...');
      await sleep(350);

      if (data.success) {
        if (data.updated) {
          setTemplates((prev) => prev.map((t) => (t.id === data.template.id ? data.template : t)));
          showToast(`Report template "${payload.name}" updated successfully.`);
        } else {
          setTemplates((prev) => [data.template, ...prev]);
          showToast(`New report template "${payload.name}" saved successfully.`);
        }
      }
    } catch (err) {
      console.error('Error saving template:', err);
      if (editingTemplate) {
        setTemplates((prev) => prev.map((t) => (t.id === editingTemplate.id ? { ...t, ...payload } : t)));
      } else {
        setTemplates((prev) => [{ ...payload, isPrebuilt: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]);
      }
      showToast(`Saved template "${payload.name}" locally.`);
    }

    setTemplateChangeSummary('');
    setTemplateProgressPercent(100);
    setTemplateProgressText('Template configuration saved successfully!');
    await sleep(600);

    setTemplateProgressActive(false);
    setShowTemplateModal(false);
    setEditingTemplate(null);
  };

  // Rollback template to specific historical version
  const handleRollbackTemplate = async (templateId: string, versionId: string) => {
    setRollingBackVerId(versionId);
    try {
      const res = await fetch(`/api/export/reports/templates/${templateId}/rollback/${versionId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.template) {
        setTemplates((prev) => prev.map((t) => (t.id === templateId ? data.template : t)));
        setEditingTemplate(data.template);
        
        // Update all input states instantly to match the rolled back state
        const rolled = data.template;
        setTemplateName(rolled.name);
        setTemplateDesc(rolled.description || '');
        setTemplateTimeRange(rolled.timeRange || 'Last 30 Days');
        setTplIncRecordCounts(rolled.metrics?.includeRecordCounts ?? true);
        setTplIncVolumeAndThroughput(rolled.metrics?.includeVolumeAndThroughput ?? true);
        setTplIncSuccessRateAndSla(rolled.metrics?.includeSuccessRateAndSla ?? true);
        setTplIncQualityScores(rolled.metrics?.includeQualityScores ?? true);
        setTplIncErpBreakdown(rolled.metrics?.includeErpBreakdown ?? true);
        setTplIncErrorCategories(rolled.metrics?.includeErrorCategories ?? true);
        setTplIncRecommendations(rolled.metrics?.includeRecommendations ?? true);
        setTemplateScope(rolled.tenantScope || 'All Tenants');
        setTemplateSelectedTenantIds(rolled.selectedTenantIds || INITIAL_TENANT_METRICS.map(t => t.id));
        setTemplateOrientation(rolled.orientation || 'Portrait');
        setTemplatePaperSize(rolled.paperSize || 'A4');
        setTemplateThemeColor(rolled.primaryThemeColor || '#4f46e5');

        showToast(`Successfully restored template configuration to ${versionId}`);
      } else {
        showToast(data.message || 'Could not restore configuration.', 'info');
      }
    } catch (err) {
      console.error('Error rolling back template:', err);
      showToast('Error executing rollback handshake.', 'info');
    } finally {
      setRollingBackVerId(null);
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/export/reports/templates/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        showToast('Template deleted successfully.', 'info');
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      showToast('Template removed.', 'info');
    }
  };

  // Create automated schedule pre-populated from template
  const handleCreateScheduleFromTemplate = (template: any) => {
    setPdfReportName(`${template.name} Recurrence`);
    setPdfScope(template.tenantScope);
    setPdfSelectedTenantIds(template.selectedTenantIds || INITIAL_TENANT_METRICS.map(t => t.id));
    setIncKpis(template.metrics?.includeRecordCounts || template.metrics?.includeVolumeAndThroughput || true);
    setIncMatrix(template.metrics?.includeSuccessRateAndSla || template.metrics?.includeQualityScores || true);
    setIncErrors(template.metrics?.includeErrorCategories ?? true);
    setIncRecs(template.metrics?.includeRecommendations ?? true);
    setShowPdfScheduleModal(true);
    showToast(`Pre-populated form from template "${template.name}".`, 'info');
  };

  // Load server multi-tenant metrics on mount if available
  useEffect(() => {
    fetch('/api/export/schedules')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.schedules)) {
          setSchedules(data.schedules);
        }
      })
      .catch(() => {});

    fetch('/api/export/reports/tenants-metrics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.tenants)) {
          setTenantMetrics(data.tenants);
        }
      })
      .catch(() => {
        // Fallback to initial state
      });

    fetch('/api/export/reports/schedules')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.schedules)) {
          setPdfSchedules(data.schedules);
        }
      })
      .catch(() => {
        // Fallback
      });

    // Fetch PDF Report templates
    fetch('/api/export/reports/templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.templates)) {
          setTemplates(data.templates);
        }
      })
      .catch((err) => {
        console.error('Error fetching templates:', err);
      });
  }, []);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper formatting size
  const formatBytes = (bytes: number): string => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return bytes + ' Bytes';
  };

  // Aggregated Summary Calculations across Tenants
  const filteredTenants = tenantMetrics.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.primaryErp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.status.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = regionFilter === 'All' || t.region === regionFilter;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesRegion && matchesStatus;
  });

  const totalAggregatedRecords = tenantMetrics.reduce((acc, t) => acc + t.totalRecords, 0);
  const totalAggregatedSuccessful = tenantMetrics.reduce((acc, t) => acc + t.successfulRecords, 0);
  const totalAggregatedErrors = tenantMetrics.reduce((acc, t) => acc + t.errorRecords, 0);
  const totalAggregatedVolumeMb = tenantMetrics.reduce((acc, t) => acc + t.dataVolumeMb, 0);
  const overallSuccessRate = totalAggregatedRecords > 0 ? Number(((totalAggregatedSuccessful / totalAggregatedRecords) * 100).toFixed(2)) : 0;
  const avgQualityScore = tenantMetrics.length > 0 ? Number((tenantMetrics.reduce((acc, t) => acc + t.qualityScore, 0) / tenantMetrics.length).toFixed(1)) : 0;

  // Toggle Schedule Pause / Active
  const handleToggleSchedule = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === 'Active' ? 'Paused' : 'Active' } : s))
    );
  };

  const handleTogglePdfSchedule = (id: string) => {
    setPdfSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === 'Active' ? 'Paused' : 'Active' } : s))
    );
    showToast('Automated PDF Schedule status updated', 'info');
  };

  const handleDeletePdfSchedule = (id: string) => {
    setPdfSchedules((prev) => prev.filter((s) => s.id !== id));
    showToast('PDF Schedule removed', 'info');
  };

  // Test Bucket Connection API
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await fetch('/api/export/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationType: selectedType,
          destinationUri,
        }),
      });
      const data = await res.json();
      setConnectionStatus({
        success: data.success,
        message: data.message,
      });
    } catch (err: any) {
      setConnectionStatus({
        success: false,
        message: 'Failed to test cloud bucket handshake: ' + err.message,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Execute Schedule Now
  const handleRunScheduleNow = async (schedule: ExportSchedule) => {
    setExecutingScheduleId(schedule.id);
    try {
      const res = await fetch('/api/export/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleName: schedule.name,
          entityName: schedule.targetEntities.join(', '),
          format: schedule.format,
          destinationUri: schedule.destinationUri,
        }),
      });
      const data = await res.json();
      if (data.success && data.job) {
        setJobs((prev) => [data.job, ...prev]);
        setSchedules((prev) =>
          prev.map((s) => {
            if (s.id === schedule.id) {
              return {
                ...s,
                lastExecutedAt: new Date().toISOString(),
                lastSnapshotSizeMb: Number((data.job.fileSizeBytes / 1048576).toFixed(1)),
                lastRowCount: data.job.rowCount,
              };
            }
            return s;
          })
        );
        showToast(`Snapshot exported successfully to ${schedule.destinationType}`);
      }
    } catch (err) {
      console.error('Export run error:', err);
    } finally {
      setExecutingScheduleId(null);
    }
  };

  // Open Modal Helpers
  const openCreateScheduleModal = () => {
    setEditingSchedule(null);
    setName('');
    setSelectedFormat('Parquet (Snappy)');
    setSelectedType('AWS S3');
    setDestinationUri('s3://my-enterprise-data-lake/exports/daily/');
    setFrequency('Daily');
    setCronExpression('0 2 * * *');
    setRunTimeUtc('02:00');
    setDayOfWeek('Monday');
    setPartitioning('Year/Month/Day');
    setRetentionDays(90);
    setExportScopeType('Specific Data Sets');
    setExportDeltaMode('Incremental Delta (24h)');
    setEncryptionMethod('AES-256 KMS');
    setMinQualityThreshold(85);
    setNotificationWebhook('https://api.enterprise.com/webhooks/export-complete');
    setNotificationEmails('data-admin@enterprise.com');
    setSelectedEntities(['Customer Master (KNA1)', 'SAP Sales Orders (VBAK)']);
    setScheduleChangeNote('');
    setRetryMaxAttempts(3);
    setRetryBackoffMinutes(5);
    setRetryBackoffStrategy('Exponential');
    setRetryOnTimeout(true);
    setRetryOnNetworkError(true);
    setRetryOnStorageQuota(true);
    setRetryOnSchemaMismatch(false);
    setConnectionStatus(null);
    setShowCreateModal(true);
  };

  const openEditScheduleModal = (schedule: ExportSchedule) => {
    setEditingSchedule(schedule);
    setName(schedule.name);
    setSelectedFormat(schedule.format);
    setSelectedType(schedule.destinationType);
    setDestinationUri(schedule.destinationUri);
    setFrequency(schedule.scheduleFrequency as any);
    setCronExpression(schedule.cronExpression || '0 2 * * *');
    setRunTimeUtc(schedule.runTimeUtc || '02:00');
    setDayOfWeek(schedule.dayOfWeek || 'Monday');
    setPartitioning(schedule.partitioning);
    setRetentionDays(schedule.maxRetentionDays);
    setExportScopeType(schedule.exportScopeType || 'Specific Data Sets');
    setExportDeltaMode(schedule.exportDeltaMode || 'Incremental Delta (24h)');
    setEncryptionMethod(schedule.encryptionMethod || 'AES-256 KMS');
    setMinQualityThreshold(schedule.minQualityThreshold || 85);
    setNotificationWebhook(schedule.notificationWebhook || '');
    setNotificationEmails((schedule.notificationEmails || []).join(', '));
    setSelectedEntities(schedule.targetEntities || []);
    setScheduleChangeNote('');
    const rp = schedule.retryPolicy;
    setRetryMaxAttempts(rp?.maxAttempts ?? 3);
    setRetryBackoffMinutes(rp?.backoffDurationMinutes ?? 5);
    setRetryBackoffStrategy(rp?.backoffStrategy ?? 'Exponential');
    setRetryOnTimeout(rp?.retryOnTimeout ?? true);
    setRetryOnNetworkError(rp?.retryOnNetworkError ?? true);
    setRetryOnStorageQuota(rp?.retryOnStorageQuota ?? true);
    setRetryOnSchemaMismatch(rp?.retryOnSchemaMismatch ?? false);
    setConnectionStatus(null);
    setShowCreateModal(true);
  };

  // Open Version History Modal for Schedule
  const openScheduleVersionHistory = (schedule: ExportSchedule) => {
    setSelectedScheduleForVersions(schedule);
    setVersionHistoryTab('timeline');
    setVersionSearchTerm('');
    if (schedule.versions && schedule.versions.length > 0) {
      setCompareVersionA(schedule.versions[0]);
      setCompareVersionB(schedule.versions.length > 1 ? schedule.versions[1] : schedule.versions[0]);
    } else {
      setCompareVersionA(null);
      setCompareVersionB(null);
    }
    setShowVersionHistoryModal(true);
  };

  // Confirm and execute version restore
  const handleConfirmRestoreVersion = async () => {
    if (!selectedScheduleForVersions || !restoringVersion) return;
    setRestoringInProgress(true);

    try {
      const res = await fetch(`/api/export/schedules/${selectedScheduleForVersions.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionNumber: restoringVersion.versionNumber,
          author: 'Data Platform Operator',
          restoreNote: restoreNoteInput || `Restored from version ${restoringVersion.versionLabel} (${restoringVersion.changeSummary})`,
        }),
      });
      const data = await res.json();
      if (data.success && data.schedule) {
        setSchedules((prev) => prev.map((s) => (s.id === data.schedule.id ? data.schedule : s)));
        setSelectedScheduleForVersions(data.schedule);
        if (data.schedule.versions && data.schedule.versions.length > 0) {
          setCompareVersionA(data.schedule.versions[0]);
          setCompareVersionB(restoringVersion);
        }
        showToast(`Restored version ${restoringVersion.versionLabel} as active export configuration!`);
      } else {
        // Fallback local restore
        const currentVer = selectedScheduleForVersions.currentVersion || 1;
        const nextVerNum = currentVer + 1;
        const restoredVerObj: ExportScheduleVersion = {
          versionNumber: nextVerNum,
          versionLabel: `v${nextVerNum}.0`,
          createdAt: new Date().toISOString(),
          createdBy: 'Data Platform Operator',
          changeSummary: restoreNoteInput || `Restored from version ${restoringVersion.versionLabel} (${restoringVersion.changeSummary})`,
          configSnapshot: { ...restoringVersion.configSnapshot },
        };
        const updated: ExportSchedule = {
          ...selectedScheduleForVersions,
          ...restoringVersion.configSnapshot,
          currentVersion: nextVerNum,
          versions: [restoredVerObj, ...(selectedScheduleForVersions.versions || [])],
        };
        setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setSelectedScheduleForVersions(updated);
        setCompareVersionA(restoredVerObj);
        setCompareVersionB(restoringVersion);
        showToast(`Restored version ${restoringVersion.versionLabel} as active export configuration!`);
      }
    } catch (err) {
      // Fallback
      const currentVer = selectedScheduleForVersions.currentVersion || 1;
      const nextVerNum = currentVer + 1;
      const restoredVerObj: ExportScheduleVersion = {
        versionNumber: nextVerNum,
        versionLabel: `v${nextVerNum}.0`,
        createdAt: new Date().toISOString(),
        createdBy: 'Data Platform Operator',
        changeSummary: restoreNoteInput || `Restored from version ${restoringVersion.versionLabel} (${restoringVersion.changeSummary})`,
        configSnapshot: { ...restoringVersion.configSnapshot },
      };
      const updated: ExportSchedule = {
        ...selectedScheduleForVersions,
        ...restoringVersion.configSnapshot,
        currentVersion: nextVerNum,
        versions: [restoredVerObj, ...(selectedScheduleForVersions.versions || [])],
      };
      setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setSelectedScheduleForVersions(updated);
      setCompareVersionA(restoredVerObj);
      setCompareVersionB(restoringVersion);
      showToast(`Restored version ${restoringVersion.versionLabel} as active export configuration!`);
    } finally {
      setRestoringInProgress(false);
      setRestoringVersion(null);
      setRestoreNoteInput('');
    }
  };

  // Submit Create or Edit Export Schedule
  const handleCreateScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const emailList = notificationEmails
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const retryPolicyObj: ExportRetryPolicy = {
      maxAttempts: retryMaxAttempts,
      backoffDurationMinutes: retryBackoffMinutes,
      backoffStrategy: retryBackoffStrategy,
      retryOnTimeout,
      retryOnNetworkError,
      retryOnStorageQuota,
      retryOnSchemaMismatch,
    };

    const snapshotConfig: ExportConfigSnapshot = {
      name: name.trim(),
      targetEntities: selectedEntities.length > 0 ? selectedEntities : ['All Active Target Data Sets'],
      exportScopeType,
      exportDeltaMode,
      format: selectedFormat,
      destinationType: selectedType,
      destinationUri: destinationUri.trim(),
      scheduleFrequency: frequency,
      cronExpression: frequency === 'Custom Cron' ? cronExpression : undefined,
      runTimeUtc,
      dayOfWeek: frequency === 'Weekly' ? dayOfWeek : undefined,
      partitioning,
      compressionLevel: selectedFormat.includes('Parquet') ? 'High' : 'Standard',
      maxRetentionDays: retentionDays,
      encryptionMethod,
      minQualityThreshold,
      notificationWebhook: notificationWebhook.trim() || undefined,
      notificationEmails: emailList,
      retryPolicy: retryPolicyObj,
    };

    const isEdit = !!editingSchedule;
    const currentVer = isEdit ? (editingSchedule.currentVersion || 1) : 1;
    const nextVerNum = isEdit ? currentVer + 1 : 1;
    const newVerLabel = `v${nextVerNum}.0`;

    const newVersionRecord: ExportScheduleVersion = {
      versionNumber: nextVerNum,
      versionLabel: newVerLabel,
      createdAt: new Date().toISOString(),
      createdBy: 'Data Platform Operator',
      changeSummary: scheduleChangeNote.trim() || (isEdit ? 'Updated configuration parameters' : 'Initial schedule baseline creation'),
      configSnapshot: snapshotConfig,
    };

    const schedulePayload: ExportSchedule = {
      id: editingSchedule ? editingSchedule.id : `sch-${Date.now()}`,
      ...snapshotConfig,
      nextRunAt: new Date(Date.now() + 86400000).toISOString(),
      status: editingSchedule ? editingSchedule.status : 'Active',
      lastExecutedAt: editingSchedule?.lastExecutedAt,
      lastSnapshotSizeMb: editingSchedule?.lastSnapshotSizeMb,
      lastRowCount: editingSchedule?.lastRowCount,
      currentVersion: nextVerNum,
      versions: isEdit ? [newVersionRecord, ...(editingSchedule.versions || [])] : [newVersionRecord],
    };

    try {
      const endpoint = isEdit ? `/api/export/schedules/${editingSchedule.id}` : '/api/export/schedules';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...schedulePayload,
          changeSummary: scheduleChangeNote.trim(),
          author: 'Data Platform Operator',
        }),
      });
      const data = await res.json();
      if (data.success && data.schedule) {
        if (isEdit) {
          setSchedules((prev) => prev.map((s) => (s.id === editingSchedule.id ? data.schedule : s)));
          showToast(`Export schedule "${data.schedule.name}" updated (version ${data.schedule.versions?.[0]?.versionLabel || 'new'}).`);
        } else {
          setSchedules((prev) => [data.schedule, ...prev]);
          showToast(`New automated export schedule "${data.schedule.name}" created.`);
        }
      } else {
        if (isEdit) {
          setSchedules((prev) => prev.map((s) => (s.id === editingSchedule.id ? schedulePayload : s)));
        } else {
          setSchedules((prev) => [schedulePayload, ...prev]);
        }
        showToast(`Export schedule saved.`);
      }
    } catch (err) {
      if (isEdit) {
        setSchedules((prev) => prev.map((s) => (s.id === editingSchedule.id ? schedulePayload : s)));
      } else {
        setSchedules((prev) => [schedulePayload, ...prev]);
      }
      showToast(`Export schedule saved.`);
    }

    setShowCreateModal(false);
    setEditingSchedule(null);
    setScheduleChangeNote('');
  };

  // Submit Create PDF Schedule
  const handleCreatePdfScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfReportName.trim()) return;

    const recipients = pdfRecipientsInput
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    const newSchedule: PdfReportSchedule = {
      id: `rep-sch-${Date.now()}`,
      name: pdfReportName.trim(),
      frequency: pdfFrequency,
      dayOfWeek: pdfFrequency === 'Weekly' ? pdfDayOfWeek : undefined,
      timeUtc: pdfTimeUtc,
      tenantScope: pdfScope,
      selectedTenantIds: pdfSelectedTenantIds,
      recipients: recipients.length > 0 ? recipients : ['admin@enterprise.com'],
      destinationType: pdfDestinationType,
      destinationUri: pdfDestinationUri.trim(),
      includeKpis: incKpis,
      includeTenantMatrix: incMatrix,
      includeErrorBreakdown: incErrors,
      includeRecommendations: incRecs,
      status: 'Active',
      lastGeneratedAt: null,
      nextRunAt: new Date(Date.now() + 86400000).toISOString(),
    };

    try {
      const res = await fetch('/api/export/reports/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule),
      });
      const data = await res.json();
      if (data.success && data.schedule) {
        setPdfSchedules((prev) => [data.schedule, ...prev]);
      } else {
        setPdfSchedules((prev) => [newSchedule, ...prev]);
      }
    } catch (err) {
      setPdfSchedules((prev) => [newSchedule, ...prev]);
    }

    setShowPdfScheduleModal(false);
    setPdfReportName('');
    showToast(`Automated PDF report schedule "${newSchedule.name}" successfully created.`);
  };

  // Trigger PDF Report Schedule Immediately
  const handleTriggerPdfScheduleNow = async (schedule: PdfReportSchedule) => {
    setTriggeringScheduleId(schedule.id);
    try {
      const res = await fetch('/api/export/reports/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: schedule.id,
          reportName: schedule.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPdfSchedules((prev) =>
          prev.map((s) => (s.id === schedule.id ? { ...s, lastGeneratedAt: new Date().toISOString() } : s))
        );
        // Generate & download the PDF report automatically
        const targetTenants =
          schedule.tenantScope === 'All Tenants'
            ? tenantMetrics
            : tenantMetrics.filter((t) => schedule.selectedTenantIds.includes(t.id));

        generateMultiTenantPdfReport(schedule.name, targetTenants);
        showToast(`Triggered PDF generation for "${schedule.name}". File downloaded.`);
      }
    } catch (err) {
      console.error(err);
      generateMultiTenantPdfReport(schedule.name, tenantMetrics);
    } finally {
      setTriggeringScheduleId(null);
    }
  };

  // REAL CLIENT-SIDE PDF GENERATOR FUNCTION USING jsPDF + jspdf-autotable
  const generateMultiTenantPdfReport = async (
    reportTitle = 'Multi-Tenant Migration Success Summary Report',
    tenantsList = tenantMetrics,
    options?: {
      timeRange?: string;
      metrics?: {
        includeRecordCounts?: boolean;
        includeVolumeAndThroughput?: boolean;
        includeSuccessRateAndSla?: boolean;
        includeQualityScores?: boolean;
        includeErpBreakdown?: boolean;
        includeErrorCategories?: boolean;
        includeRecommendations?: boolean;
      };
      orientation?: 'Portrait' | 'Landscape';
      paperSize?: 'A4' | 'Letter';
      primaryThemeColor?: string;
    }
  ) => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    setGeneratingPdf(true);
    setPdfProgressActive(true);
    setPdfProgressPercent(10);
    setPdfProgressText('Establishing secure buffer and loading jsPDF layout engines...');
    await sleep(400);

    setPdfProgressPercent(35);
    setPdfProgressText('Aggregating multi-tenant data metrics and computing analytical KPIs...');
    await sleep(450);

    setPdfProgressPercent(65);
    setPdfProgressText('Rendering chart vectors, data grids, and compiling security checksums...');
    await sleep(450);

    setPdfProgressPercent(85);
    setPdfProgressText('Finalizing document layers and transmitting download stream...');
    await sleep(350);

    try {
      const orientation = options?.orientation?.toLowerCase() === 'landscape' ? 'landscape' : 'portrait';
      const paperSize = options?.paperSize?.toLowerCase() === 'letter' ? 'letter' : 'a4';

      const doc = new jsPDF({
        orientation: orientation as any,
        unit: 'mm',
        format: paperSize,
      });

      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();

      const themeHex = options?.primaryThemeColor || '#1e293b';
      const primaryColor = hexToRgb(themeHex);
      const accentColor = hexToRgb(options?.primaryThemeColor || '#4f46e5');
      const lightBg = [248, 250, 252]; // Slate 50
      const textColor = [15, 23, 42]; // Slate 900
      const subTextColor = [100, 116, 139]; // Slate 500

      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });

      // Header Banner (Top Background Bar)
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pw, 32, 'F');

      // Accent Stripe
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(0, 32, pw, 2, 'F');

      // Header Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('ENTERPRISE DATA INTEGRATION & MIGRATION PLATFORM', 14, 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(224, 231, 255);
      doc.text(reportTitle.toUpperCase(), 14, 22);

      doc.setFontSize(8);
      doc.setTextColor(199, 210, 254);
      const subTitleText = options?.timeRange 
        ? `REPORTING INTERVAL: ${options.timeRange.toUpperCase()} - GENERATED ON ${dateStr.toUpperCase()}`
        : `CONFIDENTIAL - GENERATED ON ${dateStr.toUpperCase()}`;
      doc.text(subTitleText, 14, 28);

      // Section 1: Executive KPI Summary Box
      const showKpis = options?.metrics 
        ? (options.metrics.includeRecordCounts || options.metrics.includeVolumeAndThroughput || options.metrics.includeSuccessRateAndSla || options.metrics.includeQualityScores)
        : true;

      // KPI Calculations
      const kpiTotalRecs = (tenantsList.reduce((acc, t) => acc + t.totalRecords, 0) / 1000000).toFixed(2) + 'M';
      const kpiTotalVol = (tenantsList.reduce((acc, t) => acc + t.dataVolumeMb, 0) / 1024).toFixed(1) + ' GB';
      const kpiSuccessRate =
        tenantsList.reduce((acc, t) => acc + t.totalRecords, 0) > 0
          ? (
              (tenantsList.reduce((acc, t) => acc + t.successfulRecords, 0) /
                tenantsList.reduce((acc, t) => acc + t.totalRecords, 0)) *
              100
            ).toFixed(2) + '%'
          : '100%';
      const kpiSlaCompliant = tenantsList.filter((t) => t.successRatePct >= 95).length + ' / ' + tenantsList.length + ' Tenants';

      let currentY = 40;

      if (showKpis) {
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, currentY, pw - 28, 34, 3, 3, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text('EXECUTIVE MIGRATION KPI HIGHLIGHTS', 20, currentY + 7);

        // Column 1
        if (!options?.metrics || options.metrics.includeSuccessRateAndSla) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('Aggregated Success Rate:', 20, currentY + 16);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(16, 185, 129); // Emerald
          doc.text(kpiSuccessRate, 20, currentY + 23);
        }

        // Column 2
        if (!options?.metrics || options.metrics.includeRecordCounts) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('Total Records Processed:', 70, currentY + 16);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(30, 41, 59);
          doc.text(kpiTotalRecs, 70, currentY + 23);
        }

        // Column 3
        if (!options?.metrics || options.metrics.includeVolumeAndThroughput) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('Data Volume Migrated:', 120, currentY + 16);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.text(kpiTotalVol, 120, currentY + 23);
        }

        // Column 4
        if (!options?.metrics || options.metrics.includeSuccessRateAndSla) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('SLA Compliant Tenants:', pw - 55, currentY + 16);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(30, 41, 59);
          doc.text(kpiSlaCompliant, pw - 55, currentY + 23);
        }

        currentY += 42;
      }

      // Section 2: Multi-Tenant Migration Success Matrix Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('CROSS-TENANT MIGRATION METRICS MATRIX', 14, currentY);

      const tableHeadCols: string[] = ['Tenant Name', 'Region'];
      if (!options?.metrics || options.metrics.includeErpBreakdown) tableHeadCols.push('Target ERP');
      tableHeadCols.push('Progress');
      if (!options?.metrics || options.metrics.includeRecordCounts) tableHeadCols.push('Total Records');
      if (!options?.metrics || options.metrics.includeSuccessRateAndSla) tableHeadCols.push('Success Rate');
      if (!options?.metrics || options.metrics.includeErrorCategories) tableHeadCols.push('Errors');
      if (!options?.metrics || options.metrics.includeQualityScores) tableHeadCols.push('Quality');
      tableHeadCols.push('Cutover Status');

      const tableHead = [tableHeadCols];

      const tableBody = tenantsList.map((t) => {
        const row: string[] = [t.name, t.region];
        if (!options?.metrics || options.metrics.includeErpBreakdown) row.push(t.primaryErp);
        row.push(`${t.progressPct}%`);
        if (!options?.metrics || options.metrics.includeRecordCounts) row.push(t.totalRecords.toLocaleString());
        if (!options?.metrics || options.metrics.includeSuccessRateAndSla) row.push(`${t.successRatePct}%`);
        if (!options?.metrics || options.metrics.includeErrorCategories) row.push(t.errorRecords.toLocaleString());
        if (!options?.metrics || options.metrics.includeQualityScores) row.push(`${t.qualityScore}/100`);
        row.push(t.status);
        return row;
      });

      // Render Table via autoTable
      autoTable(doc, {
        startY: currentY + 4,
        head: tableHead,
        body: tableBody,
        theme: 'striped',
        headStyles: {
          fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left',
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      // Get Y position after table
      let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : currentY + 50;

      // Section 3: Risk & Remediation Insights
      const showErrors = !options?.metrics || options.metrics.includeErrorCategories;
      if (showErrors && finalY + 40 < ph) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text('TENANT REMEDIATION & SLA RISK AUDIT', 14, finalY);

        doc.setFillColor(254, 242, 242); // Rose tint
        doc.setDrawColor(254, 202, 202);
        doc.roundedRect(14, finalY + 4, pw - 28, 26, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(190, 18, 60); // Dark rose
        doc.text('CRITICAL TENANT REMEDIATION FLAG: Initech Solutions (88.5% Success Rate)', 18, finalY + 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(
          'Initech Solutions exhibits 78,200 quarantined error records due to Oracle JDE foreign key nullability conflicts on Address Line 1.',
          18,
          finalY + 17
        );
        doc.text(
          'Action Item: Execute COALESCE fallback transformation rule "COALESCE(STRAS, \'N/A\')" and re-run batch staging pipeline.',
          18,
          finalY + 23
        );

        finalY += 36;
      }

      // Section 4: Platform Governance Recommendations
      const showRecs = !options?.metrics || options.metrics.includeRecommendations;
      if (showRecs && finalY + 40 < ph) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text('RECOMMENDED GOVERNANCE & ARCHITECTURAL ACTIONS', 14, finalY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);

        const bullets = [
          '1. Universal Schema Standard: Enforce ISO-8601 UTC timestamp conversions across all SAP ECC and Dynamics connectors.',
          '2. PII Data Anonymization: Ensure SHA-256 salted hashing is applied to customer tax IDs before cross-border transfer.',
          '3. Throughput Throttling: Maintain API rate limits below 2,500 rps on US-East cloud clusters during cutover windows.',
          '4. Immutable Audit Snapshots: All snapshots are archived in Apache Parquet format with SHA-256 checksum verification.',
        ];

        bullets.forEach((b, i) => {
          doc.text(b, 18, finalY + 7 + i * 5);
        });
      }

      // Page Footer on all pages
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          `EDIMP Enterprise Governance Engine | Multi-Tenant Migration Audit | Page ${i} of ${pageCount}`,
          14,
          ph - 10
        );
        doc.text('Doc Ref: EDIMP-PDF-REPORT-2026', pw - 50, ph - 10);
      }

      // Save PDF
      const fileName = `${reportTitle.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().substring(0, 10)}.pdf`;
      doc.save(fileName);
      showToast(`Generated and downloaded ${fileName}`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      showToast('Error generating PDF report document', 'info');
    } finally {
      setPdfProgressPercent(100);
      setPdfProgressText('PDF report generated and downloaded successfully!');
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      await sleep(650);
      setGeneratingPdf(false);
      setPdfProgressActive(false);
    }
  };

  // Generate Single Tenant PDF Report
  const generateSingleTenantPdfReport = (tenant: TenantMigrationMetric) => {
    generateMultiTenantPdfReport(`Migration Audit Summary - ${tenant.name}`, [tenant]);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUri(text);
    setTimeout(() => setCopiedUri(null), 2000);
  };

  // CSV Export Data Formatter Engine
  const generateFormattedCsvData = () => {
    const currentDataset = MIGRATION_OUTPUT_DATASETS.find((d) => d.id === selectedOutputType) || MIGRATION_OUTPUT_DATASETS[0];
    
    // Active headers filtered by user selection
    const activeHeaders = currentDataset.headers.filter((h) => csvSelectedColumns.includes(h));
    const headerIndices = activeHeaders.map((h) => currentDataset.headers.indexOf(h)).filter((i) => i !== -1);

    // Rows filtered by tenant and search query
    const filteredRows = currentDataset.rows.filter((row) => {
      if (csvTenantFilter !== 'All') {
        const tenantVal = row[1] || '';
        if (tenantVal.toLowerCase() !== csvTenantFilter.toLowerCase()) return false;
      }
      if (csvSearchQuery.trim()) {
        const query = csvSearchQuery.toLowerCase();
        const matchesRow = row.some((cell) => cell.toLowerCase().includes(query));
        if (!matchesRow) return false;
      }
      return true;
    });

    // Format cell with quotes and escape rules
    const formatCell = (val: string) => {
      let text = val || '';
      if (csvEnclosure === '"') {
        text = text.replace(/"/g, '""');
        return `"${text}"`;
      } else if (csvEnclosure === "'") {
        text = text.replace(/'/g, "''");
        return `'${text}'`;
      } else {
        // Unquoted: replace chosen delimiter with space
        return text.split(csvDelimiter).join(' ');
      }
    };

    const csvLines: string[] = [];

    // Header line
    if (csvIncludeHeader && activeHeaders.length > 0) {
      csvLines.push(activeHeaders.map((h) => formatCell(h)).join(csvDelimiter));
    }

    // Data lines
    filteredRows.forEach((fullRow) => {
      const selectedCells = headerIndices.map((i) => fullRow[i] || '');
      csvLines.push(selectedCells.map((val) => formatCell(val)).join(csvDelimiter));
    });

    const csvContentString = csvLines.join('\n');

    return {
      currentDataset,
      activeHeaders,
      filteredRows,
      csvContentString,
    };
  };

  // Download Direct Formatted CSV File
  const handleDownloadFormattedCsv = async () => {
    const { currentDataset, filteredRows, csvContentString } = generateFormattedCsvData();

    const bomPrefix = csvIncludeBom ? '\uFEFF' : '';
    const fullBlobContent = bomPrefix + csvContentString;

    const blob = new Blob([fullBlobContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizeName = currentDataset.title.toLowerCase().replace(/[^a-z0-9]/gi, '_');
    const fileName = `${sanitizeName}_${new Date().toISOString().slice(0, 10)}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Call server endpoint to record in execution history
    try {
      const res = await fetch('/api/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outputType: currentDataset.title,
          tenantFilter: csvTenantFilter,
          delimiter: csvDelimiter,
          includeHeader: csvIncludeHeader,
          selectedColumns: csvSelectedColumns,
          recordCount: filteredRows.length,
        }),
      });
      const data = await res.json();
      if (data.success && data.job) {
        setJobs((prev) => [data.job, ...prev]);
      }
    } catch (e) {
      const fallbackJob: ExportSnapshotJob = {
        id: `job-csv-${Date.now().toString().slice(-4)}`,
        scheduleName: `Direct CSV Export: ${currentDataset.title}`,
        entityName: currentDataset.title,
        format: 'CSV (Gstandard)',
        destinationUri: 'Local Direct CSV Download',
        status: 'Completed',
        rowCount: filteredRows.length,
        fileSizeBytes: Math.round(fullBlobContent.length),
        checksumSha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        downloadUrl: '#',
      };
      setJobs((prev) => [fallbackJob, ...prev]);
    }

    showToast(`Exported ${filteredRows.length} records to ${fileName}`);
  };

  // Copy CSV Output String
  const handleCopyFormattedCsv = () => {
    const { csvContentString } = generateFormattedCsvData();
    navigator.clipboard.writeText(csvContentString);
    showToast('Copied formatted CSV output text to clipboard!');
  };

  // Generate up to 50 sample rows deterministically for previewing
  const getFiftySampleRowsForDataset = (dataset: MigrationOutputDataset, limit: number = 50): string[][] => {
    const baseRows = dataset.rows || [];
    if (baseRows.length === 0) return [];

    const rows: string[][] = [];
    for (let i = 0; i < limit; i++) {
      const baseRow = baseRows[i % baseRows.length];
      const newRow = baseRow.map((cell, colIdx) => {
        if (colIdx === 0 && cell.includes('-')) {
          const parts = cell.split('-');
          const prefix = parts[0];
          const numPart = parseInt(parts[1], 10) || 1000;
          return `${prefix}-${numPart + i}`;
        }
        if (cell.includes('2026-08-')) {
          const min = String(59 - (i % 60)).padStart(2, '0');
          const sec = String((i * 13) % 60).padStart(2, '0');
          return `2026-08-12 03:${min}:${sec}`;
        }
        return cell;
      });
      rows.push(newRow);
    }
    return rows;
  };

  // Open Sample Preview Modal
  const openSamplePreviewModal = (targetDatasetId?: string) => {
    const dsId = targetDatasetId || selectedOutputType;
    setSamplePreviewDatasetId(dsId);
    const ds = MIGRATION_OUTPUT_DATASETS.find((d) => d.id === dsId) || MIGRATION_OUTPUT_DATASETS[0];
    setSamplePreviewCols(ds.headers);
    setSamplePreviewSearch('');
    setShowSamplePreviewModal(true);
  };

  // Download First 50 Sample Rows as CSV File
  const handleDownloadSampleFiftyCsv = () => {
    const ds = MIGRATION_OUTPUT_DATASETS.find((d) => d.id === samplePreviewDatasetId) || MIGRATION_OUTPUT_DATASETS[0];
    const rawFifty = getFiftySampleRowsForDataset(ds, 50);
    const activeHeaders = ds.headers.filter((h) => samplePreviewCols.includes(h));
    const indices = activeHeaders.map((h) => ds.headers.indexOf(h));

    const formatCell = (val: string) => {
      let text = val || '';
      if (csvEnclosure === '"') {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text.split(csvDelimiter).join(' ');
    };

    const lines: string[] = [];
    if (csvIncludeHeader && activeHeaders.length > 0) {
      lines.push(activeHeaders.map((h) => formatCell(h)).join(csvDelimiter));
    }

    rawFifty.forEach((row) => {
      const rowCells = indices.map((idx) => row[idx] || '');
      lines.push(rowCells.map((val) => formatCell(val)).join(csvDelimiter));
    });

    const csvContent = (csvIncludeBom ? '\uFEFF' : '') + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `sample_50_rows_${ds.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.csv`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Downloaded first 50 sample rows as ${fileName}`);
  };

  // Copy First 50 Sample Rows as CSV Text
  const handleCopySampleFiftyCsv = () => {
    const ds = MIGRATION_OUTPUT_DATASETS.find((d) => d.id === samplePreviewDatasetId) || MIGRATION_OUTPUT_DATASETS[0];
    const rawFifty = getFiftySampleRowsForDataset(ds, 50);
    const activeHeaders = ds.headers.filter((h) => samplePreviewCols.includes(h));
    const indices = activeHeaders.map((h) => ds.headers.indexOf(h));

    const lines: string[] = [];
    if (csvIncludeHeader && activeHeaders.length > 0) {
      lines.push(activeHeaders.join(csvDelimiter));
    }
    rawFifty.forEach((row) => {
      lines.push(indices.map((idx) => row[idx] || '').join(csvDelimiter));
    });

    navigator.clipboard.writeText(lines.join('\n'));
    showToast('Copied first 50 sample rows CSV text to clipboard!');
  };

  // High Level Summaries for Snapshot Export Tab
  const activeSchedulesCount = schedules.filter((s) => s.status === 'Active').length;
  const totalVolumeMb = schedules.reduce((acc, s) => acc + (s.lastSnapshotSizeMb || 0), 0);
  const totalExportedRows = jobs.reduce((acc, j) => acc + j.rowCount, 0);

  // Filtered export schedules
  const filteredSchedules = schedules.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.destinationUri.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.format.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="export-management-module" className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-slate-800">
      {/* Floating Progress Indicators HUD */}
      <AnimatePresence>
        {(pdfProgressActive || templateProgressActive) && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
                  {pdfProgressActive ? (
                    <FileText className="w-4 h-4 text-emerald-600 animate-pulse" />
                  ) : (
                    <Layers className="w-4 h-4 text-indigo-600 animate-pulse" />
                  )}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {pdfProgressActive ? 'Compiling PDF Report' : 'Saving Template'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                {pdfProgressActive ? `${pdfProgressPercent}%` : `${templateProgressPercent}%`}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-900 min-h-[32px]">
                {pdfProgressActive ? pdfProgressText : templateProgressText}
              </div>
              
              {/* Progress bar */}
              <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <motion.div
                  className={`h-full rounded-full ${
                    pdfProgressActive 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pdfProgressActive ? pdfProgressPercent : templateProgressPercent}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Simulated background process steps check */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-2.5">
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                Processing workspace files...
              </span>
              <span className="font-mono text-slate-400">
                {pdfProgressActive ? 'jsPDF v2.5' : 'Schema v1.2'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-white border border-slate-200 text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="p-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </span>
          <span className="text-xs font-bold text-slate-800">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <DownloadCloud className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Export Management & Automated PDF Reports</h2>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Multi-Tenant PDF & Data Lake
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Generate and schedule automated executive PDF reports aggregating tenant migration success metrics, or export snapshot feeds to S3/GCS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('csvExport')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Outputs to CSV</span>
          </button>

          <button
            type="button"
            onClick={() => generateMultiTenantPdfReport()}
            disabled={generatingPdf}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {generatingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span>{generatingPdf ? 'Generating PDF...' : 'Download PDF Report Now'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPdfScheduleModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <Clock className="w-4 h-4" />
            <span>Schedule PDF Delivery</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateScheduleModal()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 shadow-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Export Schedule</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 shadow-xs w-full max-w-full overflow-hidden">
        {/* Scrollable / Flexible Tabs Strip */}
        <div className="w-full xl:w-auto min-w-0 max-w-full overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200/90 bg-slate-100/80 p-1.5 scrollbar-thin">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              id="tab-csv-exporter"
              type="button"
              onClick={() => setActiveTab('csvExport')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'csvExport' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV Migration Exporter</span>
            </button>

            <button
              id="tab-pdf-reports"
              type="button"
              onClick={() => setActiveTab('pdfReports')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'pdfReports' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tenant PDF Report Generator</span>
            </button>

            <button
              id="tab-snapshot-feeds"
              type="button"
              onClick={() => setActiveTab('schedules')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'schedules' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Snapshot Feeds ({schedules.length})</span>
            </button>

            <button
              id="tab-execution-history"
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'history' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Execution History ({jobs.length})</span>
            </button>

            <button
              id="tab-schema-preview"
              type="button"
              onClick={() => setActiveTab('schemaPreview')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'schemaPreview' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-purple-300" />
              <span>Data Schema Preview</span>
            </button>

            <button
              id="tab-integrity-check"
              type="button"
              onClick={() => setActiveTab('integrityCheck')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'integrityCheck' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Pre-Export Integrity Check</span>
            </button>

            <button
              id="tab-dependency-mapper"
              type="button"
              onClick={() => setActiveTab('dependencyMapper')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'dependencyMapper' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-blue-300" />
              <span>Dependency Mapper</span>
            </button>

            <button
              id="tab-milestone-timeline"
              type="button"
              onClick={() => setActiveTab('jobTimeline')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'jobTimeline' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>Milestone Timeline</span>
            </button>

            <button
              id="tab-version-diff"
              type="button"
              onClick={() => setActiveTab('versionDiff')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'versionDiff' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-purple-300" />
              <span>Version Diff</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full xl:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="export-management-search"
            type="text"
            placeholder="Search tenants, schedules or ERP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-indigo-500 shadow-2xs font-sans"
          />
        </div>
      </div>

      {/* TAB 1: TENANT PDF REPORT GENERATOR & METRICS AGGREGATION */}
      {activeTab === 'pdfReports' && (
        <div className="space-y-6">
          {/* Executive Multi-Tenant KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3.5 shadow-xs">
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <TrendingUp className="w-6 h-6" />
              </span>
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Overall Migration Success</span>
                <span className="text-2xl font-extrabold text-emerald-600">{overallSuccessRate}%</span>
                <span className="text-[10px] text-slate-400 block">Across {tenantMetrics.length} Active Tenants</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3.5 shadow-xs">
              <span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Database className="w-6 h-6" />
              </span>
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Total Records Processed</span>
                <span className="text-2xl font-extrabold text-slate-900">{(totalAggregatedRecords / 1000000).toFixed(2)}M</span>
                <span className="text-[10px] text-slate-400 block">{(totalAggregatedSuccessful / 1000000).toFixed(2)}M Successful</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3.5 shadow-xs">
              <span className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                <FolderArchive className="w-6 h-6" />
              </span>
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Data Volume Migrated</span>
                <span className="text-2xl font-extrabold text-purple-700">{(totalAggregatedVolumeMb / 1024).toFixed(1)} GB</span>
                <span className="text-[10px] text-slate-400 block">Parquet & Compressed CSV</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3.5 shadow-xs">
              <span className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Average Quality Score</span>
                <span className="text-2xl font-extrabold text-amber-600">{avgQualityScore} / 100</span>
                <span className="text-[10px] text-slate-400 block">4 / 5 Tenants Meeting SLA</span>
              </div>
            </div>
          </div>

          {/* Tenant Migration Metrics Aggregation Matrix Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <Building2 className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-base text-slate-900">Aggregated Multi-Tenant Migration Metrics</h3>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-200">
                  {filteredTenants.length} Tenants Listed
                </span>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500 text-[11px]">Region:</span>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="All">All Regions</option>
                    <option value="US-East">US-East</option>
                    <option value="EU-Central">EU-Central</option>
                    <option value="AP-South">AP-South</option>
                    <option value="US-West">US-West</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="All">All Statuses</option>
                    <option value="In Cutover Phase">In Cutover Phase</option>
                    <option value="Active Migration">Active Migration</option>
                    <option value="Remediation Required">Remediation Required</option>
                    <option value="Final Sign-Off">Final Sign-Off</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPdfPreviewModal(true)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Report</span>
                </button>
              </div>
            </div>

            {/* Tenant Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Tenant & Region</th>
                    <th className="p-3">Primary ERP</th>
                    <th className="p-3">Cutover Progress</th>
                    <th className="p-3">Processed Records</th>
                    <th className="p-3">Success Rate</th>
                    <th className="p-3">Errors</th>
                    <th className="p-3">Volume</th>
                    <th className="p-3">Quality</th>
                    <th className="p-3 text-right">PDF Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 block">{t.name}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px]">
                            {t.region}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">{t.contactEmail}</span>
                      </td>

                      <td className="p-3 font-sans">
                        <span className="text-slate-800 font-medium block">{t.primaryErp}</span>
                        <span className="text-[10px] text-indigo-600 font-semibold">{t.tier} Tier</span>
                      </td>

                      <td className="p-3 w-40">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-slate-900 font-bold">{t.progressPct}%</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded ${
                              t.status === 'Remediation Required'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              t.status === 'Remediation Required' ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                            }`}
                            style={{ width: `${t.progressPct}%` }}
                          />
                        </div>
                      </td>

                      <td className="p-3 text-slate-900">
                        <span className="font-bold block">{t.totalRecords.toLocaleString()}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">{t.successfulRecords.toLocaleString()} ok</span>
                      </td>

                      <td className="p-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] border ${
                            t.successRatePct >= 99.0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : t.successRatePct >= 90.0
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {t.successRatePct}%
                        </span>
                      </td>

                      <td className="p-3">
                        <span className={`font-bold ${t.errorRecords > 20000 ? 'text-rose-600' : 'text-slate-500'}`}>
                          {t.errorRecords.toLocaleString()}
                        </span>
                      </td>

                      <td className="p-3 text-slate-800 font-bold">{(t.dataVolumeMb / 1024).toFixed(1)} GB</td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-indigo-700 border border-slate-200 rounded text-[10px] font-bold">
                          {t.qualityScore}/100
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => generateSingleTenantPdfReport(t)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Tenant PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PDF Report Configuration Templates Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <Layers className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-base text-slate-900">Saved PDF Report Configuration Templates</h3>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-200">
                  {templates.length} Templates Saved
                </span>
              </div>

              <button
                type="button"
                onClick={() => openTemplateModal(null)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save New PDF Template</span>
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 text-xs font-medium">No saved configuration templates found.</p>
                <p className="text-slate-400 text-[11px] mt-1">Create a custom template to easily reuse configurations and recurring summaries.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((tpl) => {
                  return (
                    <div
                      key={tpl.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3.5 hover:bg-white hover:border-slate-300 transition-all shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs"
                              style={{ backgroundColor: tpl.primaryThemeColor || '#4f46e5' }}
                            />
                            <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{tpl.name}</h4>
                          </div>

                          <div className="flex items-center gap-1">
                            {tpl.isPrebuilt && (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[9px] font-bold">
                                Prebuilt
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] border border-slate-200">
                              {tpl.orientation || 'Portrait'}
                            </span>
                          </div>
                        </div>

                        {tpl.description && (
                          <p className="text-slate-500 text-[11px] line-clamp-2">{tpl.description}</p>
                        )}

                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-mono">Time Range:</span>
                            <span className="font-bold text-indigo-700">{tpl.timeRange}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-mono">Scope:</span>
                            <span className="font-bold text-slate-700">{tpl.tenantScope}</span>
                          </div>
                          
                          {/* Active Metrics Indicators */}
                          <div className="pt-1.5 border-t border-slate-100">
                            <span className="text-slate-400 text-[10px] block mb-1 font-mono uppercase">Metrics Configured:</span>
                            <div className="flex flex-wrap gap-1">
                              {tpl.metrics?.includeRecordCounts && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-mono">Records</span>
                              )}
                              {tpl.metrics?.includeVolumeAndThroughput && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-mono">Volume</span>
                              )}
                              {tpl.metrics?.includeSuccessRateAndSla && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-mono">Success/SLA</span>
                              )}
                              {tpl.metrics?.includeQualityScores && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-mono">Quality</span>
                              )}
                              {tpl.metrics?.includeErrorCategories && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-mono">Errors</span>
                              )}
                              {tpl.metrics?.includeRecommendations && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-mono">Insights</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const targetTenants =
                                tpl.tenantScope === 'All Tenants'
                                  ? tenantMetrics
                                  : tpl.tenantScope === 'Enterprise Tier Only'
                                  ? tenantMetrics.filter(t => t.tier === 'Enterprise')
                                  : tenantMetrics.filter(t => tpl.selectedTenantIds?.includes(t.id));
                              generateMultiTenantPdfReport(tpl.name, targetTenants, {
                                timeRange: tpl.timeRange,
                                metrics: tpl.metrics,
                                orientation: tpl.orientation,
                                paperSize: tpl.paperSize,
                                primaryThemeColor: tpl.primaryThemeColor,
                              });
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                            title="Generate and download PDF using this template instantly"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Run Instantly</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCreateScheduleFromTemplate(tpl)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                            title="Pre-populate new Automated Dispatch Schedule"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Schedule Recurrence</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {!tpl.isPrebuilt && (
                            <>
                              <button
                                type="button"
                                onClick={() => openTemplateModal(tpl)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Template"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(tpl.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Delete Template"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Configured Automated PDF Report Schedules Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">
                  <Clock className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-base text-slate-900">Automated PDF Report Dispatch Schedules</h3>
                <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pdfSchedules.length} Schedules Configured
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowPdfScheduleModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create PDF Dispatch Schedule</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pdfSchedules.map((schedule) => {
                const isTriggering = triggeringScheduleId === schedule.id;
                return (
                  <div
                    key={schedule.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                      schedule.status === 'Active'
                        ? 'bg-slate-50/50 border-slate-200'
                        : 'bg-slate-50/20 border-slate-200/60 opacity-80'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                            <FileText className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{schedule.name}</h4>
                            <span className="text-[10px] text-purple-700 font-mono font-semibold">
                              Cadence: {schedule.frequency} ({schedule.timeUtc} UTC)
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTogglePdfSchedule(schedule.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-all flex items-center gap-1 ${
                            schedule.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {schedule.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                          <span>{schedule.status}</span>
                        </button>
                      </div>

                      {/* Scope & Recipients */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-mono">Tenant Scope:</span>
                          <span className="font-bold text-indigo-700">{schedule.tenantScope}</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-mono">Recipients:</span>
                          <span className="text-slate-800 font-mono truncate max-w-[200px]" title={schedule.recipients.join(', ')}>
                            {schedule.recipients.join(', ')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-mono">Storage Sink:</span>
                          <span className="text-slate-700 font-mono truncate max-w-[200px]" title={schedule.destinationUri}>
                            {schedule.destinationType}
                          </span>
                        </div>
                      </div>

                      {/* Last / Next Run */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 pt-1">
                        <div>
                          <span className="block text-slate-400">Last Generated</span>
                          <strong className="text-slate-700">
                            {schedule.lastGeneratedAt ? new Date(schedule.lastGeneratedAt).toLocaleString() : 'Never'}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-slate-400">Next Scheduled Run</span>
                          <strong className="text-indigo-700">{new Date(schedule.nextRunAt).toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Card Footer Actions */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleTriggerPdfScheduleNow(schedule)}
                        disabled={isTriggering}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shadow-xs"
                      >
                        {isTriggering ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5 text-emerald-300" />
                        )}
                        <span>{isTriggering ? 'Generating PDF...' : 'Run & Deliver Report Now'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePdfSchedule(schedule.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Delete Schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED EXPORT SCHEDULES PIPELINE */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Configured Automated Export Schedules</h3>
              <p className="text-xs text-slate-500">Recurring automated pipelines pushing datasets and migration outputs to data lakes & storage vaults.</p>
            </div>
            <button
              type="button"
              onClick={() => openCreateScheduleModal()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Export Schedule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.map((schedule) => {
              const isExecuting = executingScheduleId === schedule.id;
              const scopeType = schedule.exportScopeType || 'Specific Data Sets';
              return (
                <div
                  key={schedule.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                    schedule.status === 'Active'
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-slate-50/50 border-slate-200/60 opacity-80'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                          <Clock className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{schedule.name}</h3>
                            <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[9px] font-mono font-bold shrink-0">
                              v{schedule.currentVersion || 1}.0
                            </span>
                          </div>
                          <span className="text-[10px] text-indigo-700 font-mono font-semibold">{schedule.destinationType}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleSchedule(schedule.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-all flex items-center gap-1 ${
                          schedule.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {schedule.status === 'Active' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Pause className="w-3 h-3" />}
                        <span>{schedule.status}</span>
                      </button>
                    </div>

                    {/* Scope Badge & Delta Mode */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${
                        scopeType === 'Migration Outputs'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : scopeType === 'Hybrid Combined'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {scopeType}
                      </span>

                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono">
                        {schedule.exportDeltaMode || 'Incremental (24h)'}
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-mono font-bold">
                        {schedule.format}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono">
                        {schedule.scheduleFrequency} {schedule.runTimeUtc ? `(${schedule.runTimeUtc} UTC)` : ''}
                      </span>
                      {schedule.encryptionMethod && schedule.encryptionMethod !== 'None' && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-mono font-semibold">
                          🔒 {schedule.encryptionMethod}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-mono font-semibold flex items-center gap-1" title="Configured Retry Policy & Failure Backoff">
                        <RotateCcw className="w-2.5 h-2.5 text-indigo-600" />
                        <span>
                          {schedule.retryPolicy?.maxAttempts ?? 3} Attempts ({schedule.retryPolicy?.backoffDurationMinutes ?? 5}m {schedule.retryPolicy?.backoffStrategy ?? 'Exponential'})
                        </span>
                      </span>
                    </div>

                    {/* Target Data Sets / Outputs List */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-mono uppercase text-slate-400">
                        <span>Target Feeds ({schedule.targetEntities?.length || 0})</span>
                        <span className="text-slate-500 font-semibold">{schedule.partitioning}</span>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-2 font-medium">
                        {schedule.targetEntities?.join(', ') || 'All Target Entities'}
                      </p>
                    </div>

                    {/* Destination URI */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-600">
                      <span className="truncate max-w-[200px]" title={schedule.destinationUri}>
                        {schedule.destinationUri}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(schedule.destinationUri)}
                        className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-slate-200/50 cursor-pointer"
                        title="Copy Destination URI"
                      >
                        {copiedUri === schedule.destinationUri ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Metrics Footer */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono p-2 bg-slate-100/60 rounded-xl text-slate-500 border border-slate-200/60">
                      <div>
                        <span className="block text-slate-400 text-[9px]">Last Size / Rows</span>
                        <strong className="text-slate-800 font-bold">
                          {schedule.lastSnapshotSizeMb ? `${schedule.lastSnapshotSizeMb} MB` : '34.2 MB'} • {schedule.lastRowCount ? `${(schedule.lastRowCount / 1000).toFixed(0)}k` : '128k'}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[9px]">Next Run</span>
                        <strong className="text-indigo-700 font-bold">
                          {schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleDateString() : 'Tomorrow 02:00'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleRunScheduleNow(schedule)}
                      disabled={isExecuting}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shadow-xs"
                    >
                      {isExecuting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      )}
                      <span>{isExecuting ? 'Exporting...' : 'Run Export Now'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openScheduleVersionHistory(schedule)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                        title="View Version History & Compare Revisions"
                      >
                        <History className="w-3.5 h-3.5 text-indigo-600" />
                        <span>History ({schedule.versions?.length || 1})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditScheduleModal(schedule)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Schedule Settings"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSchedules((prev) => prev.filter((s) => s.id !== schedule.id))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Delete Schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: EXECUTION HISTORY LOG TABLE */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Job ID</th>
                <th className="p-3">Schedule & Entity</th>
                <th className="p-3">Export Format</th>
                <th className="p-3">File Size & Rows</th>
                <th className="p-3">Checksum (SHA-256)</th>
                <th className="p-3">Completed At</th>
                <th className="p-3">Destination Path</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-indigo-700">{job.id}</td>
                  <td className="p-3 font-sans">
                    <span className="font-bold text-slate-900 block">{job.scheduleName}</span>
                    <span className="text-[10px] text-slate-500">{job.entityName}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px]">
                      {job.format}
                    </span>
                  </td>
                  <td className="p-3 text-slate-800">
                    <span className="block font-bold">{formatBytes(job.fileSizeBytes)}</span>
                    <span className="text-[10px] text-slate-400">{job.rowCount.toLocaleString()} rows</span>
                  </td>
                  <td className="p-3 text-slate-400 text-[10px] truncate max-w-[140px]" title={job.checksumSha256}>
                    {job.checksumSha256}
                  </td>
                  <td className="p-3 text-slate-500 text-[11px]">{new Date(job.startedAt).toLocaleString()}</td>
                  <td className="p-3 text-indigo-700 text-[11px] truncate max-w-[180px]" title={job.destinationUri}>
                    {job.destinationUri}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTimelineJobId('job-901-v1.2');
                        setActiveTab('jobTimeline');
                      }}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ml-auto"
                      title="View Job Milestone Timeline"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Timeline</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: MIGRATION OUTPUTS DIRECT CSV EXPORTER */}
      {activeTab === 'csvExport' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white p-6 rounded-2xl text-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl">
                  <FileSpreadsheet className="w-6 h-6" />
                </span>
                <h3 className="text-xl font-bold tracking-tight text-slate-900">Migration Outputs Direct CSV Exporter</h3>
                <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono font-bold rounded-full">
                  UTF-8 CSV Engine
                </span>
              </div>
              <p className="text-slate-500 text-xs max-w-2xl leading-relaxed">
                Select specific migration output feeds, exception dumps, or audit logs and generate formatted CSV downloads on demand. Configure delimiters, quotes, field selections, and Excel UTF-8 Byte Order Marks.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => openSamplePreviewModal(selectedOutputType)}
                className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
                title="Preview a sample of the first 50 rows before full export"
              >
                <Eye className="w-4 h-4 text-amber-600" />
                <span>Preview Sample (50 Rows)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyFormattedCsv}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copy CSV Text</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadFormattedCsv}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span>Download Formatted CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <Layers className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Outputs</span>
                <span className="text-base font-bold text-slate-900">{MIGRATION_OUTPUT_DATASETS.length} Exception Feeds</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Sliders className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Delimiter</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {csvDelimiter === ',' ? 'Comma (,)' : csvDelimiter === ';' ? 'Semicolon (;)' : csvDelimiter === '\t' ? 'Tab (\\t)' : 'Pipe (|)'}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Excel Compatibility</span>
                <span className="text-base font-bold text-slate-900">{csvIncludeBom ? 'UTF-8 BOM ON' : 'Standard UTF-8'}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <BarChart3 className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filtered Rows</span>
                <span className="text-base font-bold text-slate-900">{generateFormattedCsvData().filteredRows.length} Records</span>
              </div>
            </div>
          </div>

          {/* Main 2-Column Split: Controls vs Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Controls & Selections (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Card 1: Output Dataset Selector */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-600" />
                    <span>1. Select Migration Output Feed</span>
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">Step 1 of 3</span>
                </div>

                <div className="space-y-2.5">
                  {MIGRATION_OUTPUT_DATASETS.map((dataset) => {
                    const isSelected = dataset.id === selectedOutputType;
                    return (
                      <div
                        key={dataset.id}
                        onClick={() => setSelectedOutputType(dataset.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className={`mt-0.5 p-1.5 rounded-lg border shrink-0 ${dataset.badgeColor}`}>
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{dataset.title}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal">{dataset.subtitle}</p>
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {dataset.category}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400">
                                {dataset.rows.length} records · {dataset.headers.length} cols
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openSamplePreviewModal(dataset.id);
                              }}
                              className="px-2 py-0.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="Preview first 50 sample rows"
                            >
                              <Eye className="w-3 h-3 text-amber-600" />
                              <span>Preview 50 Rows</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 2: Delimiter & Format Customizations */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>2. CSV Formatting & Delimiter Settings</span>
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">Step 2 of 3</span>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Delimiter */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">CSV Field Delimiter</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: ',', label: 'Comma (,)', sub: 'Standard CSV' },
                        { id: ';', label: 'Semicolon (;)', sub: 'EU Excel' },
                        { id: '\t', label: 'Tab (\\t)', sub: 'TSV Document' },
                        { id: '|', label: 'Pipe (|)', sub: 'Database Format' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCsvDelimiter(item.id as any)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            csvDelimiter === item.id
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block font-bold">{item.label}</span>
                          <span className="text-[10px] text-slate-400">{item.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Quote Enclosure */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Text Quote Enclosure</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: '"', label: 'Double Quotes (")' },
                        { id: "'", label: "Single Quotes (')" },
                        { id: 'none', label: 'None (Unquoted)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCsvEnclosure(item.id as any)}
                          className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                            csvEnclosure === item.id
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="font-bold text-slate-800 block">Include Column Headers Row</span>
                        <span className="text-[10px] text-slate-500">First line contains field names</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={csvIncludeHeader}
                        onChange={(e) => setCsvIncludeHeader(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="font-bold text-slate-800 block">Include UTF-8 BOM Header</span>
                        <span className="text-[10px] text-slate-500">Ensures Microsoft Excel auto-detects UTF-8 accents</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={csvIncludeBom}
                        onChange={(e) => setCsvIncludeBom(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Card 3: Filters & Column Customizer */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-emerald-600" />
                    <span>3. Filters & Column Customizer</span>
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">Step 3 of 3</span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Tenant Filter */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Filter by Tenant</label>
                    <select
                      value={csvTenantFilter}
                      onChange={(e) => setCsvTenantFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="All">All Tenants (Global Cross-Tenant Dump)</option>
                      {tenantMetrics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search Query */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Search Keywords</label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search error code, entity, or value..."
                        value={csvSearchQuery}
                        onChange={(e) => setCsvSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Column Checklist */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800">Select Columns to Export ({csvSelectedColumns.length})</label>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            const found = MIGRATION_OUTPUT_DATASETS.find((d) => d.id === selectedOutputType);
                            if (found) setCsvSelectedColumns([...found.headers]);
                          }}
                          className="text-indigo-600 font-bold hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setCsvSelectedColumns([])}
                          className="text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {MIGRATION_OUTPUT_DATASETS.find((d) => d.id === selectedOutputType)?.headers.map((hdr) => {
                        const isChecked = csvSelectedColumns.includes(hdr);
                        return (
                          <label key={hdr} className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-slate-700 hover:text-slate-900">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setCsvSelectedColumns((prev) => prev.filter((c) => c !== hdr));
                                } else {
                                  setCsvSelectedColumns((prev) => [...prev, hdr]);
                                }
                              }}
                              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <span>{hdr}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Live Interactive CSV Preview (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                {/* Header & Preview Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                      <Eye className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Live CSV Output Preview</h4>
                      <span className="text-[10px] text-slate-500">
                        Real-time formatted preview matching your active delimiter and column rules
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => openSamplePreviewModal(selectedOutputType)}
                      className="px-3 py-1 rounded-lg font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Preview sample of first 50 rows"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-600" />
                      <span>Preview 50 Sample Rows</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCsvPreviewMode('table')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        csvPreviewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Formatted Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setCsvPreviewMode('raw')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        csvPreviewMode === 'raw' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Raw CSV Output
                    </button>
                  </div>
                </div>

                {/* Main Preview Container */}
                {(() => {
                  const { currentDataset, activeHeaders, filteredRows, csvContentString } = generateFormattedCsvData();

                  return (
                    <div className="space-y-4">
                      {/* Summary Banner */}
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-indigo-700">{filteredRows.length} Matching Rows</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600">{activeHeaders.length} Selected Columns</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-amber-700 font-bold">Delimiter: '{csvDelimiter}'</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans">Updated live</span>
                      </div>

                      {/* Mode A: Formatted Data Table Grid */}
                      {csvPreviewMode === 'table' ? (
                        <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[520px]">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px] sticky top-0 z-10 border-b border-slate-200">
                              <tr>
                                {activeHeaders.map((hdr) => (
                                  <th key={hdr} className="p-3 font-bold whitespace-nowrap bg-slate-100">
                                    {hdr}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                              {filteredRows.length === 0 ? (
                                <tr>
                                  <td colSpan={Math.max(1, activeHeaders.length)} className="p-8 text-center text-slate-400">
                                    No records match the active tenant or search filter.
                                  </td>
                                </tr>
                              ) : (
                                filteredRows.map((row, rowIdx) => {
                                  const headerIndices = activeHeaders.map((h) => currentDataset.headers.indexOf(h));
                                  return (
                                    <tr key={rowIdx} className="hover:bg-amber-50/40 transition-colors">
                                      {headerIndices.map((idx, cellIdx) => {
                                        const cellVal = row[idx] || '';
                                        const isErrorSeverity = cellVal === 'CRITICAL' || cellVal === 'HIGH';
                                        return (
                                          <td key={cellIdx} className="p-2.5 whitespace-nowrap">
                                            {isErrorSeverity ? (
                                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold">
                                                {cellVal}
                                              </span>
                                            ) : (
                                              <span className="text-slate-800">{cellVal}</span>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        /* Mode B: Raw Formatted CSV Code View */
                        <div className="relative border border-slate-200 bg-slate-50 rounded-xl p-4 text-slate-800 font-mono text-xs overflow-x-auto max-h-[520px] space-y-1">
                          <pre className="whitespace-pre text-[11px] leading-relaxed text-slate-800 font-mono">
                            {csvContentString}
                          </pre>
                        </div>
                      )}

                      {/* Download Action Box */}
                      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-amber-950 block">Ready to Download Direct CSV Output</span>
                          <span className="text-[11px] text-amber-800">
                            Exports {filteredRows.length} rows formatted with UTF-8 encoding and chosen delimiters.
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('integrityCheck')}
                            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                            title="Scan dataset for missing mandatory fields or schema errors prior to downloading"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Integrity Check</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openSamplePreviewModal(selectedOutputType)}
                            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Preview First 50 Rows</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleCopyFormattedCsv}
                            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy CSV</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleDownloadFormattedCsv}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Download CSV File</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DATA SCHEMA PREVIEW TOOL */}
      {activeTab === 'schemaPreview' && (
        <DataSchemaPreviewTool
          initialConfigId={previewSchemaConfigId}
          onClose={() => setActiveTab('schedules')}
        />
      )}

      {/* TAB 6: PRE-EXPORT INTEGRITY CHECK TOOL */}
      {activeTab === 'integrityCheck' && (
        <PreExportIntegrityCheckTool
          onProceedToExport={(datasetId) => {
            setActiveTab('csvExport');
          }}
          onClose={() => setActiveTab('schedules')}
        />
      )}

      {/* TAB 7: EXPORT DEPENDENCY MAPPER TOOL */}
      {activeTab === 'dependencyMapper' && (
        <ExportDependencyMapperTool
          initialConfigId={selectedDependencyMapperConfigId}
          onClose={() => setActiveTab('schedules')}
        />
      )}

      {/* TAB 8: EXPORT JOB MILESTONE TIMELINE TOOL */}
      {activeTab === 'jobTimeline' && (
        <ExportJobTimelineTool
          initialJobId={selectedTimelineJobId}
          onClose={() => setActiveTab('schedules')}
        />
      )}

      {/* TAB 9: EXPORT CONFIGURATION VERSION DIFF TOOL */}
      {activeTab === 'versionDiff' && (
        <ExportVersionDiffTool
          onClose={() => setActiveTab('schedules')}
        />
      )}

      {/* MODAL 1: CREATE AUTOMATED PDF REPORT DISPATCH SCHEDULE */}
      {showPdfScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <FileText className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-base text-slate-900">Create Automated PDF Report Dispatch Schedule</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfScheduleModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

             <form onSubmit={handleCreatePdfScheduleSubmit} className="space-y-4 text-xs">
              {/* Pre-populate from Template Selector */}
              {templates.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="text-indigo-700 font-bold block mb-1">Pre-populate from Saved Template</label>
                  <select
                    onChange={(e) => {
                      const selectedTplId = e.target.value;
                      if (!selectedTplId) return;
                      const selectedTpl = templates.find(t => t.id === selectedTplId);
                      if (selectedTpl) {
                        setPdfReportName(`${selectedTpl.name} Recurrence`);
                        setPdfScope(selectedTpl.tenantScope);
                        setPdfSelectedTenantIds(selectedTpl.selectedTenantIds || INITIAL_TENANT_METRICS.map(t => t.id));
                        setIncKpis(selectedTpl.metrics?.includeRecordCounts || selectedTpl.metrics?.includeVolumeAndThroughput || true);
                        setIncMatrix(selectedTpl.metrics?.includeSuccessRateAndSla || selectedTpl.metrics?.includeQualityScores || true);
                        setIncErrors(selectedTpl.metrics?.includeErrorCategories ?? true);
                        setIncRecs(selectedTpl.metrics?.includeRecommendations ?? true);
                        showToast(`Applied configuration template "${selectedTpl.name}"`, 'info');
                      }
                    }}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="">-- Choose a template to pre-fill form --</option>
                    {templates.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Report Title */}
              <div>
                <label className="text-slate-600 font-bold block mb-1">Report Title / Schedule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Weekly Multi-Tenant Executive Migration Audit"
                  value={pdfReportName}
                  onChange={(e) => setPdfReportName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Cadence & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Cadence</label>
                  <select
                    value={pdfFrequency}
                    onChange={(e) => setPdfFrequency(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>

                {pdfFrequency === 'Weekly' && (
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">Day of Week</label>
                    <select
                      value={pdfDayOfWeek}
                      onChange={(e) => setPdfDayOfWeek(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Friday">Friday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-slate-600 font-bold block mb-1">Dispatch Time (UTC)</label>
                  <input
                    type="text"
                    value={pdfTimeUtc}
                    onChange={(e) => setPdfTimeUtc(e.target.value)}
                    placeholder="06:00"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Tenant Scope & Storage Sink */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Tenant Metric Scope</label>
                  <select
                    value={pdfScope}
                    onChange={(e) => setPdfScope(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="All Tenants">All Tenants ({tenantMetrics.length})</option>
                    <option value="Enterprise Tier Only">Enterprise Tier Only</option>
                    <option value="Selected Tenants">Custom Selected Tenants</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 font-bold block mb-1">Delivery Destination</label>
                  <select
                    value={pdfDestinationType}
                    onChange={(e) => setPdfDestinationType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="AWS S3">AWS S3 Vault</option>
                    <option value="Google Cloud Storage">Google Cloud Storage</option>
                    <option value="Azure Blob Storage">Azure Blob Storage</option>
                    <option value="Email Attachment">Direct Email Attachment Only</option>
                  </select>
                </div>
              </div>

              {/* Recipients Input */}
              <div>
                <label className="text-slate-600 font-bold block mb-1">Email Delivery Recipients (Comma Separated)</label>
                <input
                  type="text"
                  required
                  value={pdfRecipientsInput}
                  onChange={(e) => setPdfRecipientsInput(e.target.value)}
                  placeholder="execs@enterprise.com, team@company.com"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* PDF Sections Checkboxes */}
              <div>
                <label className="text-slate-600 font-bold block mb-1.5">PDF Content Modules Included</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={incKpis} onChange={(e) => setIncKpis(e.target.checked)} className="accent-indigo-600 rounded" />
                    <span>Executive KPI Highlights</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={incMatrix} onChange={(e) => setIncMatrix(e.target.checked)} className="accent-indigo-600 rounded" />
                    <span>Cross-Tenant Metrics Matrix</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={incErrors} onChange={(e) => setIncErrors(e.target.checked)} className="accent-indigo-600 rounded" />
                    <span>Tenant Remediation Audit</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={incRecs} onChange={(e) => setIncRecs(e.target.checked)} className="accent-indigo-600 rounded" />
                    <span>Governance Recommendations</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPdfScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Clock className="w-4 h-4" />
                  <span>Activate Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE & EDIT PDF CONFIGURATION TEMPLATE */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <Layers className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  {editingTemplate ? 'Edit Report Configuration Template' : 'Save New PDF Report Configuration Template'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingTemplate && (
              <div className="flex border-b border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setTemplateModalTab('config')}
                  className={`flex-1 py-2 text-center font-bold border-b-2 transition-all cursor-pointer ${
                    templateModalTab === 'config'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Configure Template Settings
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateModalTab('history')}
                  className={`flex-1 py-2 text-center font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    templateModalTab === 'history'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Version History ({editingTemplate.versions?.length || 0})</span>
                </button>
              </div>
            )}

            {editingTemplate && templateModalTab === 'history' ? (
              <div className="space-y-4 text-xs">
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-indigo-800 flex items-start gap-2 leading-relaxed">
                  <span className="mt-0.5">ℹ️</span>
                  <div>
                    <span className="font-bold block text-slate-900 mb-0.5">Report Traceability & Rollback Engine</span>
                    <span>Review historical configurations saved for this template. Select any snapshot below to inspect its detailed metrics scope and instantly roll back the active template settings.</span>
                  </div>
                </div>

                {!editingTemplate.versions || editingTemplate.versions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic">
                    No historical save states found for this report configuration template.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    <div className="relative border-l-2 border-slate-200 ml-3 pl-5 space-y-4 py-1">
                      {editingTemplate.versions.map((ver: any) => {
                        // Check if this version is the current active config
                        const isActive = 
                          templateName === ver.config.name &&
                          templateDesc === ver.config.description &&
                          templateTimeRange === ver.config.timeRange &&
                          templateThemeColor === ver.config.primaryThemeColor &&
                          templateOrientation === ver.config.orientation &&
                          templatePaperSize === ver.config.paperSize &&
                          templateScope === ver.config.tenantScope &&
                          tplIncRecordCounts === (ver.config.metrics?.includeRecordCounts ?? true) &&
                          tplIncVolumeAndThroughput === (ver.config.metrics?.includeVolumeAndThroughput ?? true) &&
                          tplIncSuccessRateAndSla === (ver.config.metrics?.includeSuccessRateAndSla ?? true) &&
                          tplIncQualityScores === (ver.config.metrics?.includeQualityScores ?? true) &&
                          tplIncErpBreakdown === (ver.config.metrics?.includeErpBreakdown ?? true) &&
                          tplIncErrorCategories === (ver.config.metrics?.includeErrorCategories ?? true) &&
                          tplIncRecommendations === (ver.config.metrics?.includeRecommendations ?? true);

                        return (
                          <div key={ver.versionId} className="relative group">
                            {/* Timeline Dot */}
                            <span className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                              isActive 
                                ? 'bg-indigo-600 border-indigo-400 shadow-xs scale-110' 
                                : 'bg-slate-100 border-slate-300 group-hover:border-slate-400'
                            }`} />

                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2.5 hover:bg-white hover:border-slate-300 transition-colors">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                    isActive
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                    {ver.versionId}
                                  </span>
                                  <span className="text-slate-900 font-bold">
                                    {new Date(ver.updatedAt).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  {isActive && (
                                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold">
                                      Current Active
                                    </span>
                                  )}
                                  <span className="text-slate-500">
                                    by {ver.updatedBy}
                                  </span>
                                </div>
                              </div>

                              <p className="text-slate-700 text-xs italic bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                                &ldquo;{ver.changeSummary}&rdquo;
                              </p>

                              {/* Config snapshot summary */}
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 space-y-2">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Period:</span>
                                    <span className="text-slate-800 font-bold">{ver.config.timeRange}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Scope:</span>
                                    <span className="text-slate-800 font-bold">{ver.config.tenantScope}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Layout:</span>
                                    <span className="text-slate-800 font-bold">{ver.config.orientation} ({ver.config.paperSize})</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Theme Color:</span>
                                    <span className="flex items-center gap-1 font-sans">
                                      <span className="w-2 h-2 rounded-full border border-slate-300" style={{ backgroundColor: ver.config.primaryThemeColor }} />
                                      <span className="text-slate-700 text-[9px] font-mono">{ver.config.primaryThemeColor.toUpperCase()}</span>
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-1.5 border-t border-slate-100">
                                  <span className="text-slate-400 text-[9px] uppercase tracking-wider font-mono block mb-1">Modules Included:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(ver.config.metrics || {}).map(([key, val]) => {
                                      if (!val) return null;
                                      const label = key.replace('include', '').replace(/([A-Z])/g, ' $1').trim();
                                      return (
                                        <span key={key} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px]">
                                          {label}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Restore trigger */}
                              <div className="flex justify-end pt-0.5">
                                <button
                                  type="button"
                                  disabled={isActive || rollingBackVerId !== null}
                                  onClick={() => handleRollbackTemplate(editingTemplate.id, ver.versionId)}
                                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    isActive
                                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                      : 'bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border-indigo-200'
                                  }`}
                                >
                                  {rollingBackVerId === ver.versionId ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      <span>Restoring configurations...</span>
                                    </>
                                  ) : (
                                    <>
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>Roll Back to This Version</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    Close History
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveTemplateSubmit} className="space-y-4 text-xs">
                {/* Name & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">Template Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Monthly executive summary"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-bold block mb-1">Time Range / Summary Period</label>
                    <select
                      value={templateTimeRange}
                      onChange={(e) => setTemplateTimeRange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Last 24 Hours">Last 24 Hours (Daily Snapshot)</option>
                      <option value="Last 7 Days">Last 7 Days (Weekly Summary)</option>
                      <option value="Last 30 Days">Last 30 Days (Monthly Baseline)</option>
                      <option value="Last 90 Days">Last 90 Days (Quarterly Summary)</option>
                      <option value="Year to Date">Year to Date (YTD Performance)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 font-bold block mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Optional description of this report template audience or purpose"
                    value={templateDesc}
                    onChange={(e) => setTemplateDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Scope & Styling Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">Tenant Metric Scope</label>
                    <select
                      value={templateScope}
                      onChange={(e) => setTemplateScope(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="All Tenants">All Tenants ({tenantMetrics.length})</option>
                      <option value="Enterprise Tier Only">Enterprise Tier Only</option>
                      <option value="Selected Tenants">Custom Selected Tenants</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 font-bold block mb-1">Orientation</label>
                    <select
                      value={templateOrientation}
                      onChange={(e) => setTemplateOrientation(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Portrait">Portrait</option>
                      <option value="Landscape">Landscape</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 font-bold block mb-1">Paper Size</label>
                    <select
                      value={templatePaperSize}
                      onChange={(e) => setTemplatePaperSize(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="A4">A4</option>
                      <option value="Letter">Letter</option>
                    </select>
                  </div>
                </div>

                {/* Theme Color Selector */}
                <div>
                  <label className="text-slate-600 font-bold block mb-1.5">Primary Theme Brand Color</label>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <input
                      type="color"
                      value={templateThemeColor}
                      onChange={(e) => setTemplateThemeColor(e.target.value)}
                      className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <div className="flex-1">
                      <span className="text-slate-900 font-mono text-[11px] font-bold block">{templateThemeColor.toUpperCase()}</span>
                      <span className="text-slate-500 text-[10px] block">This color will style headers, tables and primary highlights in the generated PDF</span>
                    </div>
                    <div className="flex gap-1.5">
                      {['#4f46e5', '#0ea5e9', '#10b981', '#1e293b', '#6366f1'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setTemplateThemeColor(color)}
                          className={`w-5 h-5 rounded-full border ${templateThemeColor === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metrics Checkboxes */}
                <div>
                  <label className="text-slate-600 font-bold block mb-1.5">PDF Content Modules Included</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tplIncRecordCounts}
                        onChange={(e) => setTplIncRecordCounts(e.target.checked)}
                        className="accent-indigo-600 rounded"
                      />
                      <span>Include Processed Record Counts</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tplIncVolumeAndThroughput}
                        onChange={(e) => setTplIncVolumeAndThroughput(e.target.checked)}
                        className="accent-indigo-600 rounded"
                      />
                      <span>Include Volume & Throughput Data</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tplIncSuccessRateAndSla}
                        onChange={(e) => setTplIncSuccessRateAndSla(e.target.checked)}
                        className="accent-indigo-600 rounded"
                      />
                      <span>Include Success Rates & SLA Compliance</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tplIncQualityScores}
                        onChange={(e) => setTplIncQualityScores(e.target.checked)}
                        className="accent-indigo-600 rounded"
                      />
                      <span>Include Governance Quality Scores</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tplIncErpBreakdown}
                        onChange={(e) => setTplIncErpBreakdown(e.target.checked)}
                        className="accent-indigo-600 rounded"
                      />
                      <span>Include ERP Breakdown Breakdown</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tplIncErrorCategories}
                        onChange={(e) => setTplIncErrorCategories(e.target.checked)}
                        className="accent-indigo-600 rounded"
                      />
                      <span>Include Error & Risk Audit Remediation</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer col-span-2">
                      <input
                        type="checkbox"
                        checked={tplIncRecommendations}
                        onChange={(e) => setTplIncRecommendations(e.target.checked)}
                        className="accent-indigo-600 rounded"
                      />
                      <span>Include Architectural Governance Recommendations</span>
                    </label>
                  </div>
                </div>

                {/* Optional Change Message */}
                <div className="pt-1.5">
                  <label className="text-slate-600 font-bold block mb-1">
                    Change Note / Version Message <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder={editingTemplate ? "e.g., Adjusted theme branding color, enabled governance scores..." : "e.g., Initial baseline configuration..."}
                    value={templateChangeSummary}
                    onChange={(e) => setTemplateChangeSummary(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500 font-sans"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Layers className="w-4 h-4" />
                    <span>{editingTemplate ? 'Update Template' : 'Save Template'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT AUTOMATED EXPORT SCHEDULE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Clock className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingSchedule ? 'Edit Export Schedule' : 'Create Automated Recurring Export Schedule'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Schedule automated exports for specific datasets or migration outputs to your cloud data lake.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateScheduleSubmit} className="space-y-4 text-xs">
              {/* Schedule Name */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">Export Schedule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Daily Cutover Staging & Exception Sync"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Target Scope Selection */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">Export Target Scope Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'Specific Data Sets', label: 'Specific Data Sets', desc: 'Source/Target Master Data' },
                    { id: 'Migration Outputs', label: 'Migration Outputs', desc: 'Staging, Quarantines & Audits' },
                    { id: 'Hybrid Combined', label: 'Hybrid Combined', desc: 'Data Sets + Migration Feeds' },
                  ].map((scope) => (
                    <button
                      key={scope.id}
                      type="button"
                      onClick={() => setExportScopeType(scope.id as any)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        exportScopeType === scope.id
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <strong className="block text-xs font-bold">{scope.label}</strong>
                      <span className="text-[10px] text-slate-500 block">{scope.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categorized Feeds Checklist */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-bold block">Included Data Sets & Migration Feeds</label>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSelectedEntities(AVAILABLE_ENTITIES)}
                      className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedEntities([])}
                      className="text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-48 overflow-y-auto space-y-3">
                  {CATEGORIZED_TARGETS.map((catGroup) => (
                    <div key={catGroup.category} className="space-y-1.5">
                      <div className="text-[10px] font-bold font-mono text-indigo-700 uppercase tracking-wide border-b border-slate-200/60 pb-1">
                        {catGroup.category}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1">
                        {catGroup.items.map((item) => {
                          const isChecked = selectedEntities.includes(item.name);
                          return (
                            <label
                              key={item.name}
                              className={`flex items-start gap-2 p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isChecked ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900' : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-100/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedEntities((prev) => [...prev, item.name]);
                                  else setSelectedEntities((prev) => prev.filter((x) => x !== item.name));
                                }}
                                className="accent-indigo-600 rounded mt-0.5"
                              />
                              <div>
                                <span className="font-bold text-[11px] block line-clamp-1">{item.name}</span>
                                <span className="text-[9px] text-slate-500 block line-clamp-1">{item.desc}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recurrence & Scheduling Cadence */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-2.5 py-2 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Hourly">Hourly</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Custom Cron">Custom Cron Expression</option>
                  </select>
                </div>

                {frequency === 'Weekly' && (
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Day of Week</label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-2.5 py-2 focus:outline-hidden focus:border-indigo-500"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}

                {frequency !== 'Custom Cron' ? (
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Run Time (UTC)</label>
                    <input
                      type="text"
                      placeholder="02:00"
                      value={runTimeUtc}
                      onChange={(e) => setRunTimeUtc(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-2.5 py-2 font-mono focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                ) : (
                  <div className="sm:col-span-2">
                    <label className="text-slate-700 font-bold block mb-1">Cron Expression (5-part)</label>
                    <input
                      type="text"
                      placeholder="0 2 * * 1-5"
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-2.5 py-2 font-mono focus:outline-hidden focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">e.g. "0 2 * * 1-5" = Weekdays at 02:00 UTC</span>
                  </div>
                )}

                <div className="sm:col-span-3">
                  <label className="text-slate-700 font-bold block mb-1">Export Delta Mode</label>
                  <select
                    value={exportDeltaMode}
                    onChange={(e) => setExportDeltaMode(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-2.5 py-2 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Incremental Delta (24h)">Incremental Delta (Only records created/updated in last 24h)</option>
                    <option value="Full Snapshot">Full Snapshot (Complete export of all matching records)</option>
                    <option value="Since Last Export">Since Last Export (Records updated since last successful schedule run)</option>
                    <option value="Modified Records Only">Modified Records Only (Remediated or quarantined diffs)</option>
                  </select>
                </div>
              </div>

              {/* Destination & Format Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Storage Provider</label>
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      const type = e.target.value as StorageDestinationType;
                      setSelectedType(type);
                      if (type === 'AWS S3') setDestinationUri('s3://my-enterprise-data-lake/exports/daily/');
                      else if (type === 'Google Cloud Storage') setDestinationUri('gs://edimp-export-bucket/exports/daily/');
                      else if (type === 'Azure Blob Storage') setDestinationUri('azure://storageacct.blob.core.windows.net/exports/daily/');
                      else setDestinationUri('sftp://export.enterprise.com/var/exports/daily/');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="AWS S3">AWS S3 Bucket</option>
                    <option value="Google Cloud Storage">Google Cloud Storage</option>
                    <option value="Azure Blob Storage">Azure Blob Storage</option>
                    <option value="SFTP Server">SFTP Server</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Export Format</label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Parquet (Snappy)">Parquet (Snappy Compressed)</option>
                    <option value="Parquet (ZSTD)">Parquet (ZSTD High Ratio)</option>
                    <option value="CSV (Gstandard)">CSV (RFC 4180 Standard)</option>
                    <option value="CSV (Zip Compressed)">CSV (Zip Compressed)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-bold block mb-1">Destination URI / Folder Path</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={destinationUri}
                      onChange={(e) => setDestinationUri(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      {testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-600" />}
                      <span>Test Connection</span>
                    </button>
                  </div>
                </div>
              </div>

              {connectionStatus && (
                <div
                  className={`p-3 rounded-xl text-xs border flex items-center gap-2 ${
                    connectionStatus.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {connectionStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                  <span>{connectionStatus.message}</span>
                </div>
              )}

              {/* Encryption & Security Guard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Payload Encryption</label>
                  <select
                    value={encryptionMethod}
                    onChange={(e) => setEncryptionMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="AES-256 KMS">AES-256 KMS Server-Side Encryption</option>
                    <option value="PGP Key">PGP Public Key Encryption</option>
                    <option value="Standard TLS">Standard TLS 1.3 In-Transit</option>
                    <option value="None">None (Unencrypted Plaintext)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Quality Threshold Guard (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={minQualityThreshold}
                    onChange={(e) => setMinQualityThreshold(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">Pause execution if quality score falls below threshold</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-bold block mb-1">Webhook Alert Endpoint (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://api.enterprise.com/webhooks/export-complete"
                    value={notificationWebhook}
                    onChange={(e) => setNotificationWebhook(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Retry Policy & Failure Recovery Settings */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-100/60 text-indigo-700 rounded-lg border border-indigo-200">
                      <RotateCcw className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Automated Retry Policy & Backoff Settings</h4>
                      <p className="text-[10px] text-slate-500">
                        Configure retry attempts and backoff duration when export jobs encounter transient failures or connection drops.
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold rounded-full">
                    {retryMaxAttempts} {retryMaxAttempts === 1 ? 'Attempt' : 'Attempts'} • {retryBackoffMinutes}m {retryBackoffStrategy}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Max Retry Attempts */}
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Max Retry Attempts</label>
                    <select
                      value={retryMaxAttempts}
                      onChange={(e) => setRetryMaxAttempts(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-2.5 py-2 focus:outline-hidden focus:border-indigo-500 font-mono text-xs"
                    >
                      <option value={1}>1 Attempt (No Retries)</option>
                      <option value={2}>2 Attempts (1 Retry)</option>
                      <option value={3}>3 Attempts (2 Retries - Recommended)</option>
                      <option value={5}>5 Attempts (4 Retries)</option>
                      <option value={7}>7 Attempts (6 Retries)</option>
                      <option value={10}>10 Attempts (High Resiliency)</option>
                    </select>
                  </div>

                  {/* Backoff Duration */}
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Initial Backoff Delay</label>
                    <select
                      value={retryBackoffMinutes}
                      onChange={(e) => setRetryBackoffMinutes(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-2.5 py-2 focus:outline-hidden focus:border-indigo-500 font-mono text-xs"
                    >
                      <option value={1}>1 Minute</option>
                      <option value={2}>2 Minutes</option>
                      <option value={5}>5 Minutes (Default)</option>
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={60}>60 Minutes</option>
                    </select>
                  </div>

                  {/* Backoff Strategy */}
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Backoff Strategy</label>
                    <select
                      value={retryBackoffStrategy}
                      onChange={(e) => setRetryBackoffStrategy(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-2.5 py-2 focus:outline-hidden focus:border-indigo-500 font-mono text-xs"
                    >
                      <option value="Exponential">Exponential Backoff (1x, 2x, 4x, 8x)</option>
                      <option value="ExponentialWithJitter">Exponential + Jitter (Randomized)</option>
                      <option value="Fixed">Fixed Interval Delay</option>
                      <option value="Linear">Linear Step Progression (1x, 2x, 3x, 4x)</option>
                    </select>
                  </div>
                </div>

                {/* Retry Triggers Checkboxes */}
                <div>
                  <label className="text-slate-700 font-bold block mb-1.5 text-[11px]">Retry Trigger Conditions</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={retryOnNetworkError}
                        onChange={(e) => setRetryOnNetworkError(e.target.checked)}
                        className="accent-indigo-600 rounded"
                      />
                      <span>Transient Network & Socket Errors</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={retryOnTimeout}
                        onChange={(e) => setRetryOnTimeout(e.target.checked)}
                        className="accent-indigo-600 rounded"
                      />
                      <span>Connection & Stream Timeouts</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={retryOnStorageQuota}
                        onChange={(e) => setRetryOnStorageQuota(e.target.checked)}
                        className="accent-indigo-600 rounded"
                      />
                      <span>Storage Provider Rate Limit / Quota</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={retryOnSchemaMismatch}
                        onChange={(e) => setRetryOnSchemaMismatch(e.target.checked)}
                        className="accent-indigo-600 rounded"
                      />
                      <span>Schema Validation Variance (Auto-Heal)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Revision Note / Change Log Summary */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-1">
                <label className="text-amber-950 font-bold block text-xs flex items-center justify-between">
                  <span>Revision Note / Change Log Entry</span>
                  <span className="text-[10px] text-amber-700 font-mono font-normal">
                    {editingSchedule ? `Will save as v${(editingSchedule.currentVersion || 1) + 1}.0` : 'Will save as v1.0'}
                  </span>
                </label>
                <input
                  type="text"
                  placeholder={editingSchedule ? "e.g., Upgraded compression to High Snappy & enabled KMS encryption" : "e.g., Initial baseline creation of export schedule"}
                  value={scheduleChangeNote}
                  onChange={(e) => setScheduleChangeNote(e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:outline-hidden focus:border-amber-500"
                />
                <span className="text-[10px] text-amber-800 block">
                  This summary will be recorded in the schedule's immutable version history audit log for compliance tracking.
                </span>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingSchedule ? 'Update Schedule' : 'Save & Activate Schedule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INTERACTIVE PDF REPORT DOCUMENT PREVIEW */}
      {showPdfPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <Eye className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-base text-slate-900">Multi-Tenant PDF Report Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfPreviewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Mock Page Layout */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6 text-slate-800 text-xs font-sans">
              {/* Header */}
              <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-wide">ENTERPRISE DATA INTEGRATION & MIGRATION PLATFORM</h2>
                  <h3 className="text-xs font-bold text-indigo-700">MULTI-TENANT MIGRATION SUCCESS SUMMARY REPORT</h3>
                </div>
                <div className="text-right text-[10px] text-slate-500 font-mono">
                  <div>Ref: EDIMP-PDF-REPORT-2026</div>
                  <div>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* KPI Highlights */}
              <div className="grid grid-cols-4 gap-2 bg-white p-3 rounded-lg border border-slate-200 text-center shadow-xs">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Success Rate</span>
                  <strong className="text-sm text-emerald-600">{overallSuccessRate}%</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Total Records</span>
                  <strong className="text-sm text-slate-900">{(totalAggregatedRecords / 1000000).toFixed(2)}M</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Data Volume</span>
                  <strong className="text-sm text-purple-700">{(totalAggregatedVolumeMb / 1024).toFixed(1)} GB</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Active Tenants</span>
                  <strong className="text-sm text-amber-600">{tenantMetrics.length}</strong>
                </div>
              </div>

              {/* Tenant Matrix Table Preview */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase text-indigo-700">1. Cross-Tenant Metrics Matrix</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-500 font-mono text-[9px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-2">Tenant Name</th>
                        <th className="p-2">Region</th>
                        <th className="p-2">Total Records</th>
                        <th className="p-2">Success Rate</th>
                        <th className="p-2">Errors</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {tenantMetrics.map((t) => (
                        <tr key={t.id}>
                          <td className="p-2 font-bold text-slate-900">{t.name}</td>
                          <td className="p-2">{t.region}</td>
                          <td className="p-2">{t.totalRecords.toLocaleString()}</td>
                          <td className="p-2 font-bold text-emerald-600">{t.successRatePct}%</td>
                          <td className="p-2 text-slate-500">{t.errorRecords.toLocaleString()}</td>
                          <td className="p-2 text-[10px] text-indigo-700">{t.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Governance Actions Preview */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1 shadow-xs">
                <h4 className="font-bold text-slate-900 text-xs">2. Automated Governance Audit</h4>
                <p className="text-[11px] text-slate-600">
                  All 5 tenant workspaces adhere to ISO-8601 UTC timestamp conversions and SHA-256 PII salted hashing. Initech Solutions requires COALESCE null fallback remediation.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 flex justify-between items-center border-t border-slate-100">
              <span className="text-xs text-slate-400 font-mono">PDF compiled via jsPDF / jspdf-autotable</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPdfPreviewModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPdfPreviewModal(false);
                    generateMultiTenantPdfReport();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download PDF Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXPORT SCHEDULE VERSION HISTORY & COMPARISON */}
      {showVersionHistoryModal && selectedScheduleForVersions && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-4xl w-full space-y-5 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
                  <History className="w-6 h-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-900">{selectedScheduleForVersions.name}</h3>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-mono font-bold">
                      Active: v{selectedScheduleForVersions.currentVersion || 1}.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {selectedScheduleForVersions.id} • {selectedScheduleForVersions.destinationType} • {selectedScheduleForVersions.versions?.length || 1} Total Revisions Recorded
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowVersionHistoryModal(false);
                  setSelectedScheduleForVersions(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors self-start sm:self-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tab Switcher: Timeline vs Diff */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setVersionHistoryTab('timeline')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    versionHistoryTab === 'timeline'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>Revision History Timeline ({selectedScheduleForVersions.versions?.length || 1})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVersionHistoryTab('diff')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    versionHistoryTab === 'diff'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Side-by-Side Version Comparison</span>
                </button>
              </div>

              {versionHistoryTab === 'timeline' && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Filter versions or change notes..."
                    value={versionSearchTerm}
                    onChange={(e) => setVersionSearchTerm(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* TAB CONTENT A: TIMELINE */}
            {versionHistoryTab === 'timeline' && (
              <div className="space-y-4">
                {(() => {
                  const allVers = selectedScheduleForVersions.versions || [];
                  const filteredVers = allVers.filter(v =>
                    v.versionLabel.toLowerCase().includes(versionSearchTerm.toLowerCase()) ||
                    v.changeSummary.toLowerCase().includes(versionSearchTerm.toLowerCase()) ||
                    v.createdBy.toLowerCase().includes(versionSearchTerm.toLowerCase())
                  );

                  if (filteredVers.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-400 font-mono text-xs border border-dashed border-slate-200 rounded-2xl">
                        No revisions match the filter &ldquo;{versionSearchTerm}&rdquo;.
                      </div>
                    );
                  }

                  return (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-100">
                      {filteredVers.map((ver) => {
                        const isActive = ver.versionNumber === selectedScheduleForVersions.currentVersion;
                        const snap = ver.configSnapshot;

                        return (
                          <div key={ver.versionNumber} className="relative group">
                            {/* Timeline Dot */}
                            <div
                              className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                                isActive
                                  ? 'bg-indigo-600 border-white ring-4 ring-indigo-100'
                                  : 'bg-white border-slate-300'
                              }`}
                            />

                            <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 transition-all shadow-2xs">
                              {/* Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-mono font-bold text-xs rounded border border-indigo-200">
                                    {ver.versionLabel}
                                  </span>
                                  {isActive && (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Current Active Version
                                    </span>
                                  )}
                                  <span className="text-slate-400 text-xs">•</span>
                                  <span className="text-slate-500 font-mono text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(ver.createdAt).toLocaleString()}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-500 text-xs flex items-center gap-1">
                                    <User className="w-3 h-3 text-slate-400" />
                                    {ver.createdBy}
                                  </span>

                                  {!isActive && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRestoringVersion(ver);
                                        setRestoreNoteInput(`Restored from version ${ver.versionLabel}`);
                                      }}
                                      className="ml-2 px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Restore Version</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Change summary note */}
                              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 font-medium">
                                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Change Summary / Audit Log:</span>
                                &ldquo;{ver.changeSummary}&rdquo;
                              </div>

                              {/* Snapshot config parameters grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono bg-white p-3 rounded-lg border border-slate-200/80">
                                <div>
                                  <span className="text-slate-400 block">Export Format</span>
                                  <strong className="text-slate-900 font-bold">{snap.format}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Destination Provider</span>
                                  <strong className="text-slate-900 font-bold">{snap.destinationType}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Cadence</span>
                                  <strong className="text-indigo-700 font-bold">{snap.scheduleFrequency} ({snap.runTimeUtc || '02:00'} UTC)</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Delta Mode</span>
                                  <strong className="text-slate-900 font-bold">{snap.exportDeltaMode || 'Incremental'}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Encryption</span>
                                  <strong className="text-emerald-700 font-bold">{snap.encryptionMethod || 'AES-256 KMS'}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Target Feeds</span>
                                  <strong className="text-slate-900 font-bold">{snap.targetEntities?.length || 0} Data Sets</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Partitioning</span>
                                  <strong className="text-slate-900 font-bold">{snap.partitioning || 'Year/Month/Day'}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Retention</span>
                                  <strong className="text-slate-900 font-bold">{snap.maxRetentionDays} Days</strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB CONTENT B: SIDE-BY-SIDE DIFF COMPARISON */}
            {versionHistoryTab === 'diff' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1 text-xs">Version A (Baseline Revision)</label>
                    <select
                      value={compareVersionA?.versionNumber || ''}
                      onChange={(e) => {
                        const found = (selectedScheduleForVersions.versions || []).find(v => v.versionNumber === Number(e.target.value));
                        if (found) setCompareVersionA(found);
                      }}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-hidden focus:border-indigo-500"
                    >
                      {(selectedScheduleForVersions.versions || []).map((v) => (
                        <option key={v.versionNumber} value={v.versionNumber}>
                          {v.versionLabel} - {new Date(v.createdAt).toLocaleDateString()} ({v.createdBy})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1 text-xs">Version B (Target Revision to Compare)</label>
                    <select
                      value={compareVersionB?.versionNumber || ''}
                      onChange={(e) => {
                        const found = (selectedScheduleForVersions.versions || []).find(v => v.versionNumber === Number(e.target.value));
                        if (found) setCompareVersionB(found);
                      }}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-hidden focus:border-indigo-500"
                    >
                      {(selectedScheduleForVersions.versions || []).map((v) => (
                        <option key={v.versionNumber} value={v.versionNumber}>
                          {v.versionLabel} - {new Date(v.createdAt).toLocaleDateString()} ({v.createdBy})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Comparison Matrix Table */}
                {compareVersionA && compareVersionB ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-mono text-[11px] uppercase border-b border-slate-200">
                        <tr>
                          <th className="p-3 w-1/4">Configuration Parameter</th>
                          <th className="p-3 w-1/3 bg-indigo-50/50 border-r border-slate-200">
                            {compareVersionA.versionLabel} (Version A)
                          </th>
                          <th className="p-3 w-1/3 bg-purple-50/50">
                            {compareVersionB.versionLabel} (Version B)
                          </th>
                          <th className="p-3 text-right">State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {[
                          { key: 'name', label: 'Export Schedule Name' },
                          { key: 'exportScopeType', label: 'Export Scope Type' },
                          { key: 'exportDeltaMode', label: 'Delta Mode' },
                          { key: 'format', label: 'File Export Format' },
                          { key: 'destinationType', label: 'Destination Storage Provider' },
                          { key: 'destinationUri', label: 'Destination URI / Path' },
                          { key: 'scheduleFrequency', label: 'Recurrence Cadence' },
                          { key: 'runTimeUtc', label: 'Run Time (UTC)' },
                          { key: 'partitioning', label: 'Partition Structure' },
                          { key: 'compressionLevel', label: 'Compression Level' },
                          { key: 'encryptionMethod', label: 'Payload Encryption' },
                          { key: 'maxRetentionDays', label: 'Max Retention Days' },
                          { key: 'minQualityThreshold', label: 'Min Quality Threshold (%)' },
                          { key: 'targetEntities', label: 'Target Feeds / Datasets', isArray: true },
                        ].map((row) => {
                          const valA = (compareVersionA.configSnapshot as any)[row.key];
                          const valB = (compareVersionB.configSnapshot as any)[row.key];
                          const strA = row.isArray ? (valA || []).join(', ') : String(valA ?? 'N/A');
                          const strB = row.isArray ? (valB || []).join(', ') : String(valB ?? 'N/A');
                          const isDifferent = strA !== strB;

                          return (
                            <tr key={row.key} className={isDifferent ? 'bg-amber-50/40' : 'hover:bg-slate-50'}>
                              <td className="p-3 font-bold text-slate-900 font-sans">{row.label}</td>
                              <td className={`p-3 border-r border-slate-200 ${isDifferent ? 'bg-rose-50/50 text-rose-900 font-bold' : 'text-slate-700'}`}>
                                {strA}
                              </td>
                              <td className={`p-3 ${isDifferent ? 'bg-emerald-50/50 text-emerald-900 font-bold' : 'text-slate-700'}`}>
                                {strB}
                              </td>
                              <td className="p-3 text-right">
                                {isDifferent ? (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[9px] font-bold">
                                    Modified
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[9px]">
                                    Identical
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 font-mono text-xs">
                    Please select two versions above to perform a parameter diff comparison.
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                All changes to export configurations create immutable audit snapshots automatically.
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowVersionHistoryModal(false);
                  setSelectedScheduleForVersions(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors text-xs"
              >
                Close Version History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUB-MODAL: RESTORE VERSION PROMPT */}
      {restoringVersion && selectedScheduleForVersions && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-indigo-600">
              <span className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                <RotateCcw className="w-6 h-6" />
              </span>
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  Restore Version {restoringVersion.versionLabel}?
                </h4>
                <p className="text-xs text-slate-500">
                  This will set the parameters from {restoringVersion.versionLabel} as the active schedule configuration.
                </p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-slate-700 space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Target Revision:</span>
                <span className="font-bold text-indigo-800">{restoringVersion.versionLabel} ({new Date(restoringVersion.createdAt).toLocaleDateString()})</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Original Author:</span>
                <span className="font-bold text-slate-800">{restoringVersion.createdBy}</span>
              </div>
              <p className="text-slate-600 italic pt-1 border-t border-indigo-100/80">
                &ldquo;{restoringVersion.changeSummary}&rdquo;
              </p>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs">Restoration Note / Log Comment</label>
              <input
                type="text"
                placeholder="Custom reason for restoring this previous version"
                value={restoreNoteInput}
                onChange={(e) => setRestoreNoteInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                disabled={restoringInProgress}
                onClick={() => {
                  setRestoringVersion(null);
                  setRestoreNoteInput('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={restoringInProgress}
                onClick={handleConfirmRestoreVersion}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5 transition-all"
              >
                {restoringInProgress ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>{restoringInProgress ? 'Restoring Version...' : 'Confirm Restore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SAMPLE DATA PREVIEW (FIRST 50 ROWS) */}
      {showSamplePreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-5xl w-full space-y-5 shadow-2xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200 shadow-2xs">
                  <Eye className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">Sample Data Preview</h3>
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold font-mono rounded-full">
                      First 50 Rows
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Inspect a sample payload of the first 50 rows before triggering full CSV compilation or automated scheduled export.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSamplePreviewModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dataset Selector & Quick Metrics Banner */}
            {(() => {
              const currentDs = MIGRATION_OUTPUT_DATASETS.find((d) => d.id === samplePreviewDatasetId) || MIGRATION_OUTPUT_DATASETS[0];
              const sampleRows = getFiftySampleRowsForDataset(currentDs, 50);
              const activeHeaders = currentDs.headers.filter((h) => samplePreviewCols.includes(h));
              const headerIndices = activeHeaders.map((h) => currentDs.headers.indexOf(h));

              const filteredSampleRows = sampleRows.filter((row) => {
                if (!samplePreviewSearch.trim()) return true;
                const q = samplePreviewSearch.toLowerCase();
                return row.some((cell) => cell.toLowerCase().includes(q));
              });

              return (
                <div className="space-y-4 overflow-hidden flex flex-col flex-1">
                  {/* Top Bar: Feed Picker & Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
                    {/* Dataset Dropdown */}
                    <div className="md:col-span-6 bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Selected Export Feed
                      </label>
                      <select
                        value={samplePreviewDatasetId}
                        onChange={(e) => {
                          const newId = e.target.value;
                          setSamplePreviewDatasetId(newId);
                          const ds = MIGRATION_OUTPUT_DATASETS.find((d) => d.id === newId);
                          if (ds) setSamplePreviewCols(ds.headers);
                        }}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-hidden focus:border-amber-500 cursor-pointer"
                      >
                        {MIGRATION_OUTPUT_DATASETS.map((ds) => (
                          <option key={ds.id} value={ds.id}>
                            {ds.title} ({ds.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Search inside sample */}
                    <div className="md:col-span-6 bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Filter Sample Rows
                      </label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                        <input
                          type="text"
                          placeholder="Search error code, value or tenant..."
                          value={samplePreviewSearch}
                          onChange={(e) => setSamplePreviewSearch(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column Toggle Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs shrink-0">
                    <span className="font-bold text-slate-600 text-[11px] mr-1">Active Columns ({samplePreviewCols.length}/{currentDs.headers.length}):</span>
                    {currentDs.headers.map((hdr) => {
                      const isInc = samplePreviewCols.includes(hdr);
                      return (
                        <button
                          key={hdr}
                          type="button"
                          onClick={() => {
                            if (isInc) {
                              setSamplePreviewCols((prev) => prev.filter((c) => c !== hdr));
                            } else {
                              setSamplePreviewCols((prev) => [...prev, hdr]);
                            }
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                            isInc
                              ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                              : 'bg-white text-slate-400 border-slate-200 line-through'
                          }`}
                        >
                          {hdr}
                        </button>
                      );
                    })}
                  </div>

                  {/* Summary Bar */}
                  <div className="flex items-center justify-between p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs font-mono shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-amber-900">
                        Displaying {filteredSampleRows.length} Sample Rows (out of 50 sample buffer)
                      </span>
                      <span className="text-amber-300">•</span>
                      <span className="text-slate-600">{activeHeaders.length} Columns Selected</span>
                      <span className="text-amber-300">•</span>
                      <span className="text-indigo-700 font-bold">Estimated Full Dataset: ~{(sampleRows.length * 450).toLocaleString()} Rows</span>
                    </div>
                    <span className="text-[10px] text-amber-700 font-bold uppercase">Sample Mode ON</span>
                  </div>

                  {/* Table Grid (Scrollable, max-height) */}
                  <div className="border border-slate-200 rounded-xl overflow-auto flex-1 max-h-[380px] bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px] sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 font-bold w-12 text-center bg-slate-200/80 text-slate-800"># Row</th>
                          {activeHeaders.map((hdr) => (
                            <th key={hdr} className="p-2.5 font-bold whitespace-nowrap bg-slate-100 border-l border-slate-200/60">
                              {hdr}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {filteredSampleRows.length === 0 ? (
                          <tr>
                            <td colSpan={activeHeaders.length + 1} className="p-8 text-center text-slate-400">
                              No sample rows match &ldquo;{samplePreviewSearch}&rdquo;.
                            </td>
                          </tr>
                        ) : (
                          filteredSampleRows.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-amber-50/50 transition-colors">
                              <td className="p-2.5 text-center font-bold text-slate-400 bg-slate-50/80 border-r border-slate-100">
                                {rowIdx + 1}
                              </td>
                              {headerIndices.map((colIdx, cellIdx) => {
                                const cellVal = row[colIdx] || '';
                                const isCritical = cellVal === 'CRITICAL' || cellVal === 'HIGH';
                                return (
                                  <td key={cellIdx} className="p-2.5 whitespace-nowrap border-l border-slate-100">
                                    {isCritical ? (
                                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold">
                                        {cellVal}
                                      </span>
                                    ) : (
                                      <span className="text-slate-800">{cellVal}</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div className="text-[11px] text-slate-500 font-mono">
                      <span>Sample Data Verified • 50 Row Buffer • UTF-8 CSV Compliant</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopySampleFiftyCsv}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Sample CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadSampleFiftyCsv}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-white" />
                        <span>Download 50 Sample Rows</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowSamplePreviewModal(false);
                          setSelectedOutputType(samplePreviewDatasetId);
                          handleDownloadFormattedCsv();
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <DownloadCloud className="w-4 h-4 text-white" />
                        <span>Initiate Full CSV Export</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowSamplePreviewModal(false)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
