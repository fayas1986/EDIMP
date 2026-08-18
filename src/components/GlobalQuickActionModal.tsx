import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Play,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RotateCcw,
  Database,
  GitFork,
  ShieldCheck,
  FileText,
  Activity,
  Server,
  CalendarDays,
  Sparkles,
  Settings,
  X,
  Command,
  ArrowRight,
  Layers,
  CornerDownLeft,
  Briefcase,
  LayoutDashboard,
  Cable,
  Compass,
  BookOpen,
  GitCompare,
  Workflow,
  Merge,
  CheckSquare,
  LogOut,
  LineChart,
  Bell,
  Network,
  ScrollText,
  BarChart3,
  Code,
  Terminal,
  Globe,
  Users,
  Building,
  CreditCard,
  Scale,
  Sliders
} from 'lucide-react';

import { UserRole } from '../types';
import { isRoleAllowedForTab } from '../services/rbacService';

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  category: 'Core Operations' | 'Data & Governance' | 'Connectors & System' | 'Co-Pilot & Settings';
  icon: React.ElementType;
  tabId: string;
  shortcut?: string;
  keywords: string[];
}

interface GlobalQuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  onTriggerCustomAction?: (actionId: string) => void;
  userRole?: UserRole;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description: 'Monitor real-time system metrics, throughput KPIs, data ingestion trends, and open jobs',
    category: 'Core Operations',
    icon: LayoutDashboard,
    tabId: 'dashboard',
    shortcut: 'Alt + 1',
    keywords: ['dashboard', 'overview', 'metrics', 'kpi', 'status', 'chart']
  },
  {
    id: 'connectors',
    title: 'Enterprise Source/Target Connectors',
    description: 'Manage ERP, CRM, legacy warehouses, cloud databases, and third-party connector endpoints',
    category: 'Connectors & System',
    icon: Cable,
    tabId: 'connectors',
    shortcut: 'Alt + 2',
    keywords: ['connectors', 'endpoint', 'sources', 'targets', 'database', 'integration', 'erp']
  },
  {
    id: 'discovery',
    title: 'Automated Schema Discovery',
    description: 'Scan connected target schemas, extract table dictionaries, and identify structural metadata',
    category: 'Core Operations',
    icon: Compass,
    tabId: 'discovery',
    keywords: ['discovery', 'schema', 'automated', 'metadata', 'scan', 'database']
  },
  {
    id: 'data-dictionary',
    title: 'Canonical Data Dictionary',
    description: 'Browse, manage, and audit fields, field descriptions, metadata types, and standardized definitions',
    category: 'Data & Governance',
    icon: BookOpen,
    tabId: 'data-dictionary',
    keywords: ['dictionary', 'canonical', 'glossary', 'terms', 'metadata', 'fields']
  },
  {
    id: 'mapping',
    title: 'Schema Mapping Studio',
    description: 'Map source schemas to canonical formats with visual lines and fields associations',
    category: 'Core Operations',
    icon: Layers,
    tabId: 'mapping',
    shortcut: 'Alt + 3',
    keywords: ['mapping', 'studio', 'transform', 'fields', 'source', 'target', 'map']
  },
  {
    id: 'schema-comparison',
    title: 'Dual-Schema Multi-Version Comparison',
    description: 'Compare source/target schemas and previous versions side-by-side to highlight differences',
    category: 'Data & Governance',
    icon: GitCompare,
    tabId: 'schema-comparison',
    keywords: ['schema', 'comparison', 'diff', 'drift', 'version', 'metadata']
  },
  {
    id: 'workflow-designer',
    title: 'Visual Migration Workflow Designer',
    description: 'Design complex migration workflow steps, visual DAG sequences, and parallel etl pipelines',
    category: 'Core Operations',
    icon: Workflow,
    tabId: 'workflow-designer',
    keywords: ['workflow', 'designer', 'visual', 'dag', 'sequence', 'pipeline']
  },
  {
    id: 'dependency-explorer',
    title: 'Complex Field Dependency Explorer',
    description: 'Trace relational dependencies and field structures through interactive tree/graph charts',
    category: 'Data & Governance',
    icon: Merge,
    tabId: 'dependency-explorer',
    keywords: ['dependency', 'explorer', 'fields', 'lineage', 'graph', 'impact']
  },
  {
    id: 'data-quality-audit',
    title: 'Quality Checks & Automated Data Profiling',
    description: 'Audit connected datasets for schema anomalies, invalid entries, and null parameters',
    category: 'Data & Governance',
    icon: CheckSquare,
    tabId: 'data-quality-audit',
    keywords: ['quality', 'checks', 'profiling', 'audit', 'scorecard', 'anomaly']
  },
  {
    id: 'export-management',
    title: 'Final Data Export Pipeline',
    description: 'Deliver processed datasets to high-throughput object files, S3, or analytical warehouses',
    category: 'Core Operations',
    icon: LogOut,
    tabId: 'export-management',
    keywords: ['export', 'pipeline', 'destination', 'unload', 'delivery', 'sync']
  },
  {
    id: 'notifications',
    title: 'Real-time System Notifications',
    description: 'Stay updated on background synchronization statuses, SLA warnings, and job alerts',
    category: 'Co-Pilot & Settings',
    icon: Bell,
    tabId: 'notifications',
    keywords: ['notifications', 'alerts', 'warnings', 'errors', 'feed', 'unread']
  },
  {
    id: 'global-load-balancer',
    title: 'Multi-Region Global Load Balancer',
    description: 'Monitor DNS resolution times, region health nodes, failover tunnels, and egress traffic',
    category: 'Connectors & System',
    icon: Network,
    tabId: 'global-load-balancer',
    keywords: ['load', 'balancer', 'global', 'dns', 'multi-region', 'failover', 'traffic']
  },
  {
    id: 'load-balancer-audit',
    title: 'Load Balancer Audit Logs',
    description: 'Track routing anomalies, failover switchovers, and regional diagnostic histories',
    category: 'Connectors & System',
    icon: ScrollText,
    tabId: 'load-balancer-audit',
    keywords: ['audit', 'logs', 'load', 'balancer', 'failover', 'history', 'traffic']
  },
  {
    id: 'decision-log-explorer',
    title: 'Migration Strategy Decision Engine',
    description: 'Verify model-driven schema overrides and automated heuristic rules logic',
    category: 'Data & Governance',
    icon: FileText,
    tabId: 'decision-log-explorer',
    keywords: ['decision', 'strategy', 'engine', 'heuristic', 'log', 'rule', 'optimizer']
  },
  {
    id: 'job-comparison',
    title: 'Multi-Job Performance Comparison',
    description: 'Compare multiple active or historic migration streams side-by-side to optimize speed',
    category: 'Core Operations',
    icon: BarChart3,
    tabId: 'job-comparison',
    keywords: ['job', 'comparison', 'performance', 'benchmark', 'throughput', 'metrics']
  },
  {
    id: 'real-time-sync',
    title: 'Real-Time CDC Continuous Sync',
    description: 'Configure Change Data Capture (CDC) streams for near-zero downtime database replication',
    category: 'Connectors & System',
    icon: Activity,
    tabId: 'real-time-sync',
    keywords: ['real-time', 'cdc', 'sync', 'continuous', 'replication', 'stream']
  },
  {
    id: 'connector-sdk',
    title: 'Connector SDK Developer Portal',
    description: 'Develop custom adapter endpoints using system boilerplate schemas and plugins',
    category: 'Connectors & System',
    icon: Code,
    tabId: 'connector-sdk',
    keywords: ['sdk', 'developer', 'connector', 'custom', 'api', 'manifest', 'plugin']
  },
  {
    id: 'rest-api-platform',
    title: 'REST API Sandbox Platform',
    description: 'Test platform routes, curl requests, response payloads, and API keys securely',
    category: 'Connectors & System',
    icon: Terminal,
    tabId: 'rest-api-platform',
    keywords: ['api', 'rest', 'sandbox', 'endpoint', 'json', 'test', 'client']
  },
  {
    id: 'partner-portal',
    title: 'Multi-Org Partner Portal',
    description: 'Collaborate securely with external clients, assign permissions, and trace shared logs',
    category: 'Co-Pilot & Settings',
    icon: Building,
    tabId: 'partner-portal',
    keywords: ['partner', 'portal', 'client', 'vendor', 'collaboration', 'access']
  },
  {
    id: 'billing-management',
    title: 'Pay-As-You-Go Billing Management',
    description: 'Review credit tokens, monitor server tier costs, and check monthly expenditure logs',
    category: 'Co-Pilot & Settings',
    icon: CreditCard,
    tabId: 'billing-management',
    keywords: ['billing', 'payment', 'invoices', 'spend', 'budget', 'credits']
  },
  {
    id: 'license-compliance',
    title: 'License & Legal Compliance Suite',
    description: 'Track software licenses, regulatory SOC2 requirements, and terms conditions clauses',
    category: 'Data & Governance',
    icon: Scale,
    tabId: 'license-compliance',
    keywords: ['license', 'legal', 'compliance', 'terms', 'clauses', 'contracts']
  },
  {
    id: 'user-management',
    title: 'Team Member Role Management',
    description: 'Manage organizational roles, user groups, permission scopes, and RBAC policies',
    category: 'Co-Pilot & Settings',
    icon: Users,
    tabId: 'user-management',
    keywords: ['team', 'member', 'roles', 'permission', 'rbac', 'users']
  },
  {
    id: 'audit',
    title: 'Audit & Compliance Scheduler',
    description: 'Schedule automated security checks, SOC2 logs creation, and diagnostic scans',
    category: 'Data & Governance',
    icon: CalendarDays,
    tabId: 'audit',
    keywords: ['audit', 'compliance', 'scheduler', 'automated', 'rules', 'cron']
  },
  {
    id: 'compliance-dashboard',
    title: 'Compliance Dashboard View',
    description: 'Verify SOC2, ISO, and GDPR policy configurations with visual checklists',
    category: 'Data & Governance',
    icon: ShieldCheck,
    tabId: 'compliance-dashboard',
    keywords: ['compliance', 'dashboard', 'soc2', 'iso', 'gdpr', 'policy']
  },
  {
    id: 'resource-allocation',
    title: 'GPU/CPU Resource Allocator',
    description: 'Manage virtual server allocations, RAM, CPU threads, and scaling threshold triggers',
    category: 'Connectors & System',
    icon: Server,
    tabId: 'resource-allocation',
    keywords: ['resource', 'allocator', 'gpu', 'cpu', 'memory', 'nodes', 'scaling']
  },
  {
    id: 'admin-hub',
    title: 'Administration Hub & Platform Governance',
    description: 'Global administrator control plane for disaster recovery, system metrics, and failover',
    category: 'Co-Pilot & Settings',
    icon: Sliders,
    tabId: 'admin-hub',
    keywords: ['admin', 'hub', 'governance', 'disaster', 'recovery', 'failover', 'platform']
  },
  {
    id: 'customer-projects',
    title: 'Customer & Project Management Hub',
    description: 'Onboard clients, create migration projects, view timelines, assign team members & templates',
    category: 'Core Operations',
    icon: Briefcase,
    tabId: 'customer-projects',
    keywords: ['customer', 'project', 'client', 'timeline', 'milestone', 'gantt', 'team', 'template', 'sla']
  },
  {
    id: 'start-migration',
    title: 'Start New Migration',
    description: 'Launch step-by-step migration wizard for end-to-end data transfer',
    category: 'Core Operations',
    icon: Play,
    tabId: 'wizard',
    shortcut: 'Alt + 5',
    keywords: ['new', 'migration', 'wizard', 'start', 'job', 'create', 'transfer', 'etl']
  },
  {
    id: 'validate-schema',
    title: 'Validate Schema & Cleanse Data',
    description: 'Run automated rule engine validation, anomaly detection, and data cleansing',
    category: 'Core Operations',
    icon: CheckCircle2,
    tabId: 'validation',
    shortcut: 'Alt + 4',
    keywords: ['validate', 'schema', 'cleanse', 'quality', 'null', 'rules', 'check']
  },
  {
    id: 'view-error-log',
    title: 'View Error Log & Diagnostics',
    description: 'Inspect failed records, exception stack traces, and dead-letter queues',
    category: 'Core Operations',
    icon: AlertTriangle,
    tabId: 'error-center',
    shortcut: 'Alt + 6',
    keywords: ['error', 'log', 'diagnostics', 'fail', 'exception', 'deadletter', 'retry', 'fix']
  },
  {
    id: 'run-simulation',
    title: 'Run Migration Dry-Run Simulation',
    description: 'Simulate throughput, resource load, and potential bottleneck risks',
    category: 'Core Operations',
    icon: Zap,
    tabId: 'simulation',
    keywords: ['simulation', 'dryrun', 'test', 'benchmark', 'predict', 'throughput']
  },
  {
    id: 'replay-migration',
    title: 'Replay Migration Time-Machine',
    description: 'Step backwards and forwards through historical migration event streams',
    category: 'Core Operations',
    icon: RotateCcw,
    tabId: 'migration-replay',
    keywords: ['replay', 'time', 'machine', 'history', 'rollback', 'stream', 'snapshot']
  },
  {
    id: 'schema-registry',
    title: 'Schema Registry & Mismatch Resolver',
    description: 'Manage versioned schemas, resolve breaking changes with Override/Patch/Fork',
    category: 'Data & Governance',
    icon: Database,
    tabId: 'schema-registry',
    keywords: ['schema', 'registry', 'version', 'mismatch', 'override', 'patch', 'fork', 'ddl']
  },
  {
    id: 'data-lineage',
    title: 'View End-to-End Data Lineage',
    description: 'Interactive graph visualization of source-to-target field dependencies',
    category: 'Data & Governance',
    icon: GitFork,
    tabId: 'lineage',
    keywords: ['lineage', 'graph', 'dependency', 'flow', 'source', 'target', 'impact']
  },
  {
    id: 'data-anonymization',
    title: 'Configure Data Anonymization',
    description: 'Set up PII masking, tokenization, and encryption privacy rules',
    category: 'Data & Governance',
    icon: ShieldCheck,
    tabId: 'data-anonymization',
    keywords: ['pii', 'anonymization', 'masking', 'privacy', 'security', 'gdpr', 'hash']
  },
  {
    id: 'audit-reporting',
    title: 'Generate Compliance & Audit Reports',
    description: 'Export PDF/CSV compliance logs and SOC2 data governance records',
    category: 'Data & Governance',
    icon: FileText,
    tabId: 'audit-reporting',
    keywords: ['audit', 'report', 'compliance', 'soc2', 'pdf', 'csv', 'governance']
  },
  {
    id: 'test-connectors',
    title: 'Test Connector Health & Latency',
    description: 'Ping all active ERP, CRM, and cloud database endpoint connections',
    category: 'Connectors & System',
    icon: Activity,
    tabId: 'connection-health',
    keywords: ['connector', 'health', 'ping', 'latency', 'test', 'endpoints', 'connection']
  },
  {
    id: 'system-health',
    title: 'Check Infrastructure & Server Metrics',
    description: 'Monitor CPU, Memory, Node.js runtime, and Cloud Run instance health',
    category: 'Connectors & System',
    icon: Server,
    tabId: 'system-health',
    keywords: ['system', 'health', 'cpu', 'memory', 'server', 'metrics', 'runtime']
  },
  {
    id: 'batch-engine',
    title: 'Batch Processing & Drag & Drop Scheduler',
    description: 'Configure 24-hour time slots, chunk sizes, and cascading triggers',
    category: 'Connectors & System',
    icon: CalendarDays,
    tabId: 'batch-processing',
    keywords: ['batch', 'schedule', 'cron', 'time', 'window', 'chunk', 'jobs']
  },
  {
    id: 'ai-copilot',
    title: 'Ask AI Co-Pilot Assistant',
    description: 'Get Gemini-powered data transformation SQL and schema advice',
    category: 'Co-Pilot & Settings',
    icon: Sparkles,
    tabId: 'ai-assistant',
    shortcut: 'Alt + 7',
    keywords: ['ai', 'copilot', 'gemini', 'assistant', 'prompt', 'sql', 'gpt']
  },
  {
    id: 'platform-settings',
    title: 'Open Platform Settings & Credentials',
    description: 'Manage API keys, environment variables, user roles, and themes',
    category: 'Co-Pilot & Settings',
    icon: Settings,
    tabId: 'settings',
    shortcut: 'Alt + 8',
    keywords: ['settings', 'config', 'api', 'key', 'theme', 'role', 'admin']
  },
  {
    id: 'tenant-management',
    title: 'Tenant Management Control Hub',
    description: 'Create, provision, configure, and manage subscription, resource, and backups for SaaS tenants',
    category: 'Core Operations',
    icon: Server,
    tabId: 'tenant-management',
    keywords: ['tenant', 'management', 'saas', 'multi', 'org', 'provision', 'billing', 'backup', 'branding']
  }
];

export const GlobalQuickActionModal: React.FC<GlobalQuickActionModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onTriggerCustomAction,
  userRole = 'Admin' as UserRole
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter items by RBAC role permission first, then search query
  const filteredActions = QUICK_ACTIONS.filter((action) => {
    if (userRole && !isRoleAllowedForTab(action.tabId, userRole as UserRole)) {
      return false;
    }
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      action.title.toLowerCase().includes(q) ||
      action.description.toLowerCase().includes(q) ||
      action.category.toLowerCase().includes(q) ||
      action.keywords.some((kw) => kw.includes(q))
    );
  });

  const handleSelectAction = (action: QuickActionItem) => {
    onNavigateTab(action.tabId);
    if (onTriggerCustomAction) {
      onTriggerCustomAction(action.id);
    }
    onClose();
  };

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        handleSelectAction(filteredActions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Group actions by category
  const categories = Array.from(new Set(filteredActions.map((a) => a.category)));

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 pb-10 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[80vh] text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-800 px-4 py-3.5 bg-slate-950/90">
          <Search className="w-5 h-5 text-indigo-400 shrink-0 mr-3 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search actions (e.g. 'Start New Migration', 'Validate Schema', 'Error Log')..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none font-medium"
          />
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono font-bold text-slate-400">
              ESC to close
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Filter Tag Buttons */}
        <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px] font-mono">
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mr-1">Quick Filters:</span>
          {['All', 'Migration', 'Schema', 'Error Log', 'Connector', 'AI'].map((tag) => {
            const isActive = tag === 'All' ? !query : query.toLowerCase().includes(tag.toLowerCase());
            return (
              <button
                key={tag}
                onClick={() => {
                  setQuery(tag === 'All' ? '' : tag);
                  setSelectedIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap font-bold ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Action List Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Command className="w-10 h-10 mx-auto text-slate-700 animate-pulse" />
              <p className="text-xs font-medium text-slate-400">
                No quick actions found matching "<strong className="text-slate-200">{query}</strong>"
              </p>
              <p className="text-[11px] text-slate-600">
                Try searching for 'migration', 'schema', 'error', 'lineage', or 'connectors'.
              </p>
            </div>
          ) : (
            categories.map((category) => {
              const categoryActions = filteredActions.filter((a) => a.category === category);
              if (categoryActions.length === 0) return null;

              return (
                <div key={category} className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-extrabold font-mono uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>{category}</span>
                    <span className="text-[9px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-400 border border-slate-700">
                      {categoryActions.length} Actions
                    </span>
                  </div>

                  <div className="space-y-1">
                    {categoryActions.map((action) => {
                      const currentIndex = filteredActions.indexOf(action);
                      const isSelected = currentIndex === selectedIndex;
                      const IconComp = action.icon;

                      return (
                        <div
                          key={action.id}
                          onClick={() => handleSelectAction(action)}
                          onMouseEnter={() => setSelectedIndex(currentIndex)}
                          className={`group p-3 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-md shadow-indigo-500/10'
                              : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`p-2 rounded-xl border transition-colors shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-xs'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 group-hover:text-indigo-400 group-hover:border-slate-700'
                              }`}
                            >
                              <IconComp className="w-4 h-4" />
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4
                                  className={`font-bold text-xs sm:text-sm transition-colors truncate ${
                                    isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                                  }`}
                                >
                                  {action.title}
                                </h4>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {action.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {action.shortcut && (
                              <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-900 border border-slate-700/80 rounded text-[10px] font-mono text-slate-400">
                                {action.shortcut}
                              </span>
                            )}
                            <span
                              className={`p-1.5 rounded-lg transition-transform ${
                                isSelected ? 'text-indigo-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 flex items-center gap-0.5">
                <CornerDownLeft className="w-2.5 h-2.5" />
                <span>Enter</span>
              </kbd>
              <span>Select</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <Command className="w-3.5 h-3.5" />
            <span>Shortcut: Ctrl + K / Cmd + K</span>
          </div>
        </div>
      </div>
    </div>
  );
};
