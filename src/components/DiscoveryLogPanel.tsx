import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Search,
  Filter,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Database,
  Terminal,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Code,
  Globe,
  Radio,
  Play,
  Pause,
  ExternalLink,
} from 'lucide-react';
import { DiscoveryLogEntry, Connector } from '../types';

interface DiscoveryLogPanelProps {
  logs: DiscoveryLogEntry[];
  isScanning: boolean;
  onRunScan: () => void;
  onClearLogs: () => void;
  connectors: Connector[];
}

export const DiscoveryLogPanel: React.FC<DiscoveryLogPanelProps> = ({
  logs,
  isScanning,
  onRunScan,
  onClearLogs,
  connectors,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLivePaused, setIsLivePaused] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Compute stats
  const totalEvents = logs.length;
  const discoveredEventsCount = logs.filter((l) => l.eventType === 'CONNECTOR_DISCOVERED').length;
  const successCount = logs.filter((l) => l.status === 'SUCCESS').length;
  const avgLatency = useMemo(() => {
    const latencyLogs = logs.filter((l) => l.details?.latencyMs !== undefined);
    if (latencyLogs.length === 0) return 28;
    const sum = latencyLogs.reduce((acc, l) => acc + (l.details?.latencyMs || 0), 0);
    return Math.round(sum / latencyLogs.length);
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        searchQuery === '' ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.connectorName && log.connectorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.subnet && log.subnet.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.eventType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = eventTypeFilter === 'ALL' || log.eventType === eventTypeFilter;
      const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [logs, searchQuery, eventTypeFilter, statusFilter]);

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `auto_discovery_audit_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getEventIcon = (type: DiscoveryLogEntry['eventType']) => {
    switch (type) {
      case 'SUBNET_PROBE':
        return <Globe className="w-4 h-4 text-sky-500" />;
      case 'OAUTH_VERIFIED':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'CONNECTOR_DISCOVERED':
        return <Cpu className="w-4 h-4 text-purple-600 animate-pulse" />;
      case 'ODATA_INDEXED':
        return <Layers className="w-4 h-4 text-indigo-500" />;
      case 'VAULT_CREDENTIALS_SYNCED':
        return <Database className="w-4 h-4 text-amber-500" />;
      case 'SYSTEM_INITIALIZED':
        return <Terminal className="w-4 h-4 text-slate-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: DiscoveryLogEntry['status']) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            SUCCESS
          </span>
        );
      case 'INFO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Info className="w-3 h-3 text-sky-600" />
            INFO
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            WARN
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            ERROR
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 inline-flex">
                <Radio className="w-5 h-5 text-indigo-600 animate-pulse" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Real-Time Auto-Discovery Audit & Event Stream Log
              </h2>
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                Subnet Scanner v2.4 Active
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
              Live audit record tracking continuous IP subnet probes, OAuth 2.0 handshake verification, schema indexing, and auto-populated enterprise connectors across hybrid VPCs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              id="discovery-log-rescan-btn"
              onClick={onRunScan}
              disabled={isScanning}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer border border-indigo-500 disabled:opacity-50"
            >
              <Cpu className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning VPC Subnets...' : 'Trigger Discovery Scan'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLivePaused((prev) => !prev)}
              className={`px-3 py-2.5 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border ${
                isLivePaused
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
            >
              {isLivePaused ? <Play className="w-3.5 h-3.5 text-amber-600" /> : <Pause className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isLivePaused ? 'Feed Paused' : 'Live Feed'}</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-[11px] font-mono text-slate-500">Total Discovery Logs</div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{totalEvents}</div>
            <div className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {successCount} Successful Probes
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-[11px] font-mono text-slate-500">Identified Infrastructure</div>
            <div className="text-xl font-bold text-purple-700 mt-1 font-mono flex items-center gap-1.5">
              <Cpu className="w-5 h-5 text-purple-600" />
              {discoveredEventsCount} Connectors
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Populated into Registry</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-[11px] font-mono text-slate-500">Avg Probe Latency</div>
            <div className="text-xl font-bold text-indigo-700 mt-1 font-mono">{avgLatency} ms</div>
            <div className="text-[10px] text-slate-500 mt-1">Target VPC Ping Rate</div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-[11px] font-mono text-slate-500">Auth Token Verification</div>
            <div className="text-xl font-bold text-emerald-700 mt-1 font-mono flex items-center gap-1">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              100%
            </div>
            <div className="text-[10px] text-emerald-700 mt-1 font-semibold">OAuth 2.0 & mTLS Validated</div>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event logs by subnet IP, connector name, payload message, or endpoint..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Event Type Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Event Types</option>
                <option value="CONNECTOR_DISCOVERED">Connector Discovered</option>
                <option value="SUBNET_PROBE">Subnet Probes</option>
                <option value="OAUTH_VERIFIED">OAuth Verified</option>
                <option value="ODATA_INDEXED">OData Indexed</option>
                <option value="VAULT_CREDENTIALS_SYNCED">Vault Credentials</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Export Discovery Audit Log as JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={onClearLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors cursor-pointer"
              title="Clear log history"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Subnet Summary Badges */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto text-[11px] font-mono text-slate-500">
          <span className="font-bold text-slate-700 shrink-0">Monitored Enterprise Subnets:</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-700">10.240.12.0/24 (Oracle)</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-700">10.240.88.0/24 (Workday)</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-700">snowflakecomputing.com</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-700">172.16.40.0/24 (NetSuite)</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-700">s3.eu-west-1 (AWS Lake)</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-700">hubapi.com (HubSpot)</span>
        </div>
      </div>

      {/* Main Real-Time Log Feed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Event Log Stream ({filteredLogs.length} Entries)
            </h3>
          </div>
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Sync Engine Connected</span>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">No discovery log entries match filter criteria</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try clearing search filters or clicking "Trigger Discovery Scan" above to populate real-time auto-discovery events.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 font-mono text-xs">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  className={`p-4 transition-colors hover:bg-slate-50/80 ${
                    log.eventType === 'CONNECTOR_DISCOVERED' ? 'bg-purple-50/20' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Timestamp & Type */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-xl border border-slate-200 shrink-0 mt-0.5 sm:mt-0">
                        {getEventIcon(log.eventType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{log.timestamp}</span>
                          <span className="text-[10px] text-slate-400 font-sans font-medium">({log.isoTimestamp})</span>
                          {getStatusBadge(log.status)}
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold border border-indigo-200">
                            {log.eventType}
                          </span>
                        </div>
                        <div className="text-slate-800 font-sans font-medium text-xs mt-1 leading-snug">
                          {log.message}
                        </div>
                      </div>
                    </div>

                    {/* Metadata Badges & Expand Control */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      {log.connectorName && (
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-[11px] font-bold border border-purple-200 flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-purple-600" />
                          {log.connectorName}
                        </span>
                      )}

                      {log.subnet && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] border border-slate-200">
                          {log.subnet}
                        </span>
                      )}

                      {log.details?.latencyMs !== undefined && (
                        <span className="px-2 py-1 bg-sky-50 text-sky-700 rounded-lg text-[10px] font-bold border border-sky-200">
                          {log.details.latencyMs} ms
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title={isExpanded ? 'Collapse Payload Inspection' : 'Inspect Raw Discovery Payload'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Payload & Inspection Drawer */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-200 space-y-3 bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                          <Code className="w-3.5 h-3.5" />
                          Raw Discovery Packet Payload Inspection
                        </span>
                        <span>Log ID: {log.id}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                        <div className="space-y-1.5 font-sans">
                          <div className="text-slate-400 text-[10px] font-mono uppercase">Target Endpoint Attributes</div>
                          <div><strong className="text-slate-300">Target Subnet VPC:</strong> <span className="font-mono text-purple-300">{log.subnet || '10.240.0.0/16'}</span></div>
                          <div><strong className="text-slate-300">Host URL Endpoint:</strong> <span className="font-mono text-indigo-300">{log.details?.hostUrl || 'https://api.enterprise.com'}</span></div>
                          <div><strong className="text-slate-300">Authentication Protocol:</strong> <span className="font-mono text-emerald-300">{log.details?.authType || 'OAuth 2.0 (mTLS)'}</span></div>
                          <div><strong className="text-slate-300">Security Standard:</strong> <span className="font-mono text-amber-300">{log.details?.securityStandard || 'SOC2 Type II / ISO27001'}</span></div>
                        </div>

                        {log.details?.entitiesList && log.details.entitiesList.length > 0 && (
                          <div className="space-y-1.5 font-sans">
                            <div className="text-slate-400 text-[10px] font-mono uppercase">Auto-Indexed OData Entities</div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {log.details.entitiesList.map((e, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-purple-950 text-purple-200 border border-purple-800 rounded text-[10px] font-mono">
                                  {e}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Raw JSON viewer */}
                      <div className="pt-2">
                        <div className="text-[10px] text-slate-500 font-mono mb-1">JSON Object Dump:</div>
                        <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-x-auto text-[10px] font-mono leading-relaxed border border-slate-800">
                          {JSON.stringify(
                            {
                              id: log.id,
                              timestamp: log.isoTimestamp,
                              eventType: log.eventType,
                              connector: log.connectorName,
                              subnet: log.subnet,
                              details: log.details || {},
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
