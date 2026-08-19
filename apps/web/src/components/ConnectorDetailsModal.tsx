import React, { useState, useEffect } from 'react';
import { Connector, ConnectorDataProfile, EntityProfileSummary, ColumnProfile } from '../types';
import { DATA_TYPE_COLORS } from '../services/dataProfilingService';
import { ConnectorTrendAnalysisView } from './ConnectorTrendAnalysisView';
import { FieldCorrelationMatrixD3 } from './FieldCorrelationMatrixD3';
import { analyzeConnectorFailurePrediction } from '../services/connectorFailurePredictionService';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import {
  Database,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Search,
  Download,
  Activity,
  Gauge,
  Percent,
  TrendingUp,
  Table,
  Check,
  Code,
  ShieldCheck,
  ChevronRight,
  PieChart,
  Sparkles,
  BarChart3,
  Network,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Zap,
  Flame,
} from 'lucide-react';

interface ConnectorDetailsModalProps {
  connector: Connector | null;
  isOpen: boolean;
  onClose: () => void;
  onReProfile?: (connectorId: string) => void;
}

export const ConnectorDetailsModal: React.FC<ConnectorDetailsModalProps> = ({
  connector,
  isOpen,
  onClose,
  onReProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'profiling' | 'trends' | 'correlations' | 'columns' | 'sample_data' | 'connection' | 'predictive_failure'>('profiling');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(true);
  const [selectedEntityName, setSelectedEntityName] = useState<string>('');
  const [selectedInspectorColName, setSelectedInspectorColName] = useState<string>('');
  const [columnSearch, setColumnSearch] = useState<string>('');
  const [selectedDataTypeFilter, setSelectedDataTypeFilter] = useState<string>('All');
  const [isProfiling, setIsProfiling] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [mitigatedActionIds, setMitigatedActionIds] = useState<string[]>([]);

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

  if (!isOpen || !connector) return null;

  const profile: ConnectorDataProfile = connector.dataProfile || {
    connectorId: connector.id,
    connectorName: connector.name,
    profiledAt: new Date().toISOString(),
    status: 'Completed',
    totalEntities: 1,
    totalRowCount: 14250,
    totalColumns: 13,
    totalNullValues: 590,
    totalPopulatedValues: 184660,
    overallNullPercentage: 3.2,
    overallCompletenessPercentage: 96.8,
    dataTypeDistribution: [
      { type: 'String', count: 8, percentage: 62, color: '#6366f1' },
      { type: 'Decimal', count: 2, percentage: 15, color: '#10b981' },
      { type: 'Integer', count: 1, percentage: 8, color: '#0ea5e9' },
      { type: 'DateTime', count: 1, percentage: 8, color: '#f59e0b' },
      { type: 'Boolean', count: 1, percentage: 7, color: '#8b5cf6' },
    ],
    entityProfiles: [],
    anomaliesDetectedCount: 1,
    dataQualityScore: 96.5,
    profilingDurationMs: 240,
  };

  const activeEntity: EntityProfileSummary | undefined =
    profile.entityProfiles?.find((e) => e.entityName === selectedEntityName) ||
    profile.entityProfiles?.[0];

  const columnsToDisplay: ColumnProfile[] = activeEntity
    ? activeEntity.columns
    : profile.entityProfiles?.[0]?.columns || [];

  const inspectedColumn: ColumnProfile | undefined =
    columnsToDisplay.find((c) => c.columnName === selectedInspectorColName) ||
    columnsToDisplay[0];

  const filteredColumns = columnsToDisplay.filter((col) => {
    const matchesSearch = col.columnName.toLowerCase().includes(columnSearch.toLowerCase());
    const matchesType = selectedDataTypeFilter === 'All' || col.dataType === selectedDataTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleRunReProfile = () => {
    setIsProfiling(true);
    setTimeout(() => {
      if (onReProfile) {
        onReProfile(connector.id);
      }
      setIsProfiling(false);
    }, 700);
  };

  const handleExportProfileJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${connector.name.replace(/\s+/g, '_')}_data_profile.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setCopiedNotification('Data Profile exported to JSON');
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isFullScreen
          ? 'bg-slate-900 flex flex-col p-0 overflow-hidden'
          : 'bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="connector-details-title"
    >
      <div
        className={`bg-white overflow-hidden flex flex-col transition-all duration-300 ${
          isFullScreen
            ? 'w-full h-full max-w-none max-h-none rounded-none border-0 shadow-none'
            : 'rounded-2xl border border-slate-200 max-w-6xl xl:max-w-7xl 2xl:max-w-[1540px] w-full shadow-2xl max-h-[94vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="px-5 py-3 sm:px-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="connector-details-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {connector.name}
                </h2>
                <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded-full text-[10px] font-mono font-bold border border-indigo-800">
                  {connector.category}
                </span>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full text-[10px] font-mono font-bold border border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {connector.status} ({connector.latencyMs ?? 24}ms)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Provider: <span className="text-slate-200 font-semibold">{connector.provider}</span> • Auth: <span className="text-slate-200">{connector.authType}</span> • Endpoint: <span className="text-slate-300 truncate max-w-[280px] inline-block align-bottom">{connector.hostUrl || 'Configured'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            <button
              onClick={handleRunReProfile}
              disabled={isProfiling}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Execute live schema profiling scan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProfiling ? 'animate-spin' : ''}`} />
              <span>{isProfiling ? 'Profiling...' : 'Re-Profile Schema'}</span>
            </button>

            <button
              onClick={handleExportProfileJson}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title="Download Data Profile JSON"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export</span>
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              id="connector-modal-fullscreen-toggle"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title={isFullScreen ? 'Exit Full Screen (Windowed Mode)' : 'Expand to Full Screen'}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Full Screen</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              aria-label="Close modal"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Auto-Profiling Status Banner */}
        <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-1.5 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-0.5 bg-indigo-600 text-white rounded-md">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="font-bold text-indigo-950 text-xs">Automated Data Profiler Active</span>
            <span className="text-indigo-700 font-mono text-[10px]">
              • Profiled in {profile.profilingDurationMs}ms • Auto-indexed {profile.totalEntities || 1} entity schema{(profile.totalEntities || 1) > 1 ? 's' : ''}
            </span>
          </div>
          {copiedNotification && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
              <Check className="w-3 h-3" /> {copiedNotification}
            </span>
          )}
        </div>

        {/* Core Statistics KPI Metric Cards (Compact Slim Header Layout) */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* 1. Total Row Count */}
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Total Row Count</span>
                <Table className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono">
                  {profile.totalRowCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {profile.totalEntities || 1} {profile.totalEntities === 1 ? 'entity' : 'entities'}
                </span>
              </div>
            </div>

            {/* 2. Null Percentage & Completeness */}
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Null Rate</span>
                <Percent className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="flex items-baseline justify-between mt-0.5">
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    {profile.overallNullPercentage}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">
                    ({profile.overallCompletenessPercentage}% Clean)
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full ${
                    profile.overallNullPercentage < 5
                      ? 'bg-emerald-500'
                      : profile.overallNullPercentage < 15
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, profile.overallCompletenessPercentage))}%` }}
                />
              </div>
            </div>

            {/* 3. Data Type Distribution Summary */}
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Data Types</span>
                <PieChart className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="flex items-center gap-1 font-mono text-[9px] mt-0.5 overflow-hidden truncate">
                {profile.dataTypeDistribution.slice(0, 3).map((dt) => (
                  <span
                    key={dt.type}
                    className="px-1 py-0.2 rounded font-bold border shrink-0"
                    style={{
                      backgroundColor: `${dt.color}15`,
                      color: dt.color,
                      borderColor: `${dt.color}40`,
                    }}
                  >
                    {dt.type} {dt.percentage}%
                  </span>
                ))}
              </div>
              <div className="w-full h-1 rounded-full overflow-hidden flex mt-1 bg-slate-100">
                {profile.dataTypeDistribution.map((dt) => (
                  <div
                    key={dt.type}
                    style={{
                      width: `${dt.percentage}%`,
                      backgroundColor: dt.color || '#6366f1',
                    }}
                    title={`${dt.type}: ${dt.count} cols (${dt.percentage}%)`}
                  />
                ))}
              </div>
            </div>

            {/* 4. Data Quality & Hygiene Score */}
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Data Hygiene</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="flex items-baseline justify-between mt-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-extrabold text-emerald-700 font-mono">
                    {profile.dataQualityScore}/100
                  </span>
                  <span className="text-[9px] font-bold px-1 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-mono">
                    Grade A
                  </span>
                </div>
                <div className="text-[10px] font-mono">
                  {profile.anomaliesDetectedCount > 0 ? (
                    <span className="text-amber-600 font-semibold truncate">
                      {profile.anomaliesDetectedCount} anomaly
                    </span>
                  ) : (
                    <span className="text-emerald-700">0 anomalies</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 px-5 bg-white flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profiling')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'profiling'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Data Type & Profiling Overview</span>
          </button>

          <button
            id="trend-analysis-tab-btn"
            onClick={() => setActiveTab('trends')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'trends'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Trend Analysis (30-Day)</span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-indigo-50 text-indigo-700 rounded font-bold border border-indigo-200">
              Recharts
            </span>
          </button>

          <button
            id="correlation-matrix-tab-btn"
            onClick={() => setActiveTab('correlations')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'correlations'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-indigo-600" />
            <span>Field Correlation Matrix</span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-emerald-50 text-emerald-700 rounded font-bold border border-emerald-200">
              D3.js
            </span>
          </button>

          <button
            onClick={() => setActiveTab('columns')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'columns'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Column-Level Statistics ({columnsToDisplay.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sample_data')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'sample_data'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Live Sample Records</span>
          </button>

          <button
            onClick={() => setActiveTab('connection')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'connection'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Connection & SLA Specs</span>
          </button>

          <button
            id="predictive-failure-tab-btn"
            onClick={() => setActiveTab('predictive_failure')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'predictive_failure'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Predictive Failure Forecaster</span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-rose-50 text-rose-700 rounded font-bold border border-rose-200">
              Latency Spikes
            </span>
          </button>
        </div>

        {/* Modal Body Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 bg-white">
          {/* TAB 1: DATA TYPE & PROFILING OVERVIEW */}
          {activeTab === 'profiling' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT MAIN COLUMN: Profiling Charts & Distribution Visualizers (lg:col-span-7 xl:col-span-7 2xl:col-span-8 space-y-5) */}
              <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 space-y-5">
                {/* 1. Data Type Distribution Grid */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                        Data Type Distribution Breakdown
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      Total Fields Analyzed: {profile.totalColumns}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5">
                    {profile.dataTypeDistribution.map((dt) => (
                      <div
                        key={dt.type}
                        className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono"
                            style={{
                              backgroundColor: `${dt.color}15`,
                              color: dt.color,
                            }}
                          >
                            {dt.type}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800 font-mono">
                            {dt.percentage}%
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {dt.count} column{dt.count > 1 ? 's' : ''}
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${dt.percentage}%`,
                              backgroundColor: dt.color || '#6366f1',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Proportional distribution bar */}
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200/80">
                    {profile.dataTypeDistribution.map((dt) => (
                      <div
                        key={dt.type}
                        style={{
                          width: `${dt.percentage}%`,
                          backgroundColor: dt.color || '#6366f1',
                        }}
                        title={`${dt.type}: ${dt.count} columns (${dt.percentage}%)`}
                      />
                    ))}
                  </div>
                </div>

                {/* 2. Field Completeness & Null Analysis Breakdown (Horizontal Stacked Bars) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                        Field Completeness & Null Analysis ({columnsToDisplay.length} Fields)
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
                        Populated %
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
                        Null %
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {columnsToDisplay.map((col) => {
                      const populatedPercent = Math.max(0, 100 - col.nullPercentage);
                      const isInspected = inspectedColumn?.columnName === col.columnName;
                      return (
                        <div
                          key={col.columnName}
                          onClick={() => setSelectedInspectorColName(col.columnName)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                            isInspected
                              ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs'
                              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{col.columnName}</span>
                              <span
                                className="px-1.5 py-0.2 rounded text-[9px] font-bold border"
                                style={{
                                  backgroundColor: `${DATA_TYPE_COLORS[col.dataType] || '#6366f1'}15`,
                                  color: DATA_TYPE_COLORS[col.dataType] || '#6366f1',
                                  borderColor: `${DATA_TYPE_COLORS[col.dataType] || '#6366f1'}40`,
                                }}
                              >
                                {col.dataType}
                              </span>
                              {col.uniquenessPercentage === 100 && (
                                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                                  PK
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-slate-500">
                                {col.totalCount.toLocaleString()} rows
                              </span>
                              <span
                                className={`font-bold ${
                                  col.nullPercentage > 5 ? 'text-amber-600' : 'text-emerald-700'
                                }`}
                              >
                                {col.nullPercentage > 0 ? `${col.nullPercentage}% Null` : '100% Clean'}
                              </span>
                            </div>
                          </div>

                          {/* Stacked Completeness Bar */}
                          <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200">
                            <div
                              className="h-full bg-indigo-600 transition-all duration-500"
                              style={{ width: `${populatedPercent}%` }}
                              title={`Populated: ${populatedPercent}%`}
                            />
                            {col.nullPercentage > 0 && (
                              <div
                                className="h-full bg-rose-500 transition-all duration-500"
                                style={{ width: `${col.nullPercentage}%` }}
                                title={`Missing / Null: ${col.nullPercentage}% (${col.nullCount} rows)`}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Field Cardinality & Uniqueness Breakdown */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-sky-600" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                        Cardinality & Distinct Value Rate (%)
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      100% indicates Primary Key candidate
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {columnsToDisplay.map((col) => (
                      <div
                        key={col.columnName}
                        onClick={() => setSelectedInspectorColName(col.columnName)}
                        className="p-2.5 bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/80 rounded-lg text-xs font-mono transition-colors cursor-pointer space-y-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 truncate max-w-[140px]" title={col.columnName}>
                            {col.columnName}
                          </span>
                          <span className="font-extrabold text-sky-700">{col.uniquenessPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              col.uniquenessPercentage === 100
                                ? 'bg-emerald-500'
                                : col.uniquenessPercentage > 50
                                ? 'bg-sky-500'
                                : 'bg-indigo-400'
                            }`}
                            style={{ width: `${col.uniquenessPercentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Anomaly Alerts Section if present */}
                {profile.anomaliesDetectedCount > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Schema Data Profiling Anomaly Detected ({profile.anomaliesDetectedCount})</span>
                    </div>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      Automated data profiling identified non-standard or placeholder string patterns in field records (e.g. invalid tax identifiers or formatting inconsistencies). The system recommends applying automated cleansing rules prior to destination loading.
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT SIDEBAR COLUMN: Entity Catalog & Interactive Column Inspector (lg:col-span-5 xl:col-span-5 2xl:col-span-4 space-y-5) */}
              <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 space-y-5">
                {/* 1. Interactive Column Quality Inspector */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                        Column Quality Inspector
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                      Live Field
                    </span>
                  </div>

                  {/* Column Selector Dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">
                      Active Column to Inspect
                    </label>
                    <select
                      value={inspectedColumn?.columnName || ''}
                      onChange={(e) => setSelectedInspectorColName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      {columnsToDisplay.map((col) => (
                        <option key={col.columnName} value={col.columnName}>
                          {col.columnName} ({col.dataType})
                        </option>
                      ))}
                    </select>
                  </div>

                  {inspectedColumn && (
                    <div className="space-y-3 text-xs font-mono">
                      {/* Field Attributes Row */}
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-[11px]">Field Data Type:</span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold border"
                            style={{
                              backgroundColor: `${DATA_TYPE_COLORS[inspectedColumn.dataType] || '#6366f1'}15`,
                              color: DATA_TYPE_COLORS[inspectedColumn.dataType] || '#6366f1',
                              borderColor: `${DATA_TYPE_COLORS[inspectedColumn.dataType] || '#6366f1'}40`,
                            }}
                          >
                            {inspectedColumn.dataType}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-[11px]">Total Row Records:</span>
                          <span className="font-bold text-slate-900">{inspectedColumn.totalCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-[11px]">Null Cell Count:</span>
                          <span className={`font-bold ${inspectedColumn.nullCount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {inspectedColumn.nullCount.toLocaleString()} ({inspectedColumn.nullPercentage}%)
                          </span>
                        </div>
                      </div>

                      {/* Completeness Gauge */}
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            Completeness Rate
                          </span>
                          <span className="font-extrabold text-indigo-700">
                            {100 - inspectedColumn.nullPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
                            style={{ width: `${100 - inspectedColumn.nullPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Uniqueness Gauge */}
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            Uniqueness / Cardinality
                          </span>
                          <span className="font-extrabold text-emerald-700">
                            {inspectedColumn.uniquenessPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                            style={{ width: `${inspectedColumn.uniquenessPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Sample Values */}
                      <div className="space-y-1.5 pt-1">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Sample Discovered Values
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {inspectedColumn.sampleValues?.map((val, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono border border-slate-200 truncate max-w-full"
                            >
                              {val}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Anomaly Flag */}
                      {inspectedColumn.hasAnomalies ? (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Flagged: {inspectedColumn.anomalyDescription || 'Suspicious value formatting detected'}</span>
                        </div>
                      ) : (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Field Hygiene Passed: No schema anomalies detected</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Profiled Entities & Table Catalog */}
                {profile.entityProfiles && profile.entityProfiles.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                          Entities & Tables ({profile.entityProfiles.length})
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Select to switch
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {profile.entityProfiles.map((ent) => {
                        const isSelected = (selectedEntityName || profile.entityProfiles[0]?.entityName) === ent.entityName;
                        return (
                          <div
                            key={ent.entityName}
                            onClick={() => setSelectedEntityName(ent.entityName)}
                            className={`p-3 transition-colors cursor-pointer ${
                              isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1 bg-indigo-100 text-indigo-700 rounded shrink-0">
                                  <Table className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-bold text-slate-900 font-mono truncate">
                                  {ent.entityName}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border">
                                {ent.entityType}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-slate-500">
                              <span>{ent.rowCount.toLocaleString()} rows</span>
                              <span>{ent.columnCount} cols</span>
                              <span className={ent.nullPercentage < 5 ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold'}>
                                {ent.nullPercentage}% null
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Schema Health & SLA Diagnostics Card */}
                <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-md space-y-2.5 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-slate-200">Hygiene Scorecard</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold border border-emerald-500/40">
                      Grade A Verified
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Validated Cells:</span>
                      <span className="font-bold text-white">{(profile.totalPopulatedValues || 184660).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Profiling Latency:</span>
                      <span className="text-indigo-400 font-bold">{profile.profilingDurationMs}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">SLA Ping Latency:</span>
                      <span className="text-emerald-400 font-bold">{connector.latencyMs || 24}ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HISTORICAL TREND ANALYSIS (30-DAY) */}
          {activeTab === 'trends' && (
            <ConnectorTrendAnalysisView connector={connector} profile={profile} />
          )}

          {/* TAB 3: FIELD CORRELATION MATRIX (D3.js) */}
          {activeTab === 'correlations' && (
            <FieldCorrelationMatrixD3 connector={connector} profile={profile} />
          )}

          {/* TAB 4: COLUMN-LEVEL STATISTICS */}
          {activeTab === 'columns' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={columnSearch}
                    onChange={(e) => setColumnSearch(e.target.value)}
                    placeholder="Search column names..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">Type Filter:</span>
                  <select
                    value={selectedDataTypeFilter}
                    onChange={(e) => setSelectedDataTypeFilter(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="All">All Types</option>
                    <option value="String">String</option>
                    <option value="Integer">Integer</option>
                    <option value="Decimal">Decimal</option>
                    <option value="DateTime">DateTime</option>
                    <option value="Boolean">Boolean</option>
                    <option value="JSON">JSON</option>
                    <option value="Enum">Enum</option>
                  </select>
                </div>
              </div>

              {/* Column Statistics Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Column Name</th>
                        <th className="p-3">Data Type</th>
                        <th className="p-3">Total Rows</th>
                        <th className="p-3">Null Count & Rate</th>
                        <th className="p-3">Uniqueness Rate</th>
                        <th className="p-3">Sample Discovered Values</th>
                        <th className="p-3 text-right">Anomalies</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredColumns.map((col) => (
                        <tr key={col.columnName} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{col.columnName}</span>
                              {col.uniquenessPercentage === 100 && (
                                <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] rounded font-bold" title="Primary Key Candidate">
                                  PK
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold border"
                              style={{
                                backgroundColor: `${DATA_TYPE_COLORS[col.dataType] || '#6366f1'}15`,
                                color: DATA_TYPE_COLORS[col.dataType] || '#6366f1',
                                borderColor: `${DATA_TYPE_COLORS[col.dataType] || '#6366f1'}40`,
                              }}
                            >
                              {col.dataType}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700">{col.totalCount.toLocaleString()}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${col.nullPercentage > 5 ? 'text-amber-600' : 'text-slate-700'}`}>
                                {col.nullCount.toLocaleString()} ({col.nullPercentage}%)
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-700 font-semibold">
                              {col.uniquenessPercentage}%
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px] max-w-[200px] truncate" title={col.sampleValues?.join(', ')}>
                            {col.sampleValues?.join(', ') || '-'}
                          </td>
                          <td className="p-3 text-right">
                            {col.hasAnomalies ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title={col.anomalyDescription}>
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Flagged</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Clean</span>
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

          {/* TAB 3: LIVE SAMPLE RECORDS */}
          {activeTab === 'sample_data' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold">
                    {profile.sampleRowsPreview?.length || 0} Sample Rows Loaded
                  </span>
                  <span className="text-slate-600">
                    Live snapshot buffer from source connector
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    Null highlighted in red
                  </span>
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    Anomalies in amber
                  </span>
                </div>
              </div>

              <div className={`border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-2xs ${isFullScreen ? 'max-h-[calc(100vh-340px)]' : 'max-h-[480px]'} overflow-y-auto`}>
                {profile.sampleRowsPreview && profile.sampleRowsPreview.length > 0 ? (
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px] sticky top-0 z-10">
                      <tr>
                        <th className="p-3 bg-slate-100 w-12 text-center text-slate-400">#</th>
                        {Object.keys(profile.sampleRowsPreview[0]).map((colKey) => (
                          <th key={colKey} className="p-3 bg-slate-100 whitespace-nowrap">
                            {colKey}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profile.sampleRowsPreview.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-indigo-50/40 even:bg-slate-50/50 transition-colors">
                          <td className="p-3 text-center text-slate-400 text-[10px] font-bold">{rIdx + 1}</td>
                          {Object.entries(row).map(([k, val], cIdx) => (
                            <td key={cIdx} className="p-3 text-slate-800 text-[11px] whitespace-nowrap">
                              {val === null || val === undefined ? (
                                <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold inline-block">
                                  NULL
                                </span>
                              ) : val === 'INVALID_TAX' ? (
                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold inline-block">
                                  {String(val)}
                                </span>
                              ) : typeof val === 'boolean' ? (
                                <span className="text-purple-600 font-bold font-mono">{String(val)}</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-slate-500 font-mono text-xs">
                    No sample records loaded. Click &quot;Re-Profile Schema&quot; to fetch live sample records.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CONNECTION & SLA SPECS */}
          {activeTab === 'connection' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Authentication & Credentials
                  </h4>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Auth Protocol:</span>
                      <span className="font-bold text-slate-900">{connector.authType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Vault Storage:</span>
                      <span className="text-emerald-700 font-bold">AES-256 HSM Encrypted</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Ping Latency:</span>
                      <span className="font-bold text-slate-900">{connector.latencyMs || 24}ms</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Last Health Check:</span>
                      <span className="text-slate-900">{connector.lastTested || 'Just now'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Throughput & Rate Limiting SLA
                  </h4>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Throttling Status:</span>
                      <span className="font-bold text-indigo-700">
                        {connector.throttlingConfig?.isEnabled ? 'Rate-Limited' : 'Unthrottled (500 RPS)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Max Throughput:</span>
                      <span className="font-bold text-slate-900">
                        {connector.throttlingConfig?.maxRequestsPerSecond || 500} req/sec
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span>Parallel Threads:</span>
                      <span className="font-bold text-slate-900">
                        {connector.throttlingConfig?.maxConcurrentRequests || 10} workers
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Backoff Strategy:</span>
                      <span className="text-slate-900">
                        {connector.throttlingConfig?.retryStrategy || 'ExponentialBackoff'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PREDICTIVE FAILURE & LATENCY SPIKE INTELLIGENCE */}
          {activeTab === 'predictive_failure' && (() => {
            const pred = analyzeConnectorFailurePrediction(connector, {
              isMitigated: mitigatedActionIds.length > 0,
              appliedActionIds: mitigatedActionIds,
            });

            const combinedTrajectory = [
              ...pred.timeSeriesTrends.map((pt) => ({
                label: pt.timestamp,
                fullLabel: pt.fullTimeLabel,
                type: 'Historical',
                latency: pt.latencyMs,
                p99: pt.p99Ms,
                baseline: pt.baselineLatencyMs,
                threshold: 450,
                forecast: null,
                upperConfidence: null,
              })),
              ...pred.forecastPoints.map((fc, idx) => ({
                label: fc.timestamp,
                fullLabel: `Forecast ${fc.timestamp}`,
                type: 'Forecast',
                latency: idx === 0 ? pred.timeSeriesTrends[pred.timeSeriesTrends.length - 1].latencyMs : null,
                p99: null,
                baseline: pred.baselineLatencyMs,
                threshold: fc.failureThresholdMs,
                forecast: fc.predictedLatencyMs,
                upperConfidence: fc.upperConfidenceMs,
              })),
            ];

            return (
              <div className="space-y-5 font-mono text-xs">
                {/* Metric Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Risk Severity</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-black ${pred.riskScore >= 60 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {pred.riskScore}%
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pred.riskLevel === 'Critical' ? 'bg-rose-100 text-rose-800' : pred.riskLevel === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {pred.riskLevel}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Predicted Horizon</span>
                    <div className="text-sm font-extrabold text-amber-600 truncate">
                      {pred.predictedFailureWindow}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current / Base Latency</span>
                    <div className="text-xl font-black text-slate-900">
                      {pred.currentLatencyMs}ms <span className="text-xs text-slate-400 font-normal">/ {pred.baselineLatencyMs}ms</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Spike Velocity</span>
                    <div className="text-xl font-black text-indigo-700">
                      +{pred.spikeVelocityMsPerHour} <span className="text-xs text-slate-400 font-normal">ms/h</span>
                    </div>
                  </div>
                </div>

                {/* Trajectory Recharts Chart */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      Historical Latency Trend & Forward 6-Hour Trajectory
                    </span>
                    {mitigatedActionIds.length > 0 && (
                      <button
                        onClick={() => setMitigatedActionIds([])}
                        className="px-2 py-0.5 bg-white text-slate-700 border border-slate-200 rounded text-[10px] font-bold cursor-pointer"
                      >
                        Reset Fix
                      </button>
                    )}
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={combinedTrajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="ms" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-md text-xs space-y-1 font-mono">
                                  <div className="font-bold text-slate-900">{d.fullLabel}</div>
                                  {d.latency !== null && <div className="text-indigo-600">Latency: {d.latency}ms</div>}
                                  {d.forecast !== null && <div className="text-rose-600 font-bold">Forecast: {d.forecast}ms</div>}
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
                          label={{ value: 'Timeout Threshold (450ms)', fill: '#e11d48', fontSize: 10 }}
                        />
                        <Area type="monotone" dataKey="latency" stroke="#6366f1" strokeWidth={2} fill="#6366f120" />
                        <Line type="monotone" dataKey="forecast" stroke="#e11d48" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3, fill: '#e11d48' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Root Causes and Remediation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Root Causes ({pred.rootCauses.length})
                    </span>
                    {pred.rootCauses.map((rc) => (
                      <div key={rc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{rc.factor}</span>
                          <span className="text-rose-700 font-mono text-[10px] bg-rose-100 px-1.5 py-0.2 rounded">{rc.metricValue}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{rc.impactSummary}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      Proactive Remediation Actions
                    </span>
                    {pred.recommendedMitigations.map((act) => {
                      const isApplied = mitigatedActionIds.includes(act.id);
                      return (
                        <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900">{act.title}</div>
                            <span className="text-[10px] text-emerald-700 font-bold">-{act.estimatedRiskReductionPct}% Failure Risk</span>
                          </div>
                          <button
                            onClick={() => setMitigatedActionIds((prev) => [...prev, act.id])}
                            disabled={isApplied}
                            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                              isApplied ? 'bg-emerald-600 text-white cursor-default' : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {isApplied ? 'Applied' : 'Apply'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
