import React, { useState } from 'react';
import { OverflowTableWrapper } from './OverflowTableWrapper';
import { Connector } from '../types';
import {
  GitCompare,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  Copy,
  Check,
  Zap,
  Code2,
  RefreshCw,
  Database,
  Columns,
  Plus,
  Minus,
  Edit3,
  Table,
  FileCode,
  Code,
  Eye,
  SlidersHorizontal,
  Activity,
  Download,
} from 'lucide-react';

export interface SchemaDiffItem {
  fieldPairId: string;
  sourceField: string;
  sourceType: string;
  sourceNullable: boolean;
  sourceIsKey?: boolean;
  sourceDescription?: string;
  targetField: string;
  targetType: string;
  targetNullable: boolean;
  targetIsKey?: boolean;
  targetDescription?: string;
  status: 'Type Mismatch' | 'Constraint Risk' | 'Compatible' | 'Missing Field' | 'Added Field';
  diffType: 'added' | 'removed' | 'modified' | 'compatible';
  diffSeverity: 'High' | 'Medium' | 'Low' | 'None';
  diffDetails: string;
  resolutionAdvice: string;
  recommendedTransformation: string;
  confidenceScore: number;
}

const SAMPLE_COMPARISON_ITEMS: SchemaDiffItem[] = [
  {
    fieldPairId: 'diff-001',
    sourceField: 'KUNNR',
    sourceType: 'CHAR(10)',
    sourceNullable: false,
    sourceIsKey: true,
    sourceDescription: 'Customer Account Number (SAP)',
    targetField: 'No.',
    targetType: 'Code[20]',
    targetNullable: false,
    targetIsKey: true,
    targetDescription: 'Customer Primary Key ID (D365)',
    status: 'Type Mismatch',
    diffType: 'modified',
    diffSeverity: 'Medium',
    diffDetails: 'Length expansion: CHAR(10) -> Code[20]. Data type changed from fixed CHAR to dynamic Code.',
    resolutionAdvice: 'Pad with leading zeros if fixed-length required or apply UPPER(TRIM(KUNNR)).',
    recommendedTransformation: 'UPPER(TRIM(KUNNR))',
    confidenceScore: 0.98,
  },
  {
    fieldPairId: 'diff-002',
    sourceField: 'NAME1',
    sourceType: 'VARCHAR(35)',
    sourceNullable: false,
    sourceIsKey: false,
    sourceDescription: 'Customer Legal Name 1',
    targetField: 'Name',
    targetType: 'Text[100]',
    targetNullable: false,
    targetIsKey: false,
    targetDescription: 'Customer Legal Name',
    status: 'Type Mismatch',
    diffType: 'modified',
    diffSeverity: 'Low',
    diffDetails: 'Target capacity expanded (35 -> 100 chars). Data type altered from VARCHAR to Text.',
    resolutionAdvice: 'Direct mapping with TRIM(). Target capacity is larger.',
    recommendedTransformation: 'TRIM(NAME1)',
    confidenceScore: 0.99,
  },
  {
    fieldPairId: 'diff-003',
    sourceField: 'STRAS',
    sourceType: 'VARCHAR(35)',
    sourceNullable: true,
    sourceDescription: 'Street Address',
    targetField: 'Address',
    targetType: 'Text[50]',
    targetNullable: false,
    targetDescription: 'Primary Line 1 Address',
    status: 'Constraint Risk',
    diffType: 'modified',
    diffSeverity: 'High',
    diffDetails: 'Nullability Conflict! Source allows NULL, Target is NOT NULL (Required field).',
    resolutionAdvice: 'Use COALESCE fallback string "N/A - Unspecified" to prevent insertion failure.',
    recommendedTransformation: 'COALESCE(TRIM(STRAS), "N/A - Unspecified Address")',
    confidenceScore: 0.95,
  },
  {
    fieldPairId: 'diff-004',
    sourceField: 'STCD1',
    sourceType: 'VARCHAR(16)',
    sourceNullable: true,
    sourceDescription: 'Tax Number 1 (VAT ID)',
    targetField: 'VAT Registration No.',
    targetType: 'Text[20]',
    targetNullable: true,
    targetDescription: 'Enterprise Tax Registration Number',
    status: 'Compatible',
    diffType: 'compatible',
    diffSeverity: 'None',
    diffDetails: 'Structures compatible. Text[20] holds VARCHAR(16). Nullability matches.',
    resolutionAdvice: 'Direct mapping. Format regex validation applied.',
    recommendedTransformation: 'REGEX_REPLACE(STCD1, "[^A-Z0-9]", "")',
    confidenceScore: 0.97,
  },
  {
    fieldPairId: 'diff-005',
    sourceField: 'ERDAT',
    sourceType: 'CHAR(8) [YYYYMMDD]',
    sourceNullable: false,
    sourceDescription: 'Record Creation Date',
    targetField: 'Created DateTime',
    targetType: 'DateTime [ISO-8601]',
    targetNullable: false,
    targetDescription: 'Record Creation Timestamp',
    status: 'Type Mismatch',
    diffType: 'modified',
    diffSeverity: 'Medium',
    diffDetails: 'Format & Type conversion required: String YYYYMMDD -> ISO-8601 Timestamp.',
    resolutionAdvice: 'Parse string format YYYYMMDD to DateTime object with UTC zone.',
    recommendedTransformation: 'TO_TIMESTAMP(ERDAT, "YYYYMMDD")',
    confidenceScore: 0.96,
  },
  {
    fieldPairId: 'diff-006',
    sourceField: 'LOEVM',
    sourceType: 'CHAR(1) ["X" or ""]',
    sourceNullable: true,
    sourceDescription: 'Deletion Flag',
    targetField: 'Blocked',
    targetType: 'Enum [" ", "Ship", "Invoice", "All"]',
    targetNullable: false,
    targetDescription: 'Customer Account Block Status',
    status: 'Constraint Risk',
    diffType: 'modified',
    diffSeverity: 'High',
    diffDetails: 'Type & Domain Cardinality conflict (CHAR flag -> Enum dropdown).',
    resolutionAdvice: 'Map "X" -> "All", empty -> " ". Provide default for invalid codes.',
    recommendedTransformation: 'CASE WHEN LOEVM = "X" THEN "All" ELSE " " END',
    confidenceScore: 0.92,
  },
  {
    fieldPairId: 'diff-007',
    sourceField: 'CREDIT_LIMIT',
    sourceType: 'DECIMAL(13,2)',
    sourceNullable: true,
    sourceDescription: 'SAP Credit Limit Amount',
    targetField: 'Credit Limit (LCY)',
    targetType: 'Decimal[18,4]',
    targetNullable: false,
    targetDescription: 'Local Currency Credit Limit',
    status: 'Constraint Risk',
    diffType: 'modified',
    diffSeverity: 'Medium',
    diffDetails: 'Precision expansion (13,2 -> 18,4). Nullability conflict (Target NOT NULL).',
    resolutionAdvice: 'Cast to Decimal and default NULLs to 0.00.',
    recommendedTransformation: 'COALESCE(CAST(CREDIT_LIMIT AS DECIMAL(18,4)), 0.00)',
    confidenceScore: 0.94,
  },
  {
    fieldPairId: 'diff-008',
    sourceField: 'TELF2_FAX',
    sourceType: 'VARCHAR(20)',
    sourceNullable: true,
    sourceDescription: 'Legacy Telefax Number (SAP)',
    targetField: '(None / Dropped)',
    targetType: 'N/A',
    targetNullable: true,
    targetDescription: 'Field unmapped or retired in target ERP schema',
    status: 'Missing Field',
    diffType: 'removed',
    diffSeverity: 'High',
    diffDetails: 'Source Field Removed / Not present in destination schema.',
    resolutionAdvice: 'Archive legacy fax values into target JSON extension metadata payload.',
    recommendedTransformation: 'JSON_BUILD_OBJECT("legacyFax", TELF2_FAX)',
    confidenceScore: 0.91,
  },
  {
    fieldPairId: 'diff-009',
    sourceField: '(None / Unmapped)',
    sourceType: 'N/A',
    sourceNullable: true,
    sourceDescription: 'New target requirement',
    targetField: 'LoyaltyProgramCode',
    targetType: 'Code[20]',
    targetNullable: false,
    targetDescription: 'Required ERP Customer Tier Code',
    status: 'Added Field',
    diffType: 'added',
    diffSeverity: 'High',
    diffDetails: 'New Required Target Field missing in source payload.',
    resolutionAdvice: 'Provide constant default string or lookup tier from sales history.',
    recommendedTransformation: '"STANDARD_TIER_DEFAULT"',
    confidenceScore: 0.93,
  },
  {
    fieldPairId: 'diff-010',
    sourceField: 'INDUSTRY_CODE',
    sourceType: 'VARCHAR(10)',
    sourceNullable: true,
    sourceDescription: 'Industry Classification',
    targetField: 'Industry Code',
    targetType: 'Text[10]',
    targetNullable: true,
    targetDescription: 'Standard Industry Classification',
    status: 'Compatible',
    diffType: 'compatible',
    diffSeverity: 'None',
    diffDetails: 'Compatible field structures. VARCHAR(10) maps directly to Text[10].',
    resolutionAdvice: 'Direct mapping.',
    recommendedTransformation: 'TRIM(INDUSTRY_CODE)',
    confidenceScore: 0.99,
  },
];

export const SchemaComparisonView: React.FC<{ connectors?: Connector[] }> = ({ connectors = [] }) => {
  const [sourceEntity, setSourceEntity] = useState<string>('SAP S/4HANA Cloud Engine');
  const [targetEntity, setTargetEntity] = useState<string>('Dynamics 365 Business Central (Prod)');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSourceChange = (val: string) => {
    setSourceEntity(val);
    triggerSync();
  };

  const handleTargetChange = (val: string) => {
    setTargetEntity(val);
    triggerSync();
  };

  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1200);
  };

  const [diffItems, setDiffItems] = useState<SchemaDiffItem[]>(SAMPLE_COMPARISON_ITEMS);
  const [appliedResolutions, setAppliedResolutions] = useState<Record<string, boolean>>({});

  // Diff Controls & Filters
  const [viewMode, setViewMode] = useState<'grid' | 'cards' | 'code'>('grid');
  const [diffTypeFilter, setDiffTypeFilter] = useState<'ALL' | 'added' | 'removed' | 'modified' | 'compatible'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [codeFormat, setCodeFormat] = useState<'sql' | 'json' | 'typescript'>('sql');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const ANALYSIS_STAGES = [
    { label: 'Parsing Schema Structures', icon: Database },
    { label: 'Analyzing Data Type Compatibility', icon: Activity },
    { label: 'Semantic Entity Matching', icon: Sparkles },
    { label: 'Generating AI Transformation Rules', icon: Code2 }
  ];

  const handleRunAiComparison = async () => {
    setIsLoading(true);
    setAnalysisStep(0);
    
    // Simulate real-time analysis steps
    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev >= ANALYSIS_STAGES.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    try {
      const res = await fetch('/api/ai/compare-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceEntity, targetEntity }),
      });
      const data = await res.json();
      
      setIsLoading(false);
      if (data.success && data.diffs) {
        setDiffItems(data.diffs);
      }
    } catch (err) {
      console.error('Failed to compare schemas:', err);
      setIsLoading(false);
    }
  };

  const handleExportReport = (format: 'csv' | 'json' = 'csv') => {
    if (diffItems.length === 0) return;

    if (format === 'json') {
      const dataStr = JSON.stringify(diffItems, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `schema_comparison_${sourceEntity.replace(/\s+/g, '_')}.json`);
      link.click();
      return;
    }

    // Create CSV content
    const headers = ['Diff Type', 'Severity', 'Source Field', 'Source Type', 'Target Field', 'Target Type', 'Confidence', 'Transformation'];
    const rows = diffItems.map(item => [
      item.diffType,
      item.diffSeverity,
      item.sourceField || 'N/A',
      item.sourceType || 'N/A',
      item.targetField || 'N/A',
      item.targetType || 'N/A',
      `${(item.confidenceScore * 100).toFixed(0)}%`,
      `"${item.recommendedTransformation.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `schema_comparison_${sourceEntity.replace(/\s+/g, '_')}_to_${targetEntity.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleApplyResolution = (id: string) => {
    setAppliedResolutions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered Diff Items
  const filteredDiffs = diffItems.filter((item) => {
    const matchesDiffType =
      diffTypeFilter === 'ALL' || item.diffType === diffTypeFilter;

    const matchesSearch =
      item.sourceField.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetField.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.diffDetails.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.recommendedTransformation.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDiffType && matchesSearch;
  });

  // Category counts for visual indicators
  const totalCompared = diffItems.length;
  const addedCount = diffItems.filter((i) => i.diffType === 'added').length;
  const removedCount = diffItems.filter((i) => i.diffType === 'removed').length;
  const modifiedCount = diffItems.filter((i) => i.diffType === 'modified').length;
  const compatibleCount = diffItems.filter((i) => i.diffType === 'compatible').length;
  const appliedCount = Object.values(appliedResolutions).filter(Boolean).length;

  return (
    <div id="ai-schema-comparison-view" className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-slate-900 bg-white min-h-screen">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white text-indigo-600 rounded-2xl border border-slate-200 shadow-sm">
              <GitCompare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Schema Comparison Studio
                <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 uppercase tracking-widest shadow-sm">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Real-Time AI
                </span>
              </h2>
              <p className="text-slate-500 text-xs mt-1 font-bold">
                Advanced cross-platform schema drift analysis with bit-for-bit semantic alignment.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => handleExportReport('csv')}
              disabled={isLoading || diffItems.length === 0}
              className="px-4 py-2 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              CSV Report
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button
              onClick={() => handleExportReport('json')}
              disabled={isLoading || diffItems.length === 0}
              className="px-4 py-2 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <FileCode className="w-3.5 h-3.5 text-purple-600" />
              JSON Schema
            </button>
          </div>
          <button
            type="button"
            onClick={handleRunAiComparison}
            disabled={isLoading}
            className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-black rounded-2xl text-xs shadow-xl shadow-slate-900/20 flex items-center gap-2.5 cursor-pointer transition-all disabled:opacity-50 uppercase tracking-widest"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Analyzing Schemas...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Run Real-Time Comparison</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Entity Selector Configuration */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="space-y-4 relative">
          <div className="flex items-center justify-between">
            <label className="text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              Source Entity Schema
            </label>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Primary Source</span>
          </div>
          <div className="relative">
            <select
              value={sourceEntity}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 rounded-2xl px-5 py-3.5 font-bold focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all cursor-pointer appearance-none shadow-xs"
            >
              {connectors.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
              {connectors.length === 0 && (
                <>
                  <option value="SAP S/4HANA Cloud Engine">SAP S/4HANA Cloud Engine</option>
                  <option value="Salesforce Enterprise CRM">Salesforce Enterprise CRM</option>
                </>
              )}
            </select>
            {isSyncing && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm animate-in fade-in zoom-in duration-200">
                <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Syncing</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 relative">
          <div className="flex items-center justify-between">
            <label className="text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-purple-500" />
              Destination Entity Schema
            </label>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">Target Sink</span>
          </div>
          <div className="relative">
            <select
              value={targetEntity}
              onChange={(e) => handleTargetChange(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 rounded-2xl px-5 py-3.5 font-bold focus:outline-hidden focus:border-purple-500 focus:bg-white transition-all cursor-pointer appearance-none shadow-xs"
            >
              {connectors.slice().reverse().map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
              {connectors.length === 0 && (
                <>
                  <option value="Dynamics 365 Business Central (Prod)">Dynamics 365 Business Central (Prod)</option>
                  <option value="Dynamics 365 Finance & Operations">Dynamics 365 Finance & Operations</option>
                </>
              )}
            </select>
            {isSyncing && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm animate-in fade-in zoom-in duration-200">
                <RefreshCw className="w-3 h-3 text-purple-600 animate-spin" />
                <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Syncing</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Diff Color Legend & Metric Overview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 shadow-3xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Visual Diff Color Legend & Summary</span>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Resolutions Applied: <strong className="text-indigo-600">{appliedCount} / {totalCompared}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          {/* Added Badge Card */}
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] text-emerald-600/70 uppercase font-black tracking-widest block">Added Fields</span>
                <span className="text-lg font-black text-emerald-700">+{addedCount}</span>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-100" />
          </div>

          {/* Removed Badge Card */}
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                <Minus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] text-rose-600/70 uppercase font-black tracking-widest block">Removed Fields</span>
                <span className="text-lg font-black text-rose-700">-{removedCount}</span>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse ring-4 ring-rose-100" />
          </div>

          {/* Modified Badge Card */}
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] text-amber-600/70 uppercase font-black tracking-widest block">Modified Fields</span>
                <span className="text-lg font-black text-amber-700">~{modifiedCount}</span>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse ring-4 ring-amber-100" />
          </div>

          {/* Compatible Badge Card */}
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] text-indigo-600/70 uppercase font-black tracking-widest block">Compatible</span>
                <span className="text-lg font-black text-indigo-700">✓{compatibleCount}</span>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 ring-4 ring-indigo-100" />
          </div>
        </div>
      </div>

      {/* Diff Controls: Filter Chips, View Modes & Search */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-3xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Diff Type Filters */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mr-1 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-indigo-500" /> Filter Diff:
            </span>

            <button
              type="button"
              onClick={() => setDiffTypeFilter('ALL')}
              className={`px-4 py-2 rounded-xl border transition-all cursor-pointer font-black uppercase tracking-widest text-[10px] ${
                diffTypeFilter === 'ALL'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              All Diffs ({totalCompared})
            </button>

            <button
              type="button"
              onClick={() => setDiffTypeFilter('added')}
              className={`px-4 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 font-black uppercase tracking-widest text-[10px] ${
                diffTypeFilter === 'added'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Added ({addedCount})
            </button>

            <button
              type="button"
              onClick={() => setDiffTypeFilter('removed')}
              className={`px-4 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 font-black uppercase tracking-widest text-[10px] ${
                diffTypeFilter === 'removed'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                  : 'bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-200'
              }`}
            >
              <Minus className="w-3.5 h-3.5" /> Removed ({removedCount})
            </button>

            <button
              type="button"
              onClick={() => setDiffTypeFilter('modified')}
              className={`px-4 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 font-black uppercase tracking-widest text-[10px] ${
                diffTypeFilter === 'modified'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                  : 'bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Modified ({modifiedCount})
            </button>

            <button
              type="button"
              onClick={() => setDiffTypeFilter('compatible')}
              className={`px-4 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 font-black uppercase tracking-widest text-[10px] ${
                diffTypeFilter === 'compatible'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Check className="w-3.5 h-3.5" /> Compatible ({compatibleCount})
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Side-by-Side Visual Diff Table"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Side-by-Side Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                  viewMode === 'cards'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Structured Cards View"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Rule Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('code')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                  viewMode === 'code'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Code / DDL Visual Diff Viewer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>DDL Code Diff</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
              />
            </div>
          </div>
        </div>

        {/* MODE 1: VISUAL DIFF GRID TABLE */}
        {viewMode === 'grid' && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <OverflowTableWrapper hintLabel="Scroll horizontally to inspect full side-by-side schema diff columns">
              <table className="w-full text-left text-[11px] font-bold border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 uppercase text-[9px] font-black tracking-widest">
                  <th className="p-4 w-32">Diff Status</th>
                  <th className="p-4">Source Field (SAP)</th>
                  <th className="p-4 text-center">Structural Shift</th>
                  <th className="p-4">Destination Field (D365)</th>
                  <th className="p-4">AI Resolution & Transformation</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDiffs.map((diff) => {
                  const isApplied = appliedResolutions[diff.fieldPairId];

                  // Row highlight based on diffType
                  let rowBg = 'bg-white hover:bg-slate-50/50 transition-colors border-l-4 border-l-transparent';
                  let statusBadge = null;

                  if (diff.diffType === 'added') {
                    rowBg = 'bg-emerald-50/10 hover:bg-emerald-50/30 border-l-4 border-l-emerald-500';
                    statusBadge = (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                        <Plus className="w-3 h-3" /> Added
                      </span>
                    );
                  } else if (diff.diffType === 'removed') {
                    rowBg = 'bg-rose-50/10 hover:bg-rose-50/30 border-l-4 border-l-rose-500';
                    statusBadge = (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                        <Minus className="w-3 h-3" /> Removed
                      </span>
                    );
                  } else if (diff.diffType === 'modified') {
                    rowBg = 'bg-amber-50/10 hover:bg-amber-50/30 border-l-4 border-l-amber-500';
                    statusBadge = (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                        <Edit3 className="w-3 h-3" /> Modified
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                        <Check className="w-3 h-3" /> Compatible
                      </span>
                    );
                  }

                  return (
                    <tr key={diff.fieldPairId} className={rowBg}>
                      {/* Diff Status Badge */}
                      <td className="p-4 align-top">
                        <div className="space-y-2">
                          {statusBadge}
                          <span className="text-[8px] text-slate-400 block font-black uppercase tracking-widest">
                            Severity: <strong className={diff.diffSeverity === 'High' ? 'text-rose-600' : diff.diffSeverity === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}>{diff.diffSeverity}</strong>
                          </span>
                        </div>
                      </td>

                      {/* Source Field Cell */}
                      <td className="p-4 align-top">
                        {diff.diffType === 'added' ? (
                          <span className="text-slate-400 italic text-[10px] font-medium">(New Target Field)</span>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[13px] font-black tracking-tight ${diff.diffType === 'removed' ? 'line-through text-rose-400' : 'text-slate-900'}`}>
                                {diff.sourceField}
                              </span>
                              {diff.sourceIsKey && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase">PK</span>}
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md font-mono">
                                {diff.sourceType}
                              </span>
                              <span className={`font-black uppercase tracking-tighter text-[9px] ${diff.sourceNullable ? 'text-amber-600' : 'text-slate-400'}`}>
                                {diff.sourceNullable ? 'NULL' : 'NOT NULL'}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Direction Arrow */}
                      <td className="p-4 align-top text-center">
                        <div className="flex flex-col items-center justify-center pt-1.5 text-slate-300">
                          <ArrowRight className="w-5 h-5 text-indigo-400" />
                          <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">{(diff.confidenceScore * 100).toFixed(0)}% AI Match</span>
                        </div>
                      </td>

                      {/* Target Field Cell */}
                      <td className="p-4 align-top">
                        {diff.diffType === 'removed' ? (
                          <span className="text-rose-400 italic text-[10px] font-medium">(Dropped in Target)</span>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[13px] font-black tracking-tight ${diff.diffType === 'added' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {diff.targetField}
                              </span>
                              {diff.targetIsKey && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase">PK</span>}
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md font-mono">
                                {diff.targetType}
                              </span>
                              <span className={`font-black uppercase tracking-tighter text-[9px] ${!diff.targetNullable ? 'text-rose-600' : 'text-slate-400'}`}>
                                {diff.targetNullable ? 'NULL' : 'NOT NULL'}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* AI Transformation & Explanation */}
                      <td className="p-4 align-top space-y-3 max-w-xs">
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{diff.diffDetails}</p>
                        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-indigo-700 text-[10px] font-mono">
                          <Code2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <code className="truncate font-bold">{diff.recommendedTransformation}</code>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(diff.recommendedTransformation)}
                            className="ml-auto text-slate-400 hover:text-indigo-600 p-1.5 shrink-0 cursor-pointer transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === diff.recommendedTransformation ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Apply Action Button */}
                      <td className="p-4 align-top text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleApplyResolution(diff.fieldPairId)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ml-auto shadow-xs ${
                            isApplied
                              ? 'bg-emerald-600 text-white border border-emerald-600'
                              : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-600 hover:text-indigo-600'
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Applied</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>Apply AI Fix</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </OverflowTableWrapper>
        </div>
        )}

        {/* MODE 2: STRUCTURED RULE CARDS */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDiffs.map((diff) => {
              const isApplied = appliedResolutions[diff.fieldPairId];

              // Card styling based on diffType
              let cardAccent = 'border-slate-200';
              if (diff.diffType === 'added') cardAccent = 'border-emerald-500 bg-emerald-50/10 shadow-emerald-500/5';
              if (diff.diffType === 'removed') cardAccent = 'border-rose-500 bg-rose-50/10 shadow-rose-500/5';
              if (diff.diffType === 'modified') cardAccent = 'border-amber-500 bg-amber-50/10 shadow-amber-500/5';

              return (
                <div
                  key={diff.fieldPairId}
                  className={`bg-white p-6 rounded-3xl border-2 transition-all space-y-5 shadow-sm hover:shadow-xl hover:-translate-y-1 ${cardAccent}`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border shadow-xs ${
                          diff.diffType === 'added'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : diff.diffType === 'removed'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : diff.diffType === 'modified'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-slate-900 text-white border-slate-900'
                        }`}
                      >
                        {diff.diffType === 'added'
                          ? 'Addition'
                          : diff.diffType === 'removed'
                          ? 'Removal'
                          : diff.diffType === 'modified'
                          ? 'Modification'
                          : 'Compatible'}
                      </span>
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                        diff.diffSeverity === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        diff.diffSeverity === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {diff.diffSeverity} Risk
                      </span>
                    </div>

                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <strong className="text-slate-900">{(diff.confidenceScore * 100).toFixed(0)}%</strong>
                    </span>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div className="space-y-4">
                    {/* Source Box */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative overflow-hidden shadow-xs">
                      <span className="text-[9px] uppercase text-slate-400 font-black tracking-widest block mb-2.5">Source (SAP S/4)</span>
                      {diff.diffType === 'added' ? (
                        <p className="text-slate-400 italic text-[11px] font-bold">New Field Injection</p>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <span className={`text-[15px] font-black tracking-tight ${diff.diffType === 'removed' ? 'line-through text-rose-400' : 'text-slate-900'}`}>
                            {diff.sourceField}
                          </span>
                          <span className="px-2.5 py-1 bg-white text-slate-700 border border-slate-200 rounded-lg text-[10px] font-black font-mono shadow-xs">
                            {diff.sourceType}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center -my-3 relative z-10">
                      <div className="bg-white p-2 rounded-full border border-slate-200 shadow-md">
                        <ArrowRight className="w-4 h-4 text-indigo-600 rotate-90 md:rotate-0" />
                      </div>
                    </div>

                    {/* Target Box */}
                    <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 relative overflow-hidden shadow-xs">
                      <span className="text-[9px] uppercase text-slate-400 font-black tracking-widest block mb-2.5">Target (D365 BC)</span>
                      {diff.diffType === 'removed' ? (
                        <p className="text-rose-400 italic text-[11px] font-bold">Entity Decommissioned</p>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <span className={`text-[15px] font-black tracking-tight ${diff.diffType === 'added' ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {diff.targetField}
                          </span>
                          <span className="px-2.5 py-1 bg-slate-50 text-indigo-600 border border-slate-200 rounded-lg text-[10px] font-black font-mono shadow-xs">
                            {diff.targetType}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resolution Insight */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
                    <p className="text-[11px] text-slate-600 font-bold leading-relaxed">{diff.diffDetails}</p>
                    <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 text-indigo-600 text-[10px] font-mono font-bold shadow-xs">
                      <Code2 className="w-4 h-4 text-indigo-500" />
                      <code className="truncate">{diff.recommendedTransformation}</code>
                    </div>
                  </div>

                  {/* Apply Fix Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleApplyResolution(diff.fieldPairId)}
                    className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-lg ${
                      isApplied
                        ? 'bg-emerald-600 text-white border border-emerald-500 shadow-emerald-500/20'
                        : 'bg-slate-900 text-white hover:bg-black border border-slate-800 shadow-slate-900/20'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resolution Applied</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>Deploy AI Transformation</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'code' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl flex flex-col h-[650px]">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/30">
                  <FileCode className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
                  <button
                    onClick={() => setCodeFormat('sql')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${codeFormat === 'sql' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    SQL DDL
                  </button>
                  <button
                    onClick={() => setCodeFormat('json')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${codeFormat === 'json' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setCodeFormat('typescript')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${codeFormat === 'typescript' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    TSX
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleCopyCode(codeFormat === 'sql' ? '-- Generated SQL DDL Diff' : '{ "diff": "JSON" }')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm cursor-pointer"
              >
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Full Artifact</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-8 font-mono text-xs leading-relaxed bg-slate-50/30 text-slate-700">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-400 mb-6">
                  <span className="text-[10px] font-black uppercase tracking-tighter border-r border-slate-200 pr-3">System Report</span>
                  <span className="text-[10px] font-bold">Target: {targetEntity}</span>
                </div>
                
                {filteredDiffs.map((diff, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border-2 transition-all ${
                    diff.diffType === 'added' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                    diff.diffType === 'removed' ? 'bg-rose-50 border-rose-200 text-rose-700' : 
                    diff.diffType === 'modified' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                    'bg-white border-slate-200 text-slate-600'
                  }`}>
                    {codeFormat === 'sql' && (
                      <div className="flex items-start gap-6">
                        <span className="text-slate-300 w-6 text-right select-none font-bold pt-1 text-[10px]">{idx + 1}</span>
                        <div className="flex-1 font-bold">
                          {diff.diffType === 'added' && <span>ALTER TABLE <span className="text-slate-900 underline">Target</span> ADD COLUMN <span className="text-indigo-600">{diff.targetField}</span> {diff.targetType};</span>}
                          {diff.diffType === 'removed' && <span className="opacity-60 text-slate-400">-- REMOVED: Source <span className="line-through">{diff.sourceField}</span> ({diff.sourceType}) dropped.</span>}
                          {diff.diffType === 'modified' && (
                            <div className="space-y-2">
                              <span className="text-amber-600">-- MODIFIED: {diff.sourceField} &rarr; {diff.targetField}</span>
                              <div className="text-indigo-700 bg-white p-3 rounded-xl border border-indigo-100 mt-2 font-black shadow-sm">
                                INSERT INTO Target ({diff.targetField}) SELECT <span className="text-slate-900">{diff.recommendedTransformation}</span> FROM Source;
                              </div>
                            </div>
                          )}
                          {diff.diffType === 'compatible' && <span>INSERT INTO Target (<span className="text-indigo-600">{diff.targetField}</span>) SELECT <span className="text-slate-900">{diff.sourceField}</span> FROM Source;</span>}
                        </div>
                      </div>
                    )}
                    {codeFormat === 'json' && (
                       <div className="flex items-center gap-6">
                         <span className="text-slate-300 w-6 text-right select-none font-bold text-[10px]">{idx + 1}</span>
                         <span className="font-bold">
                           "{diff.targetField}": &#123; "source": <span className="text-slate-900">"{diff.sourceField}"</span>, "action": <span className="text-indigo-600">"{diff.diffType}"</span> &#125;,
                         </span>
                       </div>
                    )}
                    {codeFormat === 'typescript' && (
                       <div className="flex items-center gap-6">
                         <span className="text-slate-300 w-6 text-right select-none font-bold text-[10px]">{idx + 1}</span>
                         <span className="font-bold">
                           {diff.targetField}: <span className="text-slate-900">{diff.recommendedTransformation}</span>, <span className="text-slate-400 ml-4 font-normal">// Status: {diff.diffType}</span>
                         </span>
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/20" />
                  <span>Addition</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/20" />
                  <span>Removal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-md shadow-amber-500/20" />
                  <span>Drift</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-[11px] text-slate-600 font-black uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>AI Verified Logic</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
