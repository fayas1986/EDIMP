import React, { useState } from 'react';
import { D3DependencyGraph } from './D3DependencyGraph';
import {
  DependencyNode,
  DependencyEdge,
  MigrationConflict,
  ConflictSeverity,
} from '../types';
import {
  Network,
  GitFork,
  AlertTriangle,
  CheckCircle2,
  Database,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Copy,
  Download,
  Layers,
  Zap,
  Sliders,
  X,
  Code,
  Info,
  SlidersHorizontal,
  Plus,
  Play,
  RotateCcw,
  Maximize2,
  ChevronRight,
  ShieldAlert,
  ListOrdered,
  FileCode,
  ShieldCheck,
  Share2,
} from 'lucide-react';

const SAMPLE_NODES: DependencyNode[] = [
  {
    id: 'node-cust',
    system: 'Source (D365/SAP)',
    tableName: 'Customer_Master',
    recordCount: 48250,
    primaryKey: 'Cust_ID',
    migrationOrder: 1,
    isOrphanRisk: false,
    fieldsCount: 38,
  },
  {
    id: 'node-vend',
    system: 'Source (D365/SAP)',
    tableName: 'Vendor_Master',
    recordCount: 12400,
    primaryKey: 'Vendor_No',
    migrationOrder: 1,
    isOrphanRisk: false,
    fieldsCount: 29,
  },
  {
    id: 'node-item',
    system: 'Source (D365/SAP)',
    tableName: 'Item_Catalog',
    recordCount: 185000,
    primaryKey: 'Item_SKU',
    migrationOrder: 1,
    isOrphanRisk: false,
    fieldsCount: 42,
  },
  {
    id: 'node-order-hdr',
    system: 'Source (D365/SAP)',
    tableName: 'Sales_Order_Header',
    recordCount: 1420000,
    primaryKey: 'Order_No',
    migrationOrder: 2,
    isOrphanRisk: true,
    fieldsCount: 54,
  },
  {
    id: 'node-order-line',
    system: 'Source (D365/SAP)',
    tableName: 'Sales_Order_Line',
    recordCount: 5800000,
    primaryKey: 'Order_Line_ID',
    migrationOrder: 3,
    isOrphanRisk: true,
    fieldsCount: 22,
  },
  {
    id: 'node-inv-hdr',
    system: 'Destination (S/4HANA/Salesforce)',
    tableName: 'Invoice_Header',
    recordCount: 1290000,
    primaryKey: 'Invoice_Doc_No',
    migrationOrder: 3,
    isOrphanRisk: false,
    fieldsCount: 48,
  },
  {
    id: 'node-pay-term',
    system: 'Destination (S/4HANA/Salesforce)',
    tableName: 'Payment_Terms',
    recordCount: 45,
    primaryKey: 'Term_Code',
    migrationOrder: 1,
    isOrphanRisk: false,
    fieldsCount: 8,
  },
  {
    id: 'node-crm-acc',
    system: 'Destination (S/4HANA/Salesforce)',
    tableName: 'Account_Master_CRM',
    recordCount: 52000,
    primaryKey: 'Account_ID',
    migrationOrder: 1,
    isOrphanRisk: false,
    fieldsCount: 64,
  },
];

const SAMPLE_EDGES: DependencyEdge[] = [
  {
    id: 'edge-1',
    sourceNodeId: 'node-cust',
    targetNodeId: 'node-order-hdr',
    foreignKey: 'Customer_No',
    referencedKey: 'Cust_ID',
    relationType: 'OneToMany',
    isMandatory: true,
    hasCircularDependency: false,
    hasCascadeRisk: false,
  },
  {
    id: 'edge-2',
    sourceNodeId: 'node-pay-term',
    targetNodeId: 'node-cust',
    foreignKey: 'Payment_Term_Code',
    referencedKey: 'Term_Code',
    relationType: 'OneToMany',
    isMandatory: false,
    hasCircularDependency: false,
    hasCascadeRisk: false,
  },
  {
    id: 'edge-3',
    sourceNodeId: 'node-order-hdr',
    targetNodeId: 'node-order-line',
    foreignKey: 'Header_Order_No',
    referencedKey: 'Order_No',
    relationType: 'OneToMany',
    isMandatory: true,
    hasCircularDependency: false,
    hasCascadeRisk: true,
  },
  {
    id: 'edge-4',
    sourceNodeId: 'node-item',
    targetNodeId: 'node-order-line',
    foreignKey: 'Item_SKU_Ref',
    referencedKey: 'Item_SKU',
    relationType: 'OneToMany',
    isMandatory: true,
    hasCircularDependency: false,
    hasCascadeRisk: false,
  },
  {
    id: 'edge-5',
    sourceNodeId: 'node-order-hdr',
    targetNodeId: 'node-inv-hdr',
    foreignKey: 'Ref_Order_No',
    referencedKey: 'Order_No',
    relationType: 'OneToOne',
    isMandatory: true,
    hasCircularDependency: true,
    hasCascadeRisk: true,
  },
  {
    id: 'edge-6',
    sourceNodeId: 'node-inv-hdr',
    targetNodeId: 'node-order-hdr',
    foreignKey: 'Source_Invoice_No',
    referencedKey: 'Invoice_Doc_No',
    relationType: 'OneToOne',
    isMandatory: false,
    hasCircularDependency: true,
    hasCascadeRisk: true,
  },
];

const INITIAL_CONFLICTS: MigrationConflict[] = [
  {
    id: 'conf-1',
    title: 'Circular FK Dependency Detected',
    severity: 'Critical',
    sourceTable: 'Sales_Order_Header',
    targetTable: 'Invoice_Header',
    conflictType: 'Circular Dependency Loop',
    description:
      'Sales_Order_Header references Invoice_Header via Ref_Invoice_No, while Invoice_Header references Sales_Order_Header via Source_Order_No. Direct insertion will fail without deferred FK constraints.',
    recommendedFix:
      'Defer FK Constraint enforcement on Invoice_Header during bulk load phase, or split into a 2-pass update migration.',
    autoFixAvailable: true,
    status: 'Detected',
  },
  {
    id: 'conf-2',
    title: 'Orphan Record Risk in Sales_Order_Line',
    severity: 'Warning',
    sourceTable: 'Sales_Order_Line',
    targetTable: 'Item_Catalog',
    conflictType: 'Orphan Record Risk (Missing Parent FK)',
    description:
      'Found 3,420 Order Line records referencing Item SKUs that no longer exist in legacy Item_Catalog. Direct load will breach FK integrity.',
    recommendedFix:
      'Synthesize dummy parent Item records ("UNMAPPED_LEGACY_SKU") in staging before loading Order Lines.',
    autoFixAvailable: true,
    status: 'Detected',
  },
  {
    id: 'conf-3',
    title: 'Composite Key Type Mismatch',
    severity: 'Info',
    sourceTable: 'Vendor_Master',
    targetTable: 'Account_Master_CRM',
    conflictType: 'Type Mismatch Across Boundary',
    description:
      'Source Vendor_No is INT64 while CRM Account_ID requires UUID string. Cross-system lookup required during mapping.',
    recommendedFix: 'Apply MD5/UUID hash generator transformation rule in Staging Lakehouse.',
    autoFixAvailable: true,
    status: 'Resolved',
  },
];

export const DataDependencyExplorerView: React.FC = () => {
  const [nodes] = useState<DependencyNode[]>(SAMPLE_NODES);
  const [edges] = useState<DependencyEdge[]>(SAMPLE_EDGES);
  const [conflicts, setConflicts] = useState<MigrationConflict[]>(INITIAL_CONFLICTS);
  const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(SAMPLE_NODES[0]);
  const [activeTab, setActiveTab] = useState<'graph' | 'topological' | 'conflicts' | 'dot'>('graph');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [systemFilter, setSystemFilter] = useState<string>('All');

  // DOT code generation
  const dotSyntax = `digraph ERP_CRM_Data_Dependencies {
  rankdir=LR;
  node [shape=rectangle, style="rounded,filled", fontname="Helvetica", fontSize=10];
  
  // Node Definitions
  subgraph cluster_Source {
    label = "Source ERP (D365/SAP)";
    style = dashed;
    color = "#3b82f6";
    "Customer_Master" [fillcolor="#dbeafe", color="#2563eb"];
    "Vendor_Master" [fillcolor="#dbeafe", color="#2563eb"];
    "Item_Catalog" [fillcolor="#dbeafe", color="#2563eb"];
    "Sales_Order_Header" [fillcolor="#dbeafe", color="#2563eb"];
    "Sales_Order_Line" [fillcolor="#dbeafe", color="#2563eb"];
  }

  subgraph cluster_Destination {
    label = "Destination Target (S/4HANA / Salesforce)";
    style = dashed;
    color = "#10b981";
    "Invoice_Header" [fillcolor="#d1fae5", color="#059669"];
    "Payment_Terms" [fillcolor="#d1fae5", color="#059669"];
    "Account_Master_CRM" [fillcolor="#d1fae5", color="#059669"];
  }

  // Edge Relationships
  "Customer_Master" -> "Sales_Order_Header" [label="Cust_ID (1:N)", color="#475569"];
  "Payment_Terms" -> "Customer_Master" [label="Term_Code (1:N)", color="#475569"];
  "Sales_Order_Header" -> "Sales_Order_Line" [label="Order_No (1:N)", color="#2563eb"];
  "Item_Catalog" -> "Sales_Order_Line" [label="Item_SKU (1:N)", color="#475569"];
  
  // Circular Dependency Boundary Risk
  "Sales_Order_Header" -> "Invoice_Header" [label="Ref_Order_No [LOOP]", color="#dc2626", penwidth=2, style=bold];
  "Invoice_Header" -> "Sales_Order_Header" [label="Source_Inv_No [LOOP]", color="#dc2626", penwidth=2, style=bold];
}`;

  const [copiedDot, setCopiedDot] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);

  const handleCopyDot = () => {
    navigator.clipboard.writeText(dotSyntax);
    setCopiedDot(true);
    setTimeout(() => setCopiedDot(false), 2000);
  };

  const handleRunConflictScan = () => {
    setIsDetecting(true);
    setDetectionMessage(null);

    setTimeout(() => {
      setIsDetecting(false);
      setDetectionMessage(
        'Graphviz Dependency Analyzer completed! Discovered 1 Circular FK Loop, 1 Orphan Risk path, and 3 level execution hierarchy.'
      );
    }, 1100);
  };

  const handleResolveConflict = (id: string) => {
    setConflicts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'Resolved' } : c))
    );
  };

  const filteredNodes = nodes.filter((n) => {
    const matchesSystem = systemFilter === 'All' || n.system.includes(systemFilter);
    const matchesSearch =
      n.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.primaryKey.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSystem && matchesSearch;
  });

  // Calculate topological load levels
  const level1Nodes = nodes.filter((n) => n.migrationOrder === 1);
  const level2Nodes = nodes.filter((n) => n.migrationOrder === 2);
  const level3Nodes = nodes.filter((n) => n.migrationOrder === 3);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Network className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Cross-System Data Dependency Explorer
            </h1>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold font-mono rounded-full flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5" />
              Graphviz Engine Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Graphviz-inspired interactive visualization mapping inter-table dependencies, foreign keys, topological load ordering, and pre-migration conflict detection across source and destination ERP/CRM systems.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRunConflictScan}
            disabled={isDetecting}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-all"
          >
            <Sparkles className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Scanning Graph...' : 'Analyze FK Conflicts'}</span>
          </button>

          <button
            onClick={() => setActiveTab('dot')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <Code className="w-4 h-4" />
            <span>Graphviz DOT Spec</span>
          </button>
        </div>
      </div>

      {detectionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{detectionMessage}</span>
          </div>
          <button
            onClick={() => setDetectionMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>System Entity Nodes</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{nodes.length}</span>
            <span className="text-[11px] text-slate-500 font-mono">Tables</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Across Source & Target ERPs</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Foreign Key Links</span>
            <GitFork className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{edges.length}</span>
            <span className="text-[11px] text-emerald-600 font-mono font-semibold">100% Validated</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Inter-table relationships</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Circular Loop Risk</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 font-mono">1</span>
            <span className="text-[11px] text-rose-600 font-semibold font-mono">Requires Action</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Order_Header ↔ Invoice_Header</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Topological Load Depth</span>
            <ListOrdered className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">3 Phases</span>
            <span className="text-[11px] text-indigo-600 font-mono">Level 1 → 3</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Prevents FK Insert Violations</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'graph'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Interactive Dependency Canvas</span>
          </button>

          <button
            onClick={() => setActiveTab('topological')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'topological'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Topological Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'conflicts'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Conflicts ({conflicts.filter((c) => c.status === 'Detected').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dot')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'dot'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>DOT Spec</span>
          </button>
        </div>

        {/* Real-time Search and System Filter */}
        <div className="flex items-center gap-3">
          <div className="relative group min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search tables or PKs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            {['All', 'Source', 'Destination'].map((sys) => (
              <button
                key={sys}
                onClick={() => setSystemFilter(sys)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  systemFilter === sys
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {sys}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE GRAPH CANVAS */}
      {activeTab === 'graph' && (
        <D3DependencyGraph 
          searchQuery={searchQuery}
          systemFilter={systemFilter}
        />
      )}

      {/* TAB 2: TOPOLOGICAL LOAD ORDER MATRIX */}
      {activeTab === 'topological' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Topological Migration Load Execution Phases</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Determined by Topological Sort on the directed acyclic graph (DAG). Loading tables in this exact order guarantees zero foreign key constraint errors during bulk insertion.
            </p>
          </div>

          <div className="space-y-4">
            {/* Phase 1 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-xs font-bold text-slate-900">
                    Phase 1: Master Reference Entities (Zero FK Dependencies)
                  </h3>
                </div>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Load First
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                {level1Nodes.map((n) => (
                  <div key={n.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="font-bold text-slate-900">{n.tableName}</div>
                    <div className="text-[11px] text-slate-500 mt-1">PK: {n.primaryKey}</div>
                    <div className="text-[10px] text-indigo-600 font-bold mt-2">
                      {n.recordCount.toLocaleString()} Records
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 2 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-xs font-bold text-slate-900">
                    Phase 2: Parent Document Headers (Requires Phase 1 PKs)
                  </h3>
                </div>
                <span className="text-xs text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  Load Second
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                {level2Nodes.map((n) => (
                  <div key={n.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="font-bold text-slate-900">{n.tableName}</div>
                    <div className="text-[11px] text-slate-500 mt-1">PK: {n.primaryKey}</div>
                    <div className="text-[10px] text-indigo-600 font-bold mt-2">
                      {n.recordCount.toLocaleString()} Records
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 3 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h3 className="text-xs font-bold text-slate-900">
                    Phase 3: Transaction Line Details & Cross-Boundary Targets
                  </h3>
                </div>
                <span className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Load Third
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                {level3Nodes.map((n) => (
                  <div key={n.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="font-bold text-slate-900">{n.tableName}</div>
                    <div className="text-[11px] text-slate-500 mt-1">PK: {n.primaryKey}</div>
                    <div className="text-[10px] text-indigo-600 font-bold mt-2">
                      {n.recordCount.toLocaleString()} Records
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MIGRATION CONFLICTS */}
      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pre-Migration Conflict Resolver</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically identified foreign key loops, missing parent dependencies, and composite key mismatches.
              </p>
            </div>

            <button
              onClick={handleRunConflictScan}
              disabled={isDetecting}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>Re-scan Topology</span>
            </button>
          </div>

          <div className="space-y-3">
            {conflicts.map((c) => (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        c.severity === 'Critical'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : c.severity === 'Warning'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {c.severity}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{c.title}</h3>
                    <span className="text-[11px] font-mono text-slate-500">
                      ({c.sourceTable} → {c.targetTable})
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>

                  <div className="text-xs font-mono text-indigo-700 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 mt-2">
                    <span className="font-bold text-indigo-900 block font-sans">Recommended Solution:</span>
                    {c.recommendedFix}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {c.status === 'Resolved' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" /> Conflict Resolved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleResolveConflict(c.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Apply Auto-Fix</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GRAPHVIZ DOT SPEC EXPORT */}
      {activeTab === 'dot' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Graphviz DOT Language Specification</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard DOT format compatible with Graphviz, PlantUML, and D2 visualization toolchains.
              </p>
            </div>

            <button
              onClick={handleCopyDot}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all"
            >
              {copiedDot ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedDot ? 'Copied to Clipboard!' : 'Copy DOT Spec'}</span>
            </button>
          </div>

          <div className="bg-slate-950 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto">
            <pre>{dotSyntax}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
