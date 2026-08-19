import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Clock,
  Cpu,
  Server,
  HardDrive,
  Zap,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Sliders,
  Database,
  Activity,
  Flame,
  GitCompare,
  Layers,
  Copy,
  Check,
  Search,
  ChevronRight,
  Info,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  X,
  Gauge,
  Play,
  Pause,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { MigrationJob } from '../types';
import { MOCK_MIGRATION_JOBS } from '../data/mockData';

interface JobComparisonViewProps {
  jobs?: MigrationJob[];
  onNavigateTab?: (tab: string) => void;
}

export interface DetailedFinishedJob {
  id: string;
  jobName: string;
  sourceTarget: string;
  sourceConnectorName: string;
  destConnectorName: string;
  recordCount: number;
  durationMins: number;
  throughputRps: number;
  executedAt: string;
  errorCount: number;
  warningCount: number;
  errorRatePct: number;
  qualityScorePct: number;
  avgCpuPct: number;
  peakCpuPct: number;
  avgRamGb: number;
  peakRamGb: number;
  diskIoMbSec: number;
  networkMbps: number;
  batchSize: number;
  concurrencyWorkers: number;
  status: 'Completed' | 'Warning' | 'Rolled Back';
}

// Rich dataset of finished migration jobs for side-by-side comparison
const DEFAULT_FINISHED_JOBS: DetailedFinishedJob[] = [
  {
    id: 'job-101-hist',
    jobName: 'SAP S/4HANA Finance (Single-Threaded Baseline)',
    sourceTarget: 'SAP S/4HANA ➔ Azure SQL Staging',
    sourceConnectorName: 'SAP S/4HANA Cloud Engine',
    destConnectorName: 'Azure SQL Staging DB',
    recordCount: 1500000,
    durationMins: 45,
    throughputRps: 555,
    executedAt: 'Yesterday at 09:00 AM',
    errorCount: 12,
    warningCount: 45,
    errorRatePct: 0.0008,
    qualityScorePct: 98.4,
    avgCpuPct: 62,
    peakCpuPct: 84,
    avgRamGb: 14.2,
    peakRamGb: 22.8,
    diskIoMbSec: 18.5,
    networkMbps: 120,
    batchSize: 200,
    concurrencyWorkers: 2,
    status: 'Completed',
  },
  {
    id: 'job-102-hist',
    jobName: 'SAP S/4HANA Finance (Multi-Pod K8s Scaling)',
    sourceTarget: 'SAP S/4HANA ➔ Azure SQL Staging',
    sourceConnectorName: 'SAP S/4HANA Cloud Engine',
    destConnectorName: 'Azure SQL Staging DB',
    recordCount: 1500000,
    durationMins: 18,
    throughputRps: 1388,
    executedAt: 'Yesterday at 02:30 PM',
    errorCount: 2,
    warningCount: 18,
    errorRatePct: 0.0001,
    qualityScorePct: 99.8,
    avgCpuPct: 88,
    peakCpuPct: 96,
    avgRamGb: 38.5,
    peakRamGb: 54.0,
    diskIoMbSec: 52.4,
    networkMbps: 480,
    batchSize: 1000,
    concurrencyWorkers: 12,
    status: 'Completed',
  },
  {
    id: 'job-103-hist',
    jobName: 'Item Ledger & Stock Balances - SAP to BC',
    sourceTarget: 'SAP S/4HANA ➔ Business Central (Prod)',
    sourceConnectorName: 'SAP S/4HANA Cloud Engine',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    recordCount: 48500,
    durationMins: 1.0,
    throughputRps: 820,
    executedAt: '2026-07-28 08:00 AM',
    errorCount: 0,
    warningCount: 5,
    errorRatePct: 0.0,
    qualityScorePct: 100.0,
    avgCpuPct: 42,
    peakCpuPct: 58,
    avgRamGb: 8.4,
    peakRamGb: 12.1,
    diskIoMbSec: 24.8,
    networkMbps: 210,
    batchSize: 500,
    concurrencyWorkers: 4,
    status: 'Completed',
  },
  {
    id: 'job-104-hist',
    jobName: 'Vendor Accounts Payable Sync - SQL Server to D365 F&O',
    sourceTarget: 'SQL Server Legacy ➔ Dynamics 365 F&O',
    sourceConnectorName: 'SQL Server - Legacy ERP DB',
    destConnectorName: 'Dynamics 365 Finance & Operations',
    recordCount: 3200,
    durationMins: 0.17,
    throughputRps: 310,
    executedAt: '2026-07-28 07:30 AM',
    errorCount: 2,
    warningCount: 8,
    errorRatePct: 0.0625,
    qualityScorePct: 97.2,
    avgCpuPct: 35,
    peakCpuPct: 48,
    avgRamGb: 4.2,
    peakRamGb: 6.8,
    diskIoMbSec: 12.1,
    networkMbps: 85,
    batchSize: 100,
    concurrencyWorkers: 2,
    status: 'Warning',
  },
  {
    id: 'job-105-hist',
    jobName: 'Customer Master - Legacy Excel to Business Central',
    sourceTarget: 'Customer Excel ➔ Business Central',
    sourceConnectorName: 'Customer Master Excel (.xlsx)',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    recordCount: 14250,
    durationMins: 0.53,
    throughputRps: 450,
    executedAt: '2026-07-28 09:15 AM',
    errorCount: 14,
    warningCount: 32,
    errorRatePct: 0.0982,
    qualityScorePct: 95.8,
    avgCpuPct: 50,
    peakCpuPct: 65,
    avgRamGb: 6.1,
    peakRamGb: 9.4,
    diskIoMbSec: 16.4,
    networkMbps: 140,
    batchSize: 250,
    concurrencyWorkers: 3,
    status: 'Warning',
  },
  {
    id: 'job-106-hist',
    jobName: 'Global Ledger Sync (EU to US High Volume)',
    sourceTarget: 'SAP S/4HANA EU ➔ US Business Central',
    sourceConnectorName: 'SAP S/4HANA (EU West)',
    destConnectorName: 'Dynamics 365 Business Central (US East)',
    recordCount: 10000000,
    durationMins: 120,
    throughputRps: 1388,
    executedAt: '2026-08-01 11:00 PM',
    errorCount: 124,
    warningCount: 45,
    errorRatePct: 0.0012,
    qualityScorePct: 99.1,
    avgCpuPct: 78,
    peakCpuPct: 92,
    avgRamGb: 32.0,
    peakRamGb: 48.0,
    diskIoMbSec: 45.0,
    networkMbps: 620,
    batchSize: 2000,
    concurrencyWorkers: 16,
    status: 'Completed',
  },
  {
    id: 'job-107-hist',
    jobName: 'Employee HR Data Initial Load',
    sourceTarget: 'Legacy HRMS ➔ PostgreSQL Warehouse',
    sourceConnectorName: 'Legacy HRMS REST API Endpoint',
    destConnectorName: 'PostgreSQL Staging Warehouse',
    recordCount: 55000,
    durationMins: 14.5,
    throughputRps: 63,
    executedAt: 'Yesterday at 11:30 PM',
    errorCount: 3,
    warningCount: 12,
    errorRatePct: 0.0055,
    qualityScorePct: 99.4,
    avgCpuPct: 22,
    peakCpuPct: 35,
    avgRamGb: 3.4,
    peakRamGb: 4.8,
    diskIoMbSec: 15.2,
    networkMbps: 45,
    batchSize: 50,
    concurrencyWorkers: 4,
    status: 'Completed',
  },
  {
    id: 'job-108-hist',
    jobName: 'Document Metadata Indexing',
    sourceTarget: 'SharePoint Docs ➔ PostgreSQL Warehouse',
    sourceConnectorName: 'SharePoint Document Library',
    destConnectorName: 'PostgreSQL Staging Warehouse',
    recordCount: 420000,
    durationMins: 38,
    throughputRps: 184,
    executedAt: 'Today at 01:15 AM',
    errorCount: 8,
    warningCount: 22,
    errorRatePct: 0.0019,
    qualityScorePct: 98.7,
    avgCpuPct: 45,
    peakCpuPct: 62,
    avgRamGb: 8.5,
    peakRamGb: 14.2,
    diskIoMbSec: 32.5,
    networkMbps: 185,
    batchSize: 200,
    concurrencyWorkers: 8,
    status: 'Completed',
  },
  {
    id: 'job-109-hist',
    jobName: 'Enterprise Analytics Sync (Nightly)',
    sourceTarget: 'PostgreSQL Warehouse ➔ Snowflake DW',
    sourceConnectorName: 'PostgreSQL Staging Warehouse',
    destConnectorName: 'Snowflake Enterprise Data Warehouse',
    recordCount: 5000000,
    durationMins: 25,
    throughputRps: 3333,
    executedAt: 'Today at 03:00 AM',
    errorCount: 0,
    warningCount: 5,
    errorRatePct: 0.0,
    qualityScorePct: 100.0,
    avgCpuPct: 82,
    peakCpuPct: 94,
    avgRamGb: 28.5,
    peakRamGb: 42.0,
    diskIoMbSec: 120.4,
    networkMbps: 850,
    batchSize: 5000,
    concurrencyWorkers: 24,
    status: 'Completed',
  },
  {
    id: 'job-110-hist',
    jobName: 'CRM Accounts Migration',
    sourceTarget: 'Salesforce CRM ➔ Snowflake DW',
    sourceConnectorName: 'Salesforce Enterprise CRM',
    destConnectorName: 'Snowflake Enterprise Data Warehouse',
    recordCount: 850000,
    durationMins: 11,
    throughputRps: 1287,
    executedAt: 'Today at 04:30 AM',
    errorCount: 4,
    warningCount: 31,
    errorRatePct: 0.0004,
    qualityScorePct: 99.2,
    avgCpuPct: 68,
    peakCpuPct: 85,
    avgRamGb: 16.5,
    peakRamGb: 24.8,
    diskIoMbSec: 45.2,
    networkMbps: 320,
    batchSize: 1000,
    concurrencyWorkers: 12,
    status: 'Completed',
  }
];

export const JobComparisonView: React.FC<JobComparisonViewProps> = ({
  jobs = [],
  onNavigateTab,
}) => {
  // Combine custom jobs provided in props with default finished jobs
  const allFinishedJobs = useMemo<DetailedFinishedJob[]>(() => {
    const map = new Map<string, DetailedFinishedJob>();

    DEFAULT_FINISHED_JOBS.forEach((j) => map.set(j.id, j));

    // Convert completed/finished jobs from props if any
    jobs
      .filter((j) => j.status === 'Completed' || j.status === 'Idle' || j.progressPct === 100)
      .forEach((j) => {
        if (!map.has(j.id)) {
          const recs = j.totalRecords || 10000;
          const rps = j.throughputRps || 350;
          const durationMins = parseFloat((recs / Math.max(rps * 60, 1)).toFixed(2));
          map.set(j.id, {
            id: j.id,
            jobName: j.jobName,
            sourceTarget: `${j.sourceConnectorName} ➔ ${j.destConnectorName}`,
            sourceConnectorName: j.sourceConnectorName,
            destConnectorName: j.destConnectorName,
            recordCount: recs,
            durationMins: Math.max(durationMins, 0.1),
            throughputRps: rps,
            executedAt: j.startTime || 'Recent Run',
            errorCount: j.errorCount || 0,
            warningCount: j.warningCount || 0,
            errorRatePct: parseFloat((((j.errorCount || 0) / Math.max(recs, 1)) * 100).toFixed(4)),
            qualityScorePct: parseFloat((100 - (((j.errorCount || 0) * 5) / Math.max(recs, 1))).toFixed(1)),
            avgCpuPct: 55,
            peakCpuPct: 75,
            avgRamGb: 12.0,
            peakRamGb: 18.0,
            diskIoMbSec: 25.0,
            networkMbps: 180,
            batchSize: j.batchSize || 500,
            concurrencyWorkers: 4,
            status: j.errorCount && j.errorCount > 0 ? 'Warning' : 'Completed',
          });
        }
      });

    return Array.from(map.values());
  }, [jobs]);

  // Selected Jobs state
  const [jobAId, setJobAId] = useState<string>('job-101-hist');
  const [jobBId, setJobBId] = useState<string>('job-102-hist');

  // Tab & Filter states
  const [activeTab, setActiveTab] = useState<'performance' | 'quality' | 'resources' | 'matrix' | 'speed6h'>('performance');
  const [chartType, setChartType] = useState<'grouped' | 'normalized'>('grouped');
  const [searchFilter, setSearchFilter] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAiRecommendations, setShowAiRecommendations] = useState(true);

  // Selected Heatmap Field for Raw JSON Inspection Side-Panel
  const [selectedHeatmapField, setSelectedHeatmapField] = useState<{
    fieldName: string;
    jobName: string;
    discrepancyPct: number;
    sourceConnectorName: string;
    destConnectorName: string;
  } | null>(null);

  const [liveStreamData, setLiveStreamData] = useState<Array<{ id: string, sourceVal: string, targetVal: string, status: 'match' | 'mismatch', timestamp: string }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (selectedHeatmapField) {
      setLiveStreamData([]);
      setIsStreaming(true);
    } else {
      setIsStreaming(false);
    }
  }, [selectedHeatmapField]);

  useEffect(() => {
    if (selectedHeatmapField && isStreaming) {
      const interval = setInterval(() => {
        setLiveStreamData(prev => {
          const id = `REC-${Math.floor(Math.random() * 90000) + 10000}`;
          
          let sourceVal = '';
          let targetVal = '';
          const isMismatch = Math.random() * 100 < Math.max(selectedHeatmapField.discrepancyPct * 2, 10); // boost mismatch chance for demo
          
          if (selectedHeatmapField.fieldName.includes('zip')) {
            sourceVal = '90210-4201';
            targetVal = isMismatch ? '90210' : '90210-4201';
          } else if (selectedHeatmapField.fieldName.includes('phone') || selectedHeatmapField.fieldName.includes('number')) {
            sourceVal = '+1 (555) 019-2831';
            targetVal = isMismatch ? '5550192831' : '+1 (555) 019-2831';
          } else if (selectedHeatmapField.fieldName.includes('amount') || selectedHeatmapField.fieldName.includes('tax')) {
             sourceVal = (Math.random() * 1000).toFixed(2);
             targetVal = isMismatch ? parseFloat(sourceVal).toString() : sourceVal; // drops trailing zero
          } else {
            sourceVal = new Date().toISOString();
            targetVal = isMismatch ? sourceVal.replace('T', ' ').slice(0, 19) : sourceVal;
          }
          
          const status: 'mismatch' | 'match' = isMismatch ? 'mismatch' : 'match';
          const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);

          const newRecord = { id, sourceVal, targetVal, status, timestamp };
          return [newRecord, ...prev].slice(0, 12); // Keep last 12 records
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [selectedHeatmapField, isStreaming]);

  // Retrieve Job A & Job B objects
  const jobA = useMemo(() => {
    return allFinishedJobs.find((j) => j.id === jobAId) || allFinishedJobs[0];
  }, [allFinishedJobs, jobAId]);

  const jobB = useMemo(() => {
    return allFinishedJobs.find((j) => j.id === jobBId) || allFinishedJobs[1] || allFinishedJobs[0];
  }, [allFinishedJobs, jobBId]);

  // Swap Job A and Job B
  const handleSwapJobs = () => {
    const temp = jobAId;
    setJobAId(jobBId);
    setJobBId(temp);
  };

  // Quick Preset Selection
  const applyPreset = (presetA: string, presetB: string) => {
    setJobAId(presetA);
    setJobBId(presetB);
  };

  // Helper to calculate percentage difference
  const calculateDelta = (valA: number, valB: number) => {
    if (valA === 0 && valB === 0) return { pct: 0, diff: 0, text: '0.0%' };
    if (valA === 0) return { pct: 100, diff: valB, text: '+100%' };
    const diff = valB - valA;
    const pct = (diff / valA) * 100;
    const sign = pct > 0 ? '+' : '';
    return {
      pct: parseFloat(pct.toFixed(1)),
      diff: parseFloat(diff.toFixed(2)),
      text: `${sign}${pct.toFixed(1)}%`,
    };
  };

  const throughputDelta = calculateDelta(jobA.throughputRps, jobB.throughputRps);
  const durationDelta = calculateDelta(jobA.durationMins, jobB.durationMins);
  const errorRateDelta = calculateDelta(jobA.errorRatePct, jobB.errorRatePct);
  const cpuDelta = calculateDelta(jobA.peakCpuPct, jobB.peakCpuPct);
  const ramDelta = calculateDelta(jobA.peakRamGb, jobB.peakRamGb);

  // Chart 1 Data: Performance Metrics
  const performanceChartData = useMemo(() => {
    return [
      {
        metric: 'Throughput (RPS)',
        [jobA.jobName]: jobA.throughputRps,
        [jobB.jobName]: jobB.throughputRps,
        unit: 'req/sec',
      },
      {
        metric: 'Total Records (in K)',
        [jobA.jobName]: Math.round(jobA.recordCount / 1000),
        [jobB.jobName]: Math.round(jobB.recordCount / 1000),
        unit: 'K records',
      },
      {
        metric: 'Duration (Mins x10)',
        [jobA.jobName]: parseFloat((jobA.durationMins * 10).toFixed(1)),
        [jobB.jobName]: parseFloat((jobB.durationMins * 10).toFixed(1)),
        unit: 'Mins',
      },
      {
        metric: 'Batch Size (Records/Chunk)',
        [jobA.jobName]: jobA.batchSize,
        [jobB.jobName]: jobB.batchSize,
        unit: 'records',
      },
      {
        metric: 'Worker Concurrency',
        [jobA.jobName]: jobA.concurrencyWorkers * 50,
        [jobB.jobName]: jobB.concurrencyWorkers * 50,
        unit: 'workers x50',
      },
    ];
  }, [jobA, jobB]);

  // Chart 2 Data: Error & Quality Rates
  const qualityChartData = useMemo(() => {
    return [
      {
        metric: 'Error Count',
        [jobA.jobName]: jobA.errorCount,
        [jobB.jobName]: jobB.errorCount,
        unit: 'records',
      },
      {
        metric: 'Warning Count',
        [jobA.jobName]: jobA.warningCount,
        [jobB.jobName]: jobB.warningCount,
        unit: 'warnings',
      },
      {
        metric: 'Data Quality Index (%)',
        [jobA.jobName]: jobA.qualityScorePct,
        [jobB.jobName]: jobB.qualityScorePct,
        unit: '%',
      },
      {
        metric: 'Error Rate (x100 %)',
        [jobA.jobName]: parseFloat((jobA.errorRatePct * 100).toFixed(2)),
        [jobB.jobName]: parseFloat((jobB.errorRatePct * 100).toFixed(2)),
        unit: '%',
      },
    ];
  }, [jobA, jobB]);

  // Chart 3 Data: Resource Utilization
  const resourceChartData = useMemo(() => {
    return [
      {
        metric: 'Avg CPU Utilization (%)',
        [jobA.jobName]: jobA.avgCpuPct,
        [jobB.jobName]: jobB.avgCpuPct,
        unit: '%',
      },
      {
        metric: 'Peak CPU Utilization (%)',
        [jobA.jobName]: jobA.peakCpuPct,
        [jobB.jobName]: jobB.peakCpuPct,
        unit: '%',
      },
      {
        metric: 'Avg RAM Memory (GB)',
        [jobA.jobName]: jobA.avgRamGb,
        [jobB.jobName]: jobB.avgRamGb,
        unit: 'GB',
      },
      {
        metric: 'Peak RAM Memory (GB)',
        [jobA.jobName]: jobA.peakRamGb,
        [jobB.jobName]: jobB.peakRamGb,
        unit: 'GB',
      },
      {
        metric: 'Disk I/O (MB/sec)',
        [jobA.jobName]: jobA.diskIoMbSec,
        [jobB.jobName]: jobB.diskIoMbSec,
        unit: 'MB/s',
      },
      {
        metric: 'Network Bandwidth (Mbps)',
        [jobA.jobName]: jobA.networkMbps,
        [jobB.jobName]: jobB.networkMbps,
        unit: 'Mbps',
      },
    ];
  }, [jobA, jobB]);

  // 6-Hour Source vs Target Speed Data
  const sixHourSpeedData = useMemo(() => {
    const hours = Array.from({ length: 6 }).map((_, i) => {
      const hourLabel = i === 0 ? '6h ago' : i === 5 ? 'Now' : `${6 - i}h ago`;
      
      const sourceJobA = Math.max(10, jobA.throughputRps + Math.sin(i) * 50 + (Math.random() - 0.5) * 20);
      const targetJobA = Math.max(10, jobA.throughputRps - 15 + Math.cos(i) * 40 + (Math.random() - 0.5) * 20);

      const sourceJobB = Math.max(10, jobB.throughputRps + Math.cos(i) * 60 + (Math.random() - 0.5) * 30);
      const targetJobB = Math.max(10, jobB.throughputRps - 20 + Math.sin(i) * 55 + (Math.random() - 0.5) * 30);

      return {
        time: hourLabel,
        'Job A Source (Read)': Math.round(sourceJobA),
        'Job A Target (Write)': Math.round(targetJobA),
        'Job B Source (Read)': Math.round(sourceJobB),
        'Job B Target (Write)': Math.round(targetJobB),
      };
    });
    return hours;
  }, [jobA, jobB]);

  // Field-Level Discrepancy Heatmap Matrix Data
  const fieldDiscrepancies = useMemo(() => {
    const sampleFields = [
      { fieldName: 'customer_tax_id', category: 'Compliance', jobADiscrepancyPct: 0.12, jobBDiscrepancyPct: 0.02, severity: 'Low' },
      { fieldName: 'billing_address_zip', category: 'Address', jobADiscrepancyPct: 1.85, jobBDiscrepancyPct: 0.24, severity: 'High' },
      { fieldName: 'total_invoice_amount', category: 'Financial', jobADiscrepancyPct: 0.00, jobBDiscrepancyPct: 0.00, severity: 'Zero' },
      { fieldName: 'created_timestamp_utc', category: 'Temporal', jobADiscrepancyPct: 2.45, jobBDiscrepancyPct: 0.15, severity: 'Critical' },
      { fieldName: 'currency_iso_code', category: 'Financial', jobADiscrepancyPct: 0.05, jobBDiscrepancyPct: 0.01, severity: 'Low' },
      { fieldName: 'phone_e164_format', category: 'Contact', jobADiscrepancyPct: 3.10, jobBDiscrepancyPct: 0.65, severity: 'Critical' },
      { fieldName: 'payment_gateway_ref', category: 'Transaction', jobADiscrepancyPct: 0.42, jobBDiscrepancyPct: 0.08, severity: 'Medium' },
      { fieldName: 'email_hash_sha256', category: 'PII', jobADiscrepancyPct: 0.01, jobBDiscrepancyPct: 0.00, severity: 'Low' },
    ];
    return sampleFields.map(field => {
      // Generate realistic-looking sparkline trend data showing gradual improvement over 10 runs
      const history = Array.from({ length: 10 }).map((_, i) => {
        const baseRate = Math.max(field.jobADiscrepancyPct, field.jobBDiscrepancyPct) + 1.5;
        // Decrease error rate over time (i goes from 0 to 9)
        const trendRate = Math.max(0, baseRate - (i * (baseRate / 10)) + (Math.random() - 0.5) * 0.5);
        return { run: i + 1, rate: parseFloat(trendRate.toFixed(2)) };
      });
      return { ...field, history };
    });
  }, [jobA, jobB]);

  const getHeatmapColor = (pct: number) => {
    if (pct === 0) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (pct < 0.2) return 'bg-sky-50 text-sky-800 border-sky-200';
    if (pct < 1.0) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold animate-pulse';
  };

  // Handle Copy Report
  const handleCopyReport = () => {
    const summaryText = `MIGRATION JOB COMPARISON REPORT
--------------------------------------------------
JOB A: ${jobA.jobName}
- Source/Dest: ${jobA.sourceTarget}
- Records: ${jobA.recordCount.toLocaleString()}
- Duration: ${jobA.durationMins} mins
- Throughput: ${jobA.throughputRps} RPS
- Errors: ${jobA.errorCount} (${jobA.errorRatePct}%)
- Peak CPU / RAM: ${jobA.peakCpuPct}% / ${jobA.peakRamGb} GB

JOB B: ${jobB.jobName}
- Source/Dest: ${jobB.sourceTarget}
- Records: ${jobB.recordCount.toLocaleString()}
- Duration: ${jobB.durationMins} mins
- Throughput: ${jobB.throughputRps} RPS
- Errors: ${jobB.errorCount} (${jobB.errorRatePct}%)
- Peak CPU / RAM: ${jobB.peakCpuPct}% / ${jobB.peakRamGb} GB

COMPARISON DELTAS:
- Throughput Delta: ${throughputDelta.text} (${jobB.throughputRps > jobA.throughputRps ? 'Job B faster' : 'Job A faster'})
- Duration Saved: ${durationDelta.diff < 0 ? `${Math.abs(durationDelta.diff)} mins faster` : `${durationDelta.diff} mins slower`}
- Error Rate Diff: ${jobB.errorRatePct < jobA.errorRatePct ? 'Job B cleaner' : 'Job A cleaner'}
--------------------------------------------------
Generated by Enterprise Data Integration & Migration Platform`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvContent = `Metric,Job A (${jobA.jobName}),Job B (${jobB.jobName}),Variance,Winner
Throughput (RPS),${jobA.throughputRps},${jobB.throughputRps},${throughputDelta.text},${jobB.throughputRps > jobA.throughputRps ? 'Job B' : 'Job A'}
Total Records,${jobA.recordCount},${jobB.recordCount},${calculateDelta(jobA.recordCount, jobB.recordCount).text},${jobB.recordCount > jobA.recordCount ? 'Job B' : 'Job A'}
Duration (Mins),${jobA.durationMins},${jobB.durationMins},${durationDelta.text},${jobB.durationMins < jobA.durationMins ? 'Job B' : 'Job A'}
Error Count,${jobA.errorCount},${jobB.errorCount},${jobB.errorCount - jobA.errorCount},${jobB.errorCount < jobA.errorCount ? 'Job B' : 'Job A'}
Warning Count,${jobA.warningCount},${jobB.warningCount},${jobB.warningCount - jobA.warningCount},${jobB.warningCount < jobA.warningCount ? 'Job B' : 'Job A'}
Quality Score (%),${jobA.qualityScorePct}%,${jobB.qualityScorePct}%,${(jobB.qualityScorePct - jobA.qualityScorePct).toFixed(1)}%,${jobB.qualityScorePct > jobA.qualityScorePct ? 'Job B' : 'Job A'}
Avg CPU (%),${jobA.avgCpuPct}%,${jobB.avgCpuPct}%,${cpuDelta.text},${jobA.avgCpuPct < jobB.avgCpuPct ? 'Job A' : 'Job B'}
Peak RAM (GB),${jobA.peakRamGb}GB,${jobB.peakRamGb}GB,${ramDelta.text},${jobA.peakRamGb < jobB.peakRamGb ? 'Job A' : 'Job B'}
Disk I/O (MB/s),${jobA.diskIoMbSec},${jobB.diskIoMbSec},${(jobB.diskIoMbSec - jobA.diskIoMbSec).toFixed(1)},${jobB.diskIoMbSec > jobA.diskIoMbSec ? 'Job B' : 'Job A'}
Batch Size,${jobA.batchSize},${jobB.batchSize},${jobB.batchSize - jobA.batchSize},N/A
Concurrency Workers,${jobA.concurrencyWorkers},${jobB.concurrencyWorkers},${jobB.concurrencyWorkers - jobA.concurrencyWorkers},N/A`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `job_comparison_${jobA.id}_vs_${jobB.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Structured PDF Report for Stakeholders
  const handleExportPdf = () => {
    const doc = new jsPDF();

    // Top Header Styling (Indigo Banner)
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('MIGRATION JOB BENCHMARKING REPORT', 14, 14);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 135, 14);

    // Document Title & Subtitle
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Side-by-Side Comparison Summary', 14, 30);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Comparative evaluation between Job A (${jobA.jobName}) and Job B (${jobB.jobName})`, 14, 35);

    // 1. Executive Snapshot Grid Table
    autoTable(doc, {
      startY: 40,
      head: [['Attribute / Metric', `Job A: ${jobA.jobName}`, `Job B: ${jobB.jobName}`, 'Variance Delta']],
      body: [
        ['Execution ID', jobA.id, jobB.id, 'N/A'],
        ['Source -> Target', jobA.sourceTarget, jobB.sourceTarget, 'N/A'],
        ['Total Records Migrated', jobA.recordCount.toLocaleString(), jobB.recordCount.toLocaleString(), calculateDelta(jobA.recordCount, jobB.recordCount).text],
        ['Execution Duration', `${jobA.durationMins} mins`, `${jobB.durationMins} mins`, durationDelta.text],
        ['Average Throughput', `${jobA.throughputRps} RPS`, `${jobB.throughputRps} RPS`, throughputDelta.text],
        ['Validation Errors', `${jobA.errorCount} records`, `${jobB.errorCount} records`, `${jobB.errorCount - jobA.errorCount} rec`],
        ['Data Quality Score', `${jobA.qualityScorePct}%`, `${jobB.qualityScorePct}%`, `${(jobB.qualityScorePct - jobA.qualityScorePct).toFixed(1)}%`],
        ['Average CPU Usage', `${jobA.avgCpuPct}%`, `${jobB.avgCpuPct}%`, cpuDelta.text],
        ['Peak Memory Footprint', `${jobA.peakRamGb} GB`, `${jobB.peakRamGb} GB`, ramDelta.text],
        ['Disk I/O Throughput', `${jobA.diskIoMbSec} MB/s`, `${jobB.diskIoMbSec} MB/s`, `${(jobB.diskIoMbSec - jobA.diskIoMbSec).toFixed(1)} MB/s`],
        ['Batch Chunk Size', `${jobA.batchSize} rec`, `${jobB.batchSize} rec`, `${jobB.batchSize - jobA.batchSize} rec`],
        ['Concurrency Pods', `${jobA.concurrencyWorkers} Pods`, `${jobB.concurrencyWorkers} Pods`, `${jobB.concurrencyWorkers - jobA.concurrencyWorkers} Pods`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 50 },
        2: { cellWidth: 50 },
        3: { cellWidth: 40, fontStyle: 'bold' },
      },
    });

    const tableFinalY = (doc as any).lastAutoTable?.finalY || 135;

    // 2. AI Diagnostics & Stakeholder Takeaways Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Key Performance Deltas & Architectural Analysis', 14, tableFinalY + 10);

    autoTable(doc, {
      startY: tableFinalY + 14,
      head: [['Category', 'Analysis & Stakeholder Recommendation']],
      body: [
        [
          'Throughput & Speed',
          jobB.throughputRps > jobA.throughputRps
            ? `Job B achieved ${throughputDelta.text} higher throughput (${jobB.throughputRps} RPS vs ${jobA.throughputRps} RPS) due to increased batch worker pods (${jobB.concurrencyWorkers} pods) and chunk partitioning.`
            : `Job A achieved higher throughput efficiency (${jobA.throughputRps} RPS vs ${jobB.throughputRps} RPS).`
        ],
        [
          'Data Integrity & DLQ',
          jobA.errorCount === 0 && jobB.errorCount === 0
            ? 'Both migration executions maintained 100% data integrity with zero record rejections in DLQ.'
            : jobB.errorCount < jobA.errorCount
            ? `Job B had fewer validation errors (${jobB.errorCount} vs ${jobA.errorCount}), demonstrating superior schema field mapping and pre-cleaning.`
            : `Job A recorded fewer validation errors (${jobA.errorCount} vs ${jobB.errorCount}).`
        ],
        [
          'Hardware Utilization',
          jobA.peakRamGb < jobB.peakRamGb
            ? `Job A operated with a significantly lower memory footprint (${jobA.peakRamGb} GB RAM vs ${jobB.peakRamGb} GB RAM), ideal for cost-optimized Kubernetes worker nodes.`
            : `Job B maintained efficient RAM utilization under heavy concurrency loads.`
        ]
      ],
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45 },
        1: { cellWidth: 145 },
      },
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Enterprise Data Integration & Migration Platform | Stakeholder Confidential Benchmark Report',
        14,
        287
      );
      doc.text(`Page ${i} of ${totalPages}`, 185, 287);
    }

    doc.save(`job_comparison_stakeholder_report_${jobA.id}_vs_${jobB.id}.pdf`);
  };

  return (
    <div id="job-comparison-feature-root" className="space-y-6">
      {/* Feature Header Banner - Batch Engine Light Theme */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/90 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
                Module 14 — Job Comparison Studio
              </span>
              <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Side-by-Side Analytics
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              Finished Migration Job Comparison Studio
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed mt-1">
              Select two completed migration executions to perform side-by-side comparative benchmarking of throughput performance, error rates, data quality scores, and hardware resource utilization using interactive bar charts.
            </p>
          </div>

          {/* Action Header Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-indigo-600" />}
              <span>{copied ? 'Copied Report!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF Report</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('batch-processing')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Batch Engine</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-bold flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Comparison Presets:
          </span>

          <button
            onClick={() => applyPreset('job-101-hist', 'job-102-hist')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
              jobAId === 'job-101-hist' && jobBId === 'job-102-hist'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
            }`}
          >
            ⚡ SAP Single-Threaded vs Multi-Pod K8s
          </button>

          <button
            onClick={() => applyPreset('job-103-hist', 'job-104-hist')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
              jobAId === 'job-103-hist' && jobBId === 'job-104-hist'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
            }`}
          >
            📊 SAP Stock Delta vs Vendor AP
          </button>

          <button
            onClick={() => applyPreset('job-105-hist', 'job-106-hist')}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
              jobAId === 'job-105-hist' && jobBId === 'job-106-hist'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
            }`}
          >
            🚀 Customer Excel vs EU Global Ledger
          </button>
        </div>
      </div>

      {/* DUAL JOB SELECTION CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* JOB A SELECTOR CARD */}
        <div className="md:col-span-5 bg-white p-5 rounded-2xl border-2 border-indigo-500/80 shadow-md relative">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-black rounded-lg border border-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              JOB A (Primary Target)
            </span>
            <span className="text-[11px] font-mono text-slate-400">ID: {jobA.id}</span>
          </div>

          <label className="block text-xs font-bold text-slate-700 mb-1.5">Select First Finished Job:</label>
          <select
            value={jobAId}
            onChange={(e) => setJobAId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {allFinishedJobs.map((j) => (
              <option key={`a-${j.id}`} value={j.id} disabled={j.id === jobBId}>
                {j.jobName} ({j.recordCount.toLocaleString()} recs, {j.throughputRps} RPS)
              </option>
            ))}
          </select>

          {/* Job A Snapshot Metrics */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`snapshot-a-${jobA.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Pipeline:</span>
                <span className="font-extrabold text-slate-900 truncate max-w-[200px]" title={jobA.sourceTarget}>
                  {jobA.sourceTarget}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">THROUGHPUT</span>
                  <strong className="text-indigo-600 font-extrabold text-sm">{jobA.throughputRps} RPS</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">TOTAL RECORDS</span>
                  <strong className="text-slate-800 font-extrabold text-sm">{jobA.recordCount.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">EXECUTION TIME</span>
                  <strong className="text-slate-800 font-bold">{jobA.durationMins} mins</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ERROR RATE</span>
                  <strong className={jobA.errorCount > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {jobA.errorCount} ({jobA.errorRatePct}%)
                  </strong>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* SWAP JOBS INTERACTION CENTER */}
        <div className="md:col-span-2 flex flex-col items-center justify-center py-2">
          <motion.button
            whileHover={{ scale: 1.15, rotate: 180 }}
            whileTap={{ scale: 0.9, rotate: -180 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={handleSwapJobs}
            className="p-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl shadow-lg border border-slate-700 transition-colors cursor-pointer group"
            title="Swap Job A and Job B position"
          >
            <GitCompare className="w-5 h-5" />
          </motion.button>
          <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">VS</span>
        </div>

        {/* JOB B SELECTOR CARD */}
        <div className="md:col-span-5 bg-white p-5 rounded-2xl border-2 border-emerald-500/80 shadow-md relative">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg border border-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              JOB B (Comparison Target)
            </span>
            <span className="text-[11px] font-mono text-slate-400">ID: {jobB.id}</span>
          </div>

          <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Second Finished Job:</label>
          <select
            value={jobBId}
            onChange={(e) => setJobBId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {allFinishedJobs.map((j) => (
              <option key={`b-${j.id}`} value={j.id} disabled={j.id === jobAId}>
                {j.jobName} ({j.recordCount.toLocaleString()} recs, {j.throughputRps} RPS)
              </option>
            ))}
          </select>

          {/* Job B Snapshot Metrics */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`snapshot-b-${jobB.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Pipeline:</span>
                <span className="font-extrabold text-slate-900 truncate max-w-[200px]" title={jobB.sourceTarget}>
                  {jobB.sourceTarget}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">THROUGHPUT</span>
                  <strong className="text-emerald-600 font-extrabold text-sm">{jobB.throughputRps} RPS</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">TOTAL RECORDS</span>
                  <strong className="text-slate-800 font-extrabold text-sm">{jobB.recordCount.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">EXECUTION TIME</span>
                  <strong className="text-slate-800 font-bold">{jobB.durationMins} mins</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ERROR RATE</span>
                  <strong className={jobB.errorCount > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {jobB.errorCount} ({jobB.errorRatePct}%)
                  </strong>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* DELTA SUMMARY STAT CARDS */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`deltas-${jobAId}-${jobBId}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Throughput Winner Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span>Throughput RPS Delta</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900">{throughputDelta.text}</span>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                  throughputDelta.pct >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {throughputDelta.pct >= 0 ? 'Job B Faster' : 'Job A Faster'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
              Job A: <strong className="text-slate-800">{jobA.throughputRps} RPS</strong> vs Job B: <strong className="text-indigo-600">{jobB.throughputRps} RPS</strong>
            </p>
          </div>

          {/* Duration Delta Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span>Duration Saved</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900">
                {Math.abs(durationDelta.diff).toFixed(1)} mins
              </span>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                  durationDelta.diff < 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {durationDelta.diff < 0 ? 'Job B Faster' : 'Job A Faster'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
              Job A: <strong className="text-slate-800">{jobA.durationMins}m</strong> vs Job B: <strong className="text-emerald-600">{jobB.durationMins}m</strong>
            </p>
          </div>

          {/* Error Rate Winner Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span>Error Count Delta</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900">
                {Math.abs(jobB.errorCount - jobA.errorCount)} errors
              </span>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                  jobB.errorCount <= jobA.errorCount ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {jobB.errorCount <= jobA.errorCount ? 'Job B Cleaner' : 'Job A Cleaner'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
              Job A: <strong className="text-slate-800">{jobA.errorCount} errs</strong> vs Job B: <strong className="text-slate-800">{jobB.errorCount} errs</strong>
            </p>
          </div>

          {/* Peak CPU Utilization Delta */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span>Peak CPU Delta</span>
              <Cpu className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900">{cpuDelta.text}</span>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                  cpuDelta.pct <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {cpuDelta.pct <= 0 ? 'Job B Lighter' : 'Job B Heavier'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
              Job A: <strong className="text-slate-800">{jobA.peakCpuPct}%</strong> vs Job B: <strong className="text-indigo-600">{jobB.peakCpuPct}%</strong>
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* COMPARISON METRIC TAB & CHART DISPLAY */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'performance'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Performance & Throughput Bar Chart</span>
            </button>

            <button
              onClick={() => setActiveTab('quality')}
              className={`px-4 py-2 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'quality'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Errors & Quality Rates</span>
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'resources'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4 text-sky-300" />
              <span>Resource Utilization</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-300" />
              <span>Side-by-Side Matrix Table</span>
            </button>

            <button
              onClick={() => setActiveTab('speed6h')}
              className={`px-4 py-2 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'speed6h'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Activity className="w-4 h-4 text-rose-300" />
              <span>6-Hour Processing Speed</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Chart Legend:</span>
            <span className="flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              <span className="w-2.5 h-2.5 rounded bg-indigo-600"></span>
              Job A ({jobA.jobName.substring(0, 18)}...)
            </span>
            <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
              Job B ({jobB.jobName.substring(0, 18)}...)
            </span>
          </div>
        </div>

        {/* TAB CONTENT WITH FRAMER MOTION ANIMATION */}
        <AnimatePresence mode="wait">
          {activeTab === 'performance' && (
            <motion.div
              key={`perf-chart-${jobAId}-${jobBId}`}
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="p-6 space-y-6"
            >
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                  Side-by-Side Migration Throughput & Execution Performance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparing throughput RPS, record scaling, runtime duration, batch chunk size, and worker concurrency.
                </p>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    <Bar key={`barA-perf-${jobAId}`} dataKey={jobA.jobName} fill="#4f46e5" radius={[6, 6, 0, 0]} name={`Job A: ${jobA.jobName}`} isAnimationActive={true} animationDuration={700} animationEasing="ease-out" />
                    <Bar key={`barB-perf-${jobBId}`} dataKey={jobB.jobName} fill="#10b981" radius={[6, 6, 0, 0]} name={`Job B: ${jobB.jobName}`} isAnimationActive={true} animationDuration={700} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'quality' && (
            <motion.div
              key={`quality-chart-${jobAId}-${jobBId}`}
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="p-6 space-y-6"
            >
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Side-by-Side Error Rates, Warnings & Quality Index
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluating error counts, warning frequencies, and overall data sanitization quality scores between runs.
                </p>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qualityChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    <Bar key={`barA-qual-${jobAId}`} dataKey={jobA.jobName} fill="#4f46e5" radius={[6, 6, 0, 0]} name={`Job A: ${jobA.jobName}`} isAnimationActive={true} animationDuration={700} animationEasing="ease-out" />
                    <Bar key={`barB-qual-${jobBId}`} dataKey={jobB.jobName} fill="#10b981" radius={[6, 6, 0, 0]} name={`Job B: ${jobB.jobName}`} isAnimationActive={true} animationDuration={700} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'resources' && (
            <motion.div
              key={`resources-chart-${jobAId}-${jobBId}`}
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="p-6 space-y-6"
            >
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-600" />
                  Side-by-Side Hardware Resource Utilization & Footprint
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparing CPU load percentage, peak RAM memory footprint, disk I/O throughput, and network bandwidth.
                </p>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    <Bar key={`barA-res-${jobAId}`} dataKey={jobA.jobName} fill="#4f46e5" radius={[6, 6, 0, 0]} name={`Job A: ${jobA.jobName}`} isAnimationActive={true} animationDuration={700} animationEasing="ease-out" />
                    <Bar key={`barB-res-${jobBId}`} dataKey={jobB.jobName} fill="#10b981" radius={[6, 6, 0, 0]} name={`Job B: ${jobB.jobName}`} isAnimationActive={true} animationDuration={700} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'speed6h' && (
            <motion.div
              key={`speed6h-chart-${jobAId}-${jobBId}`}
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="p-6 space-y-6"
            >
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-600" />
                  6-Hour Source vs Target Record Processing Speed (RPS)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparative analysis of read (source) vs write (target) throughput over the last 6 hours for both jobs.
                </p>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sixHourSpeedData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit=" RPS" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="Job A Source (Read)" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Job A Target (Write)" stroke="#818cf8" strokeDasharray="5 5" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Job B Source (Read)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Job B Target (Write)" stroke="#34d399" strokeDasharray="5 5" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'matrix' && (
            <motion.div
              key={`matrix-table-${jobAId}-${jobBId}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="p-6 overflow-x-auto"
            >
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-mono uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 rounded-tl-xl">Category / Metric Name</th>
                  <th className="p-3.5 bg-indigo-950 text-indigo-200">Job A ({jobA.jobName.substring(0, 22)}...)</th>
                  <th className="p-3.5 bg-emerald-950 text-emerald-200">Job B ({jobB.jobName.substring(0, 22)}...)</th>
                  <th className="p-3.5">Absolute Variance</th>
                  <th className="p-3.5">Percentage Delta</th>
                  <th className="p-3.5 rounded-tr-xl">Winner / Preferred</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {/* Performance Group */}
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td colSpan={6} className="p-2.5 text-[11px] uppercase tracking-wider text-indigo-700 bg-indigo-50/50">
                    ⚡ Execution & Performance
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-extrabold text-slate-900">Throughput (RPS)</td>
                  <td className="p-3 font-mono text-indigo-700 font-bold">{jobA.throughputRps} req/sec</td>
                  <td className="p-3 font-mono text-emerald-700 font-bold">{jobB.throughputRps} req/sec</td>
                  <td className="p-3 font-mono">{jobB.throughputRps - jobA.throughputRps > 0 ? `+${jobB.throughputRps - jobA.throughputRps}` : jobB.throughputRps - jobA.throughputRps} RPS</td>
                  <td className="p-3 font-mono">{throughputDelta.text}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${jobB.throughputRps >= jobA.throughputRps ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {jobB.throughputRps >= jobA.throughputRps ? 'Job B' : 'Job A'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-extrabold text-slate-900">Total Records Processed</td>
                  <td className="p-3 font-mono">{jobA.recordCount.toLocaleString()}</td>
                  <td className="p-3 font-mono">{jobB.recordCount.toLocaleString()}</td>
                  <td className="p-3 font-mono">{(jobB.recordCount - jobA.recordCount > 0 ? '+' : '') + (jobB.recordCount - jobA.recordCount).toLocaleString()}</td>
                  <td className="p-3 font-mono">{calculateDelta(jobA.recordCount, jobB.recordCount).text}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700">
                      {jobB.recordCount > jobA.recordCount ? 'Job B (Higher)' : jobA.recordCount > jobB.recordCount ? 'Job A (Higher)' : 'Equal'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-extrabold text-slate-900">Duration (Minutes)</td>
                  <td className="p-3 font-mono">{jobA.durationMins} mins</td>
                  <td className="p-3 font-mono">{jobB.durationMins} mins</td>
                  <td className="p-3 font-mono">{durationDelta.diff.toFixed(2)} mins</td>
                  <td className="p-3 font-mono">{durationDelta.text}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${jobB.durationMins <= jobA.durationMins ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {jobB.durationMins <= jobA.durationMins ? 'Job B (Faster)' : 'Job A (Faster)'}
                    </span>
                  </td>
                </tr>

                {/* Quality & Errors Group */}
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td colSpan={6} className="p-2.5 text-[11px] uppercase tracking-wider text-emerald-700 bg-emerald-50/50">
                    🛡️ Data Quality & Error Handling
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-extrabold text-slate-900">Error Count</td>
                  <td className="p-3 font-mono">{jobA.errorCount}</td>
                  <td className="p-3 font-mono">{jobB.errorCount}</td>
                  <td className="p-3 font-mono">{jobB.errorCount - jobA.errorCount > 0 ? `+${jobB.errorCount - jobA.errorCount}` : jobB.errorCount - jobA.errorCount}</td>
                  <td className="p-3 font-mono">{jobA.errorCount > 0 ? `${(((jobB.errorCount - jobA.errorCount) / jobA.errorCount) * 100).toFixed(1)}%` : 'N/A'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${jobB.errorCount <= jobA.errorCount ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {jobB.errorCount <= jobA.errorCount ? 'Job B' : 'Job A'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-extrabold text-slate-900">Error Rate Percentage</td>
                  <td className="p-3 font-mono">{jobA.errorRatePct}%</td>
                  <td className="p-3 font-mono">{jobB.errorRatePct}%</td>
                  <td className="p-3 font-mono">{(jobB.errorRatePct - jobA.errorRatePct > 0 ? '+' : '') + (jobB.errorRatePct - jobA.errorRatePct).toFixed(4)}%</td>
                  <td className="p-3 font-mono">{calculateDelta(jobA.errorRatePct, jobB.errorRatePct).text}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${jobB.errorRatePct <= jobA.errorRatePct ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {jobB.errorRatePct <= jobA.errorRatePct ? 'Job B' : 'Job A'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-extrabold text-slate-900">Data Quality Index Score</td>
                  <td className="p-3 font-mono">{jobA.qualityScorePct}%</td>
                  <td className="p-3 font-mono">{jobB.qualityScorePct}%</td>
                  <td className="p-3 font-mono">{(jobB.qualityScorePct - jobA.qualityScorePct).toFixed(1)}%</td>
                  <td className="p-3 font-mono">{calculateDelta(jobA.qualityScorePct, jobB.qualityScorePct).text}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${jobB.qualityScorePct >= jobA.qualityScorePct ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {jobB.qualityScorePct >= jobA.qualityScorePct ? 'Job B' : 'Job A'}
                    </span>
                  </td>
                </tr>

                {/* Hardware & Compute Group */}
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td colSpan={6} className="p-2.5 text-[11px] uppercase tracking-wider text-sky-700 bg-sky-50/50">
                    💻 Hardware Compute & Memory Footprint
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-extrabold text-slate-900">Peak CPU Utilization</td>
                  <td className="p-3 font-mono">{jobA.peakCpuPct}%</td>
                  <td className="p-3 font-mono">{jobB.peakCpuPct}%</td>
                  <td className="p-3 font-mono">{jobB.peakCpuPct - jobA.peakCpuPct}%</td>
                  <td className="p-3 font-mono">{cpuDelta.text}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${jobA.peakCpuPct <= jobB.peakCpuPct ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {jobA.peakCpuPct <= jobB.peakCpuPct ? 'Job A (Lighter)' : 'Job B (Lighter)'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-extrabold text-slate-900">Peak RAM Memory Usage</td>
                  <td className="p-3 font-mono">{jobA.peakRamGb} GB</td>
                  <td className="p-3 font-mono">{jobB.peakRamGb} GB</td>
                  <td className="p-3 font-mono">{(jobB.peakRamGb - jobA.peakRamGb).toFixed(1)} GB</td>
                  <td className="p-3 font-mono">{ramDelta.text}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${jobA.peakRamGb <= jobB.peakRamGb ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {jobA.peakRamGb <= jobB.peakRamGb ? 'Job A (Efficient)' : 'Job B (Efficient)'}
                    </span>
                  </td>
                </tr>
              </tbody>

              {/* HIGHLIGHTED SUMMARY DELTA ROW (FOOTER) */}
              <tfoot className="border-t-2 border-indigo-600 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white font-mono text-xs">
                <tr>
                  <td colSpan={6} className="p-3 bg-indigo-600 text-white font-extrabold uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      Executive Summary Row — Key Variance Deltas (Source/Target Records, Throughput, Error Rates)
                    </span>
                    <span className="text-[10px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold">
                      Job A vs Job B
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-indigo-900/60">
                  <td className="p-3 font-extrabold text-indigo-200">
                    Source ➔ Target Record Count Delta
                  </td>
                  <td className="p-3 text-slate-300 font-bold">{jobA.recordCount.toLocaleString()} recs</td>
                  <td className="p-3 text-emerald-300 font-bold">{jobB.recordCount.toLocaleString()} recs</td>
                  <td className="p-3 font-extrabold text-white">
                    {(jobB.recordCount - jobA.recordCount > 0 ? '+' : '') + (jobB.recordCount - jobA.recordCount).toLocaleString()} recs
                  </td>
                  <td className="p-3 font-bold text-amber-300">
                    {calculateDelta(jobA.recordCount, jobB.recordCount).text}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[10px] font-extrabold">
                      {jobB.recordCount >= jobA.recordCount ? 'Job B (+ Volume)' : 'Job A (+ Volume)'}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-indigo-900/60">
                  <td className="p-3 font-extrabold text-indigo-200">
                    Throughput Speed Delta (RPS)
                  </td>
                  <td className="p-3 text-slate-300 font-bold">{jobA.throughputRps} RPS</td>
                  <td className="p-3 text-emerald-300 font-bold">{jobB.throughputRps} RPS</td>
                  <td className="p-3 font-extrabold text-white">
                    {jobB.throughputRps - jobA.throughputRps > 0 ? `+${jobB.throughputRps - jobA.throughputRps}` : jobB.throughputRps - jobA.throughputRps} RPS
                  </td>
                  <td className="p-3 font-bold text-emerald-400">
                    {throughputDelta.text}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${jobB.throughputRps >= jobA.throughputRps ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' : 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'}`}>
                      {jobB.throughputRps >= jobA.throughputRps ? 'Job B (+ Speed)' : 'Job A (+ Speed)'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-extrabold text-indigo-200">
                    Error Rate & DLQ Rejections Delta
                  </td>
                  <td className="p-3 text-slate-300 font-bold">{jobA.errorCount} errs ({jobA.errorRatePct}%)</td>
                  <td className="p-3 text-emerald-300 font-bold">{jobB.errorCount} errs ({jobB.errorRatePct}%)</td>
                  <td className="p-3 font-extrabold text-white">
                    {jobB.errorCount - jobA.errorCount > 0 ? `+${jobB.errorCount - jobA.errorCount}` : jobB.errorCount - jobA.errorCount} errs
                  </td>
                  <td className="p-3 font-bold text-sky-300">
                    {(jobB.errorRatePct - jobA.errorRatePct > 0 ? '+' : '') + (jobB.errorRatePct - jobA.errorRatePct).toFixed(4)}% rate
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${jobB.errorCount <= jobA.errorCount ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' : 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'}`}>
                      {jobB.errorCount <= jobA.errorCount ? 'Job B (- Errors)' : 'Job A (- Errors)'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* AI COMPARATIVE INSIGHTS & DIAGNOSTICS - LIGHT THEME */}
      <AnimatePresence mode="wait">
        {showAiRecommendations && (
          <motion.div
            key={`ai-insights-${jobAId}-${jobBId}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="bg-white p-6 rounded-2xl border border-indigo-200/80 shadow-xs relative"
          >
            <button
              onClick={() => setShowAiRecommendations(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/80">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight text-slate-900">
                  AI Automated Diagnostic Analysis &amp; Optimization Takeaways
                </h3>
                <p className="text-xs text-slate-500">Machine learning benchmarking insights comparing execution telemetry.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700 mt-4">
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <span className="text-indigo-800 font-extrabold flex items-center gap-1.5 text-xs">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Throughput Analysis
                </span>
                <p className="leading-relaxed text-slate-600">
                  {jobB.throughputRps > jobA.throughputRps ? (
                    <>
                      <strong className="text-slate-900 font-extrabold">{jobB.jobName}</strong> delivered{' '}
                      <span className="text-emerald-700 font-bold">{throughputDelta.text} higher throughput</span> ({jobB.throughputRps} RPS vs {jobA.throughputRps} RPS) due to higher batch size ({jobB.batchSize} vs {jobA.batchSize}) and {jobB.concurrencyWorkers} worker pods.
                    </>
                  ) : (
                    <>
                      <strong className="text-slate-900 font-extrabold">{jobA.jobName}</strong> achieved higher throughput ({jobA.throughputRps} RPS vs {jobB.throughputRps} RPS) with less batch overhead.
                    </>
                  )}
                </p>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2">
                <span className="text-emerald-800 font-extrabold flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Data Quality &amp; Integrity
                </span>
                <p className="leading-relaxed text-slate-600">
                  {jobA.errorCount === 0 && jobB.errorCount === 0 ? (
                    <>Both migration pipelines achieved 100% data pass rates with zero record rejections in DLQ.</>
                  ) : jobB.errorCount < jobA.errorCount ? (
                    <>
                      <strong className="text-slate-900 font-extrabold">{jobB.jobName}</strong> had cleaner validation ({jobB.errorCount} errors vs {jobA.errorCount} errors), indicating superior schema mapping or pre-validation cleansing.
                    </>
                  ) : (
                    <>
                      <strong className="text-slate-900 font-extrabold">{jobA.jobName}</strong> recorded fewer schema validation errors ({jobA.errorCount} vs {jobB.errorCount}).
                    </>
                  )}
                </p>
              </div>

              <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 space-y-2">
                <span className="text-sky-800 font-extrabold flex items-center gap-1.5 text-xs">
                  <Cpu className="w-4 h-4 text-sky-600" />
                  Resource Efficiency
                </span>
                <p className="leading-relaxed text-slate-600">
                  {jobA.peakRamGb < jobB.peakRamGb ? (
                    <>
                      <strong className="text-slate-900 font-extrabold">{jobA.jobName}</strong> operated with a significantly smaller memory footprint ({jobA.peakRamGb} GB RAM peak vs {jobB.peakRamGb} GB RAM peak), making it cost-efficient for smaller worker pods.
                    </>
                  ) : (
                    <>
                      <strong className="text-slate-900 font-extrabold">{jobB.jobName}</strong> maintained efficient RAM utilization under heavy payload concurrency.
                    </>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIELD-LEVEL DISCREPANCY HEATMAP VISUALIZATION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                <AlertTriangle className="w-4 h-4" />
              </span>
              Field-Level Discrepancy Heatmap Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Heatmap identifying specific source-vs-target field attribute mismatch percentages across schema mappings.
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-slate-400 font-bold">Error Heat Legend:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">0% (Clean)</span>
            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">&lt;0.2% Low</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">&lt;1.0% Med</span>
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300 font-bold">&gt;1.0% High</span>
          </div>
        </div>

        {/* Heatmap Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {fieldDiscrepancies.map((item) => (
            <div
              key={item.fieldName}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2.5 hover:shadow-xs transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900 truncate max-w-[150px]" title={item.fieldName}>
                  {item.fieldName}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                  {item.category}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {/* Job A Heatmap Cell */}
                <button
                  type="button"
                  onClick={() => setSelectedHeatmapField({
                    fieldName: item.fieldName,
                    jobName: jobA.jobName,
                    discrepancyPct: item.jobADiscrepancyPct,
                    sourceConnectorName: jobA.sourceConnectorName,
                    destConnectorName: jobA.destConnectorName,
                  })}
                  className={`p-2 rounded-lg border text-center space-y-0.5 cursor-pointer hover:scale-102 transition-transform ${getHeatmapColor(item.jobADiscrepancyPct)}`}
                >
                  <span className="text-[10px] block opacity-80 uppercase font-bold">Job A Error</span>
                  <strong className="text-xs">{item.jobADiscrepancyPct.toFixed(2)}%</strong>
                </button>

                {/* Job B Heatmap Cell */}
                <button
                  type="button"
                  onClick={() => setSelectedHeatmapField({
                    fieldName: item.fieldName,
                    jobName: jobB.jobName,
                    discrepancyPct: item.jobBDiscrepancyPct,
                    sourceConnectorName: jobB.sourceConnectorName,
                    destConnectorName: jobB.destConnectorName,
                  })}
                  className={`p-2 rounded-lg border text-center space-y-0.5 cursor-pointer hover:scale-102 transition-transform ${getHeatmapColor(item.jobBDiscrepancyPct)}`}
                >
                  <span className="text-[10px] block opacity-80 uppercase font-bold">Job B Error</span>
                  <strong className="text-xs">{item.jobBDiscrepancyPct.toFixed(2)}%</strong>
                </button>
              </div>

              {/* Sparkline Trend Chart */}
              <div className="h-8 mt-2 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={item.history}>
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Comparison Variance bar */}
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-0.5">
                <span>Variance Gap:</span>
                <strong className={item.jobBDiscrepancyPct < item.jobADiscrepancyPct ? 'text-emerald-700' : 'text-slate-800'}>
                  {(item.jobBDiscrepancyPct - item.jobADiscrepancyPct).toFixed(2)}%
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RAW DISCREPANCY RECORD INSPECTION SIDE-PANEL / MODAL */}
      <AnimatePresence>
        {selectedHeatmapField && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="bg-white text-slate-900 w-full max-w-3xl h-full shadow-2xl p-6 border-l border-slate-200 flex flex-col justify-between overflow-hidden space-y-6"
            >
              <div className="space-y-5 flex-1 flex flex-col min-h-0">
                {/* Side-Panel Header */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 font-mono flex items-center gap-2">
                        Live Inspector: {selectedHeatmapField.fieldName}
                        {isStreaming && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {selectedHeatmapField.jobName} • Error Rate: {selectedHeatmapField.discrepancyPct}%
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedHeatmapField(null)}
                    className="text-slate-400 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Field Details */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Field Attribute:</span>
                    <strong className="text-amber-600">{selectedHeatmapField.fieldName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mismatched Records Rate:</span>
                    <strong className="text-rose-600">{selectedHeatmapField.discrepancyPct}%</strong>
                  </div>
                </div>

                {/* Live Data Stream */}
                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      Live Transformation Stream
                    </h4>
                    <button
                      onClick={() => setIsStreaming(!isStreaming)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs ${
                        isStreaming 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isStreaming ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          Pause Stream
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          Resume Stream
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex-1 overflow-hidden border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col font-mono text-xs">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-3 p-3 border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                      <div className="col-span-2">Time</div>
                      <div className="col-span-4 truncate" title={selectedHeatmapField.sourceConnectorName}>Source: {selectedHeatmapField.sourceConnectorName || 'Source'}</div>
                      <div className="col-span-2 flex justify-center"><ArrowRight className="w-3.5 h-3.5 text-slate-600" /></div>
                      <div className="col-span-4 truncate" title={selectedHeatmapField.destConnectorName}>Target: {selectedHeatmapField.destConnectorName || 'Target'}</div>
                    </div>
                    
                    {/* Stream Data */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2">
                      <AnimatePresence>
                        {liveStreamData.map((record) => (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`grid grid-cols-12 gap-3 p-2.5 rounded-lg border items-center shadow-xs ${
                              record.status === 'mismatch'
                                ? 'bg-rose-50 border-rose-200 text-rose-900'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="col-span-2 text-[10px] text-slate-400">
                              {record.timestamp}
                            </div>
                            <div className="col-span-4 truncate">
                              <span className={record.status === 'mismatch' ? 'text-emerald-700 font-bold' : ''}>
                                {record.sourceVal}
                              </span>
                            </div>
                            <div className="col-span-2 flex justify-center">
                              {record.status === 'mismatch' ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                              ) : (
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                            <div className="col-span-4 truncate">
                              <span className={record.status === 'mismatch' ? 'text-rose-600 font-bold' : ''}>
                                {record.targetVal}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {liveStreamData.length === 0 && (
                        <div className="flex items-center justify-center h-24 text-slate-500 italic">
                          Waiting for stream...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedHeatmapField(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs border border-slate-300"
                >
                  Close Stream
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobComparisonView;
