import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  FileSpreadsheet,
  Database,
  Play,
  Zap,
  ArrowRight,
  Layers,
  FileCheck,
  Check,
  Sliders,
  Sparkles,
  Download,
  AlertCircle,
  Info,
  Key,
  Shield,
  Server,
  Activity,
  Cpu,
  Building2,
  Users,
  Briefcase,
  Code,
  Cloud
} from 'lucide-react';

export interface IntegrityCheckRule {
  id: string;
  category: 'Mandatory Fields' | 'Schema Mismatch' | 'Referential Integrity' | 'PII & Security' | 'Data Format';
  ruleName: string;
  fieldTarget: string;
  severity: 'Critical' | 'Warning' | 'Info';
  status: 'Passed' | 'Failed' | 'Warnings Found';
  recordsScanned: number;
  recordsFailed: number;
  description: string;
  recommendation: string;
  autoFixAvailable: boolean;
}

export interface DataSetScanConfig {
  id: string;
  dataSetName: string;
  sourceSystem: string;
  totalRecords: number;
  lastUpdated: string;
  category: string;
  rules: IntegrityCheckRule[];
}

export const MOCK_DATASETS_FOR_SCAN: DataSetScanConfig[] = [
  {
    id: 'ds-bc-01',
    dataSetName: 'Customer Master & Accounts (KNA1 / Business Central)',
    sourceSystem: 'Dynamics 365 Business Central (Prod)',
    totalRecords: 124500,
    lastUpdated: '2026-08-12 05:40 UTC',
    category: 'Core Master Data',
    rules: [
      {
        id: 'r-101',
        category: 'Mandatory Fields',
        ruleName: 'Customer Primary Key Non-Nullability',
        fieldTarget: 'customer_account_id (KUNNR)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 124500,
        recordsFailed: 0,
        description: 'Verifies that every customer record possesses a valid non-null primary key.',
        recommendation: 'None required. All primary key attributes are populated.',
        autoFixAvailable: false,
      },
      {
        id: 'r-102',
        category: 'Mandatory Fields',
        ruleName: 'Tax Identification Number Presence',
        fieldTarget: 'tax_identifier_hash (STCEG)',
        severity: 'Warning',
        status: 'Warnings Found',
        recordsScanned: 124500,
        recordsFailed: 142,
        description: 'Detects records missing tax identification numbers for commercial accounts.',
        recommendation: '142 records lack tax IDs. Apply default "TAX_EXEMPT_PENDING" placeholder token.',
        autoFixAvailable: true,
      },
      {
        id: 'r-103',
        category: 'Schema Mismatch',
        ruleName: 'ISO Country Code Length & Format',
        fieldTarget: 'country_code_iso2 (LAND1)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 124500,
        recordsFailed: 0,
        description: 'Ensures country codes match ISO 3166-1 alpha-2 uppercase formatting.',
        recommendation: 'Schema matched perfectly across all target records.',
        autoFixAvailable: false,
      },
      {
        id: 'r-104',
        category: 'PII & Security',
        ruleName: 'Customer Email Masking Compliance',
        fieldTarget: 'contact_email_masked (SMTP_ADDR)',
        severity: 'Critical',
        status: 'Failed',
        recordsScanned: 124500,
        recordsFailed: 28,
        description: 'Scans candidate export batch for unmasked plain-text PII email addresses.',
        recommendation: '28 records contain raw email syntax. Apply SHA-256 or partial local masking transformer.',
        autoFixAvailable: true,
      },
      {
        id: 'r-105',
        category: 'Data Format',
        ruleName: 'Postal Code Format Uniformity',
        fieldTarget: 'postal_code (PSTLZ)',
        severity: 'Info',
        status: 'Warnings Found',
        recordsScanned: 124500,
        recordsFailed: 15,
        description: 'Validates postal code character count and zero-padding rules.',
        recommendation: 'Pad 15 US postal codes with leading zeros to meet 5-digit specification.',
        autoFixAvailable: true,
      },
    ],
  },
  {
    id: 'ds-sql-02',
    dataSetName: 'Legacy Accounts Receivable Ledger (AR_MASTER)',
    sourceSystem: 'SQL Server - Legacy ERP DB',
    totalRecords: 345200,
    lastUpdated: '2026-08-12 05:25 UTC',
    category: 'Financial & Billing',
    rules: [
      {
        id: 'r-201',
        category: 'Mandatory Fields',
        ruleName: 'Invoice Primary Key Completeness',
        fieldTarget: 'invoice_number (INV_NUM)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 345200,
        recordsFailed: 0,
        description: 'Validates unique invoice keys across legacy SQL Server database tables.',
        recommendation: 'Fully compliant.',
        autoFixAvailable: false,
      },
      {
        id: 'r-202',
        category: 'Referential Integrity',
        ruleName: 'Customer Foreign Key Relationship',
        fieldTarget: 'cust_account_ref (FK_CUST_ID)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 345200,
        recordsFailed: 0,
        description: 'Ensures foreign key links to Customer Master records exist.',
        recommendation: 'Referential check verified.',
        autoFixAvailable: false,
      },
      {
        id: 'r-203',
        category: 'Data Format',
        ruleName: 'Payment Terms Standard Enum Validation',
        fieldTarget: 'payment_terms_code (TERMS_CD)',
        severity: 'Warning',
        status: 'Warnings Found',
        recordsScanned: 345200,
        recordsFailed: 48,
        description: 'Detects deprecated payment terms codes (e.g. NET_15_OLD).',
        recommendation: 'Map 48 legacy codes to standard "NET30_STD".',
        autoFixAvailable: true,
      },
      {
        id: 'r-204',
        category: 'Data Format',
        ruleName: 'Outstanding Balance Currency Precision',
        fieldTarget: 'balance_due_usd (BAL_DUE)',
        severity: 'Info',
        status: 'Passed',
        recordsScanned: 345200,
        recordsFailed: 0,
        description: 'Verifies decimal scale equals 2 for currency balances.',
        recommendation: 'Precision verified.',
        autoFixAvailable: false,
      },
    ],
  },
  {
    id: 'ds-excel-03',
    dataSetName: 'Excel Uploaded Customer Master Batch (Customers_July2026.xlsx)',
    sourceSystem: 'Customer Master Excel (.xlsx)',
    totalRecords: 14250,
    lastUpdated: '2026-08-12 05:10 UTC',
    category: 'Flat File Staging',
    rules: [
      {
        id: 'r-301',
        category: 'Mandatory Fields',
        ruleName: 'Sheet Row Index Uniqueness',
        fieldTarget: 'row_identifier (ROW_ID)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 14250,
        recordsFailed: 0,
        description: 'Ensures row identifiers in Excel sheet are unique and non-null.',
        recommendation: 'Verified.',
        autoFixAvailable: false,
      },
      {
        id: 'r-302',
        category: 'PII & Security',
        ruleName: 'Plain Text Contact Phone Number Detection',
        fieldTarget: 'phone_number (PHONE_RAW)',
        severity: 'Warning',
        status: 'Warnings Found',
        recordsScanned: 14250,
        recordsFailed: 62,
        description: 'Detects unformatted phone numbers in uploaded spreadsheet.',
        recommendation: 'Apply E.164 phone formatting rule to 62 records.',
        autoFixAvailable: true,
      },
      {
        id: 'r-303',
        category: 'Schema Mismatch',
        ruleName: 'Excel Header Column Name Mapping',
        fieldTarget: 'column_headers (XLSX_COLS)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 14250,
        recordsFailed: 0,
        description: 'Validates that uploaded sheet header names match canonical target schema.',
        recommendation: 'All 18 columns mapped cleanly.',
        autoFixAvailable: false,
      },
    ],
  },
  {
    id: 'ds-sap-04',
    dataSetName: 'SAP Sales Order Headers & Line Items (VBAK/VBAP)',
    sourceSystem: 'SAP S/4HANA Cloud Engine',
    totalRecords: 482900,
    lastUpdated: '2026-08-12 05:30 UTC',
    category: 'Transactional Data',
    rules: [
      {
        id: 'r-401',
        category: 'Mandatory Fields',
        ruleName: 'Sales Order Number Non-Nullability',
        fieldTarget: 'sales_order_number (VBELN)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 482900,
        recordsFailed: 0,
        description: 'Ensures order key is present and distinct across all records.',
        recommendation: 'Primary keys verified.',
        autoFixAvailable: false,
      },
      {
        id: 'r-402',
        category: 'Referential Integrity',
        ruleName: 'Sold-To Customer Foreign Key Validation',
        fieldTarget: 'sold_to_customer_id (KUNNR)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 482900,
        recordsFailed: 0,
        description: 'Verifies foreign key relationship with Customer Master table.',
        recommendation: 'All customer reference keys resolve successfully.',
        autoFixAvailable: false,
      },
      {
        id: 'r-403',
        category: 'Data Format',
        ruleName: 'Currency Code Standard ISO-4217',
        fieldTarget: 'currency_code (WAERK)',
        severity: 'Warning',
        status: 'Passed',
        recordsScanned: 482900,
        recordsFailed: 0,
        description: 'Validates 3-letter uppercase currency symbol representation.',
        recommendation: 'Fully compliant.',
        autoFixAvailable: false,
      },
      {
        id: 'r-404',
        category: 'Schema Mismatch',
        ruleName: 'Pricing Unit Decimal Scale',
        fieldTarget: 'net_price_amount (NETWR)',
        severity: 'Warning',
        status: 'Warnings Found',
        recordsScanned: 482900,
        recordsFailed: 12,
        description: 'Detects line items with trailing sub-cent fractional values.',
        recommendation: 'Round 12 line items to 2 decimal places.',
        autoFixAvailable: true,
      },
    ],
  },
  {
    id: 'ds-sfdc-05',
    dataSetName: 'Salesforce CRM Accounts & Opportunities (SFDC_ACCT_OPP)',
    sourceSystem: 'Salesforce Enterprise CRM',
    totalRecords: 215000,
    lastUpdated: '2026-08-12 04:55 UTC',
    category: 'CRM & Pipeline',
    rules: [
      {
        id: 'r-501',
        category: 'Mandatory Fields',
        ruleName: 'Salesforce 18-Character Case-Safe Id Validation',
        fieldTarget: 'sf_account_id (Id)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 215000,
        recordsFailed: 0,
        description: 'Ensures account ID meets 18-character case-safe alphanumeric syntax.',
        recommendation: 'All Salesforce IDs valid.',
        autoFixAvailable: false,
      },
      {
        id: 'r-502',
        category: 'Data Format',
        ruleName: 'Opportunity Stage Enum Mapping',
        fieldTarget: 'stage_name (StageName)',
        severity: 'Warning',
        status: 'Warnings Found',
        recordsScanned: 215000,
        recordsFailed: 34,
        description: 'Detects custom stage names not in canonical target list.',
        recommendation: '34 records mapped to "Qualification_In_Progress".',
        autoFixAvailable: true,
      },
      {
        id: 'r-503',
        category: 'PII & Security',
        ruleName: 'Contact Primary Email Tokenization',
        fieldTarget: 'contact_email (Email)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 215000,
        recordsFailed: 0,
        description: 'Validates email encryption mask.',
        recommendation: 'All email PII masked.',
        autoFixAvailable: false,
      },
    ],
  },
  {
    id: 'ds-d365fo-06',
    dataSetName: 'General Ledger Ledger Snapshot (GL_BAL / D365 FO)',
    sourceSystem: 'Dynamics 365 Finance & Operations',
    totalRecords: 890100,
    lastUpdated: '2026-08-12 05:00 UTC',
    category: 'Financial Ledger',
    rules: [
      {
        id: 'r-601',
        category: 'Mandatory Fields',
        ruleName: 'GL Account Number Completeness',
        fieldTarget: 'gl_account_number (ACC_NUM)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 890100,
        recordsFailed: 0,
        description: 'Mandatory chart of accounts index field.',
        recommendation: 'Verified.',
        autoFixAvailable: false,
      },
      {
        id: 'r-602',
        category: 'Data Format',
        ruleName: 'Monetary Amount Precision Limit',
        fieldTarget: 'balance_amount_usd (BAL_AMT)',
        severity: 'Warning',
        status: 'Passed',
        recordsScanned: 890100,
        recordsFailed: 0,
        description: 'Ensures maximum decimal scale does not exceed 4 decimal places.',
        recommendation: 'Precision within target bounds.',
        autoFixAvailable: false,
      },
      {
        id: 'r-603',
        category: 'Referential Integrity',
        ruleName: 'Cost Center Dimension Foreign Key',
        fieldTarget: 'cost_center_id (COST_CTR)',
        severity: 'Warning',
        status: 'Warnings Found',
        recordsScanned: 890100,
        recordsFailed: 110,
        description: 'Validates cost center ID against master dimension hierarchy.',
        recommendation: 'Assign 110 unmapped cost centers to default fallback "CC_GLOBAL_UNALLOC".',
        autoFixAvailable: true,
      },
    ],
  },
  {
    id: 'ds-pg-07',
    dataSetName: 'PostgreSQL Cleansed Staging Warehouse (STG_CLEANSED_V2)',
    sourceSystem: 'PostgreSQL Staging Warehouse',
    totalRecords: 610400,
    lastUpdated: '2026-08-12 05:35 UTC',
    category: 'Staging Data Store',
    rules: [
      {
        id: 'r-701',
        category: 'Mandatory Fields',
        ruleName: 'UUID v4 Primary Key Validation',
        fieldTarget: 'staging_record_uuid (UUID)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 610400,
        recordsFailed: 0,
        description: 'Validates 36-character RFC 4122 UUID syntax.',
        recommendation: 'All UUIDs compliant.',
        autoFixAvailable: false,
      },
      {
        id: 'r-702',
        category: 'PII & Security',
        ruleName: 'SHA-256 Hashed Attribute Integrity',
        fieldTarget: 'identity_hash (ID_HASH)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 610400,
        recordsFailed: 0,
        description: 'Ensures sensitive identifiers contain valid 64-char hex strings.',
        recommendation: 'Hash integrity confirmed.',
        autoFixAvailable: false,
      },
      {
        id: 'r-703',
        category: 'Schema Mismatch',
        ruleName: 'Timestamp UTC Offset Compliance',
        fieldTarget: 'ingested_at_utc (CREATED_AT)',
        severity: 'Info',
        status: 'Passed',
        recordsScanned: 610400,
        recordsFailed: 0,
        description: 'Verifies ISO-8601 UTC timestamp formatting.',
        recommendation: 'UTC timezone confirmed.',
        autoFixAvailable: false,
      },
    ],
  },
  {
    id: 'ds-sp-08',
    dataSetName: 'SharePoint Document & Contract Index (SP_DOC_INDEX)',
    sourceSystem: 'SharePoint Document Library',
    totalRecords: 48200,
    lastUpdated: '2026-08-12 03:20 UTC',
    category: 'Unstructured Metadata',
    rules: [
      {
        id: 'r-801',
        category: 'Mandatory Fields',
        ruleName: 'Document Source URL Validity',
        fieldTarget: 'doc_canonical_uri (DOC_URL)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 48200,
        recordsFailed: 0,
        description: 'Ensures document link URI parameters are formatted and non-null.',
        recommendation: 'URI syntax verified.',
        autoFixAvailable: false,
      },
      {
        id: 'r-802',
        category: 'Data Format',
        ruleName: 'File Extension Whitelist Check',
        fieldTarget: 'file_extension (FILE_TYPE)',
        severity: 'Warning',
        status: 'Warnings Found',
        recordsScanned: 48200,
        recordsFailed: 8,
        description: 'Scans for non-standard file extensions (.tmp, .bak) in target queue.',
        recommendation: 'Exclude or quarantine 8 temporary backup files.',
        autoFixAvailable: true,
      },
    ],
  },
  {
    id: 'ds-hrms-09',
    dataSetName: 'Legacy HRMS Employee Payroll & Personnel Master (HR_EMP_MASTER)',
    sourceSystem: 'Legacy HRMS REST API Endpoint',
    totalRecords: 32800,
    lastUpdated: '2026-08-12 04:15 UTC',
    category: 'Human Capital Management',
    rules: [
      {
        id: 'r-901',
        category: 'PII & Security',
        ruleName: 'Tax ID / SSN Masking Verification',
        fieldTarget: 'national_id_masked (SSN_HASH)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 32800,
        recordsFailed: 0,
        description: 'Guarantees no raw social security or national identity numbers exist in output.',
        recommendation: '100% masked.',
        autoFixAvailable: false,
      },
      {
        id: 'r-902',
        category: 'Mandatory Fields',
        ruleName: 'Employee Key Non-Nullability',
        fieldTarget: 'employee_id (EMP_NUM)',
        severity: 'Critical',
        status: 'Passed',
        recordsScanned: 32800,
        recordsFailed: 0,
        description: 'Ensures employee badge ID is present.',
        recommendation: 'Primary keys verified.',
        autoFixAvailable: false,
      },
      {
        id: 'r-903',
        category: 'Data Format',
        ruleName: 'Department Code Dimension Mapping',
        fieldTarget: 'department_code (DEPT_CD)',
        severity: 'Warning',
        status: 'Warnings Found',
        recordsScanned: 32800,
        recordsFailed: 18,
        description: 'Detects legacy department codes missing from global organization tree.',
        recommendation: 'Auto-map 18 legacy dept codes to default "DEPT_UNASSIGNED".',
        autoFixAvailable: true,
      },
    ],
  },
];

interface PreExportIntegrityCheckToolProps {
  onProceedToExport?: (datasetId: string) => void;
  onClose?: () => void;
}

export const PreExportIntegrityCheckTool: React.FC<PreExportIntegrityCheckToolProps> = ({
  onProceedToExport,
  onClose,
}) => {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(MOCK_DATASETS_FOR_SCAN[0].id);
  const [datasets, setDatasets] = useState<DataSetScanConfig[]>(MOCK_DATASETS_FOR_SCAN);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [lastScanTimestamp, setLastScanTimestamp] = useState<string>('2026-08-12 05:45:00 UTC');
  const [datasetSearchQuery, setDatasetSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [autoFixSuccessMessage, setAutoFixSuccessMessage] = useState<string | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);

  // Filter available datasets for the dropdown selector
  const searchFilteredDatasets = useMemo(() => {
    if (!datasetSearchQuery.trim()) return datasets;
    const q = datasetSearchQuery.toLowerCase();
    return datasets.filter(
      (d) =>
        d.dataSetName.toLowerCase().includes(q) ||
        d.sourceSystem.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );
  }, [datasets, datasetSearchQuery]);

  const activeDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];

  // Calculate Overall Integrity Readiness
  const failedCritical = activeDataset.rules.filter((r) => r.severity === 'Critical' && r.status === 'Failed').length;
  const warningsCount = activeDataset.rules.filter((r) => r.status === 'Warnings Found').length;
  const failedCountTotal = activeDataset.rules.filter((r) => r.status === 'Failed').length;
  const passedCount = activeDataset.rules.filter((r) => r.status === 'Passed').length;

  const totalRules = activeDataset.rules.length;
  const healthScore = Math.round(((totalRules - failedCritical * 0.5 - warningsCount * 0.1) / totalRules) * 100);

  let readinessStatus: 'READY' | 'WARNINGS' | 'BLOCKED' = 'READY';
  if (failedCritical > 0) {
    readinessStatus = 'BLOCKED';
  } else if (warningsCount > 0 || failedCountTotal > 0) {
    readinessStatus = 'WARNINGS';
  }

  // Summary Matrix across ALL 9 Connectors
  const connectorSummaryStats = useMemo(() => {
    let totalScanned = 0;
    let totalFailed = 0;
    let totalWarnings = 0;
    let totalPassed = 0;

    datasets.forEach((ds) => {
      ds.rules.forEach((r) => {
        if (r.status === 'Passed') totalPassed++;
        if (r.status === 'Warnings Found') totalWarnings++;
        if (r.status === 'Failed') totalFailed++;
        totalScanned++;
      });
    });

    return {
      totalConnectors: datasets.length,
      totalScanned,
      totalPassed,
      totalWarnings,
      totalFailed,
    };
  }, [datasets]);

  // Trigger Validation Scan
  const handleRunValidationScan = () => {
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setLastScanTimestamp(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  // Real-time live sync across all 9 connector feeds
  const handleLiveSyncAllConnectors = () => {
    setIsScanning(true);
    setScanProgress(0);

    setTimeout(() => {
      setDatasets((prev) =>
        prev.map((ds) => ({
          ...ds,
          totalRecords: ds.totalRecords + Math.floor(Math.random() * 250) + 10,
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        }))
      );
      setIsScanning(false);
      setScanProgress(100);
      setLastScanTimestamp(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
      setAutoFixSuccessMessage('Real-time sync complete across all 9 connected connector feeds.');
      setTimeout(() => setAutoFixSuccessMessage(null), 3500);
    }, 1200);
  };

  // Auto-Fix Remediation Handler
  const handleApplyAutoFix = (ruleId: string) => {
    setDatasets((prev) =>
      prev.map((ds) => {
        if (ds.id !== selectedDatasetId) return ds;
        return {
          ...ds,
          rules: ds.rules.map((r) => {
            if (r.id !== ruleId) return r;
            return {
              ...r,
              status: 'Passed',
              recordsFailed: 0,
              recommendation: 'Auto-remediation transformer applied. All records now compliant.',
            };
          }),
        };
      })
    );

    const rule = activeDataset.rules.find((r) => r.id === ruleId);
    setAutoFixSuccessMessage(`Successfully applied auto-fix rule to field "${rule?.fieldTarget}".`);
    setTimeout(() => setAutoFixSuccessMessage(null), 3000);
  };

  // Filter rules
  const filteredRules = activeDataset.rules.filter((r) => {
    const matchesCat = categoryFilter === 'All' || r.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesCat && matchesStatus;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-6 shadow-xs text-slate-800 min-w-0 max-w-full overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 min-w-0">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-indigo-600" /> Pre-Export Pre-flight Verification
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-emerald-600" /> {datasets.length} Integrated System Connectors Connected
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold rounded-full">
              Automated Real-Time Quality Scanner
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 pt-1">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" /> Pre-Export Data Set Integrity Scan
          </h2>

          <p className="text-slate-500 text-xs max-w-3xl">
            Run an automated diagnostic scan against candidate export data sets across all <strong>{datasets.length} active enterprise connectors</strong> (ERP, CRM, Databases, Flat Files, APIs, and Cloud Storage) to detect missing mandatory fields, unmasked PII, type mismatches, and broken foreign key constraints before starting file generation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleLiveSyncAllConnectors}
            disabled={isScanning}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            title="Poll and refresh real-time metrics across all 9 connected connector feeds"
          >
            <Activity className={`w-3.5 h-3.5 text-emerald-600 ${isScanning ? 'animate-spin' : ''}`} />
            <span>Sync All 9 Connectors</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
            >
              Close Check
            </button>
          )}
        </div>
      </div>

      {/* Real-time System Connectors Quick Overview Strip */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 flex-wrap gap-2">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Real-Time Connected Data Feed Pipeline Matrix ({datasets.length} Active System Connectors)
          </span>
          <span className="text-[11px] text-slate-500 font-normal">
            Total Scanned Pipeline Rules: <strong className="text-slate-800">{connectorSummaryStats.totalScanned}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-1.5 min-w-0">
          {datasets.map((ds) => {
            const isSelected = ds.id === selectedDatasetId;
            const hasFailed = ds.rules.some((r) => r.severity === 'Critical' && r.status === 'Failed');
            const hasWarning = ds.rules.some((r) => r.status === 'Warnings Found');

            return (
              <button
                key={ds.id}
                type="button"
                onClick={() => setSelectedDatasetId(ds.id)}
                className={`p-2 rounded-lg text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[58px] min-w-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : hasFailed
                    ? 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
                    : hasWarning
                    ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
                title={`${ds.dataSetName} (${ds.sourceSystem}) - ${ds.totalRecords.toLocaleString()} Records`}
              >
                <div className="text-[10px] font-mono font-bold truncate leading-tight">
                  {ds.sourceSystem.split(' ')[0]} {ds.sourceSystem.split(' ')[1] || ''}
                </div>
                <div className="text-[9px] truncate font-sans font-medium opacity-80">
                  {ds.totalRecords.toLocaleString()} recs
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className={`text-[8px] font-mono font-bold uppercase px-1 rounded ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : hasFailed
                      ? 'bg-rose-200 text-rose-800'
                      : hasWarning
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {hasFailed ? 'FAIL' : hasWarning ? 'WARN' : 'PASS'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dataset Selection & Ready-to-Export Indicator Bar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-w-0 max-w-full">
        {/* Dataset Selector Card */}
        <div className="xl:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 min-w-0 max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1 min-w-0 truncate">
              <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Select Target Candidate Dataset ({searchFilteredDatasets.length} / {datasets.length} Available):
            </label>
            <span className="text-[11px] text-slate-400 font-mono shrink-0">
              Last Scanned: <strong className="text-slate-700">{lastScanTimestamp}</strong>
            </span>
          </div>

          {/* Search Box & Dropdown Selector */}
          <div className="space-y-2 min-w-0 max-w-full">
            <div className="relative min-w-0 max-w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={datasetSearchQuery}
                onChange={(e) => setDatasetSearchQuery(e.target.value)}
                placeholder="Search datasets across all 9 active connectors (e.g., SAP, Salesforce, SQL, HRMS, Excel...)"
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 min-w-0 max-w-full">
              <div className="min-w-0 max-w-full grow flex-1">
                <select
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                  className="w-full max-w-full min-w-0 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate cursor-pointer"
                >
                  {searchFilteredDatasets.map((ds) => (
                    <option key={ds.id} value={ds.id} className="text-xs">
                      [{ds.category}] {ds.dataSetName} ({ds.totalRecords.toLocaleString()} Records - {ds.sourceSystem})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleRunValidationScan}
                disabled={isScanning}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? `Scanning... ${scanProgress}%` : 'Run Integrity Scan Now'}</span>
              </button>
            </div>
          </div>

          {/* Dataset Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1 border-t border-slate-200/80 min-w-0">
            <span className="text-slate-500 text-[11px] font-sans font-medium">Source Connector:</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-800 font-bold flex items-center gap-1 max-w-full truncate">
              <Server className="w-3 h-3 text-indigo-600 shrink-0" />
              <span className="truncate">{activeDataset.sourceSystem}</span>
            </span>
            <span className="text-slate-500 text-[11px] font-sans font-medium">Record Count:</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-indigo-700 font-bold">
              {activeDataset.totalRecords.toLocaleString()} Rows
            </span>
            <span className="text-slate-500 text-[11px] font-sans font-medium">Category:</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-bold">
              {activeDataset.category}
            </span>
          </div>
        </div>

        {/* READY TO EXPORT STATUS INDICATOR BADGE CARD */}
        <div
          className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all min-w-0 max-w-full ${
            readinessStatus === 'READY'
              ? 'bg-emerald-50/70 border-emerald-200'
              : readinessStatus === 'WARNINGS'
              ? 'bg-amber-50/70 border-amber-200'
              : 'bg-rose-50/70 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 text-slate-600 truncate">
              Export Readiness Status
            </span>
            <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-white/80 border text-slate-800 shrink-0">
              Score: {healthScore}%
            </span>
          </div>

          {/* Status Indicator Main Visual */}
          <div className="flex items-center gap-3 min-w-0">
            {readinessStatus === 'READY' && (
              <>
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-emerald-950 leading-tight">READY TO EXPORT</h3>
                  <p className="text-xs text-emerald-800 font-medium leading-normal">All schema &amp; mandatory rules passed.</p>
                </div>
              </>
            )}

            {readinessStatus === 'WARNINGS' && (
              <>
                <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-sm shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-amber-950 leading-tight">READY WITH WARNINGS</h3>
                  <p className="text-xs text-amber-800 font-medium leading-normal">
                    {warningsCount} non-critical warnings detected. Auto-fix available.
                  </p>
                </div>
              </>
            )}

            {readinessStatus === 'BLOCKED' && (
              <>
                <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-sm shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-rose-950 leading-tight">EXPORT BLOCKED</h3>
                  <p className="text-xs text-rose-800 font-medium leading-normal">
                    {failedCritical} critical schema/PII failures must be fixed before export.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Action Button */}
          {onProceedToExport && (
            <button
              type="button"
              onClick={() => onProceedToExport(selectedDatasetId)}
              disabled={readinessStatus === 'BLOCKED'}
              className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs ${
                readinessStatus === 'READY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : readinessStatus === 'WARNINGS'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>{readinessStatus === 'BLOCKED' ? 'Resolve Blocking Issues First' : 'Proceed to File Export'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar for Active Scanning */}
      {isScanning && (
        <div className="space-y-1 bg-indigo-50 border border-indigo-200 p-3 rounded-xl">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-900 font-mono">
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" /> Running Pre-Export Data Integrity Scan across selected candidate connector feeds...
            </span>
            <span>{scanProgress}%</span>
          </div>
          <div className="w-full bg-indigo-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Auto Fix Notification Toast */}
      {autoFixSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{autoFixSuccessMessage}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-600">Updated</span>
        </div>
      )}

      {/* Rule Diagnostics Category Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Rules Scanned</span>
          <span className="text-xl font-black text-slate-900 font-mono">{totalRules}</span>
          <span className="text-[10px] text-slate-500 block">Across 5 quality vectors</span>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono block">Passed Cleanly</span>
          <span className="text-xl font-black text-emerald-900 font-mono">{passedCount}</span>
          <span className="text-[10px] text-emerald-700 block">100% compliant</span>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold text-amber-800 uppercase font-mono block">Warnings Found</span>
          <span className="text-xl font-black text-amber-900 font-mono">{warningsCount}</span>
          <span className="text-[10px] text-amber-700 block">Auto-heal available</span>
        </div>

        <div className="bg-rose-50/60 border border-rose-200 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold text-rose-800 uppercase font-mono block">Critical Failures</span>
          <span className="text-xl font-black text-rose-900 font-mono">{failedCritical}</span>
          <span className="text-[10px] text-rose-700 block">Export block triggers</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 pb-3 font-mono text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-sans font-bold text-slate-500">Filter Vector:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="Mandatory Fields">Mandatory Fields</option>
            <option value="Schema Mismatch">Schema Mismatch</option>
            <option value="Referential Integrity">Referential Integrity</option>
            <option value="PII & Security">PII &amp; Security</option>
            <option value="Data Format">Data Format</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Passed">Passed Only</option>
            <option value="Warnings Found">Warnings Only</option>
            <option value="Failed">Failed Only</option>
          </select>
        </div>

        <span className="text-[11px] text-slate-400">
          Showing <strong>{filteredRules.length}</strong> rule diagnostic checks
        </span>
      </div>

      {/* Integrity Scan Rules Detailed List */}
      <div className="space-y-3">
        {filteredRules.length === 0 ? (
          <div className="py-8 text-center text-slate-400 font-mono border border-slate-200 rounded-xl">
            No integrity rules match selected filter parameters.
          </div>
        ) : (
          filteredRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-all ${
                rule.status === 'Passed'
                  ? 'bg-slate-50/60 border-slate-200'
                  : rule.status === 'Warnings Found'
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1 grow">
                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    {rule.status === 'Passed' && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PASSED
                      </span>
                    )}

                    {rule.status === 'Warnings Found' && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-mono font-bold rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> WARNING
                      </span>
                    )}

                    {rule.status === 'Failed' && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-mono font-bold rounded flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-600" /> CRITICAL FAIL
                      </span>
                    )}

                    {/* Category */}
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-mono font-bold rounded">
                      {rule.category}
                    </span>

                    {/* Target Field */}
                    <span className="text-xs font-mono font-bold text-slate-900">{rule.fieldTarget}</span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{rule.ruleName}</h4>
                  <p className="text-xs text-slate-600">{rule.description}</p>
                </div>

                {/* Right Status Details & Auto Fix */}
                <div className="flex flex-col md:items-end justify-between gap-2 shrink-0">
                  <div className="text-[11px] font-mono text-slate-500">
                    {rule.recordsFailed > 0 ? (
                      <span className="text-rose-700 font-bold">
                        {rule.recordsFailed.toLocaleString()} / {rule.recordsScanned.toLocaleString()} Records Non-Compliant
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold">
                        {rule.recordsScanned.toLocaleString()} / {rule.recordsScanned.toLocaleString()} Clean
                      </span>
                    )}
                  </div>

                  {rule.autoFixAvailable && (rule.status === 'Failed' || rule.status === 'Warnings Found') && (
                    <button
                      type="button"
                      onClick={() => handleApplyAutoFix(rule.id)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply Auto-Fix</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Recommendation Box */}
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-start gap-2 text-xs text-slate-700">
                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 font-mono text-[11px]">Remediation Action: </strong>
                  <span>{rule.recommendation}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
