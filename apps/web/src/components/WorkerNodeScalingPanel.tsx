import React, { useState, useEffect } from 'react';
import {
  Cpu,
  HardDrive,
  Server,
  Zap,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  Layers,
  Activity,
  Flame,
  Sparkles,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
  Check,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Info,
} from 'lucide-react';

export const WorkerNodeScalingPanel: React.FC = () => {
  // Master Auto-Scaling Configuration State
  const [autoScaleEnabled, setAutoScaleEnabled] = useState<boolean>(true);
  const [autoScaleMode, setAutoScaleMode] = useState<'Reactive' | 'Predictive' | 'Scheduled'>('Reactive');

  // Threshold Configuration
  const [cpuThresholdPct, setCpuThresholdPct] = useState<number>(80);
  const [ramThresholdPct, setRamThresholdPct] = useState<number>(85);
  const [diskThresholdPct, setDiskThresholdPct] = useState<number>(75);

  // Cluster Boundaries
  const [minNodes, setMinNodes] = useState<number>(16);
  const [maxNodes, setMaxNodes] = useState<number>(256);
  const [stepSizeNodes, setStepSizeNodes] = useState<number>(16);
  const [cooldownMins, setCooldownMins] = useState<number>(5);

  // Load Scenario Simulation Toggle State
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(true);
  const [isSimulatingPass, setIsSimulatingPass] = useState<boolean>(false);
  const [simScenarioPreset, setSimScenarioPreset] = useState<
    'Light Baseline' | 'Medium Peak Batch' | 'Heavy Migration Stress' | 'Custom Load'
  >('Heavy Migration Stress');

  // Simulated Load Input Parameters
  const [simCpuLoad, setSimCpuLoad] = useState<number>(92);
  const [simRamLoad, setSimRamLoad] = useState<number>(82);
  const [simDiskLoad, setSimDiskLoad] = useState<number>(88);
  const [simTrafficRecordsSec, setSimTrafficRecordsSec] = useState<number>(240000);

  // Trace Log
  const [simulationLogs, setSimulationLogs] = useState<
    { timestamp: string; level: 'INFO' | 'WARN' | 'SUCCESS'; message: string }[]
  >([
    {
      timestamp: '05:18:02',
      level: 'INFO',
      message: 'Worker Node Scaling Engine initialized with Kubernetes pod scheduler.',
    },
    {
      timestamp: '05:20:15',
      level: 'WARN',
      message: 'Simulated Load Scenario: Heavy Migration Stress active (CPU 92%, Disk 88%).',
    },
    {
      timestamp: '05:20:16',
      level: 'SUCCESS',
      message: 'Auto-scaler triggered! Spawning +128 worker pods. Pool scaled to 144 concurrent workers.',
    },
  ]);

  // Handle Preset Selection
  const applyPresetScenario = (
    preset: 'Light Baseline' | 'Medium Peak Batch' | 'Heavy Migration Stress' | 'Custom Load'
  ) => {
    setSimScenarioPreset(preset);
    if (preset === 'Light Baseline') {
      setSimCpuLoad(42);
      setSimRamLoad(55);
      setSimDiskLoad(40);
      setSimTrafficRecordsSec(65000);
    } else if (preset === 'Medium Peak Batch') {
      setSimCpuLoad(78);
      setSimRamLoad(74);
      setSimDiskLoad(72);
      setSimTrafficRecordsSec(145000);
    } else if (preset === 'Heavy Migration Stress') {
      setSimCpuLoad(92);
      setSimRamLoad(88);
      setSimDiskLoad(94);
      setSimTrafficRecordsSec(320000);
    }
  };

  // Compute Spawned Workers under Load
  const calculateSpawnedWorkers = () => {
    if (!autoScaleEnabled) {
      return {
        spawnedWorkers: minNodes,
        baseWorkers: minNodes,
        autoSpawnedWorkers: 0,
        breachedTriggers: ['Auto-Scaling Disabled (Manual Pool)'],
        isBreached: false,
      };
    }

    const cpuBreached = isSimulationActive ? simCpuLoad >= cpuThresholdPct : false;
    const ramBreached = isSimulationActive ? simRamLoad >= ramThresholdPct : false;
    const diskBreached = isSimulationActive ? simDiskLoad >= diskThresholdPct : false;

    const breachedTriggers: string[] = [];
    if (cpuBreached) breachedTriggers.push(`CPU Saturation (${simCpuLoad}% ≥ ${cpuThresholdPct}%)`);
    if (ramBreached) breachedTriggers.push(`RAM / Heap Pressure (${simRamLoad}% ≥ ${ramThresholdPct}%)`);
    if (diskBreached) breachedTriggers.push(`Disk Queue Backlog (${simDiskLoad}% ≥ ${diskThresholdPct}%)`);

    const isBreached = breachedTriggers.length > 0;

    if (!isBreached || !isSimulationActive) {
      return {
        spawnedWorkers: minNodes,
        baseWorkers: minNodes,
        autoSpawnedWorkers: 0,
        breachedTriggers: ['Operating within normal threshold parameters'],
        isBreached: false,
      };
    }

    // Calculate scaling magnitude
    const cpuFactor = cpuBreached ? (simCpuLoad - cpuThresholdPct) / (100 - cpuThresholdPct) : 0;
    const ramFactor = ramBreached ? (simRamLoad - ramThresholdPct) / (100 - ramThresholdPct) : 0;
    const diskFactor = diskBreached ? (simDiskLoad - diskThresholdPct) / (100 - diskThresholdPct) : 0;

    const maxFactor = Math.max(cpuFactor, ramFactor, diskFactor);
    const stepsNeeded = Math.ceil(maxFactor * ((maxNodes - minNodes) / stepSizeNodes));
    const autoSpawned = Math.min(maxNodes - minNodes, Math.max(stepSizeNodes, stepsNeeded * stepSizeNodes));
    const totalWorkers = Math.min(maxNodes, minNodes + autoSpawned);

    return {
      spawnedWorkers: totalWorkers,
      baseWorkers: minNodes,
      autoSpawnedWorkers: autoSpawned,
      breachedTriggers,
      isBreached: true,
    };
  };

  const scaleResult = calculateSpawnedWorkers();

  const handleRunSimulationPass = () => {
    setIsSimulatingPass(true);
    setIsSimulationActive(true); // Ensure simulation is on so sliders are used

    setTimeout(() => {
      // Calculate using current state values
      const cpuBreached = simCpuLoad >= cpuThresholdPct;
      const ramBreached = simRamLoad >= ramThresholdPct;
      const diskBreached = simDiskLoad >= diskThresholdPct;

      const breachedTriggers: string[] = [];
      if (cpuBreached) breachedTriggers.push(`CPU Saturation (${simCpuLoad}% ≥ ${cpuThresholdPct}%)`);
      if (ramBreached) breachedTriggers.push(`RAM / Heap Pressure (${simRamLoad}% ≥ ${ramThresholdPct}%)`);
      if (diskBreached) breachedTriggers.push(`Disk Queue Backlog (${simDiskLoad}% ≥ ${diskThresholdPct}%)`);

      const isBreached = breachedTriggers.length > 0;
      let totalWorkers = minNodes;
      let autoSpawned = 0;

      if (isBreached) {
        const cpuFactor = cpuBreached ? (simCpuLoad - cpuThresholdPct) / (100 - cpuThresholdPct) : 0;
        const ramFactor = ramBreached ? (simRamLoad - ramThresholdPct) / (100 - ramThresholdPct) : 0;
        const diskFactor = diskBreached ? (simDiskLoad - diskThresholdPct) / (100 - diskThresholdPct) : 0;

        const maxFactor = Math.max(cpuFactor, ramFactor, diskFactor);
        const stepsNeeded = Math.ceil(maxFactor * ((maxNodes - minNodes) / stepSizeNodes));
        autoSpawned = Math.min(maxNodes - minNodes, Math.max(stepSizeNodes, stepsNeeded * stepSizeNodes));
        totalWorkers = Math.min(maxNodes, minNodes + autoSpawned);
      }

      const timestamp = new Date().toLocaleTimeString();
      const newLog = {
        timestamp,
        level: isBreached ? ('WARN' as const) : ('INFO' as const),
        message: `[Manual Run Pass] Simulated CPU: ${simCpuLoad}%, RAM: ${simRamLoad}%, Disk: ${simDiskLoad}%. Status: ${
          isBreached
            ? `AUTOSCALE TRIGGERED -> Spawned +${autoSpawned} pods (Total: ${totalWorkers} pods).`
            : `Metrics below thresholds. Pool stable at baseline ${totalWorkers} pods.`
        }`,
      };
      setSimulationLogs((prev) => [newLog, ...prev].slice(0, 10));
      setIsSimulatingPass(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Gauge className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Worker Node Auto-Scaling & Load Simulator
            </h1>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold font-mono rounded-full">
              K8s Pod Scheduler
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Configure dynamic auto-scaling policies for CPU, RAM, and Disk utilization thresholds. Use the live simulation engine to preview how many concurrent migration worker nodes will be spawned under custom load scenarios.
          </p>
        </div>

        {/* Master Enable/Disable Auto-Scaling Switch */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shrink-0">
          <span className="text-xs font-bold text-slate-700">Auto-Scaler Policy:</span>
          <button
            type="button"
            onClick={() => setAutoScaleEnabled(!autoScaleEnabled)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              autoScaleEnabled
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{autoScaleEnabled ? 'ENABLED (ACTIVE)' : 'DISABLED (MANUAL)'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Policy Threshold Configuration & Simulation Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Auto-Scaling Threshold Rules Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                1. Utilization Trigger Thresholds
              </h2>
              <span className="text-[10px] font-mono text-slate-400">Rule Engine v2.4</span>
            </div>

            {/* Threshold 1: CPU Utilization */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  CPU Saturation Threshold
                </label>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  &gt; {cpuThresholdPct}%
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={95}
                step={5}
                value={cpuThresholdPct}
                onChange={(e) => setCpuThresholdPct(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Conservative (50%)</span>
                <span>Balanced (80%)</span>
                <span>Aggressive (95%)</span>
              </div>
            </div>

            {/* Threshold 2: RAM Utilization */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-indigo-600" />
                  RAM / Heap Pressure Threshold
                </label>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  &gt; {ramThresholdPct}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={ramThresholdPct}
                onChange={(e) => setRamThresholdPct(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>JVM Guard (60%)</span>
                <span>Standard (85%)</span>
                <span>Max Heap (95%)</span>
              </div>
            </div>

            {/* Threshold 3: Disk I/O Queue Utilization */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-indigo-600" />
                  Disk I/O & Storage Backlog
                </label>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  &gt; {diskThresholdPct}%
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={95}
                step={5}
                value={diskThresholdPct}
                onChange={(e) => setDiskThresholdPct(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>NVMe Flush (50%)</span>
                <span>Optimal (75%)</span>
                <span>I/O Bound (90%)</span>
              </div>
            </div>

            {/* Cluster Pool Boundaries */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Cluster Pool Bounds & Scaling Step
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Minimum Nodes</label>
                  <select
                    value={minNodes}
                    onChange={(e) => setMinNodes(Number(e.target.value))}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                  >
                    <option value={8}>8 Worker Pods</option>
                    <option value={16}>16 Worker Pods</option>
                    <option value={32}>32 Worker Pods</option>
                    <option value={64}>64 Worker Pods</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Maximum Ceiling</label>
                  <select
                    value={maxNodes}
                    onChange={(e) => setMaxNodes(Number(e.target.value))}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                  >
                    <option value={128}>128 Worker Pods</option>
                    <option value={256}>256 Worker Pods</option>
                    <option value={512}>512 Worker Pods</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Pods Added Per Scale Event</label>
                <select
                  value={stepSizeNodes}
                  onChange={(e) => setStepSizeNodes(Number(e.target.value))}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                >
                  <option value={8}>+8 Worker Pods (+32 vCPU Cores)</option>
                  <option value={16}>+16 Worker Pods (+64 vCPU Cores)</option>
                  <option value={32}>+32 Worker Pods (+128 vCPU Cores)</option>
                </select>
              </div>
            </div>

            {/* Scaling Mode Selection Cards */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Scaling Strategy Mode
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['Reactive', 'Predictive', 'Scheduled'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAutoScaleMode(m)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                      autoScaleMode === m
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Load Scenario Simulation & Worker Spawn Preview */}
        <div className="lg:col-span-7 space-y-6">
          {/* Simulation Header & Toggle Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5 bg-gradient-to-r from-slate-50 via-white to-indigo-50/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                  <h2 className="text-base font-black tracking-tight text-slate-900">
                    Load Scenario Simulation Engine
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulate high migration traffic loads to preview expected worker pod scaling behavior.
                </p>
              </div>

              {/* Simulation Active Toggle */}
              <button
                type="button"
                onClick={() => setIsSimulationActive(!isSimulationActive)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSimulationActive
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Activity className={`w-4 h-4 ${isSimulationActive ? 'animate-pulse' : ''}`} />
                <span>{isSimulationActive ? 'SIMULATION ON' : 'ENABLE SIMULATION'}</span>
              </button>
            </div>

            {/* Load Scenario Presets */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Select Load Scenario Preset:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(
                  [
                    'Light Baseline',
                    'Medium Peak Batch',
                    'Heavy Migration Stress',
                  ] as const
                ).map((preset) => {
                  const isSelected = simScenarioPreset === preset && isSimulationActive;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyPresetScenario(preset)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold block">{preset}</span>
                      <span className={`text-[10px] font-mono mt-1 block ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {preset === 'Light Baseline'
                          ? 'CPU 42% / Disk 40%'
                          : preset === 'Medium Peak Batch'
                          ? 'CPU 78% / Disk 72%'
                          : 'CPU 92% / Disk 94%'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Load Sliders */}
            {isSimulationActive && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 shadow-3xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-600 animate-pulse" />
                    Custom Load Injection Sliders
                  </span>
                  <button
                    type="button"
                    onClick={handleRunSimulationPass}
                    disabled={isSimulatingPass}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-3xs disabled:opacity-60"
                  >
                    {isSimulatingPass ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-white" />
                    ) : (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                    <span>{isSimulatingPass ? 'Running Simulation...' : 'Run Simulation Pass'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  {/* Simulated CPU Load */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-600">Sim CPU Load</span>
                      <strong className={simCpuLoad >= cpuThresholdPct ? 'text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200' : 'text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200'}>
                        {simCpuLoad}%
                      </strong>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={simCpuLoad}
                      onChange={(e) => {
                        setSimCpuLoad(Number(e.target.value));
                        setSimScenarioPreset('Custom Load');
                      }}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Simulated RAM Load */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-600">Sim RAM Pressure</span>
                      <strong className={simRamLoad >= ramThresholdPct ? 'text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200' : 'text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200'}>
                        {simRamLoad}%
                      </strong>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={simRamLoad}
                      onChange={(e) => {
                        setSimRamLoad(Number(e.target.value));
                        setSimScenarioPreset('Custom Load');
                      }}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Simulated Disk Load */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-600">Sim Disk I/O Backlog</span>
                      <strong className={simDiskLoad >= diskThresholdPct ? 'text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200' : 'text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200'}>
                        {simDiskLoad}%
                      </strong>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={simDiskLoad}
                      onChange={(e) => {
                        setSimDiskLoad(Number(e.target.value));
                        setSimScenarioPreset('Custom Load');
                      }}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIMULATION PREVIEW RESULT CARD */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Live Preview: Spawned Worker Nodes Calculation
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculated concurrent worker pod capacity based on current threshold triggers.
                </p>
              </div>

              <span
                className={`px-3 py-1 text-xs font-bold font-mono rounded-full border ${
                  scaleResult.isBreached
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {scaleResult.isBreached ? 'Scale-Up Triggered' : 'Stable Baseline'}
              </span>
            </div>

            {/* Metric Banner Display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
                  Spawned Concurrent Workers
                </span>
                <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                  {scaleResult.spawnedWorkers} <span className="text-xs font-semibold text-slate-500">Pods</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {scaleResult.baseWorkers} Base + {scaleResult.autoSpawnedWorkers} Auto-Spawned
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
                  Total Provisioned vCPU Cores
                </span>
                <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                  {scaleResult.spawnedWorkers * 4} Cores
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {(scaleResult.spawnedWorkers * 4).toLocaleString()} Parallel Threads
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
                  Max Ingestion Throughput
                </span>
                <div className="text-2xl font-black text-indigo-600 tracking-tight font-mono">
                  {((scaleResult.spawnedWorkers / 128) * 145000 / 1000).toFixed(1)}k
                  <span className="text-xs text-slate-500 font-normal"> rec/sec</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  RAM Allocated: {scaleResult.spawnedWorkers * 4} GB
                </div>
              </div>
            </div>

            {/* Active Triggers Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Threshold Evaluation Triggers & Scaling Drivers:
              </span>
              <div className="space-y-2">
                {scaleResult.breachedTriggers.map((trig, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs font-mono font-semibold flex items-center justify-between ${
                      scaleResult.isBreached
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {scaleResult.isBreached ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {trig}
                    </span>
                    <span className="text-[10px] font-bold uppercase">
                      {scaleResult.isBreached ? 'Threshold Exceeded' : 'Normal'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Pod Topology Grid Preview */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Worker Topology Preview ({scaleResult.spawnedWorkers} Simulated Instances)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Showing first 32 pod allocations
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {Array.from({ length: Math.min(32, scaleResult.spawnedWorkers) }).map((_, i) => {
                  const isAutoSpawned = i >= scaleResult.baseWorkers;
                  return (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border text-center font-mono text-[10px] space-y-1 transition-all ${
                        isAutoSpawned
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold animate-pulse'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div>Pod-{i + 1}</div>
                      <span
                        className={`inline-block px-1 rounded text-[9px] ${
                          isAutoSpawned
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isAutoSpawned ? 'SPAWNED' : 'BASE'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Execution Trace Log Terminal */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 space-y-2 shadow-3xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] text-indigo-650 uppercase font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  Auto-Scaler Telemetry & Rule Execution Trace Log
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase font-mono">Rule Engine OK</span>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1 font-mono">
                {simulationLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] border-b border-slate-50/50 pb-1.5 last:border-0">
                    <span className="text-slate-400 shrink-0 font-bold">[{log.timestamp}]</span>
                    <span
                      className={
                        log.level === 'WARN'
                          ? 'text-amber-700 font-bold'
                          : log.level === 'SUCCESS'
                          ? 'text-emerald-750 font-bold'
                          : 'text-indigo-650 font-medium'
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
