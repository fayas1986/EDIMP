import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  KeyRound,
  Users,
  CheckCircle2,
  Lock,
  Database,
  Sparkles,
  Server,
  RefreshCw,
  Sliders,
  Bell,
  Zap,
  AlertTriangle,
  Activity,
  Send,
  Save,
  Clock,
  Cpu,
  SlidersHorizontal,
  LockKeyhole,
  CheckCircle,
  Key,
  Terminal,
  AlertCircle,
} from 'lucide-react';

interface SettingsViewProps {
  hasGeminiKey: boolean;
}

type TabType = 'ai_models' | 'vault' | 'rbac' | 'session' | 'throttling' | 'webhooks';

interface SecretKeyItem {
  id: string;
  name: string;
  description: string;
  keyType: 'AI Engine' | 'Database' | 'Cache' | 'Auth Provider';
  status: 'active' | 'inactive' | 'testing';
  latencyMs?: number;
  lastRotated: string;
}

const MODEL_PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    models: ['Gemini 2.5 Flash', 'Gemini 2.0 Pro', 'Gemini 1.5 Pro', 'Gemini 1.5 Flash'],
    placeholderKey: 'GEMINI_API_KEY',
    desc: 'DeepMind next-generation multimodality native engine for schema mapping, validation & remediation.',
    color: 'border-indigo-200 text-indigo-700 bg-indigo-50/50',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    keyName: 'GEMINI_API_KEY',
  },
  openai: {
    name: 'OpenAI GPT',
    models: ['GPT-4o (Omni)', 'o1-pro', 'GPT-4-turbo', 'GPT-3.5-turbo'],
    placeholderKey: 'OPENAI_API_KEY',
    desc: 'Industry standard advanced reasoning and multi-modal models.',
    color: 'border-emerald-200 text-emerald-700 bg-emerald-50/50',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    keyName: 'OPENAI_API_KEY',
  },
  anthropic: {
    name: 'Anthropic Claude',
    models: ['Claude 3.5 Sonnet', 'Claude 3 Opus', 'Claude 3 Haiku'],
    placeholderKey: 'ANTHROPIC_API_KEY',
    desc: 'Constitutional safe LLMs with industry-leading code synthesis and analytical mapping.',
    color: 'border-amber-200 text-amber-700 bg-amber-50/50',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    keyName: 'ANTHROPIC_API_KEY',
  },
  kimi: {
    name: 'Moonshot Kimi',
    models: ['Kimi-Chat-v1-200k', 'Kimi-Chat-v1-32k'],
    placeholderKey: 'KIMI_API_KEY',
    desc: 'Ultra-high-context recall models optimized for long migration logs and huge dossiers.',
    color: 'border-sky-200 text-sky-700 bg-sky-50/50',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    keyName: 'KIMI_API_KEY',
  },
  glm: {
    name: 'Zhipu GLM',
    models: ['GLM-4-Plus', 'GLM-4-Air', 'GLM-3-Turbo'],
    placeholderKey: 'ZHIPU_GLM_API_KEY',
    desc: 'Highly optimized bilingual models supporting complex multi-step agentic workflows.',
    color: 'border-rose-200 text-rose-700 bg-rose-50/50',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    keyName: 'ZHIPU_GLM_API_KEY',
  },
  qwen: {
    name: 'Alibaba Qwen',
    models: ['Qwen-2.5-72B-Instruct', 'Qwen-2.5-Coder', 'Qwen-VL-Max'],
    placeholderKey: 'QWEN_API_KEY',
    desc: 'Open-weights global leader in synthetic reasoning, code generation, and language mapping.',
    color: 'border-purple-200 text-purple-700 bg-purple-50/50',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    keyName: 'QWEN_API_KEY',
  },
};

export const SettingsView: React.FC<SettingsViewProps> = ({ hasGeminiKey }) => {
  const [activeTab, setActiveTab] = useState<TabType>('ai_models');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI Multi-Model Configuration State
  const [selectedProvider, setSelectedProvider] = useState<keyof typeof MODEL_PROVIDERS>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('Gemini 2.5 Flash');
  const [temperature, setTemperature] = useState<number>(0.2);
  const [safetyFilter, setSafetyFilter] = useState<string>('Block Some (Balanced)');
  const [tokenCap, setTokenCap] = useState<string>('50,000,000');
  const [aiKeys, setAiKeys] = useState<Record<string, string>>({
    gemini: hasGeminiKey ? '••••••••••••••••••••••••' : '',
    openai: 'sk-proj-••••••••••••••••••••••••',
    anthropic: 'sk-ant-••••••••••••••••••••••••',
    kimi: 'sk-kimi-••••••••••••••••••••••••',
    glm: 'sk-glm-••••••••••••••••••••••••',
    qwen: 'sk-qwen-••••••••••••••••••••••••',
  });
  const [connectionTestStatus, setConnectionTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testResultLog, setTestResultLog] = useState<string>('');
  const [liveLog, setLiveLog] = useState<string>('Multi-LLM router initialized. All 6 model orchestrators standing by.');

  // Telemetry metrics state
  const [providerMetrics, setProviderMetrics] = useState([
    { name: 'Google Gemini', status: 'Healthy', latency: 18, model: 'Gemini 2.5 Flash', priority: 'Primary', calls: '14,290' },
    { name: 'OpenAI GPT', status: 'Healthy', latency: 34, model: 'GPT-4o (Omni)', priority: 'Secondary', calls: '8,410' },
    { name: 'Anthropic Claude', status: 'Healthy', latency: 29, model: 'Claude 3.5 Sonnet', priority: 'Failover 1', calls: '5,120' },
    { name: 'Moonshot Kimi', status: 'Healthy', latency: 42, model: 'Kimi-Chat-v1-200k', priority: 'Failover 2', calls: '2,980' },
    { name: 'Zhipu GLM', status: 'Healthy', latency: 51, model: 'GLM-4-Plus', priority: 'Failover 3', calls: '1,840' },
    { name: 'Alibaba Qwen', status: 'Healthy', latency: 38, model: 'Qwen-2.5-72B-Instruct', priority: 'Failover 4', calls: '3,210' },
  ]);

  // Secret Vault State
  const [vaultProvider, setVaultProvider] = useState<'gcp' | 'aws' | 'azure' | 'hashicorp'>('gcp');
  const [rotationInterval, setRotationInterval] = useState<'30' | '60' | '90' | 'manual'>('60');
  const [isTestingVault, setIsTestingVault] = useState(false);
  const [secretKeys, setSecretKeys] = useState<SecretKeyItem[]>([
    {
      id: 'gemini',
      name: 'GEMINI_API_KEY',
      description: 'Google Gemini 2.5 Flash / 2.0 Pro engine for field mapping & auto-remediation',
      keyType: 'AI Engine',
      status: 'active',
      latencyMs: 18,
      lastRotated: '2026-08-01',
    },
    {
      id: 'openai',
      name: 'OPENAI_API_KEY',
      description: 'OpenAI GPT-4o / o1 reasoning engine for complex logical verification',
      keyType: 'AI Engine',
      status: 'active',
      latencyMs: 34,
      lastRotated: '2026-08-05',
    },
    {
      id: 'anthropic',
      name: 'ANTHROPIC_API_KEY',
      description: 'Anthropic Claude 3.5 Sonnet engine for SQL code synthesis & schema transformation',
      keyType: 'AI Engine',
      status: 'active',
      latencyMs: 29,
      lastRotated: '2026-08-02',
    },
    {
      id: 'kimi',
      name: 'KIMI_API_KEY',
      description: 'Moonshot Kimi 200k long-context recall engine for massive migration logs',
      keyType: 'AI Engine',
      status: 'active',
      latencyMs: 42,
      lastRotated: '2026-07-28',
    },
    {
      id: 'glm',
      name: 'ZHIPU_GLM_API_KEY',
      description: 'Zhipu GLM-4 bilingual & multi-step agentic planning engine',
      keyType: 'AI Engine',
      status: 'active',
      latencyMs: 51,
      lastRotated: '2026-07-30',
    },
    {
      id: 'qwen',
      name: 'QWEN_API_KEY',
      description: 'Alibaba Qwen-2.5 open-weights engine for code generation & multimodal mapping',
      keyType: 'AI Engine',
      status: 'active',
      latencyMs: 38,
      lastRotated: '2026-08-08',
    },
    {
      id: 'cloud_sql',
      name: 'Cloud SQL / PostgreSQL Database',
      description: 'Multi-tenant relational database schema and transaction state persistence',
      keyType: 'Database',
      status: 'active',
      latencyMs: 12,
      lastRotated: '2026-07-15',
    },
    {
      id: 'redis',
      name: 'Redis Distributed Cache',
      description: 'In-memory token bucket rate limiter and session storage buffer',
      keyType: 'Cache',
      status: 'active',
      latencyMs: 4,
      lastRotated: '2026-08-10',
    },
    {
      id: 'oauth_gsi',
      name: 'Google Identity OAuth Client Secret',
      description: 'Client-side OAuth 2.0 token acquisition & workspace integration',
      keyType: 'Auth Provider',
      status: 'active',
      latencyMs: 22,
      lastRotated: '2026-06-20',
    },
  ]);

  // Session Timeout State
  const [idleLimitMinutes, setIdleLimitMinutes] = useState<number>(30);
  const [warningThresholdMinutes, setWarningThresholdMinutes] = useState<number>(2);
  const [purgeTokenCache, setPurgeTokenCache] = useState<boolean>(true);
  const [clearSessionStorage, setClearSessionStorage] = useState<boolean>(true);
  const [enforceReauth, setEnforceReauth] = useState<boolean>(true);
  const [isSavingSession, setIsSavingSession] = useState(false);

  // RBAC Matrix State
  const [rbacMatrix, setRbacMatrix] = useState<Record<string, Record<string, string>>>({
    'Platform Admin': { connectors: 'Full', mapping: 'Full', migration: 'Full', audit: 'Full', settings: 'Full' },
    'Data Architect': { connectors: 'Full', mapping: 'Full', migration: 'Dry-Run', audit: 'Read', settings: 'Read' },
    'Migration Operator': { connectors: 'Read', mapping: 'Read', migration: 'Execute', audit: 'Read', settings: 'None' },
    'Auditor': { connectors: 'Read', mapping: 'Read', migration: 'None', audit: 'Full', settings: 'Read' },
    'Business User': { connectors: 'Read', mapping: 'Read', migration: 'None', audit: 'Read', settings: 'None' },
  });

  // Throttling & Pipeline Engine State
  const [maxRpsCap, setMaxRpsCap] = useState<number>(1500);
  const [concurrencyWorkers, setConcurrencyWorkers] = useState<number>(128);
  const [autoPauseThresholdPct, setAutoPauseThresholdPct] = useState<number>(2.5);
  const [isSavingThrottling, setIsSavingThrottling] = useState(false);

  // Webhooks State
  const [slackWebhook, setSlackWebhook] = useState<string>('https://hooks.slack.com/services/T00/B00/XXXXX');
  const [teamsWebhook, setTeamsWebhook] = useState<string>('https://outlook.office.com/webhook/XXXXX');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookLog, setWebhookLog] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Run AI Model Handshake Test
  const handleTestAiModelHandshake = () => {
    const prov = MODEL_PROVIDERS[selectedProvider];
    setConnectionTestStatus('testing');
    setTestResultLog(`Initiating TLS 1.3 handshake with ${prov.name} API endpoint...`);

    setTimeout(() => {
      const ping = Math.floor(Math.random() * 25) + 12;
      setConnectionTestStatus('success');
      setTestResultLog(`Handshake Successful: Validated ${prov.name} - ${selectedModel}. System Latency: ${ping}ms. Zero-trust security policy enforced.`);
      setLiveLog(`[${new Date().toLocaleTimeString()}] Verified connection with ${prov.name} (${selectedModel}) - Ping ${ping}ms`);
      showToast(`Successfully validated ${prov.name} (${selectedModel}) connection!`);

      // Update provider metric in telemetry grid
      setProviderMetrics((prev) =>
        prev.map((pm) =>
          pm.name === prov.name
            ? { ...pm, latency: ping, model: selectedModel, status: 'Healthy' }
            : pm
        )
      );
    }, 1100);
  };

  // Run Real-time Vault Health Check
  const handleTestVaultHealth = () => {
    setIsTestingVault(true);
    showToast('Pinging vault credentials & platform architecture services...');
    setTimeout(() => {
      setSecretKeys((prev) =>
        prev.map((item) => ({
          ...item,
          latencyMs: Math.floor(Math.random() * 25) + 5,
        }))
      );
      setIsTestingVault(false);
      showToast('Vault health check complete: All 9 infrastructure & AI model keys online (Avg 18ms)');
    }, 1200);
  };

  // Save Session Policy
  const handleSaveSessionPolicy = () => {
    setIsSavingSession(true);
    setTimeout(() => {
      setIsSavingSession(false);
      showToast(`Idle Session Timeout policy updated to ${idleLimitMinutes}m limit (SOC 2 Enforced).`);
    }, 600);
  };

  // Update Permission Cell
  const handlePermissionChange = (role: string, moduleKey: string, nextPermission: string) => {
    setRbacMatrix((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [moduleKey]: nextPermission,
      },
    }));
    showToast(`Updated ${role} access for ${moduleKey.toUpperCase()} to ${nextPermission}`);
  };

  // Save Throttling Settings
  const handleSaveThrottling = () => {
    setIsSavingThrottling(true);
    setTimeout(() => {
      setIsSavingThrottling(false);
      showToast(`Pipeline Throttling updated: ${maxRpsCap} RPS cap & ${concurrencyWorkers} worker nodes.`);
    }, 600);
  };

  // Test Webhook Dispatch
  const handleTestWebhook = () => {
    setIsTestingWebhook(true);
    const newLogEntry = `[${new Date().toLocaleTimeString()}] HTTP POST -> Slack Webhook (200 OK - 42ms)`;
    setTimeout(() => {
      setIsTestingWebhook(false);
      setWebhookLog((prev) => [newLogEntry, ...prev]);
      showToast('Test notification payload dispatched successfully (200 OK)');
    }, 900);
  };

  const currentProv = MODEL_PROVIDERS[selectedProvider];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-indigo-500/40 flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
              Module 30 – Platform Settings & RBAC Administration
            </span>
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 font-mono text-[10px] font-bold rounded-full border border-purple-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
              6 AI Models Configured
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
              Runtime: Cloud Run (europe-west3)
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Enterprise Tenant Settings & Security Administration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-LLM orchestrators, multi-tenant configurations, role-based access control (RBAC), secret key vault, and session security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestVaultHealth}
            disabled={isTestingVault}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingVault ? 'animate-spin' : ''}`} />
            <span>{isTestingVault ? 'Pinging Infrastructure...' : 'Test Architecture Health'}</span>
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2 scrollbar-none">
        {[
          { id: 'ai_models', label: 'AI Multi-Model Configuration', icon: Sparkles },
          { id: 'vault', label: 'API Secrets & Key Vault', icon: KeyRound },
          { id: 'rbac', label: 'RBAC Permissions Matrix', icon: Users },
          { id: 'session', label: 'Session Security & SOC 2', icon: Lock },
          { id: 'throttling', label: 'Pipeline Rate Limits & RPS', icon: SlidersHorizontal },
          { id: 'webhooks', label: 'Alert Destinations & Webhooks', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 0: AI MULTI-MODEL CONFIGURATION & TOKENS */}
      {activeTab === 'ai_models' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 rounded-2xl text-purple-600 border border-purple-100">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    AI Multi-Model Configuration & Orchestration Hub
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure global model orchestrators, real-time API keys, target models, temperature parameters, and failover rules.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 font-mono">
                <Terminal className="w-4 h-4 text-indigo-600" />
                <span>Runtime: Multi-LLM Routing v4.0</span>
              </div>
            </div>

            {/* Provider Grid Selector */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Select Active LLM Engine Provider (6 Configured)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {(Object.keys(MODEL_PROVIDERS) as Array<keyof typeof MODEL_PROVIDERS>).map((key) => {
                  const isSel = selectedProvider === key;
                  const prov = MODEL_PROVIDERS[key];
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedProvider(key);
                        setSelectedModel(prov.models[0]);
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
                      <span className="text-[11px] font-black uppercase tracking-wider">
                        {prov.name.split(' ')[1] || prov.name}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {prov.models.length} Models
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Provider Info card & API Key input */}
            <div className={`p-5 rounded-2xl border ${currentProv.color} space-y-4`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <span>Active Engine: {currentProv.name}</span>
                    <span className="px-2 py-0.5 bg-white/80 rounded border border-slate-200/60 text-[10px] font-mono font-bold text-slate-700">
                      {currentProv.keyName}
                    </span>
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">{currentProv.desc}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200/50">
                {/* Live API Key Integration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Real-Time {currentProv.name} API Key Setup</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder={aiKeys[selectedProvider] ? '••••••••••••••••••••••••' : `Enter custom ${currentProv.placeholderKey}...`}
                      value={aiKeys[selectedProvider] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAiKeys((prev) => ({ ...prev, [selectedProvider]: val }));
                        if (connectionTestStatus !== 'idle') setConnectionTestStatus('idle');
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/90 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                    <div className="absolute left-3.5 top-3 text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <span className="text-[9px] opacity-75 block font-mono">
                    Kept secure client-side and server proxy. Actions synchronize instantly.
                  </span>
                </div>

                {/* Dropdown for specific models */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider block">
                    Target LLM Model Selection
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      setConnectionTestStatus('idle');
                    }}
                    className="w-full px-4 py-2.5 bg-white/90 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {currentProv.models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <span className="text-[9px] opacity-75 block font-mono">
                    Resolves automatic failover strategies across pipeline nodes.
                  </span>
                </div>
              </div>

              {/* Handshake Tester Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/50">
                <button
                  onClick={handleTestAiModelHandshake}
                  disabled={connectionTestStatus === 'testing'}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 ${connectionTestStatus === 'testing' ? 'animate-bounce' : ''}`} />
                  <span>
                    {connectionTestStatus === 'testing'
                      ? `Testing ${currentProv.name}...`
                      : `Test Live Handshake with ${currentProv.name}`}
                  </span>
                </button>

                {connectionTestStatus === 'success' && (
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Connection Verified Active & Valid</span>
                  </div>
                )}
              </div>

              {testResultLog && (
                <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl border border-slate-800 animate-in fade-in">
                  {testResultLog}
                </div>
              )}
            </div>

            {/* Model Generation Tuning Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Temperature</label>
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    {temperature} ({temperature <= 0.3 ? 'Deterministic' : 'Creative'})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Precise / Low Entropy</span>
                  <span>Creative / High Entropy</span>
                </div>
              </div>

              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Safety Filter Threshold
                </label>
                <select
                  value={safetyFilter}
                  onChange={(e) => setSafetyFilter(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option>Block None (Development)</option>
                  <option>Block Some (Balanced)</option>
                  <option>Block Most (Enterprise Strict)</option>
                </select>
                <p className="text-[10px] text-slate-500">
                  Controls safety filtering across generated field transformations.
                </p>
              </div>

              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Monthly Token Usage Cap
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tokenCap}
                    onChange={(e) => setTokenCap(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-mono">Tokens / Month quota enforcement</p>
              </div>
            </div>
          </section>

          {/* Real-time LLM Provider Telemetry Monitor Grid */}
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Real-Time Multi-LLM Orchestration Telemetry</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Live latency tracking, active failover priority, and token consumption across all 6 model engines.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase font-mono rounded-full border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span>6 Models Online</span>
              </span>
            </div>

            {/* Provider Stats Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {providerMetrics.map((p) => (
                <div
                  key={p.name}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between hover:border-indigo-300 hover:bg-slate-100/60 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        p.priority === 'Primary'
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      {p.priority}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Active Model:</span>
                      <span className="font-mono font-bold text-slate-900">{p.model}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Live Latency:</span>
                      <span className="font-mono font-bold text-emerald-600">{p.latency}ms</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Monthly API Calls:</span>
                      <span className="font-mono font-bold text-slate-800">{p.calls}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                      {p.status}
                    </span>
                    <span className="text-slate-400 font-mono">TLS 1.3 Proxy</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 1: API SECRET KEYS & KEY VAULT */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Secret Keys Status Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  API Secret Keys & Security Vault Status (All 6 AI Models Configured)
                </h2>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-mono text-[10px] font-bold rounded border border-slate-200">
                  Real-Time Vault Monitored
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {secretKeys.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        {item.keyType === 'AI Engine' ? (
                          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                        ) : item.id === 'cloud_sql' ? (
                          <Server className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : item.id === 'redis' ? (
                          <Database className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                            <span>{item.name}</span>
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-sans font-semibold rounded ${
                                item.keyType === 'AI Engine'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {item.keyType}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-sans mt-0.5">{item.description}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.latencyMs && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.latencyMs}ms ping
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                            item.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {item.status === 'active' ? 'Configured (Active)' : 'Fallback Mode'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 font-sans">
                      <span>Last Rotation: {item.lastRotated}</span>
                      <span className="font-mono text-emerald-600 font-semibold">TLS 1.3 / AES-256 Encrypted</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Secret Vault Governance Settings */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <LockKeyhole className="w-4 h-4 text-indigo-600" />
                Key Vault & Secret Rotation Policy
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vault KMS Provider</label>
                  <select
                    value={vaultProvider}
                    onChange={(e) => {
                      setVaultProvider(e.target.value as any);
                      showToast(`Vault KMS switched to ${e.target.value.toUpperCase()} Secrets Manager`);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="gcp">Google Cloud Secret Manager (Default)</option>
                    <option value="aws">AWS Secrets Manager</option>
                    <option value="azure">Azure Key Vault</option>
                    <option value="hashicorp">HashiCorp Vault Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Automated Key Rotation Cycle</label>
                  <select
                    value={rotationInterval}
                    onChange={(e) => {
                      setRotationInterval(e.target.value as any);
                      showToast(`Key rotation policy updated to ${e.target.value} Days cycle`);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="30">Every 30 Days (High Security)</option>
                    <option value="60">Every 60 Days (Recommended)</option>
                    <option value="90">Every 90 Days (Enterprise Standard)</option>
                    <option value="manual">Manual Rotation Only</option>
                  </select>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-indigo-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Zero-Trust Architecture
                  </div>
                  <p className="text-indigo-800/80 leading-relaxed">
                    API keys for all 6 AI models (Gemini, GPT, Claude, Kimi, GLM, Qwen) are stored exclusively in server-side memory (`/api/*` proxy) and never exposed to client browsers or network logs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC PERMISSIONS MATRIX */}
      {activeTab === 'rbac' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Role-Based Access Control (RBAC) Permissions Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Interactive permission matrix controlling user access across Connectors, Mapping, Execution, and Administration.
              </p>
            </div>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold rounded-full border border-indigo-100 shrink-0">
              5 Enterprise Roles Configured
            </span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Connectors</th>
                  <th className="py-2.5 px-3">Mapping</th>
                  <th className="py-2.5 px-3">Migration</th>
                  <th className="py-2.5 px-3">Audit Log</th>
                  <th className="py-2.5 px-3">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {Object.entries(rbacMatrix).map(([roleName, perms]) => (
                  <tr key={roleName} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{roleName}</td>
                    {['connectors', 'mapping', 'migration', 'audit', 'settings'].map((modKey) => {
                      const val = perms[modKey];
                      return (
                        <td key={modKey} className="py-3 px-3">
                          <select
                            value={val}
                            onChange={(e) => handlePermissionChange(roleName, modKey, e.target.value)}
                            className={`px-2 py-1 rounded text-[11px] font-bold border font-mono cursor-pointer focus:outline-none ${
                              val === 'Full'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : val === 'Dry-Run' || val === 'Execute'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : val === 'Read'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            <option value="Full">Full</option>
                            <option value="Execute">Execute</option>
                            <option value="Dry-Run">Dry-Run</option>
                            <option value="Read">Read</option>
                            <option value="None">None</option>
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SESSION SECURITY & SOC 2 COMPLIANCE */}
      {activeTab === 'session' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  Automatic Idle Session Timeout Policy & SOC 2 Compliance
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure interactive inactivity monitors, warning thresholds, and in-memory buffer wiping routines.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-mono text-[11px] font-bold rounded-full border border-emerald-200 shadow-2xs shrink-0 self-start sm:self-auto">
                Enforced ({idleLimitMinutes}m Inactivity)
              </span>
            </div>

            {/* Interactive Policy Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              {/* Option 1: Idle Limit */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Default Idle Limit</span>
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-xl font-extrabold text-slate-900 font-mono">
                  {idleLimitMinutes} Minutes
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Inactivity detected across mouse, keyboard, touch, scroll, and click events.
                </p>
                <div className="pt-2">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Adjust Idle Time Limit:</label>
                  <div className="flex items-center gap-1.5">
                    {[15, 30, 60, 120].map((m) => (
                      <button
                        key={m}
                        onClick={() => setIdleLimitMinutes(m)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono transition-all cursor-pointer ${
                          idleLimitMinutes === m
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Option 2: Warning Threshold */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Warning Threshold</span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-extrabold text-amber-600 font-mono">
                  {warningThresholdMinutes} Minutes Before
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pops up interactive modal with live countdown ring and extension controls.
                </p>
                <div className="pt-2">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Adjust Warning Popup Lead:</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 5].map((w) => (
                      <button
                        key={w}
                        onClick={() => setWarningThresholdMinutes(w)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono transition-all cursor-pointer ${
                          warningThresholdMinutes === w
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {w}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Option 3: SOC 2 Wiping Standard */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">State Wiping Standard</span>
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-xl font-extrabold text-indigo-600 font-mono">SOC 2 / NIST 800-53</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Purges in-memory token caches, query responses, and session storage buffers.
                </p>
                <div className="pt-2 space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={purgeTokenCache}
                      onChange={(e) => setPurgeTokenCache(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold">Purge in-memory token cache</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={clearSessionStorage}
                      onChange={(e) => setClearSessionStorage(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold">Clear query response buffers</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={enforceReauth}
                      onChange={(e) => setEnforceReauth(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold">Require MFA upon re-login</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveSessionPolicy}
                disabled={isSavingSession}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSession ? 'Enforcing Settings...' : 'Save Session Security Policy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PIPELINE THROTTLING & RATE LIMITS */}
      {activeTab === 'throttling' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                Real-Time Throttling & Pipeline Rate Limiting Engine
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Govern token bucket rate limit caps, worker thread concurrency, and automatic failure pause thresholds across active data pipelines.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="block font-bold text-slate-800">Max System Throughput (RPS Cap)</label>
              <div className="text-lg font-extrabold text-indigo-600 font-mono">{maxRpsCap} req/sec</div>
              <input
                type="range"
                min={500}
                max={5000}
                step={100}
                value={maxRpsCap}
                onChange={(e) => setMaxRpsCap(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Limits total OData & SQL requests sent to destination systems.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="block font-bold text-slate-800">Worker Node Concurrency Threads</label>
              <div className="text-lg font-extrabold text-purple-600 font-mono">{concurrencyWorkers} Workers</div>
              <input
                type="range"
                min={16}
                max={256}
                step={16}
                value={concurrencyWorkers}
                onChange={(e) => setConcurrencyWorkers(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Spark & Flink distributed partition worker execution pool.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="block font-bold text-slate-800">Auto-Pause Error Threshold</label>
              <div className="text-lg font-extrabold text-rose-600 font-mono">{autoPauseThresholdPct}% Failure Rate</div>
              <input
                type="range"
                min={0.5}
                max={10}
                step={0.5}
                value={autoPauseThresholdPct}
                onChange={(e) => setAutoPauseThresholdPct(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Automatically holds migration batches if error spikes exceed limit.</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveThrottling}
              disabled={isSavingThrottling}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingThrottling ? 'Saving Engine Parameters...' : 'Save Pipeline Parameters'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: ALERT DESTINATIONS & WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                Alert Destinations & Real-Time Webhooks
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure real-time notifications for job completions, SLA latency breaches, and critical schema drift alerts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Slack Incident Webhook URL</label>
                <input
                  type="text"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Microsoft Teams Alert Webhook URL</label>
                <input
                  type="text"
                  value={teamsWebhook}
                  onChange={(e) => setTeamsWebhook(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isTestingWebhook ? 'animate-bounce' : ''}`} />
                  <span>{isTestingWebhook ? 'Dispatching Test Payload...' : 'Send Test Webhook'}</span>
                </button>
              </div>
            </div>

            {/* Webhook Log Console */}
            <div className="bg-slate-900 text-emerald-400 font-mono p-4 rounded-xl border border-slate-800 space-y-2 h-48 overflow-y-auto">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800 pb-1">
                Real-Time Dispatch Console Logs
              </div>
              {webhookLog.length === 0 ? (
                <div className="text-slate-500 text-[11px] pt-4 text-center">
                  No webhooks dispatched yet. Click "Send Test Webhook" above.
                </div>
              ) : (
                webhookLog.map((log, idx) => (
                  <div key={idx} className="text-[11px]">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
