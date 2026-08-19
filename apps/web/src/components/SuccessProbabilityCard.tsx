import React, { useState } from 'react';
import { Connector } from '../types';
import {
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  BarChart3,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export interface ImpactCheckItem {
  id: string;
  title: string;
  status: 'pass' | 'warning' | 'error';
  isResolved?: boolean;
}

export interface SchemaMappingItem {
  confidence?: number;
  active?: boolean;
}

interface SuccessProbabilityCardProps {
  sourceConn?: Connector;
  targetConn?: Connector;
  impactChecks: ImpactCheckItem[];
  schemaMappings: SchemaMappingItem[];
  compact?: boolean;
  onResolveAllChecks?: () => void;
  className?: string;
}

export const calculateSuccessProbability = ({
  sourceConn,
  targetConn,
  impactChecks,
  schemaMappings,
}: {
  sourceConn?: Connector;
  targetConn?: Connector;
  impactChecks: ImpactCheckItem[];
  schemaMappings: SchemaMappingItem[];
}) => {
  // 1. Connector Latency & Health Heuristic
  const srcLatency = sourceConn?.latencyMs ?? 22;
  const tgtLatency = targetConn?.latencyMs ?? 34;
  const totalLatencyMs = srcLatency + tgtLatency;

  const srcConnected = sourceConn?.status === 'Connected';
  const tgtConnected = targetConn?.status === 'Connected';

  let connHealthBase = (srcConnected ? 50 : 35) + (tgtConnected ? 50 : 35);
  const latencyPenalty = Math.max(0, (totalLatencyMs - 35) * 0.25);
  const connectorScore = Math.max(40, Math.min(100, Math.round(connHealthBase - latencyPenalty)));

  // 2. Data Quality & Historical Integrity Heuristic
  const unresolvedErrors = impactChecks.filter((c) => c.status === 'error' && !c.isResolved).length;
  const unresolvedWarnings = impactChecks.filter((c) => c.status === 'warning' && !c.isResolved).length;
  const resolvedCount = impactChecks.filter((c) => c.isResolved).length;
  const passedCount = impactChecks.filter((c) => c.status === 'pass').length;

  const qualityPenalty = unresolvedErrors * 22 + unresolvedWarnings * 7;
  const dataQualityScore = Math.max(25, Math.min(100, Math.round(100 - qualityPenalty + resolvedCount * 2)));

  // 3. Schema Mapping Alignment Confidence
  const activeMappings = schemaMappings.filter((m) => m.active !== false);
  const avgMappingConfidence =
    activeMappings.length > 0
      ? Math.round(
          (activeMappings.reduce((sum, m) => sum + (m.confidence ?? 0.95), 0) / activeMappings.length) * 100
        )
      : 95;

  // Weighted Probability Calculation
  const totalProbability = Math.min(
    99.8,
    Math.max(20, Math.round(connectorScore * 0.35 + dataQualityScore * 0.45 + avgMappingConfidence * 0.2))
  );

  let ratingTier: 'High' | 'Moderate' | 'Low' = 'High';
  if (totalProbability < 65) ratingTier = 'Low';
  else if (totalProbability < 85) ratingTier = 'Moderate';

  return {
    probability: totalProbability,
    ratingTier,
    metrics: {
      totalLatencyMs,
      srcLatency,
      tgtLatency,
      connectorScore,
      dataQualityScore,
      avgMappingConfidence,
      unresolvedErrors,
      unresolvedWarnings,
      resolvedCount,
      passedCount,
      totalChecks: impactChecks.length,
    },
  };
};

export const SuccessProbabilityCard: React.FC<SuccessProbabilityCardProps> = ({
  sourceConn,
  targetConn,
  impactChecks,
  schemaMappings,
  compact = false,
  onResolveAllChecks,
  className = '',
}) => {
  const [showBreakdown, setShowBreakdown] = useState<boolean>(!compact);

  const { probability, ratingTier, metrics } = calculateSuccessProbability({
    sourceConn,
    targetConn,
    impactChecks,
    schemaMappings,
  });

  // Circle Geometry for radial meter
  const radius = 28;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (probability / 100) * circumference;

  // Color scheme mappings based on rating tier
  const colorMap = {
    High: {
      border: 'border-emerald-200/80',
      bg: 'bg-emerald-50/40',
      text: 'text-emerald-700',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      stroke: '#10b981',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-indigo-500',
      subText: 'Optimal Migration Conditions - Low Failure Risk',
    },
    Moderate: {
      border: 'border-amber-200/80',
      bg: 'bg-amber-50/40',
      text: 'text-amber-800',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      stroke: '#f59e0b',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-indigo-500',
      subText: 'Moderate Confidence - Resolve Data Warnings before Execution',
    },
    Low: {
      border: 'border-rose-200/80',
      bg: 'bg-rose-50/40',
      text: 'text-rose-800',
      badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
      stroke: '#f43f5e',
      gradientFrom: 'from-rose-500',
      gradientTo: 'to-amber-500',
      subText: 'High Failure Risk - Remediation Required in Pre-Flight Analysis',
    },
  };

  const currentTheme = colorMap[ratingTier];

  if (compact) {
    return (
      <div
        className={`p-3 rounded-2xl border ${currentTheme.border} ${currentTheme.bg} flex items-center justify-between gap-3 font-sans transition-all shadow-2xs ${className}`}
      >
        <div className="flex items-center gap-3">
          {/* Compact Mini Gauge */}
          <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="15"
                stroke="rgba(203, 213, 225, 0.5)"
                strokeWidth="3"
                fill="transparent"
              />
              <circle
                cx="20"
                cy="20"
                r="15"
                stroke={currentTheme.stroke}
                strokeWidth="3"
                strokeDasharray={2 * Math.PI * 15}
                strokeDashoffset={2 * Math.PI * 15 - (probability / 100) * (2 * Math.PI * 15)}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500"
              />
            </svg>
            <span className={`absolute text-[10px] font-mono font-extrabold ${currentTheme.text}`}>
              {probability}%
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Success Probability Indicator</span>
              </h4>
              <span className={`px-2 py-0.5 text-[9px] font-mono font-extrabold rounded-full border ${currentTheme.badgeBg}`}>
                {probability}% {ratingTier} Confidence
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Heuristic score based on {metrics.totalLatencyMs}ms total latency & {metrics.dataQualityScore}% data quality health.
            </p>
          </div>
        </div>

        {metrics.unresolvedErrors > 0 && onResolveAllChecks && (
          <button
            type="button"
            onClick={onResolveAllChecks}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs cursor-pointer transition-all shrink-0 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Resolve Issues (+{(metrics.unresolvedErrors * 18)}%)</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-white border rounded-2xl p-4 shadow-sm space-y-3.5 transition-all font-sans ${currentTheme.border} ${className}`}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Radial Circular Meter */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke={currentTheme.stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-xs font-black font-mono tracking-tight ${currentTheme.text}`}>
                {probability}%
              </span>
              <span className="text-[8px] font-mono font-bold uppercase text-slate-400">Score</span>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Migration Pipeline Success Probability</span>
              </h3>
              <span className={`px-2.5 py-0.5 text-[10px] font-mono font-extrabold rounded-full border ${currentTheme.badgeBg}`}>
                {ratingTier} Confidence
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              {currentTheme.subText}
            </p>
          </div>
        </div>

        {/* Action button & Breakdown toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {metrics.unresolvedErrors > 0 && onResolveAllChecks && (
            <button
              type="button"
              onClick={onResolveAllChecks}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Auto-Resolve Issues</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
          >
            <span>{showBreakdown ? 'Hide Details' : 'View Breakdown'}</span>
            {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* DETAILED HEURISTIC BREAKDOWN GRID */}
      {showBreakdown && (
        <div className="space-y-3 pt-1 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Metric 1: Connector Latency & Health */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Connector Latency & Health
                </span>
                <span className="text-xs font-mono font-extrabold text-slate-900">
                  {metrics.connectorScore}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${metrics.connectorScore}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Src ({metrics.srcLatency}ms) + Tgt ({metrics.tgtLatency}ms) = {metrics.totalLatencyMs}ms Total Latency
              </p>
            </div>

            {/* Metric 2: Data Quality & Impact Score */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Historical Data Quality
                </span>
                <span className="text-xs font-mono font-extrabold text-slate-900">
                  {metrics.dataQualityScore}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${metrics.dataQualityScore}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                {metrics.unresolvedErrors === 0 ? (
                  <span className="text-emerald-600 font-bold">✓ 0 Errors • {metrics.passedCount + metrics.resolvedCount} Passed Checks</span>
                ) : (
                  <span className="text-rose-600 font-bold">⚠ {metrics.unresolvedErrors} Unresolved Check Errors</span>
                )}
              </p>
            </div>

            {/* Metric 3: Schema Mapping Confidence */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-indigo-600" />
                  Mapping Alignment
                </span>
                <span className="text-xs font-mono font-extrabold text-slate-900">
                  {metrics.avgMappingConfidence}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${metrics.avgMappingConfidence}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Avg alignment confidence across active field schema mappings
              </p>
            </div>
          </div>

          {/* Actionable recommendation banner if there are unresolved issues */}
          {metrics.unresolvedErrors > 0 && (
            <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <p className="text-[11px] text-rose-900 font-medium">
                  <strong>Recommendation:</strong> Resolving {metrics.unresolvedErrors} data check error{metrics.unresolvedErrors > 1 ? 's' : ''} will elevate your success probability from <span className="font-bold">{probability}%</span> to <span className="font-bold text-emerald-700">{Math.min(99, probability + 18)}%</span>.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
