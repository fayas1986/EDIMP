import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  ArrowRight,
  ExternalLink,
  Filter,
  Search,
  Zap,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Layers,
  ChevronRight,
  ShieldAlert,
  Info,
  SlidersHorizontal,
  X,
  Radio,
  BarChart2,
  Gauge,
  Maximize2,
  Flame,
  Timer,
  Hourglass,
  Calendar,
  ArrowUpRight,
  TrendingDown,
  Terminal,
  Download,
  Check,
  History,
  GitCompare,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Minus,
  ChevronDown,
} from 'lucide-react';
import { Connector, MigrationJob } from '../types';
import { ConnectorErrorInspectionModal } from './ConnectorErrorInspectionModal';
import { ErrorTrajectorySparkline, SparklineTimeHorizon } from './ErrorTrajectorySparkline';

export const getEntityTrajectoryData = (
  entity: HeatmapPipelineEntity,
  horizon: SparklineTimeHorizon
): number[] => {
  const full24h =
    entity.errorTrajectory24h && entity.errorTrajectory24h.length >= 24
      ? entity.errorTrajectory24h
      : [2.1, 2.3, 2.5, 2.7, 3.0, 3.2, 3.5, 3.8, 4.0, 4.2, 4.5, 4.8, 5.0, 5.2, 5.5, 5.8, 6.0, 6.2, 6.5, 6.8, 7.0, 7.2, 7.5, entity.errorRatePercent];

  if (horizon === '24h') {
    return full24h;
  }
  if (horizon === '12h') {
    return full24h.slice(-12);
  }
  if (horizon === '6h') {
    return full24h.slice(-6);
  }
  if (horizon === '1h') {
    // Generate 7 granular sample points over the last 60 minutes ending at the current error rate
    const lastPoint = entity.errorRatePercent;
    const prevPoint = full24h[full24h.length - 2] ?? lastPoint * 0.95;
    const diff = lastPoint - prevPoint;
    const points: number[] = [];
    const steps = 7; // -60m, -50m, -40m, -30m, -20m, -10m, Now
    for (let i = 0; i < steps; i++) {
      const progress = i / (steps - 1);
      const hash = (entity.id.charCodeAt(i % entity.id.length) % 5) - 2;
      const jitter = hash * 0.015 * (1 - progress);
      const val = Math.max(0.01, +(prevPoint + diff * progress + jitter).toFixed(2));
      points.push(val);
    }
    points[points.length - 1] = lastPoint;
    return points;
  }
  return full24h;
};

export interface HeatmapPipelineEntity {
  id: string;
  pipelineName: string;
  sourceConnectorId: string;
  sourceConnectorName: string;
  sourceType: string;
  destConnectorId: string;
  destConnectorName: string;
  destType: string;
  errorRatePercent: number;
  totalErrors: number;
  p95LatencyMs: number;
  avgLatencyMs: number;
  throughputRecSec: number;
  status: 'Critical' | 'Warning' | 'Info' | 'Healthy';
  riskScore: number; // 0 - 100
  topErrorCategory: string;
  topErrorMessage: string;
  unresolvedExceptions: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  lastIncidentAt: string;
  errorTrajectory24h: number[]; // 24 hourly data points showing error rate trajectory over last 24 hours

  // Historical Baseline (Previous Week) for Delta Comparisons
  prevWeekErrorRatePercent: number;
  prevWeekTotalErrors: number;
  prevWeekP95LatencyMs: number;
  prevWeekAvgLatencyMs: number;
  prevWeekThroughputRecSec: number;
  prevWeekRiskScore: number;
  prevWeekPredictiveImpactScore: number;
  prevWeekProjectedDelayHours: number;
  
  // Predictive Impact on Downstream Migration Timeframe
  datasetTotalRecords: number;
  baseEstimatedHours: number;
  projectedDelayHours: number; // calculated delay impact
  predictiveImpactScore: number; // 0 - 100 calculated impact score
  impactSeverity: 'Extreme' | 'High' | 'Moderate' | 'Low' | 'Negligible';
  downstreamCascadeCount: number; // number of dependent staging / reporting tables affected
  remediationTimeSavings: string; // e.g. "Save ~4.2 hrs"
  isPrimaryBottleneck?: boolean; // Identified by predictive engine as primary cause of downstream delays
}

const DEFAULT_HEATMAP_ENTITIES: HeatmapPipelineEntity[] = [
  {
    id: 'pipe-sap-d365',
    pipelineName: 'SAP ECC to Dynamics 365 BC',
    sourceConnectorId: 'conn-sap',
    sourceConnectorName: 'SAP ECC (Production)',
    sourceType: 'ERP',
    destConnectorId: 'conn-d365',
    destConnectorName: 'Dynamics 365 BC',
    destType: 'Cloud ERP',
    errorRatePercent: 8.74,
    totalErrors: 14820,
    p95LatencyMs: 640,
    avgLatencyMs: 380,
    throughputRecSec: 340,
    status: 'Critical',
    riskScore: 92,
    topErrorCategory: 'API Rate Limit & Throttling',
    topErrorMessage: 'HTTP 429 Too Many Requests on Customer Ledger Entries bulk ingest',
    unresolvedExceptions: 312,
    trend: 'increasing',
    lastIncidentAt: '2 mins ago',
    errorTrajectory24h: [4.2, 4.5, 4.8, 5.1, 5.0, 5.3, 5.8, 6.4, 7.1, 7.8, 8.2, 8.9, 9.4, 9.1, 8.6, 8.4, 8.8, 9.2, 9.5, 9.1, 8.9, 8.8, 8.7, 8.74],
    prevWeekErrorRatePercent: 5.12,
    prevWeekTotalErrors: 8200,
    prevWeekP95LatencyMs: 410,
    prevWeekAvgLatencyMs: 260,
    prevWeekThroughputRecSec: 520,
    prevWeekRiskScore: 68,
    prevWeekPredictiveImpactScore: 70,
    prevWeekProjectedDelayHours: 3.1,
    datasetTotalRecords: 4850000,
    baseEstimatedHours: 6.5,
    projectedDelayHours: 5.4,
    predictiveImpactScore: 94,
    impactSeverity: 'Extreme',
    downstreamCascadeCount: 7,
    remediationTimeSavings: 'Saves 5.4 hrs with connection pool scaling',
    isPrimaryBottleneck: true,
  },
  {
    id: 'pipe-sfdc-dataverse',
    pipelineName: 'Salesforce CRM to Dataverse',
    sourceConnectorId: 'conn-sfdc',
    sourceConnectorName: 'Salesforce Enterprise',
    sourceType: 'CRM',
    destConnectorId: 'conn-dataverse',
    destConnectorName: 'Microsoft Dataverse',
    destType: 'Dataverse',
    errorRatePercent: 4.15,
    totalErrors: 6240,
    p95LatencyMs: 290,
    avgLatencyMs: 145,
    throughputRecSec: 1850,
    status: 'Warning',
    riskScore: 68,
    topErrorCategory: 'Schema Coercion / Nullable',
    topErrorMessage: 'Tax ID string truncation & missing ISO country code on Contact records',
    unresolvedExceptions: 89,
    trend: 'stable',
    lastIncidentAt: '12 mins ago',
    errorTrajectory24h: [4.8, 4.7, 4.6, 4.5, 4.4, 4.2, 4.1, 4.3, 4.6, 4.8, 4.5, 4.3, 4.2, 4.0, 3.9, 4.1, 4.2, 4.4, 4.5, 4.3, 4.2, 4.1, 4.2, 4.15],
    prevWeekErrorRatePercent: 4.80,
    prevWeekTotalErrors: 7100,
    prevWeekP95LatencyMs: 340,
    prevWeekAvgLatencyMs: 170,
    prevWeekThroughputRecSec: 1650,
    prevWeekRiskScore: 74,
    prevWeekPredictiveImpactScore: 72,
    prevWeekProjectedDelayHours: 2.6,
    datasetTotalRecords: 2600000,
    baseEstimatedHours: 3.2,
    projectedDelayHours: 2.1,
    predictiveImpactScore: 64,
    impactSeverity: 'High',
    downstreamCascadeCount: 4,
    remediationTimeSavings: 'Saves 2.1 hrs with schema coercion hotfix',
    isPrimaryBottleneck: false,
  },
  {
    id: 'pipe-snowflake-onelake',
    pipelineName: 'Snowflake to Fabric OneLake',
    sourceConnectorId: 'conn-snowflake',
    sourceConnectorName: 'Snowflake Analytics',
    sourceType: 'Data Warehouse',
    destConnectorId: 'conn-onelake',
    destConnectorName: 'Fabric OneLake',
    destType: 'Lakehouse',
    errorRatePercent: 0.12,
    totalErrors: 42,
    p95LatencyMs: 48,
    avgLatencyMs: 26,
    throughputRecSec: 9200,
    status: 'Healthy',
    riskScore: 8,
    topErrorCategory: 'Minor Timestamp Precision',
    topErrorMessage: 'Microsecond rounding applied to telemetry log timestamps',
    unresolvedExceptions: 2,
    trend: 'decreasing',
    lastIncidentAt: '2 hours ago',
    errorTrajectory24h: [0.35, 0.30, 0.28, 0.25, 0.22, 0.19, 0.15, 0.14, 0.12, 0.10, 0.08, 0.09, 0.11, 0.12, 0.10, 0.08, 0.07, 0.09, 0.10, 0.11, 0.13, 0.12, 0.11, 0.12],
    prevWeekErrorRatePercent: 0.35,
    prevWeekTotalErrors: 120,
    prevWeekP95LatencyMs: 58,
    prevWeekAvgLatencyMs: 32,
    prevWeekThroughputRecSec: 8700,
    prevWeekRiskScore: 14,
    prevWeekPredictiveImpactScore: 12,
    prevWeekProjectedDelayHours: 0.2,
    datasetTotalRecords: 18400000,
    baseEstimatedHours: 4.8,
    projectedDelayHours: 0.1,
    predictiveImpactScore: 6,
    impactSeverity: 'Negligible',
    downstreamCascadeCount: 1,
    remediationTimeSavings: 'Zero material schedule deviation',
    isPrimaryBottleneck: false,
  },
  {
    id: 'pipe-oracle-fno',
    pipelineName: 'Oracle EBS to Dynamics 365 F&O',
    sourceConnectorId: 'conn-oracle',
    sourceConnectorName: 'Oracle EBS (GL)',
    sourceType: 'Legacy DB',
    destConnectorId: 'conn-fno',
    destConnectorName: 'Dynamics 365 F&O',
    destType: 'Cloud ERP',
    errorRatePercent: 6.92,
    totalErrors: 9810,
    p95LatencyMs: 820,
    avgLatencyMs: 510,
    throughputRecSec: 420,
    status: 'Critical',
    riskScore: 88,
    topErrorCategory: 'Database Lock Timeout',
    topErrorMessage: 'Deadlock detection during nocturnal GL voucher batch commits',
    unresolvedExceptions: 204,
    trend: 'increasing',
    lastIncidentAt: '8 mins ago',
    errorTrajectory24h: [3.2, 3.0, 2.8, 2.9, 3.1, 3.5, 4.2, 5.0, 5.8, 6.6, 7.4, 7.9, 8.1, 7.6, 7.2, 6.8, 6.5, 6.9, 7.3, 7.5, 7.2, 7.0, 6.9, 6.92],
    prevWeekErrorRatePercent: 3.80,
    prevWeekTotalErrors: 5100,
    prevWeekP95LatencyMs: 540,
    prevWeekAvgLatencyMs: 330,
    prevWeekThroughputRecSec: 610,
    prevWeekRiskScore: 62,
    prevWeekPredictiveImpactScore: 60,
    prevWeekProjectedDelayHours: 3.4,
    datasetTotalRecords: 6100000,
    baseEstimatedHours: 8.0,
    projectedDelayHours: 6.2,
    predictiveImpactScore: 91,
    impactSeverity: 'Extreme',
    downstreamCascadeCount: 9,
    remediationTimeSavings: 'Saves 6.2 hrs with read-committed isolation',
    isPrimaryBottleneck: true,
  },
  {
    id: 'pipe-mongo-bc',
    pipelineName: 'MongoDB Catalog to Business Central',
    sourceConnectorId: 'conn-mongo',
    sourceConnectorName: 'MongoDB Atlas',
    sourceType: 'Document DB',
    destConnectorId: 'conn-d365',
    destConnectorName: 'Dynamics 365 BC',
    destType: 'Cloud ERP',
    errorRatePercent: 3.42,
    totalErrors: 3100,
    p95LatencyMs: 310,
    avgLatencyMs: 160,
    throughputRecSec: 2100,
    status: 'Warning',
    riskScore: 54,
    topErrorCategory: 'Nested Variant Unpacking',
    topErrorMessage: 'Array unnesting overflow on dynamic product specification attributes',
    unresolvedExceptions: 48,
    trend: 'increasing',
    lastIncidentAt: '18 mins ago',
    errorTrajectory24h: [2.0, 2.1, 2.2, 2.3, 2.4, 2.6, 2.8, 3.0, 3.1, 3.2, 3.4, 3.5, 3.6, 3.5, 3.3, 3.2, 3.3, 3.4, 3.6, 3.5, 3.4, 3.4, 3.4, 3.42],
    prevWeekErrorRatePercent: 2.10,
    prevWeekTotalErrors: 1900,
    prevWeekP95LatencyMs: 230,
    prevWeekAvgLatencyMs: 125,
    prevWeekThroughputRecSec: 2400,
    prevWeekRiskScore: 38,
    prevWeekPredictiveImpactScore: 36,
    prevWeekProjectedDelayHours: 0.7,
    datasetTotalRecords: 1450000,
    baseEstimatedHours: 2.4,
    projectedDelayHours: 1.3,
    predictiveImpactScore: 52,
    impactSeverity: 'Moderate',
    downstreamCascadeCount: 3,
    remediationTimeSavings: 'Saves 1.3 hrs with recursive payload flattener',
    isPrimaryBottleneck: false,
  },
  {
    id: 'pipe-postgres-synapse',
    pipelineName: 'PostgreSQL Orders to Azure Synapse',
    sourceConnectorId: 'conn-postgres',
    sourceConnectorName: 'PostgreSQL DB (Cluster-01)',
    sourceType: 'Relational DB',
    destConnectorId: 'conn-synapse',
    destConnectorName: 'Azure Synapse Analytics',
    destType: 'Analytics',
    errorRatePercent: 0.28,
    totalErrors: 96,
    p95LatencyMs: 62,
    avgLatencyMs: 38,
    throughputRecSec: 4800,
    status: 'Healthy',
    riskScore: 12,
    topErrorCategory: 'Transient Network Jitter',
    topErrorMessage: 'Connection socket reconnect resolved within retry threshold',
    unresolvedExceptions: 0,
    trend: 'stable',
    lastIncidentAt: '1 day ago',
    errorTrajectory24h: [0.32, 0.31, 0.30, 0.29, 0.28, 0.27, 0.26, 0.28, 0.30, 0.29, 0.28, 0.26, 0.25, 0.27, 0.28, 0.29, 0.30, 0.28, 0.27, 0.26, 0.27, 0.28, 0.28, 0.28],
    prevWeekErrorRatePercent: 0.32,
    prevWeekTotalErrors: 110,
    prevWeekP95LatencyMs: 68,
    prevWeekAvgLatencyMs: 42,
    prevWeekThroughputRecSec: 4600,
    prevWeekRiskScore: 15,
    prevWeekPredictiveImpactScore: 14,
    prevWeekProjectedDelayHours: 0.3,
    datasetTotalRecords: 9200000,
    baseEstimatedHours: 3.6,
    projectedDelayHours: 0.2,
    predictiveImpactScore: 11,
    impactSeverity: 'Low',
    downstreamCascadeCount: 2,
    remediationTimeSavings: 'Within normal ±5m tolerance envelope',
    isPrimaryBottleneck: false,
  },
  {
    id: 'pipe-servicenow-dataverse',
    pipelineName: 'ServiceNow ITSM to Dataverse',
    sourceConnectorId: 'conn-snow',
    sourceConnectorName: 'ServiceNow Enterprise',
    sourceType: 'ITSM',
    destConnectorId: 'conn-dataverse',
    destConnectorName: 'Microsoft Dataverse',
    destType: 'Dataverse',
    errorRatePercent: 1.85,
    totalErrors: 820,
    p95LatencyMs: 240,
    avgLatencyMs: 110,
    throughputRecSec: 890,
    status: 'Info',
    riskScore: 24,
    topErrorCategory: 'Missing Lookup Reference',
    topErrorMessage: 'SysId reference not found in staging user directory (Non-blocking warning)',
    unresolvedExceptions: 14,
    trend: 'decreasing',
    lastIncidentAt: '45 mins ago',
    errorTrajectory24h: [3.4, 3.3, 3.1, 2.9, 2.8, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.8, 1.9, 2.0, 1.9, 1.8, 1.8, 1.9, 1.8, 1.85],
    prevWeekErrorRatePercent: 3.40,
    prevWeekTotalErrors: 1520,
    prevWeekP95LatencyMs: 320,
    prevWeekAvgLatencyMs: 160,
    prevWeekThroughputRecSec: 740,
    prevWeekRiskScore: 48,
    prevWeekPredictiveImpactScore: 45,
    prevWeekProjectedDelayHours: 1.2,
    datasetTotalRecords: 850000,
    baseEstimatedHours: 1.8,
    projectedDelayHours: 0.5,
    predictiveImpactScore: 26,
    impactSeverity: 'Low',
    downstreamCascadeCount: 2,
    remediationTimeSavings: 'Saves 30m with pre-cached reference dictionary',
    isPrimaryBottleneck: false,
  },
  {
    id: 'pipe-mysql-blob',
    pipelineName: 'MySQL Legacy DB to Azure Blob Storage',
    sourceConnectorId: 'conn-mysql',
    sourceConnectorName: 'MySQL Warehouse (v5.7)',
    sourceType: 'Legacy DB',
    destConnectorId: 'conn-blob',
    destConnectorName: 'Azure Blob Cold Storage',
    destType: 'Object Storage',
    errorRatePercent: 5.40,
    totalErrors: 7320,
    p95LatencyMs: 510,
    avgLatencyMs: 280,
    throughputRecSec: 640,
    status: 'Critical',
    riskScore: 78,
    topErrorCategory: 'Character Encoding Mismatch',
    topErrorMessage: 'Latin1 to UTF-8 emoji parsing error on customer review blob archives',
    unresolvedExceptions: 168,
    trend: 'increasing',
    lastIncidentAt: '5 mins ago',
    errorTrajectory24h: [2.5, 2.6, 2.7, 2.6, 2.8, 3.0, 3.2, 3.5, 3.9, 4.2, 4.6, 4.9, 5.2, 5.5, 5.8, 5.7, 5.4, 5.2, 5.3, 5.5, 5.6, 5.5, 5.4, 5.40],
    prevWeekErrorRatePercent: 2.80,
    prevWeekTotalErrors: 3800,
    prevWeekP95LatencyMs: 360,
    prevWeekAvgLatencyMs: 200,
    prevWeekThroughputRecSec: 880,
    prevWeekRiskScore: 46,
    prevWeekPredictiveImpactScore: 48,
    prevWeekProjectedDelayHours: 2.2,
    datasetTotalRecords: 5400000,
    baseEstimatedHours: 7.2,
    projectedDelayHours: 4.8,
    predictiveImpactScore: 82,
    impactSeverity: 'High',
    downstreamCascadeCount: 5,
    remediationTimeSavings: 'Saves 4.8 hrs with streaming byte transcoding',
    isPrimaryBottleneck: true,
  },
];

const SOURCE_SYSTEMS = [
  'SAP ECC (Production)',
  'Salesforce Enterprise',
  'Snowflake Analytics',
  'Oracle EBS (GL)',
  'MongoDB Atlas',
  'PostgreSQL DB (Cluster-01)',
  'ServiceNow Enterprise',
  'MySQL Warehouse (v5.7)',
];

const TARGET_SYSTEMS = [
  'Dynamics 365 BC',
  'Microsoft Dataverse',
  'Fabric OneLake',
  'Dynamics 365 F&O',
  'Azure Synapse Analytics',
  'Azure Blob Cold Storage',
];

interface PipelineErrorLatencyHeatmapWidgetProps {
  connectors?: Connector[];
  jobs?: MigrationJob[];
  onNavigateTab: (tab: string) => void;
  autoRefreshEnabled?: boolean;
  refreshIntervalSeconds?: number;
  refreshTriggerTimestamp?: number;
}

export const PipelineErrorLatencyHeatmapWidget: React.FC<PipelineErrorLatencyHeatmapWidgetProps> = ({
  connectors = [],
  jobs = [],
  onNavigateTab,
  autoRefreshEnabled: parentAutoRefreshEnabled,
  refreshIntervalSeconds: parentRefreshIntervalSeconds,
  refreshTriggerTimestamp: parentRefreshTriggerTimestamp,
}) => {
  const [entities, setEntities] = useState<HeatmapPipelineEntity[]>(DEFAULT_HEATMAP_ENTITIES);
  const [metricMode, setMetricMode] = useState<'errorSeverity' | 'predictiveImpact' | 'errorRate' | 'latency' | 'riskScore'>('errorSeverity');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'matrix'>('table');
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'warning' | 'info' | 'healthy'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<HeatmapPipelineEntity | null>(DEFAULT_HEATMAP_ENTITIES[0]);
  const [inspectingEntity, setInspectingEntity] = useState<HeatmapPipelineEntity | null>(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showHistoricalComparison, setShowHistoricalComparison] = useState(true);
  const [timeHorizon, setTimeHorizon] = useState<SparklineTimeHorizon>('24h');

  const handleSelectMetric = (mode: 'errorSeverity' | 'predictiveImpact' | 'errorRate' | 'latency' | 'riskScore') => {
    if (metricMode === mode) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setMetricMode(mode);
      setSortDirection('desc');
    }
  };

  // Widget-level polling state (fallback or synchronized with Dashboard parent)
  const [localAutoRefresh, setLocalAutoRefresh] = useState<boolean>(true);
  const [localIntervalSeconds, setLocalIntervalSeconds] = useState<number>(30);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toLocaleTimeString());

  // Determine active auto-refresh state
  const isAutoRefreshActive = parentAutoRefreshEnabled !== undefined ? parentAutoRefreshEnabled : localAutoRefresh;
  const activeInterval = parentRefreshIntervalSeconds !== undefined ? parentRefreshIntervalSeconds : localIntervalSeconds;

  // React to parent refresh pulses if provided
  useEffect(() => {
    if (parentRefreshTriggerTimestamp) {
      handleRefreshData(false);
    }
  }, [parentRefreshTriggerTimestamp]);

  // Standalone periodic polling when no parent timestamp is driving it
  useEffect(() => {
    if (parentRefreshTriggerTimestamp !== undefined) return;
    if (!isAutoRefreshActive) return;

    const intervalId = setInterval(() => {
      handleRefreshData(false);
    }, activeInterval * 1000);

    return () => clearInterval(intervalId);
  }, [isAutoRefreshActive, activeInterval, parentRefreshTriggerTimestamp]);

  // Helper to derive visual status that matches cell color logic to prevent theme clashes
  const getVisualStatus = (entity: HeatmapPipelineEntity) => {
    if (entity.status === 'Critical' || entity.errorRatePercent >= 5.0) return 'Critical';
    if (entity.status === 'Warning' || entity.errorRatePercent >= 2.0) return 'Warning';
    if (entity.status === 'Info' || entity.unresolvedExceptions > 0) return 'Info';
    return 'Healthy';
  };

  const handleOpenInspection = (entity: HeatmapPipelineEntity) => {
    setSelectedEntity(entity);
    setInspectingEntity(entity);
    setIsInspectionModalOpen(true);
  };

  // Helper calculation for deltas against previous week
  const getErrorRateDelta = (current: number, prev: number) => {
    const diff = +(current - prev).toFixed(2);
    const percentChange = prev > 0 ? Math.round(((current - prev) / prev) * 100) : 0;
    return { diff, percentChange, isRegressed: diff > 0.05, isImproved: diff < -0.05 };
  };

  const getLatencyDelta = (current: number, prev: number) => {
    const diff = current - prev;
    const percentChange = prev > 0 ? Math.round(((current - prev) / prev) * 100) : 0;
    return { diff, percentChange, isRegressed: diff > 15, isImproved: diff < -15 };
  };

  const getImpactDelta = (current: number, prev: number) => {
    const diff = current - prev;
    return { diff, isRegressed: diff > 2, isImproved: diff < -2 };
  };

  // Computed summary stats
  const criticalCount = useMemo(() => entities.filter((e) => e.status === 'Critical').length, [entities]);
  const warningCount = useMemo(() => entities.filter((e) => e.status === 'Warning').length, [entities]);
  const infoCount = useMemo(() => entities.filter((e) => e.status === 'Info').length, [entities]);
  const healthyCount = useMemo(() => entities.filter((e) => e.status === 'Healthy').length, [entities]);
  
  // Total cumulative downstream delay calculated across all pipelines
  const totalCumulativeDelayHours = useMemo(() => {
    return +entities.reduce((sum, e) => sum + e.projectedDelayHours, 0).toFixed(1);
  }, [entities]);

  const avgPredictiveImpact = useMemo(() => {
    return Math.round(entities.reduce((sum, e) => sum + e.predictiveImpactScore, 0) / entities.length);
  }, [entities]);

  // Filtered and dynamically sorted entities list based on active metricMode
  const filteredEntities = useMemo(() => {
    const list = entities.filter((entity) => {
      if (filterStatus === 'critical' && entity.status !== 'Critical') return false;
      if (filterStatus === 'warning' && entity.status !== 'Warning') return false;
      if (filterStatus === 'info' && entity.status !== 'Info') return false;
      if (filterStatus === 'healthy' && entity.status !== 'Healthy') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = entity.pipelineName.toLowerCase().includes(q);
        const matchesSource = entity.sourceConnectorName.toLowerCase().includes(q);
        const matchesDest = entity.destConnectorName.toLowerCase().includes(q);
        const matchesCat = entity.topErrorCategory.toLowerCase().includes(q);
        if (!matchesName && !matchesSource && !matchesDest && !matchesCat) return false;
      }
      return true;
    });

    const severityRank: Record<string, number> = { Critical: 4, Warning: 3, Info: 2, Healthy: 1 };

    return [...list].sort((a, b) => {
      let diff = 0;
      if (metricMode === 'errorSeverity') {
        const rankDiff = (severityRank[b.status] || 0) - (severityRank[a.status] || 0);
        if (rankDiff !== 0) {
          diff = rankDiff;
        } else {
          diff = b.errorRatePercent - a.errorRatePercent;
        }
      } else if (metricMode === 'predictiveImpact') {
        if (b.isPrimaryBottleneck !== a.isPrimaryBottleneck) {
          diff = b.isPrimaryBottleneck ? 1 : -1;
        } else {
          diff = b.predictiveImpactScore - a.predictiveImpactScore;
        }
      } else if (metricMode === 'errorRate') {
        diff = b.errorRatePercent - a.errorRatePercent;
      } else if (metricMode === 'latency') {
        diff = b.p95LatencyMs - a.p95LatencyMs;
      } else if (metricMode === 'riskScore') {
        diff = b.riskScore - a.riskScore;
      }

      return sortDirection === 'desc' ? diff : -diff;
    });
  }, [entities, filterStatus, searchQuery, metricMode, sortDirection]);

  // Dynamic cell color generator based on error severity and metrics
  const getCellColor = (entity: HeatmapPipelineEntity | undefined, mode: 'errorSeverity' | 'errorRate' | 'latency' | 'predictiveImpact' | 'riskScore') => {
    if (!entity) return 'bg-slate-100/60 border-slate-200 text-slate-600';

    // Priority 1: Error Severity mode provides at-a-glance health coding (Critical, Warning, Info, Healthy)
    if (mode === 'errorSeverity') {
      if (entity.status === 'Critical' || entity.errorRatePercent >= 5.0) {
        return 'bg-rose-500 text-white border-rose-600 shadow-sm';
      }
      if (entity.status === 'Warning' || entity.errorRatePercent >= 2.0) {
        return 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs';
      }
      if (entity.status === 'Info' || entity.unresolvedExceptions > 0) {
        return 'bg-sky-500 text-white border-sky-600 shadow-xs';
      }
      return 'bg-emerald-500 text-white border-emerald-600 shadow-xs';
    }

    if (mode === 'predictiveImpact') {
      if (entity.predictiveImpactScore >= 80) {
        return 'bg-rose-500 text-white border-rose-600 shadow-sm';
      }
      if (entity.predictiveImpactScore >= 50) {
        return 'bg-amber-400 text-slate-950 border-amber-500';
      }
      if (entity.predictiveImpactScore >= 20) {
        return 'bg-amber-100 text-amber-900 border-amber-200';
      }
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }

    if (mode === 'errorRate') {
      if (entity.errorRatePercent >= 5.0) {
        return 'bg-rose-500 text-white border-rose-600 shadow-sm';
      }
      if (entity.errorRatePercent >= 2.0) {
        return 'bg-amber-400 text-slate-950 border-amber-500';
      }
      if (entity.errorRatePercent > 0.5) {
        return 'bg-amber-100 text-amber-900 border-amber-200';
      }
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }

    if (mode === 'latency') {
      if (entity.p95LatencyMs >= 500) {
        return 'bg-rose-500 text-white border-rose-600 shadow-sm';
      }
      if (entity.p95LatencyMs >= 200) {
        return 'bg-amber-400 text-slate-950 border-amber-500';
      }
      if (entity.p95LatencyMs >= 100) {
        return 'bg-amber-100 text-amber-900 border-amber-200';
      }
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }

    // Risk score mode
    if (entity.riskScore >= 75) {
      return 'bg-rose-500 text-white border-rose-600 shadow-sm';
    }
    if (entity.riskScore >= 40) {
      return 'bg-amber-400 text-slate-950 border-amber-500';
    }
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  const getMetricDisplay = (entity: HeatmapPipelineEntity, mode: 'errorSeverity' | 'errorRate' | 'latency' | 'predictiveImpact' | 'riskScore') => {
    if (mode === 'errorSeverity') {
      return `${entity.status.toUpperCase()} (${entity.errorRatePercent.toFixed(1)}%)`;
    }
    if (mode === 'predictiveImpact') return `${entity.predictiveImpactScore}/100 (+${entity.projectedDelayHours}h)`;
    if (mode === 'errorRate') return `${entity.errorRatePercent.toFixed(2)}%`;
    if (mode === 'latency') return `${entity.p95LatencyMs}ms`;
    return `${entity.riskScore}/100`;
  };

  const getImpactBadge = (score: number, severity: string, delayHours: number) => {
    if (score >= 80) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
          {severity} (+{delayHours}h Delay)
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          {severity} (+{delayHours}h Delay)
        </span>
      );
    }
    if (score >= 20) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Info className="w-3 h-3 text-blue-600" />
          {severity} (+{delayHours}h)
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Nominal (&lt;10m)
      </span>
    );
  };

  const handleRefreshData = (isManual = true) => {
    if (isManual) setIsRefreshing(true);
    setEntities((prev) =>
      prev.map((item) => {
        const newErrRate = +(
          item.errorRatePercent +
          (item.status === 'Critical' ? (Math.random() * 0.4 - 0.2) : (Math.random() * 0.1 - 0.05))
        ).toFixed(2);
        
        // Dynamically compute projected delay based on error rate & latency regression
        const errorMultiplier = Math.max(0.1, Math.max(0.01, newErrRate) / 1.5);
        const computedDelay = +(item.baseEstimatedHours * (errorMultiplier * 0.2)).toFixed(1);
        const computedImpact = Math.min(99, Math.round(newErrRate * 10 + (item.p95LatencyMs / 800) * 20));

        const updatedTrajectory = item.errorTrajectory24h
          ? [...item.errorTrajectory24h.slice(1), newErrRate]
          : [newErrRate];

        return {
          ...item,
          errorRatePercent: newErrRate,
          errorTrajectory24h: updatedTrajectory,
          p95LatencyMs: Math.max(20, Math.round(item.p95LatencyMs + (Math.random() * 20 - 10))),
          throughputRecSec: Math.round(item.throughputRecSec + (Math.random() * 80 - 40)),
          projectedDelayHours: computedDelay,
          predictiveImpactScore: computedImpact,
          isPrimaryBottleneck: computedImpact >= 80 && computedDelay >= 3.5,
        };
      })
    );
    setLastRefreshedAt(new Date().toLocaleTimeString());
    if (isManual) {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const handleRefresh = () => {
    handleRefreshData(true);
  };

  const handleDrilldownToErrorCenter = (entity: HeatmapPipelineEntity) => {
    onNavigateTab('error-center');
  };

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadCsv = () => {
    const exportData = filteredEntities.length > 0 ? filteredEntities : entities;

    const headers = [
      'Pipeline ID',
      'Pipeline Name',
      'Source Connector',
      'Source Type',
      'Destination Connector',
      'Destination Type',
      'Status',
      'Primary Bottleneck',
      'Error Rate (%)',
      'Prev Week Error Rate (%)',
      'Error Rate Delta (%)',
      'Total Errors',
      'Prev Week Total Errors',
      'Active Unresolved Exceptions',
      'Top Error Category',
      'Top Error Message',
      'P95 Latency (ms)',
      'Prev Week P95 Latency (ms)',
      'P95 Latency Delta (ms)',
      'Avg Latency (ms)',
      'Throughput (rec/sec)',
      'Risk Score (0-100)',
      'Prev Week Risk Score',
      'Predictive Impact Score (0-100)',
      'Prev Week Predictive Impact Score',
      'Impact Severity',
      'Projected Delay (Hours)',
      'Prev Week Projected Delay (Hours)',
      'Downstream Cascade Count',
      'Remediation Time Savings',
      'Trend',
      'Last Incident At',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = exportData.map((e) => [
      escapeCsv(e.id),
      escapeCsv(e.pipelineName),
      escapeCsv(e.sourceConnectorName),
      escapeCsv(e.sourceType),
      escapeCsv(e.destConnectorName),
      escapeCsv(e.destType),
      escapeCsv(e.status),
      e.isPrimaryBottleneck ? 'YES (Primary Delay Bottleneck)' : 'NO',
      e.errorRatePercent.toFixed(2),
      e.prevWeekErrorRatePercent.toFixed(2),
      (e.errorRatePercent - e.prevWeekErrorRatePercent > 0 ? `+${(e.errorRatePercent - e.prevWeekErrorRatePercent).toFixed(2)}` : (e.errorRatePercent - e.prevWeekErrorRatePercent).toFixed(2)),
      e.totalErrors,
      e.prevWeekTotalErrors,
      e.unresolvedExceptions,
      escapeCsv(e.topErrorCategory),
      escapeCsv(e.topErrorMessage),
      e.p95LatencyMs,
      e.prevWeekP95LatencyMs,
      (e.p95LatencyMs - e.prevWeekP95LatencyMs > 0 ? `+${e.p95LatencyMs - e.prevWeekP95LatencyMs}` : e.p95LatencyMs - e.prevWeekP95LatencyMs),
      e.avgLatencyMs,
      e.throughputRecSec,
      e.riskScore,
      e.prevWeekRiskScore,
      e.predictiveImpactScore,
      e.prevWeekPredictiveImpactScore,
      escapeCsv(e.impactSeverity),
      e.projectedDelayHours,
      e.prevWeekProjectedDelayHours,
      e.downstreamCascadeCount,
      escapeCsv(e.remediationTimeSavings),
      escapeCsv(e.trend),
      escapeCsv(e.lastIncidentAt),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.href = url;
    link.setAttribute('download', `pipeline-error-latency-metrics-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 relative overflow-hidden animate-in fade-in duration-700">
      {/* Background ambient accent */}
      <div className="absolute top-0 right-0 w-80 h-36 bg-gradient-to-bl from-rose-500/5 via-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header section */}
      <div className="space-y-4 pb-4 border-b border-slate-100">
        {/* Title and Badges Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg border border-indigo-100 inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm tracking-widest">
                <Hourglass className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Predictive Downstream Timeline Forecaster</span>
              </span>
              <span className="px-2.5 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-lg border border-rose-100 inline-flex items-center gap-1 whitespace-nowrap shadow-sm tracking-widest">
                <span>+{totalCumulativeDelayHours}h Potential Cutover Slippage</span>
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />
              <span>Pipeline <span className="text-indigo-600">Heatmap</span> & Performance Matrix</span>
            </h2>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Auto-Polling Status Badge */}
            <span
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black border inline-flex items-center gap-1.5 shadow-sm uppercase tracking-widest ${
                isAutoRefreshActive
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title={
                isAutoRefreshActive
                  ? `Live Polling Active (Every ${activeInterval}s) • Last refreshed at ${lastRefreshedAt}`
                  : 'Auto-refresh is currently paused'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAutoRefreshActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
              />
              <span>{isAutoRefreshActive ? `Live (${activeInterval}s)` : 'Polling Paused'}</span>
            </span>

            {/* Download CSV Action Button */}
            <button
              id="download-heatmap-csv-btn"
              onClick={handleDownloadCsv}
              className={`px-4 py-2 rounded-xl border text-[10px] font-black transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap uppercase tracking-widest ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:text-indigo-600 hover:border-indigo-300'
              }`}
              title="Download CSV export of current error rate and latency data"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Exported!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>Download CSV</span>
                </>
              )}
            </button>

            <button
              id="refresh-heatmap-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center justify-center"
              title="Recalculate Predictive Downstream Impact"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dynamic Metric Mode Selectors Row */}
        <div className="flex flex-col xl:flex-row lg:items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">Primary Metric:</span>
            <button
              id="metric-severity-btn"
              onClick={() => handleSelectMetric('errorSeverity')}
              className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                metricMode === 'errorSeverity'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
              }`}
              title="Highlight & sort by Error Severity (Critical/Warning/Healthy)"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Severity Status</span>
            </button>
            <button
              id="metric-impact-btn"
              onClick={() => handleSelectMetric('predictiveImpact')}
              className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                metricMode === 'predictiveImpact'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
              }`}
              title="Sort & highlight by Predictive Impact Score"
            >
              <Hourglass className="w-3.5 h-3.5" />
              <span>Predictive Impact</span>
            </button>
            <button
              id="metric-errorrate-btn"
              onClick={() => handleSelectMetric('errorRate')}
              className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                metricMode === 'errorRate'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
              }`}
              title="Sort & highlight by Error Rate (%)"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Error Rate (%)</span>
            </button>
            <button
              id="metric-latency-btn"
              onClick={() => handleSelectMetric('latency')}
              className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                metricMode === 'latency'
                  ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
              }`}
              title="Sort & highlight by P95 Latency"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>P95 Latency</span>
            </button>
            <button
              id="metric-risk-btn"
              onClick={() => handleSelectMetric('riskScore')}
              className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                metricMode === 'riskScore'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
              }`}
              title="Sort & highlight by Composite Risk Index"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Risk Index</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <button
              id="toggle-historical-comparison-btn"
              onClick={() => setShowHistoricalComparison((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 border ${
                showHistoricalComparison
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
              }`}
              title="Toggle comparison against previous week historical performance data"
            >
              <History className={`w-3.5 h-3.5 ${showHistoricalComparison ? 'text-indigo-700' : 'text-slate-600'}`} />
              <span>Hist. Comparison</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                  showHistoricalComparison ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {showHistoricalComparison ? 'ON' : 'OFF'}
              </span>
            </button>

            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'table'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-600'
                }`}
                title="Table View with Predictive Impact Column"
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'grid'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-600'
                }`}
                title="Pipeline Card Grid View"
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'matrix'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-600'
                }`}
                title="2D Source vs Destination Topology Matrix"
              >
                Matrix
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards: Predictive Timeline Health */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 shadow-sm group hover:border-rose-500/30 transition-all">
          <div className="text-[10px] font-black text-slate-600 flex items-center justify-between uppercase tracking-widest">
            <span>Critical Schedule Impact</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono tracking-tighter">{criticalCount} <span className="text-[10px] uppercase font-black tracking-normal text-slate-600">Pipelines</span></div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Predicted Delay &gt; 4.0 Hours</div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 shadow-sm group hover:border-rose-500/30 transition-all">
          <div className="text-[10px] font-black text-slate-600 flex items-center justify-between uppercase tracking-widest">
            <span>Cumulative Cutover Slippage</span>
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tighter">+{totalCumulativeDelayHours}h</div>
          <div className="text-[10px] text-rose-600/80 font-black uppercase tracking-widest">Projected Schedule Overhead</div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 shadow-sm group hover:border-indigo-500/30 transition-all">
          <div className="text-[10px] font-black text-slate-600 flex items-center justify-between uppercase tracking-widest">
            <span>Mean Predictive Impact</span>
            <Gauge className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 font-mono tracking-tighter">{avgPredictiveImpact}<span className="text-[10px] text-slate-600">/100</span></div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Downstream Propagation Index</div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 shadow-sm group hover:border-amber-500/30 transition-all">
          <div className="text-[10px] font-black text-slate-600 flex items-center justify-between uppercase tracking-widest">
            <span>Cascading Tables Blocked</span>
            <Layers className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono tracking-tighter">
            {entities.reduce((s, e) => s + e.downstreamCascadeCount, 0)} <span className="text-[10px] uppercase font-black tracking-normal text-slate-600">Entities</span>
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dependent Staging Schemas</div>
        </div>
      </div>

      {/* Filter & Search Bar Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-y border-slate-100">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm ${
              filterStatus === 'all'
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            All Pipelines ({entities.length})
          </button>
          <button
            id="filter-critical-btn"
            onClick={() => setFilterStatus('critical')}
            className={`px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm ${
              filterStatus === 'critical'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Critical ({criticalCount})</span>
          </button>
          <button
            id="filter-warning-btn"
            onClick={() => setFilterStatus('warning')}
            className={`px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm ${
              filterStatus === 'warning'
                ? 'bg-amber-500 text-white border-amber-400'
                : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Warning ({warningCount})</span>
          </button>
          <button
            id="filter-info-btn"
            onClick={() => setFilterStatus('info')}
            className={`px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm ${
              filterStatus === 'info'
                ? 'bg-sky-600 text-white border-sky-500'
                : 'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Info ({infoCount})</span>
          </button>
          <button
            id="filter-healthy-btn"
            onClick={() => setFilterStatus('healthy')}
            className={`px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm ${
              filterStatus === 'healthy'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Healthy ({healthyCount})</span>
          </button>
        </div>

        {/* Search Input Filter */}
        <div className="relative flex-1 max-w-md group">
          <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-indigo-600" />
          <input
            id="search-heatmap-pipelines-input"
            type="text"
            placeholder="Search pipelines or tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[11px] font-bold py-2.5 pl-10 pr-10 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-600 placeholder:font-black placeholder:uppercase placeholder:tracking-widest shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Heatmap Legend & Telemetry Indicators Bar */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* Severity Scale Indicators */}
        <div className="flex flex-wrap items-center gap-4 font-black text-[10px] text-slate-600 uppercase tracking-widest">
          <span className="text-slate-500 border-r border-slate-200 pr-4">
            Severity Scale:
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
            <span className="text-rose-600">Critical (&ge;5%)</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
            <span className="text-amber-600">Warning (2-5%)</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span className="text-sky-600">Info (&lt;2%)</span>
          </span>
          <span className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Healthy</span>
          </span>
        </div>

        {/* Special Predictive Badges & Stream Status */}
        <div className="flex flex-wrap items-center gap-3 font-black text-[9px] uppercase tracking-widest">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
            <Flame className="w-3 h-3 text-amber-500 fill-current" />
            <span>Bottleneck = Primary Delay Source</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-rose-600 border border-rose-100 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <span>Active Error Stream</span>
          </span>
        </div>
      </div>

      {/* Main View Display: Table, Grid Cards, or Topology Matrix */}
      {viewMode === 'table' ? (
        /* Table View: Full Heatmap Table with Dedicated Columns and Interactive Sorting */
        <div className="space-y-4">
          {/* Active Metric Focus & Sort State Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-black text-slate-600 uppercase tracking-widest text-[9px]">
                Active Table Focus:
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-black text-slate-900 shadow-sm text-[10px] uppercase tracking-widest">
                {metricMode === 'errorSeverity' && <ShieldAlert className="w-4 h-4 text-rose-500" />}
                {metricMode === 'predictiveImpact' && <Hourglass className="w-4 h-4 text-indigo-500" />}
                {metricMode === 'errorRate' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                {metricMode === 'latency' && <Clock className="w-4 h-4 text-sky-500" />}
                {metricMode === 'riskScore' && <Gauge className="w-4 h-4 text-purple-500" />}
                <span>
                  {metricMode === 'errorSeverity' && 'Error Severity'}
                  {metricMode === 'predictiveImpact' && 'Predictive Impact Score'}
                  {metricMode === 'errorRate' && `Error Rate (%) & ${timeHorizon} Trajectory`}
                  {metricMode === 'latency' && 'P95 Latency'}
                  {metricMode === 'riskScore' && 'Risk Index'}
                </span>
              </span>
              <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
                Sorted:{' '}
                <strong className="text-slate-900">
                  {sortDirection === 'desc' ? 'Highest First (DESC)' : 'Lowest First (ASC)'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="toggle-sort-order-btn"
                onClick={() => setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200 shadow-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Toggle between Descending and Ascending sorting order"
              >
                {sortDirection === 'desc' ? (
                  <>
                    <ArrowDown className="w-3 h-3 text-indigo-600" />
                    <span>Sort: High to Low</span>
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-3 h-3 text-indigo-600" />
                    <span>Sort: Low to High</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm bg-white">
            <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-black uppercase tracking-widest select-none">
                  {/* Pipeline / Route Header (Error Severity) */}
                  <th
                    onClick={() => handleSelectMetric('errorSeverity')}
                    className={`p-4 text-[10px] cursor-pointer transition-all ${
                      metricMode === 'errorSeverity'
                        ? 'bg-rose-50 text-rose-600 border-b-2 border-rose-500'
                        : 'hover:bg-slate-100 hover:text-slate-600'
                    }`}
                    title="Sort by Error Severity status"
                  >
                    <div className="flex items-center gap-2">
                      <span>Pipeline / Route</span>
                      {metricMode === 'errorSeverity' ? (
                        sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-rose-500" /> : <ArrowUp className="w-3.5 h-3.5 text-rose-500" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-700 opacity-50 group-hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Error Rate & Trajectory Header */}
                  <th
                    onClick={() => handleSelectMetric('errorRate')}
                    className={`p-4 text-[10px] text-center cursor-pointer transition-all ${
                      metricMode === 'errorRate'
                        ? 'bg-rose-50 text-rose-600 border-x border-slate-100 border-b-2 border-rose-500'
                        : 'hover:bg-slate-100 hover:text-slate-600 border-x border-slate-100'
                    }`}
                    title="Sort by Error Rate percentage"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Error Rate & {timeHorizon} Trend</span>
                      {metricMode === 'errorRate' ? (
                        sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-rose-500" /> : <ArrowUp className="w-3.5 h-3.5 text-rose-500" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-700 opacity-50 group-hover:opacity-100" />
                      )}
                    </div>
                    {showHistoricalComparison && <span className="block text-[8px] text-indigo-500 font-black lowercase mt-0.5 tracking-tighter">vs prev week</span>}
                  </th>

                  {/* P95 Latency Header */}
                  <th
                    onClick={() => handleSelectMetric('latency')}
                    className={`p-4 text-[10px] text-center cursor-pointer transition-all ${
                      metricMode === 'latency'
                        ? 'bg-sky-50 text-sky-600 border-x border-slate-100 border-b-2 border-sky-500'
                        : 'hover:bg-slate-100 hover:text-slate-600 border-x border-slate-100'
                    }`}
                    title="Sort by P95 Latency ms"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>P95 Latency</span>
                      {metricMode === 'latency' ? (
                        sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-sky-500" /> : <ArrowUp className="w-3.5 h-3.5 text-sky-500" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-700 opacity-50 group-hover:opacity-100" />
                      )}
                    </div>
                    {showHistoricalComparison && <span className="block text-[8px] text-indigo-500 font-black lowercase mt-0.5 tracking-tighter">vs prev week</span>}
                  </th>

                  {/* Throughput Header */}
                  <th className="p-4 text-[10px] text-center border-r border-slate-100">Throughput</th>

                  {/* Predictive Impact Score Header */}
                  <th
                    onClick={() => handleSelectMetric('predictiveImpact')}
                    className={`p-4 text-[10px] cursor-pointer transition-all ${
                      metricMode === 'predictiveImpact'
                        ? 'bg-indigo-50 text-indigo-600 border-x border-slate-100 border-b-2 border-indigo-500'
                        : 'bg-indigo-50/30 text-indigo-600/70 border-x border-indigo-100 hover:bg-indigo-50'
                    }`}
                    title="Sort by Predictive Impact Score"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Hourglass className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Predictive Impact</span>
                      </div>
                      {metricMode === 'predictiveImpact' ? (
                        sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-indigo-800 opacity-50" />
                      )}
                    </div>
                  </th>

                  {/* Risk Index Header */}
                  <th
                    onClick={() => handleSelectMetric('riskScore')}
                    className={`p-4 text-[10px] text-center cursor-pointer transition-all ${
                      metricMode === 'riskScore'
                        ? 'bg-purple-50 text-purple-600 border-l border-slate-100 border-b-2 border-purple-500'
                        : 'hover:bg-slate-100 hover:text-slate-600 border-l border-slate-100'
                    }`}
                    title="Sort by Composite Risk Index"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Risk Index</span>
                      {metricMode === 'riskScore' ? (
                        sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-purple-500" /> : <ArrowUp className="w-3.5 h-3.5 text-purple-500" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-700 opacity-50 group-hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Estimated Timeframe Impact Header */}
                  <th className="p-3 font-bold text-[11px] uppercase tracking-wider">Estimated Timeframe Impact</th>
                  
                  {/* Actions Header */}
                  <th className="p-3 font-bold text-[11px] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredEntities.map((entity) => {
                  const isSelected = selectedEntity?.id === entity.id;
                  const isCritical = entity.status === 'Critical' || entity.errorRatePercent >= 5.0;
                  const isWarning = !isCritical && (entity.status === 'Warning' || entity.errorRatePercent >= 2.0);
                  const isInfo = !isCritical && !isWarning && (entity.status === 'Info' || entity.unresolvedExceptions > 0);
                  const errDelta = getErrorRateDelta(entity.errorRatePercent, entity.prevWeekErrorRatePercent);
                  const latDelta = getLatencyDelta(entity.p95LatencyMs, entity.prevWeekP95LatencyMs);
                  const impactDelta = getImpactDelta(entity.predictiveImpactScore, entity.prevWeekPredictiveImpactScore);

                  return (
                    <tr
                      key={entity.id}
                      onClick={() => setSelectedEntity(entity)}
                      className={`transition-all cursor-pointer group border-b border-slate-50 ${
                        isSelected
                          ? 'bg-indigo-50/50'
                          : isCritical
                          ? 'hover:bg-rose-50/30'
                          : isWarning
                          ? 'hover:bg-amber-50/30'
                          : isInfo
                          ? 'hover:bg-sky-50/30'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Pipeline & Connectors */}
                      <td className="p-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 shadow-sm ${
                                isCritical
                                  ? 'bg-rose-600 text-white border-rose-500'
                                  : isWarning
                                  ? 'bg-amber-500 text-white border-amber-400'
                                  : isInfo
                                  ? 'bg-sky-600 text-white border-sky-500'
                                  : 'bg-emerald-600 text-white border-emerald-500'
                              }`}
                            >
                              {(isCritical || isWarning) && (
                                <span className="relative flex h-2 w-2">
                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-white' : 'bg-slate-50 border border-slate-200'}`} />
                                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isCritical ? 'bg-white' : 'bg-slate-50 border border-slate-200'}`} />
                                </span>
                              )}
                              {entity.status}
                            </span>

                            {/* Visual Bottleneck Badge for Primary Delay Causes */}
                            {entity.isPrimaryBottleneck && (
                              <span
                                className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 shadow-sm inline-flex items-center gap-1"
                                title="Primary cause of downstream pipeline delays (Predictive Engine Alert)"
                              >
                                <Flame className="w-3 h-3 text-amber-500 fill-current" />
                                <span>Bottleneck</span>
                              </span>
                            )}

                            <span className="font-black text-slate-900 text-[13px] tracking-tight group-hover:text-indigo-600 transition-colors">{entity.pipelineName}</span>
                          </div>
                          <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-2">
                            <span className="truncate max-w-[140px] text-slate-500">{entity.sourceConnectorName}</span>
                            <ArrowRight className="w-3 h-3 text-slate-700 shrink-0" />
                            <span className="truncate max-w-[140px] text-slate-500">{entity.destConnectorName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Error Rate & 24h Trajectory Sparkline */}
                      <td className={`p-4 text-center ${metricMode === 'errorRate' ? 'bg-rose-50/30 border-x border-slate-100' : ''}`}>
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-black border inline-flex items-center justify-center gap-1.5 shadow-sm ${
                                entity.errorRatePercent >= 5.0
                                  ? 'bg-rose-600 text-white border-rose-500'
                                  : entity.errorRatePercent >= 2.0
                                  ? 'bg-amber-500 text-white border-amber-400'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              }`}
                            >
                              {entity.errorRatePercent >= 2.0 && (
                                <span className="relative flex h-2 w-2">
                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${entity.errorRatePercent >= 5.0 ? 'bg-white' : 'bg-slate-50 border border-slate-200'}`} />
                                  <span className={`relative inline-flex rounded-full h-2 w-2 ${entity.errorRatePercent >= 5.0 ? 'bg-white' : 'bg-slate-50 border border-slate-200'}`} />
                                </span>
                              )}
                              <span>{entity.errorRatePercent.toFixed(2)}%</span>
                            </span>

                            {/* Mini Trajectory Sparkline */}
                            <div className="bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm" title={`${timeHorizon} Trajectory for ${entity.pipelineName}`}>
                              <ErrorTrajectorySparkline
                                data={getEntityTrajectoryData(entity, timeHorizon)}
                                status={getVisualStatus(entity)}
                                timeHorizon={timeHorizon}
                                width={80}
                                height={24}
                                compact
                                idPrefix={`tbl-${entity.id}`}
                              />
                            </div>
                          </div>

                          {/* Historical delta indicator */}
                          {showHistoricalComparison ? (
                            <div
                              className={`text-[10px] font-mono font-bold flex items-center gap-0.5 px-1.5 py-0.2 rounded ${
                                errDelta.isRegressed
                                  ? 'bg-rose-50 text-rose-600'
                                  : errDelta.isImproved
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-slate-50 text-slate-600'
                              }`}
                              title={`Previous Week: ${entity.prevWeekErrorRatePercent.toFixed(2)}% (${errDelta.diff > 0 ? '+' : ''}${errDelta.diff}%)`}
                            >
                              {errDelta.isRegressed ? (
                                <ArrowUp className="w-2.5 h-2.5 text-rose-600" />
                              ) : errDelta.isImproved ? (
                                <ArrowDown className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Minus className="w-2.5 h-2.5 text-slate-700" />
                              )}
                              <span>{errDelta.diff > 0 ? `+${errDelta.diff}%` : `${errDelta.diff}%`}</span>
                              <span className="text-[9px] font-normal opacity-70">({entity.prevWeekErrorRatePercent}%)</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-600">{entity.unresolvedExceptions} active exceptions</div>
                          )}
                        </div>
                      </td>

                      {/* P95 Latency */}
                      <td className={`p-3 text-center font-mono ${metricMode === 'latency' ? 'bg-sky-50/30 border-x border-slate-100 font-bold' : ''}`}>
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-xs font-bold ${
                              entity.p95LatencyMs >= 500
                                ? 'text-rose-600 font-black'
                                : entity.p95LatencyMs >= 200
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {entity.p95LatencyMs}ms
                          </span>

                          {/* Historical Latency delta */}
                          {showHistoricalComparison ? (
                            <div
                              className={`mt-0.5 text-[10px] font-mono font-bold flex items-center gap-0.5 px-1.5 py-0.2 rounded ${
                                latDelta.isRegressed
                                  ? 'bg-rose-50 text-rose-600'
                                  : latDelta.isImproved
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-slate-50 text-slate-600'
                              }`}
                              title={`Previous Week: ${entity.prevWeekP95LatencyMs}ms (${latDelta.diff > 0 ? '+' : ''}${latDelta.diff}ms)`}
                            >
                              {latDelta.isRegressed ? (
                                <ArrowUp className="w-2.5 h-2.5 text-rose-600" />
                              ) : latDelta.isImproved ? (
                                <ArrowDown className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Minus className="w-2.5 h-2.5 text-slate-700" />
                              )}
                              <span>{latDelta.diff > 0 ? `+${latDelta.diff}ms` : `${latDelta.diff}ms`}</span>
                              <span className="text-[9px] font-normal opacity-70">({entity.prevWeekP95LatencyMs}ms)</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-600 mt-0.5">{entity.avgLatencyMs}ms avg</div>
                          )}
                        </div>
                      </td>

                      {/* Throughput */}
                      <td className="p-3 text-center font-mono text-xs text-slate-600 font-semibold">
                        <div>{entity.throughputRecSec.toLocaleString()} <span className="text-[10px] text-slate-600">rec/s</span></div>
                        {showHistoricalComparison && (
                          <div className="text-[10px] text-slate-600 font-normal">
                            Prev: {entity.prevWeekThroughputRecSec.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Predictive Impact Score (Highlighted Column) */}
                      <td className={`p-3 border-x font-mono ${metricMode === 'predictiveImpact' ? 'bg-indigo-50/50 border-indigo-200 font-bold' : 'bg-indigo-50/20 border-indigo-50'}`}>
                        <div className="space-y-1.5 min-w-[150px]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-900 flex items-center gap-1">
                              {entity.isPrimaryBottleneck ? (
                                <Flame className="w-3.5 h-3.5 text-rose-600 fill-current animate-pulse-critical" />
                              ) : entity.predictiveImpactScore >= 80 ? (
                                <Flame className="w-3.5 h-3.5 text-rose-600 fill-current" />
                              ) : (
                                <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                              )}
                              {entity.predictiveImpactScore} / 100
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                entity.isPrimaryBottleneck
                                  ? 'text-rose-600 font-black'
                                  : entity.predictiveImpactScore >= 80
                                  ? 'text-rose-600 font-black'
                                  : entity.predictiveImpactScore >= 50
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {entity.isPrimaryBottleneck ? 'CRITICAL BOTTLENECK' : entity.impactSeverity}
                            </span>
                          </div>

                          {/* Predictive visual bar */}
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                entity.isPrimaryBottleneck || entity.predictiveImpactScore >= 80
                                  ? 'bg-rose-600'
                                  : entity.predictiveImpactScore >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${entity.predictiveImpactScore}%` }}
                            />
                          </div>

                          {entity.isPrimaryBottleneck && (
                            <div className="text-[9px] font-mono font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5 text-rose-600 fill-current shrink-0" />
                              <span>Primary Cause of Delay (+{entity.projectedDelayHours}h)</span>
                            </div>
                          )}

                          {showHistoricalComparison && (
                            <div className="flex items-center justify-between text-[10px] pt-0.5">
                              <span className="text-slate-600">Prev score: {entity.prevWeekPredictiveImpactScore}</span>
                              <span
                                className={`font-bold flex items-center gap-0.5 ${
                                  impactDelta.isRegressed ? 'text-rose-600' : impactDelta.isImproved ? 'text-emerald-600' : 'text-slate-600'
                                }`}
                              >
                                {impactDelta.diff > 0 ? `+${impactDelta.diff}` : `${impactDelta.diff}`} pts
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Risk Index (Dedicated Column) */}
                      <td className={`p-3 font-mono border-x ${metricMode === 'riskScore' ? 'bg-purple-50/50 border-purple-200 font-bold' : 'bg-purple-50/10 border-purple-50'}`}>
                        <div className="space-y-1.5 min-w-[130px]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-900 flex items-center gap-1">
                              <Gauge className="w-3.5 h-3.5 text-purple-600" />
                              {entity.riskScore} / 100
                            </span>
                            <span
                              className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                entity.riskScore >= 80
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                  : entity.riskScore >= 50
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}
                            >
                              {entity.riskScore >= 80 ? 'HIGH' : entity.riskScore >= 50 ? 'MED' : 'LOW'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                entity.riskScore >= 80
                                  ? 'bg-rose-600'
                                  : entity.riskScore >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${entity.riskScore}%` }}
                            />
                          </div>
                          {showHistoricalComparison && (
                            <div className="flex items-center justify-between text-[10px] text-slate-600">
                              <span>Prev: {entity.prevWeekRiskScore}</span>
                              <span className={entity.riskScore > entity.prevWeekRiskScore ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                                {entity.riskScore > entity.prevWeekRiskScore ? `+${entity.riskScore - entity.prevWeekRiskScore}` : `${entity.riskScore - entity.prevWeekRiskScore}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Downstream Timeframe Effect */}
                      <td className="p-3 font-mono">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {getImpactBadge(entity.predictiveImpactScore, entity.impactSeverity, entity.projectedDelayHours)}
                          </div>
                          <div className="text-[10px] text-slate-600">
                            Base: {entity.baseEstimatedHours}h → <strong className="text-slate-700">Est. Total: {(entity.baseEstimatedHours + entity.projectedDelayHours).toFixed(1)}h</strong>
                          </div>
                          {showHistoricalComparison && (
                            <div className="text-[10px] text-slate-600">
                              Prev week delay: +{entity.prevWeekProjectedDelayHours}h
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Drill-down Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`inspect-btn-${entity.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenInspection(entity);
                            }}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold border border-indigo-100 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-sm"
                            title="Inspect specific error logs and affected record segments"
                          >
                            <Terminal className="w-3 h-3 text-indigo-600" />
                            <span>Inspect Logs</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDrilldownToErrorCenter(entity);
                            }}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-[11px] font-bold border border-slate-100 hover:border-rose-100 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-sm"
                            title="Drill into Error Center"
                          >
                            <span>Error Center</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Mode: Interactive Heatmap Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredEntities.map((entity) => {
            const isSelected = selectedEntity?.id === entity.id;
            const isCritical = entity.status === 'Critical' || entity.errorRatePercent >= 5.0;
            const isWarning = !isCritical && (entity.status === 'Warning' || entity.errorRatePercent >= 2.0);
            const isInfo = !isCritical && !isWarning && (entity.status === 'Info' || entity.unresolvedExceptions > 0);
            const hasActiveErrors = isCritical || isWarning || isInfo;
            const errDelta = getErrorRateDelta(entity.errorRatePercent, entity.prevWeekErrorRatePercent);
            const latDelta = getLatencyDelta(entity.p95LatencyMs, entity.prevWeekP95LatencyMs);

            return (
              <div
                key={entity.id}
                onClick={() => setSelectedEntity(entity)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'ring-2 ring-indigo-600 border-indigo-500 bg-indigo-50 shadow-md'
                    : isCritical
                    ? 'bg-white hover:bg-rose-50/30 border-rose-200 hover:border-rose-300 shadow-sm'
                    : isWarning
                    ? 'bg-white hover:bg-amber-50/30 border-amber-200 hover:border-amber-300 shadow-sm'
                    : isInfo
                    ? 'bg-white hover:bg-sky-50/30 border-sky-200 hover:border-sky-300 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                }`}
              >
                {/* Active Error Corner Indicator */}
                {hasActiveErrors && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-sky-500'}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-sky-500'}`} />
                  </span>
                )}

                {/* Header row */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pr-3">
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border flex items-center gap-1.5 ${
                          isCritical
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : isWarning
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : isInfo
                            ? 'bg-sky-50 text-sky-600 border-sky-200'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}
                      >
                        {entity.status.toUpperCase()}
                      </span>

                      {entity.isPrimaryBottleneck && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 shadow-sm inline-flex items-center gap-0.5"
                          title="Predictive Bottleneck: Primary cause of downstream pipeline delays"
                        >
                          <Flame className="w-2.5 h-2.5 text-amber-500 fill-current" />
                          <span>Bottleneck</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 font-black tracking-tighter truncate">
                      {entity.throughputRecSec.toLocaleString()} rec/s
                    </span>
                  </div>

                  <h3 className="text-xs font-black text-slate-900 leading-snug line-clamp-1 uppercase tracking-tight">
                    {entity.pipelineName}
                  </h3>

                  <div className="text-[11px] text-slate-600 flex items-center gap-2 font-black uppercase tracking-widest truncate">
                    <span className="truncate text-slate-500">{entity.sourceConnectorName}</span>
                    <ArrowRight className="w-3 h-3 text-slate-700 shrink-0" />
                    <span className="truncate text-slate-500">{entity.destConnectorName}</span>
                  </div>
                </div>

                {/* Error Trajectory Sparkline & Metric Gauge Bar */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-slate-600" />
                      <span>{timeHorizon} Trajectory</span>
                    </span>
                    <span
                      className={`font-black ${
                        isCritical
                          ? 'text-rose-600'
                          : isWarning
                          ? 'text-amber-600'
                          : isInfo
                          ? 'text-sky-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {getMetricDisplay(entity, metricMode)}
                    </span>
                  </div>

                  {/* Sparkline in Card */}
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 shadow-inner w-full flex flex-col items-center">
                    <ErrorTrajectorySparkline
                      data={getEntityTrajectoryData(entity, timeHorizon)}
                      status={getVisualStatus(entity)}
                      timeHorizon={timeHorizon}
                      width={180}
                      height={28}
                      showStartEndLabels
                      showTrendBadge
                      idPrefix={`grid-${entity.id}`}
                      className="w-full"
                    />
                  </div>

                  {/* Visual Heatmap Progress Bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical
                          ? 'bg-rose-600'
                          : isWarning
                          ? 'bg-amber-500'
                          : isInfo
                          ? 'bg-sky-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          metricMode === 'errorSeverity'
                            ? isCritical ? 95 : isWarning ? 65 : isInfo ? 35 : 10
                            : metricMode === 'predictiveImpact'
                            ? entity.predictiveImpactScore
                            : metricMode === 'errorRate'
                            ? (entity.errorRatePercent / 10) * 100
                            : metricMode === 'latency'
                            ? (entity.p95LatencyMs / 800) * 100
                            : entity.riskScore
                        )}%`,
                      }}
                    />
                  </div>

                  {/* Previous Week Historical Comparison Pill in Grid Card */}
                  {showHistoricalComparison ? (
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter pt-0.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-inner">
                      <span className="text-slate-600 flex items-center gap-1">
                        <History className="w-2.5 h-2.5 text-slate-600" />
                        <span>Prev:</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className={`font-black flex items-center gap-0.5 ${errDelta.isRegressed ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {errDelta.diff > 0 ? `+${errDelta.diff}%` : `${errDelta.diff}%`}
                        </span>
                        <span className="text-slate-700">|</span>
                        <span className={`font-black flex items-center gap-0.5 ${latDelta.isRegressed ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {latDelta.diff > 0 ? `+${latDelta.diff}ms` : `${latDelta.diff}ms`}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[10px] text-slate-600 font-black uppercase tracking-widest pt-0.5">
                      <span className="text-rose-600 font-black">+{entity.projectedDelayHours}h Delay</span>
                      <span>{entity.downstreamCascadeCount} Tables</span>
                    </div>
                  )}
                </div>

                {/* Bottom Quick Drill-down Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    id={`card-inspect-btn-${entity.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenInspection(entity);
                    }}
                    className="py-2 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-indigo-100 transition-all cursor-pointer shadow-sm inline-flex items-center justify-center gap-1"
                  >
                    <Terminal className="w-3 h-3 text-indigo-600" />
                    <span>Inspect</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDrilldownToErrorCenter(entity);
                    }}
                    className="py-2 px-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-100 hover:border-rose-100 transition-all cursor-pointer shadow-sm inline-flex items-center justify-center gap-1"
                  >
                    <span>Errors</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Matrix Mode: 2D Source x Destination Topology Table */
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
          <table className="w-full text-left text-xs border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-black uppercase tracking-widest">
                <th className="p-4 text-[10px] w-44 sticky left-0 bg-slate-50 border-r border-slate-100 shadow-sm z-10">
                  Source Entity
                </th>
                {TARGET_SYSTEMS.map((tgt) => (
                  <th key={tgt} className="p-3 text-[10px] text-center border-r border-slate-100 last:border-r-0">
                    <span className="truncate block max-w-[120px] mx-auto" title={tgt}>
                      {tgt}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {SOURCE_SYSTEMS.map((src) => (
                <tr key={src} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-3 font-black text-slate-500 text-[10px] uppercase tracking-tighter sticky left-0 bg-slate-50 border-r border-slate-100 shadow-sm z-10 group-hover:text-slate-900 transition-colors">
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
                      <span className="truncate max-w-[140px]" title={src}>{src}</span>
                    </div>
                  </td>
                  {TARGET_SYSTEMS.map((tgt) => {
                    const match = entities.find(
                      (e) => (e?.sourceConnectorName || '').includes((src || '').split(' ')[0]) && (e?.destConnectorName || '').includes((tgt || '').split(' ')[0])
                    );

                    const isMatchCritical = match ? (match.status === 'Critical' || match.errorRatePercent >= 5.0) : false;
                    const isMatchWarning = match ? (!isMatchCritical && (match.status === 'Warning' || match.errorRatePercent >= 2.0)) : false;
                    const isMatchInfo = match ? (!isMatchCritical && !isMatchWarning && (match.status === 'Info' || match.unresolvedExceptions > 0)) : false;
                    const hasActiveErrors = isMatchCritical || isMatchWarning || isMatchInfo;
                    const matchErrDelta = match ? getErrorRateDelta(match.errorRatePercent, match.prevWeekErrorRatePercent) : null;

                    return (
                      <td key={tgt} className="p-2 text-center border-r border-slate-100 last:border-r-0">
                        {match ? (
                          <button
                            id={`matrix-cell-${match.id}`}
                            onClick={() => handleOpenInspection(match)}
                            className={`w-full py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center gap-0.5 relative shadow-sm ${getCellColor(
                              match,
                              metricMode
                            )} ${
                              isMatchCritical
                                ? 'animate-pulse'
                                : ''
                            } ${selectedEntity?.id === match.id ? 'ring-2 ring-indigo-600 border-indigo-500' : ''}`}
                            title={`${match.pipelineName}\nSeverity: ${match.status}\nPredictive Impact Score: ${match.predictiveImpactScore}/100\nDownstream Delay: +${match.projectedDelayHours}h\nActive Exceptions: ${match.unresolvedExceptions}\nPrev Week Error Rate: ${match.prevWeekErrorRatePercent}% (Delta: ${matchErrDelta?.diff > 0 ? '+' : ''}${matchErrDelta?.diff}%)\nPrev Week Latency: ${match.prevWeekP95LatencyMs}ms\nClick to inspect error logs & affected record segments`}
                          >
                            {hasActiveErrors && (
                              <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-80 bg-white`} />
                                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 bg-white`} />
                              </span>
                            )}
                            <span className="truncate max-w-full">{getMetricDisplay(match, metricMode)}</span>

                            {/* Inline Mini Sparkline in Matrix Cell */}
                            <div className="w-full flex justify-center py-0.5 opacity-90">
                              <ErrorTrajectorySparkline
                                data={getEntityTrajectoryData(match, timeHorizon)}
                                status={getVisualStatus(match)}
                                timeHorizon={timeHorizon}
                                width={54}
                                height={14}
                                compact
                                interactive={false}
                                idPrefix={`mat-${match.id}`}
                              />
                            </div>

                            {match.isPrimaryBottleneck ? (
                              <span className="px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-800 border border-rose-500/40 shadow-xl flex items-center gap-0.5">
                                <Flame className="w-2 h-2 text-amber-400 fill-current" />
                                <span>Bottleneck</span>
                              </span>
                            ) : showHistoricalComparison && matchErrDelta ? (
                              <span className="text-[8px] opacity-90 font-black tracking-tighter">
                                {matchErrDelta.diff > 0 ? `▲ +${matchErrDelta.diff}%` : `▼ ${matchErrDelta.diff}%`}
                              </span>
                            ) : (
                              <span className="text-[8px] opacity-80 font-black uppercase tracking-widest">
                                {match.status}
                              </span>
                            )}
                          </button>
                        ) : (
                          <div className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-[10px] font-black select-none">
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Interactive Entity Diagnostic Drilldown Panel */}
      <AnimatePresence>
        {selectedEntity && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-md"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest border border-slate-200">
                    Selected Entity Diagnostic
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                      selectedEntity.status === 'Critical'
                        ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-xs'
                        : selectedEntity.status === 'Warning'
                        ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-xs'
                        : selectedEntity.status === 'Info'
                        ? 'bg-sky-50 text-sky-600 border-sky-200'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}
                  >
                    {selectedEntity.status} Severity
                  </span>
                  {selectedEntity.isPrimaryBottleneck && (
                    <span className="px-2.5 py-1 bg-rose-600 text-white rounded text-[10px] font-black uppercase tracking-widest border border-rose-700 flex items-center gap-1.5 shadow-sm animate-pulse">
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      <span>Primary Bottleneck</span>
                    </span>
                  )}
                  <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
                    Last incident: {selectedEntity.lastIncidentAt}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  {selectedEntity.pipelineName}
                </h3>
              </div>

              {/* Action Buttons: Inspector Drawer & Error Center */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  id="inspect-error-logs-btn"
                  onClick={() => handleOpenInspection(selectedEntity)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <Terminal className="w-3.5 h-3.5 text-indigo-800" />
                  <span>Inspect Error Logs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  id="drilldown-error-center-btn"
                  onClick={() => handleDrilldownToErrorCenter(selectedEntity)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-800" />
                  <span>Error Center ({selectedEntity.unresolvedExceptions})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Diagnostic Metrics Grid with Predictive Timeframe Calculations */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px] font-black uppercase tracking-widest">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 shadow-xs group hover:border-rose-300 transition-all">
                <div className="text-slate-600 flex items-center justify-between">
                  <span>Error Frequency</span>
                  {showHistoricalComparison && (
                    <span className={`font-black ${getErrorRateDelta(selectedEntity.errorRatePercent, selectedEntity.prevWeekErrorRatePercent).isRegressed ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {getErrorRateDelta(selectedEntity.errorRatePercent, selectedEntity.prevWeekErrorRatePercent).diff > 0 ? `▲ +${getErrorRateDelta(selectedEntity.errorRatePercent, selectedEntity.prevWeekErrorRatePercent).diff}%` : `▼ ${getErrorRateDelta(selectedEntity.errorRatePercent, selectedEntity.prevWeekErrorRatePercent).diff}%`}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-rose-600 font-mono tracking-tighter">{selectedEntity.errorRatePercent}%</div>
                <div className="text-slate-500 tracking-tighter">
                  {showHistoricalComparison ? `Prev: ${selectedEntity.prevWeekErrorRatePercent}%` : `${selectedEntity.totalErrors.toLocaleString()} Errs`}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 shadow-xs group hover:border-amber-300 transition-all">
                <div className="text-slate-600 flex items-center justify-between">
                  <span>P95 Latency</span>
                  {showHistoricalComparison && (
                    <span className={`font-black ${getLatencyDelta(selectedEntity.p95LatencyMs, selectedEntity.prevWeekP95LatencyMs).isRegressed ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {getLatencyDelta(selectedEntity.p95LatencyMs, selectedEntity.prevWeekP95LatencyMs).diff > 0 ? `▲ +${getLatencyDelta(selectedEntity.p95LatencyMs, selectedEntity.prevWeekP95LatencyMs).diff}ms` : `▼ ${getLatencyDelta(selectedEntity.p95LatencyMs, selectedEntity.prevWeekP95LatencyMs).diff}ms`}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-amber-500 font-mono tracking-tighter">{selectedEntity.p95LatencyMs}ms</div>
                <div className="text-slate-500 tracking-tighter">
                  Avg: {selectedEntity.avgLatencyMs}ms
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2 shadow-xs group hover:border-indigo-300 transition-all">
                <div className="text-indigo-600 flex items-center justify-between">
                  <span>Predictive Impact</span>
                  <Hourglass className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-indigo-600 font-mono tracking-tighter">{selectedEntity.predictiveImpactScore}<span className="text-xs">/100</span></div>
                <div className="text-rose-600 font-black tracking-tighter uppercase">
                  +{selectedEntity.projectedDelayHours}h Predicted Delay
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 shadow-xs group hover:border-slate-300 transition-all">
                <div className="text-slate-600 uppercase">Cascading Dependencies</div>
                <div className="text-2xl font-black text-slate-800 font-mono tracking-tighter">{selectedEntity.downstreamCascadeCount} <span className="text-[10px]">Tables</span></div>
                <div className="text-slate-500 tracking-tighter uppercase">Est. Base: {selectedEntity.baseEstimatedHours}h</div>
              </div>
            </div>

            {/* Error Rate Trajectory & Trendline Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  <span>{timeHorizon} Trajectory &amp; Telemetry Sparkline</span>
                </span>
                <span className="text-[10px] font-black font-mono text-slate-600 uppercase tracking-widest">
                  Bounds: [{Math.min(...getEntityTrajectoryData(selectedEntity, timeHorizon)).toFixed(2)}% - {Math.max(...getEntityTrajectoryData(selectedEntity, timeHorizon)).toFixed(2)}%]
                </span>
              </div>
              <div className="w-full flex items-center justify-center py-4 px-6 bg-white rounded-2xl border border-slate-100 shadow-inner">
                <ErrorTrajectorySparkline
                  data={getEntityTrajectoryData(selectedEntity, timeHorizon)}
                  status={getVisualStatus(selectedEntity)}
                  timeHorizon={timeHorizon}
                  width={460}
                  height={44}
                  showMinMax
                  showTrendBadge
                  showStartEndLabels
                  interactive
                  idPrefix={`diag-${selectedEntity.id}`}
                  className="w-full"
                />
              </div>
            </div>

            {/* Historical comparison summary callout if comparison mode active */}
            {showHistoricalComparison && (
              <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="text-slate-600">
                    <strong className="text-indigo-600">Historical Delta:</strong> Error rate shifted {selectedEntity.prevWeekErrorRatePercent}% → {selectedEntity.errorRatePercent}%, latency {selectedEntity.prevWeekP95LatencyMs}ms → {selectedEntity.p95LatencyMs}ms.
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-lg border font-black ${getErrorRateDelta(selectedEntity.errorRatePercent, selectedEntity.prevWeekErrorRatePercent).isRegressed ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                  {getErrorRateDelta(selectedEntity.errorRatePercent, selectedEntity.prevWeekErrorRatePercent).isRegressed ? 'SLA Regressed' : 'SLA Improved'}
                </span>
              </div>
            )}

            {/* Predictive Downstream Schedule Impact Banner */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] space-y-2 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <span className="font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Predictive Schedule Impact &amp; Payoff Forecast
                </span>
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 font-black uppercase tracking-widest">
                  {selectedEntity.remediationTimeSavings} Savings
                </span>
              </div>
              <div className="text-slate-600 font-black tracking-tight leading-relaxed uppercase relative z-10">
                Current error volume ({selectedEntity.errorRatePercent}%) predicts a downstream queue delay of <strong className="text-rose-600">+{selectedEntity.projectedDelayHours} hours</strong>, extending cutover completion to <strong className="text-slate-950">{(selectedEntity.baseEstimatedHours + selectedEntity.projectedDelayHours).toFixed(1)}h</strong> across {selectedEntity.downstreamCascadeCount} dependent staging tables.
              </div>
            </div>

            {/* Top Error Message Highlight Banner */}
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-2 w-full">
                <div className="font-black text-rose-700 uppercase tracking-widest">
                  Primary Root Cause: <span className="text-rose-600 ml-2">{selectedEntity.topErrorCategory}</span>
                </div>
                <div className="text-rose-900 font-black tracking-tight bg-white p-3 rounded-xl border border-rose-200 shadow-inner">
                  {selectedEntity.topErrorMessage}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over Side Panel / Modal for Specific Error Logs & Affected Record Segments */}
      <ConnectorErrorInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        entity={inspectingEntity || selectedEntity}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
