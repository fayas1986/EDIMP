import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRightLeft, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Play, 
  Pause, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Search, 
  SlidersHorizontal,
  ArrowRight,
  Database,
  CloudLightning,
  Check,
  FileText,
  AlertOctagon,
  TrendingUp,
  Download,
  Info
} from 'lucide-react';
import { OverflowTableWrapper } from './OverflowTableWrapper';

export interface ReconciliationRow {
  id: string;
  integration: string;
  entity: string;
  sourceSystem: string;
  targetSystem: string;
  sourceCount: number;
  targetCount: number;
  migratedCount: number;
  matchedCount: number;
  exceptions: number;
  status: 'Synced' | 'Mismatch' | 'Processing';
  lastChecked: string;
  mismatchType?: 'Orphaned Records' | 'Schema Drift' | 'Foreign Key Violation' | 'Duplicate Keys';
  autoPlaybook?: string;
}

const INITIAL_RECONCILIATION_DATA: ReconciliationRow[] = [
  {
    id: 'rec-01',
    integration: 'SAP S/4HANA → Business Central',
    entity: 'Customer Master Accounts',
    sourceSystem: 'SAP S/4HANA',
    targetSystem: 'D365 Business Central',
    sourceCount: 125420,
    targetCount: 125414,
    migratedCount: 125414,
    matchedCount: 125414,
    exceptions: 6,
    status: 'Mismatch',
    lastChecked: 'Just now',
    mismatchType: 'Orphaned Records',
    autoPlaybook: 'Cascade Delta Backfill'
  },
  {
    id: 'rec-02',
    integration: 'Salesforce Enterprise CRM → Snowflake Warehouse',
    entity: 'Leads & Opportunities',
    sourceSystem: 'Salesforce CRM',
    targetSystem: 'Snowflake Core',
    sourceCount: 2450912,
    targetCount: 2450890,
    migratedCount: 2450890,
    matchedCount: 2450890,
    exceptions: 22,
    status: 'Mismatch',
    lastChecked: '2 mins ago',
    mismatchType: 'Foreign Key Violation',
    autoPlaybook: 'Referential Integrity Repair'
  },
  {
    id: 'rec-03',
    integration: 'Stripe Finance → NetSuite SuiteGL',
    entity: 'General Ledger Transactions',
    sourceSystem: 'Stripe API',
    targetSystem: 'NetSuite ERP',
    sourceCount: 891244,
    targetCount: 891244,
    migratedCount: 891244,
    matchedCount: 891244,
    exceptions: 0,
    status: 'Synced',
    lastChecked: '5 mins ago'
  },
  {
    id: 'rec-04',
    integration: 'Shopify Checkout → ERP Dynamics 365',
    entity: 'Sales Orders',
    sourceSystem: 'Shopify Store',
    targetSystem: 'D365 F&O',
    sourceCount: 450231,
    targetCount: 450120,
    migratedCount: 450120,
    matchedCount: 450120,
    exceptions: 111,
    status: 'Mismatch',
    lastChecked: 'Just now',
    mismatchType: 'Schema Drift',
    autoPlaybook: 'Align Fields & Reparse'
  },
  {
    id: 'rec-05',
    integration: 'Workday HR → Active Directory Provisioner',
    entity: 'Employee Profiles',
    sourceSystem: 'Workday API',
    targetSystem: 'Active Directory',
    sourceCount: 14050,
    targetCount: 14050,
    migratedCount: 14050,
    matchedCount: 14050,
    exceptions: 0,
    status: 'Synced',
    lastChecked: '12 mins ago'
  },
  {
    id: 'rec-06',
    integration: 'PostgreSQL Legacy DB → Kafka Event Stream',
    entity: 'Customer Loyalty Events',
    sourceSystem: 'PostgreSQL Server',
    targetSystem: 'Apache Kafka',
    sourceCount: 1205933,
    targetCount: 1205933,
    migratedCount: 1205933,
    matchedCount: 1205933,
    exceptions: 0,
    status: 'Synced',
    lastChecked: '1 hour ago'
  }
];

export const ReconciliationView: React.FC = () => {
  const [data, setData] = useState<ReconciliationRow[]>(INITIAL_RECONCILIATION_DATA);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Mismatch' | 'Synced'>('All');
  const [expandedRowId, setExpandedRowId] = useState<string | null>('rec-01');
  const [isResolving, setIsResolving] = useState<string | null>(null);
  const [resolutionStep, setResolutionStep] = useState<number>(0);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Live simulation background loop
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setData(prev => prev.map(row => {
        // Occasionally increment source count representing incoming new live entries
        const isIncrementing = Math.random() > 0.75;
        if (!isIncrementing) return row;

        const incrementAmount = Math.floor(Math.random() * 8) + 1;
        const newSource = row.sourceCount + incrementAmount;
        
        // If it was already a synced row, let's keep target in sync or cause a small realistic mismatch
        if (row.status === 'Synced') {
          const createMismatch = Math.random() > 0.85;
          if (createMismatch) {
            const missedCount = Math.floor(Math.random() * 3) + 1;
            return {
              ...row,
              sourceCount: newSource,
              targetCount: newSource - missedCount,
              migratedCount: newSource - missedCount,
              matchedCount: newSource - missedCount,
              exceptions: missedCount,
              status: 'Mismatch',
              lastChecked: 'Just now',
              mismatchType: 'Orphaned Records',
              autoPlaybook: 'Cascade Delta Backfill'
            };
          } else {
            return {
              ...row,
              sourceCount: newSource,
              targetCount: newSource,
              migratedCount: newSource,
              matchedCount: newSource,
              lastChecked: 'Just now'
            };
          }
        } else {
          // Keep mismatch status, just tick source up
          return {
            ...row,
            sourceCount: newSource,
            exceptions: row.exceptions + incrementAmount,
            lastChecked: 'Just now'
          };
        }
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Handle Playbook Action Execution Simulation
  const executePlaybook = (rowId: string, playbook: string) => {
    setIsResolving(rowId);
    setResolutionStep(1);

    // Timeline simulator
    setTimeout(() => setResolutionStep(2), 1200);
    setTimeout(() => setResolutionStep(3), 2400);
    setTimeout(() => {
      // Completed, align row counts perfectly
      setData(prev => prev.map(row => {
        if (row.id === rowId) {
          return {
            ...row,
            targetCount: row.sourceCount,
            migratedCount: row.sourceCount,
            matchedCount: row.sourceCount,
            exceptions: 0,
            status: 'Synced',
            lastChecked: 'Just now',
            mismatchType: undefined,
            autoPlaybook: undefined
          };
        }
        return row;
      }));
      setIsResolving(null);
      setResolutionStep(0);
      setSuccessToast(`Successfully executed ${playbook}! 100% data alignment achieved.`);
      setTimeout(() => setSuccessToast(null), 4000);
    }, 3800);
  };

  const handleManualRefresh = () => {
    setData(prev => prev.map(row => ({
      ...row,
      lastChecked: 'Just now'
    })));
    setSuccessToast("Reconciliation scan re-triggered. All endpoints validated.");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Filter logic
  const filteredData = data.filter(row => {
    const matchesSearch = row.integration.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          row.entity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate high-level summary metrics
  const totalSourceRecords = data.reduce((sum, r) => sum + r.sourceCount, 0);
  const totalTargetRecords = data.reduce((sum, r) => sum + r.targetCount, 0);
  const totalExceptions = data.reduce((sum, r) => sum + r.exceptions, 0);
  const overallMatchRate = totalSourceRecords > 0 
    ? ((totalTargetRecords / totalSourceRecords) * 100).toFixed(4)
    : '100.0000';

  return (
    <div id="reconciliation-view-root" className="space-y-6 text-slate-800 animate-in fade-in duration-300">
      {/* Toast Alert */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-4 bg-white text-slate-900 px-6 py-4 rounded-3xl shadow-3xl border border-emerald-100 font-sans"
          >
            <div className="p-2 bg-emerald-50 rounded-2xl shadow-3xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-900">Operation Success</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{successToast}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-50 text-indigo-600 rounded-2xl border border-slate-100 shadow-3xs">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              Real-Time Reconciliation Engine
              <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] border border-indigo-100 tracking-widest">v4.5</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight max-w-md leading-relaxed">Cross-checks transactional parity between origin records and destination systems with adaptive resolution playbooks.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stream Play/Pause Control */}
          <button
            type="button"
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-widest flex items-center gap-2.5 transition-all cursor-pointer shadow-3xs ${
              isLive 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/70' 
                : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
            }`}
          >
            {isLive ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>Live Stream On</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-slate-400" />
                <span>Stream Paused</span>
              </>
            )}
          </button>

          {/* Trigger Scan Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-slate-200/50 transition-all flex items-center gap-2 cursor-pointer group"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-300 group-hover:rotate-180 transition-transform duration-500" />
            <span>Scan Endpoints</span>
          </button>
        </div>
      </div>

      {/* Statistical Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric Card 1: Match Rate */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-3xs relative overflow-hidden group hover:border-emerald-100 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Match Rate</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-3xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter font-mono">{overallMatchRate}%</div>
          <div className="w-full h-2 bg-slate-50 rounded-full mt-5 overflow-hidden shadow-inner shadow-slate-100">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
              style={{ width: `${overallMatchRate}%` }}
            ></div>
          </div>
        </div>

        {/* Metric Card 2: Total Source Records */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-3xs relative overflow-hidden group hover:border-indigo-100 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Records Scanned</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-3xs">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter font-mono">
            {totalSourceRecords.toLocaleString()}
          </div>
          <div className="text-[10px] font-black text-emerald-600 mt-3 flex items-center gap-1.5 uppercase tracking-widest">
            <TrendingUp className="w-3.5 h-3.5" /> +1,240 events / sec
          </div>
        </div>

        {/* Metric Card 3: Target Discrepancies */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-3xs relative overflow-hidden group hover:border-rose-100 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Discrepancies</span>
            <div className="p-2 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 shadow-3xs animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 tracking-tighter font-mono">
            {totalExceptions.toLocaleString()}
          </div>
          <p className="text-[10px] font-black text-slate-400 mt-3 uppercase tracking-widest">Pending resolution queues</p>
        </div>

        {/* Metric Card 4: Network Latency */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-3xs relative overflow-hidden group hover:border-cyan-100 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sync API Latency</span>
            <div className="p-2 bg-cyan-50 text-cyan-500 rounded-xl border border-cyan-100 shadow-3xs">
              <CloudLightning className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter font-mono">14.2ms</div>
          <p className="text-[10px] font-black text-slate-400 mt-3 uppercase tracking-widest">Avg write confirmation response</p>
        </div>
      </div>

      {/* Main Table + Suggestion Filter Controls */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs overflow-hidden">
        {/* Filter bar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-3xs w-full md:w-96 group focus-within:border-indigo-200 transition-colors">
            <Search className="w-4.5 h-4.5 text-slate-400 shrink-0 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search integration or entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-hidden w-full font-black text-[10px] uppercase tracking-widest text-slate-900 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-300" />
              <span>Status Filter:</span>
            </span>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner shadow-slate-200">
              {(['All', 'Mismatch', 'Synced'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-4 py-1.5 font-black text-[9px] uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                    statusFilter === tab 
                      ? 'bg-white text-slate-900 shadow-3xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time comparison table */}
        <OverflowTableWrapper hintLabel="Scroll horizontally to view full parity comparisons" theme="light">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
                <th className="p-5 w-14"></th>
                <th className="p-5">Integration Workflow</th>
                <th className="p-5">Entity</th>
                <th className="p-5 text-right">Source Count</th>
                <th className="p-5 text-right">Target Count</th>
                <th className="p-5 text-right">Delta (Mismatch)</th>
                <th className="p-5 text-right">Match Rate</th>
                <th className="p-5 text-center">Engine Parity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[11px] font-mono">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-slate-400 font-sans font-black uppercase tracking-widest text-[10px]">
                    No matching integrations or entities found in this snapshot.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const isExpanded = expandedRowId === row.id;
                  const delta = row.sourceCount - row.targetCount;
                  const accuracy = row.sourceCount > 0 
                    ? ((row.targetCount / row.sourceCount) * 100).toFixed(2)
                    : '100.00';
                  
                  return (
                    <React.Fragment key={row.id}>
                      <tr 
                        className={`transition-colors cursor-pointer group ${
                          isExpanded 
                            ? 'bg-indigo-50/30' 
                            : row.status === 'Mismatch' 
                              ? 'hover:bg-rose-50/20 bg-rose-50/10' 
                              : 'hover:bg-slate-50/50'
                        }`}
                        onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                      >
                        {/* Expand Trigger Arrow */}
                        <td className="p-5 text-center">
                          {isExpanded ? (
                            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg shadow-3xs group-hover:scale-110 transition-transform">
                              <ChevronUp className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="p-1.5 bg-slate-50 text-slate-400 group-hover:text-indigo-500 rounded-lg group-hover:scale-110 transition-transform">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          )}
                        </td>

                        {/* Integration Name */}
                        <td className="p-5 font-sans">
                          <div className="font-black text-slate-900 tracking-tight uppercase text-[11px] tracking-widest">{row.integration}</div>
                          <div className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">{row.sourceSystem} &rarr; {row.targetSystem}</div>
                        </td>

                        {/* Entity */}
                        <td className="p-5 font-sans">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full shadow-3xs ${
                              row.status === 'Synced' 
                                ? 'bg-emerald-500' 
                                : row.status === 'Mismatch' 
                                  ? 'bg-amber-500 animate-pulse' 
                                  : 'bg-indigo-500 animate-pulse'
                            }`}></span>
                            <span className="font-black text-slate-900 uppercase tracking-widest text-[10px]">{row.entity}</span>
                          </div>
                        </td>

                        {/* Source count */}
                        <td className="p-5 text-right text-slate-500 font-bold whitespace-nowrap">{row.sourceCount.toLocaleString()}</td>

                        {/* Target count */}
                        <td className="p-5 text-right text-slate-500 font-bold whitespace-nowrap">{row.targetCount.toLocaleString()}</td>

                        {/* Delta Count */}
                        <td className={`p-5 text-right font-black whitespace-nowrap tracking-tight ${delta > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {delta > 0 ? `-${delta.toLocaleString()}` : '0'}
                        </td>

                        {/* Match Rate Progress Bar */}
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0 shadow-inner shadow-slate-100">
                              <div 
                                className={`h-full rounded-full transition-all duration-700 ${
                                  row.status === 'Synced' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${accuracy}%` }}
                              ></div>
                            </div>
                            <span className={`font-black text-[10px] tracking-widest ${row.status === 'Synced' ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {accuracy}%
                            </span>
                          </div>
                        </td>

                        {/* Engine Status pill */}
                        <td className="p-5 text-center">
                          <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border font-sans inline-block shadow-3xs ${
                            row.status === 'Synced'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
                          }`}>
                            {row.status === 'Synced' ? 'PARITY OK' : 'MISMATCH'}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Suggestion Panel with Automated Resolution Suggestions */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-0 border-t-0 bg-slate-50/20">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: "circOut" }}
                                className="overflow-hidden"
                              >
                                <div className="px-12 py-8 border-l-8 border-indigo-600 bg-white/50 font-sans space-y-6">
                                  {row.status === 'Mismatch' ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                      {/* Left block: Forensic Diagnosis */}
                                      <div className="lg:col-span-1 space-y-4">
                                        <div className="flex items-center gap-2.5 text-rose-600 font-black text-[10px] uppercase tracking-widest">
                                          <AlertOctagon className="w-5 h-5 shrink-0" />
                                          <span>Forensic Drifts Diagnosis</span>
                                        </div>
                                        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-5 shadow-3xs">
                                          <div>
                                            <span className="text-[9px] text-slate-400 font-black block uppercase tracking-widest mb-1.5">Detected Drift Cause</span>
                                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{row.mismatchType || 'Orphaned Record Keys'}</span>
                                          </div>
                                          <div>
                                            <span className="text-[9px] text-slate-400 font-black block uppercase tracking-widest mb-1.5">Exceptions Logged</span>
                                            <span className="text-[10px] font-black text-rose-600 font-mono bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 uppercase tracking-widest shadow-3xs">
                                              {row.exceptions} transactional exceptions
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed max-w-xs">
                                            The data ingestion scheduler encountered asynchronous rate limiting, resulting in missing commits in target system endpoint.
                                          </p>
                                        </div>
                                      </div>

                                      {/* Middle & Right block: Resolution Suggestions & Playbooks */}
                                      <div className="lg:col-span-2 space-y-4">
                                        <div className="flex items-center gap-2.5 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                                          <Sparkles className="w-5 h-5 shrink-0" />
                                          <span>Automated Resolution Suggestions</span>
                                        </div>

                                        {isResolving === row.id ? (
                                          <div className="bg-white border border-indigo-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6 shadow-3xs min-h-[220px]">
                                            <div className="flex items-center gap-3">
                                              <span className="relative flex h-5 w-5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-5 w-5 bg-indigo-600"></span>
                                              </span>
                                              <span className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Executing Playbook: {row.autoPlaybook}</span>
                                            </div>

                                            {/* Resolution Steps timeline indicator */}
                                            <div className="flex items-center justify-center gap-6 w-full max-w-md">
                                              {[
                                                { step: 1, label: 'Isolate Diff' },
                                                { step: 2, label: 'Align Schema' },
                                                { step: 3, label: 'Backfill Commit' }
                                              ].map((item, idx) => (
                                                <React.Fragment key={item.step}>
                                                  <div className="flex flex-col items-center flex-1">
                                                    <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-[11px] font-black transition-all shadow-3xs ${
                                                      resolutionStep >= item.step ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                      {item.step}
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest mt-2 ${resolutionStep >= item.step ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                      {item.label}
                                                    </span>
                                                  </div>
                                                  {idx < 2 && (
                                                    <div className={`h-1 flex-1 rounded-full ${resolutionStep > item.step ? 'bg-indigo-600 shadow-3xs' : 'bg-slate-100 shadow-inner'}`} />
                                                  )}
                                                </React.Fragment>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            {/* Resolution Playbook Option 1 (Recommended Action) */}
                                            <div className="bg-indigo-50/50 border border-indigo-200/60 rounded-3xl p-6 flex flex-col justify-between hover:bg-white hover:shadow-lg hover:shadow-indigo-100 transition-all group">
                                              <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-indigo-950 font-black text-[11px] uppercase tracking-widest">
                                                  <Check className="w-5 h-5 text-indigo-600 shrink-0" />
                                                  <span>Run Playbook: {row.autoPlaybook}</span>
                                                </div>
                                                <p className="text-[10px] text-indigo-700/70 font-bold uppercase tracking-tight leading-relaxed">
                                                  Analyzes specific missed commits & performs safe direct delta inserts. Guaranteed to reach perfect parity.
                                                </p>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => executePlaybook(row.id, row.autoPlaybook || 'Cascade Delta Backfill')}
                                                className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                                              >
                                                <span>Auto-Repair Delta</span>
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                              </button>
                                            </div>

                                            {/* Resolution Option 2: Schema Align & Force Sync */}
                                            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg hover:shadow-slate-100 transition-all">
                                              <div className="space-y-3">
                                                <span className="text-slate-900 font-black text-[11px] uppercase tracking-widest block">Exempt Missing Records</span>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">
                                                  Marks these {row.exceptions} exceptions as authorized exclusions with compliance audit documentation.
                                                </p>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setData(prev => prev.map(r => r.id === row.id ? { ...r, status: 'Synced', exceptions: 0, targetCount: r.sourceCount } : r));
                                                  setSuccessToast(`Exceptions successfully exempted. Ingestion status marked as clean.`);
                                                  setTimeout(() => setSuccessToast(null), 3500);
                                                }}
                                                className="mt-6 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-3xs"
                                              >
                                                Exempt Exceptions
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    /* Synced State Row Detail View */
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 bg-white border border-slate-100 rounded-3xl shadow-3xs">
                                      <div className="flex items-center gap-5">
                                        <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100 shadow-3xs">
                                          <CheckCircle2 className="w-6 h-6 shrink-0" />
                                        </div>
                                        <div>
                                          <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">100% Data Integrity</h5>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1 max-w-xl">Parity confirmed. Source system and Destination ERP databases match down to the transaction metadata index.</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <button
                                          type="button"
                                          className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-3xs cursor-pointer flex items-center gap-2 transition-all"
                                          onClick={() => {
                                            setSuccessToast("Audit CSV generated successfully.");
                                            setTimeout(() => setSuccessToast(null), 3000);
                                          }}
                                        >
                                          <FileText className="w-4 h-4 text-slate-400" />
                                          <span>Log Audit Ledger</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </OverflowTableWrapper>

        {/* Informative Help Alert */}
        <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex items-start gap-4">
          <div className="p-2 bg-white rounded-xl shadow-3xs border border-slate-100">
            <Info className="w-5 h-5 text-indigo-500 shrink-0" />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed max-w-5xl">
            <strong className="text-slate-900 font-black">Operational Best Practice:</strong> Real-time reconciliation automatically highlights database drifts caused by network bottlenecks or schema mismatches. Use the <span className="font-black text-indigo-600 tracking-widest">Auto-Repair Delta</span> playbook to automatically recover missing commits without manual data mapping adjustments.
          </p>
        </div>
      </div>
    </div>
  );
};
