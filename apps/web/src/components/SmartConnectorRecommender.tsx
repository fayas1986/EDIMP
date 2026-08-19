import React, { useState } from 'react';
import { Connector, ConnectorCategory, ThrottlingConfig } from '../types';
import { DISCOVERABLE_ENTERPRISE_CONNECTORS } from './ConnectorsView';
import {
  Sparkles,
  Cpu,
  Layers,
  Zap,
  Activity,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Server,
  Sliders,
  ShieldCheck,
  Plus,
  Check,
  Building2,
  Users,
  Database,
  Cloud,
  Globe,
  CornerDownRight,
  Brain
} from 'lucide-react';

interface RecommendedSla {
  maxRequestsPerSecond: number;
  maxConcurrentRequests: number;
  retryStrategy: 'ExponentialBackoff' | 'Linear' | 'ImmediateRetry';
}

interface ConnectorRecommendation {
  systemName: string;
  detectedMetadata: string;
  optimalConnectorType: string;
  confidence: number;
  reasoning: string;
  recommendedSla: RecommendedSla;
  architecturalInsight: string;
}

interface SmartConnectorRecommenderProps {
  connectors: Connector[];
  onAddConnector: (newConn: Partial<Connector>) => void;
  onUpdateConnectorThrottling?: (connectorId: string, config: ThrottlingConfig) => void;
  isScanningInRealtime: boolean;
  onRunScan: () => void;
}

export const SmartConnectorRecommender: React.FC<SmartConnectorRecommenderProps> = ({
  connectors,
  onAddConnector,
  onUpdateConnectorThrottling,
  isScanningInRealtime,
  onRunScan,
}) => {
  const [customContext, setCustomContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<ConnectorRecommendation[]>([]);
  const [genericInsights, setGenericInsights] = useState<string[]>([]);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep track of applied actions to give clean feedback states
  const [appliedSlas, setAppliedSlas] = useState<Record<string, boolean>>({});
  const [instantiatedIds, setInstantiatedIds] = useState<Record<string, boolean>>({});

  const handleFetchRecommendations = async () => {
    setIsGenerating(true);
    setError(null);
    setNote(null);

    // Filter detected metadata from DISCOVERABLE_ENTERPRISE_CONNECTORS
    const detectedMetadata = DISCOVERABLE_ENTERPRISE_CONNECTORS.map((item) => ({
      systemName: item.connector.name,
      provider: item.connector.provider,
      subnet: item.subnet,
      entities: item.discoveredEntities.map((e) => ({
        name: e.name,
        type: e.type,
        records: e.records,
      })),
    }));

    try {
      const response = await fetch('/api/ai/suggest-connector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          detectedMetadata,
          customContext: customContext.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setRecommendations(data.recommendations);
        setGenericInsights(data.genericInsights || []);
        setIsAiGenerated(data.aiGenerated);
        setNote(data.note || null);
      } else {
        throw new Error(data.error || 'Failed to generate suggestions');
      }
    } catch (err: any) {
      console.error('Error generating suggestions:', err);
      setError(err?.message || 'Failed to reach AI Co-Pilot Recommendation service.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Maps category name to icon
  const getConnectorIcon = (sysName: string) => {
    const name = sysName.toLowerCase();
    if (name.includes('oracle') || name.includes('netsuite')) return <Building2 className="w-4 h-4 text-amber-600" />;
    if (name.includes('workday') || name.includes('hcm')) return <Users className="w-4 h-4 text-emerald-600" />;
    if (name.includes('snowflake') || name.includes('warehouse')) return <Database className="w-4 h-4 text-indigo-600" />;
    if (name.includes('s3') || name.includes('lake')) return <Cloud className="w-4 h-4 text-cyan-600" />;
    if (name.includes('hubspot') || name.includes('crm')) return <Globe className="w-4 h-4 text-pink-600" />;
    return <Server className="w-4 h-4 text-slate-600" />;
  };

  const findMatchingRegisteredConnector = (sysName: string) => {
    return connectors.find(
      (c) =>
        c.name.toLowerCase().includes(sysName.toLowerCase()) ||
        sysName.toLowerCase().includes(c.name.toLowerCase()) ||
        c.provider.toLowerCase().includes(sysName.toLowerCase())
    );
  };

  const handleApplySla = (sysName: string, recSla: RecommendedSla) => {
    const matchingConn = findMatchingRegisteredConnector(sysName);
    if (matchingConn && onUpdateConnectorThrottling) {
      onUpdateConnectorThrottling(matchingConn.id, {
        isEnabled: true,
        maxRequestsPerSecond: recSla.maxRequestsPerSecond,
        maxConcurrentRequests: recSla.maxConcurrentRequests,
        retryStrategy: recSla.retryStrategy as any,
        maxRetries: 4,
        autoCooldownOn429: true,
      });
      setAppliedSlas((prev) => ({ ...prev, [sysName]: true }));
      setTimeout(() => {
        setAppliedSlas((prev) => ({ ...prev, [sysName]: false }));
      }, 3000);
    }
  };

  const handleInstantiateConnector = (sysName: string, recType: string, recSla: RecommendedSla) => {
    // Find static blueprint mapping in discoverable connectors
    const blueprint = DISCOVERABLE_ENTERPRISE_CONNECTORS.find(
      (item) => item.connector.name?.toLowerCase().includes(sysName.toLowerCase()) || sysName.toLowerCase().includes(item.connector.name?.toLowerCase() || '')
    );

    const baseConnector: Partial<Connector> = blueprint
      ? blueprint.connector
      : {
          id: `conn-ai-${Math.random().toString(36).substr(2, 9)}`,
          name: sysName,
          category: (sysName.toLowerCase().includes('crm') ? 'CRM' : 'ERP') as ConnectorCategory,
          provider: sysName,
          status: 'Connected',
          authType: 'OAuth 2.0',
          latencyMs: 32,
          hostUrl: 'https://api.discovered.enterprise.local',
        };

    // Override Throttling Config with suggested Co-Pilot parameters!
    const newConn: Partial<Connector> = {
      ...baseConnector,
      status: 'Connected',
      throttlingConfig: {
        isEnabled: true,
        maxRequestsPerSecond: recSla.maxRequestsPerSecond,
        maxConcurrentRequests: recSla.maxConcurrentRequests,
        retryStrategy: recSla.retryStrategy as any,
        maxRetries: 4,
        autoCooldownOn429: true,
      },
    };

    onAddConnector(newConn);
    setInstantiatedIds((prev) => ({ ...prev, [sysName]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white p-6 rounded-2xl border border-indigo-100 shadow-3xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
              </span>
              <h2 className="text-base font-extrabold text-slate-900 tracking-wide">
                Smart Connector Recommendation Hub
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Let the **AI Co-Pilot** analyze currently detected subnet gateways, database catalogs, and REST endpoint metrics.
              It generates custom connector classes and configures performance throttling SLAs (RPS, concurrency limiters, and retry paths) dynamically.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={onRunScan}
              disabled={isScanningInRealtime}
              className={`px-4 py-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs rounded-xl border border-indigo-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer ${isScanningInRealtime ? 'opacity-70' : ''}`}
            >
              <Cpu className={`w-4 h-4 ${isScanningInRealtime ? 'animate-spin text-indigo-600' : 'text-indigo-500'}`} />
              <span>{isScanningInRealtime ? 'Scanning VPC Networks...' : 'Refresh VPC Network Scan'}</span>
            </button>
          </div>
        </div>

        {/* Custom Context Field */}
        <div className="mt-5 pt-4 border-t border-indigo-50/80 space-y-2">
          <label className="block text-xs font-bold text-slate-800 flex items-center gap-1">
            <Brain className="w-3.5 h-3.5 text-purple-600" />
            <span>Supplement with Workload Context (Optional)</span>
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="e.g., We anticipate extreme spikes on Snowflake at 1 AM. Workday has a strict SOAP limit of 150 concurrent sessions."
              className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 shadow-3xs"
            />
            <button
              onClick={handleFetchRecommendations}
              disabled={isGenerating || isScanningInRealtime}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Analyzing Workloads...' : 'Analyze & Suggest'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Recommendation Engine Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Main Analysis Block */}
      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Recommendations Column */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Suggested System Connectors & SLA Tuning Rules
              </h3>
              {note && (
                <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-mono font-bold">
                  {note}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, index) => {
                const isRegistered = findMatchingRegisteredConnector(rec.systemName);
                const hasSlaApplied = appliedSlas[rec.systemName];
                const hasInstantiated = instantiatedIds[rec.systemName] || isRegistered;

                return (
                  <div
                    key={index}
                    className="bg-white border border-slate-200 hover:border-indigo-200 rounded-2xl p-4.5 space-y-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Heading */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg shrink-0">
                            {getConnectorIcon(rec.systemName)}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-extrabold text-slate-900 truncate">
                              {rec.systemName}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate font-mono">
                              {rec.detectedMetadata}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] bg-indigo-50/70 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-md font-mono font-bold">
                          {Math.round(rec.confidence * 100)}% Match
                        </span>
                      </div>

                      {/* Recommendation Details */}
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Recommended Class
                        </div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <CornerDownRight className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{rec.optimalConnectorType}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 leading-relaxed">
                        {rec.reasoning}
                      </div>

                      {/* Recommended SLA Controls */}
                      <div className="border-t border-slate-100 pt-3 space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                          Optimized SLA Configurations
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Max RPS</span>
                            <span className="font-extrabold text-indigo-700">
                              {rec.recommendedSla.maxRequestsPerSecond} req/s
                            </span>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Max Threads</span>
                            <span className="font-extrabold text-slate-800">
                              {rec.recommendedSla.maxConcurrentRequests} concurrent
                            </span>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Retry Logic</span>
                            <span className="font-extrabold text-amber-700 truncate">
                              {rec.recommendedSla.retryStrategy}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Architectural insight */}
                      <div className="bg-purple-50/30 p-3 border border-purple-100/50 rounded-xl">
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-600 block">
                          Architectural Safeguard
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          {rec.architecturalInsight}
                        </p>
                      </div>
                    </div>

                    {/* Interactive triggers */}
                    <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {isRegistered ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Registered
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono font-bold">Not Configured</span>
                        )}
                      </span>

                      <div className="flex gap-2">
                        {isRegistered ? (
                          <button
                            onClick={() => handleApplySla(rec.systemName, rec.recommendedSla)}
                            disabled={hasSlaApplied}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border flex items-center gap-1 cursor-pointer ${
                              hasSlaApplied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                            }`}
                          >
                            {hasSlaApplied ? <Check className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                            <span>{hasSlaApplied ? 'SLA Applied!' : 'Apply SLA Tuning'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleInstantiateConnector(rec.systemName, rec.optimalConnectorType, rec.recommendedSla)
                            }
                            disabled={!!hasInstantiated}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border flex items-center gap-1 cursor-pointer ${
                              hasInstantiated
                                ? 'bg-slate-50 text-slate-400 border-slate-200'
                                : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-2xs'
                            }`}
                          >
                            {hasInstantiated ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            <span>{hasInstantiated ? 'Instantiated!' : 'Instantiate Connector'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar - Broad Strategic Insights */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono flex items-center gap-2 border-b border-slate-200 pb-2">
              <Activity className="w-4 h-4 text-purple-600" />
              Strategic Migration Guardrails
            </h3>

            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <h4 className="text-xs font-extrabold font-mono text-purple-300">
                  Co-Pilot General Directives
                </h4>
              </div>

              <div className="space-y-3.5 text-xs">
                {genericInsights.map((insight, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-slate-300 text-[11px] pt-0.5">{insight}</p>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1.5">
                <div className="font-bold text-slate-300">Security & Isolation standards:</div>
                <div>• Auto-configured parameters support SOC2 mTLS bindings</div>
                <div>• Cooldown rules deploy throttling automatically on 429</div>
                <div>• Live state logs trace operations continuously</div>
              </div>
            </div>

            {/* Currently Detected Endpoints Mini List */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-3.5">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-500" />
                Raw Scanned VPC Endpoints ({DISCOVERABLE_ENTERPRISE_CONNECTORS.length})
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {DISCOVERABLE_ENTERPRISE_CONNECTORS.map((item) => {
                  const isPopulated = connectors.some((c) => c.id === item.connector.id);
                  const entList = item.discoveredEntities || [];
                  const totalRecords = entList.reduce((acc, e) => acc + e.records, 0);

                  return (
                    <div
                      key={item.connector.id}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-[11px] font-mono space-y-1"
                    >
                      <div className="flex justify-between items-center gap-1">
                        <span className="font-bold text-slate-800 truncate">{item.connector.name}</span>
                        {isPopulated ? (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.2 rounded font-bold">
                            Active
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded">
                            Scanned
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{item.subnet}</div>
                      <div className="text-[10px] text-indigo-700 font-bold">
                        {entList.length} Entity Classes • {totalRecords.toLocaleString()} rows
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / CTA State */
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-xl mx-auto space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
            <Sparkles className="w-6 h-6 animate-pulse text-indigo-600" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900">
              Run CO-PILOT Workload Analysis
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Click the button below to parse all active subnets and detected OData endpoints.
              The AI Co-Pilot will suggest best-fit adapters, optimal rate-limiting tiers, and architectural insights.
            </p>
          </div>

          <button
            onClick={handleFetchRecommendations}
            disabled={isGenerating || isScanningInRealtime}
            className="mx-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Analyzing Workloads...' : 'Analyze & Suggest optimal connectors'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
