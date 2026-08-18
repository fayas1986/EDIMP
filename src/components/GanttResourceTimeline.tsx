import React, { useState } from 'react';
import {
  Zap,
  Clock,
  Server,
  Cpu,
  Layers,
  Building2,
  Play,
  Pause,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  Activity,
  Maximize2,
  Sliders,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { GanttMigrationJob, MOCK_GANTT_MIGRATION_JOBS, PartnerCustomer } from '../data/partnerPortalData';

export interface GanttResourceTimelineProps {
  jobs?: GanttMigrationJob[];
  customers: PartnerCustomer[];
  isolatedCustomerId?: string;
  onSelectCustomerWorkspace?: (customer: PartnerCustomer) => void;
  onBoostResources?: (jobId: string) => void;
}

export const GanttResourceTimeline: React.FC<GanttResourceTimelineProps> = ({
  jobs: initialJobs = MOCK_GANTT_MIGRATION_JOBS,
  customers,
  isolatedCustomerId,
  onSelectCustomerWorkspace,
  onBoostResources,
}) => {
  const [jobsList, setJobsList] = useState<GanttMigrationJob[]>(initialJobs);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<GanttMigrationJob | null>(null);

  // Filter jobs based on customer isolation, phase, status, search query
  const filteredJobs = jobsList.filter((job) => {
    if (isolatedCustomerId && job.customerId !== isolatedCustomerId) {
      return false;
    }
    if (selectedPhaseFilter !== 'ALL' && job.phase !== selectedPhaseFilter) {
      return false;
    }
    if (selectedStatusFilter !== 'ALL' && job.status !== selectedStatusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = job.jobName.toLowerCase().includes(q);
      const matchCust = job.customerName.toLowerCase().includes(q) || job.customerCode.toLowerCase().includes(q);
      const matchErp = job.erpSource.toLowerCase().includes(q) || job.targetCloud.toLowerCase().includes(q);
      if (!matchName && !matchCust && !matchErp) return false;
    }
    return true;
  });

  // Calculate aggregated timeline metrics
  const totalAllocatedVCPUs = filteredJobs.reduce((acc, j) => acc + j.allocatedVCPUs, 0);
  const totalAllocatedRAM = filteredJobs.reduce((acc, j) => acc + j.allocatedMemoryGb, 0);
  const totalThroughputGb = filteredJobs.reduce((acc, j) => acc + j.throughputGbSec, 0);
  const activeJobsCount = filteredJobs.filter((j) => j.status === 'ACTIVE_SYNC' || j.status === 'CATCHUP').length;

  // Handle resource boost simulation
  const handleBoost = (jobId: string) => {
    setJobsList((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          const newWorkers = j.parallelWorkerThreads + 4;
          const newVCPUs = j.allocatedVCPUs + 4;
          const newRAM = j.allocatedMemoryGb + 16;
          const newThroughput = parseFloat((j.throughputGbSec + 0.75).toFixed(2));
          const newProgress = Math.min(100, j.progressPct + 8);
          return {
            ...j,
            parallelWorkerThreads: newWorkers,
            allocatedVCPUs: newVCPUs,
            allocatedMemoryGb: newRAM,
            throughputGbSec: newThroughput,
            progressPct: newProgress,
          };
        }
        return j;
      })
    );
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob((prev) => (prev ? {
        ...prev,
        parallelWorkerThreads: prev.parallelWorkerThreads + 4,
        allocatedVCPUs: prev.allocatedVCPUs + 4,
        allocatedMemoryGb: prev.allocatedMemoryGb + 16,
        throughputGbSec: parseFloat((prev.throughputGbSec + 0.75).toFixed(2)),
        progressPct: Math.min(100, prev.progressPct + 8),
      } : null));
    }
    if (onBoostResources) {
      onBoostResources(jobId);
    }
  };

  const getPhaseBadgeColor = (phase: GanttMigrationJob['phase']) => {
    switch (phase) {
      case 'Pre-Flight Schema':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/30';
      case 'Initial Bulk Load':
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30';
      case 'CDC Delta Catchup':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
      case 'Cutover Validation':
        return 'bg-purple-500/10 text-purple-700 border-purple-500/30';
      case 'Live Mirroring':
        return 'bg-teal-500/10 text-teal-700 border-teal-500/30';
      default:
        return 'bg-slate-500/10 text-slate-700 border-slate-500/30';
    }
  };

  const getGanttBarColor = (phase: GanttMigrationJob['phase'], status: GanttMigrationJob['status']) => {
    if (status === 'PAUSED') return 'bg-amber-500 border-amber-600';
    if (status === 'COMPLETED') return 'bg-slate-400 border-slate-500';
    switch (phase) {
      case 'Pre-Flight Schema':
        return 'bg-gradient-to-r from-blue-600 to-cyan-600 border-blue-500';
      case 'Initial Bulk Load':
        return 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500';
      case 'CDC Delta Catchup':
        return 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500';
      case 'Cutover Validation':
        return 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-500';
      case 'Live Mirroring':
        return 'bg-gradient-to-r from-teal-600 to-emerald-600 border-teal-500';
      default:
        return 'bg-slate-700 border-slate-600';
    }
  };

  const timeTicks = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  return (
    <div className="space-y-6">
      {/* Top Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-[10px] font-bold uppercase font-mono flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            Active Migration Jobs
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">{activeJobsCount} / {filteredJobs.length}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-500 animate-pulse" /> CDC streams active
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-[10px] font-bold uppercase font-mono flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            Allocated Compute
          </span>
          <div className="text-2xl font-black text-indigo-700 font-mono">{totalAllocatedVCPUs} vCPUs</div>
          <div className="text-[11px] text-slate-500 font-medium">{totalAllocatedRAM} GB RAM assigned</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-[10px] font-bold uppercase font-mono flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            Total CDC Bandwidth
          </span>
          <div className="text-2xl font-black text-purple-700 font-mono">{totalThroughputGb.toFixed(2)} GB/s</div>
          <div className="text-[11px] text-slate-500 font-medium">Real-time replication throughput</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-[10px] font-bold uppercase font-mono flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Time Horizon
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">24-Hr Cycle</div>
          <div className="text-[11px] text-blue-600 font-semibold">00:00 - 24:00 UTC Grid</div>
        </div>
      </div>

      {/* Filter Bar for Gantt Timeline */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Phase Filter */}
          <div className="w-full sm:w-56">
            <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1">
              Migration Phase
            </label>
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedPhaseFilter}
                onChange={(e) => setSelectedPhaseFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Migration Phases</option>
                <option value="Pre-Flight Schema">Pre-Flight Schema</option>
                <option value="Initial Bulk Load">Initial Bulk Load</option>
                <option value="CDC Delta Catchup">CDC Delta Catchup</option>
                <option value="Cutover Validation">Cutover Validation</option>
                <option value="Live Mirroring">Live Mirroring</option>
              </select>
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1">
              Job Status
            </label>
            <div className="relative">
              <Activity className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Job Statuses</option>
                <option value="ACTIVE_SYNC">⚡ Active Syncing</option>
                <option value="CATCHUP">🔄 Delta Catchup</option>
                <option value="PAUSED">⏸ Paused</option>
                <option value="COMPLETED">✅ Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="w-full md:w-64">
          <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1">
            Search Jobs &amp; ERP
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by job or ERP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main Gantt Timeline Chart Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-sm text-white">Migration Job Gantt Resource Timeline</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
              REAL-TIME CDC RESOURCE ALLOCATION
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Sync Engine Active</span>
          </div>
        </div>

        {/* Gantt Chart Container with Scrollable Grid */}
        <div className="overflow-x-auto min-w-[750px]">
          {/* Time Scale Axis Header */}
          <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-200 text-[11px] font-mono font-bold text-slate-600 sticky top-0 z-10">
            {/* Left label column */}
            <div className="col-span-4 p-3 border-r border-slate-200 bg-slate-100/90 flex items-center justify-between">
              <span>CUSTOMER &amp; MIGRATION JOB</span>
              <span className="text-[10px] text-slate-400 font-normal">RESOURCES</span>
            </div>

            {/* Timeline hour markers */}
            <div className="col-span-8 p-3 relative flex items-center justify-between font-mono text-[10px]">
              {timeTicks.map((hour) => (
                <div key={hour} className="flex flex-col items-center">
                  <span>{String(hour).padStart(2, '0')}:00</span>
                </div>
              ))}

              {/* Current Time Line Indicator (e.g. 10:35 = 10.58 / 24 = ~44%) */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none shadow-xs"
                style={{ left: `${(10.58 / 24) * 100}%` }}
              >
                <div className="bg-rose-600 text-white text-[9px] font-mono font-black px-1 py-0.5 rounded-xs -translate-x-1/2 -top-2 relative shadow-xs">
                  NOW
                </div>
              </div>
            </div>
          </div>

          {/* Gantt Body Rows */}
          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Layers className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="font-extrabold text-sm text-slate-700">No Ongoing Migration Jobs Match Filters</div>
              <p className="text-xs max-w-sm mx-auto">Try resetting your phase or status filters to view customer timelines.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 relative">
              {/* Background Vertical Grid Lines for the Timeline */}
              <div className="absolute inset-0 left-[33.333%] right-0 pointer-events-none flex justify-between">
                {timeTicks.map((hour) => (
                  <div key={hour} className="w-px bg-slate-100 h-full" />
                ))}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500/30 z-0 pointer-events-none"
                  style={{ left: `${(10.58 / 24) * 100}%` }}
                />
              </div>

              {filteredJobs.map((job) => {
                const customerObj = customers.find((c) => c.id === job.customerId);
                const leftPct = (job.startHour / 24) * 100;
                const widthPct = Math.max(8, ((job.endHour - job.startHour) / 24) * 100);
                const phaseBadge = getPhaseBadgeColor(job.phase);
                const barColor = getGanttBarColor(job.phase, job.status);

                return (
                  <div key={job.id} className="grid grid-cols-12 hover:bg-slate-50/80 transition-colors group">
                    {/* Left Details Column */}
                    <div className="col-span-4 p-3.5 border-r border-slate-200 space-y-1.5 bg-white group-hover:bg-slate-50/80 z-10">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 font-extrabold text-[11px] flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-indigo-600" />
                          {job.customerName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {job.customerCode}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-slate-900 truncate" title={job.jobName}>
                        {job.jobName}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-0.5">
                        <span className="text-slate-600 font-medium truncate">
                          {job.erpSource} → {job.targetCloud}
                        </span>
                        <span className="font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                          {job.allocatedVCPUs}C / {job.allocatedMemoryGb}G
                        </span>
                      </div>
                    </div>

                    {/* Right Gantt Bar Track */}
                    <div className="col-span-8 p-3.5 relative flex items-center z-10">
                      <div
                        onClick={() => setSelectedJob(job)}
                        className={`relative h-10 rounded-xl shadow-xs border text-white p-2 cursor-pointer transition-all transform hover:scale-[1.01] hover:shadow-md flex items-center justify-between overflow-hidden ${barColor}`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                      >
                        {/* Internal Animated Progress Fill Bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-white/20 pointer-events-none transition-all duration-500"
                          style={{ width: `${job.progressPct}%` }}
                        />

                        {/* Striped CDC Sync Pattern Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)50%,rgba(255,255,255,0.1)75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[stripe_1.5s_linear_infinite] pointer-events-none opacity-40" />

                        {/* Bar Left Label */}
                        <div className="relative z-10 flex items-center gap-1.5 text-xs font-black drop-shadow-xs truncate">
                          <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span className="truncate">{job.phase}</span>
                          <span className="text-[10px] font-mono bg-black/30 px-1.5 py-0.5 rounded font-extrabold">
                            {job.progressPct}%
                          </span>
                        </div>

                        {/* Bar Right Throughput & Duration */}
                        <div className="relative z-10 hidden sm:flex items-center gap-2 text-[10px] font-mono font-bold drop-shadow-xs shrink-0">
                          <span className="bg-black/30 px-1.5 py-0.5 rounded text-emerald-200">
                            {job.throughputGbSec} GB/s
                          </span>
                          <span className="bg-black/30 px-1.5 py-0.5 rounded text-slate-100">
                            {job.elapsedDuration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gantt Legend */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-3 font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-slate-800">Migration Phase Color Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-r from-blue-600 to-cyan-600 inline-block" />
              <span>Pre-Flight Schema</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-r from-indigo-600 to-purple-600 inline-block" />
              <span>Initial Bulk Load</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-r from-emerald-600 to-teal-600 inline-block" />
              <span>CDC Delta Catchup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-r from-purple-600 to-pink-600 inline-block" />
              <span>Cutover Validation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-r from-teal-600 to-emerald-600 inline-block" />
              <span>Live Mirroring</span>
            </div>
          </div>

          <div className="text-slate-500 font-medium">
            Click any Gantt bar to inspect CDC pipeline parameters or boost worker threads.
          </div>
        </div>
      </div>

      {/* Selected Job Detail Modal / Drawer */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-black text-base text-white">{selectedJob.jobName}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedJob.customerName} ({selectedJob.customerCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Status & Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Migration Phase Progress ({selectedJob.phase})</span>
                  <span className="font-black text-indigo-600 font-mono">{selectedJob.progressPct}% Complete</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                    style={{ width: `${selectedJob.progressPct}%` }}
                  />
                </div>
              </div>

              {/* Resource Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase font-mono">Allocated vCPUs</div>
                  <div className="text-lg font-black text-slate-900 font-mono">{selectedJob.allocatedVCPUs} vCPUs</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase font-mono">RAM Memory</div>
                  <div className="text-lg font-black text-slate-900 font-mono">{selectedJob.allocatedMemoryGb} GB</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase font-mono">CDC Throughput</div>
                  <div className="text-lg font-black text-emerald-600 font-mono">{selectedJob.throughputGbSec} GB/s</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase font-mono">Worker Threads</div>
                  <div className="text-lg font-black text-indigo-600 font-mono">{selectedJob.parallelWorkerThreads} Nodes</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase font-mono">Elapsed Time</div>
                  <div className="text-sm font-bold text-slate-800">{selectedJob.elapsedDuration}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase font-mono">Est. Remaining</div>
                  <div className="text-sm font-bold text-slate-800">{selectedJob.estimatedRemaining}</div>
                </div>
              </div>

              {/* ERP Source and Target details */}
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Source ERP Engine:</span>
                  <span className="font-extrabold text-indigo-900">{selectedJob.erpSource}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Target Cloud Infrastructure:</span>
                  <span className="font-extrabold text-indigo-900">{selectedJob.targetCloud}</span>
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => handleBoost(selectedJob.id)}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4 text-emerald-200" />
                <span>Scale Up (+4 Workers / +16GB)</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {onSelectCustomerWorkspace && customers.find((c) => c.id === selectedJob.customerId) && (
                  <button
                    onClick={() => {
                      const match = customers.find((c) => c.id === selectedJob.customerId);
                      if (match) onSelectCustomerWorkspace(match);
                      setSelectedJob(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Open Workspace</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
