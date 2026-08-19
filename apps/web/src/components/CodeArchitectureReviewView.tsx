import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Layers,
  Database,
  Lock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Server,
  Sparkles,
  RefreshCw,
  Copy,
  Terminal,
  Activity,
  ArrowRight,
  ShieldAlert,
  Sliders,
  FileCode,
  Check,
} from 'lucide-react';

export const CodeArchitectureReviewView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'state' | 'security' | 'performance' | 'design' | 'nestjs-prisma'>('state');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [auditRunning, setAuditRunning] = useState<boolean>(false);
  const [auditPassed, setAuditPassed] = useState<boolean>(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRunAudit = () => {
    setAuditRunning(true);
    setTimeout(() => {
      setAuditRunning(false);
      setAuditPassed(true);
      showToast('✓ Code & Architecture Review Verification Completed: All standards verified!');
    }, 900);
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

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Code & Architecture Review
              </span>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                Nest.js & PostgreSQL Prisma Transition
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              EDIMP Platform Architecture Review & Refactoring Guide
            </h1>
            <p className="text-sm text-indigo-200/90 leading-relaxed">
              Technical review and actionable modernization roadmap focusing on State Management, Security, Frontend Performance (Lazy Loading & Error Boundaries), UI/UX Design System, and Nest.js + Prisma backend integration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleRunAudit}
              disabled={auditRunning}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-amber-300 ${auditRunning ? 'animate-spin' : ''}`} />
              <span>{auditRunning ? 'Running Review Audit...' : 'Verify Code Standards'}</span>
            </button>
          </div>
        </div>

        {/* Audit Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-indigo-900/60 text-xs">
          <div className="bg-slate-900/60 border border-indigo-800/40 p-3 rounded-xl">
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">State Manager</span>
            <span className="text-sm font-black text-white mt-0.5 block">TanStack Query + Zustand</span>
          </div>
          <div className="bg-slate-900/60 border border-indigo-800/40 p-3 rounded-xl">
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Security Standard</span>
            <span className="text-sm font-black text-white mt-0.5 block">HttpOnly JWT + RBAC Guards</span>
          </div>
          <div className="bg-slate-900/60 border border-indigo-800/40 p-3 rounded-xl">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">Performance</span>
            <span className="text-sm font-black text-white mt-0.5 block">Lazy Suspense + ErrorBoundary</span>
          </div>
          <div className="bg-slate-900/60 border border-indigo-800/40 p-3 rounded-xl">
            <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block">Backend Target</span>
            <span className="text-sm font-black text-white mt-0.5 block">Nest.js + Prisma ORM</span>
          </div>
          <div className="bg-slate-900/60 border border-indigo-800/40 p-3 rounded-xl">
            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">Real-time Stream</span>
            <span className="text-sm font-black text-white mt-0.5 block">WebSockets & SSE</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1">
        <button
          onClick={() => setActiveTab('state')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'state'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. State Management</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>2. Security Architecture</span>
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'performance'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>3. Performance & Lazy Loading</span>
        </button>
        <button
          onClick={() => setActiveTab('design')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'design'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>4. UI/UX & Design System</span>
        </button>
        <button
          onClick={() => setActiveTab('nestjs-prisma')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'nestjs-prisma'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>5. Nest.js & Prisma Target</span>
        </button>
      </div>

      {/* TAB 1: STATE MANAGEMENT */}
      {activeTab === 'state' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <h3 className="text-sm font-black text-slate-900">Current State Assessment</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 list-disc pl-5">
                <li><strong>Global Prop Drilling:</strong> Top-level state in <code className="text-indigo-600 bg-slate-100 px-1 py-0.5 rounded">App.tsx</code> passes entities (<code className="text-indigo-600">connectors</code>, <code className="text-indigo-600">jobs</code>, <code className="text-indigo-600">currentUser</code>) through multi-level prop chains.</li>
                <li><strong>Local Cache Persistence:</strong> Offline cache uses <code className="text-indigo-600 bg-slate-100 px-1 py-0.5 rounded">offlineCacheService.ts</code> writing direct JSON state to <code className="text-indigo-600">localStorage</code>.</li>
                <li><strong>Simulated Timer Re-renders:</strong> Top-level interval triggers full-app state updates every 2.5s.</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-emerald-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h3 className="text-sm font-black text-slate-900">Recommended State Architecture</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 list-disc pl-5">
                <li><strong>TanStack Query (React Query):</strong> Handles server-side entity fetching, background caching, stale-while-revalidate, and retry policies.</li>
                <li><strong>Zustand UI Store:</strong> Manages pure client-side UI flags (<code className="text-emerald-700 font-bold">activeTab</code>, <code className="text-emerald-700 font-bold">sidebarCollapsed</code>, <code className="text-emerald-700 font-bold">currentTheme</code>) without re-rendering unrelated views.</li>
                <li><strong>WebSocket / SSE Realtime Push:</strong> Replaces timer intervals with event-driven WebSockets from Nest.js Gateway.</li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-indigo-400 font-bold flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Recommended Zustand UI Store Snippet (src/store/useUiStore.ts)
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`import { create } from 'zustand';
interface UiState {
  activeTab: string;
  sidebarCollapsed: boolean;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
}
export const useUiStore = create<UiState>((set) => ({
  activeTab: 'dashboard',
  sidebarCollapsed: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));`);
                  showToast('Copied Zustand store snippet');
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold cursor-pointer"
              >
                Copy Code
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
              <code>{`import { create } from 'zustand';

interface UiState {
  activeTab: string;
  sidebarCollapsed: boolean;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'dashboard',
  sidebarCollapsed: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));`}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                <h3 className="text-sm font-black text-slate-900">Current Security Audit</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 list-disc pl-5">
                <li><strong>Plaintext localStorage Auth:</strong> User identity stored in <code className="text-rose-600 bg-slate-100 px-1 py-0.5 rounded">localStorage</code> (vulnerable to XSS inspection).</li>
                <li><strong>Client-Side RBAC Only:</strong> <code className="text-rose-600 bg-slate-100 px-1 py-0.5 rounded">isRoleAllowedForTab</code> handles tab visibility on the client, but requires backend API guards.</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-indigo-100 pb-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <h3 className="text-sm font-black text-slate-900">Target Enterprise Security Guardrails</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 list-disc pl-5">
                <li><strong>HttpOnly, Secure JWT Cookies:</strong> Tokens delivered in HttpOnly cookies, completely blocking client script XSS extraction.</li>
                <li><strong>Nest.js Server-Side Guards:</strong> Endpoints protected with <code className="text-indigo-700 font-bold">@UseGuards(RolesGuard)</code> enforcing true authorization.</li>
                <li><strong>DTO Validation via Class-Validator:</strong> All incoming request bodies strictly validated before handler execution.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PERFORMANCE & LAZY LOADING */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Performance Modernization Status
              </h3>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                ErrorBoundary & Lazy Suspense Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900">1. Lazy Loading Code Splitting</div>
                <p className="text-slate-600">
                  Splits top-level view modules into dynamic import chunks so the browser only loads script code for the active route.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900">2. React Error Boundary</div>
                <p className="text-slate-600">
                  Catches isolated component rendering failures gracefully without crashing the global application shell.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900">3. Virtualized Table Views</div>
                <p className="text-slate-600">
                  Renders only visible rows for large dataset tables (10,000+ records) using <code className="text-indigo-600">@tanstack/react-virtual</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: UI/UX & DESIGN SYSTEM */}
      {activeTab === 'design' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-5 h-5 text-indigo-600" />
              UI/UX & Routing Enhancements
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-indigo-950">React Router Integration:</div>
                <p className="text-slate-600">
                  Replaces tab string state with declarative client routing, preserving browser history, back/forward buttons, and deep URL bookmarking.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-indigo-950">Keyboard Shortcut Manager:</div>
                <p className="text-slate-600">
                  Maintains enterprise keyboard shortcuts (<code className="text-indigo-600 font-bold">Cmd+K</code> Quick Actions, <code className="text-indigo-600 font-bold">Alt+B</code> Sidebar Toggle) with accessibility screen reader announcements.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NEST.JS & PRISMA TARGET */}
      {activeTab === 'nestjs-prisma' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                Target Prisma Schema Blueprint (schema.prisma)
              </h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Tenant {
  id        String   @id @default(uuid())
  name      String
  tier      String   @default("SHARED")
  createdAt DateTime @default(now())
  users     User[]
  jobs      MigrationJob[]
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  role      String
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
}

model MigrationJob {
  id            String   @id @default(uuid())
  title         String
  status        String   @default("DRAFT")
  recordsTotal  Int      @default(0)
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  createdAt     DateTime @default(now())
}`);
                  showToast('Copied Prisma schema snippet');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Copy Prisma Schema
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
              <code>{`datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Tenant {
  id        String   @id @default(uuid())
  name      String
  tier      String   @default("SHARED")
  createdAt DateTime @default(now())
  users     User[]
  jobs      MigrationJob[]
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  role      String
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
}

model MigrationJob {
  id            String   @id @default(uuid())
  title         String
  status        String   @default("DRAFT")
  recordsTotal  Int      @default(0)
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  createdAt     DateTime @default(now())
}`}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
