import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  Zap,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Database,
  Cloud,
  FileCheck,
  GitBranch,
  Filter,
  Search,
  Activity,
  ChevronRight,
  Info,
  Calendar,
  Key,
  Download,
  Terminal,
  Sparkles,
  Sliders,
  RefreshCw
} from 'lucide-react';

export interface MilestoneStep {
  id: string;
  stageName: 'Initiation' | 'Pre-Export Validation' | 'Data Transformation' | 'Storage & Completion';
  title: string;
  status: 'Completed' | 'In Progress' | 'Failed' | 'Pending';
  timestamp: string;
  durationMs: number;
  details: string;
  subTaskLogs: string[];
  metrics?: { [key: string]: string | number };
}

export interface JobVersionTimeline {
  jobId: string;
  scheduleId: string;
  scheduleName: string;
  versionNumber: number;
  versionLabel: string;
  exportScope: string;
  format: string;
  destinationType: string;
  destinationUri: string;
  initiatedBy: string;
  startedAt: string;
  completedAt?: string;
  overallStatus: 'Completed' | 'Executing' | 'Failed';
  totalRowCount: number;
  fileSizeBytes: number;
  checksumSha256: string;
  milestones: MilestoneStep[];
}

export const MOCK_JOB_TIMELINES: JobVersionTimeline[] = [
  {
    jobId: 'job-901-v1.2',
    scheduleId: 'sch-101',
    scheduleName: 'Daily Parquet Data Lake Sync',
    versionNumber: 1.2,
    versionLabel: 'v1.2 - Added AES-256 KMS Encryption & Parquet Compression',
    exportScope: 'Full Snapshot (Customer Master & Sales)',
    format: 'Parquet',
    destinationType: 'AWS S3',
    destinationUri: 's3://enterprise-data-lake-prod/snapshots/daily/customers/',
    initiatedBy: 'System Cron (Automated)',
    startedAt: '2026-08-12 04:00:00 UTC',
    completedAt: '2026-08-12 04:00:03 UTC',
    overallStatus: 'Completed',
    totalRowCount: 124500,
    fileSizeBytes: 48500000, // ~48.5 MB
    checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    milestones: [
      {
        id: 'm-101',
        stageName: 'Initiation',
        title: 'Job Initiation & Version Handshake',
        status: 'Completed',
        timestamp: '04:00:00.012 UTC',
        durationMs: 140,
        details: 'Validated job trigger request against Schedule v1.2 config snapshot. Authenticated Kerberos credentials for SAP ECC 6.0 Connector.',
        subTaskLogs: [
          'Received cron trigger payload for schedule sch-101',
          'Loaded configuration version snapshot v1.2 (Commit SHA: 8f9a2b1)',
          'Verified storage quota on destination AWS S3 bucket (2.4 TB available)',
          'Established mTLS encrypted session with SAP HANA cluster'
        ],
        metrics: {
          'Trigger Type': 'Cron Schedule',
          'Config Version': '1.2',
          'Cluster Auth': 'Success (14ms)'
        }
      },
      {
        id: 'm-102',
        stageName: 'Pre-Export Validation',
        title: 'Pre-Export Integrity & Schema Validation',
        status: 'Completed',
        timestamp: '04:00:00.152 UTC',
        durationMs: 420,
        details: 'Executed automated diagnostic scan on KNA1 customer dataset. Checked primary key non-nullability, PII tagging, and ISO formatting.',
        subTaskLogs: [
          'Scanned 124,500 candidate records against schema registry',
          'Mandatory primary key check: 100% compliant (0 missing keys)',
          'Evaluated PII masking rules: 28 email addresses flagged for auto-hash',
          'Integrity Score: 98% (Passed pre-flight check)'
        ],
        metrics: {
          'Records Validated': 124500,
          'Schema Status': '100% Match',
          'PII Hash Rules': '2 Active'
        }
      },
      {
        id: 'm-103',
        stageName: 'Data Transformation',
        title: 'ETL Transformation & Snappy Compression',
        status: 'Completed',
        timestamp: '04:00:00.572 UTC',
        durationMs: 1850,
        details: 'Applied SHA-256 salted tax ID hashing, contact email local masking, spot EUR-to-USD FX conversions, and Snappy compression.',
        subTaskLogs: [
          'Transformed raw SAP memory bytes to Apache Arrow memory table',
          'Executed CryptoJS.SHA256 salt transformer on tax_identifier_hash',
          'Converted revenue fields from EUR to USD using spot rate 1.0850',
          'Compressed memory stream using Parquet Snappy algorithm (Compression ratio: 4.2x)'
        ],
        metrics: {
          'Transformation Speed': '67,297 rows/sec',
          'Raw Size': '204.2 MB',
          'Compressed Size': '48.5 MB'
        }
      },
      {
        id: 'm-104',
        stageName: 'Storage & Completion',
        title: 'S3 Target Writing & SHA-256 Verification',
        status: 'Completed',
        timestamp: '04:00:02.422 UTC',
        durationMs: 630,
        details: 'Wrote Parquet partitions to AWS S3 bucket with AWS-KMS AES-256 envelope encryption. Generated SHA-256 manifest payload.',
        subTaskLogs: [
          'Uploaded customer_account_master.parquet (48.5 MB) via multi-part upload',
          'Applied AWS-KMS server-side envelope encryption key: arn:aws:kms:us-east-1:1234567890:key/e3b0c44',
          'Computed target checksum SHA-256: e3b0c44298fc1c149afbf4c...',
          'Updated audit event log and emitted webhook notification to Slack #data-alerts'
        ],
        metrics: {
          'Upload Throughput': '77.0 MB/sec',
          'Encryption': 'AWS-KMS AES-256',
          'Final Status': 'SUCCESS'
        }
      }
    ]
  },
  {
    jobId: 'job-902-v1.1',
    scheduleId: 'sch-101',
    scheduleName: 'Daily Parquet Data Lake Sync',
    versionNumber: 1.1,
    versionLabel: 'v1.1 - Added Incremental Delta Mode',
    exportScope: 'Incremental Delta (24h)',
    format: 'Parquet',
    destinationType: 'AWS S3',
    destinationUri: 's3://enterprise-data-lake-prod/snapshots/daily/customers/',
    initiatedBy: 'Admin User (fayasamd@gmail.com)',
    startedAt: '2026-08-11 04:00:00 UTC',
    completedAt: '2026-08-11 04:00:02 UTC',
    overallStatus: 'Completed',
    totalRowCount: 14200,
    fileSizeBytes: 5600000,
    checksumSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    milestones: [
      {
        id: 'm-201',
        stageName: 'Initiation',
        title: 'Job Initiation & Version Handshake',
        status: 'Completed',
        timestamp: '04:00:00.010 UTC',
        durationMs: 120,
        details: 'Initialized execution under Version 1.1 with incremental 24-hour delta timestamp filtering.',
        subTaskLogs: [
          'Received manual invocation request by fayasamd@gmail.com',
          'Loaded Version 1.1 configuration snapshot',
          'Queried last checkpoint timestamp: 2026-08-10 04:00:00 UTC'
        ],
        metrics: {
          'Trigger Type': 'Manual Admin Request',
          'Config Version': '1.1'
        }
      },
      {
        id: 'm-202',
        stageName: 'Pre-Export Validation',
        title: 'Pre-Export Integrity Scan',
        status: 'Completed',
        timestamp: '04:00:00.130 UTC',
        durationMs: 310,
        details: 'Scanned 14,200 delta records for schema consistency.',
        subTaskLogs: [
          'Validated schema against PostgreSQL meta registry',
          '0 schema mismatches detected'
        ],
        metrics: {
          'Delta Records': 14200,
          'Validation Score': '100%'
        }
      },
      {
        id: 'm-203',
        stageName: 'Data Transformation',
        title: 'ETL Delta Transformation',
        status: 'Completed',
        timestamp: '04:00:00.440 UTC',
        durationMs: 980,
        details: 'Processed delta changes and compiled Parquet output.',
        subTaskLogs: ['Applied UTC timestamp formatting', 'Generated Snappy compressed buffer'],
        metrics: {
          'Throughput': '14,489 rows/sec'
        }
      },
      {
        id: 'm-204',
        stageName: 'Storage & Completion',
        title: 'Storage Delivery & Manifest Commit',
        status: 'Completed',
        timestamp: '04:00:01.420 UTC',
        durationMs: 410,
        details: 'Uploaded incremental delta file to S3 storage bucket.',
        subTaskLogs: ['File written: delta_20260811.parquet', 'Checksum verified'],
        metrics: {
          'Final Status': 'SUCCESS'
        }
      }
    ]
  },
  {
    jobId: 'job-903-v1.0',
    scheduleId: 'sch-102',
    scheduleName: 'Weekly Cleansed Audit Feed',
    versionNumber: 1.0,
    versionLabel: 'v1.0 - Initial Baseline Release',
    exportScope: 'Quarantined Error Records',
    format: 'CSV (Zip Compressed)',
    destinationType: 'Google Cloud Storage',
    destinationUri: 'gs://edimp-migration-audit-bucket/weekly-zip/',
    initiatedBy: 'System Cron',
    startedAt: '2026-08-10 02:15:00 UTC',
    completedAt: '2026-08-10 02:15:02 UTC',
    overallStatus: 'Completed',
    totalRowCount: 8420,
    fileSizeBytes: 2100000,
    checksumSha256: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
    milestones: [
      {
        id: 'm-301',
        stageName: 'Initiation',
        title: 'Job Initiation',
        status: 'Completed',
        timestamp: '02:15:00.015 UTC',
        durationMs: 110,
        details: 'Initialized baseline execution for weekly audit feed.',
        subTaskLogs: ['Connected to Salesforce CRM API', 'Authenticated OAuth 2.0 token'],
        metrics: { 'Trigger': 'Cron', 'Version': '1.0' }
      },
      {
        id: 'm-302',
        stageName: 'Pre-Export Validation',
        title: 'Validation & Anonymization Check',
        status: 'Completed',
        timestamp: '02:15:00.125 UTC',
        durationMs: 280,
        details: 'Evaluated 8,420 error log entries.',
        subTaskLogs: ['HMAC tokenizer verified'],
        metrics: { 'Records': 8420 }
      },
      {
        id: 'm-303',
        stageName: 'Data Transformation',
        title: 'CSV Zip Encoding',
        status: 'Completed',
        timestamp: '02:15:00.405 UTC',
        durationMs: 780,
        details: 'Converted logs to CSV format and compressed using DEFLATE.',
        subTaskLogs: ['Zip compression complete'],
        metrics: { 'Ratio': '3.8x' }
      },
      {
        id: 'm-304',
        stageName: 'Storage & Completion',
        title: 'GCS Upload & Notification',
        status: 'Completed',
        timestamp: '02:15:01.185 UTC',
        durationMs: 390,
        details: 'Uploaded audit_validation_exceptions.zip.csv to Google Cloud Storage.',
        subTaskLogs: ['Uploaded to gs://edimp-migration-audit-bucket'],
        metrics: { 'Status': 'SUCCESS' }
      }
    ]
  }
];

interface ExportJobTimelineToolProps {
  initialJobId?: string;
  onClose?: () => void;
}

export const ExportJobTimelineTool: React.FC<ExportJobTimelineToolProps> = ({
  initialJobId,
  onClose,
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(
    initialJobId || MOCK_JOB_TIMELINES[0].jobId
  );
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const activeJob =
    MOCK_JOB_TIMELINES.find((j) => j.jobId === selectedJobId) || MOCK_JOB_TIMELINES[0];

  const selectedMilestone = activeJob.milestones.find((m) => m.id === selectedMilestoneId) || activeJob.milestones[0];

  const totalDurationMs = activeJob.milestones.reduce((acc, curr) => acc + curr.durationMs, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Job Execution Timeline
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold rounded-full">
              Milestones &amp; Version Lineage
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600" /> Export Job Milestone Visual Timeline
          </h2>

          <p className="text-slate-500 text-xs max-w-3xl">
            Trace the step-by-step milestone execution stages for export jobs across schedule versions—from job initiation and pre-export integrity validation to ETL transformation and storage completion.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all self-start md:self-auto"
          >
            Close Timeline
          </button>
        )}
      </div>

      {/* Target Job & Version Selector Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5 text-amber-600" /> Select Export Job Execution &amp; Version:
            </label>

            <select
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                setSelectedMilestoneId(null);
              }}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[340px]"
            >
              {MOCK_JOB_TIMELINES.map((job) => (
                <option key={job.jobId} value={job.jobId}>
                  {job.scheduleName} - {job.versionLabel} ({job.overallStatus})
                </option>
              ))}
            </select>
          </div>

          {/* Job Status Badge & Trigger Overview */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> {activeJob.startedAt}
            </span>

            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 ${
                activeJob.overallStatus === 'Completed'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : activeJob.overallStatus === 'Executing'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{activeJob.overallStatus}</span>
            </span>
          </div>
        </div>

        {/* Selected Job Version Metadata Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-2 border-t border-slate-200/80">
          <span className="text-slate-500 text-[11px] font-sans font-medium">Triggered By:</span>
          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-800 font-bold">
            {activeJob.initiatedBy}
          </span>

          <span className="text-slate-500 text-[11px] font-sans font-medium">Format &amp; Scope:</span>
          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-indigo-700 font-bold">
            {activeJob.format} ({activeJob.exportScope})
          </span>

          <span className="text-slate-500 text-[11px] font-sans font-medium">Target URI:</span>
          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-bold truncate max-w-[320px]">
            {activeJob.destinationUri}
          </span>
        </div>
      </div>

      {/* High-Level Job Performance Overview KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Total Execution Duration</span>
          <span className="text-xl font-black text-slate-900 font-mono">{(totalDurationMs / 1000).toFixed(2)}s</span>
          <span className="text-[10px] text-slate-500 block">Across 4 milestone stages</span>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono block">Records Exported</span>
          <span className="text-xl font-black text-emerald-900 font-mono">{activeJob.totalRowCount.toLocaleString()}</span>
          <span className="text-[10px] text-emerald-700 block">100% row count verified</span>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold text-amber-800 uppercase font-mono block">File Size &amp; Rate</span>
          <span className="text-xl font-black text-amber-900 font-mono">{(activeJob.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
          <span className="text-[10px] text-amber-700 block">Parquet Snappy Compressed</span>
        </div>

        <div className="bg-purple-50/60 border border-purple-200 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold text-purple-800 uppercase font-mono block">Schedule Version</span>
          <span className="text-xl font-black text-purple-900 font-mono">v{activeJob.versionNumber}</span>
          <span className="text-[10px] text-purple-700 block">Snapshot hash verified</span>
        </div>
      </div>

      {/* VISUAL TIMELINE PROGRESSION BAR & MILESTONE NODES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 border-b border-slate-200 pb-2">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" /> Milestone Execution Stepper
          </span>
          <span className="text-slate-400">Click a stage node to inspect low-level logs &amp; metrics</span>
        </div>

        {/* Milestone Stage Nodes Line Visual */}
        <div className="relative pt-4 pb-2">
          {/* Connector Horizontal Line */}
          <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-200 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative z-10">
            {activeJob.milestones.map((m, idx) => {
              const isSelected = selectedMilestone?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMilestoneId(m.id)}
                  className={`bg-white border p-4 rounded-xl shadow-2xs transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-50/30'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                        m.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{m.durationMs}ms</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">
                      {m.stageName}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug mt-0.5">{m.title}</h4>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>{m.timestamp}</span>
                    <ChevronRight className={`w-3 h-3 text-amber-600 transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DETAILED MILESTONE STEP INSPECTOR DRAWER CARD */}
      {selectedMilestone && (
        <div className="bg-slate-50/80 border border-slate-200 text-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded text-[10px] font-mono font-bold">
                  {selectedMilestone.stageName} Stage
                </span>
                <span className="text-xs font-mono text-slate-500 font-medium">{selectedMilestone.timestamp}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-600" /> {selectedMilestone.title}
              </h3>
            </div>

            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-bold text-xs rounded-lg self-start sm:self-auto shadow-3xs">
              Duration: {selectedMilestone.durationMs}ms
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">{selectedMilestone.details}</p>

          {/* Metrics Grid */}
          {selectedMilestone.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200 font-mono text-xs shadow-3xs">
              {Object.entries(selectedMilestone.metrics).map(([k, v]) => (
                <div key={k}>
                  <span className="text-slate-500 text-[10px] block font-medium">{k}:</span>
                  <strong className="text-amber-900 font-bold">{v}</strong>
                </div>
              ))}
            </div>
          )}

          {/* Sub-Task Execution Logs Terminal Block */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-slate-600 uppercase font-bold flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-amber-600" /> Milestone Task Execution Logs:
            </span>

            <div className="bg-slate-100/90 p-3.5 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1.5 text-slate-800 max-h-48 overflow-y-auto">
              {selectedMilestone.subTaskLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold shrink-0">&gt;</span>
                  <span className="font-medium">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payload Manifest & Checksum Verification Footer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div className="space-y-0.5">
          <span className="text-slate-400 text-[11px] block">Verified Target SHA-256 Digest Manifest:</span>
          <strong className="text-slate-800 break-all">{activeJob.checksumSha256}</strong>
        </div>

        <button
          type="button"
          onClick={() => alert(`Downloaded Milestone Execution Audit Log for ${activeJob.jobId}`)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>Download Milestone Log</span>
        </button>
      </div>
    </div>
  );
};
