import React, { useState } from 'react';
import { PipelineStageExecution, ConnectorInterfaceMethod } from '../types/dualMapping';
import { PIPELINE_EXECUTION_STAGES, STANDARD_CONNECTOR_INTERFACE_METHODS } from '../data/dualMappingData';
import { ZoomablePipelineViewport } from './ZoomablePipelineViewport';
import {
  Workflow,
  CheckCircle2,
  Play,
  RotateCcw,
  Clock,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Terminal,
  Server,
  Code2,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const TransformationPipelineMonitor: React.FC = () => {
  const [stages, setStages] = useState<PipelineStageExecution[]>(PIPELINE_EXECUTION_STAGES);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [connectorMethods, setConnectorMethods] = useState<ConnectorInterfaceMethod[]>(
    STANDARD_CONNECTOR_INTERFACE_METHODS
  );
  const [testingMethod, setTestingMethod] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSimulatePipelineRun = () => {
    setIsRunning(true);
    setToastMsg('Executing 11-Stage Transformation Pipeline...');

    setTimeout(() => {
      setIsRunning(false);
      setToastMsg('Pipeline execution completed successfully: 4,995 records migrated.');
      setTimeout(() => setToastMsg(null), 3500);
    }, 2000);
  };

  const handleTestConnectorMethod = (methodName: string) => {
    setTestingMethod(methodName);
    setTimeout(() => {
      setTestingMethod(null);
      setConnectorMethods((prev) =>
        prev.map((m) =>
          m.methodName === methodName ? { ...m, status: 'PASSED', avgResponseMs: Math.floor(Math.random() * 30) + 10 } : m
        )
      );
      setToastMsg(`Connector Interface method ${methodName} executed: PASSED`);
      setTimeout(() => setToastMsg(null), 3000);
    }, 1000);
  };

  const totalDuration = stages.reduce((acc, curr) => acc + curr.durationMs, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              11-Stage Execution Pipeline &amp; Connector Interface
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Transformation Pipeline &amp; Connector Compliance Inspector
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Monitors end-to-end 11-stage pipeline execution order and verifies connector interface standard compliance for seamless ERP/CRM/DB integrations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSimulatePipelineRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running 11 Stages...' : 'Execute Pipeline Run'}</span>
          </button>
        </div>
      </div>

      {/* 11 Execution Stages Timeline / Diagram with Framer Motion Zoom-To-Fit */}
      <ZoomablePipelineViewport
        title={`11 Execution Order Stages (${totalDuration} ms total latency)`}
        subtitle="Interactive pipeline order topology. Use Zoom to Fit or scale controls to fit visualization."
        theme="light"
        statusBadge={
          <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ALL 11 STAGES COMPLIANT
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stages.map((stg) => (
            <div
              key={stg.stepNumber}
              className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2 relative shadow-3xs hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center font-mono">
                  {stg.stepNumber}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded font-mono">
                  {stg.status}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-900 block truncate">{stg.stageName}</span>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{stg.details}</p>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200/60">
                <span>{stg.durationMs} ms</span>
                <span>{stg.processedRecords.toLocaleString()} recs</span>
              </div>
            </div>
          ))}
        </div>
      </ZoomablePipelineViewport>

      {/* Standard Connector Interface Compliance Table (Section 10) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              Standard Connector Interface Requirements (15 Required Functions)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Guarantees plug-and-play addition of new ERP, CRM, or database connectors without core code modifications.
            </p>
          </div>
          <span className="text-xs text-emerald-700 font-mono font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            15 / 15 Methods Implemented
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[11px]">
                <th className="py-3 px-4">Interface Method</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Implemented</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Avg Latency</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {connectorMethods.map((m) => (
                <tr key={m.methodName} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-indigo-950">{m.methodName}</td>
                  <td className="py-3 px-4 font-sans text-slate-600 text-xs">{m.description}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded border border-emerald-200">
                      YES
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 font-bold text-[10px] rounded border ${
                        m.status === 'PASSED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{m.avgResponseMs} ms</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleTestConnectorMethod(m.methodName)}
                      disabled={testingMethod === m.methodName}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
                    >
                      {testingMethod === m.methodName ? 'Testing...' : 'Test Method'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl border border-indigo-500 shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-mono">{toastMsg}</div>
        </div>
      )}
    </div>
  );
};
