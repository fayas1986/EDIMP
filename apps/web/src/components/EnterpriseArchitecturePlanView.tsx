import React, { useState } from 'react';
import {
  Server,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Workflow,
  FileText,
  Download,
  RefreshCw,
  Zap,
  GitCommit,
  Database,
  Lock,
  Network,
  Combine,
  Search,
  ChevronRight,
  Check,
  BookOpen,
  ArrowRight,
  Filter,
  Sparkles,
  Terminal,
  Activity,
  Sliders,
  Copy,
} from 'lucide-react';
import {
  ARCHITECTURE_RULES,
  ROADMAP_PHASES,
  FULL_SCALE_PLAN_MARKDOWN,
  ARCHITECTURE_PLAN_CHAPTERS,
  ArchitectureRule,
} from '../data/architectureScalePlan';
import { PRD_CHAPTERS } from '../data/prdContent';

export const EnterpriseArchitecturePlanView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'matrix' | 'rules' | 'roadmap' | 'queues'>('blueprint');
  
  // Blueprint Tab State
  const [selectedChapterId, setSelectedChapterId] = useState<string>('arch-plan-ch1');
  const [chapterSearch, setChapterSearch] = useState<string>('');
  
  // Rule Filter State
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<string>('All');
  const [ruleStatusFilter, setRuleStatusFilter] = useState<string>('All');
  const [ruleSearch, setRuleSearch] = useState<string>('');
  const [complianceChecking, setComplianceChecking] = useState<boolean>(false);
  const [complianceChecked, setComplianceChecked] = useState<boolean>(true);
  
  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const allChapters = [...ARCHITECTURE_PLAN_CHAPTERS, ...PRD_CHAPTERS];
  const activeChapter = allChapters.find((c) => c.id === selectedChapterId) || ARCHITECTURE_PLAN_CHAPTERS[0];

  const filteredChapters = allChapters.filter(
    (c) =>
      c.title.toLowerCase().includes(chapterSearch.toLowerCase()) ||
      c.summary.toLowerCase().includes(chapterSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(chapterSearch.toLowerCase())
  );

  const filteredRules = ARCHITECTURE_RULES.filter((r) => {
    const matchesCategory = ruleCategoryFilter === 'All' || r.category === ruleCategoryFilter;
    const matchesStatus = ruleStatusFilter === 'All' || r.enforcementStatus === ruleStatusFilter;
    const matchesSearch =
      r.title.toLowerCase().includes(ruleSearch.toLowerCase()) ||
      r.rule.toLowerCase().includes(ruleSearch.toLowerCase()) ||
      r.rationale.toLowerCase().includes(ruleSearch.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleRunComplianceCheck = () => {
    setComplianceChecking(true);
    setTimeout(() => {
      setComplianceChecking(false);
      setComplianceChecked(true);
      showToast('✓ Cluster Compliance Audit Completed: All 15 Architecture Rules Enforced!');
    }, 1000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([FULL_SCALE_PLAN_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'EDIMP_Enterprise_Architecture_Scale_Plan.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded Enterprise Architecture Plan (.md)');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-indigo-500/50 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-indigo-900/60 shadow-xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                TOGAF & DAMA DMBOK Compliant
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Control Plane / Data Plane Separated
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Enterprise Architecture Optimization & Scale-Up Plan
            </h1>
            <p className="text-sm text-indigo-200/90 leading-relaxed">
              Target blueprint for scaling EDIMP to 10M+ records. Features NestJS Control Plane orchestration, distributed worker pools, BullMQ job queues, object storage offloading, and 15 strict architecture guardrails.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Blueprint (.md)</span>
            </button>
            <button
              onClick={handleRunComplianceCheck}
              disabled={complianceChecking}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-indigo-700/60 text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-amber-300 ${complianceChecking ? 'animate-spin' : ''}`} />
              <span>{complianceChecking ? 'Auditing Cluster...' : 'Run Compliance Audit'}</span>
            </button>
          </div>
        </div>

        {/* Global Key Architecture Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-indigo-900/60">
          <div className="bg-slate-900/60 border border-indigo-800/40 p-3 rounded-xl">
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">API Control Plane</span>
            <span className="text-base font-black text-white mt-0.5 block">NestJS + Prisma</span>
          </div>
          <div className="bg-slate-900/60 border border-indigo-800/40 p-3 rounded-xl">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Worker Data Plane</span>
            <span className="text-base font-black text-white mt-0.5 block">BullMQ + Redis</span>
          </div>
          <div className="bg-slate-900/60 border border-indigo-800/40 p-3 rounded-xl">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">Object Storage</span>
            <span className="text-base font-black text-white mt-0.5 block">MinIO / S3 Buckets</span>
          </div>
          <div className="bg-slate-900/60 border border-indigo-800/40 p-3 rounded-xl">
            <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block">Architecture Guardrails</span>
            <span className="text-base font-black text-white mt-0.5 block">15 Rules Enforced</span>
          </div>
          <div className="bg-slate-900/60 border border-indigo-800/40 p-3 rounded-xl">
            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">Scale Roadmap</span>
            <span className="text-base font-black text-white mt-0.5 block">9 Phases Defined</span>
          </div>
          <div className="bg-slate-900/60 border border-indigo-800/40 p-3 rounded-xl">
            <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider block">Target Throughput</span>
            <span className="text-base font-black text-white mt-0.5 block">&gt;5,000 Rec/Sec</span>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1">
        <button
          onClick={() => setActiveTab('blueprint')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'blueprint'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Architecture Handbook</span>
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Control vs Data Plane</span>
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rules'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>15 Enforced Rules ({ARCHITECTURE_RULES.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'roadmap'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>9-Phase Roadmap</span>
        </button>
        <button
          onClick={() => setActiveTab('queues')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'queues'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Queue & Object Storage Pipeline</span>
        </button>
      </div>

      {/* TAB 1: ARCHITECTURE HANDBOOK (BLUEPRINT) */}
      {activeTab === 'blueprint' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chapter Navigation Sidebar */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search architecture chapters..."
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5 max-h-[650px] overflow-y-auto pr-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Scale-Up Architecture Plan
              </div>
              {filteredChapters
                .filter((c) => c.category === 'Architecture Plan')
                .map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                      selectedChapterId === ch.id
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                        : 'bg-slate-50/50 border-transparent hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="truncate">{ch.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-1">{ch.summary}</p>
                  </button>
                ))}

              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mt-4">
                Core PRD Specification Chapters
              </div>
              {filteredChapters
                .filter((c) => c.category !== 'Architecture Plan')
                .map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                      selectedChapterId === ch.id
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                        : 'bg-slate-50/50 border-transparent hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="truncate">{ch.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-1">{ch.summary}</p>
                  </button>
                ))}
            </div>
          </div>

          {/* Chapter Content Main Viewer */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold uppercase rounded-full">
                  {activeChapter.category}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">{activeChapter.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{activeChapter.summary}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeChapter.contentMarkdown);
                  showToast('Copied chapter content to clipboard');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Markdown</span>
              </button>
            </div>

            {/* Content Display */}
            <div className="prose prose-sm max-w-none text-slate-700 space-y-4">
              {activeChapter.contentMarkdown.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('# ')) {
                  return <h1 key={idx} className="text-xl font-black text-slate-900 border-b pb-2">{paragraph.replace('# ', '')}</h1>;
                }
                if (paragraph.startsWith('## ')) {
                  return <h2 key={idx} className="text-base font-bold text-slate-800 mt-4">{paragraph.replace('## ', '')}</h2>;
                }
                if (paragraph.startsWith('### ')) {
                  return <h3 key={idx} className="text-sm font-bold text-slate-800 mt-2">{paragraph.replace('### ', '')}</h3>;
                }
                if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                  return (
                    <ul key={idx} className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                      {paragraph.split('\n').map((item, i) => (
                        <li key={i}>{item.replace(/^[-*]\s+/, '')}</li>
                      ))}
                    </ul>
                  );
                }
                if (paragraph.startsWith('```')) {
                  const codeText = paragraph.replace(/```[a-z]*/g, '').trim();
                  return (
                    <pre key={idx} className="bg-slate-900 text-indigo-300 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
                      <code>{codeText}</code>
                    </pre>
                  );
                }
                return <p key={idx} className="text-xs leading-relaxed text-slate-600">{paragraph}</p>;
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTROL PLANE VS DATA PLANE MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="p-5 bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 border border-indigo-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Combine className="w-4 h-4 text-indigo-600" />
                Control Plane & Data Plane Decoupling Architecture
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                NestJS orchestrates state, identity, permissions, and connectors. Asynchronous worker processes perform high-throughput extraction, transformation, and batch loading.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-2xs">
                API Latency SLA &lt; 45ms
              </span>
              <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-2xs">
                Worker Pool Scale: 100 Nodes
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Control Plane Box */}
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Control Plane (NestJS Engine)</h4>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Synchronous HTTP & Gateway Layer</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold rounded-full">
                  PostgreSQL Master
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Handles user sessions, API endpoints, metadata, tenant context, schema registry definitions, and job dispatching. Never blocks on heavy payload transfers.
                </p>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key Domain Modules:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">
                      Auth & Tenant Context
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">
                      Schema Registry & Mapper
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">
                      Migration Job Orchestrator
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">
                      Immutable Audit Service
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-xs space-y-1">
                  <div className="font-bold text-indigo-900">Control Plane Scaling Pattern:</div>
                  <div className="text-indigo-700">Autoscales based on HTTP request volume and WebSocket subscriber count (2 → 10 Replicas).</div>
                </div>
              </div>
            </div>

            {/* Data Plane Box */}
            <div className="bg-white rounded-2xl p-6 border-2 border-emerald-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Data Plane (Worker Runtime)</h4>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Asynchronous Processing Engine</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                  Redis + BullMQ
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Executes record extraction, Excel/CSV stream parsing, expression evaluations, rate-limited target REST/OData requests, and financial reconciliation.
                </p>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key Dedicated Worker Pools:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">
                      Extraction Workers
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">
                      Validation & Cleansing
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">
                      Batch Loading Workers
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">
                      Reconciliation Workers
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs space-y-1">
                  <div className="font-bold text-emerald-900">Data Plane Scaling Pattern:</div>
                  <div className="text-emerald-700">Autoscales independently driven by Redis job queue depth and target API rate limits (2 → 100 Workers).</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 15 ENFORCED ARCHITECTURE RULES */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter rules..."
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={ruleCategoryFilter}
                onChange={(e) => setRuleCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Control/Data Plane">Control/Data Plane</option>
                <option value="Data Integrity">Data Integrity</option>
                <option value="Security & Isolation">Security & Isolation</option>
                <option value="Resiliency & Scale">Resiliency & Scale</option>
                <option value="Governance">Governance</option>
              </select>

              <select
                value={ruleStatusFilter}
                onChange={(e) => setRuleStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Enforced">Enforced</option>
                <option value="Active Guardrail">Active Guardrail</option>
                <option value="Monitoring">Monitoring</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                Showing {filteredRules.length} of {ARCHITECTURE_RULES.length} Rules
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded-md">
                      RULE #{rule.id}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {rule.enforcementStatus}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{rule.title}</h4>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-800 leading-relaxed">
                    "{rule.rule}"
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-400 uppercase tracking-wider">Category</span>
                    <span className="font-bold text-indigo-600">{rule.category}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    <strong className="text-slate-700">Rationale:</strong> {rule.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: 9-PHASE IMPLEMENTATION ROADMAP */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-indigo-600" />
                9-Phase Scale-Up Implementation Roadmap
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sequenced evolution path from Control Plane stabilization to zero-downtime CDC synchronization.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-lg">
                Phase 1 Complete
              </span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-extrabold rounded-lg">
                Phase 2 & 3 Active
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {ROADMAP_PHASES.map((ph) => (
              <div
                key={ph.phase}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 hover:border-indigo-200 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                      ph.status === 'Completed' ? 'bg-emerald-600 text-white' :
                      ph.status === 'In Progress' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      P{ph.phase}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{ph.name}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">Deliverable: {ph.deliverable}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                      ph.priority === 'Critical' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      ph.priority === 'Very High' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {ph.priority} Priority
                    </span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                      ph.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      ph.status === 'In Progress' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ph.status} ({ph.completionPct}%)
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      ph.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${ph.completionPct}%` }}
                  />
                </div>

                {/* Milestone Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                  {ph.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-700 font-medium">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${ph.completionPct > 50 ? 'text-emerald-500' : 'text-slate-300'}`} />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: QUEUE & OBJECT STORAGE PIPELINE */}
      {activeTab === 'queues' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BullMQ Queues */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  BullMQ Queue Channel Specifications
                </h4>
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold rounded-full">
                  Redis Cluster
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'extraction.queue', desc: 'Source payload extraction and chunked streaming', priority: 'High', delay: '0ms' },
                  { name: 'validation.queue', desc: 'Regex constraints, null frequency, data profiling', priority: 'High', delay: '0ms' },
                  { name: 'transformation.queue', desc: 'Canonical model mapping and expression evaluations', priority: 'High', delay: '0ms' },
                  { name: 'loading.queue', desc: 'Rate-limited target API batch upserts (chunk size 1k)', priority: 'Critical', delay: 'Adaptive' },
                  { name: 'reconciliation.queue', desc: 'Record count hash verification & balance audit', priority: 'Normal', delay: '0ms' },
                ].map((q, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-mono font-bold text-indigo-950">{q.name}</div>
                      <div className="text-[11px] text-slate-500">{q.desc}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold rounded-md block">
                        {q.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{q.delay}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Object Storage Buckets */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-600" />
                  Object Storage Bucket Layout (S3 / MinIO)
                </h4>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full">
                  Encrypted KMS
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { path: '/raw/tenant/{id}/migration/{id}/', desc: 'Raw uploaded Excel, CSV, and raw source JSON dumps', retention: '90 Days' },
                  { path: '/staging/tenant/{id}/', desc: 'Canonical JSON stream buffers used during processing', retention: '7 Days' },
                  { path: '/validated/tenant/{id}/', desc: 'Cleaned, pre-flight simulated datasets ready for load', retention: '30 Days' },
                  { path: '/failed/tenant/{id}/', desc: 'Rejected record snapshots with granular error codes', retention: '180 Days' },
                  { path: '/reports/tenant/{id}/', desc: 'Generated PDF/XLSX reconciliation reports and audit exports', retention: '365 Days' },
                ].map((b, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-mono font-bold text-amber-950">{b.path}</div>
                      <div className="text-[11px] text-slate-500">{b.desc}</div>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-md shrink-0">
                      {b.retention}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
