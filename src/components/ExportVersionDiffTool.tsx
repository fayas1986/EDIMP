import React, { useState } from 'react';
import {
  GitCompare,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Database,
  Cloud,
  Filter,
  Search,
  Activity,
  ChevronRight,
  Info,
  Calendar,
  Key,
  Code,
  Sparkles,
  FileSpreadsheet,
  Check,
  Plus,
  Minus,
  RefreshCw,
  Copy,
  Lock,
  ArrowLeftRight
} from 'lucide-react';

export interface FieldMappingItem {
  fieldName: string;
  sourceTableColumn: string;
  targetDataType: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  piiMasked: boolean;
  description: string;
}

export interface TransformationRuleItem {
  ruleId: string;
  ruleName: string;
  category: 'Anonymization' | 'Type Casting' | 'Data Cleaning' | 'Currency Conversion' | 'Validation';
  algorithm: string;
  inputFields: string[];
  outputFields: string[];
}

export interface ExportConfigVersionSnapshot {
  id: string;
  scheduleId: string;
  scheduleName: string;
  versionNumber: number;
  versionLabel: string;
  releaseDate: string;
  author: string;
  exportFormat: string;
  compression: string;
  destinationType: string;
  destinationUri: string;
  encryption: string;
  changelog: string;
  fieldMappings: FieldMappingItem[];
  transformationRules: TransformationRuleItem[];
}

export const MOCK_VERSION_SNAPSHOTS: ExportConfigVersionSnapshot[] = [
  {
    id: 'ver-1.2',
    scheduleId: 'sch-101',
    scheduleName: 'Daily Parquet Data Lake Sync',
    versionNumber: 1.2,
    versionLabel: 'v1.2 (Current Production)',
    releaseDate: '2026-08-12 04:00 UTC',
    author: 'fayasamd@gmail.com',
    exportFormat: 'Parquet',
    compression: 'Snappy',
    destinationType: 'AWS S3',
    destinationUri: 's3://enterprise-data-lake-prod/snapshots/daily/customers/',
    encryption: 'AWS-KMS AES-256 Envelope',
    changelog: 'Added salted SHA-256 tax ID hashing rule, contact email local masking, and upgraded compression to Snappy 4.2x.',
    fieldMappings: [
      {
        fieldName: 'customer_account_id',
        sourceTableColumn: 'KNA1.KUNNR',
        targetDataType: 'STRING (VARCHAR 10)',
        isPrimaryKey: true,
        isNullable: false,
        piiMasked: false,
        description: 'Customer primary key account index number.',
      },
      {
        fieldName: 'customer_name',
        sourceTableColumn: 'KNA1.NAME1',
        targetDataType: 'STRING (VARCHAR 100)',
        isPrimaryKey: false,
        isNullable: false,
        piiMasked: false,
        description: 'Normalized customer corporate name.',
      },
      {
        fieldName: 'country_code_iso2',
        sourceTableColumn: 'KNA1.LAND1',
        targetDataType: 'STRING (CHAR 2)',
        isPrimaryKey: false,
        isNullable: false,
        piiMasked: false,
        description: 'ISO-3166-1 alpha-2 country code.',
      },
      {
        fieldName: 'tax_identifier_hash',
        sourceTableColumn: 'KNA1.STCEG',
        targetDataType: 'STRING (SHA-256 Hex)',
        isPrimaryKey: false,
        isNullable: true,
        piiMasked: true,
        description: 'Salted SHA-256 digest hash of corporate tax registration number.',
      },
      {
        fieldName: 'contact_email_masked',
        sourceTableColumn: 'KNA1.SMTP_ADDR',
        targetDataType: 'STRING (Masked Email)',
        isPrimaryKey: false,
        isNullable: true,
        piiMasked: true,
        description: 'Anonymized contact email address with local part masked.',
      },
      {
        fieldName: 'annual_revenue_usd',
        sourceTableColumn: 'KNA1.UMSAT',
        targetDataType: 'DECIMAL (18, 2)',
        isPrimaryKey: false,
        isNullable: true,
        piiMasked: false,
        description: 'Annual corporate revenue converted to USD using daily FX spot rate.',
      },
      {
        fieldName: 'created_date_utc',
        sourceTableColumn: 'KNA1.ERDAT',
        targetDataType: 'TIMESTAMP (ISO-8601 UTC)',
        isPrimaryKey: false,
        isNullable: false,
        piiMasked: false,
        description: 'Record creation timestamp standardized to UTC timezone.',
      },
    ],
    transformationRules: [
      {
        ruleId: 'r-pii-tax',
        ruleName: 'Salted SHA-256 Tax ID Anonymizer',
        category: 'Anonymization',
        algorithm: 'CryptoJS.SHA256(STCEG + SALT_V2)',
        inputFields: ['KNA1.STCEG'],
        outputFields: ['tax_identifier_hash'],
      },
      {
        ruleId: 'r-pii-email',
        ruleName: 'Contact Email Local Masker',
        category: 'Anonymization',
        algorithm: 'Regex Masking (c****@domain.com)',
        inputFields: ['KNA1.SMTP_ADDR'],
        outputFields: ['contact_email_masked'],
      },
      {
        ruleId: 'r-fx-conversion',
        ruleName: 'EUR to USD FX Currency Converter',
        category: 'Currency Conversion',
        algorithm: 'EUR * SpotRate(1.0850)',
        inputFields: ['KNA1.UMSAT'],
        outputFields: ['annual_revenue_usd'],
      },
      {
        ruleId: 'r-date-utc',
        ruleName: 'ISO-8601 UTC Timezone Casting',
        category: 'Type Casting',
        algorithm: 'Date.prototype.toISOString()',
        inputFields: ['KNA1.ERDAT'],
        outputFields: ['created_date_utc'],
      },
    ],
  },
  {
    id: 'ver-1.1',
    scheduleId: 'sch-101',
    scheduleName: 'Daily Parquet Data Lake Sync',
    versionNumber: 1.1,
    versionLabel: 'v1.1 (Previous Minor)',
    releaseDate: '2026-08-01 02:30 UTC',
    author: 'm.chen@enterprise.com',
    exportFormat: 'Parquet',
    compression: 'GZIP',
    destinationType: 'AWS S3',
    destinationUri: 's3://enterprise-data-lake-prod/snapshots/daily/customers_legacy/',
    encryption: 'Standard TLS In-Transit',
    changelog: 'Added UTC date casting and annual revenue USD conversion field.',
    fieldMappings: [
      {
        fieldName: 'customer_account_id',
        sourceTableColumn: 'KNA1.KUNNR',
        targetDataType: 'STRING (VARCHAR 10)',
        isPrimaryKey: true,
        isNullable: false,
        piiMasked: false,
        description: 'Customer primary key account index number.',
      },
      {
        fieldName: 'customer_name',
        sourceTableColumn: 'KNA1.NAME1',
        targetDataType: 'STRING (VARCHAR 100)',
        isPrimaryKey: false,
        isNullable: false,
        piiMasked: false,
        description: 'Raw customer corporate name without normalization.',
      },
      {
        fieldName: 'country_code_iso2',
        sourceTableColumn: 'KNA1.LAND1',
        targetDataType: 'STRING (CHAR 2)',
        isPrimaryKey: false,
        isNullable: false,
        piiMasked: false,
        description: 'ISO-3166-1 alpha-2 country code.',
      },
      {
        fieldName: 'tax_identifier_hash',
        sourceTableColumn: 'KNA1.STCEG',
        targetDataType: 'STRING (Plain Tax ID)',
        isPrimaryKey: false,
        isNullable: true,
        piiMasked: false,
        description: 'Plain unmasked tax ID string.',
      },
      {
        fieldName: 'annual_revenue_usd',
        sourceTableColumn: 'KNA1.UMSAT',
        targetDataType: 'DECIMAL (18, 2)',
        isPrimaryKey: false,
        isNullable: true,
        piiMasked: false,
        description: 'Annual corporate revenue in USD.',
      },
      {
        fieldName: 'created_date_utc',
        sourceTableColumn: 'KNA1.ERDAT',
        targetDataType: 'TIMESTAMP (ISO-8601 UTC)',
        isPrimaryKey: false,
        isNullable: false,
        piiMasked: false,
        description: 'Record creation timestamp.',
      },
    ],
    transformationRules: [
      {
        ruleId: 'r-fx-conversion',
        ruleName: 'EUR to USD FX Currency Converter',
        category: 'Currency Conversion',
        algorithm: 'EUR * FixedRate(1.0800)',
        inputFields: ['KNA1.UMSAT'],
        outputFields: ['annual_revenue_usd'],
      },
      {
        ruleId: 'r-date-utc',
        ruleName: 'ISO-8601 UTC Timezone Casting',
        category: 'Type Casting',
        algorithm: 'Date.prototype.toISOString()',
        inputFields: ['KNA1.ERDAT'],
        outputFields: ['created_date_utc'],
      },
    ],
  },
  {
    id: 'ver-1.0',
    scheduleId: 'sch-101',
    scheduleName: 'Daily Parquet Data Lake Sync',
    versionNumber: 1.0,
    versionLabel: 'v1.0 (Initial Release)',
    releaseDate: '2026-07-15 00:00 UTC',
    author: 'a.dev@enterprise.com',
    exportFormat: 'CSV',
    compression: 'None (Uncompressed)',
    destinationType: 'AWS S3',
    destinationUri: 's3://enterprise-data-lake-prod/snapshots/legacy/customers.csv',
    encryption: 'None',
    changelog: 'Initial baseline export configuration release.',
    fieldMappings: [
      {
        fieldName: 'customer_account_id',
        sourceTableColumn: 'KNA1.KUNNR',
        targetDataType: 'STRING (VARCHAR 10)',
        isPrimaryKey: true,
        isNullable: false,
        piiMasked: false,
        description: 'Customer primary key account index number.',
      },
      {
        fieldName: 'customer_name',
        sourceTableColumn: 'KNA1.NAME1',
        targetDataType: 'STRING (VARCHAR 100)',
        isPrimaryKey: false,
        isNullable: false,
        piiMasked: false,
        description: 'Customer corporate name.',
      },
      {
        fieldName: 'country_code_iso2',
        sourceTableColumn: 'KNA1.LAND1',
        targetDataType: 'STRING (CHAR 2)',
        isPrimaryKey: false,
        isNullable: false,
        piiMasked: false,
        description: 'ISO country code.',
      },
    ],
    transformationRules: [],
  },
];

interface ExportVersionDiffToolProps {
  initialVersionAId?: string;
  initialVersionBId?: string;
  onClose?: () => void;
}

export const ExportVersionDiffTool: React.FC<ExportVersionDiffToolProps> = ({
  initialVersionAId,
  initialVersionBId,
  onClose,
}) => {
  const [versionAId, setVersionAId] = useState<string>(
    initialVersionAId || MOCK_VERSION_SNAPSHOTS[0].id
  );
  const [versionBId, setVersionBId] = useState<string>(
    initialVersionBId || MOCK_VERSION_SNAPSHOTS[1].id
  );
  const [filterMode, setFilterMode] = useState<'all' | 'diffsOnly' | 'schemaOnly' | 'rulesOnly'>('all');

  const versionA =
    MOCK_VERSION_SNAPSHOTS.find((v) => v.id === versionAId) || MOCK_VERSION_SNAPSHOTS[0];
  const versionB =
    MOCK_VERSION_SNAPSHOTS.find((v) => v.id === versionBId) || MOCK_VERSION_SNAPSHOTS[1];

  // Helper to calculate field mapping differences
  const getFieldDiffs = () => {
    const fieldsA = versionA.fieldMappings;
    const fieldsB = versionB.fieldMappings;

    const allFieldNames = Array.from(
      new Set([...fieldsA.map((f) => f.fieldName), ...fieldsB.map((f) => f.fieldName)])
    );

    return allFieldNames.map((name) => {
      const itemA = fieldsA.find((f) => f.fieldName === name);
      const itemB = fieldsB.find((f) => f.fieldName === name);

      let status: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED' = 'UNCHANGED';
      let details: string[] = [];

      if (!itemB && itemA) {
        status = 'ADDED';
        details.push('Field added in Version A');
      } else if (itemB && !itemA) {
        status = 'REMOVED';
        details.push('Field removed in Version A (present in Version B)');
      } else if (itemA && itemB) {
        if (itemA.targetDataType !== itemB.targetDataType) {
          status = 'MODIFIED';
          details.push(`Data Type: "${itemB.targetDataType}" → "${itemA.targetDataType}"`);
        }
        if (itemA.piiMasked !== itemB.piiMasked) {
          status = 'MODIFIED';
          details.push(`PII Masking: ${itemB.piiMasked ? 'Masked' : 'Unmasked'} → ${itemA.piiMasked ? 'Masked' : 'Unmasked'}`);
        }
        if (itemA.sourceTableColumn !== itemB.sourceTableColumn) {
          status = 'MODIFIED';
          details.push(`Source Mapping: "${itemB.sourceTableColumn}" → "${itemA.sourceTableColumn}"`);
        }
      }

      return {
        fieldName: name,
        itemA,
        itemB,
        status,
        details,
      };
    });
  };

  // Helper to calculate transformation rule differences
  const getRuleDiffs = () => {
    const rulesA = versionA.transformationRules;
    const rulesB = versionB.transformationRules;

    const allRuleIds = Array.from(
      new Set([...rulesA.map((r) => r.ruleId), ...rulesB.map((r) => r.ruleId)])
    );

    return allRuleIds.map((id) => {
      const itemA = rulesA.find((r) => r.ruleId === id);
      const itemB = rulesB.find((r) => r.ruleId === id);

      let status: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED' = 'UNCHANGED';
      let details: string[] = [];

      if (!itemB && itemA) {
        status = 'ADDED';
        details.push('Rule added in Version A');
      } else if (itemB && !itemA) {
        status = 'REMOVED';
        details.push('Rule removed in Version A');
      } else if (itemA && itemB) {
        if (itemA.algorithm !== itemB.algorithm) {
          status = 'MODIFIED';
          details.push(`Algorithm Spec: "${itemB.algorithm}" → "${itemA.algorithm}"`);
        }
        if (itemA.category !== itemB.category) {
          status = 'MODIFIED';
          details.push(`Category: "${itemB.category}" → "${itemA.category}"`);
        }
      }

      return {
        ruleId: id,
        ruleName: itemA?.ruleName || itemB?.ruleName || id,
        itemA,
        itemB,
        status,
        details,
      };
    });
  };

  const fieldDiffs = getFieldDiffs();
  const ruleDiffs = getRuleDiffs();

  // Metrics
  const addedFieldsCount = fieldDiffs.filter((f) => f.status === 'ADDED').length;
  const removedFieldsCount = fieldDiffs.filter((f) => f.status === 'REMOVED').length;
  const modifiedFieldsCount = fieldDiffs.filter((f) => f.status === 'MODIFIED').length;
  const modifiedRulesCount = ruleDiffs.filter((r) => r.status !== 'UNCHANGED').length;

  const totalDiffs = addedFieldsCount + removedFieldsCount + modifiedFieldsCount + modifiedRulesCount;

  // Filtered Lists
  const visibleFieldDiffs = fieldDiffs.filter((f) => {
    if (filterMode === 'rulesOnly') return false;
    if (filterMode === 'diffsOnly' && f.status === 'UNCHANGED') return false;
    return true;
  });

  const visibleRuleDiffs = ruleDiffs.filter((r) => {
    if (filterMode === 'schemaOnly') return false;
    if (filterMode === 'diffsOnly' && r.status === 'UNCHANGED') return false;
    return true;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
              <GitCompare className="w-3.5 h-3.5 text-purple-600" /> Configuration Diff Engine
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold rounded-full">
              Schema &amp; Transformation Rules Comparison
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-purple-600" /> Export Configuration Side-by-Side Version Diff
          </h2>

          <p className="text-slate-500 text-xs max-w-3xl">
            Compare target schema field mappings, PII masking rules, encryption, and ETL transformation algorithms side-by-side between any two export configuration releases.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all self-start md:self-auto"
          >
            Close Comparison
          </button>
        )}
      </div>

      {/* Version Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
        {/* Version A Selector */}
        <div className="space-y-2 bg-white border border-purple-200 p-3.5 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-purple-900 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-600" /> Target Version A (Base / Newer):
            </label>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-mono font-bold rounded">
              {versionA.exportFormat} • {versionA.compression}
            </span>
          </div>

          <select
            value={versionAId}
            onChange={(e) => setVersionAId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {MOCK_VERSION_SNAPSHOTS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.versionLabel} - {v.releaseDate} ({v.author})
              </option>
            ))}
          </select>

          <p className="text-[11px] text-slate-500 italic truncate font-sans">
            &quot;{versionA.changelog}&quot;
          </p>
        </div>

        {/* Version B Selector */}
        <div className="space-y-2 bg-white border border-slate-300 p-3.5 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-500" /> Target Version B (Compare Against):
            </label>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded">
              {versionB.exportFormat} • {versionB.compression}
            </span>
          </div>

          <select
            value={versionBId}
            onChange={(e) => setVersionBId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            {MOCK_VERSION_SNAPSHOTS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.versionLabel} - {v.releaseDate} ({v.author})
              </option>
            ))}
          </select>

          <p className="text-[11px] text-slate-500 italic truncate font-sans">
            &quot;{versionB.changelog}&quot;
          </p>
        </div>
      </div>

      {/* KPI Overview Diff Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Total Differences</span>
          <span className="text-xl font-black text-slate-900 font-mono">{totalDiffs} Changes</span>
          <span className="text-[10px] text-slate-500 block">Schema &amp; rule drift</span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono block">Fields Added</span>
          <span className="text-xl font-black text-emerald-900 font-mono">+{addedFieldsCount}</span>
          <span className="text-[10px] text-emerald-700 block">Present in Version A</span>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold text-amber-800 uppercase font-mono block">Fields / Rules Modified</span>
          <span className="text-xl font-black text-amber-900 font-mono">Δ {modifiedFieldsCount + modifiedRulesCount}</span>
          <span className="text-[10px] text-amber-700 block">Type or algorithm altered</span>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-xl space-y-0.5">
          <span className="text-[10px] font-bold text-rose-800 uppercase font-mono block">Fields Removed</span>
          <span className="text-xl font-black text-rose-900 font-mono">-{removedFieldsCount}</span>
          <span className="text-[10px] text-rose-700 block">Absent in Version A</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 pb-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="font-sans font-bold text-slate-500">Filter View:</span>
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              All Items
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('diffsOnly')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                filterMode === 'diffsOnly' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              Diffs Only (+ / - / Δ)
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('schemaOnly')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                filterMode === 'schemaOnly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Schema Fields
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('rulesOnly')}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                filterMode === 'rulesOnly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              ETL Rules
            </button>
          </div>
        </div>

        <span className="text-[11px] text-slate-400">
          Showing <strong>{visibleFieldDiffs.length}</strong> fields &amp; <strong>{visibleRuleDiffs.length}</strong> transformation rules
        </span>
      </div>

      {/* SECTION 1: FIELD MAPPING SCHEMA DIFF TABLE */}
      {visibleFieldDiffs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-xs font-bold text-slate-900 border-b border-slate-200 pb-2">
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-purple-600" />
              <span>1. Output Schema Field Mapping Comparison</span>
            </span>
            <span className="text-slate-400 font-normal">Target Field Column Specs</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-mono text-[11px] uppercase font-bold text-slate-600">
                  <th className="p-3 w-12">Diff</th>
                  <th className="p-3">Field Name</th>
                  <th className="p-3">Version A ({versionA.versionLabel})</th>
                  <th className="p-3">Version B ({versionB.versionLabel})</th>
                  <th className="p-3">Delta Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {visibleFieldDiffs.map((diff) => (
                  <tr
                    key={diff.fieldName}
                    className={`transition-colors ${
                      diff.status === 'ADDED'
                        ? 'bg-emerald-50/50 hover:bg-emerald-50'
                        : diff.status === 'REMOVED'
                        ? 'bg-rose-50/50 hover:bg-rose-50'
                        : diff.status === 'MODIFIED'
                        ? 'bg-amber-50/50 hover:bg-amber-50'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Status Badge */}
                    <td className="p-3 font-bold">
                      {diff.status === 'ADDED' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] flex items-center justify-center gap-0.5">
                          <Plus className="w-3 h-3" /> ADD
                        </span>
                      )}
                      {diff.status === 'REMOVED' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] flex items-center justify-center gap-0.5">
                          <Minus className="w-3 h-3" /> REM
                        </span>
                      )}
                      {diff.status === 'MODIFIED' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] flex items-center justify-center gap-0.5">
                          Δ MOD
                        </span>
                      )}
                      {diff.status === 'UNCHANGED' && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] flex items-center justify-center">
                          SAME
                        </span>
                      )}
                    </td>

                    {/* Field Name */}
                    <td className="p-3 font-bold text-slate-900">{diff.fieldName}</td>

                    {/* Version A Field Value */}
                    <td className="p-3">
                      {diff.itemA ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-purple-900">{diff.itemA.targetDataType}</div>
                          <div className="text-[10px] text-slate-500">Source: {diff.itemA.sourceTableColumn}</div>
                          {diff.itemA.piiMasked && (
                            <span className="inline-block px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold mt-0.5">
                              🔒 PII Masked
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">&lt;Not Present&gt;</span>
                      )}
                    </td>

                    {/* Version B Field Value */}
                    <td className="p-3">
                      {diff.itemB ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800">{diff.itemB.targetDataType}</div>
                          <div className="text-[10px] text-slate-500">Source: {diff.itemB.sourceTableColumn}</div>
                          {diff.itemB.piiMasked && (
                            <span className="inline-block px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold mt-0.5">
                              🔒 PII Masked
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">&lt;Not Present&gt;</span>
                      )}
                    </td>

                    {/* Details / Delta Description */}
                    <td className="p-3 font-sans text-xs text-slate-600">
                      {diff.details.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px] text-slate-800">
                          {diff.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-mono">Identical mapping spec</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: TRANSFORMATION RULES DIFF TABLE */}
      {visibleRuleDiffs.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between font-mono text-xs font-bold text-slate-900 border-b border-slate-200 pb-2">
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>2. ETL Transformation Pipeline Rules Comparison</span>
            </span>
            <span className="text-slate-400 font-normal">Category &amp; Algorithm Spec</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-mono text-[11px] uppercase font-bold text-slate-600">
                  <th className="p-3 w-12">Diff</th>
                  <th className="p-3">Rule Name</th>
                  <th className="p-3">Version A Algorithm</th>
                  <th className="p-3">Version B Algorithm</th>
                  <th className="p-3">Modification Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {visibleRuleDiffs.map((diff) => (
                  <tr
                    key={diff.ruleId}
                    className={`transition-colors ${
                      diff.status === 'ADDED'
                        ? 'bg-emerald-50/50 hover:bg-emerald-50'
                        : diff.status === 'REMOVED'
                        ? 'bg-rose-50/50 hover:bg-rose-50'
                        : diff.status === 'MODIFIED'
                        ? 'bg-amber-50/50 hover:bg-amber-50'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="p-3 font-bold">
                      {diff.status === 'ADDED' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px]">
                          + ADD
                        </span>
                      )}
                      {diff.status === 'REMOVED' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px]">
                          - REM
                        </span>
                      )}
                      {diff.status === 'MODIFIED' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px]">
                          Δ MOD
                        </span>
                      )}
                      {diff.status === 'UNCHANGED' && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                          SAME
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-bold text-slate-900">{diff.ruleName}</td>

                    <td className="p-3">
                      {diff.itemA ? (
                        <code className="bg-purple-50 text-purple-900 px-2 py-1 rounded border border-purple-200 text-[11px] font-mono block">
                          {diff.itemA.algorithm}
                        </code>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">&lt;None&gt;</span>
                      )}
                    </td>

                    <td className="p-3">
                      {diff.itemB ? (
                        <code className="bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200 text-[11px] font-mono block">
                          {diff.itemB.algorithm}
                        </code>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">&lt;None&gt;</span>
                      )}
                    </td>

                    <td className="p-3 text-slate-600 font-sans text-xs">
                      {diff.details.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px] text-slate-800">
                          {diff.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-mono">Identical algorithm</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
