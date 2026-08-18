import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MigrationRiskForecastingPanel } from './MigrationRiskForecastingPanel';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
  Zap,
  Activity,
  Cpu,
  Database,
  ArrowRight,
  TrendingUp,
  Sliders,
  CheckCircle,
  FileText,
  Search,
  ChevronRight,
  Info,
} from 'lucide-react';

interface CriticalFlag {
  title: string;
  description: string;
  category: string;
  threatLevel: 'High' | 'Medium' | 'Low';
}

interface PredictiveRiskData {
  success: boolean;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  riskScore: number;
  predictedJobFailureProbability: number;
  bottleneckNode: string;
  criticalFlags: CriticalFlag[];
  detailedRecommendation: string;
  historicalLogsAnalyzed: number;
  aiGenerated: boolean;
  note?: string;
}

interface HistoricalJob {
  id: string;
  jobName: string;
  sourceConnectorName: string;
  sourceEntity: string;
  destConnectorName: string;
  destEntity: string;
  executionTimestamp: string;
  originalTotalRecords: number;
  originalErrorCount: number;
}

interface PredictiveRiskDashboardProps {
  currentCpu: number;
  currentMemory: number;
  activeWorkers: number;
  throughput: number;
  selectedProfileId: string;
}

const MOCK_HISTORICAL_JOBS: HistoricalJob[] = [
  {
    id: 'job-hist-201',
    jobName: 'Q2 2026 SAP Customer Master Migration (Batch #14)',
    sourceConnectorName: 'SAP S/4HANA Cloud Engine',
    sourceEntity: 'KNA1_Customer_Master',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Customer API v2.0',
    executionTimestamp: '2026-06-15T14:30:00Z',
    originalTotalRecords: 14250,
    originalErrorCount: 14,
  },
  {
    id: 'job-hist-202',
    jobName: 'Vendor Accounts Payable Legacy Import',
    sourceConnectorName: 'SQL Server - Legacy ERP DB',
    sourceEntity: 'tbl_Vendors_Master',
    destConnectorName: 'Dynamics 365 Finance & Operations',
    destEntity: 'VendVendorV2Entity',
    executionTimestamp: '2026-07-01T08:15:00Z',
    originalTotalRecords: 3200,
    originalErrorCount: 2,
  },
  {
    id: 'job-hist-203',
    jobName: 'Salesforce Accounts to Business Central Sync',
    sourceConnectorName: 'Salesforce Enterprise CRM',
    sourceEntity: 'Account (Salesforce)',
    destConnectorName: 'Dynamics 365 Business Central (Prod)',
    destEntity: 'Customer',
    executionTimestamp: '2026-07-10T11:00:00Z',
    originalTotalRecords: 8500,
    originalErrorCount: 8,
  },
];

export const PredictiveRiskDashboard: React.FC<PredictiveRiskDashboardProps> = ({
  currentCpu,
  currentMemory,
  activeWorkers,
  throughput,
  selectedProfileId,
}) => {
  // Local Telemetry Analysis State
  const [riskData, setRiskData] = useState<PredictiveRiskData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Historical Log Scanner State
  const [historicalJobs, setHistoricalJobs] = useState<HistoricalJob[]>(MOCK_HISTORICAL_JOBS);
  const [selectedJobId, setSelectedJobId] = useState<string>(MOCK_HISTORICAL_JOBS[0].id);
  const [isScanningLogs, setIsScanningLogs] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanResult, setScanResult] = useState<{
    jobId: string;
    score: number;
    failureRisk: 'Low' | 'Elevated' | 'Severe';
    primaryRootCause: string;
    preventativeActions: string[];
    logScanConfidence: number;
  } | null>(null);

  // Fetch standard telemetry risk predictions
  const fetchTelemetryRisk = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/predictive-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentCpu,
          currentMemory,
          activeWorkers,
          throughput,
          selectedProfileId,
        }),
      });
      if (!response.ok) {
        throw new Error('Predictive risk telemetry route failed');
      }
      const data: PredictiveRiskData = await response.json();
      setRiskData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze system risk telemetry');
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [currentCpu, currentMemory, activeWorkers, throughput, selectedProfileId]);

  // Fetch historical jobs list
  const fetchHistoricalJobs = async (retries = 3) => {
    try {
      const response = await fetch('/api/replay/historical-jobs');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.jobs) {
          setHistoricalJobs(data.jobs);
          if (data.jobs.length > 0) {
            setSelectedJobId(data.jobs[0].id);
          }
        }
      } else if (retries > 0) {
        console.warn(`Retry fetching historical jobs (${retries} left)...`);
        setTimeout(() => fetchHistoricalJobs(retries - 1), 2000);
      }
    } catch (err) {
      console.error('Failed to load historical jobs list:', err);
      if (retries > 0) {
        setTimeout(() => fetchHistoricalJobs(retries - 1), 2000);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTelemetryRisk();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchTelemetryRisk]);

  useEffect(() => {
    fetchHistoricalJobs();
  }, []);

  // Run the Deep Log Analysis Simulator
  const handleDeepLogScan = async () => {
    if (!selectedJobId) return;
    setIsScanningLogs(true);
    setScanResult(null);

    const targetJob = historicalJobs.find((j) => j.id === selectedJobId);
    const steps = [
      'Initializing AI Diagnostic Sandbox Container...',
      `Mounting execution logs for legacy task: ${targetJob?.jobName || selectedJobId}...`,
      'Auditing schema definitions & nullability constraints mapping...',
      'Analyzing socket egress rate limit trends and payload sizes...',
      'Interrogating Gemini models for anomalous telemetry patterns...',
      'Assembling predictive error vectors and preventative rules...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setScanStep(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    // Dynamic result based on selected job details
    let score = 15;
    let failureRisk: 'Low' | 'Elevated' | 'Severe' = 'Low';
    let cause = 'Deterministic matching and database schemas are structurally resilient. Safe to deploy.';
    let actions: string[] = [];

    if (selectedJobId === 'job-hist-201') {
      score = 72;
      failureRisk = 'Severe';
      cause = 'OData ingestion layer reports repeated HTTP 429 Too Many Requests rate blocks due to high record velocity (14,250 rows in single-thread batch snapshot).';
      actions = [
        'Partition the migration dataset into micro-batches of max 2,500 records.',
        'Implement an exponential back-off jitter algorithm in the transformation sink pipeline.',
        'Pre-configure a target posting group "DOMESTIC" to bypass unmapped entity fallbacks.',
      ];
    } else if (selectedJobId === 'job-hist-203') {
      score = 48;
      failureRisk = 'Elevated';
      cause = 'Connector address length mismatches. Source Salesforce accounts have multiple address lines exceeding Dynamics Business Central limits, triggering overflow truncations.';
      actions = [
        'Apply an active regex transformation rule to clip account billing addresses at 50 chars.',
        'Convert relational nulls to "N/A - Unspecified" fallback string schemas.',
      ];
    } else {
      score = 22;
      failureRisk = 'Low';
      cause = 'Vendor Accounts Payable Legacy Import registers healthy structure. Minimal constraint discrepancies predicted.';
      actions = [
        'Verify mapping rule version is pinned to "v1.8-vendor-cleansed".',
        'Run a standard 5% sample Dry-Run simulation before full execution.',
      ];
    }

    setScanResult({
      jobId: selectedJobId,
      score,
      failureRisk,
      primaryRootCause: cause,
      preventativeActions: actions,
      logScanConfidence: 0.94,
    });
    setIsScanningLogs(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'High':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Moderate':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  const getRiskPulseColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'bg-rose-500';
      case 'High':
        return 'bg-orange-500';
      case 'Moderate':
        return 'bg-amber-500';
      default:
        return 'bg-emerald-500';
    }
  };

  const getThreatBadgeColor = (level: string) => {
    switch (level) {
      case 'High':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <>
      {/* 1. Header Predictive Risk Pulse Badge */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          id="btn-predictive-risk-badge"
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all hover:scale-105 active:scale-95 shadow-2xs cursor-pointer ${
            isLoading
              ? 'bg-slate-800 text-slate-400 border-slate-700'
              : riskData
              ? getRiskColor(riskData.riskLevel)
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
          title="Open AI Predictive Risk Diagnostic Center"
        >
          {isLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
          ) : (
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${riskData ? getRiskPulseColor(riskData.riskLevel) : 'bg-slate-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${riskData ? getRiskPulseColor(riskData.riskLevel) : 'bg-slate-400'}`}></span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
            <span>AI Risk Index:</span>
            <strong className="uppercase">
              {isLoading ? 'CALCULATING...' : riskData ? `${riskData.riskLevel} (${riskData.riskScore}%)` : 'UNKNOWN'}
            </strong>
          </span>
        </button>
      </div>

      {/* 2. Diagnostic Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Top accent bar */}
              <div className="h-1.5 bg-indigo-600" />

              {/* Modal Header */}
              <div className="p-6 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      Gemini Co-Pilot Engine
                    </span>
                    {riskData?.aiGenerated && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Live AI Grounded
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldAlert className="w-5.5 h-5.5 text-indigo-600" />
                    AI Predictive Failure Risk Diagnostic Center
                  </h3>
                  <p className="text-xs text-slate-500">
                    Continuous pipeline safety scanner powered by Gemini 3.6 Flash. Prevents data truncations and API rate throttling.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body Container (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={() => fetchTelemetryRisk()}
                      className="ml-auto underline font-bold hover:text-rose-950"
                    >
                      Retry Analysis
                    </button>
                  </div>
                )}

                {/* Grid 1: Dynamic Live Telemetry Risk Scorecard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Gauge card */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col items-center justify-center text-center space-y-4">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-sans">
                      Predictive Failure Probability
                    </span>

                    <div className="relative flex items-center justify-center w-36 h-36">
                      {/* Circle Background */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="72"
                          cy="72"
                          r="60"
                          stroke="#e2e8f0"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        <circle
                          cx="72"
                          cy="72"
                          r="60"
                          stroke={riskData?.riskLevel === 'Critical' ? '#ef4444' : riskData?.riskLevel === 'High' ? '#f97316' : riskData?.riskLevel === 'Moderate' ? '#f59e0b' : '#10b981'}
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={376.8}
                          strokeDashoffset={376.8 - (376.8 * (riskData?.predictedJobFailureProbability || 15)) / 100}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      {/* Center Stats */}
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-900 font-mono">
                          {isLoading ? '--' : `${riskData?.predictedJobFailureProbability}%`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                          Risk Probability
                        </span>
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="text-slate-500 font-semibold">Active Profile:</span>
                      <strong className="text-slate-800 ml-1 block font-mono font-bold">
                        {selectedProfileId === 'sap-extractor' ? 'SAP ERP Financials Extractor'
                          : selectedProfileId === 'salesforce-sync' ? 'Salesforce Sync Engine'
                          : selectedProfileId === 'oracle-ledger' ? 'Oracle DB Bulk Loader'
                          : 'Cassandra Stream Pipeline'}
                      </strong>
                    </div>
                  </div>

                  {/* Diagnostic Details card */}
                  <div className="md:col-span-2 bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          AI Telemetry Diagnosis
                        </span>
                        <button
                          type="button"
                          onClick={() => fetchTelemetryRisk()}
                          disabled={isLoading}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                          <span>Recalculate</span>
                        </button>
                      </div>

                      {isLoading ? (
                        <div className="py-8 text-center space-y-2">
                          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                          <span className="text-xs text-slate-400 font-mono block">Synthesizing live telemetry layers...</span>
                        </div>
                      ) : riskData ? (
                        <div className="space-y-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">Calculated Risk Index:</span>
                            <span className={`px-2.5 py-0.5 rounded-full font-mono font-extrabold border ${getRiskColor(riskData.riskLevel)}`}>
                              {riskData.riskLevel.toUpperCase()} ({riskData.riskScore}/100)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">Predicted Primary Bottleneck:</span>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-mono rounded font-bold border border-slate-300">
                              {riskData.bottleneckNode}
                            </span>
                          </div>

                          <div className="bg-white p-3.5 rounded-lg border border-slate-150 space-y-1.5 shadow-2xs">
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                              <Info className="w-3.5 h-3.5 text-indigo-500" />
                              Architect Recommendations:
                            </span>
                            <p className="text-slate-600 leading-relaxed text-[11px]">
                              {riskData.detailedRecommendation}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 text-xs py-8 text-center">No telemetry risk data parsed.</div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-200 pt-3">
                      <span>Telemetry inputs: CPU {currentCpu}%, Heap {currentMemory}%</span>
                      <span>Audited benchmarks: {riskData?.historicalLogsAnalyzed || 42} items</span>
                    </div>
                  </div>
                </div>

                {/* Core Risk Flags Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    AI Flagged Threats &amp; System Flaws ({riskData?.criticalFlags.length || 0})
                  </h4>

                  {isLoading ? (
                    <div className="space-y-2">
                      <div className="bg-slate-50 h-14 rounded-lg animate-pulse" />
                      <div className="bg-slate-50 h-14 rounded-lg animate-pulse" />
                    </div>
                  ) : riskData && riskData.criticalFlags.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {riskData.criticalFlags.map((flag, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border space-y-1.5 transition-all shadow-2xs bg-slate-50/50 border-slate-200`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{flag.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase ${getThreatBadgeColor(flag.threatLevel)}`}>
                              {flag.threatLevel} Risk
                            </span>
                          </div>
                          <p className="text-slate-500 leading-relaxed text-[11px]">
                            {flag.description}
                          </p>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                            <span>Layer: {flag.category}</span>
                            <span>Target: {riskData.bottleneckNode}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                      <span>All resource indicators are nominal. No active failure vectors predicted.</span>
                    </div>
                  )}
                </div>

                {/* Migration Risk Forecasting Line Chart Panel */}
                <div className="pt-2">
                  <MigrationRiskForecastingPanel
                    currentCpu={currentCpu}
                    currentMemory={currentMemory}
                  />
                </div>

                {/* Tab Section: Deep Log Analyzer on Historical runs */}
                <div className="border-t border-slate-200 pt-6 space-y-4">
                  <div className="bg-slate-50 rounded-xl border border-slate-150 p-4">
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-1">
                      <Clock className="w-4.5 h-4.5 text-indigo-600" />
                      Historical Log Audit &amp; Failure Simulator
                    </h4>
                    <p className="text-xs text-slate-500">
                      Select any previously executed, failed, or completed batch from storage and run an on-demand AI predictive trace to see if newer schema rules will break it.
                    </p>

                    <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                      <div className="w-full sm:flex-1">
                        <select
                          value={selectedJobId}
                          onChange={(e) => {
                            setSelectedJobId(e.target.value);
                            setScanResult(null);
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          {historicalJobs.map((job) => (
                            <option key={job.id} value={job.id}>
                              {job.jobName} ({job.originalTotalRecords.toLocaleString()} rows)
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleDeepLogScan}
                        disabled={isScanningLogs || !selectedJobId}
                        className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <Search className={`w-3.5 h-3.5 ${isScanningLogs ? 'animate-spin' : ''}`} />
                        <span>{isScanningLogs ? 'Scanning Trace...' : 'Scan Historical Logs'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Scanning State Loader */}
                  {isScanningLogs && (
                    <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                        <span className="font-bold text-white">AI DIAGNOSTIC TRACE RUNNING:</span>
                      </div>
                      <p className="text-slate-400 pl-4 animate-pulse">&gt; {scanStep}</p>
                    </div>
                  )}

                  {/* Scan Result Report */}
                  {scanResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            Post-Execution Failure Prediction Report
                          </span>
                          <h5 className="font-extrabold text-slate-900 text-xs mt-1">
                            Audited ID: {scanResult.jobId}
                          </h5>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <span className="text-xs text-slate-500">Predicted Failure Threat:</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${
                            scanResult.failureRisk === 'Severe' ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : scanResult.failureRisk === 'Elevated' ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {scanResult.failureRisk}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 block">Identified Failure Vector:</span>
                          <p className="text-slate-600 leading-relaxed text-[11px]">
                            {scanResult.primaryRootCause}
                          </p>
                        </div>

                        {scanResult.preventativeActions.length > 0 && (
                          <div className="space-y-2 border-t border-slate-200 pt-3">
                            <span className="font-bold text-slate-900 block flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-indigo-500" />
                              AI Recommended Intercept Rules (Apply in Field Map / Scaling):
                            </span>
                            <ul className="space-y-1.5 pl-4 list-disc text-slate-600 text-[11px] leading-relaxed">
                              {scanResult.preventativeActions.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center text-xs text-slate-400">
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  <span>EDIMP Audit Container ID: dagn-1049-v9</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-950 text-white rounded-xl font-bold transition-all cursor-pointer"
                >
                  Close Diagnostic Center
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
