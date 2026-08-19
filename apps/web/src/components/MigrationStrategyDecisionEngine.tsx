import React, { useState } from 'react';
import { MigrationStrategyType } from '../types/dualMapping';
import { MATRIX_STRATEGY_DECISIONS } from '../data/dualMappingData';
import {
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Database,
  FileSpreadsheet,
  Building2,
  Settings2,
  Sliders,
  ShieldCheck,
  Workflow,
  RotateCcw,
  Layers,
  FileCode,
} from 'lucide-react';

interface MigrationStrategyDecisionEngineProps {
  currentStrategy: MigrationStrategyType;
  onStrategySelect: (strategy: MigrationStrategyType) => void;
}

export const MigrationStrategyDecisionEngine: React.FC<MigrationStrategyDecisionEngineProps> = ({
  currentStrategy,
  onStrategySelect,
}) => {
  const [selectedSource, setSelectedSource] = useState<string>('Microsoft Dynamics 365 F&O');
  const [selectedDestination, setSelectedDestination] = useState<string>('Dynamics 365 Business Central');
  const [manualOverride, setManualOverride] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Find matching strategy decision rule
  const matchedDecision = MATRIX_STRATEGY_DECISIONS.find(
    (d) =>
      d.sourceType.toLowerCase().includes(selectedSource.toLowerCase().split(' ')[0]) ||
      selectedSource.toLowerCase().includes(d.sourceType.toLowerCase().split(' ')[0])
  ) || {
    sourceType: selectedSource,
    destinationType: selectedDestination,
    recommendedStrategy: selectedSource.includes('Excel') || selectedSource.includes('CSV') || selectedSource.includes('DB')
      ? ('CanonicalDataModel' as const)
      : ('DirectMapping' as const),
    confidence: 0.95,
    rationale: 'Automatically determined based on metadata API availability and schema structure.',
  };

  const autoStrategy = matchedDecision.recommendedStrategy;
  const activeStrategy = manualOverride ? currentStrategy : autoStrategy;

  const handleApplyStrategy = () => {
    onStrategySelect(activeStrategy);
    setToastMsg(`Applied Migration Strategy: ${activeStrategy === 'DirectMapping' ? 'Direct Entity Mapping' : 'Canonical Data Model (CDM) Mapping'}`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Automated Strategy Selection Engine
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Workflow className="w-5 h-5 text-indigo-600" />
            Migration Strategy Engine &amp; Decision Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Automatically evaluates connected source and destination systems to determine whether Direct Entity Mapping or Canonical Data Model (CDM) intermediate mapping provides maximum accuracy and minimum maintenance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleApplyStrategy}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Selected Strategy</span>
          </button>
        </div>
      </div>

      {/* Decision Matrix Controls & Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source & Destination Selection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings2 className="w-4 h-4 text-indigo-600" />
            1. Migration Project Connectors
          </span>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Source System</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="Microsoft Dynamics 365 F&O">Microsoft Dynamics 365 F&O (ERP)</option>
                <option value="Microsoft Dynamics AX">Microsoft Dynamics AX (ERP)</option>
                <option value="Microsoft Dynamics NAV">Microsoft Dynamics NAV (ERP)</option>
                <option value="SAP S/4HANA">SAP S/4HANA (BAPI / ERP)</option>
                <option value="Oracle Fusion ERP">Oracle Fusion ERP</option>
                <option value="NetSuite ERP">NetSuite ERP</option>
                <option value="Excel / CSV File">Excel / CSV Flat File (Unstructured)</option>
                <option value="Legacy SQL Server DB">Legacy SQL Server DB (Database)</option>
                <option value="JSON / REST API">JSON Payload / REST API</option>
                <option value="Salesforce CRM">Salesforce CRM</option>
                <option value="Custom ERP">Custom ERP (Metadata API)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Destination System</label>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="Dynamics 365 Business Central">Dynamics 365 Business Central</option>
                <option value="Microsoft Dynamics 365 F&O">Microsoft Dynamics 365 F&O</option>
                <option value="SAP S/4HANA">SAP S/4HANA Cloud</option>
                <option value="Oracle Fusion ERP">Oracle Fusion ERP</option>
                <option value="PostgreSQL Lakehouse">PostgreSQL Lakehouse Database</option>
                <option value="Custom Application">Custom Application API</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-900 block flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                Connector Metadata Status
              </span>
              <p>Source Metadata API: <strong className="text-emerald-700 font-mono">EXPOSED &amp; ACCESSIBLE</strong></p>
              <p>Target Metadata API: <strong className="text-emerald-700 font-mono">CONNECTED (v2.0)</strong></p>
            </div>
          </div>
        </div>

        {/* Strategy Engine Recommendation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              2. Decision Matrix Output &amp; Recommendation
            </span>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-mono text-[10px] font-black border border-indigo-100">
              Accuracy: {Math.round(matchedDecision.confidence * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Direct Mapping Strategy Card */}
            <div
              onClick={() => {
                if (manualOverride) onStrategySelect('DirectMapping');
              }}
              className={`p-4 rounded-xl border transition-all ${
                activeStrategy === 'DirectMapping'
                  ? 'bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white border-slate-200 opacity-60'
              } ${manualOverride ? 'cursor-pointer hover:border-indigo-400' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${activeStrategy === 'DirectMapping' ? 'text-indigo-700' : 'text-slate-500'}`}>
                  <ArrowRight className={`w-3.5 h-3.5 ${activeStrategy === 'DirectMapping' ? 'text-indigo-500' : 'text-slate-400'}`} />
                  Direct Mapping
                </span>
                {activeStrategy === 'DirectMapping' && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-black rounded-full text-[9px] tracking-tighter">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium mb-3 leading-relaxed">
                Direct point-to-point field mapping between source and destination ERP metadata schemas.
              </p>
              <div className="text-[10px] font-mono space-y-1.5 text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-100">
                <div className="flex items-start gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>Metadata API Direct Reader</span>
                </div>
                <div className="flex items-start gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>Zero Translation Overhead</span>
                </div>
              </div>
            </div>

            {/* Canonical Data Model (CDM) Strategy Card */}
            <div
              onClick={() => {
                if (manualOverride) onStrategySelect('CanonicalDataModel');
              }}
              className={`p-4 rounded-xl border transition-all ${
                activeStrategy === 'CanonicalDataModel'
                  ? 'bg-purple-50/50 border-purple-200 ring-2 ring-purple-500/20 shadow-sm'
                  : 'bg-white border-slate-200 opacity-60'
              } ${manualOverride ? 'cursor-pointer hover:border-purple-400' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${activeStrategy === 'CanonicalDataModel' ? 'text-purple-700' : 'text-slate-500'}`}>
                  <Layers className={`w-3.5 h-3.5 ${activeStrategy === 'CanonicalDataModel' ? 'text-purple-500' : 'text-slate-400'}`} />
                  CDM Model
                </span>
                {activeStrategy === 'CanonicalDataModel' && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-black rounded-full text-[9px] tracking-tighter">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium mb-3 leading-relaxed">
                Normalizes source structures into standard ERP-independent business entities (CDM).
              </p>
              <div className="text-[10px] font-mono space-y-1.5 text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-100">
                <div className="flex items-start gap-1.5 text-purple-700 font-bold">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>Canonical Representation Layer</span>
                </div>
                <div className="flex items-start gap-1.5 text-purple-700 font-bold">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>Legacy/File Format Optimized</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rationale & Manual Override Option */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-mono">
              <strong className="text-indigo-600 block mb-1 uppercase tracking-widest text-[10px] font-black">Decision Rationale:</strong>
              <p className="text-slate-600 font-medium">{matchedDecision.rationale}</p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-bold">
                <input
                  type="checkbox"
                  checked={manualOverride}
                  onChange={(e) => setManualOverride(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <span>Enable Manual Strategy Override</span>
              </label>

              {manualOverride && (
                <span className="text-[10px] text-amber-600 font-black uppercase tracking-tight">
                  Simulator Active: Choose Card Above
                </span>
              )}
            </div>

            {manualOverride && (
              <input
                type="text"
                placeholder="Enter business reason for manual strategy override..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-3xs"
              />
            )}
          </div>
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
