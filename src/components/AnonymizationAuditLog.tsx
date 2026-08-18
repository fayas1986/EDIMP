import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnonymizationAuditLogEntry, PIICategory } from '../types';
import { OverflowTableWrapper } from './OverflowTableWrapper';
import {
  ShieldCheck,
  Search,
  ArrowRight,
  Filter,
  Download,
  Zap,
  Clock,
  Database,
  Server,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
  Lock,
  KeyRound,
  X,
  FileSpreadsheet,
  Activity,
  SlidersHorizontal,
  Info,
} from 'lucide-react';

const INITIAL_AUDIT_LOGS: AnonymizationAuditLogEntry[] = [
  {
    id: 'aud-8901',
    timestamp: '2026-08-12 02:11:04',
    connectorId: 'conn-bc-prod',
    connectorName: 'Dynamics 365 Business Central (Prod)',
    targetProvider: 'Dynamics 365 BC',
    entityName: 'Customer_Master (Table 18)',
    recordId: 'CUST-90412',
    fieldName: 'email_address',
    originalValue: 'g.montgomery@enterprise.org',
    anonymizedValue: 'g.m********@enterprise.org',
    technique: 'PartialMask',
    piiCategory: 'Email',
    status: 'Success',
    executionTimeMs: 0.42,
    complianceTags: ['GDPR', 'CCPA'],
    saltOrMaskDetail: 'MaskChar: *, Preserved Domain: enterprise.org',
  },
  {
    id: 'aud-8902',
    timestamp: '2026-08-12 02:10:58',
    connectorId: 'conn-bc-prod',
    connectorName: 'Dynamics 365 Business Central (Prod)',
    targetProvider: 'Dynamics 365 BC',
    entityName: 'Customer_Master (Table 18)',
    recordId: 'CUST-90412',
    fieldName: 'social_security_num',
    originalValue: '987-12-4091',
    anonymizedValue: 'sha256=e9b2f7a102c9840d1a58e9204c00...',
    technique: 'SHA256_Salted',
    piiCategory: 'SSN/Tax',
    status: 'Success',
    executionTimeMs: 0.78,
    complianceTags: ['GDPR', 'HIPAA', 'CCPA'],
    saltOrMaskDetail: 'SaltKey: e9b2_prod_salt_2026',
  },
  {
    id: 'aud-8903',
    timestamp: '2026-08-12 02:09:42',
    connectorId: 'conn-sfdc-main',
    connectorName: 'Salesforce Enterprise CRM',
    targetProvider: 'Salesforce',
    entityName: 'Account_Object',
    recordId: 'ACC-44910',
    fieldName: 'Billing_Email__c',
    originalValue: '4532-8901-2384-9128',
    anonymizedValue: 'TKN-FPE-4532-8901-XXXX-9128',
    technique: 'FormatPreservingToken',
    piiCategory: 'CreditCard',
    status: 'Success',
    executionTimeMs: 0.55,
    complianceTags: ['PCI-DSS'],
    saltOrMaskDetail: 'FF1 Cipher Mode, Length Preserved',
  },
  {
    id: 'aud-8904',
    timestamp: '2026-08-12 02:08:15',
    connectorId: 'conn-sap-s4',
    connectorName: 'SAP S/4HANA Cloud Engine',
    targetProvider: 'SAP S/4HANA',
    entityName: 'KNA1_Customer_Master',
    recordId: 'KNA1-0082',
    fieldName: 'SMTP_ADDR',
    originalValue: 'a.schmidt@berlin-tech.de',
    anonymizedValue: 'a.s******@berlin-tech.de',
    technique: 'PartialMask',
    piiCategory: 'Email',
    status: 'Success',
    executionTimeMs: 0.38,
    complianceTags: ['GDPR', 'CCPA'],
    saltOrMaskDetail: 'MaskChar: *, Domain preserved',
  },
  {
    id: 'aud-8905',
    timestamp: '2026-08-12 02:07:30',
    connectorId: 'conn-sql-legacy',
    connectorName: 'SQL Server - Legacy ERP DB',
    targetProvider: 'SQL Server',
    entityName: 'Employee_Payroll',
    recordId: 'EMP-7712',
    fieldName: 'annual_salary',
    originalValue: '$142,500',
    anonymizedValue: '$140,000 - $150,000 Range',
    technique: 'GeneralizationBucket',
    piiCategory: 'Financial',
    status: 'Success',
    executionTimeMs: 0.61,
    complianceTags: ['GDPR'],
    saltOrMaskDetail: 'Bucket size: $10,000 intervals',
  },
  {
    id: 'aud-8906',
    timestamp: '2026-08-12 02:06:11',
    connectorId: 'conn-custom-rest',
    connectorName: 'Legacy HRMS REST API Endpoint',
    targetProvider: 'REST API',
    entityName: 'Employee_Payroll',
    recordId: 'HR-3392',
    fieldName: 'iban_bank_account',
    originalValue: 'DE89370400440532013000',
    anonymizedValue: 'HMAC-TKN-DE89XXXX3000',
    technique: 'HMAC_Tokenization',
    piiCategory: 'Financial',
    status: 'Success',
    executionTimeMs: 0.89,
    complianceTags: ['GDPR', 'PCI-DSS'],
    saltOrMaskDetail: 'Vault Key: hrms_vault_key_secret',
  },
  {
    id: 'aud-8907',
    timestamp: '2026-08-12 02:05:01',
    connectorId: 'conn-postgres-warehouse',
    connectorName: 'PostgreSQL Staging Warehouse',
    targetProvider: 'PostgreSQL',
    entityName: 'Patient_Records',
    recordId: 'PAT-88102',
    fieldName: 'medical_diagnosis_notes',
    originalValue: 'Patient reports mild seasonal allergy symptoms',
    anonymizedValue: '[REDACTED / NULLIFIED FOR HIPAA]',
    technique: 'Nullification',
    piiCategory: 'Health',
    status: 'Success',
    executionTimeMs: 0.31,
    complianceTags: ['HIPAA'],
    saltOrMaskDetail: 'Full Nullification',
  },
  {
    id: 'aud-8908',
    timestamp: '2026-08-12 02:03:45',
    connectorId: 'conn-postgres-warehouse',
    connectorName: 'PostgreSQL Staging Warehouse',
    targetProvider: 'PostgreSQL',
    entityName: 'Patient_Records',
    recordId: 'PAT-88102',
    fieldName: 'contact_phone',
    originalValue: '+1 (555) 234-5678',
    anonymizedValue: '+1 (555) 981-0249 (Synthetic)',
    technique: 'SyntheticData',
    piiCategory: 'Phone',
    status: 'Success',
    executionTimeMs: 0.72,
    complianceTags: ['HIPAA', 'GDPR'],
    saltOrMaskDetail: 'Generator: FakerPhone',
  },
  {
    id: 'aud-8909',
    timestamp: '2026-08-12 02:01:22',
    connectorId: 'conn-bc-prod',
    connectorName: 'Dynamics 365 Business Central (Prod)',
    targetProvider: 'Dynamics 365 BC',
    entityName: 'Customer_Master (Table 18)',
    recordId: 'CUST-90415',
    fieldName: 'full_name',
    originalValue: 'Arthur Pendelton',
    anonymizedValue: 'Arthur P. (Synthetic Replacement)',
    technique: 'SyntheticData',
    piiCategory: 'PersonalName',
    status: 'Success',
    executionTimeMs: 0.65,
    complianceTags: ['GDPR', 'CCPA'],
    saltOrMaskDetail: 'Generator: FakerName',
  },
  {
    id: 'aud-8910',
    timestamp: '2026-08-12 01:58:10',
    connectorId: 'conn-sfdc-main',
    connectorName: 'Salesforce Enterprise CRM',
    targetProvider: 'Salesforce',
    entityName: 'Contact_PII',
    recordId: 'CNT-1092',
    fieldName: 'Tax_Exempt_ID__c',
    originalValue: 'TX-990-21841',
    anonymizedValue: 'hmac_sha256=a10b9918c0...',
    technique: 'SHA256_Salted',
    piiCategory: 'SSN/Tax',
    status: 'Success',
    executionTimeMs: 0.81,
    complianceTags: ['CCPA', 'PCI-DSS'],
    saltOrMaskDetail: 'SaltKey: sfdc_crm_salt_key_2026',
  },
];

export const AnonymizationAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AnonymizationAuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedConnector, setSelectedConnector] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTechnique, setSelectedTechnique] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Detail Modal
  const [inspectEntry, setInspectEntry] = useState<AnonymizationAuditLogEntry | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showOriginalSecret, setShowOriginalSecret] = useState<boolean>(false);

  // New Event Highlight ID
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    const matchesConnector = selectedConnector === 'All' || log.connectorName === selectedConnector || log.connectorId === selectedConnector;
    const matchesCategory = selectedCategory === 'All' || log.piiCategory === selectedCategory;
    const matchesTechnique = selectedTechnique === 'All' || log.technique === selectedTechnique;
    const matchesStatus = selectedStatus === 'All' || log.status === selectedStatus;

    const matchesSearch =
      searchQuery === '' ||
      log.recordId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.fieldName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.connectorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.originalValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.anonymizedValue.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesConnector && matchesCategory && matchesTechnique && matchesStatus && matchesSearch;
  });

  const connectorsList = Array.from(new Set(logs.map((l) => l.connectorName)));
  const categoriesList = Array.from(new Set(logs.map((l) => l.piiCategory)));
  const techniquesList = Array.from(new Set(logs.map((l) => l.technique)));

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulateTransformationEvent = () => {
    const samples = [
      {
        connectorId: 'conn-bc-prod',
        connectorName: 'Dynamics 365 Business Central (Prod)',
        targetProvider: 'Dynamics 365 BC',
        entityName: 'Customer_Master (Table 18)',
        recordId: `CUST-${Math.floor(10000 + Math.random() * 89999)}`,
        fieldName: 'credit_card_number',
        originalValue: `4111-2222-3333-${Math.floor(1000 + Math.random() * 8999)}`,
        anonymizedValue: `TKN-FPE-4111-XXXX-XXXX-${Math.floor(1000 + Math.random() * 8999)}`,
        technique: 'FormatPreservingToken',
        piiCategory: 'CreditCard' as PIICategory,
        saltOrMaskDetail: 'FF1 Tokenizer, PCI-DSS Level 1',
      },
      {
        connectorId: 'conn-sap-s4',
        connectorName: 'SAP S/4HANA Cloud Engine',
        targetProvider: 'SAP S/4HANA',
        entityName: 'LFA1_Vendor_Master',
        recordId: `LFA1-${Math.floor(1000 + Math.random() * 8999)}`,
        fieldName: 'IBAN_NUMBER',
        originalValue: `DE44370400440532${Math.floor(100000 + Math.random() * 899999)}`,
        anonymizedValue: `HMAC-DE44XXXX${Math.floor(1000 + Math.random() * 8999)}`,
        technique: 'HMAC_Tokenization',
        piiCategory: 'Financial' as PIICategory,
        saltOrMaskDetail: 'HMAC-SHA256, Secret Salt Key',
      },
      {
        connectorId: 'conn-postgres-warehouse',
        connectorName: 'PostgreSQL Staging Warehouse',
        targetProvider: 'PostgreSQL',
        entityName: 'edimp_staging_customers',
        recordId: `PG-${Math.floor(1000 + Math.random() * 8999)}`,
        fieldName: 'phone',
        originalValue: `+1 (555) ${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}`,
        anonymizedValue: `+1 (555) ${Math.floor(100 + Math.random() * 899)}-XXXX (Synthetic)`,
        technique: 'SyntheticData',
        piiCategory: 'Phone' as PIICategory,
        saltOrMaskDetail: 'FakerPhone Generator',
      },
    ];

    const pick = samples[Math.floor(Math.random() * samples.length)];
    const now = new Date();
    const formattedTime = now.toISOString().replace('T', ' ').substring(0, 19);
    const newId = `aud-${Date.now().toString().slice(-4)}`;

    const newEntry: AnonymizationAuditLogEntry = {
      id: newId,
      timestamp: formattedTime,
      connectorId: pick.connectorId,
      connectorName: pick.connectorName,
      targetProvider: pick.targetProvider,
      entityName: pick.entityName,
      recordId: pick.recordId,
      fieldName: pick.fieldName,
      originalValue: pick.originalValue,
      anonymizedValue: pick.anonymizedValue,
      technique: pick.technique,
      piiCategory: pick.piiCategory,
      status: 'Success',
      executionTimeMs: +(0.3 + Math.random() * 0.5).toFixed(2),
      complianceTags: ['GDPR', 'HIPAA', 'CCPA'],
      saltOrMaskDetail: pick.saltOrMaskDetail,
    };

    setLogs((prev) => [newEntry, ...prev]);
    setHighlightedId(newId);
    setTimeout(() => setHighlightedId(null), 3000);
  };

  const handleExportCSV = () => {
    const headers = ['Audit ID', 'Timestamp', 'Target Connector', 'Entity', 'Record ID', 'Field Name', 'Original Value (Raw)', 'Anonymized Value', 'Technique', 'PII Category', 'Status', 'Execution Latency (ms)'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.connectorName}"`,
      `"${l.entityName}"`,
      l.recordId,
      l.fieldName,
      `"${l.originalValue}"`,
      `"${l.anonymizedValue}"`,
      l.technique,
      l.piiCategory,
      l.status,
      l.executionTimeMs,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Anonymization_Audit_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Anonymization Audit Log & Transformation Mapping
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold font-mono rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Audit Trail Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Immutable stream audit trail capturing every field-level transformation applied across target database connectors, showing original-to-anonymized field mappings, exact execution timestamps, and compliance tags.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSimulateTransformationEvent}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>Simulate Live Event</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit CSV</span>
          </button>
        </div>
      </div>

      {/* Audit Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Transformations Audited</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {1480 + logs.length - 10}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold font-mono">
              +100% Streamed
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Bound to 6 Target DB Connectors</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Sanitization Success Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              100.0%
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold font-mono">
              0 Leakages
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Verified against GDPR & HIPAA</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Avg Proxy Transformation Speed</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">0.58 ms</span>
            <span className="text-[11px] text-emerald-600 font-semibold font-mono">Sub-millisecond</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Zero streaming bottleneck</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Active Audit Policy Tags</span>
            <Lock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              GDPR • HIPAA • CCPA • PCI
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Immutable Log Vault Enabled</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search field, record ID, value, or connector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            {/* Target Connector Filter */}
            <select
              value={selectedConnector}
              onChange={(e) => setSelectedConnector(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="All">All Connectors ({connectorsList.length})</option>
              {connectorsList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* PII Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="All">All PII Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Technique Filter */}
            <select
              value={selectedTechnique}
              onChange={(e) => setSelectedTechnique(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="All">All Techniques</option>
              {techniquesList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono shrink-0">
            <span>Showing {filteredLogs.length} audit entries</span>
            {(searchQuery || selectedConnector !== 'All' || selectedCategory !== 'All' || selectedTechnique !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedConnector('All');
                  setSelectedCategory('All');
                  setSelectedTechnique('All');
                  setSelectedStatus('All');
                }}
                className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <OverflowTableWrapper hintLabel="Scroll horizontally to inspect full field transformation mappings & timestamps">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp & ID</th>
                <th className="py-3 px-4">Target Connector & Entity</th>
                <th className="py-3 px-4">Record ID & Field</th>
                <th className="py-3 px-4 min-w-[340px]">Original → Anonymized Field Mapping</th>
                <th className="py-3 px-4">Technique & Category</th>
                <th className="py-3 px-4">Status & Compliance</th>
                <th className="py-3 px-4 text-right">Latency</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <AnimatePresence initial={false}>
                {filteredLogs.map((log) => {
                  const isNew = highlightedId === log.id;
                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: -20, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className={`transition-colors duration-500 ${
                        isNew ? 'bg-indigo-50/90 font-semibold shadow-2xs ring-1 ring-indigo-300' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Timestamp & ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-900 font-bold block text-xs leading-tight">
                                {log.timestamp}
                              </span>
                              {isNew && (
                                <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[9px] font-bold font-sans rounded-full animate-pulse">
                                  NEW
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{log.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Target Connector & Entity */}
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 shrink-0">
                            <Server className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs leading-tight">
                              {log.connectorName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <Database className="w-3 h-3 text-indigo-500 inline" />
                              {log.entityName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Record ID & Field */}
                      <td className="py-3 px-4">
                        <div>
                          <span className="text-indigo-700 font-bold block text-xs">{log.fieldName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Ref: {log.recordId}</span>
                        </div>
                      </td>

                      {/* Original-to-Anonymized Field Mapping */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                          {/* Original Raw Value Chip */}
                          <div className="flex-1 min-w-[120px] max-w-[160px] bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-1 rounded-lg text-[11px] truncate">
                            <span className="text-[9px] text-amber-700 uppercase font-sans font-bold block leading-none mb-0.5">
                              Original (Raw PII)
                            </span>
                            <span className="font-mono font-medium truncate block">{log.originalValue}</span>
                          </div>

                          {/* Arrow Icon */}
                          <div className="p-1 bg-white text-indigo-600 rounded-full border border-slate-200 shrink-0 shadow-3xs">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>

                          {/* Anonymized Transformed Value Chip */}
                          <div className="flex-1 min-w-[140px] max-w-[180px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-1 rounded-lg text-[11px] truncate">
                            <span className="text-[9px] text-emerald-700 uppercase font-sans font-bold block leading-none mb-0.5">
                              Anonymized Output
                            </span>
                            <span className="font-mono font-bold text-emerald-800 truncate block">
                              {log.anonymizedValue}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Technique & Category */}
                      <td className="py-3 px-4 font-sans">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-bold border border-indigo-100 block w-fit">
                            {log.technique}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            Category: {log.piiCategory}
                          </span>
                        </div>
                      </td>

                      {/* Status & Compliance */}
                      <td className="py-3 px-4 font-sans">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {log.status}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {log.complianceTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.2 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-mono"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Latency */}
                      <td className="py-3 px-4 text-right font-mono text-xs font-bold text-slate-700">
                        {log.executionTimeMs} ms
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => {
                            setInspectEntry(log);
                            setShowOriginalSecret(false);
                          }}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-indigo-100"
                          title="Inspect Audit Proof Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </OverflowTableWrapper>
      </div>

      {/* Inspect Audit Entry Modal */}
      {inspectEntry && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col relative p-6">
            <button
              onClick={() => setInspectEntry(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 shrink-0 pr-8">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Transformation Audit Proof Detail
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Audit Execution Ref: {inspectEntry.id} • {inspectEntry.timestamp}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-sans overflow-y-auto custom-scrollbar flex-1 my-4 pr-1.5 max-h-[calc(90vh-140px)]">
              {/* Target Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold">
                    Target Connector
                  </span>
                  <span className="font-bold text-slate-900 block truncate">{inspectEntry.connectorName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold">
                    Database Entity
                  </span>
                  <span className="font-bold text-slate-900 block truncate">{inspectEntry.entityName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold">
                    Record ID
                  </span>
                  <span className="font-bold text-indigo-700">{inspectEntry.recordId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold">
                    Target Field
                  </span>
                  <span className="font-bold text-indigo-700">{inspectEntry.fieldName}</span>
                </div>
              </div>

              {/* Before & After Transformation Proof */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Cryptographic Field Transformation Mapping</h4>

                {/* Original Raw Value */}
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-700" /> Original Input Value (Raw PII)
                    </span>
                    <button
                      onClick={() => setShowOriginalSecret(!showOriginalSecret)}
                      className="text-[10px] text-amber-800 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {showOriginalSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showOriginalSecret ? 'Hide Raw Value' : 'Reveal Raw Value'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs pt-1">
                    <span className="font-bold text-amber-950">
                      {showOriginalSecret ? inspectEntry.originalValue : '•••••••••••••••• (Shielded)'}
                    </span>
                    <button
                      onClick={() => handleCopyText(inspectEntry.originalValue, 'original')}
                      className="p-1 text-amber-800 hover:bg-amber-200/60 rounded cursor-pointer"
                      title="Copy Original"
                    >
                      {copiedField === 'original' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Downward Arrow */}
                <div className="flex justify-center -my-1">
                  <div className="p-1 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-600">
                    <ArrowRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>

                {/* Anonymized Transformed Output */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Anonymized Destination Output
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">
                      100% Irreversible
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs pt-1">
                    <span className="font-bold text-emerald-950">{inspectEntry.anonymizedValue}</span>
                    <button
                      onClick={() => handleCopyText(inspectEntry.anonymizedValue, 'anonymized')}
                      className="p-1 text-emerald-800 hover:bg-emerald-200/60 rounded cursor-pointer"
                      title="Copy Anonymized"
                    >
                      {copiedField === 'anonymized' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cryptographic Technique & Compliance Proof */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-900">Transformation Mechanics:</span>
                  <span className="font-mono text-indigo-700 font-bold">{inspectEntry.technique}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-mono">
                  {inspectEntry.saltOrMaskDetail || 'Standard format-preserving tokenization applied via security proxy.'}
                </p>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-semibold">Regulatory Compliance Tags:</span>
                  <div className="flex gap-1">
                    {inspectEntry.complianceTags.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setInspectEntry(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
