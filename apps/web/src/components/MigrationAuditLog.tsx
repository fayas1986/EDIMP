import React, { useState, useMemo } from 'react';
import { OverflowTableWrapper } from './OverflowTableWrapper';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  FileSpreadsheet,
  RefreshCw,
  User,
  ShieldCheck,
  ChevronRight,
  Database,
  ArrowRight,
  X,
  Copy,
  Check,
  Calendar,
  Layers,
  Activity,
  SlidersHorizontal,
  Server,
  Lock,
  Eye,
  UserCheck,
  Briefcase,
  KeyRound,
  FileText,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export interface AuditLogOperation {
  id: string;
  timestamp: string;
  user: string;
  userRole: 'Admin' | 'Data Engineer' | 'System Bot' | 'Compliance Officer' | 'DevOps Lead' | 'Project Manager' | 'Security Admin';
  ipAddress: string;
  action: string;
  category:
    | 'Pipeline Execution'
    | 'Schema & Mapping'
    | 'Security & Auth'
    | 'Data Quality'
    | 'System Config'
    | 'Customer & Projects'
    | 'User Management'
    | 'Reports & Exports';
  targetSystem: string;
  targetEntity: string;
  outcomeStatus: 'Success' | 'Failed' | 'Warning' | 'In Progress';
  recordsProcessed?: number;
  durationMs?: number;
  checksum: string;
  details: string;
  metadata?: Record<string, any>;
}

const INITIAL_AUDIT_LOGS: AuditLogOperation[] = [
  {
    id: 'OP-2026-8805',
    timestamp: '2026-08-08 09:52:10 UTC',
    user: 'admin@enterprise.com',
    userRole: 'Admin',
    ipAddress: '192.168.1.45',
    action: 'USER_AUTHENTICATION_SUCCESS',
    category: 'Security & Auth',
    targetSystem: 'Platform Auth Gateway',
    targetEntity: 'OAuth 2.0 Web Session',
    outcomeStatus: 'Success',
    recordsProcessed: 0,
    durationMs: 320,
    checksum: 'f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4',
    details: 'User admin@enterprise.com authenticated successfully via SAML 2.0 SSO with MFA step-up.',
    metadata: {
      authMethod: 'SAML_SSO_MFA',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      sessionDurationMinutes: 480,
    },
  },
  {
    id: 'OP-2026-8804',
    timestamp: '2026-08-08 09:35:42 UTC',
    user: 'rachel.adams@enterprise.com',
    userRole: 'Project Manager',
    ipAddress: '192.168.1.92',
    action: 'WORKLOAD_REBALANCED',
    category: 'Customer & Projects',
    targetSystem: 'Project Resource Allocator',
    targetEntity: 'Project PRJ-SAP-2026 (SAP Migration)',
    outcomeStatus: 'Success',
    recordsProcessed: 1,
    durationMs: 1450,
    checksum: 'c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9',
    details: 'Reassigned SAP S/4HANA migration project workload from David Chen to Elena Rostova to prevent allocation overload.',
    metadata: {
      projectId: 'prj-sap-2026',
      sourceMember: 'David Chen',
      targetMember: 'Elena Rostova',
      reallocatedAllocationPct: 50,
    },
  },
  {
    id: 'OP-2026-8803',
    timestamp: '2026-08-08 09:12:05 UTC',
    user: 'security.lead@enterprise.com',
    userRole: 'Security Admin',
    ipAddress: '10.0.12.33',
    action: 'USER_ROLE_ELEVATED',
    category: 'User Management',
    targetSystem: 'RBAC Policy Center',
    targetEntity: 'User Account m.vazquez@enterprise.com',
    outcomeStatus: 'Success',
    recordsProcessed: 1,
    durationMs: 890,
    checksum: '3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d',
    details: 'Elevated user role from Viewer to Data Engineer with write permissions on Staging Schema DB.',
    metadata: {
      targetUserId: 'usr-9021',
      previousRole: 'Viewer',
      assignedRole: 'Data Engineer',
      approvedByTicket: 'INC-88921',
    },
  },
  {
    id: 'OP-2026-8802',
    timestamp: '2026-08-08 08:45:00 UTC',
    user: 'compliance_officer@enterprise.com',
    userRole: 'Compliance Officer',
    ipAddress: '10.0.14.50',
    action: 'REPORT_EXPORT_PDF',
    category: 'Reports & Exports',
    targetSystem: 'Audit Reporting Engine',
    targetEntity: 'Executive SOC2 Audit Report',
    outcomeStatus: 'Success',
    recordsProcessed: 1420,
    durationMs: 2400,
    checksum: '8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a',
    details: 'Generated cryptographically sealed PDF compliance report covering 1,420 historical audit logs.',
    metadata: {
      reportType: 'SOC2_TYPE_II_PRINTABLE_PDF',
      appliedFilterStandard: 'SOC2',
      exportChecksum: '8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a',
    },
  },
  {
    id: 'OP-2026-8801',
    timestamp: '2026-08-08 08:15:30 UTC',
    user: 'admin@enterprise.com',
    userRole: 'Admin',
    ipAddress: '192.168.1.45',
    action: 'PIPELINE_EXECUTION_STARTED',
    category: 'Pipeline Execution',
    targetSystem: 'SAP S/4HANA ➔ D365 Business Central',
    targetEntity: 'ACDOCA_GeneralLedger',
    outcomeStatus: 'In Progress',
    recordsProcessed: 45200,
    durationMs: 142000,
    checksum: 'a8f10b2c3d4e5f6a7b8c9d0e1f2a3b4c',
    details: 'Triggered full load extraction for general ledger records covering FY2025.',
    metadata: {
      batchSize: 5000,
      parallelWorkers: 16,
      isolationLevel: 'READ_COMMITTED',
    },
  },
  {
    id: 'OP-2026-8800',
    timestamp: '2026-08-08 07:42:05 UTC',
    user: 'system_etl_bot@enterprise.com',
    userRole: 'System Bot',
    ipAddress: '10.0.8.12',
    action: 'SCHEMA_AUTO_MAP_APPLIED',
    category: 'Schema & Mapping',
    targetSystem: 'Salesforce CRM ➔ Business Central',
    targetEntity: 'Account / CustomerMaster',
    outcomeStatus: 'Success',
    recordsProcessed: 18450,
    durationMs: 8400,
    checksum: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f',
    details: 'AI Engine auto-mapped 42 source fields with 96.4% confidence rating.',
    metadata: {
      aiConfidence: 0.964,
      autoMappedFields: 42,
      manualOverrides: 0,
    },
  },
  {
    id: 'OP-2026-8799',
    timestamp: '2026-08-08 06:15:30 UTC',
    user: 'data_lead@enterprise.com',
    userRole: 'Data Engineer',
    ipAddress: '192.168.1.88',
    action: 'CREDENTIAL_KEY_ROTATED',
    category: 'Security & Auth',
    targetSystem: 'Oracle Cloud ERP Connector',
    targetEntity: 'REST API Auth Credentials',
    outcomeStatus: 'Success',
    recordsProcessed: 0,
    durationMs: 1200,
    checksum: '3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c',
    details: 'OAuth 2.0 Client Secret successfully rotated and tested with TLS 1.3 verification.',
    metadata: {
      authType: 'OAuth 2.0 Bearer',
      certificateValidityDays: 365,
    },
  },
  {
    id: 'OP-2026-8798',
    timestamp: '2026-08-08 05:30:00 UTC',
    user: 'compliance_officer@enterprise.com',
    userRole: 'Compliance Officer',
    ipAddress: '10.0.14.50',
    action: 'PII_ANONYMIZATION_POLICY_ENFORCED',
    category: 'Data Quality',
    targetSystem: 'HRMS Employee Master ➔ D365 F&O',
    targetEntity: 'HcmWorkerEntity',
    outcomeStatus: 'Warning',
    recordsProcessed: 12400,
    durationMs: 34100,
    checksum: '9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a',
    details: 'Enforced SHA-256 HMAC hashing on SSN and Bank Account fields. 12 rows required manual review.',
    metadata: {
      hashedColumns: ['SSN', 'BankAccountNo', 'TaxIdentifier'],
      unresolvedExceptions: 12,
    },
  },
  {
    id: 'OP-2026-8797',
    timestamp: '2026-08-08 04:11:45 UTC',
    user: 'devops_lead@enterprise.com',
    userRole: 'DevOps Lead',
    ipAddress: '192.168.2.14',
    action: 'WORKER_NODE_SCALE_UP',
    category: 'System Config',
    targetSystem: 'Spark Compute Cluster',
    targetEntity: 'Worker Pod Pool',
    outcomeStatus: 'Success',
    recordsProcessed: 0,
    durationMs: 45000,
    checksum: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e',
    details: 'Scaled worker node pool from 32 to 64 active pods to sustain peak migration throughput.',
    metadata: {
      previousNodes: 32,
      newNodes: 64,
      allocatedMemoryGb: 256,
    },
  },
  {
    id: 'OP-2026-8796',
    timestamp: '2026-08-08 02:22:10 UTC',
    user: 'system_etl_bot@enterprise.com',
    userRole: 'System Bot',
    ipAddress: '10.0.8.12',
    action: 'BATCH_INGESTION_FAILED',
    category: 'Pipeline Execution',
    targetSystem: 'Legacy SQL Server ➔ PostgreSQL Staging',
    targetEntity: 'SalesOrderHeaders',
    outcomeStatus: 'Failed',
    recordsProcessed: 8900,
    durationMs: 12500,
    checksum: 'e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9',
    details: 'Foreign key constraint violation on CustomerPostingGroup "DOMESTIC_EUR" in target table.',
    metadata: {
      errorCode: 'FK_VIOLATION_23503',
      failedRowIndex: 8901,
      targetConstraint: 'fk_customer_group_id',
    },
  },
  {
    id: 'OP-2026-8795',
    timestamp: '2026-08-07 23:14:00 UTC',
    user: 'rachel.adams@enterprise.com',
    userRole: 'Project Manager',
    ipAddress: '192.168.1.92',
    action: 'CUSTOMER_ACCOUNT_CREATED',
    category: 'Customer & Projects',
    targetSystem: 'Customer Directory',
    targetEntity: 'Apex Global Financials (CUST-009)',
    outcomeStatus: 'Success',
    recordsProcessed: 1,
    durationMs: 650,
    checksum: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    details: 'Created new enterprise customer account for Apex Global Financials with Gold SLA tier.',
    metadata: {
      customerId: 'cust-apex-009',
      industry: 'Financial Services',
      tierSla: 'Enterprise Gold (99.99%)',
    },
  },
  {
    id: 'OP-2026-8794',
    timestamp: '2026-08-07 20:05:12 UTC',
    user: 'data_lead@enterprise.com',
    userRole: 'Data Engineer',
    ipAddress: '192.168.1.88',
    action: 'CLEANSING_RULE_SAVED',
    category: 'Data Quality',
    targetSystem: 'Validation & Cleansing Engine',
    targetEntity: 'IBAN Format Regex Rule',
    outcomeStatus: 'Success',
    recordsProcessed: 0,
    durationMs: 420,
    checksum: '5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b',
    details: 'Added regex rule for IBAN format verification across European payment staging records.',
    metadata: {
      ruleType: 'REGEX_VERIFICATION',
      targetField: 'IbanNumber',
      severityOnFail: 'REJECT_ROW',
    },
  },
];

export const MigrationAuditLog: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogOperation[]>(INITIAL_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('All');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [timeRange, setTimeRange] = useState<string>('All Time');
  const [selectedOperation, setSelectedOperation] = useState<AuditLogOperation | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Computed KPI Metrics
  const totalAuditCount = auditLogs.length;
  const securityAuthCount = auditLogs.filter((l) => l.category === 'Security & Auth').length;
  const uniqueUsersCount = useMemo(() => new Set(auditLogs.map((l) => l.user)).size, [auditLogs]);
  const failedEventsCount = auditLogs.filter((l) => l.outcomeStatus === 'Failed').length;

  // Filtered operations
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        log.id.toLowerCase().includes(query) ||
        log.user.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.targetSystem.toLowerCase().includes(query) ||
        log.targetEntity.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query) ||
        log.ipAddress.includes(query);

      const matchesCategory = selectedCategory === 'All' || log.category === selectedCategory;
      const matchesOutcome = selectedOutcome === 'All' || log.outcomeStatus === selectedOutcome;
      const matchesRole = selectedRole === 'All' || log.userRole === selectedRole;

      return matchesSearch && matchesCategory && matchesOutcome && matchesRole;
    });
  }, [auditLogs, searchQuery, selectedCategory, selectedOutcome, selectedRole]);

  // Handle Copy Checksum/ID
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Simulate Add Live Audit Event
  const handleRefreshSimulate = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const newOp: AuditLogOperation = {
        id: `OP-2026-${Math.floor(8806 + Math.random() * 500)}`,
        timestamp: new Date().toUTCString().replace('GMT', 'UTC'),
        user: 'system_etl_bot@enterprise.com',
        userRole: 'System Bot',
        ipAddress: '10.0.8.12',
        action: 'INCREMENTAL_DELTA_SYNC_COMPLETED',
        category: 'Pipeline Execution',
        targetSystem: 'SAP S/4HANA ➔ D365 Business Central',
        targetEntity: 'SalesOrderHeader',
        outcomeStatus: 'Success',
        recordsProcessed: Math.floor(Math.random() * 5000) + 1200,
        durationMs: Math.floor(Math.random() * 12000) + 3000,
        checksum: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        details: 'Automated real-time incremental sync completed without schema warnings.',
        metadata: {
          syncMode: 'CDC_LOG_BASED',
          latencyMs: 140,
        },
      };
      setAuditLogs((prev) => [newOp, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Operation ID',
      'Timestamp',
      'User / Actor',
      'User Role',
      'IP Address',
      'Action Executed',
      'Category',
      'Target System',
      'Target Entity',
      'Outcome Status',
      'Records Processed',
      'Duration (ms)',
      'Checksum Hash',
      'Operation Details',
    ];

    const rows = filteredLogs.map((log) => [
      `"${log.id}"`,
      `"${log.timestamp}"`,
      `"${log.user}"`,
      `"${log.userRole}"`,
      `"${log.ipAddress}"`,
      `"${log.action}"`,
      `"${log.category}"`,
      `"${log.targetSystem}"`,
      `"${log.targetEntity}"`,
      `"${log.outcomeStatus}"`,
      `"${log.recordsProcessed || 0}"`,
      `"${log.durationMs || 0}"`,
      `"${log.checksum}"`,
      `"${log.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Read_Only_Platform_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderOutcomeBadge = (status: AuditLogOperation['outcomeStatus']) => {
    switch (status) {
      case 'Success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Success
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Failed
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Warning
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            In Progress
          </span>
        );
    }
  };

  const renderCategoryIcon = (category: AuditLogOperation['category']) => {
    switch (category) {
      case 'Security & Auth':
        return <KeyRound className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Customer & Projects':
        return <Briefcase className="w-3.5 h-3.5 text-purple-600" />;
      case 'User Management':
        return <UserCheck className="w-3.5 h-3.5 text-cyan-600" />;
      case 'Pipeline Execution':
        return <Activity className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Schema & Mapping':
        return <Database className="w-3.5 h-3.5 text-blue-600" />;
      case 'Data Quality':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />;
      case 'Reports & Exports':
        return <FileText className="w-3.5 h-3.5 text-rose-600" />;
      case 'System Config':
        return <Server className="w-3.5 h-3.5 text-slate-600" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div id="migration-audit-log-root" className="space-y-6">
      {/* Component Header Banner with Read-Only Lock Badge */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-mono font-semibold rounded-full border border-amber-500/30 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Read-Only Audit Trail
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold rounded-full border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Cryptographically Verified (WORM Storage)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            Platform User Actions & Operational Audit Log
          </h1>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Read-only, tamper-evident audit register recording recent user authentications, role modifications, customer project rebalances, schema auto-mappings, and pipeline execution events across the platform.
          </p>
        </div>

        {/* Header Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 z-10">
          <button
            onClick={handleRefreshSimulate}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Poll for recent user actions stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Poll Stream</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            title="Download full read-only audit log in CSV format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Total User & System Actions</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{totalAuditCount}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>100% SHA256 Checksum Sealed</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Unique Platform Actors</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{uniqueUsersCount}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            Active Users & System Bots
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Security & Auth Events</span>
            <KeyRound className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{securityAuthCount}</div>
          <div className="text-[11px] text-slate-500">
            Logins, SAML SSO, Role Changes
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Failed / Flagged Operations</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className={`text-2xl font-black tracking-tight ${failedEventsCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {failedEventsCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Auto-routed to Error Center
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, user email, IP address, target entity..."
              className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-semibold text-[11px]">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Security & Auth">Security & Auth</option>
                <option value="Customer & Projects">Customer & Projects</option>
                <option value="User Management">User Management</option>
                <option value="Pipeline Execution">Pipeline Execution</option>
                <option value="Schema & Mapping">Schema & Mapping</option>
                <option value="Data Quality">Data Quality</option>
                <option value="Reports & Exports">Reports & Exports</option>
                <option value="System Config">System Config</option>
              </select>
            </div>

            {/* User Role Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-semibold text-[11px]">Role:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Data Engineer">Data Engineer</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Security Admin">Security Admin</option>
                <option value="Compliance Officer">Compliance Officer</option>
                <option value="DevOps Lead">DevOps Lead</option>
                <option value="System Bot">System Bot</option>
              </select>
            </div>

            {/* Outcome Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-semibold text-[11px]">Outcome:</span>
              <select
                value={selectedOutcome}
                onChange={(e) => setSelectedOutcome(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Outcomes</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
                <option value="Warning">Warning</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>

            {/* Time Scope */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All Time">All Time</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table: Platform User Actions & Operational Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900">
              Read-Only Platform User Actions Register ({filteredLogs.length} Records)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            WORM Writable-Once-Read-Many Compliant
          </span>
        </div>

        <OverflowTableWrapper hintLabel="Scroll horizontally to inspect full user action details and cryptographic hashes">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">User / Actor</th>
                <th className="py-3 px-4">Platform Action</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Target Endpoint & Entity</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">No platform user actions match your search filter</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try clearing search terms or modifying dropdown filters.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedOperation(log)}
                    className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{log.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">{log.timestamp}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.user}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {log.userRole} ({log.ipAddress})
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 font-mono text-[11px]">
                        {renderCategoryIcon(log.category)}
                        <span>{log.action}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      <div className="font-semibold text-slate-800 text-xs truncate">{log.targetSystem}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">Entity: {log.targetEntity}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{renderOutcomeBadge(log.outcomeStatus)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOperation(log);
                        }}
                        className="p-1.5 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                        title="View complete read-only log details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </OverflowTableWrapper>
      </div>

      {/* READ-ONLY OPERATION DETAILS MODAL */}
      {selectedOperation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold rounded border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    Read-Only Record
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-300">ID: {selectedOperation.id}</span>
                  {renderOutcomeBadge(selectedOperation.outcomeStatus)}
                </div>
                <h3 className="text-lg font-extrabold tracking-tight font-mono text-white">{selectedOperation.action}</h3>
              </div>
              <button
                onClick={() => setSelectedOperation(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Context Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Actor / User</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">{selectedOperation.user}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Role: {selectedOperation.userRole} | IP: {selectedOperation.ipAddress}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Timestamp (UTC)</div>
                  <div className="font-extrabold text-slate-900 font-mono mt-0.5">{selectedOperation.timestamp}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Category: {selectedOperation.category}</div>
                </div>
              </div>

              {/* Target Details */}
              <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1">
                <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Target Endpoint & System</div>
                <div className="font-bold text-slate-900 text-sm">{selectedOperation.targetSystem}</div>
                <div className="font-mono text-slate-600">Target Entity: {selectedOperation.targetEntity}</div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <div className="font-bold text-slate-700">Action Details & Summary:</div>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-sans">
                  {selectedOperation.details}
                </p>
              </div>

              {/* Metrics if available */}
              {(selectedOperation.recordsProcessed !== undefined || selectedOperation.durationMs !== undefined) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Records Impacted</div>
                    <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                      {(selectedOperation.recordsProcessed || 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">rows</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Execution Latency</div>
                    <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                      {selectedOperation.durationMs ? `${(selectedOperation.durationMs / 1000).toFixed(2)}s` : 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* Cryptographic Checksum */}
              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase">SHA-256 Cryptographic Checksum</span>
                  <button
                    onClick={() => handleCopyText(selectedOperation.checksum, 'checksum')}
                    className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'checksum' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'checksum' ? 'Copied' : 'Copy Hash'}</span>
                  </button>
                </div>
                <div className="font-mono text-indigo-200 text-xs break-all bg-slate-950 p-2 rounded border border-slate-800">
                  {selectedOperation.checksum}
                </div>
              </div>

              {/* Metadata JSON Viewer */}
              {selectedOperation.metadata && (
                <div className="space-y-1">
                  <div className="font-bold text-slate-700">Execution Metadata Payload:</div>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
                    {JSON.stringify(selectedOperation.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Immutable Audit Trail - Write Protection Enabled
              </span>
              <button
                onClick={() => setSelectedOperation(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
