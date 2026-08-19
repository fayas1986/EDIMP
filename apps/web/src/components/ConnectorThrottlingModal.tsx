import React, { useState, useEffect } from 'react';
import { Connector, ThrottlingConfig } from '../types';
import {
  Gauge,
  Zap,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle2,
  X,
  RefreshCw,
  Clock,
  Layers,
  Activity,
  Info,
} from 'lucide-react';

interface ConnectorThrottlingModalProps {
  connector: Connector | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (connectorId: string, config: ThrottlingConfig) => void;
}

export const ConnectorThrottlingModal: React.FC<ConnectorThrottlingModalProps> = ({
  connector,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !connector) return null;

  const initialConfig: ThrottlingConfig = connector.throttlingConfig || {
    isEnabled: true,
    maxRequestsPerSecond: 50,
    maxConcurrentRequests: 10,
    retryStrategy: 'ExponentialBackoff',
    maxRetries: 5,
    burstLimit: 75,
    autoCooldownOn429: true,
    cooldownPeriodSeconds: 30,
  };

  const [isEnabled, setIsEnabled] = useState<boolean>(initialConfig.isEnabled);
  const [maxRps, setMaxRps] = useState<number>(initialConfig.maxRequestsPerSecond);
  const [maxWorkers, setMaxWorkers] = useState<number>(initialConfig.maxConcurrentRequests);
  const [retryStrategy, setRetryStrategy] = useState<ThrottlingConfig['retryStrategy']>(
    initialConfig.retryStrategy
  );
  const [maxRetries, setMaxRetries] = useState<number>(initialConfig.maxRetries);
  const [burstLimit, setBurstLimit] = useState<number>(initialConfig.burstLimit || 75);
  const [autoCooldown, setAutoCooldown] = useState<boolean>(initialConfig.autoCooldownOn429);
  const [cooldownSecs, setCooldownSecs] = useState<number>(initialConfig.cooldownPeriodSeconds || 30);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<{
    processed: number;
    queued: number;
    dropped: number;
    durationSecs: number;
    peakRps: number;
    safetyScore: number;
  } | null>(null);

  useEffect(() => {
    if (connector) {
      const cfg = connector.throttlingConfig || {
        isEnabled: true,
        maxRequestsPerSecond: 50,
        maxConcurrentRequests: 10,
        retryStrategy: 'ExponentialBackoff',
        maxRetries: 5,
        burstLimit: 75,
        autoCooldownOn429: true,
        cooldownPeriodSeconds: 30,
      };
      setIsEnabled(cfg.isEnabled);
      setMaxRps(cfg.maxRequestsPerSecond);
      setMaxWorkers(cfg.maxConcurrentRequests);
      setRetryStrategy(cfg.retryStrategy);
      setMaxRetries(cfg.maxRetries);
      setBurstLimit(cfg.burstLimit || 75);
      setAutoCooldown(cfg.autoCooldownOn429);
      setCooldownSecs(cfg.cooldownPeriodSeconds || 30);
      setSimulationResult(null);
    }
  }, [connector]);

  const applyPreset = (preset: 'conservative' | 'standard' | 'high' | 'uncapped') => {
    switch (preset) {
      case 'conservative':
        setIsEnabled(true);
        setMaxRps(15);
        setMaxWorkers(4);
        setBurstLimit(25);
        setRetryStrategy('ExponentialBackoff');
        setMaxRetries(5);
        setAutoCooldown(true);
        setCooldownSecs(45);
        break;
      case 'standard':
        setIsEnabled(true);
        setMaxRps(50);
        setMaxWorkers(10);
        setBurstLimit(75);
        setRetryStrategy('ExponentialBackoff');
        setMaxRetries(5);
        setAutoCooldown(true);
        setCooldownSecs(30);
        break;
      case 'high':
        setIsEnabled(true);
        setMaxRps(150);
        setMaxWorkers(20);
        setBurstLimit(200);
        setRetryStrategy('ExponentialBackoff');
        setMaxRetries(4);
        setAutoCooldown(true);
        setCooldownSecs(20);
        break;
      case 'uncapped':
        setIsEnabled(false);
        setMaxRps(500);
        setMaxWorkers(32);
        setBurstLimit(500);
        setRetryStrategy('Linear');
        setMaxRetries(3);
        setAutoCooldown(false);
        break;
    }
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimulationResult(null);

    setTimeout(() => {
      const totalReqs = 100;
      const effectiveRps = isEnabled ? maxRps : 450;
      const durationSecs = Number((totalReqs / Math.max(1, effectiveRps)).toFixed(2));
      const queued = isEnabled && totalReqs > burstLimit ? totalReqs - burstLimit : 0;
      const dropped = !isEnabled ? 12 : 0;
      const safetyScore = isEnabled ? (effectiveRps <= 100 ? 99 : 88) : 52;

      setSimulationResult({
        processed: totalReqs - dropped,
        queued,
        dropped,
        durationSecs,
        peakRps: effectiveRps,
        safetyScore,
      });
      setIsSimulating(false);
    }, 1200);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ThrottlingConfig = {
      isEnabled,
      maxRequestsPerSecond: maxRps,
      maxConcurrentRequests: maxWorkers,
      retryStrategy,
      maxRetries,
      burstLimit,
      autoCooldownOn429: autoCooldown,
      cooldownPeriodSeconds: cooldownSecs,
    };
    onSave(connector.id, updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl my-8">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{connector.name}</h2>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold rounded">
                  {connector.provider}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                {connector.hostUrl || 'Configured API Target'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveSubmit} className="space-y-6">
          {/* Main Toggle Switch */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {isEnabled ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Enable API Rate Limiting & System Protection
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {isEnabled
                    ? 'Prevents target HTTP 429 rate-limiting bans and database thread exhaustion.'
                    : 'Unthrottled mode active. Risk of HTTP 429 Too Many Requests errors under load.'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEnabled(!isEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Quick Presets Bar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>Rate Limiting SLA Presets</span>
              <span className="text-[10px] text-slate-400 font-normal">Click to auto-configure</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('conservative')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isEnabled && maxRps === 15
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">Strict</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">15 req/s • 4 workers</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('standard')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isEnabled && maxRps === 50
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">Standard SLA</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">50 req/s • 10 workers</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('high')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isEnabled && maxRps === 150
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">High Capacity</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">150 req/s • 20 workers</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('uncapped')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  !isEnabled
                    ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs font-bold text-amber-900">Uncapped</div>
                <div className="text-[10px] text-amber-700 mt-0.5 font-mono">500 req/s • 32 workers</div>
              </button>
            </div>
          </div>

          {/* Rate Limits Sliders & Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Requests Per Second */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  Max Requests Per Second (RPS)
                </label>
                <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                  {maxRps} req/s
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={maxRps}
                onChange={(e) => setMaxRps(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>1 req/s</span>
                <span>250 req/s</span>
                <span>500 req/s</span>
              </div>
            </div>

            {/* Max Concurrent Requests */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Max Parallel Worker Threads
                </label>
                <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                  {maxWorkers} threads
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="32"
                step="1"
                value={maxWorkers}
                onChange={(e) => setMaxWorkers(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>1 thread</span>
                <span>16 threads</span>
                <span>32 threads</span>
              </div>
            </div>

            {/* Burst Request Allowance */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  Burst Request Allowance
                </label>
                <span className="text-xs font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                  {burstLimit} req burst
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                step="5"
                value={burstLimit}
                onChange={(e) => setBurstLimit(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Max Retries */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Max Retry Attempts
                </label>
                <span className="text-xs font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                  {maxRetries} attempts
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Retry Strategy & Auto Cooldown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Backoff Retry Algorithm
              </label>
              <select
                value={retryStrategy}
                onChange={(e) => setRetryStrategy(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="ExponentialBackoff">Exponential Backoff + Full Jitter (Recommended)</option>
                <option value="Linear">Linear Delay (1.5s step interval)</option>
                <option value="ImmediateRetry">Immediate Retry with Fixed Pause</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                HTTP 429 Auto-Cooldown Safety Net
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex-1 text-xs">
                  <input
                    type="checkbox"
                    checked={autoCooldown}
                    onChange={(e) => setAutoCooldown(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">Auto-Pause on 429</span>
                </label>
                {autoCooldown && (
                  <select
                    value={cooldownSecs}
                    onChange={(e) => setCooldownSecs(Number(e.target.value))}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  >
                    <option value={15}>15s Pause</option>
                    <option value={30}>30s Pause</option>
                    <option value={60}>60s Pause</option>
                    <option value={120}>2m Pause</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Rate Limiter Simulator Panel */}
          <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-100">Rate Limiter Load Simulator</span>
              </div>
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
              >
                {isSimulating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>{isSimulating ? 'Simulating Traffic...' : 'Simulate 100 API Calls'}</span>
              </button>
            </div>

            {simulationResult ? (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Batch Test Result:</span>
                  <span className="text-emerald-400 font-bold">
                    100 API Requests processed in {simulationResult.durationSecs}s
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block">Accepted Rate</span>
                    <span className="text-emerald-400 font-bold text-xs">{simulationResult.processed} / 100</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block">Queued Requests</span>
                    <span className="text-indigo-400 font-bold text-xs">{simulationResult.queued} buffered</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block">Safety Rating</span>
                    <span className="text-amber-400 font-bold text-xs">{simulationResult.safetyScore}% Protection</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Click simulate to test how this throttling profile handles a batch of 100 concurrent API calls against target endpoint constraints.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings apply immediately to all active migration pipelines.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Throttling Config</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
