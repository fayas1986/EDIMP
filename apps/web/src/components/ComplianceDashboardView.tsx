import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileCheck2,
  Lock,
  Zap,
  RefreshCw,
  Info,
  Server,
  ArrowUpRight,
  Filter,
  Sparkles,
  Layers,
  ShieldAlert,
  Wrench,
  Database,
  ArrowRight,
  CheckSquare,
  RefreshCcw,
} from 'lucide-react';

// --- Interfaces & Types ---

interface FrameworkStatus {
  name: string;
  code: 'SOC2' | 'SOX' | 'HIPAA' | 'GDPR' | 'ISO27001';
  adherencePct: number;
  status: 'Compliant' | 'Needs Attention' | 'In Review';
  passedControls: number;
  totalControls: number;
  lastAudited: string;
}

interface PolicyCheck {
  id: string;
  policyName: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Pass' | 'Fail' | 'Warning';
  lastChecked: string;
  details: string;
}

interface Violation {
  code: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  sqlFix?: string;
}

interface HeatmapCell {
  unit: string;
  framework: 'GDPR' | 'ISO27001' | 'SOC2' | 'HIPAA' | 'SOX';
  failedChecks: number;
  nonCompliantRecords: number;
  violations: Violation[];
}

// --- Static Constants ---

const BUSINESS_UNITS = [
  'Cloud Infrastructure & IT',
  'Research & Development',
  'Finance & Treasury',
  'Human Resources & People',
  'Customer Support & Care',
  'Global Sales & Marketing',
];

const FRAMEWORKS_LIST = ['GDPR', 'ISO27001', 'SOC2', 'HIPAA', 'SOX'] as const;

const INITIAL_HEATMAP_DATA: HeatmapCell[] = [
  // Cloud Infra
  { unit: 'Cloud Infrastructure & IT', framework: 'GDPR', failedChecks: 0, nonCompliantRecords: 0, violations: [] },
  {
    unit: 'Cloud Infrastructure & IT',
    framework: 'ISO27001',
    failedChecks: 1,
    nonCompliantRecords: 22,
    violations: [
      {
        code: 'ISO-INF-15',
        description: 'Root access SSH port 22 key rotations are 6 months overdue across core staging nodes.',
        severity: 'Critical',
        sqlFix: 'UPDATE server_nodes SET force_key_rotation = TRUE WHERE last_rotation_days > 180 AND role = \'master_etl\';',
      },
    ],
  },
  {
    unit: 'Cloud Infrastructure & IT',
    framework: 'SOC2',
    failedChecks: 1,
    nonCompliantRecords: 1,
    violations: [
      {
        code: 'SOC2-INF-05',
        description: 'Intrusion detection software logging service temporarily failed heartbeat validator checks.',
        severity: 'High',
        sqlFix: 'UPDATE system_daemons SET status = \'ACTIVE\', last_heartbeat = NOW() WHERE daemon_name = \'IntrusionDetector\';',
      },
    ],
  },
  {
    unit: 'Cloud Infrastructure & IT',
    framework: 'HIPAA',
    failedChecks: 4,
    nonCompliantRecords: 124,
    violations: [
      {
        code: 'HIP-INF-03',
        description: 'Staging server containing diagnostic records does not have encrypted backups enabled.',
        severity: 'Critical',
        sqlFix: 'UPDATE storage_policies SET encryption_at_rest = TRUE, cipher = \'AES-GCM-256\' WHERE database_role = \'phi_mirror\';',
      },
      {
        code: 'HIP-INF-05',
        description: 'Database diagnostic logs exposed to raw stdout instead of encrypted audit buckets.',
        severity: 'High',
        sqlFix: 'UPDATE cluster_logging_configs SET forward_to_siem = TRUE, redact_log_keys = TRUE WHERE environment = \'staging\';',
      },
      {
        code: 'HIP-INF-08',
        description: 'Shared admin credentials without individual service IAM auditing profile constraints.',
        severity: 'High',
        sqlFix: 'REVOKE SUPERUSER FROM common_admin_user; CREATE USER dba_audit_infra; GRANT rbac_compliance_role TO dba_audit_infra;',
      },
      {
        code: 'HIP-INF-12',
        description: 'SSL/TLS cipher settings allow insecure legacy triple-DES fallback on load balancer.',
        severity: 'Medium',
        sqlFix: 'UPDATE security_profiles SET disallowed_ciphers = ARRAY[\'3DES\', \'RC4\', \'MD5\'] WHERE profile_id = \'Internal_LB\';',
      },
    ],
  },
  { unit: 'Cloud Infrastructure & IT', framework: 'SOX', failedChecks: 0, nonCompliantRecords: 0, violations: [] },

  // R&D
  { unit: 'Research & Development', framework: 'GDPR', failedChecks: 0, nonCompliantRecords: 0, violations: [] },
  {
    unit: 'Research & Development',
    framework: 'ISO27001',
    failedChecks: 2,
    nonCompliantRecords: 8,
    violations: [
      {
        code: 'ISO-RD-04',
        description: 'Staging databases bypass multi-region residency restrictions.',
        severity: 'Medium',
        sqlFix: 'ALTER TABLE staging_temp SET tablespace eu_west_tablespace;',
      },
      {
        code: 'ISO-RD-09',
        description: 'Automated code repository token scanner flagged active high-entropy secrets in dev config.',
        severity: 'High',
        sqlFix: 'REVOKE ALL PRIVILEGES ON secret_credentials FROM PUBLIC;',
      },
    ],
  },
  {
    unit: 'Research & Development',
    framework: 'SOC2',
    failedChecks: 1,
    nonCompliantRecords: 2,
    violations: [
      {
        code: 'SOC2-RD-02',
        description: 'API key logging was temporarily active in standard development tracing files.',
        severity: 'Medium',
        sqlFix: 'UPDATE system_config SET log_level = \'INFO\', mask_headers = TRUE WHERE component = \'API_Gateway\';',
      },
    ],
  },
  { unit: 'Research & Development', framework: 'HIPAA', failedChecks: 0, nonCompliantRecords: 0, violations: [] },
  { unit: 'Research & Development', framework: 'SOX', failedChecks: 0, nonCompliantRecords: 0, violations: [] },

  // Finance
  {
    unit: 'Finance & Treasury',
    framework: 'GDPR',
    failedChecks: 1,
    nonCompliantRecords: 15,
    violations: [
      {
        code: 'GDPR-FIN-01',
        description: 'Customer credit card transactions stored in raw transaction history files without salting.',
        severity: 'High',
        sqlFix: 'UPDATE staging_transactions SET card_number = SHA256(CONCAT(card_number, pg_salt())) WHERE LENGTH(card_number) = 16;',
      },
    ],
  },
  { unit: 'Finance & Treasury', framework: 'ISO27001', failedChecks: 0, nonCompliantRecords: 0, violations: [] },
  { unit: 'Finance & Treasury', framework: 'SOC2', failedChecks: 0, nonCompliantRecords: 0, violations: [] },
  { unit: 'Finance & Treasury', framework: 'HIPAA', failedChecks: 0, nonCompliantRecords: 0, violations: [] },
  { unit: 'Finance & Treasury', framework: 'SOX', failedChecks: 0, nonCompliantRecords: 0, violations: [] },

  // HR
  {
    unit: 'Human Resources & People',
    framework: 'GDPR',
    failedChecks: 3,
    nonCompliantRecords: 142,
    violations: [
      {
        code: 'GDPR-HR-03',
        description: 'Missing consent records on job applicant profile files stored beyond retention window.',
        severity: 'High',
        sqlFix: 'DELETE FROM applicant_profiles WHERE retention_period_expired = TRUE AND consent_provided = FALSE;',
      },
      {
        code: 'GDPR-HR-05',
        description: 'Employee tax forms kept in unencrypted public-facing staging directories.',
        severity: 'Critical',
        sqlFix: 'ALTER TABLE hr_tax_documents ENABLE ROW LEVEL SECURITY; FORCE AES256 ENCRYPTION ON tablespace hr_space;',
      },
      {
        code: 'GDPR-HR-09',
        description: 'Unlogged exports of payroll files by temporary user accounts.',
        severity: 'Medium',
        sqlFix: 'INSERT INTO system_audit_logs (user, action, target) VALUES (\'system_etl_bot\', \'LOG_AUDIT_STRENGTHEN\', \'hr_payroll_exports\');',
      },
    ],
  },
  {
    unit: 'Human Resources & People',
    framework: 'ISO27001',
    failedChecks: 1,
    nonCompliantRecords: 5,
    violations: [
      {
        code: 'ISO-HR-12',
        description: 'MFA not enforced for administrative HR profile panels.',
        severity: 'High',
        sqlFix: 'UPDATE iam_policies SET enforce_mfa = TRUE WHERE policy_name = \'HR_Admin_Console_Access\';',
      },
    ],
  },
  { unit: 'Human Resources & People', framework: 'SOC2', failedChecks: 0, nonCompliantRecords: 0, violations: [] },
  { unit: 'Human Resources & People', framework: 'HIPAA', failedChecks: 0, nonCompliantRecords: 0, violations: [] },
  { unit: 'Human Resources & People', framework: 'SOX', failedChecks: 0, nonCompliantRecords: 0, violations: [] },

  // Customer Support
  {
    unit: 'Customer Support & Care',
    framework: 'GDPR',
    failedChecks: 2,
    nonCompliantRecords: 89,
    violations: [
      {
        code: 'GDPR-CS-02',
        description: 'Customer chat transcripts contain unredacted phone numbers and emails.',
        severity: 'Medium',
        sqlFix: 'UPDATE chat_logs SET message = REGEXP_REPLACE(message, \'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}\', \'[REDACTED_EMAIL]\') WHERE contains_pii = TRUE;',
      },
      {
        code: 'GDPR-CS-04',
        description: 'Old support tickets storing unmasked passport attachments beyond GDPR 30-day window.',
        severity: 'High',
        sqlFix: 'DELETE FROM ticket_attachments WHERE ticket_resolved_age_days > 30 AND is_sensitive = TRUE;',
      },
    ],
  },
  { unit: 'Customer Support & Care', framework: 'ISO27001', failedChecks: 0, nonCompliantRecords: 0, violations: [] },
  { unit: 'Customer Support & Care', framework: 'SOC2', failedChecks: 0, nonCompliantRecords: 0, violations: [] },
  {
    unit: 'Customer Support & Care',
    framework: 'HIPAA',
    failedChecks: 1,
    nonCompliantRecords: 12,
    violations: [
      {
        code: 'HIP-CS-01',
        description: 'Healthcare customer ticket contains unencrypted protected health info (PHI) logs.',
        severity: 'High',
        sqlFix: 'UPDATE customer_cases SET phi_secure = TRUE, encryption_level = \'AES256\' WHERE id IN (SELECT case_id FROM phi_violations);',
      },
    ],
  },
  { unit: 'Customer Support & Care', framework: 'SOX', failedChecks: 0, nonCompliantRecords: 0, violations: [] },

  // Sales & Marketing
  {
    unit: 'Global Sales & Marketing',
    framework: 'GDPR',
    failedChecks: 1,
    nonCompliantRecords: 45,
    violations: [
      {
        code: 'GDPR-MKT-01',
        description: 'Lead tracking forms lacking explicit GDPR e-Privacy cookie confirmation logs.',
        severity: 'Medium',
        sqlFix: 'UPDATE marketing_leads SET consent_status = \'EXPLICIT_REQUIRED\' WHERE cookie_acceptance_verified = FALSE;',
      },
    ],
  },
  { unit: 'Global Sales & Marketing', framework: 'ISO27001', failedChecks: 0, nonCompliantRecords: 0, violations: [] },
  { unit: 'Global Sales & Marketing', framework: 'SOC2', failedChecks: 0, nonCompliantRecords: 0, violations: [] },
  { unit: 'Global Sales & Marketing', framework: 'HIPAA', failedChecks: 0, nonCompliantRecords: 0, violations: [] },
  { unit: 'Global Sales & Marketing', framework: 'SOX', failedChecks: 0, nonCompliantRecords: 0, violations: [] },
];

const DEFAULT_POLICY_CHECKS: PolicyCheck[] = [
  {
    id: 'POL-101',
    policyName: 'AES-256 Encryption at Rest & TLS 1.3 in Transit',
    category: 'Data Encryption',
    severity: 'Critical',
    status: 'Pass',
    lastChecked: '2 mins ago',
    details: 'All GCS buckets and PostgreSQL sharded instances verified with enforced TLS 1.3.',
  },
  {
    id: 'POL-102',
    policyName: 'Automated PII Anonymization & Hashing',
    category: 'Data Privacy',
    severity: 'Critical',
    status: 'Warning',
    lastChecked: '12 mins ago',
    details: '12 unmasked SSNs flagged in legacy staging; auto-masked and quarantined.',
  },
  {
    id: 'POL-103',
    policyName: 'Immutable WORM Audit Trail Logging',
    category: 'Audit Integrity',
    severity: 'High',
    status: 'Pass',
    lastChecked: '1 min ago',
    details: 'SHA256 signature chain matched across 142,890 historical audit entries.',
  },
  {
    id: 'POL-104',
    policyName: 'OAuth 2.0 Role-Based Access Control (RBAC)',
    category: 'Identity & Access',
    severity: 'High',
    status: 'Pass',
    lastChecked: 'Just now',
    details: 'Multi-factor authentication and zero-trust token session validity confirmed.',
  },
  {
    id: 'POL-105',
    policyName: '20+ Year Historical Schema Drift Enforcement',
    category: 'Governance',
    severity: 'Medium',
    status: 'Pass',
    lastChecked: '30 mins ago',
    details: 'Apache Iceberg lakehouse catalog verified against 2004-2026 schema definitions.',
  },
];

// --- Main Dashboard Component ---

export const ComplianceDashboardView: React.FC = () => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedFramework, setSelectedFramework] = useState<string>('All');

  // Interactive Heatmap States
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>(INITIAL_HEATMAP_DATA);
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(
    INITIAL_HEATMAP_DATA.find((c) => c.failedChecks > 0) || INITIAL_HEATMAP_DATA[0]
  );
  const [heatmapMetric, setHeatmapMetric] = useState<'checks' | 'records'>('checks');
  const [remediatingKey, setRemediatingKey] = useState<string | null>(null);

  // Dynamic Metrics & Calculations
  const totalControlsPossible = 193;

  const totalFailedChecks = useMemo(() => {
    return heatmapData.reduce((acc, cell) => acc + cell.failedChecks, 0);
  }, [heatmapData]);

  const totalNonCompliantRecords = useMemo(() => {
    return heatmapData.reduce((acc, cell) => acc + cell.nonCompliantRecords, 0);
  }, [heatmapData]);

  const activePassedControls = useMemo(() => {
    return Math.max(0, totalControlsPossible - totalFailedChecks);
  }, [totalControlsPossible, totalFailedChecks]);

  const complianceScore = useMemo(() => {
    return parseFloat(((activePassedControls / totalControlsPossible) * 100).toFixed(1));
  }, [activePassedControls, totalControlsPossible]);

  // Dynamic Framework Posture Ratings
  const frameworks = useMemo<FrameworkStatus[]>(() => {
    const baseFrameworks = [
      { name: 'SOC 2 Type II Security', code: 'SOC2' as const, totalControls: 48, lastAudited: 'Today, 08:30 UTC' },
      { name: 'SOX 404 Financial Controls', code: 'SOX' as const, totalControls: 32, lastAudited: 'Today, 06:15 UTC' },
      { name: 'HIPAA Health Data Privacy', code: 'HIPAA' as const, totalControls: 31, lastAudited: '1 hour ago' },
      { name: 'GDPR EU Data Sovereignty', code: 'GDPR' as const, totalControls: 28, lastAudited: '3 hours ago' },
      { name: 'ISO 27001 Information Security', code: 'ISO27001' as const, totalControls: 54, lastAudited: 'Today, 04:00 UTC' },
    ];

    return baseFrameworks.map((fw) => {
      const failuresForFramework = heatmapData
        .filter((cell) => cell.framework === fw.code)
        .reduce((sum, cell) => sum + cell.failedChecks, 0);

      const passed = Math.max(0, fw.totalControls - failuresForFramework);
      const adherencePct = parseFloat(((passed / fw.totalControls) * 100).toFixed(1));
      const status = failuresForFramework === 0 ? ('Compliant' as const) : ('Needs Attention' as const);

      return {
        ...fw,
        adherencePct,
        status,
        passedControls: passed,
      };
    });
  }, [heatmapData]);

  // Re-Evaluate Simulation Handler
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      // Playability helper: If everything is 100% clean, let's restore default anomalies so users can interact and test remediation again
      if (totalFailedChecks === 0) {
        setHeatmapData(INITIAL_HEATMAP_DATA);
        const defaultCell = INITIAL_HEATMAP_DATA.find((c) => c.failedChecks > 0) || INITIAL_HEATMAP_DATA[0];
        setSelectedCell(defaultCell);
      }
    }, 1000);
  };

  // Cell Click Handler
  const handleCellClick = (unit: string, framework: 'GDPR' | 'ISO27001' | 'SOC2' | 'HIPAA' | 'SOX') => {
    const found = heatmapData.find((c) => c.unit === unit && c.framework === framework);
    if (found) {
      setSelectedCell(found);
    }
  };

  // Remediation Action for a specific cell
  const handleRemediateCell = (unit: string, framework: 'GDPR' | 'ISO27001' | 'SOC2' | 'HIPAA' | 'SOX') => {
    const key = `${unit}-${framework}`;
    setRemediatingKey(key);

    setTimeout(() => {
      setHeatmapData((prev) =>
        prev.map((cell) => {
          if (cell.unit === unit && cell.framework === framework) {
            const clearedCell: HeatmapCell = {
              ...cell,
              failedChecks: 0,
              nonCompliantRecords: 0,
              violations: [],
            };
            // Keep selected cell detail in sync
            setSelectedCell(clearedCell);
            return clearedCell;
          }
          return cell;
        })
      );
      setRemediatingKey(null);
    }, 1200);
  };

  // Bulk remediation action
  const handleBulkRemediateAll = () => {
    setRefreshing(true);
    setTimeout(() => {
      const clearedData = heatmapData.map((cell) => ({
        ...cell,
        failedChecks: 0,
        nonCompliantRecords: 0,
        violations: [],
      }));
      setHeatmapData(clearedData);
      if (selectedCell) {
        setSelectedCell({
          ...selectedCell,
          failedChecks: 0,
          nonCompliantRecords: 0,
          violations: [],
        });
      }
      setRefreshing(false);
    }, 1200);
  };

  // Color Coding Generator for Heatmap cells
  const getCellColorClass = (cell: HeatmapCell) => {
    const isSelected = selectedCell?.unit === cell.unit && selectedCell?.framework === cell.framework;
    const value = heatmapMetric === 'checks' ? cell.failedChecks : cell.nonCompliantRecords;

    let bgClass = '';
    let textClass = '';
    let borderClass = '';

    if (heatmapMetric === 'checks') {
      if (value === 0) {
        bgClass = 'bg-emerald-50/70 hover:bg-emerald-100/85';
        textClass = 'text-emerald-800';
        borderClass = 'border-emerald-100';
      } else if (value === 1) {
        bgClass = 'bg-amber-100/70 hover:bg-amber-200/80';
        textClass = 'text-amber-800';
        borderClass = 'border-amber-200';
      } else if (value === 2) {
        bgClass = 'bg-orange-100/80 hover:bg-orange-200/90';
        textClass = 'text-orange-800';
        borderClass = 'border-orange-300';
      } else {
        bgClass = 'bg-rose-100/90 hover:bg-rose-200';
        textClass = 'text-rose-800';
        borderClass = 'border-rose-300';
      }
    } else {
      // Non compliant records scaling
      if (value === 0) {
        bgClass = 'bg-emerald-50/70 hover:bg-emerald-100/85';
        textClass = 'text-emerald-800';
        borderClass = 'border-emerald-100';
      } else if (value <= 10) {
        bgClass = 'bg-amber-100/70 hover:bg-amber-200/80';
        textClass = 'text-amber-800';
        borderClass = 'border-amber-200';
      } else if (value <= 50) {
        bgClass = 'bg-orange-100/80 hover:bg-orange-200/90';
        textClass = 'text-orange-800';
        borderClass = 'border-orange-300';
      } else {
        bgClass = 'bg-rose-100/90 hover:bg-rose-200';
        textClass = 'text-rose-800';
        borderClass = 'border-rose-300';
      }
    }

    return `transition-all duration-200 cursor-pointer text-center relative border rounded-xl p-3 flex flex-col items-center justify-center gap-1 min-h-[64px] ${bgClass} ${textClass} ${borderClass} ${
      isSelected ? 'ring-2 ring-indigo-600 ring-offset-2 scale-[1.03] shadow-md z-10 font-bold' : ''
    }`;
  };

  const filteredPolicies =
    selectedFramework === 'All'
      ? DEFAULT_POLICY_CHECKS
      : DEFAULT_POLICY_CHECKS.filter((p) => p.category.toLowerCase().includes(selectedFramework.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-mono font-bold rounded-full border border-indigo-200">
              Module 31 – Real-time Regulatory Adherence & Compliance Executive Desk
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-mono font-bold rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-Time Automated Continuous Monitoring
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5 text-slate-950">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Enterprise Compliance Adherence & Governance Dashboard
          </h1>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Live telemetry engine monitoring regulatory posture across SOC2 Type II, SOX 404, HIPAA, GDPR, and ISO27001 with continuous policy enforcement and zero-trust verification.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 z-10">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
            <span>Re-Evaluate Compliance Telemetry</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Scorecard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Global Compliance Index</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
            <span className={complianceScore === 100 ? 'text-emerald-600' : 'text-indigo-600'}>
              {complianceScore}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>Adherence calculated dynamically</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Active Controls Passed</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {activePassedControls} / {totalControlsPossible}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {parseFloat(((activePassedControls / totalControlsPossible) * 100).toFixed(1))}% automated pass rate
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Open Risk Anomalies</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-black tracking-tight ${totalFailedChecks > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {totalFailedChecks > 0 ? `${totalFailedChecks} Failed Checks` : 'No Failed Checks'}
          </div>
          <div className="text-[11px] text-slate-500">
            {totalNonCompliantRecords > 0 ? `${totalNonCompliantRecords} PII records flagged` : '0 records at risk'}
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Last Telemetry Run</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight font-mono">Just Now</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Continuous Real-Time Check</span>
          </div>
        </div>
      </div>

      {/* Regulatory Framework Readiness Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-indigo-600" />
              Regulatory Standards Posture & Readiness
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time audit adherence ratings mapped against major international compliance frameworks.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
            5 Frameworks Enforced
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-1">
          {frameworks.map((fw) => (
            <div
              key={fw.code}
              className="p-4 rounded-xl border bg-slate-50 border-slate-200 hover:border-indigo-300 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {fw.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    fw.status === 'Compliant'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {fw.status}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-900 leading-snug">{fw.name}</h3>
                <div className="text-xl font-extrabold text-slate-900 mt-1">{fw.adherencePct}%</div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      fw.adherencePct >= 98 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${fw.adherencePct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>
                    {fw.passedControls} / {fw.totalControls} Controls
                  </span>
                  <span>{fw.lastAudited}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Compliance Risk Heatmap Section --- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Business Unit Compliance Heatmap
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Density matrix mapping non-compliant records and failed audit validations across all primary operational sectors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Metric Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
              <button
                onClick={() => setHeatmapMetric('checks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  heatmapMetric === 'checks'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Failed Checks
              </button>
              <button
                onClick={() => setHeatmapMetric('records')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  heatmapMetric === 'records'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Non-Compliant Records
              </button>
            </div>

            {/* Bulk Remediate Button */}
            <button
              onClick={handleBulkRemediateAll}
              disabled={refreshing || totalFailedChecks === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Remediate all non-compliant nodes globally"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bulk Remediate All</span>
            </button>
          </div>
        </div>

        {/* Heatmap Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          
          {/* Main Grid table area (Spans 5 cols on lg) */}
          <div className="lg:col-span-5 overflow-x-auto">
            <div className="min-w-[640px] space-y-2">
              
              {/* Header Titles */}
              <div className="grid grid-cols-6 gap-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-1">
                <div className="text-left pl-3 self-center">Business Unit</div>
                {FRAMEWORKS_LIST.map((fw) => (
                  <div key={fw}>{fw}</div>
                ))}
              </div>

              {/* Rows */}
              {BUSINESS_UNITS.map((unit) => (
                <div key={unit} className="grid grid-cols-6 gap-2 items-center">
                  {/* Business Unit label cell */}
                  <div className="text-left pl-3 font-semibold text-xs text-slate-800 truncate" title={unit}>
                    {unit}
                  </div>

                  {/* Framework cells */}
                  {FRAMEWORKS_LIST.map((fw) => {
                    const cell = heatmapData.find((c) => c.unit === unit && c.framework === fw) || {
                      unit,
                      framework: fw,
                      failedChecks: 0,
                      nonCompliantRecords: 0,
                      violations: [],
                    };

                    const displayValue = heatmapMetric === 'checks' ? cell.failedChecks : cell.nonCompliantRecords;

                    return (
                      <div
                        key={fw}
                        onClick={() => handleCellClick(unit, fw)}
                        className={getCellColorClass(cell)}
                      >
                        <span className="text-sm font-black tracking-tight">{displayValue}</span>
                        <span className="text-[9px] uppercase font-bold opacity-80">
                          {heatmapMetric === 'checks'
                            ? cell.failedChecks === 1
                              ? 'Fail'
                              : cell.failedChecks > 1
                              ? 'Fails'
                              : 'Pass'
                            : 'Records'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}

            </div>
          </div>

          {/* Sidebar Legend and Heatmap Metadata (Spans 1 col on lg) */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                Density Index
              </h3>
              
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-emerald-50 border border-emerald-200 rounded" />
                  <span className="text-slate-600 font-medium">Compliant (0)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-amber-100 border border-amber-200 rounded" />
                  <span className="text-slate-600 font-medium">Low Risk (1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-orange-100 border border-orange-300 rounded" />
                  <span className="text-slate-600 font-medium">Medium Risk (2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-rose-100 border border-rose-300 rounded" />
                  <span className="text-slate-600 font-medium">Critical Risk (3+)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Active Hotspots</span>
              <span className="text-xs font-black text-slate-800">
                {heatmapData.filter((c) => c.failedChecks > 0).length} cells out of 30
              </span>
            </div>
          </div>

        </div>

        {/* --- Compliance Resolution Desk (Inspection & Remediation Panel) --- */}
        {selectedCell && (
          <div className="border border-indigo-100 bg-indigo-50/20 rounded-2xl p-4.5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/60 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase rounded border border-indigo-200 font-mono">
                    {selectedCell.framework} Audit
                  </span>
                  <span className="text-xs font-black text-slate-900">{selectedCell.unit}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Detailed inspection logs and schema/policy health check anomalies.
                </p>
              </div>

              {selectedCell.failedChecks > 0 && (
                <button
                  onClick={() => handleRemediateCell(selectedCell.unit, selectedCell.framework)}
                  disabled={remediatingKey === `${selectedCell.unit}-${selectedCell.framework}`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  {remediatingKey === `${selectedCell.unit}-${selectedCell.framework}` ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Remediating Integrity...</span>
                    </>
                  ) : (
                    <>
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Remediate Selection</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Violations Details list */}
            {selectedCell.failedChecks === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-emerald-900">100% Fully Compliant</h4>
                  <p className="text-[11px] text-slate-500">
                    No active failures or raw non-compliant records detected in this operations segment.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedCell.violations.map((v, i) => (
                  <div key={v.code || i} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {v.code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              v.severity === 'Critical'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : v.severity === 'High'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {v.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {v.description}
                        </p>
                      </div>
                    </div>

                    {v.sqlFix && (
                      <div className="bg-slate-50 rounded-xl p-3.5 text-[10px] font-mono text-slate-800 border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between text-slate-500 border-b border-slate-200/80 pb-1.5">
                          <span className="flex items-center gap-1.5 font-bold uppercase text-[9px] text-slate-600">
                            <Database className="w-3.5 h-3.5 text-indigo-600" />
                            Auto-Generated Remediation DDL/DML Query
                          </span>
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[8px] font-bold uppercase tracking-wider">Ready to Apply</span>
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap leading-normal font-mono text-slate-700 bg-slate-100/50 p-2.5 rounded-lg border border-slate-200/50">
                          {v.sqlFix}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Policy Checks & Live Governance Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              Automated Policy Enforcement & Guardrails
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active security rules continuously evaluated during migration jobs, data discovery, and field transformations.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Filter Category:</span>
            <select
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Categories</option>
              <option value="Encryption">Data Encryption</option>
              <option value="Privacy">Data Privacy</option>
              <option value="Audit">Audit Integrity</option>
              <option value="Access">Identity & Access</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100 font-sans">
          {filteredPolicies.map((policy) => (
            <div
              key={policy.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors rounded-lg px-2"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-700">{policy.id}</span>
                  <h3 className="text-xs font-bold text-slate-900">{policy.policyName}</h3>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 font-mono">
                    {policy.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{policy.details}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] text-slate-400 font-mono">{policy.lastChecked}</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    policy.status === 'Pass'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {policy.status === 'Pass' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  {policy.status === 'Pass' ? 'Policy Passed' : 'Warning Flagged'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
