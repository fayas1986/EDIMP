import React, { useState, useMemo } from 'react';
import {
  Play,
  FlaskConical,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Zap,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  Database,
  Sliders,
  DollarSign,
  FileCheck,
  Check,
  FileDown,
  Activity,
  AlertCircle,
  Server,
  Workflow,
  XCircle,
  FileText,
  Building2,
  Users,
  FileSpreadsheet,
  Briefcase,
  Cloud,
  Code,
  Network,
  Filter,
  CheckCircle,
} from 'lucide-react';

import {
  generateImpactAnalysisPDF,
  DataConflict,
  TransformationError,
  BottleneckMetric,
  SimulationReportData,
} from '../utils/pdfGenerator';

import {
  PRODUCTION_PIPELINES,
  PIPELINE_CATEGORIES,
  PIPELINE_DISPLAY_NAMES,
  ProductionPipeline,
} from '../data/pipelineSimulationData';

import { INITIAL_CONNECTORS } from '../data/mockData';

// Helper to render icon component dynamically based on connector icon string
const renderConnectorIcon = (iconName: string, className = 'w-4 h-4') => {
  switch (iconName) {
    case 'Building2':
      return <Building2 className={className} />;
    case 'Database':
      return <Database className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'FileSpreadsheet':
      return <FileSpreadsheet className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Server':
      return <Server className={className} />;
    case 'Cloud':
      return <Cloud className={className} />;
    case 'Code':
      return <Code className={className} />;
    default:
      return <Database className={className} />;
  }
};

export const MigrationSimulationView: React.FC<{
  onCommitFullMigration?: () => void;
}> = ({ onCommitFullMigration }) => {
  // Pipeline and Sampling configuration state
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('SAP_ECC_TO_D365_CUSTOMERS');
  const [sampleType, setSampleType] = useState<'records' | 'percentage'>('records');
  const [sampleRecordCount, setSampleRecordCount] = useState<number>(1000);
  const [samplePercentage, setSamplePercentage] = useState<number>(1);
  const [samplingStrategy, setSamplingStrategy] = useState<'uniform' | 'stratified' | 'high_risk'>('uniform');

  // Ad-hoc Custom Connector Mode state
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customSourceConnId, setCustomSourceConnId] = useState<string>(INITIAL_CONNECTORS[3].id); // SAP
  const [customDestConnId, setCustomDestConnId] = useState<string>(INITIAL_CONNECTORS[0].id); // BC
  const [customSourceEntity, setCustomSourceEntity] = useState<string>('KNA1_Customers');
  const [customDestEntity, setCustomDestEntity] = useState<string>('Customer_Entity');

  // Simulation execution and report states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [simulationCompleted, setSimulationCompleted] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfDownloadedToast, setPdfDownloadedToast] = useState<string | null>(null);

  const [activeReportTab, setActiveReportTab] = useState<
    'OVERVIEW' | 'CONFLICTS' | 'TRANSFORMATIONS' | 'BOTTLENECKS' | 'REMEDIATION'
  >('OVERVIEW');

  // Active pipeline resolution
  const activePipeline: ProductionPipeline = useMemo(() => {
    if (isCustomMode) {
      const srcConn = INITIAL_CONNECTORS.find(c => c.id === customSourceConnId) || INITIAL_CONNECTORS[0];
      const destConn = INITIAL_CONNECTORS.find(c => c.id === customDestConnId) || INITIAL_CONNECTORS[1];
      return {
        id: 'CUSTOM_AD_HOC',
        name: `Ad-Hoc: ${customSourceEntity} (${srcConn.name} → ${destConn.name})`,
        shortName: `${srcConn.provider} → ${destConn.provider}`,
        category: 'ERP & Financials',
        sourceConnectorId: srcConn.id,
        sourceConnectorName: srcConn.name,
        sourceType: srcConn.category,
        sourceIcon: srcConn.icon,
        sourceProtocol: `${srcConn.authType} (${srcConn.latencyMs}ms)`,
        sourceEntity: customSourceEntity,
        destConnectorId: destConn.id,
        destConnectorName: destConn.name,
        destType: destConn.category,
        destIcon: destConn.icon,
        destProtocol: `${destConn.authType} (${destConn.latencyMs}ms)`,
        destEntity: customDestEntity,
        totalRecords: 5000000,
        totalTB: 2.5,
        predictedSuccessRate: 99.0,
        estimatedErrorsCount: 50000,
        estimatedDurationMinutes: 22,
        estimatedCloudCostUSD: 12.00,
        peakMemoryPerNodeGB: 8.5,
        recommendedWorkerNodes: 32,
        riskSeverity: 'Low Risk',
        rawSourceLabel: `SOURCE SCHEMA (${srcConn.provider})`,
        rawSourceSample: {
          id: 'SRC-90021',
          entity_name: customSourceEntity,
          created_at: new Date().toISOString(),
          status: 'ACTIVE',
          data_payload: { code: 'VAL_01', region: 'GLOBAL', amount: 15400.00 }
        },
        simulatedTargetLabel: `TARGET SCHEMA (${destConn.provider})`,
        simulatedTargetPayload: {
          target_id: 'TRG-90021',
          destination_entity: customDestEntity,
          synchronized_at: new Date().toISOString(),
          status_flag: 'MIGRATED',
          normalized_amount_usd: 15400.00
        },
        conflicts: [
          {
            id: 'cc1',
            category: 'Constraint',
            rule: `${srcConn.provider} to ${destConn.provider} Foreign Key Mapping Check`,
            affectedRecords: 1200,
            impactedField: 'primary_key_id',
            severity: 'Medium',
            description: `Ensures all relational foreign references resolve cleanly in ${destConn.name}.`,
            actionNeeded: 'Apply surrogate key translation table before execution.'
          }
        ],
        transformationErrors: [
          {
            id: 'ct1',
            type: 'Type Coercion',
            sourceField: 'data_payload.amount',
            targetField: 'normalized_amount_usd',
            errorCount: 150,
            sampleFailure: 'String representation with currency formatting',
            remediation: 'Regex numeric cast to 64-bit float decimal.'
          }
        ],
        bottlenecks: [
          {
            resource: `${destConn.provider} Gateway Buffer`,
            currentValue: '2,200 writes / sec',
            threshold: '4,000 writes / sec',
            status: 'Optimal',
            bottleneckRisk: 'Healthy write throughput.',
            recommendation: 'Maintain current worker batch thread allocation.'
          }
        ],
        remediationSteps: [
          `Apply schema type coercion from ${srcConn.provider} formats to ${destConn.provider} types.`,
          'Execute pre-flight deduplication sweep across primary key indices.'
        ]
      };
    }

    const found = PRODUCTION_PIPELINES.find(p => p.id === selectedPipelineId);
    return found || PRODUCTION_PIPELINES[0];
  }, [selectedPipelineId, isCustomMode, customSourceConnId, customDestConnId, customSourceEntity, customDestEntity]);

  // Compute report data dynamically based on active pipeline, sample sizing, and strategy
  const report: SimulationReportData = useMemo(() => {
    const calcCount = sampleType === 'records' ? sampleRecordCount : Math.round((samplePercentage / 100) * activePipeline.totalRecords);
    const mult = samplingStrategy === 'high_risk' ? 1.35 : samplingStrategy === 'stratified' ? 1.05 : 1.0;
    const estErrors = Math.round(activePipeline.totalRecords * ((100 - activePipeline.predictedSuccessRate) / 100) * mult);
    const successRate = +(activePipeline.predictedSuccessRate - (samplingStrategy === 'high_risk' ? 0.3 : 0)).toFixed(1);

    return {
      pipelineName: activePipeline.name,
      sampleSizeRecords: calcCount,
      samplePercentage: sampleType === 'percentage' ? samplePercentage : +((calcCount / activePipeline.totalRecords) * 100).toFixed(3),
      totalDatasetRecords: activePipeline.totalRecords,
      totalDatasetTB: activePipeline.totalTB,
      predictedSuccessRate: successRate,
      estimatedErrorsCount: estErrors,
      estimatedDurationMinutes: Math.max(8, Math.round(activePipeline.estimatedDurationMinutes * (calcCount / 1000 > 1 ? 1.05 : 1))),
      estimatedCloudCostUSD: +(activePipeline.estimatedCloudCostUSD * (calcCount / 1000 > 1 ? 1.04 : 1)).toFixed(2),
      peakMemoryPerNodeGB: activePipeline.peakMemoryPerNodeGB,
      recommendedWorkerNodes: activePipeline.recommendedWorkerNodes,
      riskSeverity: activePipeline.riskSeverity,
      conflicts: activePipeline.conflicts.map((c) => ({
        ...c,
        affectedRecords: Math.round(c.affectedRecords * (calcCount / 1000) * mult) || c.affectedRecords,
      })),
      transformationErrors: activePipeline.transformationErrors.map((t) => ({
        ...t,
        errorCount: Math.round(t.errorCount * (calcCount / 1000) * mult) || t.errorCount,
      })),
      bottlenecks: activePipeline.bottlenecks,
      remediationSteps: activePipeline.remediationSteps,
    };
  }, [activePipeline, sampleType, sampleRecordCount, samplePercentage, samplingStrategy]);

  // Handle pipeline selection switch
  const handleSelectPipeline = (val: string) => {
    if (val === 'CUSTOM_AD_HOC') {
      setIsCustomMode(true);
      setSelectedPipelineId('CUSTOM_AD_HOC');
      return;
    }

    setIsCustomMode(false);
    setSelectedPipelineId(val);
  };

  // Fault-Tolerant Incremental Retry States
  const [retryState, setRetryState] = useState<'idle' | 'running_validation' | 'running_api' | 'running_duplicates' | 'completed'>('idle');
  const [retryProgress, setRetryProgress] = useState<number>(0);
  const [retrySuccessCount, setRetrySuccessCount] = useState<number>(985430);
  const [retryValidationErrorCount, setRetryValidationErrorCount] = useState<number>(12210);
  const [retryApiErrorCount, setRetryApiErrorCount] = useState<number>(1850);
  const [retryDuplicateCount, setRetryDuplicateCount] = useState<number>(530);
  const [quarantinedCount, setQuarantinedCount] = useState<number>(0);
  const [retryLog, setRetryLog] = useState<string[]>([
    'System ready for hot-swap incremental recovery.',
    'Awaiting instructions to target the 14,590 failed cursors.'
  ]);

  const handleIncrementalRetry = () => {
    setRetryState('running_validation');
    setRetryProgress(10);
    setRetryLog(prev => [...prev, '⚡ Initiating hot-swap cursor incremental recovery...', '⚙️ Fetching 12,210 validation failure target record references...']);

    // Step 1: Validation errors fix simulation (Takes 1 sec)
    setTimeout(() => {
      setRetryState('running_api');
      setRetryProgress(45);
      setRetrySuccessCount(prev => prev + 12050); // 12,050 records fixed successfully
      setRetryValidationErrorCount(160); // 160 are moved to quarantine
      setQuarantinedCount(prev => prev + 160);
      setRetryLog(prev => [
        ...prev,
        '✔️ Hot-applied pre-flight regex validation formatter (TAX_ID_REGEX_VALIDATE) to unformatted fields.',
        '✔️ Successfully recovered 12,050 validation failure records!',
        '⚠️ 160 records failed deep structural constraints. Routed to Quarantine Staging Queue.',
        '⚙️ Fetching 1,850 API connection/throttling failures...'
      ]);
    }, 1000);

    // Step 2: API errors fix simulation (Takes 2 secs)
    setTimeout(() => {
      setRetryState('running_duplicates');
      setRetryProgress(80);
      setRetrySuccessCount(prev => prev + 1840); // 1,840 records fixed
      setRetryApiErrorCount(10); // 10 remain failed
      setQuarantinedCount(prev => prev + 10);
      setRetryLog(prev => [
        ...prev,
        '✔️ Calibrated network cluster connection pooling: increased limit to 128.',
        '✔️ Implemented adaptive exponential-backoff retry strategy on target OData endpoints.',
        '✔️ Successfully committed 1,840 API-exception records!',
        '⚠️ 10 records received persistent 404/500 faults. Routed to Quarantine Staging Queue.',
        '⚙️ Fetching 530 duplicate key collisions...'
      ]);
    }, 2000);

    // Step 3: Duplicate records merge simulation (Takes 3 secs)
    setTimeout(() => {
      setRetryState('completed');
      setRetryProgress(100);
      setRetrySuccessCount(prev => prev + 510);
      setRetryDuplicateCount(20);
      setQuarantinedCount(prev => prev + 20);
      setRetryLog(prev => [
        ...prev,
        '✔️ Executed automated CDM deduplication merge for cross-branch duplicates.',
        '✔️ Successfully resolved 510 key collisions!',
        '⚠️ 20 records skipped due to manual review block policies. Routed to Quarantine Staging Queue.',
        '🎉 Hot-swap Incremental Recovery Phase completed!',
        '📈 Saved 98.5% cloud compute budget & avoided 985,430 redundant write locks!'
      ]);
    }, 3000);
  };

  const handleResetRetry = () => {
    setRetryState('idle');
    setRetryProgress(0);
    setRetrySuccessCount(985430);
    setRetryValidationErrorCount(12210);
    setRetryApiErrorCount(1850);
    setRetryDuplicateCount(530);
    setQuarantinedCount(0);
    setRetryLog([
      'System ready for hot-swap incremental recovery.',
      'Awaiting instructions to target the 14,590 failed cursors.'
    ]);
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimStep(1);

    setTimeout(() => setSimStep(2), 600);
    setTimeout(() => setSimStep(3), 1200);
    setTimeout(() => setSimStep(4), 1800);

    setTimeout(() => {
      setIsSimulating(false);
      setSimStep(0);
      setSimulationCompleted(true);
    }, 2400);
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      try {
        generateImpactAnalysisPDF(report);
        setPdfDownloadedToast(`PDF Impact Analysis Report for ${activePipeline.shortName} generated & downloaded successfully.`);
        setTimeout(() => setPdfDownloadedToast(null), 4000);
      } catch (err) {
        console.error('Failed to generate PDF:', err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 300);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-mono font-semibold rounded-full border border-indigo-100">
              Module 14 – Dry-Run Migration Simulation Engine
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-mono font-semibold rounded-full border border-emerald-100 flex items-center gap-1">
              <FlaskConical className="w-3 h-3 text-emerald-500" />
              Non-Destructive Dry Sandbox
            </span>
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-mono font-semibold rounded-full border border-purple-100 flex items-center gap-1">
              <Network className="w-3 h-3 text-purple-500" />
              {INITIAL_CONNECTORS.length} Connectors Active • {PRODUCTION_PIPELINES.length} Pipelines
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5 text-slate-900">
            <FlaskConical className="w-6 h-6 text-indigo-600" />
            Migration Dry-Run &amp; Impact Prediction Studio
          </h1>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Simulate full-scale migrations on sampled data subsets across all enterprise connectors (ERP, CRM, Databases, Lakehouses, Cloud Storage, and REST APIs) to predict transformation error rates, compute cluster resource bottlenecks, and preview target schema payloads before executing production jobs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 z-10">
          {simulationCompleted && (
            <button
              id="sim-download-pdf-btn"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FileDown className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Impact Analysis (PDF)'}</span>
            </button>
          )}

          <button
            id="sim-run-dryrun-btn"
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Simulating Dry Run...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-white" />
                <span>Execute Dry-Run Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Enhanced Dry-Run Sample Subset Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            Dry-Run Sample Subset Configuration
          </h2>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono">
              <Network className="w-3 h-3 text-indigo-500" />
              {PRODUCTION_PIPELINES.length} Real-Time Pipelines Available
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-5 text-xs">
          {/* Target Pipeline Dropdown spanning across all 9+ connectors */}
          <div className="space-y-1.5 md:col-span-3 lg:col-span-5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 block">Select Pipeline Job</label>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-mono">
                {isCustomMode ? 'Custom Ad-Hoc' : activePipeline.category}
              </span>
            </div>
            <select
              value={selectedPipelineId}
              onChange={(e) => handleSelectPipeline(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {PIPELINE_CATEGORIES.map((category) => (
                <optgroup key={category} label={`━━ ${category} ━━`}>
                  {PRODUCTION_PIPELINES.filter((p) => p.category === category).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
              <optgroup label="━━ Custom Integration ━━">
                <option value="CUSTOM_AD_HOC">⚙️ Custom Ad-Hoc Connector Mapping (Select from 9+ Connectors)...</option>
              </optgroup>
            </select>
          </div>

          {/* Sample Sampling Mode */}
          <div className="space-y-1.5 md:col-span-1 lg:col-span-3">
            <label className="font-bold text-slate-800 block">Sample Subset Sizing</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSampleType('records')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold border transition-all whitespace-nowrap text-center ${
                  sampleType === 'records'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Fixed Count
              </button>
              <button
                type="button"
                onClick={() => setSampleType('percentage')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold border transition-all whitespace-nowrap text-center ${
                  sampleType === 'percentage'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Percentage
              </button>
            </div>
          </div>

          {/* Subset Quantity Control and Slider */}
          <div className="space-y-1.5 md:col-span-2 lg:col-span-4">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-800">
                {sampleType === 'records' ? 'Sample Record Count' : 'Dataset Percentage'}
              </label>
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {sampleType === 'records' ? `${sampleRecordCount.toLocaleString()} Records` : `${samplePercentage}%`}
              </span>
            </div>

            {sampleType === 'records' ? (
              <input
                type="range"
                min={100}
                max={50000}
                step={100}
                value={sampleRecordCount}
                onChange={(e) => setSampleRecordCount(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 my-3 block focus:outline-none"
              />
            ) : (
              <input
                type="range"
                min={0.1}
                max={10}
                step={0.1}
                value={samplePercentage}
                onChange={(e) => setSamplePercentage(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 my-3 block focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Quick-Set Presets & Sampling Strategy Filter Row */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1 text-[11px]">
              <Filter className="w-3 h-3 text-slate-400" />
              Quick Presets:
            </span>
            <button
              type="button"
              onClick={() => { setSampleType('records'); setSampleRecordCount(1000); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                sampleType === 'records' && sampleRecordCount === 1000
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              1,000 (Fast Check)
            </button>
            <button
              type="button"
              onClick={() => { setSampleType('records'); setSampleRecordCount(5000); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                sampleType === 'records' && sampleRecordCount === 5000
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              5,000 (Standard)
            </button>
            <button
              type="button"
              onClick={() => { setSampleType('records'); setSampleRecordCount(25000); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                sampleType === 'records' && sampleRecordCount === 25000
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              25,000 (Deep Profile)
            </button>
            <button
              type="button"
              onClick={() => { setSampleType('percentage'); setSamplePercentage(1); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                sampleType === 'percentage' && samplePercentage === 1
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              1.0% Proportional
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold text-[11px]">Sampling Strategy:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSamplingStrategy('uniform')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  samplingStrategy === 'uniform'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Statistically uniform random distribution across worker partitions"
              >
                Uniform Random
              </button>
              <button
                type="button"
                onClick={() => setSamplingStrategy('stratified')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  samplingStrategy === 'stratified'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Proportionally stratify across regional accounts & ledger groups"
              >
                Stratified (Multi-Region)
              </button>
              <button
                type="button"
                onClick={() => setSamplingStrategy('high_risk')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  samplingStrategy === 'high_risk'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Focus sampling on complex edge cases, unmapped strings, and extreme values"
              >
                Edge-Case &amp; High-Risk
              </button>
            </div>
          </div>
        </div>

        {/* Custom Ad-Hoc Connector Selector Controls (If Custom Mode is Selected) */}
        {isCustomMode && (
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between text-indigo-900 font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <Workflow className="w-4 h-4 text-indigo-600" />
                Ad-Hoc Custom Connector Pair Builder (Select Any Source &amp; Destination)
              </span>
              <span className="text-[11px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">
                {INITIAL_CONNECTORS.length} Connectors Available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Source Connector</label>
                <select
                  value={customSourceConnId}
                  onChange={(e) => setCustomSourceConnId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  {INITIAL_CONNECTORS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Source Entity / Table</label>
                <input
                  type="text"
                  value={customSourceEntity}
                  onChange={(e) => setCustomSourceEntity(e.target.value)}
                  placeholder="e.g. Customers_Master"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Destination Connector</label>
                <select
                  value={customDestConnId}
                  onChange={(e) => setCustomDestConnId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  {INITIAL_CONNECTORS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Destination Entity</label>
                <input
                  type="text"
                  value={customDestEntity}
                  onChange={(e) => setCustomDestEntity(e.target.value)}
                  placeholder="e.g. Target_Table_v2"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Live Connector Topology & Execution Context Bar */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/90 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          {/* Source Node */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200 shadow-2xs">
              {renderConnectorIcon(activePipeline.sourceIcon, 'w-4 h-4 text-indigo-700')}
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider flex items-center gap-1">
                Source System • <span className="text-indigo-600 font-bold">{activePipeline.sourceType}</span>
              </div>
              <div className="font-bold text-slate-900 leading-tight truncate max-w-[200px]">
                {activePipeline.sourceConnectorName}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {activePipeline.sourceEntity} ({activePipeline.sourceProtocol})
              </div>
            </div>
          </div>

          {/* Transformation Stream Link */}
          <div className="flex flex-col items-center justify-center px-4 shrink-0 w-full md:w-auto">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Transformation Pipeline Stream</span>
            </div>
            <div className="flex items-center gap-1 w-32 md:w-44 text-slate-300 my-1 justify-center">
              <div className="h-[2px] w-full bg-gradient-to-r from-indigo-300 via-purple-400 to-indigo-300" />
              <ArrowRight className="w-4 h-4 text-indigo-600 shrink-0 -ml-1" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-600">
              Total Production: {(activePipeline.totalRecords / 1000000).toFixed(2)}M ({activePipeline.totalTB} TB)
            </span>
          </div>

          {/* Destination Node */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end">
            <div className="text-left md:text-right">
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider flex items-center md:justify-end gap-1">
                Target System • <span className="text-emerald-600 font-bold">{activePipeline.destType}</span>
              </div>
              <div className="font-bold text-slate-900 leading-tight truncate max-w-[200px]">
                {activePipeline.destConnectorName}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {activePipeline.destEntity} ({activePipeline.destProtocol})
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
              {renderConnectorIcon(activePipeline.destIcon, 'w-4 h-4 text-emerald-700')}
            </div>
          </div>
        </div>
      </div>

      {/* Live Simulation Stepper State */}
      {isSimulating && (
        <div className="bg-white text-slate-800 rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 font-mono text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-indigo-600 font-extrabold border-b border-slate-100 pb-2">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
              Executing Dry-Run Simulator for {activePipeline.shortName}...
            </span>
            <span className="bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100 text-[10px]">Step {simStep} of 4</span>
          </div>

          <div className="space-y-2 pt-1">
            <div className={`flex items-center gap-2.5 ${simStep >= 1 ? 'text-emerald-600 font-extrabold' : 'text-slate-400 font-medium'}`}>
              {simStep >= 1 ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
              <span>1. Extracting sampled subset ({sampleType === 'records' ? `${sampleRecordCount.toLocaleString()} records` : `${samplePercentage}% dataset`}) from {activePipeline.sourceConnectorName}...</span>
            </div>
            <div className={`flex items-center gap-2.5 ${simStep >= 2 ? 'text-emerald-600 font-extrabold' : 'text-slate-400 font-medium'}`}>
              {simStep >= 2 ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
              <span>2. Testing Gemini AI schema transformation &amp; type coercion rules targeting {activePipeline.destConnectorName}...</span>
            </div>
            <div className={`flex items-center gap-2.5 ${simStep >= 3 ? 'text-emerald-600 font-extrabold' : 'text-slate-400 font-medium'}`}>
              {simStep >= 3 ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
              <span>3. Evaluating constraint validations &amp; duplicate key detection for {activePipeline.sourceEntity}...</span>
            </div>
            <div className={`flex items-center gap-2.5 ${simStep >= 4 ? 'text-emerald-600 font-extrabold' : 'text-slate-400 font-medium'}`}>
              {simStep >= 4 ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
              <span>4. Computing cluster memory footprint &amp; compiling predicted impact report across {activePipeline.recommendedWorkerNodes} worker nodes...</span>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Result Report */}
      {simulationCompleted && !isSimulating && (
        <div className="space-y-6">
          {/* Executive Summary Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold text-slate-600">Predicted Success Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight text-emerald-600">
                {report.predictedSuccessRate}%
              </div>
              <div className="text-[11px] text-slate-500">
                Est. {report.estimatedErrorsCount.toLocaleString()} anomalies across {(report.totalDatasetRecords / 1000000).toFixed(2)}M records
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold text-slate-600">Predicted Execution Time</span>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {report.estimatedDurationMinutes} mins
              </div>
              <div className="text-[11px] text-slate-500">
                On {report.recommendedWorkerNodes} Spark Worker Nodes ({report.totalDatasetTB} TB Total)
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold text-slate-600">Estimated Cloud Run Cost</span>
                <DollarSign className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                ${report.estimatedCloudCostUSD.toFixed(2)} USD
              </div>
              <div className="text-[11px] text-slate-500">
                Based on compute time &amp; network egress
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold text-slate-600">Predicted Risk Profile</span>
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600 tracking-tight">
                {report.riskSeverity}
              </div>
              <div className="text-[11px] text-slate-500">
                0 breaking schema drift failures
              </div>
            </div>
          </div>

          {/* Interactive Report View Tabs Navigation Bar */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveReportTab('OVERVIEW')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeReportTab === 'OVERVIEW'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Executive Summary</span>
              </button>

              <button
                onClick={() => setActiveReportTab('CONFLICTS')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeReportTab === 'CONFLICTS'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Data Conflicts ({report.conflicts.length})</span>
              </button>

              <button
                onClick={() => setActiveReportTab('TRANSFORMATIONS')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeReportTab === 'TRANSFORMATIONS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Workflow className="w-3.5 h-3.5" />
                <span>Transformation Errors ({report.transformationErrors.length})</span>
              </button>

              <button
                onClick={() => setActiveReportTab('BOTTLENECKS')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeReportTab === 'BOTTLENECKS'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Performance Bottlenecks ({report.bottlenecks.length})</span>
              </button>

              <button
                onClick={() => setActiveReportTab('REMEDIATION')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeReportTab === 'REMEDIATION'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Remediation Roadmap</span>
              </button>
            </div>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
            >
              <FileDown className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF Report'}</span>
            </button>
          </div>

          {/* TAB 1: EXECUTIVE OVERVIEW & ANOMALIES */}
          {activeReportTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Dry-Run Anomaly Detection &amp; Remediation Highlights ({activePipeline.name})
                </h2>

                <div className="space-y-3 text-xs">
                  {report.conflicts.slice(0, 3).map((risk, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          {risk.rule}
                        </span>
                        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 text-[11px]">
                          Est. ~{risk.affectedRecords.toLocaleString()} Records Affected
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{risk.description}</p>
                      <div className="p-2.5 bg-indigo-50/80 rounded-lg border border-indigo-100 text-indigo-900 font-semibold flex items-center gap-2 text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Recommended Fix: {risk.actionNeeded}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA CONFLICTS TABLE */}
          {activeReportTab === 'CONFLICTS' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-3 p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Identified Potential Data Conflicts ({report.conflicts.length} Rules Flagged)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Integrity checks, syntax issues, null constraints, and key collision risks across full {activePipeline.shortName} dataset.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-xl border border-amber-200">
                  Pre-Flight Audit
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Conflict Rule</th>
                      <th className="py-3 px-4">Impacted Field</th>
                      <th className="py-3 px-4">Est. Affected Records</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Actionable Remediation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {report.conflicts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-950">{c.category}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{c.rule}</td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{c.impactedField}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {c.affectedRecords.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              c.severity === 'Critical'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : c.severity === 'High'
                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {c.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700">{c.actionNeeded}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSFORMATION ERRORS */}
          {activeReportTab === 'TRANSFORMATIONS' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-3 p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-indigo-600" />
                    Predicted Schema Transformation &amp; Type Coercion Failures ({report.transformationErrors.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Field-level datatype casting errors, truncation overflows, and lookup value mismatches between {activePipeline.sourceConnectorName} and {activePipeline.destConnectorName}.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-200">
                  Schema Dry-Run
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Failure Type</th>
                      <th className="py-3 px-4">Source Field</th>
                      <th className="py-3 px-4">Target Field</th>
                      <th className="py-3 px-4">Est. Error Count</th>
                      <th className="py-3 px-4">Sample Failure Payload</th>
                      <th className="py-3 px-4">Auto-Remediation Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {report.transformationErrors.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px]">
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-900 font-semibold">{t.sourceField}</td>
                        <td className="py-3 px-4 font-mono text-indigo-600 font-semibold">{t.targetField}</td>
                        <td className="py-3 px-4 font-mono font-bold text-rose-600">
                          {t.errorCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                          {t.sampleFailure}
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-emerald-700">{t.remediation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PERFORMANCE BOTTLENECKS */}
          {activeReportTab === 'BOTTLENECKS' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-3 p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-600" />
                    Simulated Infrastructure &amp; Cluster Bottleneck Analysis
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Memory footprint, network bandwidth throughput, and worker node scaling analysis for {activePipeline.name}.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-xl border border-purple-200">
                  {report.recommendedWorkerNodes} Spark Worker Nodes
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.bottlenecks.map((b, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-slate-500" />
                        {b.resource}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          b.status === 'Optimal'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : b.status === 'Warning'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-slate-600 py-1">
                      <div>
                        Current: <span className="font-bold text-slate-900">{b.currentValue}</span>
                      </div>
                      <div>
                        Threshold: <span className="font-bold text-slate-500">{b.threshold}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600">{b.bottleneckRisk}</p>

                    <div className="p-2 bg-purple-50 rounded-lg border border-purple-100 text-purple-900 text-[11px] font-medium flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>{b.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: REMEDIATION ROADMAP */}
          {activeReportTab === 'REMEDIATION' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Automated Pre-Flight Remediation Strategy ({activePipeline.name})
                </h3>
                <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-200">
                  Ready for Production Cutover
                </span>
              </div>

              <div className="space-y-3">
                {report.remediationSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-slate-800 font-semibold">{step}</p>
                      <span className="text-[11px] text-slate-500 font-mono">Status: Auto-Applicable in Pre-flight Staging Layer</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incremental Fault-Tolerant Hot-Swap Recovery Engine (Styled to Match Dry-Run Anomaly Detection & Remediation Highlights Theme) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded-full border border-indigo-100">
                    Failover Cursor Engine
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold rounded-full border border-emerald-100 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-600 fill-current" />
                    Zero Redundant Re-execution
                  </span>
                </div>
                <h2 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-600" />
                  Fault-Tolerant Incremental Recovery Simulation (Hot-Swap Engine)
                </h2>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                  Demonstrate automated retry mechanisms targeting{' '}
                  <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    only failed or uncommitted records
                  </span>{' '}
                  without restarting full {activePipeline.shortName} migration jobs.
                </p>
              </div>

              <div className="shrink-0">
                {retryState === 'idle' && (
                  <button
                    id="sim-incremental-retry-btn"
                    onClick={handleIncrementalRetry}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <RefreshCw className="w-4 h-4 text-white" />
                    <span>Simulate Incremental Retry</span>
                  </button>
                )}

                {retryState !== 'idle' && retryState !== 'completed' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold font-mono">
                    <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span>Recovering Cursors... ({retryProgress}%)</span>
                  </div>
                )}

                {retryState === 'completed' && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold font-mono">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Recovery Completed (100%)
                    </span>
                    <button
                      onClick={handleResetRetry}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer transition-all active:scale-95"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recovery State Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-600 text-[11px] font-semibold flex items-center justify-between">
                  <span>Committed Records</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-xl font-black text-emerald-600 font-mono">
                  {retrySuccessCount.toLocaleString()}
                </div>
                <div className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] inline-block">
                  98.5% Base Migrated
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-600 text-[11px] font-semibold flex items-center justify-between">
                  <span>Validation Failures</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-xl font-black text-amber-600 font-mono">
                  {retryValidationErrorCount.toLocaleString()}
                </div>
                <div className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px] inline-block">
                  Formatting &amp; Nulls
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-600 text-[11px] font-semibold flex items-center justify-between">
                  <span>Endpoint Exceptions</span>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="text-xl font-black text-rose-600 font-mono">
                  {retryApiErrorCount.toLocaleString()}
                </div>
                <div className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px] inline-block">
                  Rate Limits &amp; Timeouts
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-600 text-[11px] font-semibold flex items-center justify-between">
                  <span>Quarantined Staging</span>
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div className="text-xl font-black text-purple-600 font-mono">
                  {quarantinedCount.toLocaleString()}
                </div>
                <div className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[10px] inline-block">
                  Non-blocking Noise
                </div>
              </div>
            </div>

            {/* Active Recovery Highlights Cards Styled in Anomaly Highlights Theme */}
            <div className="space-y-3 text-xs pt-1">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Validation Error Hot-Fix Remediation
                  </span>
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 text-[11px]">
                    Est. ~{retryValidationErrorCount > 160 ? retryValidationErrorCount.toLocaleString() : '12,210'} Records Targeted
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Hot-apply pre-flight regex validation formatters without aborting or restarting pipeline cursor position.
                </p>
                <div className="p-2.5 bg-indigo-50/80 rounded-lg border border-indigo-100 text-indigo-900 font-semibold flex items-center gap-2 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Recommended Fix: Apply auto-formatter rule (TAX_ID_REGEX_VALIDATE) and normalize country code defaults.</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    API Endpoint Rate Limit &amp; Connection Pool Backoff
                  </span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200 text-[11px]">
                    Est. ~{retryApiErrorCount > 10 ? retryApiErrorCount.toLocaleString() : '1,850'} Records Targeted
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Scale target connection pool to 128 threads and engage adaptive jitter backoff on HTTP 429 and connection timeout responses.
                </p>
                <div className="p-2.5 bg-indigo-50/80 rounded-lg border border-indigo-100 text-indigo-900 font-semibold flex items-center gap-2 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Recommended Fix: Calibrate target DB connection pool &amp; activate exponential retry backoff.</span>
                </div>
              </div>
            </div>

            {/* Interactive Logging Console (Clean Light Theme) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] space-y-2">
              <div className="flex items-center justify-between text-slate-500 border-b border-slate-200 pb-2 text-[10px]">
                <span className="flex items-center gap-1.5 uppercase font-bold text-slate-700">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  Incremental Retry Stream Terminal Logs
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Telemetry
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 max-h-32 overflow-y-auto space-y-1.5 text-[11px] leading-relaxed">
                {retryLog.map((logLine, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-slate-400 shrink-0 select-none font-mono">
                      [{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                    </span>
                    <span
                      className={
                        logLine.startsWith('✔️')
                          ? 'text-emerald-700 font-semibold'
                          : logLine.startsWith('⚠️')
                          ? 'text-amber-700 font-semibold'
                          : logLine.startsWith('🎉')
                          ? 'text-indigo-700 font-bold'
                          : 'text-slate-700'
                      }
                    >
                      {logLine}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sample Target Payload Preview - Dynamically tailored to active pipeline */}
          <div className="bg-white text-slate-800 rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                Dry-Run Sample Payload Transformation (Pre-flight Output: {activePipeline.shortName})
              </span>
              <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100">100% Coercion Passed</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-indigo-800 block uppercase font-black tracking-wider">
                  {activePipeline.rawSourceLabel}
                </span>
                <pre className="text-indigo-950 overflow-x-auto text-[11px] leading-relaxed font-semibold max-h-56">
                  {JSON.stringify(activePipeline.rawSourceSample, null, 2)}
                </pre>
              </div>

              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
                <span className="text-[10px] text-emerald-800 block uppercase font-black tracking-wider">
                  {activePipeline.simulatedTargetLabel}
                </span>
                <pre className="text-emerald-950 overflow-x-auto text-[11px] leading-relaxed font-semibold max-h-56">
                  {JSON.stringify(activePipeline.simulatedTargetPayload, null, 2)}
                </pre>
              </div>
            </div>

            {/* Commit Button Footer */}
            <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-xs text-slate-500 font-medium max-w-md">
                Dry-run results verified with 0 destructive write locks on production target database.
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPdf}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer hover:shadow-2xs active:scale-95 w-full sm:w-auto text-center whitespace-nowrap"
                >
                  <FileDown className="w-4 h-4 text-indigo-600" />
                  <span>Download PDF Impact Analysis</span>
                </button>

                <button
                  id="sim-commit-full-run-btn"
                  onClick={onCommitFullMigration}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer w-full sm:w-auto text-center"
                >
                  <Zap className="w-4 h-4 fill-current text-amber-300" />
                  <span>Commit &amp; Launch Production</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {pdfDownloadedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl border border-indigo-500 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-mono">{pdfDownloadedToast}</div>
        </div>
      )}
    </div>
  );
};
