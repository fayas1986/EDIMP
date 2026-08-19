import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OverflowTableWrapper } from './OverflowTableWrapper';
import {
  FileText,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  Filter,
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Lock,
  Printer,
  FileCheck,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Activity,
  History,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldAlert,
  Server,
  Terminal,
  ArrowRight,
  Sparkles,
  Layers,
  ArrowUpRight,
  FlameKindling,
  UserCheck,
  Laptop,
  CheckSquare,
  GitCommit,
  RotateCcw,
  BookOpen,
  Plus,
  X,
} from 'lucide-react';

// --- Types & Interfaces ---

interface UserActivity {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  category: 'Security & Auth' | 'Schema & Mapping' | 'Data Quality' | 'User Management' | 'Platform Admin';
  targetEntity: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Success' | 'Failed';
  ipAddress: string;
  checksum: string;
  details: string;
  metadata?: Record<string, any>;
}

interface LoginRecord {
  id: string;
  timestamp: string;
  user: string;
  status: 'Success' | 'Failed' | 'Locked Out';
  ipAddress: string;
  location: string;
  browser: string;
  mfaStatus: 'Verified' | 'Bypassed' | 'Failed' | 'Not Enrolled';
  sessionDurationMins: number;
}

interface ExecutionLog {
  id: string;
  pipelineName: string;
  jobId: string;
  startTime: string;
  endTime: string;
  recordsSynced: number;
  averageThroughput: number; // rows/sec
  status: 'Completed' | 'Failed' | 'Running' | 'Aborted';
  warnings: number;
  initiatedBy: string;
}

interface ChangeLog {
  id: string;
  timestamp: string;
  authorizedBy: string;
  targetConfig: string;
  action: string;
  changeCategory: 'Connection Config' | 'Schema Map' | 'Retention Policy' | 'Access Policy';
  beforeState: Record<string, any>;
  afterState: Record<string, any>;
}

interface ComplianceControl {
  id: string;
  title: string;
  requirement: string;
  framework: 'GDPR' | 'ISO27001' | 'SOC2' | 'HIPAA';
  status: 'Compliant' | 'Needs Attention' | 'Critical Gap';
  telemetryValidation: 'Passed' | 'Warning' | 'Failed' | 'Remediated';
  lastEvaluated: string;
  autoRemediationType: string;
  remediationAction: string;
}

// --- Mock Datasets ---

const MOCK_USER_ACTIVITIES: UserActivity[] = [
  {
    id: 'ACT-2026-9401',
    timestamp: '2026-08-09 11:34:22 UTC',
    user: 'admin@enterprise.com',
    role: 'Global Security Admin',
    action: 'SCHEMA_MAPPING_AUTHORIZED',
    category: 'Schema & Mapping',
    targetEntity: 'Customer Financials Master (SAP ECC -> Dynamics 365)',
    severity: 'Medium',
    status: 'Success',
    ipAddress: '192.168.1.45',
    checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    details: 'Authorized and locked field mapping schemas for SAP financial journals under SOX-404 audit directives.',
    metadata: {
      approvedMappingsCount: 42,
      strictValidationEnforced: true,
      ticketReference: 'ITS-88210',
    },
  },
  {
    id: 'ACT-2026-9402',
    timestamp: '2026-08-09 10:15:10 UTC',
    user: 'rachel.adams@enterprise.com',
    role: 'Project Lead',
    action: 'MIGRATION_JOB_PAUSED',
    category: 'Platform Admin',
    targetEntity: 'Vendor Invoices Batch Run (ID: job-901)',
    severity: 'High',
    status: 'Success',
    ipAddress: '10.0.4.12',
    checksum: '8f4e3c2b1a9d8e7f6a5b4c3d2e1f0a9bc4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9',
    details: 'Manually paused active migration stream after detecting high API latency warnings on target Dynamics endpoint.',
    metadata: {
      activeThroughputAtPauseRps: 1420,
      quarantinedRowsCount: 12,
    },
  },
  {
    id: 'ACT-2026-9403',
    timestamp: '2026-08-09 09:12:05 UTC',
    user: 'security.lead@enterprise.com',
    role: 'Infrastructure Lead',
    action: 'CONNECTOR_CREDENTIAL_ROTATED',
    category: 'Security & Auth',
    targetEntity: 'Oracle Cloud ERP Gateway',
    severity: 'High',
    status: 'Success',
    ipAddress: '192.168.1.88',
    checksum: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    details: 'Successfully rotated the master OAuth 2.0 client secret. Verified TLS 1.3 protocol handshake latency (22ms).',
    metadata: {
      rotatedCredentialType: 'OAuth2_Client_Secret',
      cipherStrength: 'AES-GCM-256',
      handshakeLatencyMs: 22,
    },
  },
  {
    id: 'ACT-2026-9404',
    timestamp: '2026-08-09 07:30:00 UTC',
    user: 'system_etl_bot',
    role: 'Service Account',
    action: 'PII_ANONYMIZATION_CHECK_FAILED',
    category: 'Data Quality',
    targetEntity: 'Patient Records Subsystem',
    severity: 'Critical',
    status: 'Failed',
    ipAddress: '127.0.0.1',
    checksum: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    details: 'Staging verification caught 12 unmasked Social Security Numbers in raw legacy staging logs. Auto-quarantined.',
    metadata: {
      quarantinedRowsCount: 12,
      originTable: 'STG_RAW_LEGACY_PATIENTS',
      detectedPatterns: ['SSN_FORMAT_MATCH'],
    },
  },
  {
    id: 'ACT-2026-9405',
    timestamp: '2026-08-08 22:15:00 UTC',
    user: 'compliance_officer@enterprise.com',
    role: 'Compliance Auditor',
    action: 'USER_ROLE_ELEVATED',
    category: 'User Management',
    targetEntity: 'User Profile: m.vazquez@enterprise.com',
    severity: 'High',
    status: 'Success',
    ipAddress: '10.0.12.90',
    checksum: '4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c',
    details: 'Elevated user role from Data Analyst to Data Engineer. Action logged matching authorized IT security ticket REF-90112.',
    metadata: {
      elevatedRole: 'Data Engineer',
      approvedByTicket: 'REF-90112',
      approvalAuthority: 'Compliance Committee',
    },
  },
];

const MOCK_LOGIN_HISTORY: LoginRecord[] = [
  {
    id: 'LGN-2026-401',
    timestamp: '2026-08-09 11:34:00 UTC',
    user: 'admin@enterprise.com',
    status: 'Success',
    ipAddress: '192.168.1.45',
    location: 'Frankfurt, Germany',
    browser: 'Chrome 127.0.2 / macOS Sonoma',
    mfaStatus: 'Verified',
    sessionDurationMins: 480,
  },
  {
    id: 'LGN-2026-402',
    timestamp: '2026-08-09 11:12:15 UTC',
    user: 'hacky_attempt@external.net',
    status: 'Failed',
    ipAddress: '185.220.101.4',
    location: 'St. Petersburg, Russia',
    browser: 'Firefox 125.0 / Linux x86',
    mfaStatus: 'Failed',
    sessionDurationMins: 0,
  },
  {
    id: 'LGN-2026-403',
    timestamp: '2026-08-09 10:45:00 UTC',
    user: 'rachel.adams@enterprise.com',
    status: 'Success',
    ipAddress: '10.0.4.12',
    location: 'London, United Kingdom',
    browser: 'Safari 17.4 / iOS 17.4',
    mfaStatus: 'Verified',
    sessionDurationMins: 120,
  },
  {
    id: 'LGN-2026-404',
    timestamp: '2026-08-09 09:05:00 UTC',
    user: 'compliance_officer@enterprise.com',
    status: 'Success',
    ipAddress: '10.0.12.90',
    location: 'Munich, Germany',
    browser: 'Chrome 127.0.2 / Windows 11',
    mfaStatus: 'Verified',
    sessionDurationMins: 240,
  },
  {
    id: 'LGN-2026-405',
    timestamp: '2026-08-09 08:30:12 UTC',
    user: 'security.lead@enterprise.com',
    status: 'Success',
    ipAddress: '192.168.1.88',
    location: 'Berlin, Germany',
    browser: 'Edge 126.0 / macOS Sonoma',
    mfaStatus: 'Verified',
    sessionDurationMins: 360,
  },
  {
    id: 'LGN-2026-406',
    timestamp: '2026-08-09 07:15:00 UTC',
    user: 'dev_analyst_temp@enterprise.com',
    status: 'Locked Out',
    ipAddress: '93.184.216.34',
    location: 'Boston, USA',
    browser: 'Chrome 126.0 / Windows 10',
    mfaStatus: 'Not Enrolled',
    sessionDurationMins: 0,
  }
];

const MOCK_EXECUTION_LOGS: ExecutionLog[] = [
  {
    id: 'RUN-2026-901',
    pipelineName: 'SAP Financials ➔ Dynamics 365 Central GL Sync',
    jobId: 'job-901',
    startTime: '2026-08-09 10:00:00 UTC',
    endTime: '2026-08-09 10:42:15 UTC',
    recordsSynced: 142890,
    averageThroughput: 3402,
    status: 'Completed',
    warnings: 0,
    initiatedBy: 'system_cron_scheduler',
  },
  {
    id: 'RUN-2026-902',
    pipelineName: 'Oracle HRMS Employee Master Anonymization',
    jobId: 'job-902',
    startTime: '2026-08-09 09:15:00 UTC',
    endTime: '2026-08-09 09:16:30 UTC',
    recordsSynced: 12400,
    averageThroughput: 137,
    status: 'Completed',
    warnings: 12,
    initiatedBy: 'compliance_officer@enterprise.com',
  },
  {
    id: 'RUN-2026-903',
    pipelineName: 'Salesforce CRM Accounts ➔ Dynamics 365 Customers',
    jobId: 'job-903',
    startTime: '2026-08-09 08:00:00 UTC',
    endTime: '2026-08-09 08:24:12 UTC',
    recordsSynced: 18450,
    averageThroughput: 768,
    status: 'Completed',
    warnings: 0,
    initiatedBy: 'admin@enterprise.com',
  },
  {
    id: 'RUN-2026-904',
    pipelineName: 'Legacy AS400 Archived Ledgers Batch Extraction',
    jobId: 'job-904',
    startTime: '2026-08-09 06:00:00 UTC',
    endTime: '2026-08-09 06:14:50 UTC',
    recordsSynced: 89000,
    averageThroughput: 100,
    status: 'Failed',
    warnings: 1,
    initiatedBy: 'system_etl_bot',
  },
  {
    id: 'RUN-2026-905',
    pipelineName: 'Teradata Master Catalog Schema Scan',
    jobId: 'job-905',
    startTime: '2026-08-09 11:30:00 UTC',
    endTime: 'In Progress',
    recordsSynced: 8520,
    averageThroughput: 568,
    status: 'Running',
    warnings: 0,
    initiatedBy: 'security.lead@enterprise.com',
  },
];

const MOCK_CHANGE_LOGS: ChangeLog[] = [
  {
    id: 'CHG-2026-004',
    timestamp: '2026-08-09 10:12:00 UTC',
    authorizedBy: 'security.lead@enterprise.com',
    targetConfig: 'Oracle Cloud ERP Gateway Connector',
    action: 'CONNECTOR_TLS_ENFORCED',
    changeCategory: 'Connection Config',
    beforeState: {
      tlsEnforced: false,
      minTlsVersion: '1.2',
      timeoutMs: 5000,
      cipherSuite: 'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384',
    },
    afterState: {
      tlsEnforced: true,
      minTlsVersion: '1.3',
      timeoutMs: 2500,
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
    },
  },
  {
    id: 'CHG-2026-003',
    timestamp: '2026-08-09 09:40:00 UTC',
    authorizedBy: 'admin@enterprise.com',
    targetConfig: 'SAP Customer Master Field Mapping',
    action: 'SCHEMA_MAPPING_OVERRIDE_ANONYMIZED',
    changeCategory: 'Schema Map',
    beforeState: {
      sourceField: 'KUNNR',
      targetField: 'CustomerID',
      anonymizationType: 'None',
      auditVerified: false,
    },
    afterState: {
      sourceField: 'KUNNR',
      targetField: 'CustomerID',
      anonymizationType: 'SHA256_HASH_SALTED',
      auditVerified: true,
    },
  },
  {
    id: 'CHG-2026-002',
    timestamp: '2026-08-08 18:24:00 UTC',
    authorizedBy: 'compliance_officer@enterprise.com',
    targetConfig: 'Staging Vault Retention Settings',
    action: 'RETENTION_PERIOD_REDUCED',
    changeCategory: 'Retention Policy',
    beforeState: {
      retentionDays: 30,
      autoPurgeOnComplete: false,
      wipeMethod: 'LogicalDelete',
    },
    afterState: {
      retentionDays: 7,
      autoPurgeOnComplete: true,
      wipeMethod: 'Cryptographic_Shredding_AES',
    },
  },
];

const INITIAL_COMPLIANCE_CONTROLS: ComplianceControl[] = [
  // GDPR
  {
    id: 'GDPR-ART-17',
    title: 'Right to Erasure (Right to be Forgotten)',
    requirement: 'Ensure automated capabilities for the immediate cryptographic erasure and hard-purging of personal identifiers across staging and targets.',
    framework: 'GDPR',
    status: 'Compliant',
    telemetryValidation: 'Passed',
    lastEvaluated: 'Just now',
    autoRemediationType: 'WORM purging cycle',
    remediationAction: 'Activate 7-day cryptographic shredding automated policy across all active staging caches.',
  },
  {
    id: 'GDPR-ART-32',
    title: 'Security of Processing - Cross-Border Anonymization',
    requirement: 'Mandatory obfuscation, hashing, or structural masking of sensitive identifiers before migrating across jurisdictional cloud database centers.',
    framework: 'GDPR',
    status: 'Needs Attention',
    telemetryValidation: 'Warning',
    lastEvaluated: '10 mins ago',
    autoRemediationType: 'Enforce Masking Guardrails',
    remediationAction: 'Enable SHA-256 HMAC salting on country, address, and credit-card target schema nodes.',
  },
  // ISO 27001
  {
    id: 'ISO-A.12.6.1',
    title: 'Management of Technical Vulnerabilities',
    requirement: 'Enforce strict TLS 1.3 protocol handshakes, end-to-end payload signing, and deny fallback legacy ciphers on all ETL connectors.',
    framework: 'ISO27001',
    status: 'Compliant',
    telemetryValidation: 'Passed',
    lastEvaluated: 'Just now',
    autoRemediationType: 'TLS Protocol Upgrader',
    remediationAction: 'Deploy system policy blocking all legacy TLS 1.0/1.1 inbound connections.',
  },
  {
    id: 'ISO-A.9.4.2',
    title: 'Secure Log-on Procedures (MFA Enforcement)',
    requirement: 'Enforce continuous Multi-Factor Authentication (MFA) step-up constraints for all active admin and data engineer workspace logins.',
    framework: 'ISO27001',
    status: 'Needs Attention',
    telemetryValidation: 'Warning',
    lastEvaluated: '2 hours ago',
    autoRemediationType: 'Strict MFA Policy Enforcer',
    remediationAction: 'Force immediate SAML 2.0 step-up verification rules across Web SSO endpoints.',
  },
  // SOC 2 Type II
  {
    id: 'SOC2-CC-6.1',
    title: 'Boundary Protection & Network Isolation',
    requirement: 'Ingest raw databases securely through dedicated Private Links, certified API endpoints, or encrypted VPN tunnels exclusively.',
    framework: 'SOC2',
    status: 'Compliant',
    telemetryValidation: 'Passed',
    lastEvaluated: 'Just now',
    autoRemediationType: 'Private Gateway Validation',
    remediationAction: 'Verify active IP whitelisting parameters for active sharded database structures.',
  },
  {
    id: 'SOC2-CC-6.8',
    title: 'Transmission Integrity & AES-256 Storage',
    requirement: 'Protect customer credentials, payment schemas, and audit logs using dedicated AES-256 encryption at rest and WORM immutability.',
    framework: 'SOC2',
    status: 'Needs Attention',
    telemetryValidation: 'Failed',
    lastEvaluated: '1 hour ago',
    autoRemediationType: 'AES-256 Storage Enforcer',
    remediationAction: 'Execute structural database encryption for unencrypted legacy staging volumes.',
  },
  // HIPAA
  {
    id: 'HIPAA-164.312(a)(2)(iv)',
    title: 'Encryption & Decryption of PHI in Transit',
    requirement: 'Obfuscate or structurally mask Protected Health Information (PHI) in real-time streams to satisfy compliance requirements.',
    framework: 'HIPAA',
    status: 'Compliant',
    telemetryValidation: 'Passed',
    lastEvaluated: 'Just now',
    autoRemediationType: 'PHI Cryptographic Obfuscator',
    remediationAction: 'Verify automatic masking layer parameters for Medical Records numbers.',
  },
  {
    id: 'HIPAA-164.312(b)',
    title: 'Audit Controls (Tamper-Proof Trails)',
    requirement: 'Establish fully continuous, cryptographically sealed, immutable write-once audit logs tracking access, modifications, and exports.',
    framework: 'HIPAA',
    status: 'Compliant',
    telemetryValidation: 'Passed',
    lastEvaluated: 'Just now',
    autoRemediationType: 'Sealed Signature Validator',
    remediationAction: 'Automate daily SHA-256 block-integrity checks across transaction registers.',
  },
];

interface EventAnnotation {
  notes: string;
  resolved: boolean;
  annotatedBy: string;
  timestamp: string;
}

interface AuditAlert {
  id: string;
  type: 'Security' | 'Compliance' | 'Operational';
  title: string;
  description: string;
  severity: 'Medium' | 'High' | 'Critical';
  timestamp: string;
  relatedId: string;
  isRead: boolean;
}

export const AuditReportingView: React.FC = () => {
  // --- Navigation & Filter State ---
  const [activeTab, setActiveTab] = useState<'user-activity' | 'login-history' | 'execution-logs' | 'change-logs' | 'compliance-reports'>('user-activity');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [dateRange, setDateRange] = useState<string>('Last 30 Days');
  const [annotationFilter, setAnnotationFilter] = useState<'All' | 'Annotated' | 'Resolved' | 'Unresolved'>('All');
  const [showExportOptions, setShowExportOptions] = useState(false);

  // --- Alert System State ---
  const [alerts, setAlerts] = useState<AuditAlert[]>([]);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);

  // --- Dynamic Compliance Checklist State ---
  const [complianceControls, setComplianceControls] = useState<ComplianceControl[]>(INITIAL_COMPLIANCE_CONTROLS);
  const [selectedFramework, setSelectedFramework] = useState<'GDPR' | 'ISO27001' | 'SOC2' | 'HIPAA'>('GDPR');
  const [remediatingControlId, setRemediatingControlId] = useState<string | null>(null);

  // --- Compliance Annotations & Sign-off State ---
  const [annotations, setAnnotations] = useState<Record<string, EventAnnotation>>({
    'ACT-2026-9404': {
      notes: 'SSN staging failure under active investigation. Staging caches verified to be fully purged.',
      resolved: true,
      annotatedBy: 'compliance_officer@enterprise.com',
      timestamp: '2026-08-09 08:30:15 UTC'
    },
    'LGN-2026-402': {
      notes: 'Failed credential attempt from Petersburg block list IP. Confirmed locked out automatically by gateway.',
      resolved: true,
      annotatedBy: 'compliance_officer@enterprise.com',
      timestamp: '2026-08-09 11:15:00 UTC'
    },
    'RUN-2026-904': {
      notes: 'Legacy AS400 connection issue under review with database administration team.',
      resolved: false,
      annotatedBy: 'compliance_officer@enterprise.com',
      timestamp: '2026-08-09 06:45:00 UTC'
    }
  });

  const [annotatingEvent, setAnnotatingEvent] = useState<{
    id: string;
    type: 'Activity' | 'Login' | 'Execution' | 'Change';
    title: string;
    details: string;
    user: string;
    timestamp: string;
  } | null>(null);

  const [tempNotes, setTempNotes] = useState<string>('');
  const [tempResolved, setTempResolved] = useState<boolean>(false);

  React.useEffect(() => {
    if (annotatingEvent) {
      const existing = annotations[annotatingEvent.id];
      setTempNotes(existing ? existing.notes : '');
      setTempResolved(existing ? existing.resolved : false);
    }
  }, [annotatingEvent, annotations]);

  const handleSaveAnnotation = () => {
    if (!annotatingEvent) return;

    const newAnnotation: EventAnnotation = {
      notes: tempNotes.trim(),
      resolved: tempResolved,
      annotatedBy: 'compliance_officer@enterprise.com',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
    };

    setAnnotations((prev) => ({
      ...prev,
      [annotatingEvent.id]: newAnnotation
    }));

    setAnnotatingEvent(null);
  };

  const renderAnnotationBadge = (
    id: string,
    type: 'Activity' | 'Login' | 'Execution' | 'Change',
    title: string,
    details: string,
    user: string,
    timestamp: string
  ) => {
    const ann = annotations[id];
    if (ann) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAnnotatingEvent({ id, type, title, details, user, timestamp });
          }}
          className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer whitespace-nowrap ${
            ann.resolved
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          }`}
          title={`Notes: ${ann.notes}\nBy: ${ann.annotatedBy}`}
        >
          {ann.resolved ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-amber-500" />
          )}
          <span className="truncate max-w-[80px]">
            {ann.resolved ? 'Resolved' : 'Reviewing'}
          </span>
        </button>
      );
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setAnnotatingEvent({ id, type, title, details, user, timestamp });
        }}
        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 rounded text-[10px] font-bold font-sans transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
      >
        <Plus className="w-3 h-3 text-slate-500" />
        <span>Sign-off</span>
      </button>
    );
  };

  // --- Interactive Inspection Modals ---
  const [inspectedActivity, setInspectedActivity] = useState<UserActivity | null>(null);
  const [inspectedChange, setInspectedChange] = useState<ChangeLog | null>(null);

  // --- Copy Indicator Status ---
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // --- Simulation Live Feeds ---
  const [userActivities, setUserActivities] = useState<UserActivity[]>(MOCK_USER_ACTIVITIES);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // --- Alert Detection Engine ---
  const detectAlerts = React.useCallback((activities: UserActivity[], logins: LoginRecord[]) => {
    const newAlerts: AuditAlert[] = [];

    // Pattern 1: Multiple Failed Logins from same IP
    const failedLoginsByIp: Record<string, number> = {};
    logins.forEach(l => {
      if (l.status === 'Failed' || l.status === 'Locked Out') {
        failedLoginsByIp[l.ipAddress] = (failedLoginsByIp[l.ipAddress] || 0) + 1;
        if (failedLoginsByIp[l.ipAddress] >= 3) {
          newAlerts.push({
            id: `ALRT-LGN-${l.ipAddress}`,
            type: 'Security',
            title: 'Brute Force Attempt Detected',
            description: `Multiple failed login attempts detected from IP: ${l.ipAddress}`,
            severity: 'Critical',
            timestamp: l.timestamp,
            relatedId: l.id,
            isRead: false
          });
        }
      }
    });

    // Pattern 2: Critical Severity Actions
    activities.forEach(act => {
      if (act.severity === 'Critical') {
        newAlerts.push({
          id: `ALRT-ACT-${act.id}`,
          type: 'Compliance',
          title: 'Critical Security Violation',
          description: act.details,
          severity: 'Critical',
          timestamp: act.timestamp,
          relatedId: act.id,
          isRead: false
        });
      } else if (act.severity === 'High' && act.status === 'Failed') {
        newAlerts.push({
          id: `ALRT-FAIL-${act.id}`,
          type: 'Operational',
          title: 'High Severity Action Failure',
          description: `Failed attempt to execute: ${act.action}`,
          severity: 'High',
          timestamp: act.timestamp,
          relatedId: act.id,
          isRead: false
        });
      }
    });

    setAlerts(prev => {
      const existingIds = new Set(prev.map(a => a.id));
      const uniqueNewAlerts = newAlerts.filter(a => !existingIds.has(a.id));
      return [...uniqueNewAlerts, ...prev];
    });
  }, []);

  React.useEffect(() => {
    detectAlerts(userActivities, MOCK_LOGIN_HISTORY);
  }, [userActivities, detectAlerts]);

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const simulateNewActivity = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const actions = [
        { action: 'CREDENTIAL_KEY_ROTATED', cat: 'Security & Auth', desc: 'OAuth client secret rotated' },
        { action: 'PII_ANONYMIZATION_POLICY_ENFORCED', cat: 'Data Quality', desc: 'Enforced encryption rules on country target schema' },
        { action: 'USER_ROLE_ELEVATED', cat: 'User Management', desc: 'Elevated viewer to data engineer' },
        { action: 'SCHEMA_MAPPING_AUTHORIZED', cat: 'Schema & Mapping', desc: 'Approved schema mapping for billing master' },
      ] as const;

      const pick = actions[Math.floor(Math.random() * actions.length)];
      const idNum = Math.floor(Math.random() * 900) + 9410;

      const newAct: UserActivity = {
        id: `ACT-2026-${idNum}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        user: 'system_etl_bot',
        role: 'Service Account',
        action: pick.action,
        category: pick.cat,
        targetEntity: 'Automated Migration Stream Monitor',
        severity: 'Medium',
        status: 'Success',
        ipAddress: '127.0.0.1',
        checksum: Math.random().toString(16).substring(2, 66),
        details: `${pick.desc}. Validated and signed with a fresh digital block checksum.`,
        metadata: {
          sessionRef: `sess-${idNum}`,
          automatedVerification: true,
        },
      };

      setUserActivities((prev) => [newAct, ...prev]);
      setIsRefreshing(false);
    }, 600);
  };

  // --- Auto Remediation Trigger ---
  const handleAutoRemediate = (id: string) => {
    setRemediatingControlId(id);
    setTimeout(() => {
      setComplianceControls((prev) =>
        prev.map((ctrl) => {
          if (ctrl.id === id) {
            return {
              ...ctrl,
              status: 'Compliant',
              telemetryValidation: 'Remediated',
              lastEvaluated: 'Just now (Auto-Remediated)',
            };
          }
          return ctrl;
        })
      );
      setRemediatingControlId(null);
    }, 1200);
  };

  // --- Filtering Logic for Each Sub-View ---

  const filteredActivities = useMemo(() => {
    return userActivities.filter((act) => {
      const matchesSearch =
        act.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.details.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = selectedSeverity === 'All' || act.severity === selectedSeverity;
      const matchesCategory = selectedCategory === 'All' || act.category === selectedCategory;

      const ann = annotations[act.id];
      const matchesAnnotation = 
        annotationFilter === 'All' ||
        (annotationFilter === 'Annotated' && ann) ||
        (annotationFilter === 'Resolved' && ann?.resolved) ||
        (annotationFilter === 'Unresolved' && (!ann || !ann.resolved));

      return matchesSearch && matchesSeverity && matchesCategory && matchesAnnotation;
    });
  }, [userActivities, searchQuery, selectedSeverity, selectedCategory, annotations, annotationFilter]);

  const filteredLogins = useMemo(() => {
    return MOCK_LOGIN_HISTORY.filter((log) => {
      const matchesSearch =
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ipAddress.includes(searchQuery) ||
        log.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'All' || log.status === selectedStatus;

      const ann = annotations[log.id];
      const matchesAnnotation = 
        annotationFilter === 'All' ||
        (annotationFilter === 'Annotated' && ann) ||
        (annotationFilter === 'Resolved' && ann?.resolved) ||
        (annotationFilter === 'Unresolved' && (!ann || !ann.resolved));

      return matchesSearch && matchesStatus && matchesAnnotation;
    });
  }, [searchQuery, selectedStatus, annotations, annotationFilter]);

  const filteredExecutions = useMemo(() => {
    return MOCK_EXECUTION_LOGS.filter((exec) => {
      const matchesSearch =
        exec.pipelineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exec.jobId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exec.initiatedBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'All' || exec.status === selectedStatus;

      const ann = annotations[exec.id];
      const matchesAnnotation = 
        annotationFilter === 'All' ||
        (annotationFilter === 'Annotated' && ann) ||
        (annotationFilter === 'Resolved' && ann?.resolved) ||
        (annotationFilter === 'Unresolved' && (!ann || !ann.resolved));

      return matchesSearch && matchesStatus && matchesAnnotation;
    });
  }, [searchQuery, selectedStatus, annotations, annotationFilter]);

  const filteredChanges = useMemo(() => {
    return MOCK_CHANGE_LOGS.filter((chg) => {
      const matchesSearch =
        chg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chg.authorizedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chg.targetConfig.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chg.action.toLowerCase().includes(searchQuery.toLowerCase());

      const ann = annotations[chg.id];
      const matchesAnnotation = 
        annotationFilter === 'All' ||
        (annotationFilter === 'Annotated' && ann) ||
        (annotationFilter === 'Resolved' && ann?.resolved) ||
        (annotationFilter === 'Unresolved' && (!ann || !ann.resolved));

      return matchesSearch && matchesAnnotation;
    });
  }, [searchQuery, annotations, annotationFilter]);

  const timelineEvents = useMemo(() => {
    const events: any[] = [];
    filteredExecutions.forEach(exec => {
      events.push({
        id: exec.id,
        time: exec.startTime,
        type: 'execution',
        title: exec.pipelineName,
        status: exec.status,
        icon: exec.status === 'Completed' ? CheckCircle2 : (exec.status === 'Failed' ? AlertTriangle : RefreshCw),
        color: exec.status === 'Completed' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : (exec.status === 'Failed' ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-indigo-600 bg-indigo-50 border-indigo-200')
      });
      if (exec.status === 'Failed') {
        events.push({
          id: `${exec.id}-retry`,
          time: exec.endTime !== 'In Progress' ? exec.endTime : exec.startTime.replace('06:00:00', '06:15:00'),
          type: 'retry',
          title: `Auto-Retry`,
          status: 'Retried',
          icon: RotateCcw,
          color: 'text-amber-600 bg-amber-50 border-amber-200'
        });
      }
    });
    filteredChanges.forEach(chg => {
      events.push({
        id: chg.id,
        time: chg.timestamp,
        type: 'change',
        title: chg.action,
        status: 'Config',
        icon: SlidersHorizontal,
        color: 'text-sky-600 bg-sky-50 border-sky-200'
      });
    });
    
    return events.sort((a, b) => new Date(a.time.replace(' UTC', 'Z')).getTime() - new Date(b.time.replace(' UTC', 'Z')).getTime());
  }, [filteredExecutions, filteredChanges]);

  // --- Enhanced Export Logic (CSV & PDF) ---
  const handleDownloadReport = (format: 'csv' | 'pdf') => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';
    let title = '';

    if (activeTab === 'user-activity') {
      title = 'User Activity Audit Report';
      headers = ['Activity ID', 'Timestamp', 'Actor', 'Role', 'Category', 'Action', 'Target Entity', 'Severity', 'Status', 'IP Address'];
      rows = filteredActivities.map((act) => [
        act.id, act.timestamp, act.user, act.role, act.category, act.action, act.targetEntity, act.severity, act.status, act.ipAddress
      ]);
      filename = 'platform_user_activity';
    } else if (activeTab === 'login-history') {
      title = 'Security Login History Report';
      headers = ['Login ID', 'Timestamp', 'User', 'Status', 'IP Address', 'Location', 'Browser', 'MFA Status', 'Session Duration (mins)'];
      rows = filteredLogins.map((log) => [
        log.id, log.timestamp, log.user, log.status, log.ipAddress, log.location, log.browser, log.mfaStatus, log.sessionDurationMins.toString()
      ]);
      filename = 'login_security_history';
    } else if (activeTab === 'execution-logs') {
      title = 'Migration Execution Logs Report';
      headers = ['Run ID', 'Pipeline Name', 'Job ID', 'Start Time', 'End Time', 'Records Synced', 'Throughput rps', 'Status', 'Warnings', 'Initiated By'];
      rows = filteredExecutions.map((exec) => [
        exec.id, exec.pipelineName, exec.jobId, exec.startTime, exec.endTime, exec.recordsSynced.toString(), exec.averageThroughput.toString(), exec.status, exec.warnings.toString(), exec.initiatedBy
      ]);
      filename = 'migration_execution_logs';
    } else if (activeTab === 'change-logs') {
      title = 'Configuration & Schema Change Report';
      headers = ['Change ID', 'Timestamp', 'Authorized By', 'Target Configuration', 'Action Category', 'Action'];
      rows = filteredChanges.map((chg) => [
        chg.id, chg.timestamp, chg.authorizedBy, chg.targetConfig, chg.changeCategory, chg.action
      ]);
      filename = 'config_and_schema_changelog';
    } else {
      title = 'Regulatory Compliance Checklist Report';
      headers = ['Control ID', 'Control Title', 'Requirement', 'Framework', 'Status', 'Telemetry', 'Last Evaluated'];
      rows = complianceControls.map((ctrl) => [
        ctrl.id, ctrl.title, ctrl.requirement, ctrl.framework, ctrl.status, ctrl.telemetryValidation, ctrl.lastEvaluated
      ]);
      filename = 'regulatory_compliance_checklist';
    }

    const fullFilename = `AuditCenter_${filename}_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'csv') {
      const csvContent = [headers.join(','), ...rows.map((r) => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fullFilename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      const doc = new jsPDF('landscape');
      
      // Metadata Header
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Total Records: ${rows.length}`, 14, 35);
      doc.text(`Status: Official Audit Report - Immutable Ledger Copy`, 14, 40);

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(`${fullFilename}.pdf`);
    }
    setShowExportOptions(false);
  };

  // --- Dynamic Score Card Stats ---
  const complianceScore = useMemo(() => {
    const total = complianceControls.length;
    const compliant = complianceControls.filter((c) => c.status === 'Compliant').length;
    return Math.round((compliant / total) * 100);
  }, [complianceControls]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-start gap-4.5 z-10 w-full lg:w-auto">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/50 shadow-2xs shrink-0 self-start">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
          </div>
          
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-mono font-bold rounded-full border border-indigo-100">
                Module 30 & 31 – Unified Compliance & Operational Audit Log Center
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold rounded-full border border-emerald-100 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Cryptographically Verified (WORM Storage Active)
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Audit & Compliance Assurance Engine
            </h1>
            <p className="text-xs text-slate-500 max-w-4xl leading-relaxed font-medium">
              Monitor real-time workspace actions, security logins, pipeline synchronization, and target system changes. Evaluate real-time readiness against GDPR, ISO 27001, SOC 2 Type II, and HIPAA directives.
            </p>
          </div>
        </div>

        {/* Global Export Options */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 z-10 self-start lg:self-auto">
          <button
            onClick={() => setShowAlertsPanel(!showAlertsPanel)}
            className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer group"
          >
            <ShieldAlert className={`w-5 h-5 ${alerts.filter(a => !a.isRead).length > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
            {alerts.filter(a => !a.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {alerts.filter(a => !a.isRead).length}
              </span>
            )}
            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 hidden group-hover:block z-50 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Active Threat Monitor</h3>
                <span className="text-[10px] font-bold text-slate-400">{alerts.length} total alerts</span>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {alerts.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-[10px] font-medium italic">
                    No active threat patterns detected in current logs.
                  </div>
                ) : (
                  alerts.map(alert => (
                    <div key={alert.id} className={`p-3 rounded-xl border flex gap-3 transition-colors ${
                      alert.severity === 'Critical' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
                    }`}>
                      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        alert.severity === 'Critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-900 leading-tight">{alert.title}</div>
                        <div className="text-[9px] text-slate-500 leading-tight line-clamp-2">{alert.description}</div>
                        <div className="text-[8px] font-mono text-slate-400">{alert.timestamp}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {alerts.length > 0 && (
                <button 
                  onClick={() => setAlerts([])}
                  className="w-full mt-3 py-2 text-[10px] font-black text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                >
                  Dismiss All Threats
                </button>
              )}
            </div>
          </button>
          {activeTab === 'user-activity' && (
            <button
              onClick={simulateNewActivity}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Poll for new database & workspace actions"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Poll Activity Stream</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              title="Download the currently filtered view as CSV or PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportOptions ? 'rotate-180' : ''}`} />
            </button>
            
            {showExportOptions && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => handleDownloadReport('csv')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export as CSV</span>
                </button>
                <div className="h-px bg-slate-100 mx-2" />
                <button
                  onClick={() => handleDownloadReport('pdf')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Export as PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview KPI Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Unified Compliance Posture</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1.5">
            <span className={complianceScore === 100 ? 'text-emerald-600' : 'text-indigo-600'}>{complianceScore}%</span>
            <span className="text-[10px] text-slate-400 font-normal">Framework Adherence</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {complianceControls.filter((c) => c.status === 'Compliant').length} of {complianceControls.length} active controls verified
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Tamper-Evident Security Seals</span>
            <Lock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">Active</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>100% SHA-256 Chain Locked</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Active Migration Jobs Audited</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {MOCK_EXECUTION_LOGS.filter((e) => e.status === 'Completed').length} / {MOCK_EXECUTION_LOGS.length} Runs
          </div>
          <div className="text-[11px] text-slate-500">
            Zero integrity validation bypasses detected
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Audit Data Vault Retention</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">7 Years (Immutable)</div>
          <div className="text-[11px] text-slate-500 font-mono">
            WORM Writable-Once-Read-Many
          </div>
        </div>
      </div>

      {/* Tabs Control Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 max-w-5xl shadow-2xs">
        <button
          onClick={() => { setActiveTab('user-activity'); setSearchQuery(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'user-activity'
              ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/50 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 font-bold'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>User Activity</span>
        </button>

        <button
          onClick={() => { setActiveTab('login-history'); setSearchQuery(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'login-history'
              ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/50 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 font-bold'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Login History</span>
        </button>

        <button
          onClick={() => { setActiveTab('execution-logs'); setSearchQuery(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'execution-logs'
              ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/50 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 font-bold'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Execution Logs</span>
        </button>

        <button
          onClick={() => { setActiveTab('change-logs'); setSearchQuery(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'change-logs'
              ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/50 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 font-bold'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Change Logs</span>
        </button>

        <button
          onClick={() => { setActiveTab('compliance-reports'); setSearchQuery(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'compliance-reports'
              ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/50 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 font-bold'
          }`}
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === 'compliance-reports' ? 'text-indigo-600' : 'text-slate-400 animate-pulse'}`} />
          <span>Compliance Reports</span>
        </button>
      </div>

      {/* --- Filter / Search Controls (Muted for Compliance checklists tab which has its own control) --- */}
      {activeTab !== 'compliance-reports' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={
                  activeTab === 'user-activity'
                    ? "Search activity ID, user, actions..."
                    : activeTab === 'login-history'
                    ? "Search user, IP address, geo-locations..."
                    : activeTab === 'execution-logs'
                    ? "Search pipeline name, job ID, operator..."
                    : "Search authorized changed items..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Filter Selects */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              
              {activeTab === 'user-activity' && (
                <>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-semibold text-[10px] uppercase">Category:</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      <option value="Security & Auth">Security & Auth</option>
                      <option value="Schema & Mapping">Schema & Mapping</option>
                      <option value="Data Quality">Data Quality</option>
                      <option value="User Management">User Management</option>
                      <option value="Platform Admin">Platform Admin</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-semibold text-[10px] uppercase">Severity:</span>
                    <select
                      value={selectedSeverity}
                      onChange={(e) => setSelectedSeverity(e.target.value)}
                      className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="All">All Severities</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </>
              )}

              {(activeTab === 'login-history' || activeTab === 'execution-logs') && (
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold text-[10px] uppercase">Status:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    {activeTab === 'login-history' ? (
                      <>
                        <option value="Success">Success Only</option>
                        <option value="Failed">Failed Only</option>
                        <option value="Locked Out">Locked Out Only</option>
                      </>
                    ) : (
                      <>
                        <option value="Completed">Completed Only</option>
                        <option value="Failed">Failed Only</option>
                        <option value="Running">Running Only</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Time Scope selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer font-sans"
                >
                  <option value="Last 24 Hours">Last 24 Hours</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                </select>
              </div>

              {/* Compliance Sign-off selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <select
                  value={annotationFilter}
                  onChange={(e) => setAnnotationFilter(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer font-sans"
                >
                  <option value="All">All Compliance States</option>
                  <option value="Annotated">With Sign-off Only</option>
                  <option value="Resolved">Resolved / Approved ✅</option>
                  <option value="Unresolved">Unresolved / Pending ⚠️</option>
                </select>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- CONTENT WORKSPACES --- */}

      {/* Tab 1: User Activity Log */}
      {activeTab === 'user-activity' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600" />
              Cryptographically Signed User & System Actions
            </h2>
            <span className="text-xs text-slate-400 font-mono">Retained Scope: {dateRange}</span>
          </div>

          <OverflowTableWrapper hintLabel="Scroll horizontally to inspect full activity trace metrics">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Activity ID</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Platform Action</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Compliance Sign-off</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No user activity logs matched your active filters.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act) => (
                    <tr
                      key={act.id}
                      onClick={() => setInspectedActivity(act)}
                      className={`hover:bg-indigo-50/30 transition-all cursor-pointer group ${
                        alerts.some(a => a.relatedId === act.id) ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 flex items-center gap-2">
                        {act.id}
                        {alerts.some(a => a.relatedId === act.id) && (
                          <div className="p-0.5 bg-rose-100 text-rose-600 rounded" title="Threshold Alert Triggered">
                            <AlertTriangle className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">{act.timestamp}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{act.user}</div>
                        <div className="text-[10px] text-slate-400">{act.role} ({act.ipAddress})</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono text-[11px] text-slate-800">{act.action}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                          {act.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 max-w-xs truncate" title={act.targetEntity}>
                        {act.targetEntity}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            act.severity === 'Critical'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : act.severity === 'High'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : act.severity === 'Medium'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {act.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            act.status === 'Success'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {act.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {renderAnnotationBadge(act.id, 'Activity', act.action, act.details, act.user, act.timestamp)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedActivity(act);
                          }}
                          className="p-1.5 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
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
      )}

      {/* Tab 2: Login History */}
      {activeTab === 'login-history' && (
        <div className="space-y-4">
          
          {/* Failed Login attempts warning panel */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-800">Login Security Intel & MFA Rule Check</h4>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                 MOCKED GEOLOCATIONS OUTSIDE ENTERPRISE VPC ARE AUTOMATICALLY FLAGGED. 1 unauthorized failed authentication attempt from Petersburg VPC quarantined. Strict Multi-Factor-Authentication validated at 100% compliance over all active SAML logins.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Active Workspace Login Security History
              </h2>
              <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
                6 Active Records Logged
              </span>
            </div>

            <OverflowTableWrapper hintLabel="Scroll horizontally to inspect MFA state, geographic IPs, and browser headers">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Login ID</th>
                    <th className="py-3 px-4">Timestamp (UTC)</th>
                    <th className="py-3 px-4">User Email</th>
                    <th className="py-3 px-4">Login Status</th>
                    <th className="py-3 px-4">MFA State</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Geo Location</th>
                    <th className="py-3 px-4">Browser/Agent</th>
                    <th className="py-3 px-4">Compliance Sign-off</th>
                    <th className="py-3 px-4 text-right">Session Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {filteredLogins.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 font-sans">
                        No login history records matched your active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogins.map((record) => (
                      <tr 
                        key={record.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          alerts.some(a => a.relatedId === record.id) ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-indigo-700 flex items-center gap-2">
                          {record.id}
                          {alerts.some(a => a.relatedId === record.id) && (
                            <div className="p-0.5 bg-rose-100 text-rose-600 rounded" title="High Risk Pattern Detected">
                              <ShieldAlert className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{record.timestamp}</td>
                        <td className="py-3.5 px-4 font-sans font-semibold text-slate-900">{record.user}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              record.status === 'Success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : record.status === 'Failed'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-red-50 text-red-800 border border-red-300 animate-pulse'
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold font-sans border ${
                              record.mfaStatus === 'Verified'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : record.mfaStatus === 'Failed'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {record.mfaStatus === 'Verified' ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <X className="w-3 h-3 text-red-600" />
                            )}
                            MFA {record.mfaStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-bold">{record.ipAddress}</td>
                        <td className="py-3.5 px-4 font-sans text-slate-600">{record.location}</td>
                        <td className="py-3.5 px-4 font-sans text-slate-500 max-w-xs truncate" title={record.browser}>
                          {record.browser}
                        </td>
                        <td className="py-3.5 px-4">
                          {renderAnnotationBadge(
                            record.id,
                            'Login',
                            `Login from ${record.location} (${record.ipAddress})`,
                            `Browser: ${record.browser} | MFA Status: ${record.mfaStatus}`,
                            record.user,
                            record.timestamp
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600 font-sans">
                          {record.sessionDurationMins > 0 ? `${record.sessionDurationMins} mins` : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </OverflowTableWrapper>
          </div>
        </div>
      )}

      {/* Tab 3: Execution Logs */}
      {activeTab === 'execution-logs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-4">
                <GitCommit className="w-4 h-4 text-indigo-500" />
                Migration Event Timeline
              </h2>
              <div className="relative flex items-start overflow-x-auto pb-4 pt-2 hide-scrollbar">
                <div className="absolute left-8 right-8 top-[24px] h-0.5 bg-slate-200 -z-10" />
                {timelineEvents.map((evt, idx) => (
                  <div key={evt.id} className="flex flex-col items-center min-w-[140px] px-2 relative group cursor-pointer z-10 flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-3 shadow-sm transition-transform group-hover:scale-110 bg-white ${evt.color}`}>
                      <evt.icon className="w-4 h-4" />
                    </div>
                    <div className="text-center w-full">
                      <div className="text-[10px] font-black text-slate-800 truncate w-full" title={evt.title}>{evt.title}</div>
                      <div className="text-[9px] font-mono text-slate-500 mt-0.5">{evt.time.split(' ')[1]}</div>
                      <div className={`text-[9px] font-bold mt-1 uppercase tracking-wider inline-block px-1.5 py-0.5 rounded ${evt.color.replace('border-', 'border border-').replace('text-', 'text-')}`}>{evt.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-600" />
              Migration Pipeline Execution Registers
            </h2>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              Real-time CDC throughput tracked
            </span>
          </div>

          <OverflowTableWrapper hintLabel="Scroll horizontally to inspect database rows synced, speed, and operator triggers">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Run ID</th>
                  <th className="py-3 px-4">Pipeline Sync Process</th>
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">Start Time (UTC)</th>
                  <th className="py-3 px-4">End Time (UTC)</th>
                  <th className="py-3 px-4">Records Synced</th>
                  <th className="py-3 px-4">Avg Ingestion Throughput</th>
                  <th className="py-3 px-4">Warnings</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Compliance Sign-off</th>
                  <th className="py-3 px-4 text-right">Initiated By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredExecutions.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 font-sans">
                      No pipeline execution records matched your active filters.
                    </td>
                  </tr>
                ) : (
                  filteredExecutions.map((exec) => (
                    <tr key={exec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-indigo-700">{exec.id}</td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-slate-800">{exec.pipelineName}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-bold">{exec.jobId}</td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{exec.startTime}</td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{exec.endTime}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{exec.recordsSynced.toLocaleString()} rows</td>
                      <td className="py-3.5 px-4 font-bold text-indigo-600 font-mono">
                        {exec.averageThroughput.toLocaleString()} rows/s
                      </td>
                      <td className="py-3.5 px-4">
                        {exec.warnings > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-sans font-bold text-[10px] inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            {exec.warnings} Warnings
                          </span>
                        ) : (
                          <span className="text-slate-400 font-sans">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                            exec.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : exec.status === 'Running'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {exec.status === 'Running' && <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />}
                          {exec.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {renderAnnotationBadge(
                          exec.id,
                          'Execution',
                          `Job execution for ${exec.pipelineName}`,
                          `Job ID: ${exec.jobId} | Synced: ${exec.recordsSynced.toLocaleString()} rows | Avg speed: ${exec.averageThroughput.toLocaleString()} rows/s`,
                          exec.initiatedBy,
                          exec.startTime
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans text-slate-600">{exec.initiatedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </OverflowTableWrapper>
        </div>
        </div>
      )}

      {/* Tab 4: Schema & Configuration Change Logs */}
      {activeTab === 'change-logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600" />
              Authorized Schema Mapping & Configuration Changes (TAMPER-EVIDENT)
            </h2>
            <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
              Full State Diff Comparison Available
            </span>
          </div>

          <OverflowTableWrapper hintLabel="Scroll horizontally. Click any row or action icon to view exact Before vs. After JSON Diffs.">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Change ID</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Authorized By</th>
                  <th className="py-3 px-4">Target Config System</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Compliance Sign-off</th>
                  <th className="py-3 px-4 text-right">Inspect Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredChanges.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                      No configuration change records matched your active filters.
                    </td>
                  </tr>
                ) : (
                  filteredChanges.map((chg) => (
                    <tr
                      key={chg.id}
                      onClick={() => setInspectedChange(chg)}
                      className="hover:bg-indigo-50/30 transition-all cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-bold text-indigo-700">{chg.id}</td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{chg.timestamp}</td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-slate-900">{chg.authorizedBy}</td>
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-700">{chg.targetConfig}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{chg.action}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-sans">
                          {chg.changeCategory}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {renderAnnotationBadge(
                          chg.id,
                          'Change',
                          `Config change: ${chg.action}`,
                          `Target: ${chg.targetConfig} | Category: ${chg.changeCategory}`,
                          chg.authorizedBy,
                          chg.timestamp
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedChange(chg);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-indigo-600" />
                        <span className="text-[10px] font-sans">Inspect States</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </OverflowTableWrapper>
        </div>
      )}

      {/* Tab 5: Regulatory Compliance Reports */}
      {activeTab === 'compliance-reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Framework Navigator Left Panel */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
              Select Framework Report
            </h3>
            
            <button
              onClick={() => setSelectedFramework('GDPR')}
              className={`w-full text-left p-4 rounded-xl border flex flex-col gap-1 transition-all cursor-pointer ${
                selectedFramework === 'GDPR'
                  ? 'bg-slate-900 text-white border-slate-800 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs">GDPR EU</span>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                  selectedFramework === 'GDPR' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  EU GDPR 2016
                </span>
              </div>
              <h4 className="font-bold text-xs">Data Sovereignty & Privacy</h4>
              <p className={`text-[10px] leading-relaxed mt-0.5 ${selectedFramework === 'GDPR' ? 'text-slate-400' : 'text-slate-500'}`}>
                Evaluates right-to-be-forgotten hard purges, masked PII compliance, and cryptographic salting.
              </p>
            </button>

            <button
              onClick={() => setSelectedFramework('ISO27001')}
              className={`w-full text-left p-4 rounded-xl border flex flex-col gap-1 transition-all cursor-pointer ${
                selectedFramework === 'ISO27001'
                  ? 'bg-slate-900 text-white border-slate-800 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs">ISO 27001</span>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                  selectedFramework === 'ISO27001' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  ISO/IEC 27001:2022
                </span>
              </div>
              <h4 className="font-bold text-xs">Information Security</h4>
              <p className={`text-[10px] leading-relaxed mt-0.5 ${selectedFramework === 'ISO27001' ? 'text-slate-400' : 'text-slate-500'}`}>
                Assesses technical vulnerabilities, MFA SSO procedures, and mandatory TLS 1.3 encryption handshakes.
              </p>
            </button>

            <button
              onClick={() => setSelectedFramework('SOC2')}
              className={`w-full text-left p-4 rounded-xl border flex flex-col gap-1 transition-all cursor-pointer ${
                selectedFramework === 'SOC2'
                  ? 'bg-slate-900 text-white border-slate-800 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs">SOC 2 Type II</span>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                  selectedFramework === 'SOC2' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  AICPA Trust Criteria
                </span>
              </div>
              <h4 className="font-bold text-xs">Security & Availability</h4>
              <p className={`text-[10px] leading-relaxed mt-0.5 ${selectedFramework === 'SOC2' ? 'text-slate-400' : 'text-slate-500'}`}>
                Examines network gateway boundary protection, AES-256 storage encrypts, and private links.
              </p>
            </button>

            <button
              onClick={() => setSelectedFramework('HIPAA')}
              className={`w-full text-left p-4 rounded-xl border flex flex-col gap-1 transition-all cursor-pointer ${
                selectedFramework === 'HIPAA'
                  ? 'bg-slate-900 text-white border-slate-800 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs">HIPAA Security</span>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                  selectedFramework === 'HIPAA' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  45 CFR Part 164
                </span>
              </div>
              <h4 className="font-bold text-xs">Protected Health Data</h4>
              <p className={`text-[10px] leading-relaxed mt-0.5 ${selectedFramework === 'HIPAA' ? 'text-slate-400' : 'text-slate-500'}`}>
                Inspects real-time obfuscation of PHI nodes and block-level cryptographic verification.
              </p>
            </button>
          </div>

          {/* Active Framework Checklist Details Panel */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Header info card */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedFramework === 'GDPR' && 'EU General Data Protection Regulation (GDPR) Audit Report'}
                  {selectedFramework === 'ISO27001' && 'ISO/IEC 27001:2022 ISMS Regulatory Checklist'}
                  {selectedFramework === 'SOC2' && 'SOC 2 Type II Security & Confidentiality Audit'}
                  {selectedFramework === 'HIPAA' && 'HIPAA Protected Patient Health Information (PHI) Report'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Automatically evaluated daily against operational system parameters, staging databases, and user access configurations.
                </p>
              </div>

              <div className="px-3.5 py-2 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl font-mono text-center shrink-0 min-w-[120px]">
                <span className="text-[10px] block uppercase text-indigo-500 font-bold font-sans">Framework Compliance</span>
                <span className="text-lg font-black text-indigo-700">
                  {selectedFramework === 'GDPR' && '50% Adherence'}
                  {selectedFramework === 'ISO27001' && '50% Adherence'}
                  {selectedFramework === 'SOC2' && '50% Adherence'}
                  {selectedFramework === 'HIPAA' && '100% Compliant'}
                </span>
              </div>
            </div>

            {/* Checklist Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800">
                  Continuous Regulatory Control Checklist
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Live Telemetry Validated
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {complianceControls
                  .filter((c) => c.framework === selectedFramework)
                  .map((control) => (
                    <div key={control.id} className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50/30 transition-all">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded font-mono font-bold text-[10px]">
                            {control.id}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 font-sans">{control.title}</h4>
                        </div>
                        
                        <p className="text-[11px] text-slate-600 leading-relaxed max-w-3xl">
                          {control.requirement}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-mono">
                          <span>Last Evaluated: <strong className="text-slate-600 font-medium">{control.lastEvaluated}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            Telemetry System: <strong className="text-slate-700 font-semibold">{control.telemetryValidation === 'Passed' ? 'Passed Validation' : control.telemetryValidation === 'Remediated' ? 'Remediated' : 'Warning/Anomaly Flagged'}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 shrink-0 self-center">
                        {/* Control Adherence Status Pill */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            control.status === 'Compliant'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : control.status === 'Needs Attention'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {control.status === 'Compliant' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          {control.status === 'Needs Attention' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          {control.status}
                        </span>

                        {/* Interactive Auto-Remediation button */}
                        {control.status !== 'Compliant' && (
                          <button
                            onClick={() => handleAutoRemediate(control.id)}
                            disabled={remediatingControlId === control.id}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors shadow-2xs cursor-pointer active:scale-95"
                            title={control.remediationAction}
                          >
                            {remediatingControlId === control.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-white" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-amber-300" />
                            )}
                            <span>{remediatingControlId === control.id ? 'Fixing...' : 'Auto-Remediate'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- INSPECTION MODAL 1: Cryptographic User Activity Payload --- */}
      {inspectedActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold rounded border border-indigo-500/30">
                    ID: {inspectedActivity.id}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    Signed Activity Block
                  </span>
                </div>
                <h3 className="text-base font-extrabold tracking-tight font-mono text-white">
                  {inspectedActivity.action}
                </h3>
              </div>
              <button
                onClick={() => setInspectedActivity(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Actor / User</span>
                  <div className="font-extrabold text-slate-900 mt-0.5">{inspectedActivity.user}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {inspectedActivity.role} | {inspectedActivity.ipAddress}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Timestamp</span>
                  <div className="font-extrabold text-slate-900 font-mono mt-0.5">{inspectedActivity.timestamp}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Category: {inspectedActivity.category}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider block">Target System Entity</span>
                <div className="font-bold text-slate-900 text-xs">{inspectedActivity.targetEntity}</div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Detailed Operations Summary:</span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 font-sans leading-relaxed">
                  {inspectedActivity.details}
                </p>
              </div>

              {/* Compliance Sign-off Section */}
              <div className="p-4 rounded-xl border border-dashed border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Compliance & Sign-off State
                  </span>
                  <button
                    onClick={() => {
                      setAnnotatingEvent({
                        id: inspectedActivity.id,
                        type: 'Activity',
                        title: inspectedActivity.action,
                        details: inspectedActivity.details,
                        user: inspectedActivity.user,
                        timestamp: inspectedActivity.timestamp
                      });
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{annotations[inspectedActivity.id] ? 'Edit Notes' : 'Add Sign-off'}</span>
                  </button>
                </div>

                {annotations[inspectedActivity.id] ? (
                  <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                    annotations[inspectedActivity.id].resolved 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                      : 'bg-amber-50 border-amber-100 text-amber-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1 font-sans">
                        {annotations[inspectedActivity.id].resolved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>APPROVED / RESOLVED</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>UNDER REVIEW</span>
                          </>
                        )}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {annotations[inspectedActivity.id].timestamp}
                      </span>
                    </div>
                    <p className="font-sans leading-normal">
                      {annotations[inspectedActivity.id].notes}
                    </p>
                    <div className="text-[9px] text-slate-400 font-mono">
                      Annotated by: {annotations[inspectedActivity.id].annotatedBy}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 text-[11px] bg-slate-50 rounded-lg">
                    No compliance notes or resolved flags recorded for this action block.
                  </div>
                )}
              </div>

              {/* SHA-256 seal block */}
              <div className="p-3 bg-slate-950 text-white rounded-xl space-y-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider">
                    SHA-256 Block Signature Seal (Immutable)
                  </span>
                  <button
                    onClick={() => handleCopyHash(inspectedActivity.checksum)}
                    className="text-[9px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedText === inspectedActivity.checksum ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Checksum</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[10px] text-indigo-200 break-all bg-slate-900 p-2.5 rounded border border-slate-800">
                  {inspectedActivity.checksum}
                </div>
              </div>

              {/* JSON Metadata Payload */}
              {inspectedActivity.metadata && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700">Audit Metadata Payload:</span>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[10.5px] overflow-x-auto border border-slate-800">
                    {JSON.stringify(inspectedActivity.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Immutable Log Record - Write Block Active
              </span>
              <button
                onClick={() => setInspectedActivity(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Dismiss Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- INSPECTION MODAL 2: Change Logs Schema Diff Viewer --- */}
      {inspectedChange && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold rounded border border-indigo-500/30">
                    ID: {inspectedChange.id}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    Target: {inspectedChange.targetConfig}
                  </span>
                </div>
                <h3 className="text-base font-extrabold tracking-tight font-mono text-white">
                  {inspectedChange.action}
                </h3>
              </div>
              <button
                onClick={() => setInspectedChange(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Authorized Operator</span>
                  <div className="font-extrabold text-slate-900 mt-0.5">{inspectedChange.authorizedBy}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Change Timestamp</span>
                  <div className="font-extrabold text-slate-900 font-mono mt-0.5">{inspectedChange.timestamp}</div>
                </div>
              </div>

              {/* Side-by-Side Diff Panels */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">
                  Configuration Before vs. After State Diff:
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[10.5px]">
                  {/* Before state */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-rose-600 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded border border-rose-100">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      BEFORE STATE (DEPRECATED)
                    </span>
                    <pre className="bg-slate-900 text-rose-300 p-4 rounded-xl border border-slate-800 overflow-x-auto leading-relaxed">
                      {JSON.stringify(inspectedChange.beforeState, null, 2)}
                    </pre>
                  </div>

                  {/* After state */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      AFTER STATE (ACTIVE POLICY)
                    </span>
                    <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl border border-slate-800 overflow-x-auto leading-relaxed">
                      {JSON.stringify(inspectedChange.afterState, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Verified Badge */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-sans font-bold text-emerald-800">
                  State verified. Automatic CDC target mapping and TLS settings adjusted smoothly without active socket interruption.
                </span>
              </div>

              {/* Compliance Sign-off Section */}
              <div className="p-4 rounded-xl border border-dashed border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Compliance & Sign-off State
                  </span>
                  <button
                    onClick={() => {
                      setAnnotatingEvent({
                        id: inspectedChange.id,
                        type: 'Change',
                        title: inspectedChange.action,
                        details: `Change log config: ${inspectedChange.targetConfig}`,
                        user: inspectedChange.authorizedBy,
                        timestamp: inspectedChange.timestamp
                      });
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{annotations[inspectedChange.id] ? 'Edit Notes' : 'Add Sign-off'}</span>
                  </button>
                </div>

                {annotations[inspectedChange.id] ? (
                  <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                    annotations[inspectedChange.id].resolved 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                      : 'bg-amber-50 border-amber-100 text-amber-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1 font-sans">
                        {annotations[inspectedChange.id].resolved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>APPROVED / RESOLVED</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>UNDER REVIEW</span>
                          </>
                        )}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {annotations[inspectedChange.id].timestamp}
                      </span>
                    </div>
                    <p className="font-sans leading-normal">
                      {annotations[inspectedChange.id].notes}
                    </p>
                    <div className="text-[9px] text-slate-400 font-mono">
                      Annotated by: {annotations[inspectedChange.id].annotatedBy}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 text-[11px] bg-slate-50 rounded-lg">
                    No compliance notes or resolved flags recorded for this change block.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setInspectedChange(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Dismiss Change Diff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ANNOTATION & SIGN-OFF MODAL --- */}
      {annotatingEvent && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold rounded border border-indigo-500/30">
                  Compliance Certification
                </span>
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-100">
                  Audit Event Sign-off & Notes
                </h3>
              </div>
              <button
                onClick={() => setAnnotatingEvent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              
              {/* Event Details Card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className="text-indigo-700">{annotatingEvent.id}</span>
                  <span className="text-slate-400">{annotatingEvent.timestamp}</span>
                </div>
                <strong className="text-xs text-slate-800 block truncate">{annotatingEvent.title}</strong>
                <p className="text-[11px] text-slate-500 leading-normal line-clamp-2 font-sans">
                  {annotatingEvent.details}
                </p>
                <div className="text-[10px] text-slate-400 font-sans">
                  Operator: <strong className="text-slate-600 font-medium">{annotatingEvent.user}</strong>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-3.5">
                
                {/* Note Editor */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    Contextual Review Notes
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide professional auditing context, sign-off notes, reference ticket IDs, or explain why this event is resolved..."
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                  />
                </div>

                {/* Status Toggle & Signee */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      Resolution Flag
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Does this event satisfy compliance conditions?
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTempResolved(!tempResolved)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border ${
                      tempResolved
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-amber-500 border-amber-400 text-white'
                    }`}
                  >
                    {tempResolved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resolved / Approved</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>Under Review</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 font-mono text-right">
                  Authorized Signee: <span className="text-slate-600 font-bold">compliance_officer@enterprise.com</span>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAnnotatingEvent(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAnnotation}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Apply Sign-off & Stamp
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// --- Inline helpers for missing Lucide / Icon wrappers ---

function XCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
