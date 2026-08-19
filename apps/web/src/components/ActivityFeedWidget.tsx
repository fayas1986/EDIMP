import React, { useState, useEffect } from 'react';
import { ActivityFeedItem } from '../types';
import {
  Activity,
  User,
  ShieldCheck,
  Zap,
  Sliders,
  Database,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  X,
  Plus,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

const MOCK_INITIAL_ACTIVITIES: ActivityFeedItem[] = [
  {
    id: 'act-1',
    userName: 'Sarah Jenkins',
    userRole: 'Lead Architect',
    actionType: 'MAPPING',
    title: 'Committed AI Mapping Rule',
    details: 'Mapped SAP.BKPF.BELNR -> D365.GL_Entry.Voucher with 99.4% confidence score.',
    timestamp: '17:24:02',
    relativeTime: '2 mins ago',
    status: 'SUCCESS',
    targetResource: 'SAP S/4HANA Finance',
  },
  {
    id: 'act-2',
    userName: 'Alex Mercer',
    userRole: 'Data Engineer',
    actionType: 'MIGRATION',
    title: 'Launched Dry-Run Simulation',
    details: 'Triggered 500k record validation pass on Customer Master dataset.',
    timestamp: '17:21:45',
    relativeTime: '5 mins ago',
    status: 'IN_PROGRESS',
    targetResource: 'Dynamics 365 CE',
  },
  {
    id: 'act-3',
    userName: 'System Auto',
    userRole: 'System Auto',
    actionType: 'SCALE',
    title: 'Kubernetes Pod Auto-Scale',
    details: 'Spawned +128 worker pods in response to CPU saturation (92%).',
    timestamp: '17:18:10',
    relativeTime: '8 mins ago',
    status: 'WARNING',
    targetResource: 'K8s Cluster Node Pool',
  },
  {
    id: 'act-4',
    userName: 'Elena Rostova',
    userRole: 'Compliance Officer',
    actionType: 'SECURITY',
    title: 'Updated GDPR Anonymization Policy',
    details: 'Enforced HMAC Tokenization on SSN and CreditCard fields.',
    timestamp: '17:12:30',
    relativeTime: '14 mins ago',
    status: 'SUCCESS',
    targetResource: 'Data Anonymization Engine',
  },
  {
    id: 'act-5',
    userName: 'David Chen',
    userRole: 'Security Admin',
    actionType: 'CONFIG',
    title: 'Adjusted Connector Throttling',
    details: 'Raised Salesforce Sales Cloud max limit to 500 req/s with Exponential Backoff.',
    timestamp: '17:05:18',
    relativeTime: '21 mins ago',
    status: 'INFO',
    targetResource: 'Salesforce Connector',
  },
  {
    id: 'act-6',
    userName: 'Marcus Vance',
    userRole: 'Data Engineer',
    actionType: 'EXPORT',
    title: 'Exported Cleansed Dataset',
    details: 'Generated 2.4M records export to Azure Data Lake Parquet format.',
    timestamp: '16:58:00',
    relativeTime: '28 mins ago',
    status: 'SUCCESS',
    targetResource: 'Azure Storage Blob',
  },
];

const POSSIBLE_LIVE_ACTIONS: Partial<ActivityFeedItem>[] = [
  {
    userName: 'Sarah Jenkins',
    userRole: 'Lead Architect',
    actionType: 'MAPPING',
    title: 'Validated Complex FK Mapping',
    details: 'Resolved circular dependency on SalesHeader <-> SalesLine relations.',
    status: 'SUCCESS',
    targetResource: 'Mapping Studio',
  },
  {
    userName: 'Alex Mercer',
    userRole: 'Data Engineer',
    actionType: 'MIGRATION',
    title: 'Completed Migration Replay Checkpoint',
    details: 'Replayed batch #829 with 0 delta anomalies detected.',
    status: 'SUCCESS',
    targetResource: 'Migration Replay Engine',
  },
  {
    userName: 'System Auto',
    userRole: 'System Auto',
    actionType: 'SYSTEM',
    title: 'Throttling Cooldown Recovered',
    details: 'HTTP 429 backoff resolved. Restored full rate limit on Azure SQL.',
    status: 'INFO',
    targetResource: 'Azure SQL Staging',
  },
  {
    userName: 'David Chen',
    userRole: 'Security Admin',
    actionType: 'SECURITY',
    title: 'Audit Trail Export Generated',
    details: 'Downloaded SOC-2 Compliance Audit PDF package for Q3 Migration.',
    status: 'SUCCESS',
    targetResource: 'Audit & Compliance',
  },
  {
    userName: 'Elena Rostova',
    userRole: 'Compliance Officer',
    actionType: 'CONFIG',
    title: 'Updated PII Masking Rule',
    details: 'Applied Partial Masking (First 4 chars) to Phone Number attributes.',
    status: 'INFO',
    targetResource: 'Data Dictionary',
  },
];

interface ActivityFeedWidgetProps {
  collapsed?: boolean;
  onNavigateTab?: (tab: string) => void;
}

export const ActivityFeedWidget: React.FC<ActivityFeedWidgetProps> = ({
  collapsed = false,
  onNavigateTab,
}) => {
  const [activities, setActivities] = useState<ActivityFeedItem[]>(MOCK_INITIAL_ACTIVITIES);
  const [isWidgetExpanded, setIsWidgetExpanded] = useState<boolean>(true);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemDetail, setSelectedItemDetail] = useState<ActivityFeedItem | null>(null);

  // Live Stream Ticker Effect
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      // 30% chance to generate new event every 8 seconds
      if (Math.random() > 0.3) {
        const template =
          POSSIBLE_LIVE_ACTIONS[Math.floor(Math.random() * POSSIBLE_LIVE_ACTIONS.length)];
        const now = new Date();
        const timestampStr = now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        const newItem: ActivityFeedItem = {
          id: `act-${Date.now()}`,
          userName: template.userName || 'System Auto',
          userRole: template.userRole || 'System Auto',
          actionType: template.actionType || 'SYSTEM',
          title: template.title || 'System Activity Executed',
          details: template.details || 'System executed background synchronization task.',
          timestamp: timestampStr,
          relativeTime: 'Just now',
          status: template.status || 'INFO',
          targetResource: template.targetResource || 'Core Engine',
        };

        setActivities((prev) => [newItem, ...prev].slice(0, 25));
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Handle Manual Action Trigger Simulation
  const handleTriggerSimulatedAction = () => {
    const template =
      POSSIBLE_LIVE_ACTIONS[Math.floor(Math.random() * POSSIBLE_LIVE_ACTIONS.length)];
    const now = new Date();
    const timestampStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newItem: ActivityFeedItem = {
      id: `act-manual-${Date.now()}`,
      userName: 'Live User (You)',
      userRole: 'Lead Architect',
      actionType: 'CONFIG',
      title: 'Manual Audit Snapshot Triggered',
      details: 'Recorded explicit real-time system state checkpoint during migration.',
      timestamp: timestampStr,
      relativeTime: 'Just now',
      status: 'SUCCESS',
      targetResource: 'Audit Trail Engine',
    };

    setActivities((prev) => [newItem, ...prev].slice(0, 25));
  };

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    const matchesCat = filterCategory === 'ALL' || act.actionType === filterCategory;
    const matchesSearch =
      searchQuery === '' ||
      act.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.targetResource && act.targetResource.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'MIGRATION':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'CONFIG':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'MAPPING':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'SECURITY':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'SCALE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'EXPORT':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'IN_PROGRESS':
        return <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  if (collapsed) {
    return (
      <div className="relative group flex justify-center my-2">
        <button
          onClick={() => setIsWidgetExpanded(true)}
          className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 hover:text-white hover:bg-indigo-900 transition-all relative"
          title="Open Activity Feed Stream"
        >
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-800/80 bg-slate-950/80 text-slate-200">
      {/* Sidebar Widget Bar Header */}
      <div className="p-3 flex items-center justify-between border-b border-slate-800/60">
        <button
          onClick={() => setIsWidgetExpanded(!isWidgetExpanded)}
          className="flex items-center gap-2 hover:text-white transition-colors text-xs font-extrabold font-mono text-indigo-300 cursor-pointer"
        >
          <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>Real-time Activity Feed</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
            Live
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`p-1.5 rounded text-xs font-mono flex items-center gap-1 border transition-all ${
              isLiveStreaming
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title={isLiveStreaming ? 'Pause Stream' : 'Resume Live Stream'}
          >
            {isLiveStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsWidgetExpanded(!isWidgetExpanded)}
            className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title={isWidgetExpanded ? 'Collapse Widget' : 'Expand Widget'}
          >
            {isWidgetExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mini Ticker Mode (When Collapsed inside Sidebar) */}
      {!isWidgetExpanded && activities.length > 0 && (
        <div
          onClick={() => setIsWidgetExpanded(true)}
          className="p-2.5 hover:bg-slate-900/90 transition-all cursor-pointer group space-y-1"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 group-hover:text-indigo-300 truncate max-w-[150px]">
              {activities[0].title}
            </span>
            <span className="text-[10px] font-mono text-slate-400">{activities[0].relativeTime}</span>
          </div>
          <p className="text-xs text-slate-300 truncate leading-tight">{activities[0].details}</p>
        </div>
      )}

      {/* Expanded Real-time Activity Feed Panel */}
      {isWidgetExpanded && (
        <div className="p-2.5 space-y-2.5 bg-slate-950/90 max-h-[300px] flex flex-col shrink-0">
          {/* Action Tools & Search */}
          <div className="space-y-1.5 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter actions or user..."
                className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px] font-mono">
              {['ALL', 'MIGRATION', 'MAPPING', 'SECURITY', 'CONFIG', 'SCALE'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2 py-0.5 rounded-md font-bold whitespace-nowrap transition-all border ${
                    filterCategory === cat
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xs'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Stream Items List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[180px]">
            {filteredActivities.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs font-mono">
                No system activity matches filter.
              </div>
            ) : (
              filteredActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => setSelectedItemDetail(act)}
                  className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {getStatusIcon(act.status)}
                      <span className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 truncate">
                        {act.title}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border shrink-0 ${getBadgeColor(
                        act.actionType
                      )}`}
                    >
                      {act.actionType}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {act.details}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                    <span className="text-slate-300 font-sans font-semibold flex items-center gap-1">
                      <User className="w-3 h-3 text-indigo-400" />
                      {act.userName}
                    </span>
                    <span>{act.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Controls: Simulate Action & Full Audit Link */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between shrink-0">
            <button
              onClick={handleTriggerSimulatedAction}
              className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 font-mono transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Simulate User Action</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('audit')}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white font-mono transition-colors cursor-pointer"
              >
                <span>Full Audit Logs</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selected Action Audit Modal */}
      {selectedItemDetail && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedItemDetail.status)}
                <h3 className="text-sm font-bold text-white">{selectedItemDetail.title}</h3>
              </div>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Action Executed By</span>
                  <span className="font-bold text-indigo-300">{selectedItemDetail.userName}</span>{' '}
                  <span className="text-[10px] text-slate-400">({selectedItemDetail.userRole})</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Target System Resource</span>
                  <span className="text-slate-300">{selectedItemDetail.targetResource || 'Platform Engine'}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Action Category</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${getBadgeColor(
                      selectedItemDetail.actionType
                    )}`}
                  >
                    {selectedItemDetail.actionType}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase mb-1">Details & Payload</span>
                <p className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-sans">
                  {selectedItemDetail.details}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                <div>Timestamp: {selectedItemDetail.timestamp}</div>
                <div>Relative: {selectedItemDetail.relativeTime}</div>
                <div>Audit Hash: sha256:8f3a9e...</div>
                <div>IP: 192.168.10.42</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
