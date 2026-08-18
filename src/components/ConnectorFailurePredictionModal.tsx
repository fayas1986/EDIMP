import React, { useState, useEffect } from 'react';
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
  X,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  Gauge,
  CheckCircle2,
  RefreshCw,
  Info,
  Server,
  Database,
  ArrowUpRight,
  Flame,
  Check,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';

interface ConnectorFailurePredictionModalProps {
  connector: Connector | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyMitigation?: (connectorId: string, action: ProactiveMitigationAction) => void;
  onOpenThrottling?: (connector: Connector) => void;
}

export const ConnectorFailurePredictionModal: React.FC<ConnectorFailurePredictionModalProps> = ({
  connector,
  isOpen,
  onClose,
  onApplyMitigation,
  onOpenThrottling,
}) => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'correlations' | 'root_causes'>('forecast');
  const [isMitigated, setIsMitigated] = useState<boolean>(false);
  const [appliedActionIds, setAppliedActionIds] = useState<string[]>([]);
  const [simulatedSpikeMs, setSimulatedSpikeMs] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset state when connector changes
  useEffect(() => {
    if (connector) {
      setIsMitigated(false);
      setAppliedActionIds([]);
      setSimulatedSpikeMs(0);
    }
  }, [connector?.id]);

  if (!isOpen || !connector) return null;

  const prediction: ConnectorFailurePrediction = analyzeConnectorFailurePrediction(connector, {
    simulatedSpikeMs,
    isMitigated,
    appliedActionIds,
  });

  const handleApplyAction = (action: ProactiveMitigationAction) => {
    setIsMitigated(true);
    setAppliedActionIds((prev) => Array.from(new Set([...prev, action.id])));
    setSimulatedSpikeMs(0);
    setToastMessage(`Proactive mitigation "${action.title}" activated. Risk score dropped to nominal baseline.`);
    if (onApplyMitigation) {
      onApplyMitigation(connector.id, { ...action, isApplied: true });
    }
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleReset = () => {
    setIsMitigated(false);
    setAppliedActionIds([]);
    setSimulatedSpikeMs(0);
  };

  const handleInjectSpike = (ms: number) => {
    setSimulatedSpikeMs((prev) => prev + ms);
    setIsMitigated(false);
  };

  // Trajectory series combining historical and forecast
  const combinedTrajectory = [
    ...prediction.timeSeriesTrends.map((pt) => ({
      label: pt.timestamp,
      fullLabel: pt.fullTimeLabel,
      type: 'Historical',
      latency: pt.latencyMs,
      p99: pt.p99Ms,
      baseline: pt.baselineLatencyMs,
      threshold: 450,
      forecast: null,
      upperConfidence: null,
      lowerConfidence: null,
      errorRate: pt.errorRatePct,
    })),
    ...prediction.forecastPoints.map((fc, idx) => ({
      label: fc.timestamp,
      fullLabel: `Forecast ${fc.timestamp}`,
      type: 'Forecast',
      latency: idx === 0 ? prediction.timeSeriesTrends[prediction.timeSeriesTrends.length - 1].latencyMs : null,
      p99: null,
      baseline: prediction.baselineLatencyMs,
      threshold: fc.failureThresholdMs,
      forecast: fc.predictedLatencyMs,
      upperConfidence: fc.upperConfidenceMs,
      lowerConfidence: fc.lowerConfidenceMs,
      errorRate: fc.predictedErrorRatePct,
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              prediction.riskLevel === 'Critical'
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : prediction.riskLevel === 'High'
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-indigo-50 text-indigo-600 border-indigo-200'
            }`}>
              {prediction.riskLevel === 'Critical' ? (
                <Flame className="w-5 h-5 animate-pulse" />
              ) : (
                <Activity className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Predictive Failure Forecaster & Latency Anomaly Intelligence
                </h2>
                <span className="text-xs font-mono font-bold text-slate-500">
                  [{connector.name}]
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Deep historical trend analysis, spike velocity modeling, and proactive zero-downtime mitigation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white font-mono font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Failure Risk Score
              </span>
              <div className="text-xl font-black font-mono flex items-center gap-2">
                <span className={prediction.riskScore >= 60 ? 'text-rose-600' : 'text-emerald-600'}>
                  {prediction.riskScore}%
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  prediction.riskLevel === 'Critical'
                    ? 'bg-rose-100 text-rose-800'
                    : prediction.riskLevel === 'High'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {prediction.riskLevel}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Predicted Failure Horizon
              </span>
              <div className="text-sm font-extrabold font-mono text-amber-600 truncate" title={prediction.predictedFailureWindow}>
                {prediction.predictedFailureWindow}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Current Latency vs Base
              </span>
              <div className="text-xl font-black font-mono text-slate-900">
                {prediction.currentLatencyMs}ms <span className="text-xs text-slate-400 font-normal">/ {prediction.baselineLatencyMs}ms</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Spike Velocity (Slope)
              </span>
              <div className="text-xl font-black font-mono text-indigo-700">
                +{prediction.spikeVelocityMsPerHour} <span className="text-xs text-slate-500 font-normal">ms/h</span>
              </div>
            </div>
          </div>

          {/* Forecast Chart Panel */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="font-bold text-xs text-slate-800 font-mono uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>24h Historical Latency & Forward 6h Failure Projection</span>
              </div>

              <div className="flex items-center gap-2">
                {isMitigated ? (
                  <button
                    onClick={handleReset}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-lg border border-slate-200 transition-all cursor-pointer"
                  >
                    Reset Mitigation
                  </button>
                ) : (
                  <button
                    onClick={() => handleInjectSpike(120)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-mono font-bold rounded-lg border border-rose-200 transition-all cursor-pointer"
                  >
                    +120ms Spike Test
                  </button>
                )}
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combinedTrajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="modalHistGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="modalConfGrad" x1="0" y1="0" x2="0" y2="1">
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
                          <div className="bg-white border border-slate-200 text-slate-900 text-xs p-3 rounded-xl shadow-lg font-mono space-y-1">
                            <div className="font-bold border-b border-slate-100 pb-1">{d.fullLabel}</div>
                            {d.latency !== null && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Latency:</span>
                                <strong className="text-indigo-600">{d.latency} ms</strong>
                              </div>
                            )}
                            {d.forecast !== null && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Forecast:</span>
                                <strong className="text-rose-600">{d.forecast} ms</strong>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-slate-100 pt-1 text-[11px]">
                              <span className="text-slate-400">Timeout Threshold:</span>
                              <span className="text-rose-600 font-bold">{d.threshold} ms</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={450}
                    stroke="#e11d48"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: 'Hard Socket Timeout Threshold (450ms)', position: 'insideTopRight', fill: '#e11d48', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="upperConfidence" stroke="none" fill="url(#modalConfGrad)" />
                  <Area type="monotone" dataKey="latency" stroke="#6366f1" strokeWidth={2.5} fill="url(#modalHistGrad)" />
                  <Line type="monotone" dataKey="forecast" stroke="#e11d48" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3, fill: '#e11d48' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Root Causes and Remediation Deck */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Root Causes */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Root-Cause Diagnostic Flags ({prediction.rootCauses.length})
              </span>
              <div className="space-y-2">
                {prediction.rootCauses.map((rc) => (
                  <div key={rc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-900">{rc.factor}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-100 text-rose-800">
                        {rc.metricValue}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{rc.impactSummary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 1-Click Remediation */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-600" />
                Proactive Remediation Actions
              </span>
              <div className="space-y-2">
                {prediction.recommendedMitigations.map((act) => {
                  const isActApplied = act.isApplied || appliedActionIds.includes(act.id);
                  return (
                    <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 truncate">{act.title}</div>
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">
                          -{act.estimatedRiskReductionPct}% Risk Reduction
                        </span>
                      </div>
                      <button
                        onClick={() => handleApplyAction(act)}
                        disabled={isActApplied}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          isActApplied
                            ? 'bg-emerald-600 text-white cursor-default'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isActApplied ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-500">
            Telemetry Engine Status: <strong>Continuous (1s poll interval)</strong>
          </span>
          <div className="flex items-center gap-2">
            {onOpenThrottling && (
              <button
                onClick={() => {
                  onClose();
                  onOpenThrottling(connector);
                }}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                <span>Adjust Throttling</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close Forecaster
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
