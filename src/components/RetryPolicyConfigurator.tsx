import React, { useState } from 'react';
import { RetryPolicy } from '../types';
import {
  RotateCcw,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  Check,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  backoffStrategy: 'ExponentialWithJitter',
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  multiplier: 2.0,
  dlqAction: 'QuarantineToDLQ',
  dlqThresholdPct: 5,
  retryableErrors: {
    transientNetwork: true,
    rateLimits: true,
    timeout: true,
    databaseDeadlocks: true,
    schemaValidation: false,
  },
};

interface RetryPolicyConfiguratorProps {
  policy?: RetryPolicy;
  onChange?: (updatedPolicy: RetryPolicy) => void;
  compactMode?: boolean;
}

export const RetryPolicyConfigurator: React.FC<RetryPolicyConfiguratorProps> = ({
  policy = DEFAULT_RETRY_POLICY,
  onChange,
  compactMode = false,
}) => {
  const [currentPolicy, setCurrentPolicy] = useState<RetryPolicy>(policy);
  const [selectedPreset, setSelectedPreset] = useState<'Standard' | 'Aggressive' | 'Strict' | 'Custom'>('Standard');

  // Simulation state
  const [simErrorCode, setSimErrorCode] = useState<string>('HTTP_503_SERVICE_UNAVAILABLE');
  const [simRunning, setSimRunning] = useState<boolean>(false);
  const [simLogs, setSimLogs] = useState<{ step: string; delay: string; status: 'retrying' | 'success' | 'dlq' }[]>([]);

  const handleUpdate = (updated: RetryPolicy, preset: 'Standard' | 'Aggressive' | 'Strict' | 'Custom' = 'Custom') => {
    setCurrentPolicy(updated);
    setSelectedPreset(preset);
    if (onChange) {
      onChange(updated);
    }
  };

  const applyPreset = (presetKey: 'Standard' | 'Aggressive' | 'Strict') => {
    let p: RetryPolicy;
    if (presetKey === 'Standard') {
      p = {
        maxRetries: 3,
        backoffStrategy: 'ExponentialWithJitter',
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        multiplier: 2.0,
        dlqAction: 'QuarantineToDLQ',
        dlqThresholdPct: 5,
        retryableErrors: {
          transientNetwork: true,
          rateLimits: true,
          timeout: true,
          databaseDeadlocks: true,
          schemaValidation: false,
        },
      };
    } else if (presetKey === 'Aggressive') {
      p = {
        maxRetries: 5,
        backoffStrategy: 'Exponential',
        initialDelayMs: 500,
        maxDelayMs: 15000,
        multiplier: 1.8,
        dlqAction: 'QuarantineToDLQ',
        dlqThresholdPct: 10,
        retryableErrors: {
          transientNetwork: true,
          rateLimits: true,
          timeout: true,
          databaseDeadlocks: true,
          schemaValidation: false,
        },
      };
    } else {
      // Strict
      p = {
        maxRetries: 0,
        backoffStrategy: 'Fixed',
        initialDelayMs: 0,
        maxDelayMs: 0,
        multiplier: 1.0,
        dlqAction: 'PauseJob',
        dlqThresholdPct: 1,
        retryableErrors: {
          transientNetwork: false,
          rateLimits: false,
          timeout: false,
          databaseDeadlocks: false,
          schemaValidation: false,
        },
      };
    }
    handleUpdate(p, presetKey);
  };

  // Compute intervals for timeline preview
  const computeTimelineDelays = () => {
    const delays: number[] = [];
    let currentDelay = currentPolicy.initialDelayMs;

    for (let i = 1; i <= currentPolicy.maxRetries; i++) {
      let delay = currentDelay;
      if (currentPolicy.backoffStrategy === 'Linear') {
        delay = currentPolicy.initialDelayMs * i;
      } else if (currentPolicy.backoffStrategy === 'Exponential' || currentPolicy.backoffStrategy === 'ExponentialWithJitter') {
        delay = Math.min(currentPolicy.maxDelayMs, currentDelay);
        currentDelay = currentDelay * currentPolicy.multiplier;
      }
      delays.push(Math.round(delay));
    }
    return delays;
  };

  const timelineDelays = computeTimelineDelays();

  const runRetrySimulation = () => {
    setSimRunning(true);
    setSimLogs([]);

    const delays = computeTimelineDelays();
    const logs: typeof simLogs = [];

    // Is error code retryable?
    const isRetryable =
      simErrorCode.includes('503') || simErrorCode.includes('429') || simErrorCode.includes('TIMEOUT') || simErrorCode.includes('DEADLOCK');

    if (!isRetryable && !currentPolicy.retryableErrors.schemaValidation) {
      setTimeout(() => {
        setSimLogs([
          {
            step: 'Initial Attempt Failed: ' + simErrorCode,
            delay: '0ms',
            status: 'dlq',
          },
          {
            step: `Error non-retryable by policy rule. Sent directly to ${currentPolicy.dlqAction}`,
            delay: '0ms',
            status: 'dlq',
          },
        ]);
        setSimRunning(false);
      }, 600);
      return;
    }

    if (currentPolicy.maxRetries === 0) {
      setTimeout(() => {
        setSimLogs([
          {
            step: 'Initial Attempt Failed: ' + simErrorCode,
            delay: '0ms',
            status: 'dlq',
          },
          {
            step: `Max Retries set to 0. Executing DLQ Action: ${currentPolicy.dlqAction}`,
            delay: '0ms',
            status: 'dlq',
          },
        ]);
        setSimRunning(false);
      }, 600);
      return;
    }

    let t = 0;
    logs.push({ step: `Initial Execution Failed (${simErrorCode})`, delay: '0ms', status: 'retrying' });

    delays.forEach((delay, idx) => {
      t += 400;
      setTimeout(() => {
        const attempt = idx + 1;
        const isFinalPass = attempt === delays.length;
        if (isFinalPass) {
          logs.push({
            step: `Retry #${attempt} Succeeded after backoff delay (${delay}ms)`,
            delay: `${delay}ms`,
            status: 'success',
          });
        } else {
          logs.push({
            step: `Retry #${attempt} Failed. Backoff delay applied (${delay}ms)`,
            delay: `${delay}ms`,
            status: 'retrying',
          });
        }
        setSimLogs([...logs]);
        if (idx === delays.length - 1) {
          setSimRunning(false);
        }
      }, t);
    });
  };

  return (
    <div className="space-y-6">
      {/* Preset Strategy Bar */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
        <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-600" />
            Select Retry Policy Profile
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Active: <strong className="text-indigo-600">{selectedPreset} Policy</strong>
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <button
            type="button"
            onClick={() => applyPreset('Standard')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedPreset === 'Standard'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="font-bold flex items-center justify-between">
              <span>Standard Resiliency</span>
              {selectedPreset === 'Standard' && <Check className="w-4 h-4" />}
            </div>
            <p className={`text-[11px] mt-1 ${selectedPreset === 'Standard' ? 'text-indigo-100' : 'text-slate-500'}`}>
              3 Retries • Exponential + Jitter • DLQ 5% Threshold
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('Aggressive')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedPreset === 'Aggressive'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="font-bold flex items-center justify-between">
              <span>High-Volume Burst</span>
              {selectedPreset === 'Aggressive' && <Check className="w-4 h-4" />}
            </div>
            <p className={`text-[11px] mt-1 ${selectedPreset === 'Aggressive' ? 'text-indigo-100' : 'text-slate-500'}`}>
              5 Retries • Exponential • Fast 500ms initial backoff
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('Strict')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedPreset === 'Strict'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="font-bold flex items-center justify-between">
              <span>Fail Fast / Zero Retry</span>
              {selectedPreset === 'Strict' && <Check className="w-4 h-4" />}
            </div>
            <p className={`text-[11px] mt-1 ${selectedPreset === 'Strict' ? 'text-indigo-100' : 'text-slate-500'}`}>
              0 Retries • Immediate Quarantine / Pause Job
            </p>
          </button>
        </div>
      </div>

      {/* Main Form Sliders & Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Left Column: Backoff & Attempts */}
        <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-indigo-600" />
            Automatic Retry Counts & Backoff Math
          </h3>

          {/* Slider 1: Max Retries */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700">Max Automatic Retry Attempts</label>
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {currentPolicy.maxRetries} {currentPolicy.maxRetries === 1 ? 'Attempt' : 'Attempts'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={currentPolicy.maxRetries}
              onChange={(e) =>
                handleUpdate({ ...currentPolicy, maxRetries: Number(e.target.value) })
              }
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0 (No retries)</span>
              <span>5</span>
              <span>10 (Max)</span>
            </div>
          </div>

          {/* Strategy Dropdown */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Backoff Strategy Algorithm</label>
            <select
              value={currentPolicy.backoffStrategy}
              onChange={(e) =>
                handleUpdate({
                  ...currentPolicy,
                  backoffStrategy: e.target.value as RetryPolicy['backoffStrategy'],
                })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ExponentialWithJitter">Exponential Backoff with Random Jitter (Recommended)</option>
              <option value="Exponential">Pure Exponential Backoff (2^n)</option>
              <option value="Linear">Linear Step Delay (1s, 2s, 3s...)</option>
              <option value="Fixed">Fixed Interval Delay</option>
            </select>
          </div>

          {/* Initial Delay & Max Delay */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block text-[11px]">Initial Delay (ms)</label>
              <input
                type="number"
                step={250}
                value={currentPolicy.initialDelayMs}
                onChange={(e) =>
                  handleUpdate({ ...currentPolicy, initialDelayMs: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block text-[11px]">Max Delay Cap (ms)</label>
              <input
                type="number"
                step={1000}
                value={currentPolicy.maxDelayMs}
                onChange={(e) =>
                  handleUpdate({ ...currentPolicy, maxDelayMs: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Dead Letter Queue & Failure Thresholds */}
        <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            Dead Letter Queue (DLQ) & Terminal Failure Actions
          </h3>

          {/* Terminal Action Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Action on Max Retries Exhausted</label>
            <select
              value={currentPolicy.dlqAction}
              onChange={(e) =>
                handleUpdate({
                  ...currentPolicy,
                  dlqAction: e.target.value as RetryPolicy['dlqAction'],
                })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="QuarantineToDLQ">Quarantine Record to Dead Letter Queue (DLQ) & Continue Job</option>
              <option value="PauseJob">Auto-Pause Entire Migration Pipeline for Inspection</option>
              <option value="IgnoreAndContinue">Ignore Error & Log Warning Audit Entry</option>
            </select>
          </div>

          {/* DLQ Threshold % */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700">Auto-Pause Failure Threshold (%)</label>
              <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {currentPolicy.dlqThresholdPct}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={currentPolicy.dlqThresholdPct}
              onChange={(e) =>
                handleUpdate({ ...currentPolicy, dlqThresholdPct: Number(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 leading-tight">
              If more than {currentPolicy.dlqThresholdPct}% of batch records fail retries, the pipeline automatically halts execution to protect target database integrity.
            </p>
          </div>

          {/* Retryable Error Filters */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <label className="font-bold text-slate-800 block text-[11px]">Retryable Failure Categories</label>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentPolicy.retryableErrors.transientNetwork}
                  onChange={(e) =>
                    handleUpdate({
                      ...currentPolicy,
                      retryableErrors: { ...currentPolicy.retryableErrors, transientNetwork: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>HTTP 502/503/504 Network</span>
              </label>

              <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentPolicy.retryableErrors.rateLimits}
                  onChange={(e) =>
                    handleUpdate({
                      ...currentPolicy,
                      retryableErrors: { ...currentPolicy.retryableErrors, rateLimits: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>HTTP 429 Rate Limits</span>
              </label>

              <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentPolicy.retryableErrors.timeout}
                  onChange={(e) =>
                    handleUpdate({
                      ...currentPolicy,
                      retryableErrors: { ...currentPolicy.retryableErrors, timeout: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Read/Write Timeouts</span>
              </label>

              <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentPolicy.retryableErrors.databaseDeadlocks}
                  onChange={(e) =>
                    handleUpdate({
                      ...currentPolicy,
                      retryableErrors: { ...currentPolicy.retryableErrors, databaseDeadlocks: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>DB Deadlocks</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Backoff Timeline Diagram */}
      <div className="bg-white text-slate-800 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span className="text-xs font-bold text-slate-900">Configured Retry Backoff Timeline Visualizer</span>
          </div>
          <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full font-bold">
            {currentPolicy.maxRetries} Retries • Strategy: {currentPolicy.backoffStrategy}
          </span>
        </div>

        {currentPolicy.maxRetries === 0 ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-mono">
            ⚠ Zero retries configured. Any record failure will trigger DLQ Action ({currentPolicy.dlqAction}) immediately without delay.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1">
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-extrabold flex items-center gap-1.5 shrink-0 shadow-3xs">
              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Initial Fail</span>
            </div>

            {timelineDelays.map((delay, idx) => (
              <React.Fragment key={idx}>
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <span className="h-0.5 w-6 bg-indigo-200" />
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 font-bold font-mono shadow-3xs">
                    +{delay}ms
                  </span>
                  <span className="h-0.5 w-6 bg-indigo-200" />
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold flex items-center gap-1.5 shrink-0 shadow-3xs">
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Attempt #{idx + 1}</span>
                </div>
              </React.Fragment>
            ))}

            <div className="flex items-center gap-1 text-slate-400 text-[11px]">
              <span className="h-0.5 w-6 bg-emerald-200" />
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-bold flex items-center gap-1.5 shrink-0 shadow-3xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Resolved or DLQ</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Retry Policy Simulation Test Sandbox */}
      {!compactMode && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Test Sandbox: Simulate Failure & Backoff Behavior
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Run a real-time dry run test against your configured retry policy rules.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={simErrorCode}
                onChange={(e) => setSimErrorCode(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              >
                <option value="HTTP_503_SERVICE_UNAVAILABLE">HTTP 503 (Transient Gateway Down)</option>
                <option value="HTTP_429_TOO_MANY_REQUESTS">HTTP 429 (Target ERP Throttling)</option>
                <option value="DB_CONNECTION_TIMEOUT">DB Connection Timeout (Socket Drop)</option>
                <option value="INVALID_SCHEMA_FORMAT">SCHEMA_FAIL (Missing Mandatory Field)</option>
              </select>

              <button
                type="button"
                id="retry-sim-run-btn"
                onClick={runRetrySimulation}
                disabled={simRunning}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Sandbox Test</span>
              </button>
            </div>
          </div>

          {simLogs.length > 0 && (
            <div className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-slate-300 space-y-2 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">RETRY ENGINE SIMULATION LOGS</span>
              <div className="space-y-1.5 pt-1">
                {simLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between text-[11px] ${
                      log.status === 'success'
                        ? 'text-emerald-400 font-bold'
                        : log.status === 'dlq'
                        ? 'text-amber-400 font-bold'
                        : 'text-indigo-300'
                    }`}
                  >
                    <span>{log.step}</span>
                    <span className="text-slate-500 text-[10px]">{log.delay}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
