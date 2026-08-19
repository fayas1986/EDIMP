import React, { useState, useMemo } from 'react';
import {
  Connector,
  ConnectorFailurePrediction,
  ProactiveMitigationAction,
} from '../types';
import {
  analyzeConnectorFailurePrediction,
} from '../services/connectorFailurePredictionService';
import {
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
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import {
  AlertTriangle,
  ShieldCheck,
  Activity,
  Zap,
  TrendingUp,
  Clock,
  Gauge,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Info,
  Server,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Search,
  Filter,
  Check,
  Radio,
  SlidersHorizontal,
  Flame,
  ChevronRight,
  ShieldAlert,
  AlertCircle,
  Cpu,
  Layers,
} from 'lucide-react';

interface PredictiveFailureIntelligencePanelProps {
  connectors: Connector[];
  initialSelectedConnectorId?: string;
  onApplyMitigationToConnector?: (connectorId: string, action: ProactiveMitigationAction) => void;
  onOpenThrottlingConfig?: (connector: Connector) => void;
}

export const PredictiveFailureIntelligencePanel: React.FC<PredictiveFailureIntelligencePanelProps> = ({
  connectors,
  initialSelectedConnectorId,
  onApplyMitigationToConnector,
  onOpenThrottlingConfig,
}) => {
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>(
    initialSelectedConnectorId || (connectors.find((c) => c.id === 'conn-netsuite-erp')?.id || connectors[0]?.id || '')
  );

  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL_HIGH' | 'MODERATE' | 'NOMINAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVisualizerTab, setActiveVisualizerTab] = useState<'forecast' | 'error_correlation' | 'percentiles' | 'jitter'>('forecast');
  const [sensitivityThreshold, setSensitivityThreshold] = useState<number>(2.0);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'Adaptive_EMA' | 'P99_Breach' | 'Z_Score' | 'MultiVariate'>('Adaptive_EMA');

  // Interactive local mitigation & simulation state per connector
  const [mitigatedConnectors, setMitigatedConnectors] = useState<Record<string, { isMitigated: boolean; appliedActionIds: string[] }>>({
    'conn-netsuite-erp': { isMitigated: false, appliedActionIds: [] },
  });

  const [simulatedSpikes, setSimulatedSpikes] = useState<Record<string, number>>({});
  const [mitigationToast, setMitigationToast] = useState<{ connectorName: string; actionTitle: string } | null>(null);

  // Analyze all connectors and cache predictions
  const predictionsMap: Record<string, ConnectorFailurePrediction> = useMemo(() => {
    const map: Record<string, ConnectorFailurePrediction> = {};
    connectors.forEach((conn) => {
      const state = mitigatedConnectors[conn.id];
      const simulatedSpike = simulatedSpikes[conn.id] || 0;
      map[conn.id] = analyzeConnectorFailurePrediction(conn, {
        simulatedSpikeMs: simulatedSpike,
        isMitigated: state?.isMitigated,
        appliedActionIds: state?.appliedActionIds,
      });
    });
    return map;
  }, [connectors, mitigatedConnectors, simulatedSpikes, sensitivityThreshold, selectedAlgorithm]);

  // Selected Connector and Prediction
  const selectedConnector = connectors.find((c) => c.id === selectedConnectorId) || connectors[0];
  const activePrediction = selectedConnector ? predictionsMap[selectedConnector.id] : null;

  // Filtered connectors for selection list
  const filteredConnectors = useMemo(() => {
    return connectors.filter((conn) => {
      const pred = predictionsMap[conn.id];
      if (!pred) return true;

      // Search match
      const matchesSearch =
        conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conn.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conn.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Risk filter
      if (riskFilter === 'CRITICAL_HIGH') {
        return pred.riskLevel === 'Critical' || pred.riskLevel === 'High';
      }
      if (riskFilter === 'MODERATE') {
        return pred.riskLevel === 'Moderate';
      }
      if (riskFilter === 'NOMINAL') {
        return pred.riskLevel === 'Nominal';
      }
      return true;
    });
  }, [connectors, predictionsMap, searchQuery, riskFilter]);

  // High level overview metrics across the entire enterprise estate
  const summaryMetrics = useMemo(() => {
    const all = Object.values(predictionsMap);
    const criticalCount = all.filter((p) => p.riskLevel === 'Critical').length;
    const highCount = all.filter((p) => p.riskLevel === 'High').length;
    const moderateCount = all.filter((p) => p.riskLevel === 'Moderate').length;
    const nominalCount = all.filter((p) => p.riskLevel === 'Nominal').length;

    // Find earliest failure window
    const highRiskPreds = all.filter((p) => p.riskLevel === 'Critical' || p.riskLevel === 'High');
    const earliestWindow = highRiskPreds[0]?.predictedFailureWindow || 'Nominal (>48h)';

    // Average risk score
    const avgRisk = all.length > 0 ? Math.round(all.reduce((acc, p) => acc + p.riskScore, 0) / all.length) : 0;

    return {
      total: all.length,
      criticalCount,
      highCount,
      moderateCount,
      nominalCount,
      imminentTotal: criticalCount + highCount,
      earliestWindow,
      avgRisk,
    };
  }, [predictionsMap]);

  // Handle 1-click Proactive Mitigation execution
  const handleExecuteMitigation = (action: ProactiveMitigationAction) => {
    if (!selectedConnector || !activePrediction) return;

    const current = mitigatedConnectors[selectedConnector.id] || { isMitigated: false, appliedActionIds: [] };
    const updatedActionIds = Array.from(new Set([...current.appliedActionIds, action.id]));

    setMitigatedConnectors((prev) => ({
      ...prev,
      [selectedConnector.id]: {
        isMitigated: true,
        appliedActionIds: updatedActionIds,
      },
    }));

    // Reset simulated spike on mitigation
    setSimulatedSpikes((prev) => ({
      ...prev,
      [selectedConnector.id]: 0,
    }));

    setMitigationToast({
      connectorName: selectedConnector.name,
      actionTitle: action.title,
    });

    if (onApplyMitigationToConnector) {
      onApplyMitigationToConnector(selectedConnector.id, { ...action, isApplied: true });
    }

    setTimeout(() => {
      setMitigationToast(null);
    }, 6000);
  };

  // Reset mitigation to test failure scenarios again
  const handleResetMitigation = (connectorId: string) => {
    setMitigatedConnectors((prev) => ({
      ...prev,
      [connectorId]: { isMitigated: false, appliedActionIds: [] },
    }));
  };

  // Inject synthetic latency spike for stress testing
  const handleInjectSyntheticSpike = (magnitudeMs: number) => {
    if (!selectedConnector) return;
    setSimulatedSpikes((prev) => ({
      ...prev,
      [selectedConnector.id]: (prev[selectedConnector.id] || 0) + magnitudeMs,
    }));
    // Unset mitigation if simulating a fresh breach
    setMitigatedConnectors((prev) => ({
      ...prev,
      [selectedConnector.id]: { isMitigated: false, appliedActionIds: [] },
    }));
  };

  // Combined Chart Data: 24h historical + 6h forecast
  const combinedTrajectoryData = useMemo(() => {
    if (!activePrediction) return [];

    const historical = activePrediction.timeSeriesTrends.map((pt) => ({
      label: pt.timestamp,
      fullLabel: pt.fullTimeLabel,
      type: 'Historical',
      latency: pt.latencyMs,
      p99: pt.p99Ms,
      baseline: pt.baselineLatencyMs,
      threshold: activePrediction.timeSeriesTrends[0]?.latencyMs ? 450 : 400,
      isSpike: pt.isSpike,
      errorRate: pt.errorRatePct,
      throttling429: pt.throttling429Count,
      jitter: pt.jitterMs,
      forecast: null,
      upperConfidence: null,
      lowerConfidence: null,
    }));

    // Link the last historical point to forecast start for smooth visual line
    const lastHistorical = activePrediction.timeSeriesTrends[activePrediction.timeSeriesTrends.length - 1];

    const forecast = activePrediction.forecastPoints.map((fc, idx) => ({
      label: fc.timestamp,
      fullLabel: `Forecast ${fc.timestamp}`,
      type: 'Forecast',
      latency: idx === 0 ? lastHistorical.latencyMs : null,
      p99: null,
      baseline: activePrediction.baselineLatencyMs,
      threshold: fc.failureThresholdMs,
      isSpike: fc.isBreachExpected,
      errorRate: fc.predictedErrorRatePct,
      throttling429: Math.round(fc.predictedErrorRatePct * 3),
      jitter: Math.round(fc.predictedLatencyMs * 0.2),
      forecast: fc.predictedLatencyMs,
      upperConfidence: fc.upperConfidenceMs,
      lowerConfidence: fc.lowerConfidenceMs,
    }));

    return [...historical, ...forecast];
  }, [activePrediction]);

  // Color helper for risk levels
  const getRiskBadge = (level: 'Critical' | 'High' | 'Moderate' | 'Nominal', score: number) => {
    switch (level) {
      case 'Critical':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          indicator: 'bg-rose-500',
          border: 'border-rose-300',
          text: 'text-rose-700',
          title: 'Imminent Failure Risk',
        };
      case 'High':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          indicator: 'bg-amber-500',
          border: 'border-amber-300',
          text: 'text-amber-700',
          title: 'Degradation Warning',
        };
      case 'Moderate':
        return {
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
          indicator: 'bg-indigo-500',
          border: 'border-indigo-300',
          text: 'text-indigo-700',
          title: 'Elevated Jitter',
        };
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          indicator: 'bg-emerald-500',
          border: 'border-emerald-300',
          text: 'text-emerald-700',
          title: 'Nominal Baseline',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Mitigation Confirmation Toast */}
      {mitigationToast && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="font-bold text-sm">
                Proactive Mitigation Successfully Applied to {mitigationToast.connectorName}
              </div>
              <div className="text-xs text-emerald-100 mt-0.5">
                Executed: <strong>{mitigationToast.actionTitle}</strong>. Latency trajectory cooled down to nominal baseline.
              </div>
            </div>
          </div>
          <button
            onClick={() => setMitigationToast(null)}
            className="text-emerald-200 hover:text-white px-2 py-1 text-xs font-bold font-mono"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* TOP INTELLIGENCE SUMMARY STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Imminent Failure Warnings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono uppercase tracking-wider">
            <span>Proactive Failure Flags</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {summaryMetrics.imminentTotal}
            </span>
            <span className="text-xs font-bold text-slate-500">
              / {summaryMetrics.total} Connectors Flagged
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-full border border-rose-200 font-mono text-[10px]">
              {summaryMetrics.criticalCount} Critical
            </span>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-full border border-amber-200 font-mono text-[10px]">
              {summaryMetrics.highCount} High Warning
            </span>
          </div>
        </div>

        {/* Card 2: Earliest Time-to-Failure Horizon */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono uppercase tracking-wider">
            <span>Earliest Failure Horizon</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono">
            {summaryMetrics.earliestWindow}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Based on P99 spike acceleration rate (+72 ms/h)
          </div>
        </div>

        {/* Card 3: Enterprise Latency Anomaly Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono uppercase tracking-wider">
            <span>Overall Risk Index</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {summaryMetrics.avgRisk}%
            </span>
            <span className="text-xs font-bold text-slate-500">
              Avg Failure Probability
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Continuous 24h rolling regression & Z-score
          </div>
        </div>

        {/* Card 4: Automated Mitigation Readiness */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono uppercase tracking-wider">
            <span>Remediation Engine</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active & Guarded</span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            4 Auto-actions armed • 0 manual downtime
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & ALGORITHM TUNING BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Risk Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Risk Filter:
          </span>
          <button
            onClick={() => setRiskFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              riskFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Connectors ({connectors.length})
          </button>
          <button
            onClick={() => setRiskFilter('CRITICAL_HIGH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              riskFilter === 'CRITICAL_HIGH'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Imminent & High ({summaryMetrics.imminentTotal})</span>
          </button>
          <button
            onClick={() => setRiskFilter('MODERATE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              riskFilter === 'MODERATE'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            Elevated Jitter ({summaryMetrics.moderateCount})
          </button>
          <button
            onClick={() => setRiskFilter('NOMINAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              riskFilter === 'NOMINAL'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Nominal ({summaryMetrics.nominalCount})
          </button>
        </div>

        {/* Right: Search & Algorithm Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-500 font-bold">Model:</span>
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Adaptive_EMA">Adaptive EMA + Spikes (Recommended)</option>
              <option value="P99_Breach">P99 Tail SLA Breach Threshold</option>
              <option value="Z_Score">Rolling Z-Score / MAD Anomaly</option>
              <option value="MultiVariate">Multi-Variate Latency-Error Model</option>
            </select>
          </div>

          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search connector..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* MAIN DUAL-PANE INTELLIGENCE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Monitored Connectors List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-extrabold text-slate-800 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4 text-indigo-600" />
              Connector Risk Matrix ({filteredConnectors.length})
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Sorted by Risk Severity
            </span>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredConnectors
              .sort((a, b) => {
                const scoreA = predictionsMap[a.id]?.riskScore || 0;
                const scoreB = predictionsMap[b.id]?.riskScore || 0;
                return scoreB - scoreA;
              })
              .map((conn) => {
                const pred = predictionsMap[conn.id];
                const isSelected = selectedConnectorId === conn.id;
                const badge = getRiskBadge(pred?.riskLevel || 'Nominal', pred?.riskScore || 0);

                return (
                  <button
                    key={conn.id}
                    onClick={() => setSelectedConnectorId(conn.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-white border-indigo-500 ring-2 ring-indigo-200 shadow-md'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate" title={conn.name}>
                            {conn.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 block truncate mt-0.5">
                          {conn.provider} • {conn.category}
                        </span>
                      </div>

                      {/* Risk Score Pill */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold border flex items-center gap-1 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.indicator} ${pred?.riskLevel === 'Critical' ? 'animate-ping' : ''}`} />
                          <span>{pred?.riskScore}% Risk</span>
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                          Grade: <strong className="text-slate-700">{pred?.healthGrade}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Latency Metrics Strip */}
                    <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-400 block text-[9px]">Latency:</span>
                        <strong className={pred && pred.currentLatencyMs > pred.baselineLatencyMs * 2 ? 'text-rose-600' : 'text-slate-800'}>
                          {pred?.currentLatencyMs}ms
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">Baseline:</span>
                        <strong className="text-slate-600">{pred?.baselineLatencyMs}ms</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">Failure Window:</span>
                        <strong className={pred?.riskLevel === 'Critical' ? 'text-rose-600' : 'text-slate-700'} title={pred?.predictedFailureWindow}>
                          {pred?.predictedFailureWindow ? pred.predictedFailureWindow.split('(')[0] : 'N/A'}
                        </strong>
                      </div>
                    </div>

                    {/* Footer Warning Snippet */}
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-100">
                      <span className="text-slate-500 truncate max-w-[210px]" title={pred?.primaryRiskFactor}>
                        {pred?.isMitigated ? '🛡️ Stabilized via mitigation' : pred?.primaryRiskFactor}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-400'}`} />
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* RIGHT COLUMN: Deep-Dive Predictive Diagnostics & Forecast (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedConnector && activePrediction ? (
            <>
              {/* Selected Connector Header Banner */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl border shrink-0 ${
                      activePrediction.riskLevel === 'Critical'
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : activePrediction.riskLevel === 'High'
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    }`}>
                      {activePrediction.riskLevel === 'Critical' ? (
                        <Flame className="w-6 h-6 animate-pulse" />
                      ) : (
                        <Activity className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">
                          {selectedConnector.name}
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase border ${getRiskBadge(activePrediction.riskLevel, activePrediction.riskScore).bg}`}>
                          {activePrediction.riskLevel} Flag ({activePrediction.riskScore}% Risk)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {activePrediction.primaryRiskFactor}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Simulation Trigger */}
                  <div className="flex items-center gap-2">
                    {activePrediction.isMitigated ? (
                      <button
                        onClick={() => handleResetMitigation(selectedConnector.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer"
                        title="Reset mitigation to test failure simulation"
                      >
                        Reset Mitigation
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInjectSyntheticSpike(150)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1"
                        title="Simulate upstream latency spike (+150ms) to test predictive alert trigger"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                        <span>Inject +150ms Spike</span>
                      </button>
                    )}

                    {onOpenThrottlingConfig && (
                      <button
                        onClick={() => onOpenThrottlingConfig(selectedConnector)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Throttling Config</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Key Telemetry Metrics Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Current Latency vs Baseline
                    </span>
                    <div className="text-lg font-black font-mono flex items-baseline gap-1">
                      <span className={activePrediction.currentLatencyMs > activePrediction.baselineLatencyMs * 2 ? 'text-rose-600' : 'text-slate-900'}>
                        {activePrediction.currentLatencyMs}ms
                      </span>
                      <span className="text-xs text-slate-400 font-normal">
                        (Base {activePrediction.baselineLatencyMs}ms)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      P99 Tail SLA Latency
                    </span>
                    <div className="text-lg font-black font-mono text-indigo-700">
                      {activePrediction.p99LatencyMs}ms
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Spike Velocity (Slope)
                    </span>
                    <div className="text-lg font-black font-mono flex items-center gap-1 text-amber-600">
                      <span>+{activePrediction.spikeVelocityMsPerHour}</span>
                      <span className="text-xs font-normal text-slate-500">ms/h</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Predicted Failure Window
                    </span>
                    <div className={`text-sm font-extrabold font-mono truncate ${
                      activePrediction.riskLevel === 'Critical' ? 'text-rose-600' : 'text-slate-800'
                    }`} title={activePrediction.predictedFailureWindow}>
                      {activePrediction.predictedFailureWindow}
                    </div>
                  </div>
                </div>
              </div>

              {/* FORECAST & HISTORICAL VISUALIZATION SUITE */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                {/* Visualizer Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-mono flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span>Historical Latency Trend & Proactive Failure Horizon Forecast</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      24-hour historical telemetry paired with forward 6-hour predictive regression curve.
                    </p>
                  </div>

                  <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-mono font-bold">
                    <button
                      onClick={() => setActiveVisualizerTab('forecast')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        activeVisualizerTab === 'forecast'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Failure Forecast (6h)
                    </button>
                    <button
                      onClick={() => setActiveVisualizerTab('error_correlation')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        activeVisualizerTab === 'error_correlation'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Spikes vs Errors (429)
                    </button>
                    <button
                      onClick={() => setActiveVisualizerTab('percentiles')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        activeVisualizerTab === 'percentiles'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tail Percentiles (P99)
                    </button>
                  </div>
                </div>

                {/* Main Dynamic Chart */}
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeVisualizerTab === 'forecast' ? (
                      <ComposedChart data={combinedTrajectoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorHistoricalLatency" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                        <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="ms" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-white border border-slate-200 text-slate-900 text-xs p-3 rounded-xl shadow-lg font-mono space-y-1.5 min-w-[220px]">
                                  <div className="font-bold border-b border-slate-100 pb-1 flex justify-between">
                                    <span>{d.fullLabel}</span>
                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                      d.type === 'Forecast' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                                    }`}>
                                      {d.type}
                                    </span>
                                  </div>
                                  {d.latency !== null && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Historical Latency:</span>
                                      <strong className="text-indigo-600">{d.latency} ms</strong>
                                    </div>
                                  )}
                                  {d.forecast !== null && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Projected Failure Trajectory:</span>
                                      <strong className="text-rose-600">{d.forecast} ms</strong>
                                    </div>
                                  )}
                                  {d.upperConfidence !== null && (
                                    <div className="flex justify-between text-[11px] text-slate-500">
                                      <span>95% Confidence Band:</span>
                                      <span>{d.lowerConfidence}ms - {d.upperConfidence}ms</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between border-t border-slate-100 pt-1 text-[11px]">
                                    <span className="text-slate-400">Socket Timeout Limit:</span>
                                    <span className="text-rose-600 font-bold">{d.threshold} ms</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine
                          y={activePrediction.timeSeriesTrends[0]?.latencyMs ? 450 : 400}
                          stroke="#e11d48"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{ value: 'Hard Socket Timeout Threshold (450ms)', position: 'insideTopRight', fill: '#e11d48', fontSize: 10, fontWeight: 'bold' }}
                        />
                        <ReferenceLine
                          y={activePrediction.baselineLatencyMs}
                          stroke="#10b981"
                          strokeDasharray="3 3"
                          strokeWidth={1}
                          label={{ value: `Baseline (${activePrediction.baselineLatencyMs}ms)`, position: 'insideBottomLeft', fill: '#10b981', fontSize: 10 }}
                        />
                        {/* Shaded Upper/Lower Confidence Forecast Band */}
                        <Area
                          type="monotone"
                          dataKey="upperConfidence"
                          stroke="none"
                          fill="url(#colorConfidence)"
                          name="95% Confidence Area"
                        />
                        {/* Historical Observed Latency */}
                        <Area
                          type="monotone"
                          dataKey="latency"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fill="url(#colorHistoricalLatency)"
                          name="Observed Latency (ms)"
                        />
                        {/* Forward Forecast Projected Trajectory */}
                        <Line
                          type="monotone"
                          dataKey="forecast"
                          stroke="#e11d48"
                          strokeWidth={2.5}
                          strokeDasharray="5 5"
                          dot={{ r: 3, fill: '#e11d48' }}
                          name="Predicted Failure Curve (ms)"
                        />
                      </ComposedChart>
                    ) : activeVisualizerTab === 'error_correlation' ? (
                      <ComposedChart data={activePrediction.timeSeriesTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                        <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickLine={false} unit="ms" />
                        <YAxis yAxisId="right" orientation="right" stroke="#e11d48" fontSize={10} tickLine={false} unit="%" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-white border border-slate-200 text-slate-900 text-xs p-3 rounded-xl shadow-lg font-mono space-y-1">
                                  <div className="font-bold border-b border-slate-100 pb-1">{d.fullTimeLabel}</div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Latency:</span>
                                    <strong className="text-indigo-600">{d.latencyMs} ms</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Error / 429 Rate:</span>
                                    <strong className="text-rose-600">{d.errorRatePct}%</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">HTTP 429 Cascades:</span>
                                    <strong className="text-amber-600">{d.throttling429Count} reqs</strong>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar yAxisId="right" dataKey="errorRatePct" fill="#f43f5e" opacity={0.7} name="Error Rate (%)" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="left" type="monotone" dataKey="latencyMs" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 2 }} name="Latency (ms)" />
                      </ComposedChart>
                    ) : (
                      <AreaChart data={activePrediction.timeSeriesTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorP99" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                        <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="ms" />
                        <Tooltip />
                        <Area type="monotone" dataKey="p99Ms" stroke="#f59e0b" strokeWidth={2} fill="url(#colorP99)" name="P99 Tail (ms)" />
                        <Line type="monotone" dataKey="p95Ms" stroke="#6366f1" strokeWidth={1.5} dot={false} name="P95 (ms)" />
                        <Line type="monotone" dataKey="p50Ms" stroke="#10b981" strokeWidth={1.5} dot={false} name="P50 Median (ms)" />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* Legend and Anomaly Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] font-mono">
                  <div className="flex items-center gap-4 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <span>Observed Latency</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>Projected Breach Curve</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Nominal Baseline</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <span>Spikes in last 24h: <strong className="text-slate-800 font-bold">{activePrediction.spikeFrequencyLast24h} Detected</strong></span>
                  </div>
                </div>
              </div>

              {/* ROOT CAUSE DIAGNOSTIC & EARLY WARNING SIGNALS */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Root-Cause Latency Anomaly Breakdown ({activePrediction.rootCauses.length} Diagnostic Flags)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    Confidence: <strong className="text-emerald-700">98.4% Statistical Rigor</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activePrediction.rootCauses.map((rc) => (
                    <div
                      key={rc.id}
                      className={`p-3.5 rounded-xl border space-y-2 ${
                        rc.severity === 'Critical'
                          ? 'bg-rose-50/50 border-rose-200'
                          : rc.severity === 'Warning'
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-emerald-50/50 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {rc.severity === 'Critical' ? (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : rc.severity === 'Warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <span className="font-bold text-xs text-slate-900">
                            {rc.factor}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                          rc.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : rc.severity === 'Warning'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {rc.metricValue}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                        {rc.impactSummary}
                      </p>

                      <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/60">
                        <strong className="text-slate-700">Recommended Fix:</strong> {rc.recommendedAction}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1-CLICK PROACTIVE MITIGATION DECK */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <span>Proactive Automated & 1-Click Remediation Actions</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Apply real-time mitigating policies to suppress latency spikes before socket exhaustion occurs.
                    </p>
                  </div>

                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold rounded-full border border-emerald-200">
                    Zero-Downtime Safe
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activePrediction.recommendedMitigations.map((action) => {
                    const isApplied = action.isApplied || (mitigatedConnectors[selectedConnector.id]?.appliedActionIds.includes(action.id));

                    return (
                      <div
                        key={action.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                          isApplied
                            ? 'bg-emerald-50/60 border-emerald-400 ring-1 ring-emerald-300 shadow-xs'
                            : 'bg-slate-50/80 hover:bg-slate-100/60 border-slate-200/90'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-xs text-slate-900">
                                {action.title}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-[10px] shrink-0 border border-emerald-200">
                              -{action.estimatedRiskReductionPct}% Risk
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed mt-1.5 font-medium">
                            {action.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-500">
                            {isApplied ? 'Status: Currently Active' : 'Estimated Impact: Immediate'}
                          </span>

                          <button
                            onClick={() => handleExecuteMitigation(action)}
                            disabled={isApplied}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                              isApplied
                                ? 'bg-emerald-600 text-white cursor-default'
                                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                            }`}
                          >
                            {isApplied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Mitigation Active</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5 text-amber-300" />
                                <span>Apply Mitigation Now</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
              <Server className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700">No Connector Selected</div>
              <p className="text-xs">Select a connector from the risk matrix on the left to inspect latency failure predictions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
