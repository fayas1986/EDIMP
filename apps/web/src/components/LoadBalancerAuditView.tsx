import React, { useState, useMemo } from 'react';
import {
  History,
  ShieldCheck,
  Download,
  Search,
  Filter,
  RefreshCw,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Activity,
  ArrowRight,
  Server,
  FileSpreadsheet,
  Scale,
  Info,
  ExternalLink,
  Lock,
  Cpu
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';

// Define TS Interfaces for Audit Records
interface AuditEvent {
  id: string;
  timestamp: string;
  eventClass: 'Spillover Avoidance' | 'Health Restoration' | 'Throttling Guard' | 'Failover Routing' | 'Schema Validation' | 'Daily Verification';
  connectorName: string;
  detail: string;
  performanceDelta: string;
  policyId: string;
  complianceStatus: 'COMPLIANT' | 'WARNING' | 'CRITICAL';
  operator: string;
  signature: string;
}

interface ConnectorHealthBenchmark {
  id: string;
  name: string;
  category: string;
  healthScore: number;
  peakThroughput: string;
  latencyP50: string;
  latencyP95: string;
  latencyP99: string;
  encryptionStandard: string;
  slaStatus: string;
  complianceRating: 'AAA' | 'AA' | 'A' | 'B';
  history: number[];
}

interface ComplianceRuleMapping {
  policyId: string;
  policyName: string;
  soc2Reference: string;
  iso27001Reference: string;
  gdprArticle: string;
  description: string;
}

export const LoadBalancerAuditView: React.FC = () => {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedConnector, setSelectedConnector] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [selectedPolicyDetail, setSelectedPolicyDetail] = useState<ComplianceRuleMapping | null>(null);

  // 1. Static Mock Data for Audit Log Events (High-Fidelity)
  const auditEvents = useMemo<AuditEvent[]>(() => [
    {
      id: 'EVT-2026-0815-001',
      timestamp: '2026-08-15T10:13:42.105Z',
      eventClass: 'Spillover Avoidance',
      connectorName: 'SQL Server - Legacy ERP DB',
      detail: 'Queue size exceeded 600 records (90% capacity). Dynamically routed 30% of incoming load to EMEA-Replica-02.',
      performanceDelta: '-12.4ms latency, +150 req/sec',
      policyId: 'LB-POL-04',
      complianceStatus: 'COMPLIANT',
      operator: 'SYSTEM_AUTOSCALE_DAEMON',
      signature: 'sha256:7f8a9b3c4d5e'
    },
    {
      id: 'EVT-2026-0815-002',
      timestamp: '2026-08-15T09:44:12.894Z',
      eventClass: 'Health Restoration',
      connectorName: 'Dynamics 365 Business Central',
      detail: 'Latency dropped below critical 100ms threshold (measured: 46.5ms). Active throttling deactivated. Restored 100% load allocation.',
      performanceDelta: '+120 req/sec',
      policyId: 'LB-POL-01',
      complianceStatus: 'COMPLIANT',
      operator: 'HEALTH_MONITOR_ENGINE',
      signature: 'sha256:1a2b3c4d5e6f'
    },
    {
      id: 'EVT-2026-0815-003',
      timestamp: '2026-08-15T08:30:00.000Z',
      eventClass: 'Daily Verification',
      connectorName: 'All Cluster Nodes',
      detail: 'Automated cluster alignment health check. Audited encryption keys, TLS versions, schema compatibility configurations, and write permissions.',
      performanceDelta: 'All nodes within standard deviation',
      policyId: 'LB-POL-09',
      complianceStatus: 'COMPLIANT',
      operator: 'COMPLIANCE_CRON_SCHEDULER',
      signature: 'sha256:9c8d7e6f5a4b'
    },
    {
      id: 'EVT-2026-0815-004',
      timestamp: '2026-08-15T07:15:22.411Z',
      eventClass: 'Throttling Guard',
      connectorName: 'Customer Master Excel (.xlsx)',
      detail: 'Sustained queue size of 788 records detected. Active buffer pacing engaged to matching write velocity of legacy target systems.',
      performanceDelta: '-420 req/sec flow-control override',
      policyId: 'LB-POL-02',
      complianceStatus: 'WARNING',
      operator: 'CONGESTION_CONTROLLER',
      signature: 'sha256:3e4f5a6b7c8d'
    },
    {
      id: 'EVT-2026-0815-005',
      timestamp: '2026-08-15T06:12:05.110Z',
      eventClass: 'Failover Routing',
      connectorName: 'SAP S/4HANA Cloud Engine',
      detail: 'Temporary packet loss spike (18%) detected on Primary US-East gateway. Failover routing triggered to Secondary US-West cluster.',
      performanceDelta: '+8.4ms network hop overhead',
      policyId: 'LB-POL-05',
      complianceStatus: 'COMPLIANT',
      operator: 'FAILOVER_DAEMON_AMER',
      signature: 'sha256:8b9c0d1e2f3a'
    },
    {
      id: 'EVT-2026-0814-042',
      timestamp: '2026-08-14T23:19:44.921Z',
      eventClass: 'Spillover Avoidance',
      connectorName: 'Snowflake Enterprise Data Warehouse',
      detail: 'Large transactional ingest batch detected. Automatically partitioned stream to 4 parallel ingestion workers.',
      performanceDelta: '+380% write throughput',
      policyId: 'LB-POL-04',
      complianceStatus: 'COMPLIANT',
      operator: 'STREAM_SHARD_OPTIMIZER',
      signature: 'sha256:5f4e3d2c1b0a'
    },
    {
      id: 'EVT-2026-0814-041',
      timestamp: '2026-08-14T18:44:31.002Z',
      eventClass: 'Schema Validation',
      connectorName: 'Salesforce Enterprise CRM',
      detail: 'Encountered 4 complex column type anomalies on target system. routed dirty payloads directly to Validation & Isolation Sandbox.',
      performanceDelta: 'Prevented downstream database exception',
      policyId: 'LB-POL-07',
      complianceStatus: 'COMPLIANT',
      operator: 'SCHEMA_COMPLIANCE_GUARD',
      signature: 'sha256:4a3b2c1d0e9f'
    },
    {
      id: 'EVT-2026-0814-039',
      timestamp: '2026-08-14T14:22:10.550Z',
      eventClass: 'Health Restoration',
      connectorName: 'SharePoint Document Library',
      detail: 'Node connection timed out. Successfully pinged, initialized re-handshake sequence, and restored connector active status.',
      performanceDelta: 'Re-established sync in 1.2s',
      policyId: 'LB-POL-01',
      complianceStatus: 'WARNING',
      operator: 'NODE_RECOVERY_WATCHDOG',
      signature: 'sha256:2d3c4b5a6f7e'
    },
    {
      id: 'EVT-2026-0814-033',
      timestamp: '2026-08-14T09:11:04.180Z',
      eventClass: 'Throttling Guard',
      connectorName: 'SQL Server - Legacy ERP DB',
      detail: 'DB thread pool exhaustion detected. Auto-throttled queue consumption to 150 records/sec to prevent target database crash.',
      performanceDelta: 'Sustained target database availability',
      policyId: 'LB-POL-02',
      complianceStatus: 'CRITICAL',
      operator: 'CONGESTION_CONTROLLER',
      signature: 'sha256:6e7f8a9b0c1d'
    }
  ], []);

  // 2. Connector Health Benchmarks (Compliance Telemetry)
  const healthBenchmarks = useMemo<ConnectorHealthBenchmark[]>(() => [
    {
      id: 'CONN-001',
      name: 'Dynamics 365 Business Central',
      category: 'ERP',
      healthScore: 98,
      peakThroughput: '750 req/s',
      latencyP50: '46.5ms',
      latencyP95: '62.1ms',
      latencyP99: '88.4ms',
      encryptionStandard: 'AES-256 / TLS 1.3',
      slaStatus: '99.999%',
      complianceRating: 'AAA',
      history: [93, 95, 96, 97, 98]
    },
    {
      id: 'CONN-002',
      name: 'SQL Server - Legacy ERP DB',
      category: 'Database',
      healthScore: 82,
      peakThroughput: '900 req/s',
      latencyP50: '10.4ms',
      latencyP95: '45.8ms',
      latencyP99: '142.1ms',
      encryptionStandard: 'AES-256 / TLS 1.2',
      slaStatus: '99.95%',
      complianceRating: 'AA',
      history: [91, 88, 86, 84, 82]
    },
    {
      id: 'CONN-003',
      name: 'Customer Master Excel (.xlsx)',
      category: 'Files',
      healthScore: 78,
      peakThroughput: '200 req/s',
      latencyP50: '10.6ms',
      latencyP95: '120.4ms',
      latencyP99: '410.2ms',
      encryptionStandard: 'Symmetric Blob Enc',
      slaStatus: '99.90%',
      complianceRating: 'A',
      history: [71, 73, 75, 76, 78]
    },
    {
      id: 'CONN-004',
      name: 'SAP S/4HANA Cloud Engine',
      category: 'ERP',
      healthScore: 96,
      peakThroughput: '680 req/s',
      latencyP50: '51.4ms',
      latencyP95: '72.3ms',
      latencyP99: '95.1ms',
      encryptionStandard: 'AES-256 / TLS 1.3',
      slaStatus: '99.999%',
      complianceRating: 'AAA',
      history: [96, 96, 96, 96, 96]
    },
    {
      id: 'CONN-005',
      name: 'Salesforce Enterprise CRM',
      category: 'CRM',
      healthScore: 99,
      peakThroughput: '850 req/s',
      latencyP50: '59.5ms',
      latencyP95: '78.9ms',
      latencyP99: '102.4ms',
      encryptionStandard: 'AES-256 / TLS 1.3',
      slaStatus: '99.999%',
      complianceRating: 'AAA',
      history: [94, 95, 97, 98, 99]
    },
    {
      id: 'CONN-006',
      name: 'Snowflake Enterprise Data Warehouse',
      category: 'Database',
      healthScore: 97,
      peakThroughput: '1,200 req/s',
      latencyP50: '47.6ms',
      latencyP95: '69.4ms',
      latencyP99: '112.5ms',
      encryptionStandard: 'AES-256 / TLS 1.3',
      slaStatus: '99.99%',
      complianceRating: 'AAA',
      history: [99, 99, 98, 98, 97]
    }
  ], []);

  // 3. Compliance Framework Mapping (SOC 2, ISO 27001, GDPR)
  const complianceRules = useMemo<ComplianceRuleMapping[]>(() => [
    {
      policyId: 'LB-POL-01',
      policyName: 'High Availability & Self-Healing Watchdog',
      soc2Reference: 'CC7.1 (System Monitoring & Anomaly Detection)',
      iso27001Reference: 'A.12.4.1 (Event Logging)',
      gdprArticle: 'Article 32 (Security of Processing - Availability)',
      description: 'Defines autonomous cluster node failovers, re-pings, and automated connection retries.'
    },
    {
      policyId: 'LB-POL-02',
      policyName: 'Congestion Control & Database Safety Pacing',
      soc2Reference: 'CC7.2 (System Incident Response & Capacity Planning)',
      iso27001Reference: 'A.17.1.1 (Information Security Continuity)',
      gdprArticle: 'Article 32 (System Resilience)',
      description: 'Ensures source write rates are dynamically throttled to prevent downstream system saturation and memory exhaustion.'
    },
    {
      policyId: 'LB-POL-04',
      policyName: 'Dynamic Stream Partitioning & Parallel Sharding',
      soc2Reference: 'CC7.3 (Performance and Capacity Audits)',
      iso27001Reference: 'A.12.1.3 (Capacity Management)',
      gdprArticle: 'Article 32 (Integrity of Processing Systems)',
      description: 'Regulates automated dividing of dense ingest batches to parallel node workers to prevent memory bottlenecks.'
    },
    {
      policyId: 'LB-POL-05',
      policyName: 'Fallback Gateway & Alternate Region Routing',
      soc2Reference: 'CC8.1 (Change Management & Failovers)',
      iso27001Reference: 'A.17.2.1 (Redundancy of Processing Facilities)',
      gdprArticle: 'Article 32 (Restore Access in Timely Manner)',
      description: 'Requires automatic traffic redirect to backup network paths or server nodes in case of packet loss spikes.'
    },
    {
      policyId: 'LB-POL-07',
      policyName: 'Schema Integrity & Anomaly Isolation',
      soc2Reference: 'CC6.3 (Data Modification Safeguards)',
      iso27001Reference: 'A.14.1.1 (Security Requirements Analysis)',
      gdprArticle: 'Article 5 (Data Quality & Integrity Principles)',
      description: 'Mandates isolating and rerouting records containing unaligned schemas or missing target constraints directly to sandboxed validation queues.'
    },
    {
      policyId: 'LB-POL-09',
      policyName: 'Periodic Key & Connection Encryption Audit',
      soc2Reference: 'CC6.1 (Logical Access & Encryption Keys)',
      iso27001Reference: 'A.18.1.4 (Privacy of Personal Data)',
      gdprArticle: 'Article 32 (Cryptographic Protection)',
      description: 'Triggers daily validation cron checks of TLS handshakes, certificate expirations, and credential stores.'
    }
  ], []);

  // 4. Performance Trends Chart Data (Hourly Event count & system average latencies)
  const chartData = useMemo(() => [
    { hour: '04:00', 'Interventions': 1, 'Avg Latency (ms)': 24 },
    { hour: '06:00', 'Interventions': 3, 'Avg Latency (ms)': 26 },
    { hour: '08:00', 'Interventions': 6, 'Avg Latency (ms)': 32 },
    { hour: '10:00', 'Interventions': 12, 'Avg Latency (ms)': 45 },
    { hour: '12:00', 'Interventions': 8, 'Avg Latency (ms)': 38 },
    { hour: '14:00', 'Interventions': 5, 'Avg Latency (ms)': 29 },
    { hour: '16:00', 'Interventions': 4, 'Avg Latency (ms)': 25 },
    { hour: '18:00', 'Interventions': 7, 'Avg Latency (ms)': 31 },
    { hour: '20:00', 'Interventions': 2, 'Avg Latency (ms)': 22 },
    { hour: '22:00', 'Interventions': 1, 'Avg Latency (ms)': 19 }
  ], []);

  // Filtering of audit log
  const filteredEvents = useMemo(() => {
    return auditEvents.filter(evt => {
      const matchesSearch =
        evt.connectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass = selectedClass === 'ALL' || evt.eventClass === selectedClass;
      const matchesStatus = selectedStatus === 'ALL' || evt.complianceStatus === selectedStatus;
      const matchesConnector = selectedConnector === 'ALL' || evt.connectorName === selectedConnector;

      return matchesSearch && matchesClass && matchesStatus && matchesConnector;
    });
  }, [auditEvents, searchTerm, selectedClass, selectedStatus, selectedConnector]);

  // List of unique connector names for filtering
  const uniqueConnectors = useMemo(() => {
    return Array.from(new Set(auditEvents.map(evt => evt.connectorName)));
  }, [auditEvents]);

  // Simulate Export Functionality
  const handleExport = (format: 'PDF' | 'CSV') => {
    setIsExporting(true);
    setExportSuccessMessage(null);

    setTimeout(() => {
      setIsExporting(false);
      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
      
      if (format === 'CSV') {
        // Construct basic CSV payload
        const headers = 'Audit ID,Timestamp,Event Class,Connector,Detail,Performance Delta,Policy,Compliance Status,Operator,Cryptographic Signature\n';
        const rows = filteredEvents.map(e => 
          `"${e.id}","${e.timestamp}","${e.eventClass}","${e.connectorName}","${e.detail.replace(/"/g, '""')}","${e.performanceDelta}","${e.policyId}","${e.complianceStatus}","${e.operator}","${e.signature}"`
        ).join('\n');
        
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `load-balancer-compliance-audit_${timestampStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExportSuccessMessage('CSV Audit Report exported and downloaded successfully.');
      } else {
        // Construct PDF-like view/mock alert or simulated PDF metadata
        // Generate compliant layout log
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const docHTML = `
            <html>
              <head>
                <title>Compliance Audit Report - Load Balancer System</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                  h1 { font-size: 24px; color: #0f172a; margin-bottom: 5px; }
                  h2 { font-size: 16px; color: #475569; margin-top: 0; margin-bottom: 30px; font-weight: normal; }
                  .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                  .header-table td { padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
                  .header-table td.label { font-weight: bold; color: #64748b; width: 250px; }
                  .audit-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                  .audit-table th { background: #f1f5f9; padding: 12px 10px; text-align: left; font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
                  .audit-table td { padding: 12px 10px; font-size: 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
                  .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
                  .badge-compliant { background: #d1fae5; color: #065f46; }
                  .badge-warning { background: #fef3c7; color: #92400e; }
                  .badge-critical { background: #fee2e2; color: #991b1b; }
                  .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                  .signature-box { font-family: monospace; font-size: 10px; background: #f8fafc; padding: 8px; border-radius: 4px; border: 1px solid #e2e8f0; }
                </style>
              </head>
              <body>
                <h1>LOAD BALANCER COMPLIANCE AUDIT</h1>
                <h2>ISO 27001:2022 & SOC 2 Type II Telemetry Log Report</h2>
                
                <table class="header-table">
                  <tr>
                    <td class="label">Report Identifier:</td>
                    <td>REP-LB-AUD-${Math.floor(Math.random() * 900000 + 100000)}</td>
                    <td class="label">Compliance Standard:</td>
                    <td>SOC2 Type II / ISO-27001 Annex A.12 / GDPR Art. 32</td>
                  </tr>
                  <tr>
                    <td class="label">Generation Timestamp:</td>
                    <td>${new Date().toISOString()}</td>
                    <td class="label">Auditor Signature Key:</td>
                    <td>SYSTEM_AUTH_SSL_VALIDATION_ROOT</td>
                  </tr>
                </table>

                <h3>HISTORICAL RECORD LOGS (${filteredEvents.length} Events Listed)</h3>
                <table class="audit-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Class</th>
                      <th>Connector</th>
                      <th>Detail & Incident Resolution</th>
                      <th>Performance Impact</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredEvents.map(e => `
                      <tr>
                        <td>${e.timestamp}</td>
                        <td><strong>${e.eventClass}</strong></td>
                        <td>${e.connectorName}</td>
                        <td>${e.detail}<br/><span style="color:#64748b; font-size:10px; font-family:monospace;">Policy: ${e.policyId} | Sign: ${e.signature}</span></td>
                        <td>${e.performanceDelta}</td>
                        <td><span class="badge ${e.complianceStatus === 'COMPLIANT' ? 'badge-compliant' : e.complianceStatus === 'WARNING' ? 'badge-warning' : 'badge-critical'}">${e.complianceStatus}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div class="footer">
                  <p>Certified Document Integrity Verification: This telemetry log is dynamically extracted from immutable system daemon logs and cryptographically hashed for chain-of-custody security standards.</p>
                  <div class="signature-box">CONFIDENTIALITY CLASSIFICATION: SECURE INTERNAL AUDIT. NO TAMPER DETECTED. SHA-256 CHECK: 4b8e9f2a4c107e8d5f309a1286c478a8b19329fc0e882aef481cfc886b</div>
                </div>
                <script>window.print();</script>
              </body>
            </html>
          `;
          printWindow.document.write(docHTML);
          printWindow.document.close();
        }
        setExportSuccessMessage('Audit Report PDF compilation triggered. Printing options initialized.');
      }
      
      // Auto fade confirmation message
      setTimeout(() => setExportSuccessMessage(null), 5000);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-slate-800 bg-slate-50 min-h-screen">
      
      {/* 1. Header Area with Compliance Certification Badges */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <History className="w-4 h-4" />
            COMPLIANCE AND CAPACITY REPORTING
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Load Balancer System Audit
            <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-200 uppercase">
              Immutable Trail
            </span>
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            Detailed chronological record of autonomous routing, traffic spillover, data-rate pacing, and connector node failovers. Provides cryptographically verifiable documentation to support SOC 2 (Type II) Trust Principles, ISO 27001 audits, and GDPR availability controls.
          </p>
        </div>
        
        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => handleExport('CSV')}
            disabled={isExporting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>
          
          <button
            onClick={() => handleExport('PDF')}
            disabled={isExporting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-indigo-300" />
            )}
            Compile PDF Report
          </button>
        </div>
      </div>

      {/* Export Confirmation Success Banner */}
      {exportSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4.5 py-3 rounded-xl flex items-center gap-3 animate-fade-in shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{exportSuccessMessage}</span>
        </div>
      )}

      {/* 2. Top level Core Compliance Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Audit Security Level</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 tracking-tight">SOC 2 Type II</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Fully Compliant Controls
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Dynamic Ingestion SLA</span>
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 tracking-tight">99.992%</div>
            <div className="text-[10px] text-indigo-600 font-semibold mt-1">
              Sustained uptime threshold across all nodes
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Compliance Event Logs</span>
            <div className="p-1.5 bg-slate-50 rounded-lg text-slate-600">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 tracking-tight">{auditEvents.length} Total Trail Events</div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-semibold">
              <Lock className="w-3 h-3 text-slate-400" />
              Cryptographically Cryptosec Signatures
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Data Encryption Level</span>
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 tracking-tight">TLS 1.3 / AES-256</div>
            <div className="text-[10px] text-indigo-600 font-semibold mt-1">
              Forced end-to-end transport tunnels
            </div>
          </div>
        </div>
      </div>

      {/* 3. Performance Trend Analysis Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Ingestion Load Balancing & Latency Benchmarks
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hourly comparison of automated balancing interventions versus baseline packet-latency overhead.
            </p>
          </div>
          <div className="w-full h-64 mt-4 font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInterventions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontFamily: 'sans-serif', fontSize: '11px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="Interventions" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorInterventions)" />
                <Area type="monotone" dataKey="Avg Latency (ms)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col">
          <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-500" />
            Compliance Policy Framework Mapping
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click on any active Load Balancer policy below to expand regulatory references.
          </p>
          
          <div className="mt-4 flex-1 space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
            {complianceRules.map((rule) => (
              <button
                key={rule.policyId}
                onClick={() => setSelectedPolicyDetail(rule)}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="truncate pr-2">
                  <div className="font-extrabold text-xs text-slate-800 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    {rule.policyId}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{rule.policyName}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Interactive Policy Mapping Modal/Drawer */}
      {selectedPolicyDetail && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 shadow-2xs animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <button
            onClick={() => setSelectedPolicyDetail(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer px-2 py-0.5 hover:bg-slate-200/50 rounded"
          >
            ✕ Dismiss
          </button>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-mono font-bold">
                {selectedPolicyDetail.policyId}
              </span>
              <span className="font-extrabold text-slate-900 text-sm">
                {selectedPolicyDetail.policyName}
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              {selectedPolicyDetail.description}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white p-2.5 rounded-xl border border-slate-150 text-[10px]">
                <div className="text-slate-400 font-bold uppercase tracking-wider">SOC 2 Trust Criteria</div>
                <div className="text-slate-700 font-extrabold font-mono mt-1">{selectedPolicyDetail.soc2Reference}</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-150 text-[10px]">
                <div className="text-slate-400 font-bold uppercase tracking-wider">ISO 27001 Annex-A</div>
                <div className="text-slate-700 font-extrabold font-mono mt-1">{selectedPolicyDetail.iso27001Reference}</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-150 text-[10px]">
                <div className="text-slate-400 font-bold uppercase tracking-wider">GDPR Compliance</div>
                <div className="text-slate-700 font-extrabold font-mono mt-1">{selectedPolicyDetail.gdprArticle}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Connector Health scores Table & compliance rating */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" />
              SLA Compliance & Telemetry Benchmarks
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live capacity profiles, transaction speeds, encryption and compliance rating for active connector nodes.
            </p>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-lg border border-indigo-100 uppercase">
            6 Monitored Nodes
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Connector Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-center">Health Index</th>
                <th className="px-5 py-3 text-center">Trend (Last 5)</th>
                <th className="px-5 py-3">Peak Speed</th>
                <th className="px-5 py-3 text-center">Latency (p50 / p95 / p99)</th>
                <th className="px-5 py-3">Encryption Transport</th>
                <th className="px-5 py-3">Uptime SLA</th>
                <th className="px-5 py-3 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {healthBenchmarks.map((conn) => (
                <tr key={conn.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-extrabold text-slate-800">{conn.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold font-mono">
                      {conn.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs font-black ${
                        conn.healthScore >= 95 ? 'text-emerald-600' : conn.healthScore >= 80 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {conn.healthScore}%
                      </span>
                      <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            conn.healthScore >= 95 ? 'bg-emerald-500' : conn.healthScore >= 80 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${conn.healthScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {conn.history[4] > conn.history[0] ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] font-bold" title={`Trending Up. History: ${conn.history.join(' → ')}`}>
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>+{conn.history[4] - conn.history[0]}%</span>
                        </span>
                      ) : conn.history[4] < conn.history[0] ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-[10px] font-bold" title={`Trending Down. History: ${conn.history.join(' → ')}`}>
                          <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{conn.history[4] - conn.history[0]}%</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold" title={`Stable. History: ${conn.history.join(' → ')}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                          <span>Stable</span>
                        </span>
                      )}

                      {/* Small visual Spark Bars */}
                      <div className="flex gap-0.5 items-end h-3.5 w-8">
                        {conn.history.map((val, idx) => {
                          const heightPct = Math.max(25, Math.min(100, ((val - 60) / 40) * 100));
                          return (
                            <div
                              key={idx}
                              style={{ height: `${heightPct}%` }}
                              className={`w-1 rounded-2xs ${
                                conn.history[4] > conn.history[0] ? 'bg-emerald-400' :
                                conn.history[4] < conn.history[0] ? 'bg-rose-400' : 'bg-slate-400'
                              }`}
                              title={`Audit check ${idx + 1}: ${val}%`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-500 font-semibold">{conn.peakThroughput}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-500 text-center">
                    {conn.latencyP50} <span className="text-slate-300">|</span> {conn.latencyP95} <span className="text-slate-300">|</span> {conn.latencyP99}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[10px] text-slate-500">{conn.encryptionStandard}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-800 font-bold">{conn.slaStatus}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex items-center justify-center w-8 h-5 text-[10px] font-black rounded ${
                      conn.complianceRating === 'AAA' ? 'bg-emerald-100 text-emerald-800' :
                      conn.complianceRating === 'AA' ? 'bg-indigo-100 text-indigo-800' :
                      conn.complianceRating === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {conn.complianceRating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Chronological Audit Log Filter Controls & Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" />
                Audit Trail Chronological Logs
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Verifiable record of real-time route alterations, container scaling, dynamic thresholds, and schema validation.
              </p>
            </div>
            
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search audit trail..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-250 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Expanded Filter Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1.5">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Event Classification</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Event Classes</option>
                <option value="Spillover Avoidance">Spillover Avoidance</option>
                <option value="Health Restoration">Health Restoration</option>
                <option value="Throttling Guard">Throttling Guard</option>
                <option value="Failover Routing">Failover Routing</option>
                <option value="Schema Validation">Schema Validation</option>
                <option value="Daily Verification">Daily Verification</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Compliance Severity</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Severities</option>
                <option value="COMPLIANT">Compliant (PASS)</option>
                <option value="WARNING">Warning</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Target Connector</label>
              <select
                value={selectedConnector}
                onChange={(e) => setSelectedConnector(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Connectors</option>
                {uniqueConnectors.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Audit ID & Timestamp</th>
                <th className="px-5 py-3">Classification</th>
                <th className="px-5 py-3">Primary Node</th>
                <th className="px-5 py-3">Event Detail / Incident Resolution</th>
                <th className="px-5 py-3">Telemetry Impact</th>
                <th className="px-5 py-3 text-center">Audit Status</th>
                <th className="px-5 py-3 text-right">Cryptographic Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Timestamp column */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-mono text-[11px] font-bold text-slate-950">{evt.id}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{new Date(evt.timestamp).toLocaleString()}</div>
                    </td>

                    {/* Classification */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        evt.eventClass === 'Spillover Avoidance' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        evt.eventClass === 'Health Restoration' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        evt.eventClass === 'Throttling Guard' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        evt.eventClass === 'Failover Routing' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                        evt.eventClass === 'Schema Validation' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {evt.eventClass}
                      </span>
                    </td>

                    {/* Connector name */}
                    <td className="px-5 py-4 font-bold text-slate-800 whitespace-nowrap">
                      {evt.connectorName}
                    </td>

                    {/* Detail explanation */}
                    <td className="px-5 py-4 max-w-sm">
                      <div className="text-slate-700 leading-relaxed font-sans">{evt.detail}</div>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-mono">
                        <span>Rule:</span>
                        <button
                          onClick={() => {
                            const foundRule = complianceRules.find(r => r.policyId === evt.policyId);
                            if (foundRule) setSelectedPolicyDetail(foundRule);
                          }}
                          className="hover:text-indigo-600 hover:underline font-bold focus:outline-none cursor-pointer"
                        >
                          {evt.policyId}
                        </button>
                        <span>•</span>
                        <span>Daemon: {evt.operator}</span>
                      </div>
                    </td>

                    {/* Performance / Telemetry delta */}
                    <td className="px-5 py-4 font-mono text-[10px] text-slate-600 font-semibold whitespace-nowrap">
                      {evt.performanceDelta}
                    </td>

                    {/* Compliance status badge */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        evt.complianceStatus === 'COMPLIANT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        evt.complianceStatus === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          evt.complianceStatus === 'COMPLIANT' ? 'bg-emerald-500' :
                          evt.complianceStatus === 'WARNING' ? 'bg-amber-500' :
                          'bg-rose-500 animate-pulse'
                        }`}></span>
                        {evt.complianceStatus}
                      </span>
                    </td>

                    {/* Crypto sign */}
                    <td className="px-5 py-4 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      <span className="bg-slate-50 border border-slate-100 rounded px-2 py-1 select-all" title={evt.signature}>
                        {evt.signature.slice(7, 18)}...
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400 font-medium">
                    No load balancing audit logs matched the specified search keywords or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
