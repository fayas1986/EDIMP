import React, { useState } from 'react';
import {
  Zap,
  Sliders,
  Server,
  KeyRound,
  AlertTriangle,
  Palette,
  Search,
  Filter,
  Play,
  Pause,
  RefreshCcw,
  Plus,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  ExternalLink,
  Shield,
  ShieldCheck,
  Activity,
  Trash2,
  ChevronRight,
  Radio,
  UserCheck,
  FileCode,
  BarChart3,
  Layers,
  ListFilter,
} from 'lucide-react';
import { LiveActivityEvent, PartnerCustomer } from '../data/partnerPortalData';
import { GanttResourceTimeline } from './GanttResourceTimeline';

export interface LiveActivityFeedProps {
  events: LiveActivityEvent[];
  customers: PartnerCustomer[];
  selectedPartnerId?: string;
  isolatedCustomerId?: string; // If rendered inside an isolated customer view/drawer
  currentRole?: string;
  isLiveStreaming: boolean;
  onToggleStreaming: () => void;
  onSimulateConfigChange: () => void;
  onSimulateMigrationStart: () => void;
  onSelectCustomerWorkspace?: (customer: PartnerCustomer) => void;
  onClearFeed?: () => void;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  events,
  customers,
  selectedPartnerId = 'ALL',
  isolatedCustomerId,
  isLiveStreaming,
  onToggleStreaming,
  onSimulateConfigChange,
  onSimulateMigrationStart,
  onSelectCustomerWorkspace,
  onClearFeed,
}) => {
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>(
    isolatedCustomerId || 'ALL'
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedRbacRoleFilter, setSelectedRbacRoleFilter] = useState<string>('ALL');
  const [showRbacLogMode, setShowRbacLogMode] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'BOTH' | 'GANTT' | 'FEED'>('BOTH');

  // Filter events based on active partner, customer selection, category, RBAC role, and search query
  const filteredEvents = events.filter((evt) => {
    // Isolated Customer Filter
    if (isolatedCustomerId && evt.customerId !== isolatedCustomerId) {
      return false;
    }
    if (!isolatedCustomerId && selectedCustomerFilter !== 'ALL' && evt.customerId !== selectedCustomerFilter) {
      return false;
    }

    // Category Filter
    if (selectedCategoryFilter !== 'ALL' && evt.eventType !== selectedCategoryFilter) {
      return false;
    }

    // RBAC Role Filter
    if (selectedRbacRoleFilter !== 'ALL') {
      const evtRole = evt.actorRole || 'Partner Admin';
      if (evtRole !== selectedRbacRoleFilter) {
        return false;
      }
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = evt.title.toLowerCase().includes(q);
      const matchDesc = evt.description.toLowerCase().includes(q);
      const matchCust = evt.customerName.toLowerCase().includes(q) || evt.customerCode.toLowerCase().includes(q);
      const matchActor = evt.actor.toLowerCase().includes(q);
      const matchRole = (evt.actorRole || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCust && !matchActor && !matchRole) return false;
    }

    return true;
  });

  // Calculate RBAC Role Breakdown Counts
  const rbacRoleCounts = {
    'Partner Admin': events.filter((e) => (e.actorRole || 'Partner Admin') === 'Partner Admin').length,
    'Partner Analyst': events.filter((e) => e.actorRole === 'Partner Analyst').length,
    'Partner Support': events.filter((e) => e.actorRole === 'Partner Support').length,
    'System Auto-Provisioner': events.filter((e) => e.actorRole === 'System Auto-Provisioner').length,
  };

  const getRoleBadge = (actorRole?: string) => {
    const role = actorRole || 'Partner Admin';
    switch (role) {
      case 'Partner Admin':
        return {
          label: 'Partner Admin',
          icon: Shield,
          bgClass: 'bg-purple-500/15 text-purple-800 border-purple-500/30',
          badgeClass: 'bg-purple-600 text-white',
        };
      case 'Partner Analyst':
        return {
          label: 'Partner Analyst',
          icon: BarChart3,
          bgClass: 'bg-sky-500/15 text-sky-800 border-sky-500/30',
          badgeClass: 'bg-sky-600 text-white',
        };
      case 'Partner Support':
        return {
          label: 'Partner Support',
          icon: UserCheck,
          bgClass: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
          badgeClass: 'bg-amber-600 text-white',
        };
      case 'System Auto-Provisioner':
        return {
          label: 'System Auto',
          icon: Server,
          bgClass: 'bg-slate-500/15 text-slate-800 border-slate-500/30',
          badgeClass: 'bg-slate-700 text-white',
        };
      default:
        return {
          label: role,
          icon: ShieldCheck,
          bgClass: 'bg-indigo-500/15 text-indigo-800 border-indigo-500/30',
          badgeClass: 'bg-indigo-600 text-white',
        };
    }
  };

  // Calculate top statistics
  const migrationStartCount = events.filter((e) => e.eventType === 'MIGRATION_START').length;
  const configChangeCount = events.filter((e) => e.eventType === 'CONFIG_CHANGE' || e.eventType === 'WHITE_LABEL_UPDATE').length;
  const clusterOpsCount = events.filter((e) => e.eventType === 'CLUSTER_PROVISION' || e.eventType === 'HEALTH_ALERT').length;

  const getEventTypeBadge = (type: LiveActivityEvent['eventType']) => {
    switch (type) {
      case 'MIGRATION_START':
        return {
          label: 'MIGRATION START',
          icon: Zap,
          bgClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
          badgeColor: 'bg-emerald-600',
        };
      case 'CONFIG_CHANGE':
        return {
          label: 'CONFIG CHANGE',
          icon: Sliders,
          bgClass: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30',
          badgeColor: 'bg-indigo-600',
        };
      case 'CLUSTER_PROVISION':
        return {
          label: 'CLUSTER OPS',
          icon: Server,
          bgClass: 'bg-purple-500/10 text-purple-700 border-purple-500/30',
          badgeColor: 'bg-purple-600',
        };
      case 'LICENSE_ASSIGN':
        return {
          label: 'LICENSING',
          icon: KeyRound,
          bgClass: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
          badgeColor: 'bg-blue-600',
        };
      case 'HEALTH_ALERT':
        return {
          label: 'SLA ALERT',
          icon: AlertTriangle,
          bgClass: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
          badgeColor: 'bg-amber-500',
        };
      case 'WHITE_LABEL_UPDATE':
        return {
          label: 'BRANDING UPDATE',
          icon: Palette,
          bgClass: 'bg-rose-500/10 text-rose-700 border-rose-500/30',
          badgeColor: 'bg-rose-600',
        };
      default:
        return {
          label: 'SYSTEM EVENT',
          icon: Activity,
          bgClass: 'bg-slate-500/10 text-slate-700 border-slate-500/30',
          badgeColor: 'bg-slate-600',
        };
    }
  };

  const selectedCustomerObj = customers.find(
    (c) => c.id === (isolatedCustomerId || selectedCustomerFilter)
  );

  return (
    <div className="space-y-6">
      {/* Top Telemetry Header & Stats Summary */}
      {!isolatedCustomerId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-slate-500 text-xs font-bold uppercase font-mono flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600" />
              Total Live Activity Logs
            </span>
            <div className="text-3xl font-black text-slate-900 font-mono">{events.length}</div>
            <div className="text-[11px] text-slate-500 font-medium">Real-time CDC &amp; Tenant events</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-slate-500 text-xs font-bold uppercase font-mono flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              Migration Starts
            </span>
            <div className="text-3xl font-black text-emerald-600 font-mono">{migrationStartCount}</div>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" /> Active sync pipelines initiated
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-slate-500 text-xs font-bold uppercase font-mono flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Configuration Updates
            </span>
            <div className="text-3xl font-black text-indigo-600 font-mono">{configChangeCount}</div>
            <div className="text-[11px] text-slate-500">Tier, quota &amp; white-label edits</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-slate-500 text-xs font-bold uppercase font-mono flex items-center gap-1.5">
              <Server className="w-4 h-4 text-purple-600" />
              Tenant &amp; Cluster Ops
            </span>
            <div className="text-3xl font-black text-purple-600 font-mono">{clusterOpsCount}</div>
            <div className="text-[11px] text-slate-500">Node provisioning &amp; health alerts</div>
          </div>
        </div>
      )}

      {/* Control Strip & Stream Controls */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-indigo-900 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-xs">
            <Radio className={`w-6 h-6 ${isLiveStreaming ? 'animate-pulse text-emerald-300' : 'text-slate-300'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base text-white">Live Activity &amp; Audit Feed</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border ${
                isLiveStreaming
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                <Radio className={`w-3 h-3 ${isLiveStreaming ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
                {isLiveStreaming ? 'LIVE STREAMING' : 'STREAM PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tracks real-time customer configuration changes, migration starts, cluster scale ops, and license allocations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* RBAC Role-Based Access Log Toggle */}
          <button
            onClick={() => setShowRbacLogMode(!showRbacLogMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm ${
              showRbacLogMode
                ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400/30 hover:bg-purple-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle RBAC Role-Based Access Logging & Highlights"
          >
            <Shield className={`w-3.5 h-3.5 ${showRbacLogMode ? 'text-purple-200' : 'text-slate-400'}`} />
            <span>Role-Based Access Log</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black ${
                showRbacLogMode ? 'bg-purple-800 text-purple-200' : 'bg-slate-900 text-slate-400'
              }`}
            >
              {showRbacLogMode ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={onToggleStreaming}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              isLiveStreaming
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500 shadow-xs'
            }`}
          >
            {isLiveStreaming ? <Pause className="w-3.5 h-3.5 text-amber-300" /> : <Play className="w-3.5 h-3.5 text-white" />}
            <span>{isLiveStreaming ? 'Pause Feed Stream' : 'Resume Live Stream'}</span>
          </button>

          <button
            onClick={onSimulateMigrationStart}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 border border-emerald-400/50"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-200" />
            <span>Simulate Migration Start</span>
          </button>

          <button
            onClick={onSimulateConfigChange}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-400/50"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-200" />
            <span>Simulate Config Change</span>
          </button>

          {onClearFeed && (
            <button
              onClick={onClearFeed}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-300 rounded-xl transition-colors cursor-pointer border border-slate-700"
              title="Clear Activity Stream"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Customer Isolation Filter (if not already strictly isolated) */}
          {!isolatedCustomerId && (
            <div className="w-full sm:w-56">
              <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1">
                Isolated Customer
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedCustomerFilter}
                  onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">🌐 All Customers in Workspace</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      🔒 {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* RBAC Role Filter */}
          <div className="w-full sm:w-52">
            <label className="text-[10px] font-bold text-purple-700 uppercase font-mono block mb-1 flex items-center gap-1">
              <Shield className="w-3 h-3 text-purple-600" />
              RBAC Role Filter
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedRbacRoleFilter}
                onChange={(e) => setSelectedRbacRoleFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-purple-50/60 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="ALL">All RBAC Roles</option>
                <option value="Partner Admin">🛡️ Partner Admin</option>
                <option value="Partner Analyst">📊 Partner Analyst</option>
                <option value="Partner Support">🎧 Partner Support</option>
                <option value="System Auto-Provisioner">🤖 System Auto-Provisioner</option>
              </select>
            </div>
          </div>

          {/* Event Category Filter */}
          <div className="w-full sm:w-48">
            <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1">
              Event Category
            </label>
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Event Categories</option>
                <option value="MIGRATION_START">🚀 Migration Starts</option>
                <option value="CONFIG_CHANGE">⚙️ Configuration Changes</option>
                <option value="CLUSTER_PROVISION">🖥 Tenant &amp; Cluster Ops</option>
                <option value="LICENSE_ASSIGN">🔑 License Assignments</option>
                <option value="HEALTH_ALERT">⚠️ SLA &amp; System Alerts</option>
                <option value="WHITE_LABEL_UPDATE">🎨 White-Label Branding</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-64">
          <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1">
            Search Feed
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search activity, role, actor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Isolated Focus Banner if single customer selected */}
      {selectedCustomerObj && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-semibold text-slate-800">
              Showing strictly isolated real-time activity for{' '}
              <strong className="text-indigo-900 font-extrabold">{selectedCustomerObj.name}</strong> ({selectedCustomerObj.code})
            </span>
          </div>

          {!isolatedCustomerId && (
            <button
              onClick={() => setSelectedCustomerFilter('ALL')}
              className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer shrink-0"
            >
              Reset to All Customers
            </button>
          )}
        </div>
      )}

      {/* RBAC Role-Based Access Log Interactive Audit Banner */}
      {showRbacLogMode && (
        <div className="bg-gradient-to-r from-purple-900/95 via-indigo-900/90 to-slate-900 text-white p-4.5 rounded-2xl border border-purple-500/40 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/20 text-purple-200 rounded-xl border border-purple-400/30">
                <ShieldCheck className="w-5 h-5 text-purple-300 animate-pulse" />
              </div>
              <div>
                <h4 className="font-black text-sm text-white flex items-center gap-2">
                  Role-Based Access Log (RBAC Highlights Active)
                </h4>
                <p className="text-[11px] text-purple-200/80">
                  Highlighting operational changes and migration events performed by specific RBAC roles (Partner Admin, Analyst, Support, etc.).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-200 border border-purple-400/30 px-2.5 py-1 rounded-full font-bold">
                {filteredEvents.length} RBAC Events Filtered
              </span>
            </div>
          </div>

          {/* Role Breakdown Interactive Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-purple-500/30">
            <span className="text-[11px] font-mono font-bold text-purple-300 mr-1">Filter by Role:</span>
            <button
              onClick={() => setSelectedRbacRoleFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                selectedRbacRoleFilter === 'ALL'
                  ? 'bg-purple-500 text-white border-purple-300 shadow-xs ring-1 ring-purple-300/40'
                  : 'bg-purple-950/60 text-purple-200 border-purple-700/50 hover:bg-purple-900/50'
              }`}
            >
              All Roles ({events.length})
            </button>

            <button
              onClick={() => setSelectedRbacRoleFilter('Partner Admin')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                selectedRbacRoleFilter === 'Partner Admin'
                  ? 'bg-purple-500 text-white border-purple-300 shadow-xs ring-1 ring-purple-300/40'
                  : 'bg-purple-950/60 text-purple-200 border-purple-700/50 hover:bg-purple-900/50'
              }`}
            >
              <Shield className="w-3 h-3 text-purple-300" />
              <span>Partner Admin</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded bg-purple-800 text-[10px] font-mono font-black">
                {rbacRoleCounts['Partner Admin']}
              </span>
            </button>

            <button
              onClick={() => setSelectedRbacRoleFilter('Partner Analyst')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                selectedRbacRoleFilter === 'Partner Analyst'
                  ? 'bg-sky-500 text-white border-sky-300 shadow-xs ring-1 ring-sky-300/40'
                  : 'bg-purple-950/60 text-sky-200 border-purple-700/50 hover:bg-purple-900/50'
              }`}
            >
              <BarChart3 className="w-3 h-3 text-sky-300" />
              <span>Partner Analyst</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded bg-sky-900 text-[10px] font-mono font-black">
                {rbacRoleCounts['Partner Analyst']}
              </span>
            </button>

            <button
              onClick={() => setSelectedRbacRoleFilter('Partner Support')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                selectedRbacRoleFilter === 'Partner Support'
                  ? 'bg-amber-500 text-white border-amber-300 shadow-xs ring-1 ring-amber-300/40'
                  : 'bg-purple-950/60 text-amber-200 border-purple-700/50 hover:bg-purple-900/50'
              }`}
            >
              <UserCheck className="w-3 h-3 text-amber-300" />
              <span>Partner Support</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded bg-amber-900 text-[10px] font-mono font-black">
                {rbacRoleCounts['Partner Support']}
              </span>
            </button>

            <button
              onClick={() => setSelectedRbacRoleFilter('System Auto-Provisioner')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                selectedRbacRoleFilter === 'System Auto-Provisioner'
                  ? 'bg-slate-600 text-white border-slate-300 shadow-xs ring-1 ring-slate-300/40'
                  : 'bg-purple-950/60 text-slate-300 border-purple-700/50 hover:bg-purple-900/50'
              }`}
            >
              <Server className="w-3 h-3 text-slate-300" />
              <span>System Auto</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono font-black">
                {rbacRoleCounts['System Auto-Provisioner']}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* View Mode Toggle Switcher */}
      <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setViewMode('BOTH')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'BOTH'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dual View (Gantt + Feed)</span>
          </button>

          <button
            onClick={() => setViewMode('GANTT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'GANTT'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Gantt Resource Timeline</span>
          </button>

          <button
            onClick={() => setViewMode('FEED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'FEED'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Chronological Event Feed</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-500 font-medium px-2 hidden sm:inline">
          Active Mode: {viewMode === 'BOTH' ? 'Gantt Timeline + Event Stream' : viewMode === 'GANTT' ? 'Gantt Timeline Grid' : 'Event Stream Audit Log'}
        </span>
      </div>

      {/* Gantt Resource Timeline View Section */}
      {(viewMode === 'BOTH' || viewMode === 'GANTT') && (
        <GanttResourceTimeline
          customers={customers}
          isolatedCustomerId={isolatedCustomerId || (selectedCustomerFilter !== 'ALL' ? selectedCustomerFilter : undefined)}
          onSelectCustomerWorkspace={onSelectCustomerWorkspace}
        />
      )}

      {/* Activity Timeline List */}
      {(viewMode === 'BOTH' || viewMode === 'FEED') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-extrabold text-slate-700">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Real-Time Chronological Activity Log</span>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">
            Displaying {filteredEvents.length} of {events.length} events
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-800">No Activity Events Match Filters</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your customer or category filter, or click "Simulate Migration Start" above to generate a real-time event!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEvents.map((evt) => {
              const badge = getEventTypeBadge(evt.eventType);
              const BadgeIcon = badge.icon;
              const roleBadge = getRoleBadge(evt.actorRole);
              const RoleIcon = roleBadge.icon;
              const matchingCustomer = customers.find((c) => c.id === evt.customerId);

              return (
                <div key={evt.id} className="p-5 hover:bg-slate-50/80 transition-colors space-y-3">
                  {/* Event Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-black font-mono flex items-center gap-1.5 ${badge.bgClass}`}>
                        <BadgeIcon className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-extrabold text-xs flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-indigo-600" />
                        {evt.customerName}
                      </span>

                      <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {evt.customerCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-slate-500 font-mono flex-wrap">
                      <span className="flex items-center gap-1 text-slate-700 font-bold">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        {evt.actor}
                      </span>

                      {/* Prominent RBAC Role Tag */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black border flex items-center gap-1 shadow-2xs ${roleBadge.bgClass}`}>
                        <RoleIcon className="w-3 h-3" />
                        {roleBadge.label}
                      </span>

                      <span>•</span>
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {evt.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      {evt.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>
                  </div>

                  {/* RBAC Role-Based Audit Trail Highlight Box */}
                  {showRbacLogMode && (
                    <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono shadow-2xs">
                      <div className="flex items-center gap-2 text-purple-900">
                        <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>
                          <strong>RBAC Role Trace:</strong> Performed by <u className="decoration-purple-400 underline-offset-2 font-extrabold text-purple-950">{evt.actorRole || 'Partner Admin'}</u>
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-200/70 text-purple-800 self-start sm:self-auto flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-purple-700" />
                        {evt.eventType === 'CONFIG_CHANGE'
                          ? 'Configuration Management Privilege Validated'
                          : evt.eventType === 'MIGRATION_START'
                          ? 'CDC Pipeline Initiation Privilege Validated'
                          : evt.eventType === 'CLUSTER_PROVISION'
                          ? 'Tenant Infrastructure Provisioning Privilege Validated'
                          : 'RBAC Authorization Verified'}
                      </span>
                    </div>
                  )}

                  {/* Metadata Chips Grid */}
                  {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Object.entries(evt.metadata).map(([key, val]) => (
                        <div key={key} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono">
                          <span className="text-slate-500 font-medium">{key}: </span>
                          <strong className="text-slate-900 font-black">{val}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Link to Workspace */}
                  {matchingCustomer && onSelectCustomerWorkspace && (
                    <div className="pt-1 flex items-center justify-end">
                      <button
                        onClick={() => onSelectCustomerWorkspace(matchingCustomer)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <span>Open Isolated Customer Workspace ({matchingCustomer.code})</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
    </div>
  );
};
