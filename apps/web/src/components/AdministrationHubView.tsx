import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import {
  Settings,
  Flag,
  Sparkles,
  Database,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  History,
  Cloud,
  Lock,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  ArrowRight,
  Link2,
  Unlink,
  Gauge,
  Server,
  Workflow,
  FileText,
  Minus,
  Plus,
  RefreshCw,
  Cpu,
  Trash2,
  HardDrive,
  Globe,
  Bell,
  Terminal,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileSearch,
  X,
  Key,
  Check,
  AlertCircle,
  Download,
  Clock,
  Hourglass,
  UserX,
  UserCheck,
  Search,
  Filter,
  FileSpreadsheet,
  ShieldAlert,
} from 'lucide-react';

type AdminTab = 'settings' | 'flags' | 'ai' | 'jobs' | 'storage' | 'monitoring' | 'backup' | 'dr' | 'expired-accounts';

export interface ExpiredAccountRecord {
  id: string;
  userName: string;
  email: string;
  role: string;
  creator: string;
  creatorEmail: string;
  preset: string;
  createdDate: string;
  expiredAt: string;
  cleanupStatus: "Auto-Disabled" | "Pending Purge" | "Purged & Destroyed" | "Archived";
  autoDisableTriggered: boolean;
  tokensRevoked: boolean;
  notes?: string;
}

const INITIAL_EXPIRED_ACCOUNTS: ExpiredAccountRecord[] = [
  {
    id: "exp-201",
    userName: "Siddharth Roy (Vendor)",
    email: "siddharth.roy@vendor-consulting.co",
    role: "Functional Consultant",
    creator: "fayasamd@gmail.com",
    creatorEmail: "fayasamd@gmail.com",
    preset: "1d",
    createdDate: "2026-08-14 10:00:00",
    expiredAt: "2026-08-15 10:00:00",
    cleanupStatus: "Auto-Disabled",
    autoDisableTriggered: true,
    tokensRevoked: true,
    notes: "Vendor temporary access window completed. Account auto-disabled and access tokens revoked."
  },
  {
    id: "exp-202",
    userName: "Elena Rostova (Pen-Tester)",
    email: "elena.rostova@sec-audit.io",
    role: "Auditor",
    creator: "Security Ops Policy Engine",
    creatorEmail: "secops-bot@enterprise.com",
    preset: "6h",
    createdDate: "2026-08-15 16:00:00",
    expiredAt: "2026-08-15 22:00:00",
    cleanupStatus: "Pending Purge",
    autoDisableTriggered: true,
    tokensRevoked: true,
    notes: "Security audit window closed. Queued for 24h retention before automated database credentials purge."
  },
  {
    id: "exp-203",
    userName: "David Chen (Contractor)",
    email: "d.chen.temp@external-cloud.net",
    role: "Data Engineer",
    creator: "fayasamd@gmail.com",
    creatorEmail: "fayasamd@gmail.com",
    preset: "1w",
    createdDate: "2026-08-07 09:00:00",
    expiredAt: "2026-08-14 09:00:00",
    cleanupStatus: "Archived",
    autoDisableTriggered: true,
    tokensRevoked: true,
    notes: "Migration wave contractor token expired and moved to compliance archive store."
  },
  {
    id: "exp-204",
    userName: "Karen Miller (Q/A Auditor)",
    email: "karen.m@qa-outsourcing.com",
    role: "Read Only",
    creator: "Sarah Jenkins (Lead Admin)",
    creatorEmail: "s.jenkins@enterprise.com",
    preset: "1m",
    createdDate: "2026-07-10 12:00:00",
    expiredAt: "2026-08-10 12:00:00",
    cleanupStatus: "Purged & Destroyed",
    autoDisableTriggered: true,
    tokensRevoked: true,
    notes: "Account expired over 5 days ago. User credentials and OAuth tokens permanently wiped."
  },
  {
    id: "exp-205",
    userName: "Alex Rivera (DevOps Consultant)",
    email: "alex.rivera@infra-partners.org",
    role: "Infrastructure Engineer",
    creator: "fayasamd@gmail.com",
    creatorEmail: "fayasamd@gmail.com",
    preset: "1d",
    createdDate: "2026-08-15 02:00:00",
    expiredAt: "2026-08-16 02:00:00",
    cleanupStatus: "Auto-Disabled",
    autoDisableTriggered: true,
    tokensRevoked: true,
    notes: "Cluster expansion contractor token expired."
  }
];

interface AdministrationHubViewProps {
  onNavigateTab: (tab: string) => void;
}

export const AdministrationHubView: React.FC<AdministrationHubViewProps> = ({ onNavigateTab }) => {
  const cpuTrend = useMemo(() => Array.from({ length: 30 }, (_, i) => ({ time: i, val: 30 + Math.random() * 20 + Math.sin(i / 2) * 10 })), []);
  const memTrend = useMemo(() => Array.from({ length: 30 }, (_, i) => ({ time: i, val: 50 + Math.random() * 15 + Math.cos(i / 3) * 5 })), []);
  const netTrend = useMemo(() => Array.from({ length: 30 }, (_, i) => ({ time: i, val: 0.8 + Math.random() * 0.8 + Math.sin(i) * 0.3 })), []);

  // Notification Engine States
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [inAppAlerts, setInAppAlerts] = useState<{id: number, title: string, body: string, type: 'error'|'warning'}[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
    if (permission === 'granted') {
      new Notification("Notifications Enabled", { body: "You will now receive real-time administration alerts." });
    }
  };

  const dispatchSystemAlert = (title: string, body: string, type: 'error'|'warning' = 'error') => {
    const id = Date.now();
    setInAppAlerts(prev => [{id, title, body, type}, ...prev].slice(0, 3));
    
    if (notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/1146/1146311.png',
      });
    }

    setTimeout(() => {
      setInAppAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const randomEvent = Math.random();
      if (randomEvent > 0.85) {
        const events = [
          { title: "Critical Migration Failure", body: "Job ID-99834 failed to map schema correctly on node-04.", type: "error" },
          { title: "CPU Threshold Exceeded", body: "Worker node 2 is operating at 98% capacity.", type: "warning" },
          { title: "Database Deadlock", body: "PostgreSQL transaction deadlock detected on Tenant_08.", type: "error" },
        ];
        const evt = events[Math.floor(Math.random() * events.length)];
        dispatchSystemAlert(evt.title, evt.body, evt.type as 'error' | 'warning');
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  const [thresholdAlerts, setThresholdAlerts] = useState<{ [key: string]: { enabled: boolean, threshold: number, unit: string } }>({
    'CPU Cluster Load': { enabled: false, threshold: 80, unit: '%' },
    'Memory Allocation': { enabled: false, threshold: 85, unit: '%' },
    'Network I/O': { enabled: false, threshold: 1.5, unit: 'GB/s' }
  });

  const toggleThresholdAlert = (label: string) => {
    setThresholdAlerts(prev => {
      const isEnabling = !prev[label].enabled;
      if (isEnabling) {
         dispatchSystemAlert(`Alert Active: ${label}`, `Will notify if usage exceeds ${prev[label].threshold}${prev[label].unit}`, 'warning');
      }
      return {
        ...prev,
        [label]: { ...prev[label], enabled: isEnabling }
      };
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      Object.entries(thresholdAlerts).forEach(([label, cfg]) => {
        const config = cfg as { enabled: boolean; threshold: number; unit: string };
        if (config.enabled) {
          const currentVal = label === 'Network I/O' ? Math.random() * 2 : Math.random() * 100;
          if (currentVal > config.threshold) {
             dispatchSystemAlert(`Threshold Breached: ${label}`, `Current value ${currentVal.toFixed(1)}${config.unit} exceeds limit of ${config.threshold}${config.unit}`, 'error');
          }
        }
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [thresholdAlerts, notificationsEnabled]);

  const [activeTab, setActiveTab] = useState<AdminTab>('settings');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Expired Account Log States & Handlers
  const [expiredLog, setExpiredLog] = useState<ExpiredAccountRecord[]>(INITIAL_EXPIRED_ACCOUNTS);
  const [expiredSearch, setExpiredSearch] = useState('');
  const [expiredStatusFilter, setExpiredStatusFilter] = useState<string>('All');
  const [selectedExpiredItem, setSelectedExpiredItem] = useState<ExpiredAccountRecord | null>(null);
  const [isExpiredDetailModalOpen, setIsExpiredDetailModalOpen] = useState(false);
  const [expiredNotification, setExpiredNotification] = useState<string | null>(null);

  const showExpiredToast = (msg: string) => {
    setExpiredNotification(msg);
    setTimeout(() => setExpiredNotification(null), 4000);
  };

  const handlePurgeAccount = (id: string) => {
    setExpiredLog(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              cleanupStatus: 'Purged & Destroyed',
              notes: `Purged manually by administrator at ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`,
            }
          : item
      )
    );
    showExpiredToast('Account credentials and sessions purged successfully.');
  };

  const handleArchiveAccount = (id: string) => {
    setExpiredLog(prev =>
      prev.map(item =>
        item.id === id ? { ...item, cleanupStatus: 'Archived' } : item
      )
    );
    showExpiredToast('Expired account log archived for compliance storage.');
  };

  const handleBulkPurgeExpired = () => {
    const purgeableCount = expiredLog.filter(
      x => x.cleanupStatus === 'Auto-Disabled' || x.cleanupStatus === 'Pending Purge'
    ).length;
    if (purgeableCount === 0) {
      showExpiredToast('No pending or auto-disabled expired accounts to purge.');
      return;
    }
    setExpiredLog(prev =>
      prev.map(item =>
        item.cleanupStatus === 'Auto-Disabled' || item.cleanupStatus === 'Pending Purge'
          ? {
              ...item,
              cleanupStatus: 'Purged & Destroyed',
              notes: `Bulk purged by administrator on ${new Date().toISOString().split('T')[0]}`,
            }
          : item
      )
    );
    showExpiredToast(`Successfully purged ${purgeableCount} expired account records.`);
  };

  const handleExportExpiredCSV = () => {
    let csv = 'ID,User Name,Email,Role,Creator,Preset,Created Date,Expired At,Cleanup Status,Tokens Revoked,Notes\n';
    expiredLog.forEach(item => {
      csv += `"${item.id}","${item.userName}","${item.email}","${item.role}","${item.creator}","${item.preset}","${item.createdDate}","${item.expiredAt}","${item.cleanupStatus}","${item.tokensRevoked}","${(item.notes || '').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expired-account-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showExpiredToast('Exported Expired Account Audit Log to CSV.');
  };

  const filteredExpiredLog = useMemo(() => {
    return expiredLog.filter(item => {
      const matchesSearch =
        item.userName.toLowerCase().includes(expiredSearch.toLowerCase()) ||
        item.email.toLowerCase().includes(expiredSearch.toLowerCase()) ||
        item.creator.toLowerCase().includes(expiredSearch.toLowerCase()) ||
        item.role.toLowerCase().includes(expiredSearch.toLowerCase());

      const matchesStatus =
        expiredStatusFilter === 'All' || item.cleanupStatus === expiredStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [expiredLog, expiredSearch, expiredStatusFilter]);

  const exportResourceData = () => {
    let csv = 'Time,CPU Cluster Load (%),Memory Allocation (%),Network I/O (GB/s)\n';
    for (let i = 0; i < 30; i++) {
      csv += `${i},${cpuTrend[i].val.toFixed(2)},${memTrend[i].val.toFixed(2)},${netTrend[i].val.toFixed(2)}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `node-resource-usage-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Background Job Orchestration States
  const [expandedStreamId, setExpandedStreamId] = useState<number | null>(1);
  const [queueStreams, setQueueStreams] = useState([
    { 
      id: 1, 
      name: 'Data_Validation_Queue', 
      depth: '12,450', 
      latency: '42ms', 
      workers: 4,
      status: 'active' as 'active' | 'paused',
      throughput: '1,840 msg/sec',
      errorRate: '0.01%',
      consumerGroup: 'cg_val_primary',
      samples: [
        { id: 'evt_9021', time: 'Just now', payload: '{ user_id: 84920, type: "REVALIDATE_SCHEMA" }', duration: '12ms', status: 'COMPLETED' },
        { id: 'evt_9020', time: '2s ago', payload: '{ user_id: 39211, type: "CHECK_FOREIGN_KEY" }', duration: '18ms', status: 'COMPLETED' },
        { id: 'evt_9019', time: '5s ago', payload: '{ user_id: 12904, type: "TYPE_CAST_ASSERT" }', duration: '41ms', status: 'COMPLETED' },
      ]
    },
    { 
      id: 2, 
      name: 'AI_Schema_Analysis_Stream', 
      depth: '842', 
      latency: '1,250ms', 
      workers: 6,
      status: 'active' as 'active' | 'paused',
      throughput: '240 msg/sec',
      errorRate: '0.12%',
      consumerGroup: 'cg_ai_pipeline',
      samples: [
        { id: 'ai_3041', time: '1s ago', payload: '{ model: "gemini-1.5-pro", tokens: 3410 }', duration: '1120ms', status: 'COMPLETED' },
        { id: 'ai_3040', time: '3s ago', payload: '{ model: "claude-3-5-sonnet", tokens: 1980 }', duration: '1430ms', status: 'COMPLETED' },
      ]
    },
    { 
      id: 3, 
      name: 'Migration_Replay_Buffer', 
      depth: '0', 
      latency: '1ms', 
      workers: 2,
      status: 'paused' as 'active' | 'paused',
      throughput: '0 msg/sec',
      errorRate: '0.00%',
      consumerGroup: 'cg_migration_replay',
      samples: [
        { id: 'mg_0012', time: '12m ago', payload: '{ batch_id: 902, offset: 489201 }', duration: '2ms', status: 'PAUSED' },
      ]
    },
  ]);
  const [jobStats, setJobStats] = useState({
    pending: 42,
    running: 12,
    completed: 1200,
    failed: 3
  });

  // Modal & Pre-flight Form states
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [newJobName, setNewJobName] = useState('');
  const [newJobSource, setNewJobSource] = useState('PostgreSQL Ingress Core');
  const [newJobTarget, setNewJobTarget] = useState('Snowflake Analytical Lake');
  const [newJobWorkers, setNewJobWorkers] = useState(4);
  const [newJobDepth, setNewJobDepth] = useState('5,000');

  // Pre-flight validation state
  const [preflightState, setPreflightState] = useState<'idle' | 'checking' | 'mismatch' | 'resolved' | 'success'>('idle');
  const [preflightStep, setPreflightStep] = useState(0);
  const [preflightLogs, setPreflightLogs] = useState<string[]>([]);
  const [isAutoHealed, setIsAutoHealed] = useState(false);

  // Storage Buffer states
  const [storageMetrics, setStorageMetrics] = useState([
    { label: 'Object Storage (GCS)', val: 45.8, unit: 'TB', max: 100, color: 'bg-indigo-600', icon: Cloud },
    { label: 'Relational DB (PostgreSQL)', val: 2.4, unit: 'TB', max: 10, color: 'bg-emerald-600', icon: Database },
    { label: 'Redis Cache (L1)', val: 128.0, unit: 'GB', max: 256, color: 'bg-amber-600', icon: Zap },
  ]);

  useEffect(() => {
    let frameId: number;
    let lastUpdate = Date.now();

    const animateStorage = () => {
      const now = Date.now();
      if (now - lastUpdate > 1000) {
        setStorageMetrics(prev => prev.map(metric => {
          let fluctuation = (Math.random() - 0.5) * (metric.unit === 'GB' ? 1.5 : 0.05);
          return {
            ...metric,
            val: Math.max(0, Math.min(metric.max, metric.val + fluctuation))
          };
        }));
        lastUpdate = now;
      }
      frameId = requestAnimationFrame(animateStorage);
    };

    if (activeTab === 'storage') {
      frameId = requestAnimationFrame(animateStorage);
    }

    return () => cancelAnimationFrame(frameId);
  }, [activeTab]);

  // AI Multi-Provider Engines & Real-time Keys Setup
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'anthropic' | 'kimi' | 'glm' | 'qwen'>('gemini');
  const [selectedModel, setSelectedModel] = useState('Gemini 1.5 Pro');
  const [providerMetrics, setProviderMetrics] = useState([
    { name: 'Gemini', latency: 145, tokens: 2.4, status: 'Healthy' },
    { name: 'OpenAI', latency: 182, tokens: 1.8, status: 'Healthy' },
    { name: 'Anthropic', latency: 210, tokens: 0.9, status: 'Healthy' },
    { name: 'Kimi', latency: 280, tokens: 0.4, status: 'Healthy' },
    { name: 'Zhipu GLM', latency: 195, tokens: 0.3, status: 'Healthy' },
    { name: 'Alibaba Qwen', latency: 220, tokens: 0.6, status: 'Healthy' },
  ]);
  const [aiKeys, setAiKeys] = useState<Record<string, string>>({
    gemini: 'GEMINI_v3.6_ACTIVE_SYSTEM_SESSION_KEY',
    openai: '',
    anthropic: '',
    kimi: '',
    glm: '',
    qwen: '',
  });
  const [temperature, setTemperature] = useState(0.2);
  const [safetyFilter, setSafetyFilter] = useState('Block None (Development)');
  const [tokenCap, setTokenCap] = useState('500,000,000');

  // Interactive Live Connection Test States
  const [connectionTestStatus, setConnectionTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testResultLog, setTestResultLog] = useState('');
  const [testLatency, setTestLatency] = useState(0);

  // Integration Channels State & Modal Controls
  const [notificationChannels, setNotificationChannels] = useState([
    { id: 1, channel: 'Slack Enterprise', hook: 'https://hooks.slack.com/services/T0001...', status: 'Connected', icon: 'Zap' },
    { id: 2, channel: 'Email (SMTP)', hook: 'admin-escalations@enterprise.com', status: 'Connected', icon: 'Globe' },
    { id: 3, channel: 'PagerDuty', hook: 'PD-EDIMP-SERVICE-44', status: 'Standby', icon: 'Activity' },
  ]);
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelHook, setNewChannelHook] = useState('');
  const [newChannelIcon, setNewChannelIcon] = useState('Zap');
  const [newChannelStatus, setNewChannelStatus] = useState('Connected');

  const getChannelIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return Zap;
      case 'Globe': return Globe;
      case 'Activity': return Activity;
      case 'Bell': return Bell;
      case 'Terminal': return Terminal;
      default: return Bell;
    }
  };

  // Backup Orchestration States
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupStatus, setBackupStatus] = useState('Idle');
  const [latestSnapshot, setLatestSnapshot] = useState({
    timestamp: '2026-08-10 04:00:12 UTC',
    size: '12.8 TB',
    consistency: 'Atomic / Strict',
    targets: 'Multi-Cloud Standby (GCS + S3)'
  });

  const triggerAdHocBackup = () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    setBackupProgress(0);
    setBackupStatus('Initializing atomic snapshot...');

    const steps = [
      { p: 10, s: 'Quiescing active cluster nodes...' },
      { p: 30, s: 'Exporting relational database schema...' },
      { p: 55, s: 'Compressing object storage artifacts...' },
      { p: 75, s: 'Replicating chunks to Multi-Cloud targets...' },
      { p: 90, s: 'Verifying cryptographic checksums...' },
      { p: 100, s: 'Finalizing metadata manifest...' },
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setBackupProgress(steps[stepIndex].p);
        setBackupStatus(steps[stepIndex].s);
        stepIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setLatestSnapshot({
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
            size: (12.8 + Math.random() * 0.4).toFixed(2) + ' TB',
            consistency: 'Atomic / Strict',
            targets: 'Multi-Cloud Standby (GCS + S3)'
          });
          setIsBackingUp(false);
          setBackupStatus('Completed successfully');
          setTimeout(() => setBackupStatus('Idle'), 3000);
        }, 500);
      }
    }, 700);
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName || !newChannelHook) return;
    
    setNotificationChannels(prev => [
      ...prev,
      {
        id: Date.now(),
        channel: newChannelName,
        hook: newChannelHook,
        status: newChannelStatus,
        icon: newChannelIcon
      }
    ]);

    // Reset Form & Close
    setNewChannelName('');
    setNewChannelHook('');
    setNewChannelIcon('Zap');
    setNewChannelStatus('Connected');
    setIsAddChannelModalOpen(false);
  };

  const handleDeleteChannel = (id: number) => {
    setNotificationChannels(prev => prev.filter(c => c.id !== id));
  };

  // Real-time Telemetry State
  const [healthIndex, setHealthIndex] = React.useState(99.98);
  const [nodeCount, setNodeCount] = React.useState(128);
  const [liveLog, setLiveLog] = React.useState('Monitoring global failover routing');
  const [isLivePulse, setIsLivePulse] = React.useState(true);

  // Feature Toggles State & Modal Controls
  const [featureFlags, setFeatureFlags] = useState([
    { id: 1, name: 'AI_AUTOMATIC_MAPPING', desc: 'Enable Gemini-powered schema auto-discovery in Mapping Studio.', status: true, tier: 'Beta' },
    { id: 2, name: 'REAL_TIME_CDC_STREAMING', desc: 'Enables Change Data Capture triggers for sub-second synchronization.', status: true, tier: 'Production' },
    { id: 3, name: 'PARQUET_EXPORT_V2', desc: 'Enable multi-threaded Parquet file serialization engine.', status: false, tier: 'Experimental' },
    { id: 4, name: 'SYSTEM_MAINTENANCE_MODE', desc: 'Lock platform for all non-admin users (Emergency Kill Switch).', status: false, tier: 'Global' },
    { id: 5, name: 'MULTI_REGION_FAILOVER', desc: 'Automated standby routing to us-west-2 cluster on high latency.', status: true, tier: 'Production' },
  ]);
  const [isAddFlagModalOpen, setIsAddFlagModalOpen] = useState(false);
  const [newFlagName, setNewFlagName] = useState('');
  const [newFlagDesc, setNewFlagDesc] = useState('');
  const [newFlagTier, setNewFlagTier] = useState('Production');
  const [newFlagStatus, setNewFlagStatus] = useState(false);

  const toggleFlag = (id: number) => {
    setFeatureFlags(prev => prev.map(f => f.id === id ? { ...f, status: !f.status } : f));
    setLiveLog(`Feature toggle changed across active nodes`);
  };

  const handleCreateFlag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlagName) return;

    // Standardize to uppercase alpha-numeric & underscore for flag names
    const formattedName = newFlagName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    setFeatureFlags(prev => [
      ...prev,
      {
        id: Date.now(),
        name: formattedName,
        desc: newFlagDesc.trim() || 'No description provided.',
        status: newFlagStatus,
        tier: newFlagTier
      }
    ]);

    // Reset Form & Close
    setNewFlagName('');
    setNewFlagDesc('');
    setNewFlagTier('Production');
    setNewFlagStatus(false);
    setIsAddFlagModalOpen(false);
    setLiveLog(`Registered system flag: ${formattedName}`);
  };

  const handleDeleteFlag = (id: number) => {
    setFeatureFlags(prev => prev.filter(f => f.id !== id));
    setLiveLog(`Deregistered system feature flag`);
  };

  React.useEffect(() => {
    const logs = [
      'Heartbeat handshake: spark-worker-01 verified',
      'Config cache synced across 128 nodes',
      'Monitoring global failover routing',
      'Disaster standby replicated successfully',
      'JVM heap garbage collection run complete',
      'Ingestion throughput safe: 14.8k rec/sec',
      'Latency checkpoint: 42ms median latency',
      'OData connection health validated',
    ];

    const interval = setInterval(() => {
      // Small realistic fluctuations
      setHealthIndex(prev => {
        const delta = (Math.random() - 0.5) * 0.04;
        const next = prev + delta;
        return Number(Math.min(100, Math.max(99.85, next)).toFixed(2));
      });

      setNodeCount(prev => {
        const delta = Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.min(130, Math.max(126, prev + delta));
      });

      setLiveLog(prev => {
        const filtered = logs.filter(l => l !== prev);
        return filtered[Math.floor(Math.random() * filtered.length)];
      });

      setIsLivePulse(prev => !prev);

      setProviderMetrics(prev => prev.map(p => {
        const delta = (Math.random() - 0.5) * 14;
        const nextLatency = Math.max(90, Math.min(380, Math.round(p.latency + delta)));
        const tokenIncr = Math.random() * 0.05;
        const nextTokens = Number((p.tokens + tokenIncr).toFixed(3));
        let status = p.status;
        if (Math.random() > 0.96) {
          status = status === 'Healthy' ? 'Warning' : 'Healthy';
        }
        return {
          ...p,
          latency: nextLatency,
          tokens: nextTokens,
          status,
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setLiveLog('Applying system changes across active nodes...');
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setLiveLog('Config cache synced across 128 nodes');
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const handleRunPreflightCheck = () => {
    setPreflightState('checking');
    setPreflightStep(0);
    setPreflightLogs(['Establishing connection to ' + newJobSource + '...']);
    setIsAutoHealed(false);

    const steps = [
      'Connected successfully to source endpoint. Syncing schema catalogs...',
      'Mapping constraint keys & temporal precision matrices...',
      'ERROR: Schema mismatch detected on column `audit_id` (Source: INT8 vs Target: UUIDv4).',
    ];

    let current = 0;
    const timer = setInterval(() => {
      if (current < steps.length) {
        setPreflightLogs(prev => [...prev, steps[current]]);
        current++;
      } else {
        clearInterval(timer);
        setPreflightState('mismatch');
      }
    }, 1000);
  };

  const handleAutoHealSchema = () => {
    setPreflightState('checking');
    setPreflightLogs(prev => [...prev, 'Initiating target-side index & data-type reconciliation...', 'Applying virtual type-cast wrapper: CAST(audit_id AS VARCHAR)...']);
    
    setTimeout(() => {
      setPreflightLogs(prev => [
        ...prev,
        'Auto-Casting complete.',
        'Pre-flight schemas matched at 100% precision.',
        '✅ Target destination is fully compatible with source dataset.'
      ]);
      setPreflightState('success');
      setIsAutoHealed(true);
    }, 1200);
  };

  const handleCreateJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobName || preflightState !== 'success') return;

    // Append to active streams list
    const formattedName = newJobName.trim().replace(/\s+/g, '_');
    const newId = Date.now();
    setQueueStreams(prev => [
      ...prev,
      {
        id: newId,
        name: formattedName,
        depth: Number(newJobDepth.replace(/,/g, '')).toLocaleString(),
        latency: '14ms',
        workers: Number(newJobWorkers),
        status: 'active' as const,
        throughput: '640 msg/sec',
        errorRate: '0.00%',
        consumerGroup: `cg_${formattedName.toLowerCase().slice(0, 10)}`,
        samples: [
          { id: `cst_${Math.floor(Math.random()*9000+1000)}`, time: 'Just now', payload: `{ source: "${newJobSource}", target: "${newJobTarget}" }`, duration: '14ms', status: 'COMPLETED' }
        ]
      }
    ]);
    setExpandedStreamId(newId);

    // Update global orchestration counters
    setJobStats(prev => ({
      ...prev,
      running: prev.running + 1,
      pending: prev.pending + 1
    }));

    // Trigger success notification and clean up modal states
    setLiveLog(`Registered Background Orchestration Job: ${formattedName}`);
    setIsNewJobModalOpen(false);
    setNewJobName('');
    setPreflightState('idle');
    setPreflightLogs([]);
    setIsAutoHealed(false);
  };

  const activeWorkersSum = queueStreams.reduce((sum, q) => sum + q.workers, 0);

  const tabs: { id: AdminTab; label: string; icon: any; color: string }[] = [
    { id: 'settings', label: 'System Settings', icon: Settings, color: 'text-indigo-600' },
    { id: 'flags', label: 'Feature Flags', icon: Flag, color: 'text-amber-600' },
    { id: 'ai', label: 'AI Model Config', icon: Sparkles, color: 'text-purple-600' },
    { id: 'jobs', label: 'Jobs & Queues', icon: Layers, color: 'text-orange-600' },
    { id: 'monitoring', label: 'Health Monitoring', icon: Activity, color: 'text-emerald-600' },
    { id: 'storage', label: 'Storage Mgmt', icon: Database, color: 'text-sky-600' },
    { id: 'backup', label: 'Backup Engine', icon: Save, color: 'text-blue-600' },
    { id: 'dr', label: 'Disaster Recovery', icon: ShieldCheck, color: 'text-rose-600' },
    { id: 'expired-accounts', label: 'Expired Account Log', icon: Hourglass, color: 'text-amber-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50/40 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-indigo-100 font-mono">
              Module 45 – Unified Admin Control Plane
            </span>
            <span className="px-2.5 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200 font-mono flex items-center gap-1.5 animate-pulse">
              <span className={`w-1.5 h-1.5 rounded-full ${isLivePulse ? 'bg-indigo-600' : 'bg-indigo-400'} transition-all`} />
              Live activity: {liveLog}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-indigo-600" />
            Administration & Platform Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Configure platform-wide heuristics, toggle experimental features, orchestrate AI model parameters, and manage global disaster recovery failover.
          </p>
        </div>
        
        <div className="flex items-center gap-3 z-10">
          <button
            onClick={requestNotificationPermission}
            className={`p-2.5 rounded-xl border transition-all ${notificationsEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-inner' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 shadow-sm hover:shadow active:scale-95'}`}
            title={notificationsEnabled ? 'Notifications Active' : 'Enable Desktop Notifications'}
          >
            <div className="relative">
              <Bell className="w-4 h-4" />
              {notificationsEnabled && <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
            </div>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving Configurations...' : 'Apply Global Changes'}
          </button>
        </div>
      </div>

      {inAppAlerts.length > 0 && (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-80">
          {inAppAlerts.map(alert => (
            <div key={alert.id} className={`p-4 rounded-2xl shadow-xl border animate-in slide-in-from-right-8 fade-in ${alert.type === 'error' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${alert.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                  {alert.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-black truncate ${alert.type === 'error' ? 'text-rose-900' : 'text-amber-900'}`}>{alert.title}</h4>
                  <p className={`text-xs mt-1 leading-relaxed ${alert.type === 'error' ? 'text-rose-700/80' : 'text-amber-800/80'}`}>{alert.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuccess && (
        <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-500/20 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-bold tracking-tight">System configurations applied successfully across all clusters.</span>
          </div>
          <button onClick={() => setShowSuccess(false)} className="text-white/80 hover:text-white"><Plus className="w-4 h-4 rotate-45" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer border ${
                activeTab === tab.id
                  ? 'bg-white border-slate-200 shadow-sm text-slate-900 ring-1 ring-slate-200'
                  : 'bg-slate-50/50 border-transparent text-slate-600 hover:bg-white hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? tab.color : 'text-slate-400'}`} />
                <span className="text-sm font-bold tracking-tight">{tab.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === tab.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
            </button>
          ))}

          <div className="mt-8 p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest font-mono flex items-center justify-between">
              <span>Quick Telemetry</span>
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping shrink-0" />
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Health Index</span>
                <span className="text-xs font-black text-emerald-600">{healthIndex}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-1000 ease-in-out" 
                  style={{ width: `${Math.min(100, healthIndex)}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Node Count</span>
                <span className="text-xs font-black text-slate-900">{nodeCount} Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="lg:col-span-9 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Platform Heuristics & Regional Settings</h2>
                    <p className="text-xs text-slate-600 font-medium">Define global execution behaviors and compliance standards.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">System Timezone</label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                      <option>UTC (Coordinated Universal Time)</option>
                      <option>PST (Pacific Standard Time)</option>
                      <option>EST (Eastern Standard Time)</option>
                      <option>CET (Central European Time)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Log Retention Period</label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                      <option>30 Days (Standard)</option>
                      <option>90 Days (Compliance)</option>
                      <option>1 Year (Historical)</option>
                      <option>Indefinite (Archived)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    Platform Operations & Observability
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => onNavigateTab('system-health')}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-300 transition-all cursor-pointer w-full"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl border border-slate-200">
                          <Cpu className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 uppercase tracking-tight">System Health</div>
                          <div className="text-[10px] text-slate-600 italic font-medium">Auto-scaling & Risk Forecasts</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </button>
                    <button 
                      onClick={() => onNavigateTab('batch-processing')}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-300 transition-all cursor-pointer w-full"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl border border-slate-200">
                          <Layers className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 uppercase tracking-tight">Batch & Queues</div>
                          <div className="text-[10px] text-slate-500 italic">Job Schedules & DLQ Monitoring</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">System Notification Routing</h2>
                    <p className="text-xs text-slate-500">Configure global alert channels and escalation policies.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {notificationChannels.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
                      No active integration channels. Click below to register one!
                    </div>
                  ) : (
                    notificationChannels.map((chan) => {
                      const IconComponent = getChannelIcon(chan.icon);
                      return (
                        <div key={chan.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group/item hover:border-indigo-100 hover:bg-indigo-50/10 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl border border-slate-200 group-hover/item:border-indigo-200 transition-all">
                              <IconComponent className="w-4 h-4 text-slate-600 group-hover/item:text-indigo-600" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-900">{chan.channel}</div>
                              <div className="text-[10px] font-mono text-slate-500 max-w-[200px] sm:max-w-md truncate">{chan.hook}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                              chan.status === 'Connected' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {chan.status}
                            </span>
                            <button 
                              onClick={() => handleDeleteChannel(chan.id)}
                              className="p-1.5 bg-white text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-100 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover/item:opacity-100 cursor-pointer"
                              title="Delete Channel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <button 
                    onClick={() => setIsAddChannelModalOpen(true)}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-bold hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Integration Channel
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'flags' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                    <Flag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Feature Toggles & Kill Switches</h2>
                    <p className="text-xs text-slate-500">Manage runtime availability of platform capabilities.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddFlagModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" /> Create Flag
                </button>
              </div>

              <div className="space-y-4">
                {featureFlags.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-150 text-slate-400 text-xs">
                    No custom feature flags configured yet. Click "Create Flag" to register one.
                  </div>
                ) : (
                  featureFlags.map((flag) => (
                    <div key={flag.id} className="group/flag p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-black text-slate-900 tracking-tight">{flag.name}</code>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-lg border border-slate-200">{flag.tier}</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">{flag.desc}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          {/* Toggle switch */}
                          <button 
                            onClick={() => toggleFlag(flag.id)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${flag.status ? 'bg-amber-500' : 'bg-slate-200'}`}
                          >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${flag.status ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>

                          {/* Delete switch */}
                          <button 
                            onClick={() => handleDeleteFlag(flag.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg opacity-0 group-hover/flag:opacity-100 transition-all cursor-pointer"
                            title="Delete Flag"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}          {activeTab === 'ai' && (() => {
            const MODEL_PROVIDERS = {
              gemini: {
                name: 'Google Gemini',
                models: ['Gemini 2.5 Flash', 'Gemini 2.0 Pro', 'Gemini 1.5 Pro', 'Gemini 1.5 Flash'],
                placeholderKey: 'GEMINI_API_KEY',
                desc: 'DeepMind next-generation multimodality native engine.',
                color: 'border-indigo-200 text-indigo-700 bg-indigo-50/50'
              },
              openai: {
                name: 'OpenAI GPT',
                models: ['GPT-4o (Omni)', 'o1-pro', 'GPT-4-turbo', 'GPT-3.5-turbo'],
                placeholderKey: 'OPENAI_API_KEY',
                desc: 'Industry standard advanced reasoning and multi-modal models.',
                color: 'border-emerald-200 text-emerald-700 bg-emerald-50/50'
              },
              anthropic: {
                name: 'Anthropic Claude',
                models: ['Claude 3.5 Sonnet', 'Claude 3 Opus', 'Claude 3 Haiku'],
                placeholderKey: 'ANTHROPIC_API_KEY',
                desc: 'Constitutional safe LLMs with industry-leading code synthesis.',
                color: 'border-amber-200 text-amber-700 bg-amber-50/50'
              },
              kimi: {
                name: 'Moonshot Kimi',
                models: ['Kimi-Chat-v1-200k', 'Kimi-Chat-v1-32k'],
                placeholderKey: 'KIMI_API_KEY',
                desc: 'Ultra-high-context recall models optimized for long dossiers.',
                color: 'border-sky-200 text-sky-700 bg-sky-50/50'
              },
              glm: {
                name: 'Zhipu GLM',
                models: ['GLM-4-Plus', 'GLM-4-Air', 'GLM-3-Turbo'],
                placeholderKey: 'ZHIPU_GLM_API_KEY',
                desc: 'Highly optimized bilingual models supporting complex agentic structures.',
                color: 'border-rose-200 text-rose-700 bg-rose-50/50'
              },
              qwen: {
                name: 'Alibaba Qwen',
                models: ['Qwen-2.5-72B-Instruct', 'Qwen-2.5-Coder', 'Qwen-VL-Max'],
                placeholderKey: 'QWEN_API_KEY',
                desc: 'Open-weights global leader in synthetic reasoning and language mapping.',
                color: 'border-purple-200 text-purple-700 bg-purple-50/50'
              }
            };

            const runConnectionTest = () => {
              if (connectionTestStatus === 'testing') return;

              setConnectionTestStatus('testing');
              setLiveLog(`Pinging model target environment...`);

              const activeKey = aiKeys[selectedProvider];
              const hasKey = activeKey && activeKey.trim().length > 6;

              setTimeout(() => {
                const latency = Math.floor(140 + Math.random() * 180);
                setTestLatency(latency);

                if (!hasKey) {
                  setConnectionTestStatus('failed');
                  setTestResultLog(`Verification Failed: No valid registered API Key found for ${selectedProvider.toUpperCase()}. Please configure key below first.`);
                  setLiveLog(`Integration diagnostic failed for ${selectedProvider.toUpperCase()}`);
                } else {
                  setConnectionTestStatus('success');
                  setTestResultLog(`Handshake Successful: Validated ${MODEL_PROVIDERS[selectedProvider].name} - ${selectedModel}. System Latency: ${latency}ms. Security rules enforced.`);
                  setLiveLog(`Verified connection with ${MODEL_PROVIDERS[selectedProvider].name}`);
                }
              }, 1200);
            };

            const currentProv = MODEL_PROVIDERS[selectedProvider];

            return (
              <div className="space-y-6">
                <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6 animate-in fade-in duration-250">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900">AI Multi-Model Configuration & Tokens</h2>
                        <p className="text-xs text-slate-500">Configure global model orchestrators, real-time API integrations, and token usage thresholds.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Terminal className="w-4 h-4 text-indigo-600" />
                      <span>Runtime: Multi-LLM Routing v4.0</span>
                    </div>
                  </div>

                  {/* Provider Grid Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Select Active LLM Engine Provider</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {(Object.keys(MODEL_PROVIDERS) as Array<keyof typeof MODEL_PROVIDERS>).map((key) => {
                        const isSel = selectedProvider === key;
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedProvider(key);
                              setSelectedModel(MODEL_PROVIDERS[key].models[0]);
                              setConnectionTestStatus('idle');
                              setTestResultLog('');
                            }}
                            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                              isSel 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 text-slate-700'
                            }`}
                          >
                            <Cpu className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{MODEL_PROVIDERS[key].name.split(' ')[1] || MODEL_PROVIDERS[key].name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Provider Info card & API Key input */}
                  <div className={`p-5 rounded-2xl border ${currentProv.color} space-y-4`}>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider">Active Engine: {currentProv.name}</h4>
                      <p className="text-xs mt-0.5 leading-relaxed opacity-90">{currentProv.desc}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
                      {/* Live API Key Integration */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5" />
                          <span>Real-Time {currentProv.name} API Key Setup</span>
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder={aiKeys[selectedProvider] ? '••••••••••••••••••••••••' : `Enter custom ${currentProv.placeholderKey}...`}
                            value={aiKeys[selectedProvider] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAiKeys(prev => ({ ...prev, [selectedProvider]: val }));
                              if (connectionTestStatus !== 'idle') setConnectionTestStatus('idle');
                            }}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
                          />
                          <div className="absolute left-3.5 top-3 text-slate-400">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <span className="text-[9px] opacity-75 block font-mono">Kept secure client-side. Web and API actions synchronize instantly.</span>
                      </div>

                      {/* Dropdown for specific models */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider block">Specific LLM Model Target</label>
                        <select
                          value={selectedModel}
                          onChange={(e) => {
                            setSelectedModel(e.target.value);
                            setConnectionTestStatus('idle');
                          }}
                          className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        >
                          {currentProv.models.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <span className="text-[9px] opacity-75 block font-mono">Resolves automatic failover strategies inside nodes.</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Temperature</label>
                          <span className="text-xs font-mono font-bold text-indigo-600">{temperature} ({temperature <= 0.3 ? 'Deterministic' : 'Creative'})</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.1" 
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                          <span>Precise</span>
                          <span>Creative</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Safety Filter Threshold</label>
                        <select 
                          value={safetyFilter}
                          onChange={(e) => setSafetyFilter(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        >
                          <option>Block None (Development)</option>
                          <option>Block Some (Balanced)</option>
                          <option>Block Most (Enterprise Strict)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Token Usage Cap (Monthly)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="text" 
                        value={tokenCap}
                        onChange={(e) => setTokenCap(e.target.value)}
                        className="max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900" 
                      />
                      <span className="text-xs font-bold text-slate-500 uppercase font-mono">Tokens / Month</span>
                    </div>
                  </div>
                </section>

                {/* Real-time LLM Provider Telemetry Monitor & Live Chart */}
                <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <span>Real-Time LLM Provider Telemetry Monitor</span>
                      </h3>
                      <p className="text-[10px] text-slate-500">Live transaction tracking, query response latency, and accumulated token usage metrics.</p>
                    </div>
                    <span className="self-start sm:self-auto px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-md border border-emerald-100 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      <span>Live Feed Active</span>
                    </span>
                  </div>

                  {/* Provider Stats Badges Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {providerMetrics.map((p) => (
                      <div key={p.name} className="p-3 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between hover:border-slate-300 hover:bg-slate-100/50 transition-all">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate">{p.name}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Healthy' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-baseline text-[10px] text-slate-500">
                            <span>Latency:</span>
                            <span className="font-mono font-bold text-slate-900">{p.latency}ms</span>
                          </div>
                          <div className="flex justify-between items-baseline text-[10px] text-slate-500">
                            <span>Tokens:</span>
                            <span className="font-mono font-black text-indigo-600">{p.tokens}M</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Live Recharts Dual-Axis Telemetry Graphic */}
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4 text-center">
                      Live Performance Benchmark Tunnels (Dual-Axis Charting)
                    </div>
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={providerMetrics} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#64748b" 
                            fontSize={10} 
                            fontWeight="bold" 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <YAxis 
                            yAxisId="left" 
                            stroke="#6366f1" 
                            fontSize={10} 
                            fontWeight="bold" 
                            tickLine={false} 
                            axisLine={false} 
                            label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: '9px', fill: '#6366f1', fontWeight: 'bold' } }}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            stroke="#10b981" 
                            fontSize={10} 
                            fontWeight="bold" 
                            tickLine={false} 
                            axisLine={false} 
                            label={{ value: 'Tokens (Millions)', angle: 90, position: 'insideRight', offset: -5, style: { fontSize: '9px', fill: '#10b981', fontWeight: 'bold' } }}
                          />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', padding: '10px' }}
                            labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}
                            itemStyle={{ fontSize: '10px', color: '#cbd5e1' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '10px' }} />
                          <Bar 
                            yAxisId="right" 
                            dataKey="tokens" 
                            fill="#10b981" 
                            radius={[6, 6, 0, 0]} 
                            maxBarSize={28} 
                            name="Accrued Cumulative Tokens (Millions)" 
                          />
                          <Line 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="latency" 
                            stroke="#6366f1" 
                            strokeWidth={3} 
                            dot={{ fill: '#6366f1', strokeWidth: 1, r: 4 }} 
                            activeDot={{ r: 6 }} 
                            name="Real-time Latency (Milliseconds)" 
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>

                {/* Model Connection Diagnostic Suite */}
                <section className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4 overflow-hidden relative">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50/40 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${connectionTestStatus === 'testing' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'} animate-pulse`}></div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest font-mono">Model Diagnostic Connection Suite</h3>
                    </div>
                    <button
                      onClick={runConnectionTest}
                      disabled={connectionTestStatus === 'testing'}
                      className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-50 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border border-slate-200 hover:border-slate-300 shadow-3xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${connectionTestStatus === 'testing' ? 'animate-spin' : ''}`} />
                      <span>Test Model Connectivity</span>
                    </button>
                  </div>

                  {connectionTestStatus !== 'idle' ? (
                    <div className={`p-4 rounded-2xl border text-xs font-mono ${
                      connectionTestStatus === 'testing' 
                        ? 'bg-slate-50 border-slate-200 text-slate-600' 
                        : connectionTestStatus === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                          : 'bg-rose-50 border-rose-200 text-rose-800 font-bold'
                    }`}>
                      <div className="flex items-start gap-2.5">
                        {connectionTestStatus === 'testing' ? (
                          <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mt-0.5 shrink-0" />
                        ) : connectionTestStatus === 'success' ? (
                          <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                        )}
                        <div className="space-y-1">
                          <div className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                            {connectionTestStatus === 'testing' ? 'Handshaking Environment...' : connectionTestStatus === 'success' ? 'Connection Status: Verified' : 'Connection Status: Error'}
                          </div>
                          <p className="leading-relaxed">{testResultLog || 'Establishing connection tunnels to secure model endpoint...'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-xs font-mono text-slate-500">
                      System standby. Provide API Keys and click "Test Model Connectivity" to run diagnostics.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {[
                      { label: 'Active Provider', val: MODEL_PROVIDERS[selectedProvider].name, color: 'text-indigo-600' },
                      { label: 'Active Model Routing', val: selectedModel, color: 'text-purple-600' },
                      { label: 'Current Response Latency', val: connectionTestStatus === 'success' ? `${testLatency}ms` : '0ms', color: 'text-emerald-600' },
                    ].map((stat, i) => (
                      <div key={i} className="p-4 bg-slate-50/55 rounded-2xl border border-slate-150 shadow-3xs">
                        <div className="text-[9px] font-black text-slate-400 uppercase mb-1">{stat.label}</div>
                        <div className={`text-sm font-black font-mono tracking-tight ${stat.color}`}>{stat.val}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            );
          })()}

          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Background Job Orchestration</h2>
                      <p className="text-xs text-slate-500">Monitor asynchronous tasks, workers, and queue distribution.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-400 uppercase">Active Workers</div>
                      <div className="text-sm font-black text-slate-900">{activeWorkersSum} / 16</div>
                    </div>
                    <button 
                      onClick={() => {
                        setIsNewJobModalOpen(true);
                        setPreflightState('idle');
                        setPreflightLogs([]);
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> New Job
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Pending', val: jobStats.pending, color: 'bg-slate-500' },
                    { label: 'Running', val: jobStats.running, color: 'bg-indigo-500' },
                    { label: 'Completed', val: jobStats.completed >= 1000 ? `${(jobStats.completed / 1000).toFixed(1)}k` : jobStats.completed, color: 'bg-emerald-500' },
                    { label: 'Failed', val: jobStats.failed, color: 'bg-rose-500' },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{stat.label}</div>
                      <div className="text-xl font-black text-slate-900 font-mono tracking-tight">{stat.val}</div>
                      <div className={`w-full ${stat.color} h-1 rounded-full mt-2 opacity-30`} />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-black text-slate-900">Active Queue Streams</h3>
                    <span className="text-[10px] text-slate-400 font-mono">Click any stream to expand telemetry & worker controls</span>
                  </div>
                  {queueStreams.map((q, i) => {
                    const isExpanded = expandedStreamId === q.id;
                    return (
                      <div 
                        key={q.id || i} 
                        className={`bg-white border rounded-2xl transition-all duration-200 overflow-hidden ${
                          isExpanded 
                            ? 'border-orange-300 shadow-md ring-2 ring-orange-500/10' 
                            : 'border-slate-100 hover:border-orange-200'
                        }`}
                      >
                        {/* Header Row */}
                        <div 
                          onClick={() => setExpandedStreamId(isExpanded ? null : q.id)}
                          className="flex items-center justify-between p-4 cursor-pointer select-none group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-500'}`}>
                              <Terminal className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                                {q.name}
                                {q.id && q.id > 3 && (
                                  <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 text-[8px] font-black uppercase rounded-sm border border-orange-100">Custom</span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                  q.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${q.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                  {q.status || 'active'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Depth: {q.depth} items • Avg Latency: {q.latency} • Throughput: {q.throughput || '1,200 msg/s'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-[9px] font-black text-slate-400 uppercase">Workers</div>
                              <div className="text-xs font-bold text-slate-900">{q.workers} assigned</div>
                            </div>

                            {q.id && q.id > 3 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQueueStreams(prev => prev.filter(item => item.id !== q.id));
                                  setJobStats(prev => ({
                                    ...prev,
                                    running: Math.max(12, prev.running - 1)
                                  }));
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                            <div className={`p-1 text-slate-400 rounded-lg transition-transform duration-200 ${isExpanded ? 'rotate-180 text-orange-500 bg-orange-50' : 'group-hover:text-slate-600'}`}>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* Expanded Telemetry & Worker Controls Drawer */}
                        {isExpanded && (
                          <div className="px-4 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4">
                            {/* Actions & Controls Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-150">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQueueStreams(prev => prev.map(s => s.id === q.id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s));
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                                    q.status === 'active' 
                                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200' 
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  }`}
                                >
                                  {q.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                  {q.status === 'active' ? 'Pause Queue Stream' : 'Resume Pipeline'}
                                </button>

                                <div className="h-4 w-px bg-slate-200 mx-1" />

                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                  <span className="text-[10px] font-black text-slate-500 uppercase px-2 select-none">Workers:</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQueueStreams(prev => prev.map(s => s.id === q.id ? { ...s, workers: Math.max(1, s.workers - 1) } : s));
                                    }}
                                    className="p-1 text-slate-600 hover:bg-white rounded cursor-pointer transition-all disabled:opacity-30"
                                    disabled={q.workers <= 1}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="px-2 text-xs font-black font-mono text-slate-800">{q.workers}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQueueStreams(prev => prev.map(s => s.id === q.id ? { ...s, workers: Math.min(16, s.workers + 1) } : s));
                                    }}
                                    className="p-1 text-slate-600 hover:bg-white rounded cursor-pointer transition-all"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLiveLog(`Flushed buffers for ${q.name}`);
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer"
                                >
                                  Flush Buffer
                                </button>
                              </div>
                            </div>

                            {/* Detailed KPIs Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="p-3 bg-white rounded-xl border border-slate-150">
                                <div className="text-[9px] font-black text-slate-400 uppercase">Throughput Rate</div>
                                <div className="text-sm font-black text-slate-900 font-mono mt-0.5">{q.throughput || '1,840 msg/sec'}</div>
                              </div>
                              <div className="p-3 bg-white rounded-xl border border-slate-150">
                                <div className="text-[9px] font-black text-slate-400 uppercase">Avg Processing Latency</div>
                                <div className="text-sm font-black text-slate-900 font-mono mt-0.5">{q.latency}</div>
                              </div>
                              <div className="p-3 bg-white rounded-xl border border-slate-150">
                                <div className="text-[9px] font-black text-slate-400 uppercase">Consumer Group</div>
                                <div className="text-xs font-black text-slate-800 font-mono mt-0.5 truncate">{q.consumerGroup || 'cg_primary'}</div>
                              </div>
                              <div className="p-3 bg-white rounded-xl border border-slate-150">
                                <div className="text-[9px] font-black text-slate-400 uppercase">DLQ Error Rate</div>
                                <div className="text-sm font-black text-emerald-600 font-mono mt-0.5">{q.errorRate || '0.01%'}</div>
                              </div>
                            </div>

                            {/* Worker Thread Status Matrix */}
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Worker Threads Allocation ({q.workers} Nodes)</div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {Array.from({ length: q.workers }).map((_, wIdx) => {
                                  const isActive = q.status === 'active';
                                  const cpuLoad = isActive ? Math.floor(10 + Math.random() * 25) : 0;
                                  return (
                                    <div key={wIdx} className="p-2 bg-white rounded-xl border border-slate-150 flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                        <span className="text-[10px] font-bold text-slate-800 font-mono">Node #{wIdx + 1}</span>
                                      </div>
                                      <span className="text-[9px] font-mono text-slate-400">{cpuLoad}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Recent Message Samples */}
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Recent Ingestion Payloads</div>
                              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1.5 max-h-32 overflow-y-auto">
                                {(q.samples || []).map((sample, sIdx) => (
                                  <div key={sIdx} className="flex items-center justify-between gap-2 border-b border-slate-900 pb-1 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-2 truncate">
                                      <span className="text-orange-400 font-bold">{sample.id}</span>
                                      <span className="text-slate-400 truncate">{sample.payload}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-slate-500">{sample.duration}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                        sample.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400'
                                      }`}>
                                        {sample.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Health Monitoring & Cluster Telemetry</h2>
                      <p className="text-xs text-slate-500">Real-time vitals and infrastructure performance metrics.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Systems Optimal</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-black text-slate-900">Node Resource Usage</h3>
                      <div className="flex items-center gap-3">
                        <button onClick={exportResourceData} className="text-[10px] text-slate-500 font-bold hover:text-slate-900 flex items-center gap-1 transition-colors">
                          <Download className="w-3 h-3" />
                          Export CSV
                        </button>
                        <button className="text-[10px] text-indigo-600 font-bold hover:underline">Full Analytics</button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { label: 'CPU Cluster Load', val: '42%', color: 'from-emerald-500 to-emerald-400', stroke: '#10b981', data: cpuTrend },
                        { label: 'Memory Allocation', val: '68%', color: 'from-amber-500 to-amber-400', stroke: '#f59e0b', data: memTrend },
                        { label: 'Network I/O', val: '1.2 GB/s', color: 'from-indigo-500 to-indigo-400', stroke: '#6366f1', data: netTrend },
                      ].map((bar, i) => (
                        <div key={i} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 group hover:border-slate-200 hover:bg-white transition-colors">
                          <div className="flex justify-between items-center text-xs">
                            <code className="text-[11px] font-black text-slate-700 uppercase tracking-wide">{bar.label}</code>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" title={`Alert when ${bar.label} exceeds ${thresholdAlerts[bar.label].threshold}${thresholdAlerts[bar.label].unit}`}>
                                <span className="text-[9px] font-black text-slate-400">ALERT &gt; {thresholdAlerts[bar.label].threshold}{thresholdAlerts[bar.label].unit}</span>
                                <button 
                                  onClick={() => toggleThresholdAlert(bar.label)}
                                  className={`w-6 h-3.5 rounded-full relative transition-colors ${thresholdAlerts[bar.label].enabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                >
                                  <div className={`absolute top-[2px] w-2.5 h-2.5 rounded-full bg-white transition-transform ${thresholdAlerts[bar.label].enabled ? 'translate-x-[10px]' : 'translate-x-[2px]'}`} />
                                </button>
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-900 w-12 text-right">{bar.val}</span>
                            </div>
                          </div>
                          <div className="h-10 w-full opacity-60 group-hover:opacity-100 transition-opacity">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={bar.data}>
                                <Line type="monotone" dataKey="val" stroke={bar.stroke} strokeWidth={2} dot={false} isAnimationActive={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${bar.color}`} style={{ width: bar.val.includes('%') ? bar.val : '45%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-900 px-1">Endpoint Performance</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { api: 'GQL_AUTH_GATEWAY', lat: '12ms', status: 'Optimal' },
                        { api: 'MIGRATION_EXEC_SERVICE', lat: '45ms', status: 'Optimal' },
                        { api: 'TENANT_PROVISION_API', lat: '185ms', status: 'Warning' },
                      ].map((api, i) => (
                        <div key={i} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${api.status === 'Optimal' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <code className="text-[11px] font-black text-slate-700">{api.api}</code>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-mono font-bold text-slate-400">{api.lat}</span>
                            <span className={`text-[10px] font-black uppercase ${api.status === 'Optimal' ? 'text-emerald-600' : 'text-amber-600'}`}>{api.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Auto-Scale Policy</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Define automated triggers to spin up additional cluster nodes.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                        <span className="ml-2 text-[10px] font-black text-slate-600 uppercase">Active</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Target Metric</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 transition-colors cursor-pointer">
                        <option>Aggregate CPU Load</option>
                        <option>Memory Allocation</option>
                        <option>Network I/O Wait</option>
                      </select>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Scale-Up Threshold</label>
                      <div className="relative">
                        <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 transition-colors cursor-pointer">
                          <option>{'>'} 75% for 5 mins</option>
                          <option>{'>'} 80% for 3 mins</option>
                          <option>{'>'} 90% for 1 min</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Max Cluster Size</label>
                      <div className="relative">
                        <input type="number" defaultValue={16} min={4} max={64} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 transition-colors" />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">Nodes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-6">
              <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Cloud Storage & Cluster Buffers</h2>
                      <p className="text-xs text-slate-500">Manage data volume across hot, warm, and cold tiers.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-lg border border-emerald-100 uppercase font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Optimized
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storageMetrics.map((item, i) => (
                    <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 text-slate-500">
                        <item.icon className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-black text-slate-900 font-mono tracking-tight">{item.val.toFixed(1)} {item.unit}</span>
                        <span className="text-[10px] font-bold text-slate-400">of {item.max} {item.unit}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} transition-all duration-1000 ease-linear`} style={{ width: `${(item.val / item.max) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  Automated Cleanup Policies (TTL)
                </h3>
                <div className="space-y-3">
                  {[
                    { policy: 'Staging Area Temp Files', frequency: 'Every 24h', action: 'Purge files older than 6h', status: 'Active' },
                    { policy: 'Audit Log Archiving', frequency: 'Weekly', action: 'Move to Cold Storage (GCS) > 1yr', status: 'Active' },
                    { policy: 'Experimental Schema Branches', frequency: 'Monthly', action: 'Prune unused branches > 30d', status: 'Pending' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                      <div className="flex items-start gap-3">
                        <History className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-black text-slate-900">{p.policy}</div>
                          <div className="text-xs text-slate-500 italic">{p.action}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-900 uppercase">{p.frequency}</div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                      <Save className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Platform Backup Engine</h2>
                      <p className="text-xs text-slate-500">Atomic snapshots and multi-cloud data persistence.</p>
                    </div>
                  </div>
                  <button 
                    onClick={triggerAdHocBackup}
                    disabled={isBackingUp}
                    className={`px-5 py-2.5 text-white text-xs font-black rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all ${isBackingUp ? 'bg-blue-400 cursor-wait shadow-none' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 active:scale-95'}`}
                  >
                    {isBackingUp ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {isBackingUp ? 'Processing...' : 'Trigger Ad-Hoc Backup'}
                  </button>
                </div>

                {isBackingUp && (
                  <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm space-y-3 mb-6 animate-pulse">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-blue-900">{backupStatus}</span>
                      <span className="font-mono text-blue-700 font-bold">{backupProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 transition-all duration-300 ease-out" 
                        style={{ width: `${backupProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 space-y-4">
                    <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4 h-4" /> Latest Snapshot Metadata
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Timestamp</span>
                        <span className="font-bold text-slate-900">{latestSnapshot.timestamp}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Size (Compressed)</span>
                        <span className="font-bold text-slate-900">{latestSnapshot.size}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Consistency Level</span>
                        <span className="font-bold text-emerald-600">{latestSnapshot.consistency}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                        <span className="text-slate-600 font-bold">Storage Targets</span>
                        <span className="font-bold text-blue-600 italic">{latestSnapshot.targets}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Scheduled Tasks</h3>
                    <div className="space-y-2">
                      {[
                        { name: 'Incremental Hourly', time: 'Every 60m', status: 'Active' },
                        { name: 'Full Database Dump', time: 'Daily @ 02:00', status: 'Active' },
                        { name: 'Schema Manifest Export', time: 'Weekly @ Sun', status: 'Active' },
                      ].map((t, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="text-xs font-bold text-slate-900 italic">{t.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 font-bold">{t.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-black text-slate-900">Backup Retention & Off-Site Mirroring</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-100 font-black text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Snapshot ID</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-mono">
                      {[
                        { id: 'snap-4820-A', type: 'Full', size: '12.4TB', status: 'Immutable' },
                        { id: 'snap-4821-B', type: 'Incr', size: '420GB', status: 'Verified' },
                        { id: 'snap-4822-C', type: 'Incr', size: '180GB', status: 'Syncing' },
                      ].map((snap, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{snap.id}</td>
                          <td className="py-3 px-4 text-slate-500">{snap.type}</td>
                          <td className="py-3 px-4 text-slate-500">{snap.size}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              snap.status === 'Immutable' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>{snap.status}</span>
                          </td>
                          <td className="py-3 px-4">
                            <button className="text-indigo-600 hover:text-indigo-800 font-bold">Restore</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'dr' && (
            <div className="space-y-6">
              <section className="bg-rose-900 text-white p-6 rounded-3xl border border-rose-800 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center justify-between gap-6 z-10 relative">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6 text-rose-400" />
                      <h2 className="text-xl font-black tracking-tight">Enterprise Disaster Recovery (DR) Control</h2>
                    </div>
                    <p className="text-sm text-rose-200/80 max-w-xl">
                      Manage region failover, cluster migration checkpoints, and global routing during infrastructure-level service interruptions.
                    </p>
                  </div>
                  <div className="p-4 bg-rose-950/40 rounded-2xl border border-rose-800/60 text-center">
                    <div className="text-[10px] font-black uppercase text-rose-400 mb-1">RTO Performance</div>
                    <div className="text-3xl font-black font-mono tracking-tighter">14<span className="text-xs">m</span></div>
                    <div className="text-[9px] text-rose-300 font-bold">Target: 15m</div>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    Global Region Failover Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Active Region: <span className="text-indigo-600 italic">US-East-1 (Primary)</span></span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Passive Standby Region</label>
                        <select className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none">
                          <option>US-West-2 (Oregon)</option>
                          <option>EU-Central-1 (Frankfurt)</option>
                          <option>AP-Southeast-1 (Singapore)</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-3">
                      <div className="flex items-center gap-2 text-rose-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-wider tracking-tighter">Emergency Failover Trigger</span>
                      </div>
                      <p className="text-[11px] text-rose-600/80 leading-relaxed italic font-bold">
                        Warning: Manually triggering failover will route all 100% of global traffic to the standby cluster. Expected propagation time: 420s.
                      </p>
                      <button className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer active:scale-95">
                        Initiate Global Failover Sequence
                      </button>
                    </div>
                  </div>
                </section>

                <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-emerald-600" />
                    Recovery Consistency Checkpoints
                  </h3>
                  <div className="space-y-3">
                    {[
                      { point: 'Daily Midnight Sync', date: 'Today, 00:00', health: 'Healthy' },
                      { point: 'Pre-v3.4 Engine Patch', date: 'Aug 08, 22:45', health: 'Healthy' },
                      { point: 'Last Atomic Snapshot', date: 'Aug 07, 04:12', health: 'Immutable' },
                    ].map((cp, i) => (
                      <div key={i} className="group p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-emerald-200 rounded-2xl transition-all cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-xl border border-slate-200 group-hover:border-emerald-100">
                              <History className="w-4 h-4 text-slate-500 group-hover:text-emerald-500" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-900">{cp.point}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{cp.date}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-emerald-600 uppercase italic">{cp.health}</span>
                        </div>
                      </div>
                    ))}
                    <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
                      <FileSearch className="w-4 h-4" />
                      View All 50+ Recovery Points
                    </button>
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'expired-accounts' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Notification Toast */}
              {expiredNotification && (
                <div className="bg-emerald-900 text-white p-3.5 rounded-2xl shadow-lg border border-emerald-700 flex items-center justify-between text-xs font-mono font-bold animate-in slide-in-from-top duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{expiredNotification}</span>
                  </div>
                  <button onClick={() => setExpiredNotification(null)} className="text-emerald-300 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Header Hero Banner */}
              <section className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10 relative">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Hourglass className="w-6 h-6 text-amber-400 shrink-0" />
                      <h2 className="text-xl font-black tracking-tight">Expired Account Lifecycle & Cleanup Log</h2>
                    </div>
                    <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                      Track temporary accounts that have reached their scheduled expiration time, audit creator accountability, verify automated token revocation, and orchestrate database cleanup purges.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={handleExportExpiredCSV}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-amber-400" />
                      Export Audit CSV
                    </button>
                    <button
                      onClick={handleBulkPurgeExpired}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                      Purge Pending Credentials
                    </button>
                  </div>
                </div>
              </section>

              {/* High-Level Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Total Expired Accounts</span>
                  <div className="text-2xl font-black text-slate-900 font-mono">{expiredLog.length}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Recorded in platform audit log</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider font-mono">Auto-Disabled Access</span>
                  <div className="text-2xl font-black text-amber-700 font-mono">
                    {expiredLog.filter(x => x.cleanupStatus === 'Auto-Disabled').length}
                  </div>
                  <div className="text-[10px] text-amber-600 font-mono">Tokens revoked; awaiting purge</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider font-mono">Pending Purge Queue</span>
                  <div className="text-2xl font-black text-rose-700 font-mono">
                    {expiredLog.filter(x => x.cleanupStatus === 'Pending Purge').length}
                  </div>
                  <div className="text-[10px] text-rose-600 font-mono">Queued for database deletion</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Purged & Archived</span>
                  <div className="text-2xl font-black text-slate-700 font-mono">
                    {expiredLog.filter(x => x.cleanupStatus === 'Purged & Destroyed' || x.cleanupStatus === 'Archived').length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Database records destroyed</div>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-3 w-full sm:w-auto">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search account, email, creator, role..."
                      value={expiredSearch}
                      onChange={(e) => setExpiredSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800"
                    />
                  </div>

                  {/* Filter Dropdown */}
                  <div className="relative w-full sm:w-52">
                    <select
                      value={expiredStatusFilter}
                      onChange={(e) => setExpiredStatusFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                    >
                      <option value="All">All Cleanup Statuses</option>
                      <option value="Auto-Disabled">Auto-Disabled</option>
                      <option value="Pending Purge">Pending Purge</option>
                      <option value="Purged & Destroyed">Purged & Destroyed</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-500 font-bold shrink-0">
                  Showing {filteredExpiredLog.length} of {expiredLog.length} log entries
                </div>
              </div>

              {/* Expired Accounts Data Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4 font-black">Expired Account</th>
                        <th className="py-3 px-4 font-black">Assigned Role</th>
                        <th className="py-3 px-4 font-black">Creator (Provisioned By)</th>
                        <th className="py-3 px-4 font-black">Expiration Time</th>
                        <th className="py-3 px-4 font-black text-center">Cleanup Status</th>
                        <th className="py-3 px-4 font-black text-center">Automated Safeguards</th>
                        <th className="py-3 px-4 font-black text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredExpiredLog.length > 0 ? (
                        filteredExpiredLog.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Account Name & Email */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{item.userName}</span>
                                  <span className="bg-amber-50 text-amber-700 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-amber-200">
                                    {item.preset} policy
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">{item.email}</div>
                              </div>
                            </td>

                            {/* Assigned Role */}
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-slate-700 border border-slate-200">
                                {item.role}
                              </span>
                            </td>

                            {/* Creator */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                                  <UserCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                                  <span>{item.creator}</span>
                                </div>
                                <div className="text-[9px] text-slate-400 font-mono">{item.creatorEmail}</div>
                              </div>
                            </td>

                            {/* Expiration Time */}
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{item.expiredAt}</span>
                              </div>
                              <div className="text-[9px] text-slate-400">Created: {item.createdDate}</div>
                            </td>

                            {/* Cleanup Status */}
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded-full ${
                                  item.cleanupStatus === 'Auto-Disabled'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : item.cleanupStatus === 'Pending Purge'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : item.cleanupStatus === 'Purged & Destroyed'
                                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                {item.cleanupStatus}
                              </span>
                            </td>

                            {/* Automated Safeguards */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span
                                  className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200"
                                  title="OAuth & Session Tokens Revoked"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Tokens Revoked
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  title="View Full Lifecycle Audit Trail"
                                  onClick={() => {
                                    setSelectedExpiredItem(item);
                                    setIsExpiredDetailModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                >
                                  <FileSearch className="w-4 h-4" />
                                </button>
                                {item.cleanupStatus !== 'Purged & Destroyed' && (
                                  <button
                                    title="Purge Account Credentials Now"
                                    onClick={() => handlePurgeAccount(item.id)}
                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                                {item.cleanupStatus !== 'Archived' && (
                                  <button
                                    title="Archive Record"
                                    onClick={() => handleArchiveAccount(item.id)}
                                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                            No expired account records matched the current search and filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detail Audit Trail Modal */}
              {isExpiredDetailModalOpen && selectedExpiredItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        Expired Account Audit & Lifecycle Record
                      </span>
                      <button
                        onClick={() => setIsExpiredDetailModalOpen(false)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                      <div className="font-bold text-slate-900 text-sm">{selectedExpiredItem.userName}</div>
                      <div className="text-xs font-mono text-slate-500">{selectedExpiredItem.email}</div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                          Role: {selectedExpiredItem.role}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                          Status: {selectedExpiredItem.cleanupStatus}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Lifecycle Timeline & Provenance
                      </label>
                      <div className="space-y-2 text-xs font-mono border-l-2 border-amber-300 pl-3">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">1. Account Provisioned</div>
                          <div className="text-[10px] text-slate-500">
                            Created at <span className="font-bold text-slate-700">{selectedExpiredItem.createdDate}</span> by{' '}
                            <span className="font-bold text-indigo-600">{selectedExpiredItem.creator}</span> ({selectedExpiredItem.creatorEmail})
                          </div>
                          <div className="text-[10px] text-slate-500">Preset Policy: <span className="font-bold text-amber-700">{selectedExpiredItem.preset}</span> duration limit</div>
                        </div>

                        <div className="space-y-0.5 pt-2">
                          <div className="font-bold text-slate-900">2. Expiration Reached</div>
                          <div className="text-[10px] text-slate-500">
                            Triggered automatically at <span className="font-bold text-rose-600">{selectedExpiredItem.expiredAt}</span>
                          </div>
                        </div>

                        <div className="space-y-0.5 pt-2">
                          <div className="font-bold text-slate-900">3. Automated Safeguards & Revocation</div>
                          <div className="text-[10px] text-slate-500">
                            ✓ Active session cookies invalidated<br />
                            ✓ OAuth access tokens revoked<br />
                            ✓ Password auth disabled in directory
                          </div>
                        </div>

                        <div className="space-y-0.5 pt-2">
                          <div className="font-bold text-slate-900">4. Retention & Database Cleanup Status</div>
                          <div className="text-[10px] text-slate-600 font-sans italic bg-white p-2 rounded border border-slate-200">
                            "{selectedExpiredItem.notes}"
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      {selectedExpiredItem.cleanupStatus !== 'Purged & Destroyed' ? (
                        <button
                          type="button"
                          onClick={() => {
                            handlePurgeAccount(selectedExpiredItem.id);
                            setIsExpiredDetailModalOpen(false);
                          }}
                          className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Purge Database Record
                        </button>
                      ) : (
                        <div className="text-[10px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Database Record Purged
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsExpiredDetailModalOpen(false)}
                        className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-xs rounded-lg cursor-pointer transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Elegant Integration Modal matching Enterprise Migration Control Center white theme */}
      {isAddChannelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-150 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Add Notification Channel</h3>
                  <p className="text-[10px] text-slate-500">Configure real-time event alerting webhook.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddChannelModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddChannel} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Channel Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Microsoft Teams, Discord Dev Ops"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Routing Webhook URL / Email / ID</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. https://hooks.teams.microsoft.com/... or email"
                  value={newChannelHook}
                  onChange={(e) => setNewChannelHook(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Channel Icon Type</label>
                  <select 
                    value={newChannelIcon}
                    onChange={(e) => setNewChannelIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold text-slate-900 focus:outline-none transition-all"
                  >
                    <option value="Zap">⚡ Core Trigger (Zap)</option>
                    <option value="Globe">🌐 Public Hook (Globe)</option>
                    <option value="Activity">📈 Telemetry PING (Activity)</option>
                    <option value="Bell">🔔 Standard Alert (Bell)</option>
                    <option value="Terminal">💻 Script Console (Terminal)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Initial Status</label>
                  <select 
                    value={newChannelStatus}
                    onChange={(e) => setNewChannelStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold text-slate-900 focus:outline-none transition-all"
                  >
                    <option value="Connected">Connected</option>
                    <option value="Standby">Standby</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsAddChannelModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  Register Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Elegant Feature Flag Creation Modal matching Enterprise Migration Control Center white theme */}
      {isAddFlagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-150 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Create System Feature Flag</h3>
                  <p className="text-[10px] text-slate-500">Configure custom feature toggle environments.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddFlagModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateFlag} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Flag Name / Identifier</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. ENABLE_V3_SCHEDULER or HIGH_AVAILABILITY_SYNC"
                  value={newFlagName}
                  onChange={(e) => setNewFlagName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
                />
                <span className="text-[9px] text-slate-400 block font-mono">Auto-formats to uppercase alphabetic format on save.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Description / Purge Criteria</label>
                <textarea 
                  rows={2}
                  placeholder="Describe what feature this toggle controls, its impact, and planned retirement schedule."
                  value={newFlagDesc}
                  onChange={(e) => setNewFlagDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold text-slate-900 focus:outline-none transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Rollout Tier / Category</label>
                  <select 
                    value={newFlagTier}
                    onChange={(e) => setNewFlagTier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold text-slate-900 focus:outline-none transition-all"
                  >
                    <option value="Beta">Beta Testing</option>
                    <option value="Production">Production Core</option>
                    <option value="Experimental">Experimental Lab</option>
                    <option value="Global">Global Switch</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Initial Status</label>
                  <div className="flex items-center gap-3 pt-1">
                    <button 
                      type="button"
                      onClick={() => setNewFlagStatus(prev => !prev)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${newFlagStatus ? 'bg-amber-500' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${newFlagStatus ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-xs font-bold text-slate-600">{newFlagStatus ? 'Active' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsAddFlagModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Register Toggle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Create Background Orchestration Job Modal */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-150">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Configure Orchestrated Queue Job</h3>
                  <p className="text-[10px] text-slate-400">Initialize a custom streaming, CDC, or validation pipeline background daemon.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsNewJobModalOpen(false);
                  setPreflightState('idle');
                  setPreflightLogs([]);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateJobSubmit} className="p-6 space-y-5 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Job Queue Stream Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. ERP_Inventory_Subsecond_CDC"
                    value={newJobName}
                    onChange={(e) => setNewJobName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl text-xs font-bold text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Assigned Active Workers</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="1"
                      max="16"
                      value={newJobWorkers}
                      onChange={(e) => setNewJobWorkers(Number(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                    <span className="text-xs font-black font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 shrink-0">{newJobWorkers} Assigned</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Source System Endpoint</label>
                  <select 
                    value={newJobSource}
                    onChange={(e) => setNewJobSource(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl text-xs font-bold text-slate-900 focus:outline-none transition-all"
                  >
                    <option value="PostgreSQL Ingress Core">PostgreSQL Ingress Core</option>
                    <option value="SAP ERP Transactional Hub">SAP ERP Transactional Hub</option>
                    <option value="Salesforce CRM API Pipeline">Salesforce CRM API Pipeline</option>
                    <option value="MongoDB Unstructured Logs">MongoDB Unstructured Logs</option>
                    <option value="Oracle DB Standard Core">Oracle DB Standard Core</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Target System Destination</label>
                  <select 
                    value={newJobTarget}
                    onChange={(e) => setNewJobTarget(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl text-xs font-bold text-slate-900 focus:outline-none transition-all"
                  >
                    <option value="Snowflake Analytical Lake">Snowflake Analytical Lake</option>
                    <option value="Google BigQuery Warehousing">Google BigQuery Warehousing</option>
                    <option value="AWS Redshift Primary Lake">AWS Redshift Primary Lake</option>
                    <option value="Enterprise Kafka Replay Buffer">Enterprise Kafka Replay Buffer</option>
                    <option value="Drizzle RDS Multi-Master">Drizzle RDS Multi-Master</option>
                  </select>
                </div>
              </div>

              {/* Pre-Flight Schema Validation Area */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Pre-flight Schema Compatibility Validation
                    </h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">Compares constraint models, type schemas, and target-side data type bounds.</p>
                  </div>
                  {preflightState === 'idle' && (
                    <button
                      type="button"
                      onClick={handleRunPreflightCheck}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer shadow-xs"
                    >
                      Verify Compatibility
                    </button>
                  )}
                </div>

                {preflightState !== 'idle' && (
                  <div className="space-y-3">
                    {/* Visual Node-Link Diagram for Schema Mapping */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Database className="w-3.5 h-3.5 text-indigo-400" /> Source: {newJobSource.split(' ')[0]}
                        </span>
                        <span className="text-slate-500 font-mono tracking-wider">Node-Link Schema Mapping</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Cloud className="w-3.5 h-3.5 text-purple-400" /> Target: {newJobTarget.split(' ')[0]}
                        </span>
                      </div>

                      <div className="relative grid grid-cols-12 gap-2 py-1 items-center">
                        {/* Left Column (Source Fields) */}
                        <div className="col-span-5 space-y-2">
                          {[
                            { name: 'user_id', type: 'BIGINT', status: 'match' },
                            { name: 'audit_id', type: 'INT8', status: preflightState === 'mismatch' ? 'conflict' : 'healed' },
                            { name: 'created_at', type: 'TIMESTAMPTZ', status: 'warn' },
                            { name: 'payload_data', type: 'JSONB', status: 'match' },
                          ].map((f, idx) => (
                            <div 
                              key={idx} 
                              className={`p-2 rounded-lg border text-[10px] font-mono flex items-center justify-between transition-all ${
                                f.status === 'conflict' 
                                  ? 'bg-rose-950/80 border-rose-600 text-rose-200 animate-pulse ring-1 ring-rose-500' 
                                  : f.status === 'healed'
                                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                                  : f.status === 'warn'
                                  ? 'bg-amber-950/50 border-amber-600/70 text-amber-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-200'
                              }`}
                            >
                              <span className="font-bold">{f.name}</span>
                              <span className="text-[9px] opacity-75 font-sans px-1 bg-slate-950 rounded">{f.type}</span>
                            </div>
                          ))}
                        </div>

                        {/* SVG Connector Center */}
                        <div className="col-span-2 relative h-full flex flex-col justify-around items-center min-h-[140px]">
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 140">
                            {/* Row 1 link */}
                            <path d="M 0 18 C 50 18, 50 18, 100 18" stroke="#10b981" strokeWidth="2" fill="none" opacity="0.8" />
                            
                            {/* Row 2 link (audit_id conflict vs healed) */}
                            <path 
                              d="M 0 52 C 50 52, 50 52, 100 52" 
                              stroke={preflightState === 'mismatch' ? '#f43f5e' : '#10b981'} 
                              strokeWidth="2.5" 
                              strokeDasharray={preflightState === 'mismatch' ? '4,4' : 'none'}
                              className={preflightState === 'mismatch' ? 'animate-pulse' : ''}
                              fill="none" 
                            />
                            
                            {/* Row 3 link */}
                            <path d="M 0 88 C 50 88, 50 88, 100 88" stroke="#f59e0b" strokeWidth="2" fill="none" opacity="0.8" />
                            
                            {/* Row 4 link */}
                            <path d="M 0 122 C 50 122, 50 122, 100 122" stroke="#10b981" strokeWidth="2" fill="none" opacity="0.8" />
                          </svg>

                          {/* Center Link Badges */}
                          <div className="z-10 text-[8px] font-black uppercase text-emerald-400 bg-slate-950 border border-emerald-800 px-1.5 py-0.5 rounded shadow-xs">
                            1:1
                          </div>

                          <div className={`z-10 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5 ${
                            preflightState === 'mismatch' 
                              ? 'bg-rose-950 text-rose-300 border border-rose-600 animate-bounce' 
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                          }`}>
                            {preflightState === 'mismatch' ? <Unlink className="w-2.5 h-2.5" /> : <Link2 className="w-2.5 h-2.5" />}
                            {preflightState === 'mismatch' ? 'CONFLICT' : 'HEALED'}
                          </div>

                          <div className="z-10 text-[8px] font-black uppercase text-amber-300 bg-slate-950 border border-amber-800 px-1.5 py-0.5 rounded shadow-xs">
                            CAST
                          </div>

                          <div className="z-10 text-[8px] font-black uppercase text-emerald-400 bg-slate-950 border border-emerald-800 px-1.5 py-0.5 rounded shadow-xs">
                            1:1
                          </div>
                        </div>

                        {/* Right Column (Target Fields) */}
                        <div className="col-span-5 space-y-2">
                          {[
                            { name: 'user_id', type: 'BIGINT', status: 'match' },
                            { 
                              name: 'audit_id', 
                              type: preflightState === 'mismatch' ? 'UUIDv4' : 'VARCHAR (CAST)', 
                              status: preflightState === 'mismatch' ? 'conflict' : 'healed' 
                            },
                            { name: 'created_at', type: 'TIMESTAMP_NTZ', status: 'warn' },
                            { name: 'payload_data', type: 'VARIANT', status: 'match' },
                          ].map((f, idx) => (
                            <div 
                              key={idx} 
                              className={`p-2 rounded-lg border text-[10px] font-mono flex items-center justify-between transition-all ${
                                f.status === 'conflict' 
                                  ? 'bg-rose-950/80 border-rose-600 text-rose-200 animate-pulse ring-1 ring-rose-500' 
                                  : f.status === 'healed'
                                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                                  : f.status === 'warn'
                                  ? 'bg-amber-950/50 border-amber-600/70 text-amber-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-200'
                              }`}
                            >
                              <span className="font-bold">{f.name}</span>
                              <span className="text-[9px] opacity-75 font-sans px-1 bg-slate-950 rounded">{f.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Log Terminal Screen */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1 max-h-36 overflow-y-auto">
                      {preflightLogs.map((log, index) => {
                        const isErr = log.includes('ERROR:');
                        const isSuccess = log.includes('✅') || log.includes('complete') || log.includes('precision');
                        return (
                          <div 
                            key={index} 
                            className={`leading-relaxed ${
                              isErr ? 'text-rose-400 font-bold' : isSuccess ? 'text-emerald-400 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <span className="text-slate-600 select-none mr-2">&gt;</span>
                            {log}
                          </div>
                        );
                      })}
                      {preflightState === 'checking' && (
                        <div className="flex items-center gap-2 text-indigo-400 font-bold animate-pulse">
                          <span className="text-slate-600 select-none">&gt;</span>
                          <span>Scanning indices and columns...</span>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* States Result Panel */}
                    {preflightState === 'mismatch' && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-rose-50 border border-rose-150 rounded-xl">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                          <div className="text-[10px] text-rose-950">
                            <span className="font-bold">Schema Conflict Found:</span> Numeric constraint mismatch on <code className="font-mono bg-rose-100/70 px-1 py-0.5 rounded text-[9px]">audit_id</code>.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAutoHealSchema}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer shrink-0"
                        >
                          Auto-Heal Target Types
                        </button>
                      </div>
                    )}

                    {preflightState === 'success' && (
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-950 text-[10px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold">Pre-flight Validation Passed!</span> Schemas matched and locked. Type-cast wrapper auto-injected.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => {
                    setIsNewJobModalOpen(false);
                    setPreflightState('idle');
                    setPreflightLogs([]);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={preflightState !== 'success'}
                  className={`px-5 py-2.5 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-1.5 ${
                    preflightState === 'success'
                      ? 'bg-slate-950 hover:bg-slate-800 cursor-pointer active:scale-95'
                      : 'bg-slate-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Add Orchestrated Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
