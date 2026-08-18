import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  GitCompare,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Info,
  Clock,
  Eye,
  Sliders,
  FileCode,
  Check,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { OverflowTableWrapper } from './OverflowTableWrapper';

export interface SchemaSnapshot {
  id: string;
  date: string;
  timestamp: string;
  datasetId: string;
  datasetName: string;
  columnCount: number;
  nullRatePct: number;
  uniquenessPct: number;
  anomalyCount: number;
  driftRiskScore: number; // 0 to 100
  driftStatus: 'Clean' | 'Minor Drift' | 'Moderate Drift' | 'Critical Drift';
  changeSummary: string;
  events?: Array<{
    type: 'field_added' | 'field_removed' | 'type_changed' | 'null_spike' | 'constraint_changed';
    fieldName: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface ColumnDriftComparison {
  columnName: string;
  baselineType: string;
  currentType: string;
  baselineNullPct: number;
  currentNullPct: number;
  baselineUniquenessPct: number;
  currentUniquenessPct: number;
  changeType: 'unchanged' | 'type_modified' | 'field_added' | 'field_removed' | 'null_degradation' | 'anomaly_spike';
  breaking: boolean;
  driftSeverity: 'none' | 'low' | 'medium' | 'high';
  remediationRule: string;
}

interface SchemaDriftTrendGraphProps {
  datasetId?: string;
  datasetName?: string;
  onProceedToMapping?: () => void;
  availableDatasets?: Array<{ id: string; name: string; category?: string }>;
}

export const SchemaDriftTrendGraph: React.FC<SchemaDriftTrendGraphProps> = ({
  datasetId = 'conn-bc-prod',
  datasetName = 'Dynamics 365 Business Central (Prod)',
  onProceedToMapping,
  availableDatasets = [],
}) => {
  const [selectedDataset, setSelectedDataset] = useState<string>(datasetId);
  const [timeRange, setTimeRange] = useState<'14d' | '30d' | '60d' | '90d'>('30d');
  const [activeMetric, setActiveMetric] = useState<
    'driftRiskScore' | 'nullRatePct' | 'columnCount' | 'anomalyCount'
  >('driftRiskScore');
  const [simulatedDriftInjected, setSimulatedDriftInjected] = useState<boolean>(false);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [searchColumnFilter, setSearchColumnFilter] = useState<string>('');
  const [showBreakingOnly, setShowBreakingOnly] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'trends' | 'timeline' | 'diff'>('trends');

  // Compute dataset title
  const currentDatasetName = useMemo(() => {
    const found = availableDatasets.find((d) => d.id === selectedDataset);
    return found ? found.name : datasetName;
  }, [selectedDataset, availableDatasets, datasetName]);

  // Generate historical snapshot trend data
  const historicalData: SchemaSnapshot[] = useMemo(() => {
    const days = timeRange === '14d' ? 14 : timeRange === '30d' ? 30 : timeRange === '60d' ? 60 : 90;
    const snapshots: SchemaSnapshot[] = [];

    const now = new Date(2026, 7, 14); // August 14, 2026

    // Baseline stats depending on dataset
    let baseCols = selectedDataset.includes('sap') ? 11 : selectedDataset.includes('sql') ? 11 : selectedDataset.includes('excel') ? 5 : 10;
    let baseNull = selectedDataset.includes('sql') ? 9.8 : selectedDataset.includes('sap') ? 4.2 : 2.5;
    let baseAnomalies = selectedDataset.includes('sql') ? 3 : 1;

    for (let i = days - 1; i >= 0; i--) {
      const snapDate = new Date(now);
      snapDate.setDate(now.getDate() - i);
      const dateStr = snapDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isoStr = snapDate.toISOString().split('T')[0];

      let colCount = baseCols;
      let nullPct = baseNull;
      let uniqueness = 94.5;
      let anomalies = baseAnomalies;
      let driftScore = 12; // Base healthy score
      let driftStatus: SchemaSnapshot['driftStatus'] = 'Clean';
      let changeSummary = 'Routine telemetry snapshot: Schema in sync with baseline.';
      let events: SchemaSnapshot['events'] = [];

      // Add realistic drift inflection points
      if (i <= 18 && i > 10) {
        // Minor drift period
        colCount = baseCols;
        nullPct = +(baseNull + 2.1).toFixed(1);
        driftScore = 32;
        driftStatus = 'Minor Drift';
        changeSummary = 'Upstream patch: Null percentage in secondary address fields increased.';
      } else if (i === 10) {
        // Schema field addition event
        colCount = baseCols + 1;
        nullPct = +(baseNull + 3.4).toFixed(1);
        driftScore = 48;
        driftStatus = 'Minor Drift';
        changeSummary = 'Schema expansion: New nullable field `tax_exemption_code` detected upstream.';
        events.push({
          type: 'field_added',
          fieldName: 'tax_exemption_code',
          description: 'New nullable string column added in source ERP pipeline',
          severity: 'low',
        });
      } else if (i < 10 && i >= 4) {
        colCount = baseCols + 1;
        nullPct = +(baseNull + 4.2).toFixed(1);
        driftScore = 54;
        driftStatus = 'Moderate Drift';
        changeSummary = 'Data type precision widening detected in monetary fields.';
        if (i === 6) {
          events.push({
            type: 'type_changed',
            fieldName: 'AnnualRevenue',
            description: 'Data type precision widened from Float(32) to Decimal(18,2)',
            severity: 'medium',
          });
        }
      } else if (i < 4 && i >= 1) {
        colCount = baseCols + 1;
        nullPct = +(baseNull + 7.8).toFixed(1);
        anomalies = baseAnomalies + 2;
        driftScore = 68;
        driftStatus = 'Moderate Drift';
        changeSummary = 'Phone number regex format deviations & 8.4% null jump in contact records.';
        if (i === 2) {
          events.push({
            type: 'null_spike',
            fieldName: 'PrimaryContactPhone',
            description: 'Null rate spiked from 1.2% to 14.8% following batch ETL migration',
            severity: 'high',
          });
        }
      } else if (i === 0) {
        // Today's current state
        if (simulatedDriftInjected) {
          colCount = baseCols + 2;
          nullPct = +(baseNull + 14.6).toFixed(1);
          anomalies = baseAnomalies + 4;
          driftScore = 86;
          driftStatus = 'Critical Drift';
          changeSummary = '⚠️ SIMULATED CRITICAL DRIFT: Incompatible data type conversion & 2 unmapped mandatory fields!';
          events.push(
            {
              type: 'type_changed',
              fieldName: 'PaymentTermsDays',
              description: 'Breaking change: Integer days changed to ISO Period String ("P30D")',
              severity: 'high',
            },
            {
              type: 'field_added',
              fieldName: 'global_location_number',
              description: 'New mandatory NOT NULL field without default value',
              severity: 'high',
            }
          );
        } else {
          colCount = baseCols + 1;
          nullPct = +(baseNull + 6.5).toFixed(1);
          anomalies = baseAnomalies + 2;
          driftScore = 64;
          driftStatus = 'Moderate Drift';
          changeSummary = 'Current Pre-Flight State: 2 non-breaking schema modifications & 1 phone formatting drift pending reconciliation.';
          events.push({
            type: 'type_changed',
            fieldName: 'revenue',
            description: 'Type widened to Decimal',
            severity: 'medium',
          });
        }
      }

      snapshots.push({
        id: `snap-${isoStr}`,
        date: dateStr,
        timestamp: isoStr,
        datasetId: selectedDataset,
        datasetName: currentDatasetName,
        columnCount: colCount,
        nullRatePct: nullPct,
        uniquenessPct: uniqueness,
        anomalyCount: anomalies,
        driftRiskScore: driftScore,
        driftStatus,
        changeSummary,
        events,
      });
    }

    return snapshots;
  }, [timeRange, selectedDataset, currentDatasetName, simulatedDriftInjected]);

  const latestSnapshot = historicalData[historicalData.length - 1];
  const initialSnapshot = historicalData[0];

  // Column Diff between baseline (start of period) and current (today)
  const columnDiffs: ColumnDriftComparison[] = useMemo(() => {
    const diffs: ColumnDriftComparison[] = [
      {
        columnName: 'customer_id',
        baselineType: 'String(20)',
        currentType: 'String(20)',
        baselineNullPct: 0,
        currentNullPct: 0,
        baselineUniquenessPct: 100,
        currentUniquenessPct: 100,
        changeType: 'unchanged',
        breaking: false,
        driftSeverity: 'none',
        remediationRule: 'None required. Schema identical to baseline.',
      },
      {
        columnName: 'company_name',
        baselineType: 'String(100)',
        currentType: 'String(150)',
        baselineNullPct: 0,
        currentNullPct: 0,
        baselineUniquenessPct: 98.4,
        currentUniquenessPct: 98.2,
        changeType: 'type_modified',
        breaking: false,
        driftSeverity: 'low',
        remediationRule: 'Field width expanded from 100 to 150 chars. Auto-accommodated by target mapping.',
      },
      {
        columnName: 'AnnualRevenue',
        baselineType: 'Float(32)',
        currentType: 'Decimal(18,2)',
        baselineNullPct: 3.2,
        currentNullPct: 3.5,
        baselineUniquenessPct: 45.0,
        currentUniquenessPct: 44.8,
        changeType: 'type_modified',
        breaking: false,
        driftSeverity: 'medium',
        remediationRule: 'Precision widened to Decimal. Ensure rounding mode is set to HALF_UP in mapping transform.',
      },
      {
        columnName: 'PrimaryContactPhone',
        baselineType: 'String(25)',
        currentType: 'String(25)',
        baselineNullPct: 1.2,
        currentNullPct: 14.8,
        baselineUniquenessPct: 92.0,
        currentUniquenessPct: 84.1,
        changeType: 'null_degradation',
        breaking: false,
        driftSeverity: 'medium',
        remediationRule: 'Null rate spiked (+13.6%). Recommend applying AI E.164 phone sanitizer & null fallback.',
      },
      {
        columnName: 'tax_exemption_code',
        baselineType: 'None (Unmapped)',
        currentType: 'String(30)',
        baselineNullPct: 100,
        currentNullPct: 62.4,
        baselineUniquenessPct: 0,
        currentUniquenessPct: 12.5,
        changeType: 'field_added',
        breaking: false,
        driftSeverity: 'low',
        remediationRule: 'New source column detected on Day -10. Map to target `Tax_Registration_Number` in Mapping Studio.',
      },
      {
        columnName: 'email_address',
        baselineType: 'String(80)',
        currentType: 'String(80)',
        baselineNullPct: 0.5,
        currentNullPct: 0.8,
        baselineUniquenessPct: 96.5,
        currentUniquenessPct: 96.2,
        changeType: 'unchanged',
        breaking: false,
        driftSeverity: 'none',
        remediationRule: 'Stable. No schema or statistical drift detected.',
      },
    ];

    if (simulatedDriftInjected) {
      diffs.unshift(
        {
          columnName: 'PaymentTermsDays',
          baselineType: 'Integer',
          currentType: 'String (ISO-8601 Duration)',
          baselineNullPct: 0,
          currentNullPct: 4.5,
          baselineUniquenessPct: 12.0,
          currentUniquenessPct: 15.2,
          changeType: 'type_modified',
          breaking: true,
          driftSeverity: 'high',
          remediationRule: '⚠️ BREAKING CHANGE: Integer days converted to string ISO period. Migration will fail without parser rule.',
        },
        {
          columnName: 'global_location_number',
          baselineType: 'None (Unmapped)',
          currentType: 'String(13) NOT NULL',
          baselineNullPct: 0,
          currentNullPct: 0,
          baselineUniquenessPct: 0,
          currentUniquenessPct: 99.8,
          changeType: 'field_added',
          breaking: true,
          driftSeverity: 'high',
          remediationRule: '⚠️ BREAKING CONSTRAINT: Mandatory column added without default. Assign fallback generator.',
        }
      );
    }

    return diffs;
  }, [simulatedDriftInjected]);

  const filteredDiffs = useMemo(() => {
    return columnDiffs.filter((c) => {
      const matchSearch = c.columnName.toLowerCase().includes(searchColumnFilter.toLowerCase());
      const matchBreaking = showBreakingOnly ? c.breaking : true;
      return matchSearch && matchBreaking;
    });
  }, [columnDiffs, searchColumnFilter, showBreakingOnly]);

  const breakingCount = useMemo(() => columnDiffs.filter((c) => c.breaking).length, [columnDiffs]);
  const modifiedCount = useMemo(() => columnDiffs.filter((c) => c.changeType !== 'unchanged').length, [columnDiffs]);

  // Active snapshot details for inspector
  const activeInspectionSnapshot = useMemo(() => {
    if (!selectedSnapshotId) return latestSnapshot;
    return historicalData.find((s) => s.id === selectedSnapshotId) || latestSnapshot;
  }, [selectedSnapshotId, historicalData, latestSnapshot]);

  // Delta calculations
  const driftRiskDelta = latestSnapshot.driftRiskScore - initialSnapshot.driftRiskScore;
  const nullRateDelta = +(latestSnapshot.nullRatePct - initialSnapshot.nullRatePct).toFixed(1);
  const columnDelta = latestSnapshot.columnCount - initialSnapshot.columnCount;

  return (
    <div className="space-y-6">
      {/* Top Banner / Pre-Migration Readiness Status */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          latestSnapshot.driftStatus === 'Critical Drift'
            ? 'bg-rose-50/80 border-rose-200 text-rose-950 shadow-xs'
            : latestSnapshot.driftStatus === 'Moderate Drift'
            ? 'bg-amber-50/80 border-amber-200 text-amber-950 shadow-xs'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-xs'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl border mt-0.5 ${
                latestSnapshot.driftStatus === 'Critical Drift'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                  : latestSnapshot.driftStatus === 'Moderate Drift'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                  : 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
              }`}
            >
              {latestSnapshot.driftStatus === 'Critical Drift' ? (
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              ) : latestSnapshot.driftStatus === 'Moderate Drift' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  {latestSnapshot.driftStatus === 'Critical Drift'
                    ? 'Critical Schema Drift Detected Before Migration Run'
                    : latestSnapshot.driftStatus === 'Moderate Drift'
                    ? 'Moderate Schema & Metadata Drift Detected'
                    : 'Pre-Migration Schema Alignment: Clean & Verified'}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wide border ${
                    latestSnapshot.driftStatus === 'Critical Drift'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : latestSnapshot.driftStatus === 'Moderate Drift'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  Drift Risk Index: {latestSnapshot.driftRiskScore}%
                </span>
                {breakingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-2xs">
                    {breakingCount} Breaking Change{breakingCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <p className="text-xs mt-1.5 opacity-90 max-w-3xl leading-relaxed">
                {latestSnapshot.changeSummary} Continuous telemetry compares metadata evolution from{' '}
                <strong className="font-semibold">{initialSnapshot.date}</strong> to{' '}
                <strong className="font-semibold">{latestSnapshot.date}</strong> across field definitions, null-sparsity,
                and type fidelity.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setSimulatedDriftInjected(!simulatedDriftInjected)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                simulatedDriftInjected
                  ? 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {simulatedDriftInjected ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset Simulation</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Simulate Breaking Drift</span>
                </>
              )}
            </button>

            {onProceedToMapping && (
              <button
                onClick={onProceedToMapping}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Resolve in Mapping Studio</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Drift Risk Score */}
        <div
          onClick={() => setActiveMetric('driftRiskScore')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeMetric === 'driftRiskScore'
              ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/10'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Drift Risk Score
            </span>
            <div className={`p-2 rounded-xl ${latestSnapshot.driftRiskScore > 70 ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {latestSnapshot.driftRiskScore}%
            </span>
            <span
              className={`text-xs font-bold flex items-center ${
                driftRiskDelta > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {driftRiskDelta > 0 ? `+${driftRiskDelta}%` : `${driftRiskDelta}%`}
              <span className="text-[10px] font-normal text-slate-400 ml-1">vs {timeRange} ago</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Composite structural volatility metric</p>
        </div>

        {/* Card 2: Field / Column Evolution */}
        <div
          onClick={() => setActiveMetric('columnCount')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeMetric === 'columnCount'
              ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/10'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Schema Columns
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {latestSnapshot.columnCount}
            </span>
            <span
              className={`text-xs font-bold flex items-center ${
                columnDelta > 0 ? 'text-amber-600' : 'text-slate-600'
              }`}
            >
              {columnDelta > 0 ? `+${columnDelta} cols` : '0 col change'}
              <span className="text-[10px] font-normal text-slate-400 ml-1">expanded</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {modifiedCount} field definitions modified
          </p>
        </div>

        {/* Card 3: Null Sparsity Rate */}
        <div
          onClick={() => setActiveMetric('nullRatePct')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeMetric === 'nullRatePct'
              ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/10'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Avg Null / Sparsity
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {latestSnapshot.nullRatePct}%
            </span>
            <span
              className={`text-xs font-bold flex items-center ${
                nullRateDelta > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {nullRateDelta > 0 ? `+${nullRateDelta}%` : `${nullRateDelta}%`}
              <span className="text-[10px] font-normal text-slate-400 ml-1">sparsity shift</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sparsity increase indicates source ETL gaps</p>
        </div>

        {/* Card 4: Anomaly & Format Flags */}
        <div
          onClick={() => setActiveMetric('anomalyCount')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeMetric === 'anomalyCount'
              ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/10'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Format Anomalies
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {latestSnapshot.anomalyCount}
            </span>
            <span className="text-xs font-bold text-rose-600">
              {latestSnapshot.anomalyCount > 0 ? 'Flags triggered' : 'All clear'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Regex & syntax deviations across fields</p>
        </div>
      </div>

      {/* Main Graph & Control Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
        {/* Controls Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-indigo-600" />
                Metadata Change Trend & Schema Drift Timeline
              </h2>
              <p className="text-xs text-slate-500">
                Tracking telemetry variations over time across source & target pipelines.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Dataset Selector Dropdown */}
            {availableDatasets.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-500">Dataset:</span>
                <select
                  value={selectedDataset}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-transparent border-none focus:outline-hidden cursor-pointer"
                >
                  {availableDatasets.map((ds) => (
                    <option key={ds.id} value={ds.id}>
                      {ds.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Time Horizon Selector */}
            <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              {(['14d', '30d', '60d', '90d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    timeRange === r
                      ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            {/* View Mode Sub-tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveTab('trends')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'trends'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Visual Graph
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'diff'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Column Diff Matrix</span>
                {modifiedCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-200 text-indigo-900 rounded-full text-[10px] font-bold">
                    {modifiedCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Audit Log
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Visual Graph View */}
        {activeTab === 'trends' && (
          <div className="space-y-4">
            {/* Active Metric Badge Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Graph Plot Metric:
                </span>
                <button
                  onClick={() => setActiveMetric('driftRiskScore')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                    activeMetric === 'driftRiskScore'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Drift Risk Index (%)
                </button>
                <button
                  onClick={() => setActiveMetric('nullRatePct')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                    activeMetric === 'nullRatePct'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Null Sparsity Rate (%)
                </button>
                <button
                  onClick={() => setActiveMetric('columnCount')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                    activeMetric === 'columnCount'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Column Count
                </button>
                <button
                  onClick={() => setActiveMetric('anomalyCount')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                    activeMetric === 'anomalyCount'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Format Anomalies
                </button>
              </div>

              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Snapshots polled every 24h & on git/schema webhook triggers</span>
              </div>
            </div>

            {/* Recharts Area / Line Chart Container */}
            <div className="h-[340px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={historicalData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      const snap = e.activePayload[0].payload as SchemaSnapshot;
                      setSelectedSnapshotId(snap.id);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="nullGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    domain={
                      activeMetric === 'columnCount'
                        ? ['dataMin - 1', 'dataMax + 2']
                        : activeMetric === 'anomalyCount'
                        ? [0, 'dataMax + 2']
                        : [0, 100]
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as SchemaSnapshot;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-2 max-w-xs">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                              <span className="font-bold text-slate-200 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-indigo-400" />
                                {data.date} ({data.timestamp})
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  data.driftStatus === 'Critical Drift'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : data.driftStatus === 'Moderate Drift'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {data.driftStatus}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-400 block">Drift Score:</span>
                                <span className="font-bold text-indigo-300 font-mono">
                                  {data.driftRiskScore}%
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Columns:</span>
                                <span className="font-bold text-purple-300 font-mono">
                                  {data.columnCount} fields
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Null Rate:</span>
                                <span className="font-bold text-amber-300 font-mono">
                                  {data.nullRatePct}%
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Anomalies:</span>
                                <span className="font-bold text-rose-300 font-mono">
                                  {data.anomalyCount} flags
                                </span>
                              </div>
                            </div>

                            <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-300">
                              <p className="line-clamp-2">{data.changeSummary}</p>
                            </div>

                            {data.events && data.events.length > 0 && (
                              <div className="pt-1 text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                <span>{data.events.length} Schema Event(s) logged</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Warning Reference Line for Drift Index */}
                  {activeMetric === 'driftRiskScore' && (
                    <ReferenceLine
                      y={60}
                      label={{
                        value: 'Pre-Migration Risk Threshold (60%)',
                        fill: '#ef4444',
                        fontSize: 10,
                        position: 'insideTopRight',
                      }}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                    />
                  )}

                  {activeMetric === 'driftRiskScore' && (
                    <Area
                      type="monotone"
                      dataKey="driftRiskScore"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#driftGradient)"
                      name="Drift Risk Score (%)"
                    />
                  )}

                  {activeMetric === 'nullRatePct' && (
                    <Area
                      type="monotone"
                      dataKey="nullRatePct"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#nullGradient)"
                      name="Null Rate (%)"
                    />
                  )}

                  {activeMetric === 'columnCount' && (
                    <Area
                      type="stepAfter"
                      dataKey="columnCount"
                      stroke="#a855f7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colGradient)"
                      name="Column Count"
                    />
                  )}

                  {activeMetric === 'anomalyCount' && (
                    <Area
                      type="monotone"
                      dataKey="anomalyCount"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#anomalyGradient)"
                      name="Anomaly Count"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Selected Snapshot Inspector Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-indigo-600 shadow-3xs">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      Inspecting Snapshot: {activeInspectionSnapshot.date} ({activeInspectionSnapshot.timestamp})
                    </span>
                    <span
                      className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                        activeInspectionSnapshot.driftStatus === 'Critical Drift'
                          ? 'bg-rose-100 text-rose-800'
                          : activeInspectionSnapshot.driftStatus === 'Moderate Drift'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {activeInspectionSnapshot.driftStatus}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {activeInspectionSnapshot.changeSummary}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-700 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400">Risk: </span>
                  <strong>{activeInspectionSnapshot.driftRiskScore}%</strong>
                </div>
                <div>
                  <span className="text-slate-400">Cols: </span>
                  <strong>{activeInspectionSnapshot.columnCount}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Nulls: </span>
                  <strong>{activeInspectionSnapshot.nullRatePct}%</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Column Diff Matrix */}
        {activeTab === 'diff' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter columns by name..."
                  value={searchColumnFilter}
                  onChange={(e) => setSearchColumnFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-64 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={() => setShowBreakingOnly(!showBreakingOnly)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    showBreakingOnly
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Breaking Only ({breakingCount})
                </button>
              </div>

              <div className="text-xs text-slate-500">
                Comparing <strong className="text-slate-800">Baseline v1.0 ({initialSnapshot.date})</strong> vs{' '}
                <strong className="text-slate-800">Current v1.4 ({latestSnapshot.date})</strong>
              </div>
            </div>

            <OverflowTableWrapper hintLabel="Scroll horizontally to inspect full column-level metadata drift audit">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-3">Column Name</th>
                    <th className="py-3 px-3">Baseline Data Type</th>
                    <th className="py-3 px-3">Current Data Type</th>
                    <th className="py-3 px-3 text-right">Baseline Null%</th>
                    <th className="py-3 px-3 text-right">Current Null%</th>
                    <th className="py-3 px-3">Drift Classification</th>
                    <th className="py-3 px-3 text-center">Breaking?</th>
                    <th className="py-3 px-3">Recommended Remediation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDiffs.map((col, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        col.breaking ? 'bg-rose-50/30' : col.changeType !== 'unchanged' ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">
                        {col.columnName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {col.baselineType}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <span
                          className={`px-2 py-0.5 rounded border ${
                            col.baselineType !== col.currentType
                              ? 'bg-amber-50 text-amber-800 border-amber-200 font-bold'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {col.currentType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        {col.baselineNullPct}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span
                          className={`font-bold ${
                            col.currentNullPct - col.baselineNullPct > 5
                              ? 'text-rose-600'
                              : col.currentNullPct > col.baselineNullPct
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {col.currentNullPct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {col.changeType === 'unchanged' && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Stable
                          </span>
                        )}
                        {col.changeType === 'type_modified' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full text-[11px] font-semibold border border-amber-200">
                            <GitCompare className="w-3 h-3 text-amber-600" /> Type Shift
                          </span>
                        )}
                        {col.changeType === 'null_degradation' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-800 rounded-full text-[11px] font-semibold border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Null Spike
                          </span>
                        )}
                        {col.changeType === 'field_added' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded-full text-[11px] font-semibold border border-indigo-200">
                            <Sparkles className="w-3 h-3 text-indigo-600" /> New Field
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {col.breaking ? (
                          <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                            BREAKING
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Safe</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-xs">
                        {col.remediationRule}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </OverflowTableWrapper>
          </div>
        )}

        {/* Tab 3: Historical Audit Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Chronological log of schema mutations and data quality drift triggers detected by continuous profiling:
            </p>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {historicalData
                .filter((s) => (s.events && s.events.length > 0) || s.driftStatus !== 'Clean')
                .slice(-8)
                .reverse()
                .map((snap) => (
                  <div key={snap.id} className="relative group">
                    <div
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        snap.driftStatus === 'Critical Drift'
                          ? 'border-rose-600'
                          : snap.driftStatus === 'Moderate Drift'
                          ? 'border-amber-500'
                          : 'border-indigo-600'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          snap.driftStatus === 'Critical Drift'
                            ? 'bg-rose-600'
                            : snap.driftStatus === 'Moderate Drift'
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                      />
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{snap.date}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({snap.timestamp})</span>
                        </span>
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                            snap.driftStatus === 'Critical Drift'
                              ? 'bg-rose-100 text-rose-800'
                              : snap.driftStatus === 'Moderate Drift'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          Risk: {snap.driftRiskScore}% ({snap.driftStatus})
                        </span>
                      </div>

                      <p className="text-slate-600 text-[11px]">{snap.changeSummary}</p>

                      {snap.events && snap.events.length > 0 && (
                        <div className="mt-2 space-y-1 pt-1.5 border-t border-slate-200/60">
                          {snap.events.map((ev, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>
                                <strong className="font-semibold text-slate-900 font-mono">
                                  {ev.fieldName}
                                </strong>
                                : {ev.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Pre-Migration Remediation & Safe Execution Advisor */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-indigo-500/30 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                AI Schema Drift Reconciliation Engine
              </h3>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Based on historical metadata variations, AI has prepared automated type-coercion and null-filling transforms so your target ERP migration runs without broken records.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onProceedToMapping && (
              <button
                onClick={onProceedToMapping}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>Apply Drift Fixes in Mapping Studio</span>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
