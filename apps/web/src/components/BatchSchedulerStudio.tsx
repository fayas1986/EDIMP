import React, { useState, useEffect } from 'react';
import { MigrationJob } from '../types';
import {
  Clock,
  Calendar,
  GitFork,
  ArrowRight,
  Play,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RefreshCw,
  Settings,
  Trash2,
  Plus,
  Search,
  Move,
  Layers,
  Timer,
  Activity,
  Filter,
  Sparkles,
  CalendarDays,
  CornerDownRight,
  Link,
  Unlink,
  Server,
  Info,
  ChevronRight,
  X,
  Check
} from 'lucide-react';

interface BatchSchedulerStudioProps {
  jobs: MigrationJob[];
  setJobs: React.Dispatch<React.SetStateAction<MigrationJob[]>>;
  logToConsole?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

// 12 Time Slot Lanes for 24-hour Schedule Grid
const TIME_SLOTS = [
  { id: 'slot-00', timeLabel: '00:00 UTC', windowName: 'Night Batch Slot 1', period: 'Night' },
  { id: 'slot-02', timeLabel: '02:00 UTC', windowName: 'Night Batch Slot 2', period: 'Night' },
  { id: 'slot-04', timeLabel: '04:00 UTC', windowName: 'Early Morning Slot 1', period: 'Night' },
  { id: 'slot-06', timeLabel: '06:00 UTC', windowName: 'Early Morning Slot 2', period: 'Morning' },
  { id: 'slot-08', timeLabel: '08:00 UTC', windowName: 'Business Hours Start', period: 'Morning' },
  { id: 'slot-10', timeLabel: '10:00 UTC', windowName: 'Mid-Morning Sync', period: 'Morning' },
  { id: 'slot-12', timeLabel: '12:00 UTC', windowName: 'Midday Delta Sync', period: 'Afternoon' },
  { id: 'slot-14', timeLabel: '14:00 UTC', windowName: 'Afternoon Sync', period: 'Afternoon' },
  { id: 'slot-16', timeLabel: '16:00 UTC', windowName: 'Peak Hours Delta', period: 'Afternoon' },
  { id: 'slot-18', timeLabel: '18:00 UTC', windowName: 'Evening Ingestion', period: 'Evening' },
  { id: 'slot-20', timeLabel: '20:00 UTC', windowName: 'Off-Peak Evening', period: 'Evening' },
  { id: 'slot-22', timeLabel: '22:00 UTC', windowName: 'Late Night Reconciliation', period: 'Evening' },
];

export const BatchSchedulerStudio: React.FC<BatchSchedulerStudioProps> = ({
  jobs,
  setJobs,
  logToConsole
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobs[0]?.id || null);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'dependencies'>('timeline');
  const [isSimulatingCascade, setIsSimulatingCascade] = useState(false);
  const [activeCascadeStep, setActiveCascadeStep] = useState<number>(-1);
  const [notification, setNotification] = useState<string | null>(null);

  // Filtered jobs pool
  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    return (
      job.jobName.toLowerCase().includes(q) ||
      job.sourceConnectorName.toLowerCase().includes(q) ||
      job.destConnectorName.toLowerCase().includes(q)
    );
  });

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper to get assigned slot ID for a job
  const getJobSlotId = (job: MigrationJob): string => {
    if (!job.scheduledTimeWindow) return 'slot-02'; // default fallback
    const match = TIME_SLOTS.find((s) => s.timeLabel === job.scheduledTimeWindow || s.id === job.scheduledTimeWindow);
    return match ? match.id : 'slot-02';
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    setDraggedJobId(jobId);
    e.dataTransfer.setData('text/plain', jobId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlotId !== slotId) {
      setDragOverSlotId(slotId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSlotId(null);
  };

  const handleDrop = (e: React.DragEvent, targetSlotId: string) => {
    e.preventDefault();
    setDragOverSlotId(null);
    const jobId = e.dataTransfer.getData('text/plain') || draggedJobId;

    if (!jobId) return;

    const slot = TIME_SLOTS.find((s) => s.id === targetSlotId);
    if (!slot) return;

    setJobs((prevJobs) =>
      prevJobs.map((j) => {
        if (j.id === jobId) {
          return {
            ...j,
            scheduledTimeWindow: slot.timeLabel,
            scheduleType: j.scheduleType === 'Manual' ? 'Scheduled' : j.scheduleType,
            startTime: `${slot.timeLabel} (${slot.windowName})`,
            recurringInterval: j.recurringInterval || 'Daily',
            timezone: j.timezone || 'UTC',
          };
        }
        return j;
      })
    );

    const targetJob = jobs.find((j) => j.id === jobId);
    const jobTitle = targetJob?.jobName || 'Batch Job';
    const msg = `Scheduled "${jobTitle}" to ${slot.timeLabel} (${slot.windowName})`;

    showToast(msg);
    if (logToConsole) {
      logToConsole(`SCHEDULE UPDATED: "${jobTitle}" moved to time window ${slot.timeLabel}.`, 'info');
    }

    setDraggedJobId(null);
  };

  // Update specific job property
  const handleUpdateJobProperty = (key: keyof MigrationJob, value: any) => {
    if (!selectedJobId) return;

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === selectedJobId) {
          return { ...j, [key]: value };
        }
        return j;
      })
    );
  };

  // Toggle Dependency
  const handleToggleDependency = (prereqJobId: string) => {
    if (!selectedJobId || selectedJobId === prereqJobId) return;

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === selectedJobId) {
          const currentDeps = j.dependsOnJobIds || [];
          const exists = currentDeps.includes(prereqJobId);
          const updatedDeps = exists
            ? currentDeps.filter((id) => id !== prereqJobId)
            : [...currentDeps, prereqJobId];

          return {
            ...j,
            dependsOnJobIds: updatedDeps,
            scheduleType: updatedDeps.length > 0 ? 'DependencyTrigger' : j.scheduleType,
          };
        }
        return j;
      })
    );

    const prereqJob = jobs.find((j) => j.id === prereqJobId);
    showToast(`Dependency trigger toggled for "${prereqJob?.jobName}"`);
  };

  // Simulate Cascade Triggering
  const handleRunCascadeSimulation = () => {
    setIsSimulatingCascade(true);
    setActiveCascadeStep(0);
    showToast('Starting Batch Job Dependency Trigger Simulation...');

    if (logToConsole) {
      logToConsole('TRIGGER CASCADE: Initiating scheduled dependency resolution test...', 'info');
    }

    // Topological order or sequential simulation
    const stepsCount = TIME_SLOTS.length;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step >= stepsCount) {
        clearInterval(interval);
        setIsSimulatingCascade(false);
        setActiveCascadeStep(-1);
        showToast('Dependency Trigger Simulation Complete! All scheduled jobs evaluated.');
        if (logToConsole) {
          logToConsole('SUCCESS: All dependency triggers resolved. No deadlock found in schedule DAG.', 'success');
        }
        return;
      }

      setActiveCascadeStep(step);
      const currentSlot = TIME_SLOTS[step];
      const jobsInSlot = jobs.filter((j) => getJobSlotId(j) === currentSlot.id);

      if (jobsInSlot.length > 0 && logToConsole) {
        jobsInSlot.forEach((j) => {
          logToConsole(
            `EXECUTION: Time Window ${currentSlot.timeLabel} -> Launching "${j.jobName}" (${j.recurringInterval || 'Daily'}). Dependencies: ${
              j.dependsOnJobIds?.length || 0
            }`,
            'info'
          );
        });
      }
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-xs font-medium flex items-center gap-2 animate-fade-in shadow-sm">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Scheduler Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <CalendarDays className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Batch Migration Drag & Drop Schedule Planner
            </h3>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
              24h Time Grid & Dependency Engine
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Drag batch jobs onto execution time slots, configure recurring cron schedules, and establish automated dependency triggers.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2">
          {/* View Tab Selector */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Time Grid</span>
            </button>
            <button
              onClick={() => setActiveTab('dependencies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dependencies'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Dependency Matrix</span>
            </button>
          </div>

          <button
            onClick={handleRunCascadeSimulation}
            disabled={isSimulatingCascade}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSimulatingCascade ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 fill-current" />
            )}
            <span>{isSimulatingCascade ? 'Testing Cascade...' : 'Test Trigger Cascade'}</span>
          </button>
        </div>
      </div>

      {/* Main Scheduler Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pool: Unscheduled & Available Batch Migration Jobs */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-indigo-600" />
              Batch Job Pool
            </h4>
            <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono">
              {filteredJobs.length} Jobs
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
            />
          </div>

          {/* Draggable Job Cards List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[520px] pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {filteredJobs.map((job) => {
              const isSelected = job.id === selectedJobId;
              const slot = TIME_SLOTS.find((s) => s.id === getJobSlotId(job));
              const hasDeps = (job.dependsOnJobIds?.length || 0) > 0;

              return (
                <div
                  key={job.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, job.id)}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`group p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing select-none relative space-y-2 shadow-2xs ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border bg-indigo-50 text-indigo-600 border-indigo-100 font-mono">
                      {job.mode}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Move className="w-3 h-3 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      <span>Drag to Slot</span>
                    </span>
                  </div>

                  {/* Job Title & Pathway */}
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {job.jobName}
                    </h5>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                      {job.sourceConnectorName} → {job.destConnectorName}
                    </p>
                  </div>

                  {/* Schedule Details Footer */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1.5 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>{slot?.timeLabel || '02:00 UTC'}</span>
                    </span>
                    {hasDeps && (
                      <span className="text-amber-600 flex items-center gap-1 font-bold">
                        <GitFork className="w-3 h-3 text-amber-500" />
                        <span>{job.dependsOnJobIds?.length} Dep</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Canvas: 24-Hour Interactive Drop Schedule Time Grid or Dependency Matrix */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col shadow-sm min-h-[550px] space-y-4">
          {activeTab === 'timeline' ? (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  24-Hour Scheduled Execution Time Lanes
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Drop batch job cards onto any target time window
                </span>
              </div>

              {/* Time Slots Rows */}
              <div className="space-y-2.5">
                {TIME_SLOTS.map((slot, index) => {
                  const isDragOver = dragOverSlotId === slot.id;
                  const isSimulatingActive = activeCascadeStep === index;
                  const jobsInThisSlot = jobs.filter((j) => getJobSlotId(j) === slot.id);

                  return (
                    <div
                      key={slot.id}
                      onDragOver={(e) => handleDragOver(e, slot.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, slot.id)}
                      className={`p-3 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                        isSimulatingActive
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                          : isDragOver
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 scale-[1.01]'
                          : 'bg-white hover:bg-slate-50 border-slate-100'
                      }`}
                    >
                      {/* Slot Time Badge */}
                      <div className="flex items-center gap-3 min-w-[170px] shrink-0">
                        <div
                          className={`p-2 rounded-lg font-mono font-bold text-xs border flex flex-col items-center justify-center min-w-[70px] ${
                            isSimulatingActive
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-slate-50 text-indigo-600 border-indigo-100'
                          }`}
                        >
                          <span>{slot.timeLabel}</span>
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">{slot.windowName}</h5>
                          <span className="text-[10px] text-slate-500 font-mono">{slot.period} Window</span>
                        </div>
                      </div>

                      {/* Drop Target & Scheduled Jobs Container */}
                      <div className="flex-1 flex flex-wrap items-center gap-2 min-h-[42px] p-1.5 rounded-lg bg-slate-50 border border-slate-100 border-dashed">
                        {jobsInThisSlot.length === 0 ? (
                          <span className="text-[10px] text-slate-400 font-mono italic px-2">
                            Drop job here to schedule for {slot.timeLabel}
                          </span>
                        ) : (
                          jobsInThisSlot.map((job) => {
                            const isSelected = job.id === selectedJobId;
                            const hasDeps = (job.dependsOnJobIds?.length || 0) > 0;

                            return (
                              <div
                                key={job.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, job.id)}
                                onClick={() => setSelectedJobId(job.id)}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-grab active:cursor-grabbing flex items-center gap-2 shadow-2xs ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-sm'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                                <span className="truncate max-w-[130px] font-medium">{job.jobName}</span>
                                {hasDeps && (
                                  <span
                                    className="px-1 bg-amber-100 text-amber-700 border border-amber-200 rounded text-[9px] font-mono font-bold"
                                    title={`Depends on ${job.dependsOnJobIds?.length} parent jobs`}
                                  >
                                    Dep ({job.dependsOnJobIds?.length})
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Dependency Trigger Visualizer */
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-amber-600" />
                  Prerequisite & Dependency Trigger Topology
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Click any job to configure prerequisite triggers
                </span>
              </div>

              <div className="space-y-3">
                {jobs.map((job) => {
                  const isSelected = job.id === selectedJobId;
                  const prereqJobs = jobs.filter((j) => job.dependsOnJobIds?.includes(j.id));

                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 shadow-2xs ${
                        isSelected
                          ? 'bg-slate-50 border-indigo-500 shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded">
                            <Server className="w-3.5 h-3.5" />
                          </span>
                          <h5 className="font-bold text-xs text-slate-900">{job.jobName}</h5>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                          {job.scheduledTimeWindow || '02:00 UTC'} ({job.recurringInterval || 'Daily'})
                        </span>
                      </div>

                      {/* Dependencies List */}
                      <div className="pl-4 border-l-2 border-slate-200 space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
                          Upstream Trigger Prerequisites:
                        </span>
                        {prereqJobs.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">
                            No upstream dependencies (Executes independently on time schedule).
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {prereqJobs.map((prereq) => (
                              <span
                                key={prereq.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold"
                              >
                                <CornerDownRight className="w-3 h-3 text-amber-500" />
                                <span>{prereq.jobName}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Drawer: Selected Job Schedule & Dependency Configurator */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm space-y-4">
          {selectedJob ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-900">Schedule Configurator</h4>
                </div>
                <span className="text-[10px] text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-bold">
                  ID: {selectedJob.id}
                </span>
              </div>

              {/* Job Title Header */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Target Job</span>
                <h5 className="font-bold text-xs text-slate-900">{selectedJob.jobName}</h5>
                <p className="text-[10px] text-slate-500 font-mono">
                  {selectedJob.sourceConnectorName} → {selectedJob.destConnectorName}
                </p>
              </div>

              {/* Schedule Type Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Schedule Execution Trigger Type
                </label>
                <select
                  value={selectedJob.scheduleType || 'Scheduled'}
                  onChange={(e) => handleUpdateJobProperty('scheduleType', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="Scheduled">Time-Based Schedule</option>
                  <option value="DependencyTrigger">Dependency Triggered (Cascading)</option>
                  <option value="Manual">Manual On-Demand Only</option>
                </select>
              </div>

              {/* Recurring Interval Picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Recurring Interval Frequency
                </label>
                <select
                  value={selectedJob.recurringInterval || 'Daily'}
                  onChange={(e) => handleUpdateJobProperty('recurringInterval', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="One-time">One-time Run</option>
                  <option value="Hourly">Every Hour (Hourly)</option>
                  <option value="Daily">Daily (Specific Time Slot)</option>
                  <option value="Weekly">Weekly (Selected Days)</option>
                  <option value="Monthly">Monthly First Day</option>
                  <option value="Custom Cron">Custom Cron Expression</option>
                </select>
              </div>

              {/* Cron Expression Input if Custom Cron */}
              {selectedJob.recurringInterval === 'Custom Cron' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Cron Schedule Syntax
                  </label>
                  <input
                    type="text"
                    value={selectedJob.cronSchedule || '0 2 * * *'}
                    onChange={(e) => handleUpdateJobProperty('cronSchedule', e.target.value)}
                    placeholder="e.g. 0 2 * * *"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-emerald-700 focus:outline-hidden focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Executes at 02:00 AM UTC every day.
                  </span>
                </div>
              )}

              {/* Time Slot Picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Scheduled Time Window
                </label>
                <select
                  value={selectedJob.scheduledTimeWindow || '02:00 UTC'}
                  onChange={(e) => handleUpdateJobProperty('scheduledTimeWindow', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                >
                  {TIME_SLOTS.map((s) => (
                    <option key={s.id} value={s.timeLabel}>
                      {s.timeLabel} ({s.windowName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Prerequisite Trigger Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Prerequisite Dependency Triggers</span>
                  <span className="text-indigo-600 font-mono font-bold">
                    {selectedJob.dependsOnJobIds?.length || 0} Selected
                  </span>
                </label>
                <p className="text-[10px] text-slate-400">
                  Select upstream jobs that must complete successfully before launching this job:
                </p>

                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {jobs
                    .filter((other) => other.id !== selectedJob.id)
                    .map((other) => {
                      const isChecked = selectedJob.dependsOnJobIds?.includes(other.id) || false;

                      return (
                        <div
                          key={other.id}
                          onClick={() => handleToggleDependency(other.id)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors shadow-2xs ${
                            isChecked
                              ? 'bg-amber-50 border-amber-300 text-amber-700'
                              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-slate-800 truncate">{other.jobName}</span>
                          </div>
                          {isChecked ? (
                            <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-xs text-slate-500">
                Select any batch migration job from the pool or grid to configure start times, cron intervals, and triggers.
              </p>
            </div>
          )}

          {/* Footer Metadata */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[10px] text-slate-500 font-mono">
            <div className="flex justify-between">
              <span>Total Batch Jobs:</span>
              <strong className="text-slate-900">{jobs.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Scheduled Triggers:</span>
              <strong className="text-emerald-600">
                {jobs.filter((j) => (j.dependsOnJobIds?.length || 0) > 0 || j.scheduleType === 'Scheduled').length}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
