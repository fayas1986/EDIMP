import React, { useState } from 'react';
import {
  GitFork,
  Database,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Network,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Cpu,
  Share2,
  Sliders,
  Search,
  Info,
  Filter,
  Check,
  RefreshCw,
  Code,
  Maximize2,
  Activity,
  Key,
  ShieldAlert,
  Server,
  Cloud
} from 'lucide-react';

export interface ConnectorNode {
  id: string;
  name: string;
  type: 'SAP HANA / ECC' | 'Oracle Financials ERP' | 'PostgreSQL DB' | 'Salesforce CRM' | 'Kafka Event Hub';
  hostUri: string;
  authMethod: 'OAuth 2.0 / Mutual TLS' | 'Kerberos Keytab' | 'Service Principal KMS';
  healthStatus: 'Connected' | 'Degraded' | 'Idle';
  latencyMs: number;
  activeTables: string[];
}

export interface TransformationRuleNode {
  id: string;
  name: string;
  category: 'Anonymization' | 'Type Casting' | 'Data Cleaning' | 'Currency Conversion' | 'Validation';
  algorithm: string;
  inputFields: string[];
  outputFields: string[];
  status: 'Active' | 'Bypassed';
}

export interface OutputSchemaNode {
  id: string;
  entityName: string;
  fileName: string;
  format: string;
  destinationType: string;
  destinationUri: string;
  totalFieldsCount: number;
  encryption: string;
}

export interface ExportDependencyGraph {
  id: string;
  configName: string;
  category: string;
  description: string;
  connectors: ConnectorNode[];
  transformationRules: TransformationRuleNode[];
  outputSchemas: OutputSchemaNode[];
}

export const MOCK_DEPENDENCY_GRAPHS: ExportDependencyGraph[] = [
  {
    id: 'sch-101',
    configName: 'Daily Parquet Data Lake Sync',
    category: 'Snapshot Feed',
    description: 'Lineage mapping for daily SAP ECC Customer Master & Sales Area sync to S3 Data Lake.',
    connectors: [
      {
        id: 'conn-sap-ecc',
        name: 'SAP ECC 6.0 Enterprise Connector',
        type: 'SAP HANA / ECC',
        hostUri: 'sap-prod-cluster.enterprise.internal:3200',
        authMethod: 'Kerberos Keytab',
        healthStatus: 'Connected',
        latencyMs: 14,
        activeTables: ['KNA1 (Customer Master)', 'VBAK (Sales Orders)', 'VBAP (Order Items)'],
      },
      {
        id: 'conn-pg-meta',
        name: 'Global Tenant Metadata Postgres',
        type: 'PostgreSQL DB',
        hostUri: 'tenant-meta-db.cloud.internal:5432',
        authMethod: 'Service Principal KMS',
        healthStatus: 'Connected',
        latencyMs: 8,
        activeTables: ['tenant_subscriptions', 'region_mappings'],
      },
    ],
    transformationRules: [
      {
        id: 'rule-pii-hash',
        name: 'SHA-256 Salted Tax ID Hashing',
        category: 'Anonymization',
        algorithm: 'CryptoJS.SHA256(val + SALT_V2)',
        inputFields: ['STCEG (Tax ID)'],
        outputFields: ['tax_identifier_hash'],
        status: 'Active',
      },
      {
        id: 'rule-[email-mask]',
        name: 'Contact Email Local Part Masker',
        category: 'Anonymization',
        algorithm: 'Regex Replace Local User -> c****@domain.com',
        inputFields: ['SMTP_ADDR (Email)'],
        outputFields: ['contact_email_masked'],
        status: 'Active',
      },
      {
        id: 'rule-eur-usd',
        name: 'FX EUR to USD Currency Conversion',
        category: 'Currency Conversion',
        algorithm: 'EUR * 1.0850 (Spot Rate Sync)',
        inputFields: ['UMSAT (Revenue EUR)'],
        outputFields: ['annual_revenue_usd'],
        status: 'Active',
      },
      {
        id: 'rule-clean-text',
        name: 'TitleCase & Strip Special Chars',
        category: 'Data Cleaning',
        algorithm: 'Normalize Unicode & Trim',
        inputFields: ['NAME1 (Customer Name)', 'STRAS (Street)'],
        outputFields: ['customer_name', 'street_address'],
        status: 'Active',
      },
      {
        id: 'rule-date-utc',
        name: 'ISO-8601 UTC Date Formatting',
        category: 'Type Casting',
        algorithm: 'Date.toISOString()',
        inputFields: ['ERDAT (Created Date)', 'AUDAT (Order Date)'],
        outputFields: ['created_date_utc', 'order_date_utc'],
        status: 'Active',
      },
    ],
    outputSchemas: [
      {
        id: 'out-cust-parquet',
        entityName: 'Customer Master (KNA1)',
        fileName: 'customer_account_master.parquet',
        format: 'Parquet (Snappy)',
        destinationType: 'AWS S3',
        destinationUri: 's3://enterprise-data-lake-prod/snapshots/daily/customers/',
        totalFieldsCount: 10,
        encryption: 'AES-256 KMS',
      },
      {
        id: 'out-sales-parquet',
        entityName: 'SAP Sales Orders (VBAK)',
        fileName: 'sales_orders_header.parquet',
        format: 'Parquet (Snappy)',
        destinationType: 'AWS S3',
        destinationUri: 's3://enterprise-data-lake-prod/snapshots/daily/sales/',
        totalFieldsCount: 5,
        encryption: 'AES-256 KMS',
      },
    ],
  },
  {
    id: 'sch-102',
    configName: 'Weekly Cleansed Audit Feed',
    category: 'Snapshot Feed',
    description: 'Lineage mapping for audit validation error records feed to Google Cloud Storage.',
    connectors: [
      {
        id: 'conn-sfc-crm',
        name: 'Salesforce CRM API Connector',
        type: 'Salesforce CRM',
        hostUri: 'enterprise-prod.my.salesforce.com',
        authMethod: 'OAuth 2.0 / Mutual TLS',
        healthStatus: 'Connected',
        latencyMs: 32,
        activeTables: ['STAGE_VAL.ERR_LOG'],
      },
    ],
    transformationRules: [
      {
        id: 'rule-hmac-tok',
        name: 'HMAC Salted Tokenizer for Failed Values',
        category: 'Anonymization',
        algorithm: 'HMAC-SHA512(val, KEY)',
        inputFields: ['ORIG_VAL (Original Failed Value)'],
        outputFields: ['original_failed_value'],
        status: 'Active',
      },
      {
        id: 'rule-enum-cat',
        name: 'Error Category Enum Mapper',
        category: 'Validation',
        algorithm: 'Standard Error Mapping Lookup',
        inputFields: ['ERR_CAT'],
        outputFields: ['error_category'],
        status: 'Active',
      },
    ],
    outputSchemas: [
      {
        id: 'out-err-zip',
        entityName: 'Quarantined Error Records',
        fileName: 'audit_validation_exceptions.zip.csv',
        format: 'CSV (Zip Compressed)',
        destinationType: 'Google Cloud Storage',
        destinationUri: 'gs://edimp-migration-audit-bucket/weekly-zip/',
        totalFieldsCount: 6,
        encryption: 'Standard TLS + KMS',
      },
    ],
  },
  {
    id: 'sch-103',
    configName: 'Monthly Finance Ledger Snapshot',
    category: 'Snapshot Feed',
    description: 'Lineage mapping for Oracle Financial GL balances to Azure Blob Storage.',
    connectors: [
      {
        id: 'conn-orc-erp',
        name: 'Oracle Financials ERP Connector',
        type: 'Oracle Financials ERP',
        hostUri: 'oracle-fin.enterprise.internal:1521',
        authMethod: 'Service Principal KMS',
        healthStatus: 'Connected',
        latencyMs: 19,
        activeTables: ['FIN_STAGE.GL_BAL'],
      },
    ],
    transformationRules: [
      {
        id: 'rule-zero-pad',
        name: 'Zero-Pad 10 Digits Account Number',
        category: 'Data Cleaning',
        algorithm: 'String.prototype.padStart(10, "0")',
        inputFields: ['ACC_NUM'],
        outputFields: ['gl_account_number'],
        status: 'Active',
      },
      {
        id: 'rule-[round-dec]',
        name: 'Monetary Round 4 Decimals',
        category: 'Type Casting',
        algorithm: 'Math.round(val * 10000) / 10000',
        inputFields: ['BAL_AMT'],
        outputFields: ['balance_amount_usd'],
        status: 'Active',
      },
    ],
    outputSchemas: [
      {
        id: 'out-gl-zstd',
        entityName: 'GL Balances (GL_BALANCES)',
        fileName: 'monthly_ledger_snapshot.zstd.parquet',
        format: 'Parquet (ZSTD)',
        destinationType: 'Azure Blob Storage',
        destinationUri: 'azure://financesnapshots.blob.core.windows.net/monthly-ledger/',
        totalFieldsCount: 4,
        encryption: 'PGP Key Encryption',
      },
    ],
  },
];

interface ExportDependencyMapperToolProps {
  initialConfigId?: string;
  onClose?: () => void;
}

export const ExportDependencyMapperTool: React.FC<ExportDependencyMapperToolProps> = ({
  initialConfigId,
  onClose,
}) => {
  const [selectedGraphId, setSelectedGraphId] = useState<string>(
    initialConfigId || MOCK_DEPENDENCY_GRAPHS[0].id
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewLayoutMode, setViewLayoutMode] = useState<'lineage' | 'tree' | 'impact'>('lineage');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const activeGraph =
    MOCK_DEPENDENCY_GRAPHS.find((g) => g.id === selectedGraphId) || MOCK_DEPENDENCY_GRAPHS[0];

  // Selected Node Metadata Finder
  const selectedConnector = activeGraph.connectors.find((c) => c.id === selectedNodeId);
  const selectedRule = activeGraph.transformationRules.find((r) => r.id === selectedNodeId);
  const selectedOutput = activeGraph.outputSchemas.find((o) => o.id === selectedNodeId);

  // Calculate Metrics
  const totalConnectors = activeGraph.connectors.length;
  const totalRules = activeGraph.transformationRules.length;
  const totalOutputs = activeGraph.outputSchemas.length;
  const anonymizationRulesCount = activeGraph.transformationRules.filter(
    (r) => r.category === 'Anonymization'
  ).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5 text-blue-600" /> Data Lineage Mapper
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold rounded-full">
              Connector-to-Schema Topology
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600" /> Export Configuration Lineage &amp; Dependency Mapper
          </h2>

          <p className="text-slate-500 text-xs max-w-3xl">
            Visualize the end-to-end data pipeline flow for export configurations—tracing source system connectors, transformation rules, and target file output schemas.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all self-start md:self-auto"
          >
            Close Mapper
          </button>
        )}
      </div>

      {/* Selector & View Mode Toolbar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-blue-600" /> Select Target Export Schedule Configuration:
            </label>

            <select
              value={selectedGraphId}
              onChange={(e) => {
                setSelectedGraphId(e.target.value);
                setSelectedNodeId(null);
              }}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[300px]"
            >
              {MOCK_DEPENDENCY_GRAPHS.map((graph) => (
                <option key={graph.id} value={graph.id}>
                  {graph.configName} ({graph.category})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Layout Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 font-mono">View Mode:</span>
            <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setViewLayoutMode('lineage')}
                className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1 ${
                  viewLayoutMode === 'lineage'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Lineage Flow</span>
              </button>

              <button
                type="button"
                onClick={() => setViewLayoutMode('tree')}
                className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1 ${
                  viewLayoutMode === 'tree'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Tree Hierarchy</span>
              </button>

              <button
                type="button"
                onClick={() => setViewLayoutMode('impact')}
                className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1 ${
                  viewLayoutMode === 'impact'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Impact Matrix</span>
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Summary Description */}
        <p className="text-xs text-slate-600 border-t border-slate-200/80 pt-2 font-medium">
          {activeGraph.description}
        </p>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-0.5">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase font-mono">
            <span>Linked Connectors</span>
            <Server className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{totalConnectors}</div>
          <p className="text-[10px] text-slate-500">Source DB &amp; ERP integrations</p>
        </div>

        <div className="bg-indigo-50/60 border border-indigo-200 p-3 rounded-xl space-y-0.5">
          <div className="flex items-center justify-between text-indigo-800 text-[11px] font-bold uppercase font-mono">
            <span>Active Pipeline Rules</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900 font-mono">{totalRules}</div>
          <p className="text-[10px] text-indigo-700">Type casting, hashing &amp; FX</p>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl space-y-0.5">
          <div className="flex items-center justify-between text-amber-800 text-[11px] font-bold uppercase font-mono">
            <span>PII Anonymizers</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">{anonymizationRulesCount}</div>
          <p className="text-[10px] text-amber-700">SHA-256 &amp; HMAC tokenizers</p>
        </div>

        <div className="bg-purple-50/60 border border-purple-200 p-3 rounded-xl space-y-0.5">
          <div className="flex items-center justify-between text-purple-800 text-[11px] font-bold uppercase font-mono">
            <span>Output Target Files</span>
            <Cloud className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900 font-mono">{totalOutputs}</div>
          <p className="text-[10px] text-purple-700">Parquet &amp; Zip Datasets</p>
        </div>
      </div>

      {/* LINEAGE VISUALIZATION GRAPH CANVAS */}
      {viewLayoutMode === 'lineage' && (
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-6 text-slate-800 space-y-6 overflow-x-auto shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono border-b border-slate-200 pb-3">
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <Activity className="w-4 h-4 text-blue-600" /> Click any node to inspect detailed parameters &amp; dependencies
            </span>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 text-xs shadow-3xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pipeline Topology Verified
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-[800px] relative">
            {/* LAYER 1: SOURCE CONNECTORS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-2">
                <span className="flex items-center gap-1 text-slate-800">
                  <Database className="w-3.5 h-3.5 text-blue-600" /> 1. Source Connectors
                </span>
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px]">
                  {activeGraph.connectors.length}
                </span>
              </div>

              <div className="space-y-3">
                {activeGraph.connectors.map((c) => {
                  const isSelected = selectedNodeId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedNodeId(c.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-blue-100/70 border border-blue-200 text-blue-800 rounded text-[10px] font-mono font-bold">
                          {c.type}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {c.latencyMs}ms
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 mt-2">{c.name}</h4>
                      <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">{c.hostUri}</p>

                      <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                        <span>Auth: {c.authMethod}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LAYER 2: TRANSFORMATION RULES */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-2">
                <span className="flex items-center gap-1 text-slate-800">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" /> 2. Transformation Pipeline
                </span>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px]">
                  {activeGraph.transformationRules.length} Rules
                </span>
              </div>

              <div className="space-y-3">
                {activeGraph.transformationRules.map((r) => {
                  const isSelected = selectedNodeId === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedNodeId(r.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 border rounded text-[10px] font-mono font-bold ${
                            r.category === 'Anonymization'
                              ? 'bg-amber-100/80 border-amber-200 text-amber-800'
                              : 'bg-indigo-100/70 border-indigo-200 text-indigo-800'
                          }`}
                        >
                          {r.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-medium">Active</span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 mt-1.5">{r.name}</h4>
                      <div className="text-[10px] font-mono text-indigo-900 mt-1 bg-slate-100/80 p-1.5 rounded border border-slate-200 truncate font-semibold">
                        {r.algorithm}
                      </div>

                      <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                        <span className="truncate max-w-[180px]">{r.inputFields.join(', ')}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LAYER 3: OUTPUT SCHEMAS & DESTINATIONS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-2">
                <span className="flex items-center gap-1 text-slate-800">
                  <Cloud className="w-3.5 h-3.5 text-purple-600" /> 3. Target Output Schemas
                </span>
                <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px]">
                  {activeGraph.outputSchemas.length} Target Files
                </span>
              </div>

              <div className="space-y-3">
                {activeGraph.outputSchemas.map((o) => {
                  const isSelected = selectedNodeId === o.id;
                  return (
                    <div
                      key={o.id}
                      onClick={() => setSelectedNodeId(o.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-50/90 border-purple-500 ring-2 ring-purple-500/30 shadow-md'
                          : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-purple-100/70 border border-purple-200 text-purple-800 rounded text-[10px] font-mono font-bold">
                          {o.destinationType}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold">
                          {o.format}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 mt-2">{o.entityName}</h4>
                      <p className="text-[11px] font-mono text-purple-800 truncate mt-0.5 font-semibold">{o.fileName}</p>

                      <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                        <span>Fields: {o.totalFieldsCount} Columns</span>
                        <span className="text-slate-600 font-semibold">🔒 {o.encryption}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TREE HIERARCHY VIEW */}
      {viewLayoutMode === 'tree' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <GitFork className="w-4 h-4 text-blue-600" /> Pipeline Dependency Hierarchy Tree
          </h3>

          <div className="space-y-3 font-mono text-xs">
            {activeGraph.connectors.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>CONNECTOR: {c.name}</span>
                  <span className="text-[10px] text-slate-400">({c.hostUri})</span>
                </div>

                <div className="pl-6 space-y-2 border-l-2 border-blue-200">
                  <div className="text-slate-500 text-[11px] font-sans font-bold">Linked Transformation Rules:</div>
                  {activeGraph.transformationRules.map((r) => (
                    <div key={r.id} className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="text-indigo-800 font-bold">⚡ {r.name}</span>
                      <span className="text-slate-500 text-[10px]">Algorithm: {r.algorithm}</span>
                    </div>
                  ))}

                  <div className="text-slate-500 text-[11px] font-sans font-bold pt-2">Target Output Schemas:</div>
                  {activeGraph.outputSchemas.map((o) => (
                    <div key={o.id} className="bg-purple-50 p-2 rounded-lg border border-purple-200 flex items-center justify-between">
                      <span className="text-purple-900 font-bold">📄 {o.entityName} ({o.fileName})</span>
                      <span className="text-purple-700 text-[10px]">{o.destinationType} • {o.format}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IMPACT MATRIX VIEW */}
      {viewLayoutMode === 'impact' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" /> Dependency Impact &amp; Resiliency Matrix
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-mono text-[11px] uppercase font-bold text-slate-600">
                  <th className="p-3">Source Connector</th>
                  <th className="p-3">Connector Health</th>
                  <th className="p-3">Dependent Transformation Rules</th>
                  <th className="p-3">Target Output Files</th>
                  <th className="p-3">Outage Risk Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {activeGraph.connectors.map((c) => (
                  <tr key={c.id} className="hover:bg-white transition-colors">
                    <td className="p-3 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        {c.healthStatus} ({c.latencyMs}ms)
                      </span>
                    </td>
                    <td className="p-3 text-indigo-700 font-bold">{totalRules} Active Rules</td>
                    <td className="p-3 text-purple-700 font-bold">{totalOutputs} Output Files</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                        Low (Redundant Connections)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED NODE INSPECTOR CARD */}
      {selectedNodeId && (selectedConnector || selectedRule || selectedOutput) && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-blue-200 pb-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-sm text-blue-950">
                Selected Lineage Node Inspector: {selectedConnector?.name || selectedRule?.name || selectedOutput?.entityName}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNodeId(null)}
              className="text-xs text-blue-700 hover:text-blue-900 font-bold cursor-pointer"
            >
              Clear Selection
            </button>
          </div>

          {selectedConnector && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Host URI:</span>
                <strong className="text-slate-900">{selectedConnector.hostUri}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Auth Method:</span>
                <strong className="text-slate-900">{selectedConnector.authMethod}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Active Tables:</span>
                <strong className="text-slate-900">{selectedConnector.activeTables.join(', ')}</strong>
              </div>
            </div>
          )}

          {selectedRule && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Category:</span>
                <strong className="text-slate-900">{selectedRule.category}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Algorithm Spec:</span>
                <strong className="text-indigo-700">{selectedRule.algorithm}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Field Mapping Target:</span>
                <strong className="text-slate-900">
                  {selectedRule.inputFields.join(', ')} → {selectedRule.outputFields.join(', ')}
                </strong>
              </div>
            </div>
          )}

          {selectedOutput && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Output File:</span>
                <strong className="text-purple-700">{selectedOutput.fileName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Destination URI:</span>
                <strong className="text-slate-900">{selectedOutput.destinationUri}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Format &amp; Security:</span>
                <strong className="text-slate-900">{selectedOutput.format} | 🔒 {selectedOutput.encryption}</strong>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
