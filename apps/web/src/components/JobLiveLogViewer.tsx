import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { JobLiveLog } from '../types';
import {
  Terminal,
  Play,
  Pause,
  Trash2,
  Copy,
  Download,
  Search,
  Filter,
  Check,
  Radio,
  Zap,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Info,
  Layers,
  ArrowDownCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface JobLiveLogViewerProps {
  jobId?: string;
  jobName?: string;
  isExecuting?: boolean;
}

export const JobLiveLogViewer: React.FC<JobLiveLogViewerProps> = ({
  jobId = 'all',
  jobName = 'Global Pipeline Engine',
  isExecuting = false,
}) => {
  const [logs, setLogs] = useState<JobLiveLog[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Initialize Socket.IO connection to window.location.origin
    const socket = io(window.location.origin, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('subscribe_job_logs', { jobId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('job_log', (newLog: JobLiveLog) => {
      setLogs((prev) => {
        // Prevent duplicates
        if (prev.some((l) => l.id === newLog.id)) return prev;
        // Keep max 500 logs in memory for high performance
        return [...prev, newLog].slice(-500);
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unsubscribe_job_logs', { jobId });
        socketRef.current.disconnect();
      }
    };
  }, [jobId]);

  // Handle inner terminal auto-scroll when new logs arrive (ONLY scroll internal log div, never outer window/document)
  useEffect(() => {
    if (autoScroll && !isPaused && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, isPaused]);

  // Handle user scroll detection on the terminal container
  const handleScroll = () => {
    if (terminalContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = terminalContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
      if (!isAtBottom && autoScroll) {
        setAutoScroll(false);
      } else if (isAtBottom && !autoScroll) {
        setAutoScroll(true);
      }
    }
  };

  // Filter logs based on search and level tab
  const filteredLogs = logs.filter((log) => {
    // Level filter
    if (selectedLevel !== 'ALL' && log.level !== selectedLevel) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchNode = log.node.toLowerCase().includes(q);
      const matchModule = log.module.toLowerCase().includes(q);
      const matchLevel = log.level.toLowerCase().includes(q);
      return matchMsg || matchNode || matchModule || matchLevel;
    }
    return true;
  });

  // Level counters
  const errorCount = logs.filter((l) => l.level === 'ERROR').length;
  const warnCount = logs.filter((l) => l.level === 'WARN').length;
  const successCount = logs.filter((l) => l.level === 'SUCCESS').length;
  const infoCount = logs.filter((l) => l.level === 'INFO').length;

  const handleTriggerSimulatedFault = (type: 'ERROR' | 'WARN' | 'SUCCESS') => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('trigger_simulated_event', { jobId, eventType: type });
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.level}] [${l.node}] [${l.module}] ${l.message}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `migration_logs_${jobId}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'WARN':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'SUCCESS':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'INFO':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'TRACE':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div id="job-live-log-viewer" className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs text-slate-200">
      {/* Top Header Controls Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title & Connection Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white text-sm">Real-time Socket.IO Live Log Stream</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
              <span>{isConnected ? 'WEBSOCKET CONNECTED' : 'RECONNECTING...'}</span>
            </span>

            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              Job: {jobName} ({jobId})
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stream Pause/Resume */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'RESUME STREAM' : 'PAUSE'}</span>
          </button>

          {/* Trigger Fault Injector */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 px-2 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Inject Event:
            </span>
            <button
              type="button"
              onClick={() => handleTriggerSimulatedFault('ERROR')}
              className="px-2 py-0.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 rounded text-[10px] font-bold cursor-pointer"
              title="Inject instant rate-limit or DLQ exception event into live stream"
            >
              +Error
            </button>
            <button
              type="button"
              onClick={() => handleTriggerSimulatedFault('WARN')}
              className="px-2 py-0.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 rounded text-[10px] font-bold ml-1 cursor-pointer"
            >
              +Warn
            </button>
            <button
              type="button"
              onClick={() => handleTriggerSimulatedFault('SUCCESS')}
              className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 rounded text-[10px] font-bold ml-1 cursor-pointer"
            >
              +Commit
            </button>
          </div>

          {/* Copy Logs */}
          <button
            type="button"
            onClick={handleCopyLogs}
            className="p-1.5 bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 rounded-lg cursor-pointer"
            title="Copy Filtered Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download Logs */}
          <button
            type="button"
            onClick={handleDownloadLogs}
            className="p-1.5 bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 rounded-lg cursor-pointer"
            title="Download Logs as JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear Logs */}
          <button
            type="button"
            onClick={handleClearLogs}
            className="p-1.5 bg-slate-800 text-slate-400 border border-slate-700 hover:bg-rose-500/20 hover:text-rose-300 rounded-lg cursor-pointer"
            title="Clear Log Terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
        {/* Level Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'ALL', label: `ALL (${logs.length})` },
            { id: 'ERROR', label: `ERROR (${errorCount})`, color: 'text-rose-400' },
            { id: 'WARN', label: `WARN (${warnCount})`, color: 'text-amber-400' },
            { id: 'SUCCESS', label: `SUCCESS (${successCount})`, color: 'text-emerald-400' },
            { id: 'INFO', label: `INFO (${infoCount})`, color: 'text-indigo-300' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedLevel(tab.id)}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                selectedLevel === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className={tab.color || ''}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Input & AutoScroll Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-md pl-7 pr-2 py-1 text-[11px] focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              autoScroll
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <ArrowDownCircle className="w-3 h-3" />
            <span>Auto-Scroll</span>
          </button>
        </div>
      </div>

      {/* Terminal View Body */}
      <div
        ref={terminalContainerRef}
        onScroll={handleScroll}
        className="p-3 h-72 overflow-y-auto [overflow-anchor:none] space-y-1.5 leading-relaxed selection:bg-indigo-500/40 select-text scrollbar-thin scrollbar-thumb-slate-800"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-2 py-8">
            <Terminal className="w-8 h-8 opacity-40 animate-pulse" />
            <p>No log events matched your search filter.</p>
            <p className="text-[10px] text-slate-700">Listening to Socket.IO event stream on channel "job_{jobId}"...</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                key={log.id}
                className="group p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer border border-transparent hover:border-slate-800/80"
                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-600 text-[10px] w-8 shrink-0 select-none">
                    #{(index + 1).toString().padStart(3, '0')}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">[{log.timestamp}]</span>

                  {/* Level Pill */}
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getLevelBadgeClass(
                      log.level
                    )}`}
                  >
                    {log.level}
                  </span>

                  {/* Node Tag */}
                  <span className="text-indigo-400 font-bold text-[10px] bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                    @{log.node}
                  </span>

                  {/* Module Tag */}
                  <span className="text-purple-300 text-[10px]">[{log.module}]</span>

                  {/* Message */}
                  <span
                    className={`flex-1 ${
                      log.level === 'ERROR'
                        ? 'text-rose-300 font-bold'
                        : log.level === 'WARN'
                        ? 'text-amber-300'
                        : log.level === 'SUCCESS'
                        ? 'text-emerald-300'
                        : 'text-slate-200'
                    }`}
                  >
                    {log.message}
                  </span>

                  {log.details && (
                    <span className="text-[10px] text-slate-500 group-hover:text-indigo-400 underline">
                      {isExpanded ? 'Hide JSON' : 'View JSON'}
                    </span>
                  )}
                </div>

                {/* Expanded Details Inspector */}
                {isExpanded && log.details && (
                  <div className="mt-2 p-2 bg-slate-900 rounded border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
                    <div className="text-indigo-400 font-bold border-b border-slate-800 pb-1">
                      Event Metadata Payload ({log.id})
                    </div>
                    <pre className="text-emerald-400 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Footer Bar */}
      <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-3">
          <span>
            Total Buffer: <strong className="text-slate-300">{logs.length} events</strong>
          </span>
          <span>
            Errors: <strong className="text-rose-400">{errorCount}</strong>
          </span>
          <span>
            Committed: <strong className="text-emerald-400">{successCount}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-600">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>EDIMP Real-Time Streaming Daemon v4.2</span>
        </div>
      </div>
    </div>
  );
};
