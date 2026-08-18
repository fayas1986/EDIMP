import React, { useState, useEffect } from 'react';
import { RequestIsolationEnforcementMatrix } from './RequestIsolationEnforcementMatrix';
import { ResourceSpikeNotificationPanel } from './ResourceSpikeNotificationPanel';
import {
  Layers,
  Globe,
  Building2,
  Briefcase,
  FolderGit2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sliders,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronDown,
  Activity,
  Cpu,
  Key,
  Database,
  Lock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Server,
  Settings,
  X,
  Clock,
  Radio,
  FileSpreadsheet,
  BarChart3,
  Check
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { tenantContextService } from '../services/tenantContextService';
import {
  TenantNode,
  HierarchyLevel,
  TenantIsolationMode,
  KmsKeyType,
  TenantRegion,
  TenantSlaTier,
  TenantRealtimeEvent
} from '../types/tenantHierarchy';

export const MultiTenantArchitectureHub: React.FC = () => {
  const [activeNode, setActiveNode] = useState<TenantNode>(tenantContextService.getActiveNode());
  const [allNodes, setAllNodes] = useState<TenantNode[]>(tenantContextService.getAllNodes());
  const [events, setEvents] = useState<TenantRealtimeEvent[]>(
    tenantContextService.getRealtimeEvents(activeNode.id)
  );
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'root-edmp': true,
    'partner-a': true,
    'cust-001': true,
    'partner-b': true,
    'direct-enterprise': true,
  });

  // Modal State for New Node Provisioning
  const [showProvisionModal, setShowProvisionModal] = useState<boolean>(false);
  const [newLevel, setNewLevel] = useState<HierarchyLevel>('Customer');
  const [newName, setNewName] = useState<string>('');
  const [newCode, setNewCode] = useState<string>('');
  const [newParentId, setNewParentId] = useState<string>('partner-a');
  const [newIsolationMode, setNewIsolationMode] = useState<TenantIsolationMode>(
    'Shared Schema with RLS (Row-Level Security)'
  );
  const [newKmsKeyType, setNewKmsKeyType] = useState<KmsKeyType>('Customer Managed BYOK');
  const [newRegion, setNewRegion] = useState<TenantRegion>('US-East (Virginia)');
  const [newSlaTier, setNewSlaTier] = useState<TenantSlaTier>('99.99% Enterprise Gold');
  const [newNotes, setNewNotes] = useState<string>('');

  // Tab selection inside hub
  const [activeTab, setActiveTab] = useState<'architecture' | 'isolation' | 'matrix' | 'events'>('architecture');

  // Search inside hub tree
  const [treeSearch, setTreeSearch] = useState<string>('');

  useEffect(() => {
    const unsubscribe = tenantContextService.subscribe(() => {
      setActiveNode(tenantContextService.getActiveNode());
      setAllNodes(tenantContextService.getAllNodes());
      setEvents(tenantContextService.getRealtimeEvents(tenantContextService.getActiveNode().id));
    });
    return () => unsubscribe();
  }, []);

  const handleSelectNode = (nodeId: string) => {
    tenantContextService.setActiveNodeId(nodeId);
  };

  const toggleExpand = (nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleUpdateIsolationMode = (mode: TenantIsolationMode) => {
    tenantContextService.updateNode(activeNode.id, { isolationMode: mode });
  };

  const handleUpdateKmsKey = (kms: KmsKeyType) => {
    tenantContextService.updateNode(activeNode.id, { kmsKeyType: kms });
  };

  const handleUpdateRateLimit = (newRps: number) => {
    const updatedMetrics = {
      ...activeNode.realtimeMetrics,
      rateLimitQuotaRps: newRps,
    };
    tenantContextService.updateNode(activeNode.id, { realtimeMetrics: updatedMetrics });
  };

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    tenantContextService.addNode({
      name: newName.trim(),
      level: newLevel,
      code: newCode.trim().toUpperCase() || `NODE-${Date.now().toString().slice(-4)}`,
      parentId: newParentId,
      isolationMode: newIsolationMode,
      kmsKeyType: newKmsKeyType,
      region: newRegion,
      slaTier: newSlaTier,
      status: 'Active',
      contactEmail: `admin@${newName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      primaryAdmin: `${newName} Lead Engineer`,
      notes: newNotes || `Provisioned ${newLevel} node under parent ID ${newParentId}.`,
    });

    setShowProvisionModal(false);
    setNewName('');
    setNewCode('');
    setNewNotes('');
  };

  // Mock real-time chart data for selected node
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const min = (i * 5).toString().padStart(2, '0');
    const base = activeNode.realtimeMetrics.throughputRecordsSec;
    const records = Math.round(base * (0.85 + Math.random() * 0.3));
    const rps = Math.round(records / 10);
    return {
      time: `04:${min}`,
      records,
      rps,
      latency: activeNode.realtimeMetrics.latencyMs + Math.floor(Math.random() * 6 - 3),
    };
  });

  // Recursive Tree Component matching user's architecture diagram
  const renderTreeBranch = (nodeId: string, depth: number = 0) => {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) return null;

    // Search filter check
    const matchesSearch =
      !treeSearch.trim() ||
      node.name.toLowerCase().includes(treeSearch.toLowerCase()) ||
      node.code.toLowerCase().includes(treeSearch.toLowerCase());

    const children = allNodes.filter((n) => n.parentId === nodeId);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes[nodeId] ?? true;
    const isSelected = activeNode.id === node.id;

    const levelColors: Record<HierarchyLevel, { bg: string; border: string; text: string; icon: any }> = {
      Platform: { bg: 'bg-indigo-50/90', border: 'border-indigo-200/80', text: 'text-indigo-900', icon: Globe },
      Partner: { bg: 'bg-sky-50/90', border: 'border-sky-200/80', text: 'text-sky-900', icon: Building2 },
      Customer: { bg: 'bg-emerald-50/90', border: 'border-emerald-200/80', text: 'text-emerald-900', icon: Briefcase },
      Project: { bg: 'bg-amber-50/90', border: 'border-amber-200/80', text: 'text-amber-900', icon: FolderGit2 },
    };

    const LevelIcon = levelColors[node.level].icon;

    if (!matchesSearch && !hasChildren) return null;

    return (
      <div key={node.id} className="space-y-1">
        <div
          onClick={() => handleSelectNode(node.id)}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
            isSelected
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm ring-2 ring-indigo-400/40'
              : `${levelColors[node.level].bg} ${levelColors[node.level].border} hover:bg-slate-100/90`
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                className={`p-1 rounded transition-colors ${isSelected ? 'hover:bg-indigo-700 text-white' : 'hover:bg-slate-200 text-slate-500'}`}
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className={`w-5 text-center font-mono text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>└</span>
            )}

            <span className={`p-1.5 rounded-lg border ${isSelected ? 'bg-indigo-500 text-white border-indigo-300' : 'bg-white text-slate-700 border-slate-200 shadow-2xs'}`}>
              <LevelIcon className="w-3.5 h-3.5" />
            </span>

            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{node.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${isSelected ? 'bg-indigo-700 text-indigo-100 border-indigo-500' : 'bg-white text-slate-600 border-slate-200'}`}>
                  {node.code}
                </span>
              </div>
              <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                {node.isolationMode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
            <span className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${isSelected ? 'bg-indigo-700 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              <Zap className={`w-3 h-3 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`} />
              {node.realtimeMetrics.throughputRecordsSec.toLocaleString()} r/s
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1 relative">
            <div
              className="absolute left-[15px] top-0 bottom-2 w-px bg-slate-200"
              style={{ left: `${depth * 20 + 17}px` }}
            />
            {children.map((child) => renderTreeBranch(child.id, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-50/50 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-xs font-mono font-semibold rounded-full flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> Real-Time Multi-Tenant Architecture
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-mono font-semibold rounded-full">
                4-Tier Topology Active
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Layers className="w-7 h-7 text-indigo-600" /> EDMP Multi-Tenant Real-Time Platform
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Enforcing zero-trust multi-tenancy across Partners, Enterprise Customers, and Migration Projects with Row-Level Security (RLS), BYOK encryption key management, real-time telemetry streaming, and rate-limiting quotas.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowProvisionModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Provision New Tenant Node</span>
            </button>
          </div>
        </div>

        {/* Global Architecture Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-200 text-xs font-mono">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Platform Throughput</div>
            <div className="text-lg font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>{allNodes[0]?.realtimeMetrics.throughputRecordsSec.toLocaleString()} rec/sec</span>
            </div>
            <div className="text-[10px] text-slate-500">Live aggregated real-time stream</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Active Hierarchy Nodes</div>
            <div className="text-lg font-bold text-indigo-700 mt-0.5">
              {allNodes.length} Nodes (4 Tiers)
            </div>
            <div className="text-[10px] text-slate-500">Platform, Partners, Customers, Projects</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">RLS Isolation Boundaries</div>
            <div className="text-lg font-bold text-sky-700 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>{(allNodes[0]?.realtimeMetrics.rlsEnforcedCount || 0).toLocaleString()} Verified</span>
            </div>
            <div className="text-[10px] text-slate-500">Row-level database query enforcement</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Platform Uptime &amp; SLA</div>
            <div className="text-lg font-bold text-amber-700 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              <span>99.99% Enterprise SLA</span>
            </div>
            <div className="text-[10px] text-slate-500">Zero cross-tenant leakage</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Interactive Tree & Right Selected Node Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Interactive Multi-Tenant Tree Diagram (Matching prompt structure) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 text-slate-900 space-y-4 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" /> Architecture Topology Tree
              </h2>
              <p className="text-[11px] text-slate-500">Click any node to scope operations &amp; view real-time metrics.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setExpandedNodes({
                  'root-edmp': true,
                  'partner-a': true,
                  'cust-001': true,
                  'partner-b': true,
                  'direct-enterprise': true,
                });
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
              title="Expand all tree branches"
            >
              Expand All
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tenant node by name, code..."
              value={treeSearch}
              onChange={(e) => setTreeSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Render Root Branch (Which renders all children) */}
          <div className="overflow-y-auto flex-1 max-h-[580px] space-y-1.5 pr-1 font-sans">
            {renderTreeBranch('root-edmp', 0)}
          </div>

          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Root ➔ Partner ➔ Customer ➔ Project</span>
            <span className="text-emerald-600 font-bold">● Live Sync Active</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Node Deep-Dive & Control Panel */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 space-y-6 shadow-md">
          {/* Node Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 font-bold font-mono text-[10px] rounded-full uppercase">
                  {activeNode.level} Tier
                </span>
                <span className="text-xs font-mono text-slate-500">ID: {activeNode.id}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded">
                  {activeNode.status}
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                {activeNode.name} <span className="text-slate-400 text-sm font-mono font-normal">({activeNode.code})</span>
              </h2>

              <p className="text-xs text-slate-500 max-w-xl">{activeNode.notes}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => tenantContextService.setActiveNodeId(activeNode.id)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Scope Platform to {activeNode.code}</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs inside Deep Dive */}
          <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'architecture'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Real-Time Telemetry</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('isolation')}
              className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'isolation'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Isolation &amp; Security</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Quota &amp; Throttling</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'events'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live Audit Feed</span>
            </button>
          </div>

          {/* TAB 1: REAL-TIME TELEMETRY */}
          {activeTab === 'architecture' && (
            <div className="space-y-5">
              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Live Record Throughput</div>
                  <div className="text-lg font-extrabold text-emerald-600 font-mono">
                    {activeNode.realtimeMetrics.throughputRecordsSec.toLocaleString()} r/s
                  </div>
                  <div className="text-[10px] text-slate-500">{activeNode.realtimeMetrics.throughputMbSec} MB/sec band</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Active Pipelines</div>
                  <div className="text-lg font-extrabold text-indigo-600 font-mono">
                    {activeNode.realtimeMetrics.activePipelines} Executing
                  </div>
                  <div className="text-[10px] text-slate-500">{activeNode.realtimeMetrics.activeWorkerNodes} Worker Nodes</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-500">API Transaction Rate</div>
                  <div className="text-lg font-extrabold text-slate-900 font-mono">
                    {activeNode.realtimeMetrics.currentRps} / {activeNode.realtimeMetrics.rateLimitQuotaRps} RPS
                  </div>
                  <div className="text-[10px] text-slate-500">Quota Limit Enforced</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Health &amp; SLA</div>
                  <div className="text-lg font-extrabold text-amber-600 font-mono">
                    {activeNode.realtimeMetrics.healthScore}% Healthy
                  </div>
                  <div className="text-[10px] text-slate-500">{activeNode?.slaTier ? activeNode.slaTier.split(' ')[0] : ''} SLA</div>
                </div>
              </div>

              {/* Live Throughput Chart */}
              <div className="p-4 bg-white text-slate-900 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-xs text-slate-900">Live Ingestion Stream (Records / Sec)</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    ● Real-Time SSE Feed
                  </span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="recordsColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="records" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#recordsColor)" name="Records / Sec" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ISOLATION & SECURITY */}
          {activeTab === 'isolation' && (
            <div className="space-y-5">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-sm text-indigo-950">Tenant Data Isolation Boundaries</h3>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  EDMP enforces multi-tenant boundary integrity. Select how database tables, storage objects, and API endpoints are segregated for <strong className="font-mono">{activeNode.name}</strong>.
                </p>
              </div>

              {/* Isolation Strategy Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Database Isolation Strategy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      mode: 'Shared Schema with RLS (Row-Level Security)' as TenantIsolationMode,
                      desc: 'Rows tagged with tenant_id. Fast, multi-tenant cost efficiency.',
                    },
                    {
                      mode: 'Dedicated Schema / Shared DB' as TenantIsolationMode,
                      desc: 'Separate Postgres / SQL schemas per customer. High isolation.',
                    },
                    {
                      mode: 'Dedicated Database Instance' as TenantIsolationMode,
                      desc: 'Physical database instance segregation. Enterprise Gold standard.',
                    },
                  ].map((item) => {
                    const isCurrent = activeNode.isolationMode === item.mode;
                    return (
                      <div
                        key={item.mode}
                        onClick={() => handleUpdateIsolationMode(item.mode)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{item?.mode ? item.mode.split(' ')[0] : ''}...</span>
                            {isCurrent && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <p className={`text-[11px] mt-1 ${isCurrent ? 'text-indigo-100' : 'text-slate-500'}`}>
                            {item.desc}
                          </p>
                        </div>
                        <span className={`text-[10px] font-mono ${isCurrent ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {item.mode}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Encryption Key Strategy (KMS) */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Encryption Key Provider (KMS Strategy)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    'Platform Managed KMS',
                    'Partner Vault KMS',
                    'Customer Managed BYOK',
                  ].map((kms) => {
                    const isSelected = activeNode.kmsKeyType === kms;
                    return (
                      <button
                        key={kms}
                        type="button"
                        onClick={() => handleUpdateKmsKey(kms as KmsKeyType)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer font-mono text-xs font-bold flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-800 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        <span>{kms}</span>
                        {isSelected && <Key className="w-4 h-4 text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUOTA & THROTTLING */}
          {activeTab === 'matrix' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">API Rate Limit &amp; Throughput Quota</h3>
                    <p className="text-xs text-slate-500">Adjust the peak transactions per second (RPS) allocated to this tenant.</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold font-mono text-xs rounded-full">
                    SLA: {activeNode.slaTier}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span>Allocated Quota: {activeNode.realtimeMetrics.rateLimitQuotaRps.toLocaleString()} RPS</span>
                    <span className="text-indigo-600">Current Load: {activeNode.realtimeMetrics.currentRps} RPS</span>
                  </div>

                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="500"
                    value={activeNode.realtimeMetrics.rateLimitQuotaRps}
                    onChange={(e) => handleUpdateRateLimit(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>500 RPS (Starter)</span>
                    <span>4,000 RPS (Partner)</span>
                    <span>10,000 RPS (Enterprise Gold)</span>
                  </div>
                </div>
              </div>

              {/* Resource Allocation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Worker Pod Allocations</span>
                  <div className="text-xl font-bold font-mono text-slate-900">
                    {activeNode.realtimeMetrics.activeWorkerNodes} Kubernetes Pods
                  </div>
                  <p className="text-xs text-slate-500">Auto-scaling bound to current migration throughput demand.</p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Storage Quota</span>
                  <div className="text-xl font-bold font-mono text-slate-900">
                    {activeNode.realtimeMetrics.storageUsageGb} GB / {activeNode.realtimeMetrics.storageQuotaGb} GB
                  </div>
                  <p className="text-xs text-slate-500">Encrypted staging buffer storage capacity.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE AUDIT FEED */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Real-Time Security &amp; Isolation Telemetry Events
                </h3>
                <span className="text-[10px] font-mono text-slate-500">Filtered for {activeNode.name}</span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center">No telemetry events logged for this node.</p>
                ) : (
                  events.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-1 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-indigo-300">{evt.eventType}</span>
                        <span>{evt.timestamp}</span>
                      </div>
                      <p className="text-slate-200 text-xs">{evt.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Resource Spike & Degradation Notification Panel */}
      <ResourceSpikeNotificationPanel />

      {/* 7-Step Request Context Traceability & 6-Layer Multi-Tenant Enforcement Matrix */}
      <RequestIsolationEnforcementMatrix />

      {/* PROVISION NEW TENANT NODE MODAL */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleProvisionSubmit}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 text-white"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Plus className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-base text-white">Provision New Tenant Hierarchy Node</h3>
              </div>

              <button
                type="button"
                onClick={() => setShowProvisionModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Hierarchy Level</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as HierarchyLevel)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold cursor-pointer"
                >
                  <option value="Partner">Partner / MSP Level</option>
                  <option value="Customer">Customer Tenant Level</option>
                  <option value="Project">Project Workspace Level</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Node Display Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Customer 006 or Project C"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Code / Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. CUST-006"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Parent Node in Architecture Hierarchy</label>
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold cursor-pointer"
                >
                  {allNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.level === 'Platform' ? '🌐 ' : n.level === 'Partner' ? '🏢 ' : '💼 '}
                      {n.name} ({n.code}) - {n.level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Database Isolation Strategy</label>
                <select
                  value={newIsolationMode}
                  onChange={(e) => setNewIsolationMode(e.target.value as TenantIsolationMode)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold cursor-pointer"
                >
                  <option value="Shared Schema with RLS (Row-Level Security)">
                    Shared Schema with RLS (Row-Level Security)
                  </option>
                  <option value="Dedicated Schema / Shared DB">Dedicated Schema / Shared DB</option>
                  <option value="Dedicated Database Instance">Dedicated Database Instance (Enterprise Gold)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="Optional architectural or business notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProvisionModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
              >
                Provision Tenant Node
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
