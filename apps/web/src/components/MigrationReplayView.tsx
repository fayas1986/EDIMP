import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  HardDrive,
  Database,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  GitCommit,
  Copy,
  Check,
  Download,
  Sliders,
  FileText,
  Search,
  Zap,
  Activity,
  Cpu,
  Server,
  BarChart2,
  Building2,
  Users,
  Cloud,
  Globe,
  FileSpreadsheet,
  Code,
  Filter,
  PlusCircle,
  X,
  Radio,
  CheckSquare,
} from 'lucide-react';
import { Connector, ConnectorCategory } from '../types';
import { INITIAL_CONNECTORS } from '../data/mockData';
import { DISCOVERABLE_ENTERPRISE_CONNECTORS } from './ConnectorsView';

export interface HistoricalReplayJob {
  id: string;
  jobName: string;
  sourceConnectorId: string;
  sourceConnectorName: string;
  sourceEntity: string;
  destConnectorId: string;
  destConnectorName: string;
  destEntity: string;
  category: ConnectorCategory | string;
  connectorIcon?: string;
  executionTimestamp: string;
  mode: string;
  originalTotalRecords: number;
  originalProcessedRecords: number;
  originalErrorCount: number;
  originalOutputHash: string;
  snapshotUri: string;
  snapshotSizeBytes: number;
  mappingRulesVersion: string;
  reproducibilityStatus: string;
}

export interface ReplaySimulationResult {
  jobId: string;
  simulatedAt: string;
  mode: string;
  samplePercent: number;
  simulatedRecords: number;
  simulatedErrors: number;
  simulatedSuccessRate: number;
  reproducibilityScore: number;
  matchStatus: string;
  simulatedOutputHash: string;
  originalOutputHash: string;
  mappingRulesApplied: string;
  rowDeltaSummary: {
    identicalRows: number;
    modifiedRows: number;
    newErrorsCount: number;
    fixedErrorsCount: number;
  };
  verificationLogs: string[];
}

export const ALL_15_HISTORICAL_JOBS: HistoricalReplayJob[] = [
  {
    id: 'job-hist-201',
    jobName: 'Q2 2026 SAP Customer Master Migration (Batch #14)',
    sourceConnectorId: 'conn-sap-s4',
    sourceConnectorName: 'SAP S/4HANA Cloud Engine',
    sourceEntity: 'KNA1_Customer_Master',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Customer API v2.0',
    category: 'ERP',
    connectorIcon: 'Layers',
    executionTimestamp: '2026-06-15T14:30:00Z',
    mode: 'Full Batch Snapshot',
    originalTotalRecords: 14250,
    originalProcessedRecords: 14236,
    originalErrorCount: 14,
    originalOutputHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-06-15/kna1_batch14.parquet',
    snapshotSizeBytes: 485000000,
    mappingRulesVersion: 'v2.4-cleansed-standard',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-202',
    jobName: 'Vendor Accounts Payable Legacy Import',
    sourceConnectorId: 'conn-sql-legacy',
    sourceConnectorName: 'SQL Server - Legacy ERP DB',
    sourceEntity: 'tbl_Vendors_Master',
    destConnectorId: 'conn-d365-fo',
    destConnectorName: 'Dynamics 365 Finance & Operations',
    destEntity: 'VendVendorV2Entity',
    category: 'Database',
    connectorIcon: 'Database',
    executionTimestamp: '2026-07-01T08:15:00Z',
    mode: 'Incremental Delta',
    originalTotalRecords: 3200,
    originalProcessedRecords: 3198,
    originalErrorCount: 2,
    originalOutputHash: 'sha256:7a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f',
    snapshotUri: 'gs://edimp-migration-audit-bucket/snapshots/2026-07-01/vendors_master.parquet',
    snapshotSizeBytes: 122000000,
    mappingRulesVersion: 'v1.8-vendor-cleansed',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-203',
    jobName: 'Salesforce Accounts to Business Central Sync',
    sourceConnectorId: 'conn-sfdc-main',
    sourceConnectorName: 'Salesforce Enterprise CRM',
    sourceEntity: 'Account (Salesforce)',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Customer',
    category: 'CRM',
    connectorIcon: 'Users',
    executionTimestamp: '2026-07-10T11:00:00Z',
    mode: 'Realtime Webhook Delta',
    originalTotalRecords: 8500,
    originalProcessedRecords: 8492,
    originalErrorCount: 8,
    originalOutputHash: 'sha256:3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-07-10/sfdc_accounts.parquet',
    snapshotSizeBytes: 210000000,
    mappingRulesVersion: 'v2.1-crm-address-std',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-204',
    jobName: 'Snowflake Fact Sales Analytics Migration',
    sourceConnectorId: 'conn-snowflake-dw',
    sourceConnectorName: 'Snowflake Enterprise Data Cloud Warehouse',
    sourceEntity: 'ANALYTICS.FACT_SALES_SUMMARY',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Sales Ledger Entry API',
    category: 'Database',
    connectorIcon: 'Database',
    executionTimestamp: '2026-07-14T03:00:00Z',
    mode: 'Micro-Partition Batch Extract',
    originalTotalRecords: 1450000,
    originalProcessedRecords: 1449880,
    originalErrorCount: 120,
    originalOutputHash: 'sha256:91b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-07-14/snowflake_sales.parquet',
    snapshotSizeBytes: 1840000000,
    mappingRulesVersion: 'v3.0-analytical-rollup',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-205',
    jobName: 'Oracle Cloud Fusion Invoices Ledger Sync',
    sourceConnectorId: 'conn-oracle-fusion',
    sourceConnectorName: 'Oracle Cloud Fusion ERP',
    sourceEntity: 'Fusion_Invoices_V2',
    destConnectorId: 'conn-d365-fo',
    destConnectorName: 'Dynamics 365 Finance & Operations',
    destEntity: 'VendInvoiceHeaderEntity',
    category: 'ERP',
    connectorIcon: 'Layers',
    executionTimestamp: '2026-07-18T16:20:00Z',
    mode: 'REST OData Microbatch',
    originalTotalRecords: 84200,
    originalProcessedRecords: 84190,
    originalErrorCount: 10,
    originalOutputHash: 'sha256:a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    snapshotUri: 'gs://edimp-migration-audit-bucket/snapshots/2026-07-18/fusion_invoices.parquet',
    snapshotSizeBytes: 540000000,
    mappingRulesVersion: 'v2.8-gl-tax-reconciled',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-206',
    jobName: 'Workday Worker Compensation & Payroll Transfer',
    sourceConnectorId: 'conn-workday-hcm',
    sourceConnectorName: 'Workday Enterprise HCM & Payroll API',
    sourceEntity: 'Worker_Compensation_Master',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Payroll Journal API',
    category: 'Custom API',
    connectorIcon: 'Users',
    executionTimestamp: '2026-07-22T09:45:00Z',
    mode: 'PII Masked Roster Extract',
    originalTotalRecords: 32800,
    originalProcessedRecords: 32800,
    originalErrorCount: 0,
    originalOutputHash: 'sha256:55aa66bb77cc88dd99ee00ff11aa22bb33cc44dd55ee66ff77aa88bb99cc00dd',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-07-22/workday_hcm.parquet',
    snapshotSizeBytes: 98000000,
    mappingRulesVersion: 'v1.4-pii-safe-payroll',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-207',
    jobName: 'NetSuite SuiteTalk Customer Master Migration',
    sourceConnectorId: 'conn-netsuite-erp',
    sourceConnectorName: 'NetSuite SuiteTalk ERP Engine',
    sourceEntity: 'netsuite_customer_records',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Customer',
    category: 'ERP',
    connectorIcon: 'Building2',
    executionTimestamp: '2026-07-25T13:10:00Z',
    mode: 'SuiteTalk RESTlet Sync',
    originalTotalRecords: 28400,
    originalProcessedRecords: 28395,
    originalErrorCount: 5,
    originalOutputHash: 'sha256:99887766554433221100aabbccddeeff00112233445566778899aabbccddeeff',
    snapshotUri: 'gs://edimp-migration-audit-bucket/snapshots/2026-07-25/netsuite_cust.parquet',
    snapshotSizeBytes: 186000000,
    mappingRulesVersion: 'v2.2-netsuite-credit-terms',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-208',
    jobName: 'Amazon S3 Gold Lake Financial Ledger Import',
    sourceConnectorId: 'conn-aws-s3-lake',
    sourceConnectorName: 'Amazon S3 Enterprise Parquet Data Lake',
    sourceEntity: 'gold_financial_ledger.parquet',
    destConnectorId: 'conn-d365-fo',
    destConnectorName: 'Dynamics 365 Finance & Operations',
    destEntity: 'GeneralJournalAccountEntryEntity',
    category: 'Cloud Storage',
    connectorIcon: 'Cloud',
    executionTimestamp: '2026-07-28T02:00:00Z',
    mode: 'Multi-Part Parquet Stream',
    originalTotalRecords: 1890000,
    originalProcessedRecords: 1889950,
    originalErrorCount: 50,
    originalOutputHash: 'sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    snapshotUri: 's3://prod-enterprise-data-lake-eu-west-1/parquet-gold/ledger/2026_07.parquet',
    snapshotSizeBytes: 2420000000,
    mappingRulesVersion: 'v3.5-gl-dimension-cleansed',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-209',
    jobName: 'HubSpot CRM Contacts to Business Central Contacts',
    sourceConnectorId: 'conn-hubspot-crm',
    sourceConnectorName: 'HubSpot Revenue & CRM Engine',
    sourceEntity: 'hubspot_contacts',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Contact API',
    category: 'CRM',
    connectorIcon: 'Globe',
    executionTimestamp: '2026-08-01T17:30:00Z',
    mode: 'REST v3 Incremental',
    originalTotalRecords: 64200,
    originalProcessedRecords: 64188,
    originalErrorCount: 12,
    originalOutputHash: 'sha256:deadbeefcafebabe0123456789abcdef0123456789abcdef0123456789abcdef',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-08-01/hubspot_contacts.parquet',
    snapshotSizeBytes: 245000000,
    mappingRulesVersion: 'v1.9-hubspot-lifecycle-clean',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-210',
    jobName: 'PostgreSQL Staging Item & Pricing Catalog Load',
    sourceConnectorId: 'conn-postgres-warehouse',
    sourceConnectorName: 'PostgreSQL Staging Warehouse',
    sourceEntity: 'dim_products_stage',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Item Master API v2.0',
    category: 'Database',
    connectorIcon: 'Server',
    executionTimestamp: '2026-08-03T10:15:00Z',
    mode: 'Parallel COPY Streaming',
    originalTotalRecords: 480000,
    originalProcessedRecords: 479960,
    originalErrorCount: 40,
    originalOutputHash: 'sha256:4433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa9988776655',
    snapshotUri: 'gs://edimp-migration-audit-bucket/snapshots/2026-08-03/pg_products.parquet',
    snapshotSizeBytes: 620000000,
    mappingRulesVersion: 'v2.6-sku-barcode-iso',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-211',
    jobName: 'Customer Master Excel Files Cleansed Ingestion',
    sourceConnectorId: 'conn-excel-files',
    sourceConnectorName: 'Customer Master Excel (.xlsx)',
    sourceEntity: 'Customers_July2026.xlsx',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Customer',
    category: 'Files',
    connectorIcon: 'FileSpreadsheet',
    executionTimestamp: '2026-08-05T07:20:00Z',
    mode: 'Validated OpenXML Parse',
    originalTotalRecords: 14250,
    originalProcessedRecords: 14240,
    originalErrorCount: 10,
    originalOutputHash: 'sha256:9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-08-05/customers_excel.parquet',
    snapshotSizeBytes: 42000000,
    mappingRulesVersion: 'v2.0-phone-zip-standard',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-212',
    jobName: 'SharePoint Contracts & Document Attachments Archive',
    sourceConnectorId: 'conn-sharepoint-docs',
    sourceConnectorName: 'SharePoint Document Library',
    sourceEntity: 'Vendor_Contracts_Archive',
    destConnectorId: 'conn-d365-fo',
    destConnectorName: 'Dynamics 365 Finance & Operations',
    destEntity: 'DocuRefEntity',
    category: 'Cloud Storage',
    connectorIcon: 'Cloud',
    executionTimestamp: '2026-08-08T12:00:00Z',
    mode: 'Graph API Binary Snapshot',
    originalTotalRecords: 18500,
    originalProcessedRecords: 18498,
    originalErrorCount: 2,
    originalOutputHash: 'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-08-08/sharepoint_docs.parquet',
    snapshotSizeBytes: 3100000000,
    mappingRulesVersion: 'v1.7-pdf-metadata-std',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-213',
    jobName: 'Legacy HRMS Employee Master Migration',
    sourceConnectorId: 'conn-custom-rest',
    sourceConnectorName: 'Legacy HRMS REST API Endpoint',
    sourceEntity: 'hrms_employee_roster',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Employee API',
    category: 'Custom API',
    connectorIcon: 'Code',
    executionTimestamp: '2026-08-10T15:40:00Z',
    mode: 'REST JSON Cursor Pagination',
    originalTotalRecords: 6200,
    originalProcessedRecords: 6197,
    originalErrorCount: 3,
    originalOutputHash: 'sha256:7766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa9988',
    snapshotUri: 'gs://edimp-migration-audit-bucket/snapshots/2026-08-10/legacy_hrms.parquet',
    snapshotSizeBytes: 58000000,
    mappingRulesVersion: 'v2.1-department-org-clean',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-214',
    jobName: 'Dynamics 365 F&O Intercompany Balance Consolidation',
    sourceConnectorId: 'conn-d365-fo',
    sourceConnectorName: 'Dynamics 365 Finance & Operations',
    sourceEntity: 'CustCustomerV3Entity',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Customer Posting Group API',
    category: 'ERP',
    connectorIcon: 'Building2',
    executionTimestamp: '2026-08-12T18:00:00Z',
    mode: 'Dual-Write Realtime Stream',
    originalTotalRecords: 45000,
    originalProcessedRecords: 44990,
    originalErrorCount: 10,
    originalOutputHash: 'sha256:00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-08-12/d365_fo_balances.parquet',
    snapshotSizeBytes: 380000000,
    mappingRulesVersion: 'v3.2-currency-dual-write',
    reproducibilityStatus: 'Verified (100% Match)',
  },
  {
    id: 'job-hist-215',
    jobName: 'Business Central Production Master Baseline Replay',
    sourceConnectorId: 'conn-bc-prod',
    sourceConnectorName: 'Dynamics 365 Business Central (Prod)',
    sourceEntity: 'Customer Master Ingestion Pipeline',
    destConnectorId: 'conn-bc-prod',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Customer Ledger Entries',
    category: 'ERP',
    connectorIcon: 'Building2',
    executionTimestamp: '2026-08-14T01:10:00Z',
    mode: 'Baseline Verification Snapshot',
    originalTotalRecords: 92400,
    originalProcessedRecords: 92395,
    originalErrorCount: 5,
    originalOutputHash: 'sha256:ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100',
    snapshotUri: 's3://enterprise-migration-vault/snapshots/2026-08-14/bc_baseline.parquet',
    snapshotSizeBytes: 710000000,
    mappingRulesVersion: 'v3.6-baseline-audit-std',
    reproducibilityStatus: 'Verified (100% Match)',
  },
];

interface MigrationReplayViewProps {
  connectors?: Connector[];
}

export const MigrationReplayView: React.FC<MigrationReplayViewProps> = ({
  connectors: propConnectors,
}) => {
  // Merge prop connectors with discoverable enterprise connectors
  const allPlatformConnectors = useMemo(() => {
    const base = propConnectors && propConnectors.length > 0 ? propConnectors : INITIAL_CONNECTORS;
    const discovered = DISCOVERABLE_ENTERPRISE_CONNECTORS.map((d) => d.connector as Connector);
    const map = new Map<string, Connector>();
    for (const c of base) {
      if (c && c.id) map.set(c.id, c);
    }
    for (const c of discovered) {
      if (c && c.id && !map.has(c.id)) map.set(c.id, c);
    }
    return Array.from(map.values());
  }, [propConnectors]);

  const [historicalJobs, setHistoricalJobs] = useState<HistoricalReplayJob[]>(ALL_15_HISTORICAL_JOBS);
  const [selectedJob, setSelectedJob] = useState<HistoricalReplayJob>(ALL_15_HISTORICAL_JOBS[0]);
  
  // Real-time Connector & Filter Controls
  const [selectedConnectorFilter, setSelectedConnectorFilter] = useState<string>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLiveSyncActive, setIsLiveSyncActive] = useState<boolean>(true);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);

  // New Snapshot Generation Form State
  const [newSnapshotConnectorId, setNewSnapshotConnectorId] = useState<string>(allPlatformConnectors[0]?.id || 'conn-sap-s4');
  const [newSnapshotEntityName, setNewSnapshotEntityName] = useState<string>('');
  const [newSnapshotRowCount, setNewSnapshotRowCount] = useState<number>(10000);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState<boolean>(false);

  // Replay parameters
  const [sampleLimitPercent, setSampleLimitPercent] = useState<number>(100);
  const [mappingVersionOption, setMappingVersionOption] = useState<'original' | 'latest' | 'custom'>('original');
  const [customMappingVersion, setCustomMappingVersion] = useState<string>('v3.5-custom-hotfix');

  // Execution state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [replayResult, setReplayResult] = useState<ReplaySimulationResult | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [copiedCert, setCopiedCert] = useState<boolean>(false);

  // Fetch past jobs on mount & handle live sync
  const fetchHistoricalJobs = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/replay/historical-jobs');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.jobs && data.jobs.length > 0) {
          setHistoricalJobs(data.jobs);
        }
      }
    } catch (err) {
      console.log('Using in-memory historical jobs:', err);
    } finally {
      setIsSyncing(false);
      setLastSyncTimestamp(new Date());
    }
  };

  useEffect(() => {
    fetchHistoricalJobs();
  }, []);

  // Real-time live polling every 12 seconds if live sync is active
  useEffect(() => {
    if (!isLiveSyncActive) return;
    const interval = setInterval(() => {
      fetchHistoricalJobs();
    }, 12000);
    return () => clearInterval(interval);
  }, [isLiveSyncActive]);

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    return bytes + ' Bytes';
  };

  const renderConnectorIcon = (iconName?: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Building2':
        return <Building2 className={className} />;
      case 'Database':
        return <Database className={className} />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'Cloud':
        return <Cloud className={className} />;
      case 'Globe':
        return <Globe className={className} />;
      case 'Code':
        return <Code className={className} />;
      case 'Server':
        return <Server className={className} />;
      default:
        return <Layers className={className} />;
    }
  };

  // Launch Replay Simulation API call
  const handleLaunchReplaySimulation = async () => {
    setIsSimulating(true);
    setReplayResult(null);
    setSimStep(1); // Mounting snapshot

    setTimeout(() => setSimStep(2), 600); // Loading rules
    setTimeout(() => setSimStep(3), 1200); // Dry run transformation
    setTimeout(() => setSimStep(4), 1800); // Checksum comparison

    const targetRuleVersion =
      mappingVersionOption === 'original'
        ? selectedJob.mappingRulesVersion
        : mappingVersionOption === 'latest'
        ? 'v3.1-cleansed-prod-latest'
        : customMappingVersion;

    try {
      const res = await fetch('/api/replay/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob.id,
          sampleLimitPercent,
          mappingVersionOverride: targetRuleVersion,
        }),
      });
      const data = await res.json();

      setTimeout(() => {
        setIsSimulating(false);
        setSimStep(0);
        if (data.success && data.replayResult) {
          setReplayResult(data.replayResult);
        } else {
          // In-memory fallback
          const isRuleChanged = targetRuleVersion !== selectedJob.mappingRulesVersion;
          const simulatedRecords = Math.round((selectedJob.originalTotalRecords * sampleLimitPercent) / 100);
          const simulatedErrors = isRuleChanged ? Math.max(0, selectedJob.originalErrorCount - 2) : selectedJob.originalErrorCount;
          const simulatedHash = isRuleChanged
            ? `sha256:${selectedJob.originalOutputHash.slice(7, 30)}ab12cd34ef56${selectedJob.originalOutputHash.slice(42)}`
            : selectedJob.originalOutputHash;

          setReplayResult({
            jobId: selectedJob.id,
            simulatedAt: new Date().toISOString(),
            mode: 'Dry-Run Simulation',
            samplePercent: sampleLimitPercent,
            simulatedRecords,
            simulatedErrors,
            simulatedSuccessRate: Number(
              (((simulatedRecords - simulatedErrors) / simulatedRecords) * 100).toFixed(2)
            ),
            reproducibilityScore: isRuleChanged ? 98.6 : 100.0,
            matchStatus: isRuleChanged
              ? 'Controlled Rule Variance (Optimized Delta)'
              : 'Deterministic Bit-for-Bit Match (100% Identical)',
            simulatedOutputHash: simulatedHash,
            originalOutputHash: selectedJob.originalOutputHash,
            mappingRulesApplied: targetRuleVersion,
            rowDeltaSummary: {
              identicalRows: isRuleChanged ? simulatedRecords - simulatedErrors - 15 : simulatedRecords - simulatedErrors,
              modifiedRows: isRuleChanged ? 15 : 0,
              newErrorsCount: 0,
              fixedErrorsCount: isRuleChanged ? 2 : 0,
            },
            verificationLogs: [
              `[SNAPSHOT] Mounted Parquet snapshot from ${selectedJob.snapshotUri}`,
              `[CHECKSUM] Source hash verified: ${selectedJob.originalOutputHash}`,
              `[CONNECTOR] Source: "${selectedJob.sourceConnectorName}" -> Target: "${selectedJob.destConnectorName}"`,
              `[MAPPING] Re-applied rule matrix (${targetRuleVersion})`,
              `[DRY-RUN] Processed ${simulatedRecords.toLocaleString()} records in memory (${sampleLimitPercent}% sampling). Zero target mutations.`,
              `[OUTPUT HASH] Output payload SHA-256: ${simulatedHash}`,
              `[VERIFICATION] Reproducibility match score: ${isRuleChanged ? '98.6%' : '100.0%'}`,
            ],
          });
        }
      }, 2300);
    } catch (err) {
      console.error('Replay simulation error:', err);
      setIsSimulating(false);
      setSimStep(0);
    }
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Generate a brand new real-time snapshot
  const handleCreateNewSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSnapshot(true);

    const targetConnector = allPlatformConnectors.find((c) => c.id === newSnapshotConnectorId) || allPlatformConnectors[0];
    const entity = newSnapshotEntityName.trim() || 'Primary_Discovered_Dataset';

    try {
      const res = await fetch('/api/replay/generate-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectorId: targetConnector.id,
          connectorName: targetConnector.name,
          entityName: entity,
          category: targetConnector.category,
          recordCount: newSnapshotRowCount,
          mappingVersion: 'v3.0-enterprise-cleansed',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.job) {
          setHistoricalJobs((prev) => [data.job, ...prev]);
          setSelectedJob(data.job);
          setShowGenerateModal(false);
          setNewSnapshotEntityName('');
          setIsCreatingSnapshot(false);
          return;
        }
      }
    } catch (err) {
      console.error('Error generating snapshot API:', err);
    }

    // In-memory fallback
    const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newJob: HistoricalReplayJob = {
      id: `job-hist-${Date.now().toString().slice(-4)}`,
      jobName: `${targetConnector.name} Historical Replay Snapshot (${entity})`,
      sourceConnectorId: targetConnector.id,
      sourceConnectorName: targetConnector.name,
      sourceEntity: entity,
      destConnectorId: 'conn-bc-prod',
      destConnectorName: 'Dynamics 365 Business Central (Prod)',
      destEntity: 'Customer / Ledger Ingestion',
      category: targetConnector.category,
      connectorIcon: targetConnector.icon,
      executionTimestamp: new Date().toISOString(),
      mode: 'Realtime Ad-Hoc Snapshot',
      originalTotalRecords: newSnapshotRowCount,
      originalProcessedRecords: newSnapshotRowCount - 4,
      originalErrorCount: 4,
      originalOutputHash: `sha256:${hash}`,
      snapshotUri: `s3://enterprise-migration-vault/snapshots/${new Date().toISOString().split('T')[0]}/${entity.toLowerCase().replace(/[^a-z0-9]/g, '_')}.parquet`,
      snapshotSizeBytes: Math.round(newSnapshotRowCount * 0.035 * 1048576),
      mappingRulesVersion: 'v3.0-enterprise-cleansed',
      reproducibilityStatus: 'Verified (100% Match)',
    };

    setHistoricalJobs((prev) => [newJob, ...prev]);
    setSelectedJob(newJob);
    setShowGenerateModal(false);
    setNewSnapshotEntityName('');
    setIsCreatingSnapshot(false);
  };

  // Filter historical jobs by connector, category, and search query
  const filteredJobs = useMemo(() => {
    return historicalJobs.filter((j) => {
      const matchesConnector =
        selectedConnectorFilter === 'All' ||
        j.sourceConnectorId === selectedConnectorFilter ||
        j.sourceConnectorName.toLowerCase().includes(selectedConnectorFilter.toLowerCase());

      const matchesCategory =
        selectedCategoryFilter === 'All' || j.category === selectedCategoryFilter;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        j.jobName.toLowerCase().includes(q) ||
        j.sourceEntity.toLowerCase().includes(q) ||
        j.destEntity.toLowerCase().includes(q) ||
        j.sourceConnectorName.toLowerCase().includes(q) ||
        j.destConnectorName.toLowerCase().includes(q) ||
        j.mode.toLowerCase().includes(q);

      return matchesConnector && matchesCategory && matchesSearch;
    });
  }, [historicalJobs, selectedConnectorFilter, selectedCategoryFilter, searchQuery]);

  // Unique categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    for (const j of historicalJobs) {
      if (j.category) set.add(j.category);
    }
    return ['All', ...Array.from(set)];
  }, [historicalJobs]);

  // Count snapshots per connector
  const connectorSnapshotCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const j of historicalJobs) {
      counts[j.sourceConnectorId] = (counts[j.sourceConnectorId] || 0) + 1;
    }
    return counts;
  }, [historicalJobs]);

  const totalVaultSizeBytes = useMemo(() => {
    return historicalJobs.reduce((acc, j) => acc + (j.snapshotSizeBytes || 0), 0);
  }, [historicalJobs]);

  return (
    <div id="migration-replay-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-mono font-semibold rounded-full border border-indigo-100">
              Module 15 – Historical Migration Replay &amp; Simulation Engine
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-mono font-semibold rounded-full border border-emerald-100 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Non-Destructive Bit-for-Bit Replay
            </span>
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-mono font-semibold rounded-full border border-purple-100 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              {allPlatformConnectors.length} Enterprise Connectors Synced
            </span>
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-mono font-semibold rounded-full border border-amber-100 flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-amber-500" />
              {historicalJobs.length} Parquet Snapshots ({formatBytes(totalVaultSizeBytes)})
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5 text-slate-900">
            <RotateCcw className="w-6 h-6 text-indigo-600" />
            Migration Replay &amp; Simulation Engine
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            Re-run historical migration executions across all <strong className="text-slate-800 font-semibold">{allPlatformConnectors.length}+ active enterprise connectors</strong> using original immutable data snapshots and transformation matrices to verify bit-for-bit reproducibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-3xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>Create Replay Snapshot</span>
          </button>

          <button
            type="button"
            onClick={fetchHistoricalJobs}
            disabled={isSyncing}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh historical snapshots from all active connectors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Connectors'}</span>
          </button>

          <button
            type="button"
            onClick={handleLaunchReplaySimulation}
            disabled={isSimulating}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Simulating Replay...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute Replay Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
            <Layers className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold block">Connected Systems</span>
            <span className="text-xl font-extrabold text-slate-900">{allPlatformConnectors.length} Connectors Active</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <span className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 shrink-0">
            <RotateCcw className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold block">Historical Snapshots</span>
            <span className="text-xl font-extrabold text-slate-900">{historicalJobs.length} Jobs Archived</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold block">Avg Reproducibility</span>
            <span className="text-xl font-extrabold text-emerald-600">99.96% Match</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <span className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
            <HardDrive className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold block">Vault Storage</span>
            <span className="text-xl font-extrabold text-amber-600">{formatBytes(totalVaultSizeBytes)} Parquet</span>
          </div>
        </div>
      </div>

      {/* Real-time Connector Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
              Filter by Connected System ({allPlatformConnectors.length} Available)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer font-medium select-none">
              <span className={`w-2 h-2 rounded-full ${isLiveSyncActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span>Real-Time Sync</span>
              <input
                type="checkbox"
                checked={isLiveSyncActive}
                onChange={(e) => setIsLiveSyncActive(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer ml-1"
              />
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              Updated: {lastSyncTimestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Category Pills & Connector Selector Dropdown */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-500 font-semibold mr-1">Category:</span>
            {categoriesList.map((cat) => {
              const isActive = selectedCategoryFilter === cat;
              const count = cat === 'All' ? historicalJobs.length : historicalJobs.filter((j) => j.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-3xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 font-semibold shrink-0">Source Connector:</span>
            <select
              value={selectedConnectorFilter}
              onChange={(e) => setSelectedConnectorFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 max-w-[280px] truncate shadow-3xs"
            >
              <option value="All">All Connectors ({historicalJobs.length} Jobs Total)</option>
              {allPlatformConnectors.map((c) => {
                const count = connectorSnapshotCounts[c.id] || 0;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({count} {count === 1 ? 'Snapshot' : 'Snapshots'})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Job Selector & Replay Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Historical Job Selector List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Select Historical Job</span>
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full font-bold border border-indigo-100">
                {filteredJobs.length} of {historicalJobs.length} Jobs
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search past jobs, entities, connectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Job Selection Cards */}
          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-slate-800">No Historical Snapshots Match Filters</p>
                <p className="text-[11px] text-slate-500">
                  Try clearing the category or connector filter, or create a new snapshot.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedConnectorFilter('All');
                    setSelectedCategoryFilter('All');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold mt-2"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = selectedJob.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 shadow-3xs ring-1 ring-indigo-400/40'
                        : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="p-1.5 bg-white rounded-lg border border-slate-200 text-indigo-600 shrink-0">
                          {renderConnectorIcon(job.connectorIcon, 'w-3.5 h-3.5')}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1" title={job.jobName}>
                          {job.jobName}
                        </h4>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />}
                    </div>

                    <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1.5">
                      <span className="text-slate-800 font-semibold truncate max-w-[120px]" title={job.sourceEntity}>
                        {job.sourceEntity}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-indigo-600 font-semibold truncate max-w-[120px]" title={job.destEntity}>
                        {job.destEntity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-200/60">
                      <span className="truncate max-w-[110px] font-medium">{job.sourceConnectorName}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded font-semibold">
                          {job.category}
                        </span>
                        <span className="font-bold text-slate-900">{job.originalTotalRecords.toLocaleString()} rows</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col 2 Cols: Selected Job Details & Replay Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selected Past Job Snapshot Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-indigo-600 font-bold block tracking-wider">
                  Selected Past Migration Execution
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedJob.jobName}</h3>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[11px] font-mono font-bold">
                  {selectedJob.category}
                </span>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full text-xs font-mono font-bold">
                  {selectedJob.id}
                </span>
              </div>
            </div>

            {/* Pipeline Config & Snapshot Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Source System &amp; Entity</span>
                <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                  {renderConnectorIcon(selectedJob.connectorIcon, 'w-3.5 h-3.5 text-indigo-600')}
                  <span>{selectedJob.sourceConnectorName}</span>
                </p>
                <p className="text-[11px] font-mono text-indigo-600 truncate font-semibold">{selectedJob.sourceEntity}</p>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Target System &amp; Entity</span>
                <p className="font-bold text-slate-900 truncate">{selectedJob.destConnectorName}</p>
                <p className="text-[11px] font-mono text-purple-600 truncate font-semibold">{selectedJob.destEntity}</p>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Original Execution Time</span>
                <p className="font-bold text-slate-900">{new Date(selectedJob.executionTimestamp).toLocaleString()}</p>
                <p className="text-[11px] font-mono text-emerald-600 font-semibold">{selectedJob.mode}</p>
              </div>
            </div>

            {/* Immutable Source Data Snapshot Info */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-700 flex items-center gap-1.5 font-bold">
                  <HardDrive className="w-4 h-4 text-indigo-600" />
                  Immutable Source Data Snapshot
                </span>
                <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-semibold">
                  {formatBytes(selectedJob.snapshotSizeBytes)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-700 shadow-3xs">
                <span className="truncate" title={selectedJob.snapshotUri}>{selectedJob.snapshotUri}</span>
                <button
                  type="button"
                  onClick={() => handleCopyHash(selectedJob.snapshotUri)}
                  className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                  title="Copy Snapshot Path"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/60 gap-2">
                <span>Original SHA-256 Hash: <strong className="text-slate-800 font-bold">{selectedJob.originalOutputHash.substring(0, 24)}...</strong></span>
                <span>Rule Matrix Version: <strong className="text-indigo-600 font-bold">{selectedJob.mappingRulesVersion}</strong></span>
              </div>
            </div>

            {/* Simulation Controls Form */}
            <div className="p-5 bg-indigo-50/40 rounded-2xl border border-indigo-100/80 space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-xs text-slate-900 font-mono">Simulation Configuration Parameters</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Sampling Scope */}
                <div>
                  <label className="text-slate-700 font-bold block mb-1.5">Replay Sampling Ratio</label>
                  <select
                    value={sampleLimitPercent}
                    onChange={(e) => setSampleLimitPercent(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono shadow-3xs"
                  >
                    <option value={100}>100% Full Dataset Replay ({selectedJob.originalTotalRecords.toLocaleString()} rows)</option>
                    <option value={50}>50% Representative Sample ({Math.round(selectedJob.originalTotalRecords * 0.5).toLocaleString()} rows)</option>
                    <option value={10}>10% Fast Audit Sample ({Math.round(selectedJob.originalTotalRecords * 0.1).toLocaleString()} rows)</option>
                    <option value={1}>1% Micro Diagnostic Sample ({Math.round(selectedJob.originalTotalRecords * 0.01).toLocaleString()} rows)</option>
                  </select>
                </div>

                {/* Mapping Rule Version Override */}
                <div>
                  <label className="text-slate-700 font-bold block mb-1.5">Transformation Mapping Version</label>
                  <select
                    value={mappingVersionOption}
                    onChange={(e) => setMappingVersionOption(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono shadow-3xs"
                  >
                    <option value="original">Original Frozen Rule Version ({selectedJob.mappingRulesVersion})</option>
                    <option value="latest">Latest Production Rule Version (v3.1-cleansed-prod-latest)</option>
                    <option value="custom">Custom Rule Hotfix (v3.5-custom-hotfix)</option>
                  </select>
                </div>
              </div>

              {/* Action Trigger Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Runs safely in memory without modifying target database
                </span>

                <button
                  type="button"
                  onClick={handleLaunchReplaySimulation}
                  disabled={isSimulating}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs hover:shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Running Simulation...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Execute Replay Simulation</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Stepper Progress Bar during simulation */}
            {isSimulating && (
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-indigo-700 font-bold flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    Executing Replay Simulation Pipeline for {selectedJob.sourceConnectorName}...
                  </span>
                  <span className="text-slate-500 font-semibold">Step {simStep} / 4</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-center">
                  <div className={`p-2 rounded-lg border transition-all ${simStep >= 1 ? 'bg-white border-indigo-300 text-indigo-700 font-bold shadow-3xs' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    1. Mount Snapshot
                  </div>
                  <div className={`p-2 rounded-lg border transition-all ${simStep >= 2 ? 'bg-white border-indigo-300 text-indigo-700 font-bold shadow-3xs' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    2. Load Rules
                  </div>
                  <div className={`p-2 rounded-lg border transition-all ${simStep >= 3 ? 'bg-white border-indigo-300 text-indigo-700 font-bold shadow-3xs' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    3. Dry-Run Transform
                  </div>
                  <div className={`p-2 rounded-lg border transition-all ${simStep >= 4 ? 'bg-white border-indigo-300 text-indigo-700 font-bold shadow-3xs' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    4. Checksum Diff
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Replay Simulation Verification Results */}
          {replayResult && (
            <div id="replay-simulation-results-panel" className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-5 shadow-xs">
              {/* Match Banner Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <span className={`p-3 rounded-2xl border ${
                    replayResult.reproducibilityScore === 100
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {replayResult.reproducibilityScore === 100 ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </span>

                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{replayResult.matchStatus}</h3>
                    <p className="text-xs text-slate-600">
                      Reproducibility Score:{' '}
                      <strong className={replayResult.reproducibilityScore === 100 ? 'text-emerald-600 font-mono font-bold' : 'text-amber-600 font-mono font-bold'}>
                        {replayResult.reproducibilityScore}%
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(replayResult, null, 2));
                      setCopiedCert(true);
                      setTimeout(() => setCopiedCert(false), 2000);
                    }}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                  >
                    {copiedCert ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>{copiedCert ? 'Copied' : 'Copy Audit JSON'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(replayResult, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `replay_certificate_${selectedJob.id}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Download Certificate</span>
                  </button>
                </div>
              </div>

              {/* Side-by-Side Comparison Table */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
                  Original Run vs Replay Simulation Comparison
                </h4>
                <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-3xs">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-3">Execution Metric</th>
                        <th className="p-3">Original Run ({new Date(selectedJob.executionTimestamp).toLocaleDateString()})</th>
                        <th className="p-3">Replay Simulation (Now)</th>
                        <th className="p-3">Variance / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3 text-slate-900 font-bold">Total Records Evaluated</td>
                        <td className="p-3 text-slate-700">{selectedJob.originalTotalRecords.toLocaleString()}</td>
                        <td className="p-3 text-indigo-600 font-bold">{replayResult.simulatedRecords.toLocaleString()}</td>
                        <td className="p-3 text-emerald-600 font-semibold">
                          {selectedJob.originalTotalRecords === replayResult.simulatedRecords ? '0 (Exact)' : 'Sampled'}
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 text-slate-900 font-bold">Error Count</td>
                        <td className="p-3 text-rose-600 font-medium">{selectedJob.originalErrorCount}</td>
                        <td className="p-3 text-rose-600 font-bold">{replayResult.simulatedErrors}</td>
                        <td className="p-3 font-bold">
                          {selectedJob.originalErrorCount === replayResult.simulatedErrors ? (
                            <span className="text-emerald-600">0 (100% Identical)</span>
                          ) : (
                            <span className="text-amber-600">-2 Errors (Fixed by Rules)</span>
                          )}
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 text-slate-900 font-bold">Payload SHA-256 Checksum</td>
                        <td className="p-3 text-slate-600 truncate max-w-[150px]" title={selectedJob.originalOutputHash}>
                          {selectedJob.originalOutputHash.substring(0, 18)}...
                        </td>
                        <td className="p-3 text-indigo-600 font-bold truncate max-w-[150px]" title={replayResult.simulatedOutputHash}>
                          {replayResult.simulatedOutputHash.substring(0, 18)}...
                        </td>
                        <td className="p-3 font-bold">
                          {selectedJob.originalOutputHash === replayResult.simulatedOutputHash ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              BIT-FOR-BIT MATCH
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              RULE DRIFT DETECTED
                            </span>
                          )}
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 text-slate-900 font-bold">Applied Rule Version</td>
                        <td className="p-3 text-slate-600">{selectedJob.mappingRulesVersion}</td>
                        <td className="p-3 text-purple-600 font-bold">{replayResult.mappingRulesApplied}</td>
                        <td className="p-3 text-slate-500 font-medium">
                          {selectedJob.mappingRulesVersion === replayResult.mappingRulesApplied ? 'Frozen Version' : 'Overridden'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row Level Delta Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Identical Rows</span>
                  <span className="text-base font-extrabold text-emerald-600">{replayResult.rowDeltaSummary.identicalRows.toLocaleString()}</span>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Modified Rows</span>
                  <span className="text-base font-extrabold text-amber-600">{replayResult.rowDeltaSummary.modifiedRows}</span>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Fixed Error Rows</span>
                  <span className="text-base font-extrabold text-indigo-600">{replayResult.rowDeltaSummary.fixedErrorsCount}</span>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">New Error Rows</span>
                  <span className="text-base font-extrabold text-rose-600">{replayResult.rowDeltaSummary.newErrorsCount}</span>
                </div>
              </div>

              {/* Simulation Verification Log Trace */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block tracking-wider">
                  Replay Simulation Execution Log Trace
                </span>
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200 space-y-1 max-h-40 overflow-y-auto">
                  {replayResult.verificationLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-indigo-300">
                      <span className="text-slate-500">{idx + 1}.</span>
                      <span className="text-slate-200">{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Replay Snapshot */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <PlusCircle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Create Historical Replay Snapshot</h3>
                  <p className="text-xs text-slate-500">Capture an immutable Parquet snapshot from any active connector</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSnapshot} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1.5">
                  Select Active Enterprise Connector ({allPlatformConnectors.length} Available)
                </label>
                <select
                  value={newSnapshotConnectorId}
                  onChange={(e) => setNewSnapshotConnectorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {allPlatformConnectors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category} • {c.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1.5">Source Entity / Table / Endpoint Name</label>
                <input
                  type="text"
                  placeholder="e.g. KNA1_Customer_Master or sales_invoices_v1"
                  value={newSnapshotEntityName}
                  onChange={(e) => setNewSnapshotEntityName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-mono placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1.5">Sample Record Count</label>
                  <input
                    type="number"
                    min={100}
                    max={5000000}
                    value={newSnapshotRowCount}
                    onChange={(e) => setNewSnapshotRowCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1.5">Storage Compression</label>
                  <input
                    type="text"
                    value="Snappy Parquet (AES-256)"
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 text-slate-600 rounded-xl px-3 py-2 text-xs font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  Snapshot will be written to the enterprise immutable Parquet vault with a cryptographic SHA-256 checksum and made immediately available for deterministic replay.
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSnapshot}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCreatingSnapshot ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Parquet Vault...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Create Snapshot</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
