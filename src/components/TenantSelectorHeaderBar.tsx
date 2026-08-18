import React, { useState, useEffect } from 'react';
import {
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Building2,
  Briefcase,
  FolderGit2,
  Globe,
  Search,
  X,
  Check,
  Activity,
  Key,
  Server,
  ArrowRight,
  Sliders,
  Sparkles
} from 'lucide-react';
import { tenantContextService } from '../services/tenantContextService';
import { TenantNode, HierarchyLevel } from '../types/tenantHierarchy';

export const TenantSelectorHeaderBar: React.FC = () => {
  const [activeNode, setActiveNode] = useState<TenantNode>(tenantContextService.getActiveNode());
  const [breadcrumbs, setBreadcrumbs] = useState(tenantContextService.getBreadcrumbs());
  const [allNodes, setAllNodes] = useState<TenantNode[]>(tenantContextService.getAllNodes());
  const [pickerModalOpen, setPickerModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('All');

  useEffect(() => {
    const unsubscribe = tenantContextService.subscribe(() => {
      setActiveNode(tenantContextService.getActiveNode());
      setBreadcrumbs(tenantContextService.getBreadcrumbs());
      setAllNodes(tenantContextService.getAllNodes());
    });
    return () => unsubscribe();
  }, []);

  const handleSelectNode = (id: string) => {
    tenantContextService.setActiveNodeId(id);
    setPickerModalOpen(false);
  };

  const getLevelBadge = (level: HierarchyLevel) => {
    switch (level) {
      case 'Platform':
        return (
          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-extrabold uppercase rounded-full flex items-center gap-1 font-mono">
            <Globe className="w-3 h-3 text-indigo-400" /> Platform Root
          </span>
        );
      case 'Partner':
        return (
          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-extrabold uppercase rounded-full flex items-center gap-1 font-mono">
            <Building2 className="w-3 h-3 text-cyan-400" /> Partner MSP
          </span>
        );
      case 'Customer':
        return (
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold uppercase rounded-full flex items-center gap-1 font-mono">
            <Briefcase className="w-3 h-3 text-emerald-400" /> Customer Tenant
          </span>
        );
      case 'Project':
        return (
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold uppercase rounded-full flex items-center gap-1 font-mono">
            <FolderGit2 className="w-3 h-3 text-amber-400" /> Project Workspace
          </span>
        );
    }
  };

  const filteredNodes = allNodes.filter((node) => {
    if (levelFilter !== 'All' && node.level !== levelFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      node.name.toLowerCase().includes(q) ||
      node.code.toLowerCase().includes(q) ||
      node.isolationMode.toLowerCase().includes(q) ||
      node.region.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Real-time Multi-Tenant Architecture Banner */}
      <div className="bg-slate-950/90 border-b border-slate-800 text-slate-200 px-4 py-2 text-xs font-sans shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
          
          {/* Active Scope Breadcrumb Path */}
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto py-0.5 scrollbar-none">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 mr-1 flex items-center gap-1 font-mono">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Tenant Scope:
            </span>

            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectNode(crumb.id)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isLast
                        ? 'bg-indigo-600/90 text-white border-indigo-400/60 shadow-xs ring-2 ring-indigo-500/30'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>{crumb.name}</span>
                    <span className="text-[9px] opacity-70">({crumb.code})</span>
                  </button>

                  {!isLast && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
                </React.Fragment>
              );
            })}

            <button
              type="button"
              onClick={() => setPickerModalOpen(true)}
              className="ml-2 px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-700/60 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer"
              title="Change active hierarchy scope"
            >
              <Sliders className="w-3 h-3 text-indigo-400" />
              <span>Switch Scope</span>
            </button>
          </div>

          {/* Real-Time Live Pulse Telemetry */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-[11px] font-mono justify-end">
            {/* Live Throughput */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="font-bold">
                {activeNode.realtimeMetrics.throughputRecordsSec.toLocaleString()} Rec/s
              </span>
              <span className="text-[9px] text-emerald-400/80">({activeNode.realtimeMetrics.throughputMbSec} MB/s)</span>
            </div>

            {/* Isolation Strategy */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300"
              title={activeNode.isolationMode}
            >
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              <span className="truncate max-w-[170px]">{activeNode.isolationMode}</span>
            </div>

            {/* Active Pipelines & SLA */}
            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[10px]">
              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-bold">
                {activeNode.realtimeMetrics.activePipelines} Pipelines Active
              </span>
              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-amber-300 font-bold">
                {activeNode.slaTier}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* TENANT SCOPE SELECTOR MODAL */}
      {pickerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-white">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Layers className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-white">Select Tenant Hierarchy Scope</h3>
                  <p className="text-slate-400 text-xs">
                    Scope data operations, real-time sync telemetry, and security policies across the 4-tier EDMP hierarchy.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPickerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Level Filters */}
            <div className="space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search partner, customer, project or isolation strategy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
                {['All', 'Platform', 'Partner', 'Customer', 'Project'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevelFilter(lvl)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      levelFilter === lvl
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Nodes Grid */}
            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {filteredNodes.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  No tenant nodes match &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredNodes.map((node) => {
                  const isSelected = node.id === activeNode.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => handleSelectNode(node.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-950/70 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white font-mono">{node.name}</span>
                          <span className="text-xs text-slate-500 font-mono">({node.code})</span>
                          {getLevelBadge(node.level)}
                          {isSelected && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" /> Active Scope
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-1">{node.notes}</p>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                          <span className="flex items-center gap-1 text-indigo-300">
                            <ShieldCheck className="w-3 h-3 text-indigo-400" /> {node.isolationMode}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-cyan-300">
                            <Globe className="w-3 h-3 text-cyan-400" /> {node.region}
                          </span>
                        </div>
                      </div>

                      {/* Right Telemetry Badge */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 text-right font-mono">
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{node.realtimeMetrics.throughputRecordsSec.toLocaleString()} rec/s</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {node.realtimeMetrics.activePipelines} Pipelines • SLA {node?.slaTier ? node.slaTier.split(' ')[0] : ''}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Active Nodes: {allNodes.length} • Real-Time Pulse Engine Running</span>
              <button
                type="button"
                onClick={() => setPickerModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
