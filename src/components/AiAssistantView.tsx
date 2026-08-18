import React, { useState, useEffect } from 'react';
import { fetchNaturalLanguageQuery } from '../services/aiService';
import {
  Sparkles,
  Send,
  MessageSquare,
  Bot,
  User,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Bell,
  AlertTriangle,
  X,
  Calculator,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Filter,
  DollarSign,
  BarChart3,
  TrendingUp,
  History,
  Table,
  Radio,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sql?: string;
  suggestedAction?: string;
  timestamp: string;
  provider?: string;
  model?: string;
}

const PROVIDER_MODELS: Record<string, { name: string; models: string[] }> = {
  gemini: {
    name: 'Google Gemini',
    models: ['Gemini 2.5 Flash', 'Gemini 2.0 Pro', 'Gemini 1.5 Pro', 'Gemini 1.5 Flash'],
  },
  openai: {
    name: 'OpenAI GPT',
    models: ['GPT-4o (Omni)', 'o1-pro', 'GPT-4-turbo', 'GPT-3.5-turbo'],
  },
  anthropic: {
    name: 'Anthropic Claude',
    models: ['Claude 3.5 Sonnet', 'Claude 3 Opus', 'Claude 3 Haiku'],
  },
  kimi: {
    name: 'Moonshot Kimi',
    models: ['Kimi-Chat-v1-200k', 'Kimi-Chat-v1-32k'],
  },
  glm: {
    name: 'Zhipu GLM',
    models: ['GLM-4-Plus', 'GLM-4-Air', 'GLM-3-Turbo'],
  },
  qwen: {
    name: 'Alibaba Qwen',
    models: ['Qwen-2.5-72B-Instruct', 'Qwen-2.5-Coder', 'Qwen-VL-Max'],
  },
};

export const AiAssistantView: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'anthropic' | 'kimi' | 'glm' | 'qwen'>('gemini');
  const [selectedModel, setSelectedModel] = useState('Gemini 1.5 Pro');
  const [latencyThreshold, setLatencyThreshold] = useState<number>(250);
  const [toasts, setToasts] = useState<Array<{ id: string; provider: string; latency: number; threshold: number }>>([]);
  
  // Sorting, Filtering, and Forecasting States
  const [sortBy, setSortBy] = useState<'cost' | 'latency' | 'successRate' | 'none'>('none');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [monthlyTokenVolume, setMonthlyTokenVolume] = useState<number>(10); // in millions
  const [consumptionMetric, setConsumptionMetric] = useState<'total' | 'input' | 'output'>('total');
  const [viewMode, setViewMode] = useState<'table' | 'radar'>('table');

  const [historicalDailyConsumption] = useState([
    { date: '08/10', gemini: 450, openai: 380, anthropic: 290, kimi: 120, glm: 150, qwen: 110 },
    { date: '08/11', gemini: 520, openai: 410, anthropic: 310, kimi: 140, glm: 160, qwen: 130 },
    { date: '08/12', gemini: 610, openai: 460, anthropic: 340, kimi: 180, glm: 190, qwen: 150 },
    { date: '08/13', gemini: 580, openai: 390, anthropic: 300, kimi: 150, glm: 170, qwen: 140 },
    { date: '08/14', gemini: 720, openai: 540, anthropic: 410, kimi: 220, glm: 210, qwen: 180 },
    { date: '08/15', gemini: 410, openai: 280, anthropic: 210, kimi: 110, glm: 130, qwen: 95 },
    { date: '08/16', gemini: 350, openai: 240, anthropic: 180, kimi: 90,  glm: 110, qwen: 80 }
  ]);

  const [providerBenchmarks, setProviderBenchmarks] = useState([
    {
      key: 'gemini',
      provider: 'Google Gemini',
      bestModel: 'Gemini 1.5 Pro',
      successRate: 99.8,
      responseTime: 115,
      costPerMillion: 0.075,
      status: 'Healthy',
      tier: 'Core Optimizer',
    },
    {
      key: 'openai',
      provider: 'OpenAI GPT',
      bestModel: 'GPT-4o (Omni)',
      successRate: 99.6,
      responseTime: 185,
      costPerMillion: 2.500,
      status: 'Healthy',
      tier: 'Premium Logic',
    },
    {
      key: 'anthropic',
      provider: 'Anthropic Claude',
      bestModel: 'Claude 3.5 Sonnet',
      successRate: 99.4,
      responseTime: 210,
      costPerMillion: 3.000,
      status: 'Healthy',
      tier: 'Deep Architect',
    },
    {
      key: 'kimi',
      provider: 'Moonshot Kimi',
      bestModel: 'Kimi-Chat-v1-200k',
      successRate: 98.9,
      responseTime: 340,
      costPerMillion: 1.200,
      status: 'Healthy',
      tier: 'Long-Context Sync',
    },
    {
      key: 'glm',
      provider: 'Zhipu GLM',
      bestModel: 'GLM-4-Plus',
      successRate: 98.5,
      responseTime: 290,
      costPerMillion: 1.000,
      status: 'Warning',
      tier: 'Bilingual Core',
    },
    {
      key: 'qwen',
      provider: 'Alibaba Qwen',
      bestModel: 'Qwen-2.5-72B-Instruct',
      successRate: 98.7,
      responseTime: 310,
      costPerMillion: 0.800,
      status: 'Healthy',
      tier: 'Dense Coder',
    },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am your EDIMP AI Integration Co-Pilot. I can help you generate transformation rules, fix schema mismatches, detect schema drift, and build SQL queries in natural language using any active LLM engine.',
      timestamp: '10:00 AM',
      provider: 'gemini',
      model: 'Gemini 1.5 Pro',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Background Live Monitor Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setProviderBenchmarks((prev) => {
        return prev.map((p) => {
          const delta = Math.floor(Math.random() * 61) - 30; // random shift from -30 to +30 ms
          const newTime = Math.max(50, p.responseTime + delta);

          // Raise visual toast notification if it crosses the threshold limit
          if (newTime > latencyThreshold) {
            setToasts((prevToasts) => {
              if (prevToasts.some((t) => t.provider === p.provider)) return prevToasts;
              const id = Date.now().toString() + Math.random();

              setTimeout(() => {
                setToasts((curr) => curr.filter((t) => t.id !== id));
              }, 4000);

              return [
                ...prevToasts,
                { id, provider: p.provider, latency: newTime, threshold: latencyThreshold },
              ];
            });
          }

          return {
            ...p,
            responseTime: newTime,
            status: newTime > latencyThreshold ? 'Warning' : 'Healthy',
          };
        });
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [latencyThreshold]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userText = input;
    setInput('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await fetchNaturalLanguageQuery(userText, 'Customers', 'ERP Schema', selectedProvider, selectedModel);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.answer || 'I have analyzed your request.',
        sql: res.generatedSql,
        suggestedAction: res.action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: res.provider,
        model: res.model,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.warn('AI query failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
              Module 26 & 27 – Multi-LLM AI Co-Pilot Studio
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            Natural Language AI Integration Assistant
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ask questions, generate regex cleansing rules, inspect schema drift, and request automated data migrations using Google, OpenAI, Claude, Kimi, GLM, or Qwen.
          </p>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-[520px]">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600 animate-bounce" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">AI Co-Pilot Integration Co-Pilot</span>
              <span className="text-[10px] text-slate-500 font-bold font-mono">Status: Connected ({PROVIDER_MODELS[selectedProvider].name})</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Engine Provider</span>
              <select
                value={selectedProvider}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setSelectedProvider(val);
                  setSelectedModel(PROVIDER_MODELS[val].models[0]);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI GPT</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="kimi">Moonshot Kimi</option>
                <option value="glm">Zhipu GLM</option>
                <option value="qwen">Alibaba Qwen</option>
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Model Variant</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {PROVIDER_MODELS[selectedProvider].models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  m.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-xl rounded-2xl p-4 text-xs ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-800 border border-slate-200'
              }`}>
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                {m.sql && (
                  <div className="mt-2.5 p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg">
                    {m.sql}
                  </div>
                )}
                
                {m.sender === 'ai' && m.model && (
                  <div className="mt-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-lg w-fit">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-500 animate-pulse" />
                    <span>{m.provider?.toUpperCase()}: {m.model}</span>
                  </div>
                )}

                <span className="text-[10px] opacity-60 block text-right mt-1 font-mono">{m.timestamp}</span>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono italic p-2 animate-pulse">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              {PROVIDER_MODELS[selectedProvider].name} is processing your prompt...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI e.g. How do I normalize phone numbers to E.164 format?"
            className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Historical Performance Metrics Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden p-6 space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 animate-pulse" />
              Provider Historical Performance & SLA Benchmark Matrix
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Compare key indicators to select your ideal migration engine. Click any row to dynamically mount and switch your active Co-Pilot workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tabular vs Radar Visualization Switch */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-700 shadow-3xs border border-slate-150'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('radar')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'radar'
                    ? 'bg-white text-indigo-700 shadow-3xs border border-slate-150'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Radar Chart</span>
              </button>
            </div>

            {/* Filter classification tier */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-150 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-bold mr-1">Tier:</span>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="bg-transparent focus:outline-none font-medium text-slate-800"
              >
                <option value="all">All Tiers</option>
                <option value="Core Optimizer">Core Optimizer</option>
                <option value="Premium Logic">Premium Logic</option>
                <option value="Deep Architect">Deep Architect</option>
                <option value="Long-Context Sync">Long-Context Sync</option>
                <option value="Bilingual Core">Bilingual Core</option>
                <option value="Dense Coder">Dense Coder</option>
              </select>
            </div>

            {/* Dynamic Threshold setting controller */}
            <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center gap-3">
              <div className="p-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 shrink-0">
                <Bell className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider leading-none">Alert Threshold</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <input
                      type="range"
                      min="100"
                      max="400"
                      step="25"
                      value={latencyThreshold}
                      onChange={(e) => setLatencyThreshold(Number(e.target.value))}
                      className="w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded text-[9px]">
                      {latencyThreshold}ms
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sorting header toggler function / Radar switch layout */}
        {(() => {
          const toggleSort = (field: 'cost' | 'latency' | 'successRate') => {
            if (sortBy === field) {
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            } else {
              setSortBy(field);
              setSortOrder('desc'); // Default to high-to-low / most expensive to cheapest
            }
          };

          const sortedAndFilteredList = [...providerBenchmarks]
            .filter((row) => {
              if (filterTier !== 'all' && row.tier !== filterTier) return false;
              return true;
            })
            .sort((a, b) => {
              if (sortBy === 'none') return 0;
              let valA = 0;
              let valB = 0;
              if (sortBy === 'cost') {
                valA = a.costPerMillion;
                valB = b.costPerMillion;
              } else if (sortBy === 'latency') {
                valA = a.responseTime;
                valB = b.responseTime;
              } else if (sortBy === 'successRate') {
                valA = a.successRate;
                valB = b.successRate;
              }

              if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
              if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
              return 0;
            });

          const isProviderVisible = (key: string) => sortedAndFilteredList.some(item => item.key === key);

          const getScoreForProvider = (key: string, field: 'success' | 'speed' | 'economy') => {
            const row = providerBenchmarks.find(b => b.key === key);
            if (!row) return 0;
            if (field === 'success') return row.successRate;
            if (field === 'speed') return Math.max(15, Math.round(100 * (1 - (row.responseTime - 100) / 300)));
            if (field === 'economy') return Math.max(15, Math.round(100 * (1 - row.costPerMillion / 16)));
            return 0;
          };

          const radarData = [
            {
              subject: 'Job Success Rate (%)',
              'Google Gemini': getScoreForProvider('gemini', 'success'),
              'OpenAI GPT': getScoreForProvider('openai', 'success'),
              'Anthropic Claude': getScoreForProvider('anthropic', 'success'),
              'Moonshot Kimi': getScoreForProvider('kimi', 'success'),
              'Zhipu GLM': getScoreForProvider('glm', 'success'),
              'Alibaba Qwen': getScoreForProvider('qwen', 'success'),
              fullMark: 100,
            },
            {
              subject: 'Speed Score (Latency)',
              'Google Gemini': getScoreForProvider('gemini', 'speed'),
              'OpenAI GPT': getScoreForProvider('openai', 'speed'),
              'Anthropic Claude': getScoreForProvider('anthropic', 'speed'),
              'Moonshot Kimi': getScoreForProvider('kimi', 'speed'),
              'Zhipu GLM': getScoreForProvider('glm', 'speed'),
              'Alibaba Qwen': getScoreForProvider('qwen', 'speed'),
              fullMark: 100,
            },
            {
              subject: 'Economy Score (Cost)',
              'Google Gemini': getScoreForProvider('gemini', 'economy'),
              'OpenAI GPT': getScoreForProvider('openai', 'economy'),
              'Anthropic Claude': getScoreForProvider('anthropic', 'economy'),
              'Moonshot Kimi': getScoreForProvider('kimi', 'economy'),
              'Zhipu GLM': getScoreForProvider('glm', 'economy'),
              'Alibaba Qwen': getScoreForProvider('qwen', 'economy'),
              fullMark: 100,
            }
          ];

          if (viewMode === 'radar') {
            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* Radar Chart Visual */}
                <div className="lg:col-span-2 h-80 bg-slate-50/50 rounded-2xl border border-slate-150 p-4 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#cbd5e1" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                      
                      {isProviderVisible('gemini') && (
                        <Radar name="Google Gemini" dataKey="Google Gemini" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
                      )}
                      {isProviderVisible('openai') && (
                        <Radar name="OpenAI GPT" dataKey="OpenAI GPT" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                      )}
                      {isProviderVisible('anthropic') && (
                        <Radar name="Anthropic Claude" dataKey="Anthropic Claude" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                      )}
                      {isProviderVisible('kimi') && (
                        <Radar name="Moonshot Kimi" dataKey="Moonshot Kimi" stroke="#ec4899" fill="#ec4899" fillOpacity={0.15} />
                      )}
                      {isProviderVisible('glm') && (
                        <Radar name="Zhipu GLM" dataKey="Zhipu GLM" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
                      )}
                      {isProviderVisible('qwen') && (
                        <Radar name="Alibaba Qwen" dataKey="Alibaba Qwen" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
                      )}
                      
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg space-y-1 text-xs">
                                <p className="font-black text-slate-800 border-b border-slate-100 pb-1 mb-1">{payload[0].payload.subject}</p>
                                {payload.map((entry: any, i) => (
                                  <div key={i} className="flex justify-between gap-4">
                                    <span className="font-semibold" style={{ color: entry.stroke }}>{entry.name}:</span>
                                    <span className="font-mono font-bold text-slate-900">{entry.value}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        iconType="circle" 
                        iconSize={8}
                        wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Scorecard Insights Panel */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2.5">
                    <h4 className="text-[11px] font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                      Radar Insights
                    </h4>
                    <p className="text-[11px] text-indigo-950/80 leading-normal">
                      The radar polygons visualize normalized benchmarks. A wider surface area represents superior balance between cost, execution speed, and delivery accuracy.
                    </p>
                    <p className="text-[11px] text-indigo-950/80 leading-normal">
                      **Google Gemini** leads in cost economy and response latencies while matching premium models on success rate metrics.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">Select Active Provider</div>
                    <div className="grid grid-cols-2 gap-2">
                      {sortedAndFilteredList.map((row) => {
                        const isSelected = selectedProvider === row.key;
                        const colors: Record<string, string> = {
                          gemini: 'border-indigo-200 bg-indigo-50 text-indigo-700',
                          openai: 'border-emerald-200 bg-emerald-50 text-emerald-700',
                          anthropic: 'border-amber-200 bg-amber-50 text-amber-700',
                          kimi: 'border-pink-200 bg-pink-50 text-pink-700',
                          glm: 'border-cyan-200 bg-cyan-50 text-cyan-700',
                          qwen: 'border-purple-200 bg-purple-50 text-purple-700',
                        };
                        return (
                          <button
                            key={row.key}
                            type="button"
                            onClick={() => {
                              setSelectedProvider(row.key as any);
                              setSelectedModel(row.bestModel);
                            }}
                            className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                              isSelected 
                                ? `${colors[row.key] || 'border-indigo-600 bg-indigo-50'} shadow-3xs` 
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <div className="truncate">{row.provider}</div>
                            <div className="text-[9px] font-mono font-medium text-slate-400 mt-0.5 truncate">{row.bestModel}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-700 select-none">
                    <th className="p-3">Engine Provider</th>
                    <th className="p-3">Primary Flagship Model</th>
                    
                    <th 
                      onClick={() => toggleSort('successRate')}
                      className="p-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Job Success Rate</span>
                        {sortBy === 'successRate' ? (
                          sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                        ) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                      </div>
                    </th>

                    <th 
                      onClick={() => toggleSort('latency')}
                      className="p-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Live Latency</span>
                        {sortBy === 'latency' ? (
                          sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                        ) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                      </div>
                    </th>

                    <th 
                      onClick={() => toggleSort('cost')}
                      className="p-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Cost-per-1M Tokens</span>
                        {sortBy === 'cost' ? (
                          sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                        ) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                      </div>
                    </th>

                    <th className="p-3">Classification Tier</th>
                    <th className="p-3 text-center">SLA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {sortedAndFilteredList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        No engine models match the active tier filters.
                      </td>
                    </tr>
                  ) : (
                    sortedAndFilteredList.map((row) => {
                      const isSelected = selectedProvider === row.key;
                      const isBreached = row.responseTime > latencyThreshold;
                      return (
                        <tr 
                          key={row.key}
                          onClick={() => {
                            setSelectedProvider(row.key as any);
                            setSelectedModel(row.bestModel);
                          }}
                          className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-50/70 border-l-2 border-indigo-600' : ''
                          }`}
                        >
                          <td className="p-3 font-black text-slate-900 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-600 animate-ping' : 'bg-slate-300'}`} />
                            {row.provider}
                          </td>
                          <td className="p-3 text-slate-600 font-mono font-medium">{row.bestModel}</td>
                          <td className="p-3 text-right font-bold text-emerald-600">{row.successRate}%</td>
                          <td className="p-3 text-right font-mono">
                            <span className={`inline-flex items-center gap-1 font-bold ${
                              isBreached 
                                ? 'text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md animate-pulse' 
                                : 'text-slate-700'
                            }`}>
                              {isBreached && <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />}
                              {row.responseTime}ms
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-indigo-600 font-bold">${row.costPerMillion.toFixed(3)}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md">
                              {row.tier}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              !isBreached 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${!isBreached ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
                              {!isBreached ? 'Healthy' : 'Breached'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Cost-Forecasting Projection Widget */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600 animate-pulse" />
              Interactive LLM Monthly Expenditure Forecaster
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Estimate and optimize comparative monthly budget allocations based on projected payload token volumes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-bold">Projected Monthly Tokens:</span>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={monthlyTokenVolume}
              onChange={(e) => setMonthlyTokenVolume(Number(e.target.value))}
              className="w-36 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <span className="font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded text-[11px]">
              {monthlyTokenVolume}M Tokens
            </span>
          </div>
        </div>

        {/* Forecast cards grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providerBenchmarks.map((p) => {
            const projectedMonthlyCost = p.costPerMillion * monthlyTokenVolume;
            const isSelected = selectedProvider === p.key;
            const maxCost = Math.max(...providerBenchmarks.map(item => item.costPerMillion)) * monthlyTokenVolume;
            const savingsPercent = maxCost > 0 ? Math.round(((maxCost - projectedMonthlyCost) / maxCost) * 100) : 0;

            return (
              <div 
                key={p.key}
                onClick={() => {
                  setSelectedProvider(p.key as any);
                  setSelectedModel(p.bestModel);
                }}
                className={`p-4 border rounded-2xl flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-emerald-50/40 border-emerald-500 shadow-xs' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{p.provider}</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 bg-white border border-slate-150 px-1.5 py-0.5 rounded">
                    {p.tier}
                  </span>
                </div>

                <div className="my-3">
                  <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Projected Cost</div>
                  <div className="text-xl font-mono font-black text-slate-900 mt-1 flex items-baseline gap-1">
                    <span className="text-slate-500 text-sm">$</span>
                    <span>{projectedMonthlyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-slate-400 text-[10px] font-sans font-bold">/mo</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-150">
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isSelected ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      style={{ width: `${Math.max(5, (projectedMonthlyCost / maxCost) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                    <span>${p.costPerMillion.toFixed(3)} / 1M</span>
                    {savingsPercent > 0 ? (
                      <span className="text-emerald-600 font-bold">-{savingsPercent}% vs Max</span>
                    ) : (
                      <span className="text-slate-400 font-medium">Max Limit</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Daily Token Consumption Stacked Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              LLM Historical Token Consumption Matrix
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Analyze daily prompt and completion workloads across all active AI engines to optimize routing efficiency and identify cost-saving pools.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">Metric Scope:</span>
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {[
                { key: 'total', label: 'Total Tokens' },
                { key: 'input', label: 'Input (Prompt)' },
                { key: 'output', label: 'Output (Completion)' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setConsumptionMetric(opt.key as any)}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    consumptionMetric === opt.key
                      ? 'bg-white text-indigo-700 shadow-3xs border border-slate-150'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Main Stacked Bar Chart */}
          <div className="lg:col-span-3 h-80 bg-slate-50/50 rounded-2xl border border-slate-150 p-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={historicalDailyConsumption.map((item) => {
                  const factor = consumptionMetric === 'total' ? 1.0 : consumptionMetric === 'input' ? 0.7 : 0.3;
                  return {
                    date: item.date,
                    'Google Gemini': Math.round(item.gemini * factor),
                    'OpenAI GPT': Math.round(item.openai * factor),
                    'Anthropic Claude': Math.round(item.anthropic * factor),
                    'Moonshot Kimi': Math.round(item.kimi * factor),
                    'Zhipu GLM': Math.round(item.glm * factor),
                    'Alibaba Qwen': Math.round(item.qwen * factor),
                  };
                })}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}K`}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const totalDayTokens = payload.reduce((sum, entry) => sum + (entry.value as number), 0);
                      return (
                        <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-lg space-y-2 max-w-xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-xs font-black text-slate-900">Workload on {label}</span>
                            <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                              {totalDayTokens.toLocaleString()}K Tokens
                            </span>
                          </div>
                          <div className="space-y-1">
                            {payload.map((entry: any, index) => (
                              <div key={index} className="flex items-center justify-between gap-4 text-[10px]">
                                <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <span>{entry.name}</span>
                                </div>
                                <span className="font-mono font-bold text-slate-900">{entry.value.toLocaleString()}K</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#475569', paddingTop: '10px' }}
                />
                <Bar dataKey="Google Gemini" stackId="tokens" fill="#6366f1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="OpenAI GPT" stackId="tokens" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Anthropic Claude" stackId="tokens" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Moonshot Kimi" stackId="tokens" fill="#ec4899" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Zhipu GLM" stackId="tokens" fill="#06b6d4" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Alibaba Qwen" stackId="tokens" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sidebar Insights Grid */}
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h4 className="text-[11px] font-black uppercase text-indigo-900 tracking-wider">Model Selection Strategy</h4>
              </div>
              <p className="text-[11px] text-indigo-950/85 leading-normal">
                Based on the last 7 days of token workloads, **Google Gemini** consistently handled over <span className="font-bold">45%</span> of total enterprise transaction volumes.
              </p>
              <div className="pt-2 border-t border-indigo-100/60 flex flex-col gap-1.5 text-[10px]">
                <div className="flex justify-between items-center text-indigo-900">
                  <span>Avg Ingestion/Day:</span>
                  <span className="font-mono font-bold">521.4K Tokens</span>
                </div>
                <div className="flex justify-between items-center text-indigo-900">
                  <span>Weekly Cumulative:</span>
                  <span className="font-mono font-bold text-indigo-700">3,650K Tokens</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-150 space-y-2.5">
              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">Primary Active Shares</div>
              <div className="space-y-2">
                {[
                  { name: 'Google Gemini', pct: 45.3, color: 'bg-indigo-600', key: 'gemini', bestModel: 'Gemini 1.5 Pro' },
                  { name: 'OpenAI GPT', pct: 28.1, color: 'bg-emerald-500', key: 'openai', bestModel: 'GPT-4o (Omni)' },
                  { name: 'Anthropic Claude', pct: 14.5, color: 'bg-amber-500', key: 'anthropic', bestModel: 'Claude 3.5 Sonnet' },
                ].map((row, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      setSelectedProvider(row.key as any);
                      setSelectedModel(row.bestModel);
                    }}
                    className="space-y-1 cursor-pointer group"
                  >
                    <div className="flex justify-between text-[10px] items-center">
                      <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{row.name}</span>
                      <span className="font-mono font-bold text-slate-900">{row.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                      <div className={`h-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating SLA Notification Toasts */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2.5 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="p-4 bg-slate-900 text-white rounded-xl shadow-2xl border border-rose-500/30 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300"
          >
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1 space-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-rose-400">SLA Breach Warning</div>
              <p className="text-[11px] text-slate-300 leading-normal">
                <strong>{t.provider}</strong> latency spiked to <span className="font-mono text-rose-300 font-bold">{t.latency}ms</span>, exceeding threshold <span className="font-mono text-slate-400 font-medium">{t.threshold}ms</span>.
              </p>
            </div>
            <button
              onClick={() => setToasts((curr) => curr.filter((toast) => toast.id !== t.id))}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
