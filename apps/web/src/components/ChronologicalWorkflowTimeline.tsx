import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Node, Edge } from '@xyflow/react';
import {
  Clock,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Cpu,
  ChevronDown,
  ChevronUp,
  Settings,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  Check,
} from 'lucide-react';

interface CustomNodeData extends Record<string, unknown> {
  label: string;
  category: 'source' | 'transform' | 'validation' | 'cleansing' | 'sink';
  system: string;
  recordsCount?: number;
  status: 'idle' | 'running' | 'success' | 'error' | 'warning';
  config?: Record<string, any>;
  iconType?: string;
  description?: string;
  errorRate?: number;
}

interface ChronologicalWorkflowTimelineProps {
  nodes: Node<CustomNodeData>[];
  edges: Edge[];
  isSimulating: boolean;
  onRunSimulation: () => void;
  onResetCanvas: () => void;
}

interface AISequenceReport {
  success: boolean;
  isCorrectSequence: boolean;
  gapsFound: string[];
  optimizations: Array<{
    title: string;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
  }>;
  verdict: string;
  aiGenerated: boolean;
}

export const ChronologicalWorkflowTimeline: React.FC<ChronologicalWorkflowTimelineProps> = ({
  nodes,
  edges,
  isSimulating,
  onRunSimulation,
  onResetCanvas,
}) => {
  // Navigation / Tab state for the timeline section
  const [activeTab, setActiveTab] = useState<'timeline' | 'audit'>('timeline');
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  // AI Sequence Analysis State
  const [aiReport, setAiReport] = useState<AISequenceReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Topological / Level-based Sequence Sorter
  const getSortedSteps = () => {
    const nodeLevels: Record<string, number> = {};

    // First assign default hierarchy levels based on category as a base
    nodes.forEach((node) => {
      if (node.data.category === 'source') nodeLevels[node.id] = 0;
      else if (node.data.category === 'cleansing') nodeLevels[node.id] = 1;
      else if (node.data.category === 'validation') nodeLevels[node.id] = 2;
      else if (node.data.category === 'transform') nodeLevels[node.id] = 3;
      else if (node.data.category === 'sink') nodeLevels[node.id] = 4;
      else nodeLevels[node.id] = 2;
    });

    // Run simple iterative constraint updates to reflect edges direction
    for (let i = 0; i < 3; i++) {
      edges.forEach((edge) => {
        const srcLevel = nodeLevels[edge.source];
        const tgtLevel = nodeLevels[edge.target];
        if (srcLevel !== undefined && tgtLevel !== undefined) {
          if (tgtLevel <= srcLevel) {
            nodeLevels[edge.target] = srcLevel + 1;
          }
        }
      });
    }

    // Return the sorted steps
    return nodes
      .map((node, index) => {
        const level = nodeLevels[node.id] ?? 2;
        return {
          node,
          level,
          id: node.id,
          label: node.data.label,
          category: node.data.category,
          system: node.data.system,
          status: node.data.status,
          recordsCount: node.data.recordsCount || 0,
          description: node.data.description || 'No description provided.',
          config: node.data.config || {},
          errorRate: node.data.errorRate || 0,
        };
      })
      .sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.label.localeCompare(b.label);
      });
  };

  const steps = getSortedSteps();

  // Trigger Gemini-powered sequence correctness audit
  const handleTriggerAudit = async () => {
    setIsAnalyzing(true);
    setAuditError(null);
    setAiReport(null);

    const serializedSteps = steps.map((s) => ({
      id: s.id,
      label: s.label,
      category: s.category,
      system: s.system,
      description: s.description,
    }));

    try {
      const response = await fetch('/api/ai/analyze-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: serializedSteps }),
      });

      if (!response.ok) {
        throw new Error('Chronological Workflow Integrity Audit API failed');
      }

      const data: AISequenceReport = await response.json();
      setAiReport(data);
    } catch (err: any) {
      console.error(err);
      setAuditError(err.message || 'Failed to complete visual timeline audit sequence.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'source':
        return 'text-indigo-700 bg-indigo-50 border-indigo-100';
      case 'cleansing':
        return 'text-cyan-700 bg-cyan-50 border-cyan-100';
      case 'validation':
        return 'text-amber-700 bg-amber-50 border-amber-100';
      case 'transform':
        return 'text-purple-700 bg-purple-50 border-purple-100';
      case 'sink':
        return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-slate-200 block" />;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedStepId(expandedStepId === id ? null : id);
  };

  return (
    <div
      id="chronological-workflow-timeline-panel"
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6"
    >
      {/* Panel Title & Dynamic Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Workflow Chronological Execution Timeline
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Visual sequence showing the topological order of pipeline tasks. Tracks live dataflow propagation sequentially.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 self-start md:self-center shadow-2xs">
          <button
            type="button"
            id="tab-timeline-view"
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Chronological Steps
          </button>
          <button
            type="button"
            id="tab-audit-report"
            onClick={() => {
              setActiveTab('audit');
              if (!aiReport && !isAnalyzing) {
                handleTriggerAudit();
              }
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            AI Sequence Audit
          </button>
        </div>
      </div>

      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Active Workflow Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-500">Sequence status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border uppercase ${
                  isSimulating
                    ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {isSimulating ? 'Active Ingest Pipeline Running' : 'Idle / Dry-Run Calibrated'}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                id="btn-timeline-simulation-trigger"
                onClick={onRunSimulation}
                disabled={isSimulating}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-indigo-600/10"
              >
                {isSimulating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isSimulating ? 'Processing...' : 'Run Simulation'}</span>
              </button>
              <button
                type="button"
                id="btn-timeline-reset"
                onClick={onResetCanvas}
                className="p-1.5 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-xl cursor-pointer transition-all shadow-2xs"
                title="Reset simulation parameters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stepper Timeline Visualizer */}
          <div className="relative pl-6 md:pl-8 border-l border-slate-100 space-y-6 ml-3 md:ml-4 py-2">
            {steps.map((step, idx) => {
              const isExpanded = expandedStepId === step.id;

              // Compute an estimated start offset based on sequence index
              const startOffset = (idx * 1.2).toFixed(1);
              const duration = step.category === 'source' ? 2.2 : step.category === 'sink' ? 1.8 : 1.4;

              return (
                <div key={step.id} className="relative group">
                  {/* Circle Node Marker */}
                  <div
                    className={`absolute -left-[35px] md:-left-[43px] top-1.5 w-6 h-6 rounded-full border flex items-center justify-center transition-all shadow-2xs ${
                      step.status === 'running'
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 scale-110 z-10'
                        : step.status === 'success'
                        ? 'bg-emerald-50 border-emerald-400'
                        : step.status === 'error'
                        ? 'bg-rose-50 border-rose-400'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold font-mono text-slate-500">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Step Card Content */}
                  <div className="bg-slate-50/50 hover:bg-white rounded-xl border border-slate-100 hover:border-slate-200 p-4 transition-all duration-300 space-y-3 shadow-2xs hover:shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getCategoryColor(
                              step.category
                            )}`}
                          >
                            {step.category}
                          </span>
                          <span className="text-slate-400 text-[10px] font-mono">
                            Offset: T +{startOffset}s
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                          {step.label}
                          <span className="text-[10px] text-slate-400 font-mono">({step.system})</span>
                        </h4>
                      </div>

                      {/* Right Status Panel */}
                      <div className="flex items-center gap-3 self-start sm:self-center">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(step.status)}
                          <span className="text-[10px] text-slate-500 font-mono capitalize">
                            {step.status}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleExpand(step.id)}
                          className="p-1 rounded bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Records Processed:</span>
                        <strong className="text-slate-700">
                          {step.recordsCount.toLocaleString()} / 250,000 (
                          {((step.recordsCount / 250000) * 100).toFixed(0)}%)
                        </strong>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/40 shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            step.status === 'success'
                              ? 'bg-indigo-600'
                              : step.status === 'running'
                              ? 'bg-amber-500 animate-pulse'
                              : step.status === 'error'
                              ? 'bg-rose-500'
                              : 'bg-slate-300'
                          }`}
                          style={{ width: `${(step.recordsCount / 250000) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Expandable inspector block */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden border-t border-slate-100 pt-3 mt-3 space-y-3"
                        >
                          <div className="text-slate-600 text-xs leading-relaxed">
                            <span className="font-bold text-slate-900 block mb-1">Functional Description:</span>
                            {step.description}
                          </div>

                          {/* Static Metrics Block inside details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-mono text-slate-500">
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                              <span className="text-slate-400 block">Est Duration:</span>
                              <strong className="text-slate-700">{duration}s</strong>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                              <span className="text-slate-400 block">System Type:</span>
                              <strong className="text-slate-700 capitalize">{step.category} Node</strong>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                              <span className="text-slate-400 block">Thread Buffer:</span>
                              <strong className="text-slate-700">
                                {step.config.parallelThreads || step.config.threads || 4} Cores
                              </strong>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                              <span className="text-slate-400 block">Batch Window:</span>
                              <strong className="text-slate-700">
                                {step.config.batchSize || step.config.batchIngestRate || '5,000'} rows
                              </strong>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Header Action card */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold">
                  <Sparkles className="w-3 h-3" />
                  Gemini Validation Copilot
                </span>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Topological Ordering Integrity Scanner
                </h4>
                <p className="text-xs text-slate-500">
                  Runs logical trace diagnostics across active source tables, transforms, validations, and sinks to isolate mapping flaws.
                </p>
              </div>

              <button
                type="button"
                id="btn-re-audit-sequence"
                onClick={handleTriggerAudit}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Auditing DAG...' : 'Trigger Integrity Scan'}</span>
              </button>
            </div>

            {auditError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>{auditError}</span>
              </div>
            )}
          </div>

          {/* Loader */}
          {isAnalyzing && (
            <div className="py-12 text-center space-y-3 bg-slate-50 rounded-xl border border-slate-100 shadow-2xs">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
              <span className="text-xs font-mono text-slate-500 block animate-pulse">
                Interrogating pipeline dependency matrix schema constraints...
              </span>
            </div>
          )}

          {/* AI Report Card */}
          {!isAnalyzing && aiReport && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Verdict Header banner */}
              <div
                className={`p-5 rounded-xl border flex items-start gap-3.5 shadow-sm ${
                  aiReport.isCorrectSequence
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}
              >
                <div className="p-2 rounded-xl bg-white border border-slate-100 shrink-0 shadow-2xs">
                  {aiReport.isCorrectSequence ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-extrabold uppercase bg-white/50 px-2 py-0.5 rounded border border-white/80">
                    Structural Safety Verification
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {aiReport.isCorrectSequence
                      ? 'Topological Integrity Calibrated'
                      : 'Integrity Warnings Flagged'}
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {aiReport.verdict}
                  </p>
                </div>
              </div>

              {/* Warnings and optimizations list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Critical gaps/critiques */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Detected Order Gaps &amp; Concerns ({aiReport.gapsFound.length})
                  </h5>

                  {aiReport.gapsFound.length === 0 ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Zero sequence connection gaps found. Flow directions are structurally sound.</span>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs text-slate-600 leading-relaxed pl-1">
                      {aiReport.gapsFound.map((gap, i) => (
                        <div key={i} className="flex gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-rose-600 font-bold font-mono">!</span>
                          <span>{gap}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Optimizations recommendations */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    AI Architect Optimization Insights ({aiReport.optimizations.length})
                  </h5>

                  <div className="space-y-3.5">
                    {aiReport.optimizations.map((opt, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{opt.title}</span>
                          <span
                            className={`px-2 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${
                              opt.impact === 'High'
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : opt.impact === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {opt.impact} Impact
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
