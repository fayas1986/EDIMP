import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  Connector,
  ConnectorDataProfile,
  ProfilingHistoricalDataPoint,
  DataTypeDistribution,
  EntityProfileSummary,
} from '../types';
import {
  DATA_TYPE_COLORS,
  generateAutomatedDataProfile,
  generateHistoricalTrendPoints,
} from '../services/dataProfilingService';
import {
  GitCompare,
  ArrowRightLeft,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  Calendar,
  Layers,
  Database,
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Percent,
  SlidersHorizontal,
  Table,
  Cpu,
  Clock,
  Gauge,
  FileSpreadsheet,
  Info,
  ChevronRight,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface ConnectorComparisonModalProps {
  connectors: Connector[];
  initialConnectorAId?: string;
  initialConnectorBId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectConnectorForDetails?: (connector: Connector) => void;
}

export const ConnectorComparisonModal: React.FC<ConnectorComparisonModalProps> = ({
  connectors,
  initialConnectorAId,
  initialConnectorBId,
  isOpen,
  onClose,
  onSelectConnectorForDetails,
}) => {
  // Modal Display State
  const [isFullScreen, setIsFullScreen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'schema' | 'entities' | 'performance'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('30d');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Selected Connectors State
  const [connectorAId, setConnectorAId] = useState<string>(() => {
    if (initialConnectorAId && connectors.some((c) => c.id === initialConnectorAId)) {
      return initialConnectorAId;
    }
    return connectors[0]?.id || '';
  });

  const [connectorBId, setConnectorBId] = useState<string>(() => {
    if (initialConnectorBId && connectors.some((c) => c.id === initialConnectorBId)) {
      return initialConnectorBId;
    }
    const second = connectors.find((c) => c.id !== (initialConnectorAId || connectors[0]?.id));
    return second?.id || connectors[1]?.id || connectors[0]?.id || '';
  });

  // Sync selection when initial props change
  useEffect(() => {
    if (initialConnectorAId && connectors.some((c) => c.id === initialConnectorAId)) {
      setConnectorAId(initialConnectorAId);
    }
  }, [initialConnectorAId, connectors]);

  useEffect(() => {
    if (initialConnectorBId && connectors.some((c) => c.id === initialConnectorBId)) {
      setConnectorBId(initialConnectorBId);
    }
  }, [initialConnectorBId, connectors]);

  // Keyboard shortcut for closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (isFullScreen) {
          setIsFullScreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullScreen, onClose]);

  // Retrieve Connectors & Compute Profiles
  const connectorA = useMemo(() => {
    return connectors.find((c) => c.id === connectorAId) || connectors[0] || null;
  }, [connectors, connectorAId]);

  const connectorB = useMemo(() => {
    return connectors.find((c) => c.id === connectorBId) || connectors[1] || connectors[0] || null;
  }, [connectors, connectorBId]);

  const profileA: ConnectorDataProfile = useMemo(() => {
    if (!connectorA) {
      return {
        connectorId: 'none',
        connectorName: 'None',
        profiledAt: new Date().toISOString(),
        status: 'Completed',
        totalEntities: 0,
        totalRowCount: 0,
        totalColumns: 0,
        totalNullValues: 0,
        totalPopulatedValues: 0,
        overallNullPercentage: 0,
        overallCompletenessPercentage: 100,
        dataTypeDistribution: [],
        entityProfiles: [],
        anomaliesDetectedCount: 0,
        dataQualityScore: 100,
        profilingDurationMs: 0,
      };
    }
    return connectorA.dataProfile || generateAutomatedDataProfile(connectorA);
  }, [connectorA]);

  const profileB: ConnectorDataProfile = useMemo(() => {
    if (!connectorB) {
      return {
        connectorId: 'none',
        connectorName: 'None',
        profiledAt: new Date().toISOString(),
        status: 'Completed',
        totalEntities: 0,
        totalRowCount: 0,
        totalColumns: 0,
        totalNullValues: 0,
        totalPopulatedValues: 0,
        overallNullPercentage: 0,
        overallCompletenessPercentage: 100,
        dataTypeDistribution: [],
        entityProfiles: [],
        anomaliesDetectedCount: 0,
        dataQualityScore: 100,
        profilingDurationMs: 0,
      };
    }
    return connectorB.dataProfile || generateAutomatedDataProfile(connectorB);
  }, [connectorB]);

  // Historical 30-Day Trends
  const historicalTrendsA: ProfilingHistoricalDataPoint[] = useMemo(() => {
    if (profileA.historicalTrends && profileA.historicalTrends.length > 0) {
      return profileA.historicalTrends;
    }
    return generateHistoricalTrendPoints(
      profileA.totalRowCount,
      profileA.overallNullPercentage,
      profileA.totalColumns,
      profileA.dataTypeDistribution,
      profileA.dataQualityScore,
      profileA.anomaliesDetectedCount
    );
  }, [profileA]);

  const historicalTrendsB: ProfilingHistoricalDataPoint[] = useMemo(() => {
    if (profileB.historicalTrends && profileB.historicalTrends.length > 0) {
      return profileB.historicalTrends;
    }
    return generateHistoricalTrendPoints(
      profileB.totalRowCount,
      profileB.overallNullPercentage,
      profileB.totalColumns,
      profileB.dataTypeDistribution,
      profileB.dataQualityScore,
      profileB.anomaliesDetectedCount
    );
  }, [profileB]);

  // Filter trends by selected time window (7d, 14d, 30d)
  const windowSliceCount = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;

  // Combined Historical Data for Recharts
  const combinedHistoricalData = useMemo(() => {
    const sliceA = historicalTrendsA.slice(-windowSliceCount);
    const sliceB = historicalTrendsB.slice(-windowSliceCount);
    const length = Math.max(sliceA.length, sliceB.length);

    const result = [];
    for (let i = 0; i < length; i++) {
      const ptA = sliceA[i] || sliceA[sliceA.length - 1];
      const ptB = sliceB[i] || sliceB[sliceB.length - 1];
      const date = ptA?.date || ptB?.date || `Day ${i + 1}`;
      const fullDate = ptA?.fullDate || ptB?.fullDate || '';

      const rowsA = ptA?.rowCount || 0;
      const rowsB = ptB?.rowCount || 0;
      const rowDelta = rowsA - rowsB;

      const nullPctA = ptA?.nullPercentage || 0;
      const nullPctB = ptB?.nullPercentage || 0;

      const completenessA = ptA?.completenessPercentage || 0;
      const completenessB = ptB?.completenessPercentage || 0;

      const qualityA = ptA?.dataQualityScore || 0;
      const qualityB = ptB?.dataQualityScore || 0;

      const anomaliesA = ptA?.anomaliesCount || 0;
      const anomaliesB = ptB?.anomaliesCount || 0;

      const growthDeltaA = ptA?.rowGrowthDelta || 0;
      const growthDeltaB = ptB?.rowGrowthDelta || 0;

      result.push({
        date,
        fullDate,
        nameA: connectorA?.name || 'Connector A',
        nameB: connectorB?.name || 'Connector B',
        rowsA,
        rowsB,
        rowDelta,
        nullPctA,
        nullPctB,
        completenessA,
        completenessB,
        qualityA,
        qualityB,
        anomaliesA,
        anomaliesB,
        growthDeltaA,
        growthDeltaB,
      });
    }
    return result;
  }, [historicalTrendsA, historicalTrendsB, windowSliceCount, connectorA, connectorB]);

  // Combined Data Type Distribution for Recharts
  const combinedDataTypeData = useMemo(() => {
    const allTypes = new Set<string>();
    profileA.dataTypeDistribution.forEach((t) => allTypes.add(t.type));
    profileB.dataTypeDistribution.forEach((t) => allTypes.add(t.type));

    const defaultTypes = ['String', 'Decimal', 'Integer', 'DateTime', 'Boolean', 'JSON', 'Enum'];
    defaultTypes.forEach((t) => allTypes.add(t));

    return Array.from(allTypes).map((type) => {
      const typeA = profileA.dataTypeDistribution.find((t) => t.type === type);
      const typeB = profileB.dataTypeDistribution.find((t) => t.type === type);

      const countA = typeA?.count || 0;
      const countB = typeB?.count || 0;
      const pctA = typeA?.percentage || 0;
      const pctB = typeB?.percentage || 0;

      return {
        type,
        countA,
        countB,
        pctA,
        pctB,
        color: DATA_TYPE_COLORS[type] || '#6366f1',
      };
    }).sort((a, b) => (b.countA + b.countB) - (a.countA + a.countB));
  }, [profileA, profileB]);

  // Radar chart comparing architecture attributes
  const radarComparisonData = useMemo(() => {
    const normalize = (val: number, max: number) => Math.min(100, Math.max(10, Math.round((val / max) * 100)));

    return [
      {
        subject: 'Data Quality',
        A: profileA.dataQualityScore,
        B: profileB.dataQualityScore,
        fullMark: 100,
      },
      {
        subject: 'Completeness',
        A: profileA.overallCompletenessPercentage,
        B: profileB.overallCompletenessPercentage,
        fullMark: 100,
      },
      {
        subject: 'Schema Richness',
        A: normalize(profileA.totalColumns, 60),
        B: normalize(profileB.totalColumns, 60),
        fullMark: 100,
      },
      {
        subject: 'Entity Density',
        A: normalize(profileA.totalEntities, 8),
        B: normalize(profileB.totalEntities, 8),
        fullMark: 100,
      },
      {
        subject: 'Speed / Low Latency',
        A: Math.max(10, 100 - (connectorA?.latencyMs || 30) * 1.5),
        B: Math.max(10, 100 - (connectorB?.latencyMs || 30) * 1.5),
        fullMark: 100,
      },
      {
        subject: 'Low Null Rate',
        A: Math.max(10, 100 - profileA.overallNullPercentage * 10),
        B: Math.max(10, 100 - profileB.overallNullPercentage * 10),
        fullMark: 100,
      },
    ];
  }, [profileA, profileB, connectorA, connectorB]);

  // Swap Connectors A and B
  const handleSwapConnectors = () => {
    const temp = connectorAId;
    setConnectorAId(connectorBId);
    setConnectorBId(temp);
  };

  // Helper formatting
  const formatNumberShort = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  // Copy Executive Report to Clipboard
  const handleCopyReport = () => {
    if (!connectorA || !connectorB) return;
    const reportText = `=====================================================
ENTERPRISE CONNECTOR COMPARISON REPORT
Generated: ${new Date().toLocaleString()}
=====================================================

[CONNECTOR A]: ${connectorA.name} (${connectorA.provider})
- Category: ${connectorA.category} | System: ${connectorA.systemType} | Status: ${connectorA.status}
- Profiled Rows: ${profileA.totalRowCount.toLocaleString()}
- Entities / Tables: ${profileA.totalEntities}
- Discovered Columns: ${profileA.totalColumns}
- Completeness Rate: ${profileA.overallCompletenessPercentage}%
- Null Value Rate: ${profileA.overallNullPercentage}% (${profileA.totalNullValues.toLocaleString()} nulls)
- Composite Quality Score: ${profileA.dataQualityScore}/100
- Detected Anomalies: ${profileA.anomaliesDetectedCount}
- Latency: ${connectorA.latencyMs || 'N/A'}ms

[CONNECTOR B]: ${connectorB.name} (${connectorB.provider})
- Category: ${connectorB.category} | System: ${connectorB.systemType} | Status: ${connectorB.status}
- Profiled Rows: ${profileB.totalRowCount.toLocaleString()}
- Entities / Tables: ${profileB.totalEntities}
- Discovered Columns: ${profileB.totalColumns}
- Completeness Rate: ${profileB.overallCompletenessPercentage}%
- Null Value Rate: ${profileB.overallNullPercentage}% (${profileB.totalNullValues.toLocaleString()} nulls)
- Composite Quality Score: ${profileB.dataQualityScore}/100
- Detected Anomalies: ${profileB.anomaliesDetectedCount}
- Latency: ${connectorB.latencyMs || 'N/A'}ms

[COMPARATIVE DELTAS & ANALYSIS]:
- Volume Difference: ${Math.abs(profileA.totalRowCount - profileB.totalRowCount).toLocaleString()} rows (${profileA.totalRowCount >= profileB.totalRowCount ? `${connectorA.name} is larger` : `${connectorB.name} is larger`})
- Quality Delta: ${(profileA.dataQualityScore - profileB.dataQualityScore).toFixed(1)} pts (${profileA.dataQualityScore >= profileB.dataQualityScore ? `${connectorA.name} is cleaner` : `${connectorB.name} is cleaner`})
- Latency Advantage: ${Math.abs((connectorA.latencyMs || 0) - (connectorB.latencyMs || 0))}ms (${(connectorA.latencyMs || 0) <= (connectorB.latencyMs || 0) ? `${connectorA.name} is faster` : `${connectorB.name} is faster`})
=====================================================`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopiedNotification('Comparative report copied to clipboard');
      setTimeout(() => setCopiedNotification(null), 2500);
    });
  };

  // Export Combined CSV
  const handleExportCsv = () => {
    if (!connectorA || !connectorB) return;
    const headers = [
      'Date',
      'ConnectorA_Name',
      'ConnectorA_Rows',
      'ConnectorA_NullPct',
      'ConnectorA_QualityScore',
      'ConnectorA_DailyGrowth',
      'ConnectorB_Name',
      'ConnectorB_Rows',
      'ConnectorB_NullPct',
      'ConnectorB_QualityScore',
      'ConnectorB_DailyGrowth',
      'Row_Delta_A_minus_B',
    ];

    const rows = combinedHistoricalData.map((d) => [
      d.date,
      `"${connectorA.name}"`,
      d.rowsA,
      d.nullPctA,
      d.qualityA,
      d.growthDeltaA,
      `"${connectorB.name}"`,
      d.rowsB,
      d.nullPctB,
      d.qualityB,
      d.growthDeltaB,
      d.rowDelta,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Connector_Comparison_${connectorA.name.replace(/\s+/g, '_')}_vs_${connectorB.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div
      id="connector-comparison-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="connector-comparison-modal-window"
        className={`bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col transition-all duration-200 overflow-hidden ${
          isFullScreen ? 'w-full h-full max-h-[96vh]' : 'w-full max-w-7xl max-h-[90vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
              <GitCompare className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Universal Connector Profiling & Trend Comparison Engine
                </h2>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded-md border border-indigo-200">
                  Dual Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Visual side-by-side comparative profiling statistics, synchronized 30-day trajectories, and schema distributions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Copy Report Button */}
            <button
              id="comparison-copy-report-btn"
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Copy Summary Report to Clipboard"
            >
              {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedNotification ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            {/* Export CSV */}
            <button
              id="comparison-export-csv-btn"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Export Comparative CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              id="comparison-close-modal-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Close Comparison Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Dual Selector Bar (Connector A vs Connector B) */}
        <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-3 items-center">
            {/* Connector A Selector Box (Left, Indigo) */}
            <div className="lg:col-span-5 bg-white p-3.5 rounded-xl border-2 border-indigo-200/80 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded font-mono">
                    Connector A
                  </span>
                  <span className="text-xs font-bold text-slate-700">Primary Source / System</span>
                </div>
                {connectorA && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-200">
                    {connectorA.status} ({connectorA.latencyMs}ms)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <select
                  id="comparison-select-connector-a"
                  value={connectorAId}
                  onChange={(e) => setConnectorAId(e.target.value)}
                  className="flex-1 bg-slate-50 hover:bg-white text-slate-900 font-semibold text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {connectors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.provider} • {c.category})
                    </option>
                  ))}
                </select>
              </div>

              {connectorA && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">{connectorA.category}</span>
                    <span>•</span>
                    <span>{connectorA.authType}</span>
                  </div>
                  <div className="font-mono text-indigo-700 font-bold">
                    {profileA.totalRowCount.toLocaleString()} rows ({profileA.totalEntities} entities)
                  </div>
                </div>
              )}
            </div>

            {/* VS & Swap Control (Center) */}
            <div className="lg:col-span-1 flex flex-col items-center justify-center gap-1">
              <button
                id="comparison-swap-connectors-btn"
                onClick={handleSwapConnectors}
                className="p-2.5 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-full border border-slate-300 hover:border-indigo-300 shadow-2xs transition-all cursor-pointer group"
                title="Swap Connector A and Connector B"
              >
                <ArrowRightLeft className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest">
                VS
              </span>
            </div>

            {/* Connector B Selector Box (Right, Emerald/Teal) */}
            <div className="lg:col-span-5 bg-white p-3.5 rounded-xl border-2 border-emerald-200/80 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded font-mono">
                    Connector B
                  </span>
                  <span className="text-xs font-bold text-slate-700">Secondary / Target System</span>
                </div>
                {connectorB && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-200">
                    {connectorB.status} ({connectorB.latencyMs}ms)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <select
                  id="comparison-select-connector-b"
                  value={connectorBId}
                  onChange={(e) => setConnectorBId(e.target.value)}
                  className="flex-1 bg-slate-50 hover:bg-white text-slate-900 font-semibold text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {connectors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.provider} • {c.category})
                    </option>
                  ))}
                </select>
              </div>

              {connectorB && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">{connectorB.category}</span>
                    <span>•</span>
                    <span>{connectorB.authType}</span>
                  </div>
                  <div className="font-mono text-emerald-700 font-bold">
                    {profileB.totalRowCount.toLocaleString()} rows ({profileB.totalEntities} entities)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Executive Comparative AI / Statistical Insights Card */}
        {connectorA && connectorB && (
          <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-emerald-50/70 border-b border-slate-200 px-6 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-700">
                  <span className="font-bold text-slate-900">Comparative Assessment:</span>
                  <span>
                    <strong>{profileA.totalRowCount >= profileB.totalRowCount ? connectorA.name : connectorB.name}</strong> holds{' '}
                    <strong>{Math.abs(profileA.totalRowCount - profileB.totalRowCount).toLocaleString()} more rows</strong>.
                  </span>
                  <span>•</span>
                  <span>
                    Quality leader:{' '}
                    <strong>
                      {profileA.dataQualityScore >= profileB.dataQualityScore ? connectorA.name : connectorB.name}
                    </strong>{' '}
                    ({Math.max(profileA.dataQualityScore, profileB.dataQualityScore)} pts vs{' '}
                    {Math.min(profileA.dataQualityScore, profileB.dataQualityScore)} pts).
                  </span>
                  <span>•</span>
                  <span>
                    Null rate disparity:{' '}
                    <strong>{Math.abs(profileA.overallNullPercentage - profileB.overallNullPercentage).toFixed(2)}%</strong>.
                  </span>
                </div>
              </div>

              {/* Time Window Switcher */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] font-semibold text-slate-600 mr-1">Time Horizon:</span>
                {(['7d', '14d', '30d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      timeRange === range
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sub-Tab Navigation Bar */}
        <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto">
          <button
            id="comparison-tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Overview & Side-by-Side KPIs</span>
          </button>

          <button
            id="comparison-tab-trends"
            onClick={() => setActiveTab('trends')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'trends'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Combined Trend Recharts ({timeRange.toUpperCase()})</span>
            <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full">
              Synchronized
            </span>
          </button>

          <button
            id="comparison-tab-schema"
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'schema'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Data Type & Schema Distribution</span>
          </button>

          <button
            id="comparison-tab-entities"
            onClick={() => setActiveTab('entities')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'entities'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Discovered Entity Profiling Matrix</span>
            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full font-mono">
              {profileA.totalEntities} vs {profileB.totalEntities}
            </span>
          </button>

          <button
            id="comparison-tab-performance"
            onClick={() => setActiveTab('performance')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'performance'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Latency, Rate Limits & Throttling</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
          {/* TAB 1: OVERVIEW & SIDE-BY-SIDE KPIS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Profiled Rows */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold text-slate-700">Total Profiled Records</span>
                    <Database className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 my-1">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-indigo-700 font-bold">Conn A</div>
                      <div className="text-base font-extrabold text-slate-900 font-mono">
                        {formatNumberShort(profileA.totalRowCount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-emerald-700 font-bold">Conn B</div>
                      <div className="text-base font-extrabold text-slate-900 font-mono">
                        {formatNumberShort(profileB.totalRowCount)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Volume Delta:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {Math.abs(profileA.totalRowCount - profileB.totalRowCount).toLocaleString()} rows
                    </span>
                  </div>
                </div>

                {/* 2. Completeness Rate */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold text-slate-700">Data Completeness Rate</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 my-1">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-indigo-700 font-bold">Conn A</div>
                      <div className="text-base font-extrabold text-slate-900 font-mono">
                        {profileA.overallCompletenessPercentage}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-emerald-700 font-bold">Conn B</div>
                      <div className="text-base font-extrabold text-slate-900 font-mono">
                        {profileB.overallCompletenessPercentage}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Quality Margin:</span>
                    <span className={`font-bold font-mono ${profileA.overallCompletenessPercentage >= profileB.overallCompletenessPercentage ? 'text-indigo-700' : 'text-emerald-700'}`}>
                      {Math.abs(profileA.overallCompletenessPercentage - profileB.overallCompletenessPercentage).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* 3. Null Rate Disparity */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold text-slate-700">Missing / Null Rate</span>
                    <Percent className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 my-1">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-indigo-700 font-bold">Conn A</div>
                      <div className="text-base font-extrabold text-slate-900 font-mono">
                        {profileA.overallNullPercentage}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-emerald-700 font-bold">Conn B</div>
                      <div className="text-base font-extrabold text-slate-900 font-mono">
                        {profileB.overallNullPercentage}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Total Null Cells:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {formatNumberShort(profileA.totalNullValues)} vs {formatNumberShort(profileB.totalNullValues)}
                    </span>
                  </div>
                </div>

                {/* 4. Quality Score */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold text-slate-700">Composite Quality Score</span>
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 my-1">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-indigo-700 font-bold">Conn A</div>
                      <div className="text-base font-extrabold text-indigo-700 font-mono">
                        {profileA.dataQualityScore} / 100
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-emerald-700 font-bold">Conn B</div>
                      <div className="text-base font-extrabold text-emerald-700 font-mono">
                        {profileB.dataQualityScore} / 100
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Score Delta:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {Math.abs(profileA.dataQualityScore - profileB.dataQualityScore).toFixed(1)} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Detailed Specification Matrix Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                      Side-by-Side Telemetry & Structural Specification Matrix
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Direct attribute comparison across architecture, authentication, throughput, and hygiene metrics.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                        <th className="py-3 px-4 font-bold text-slate-700">Specification Metric</th>
                        <th className="py-3 px-4 font-bold text-indigo-700">
                          {connectorA?.name || 'Connector A'}
                        </th>
                        <th className="py-3 px-4 font-bold text-emerald-700">
                          {connectorB?.name || 'Connector B'}
                        </th>
                        <th className="py-3 px-4 font-bold text-slate-700 text-right">Variance / Delta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-800">Connector Category</td>
                        <td className="py-2.5 px-4 text-slate-700">{connectorA?.category}</td>
                        <td className="py-2.5 px-4 text-slate-700">{connectorB?.category}</td>
                        <td className="py-2.5 px-4 text-right font-sans text-slate-500">
                          {connectorA?.category === connectorB?.category ? 'Identical Category' : 'Heterogeneous'}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-800">System Role & Provider</td>
                        <td className="py-2.5 px-4 text-slate-700">{connectorA?.systemType} ({connectorA?.provider})</td>
                        <td className="py-2.5 px-4 text-slate-700">{connectorB?.systemType} ({connectorB?.provider})</td>
                        <td className="py-2.5 px-4 text-right font-sans text-slate-500">—</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-800">Authentication Protocol</td>
                        <td className="py-2.5 px-4 text-slate-700">{connectorA?.authType}</td>
                        <td className="py-2.5 px-4 text-slate-700">{connectorB?.authType}</td>
                        <td className="py-2.5 px-4 text-right font-sans text-slate-500">
                          {connectorA?.authType === connectorB?.authType ? 'Matching Protocol' : 'Different Auth'}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-800">Connection Latency</td>
                        <td className="py-2.5 px-4 text-slate-700">{connectorA?.latencyMs} ms</td>
                        <td className="py-2.5 px-4 text-slate-700">{connectorB?.latencyMs} ms</td>
                        <td className="py-2.5 px-4 text-right">
                          <span className={`font-bold ${(connectorA?.latencyMs || 0) <= (connectorB?.latencyMs || 0) ? 'text-indigo-600' : 'text-emerald-600'}`}>
                            {Math.abs((connectorA?.latencyMs || 0) - (connectorB?.latencyMs || 0))} ms delta
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-800">Profiled Entities / Tables</td>
                        <td className="py-2.5 px-4 text-slate-700">{profileA.totalEntities} entities</td>
                        <td className="py-2.5 px-4 text-slate-700">{profileB.totalEntities} entities</td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="font-bold text-slate-700">
                            {Math.abs(profileA.totalEntities - profileB.totalEntities)} entities
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-800">Total Columns Discovered</td>
                        <td className="py-2.5 px-4 text-slate-700">{profileA.totalColumns} columns</td>
                        <td className="py-2.5 px-4 text-slate-700">{profileB.totalColumns} columns</td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="font-bold text-slate-700">
                            {Math.abs(profileA.totalColumns - profileB.totalColumns)} columns
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-800">Total Profiled Records</td>
                        <td className="py-2.5 px-4 text-indigo-700 font-bold">{profileA.totalRowCount.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-emerald-700 font-bold">{profileB.totalRowCount.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                          {Math.abs(profileA.totalRowCount - profileB.totalRowCount).toLocaleString()} rows
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-800">Estimated Dataset Size</td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {((profileA.totalRowCount * profileA.totalColumns * 128) / (1024 * 1024)).toFixed(1)} MB
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {((profileB.totalRowCount * profileB.totalColumns * 128) / (1024 * 1024)).toFixed(1)} MB
                        </td>
                        <td className="py-2.5 px-4 text-right font-sans text-slate-500">Calculated schema estimate</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-800">Data Quality Score</td>
                        <td className="py-2.5 px-4 text-indigo-700 font-bold">{profileA.dataQualityScore} / 100</td>
                        <td className="py-2.5 px-4 text-emerald-700 font-bold">{profileB.dataQualityScore} / 100</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                          {(profileA.dataQualityScore - profileB.dataQualityScore).toFixed(1)} pts
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-800">Detected Schema Anomalies</td>
                        <td className="py-2.5 px-4 text-slate-700">{profileA.anomaliesDetectedCount} anomalies</td>
                        <td className="py-2.5 px-4 text-slate-700">{profileB.anomaliesDetectedCount} anomalies</td>
                        <td className="py-2.5 px-4 text-right font-sans text-slate-500">
                          {profileA.anomaliesDetectedCount === profileB.anomaliesDetectedCount ? 'Identical Count' : 'Variance'}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-800">Throttling Max Capacity</td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {connectorA?.throttlingConfig?.maxRequestsPerSecond || 50} req/s
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {connectorB?.throttlingConfig?.maxRequestsPerSecond || 50} req/s
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                          {Math.abs((connectorA?.throttlingConfig?.maxRequestsPerSecond || 50) - (connectorB?.throttlingConfig?.maxRequestsPerSecond || 50))} req/s
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Multi-Dimensional Radar Chart Comparison */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-indigo-600" />
                      Multi-Dimensional Architecture & Hygiene Radar
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Normalized benchmark profile comparing quality, completeness, richness, speed, and integrity.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-indigo-700">
                      <span className="w-3 h-3 rounded bg-indigo-500/80 inline-block" />
                      {connectorA?.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-3 h-3 rounded bg-emerald-500/80 inline-block" />
                      {connectorB?.name}
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarComparisonData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
                      <Radar
                        name={connectorA?.name || 'Connector A'}
                        dataKey="A"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.4}
                      />
                      <Radar
                        name={connectorB?.name || 'Connector B'}
                        dataKey="B"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.4}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '0.75rem',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMBINED TREND RECHARTS */}
          {activeTab === 'trends' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Chart 1: Combined Row Growth Area/Line Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      Combined Record Volume Trajectory (Last {windowSliceCount} Days)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Synchronized dataset row count growth curve for Connector A (Indigo) vs Connector B (Emerald).
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-indigo-700">
                      <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
                      {connectorA?.name} ({formatNumberShort(profileA.totalRowCount)})
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                      {connectorB?.name} ({formatNumberShort(profileB.totalRowCount)})
                    </span>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedHistoricalData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRowsA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorRowsB" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(val) => formatNumberShort(val)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '0.75rem',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                        formatter={(value: any, name: any) => {
                          const valNum = Number(value);
                          if (name === 'rowsA') return [valNum.toLocaleString() + ' rows', connectorA?.name || 'Connector A'];
                          if (name === 'rowsB') return [valNum.toLocaleString() + ' rows', connectorB?.name || 'Connector B'];
                          return [valNum, name];
                        }}
                        labelFormatter={(label) => `Timeline Date: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="rowsA"
                        name="rowsA"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRowsA)"
                      />
                      <Area
                        type="monotone"
                        dataKey="rowsB"
                        name="rowsB"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRowsB)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Data Quality & Completeness Multi-Line Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Data Quality Trajectory */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        Data Quality Score Trajectory (0 - 100)
                      </h4>
                      <p className="text-[11px] text-slate-500">Daily health score tracking hygiene progress.</p>
                    </div>
                  </div>

                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={combinedHistoricalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                        <YAxis domain={[80, 100]} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            borderRadius: '0.5rem',
                            fontSize: '11px',
                          }}
                        />
                        <Line type="monotone" dataKey="qualityA" name={connectorA?.name || 'Conn A'} stroke="#6366f1" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="qualityB" name={connectorB?.name || 'Conn B'} stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Null Rate Disparity Trajectory */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Percent className="w-4 h-4 text-amber-500" />
                        Null Value Percentage Trajectory (%)
                      </h4>
                      <p className="text-[11px] text-slate-500">Lower is better. Tracking missing attribute rate reduction.</p>
                    </div>
                  </div>

                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={combinedHistoricalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} unit="%" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            borderRadius: '0.5rem',
                            fontSize: '11px',
                          }}
                        />
                        <Line type="monotone" dataKey="nullPctA" name={connectorA?.name || 'Conn A'} stroke="#6366f1" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="nullPctB" name={connectorB?.name || 'Conn B'} stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Chart 3: Daily Ingestion Batch Volume BarChart */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      Daily Delta Intake & Record Ingestion Rate
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      New record mutations absorbed daily by each connector feed.
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={combinedHistoricalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} tickFormatter={(v) => formatNumberShort(v)} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '0.5rem',
                          fontSize: '11px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="growthDeltaA" name={connectorA?.name || 'Connector A'} fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="growthDeltaB" name={connectorB?.name || 'Connector B'} fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCHEMA & DATA TYPE DISTRIBUTION */}
          {activeTab === 'schema' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Grouped Bar Chart of Data Types */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      Comparative Column Data Type Distribution
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Count of columns by physical type (String, Decimal, Integer, DateTime, Boolean, JSON) discovered in both systems.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-indigo-700">
                      <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                      {connectorA?.name} ({profileA.totalColumns} cols)
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                      {connectorB?.name} ({profileB.totalColumns} cols)
                    </span>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={combinedDataTypeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="type" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '0.75rem',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                        formatter={(val: any, name: any) => [
                          `${val} columns`,
                          name === 'countA' ? connectorA?.name : connectorB?.name,
                        ]}
                      />
                      <Bar dataKey="countA" name="countA" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="countB" name="countB" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Type Percentage Breakdown Matrix Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Data Type Percentage Allocation & Compatibility Matrix
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Breakdown of percentage share of schema columns per data primitive.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                        <th className="py-3 px-4 font-bold">Data Type</th>
                        <th className="py-3 px-4 font-bold text-indigo-700">{connectorA?.name} (Count / Share)</th>
                        <th className="py-3 px-4 font-bold text-emerald-700">{connectorB?.name} (Count / Share)</th>
                        <th className="py-3 px-4 font-bold text-slate-700 text-right">Mapping Compatibility</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {combinedDataTypeData.map((dt) => (
                        <tr key={dt.type} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-sans font-semibold text-slate-800 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dt.color }} />
                            {dt.type}
                          </td>
                          <td className="py-2.5 px-4 text-slate-700">
                            {dt.countA} cols ({dt.pctA}%)
                          </td>
                          <td className="py-2.5 px-4 text-slate-700">
                            {dt.countB} cols ({dt.pctB}%)
                          </td>
                          <td className="py-2.5 px-4 text-right font-sans">
                            {dt.countA > 0 && dt.countB > 0 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> High Homogeneity
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5" /> Transform Needed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DISCOVERED ENTITY PROFILING MATRIX */}
          {activeTab === 'entities' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Connector A Entities List */}
                <div className="bg-white rounded-2xl border border-indigo-200/80 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-indigo-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded font-mono">
                        Connector A
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{connectorA?.name}</h4>
                    </div>
                    <span className="text-xs font-mono text-indigo-700 font-bold">
                      {profileA.totalEntities} Profiled Entities
                    </span>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {profileA.entityProfiles && profileA.entityProfiles.length > 0 ? (
                      profileA.entityProfiles.map((ent, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 transition-all text-xs"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-slate-900 font-mono truncate">{ent.entityName}</span>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold rounded text-[10px] shrink-0">
                              {ent.rowCount.toLocaleString()} rows
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-2">
                            <span>{ent.columnCount} Columns</span>
                            <span>Completeness: {ent.completenessPercentage}%</span>
                            <span>Nulls: {ent.nullPercentage}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400 font-medium">
                        Standard unified schema profile active ({profileA.totalRowCount.toLocaleString()} records).
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector B Entities List */}
                <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded font-mono">
                        Connector B
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{connectorB?.name}</h4>
                    </div>
                    <span className="text-xs font-mono text-emerald-700 font-bold">
                      {profileB.totalEntities} Profiled Entities
                    </span>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {profileB.entityProfiles && profileB.entityProfiles.length > 0 ? (
                      profileB.entityProfiles.map((ent, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-300 transition-all text-xs"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-slate-900 font-mono truncate">{ent.entityName}</span>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono font-bold rounded text-[10px] shrink-0">
                              {ent.rowCount.toLocaleString()} rows
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-2">
                            <span>{ent.columnCount} Columns</span>
                            <span>Completeness: {ent.completenessPercentage}%</span>
                            <span>Nulls: {ent.nullPercentage}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-400 font-medium">
                        Standard unified schema profile active ({profileB.totalRowCount.toLocaleString()} records).
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LATENCY, RATE LIMITS & THROTTLING */}
          {activeTab === 'performance' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Connector A Performance Card */}
                <div className="bg-white rounded-2xl border border-indigo-200/80 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded font-mono">
                        Connector A
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{connectorA?.name}</h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-700">
                      {connectorA?.latencyMs} ms
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Max RPS Throughput:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {connectorA?.throttlingConfig?.maxRequestsPerSecond || 50} req/sec
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Max Concurrency:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {connectorA?.throttlingConfig?.maxConcurrentRequests || 8} threads
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Retry Strategy:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {connectorA?.throttlingConfig?.retryStrategy || 'ExponentialBackoff'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Auto Cooldown on HTTP 429:</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {connectorA?.throttlingConfig?.autoCooldownOn429 !== false ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connector B Performance Card */}
                <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded font-mono">
                        Connector B
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{connectorB?.name}</h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      {connectorB?.latencyMs} ms
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Max RPS Throughput:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {connectorB?.throttlingConfig?.maxRequestsPerSecond || 50} req/sec
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Max Concurrency:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {connectorB?.throttlingConfig?.maxConcurrentRequests || 8} threads
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Retry Strategy:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {connectorB?.throttlingConfig?.retryStrategy || 'ExponentialBackoff'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Auto Cooldown on HTTP 429:</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {connectorB?.throttlingConfig?.autoCooldownOn429 !== false ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Dual Telemetry synchronized in real-time.</span>
          </div>

          <div className="flex items-center gap-2">
            {onSelectConnectorForDetails && connectorA && (
              <button
                onClick={() => {
                  onClose();
                  onSelectConnectorForDetails(connectorA);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                Inspect {connectorA.name}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Close Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
