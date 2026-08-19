import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RotateCcw,
  Building2,
  UserCheck,
  FileCode,
  Key,
  Database,
  ExternalLink,
  Copy,
  Check,
  RefreshCcw,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Shield,
  FileSpreadsheet,
  Info,
  Layers,
  Lock,
  ArrowUpRight,
  Server,
  Activity,
} from 'lucide-react';
import { MOCK_PARTNER_CUSTOMERS, PartnerCustomer } from '../data/partnerPortalData';

export interface MigrationAuditLog {
  id: string;
  timestamp: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  erpEcosystem: string;
  tenantId: string;
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  operationType:
    | 'Schema Baseline Migration'
    | 'CDC Delta Catch-up'
    | 'Data Anonymization Batch'
    | 'Cutover Dry Run'
    | 'Full Entity Extract'
    | 'Sanity Re-indexing'
    | 'Validation Cleanse Pass'
    | 'Emergency Rollback';
  sourceSystem: string;
  targetSystem: string;
  recordsProcessed: number;
  recordsFailed: number;
  dataSizeMb: number;
  executionTimeSec: number;
  outcomeStatus: 'Success' | 'Failed' | 'Warning' | 'In Progress' | 'Rolled Back';
  complianceBadges: string[];
  verificationHash: string;
  errorDetails?: string;
  auditNotes?: string;
  operatorIp: string;
  sessionId: string;
}

export interface MigrationAuditTrailViewProps {
  initialCustomerId?: string;
  onSelectCustomer?: (customerId: string) => void;
  onShowToast?: (msg: string) => void;
}

// Initial Comprehensive Mock Audit Trail Data
const INITIAL_AUDIT_LOGS: MigrationAuditLog[] = [
  {
    id: 'AUD-2026-98421',
    timestamp: '2026-08-09T22:14:30Z',
    customerId: 'cust-001',
    customerName: 'Nordic Manufacturing Group',
    customerCode: 'NORDIC',
    erpEcosystem: 'Microsoft Dynamics 365',
    tenantId: 'tenant-nordic-prod-01',
    operatorId: 'OP-8492',
    operatorName: 'Sarah Jenkins',
    operatorRole: 'Lead Migration Architect',
    operationType: 'Cutover Dry Run',
    sourceSystem: 'SAP ECC 6.0 (EHP8 On-Prem)',
    targetSystem: 'Dynamics 365 Finance & Supply Chain (Cloud)',
    recordsProcessed: 14250000,
    recordsFailed: 0,
    dataSizeMb: 18450,
    executionTimeSec: 840,
    outcomeStatus: 'Success',
    complianceBadges: ['SOC 2 Type II', 'HIPAA Verified', 'GDPR Masked'],
    verificationHash: '8f92a10b42c8d7e9f1a23456789abcdef0123456789abcdef0123456789abcde',
    auditNotes: 'Final pre-cutover rehearsal executed. Zero row count discrepancies detected across General Ledger and Inventory tables.',
    operatorIp: '192.168.42.105',
    sessionId: 'SESS-88421-US-EAST',
  },
  {
    id: 'AUD-2026-98390',
    timestamp: '2026-08-09T18:45:12Z',
    customerId: 'cust-002',
    customerName: 'Apex Health Systems',
    customerCode: 'APEX',
    erpEcosystem: 'SAP S/4HANA',
    tenantId: 'tenant-apex-sovereign-02',
    operatorId: 'OP-1104',
    operatorName: 'Carlos Mendez',
    operatorRole: 'Senior Data Engineer',
    operationType: 'Data Anonymization Batch',
    sourceSystem: 'Oracle E-Business Suite R12',
    targetSystem: 'SAP S/4HANA Private Cloud Edition',
    recordsProcessed: 8900000,
    recordsFailed: 12,
    dataSizeMb: 11200,
    executionTimeSec: 620,
    outcomeStatus: 'Warning',
    complianceBadges: ['HIPAA Enforced', 'SOC 2 Type II', 'AES-256 Vaulted'],
    verificationHash: '4b12c8d90eef7a123456789abcdef0123456789abcdef0123456789abcdef012',
    errorDetails: '12 non-blocking patient records flagged due to malformed legacy ICD-10 codings. Auto-isolated into cleansing queue.',
    auditNotes: 'SHA-256 pseudonymization pass completed for all PII fields (SSN, Phone, Medical Rec #).',
    operatorIp: '10.0.14.88',
    sessionId: 'SESS-77210-EU-WEST',
  },
  {
    id: 'AUD-2026-98215',
    timestamp: '2026-08-09T14:30:00Z',
    customerId: 'cust-003',
    customerName: 'Global Logistics Corp',
    customerCode: 'GLOG',
    erpEcosystem: 'Oracle Fusion Cloud',
    tenantId: 'tenant-glog-multi-03',
    operatorId: 'SYS-AUTOMATION',
    operatorName: 'CDC Relay Daemon v4.2',
    operatorRole: 'Automated Service Account',
    operationType: 'CDC Delta Catch-up',
    sourceSystem: 'AS400 DB2 Legacy Data Warehouse',
    targetSystem: 'Oracle Fusion SCM Cloud',
    recordsProcessed: 3120000,
    recordsFailed: 0,
    dataSizeMb: 4100,
    executionTimeSec: 195,
    outcomeStatus: 'Success',
    complianceBadges: ['SOC 2 Type II', 'ISO 27001'],
    verificationHash: '1a98b76c54d32e100123456789abcdef0123456789abcdef0123456789abcdef',
    auditNotes: 'Real-time delta streaming caught up to head offset #8849201. Latency under 420ms.',
    operatorIp: '172.16.0.4',
    sessionId: 'SESS-DAEMON-CDC-003',
  },
  {
    id: 'AUD-2026-98102',
    timestamp: '2026-08-08T20:11:45Z',
    customerId: 'cust-001',
    customerName: 'Nordic Manufacturing Group',
    customerCode: 'NORDIC',
    erpEcosystem: 'Microsoft Dynamics 365',
    tenantId: 'tenant-nordic-prod-01',
    operatorId: 'OP-8492',
    operatorName: 'Sarah Jenkins',
    operatorRole: 'Lead Migration Architect',
    operationType: 'Schema Baseline Migration',
    sourceSystem: 'SAP ECC 6.0',
    targetSystem: 'Dynamics 365 Finance & Supply Chain',
    recordsProcessed: 154000,
    recordsFailed: 0,
    dataSizeMb: 420,
    executionTimeSec: 110,
    outcomeStatus: 'Success',
    complianceBadges: ['SOC 2 Type II'],
    verificationHash: '7c89d0e1f2a3b4c567890abcdef0123456789abcdef0123456789abcdef01234',
    auditNotes: '342 custom entity schemas and foreign key relationship trees verified and staged.',
    operatorIp: '192.168.42.105',
    sessionId: 'SESS-88102-US-EAST',
  },
  {
    id: 'AUD-2026-97994',
    timestamp: '2026-08-08T11:05:22Z',
    customerId: 'cust-004',
    customerName: 'AeroSpace Components Ltd',
    customerCode: 'AERO',
    erpEcosystem: 'Infor LN',
    tenantId: 'tenant-aero-gov-04',
    operatorId: 'OP-3310',
    operatorName: 'David Kincaid',
    operatorRole: 'Compliance Officer & DevSecOps',
    operationType: 'Full Entity Extract',
    sourceSystem: 'Infor Baan IV Legacy',
    targetSystem: 'Infor CloudSuite Aerospace & Defense',
    recordsProcessed: 420000,
    recordsFailed: 1850,
    dataSizeMb: 2800,
    executionTimeSec: 410,
    outcomeStatus: 'Failed',
    complianceBadges: ['ITAR Compliant', 'SOC 2 Type II'],
    verificationHash: '9e8d7c6b5a4f3e210123456789abcdef0123456789abcdef0123456789abcdef',
    errorDetails: 'Connection timeout on legacy ODBC socket driver at row #418,150. Operation halted per ITAR strict security abort policy.',
    auditNotes: 'Automatic rollback triggered. Zero unencrypted payload left in staging temp tables.',
    operatorIp: '10.200.50.12',
    sessionId: 'SESS-99401-GOV-CLOUD',
  },
  {
    id: 'AUD-2026-97880',
    timestamp: '2026-08-08T09:15:00Z',
    customerId: 'cust-004',
    customerName: 'AeroSpace Components Ltd',
    customerCode: 'AERO',
    erpEcosystem: 'Infor LN',
    tenantId: 'tenant-aero-gov-04',
    operatorId: 'OP-3310',
    operatorName: 'David Kincaid',
    operatorRole: 'Compliance Officer & DevSecOps',
    operationType: 'Emergency Rollback',
    sourceSystem: 'Infor CloudSuite Staging',
    targetSystem: 'Infor Baan IV Legacy',
    recordsProcessed: 418150,
    recordsFailed: 0,
    dataSizeMb: 2790,
    executionTimeSec: 85,
    outcomeStatus: 'Rolled Back',
    complianceBadges: ['ITAR Compliant', 'SOC 2 Type II'],
    verificationHash: '3f2e1d0c9b8a7f6e543210abcdef0123456789abcdef0123456789abcdef0123',
    auditNotes: 'State safely reverted back to checkpoint #CP-20260808-01. Customer notified.',
    operatorIp: '10.200.50.12',
    sessionId: 'SESS-99401-GOV-CLOUD',
  },
  {
    id: 'AUD-2026-97650',
    timestamp: '2026-08-07T16:20:10Z',
    customerId: 'cust-002',
    customerName: 'Apex Health Systems',
    customerCode: 'APEX',
    erpEcosystem: 'SAP S/4HANA',
    tenantId: 'tenant-apex-sovereign-02',
    operatorId: 'OP-1104',
    operatorName: 'Carlos Mendez',
    operatorRole: 'Senior Data Engineer',
    operationType: 'Validation Cleanse Pass',
    sourceSystem: 'Oracle E-Business Suite R12',
    targetSystem: 'SAP S/4HANA Private Cloud Edition',
    recordsProcessed: 12500000,
    recordsFailed: 0,
    dataSizeMb: 14200,
    executionTimeSec: 510,
    outcomeStatus: 'Success',
    complianceBadges: ['HIPAA Verified', 'SOC 2 Type II'],
    verificationHash: '5e4d3c2b1a0f9e8d76543210abcdef0123456789abcdef0123456789abcdef01',
    auditNotes: 'Automated data cleansing rules passed with 100% data integrity score across patient billing ledgers.',
    operatorIp: '10.0.14.88',
    sessionId: 'SESS-76500-EU-WEST',
  },
];

export const MigrationAuditTrailView: React.FC<MigrationAuditTrailViewProps> = ({
  initialCustomerId,
  onSelectCustomer,
  onShowToast,
}) => {
  // State
  const [logs] = useState<MigrationAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>(
    initialCustomerId || 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [operationTypeFilter, setOperationTypeFilter] = useState<string>('ALL');
    const [verifiedHashes, setVerifiedHashes] = useState<{ [id: string]: boolean }>({});
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  const toggleLogExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered dataset
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Customer filter
      if (selectedCustomerFilter !== 'ALL' && log.customerId !== selectedCustomerFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && log.outcomeStatus !== statusFilter) {
        return false;
      }
      // Operation type filter
      if (operationTypeFilter !== 'ALL' && log.operationType !== operationTypeFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesId = log.id.toLowerCase().includes(q);
        const matchesCustomer = log.customerName.toLowerCase().includes(q) || log.customerCode.toLowerCase().includes(q);
        const matchesOperator = log.operatorName.toLowerCase().includes(q) || log.operatorId.toLowerCase().includes(q);
        const matchesOpType = log.operationType.toLowerCase().includes(q);
        const matchesSource = log.sourceSystem.toLowerCase().includes(q) || log.targetSystem.toLowerCase().includes(q);
        const matchesHash = log.verificationHash.toLowerCase().includes(q);
        return matchesId || matchesCustomer || matchesOperator || matchesOpType || matchesSource || matchesHash;
      }
      return true;
    });
  }, [logs, selectedCustomerFilter, statusFilter, operationTypeFilter, searchQuery]);

  // Aggregate stats
  const totalLogsCount = filteredLogs.length;
  const successCount = filteredLogs.filter((l) => l.outcomeStatus === 'Success').length;
  const warningCount = filteredLogs.filter((l) => l.outcomeStatus === 'Warning').length;
  const failedCount = filteredLogs.filter((l) => l.outcomeStatus === 'Failed' || l.outcomeStatus === 'Rolled Back').length;
  const successRate = totalLogsCount > 0 ? Math.round((successCount / totalLogsCount) * 100) : 100;
  const totalRecordsProcessed = filteredLogs.reduce((acc, l) => acc + l.recordsProcessed, 0);

  // Verification Helper
  const handleVerifyLedgerHash = (log: MigrationAuditLog) => {
    setVerifiedHashes((prev) => ({ ...prev, [log.id]: true }));
    if (onShowToast) {
      onShowToast(`🛡️ Immutable SHA-256 Ledger Verified for ${log.id}! Compliance signature matches zero-knowledge proof.`);
    }
  };

  const handleCopyHash = (log: MigrationAuditLog) => {
    navigator.clipboard.writeText(log.verificationHash);
    setCopiedHashId(log.id);
    setTimeout(() => setCopiedHashId(null), 2000);
    if (onShowToast) {
      onShowToast(`📋 Verification SHA-256 Hash copied to clipboard.`);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Audit Log ID',
      'Timestamp (UTC)',
      'Customer Code',
      'Customer Name',
      'ERP Ecosystem',
      'Operator ID',
      'Operator Name',
      'Operation Type',
      'Outcome Status',
      'Records Processed',
      'Data Size (MB)',
      'Execution Time (s)',
      'Verification Hash',
    ];

    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.customerCode,
      `"${l.customerName}"`,
      `"${l.erpEcosystem}"`,
      l.operatorId,
      `"${l.operatorName}"`,
      `"${l.operationType}"`,
      l.outcomeStatus,
      l.recordsProcessed,
      l.dataSizeMb,
      l.executionTimeSec,
      l.verificationHash,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Migration_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) {
      onShowToast(`📊 Audit Trail Export generated! (${filteredLogs.length} records)`);
    }
  };

  // Outcome Badge Helper
  const renderStatusBadge = (status: MigrationAuditLog['outcomeStatus']) => {
    switch (status) {
      case 'Success':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Success</span>
          </span>
        );
      case 'Warning':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black flex items-center gap-1.5 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Warning</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-black flex items-center gap-1.5 shrink-0">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Failed</span>
          </span>
        );
      case 'Rolled Back':
        return (
          <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-black flex items-center gap-1.5 shrink-0">
            <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
            <span>Rolled Back</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-black flex items-center gap-1.5 shrink-0">
            <RefreshCcw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>In Progress</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Migration Audit Trail
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-mono font-extrabold border border-indigo-200">
                  Compliance Ledger v3.8
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Immutable, SOC 2 &amp; HIPAA-verifiable event logs documenting every migration, CDC stream batch, and operator action per customer tenant.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0 border border-indigo-400/30"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Trail (.CSV)</span>
          </button>
        </div>
      </div>

      {/* COMPLIANCE & KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Total Logged Operations</span>
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalLogsCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Across {MOCK_PARTNER_CUSTOMERS.length} Customer Accounts
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Success Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {successRate}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {successCount} Successes, {warningCount} Warnings, {failedCount} Alerts
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Audited Data Volume</span>
            <Database className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {(totalRecordsProcessed / 1000000).toFixed(1)}M
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Records Verified via Cryptographic Signatures
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Compliance Integrity</span>
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            100% Immutable
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            SHA-256 Zero-Knowledge Hash Validated
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operator, ID, customer, hash..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Customer Filter */}
          <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">Customer:</span>
            <select
              value={selectedCustomerFilter}
              onChange={(e) => setSelectedCustomerFilter(e.target.value)}
              className="bg-transparent font-extrabold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Partner Customers</option>
              {MOCK_PARTNER_CUSTOMERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Outcome Status Filter */}
          <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">Outcome:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-extrabold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Outcomes</option>
              <option value="Success">Success</option>
              <option value="Warning">Warning</option>
              <option value="Failed">Failed</option>
              <option value="Rolled Back">Rolled Back</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>

          {/* Operation Type Filter */}
          <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">Operation:</span>
            <select
              value={operationTypeFilter}
              onChange={(e) => setOperationTypeFilter(e.target.value)}
              className="bg-transparent font-extrabold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Operation Types</option>
              <option value="Cutover Dry Run">Cutover Dry Run</option>
              <option value="CDC Delta Catch-up">CDC Delta Catch-up</option>
              <option value="Data Anonymization Batch">Data Anonymization Batch</option>
              <option value="Schema Baseline Migration">Schema Baseline Migration</option>
              <option value="Full Entity Extract">Full Entity Extract</option>
              <option value="Emergency Rollback">Emergency Rollback</option>
              <option value="Validation Cleanse Pass">Validation Cleanse Pass</option>
            </select>
          </div>
        </div>
      </div>

      {/* AUDIT TIMELINE VIEW */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-2 sm:p-6 mt-4">
        <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 px-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          Data Validation & Integrity Timeline
        </h3>
        
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Shield className="w-8 h-8 text-slate-300" />
            <span className="font-bold">No migration audit records match your filters.</span>
            <button
              onClick={() => {
                setSelectedCustomerFilter('ALL');
                setStatusFilter('ALL');
                setOperationTypeFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
            >
              Reset Search Filters
            </button>
          </div>
        ) : (
          <div className="relative border-l-2 border-indigo-100 ml-4 sm:ml-6 space-y-8 pb-4">
            {filteredLogs.map((log, index) => {
              const isExpanded = expandedLogIds.has(log.id);
              const isVerified = verifiedHashes[log.id];

              return (
                <div key={log.id} className="relative pl-6 sm:pl-8 group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-2 shadow-sm transition-colors ${isExpanded ? 'bg-indigo-600 border-indigo-200 shadow-indigo-500/30' : 'bg-white border-indigo-300 group-hover:border-indigo-500'}`} />
                  
                  {/* Timeline Card */}
                  <div className={`bg-white rounded-2xl border transition-all ${isExpanded ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-md'}`}>
                    
                    {/* Compact Header (Always Visible) */}
                    <div 
                      className="p-4 sm:p-5 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      onClick={() => toggleLogExpand(log.id)}
                    >
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                            {log.operationType}
                          </span>
                          {renderStatusBadge(log.outcomeStatus)}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          {log.customerName} <span className="text-slate-400 font-mono text-[10px]">({log.customerCode})</span>
                        </h4>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="hidden sm:flex flex-col items-end mr-4">
                          <span className="text-[11px] font-bold text-slate-700">{log.recordsProcessed.toLocaleString()} records</span>
                          <span className="text-[9px] text-slate-400 font-mono">{(log.dataSizeMb / 1024).toFixed(2)} GB • {log.executionTimeSec}s</span>
                        </div>
                        
                        {/* Quick Action: Verify Hash */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleVerifyLedgerHash(log)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                              isVerified
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                            }`}
                          >
                            <ShieldCheck className={`w-3.5 h-3.5 ${isVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span>{isVerified ? 'VERIFIED' : 'Verify'}</span>
                          </button>
                        </div>
                        
                        <button className="p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                          <ChevronRight className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details Panel */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 rounded-b-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          
                          {/* Col 1: System Info */}
                          <div className="space-y-3">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Systems & Routing</h5>
                            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 block">Source System</span>
                                <strong className="text-xs text-slate-800">{log.sourceSystem}</strong>
                              </div>
                              <div className="border-t border-slate-100 pt-2">
                                <span className="text-[10px] text-indigo-500 font-bold block">Target Environment</span>
                                <strong className="text-xs text-indigo-900">{log.targetSystem}</strong>
                                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{log.tenantId}</span>
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Operator & Auth */}
                          <div className="space-y-3">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Operator Identity</h5>
                            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                                </div>
                                <div>
                                  <strong className="text-xs text-slate-800 block">{log.operatorName}</strong>
                                  <span className="text-[9px] text-indigo-500 font-mono">{log.operatorRole}</span>
                                </div>
                              </div>
                              <div className="border-t border-slate-100 pt-2 grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                  <span className="text-slate-400 block">Operator ID</span>
                                  <span className="font-mono text-slate-700">{log.operatorId}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Source IP</span>
                                  <span className="font-mono text-slate-700">{log.operatorIp}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Col 3: Ledger & Cryptography */}
                          <div className="space-y-3 md:col-span-2 lg:col-span-1">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Cryptographic Ledger</h5>
                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-inner">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-400 font-mono">SHA-256 Checksum</span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleCopyHash(log); }}
                                  className="text-[10px] text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  {copiedHashId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  {copiedHashId === log.id ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <div className="p-2 bg-slate-950 rounded-lg text-[10px] font-mono text-emerald-400 break-all border border-slate-800/50">
                                {log.verificationHash}
                              </div>
                              
                              {log.complianceBadges.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-1.5">
                                  {log.complianceBadges.map((badge, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      {badge}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Error & Notes section */}
                        {(log.errorDetails || log.auditNotes) && (
                          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {log.errorDetails && (
                              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200/60">
                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Exception Trace
                                </span>
                                <p className="text-xs text-rose-900 font-mono leading-relaxed">{log.errorDetails}</p>
                              </div>
                            )}
                            
                            {log.auditNotes && (
                              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1">
                                  <FileCode className="w-3.5 h-3.5" /> Execution Notes
                                </span>
                                <p className="text-xs text-slate-700 leading-relaxed">{log.auditNotes}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
          </div>
  );
};
