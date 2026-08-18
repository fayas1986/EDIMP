import React, { useState } from 'react';
import { MappingRule, MaskingConfig, MaskingRuleType } from '../types';
import { DualMappingRule, MappingMode, MappingType, MigrationStrategyType } from '../types/dualMapping';
import { SOURCE_CUSTOMER_SCHEMA, TARGET_BC_CUSTOMER_SCHEMA } from '../data/mockData';
import { fetchAiFieldMapping } from '../services/aiService';
import { MigrationStrategyDecisionEngine } from './MigrationStrategyDecisionEngine';
import { CanonicalDataModelRepository } from './CanonicalDataModelRepository';
import { MappingTemplateManager } from './MappingTemplateManager';
import { ImportProfilesConfigurator } from './ImportProfilesConfigurator';
import { TransformationPipelineMonitor } from './TransformationPipelineMonitor';
import { MappingAnalyticsDashboard } from './MappingAnalyticsDashboard';
import {
  Workflow,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Settings2,
  Trash2,
  Plus,
  RefreshCw,
  Zap,
  Info,
  ShieldCheck,
  FileSpreadsheet,
  Building2,
  ShieldAlert,
  Lock,
  Eye,
  Sliders,
  X,
  FileText,
  Layers,
  Activity,
  SlidersHorizontal,
  Code2,
  GitCompare,
  History,
  Search,
  GitBranch,
  Save,
  Edit,
  Check,
  Calendar,
  User,
  Database,
  Copy,
  PlusCircle,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Percent,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MappingStudioViewProps {
  onProceedToValidation: () => void;
}

export function getMaskedSampleValue(sample: string, config?: MaskingConfig): string {
  if (!config || !config.isEnabled || config.ruleType === 'None') return sample;
  const char = config.customMaskChar || '*';
  const visible = config.visibleCharacters ?? 4;

  switch (config.ruleType) {
    case 'FullRedact':
      return '[REDACTED_PII]';
    case 'HashSHA256':
      return 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    case 'Tokenize':
      return 'tok_sec_9f82a1b4-28c4-4b89-a93e-7f01a392810f';
    case 'Truncate':
      return sample.length > visible ? sample.substring(0, visible) + '...' : sample;
    case 'PartialMask':
      if (config.maskPosition === 'EmailDomainPreserve' && sample.includes('@')) {
        const [user, domain] = sample.split('@');
        const maskedUser = user.length <= 2 ? user[0] + '***' : user.substring(0, 2) + char.repeat(Math.max(3, user.length - 2));
        return `${maskedUser}@${domain}`;
      }
      if (config.maskPosition === 'FirstN') {
        const maskedLen = Math.max(0, sample.length - visible);
        return sample.substring(0, visible) + char.repeat(maskedLen);
      }
      const prefixLen = Math.max(0, sample.length - visible);
      return char.repeat(prefixLen) + sample.substring(prefixLen);
    default:
      return sample;
  }
}

const DEFAULT_SAMPLE_VALUES: Record<string, string> = {
  Cust_No: 'CUST-100482',
  Cust_Name: 'Acme Enterprise Global Corp',
  Street_Address_1: '742 Evergreen Terrace, Suite 400',
  City: 'San Francisco',
  State_Region: 'CA',
  Zip_Postal_Code: '94107',
  Contact_Phone: '+1-555-019-2831',
  Contact_Email: 'john.doe@acme-global.com',
  Tax_Registration_Number: 'US-98-7654321',
  Credit_Limit_Usd: '250000.00',
  Payment_Terms_Code: 'NET30',
};

export const MappingStudioView: React.FC<MappingStudioViewProps> = ({ onProceedToValidation }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'MAPPING_CANVAS' | 'STRATEGY_ENGINE' | 'CDM_REPOSITORY' | 'TEMPLATES' | 'IMPORT_PROFILES' | 'PIPELINE_INSPECTOR' | 'VERSION_CONTROL' | 'ANALYTICS'
  >('MAPPING_CANVAS');

  const [activeMode, setActiveMode] = useState<MappingMode>('SourceToDestination');
  const [activeStrategy, setActiveStrategy] = useState<MigrationStrategyType>('DirectMapping');
  const [isDashboardExpanded, setIsDashboardExpanded] = useState<boolean>(true);

  const [dualRules, setDualRules] = useState<DualMappingRule[]>([
    {
      id: 'm1',
      mode: 'SourceToDestination',
      mappingType: 'One-to-One',
      sourceFields: ['Cust_No'],
      targetFields: ['No.'],
      confidence: 0.98,
      isRequired: true,
      reasoning: 'Exact primary key customer account number match',
    },
    {
      id: 'm2',
      mode: 'SourceToDestination',
      mappingType: 'One-to-One',
      sourceFields: ['Cust_Name'],
      targetFields: ['Name'],
      confidence: 0.96,
      isRequired: true,
      reasoning: 'Direct match for Customer Legal Name',
    },
    {
      id: 'm3',
      mode: 'SourceToCanonical',
      mappingType: 'Composite Mapping',
      sourceFields: ['First_Name', 'Last_Name'],
      canonicalField: 'CustomerName',
      targetFields: [],
      formulaExpression: "First_Name + ' ' + Last_Name",
      confidence: 0.95,
      isRequired: true,
      reasoning: 'Concatenating first & last name into CDM CustomerName',
    },
    {
      id: 'm4',
      mode: 'CanonicalToDestination',
      mappingType: 'Lookup Mapping',
      sourceFields: [],
      canonicalField: 'PaymentTerms',
      targetFields: ['Payment Terms Code'],
      lookupTableId: 'PAYMENT_TERMS_REF',
      confidence: 0.92,
      isRequired: false,
      reasoning: 'Lookup mapping from CDM PaymentTerms code to BC target',
    },
    {
      id: 'm5',
      mode: 'SourceToDestination',
      mappingType: 'Conditional Mapping',
      sourceFields: ['Risk_Rating'],
      targetFields: ['Credit Limit (LCY)'],
      conditionExpression: "IF Risk_Rating == 'HIGH' THEN Credit_Limit * 0.5 ELSE Credit_Limit",
      confidence: 0.89,
      isRequired: false,
      reasoning: 'Conditional credit limit adjustment based on risk category',
    },
    {
      id: 'm6',
      mode: 'SourceToDestination',
      mappingType: 'Constant Value',
      sourceFields: [],
      targetFields: ['Gen. Bus. Posting Group'],
      constantValue: 'DOMESTIC',
      confidence: 1.0,
      isRequired: true,
      reasoning: 'Constant posting group assigned to domestic accounts',
    },
    {
      id: 'm7',
      mode: 'SourceToDestination',
      mappingType: 'One-to-One',
      sourceFields: ['Contact_Phone'],
      targetFields: ['Phone No.'],
      confidence: 0.90,
      isRequired: false,
      reasoning: 'Phone number normalization',
      maskingConfig: {
        isEnabled: true,
        ruleType: 'PartialMask',
        piiCategory: 'Phone',
        customMaskChar: '*',
        visibleCharacters: 4,
        maskPosition: 'LastN',
      },
    },
    {
      id: 'm8',
      mode: 'SourceToDestination',
      mappingType: 'One-to-One',
      sourceFields: ['Contact_Email'],
      targetFields: ['E-Mail'],
      confidence: 0.95,
      isRequired: false,
      reasoning: 'Email address field match',
      maskingConfig: {
        isEnabled: true,
        ruleType: 'PartialMask',
        piiCategory: 'Email',
        customMaskChar: '*',
        visibleCharacters: 2,
        maskPosition: 'EmailDomainPreserve',
      },
    },
  ]);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [overallConfidence, setOverallConfidence] = useState(0.94);
  const [selectedAiProvider, setSelectedAiProvider] = useState<'gemini' | 'openai' | 'anthropic' | 'kimi' | 'glm' | 'qwen'>('gemini');

  const MAPPING_AI_PROVIDERS = {
    gemini: { name: 'Google Gemini', defaultModel: 'Gemini 2.5 Flash' },
    openai: { name: 'OpenAI GPT', defaultModel: 'GPT-4o (Omni)' },
    anthropic: { name: 'Anthropic Claude', defaultModel: 'Claude 3.5 Sonnet' },
    kimi: { name: 'Moonshot Kimi', defaultModel: 'Kimi-Chat 200k' },
    glm: { name: 'Zhipu GLM', defaultModel: 'GLM-4-Plus' },
    qwen: { name: 'Alibaba Qwen', defaultModel: 'Qwen-2.5-72B' },
  };

  // Active Masking Configuration Drawer Modal State
  const [editingMaskRule, setEditingMaskRule] = useState<DualMappingRule | null>(null);
  const [tempMaskConfig, setTempMaskConfig] = useState<MaskingConfig>({
    isEnabled: true,
    ruleType: 'PartialMask',
    piiCategory: 'GeneralPII',
    customMaskChar: '*',
    visibleCharacters: 4,
    maskPosition: 'LastN',
  });

  // Enhanced Rule Editor Modal States
  const [isRuleEditorOpen, setIsRuleEditorOpen] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<'mapping' | 'transformations' | 'lookups' | 'business_rules' | 'calculated_fields' | 'conditional_mapping'>('mapping');
  const [selectedRule, setSelectedRule] = useState<DualMappingRule | null>(null);

  // New Lookup Rule edit helpers
  const [newLookupSource, setNewLookupSource] = useState('');
  const [newLookupTarget, setNewLookupTarget] = useState('');

  // New Business Rule edit helpers
  const [newBizRuleType, setNewBizRuleType] = useState<'Required' | 'RegexMatch' | 'MinLength' | 'MaxLength' | 'RangeMin' | 'RangeMax'>('Required');
  const [newBizRuleValue, setNewBizRuleValue] = useState('');
  const [newBizRuleSeverity, setNewBizRuleSeverity] = useState<'Warn' | 'Fail'>('Warn');

  // Version Control States
  const [versions, setVersions] = useState<any[]>([
    {
      id: 'ver-1',
      versionId: 'v1.0.0',
      title: 'Initial Direct ERP Mapping',
      description: 'Baseline field configuration mapping for core customer ledger accounts.',
      updatedAt: '2026-08-01T10:00:00Z',
      author: 'Alex Reed (Lead Architect)',
      rulesCount: 6,
      status: 'Archived',
      rules: [
        {
          id: 'm1',
          mode: 'SourceToDestination',
          mappingType: 'One-to-One',
          sourceFields: ['Cust_No'],
          targetFields: ['No.'],
          confidence: 0.98,
          isRequired: true,
          reasoning: 'Exact primary key customer account number match',
        },
        {
          id: 'm2',
          mode: 'SourceToDestination',
          mappingType: 'One-to-One',
          sourceFields: ['Cust_Name'],
          targetFields: ['Name'],
          confidence: 0.96,
          isRequired: true,
          reasoning: 'Direct match for Customer Legal Name',
        }
      ]
    },
    {
      id: 'ver-2',
      versionId: 'v1.1.0',
      title: 'Enforced Security Masking on PII Fields',
      description: 'Applied Deterministic Tokenization and Partial Masking rules to Contact Email and Phone numbers.',
      updatedAt: '2026-08-05T14:30:00Z',
      author: 'Sarah Lin (SecOps Lead)',
      rulesCount: 8,
      status: 'Approved',
      rules: [
        {
          id: 'm1',
          mode: 'SourceToDestination',
          mappingType: 'One-to-One',
          sourceFields: ['Cust_No'],
          targetFields: ['No.'],
          confidence: 0.98,
          isRequired: true,
          reasoning: 'Exact primary key customer account number match',
        },
        {
          id: 'm7',
          mode: 'SourceToDestination',
          mappingType: 'One-to-One',
          sourceFields: ['Contact_Phone'],
          targetFields: ['Phone No.'],
          confidence: 0.90,
          isRequired: false,
          reasoning: 'Phone number normalization',
          maskingConfig: {
            isEnabled: true,
            ruleType: 'PartialMask',
            piiCategory: 'Phone',
            customMaskChar: '*',
            visibleCharacters: 4,
            maskPosition: 'LastN',
          },
        }
      ]
    },
    {
      id: 'ver-3',
      versionId: 'v1.2.0',
      title: 'Optimized Lookup Codes & Risk Mapping',
      description: 'Configured cross-walk codes for NET30 / NET60 and risk category conditional mappings.',
      updatedAt: '2026-08-08T09:15:00Z',
      author: 'David Kim (Data Engineer)',
      rulesCount: 8,
      status: 'Published',
      rules: [
        {
          id: 'm1',
          mode: 'SourceToDestination',
          mappingType: 'One-to-One',
          sourceFields: ['Cust_No'],
          targetFields: ['No.'],
          confidence: 0.98,
          isRequired: true,
          reasoning: 'Exact primary key customer account number match',
        },
        {
          id: 'm4',
          mode: 'SourceToDestination',
          mappingType: 'Lookup Mapping',
          sourceFields: ['Payment_Terms_Code'],
          targetFields: ['Payment Terms Code'],
          confidence: 0.94,
          isRequired: true,
          reasoning: 'Lookup mapping for payment terms cross-walk',
          lookupConfig: {
            sourceValue: 'NET30',
            targetValue: 'N30',
          },
        },
        {
          id: 'm8',
          mode: 'SourceToDestination',
          mappingType: 'Conditional Mapping',
          sourceFields: ['Credit_Limit_Usd'],
          targetFields: ['Customer Posting Group'],
          confidence: 0.88,
          isRequired: false,
          reasoning: 'Risk-based posting group assignment',
          conditionExpression: 'Credit_Limit_Usd > 100000 ? "PREMIUM" : "STANDARD"',
        },
      ]
    }
  ]);
  const [newVersionTitle, setNewVersionTitle] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [comparingVersion, setComparingVersion] = useState<any | null>(null);

  const handleRunAiAutoMap = async () => {
    setIsAiLoading(true);
    try {
      const activeInfo = MAPPING_AI_PROVIDERS[selectedAiProvider];
      const result = await fetchAiFieldMapping(
        SOURCE_CUSTOMER_SCHEMA.fields,
        TARGET_BC_CUSTOMER_SCHEMA.fields,
        SOURCE_CUSTOMER_SCHEMA.name,
        TARGET_BC_CUSTOMER_SCHEMA.name,
        selectedAiProvider,
        activeInfo.defaultModel
      );

      if (result.success && result.mappings && result.mappings.length > 0) {
        const newRules: DualMappingRule[] = result.mappings.map((m, idx) => ({
          id: `ai-m-${idx + 1}`,
          mode: activeMode,
          mappingType: 'One-to-One',
          sourceFields: [m.sourceField],
          targetFields: [m.targetField],
          confidence: m.confidence || 0.9,
          reasoning: m.reasoning || `AI Auto-Mapped via ${activeInfo.name} (${activeInfo.defaultModel})`,
          isRequired: m.targetField === 'No.' || m.targetField === 'Name',
        }));
        setDualRules((prev) => [...newRules, ...prev]);
        setOverallConfidence(result.overallConfidence || 0.95);
      }
    } catch (err) {
      console.warn('AI Mapping error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddRule = () => {
    const createdRule: DualMappingRule = {
      id: `m-custom-${Date.now()}`,
      mode: activeMode,
      mappingType: 'One-to-One',
      sourceFields: ['Cust_No'],
      targetFields: ['No.'],
      confidence: 1.0,
      isRequired: false,
      reasoning: 'Manually added mapping rule in Dual Mapping Engine',
      transformations: [],
      lookups: [],
      businessRules: [],
      calculatedFormula: '',
      conditionalMapping: [{ field: 'Risk_Rating', operator: '==', value: 'HIGH', thenVal: 'Credit_Limit * 0.5', elseVal: 'Credit_Limit' }]
    };
    setDualRules((prev) => [createdRule, ...prev]);
    setSelectedRule(createdRule);
    setIsRuleEditorOpen(true);
    setActiveEditorTab('mapping');
  };

  const handleUpdateRuleType = (id: string, newType: MappingType) => {
    setDualRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, mappingType: newType } : r))
    );
  };

  const handleRemoveRule = (id: string) => {
    setDualRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleOpenMaskingModal = (rule: DualMappingRule) => {
    setEditingMaskRule(rule);
    setTempMaskConfig(
      rule.maskingConfig || {
        isEnabled: true,
        ruleType: 'PartialMask',
        piiCategory: 'GeneralPII',
        customMaskChar: '*',
        visibleCharacters: 4,
        maskPosition: 'LastN',
      }
    );
  };

  const handleSaveMaskingConfig = () => {
    if (!editingMaskRule) return;
    setDualRules((prev) =>
      prev.map((m) =>
        m.id === editingMaskRule.id ? { ...m, maskingConfig: { ...tempMaskConfig } } : m
      )
    );
    setEditingMaskRule(null);
  };

  const handleSaveEditedRule = () => {
    if (!selectedRule) return;
    setDualRules((prev) =>
      prev.map((r) => (r.id === selectedRule.id ? { ...selectedRule } : r))
    );
    setIsRuleEditorOpen(false);
    setSelectedRule(null);
  };

  const simulateTransformations = (sampleValue: string, transformations?: any[]): string => {
    if (!transformations || transformations.length === 0) return sampleValue;
    let current = sampleValue;
    transformations.forEach(t => {
      if (t.type === 'Uppercase') {
        current = current.toUpperCase();
      } else if (t.type === 'Lowercase') {
        current = current.toLowerCase();
      } else if (t.type === 'Trim') {
        current = current.trim();
      } else if (t.type === 'Prefix') {
        current = (t.param || '') + current;
      } else if (t.type === 'Suffix') {
        current = current + (t.param || '');
      } else if (t.type === 'Replace') {
        const parts = (t.param || '').split('->');
        if (parts.length === 2) {
          current = current.replaceAll(parts[0], parts[1]);
        } else {
          current = current.replaceAll(t.param || '', '');
        }
      }
    });
    return current;
  };

  const filteredRulesByMode = dualRules.filter((r) => r.mode === activeMode);
  const maskedCount = dualRules.filter((m) => m.maskingConfig?.isEnabled).length;

  // 1. Mapping Type Distribution Calculations
  const directCount = dualRules.filter(r => ['One-to-One', 'One-to-Many', 'Many-to-One'].includes(r.mappingType)).length;
  const conditionalCount = dualRules.filter(r => r.mappingType === 'Conditional Mapping').length;
  const calculatedCount = dualRules.filter(r => ['Formula Mapping', 'Composite Mapping'].includes(r.mappingType)).length;
  const lookupCount = dualRules.filter(r => r.mappingType === 'Lookup Mapping').length;
  const constantCount = dualRules.filter(r => ['Constant Value', 'Default Value'].includes(r.mappingType)).length;
  const totalRulesCount = dualRules.length;

  const directPct = totalRulesCount > 0 ? Math.round((directCount / totalRulesCount) * 100) : 0;
  const conditionalPct = totalRulesCount > 0 ? Math.round((conditionalCount / totalRulesCount) * 100) : 0;
  const calculatedPct = totalRulesCount > 0 ? Math.round((calculatedCount / totalRulesCount) * 100) : 0;
  const lookupPct = totalRulesCount > 0 ? Math.round((lookupCount / totalRulesCount) * 100) : 0;
  const constantPct = totalRulesCount > 0 ? Math.round((constantCount / totalRulesCount) * 100) : 0;

  // 2. Schema Field Coverage Calculations
  const mappedSourceFields = Array.from(new Set(dualRules.flatMap(r => r.sourceFields)));
  const mappedTargetFields = Array.from(new Set(dualRules.flatMap(r => r.targetFields)));

  const totalSourceFields = SOURCE_CUSTOMER_SCHEMA.fields.length;
  const totalTargetFields = TARGET_BC_CUSTOMER_SCHEMA.fields.length;

  const mappedSourceCount = SOURCE_CUSTOMER_SCHEMA.fields.filter(f => mappedSourceFields.includes(f.fieldName)).length;
  const mappedTargetCount = TARGET_BC_CUSTOMER_SCHEMA.fields.filter(f => mappedTargetFields.includes(f.fieldName)).length;

  const sourceCoverage = totalSourceFields > 0 ? Math.round((mappedSourceCount / totalSourceFields) * 100) : 0;
  const targetCoverage = totalTargetFields > 0 ? Math.round((mappedTargetCount / totalTargetFields) * 100) : 0;
  const averageCoverage = Math.round((sourceCoverage + targetCoverage) / 2);

  const unmappedSourceFields = SOURCE_CUSTOMER_SCHEMA.fields.filter(f => !mappedSourceFields.includes(f.fieldName));
  const unmappedTargetFields = TARGET_BC_CUSTOMER_SCHEMA.fields.filter(f => !mappedTargetFields.includes(f.fieldName));

  const suggestions = [
    { src: 'Street_Address_1', dest: 'Address', label: 'Street_Address_1 → Address' },
    { src: 'State_Region', dest: 'County', label: 'State_Region → County' },
    { src: 'Zip_Postal_Code', dest: 'Post Code', label: 'Zip_Postal_Code → Post Code' },
    { src: 'Country_Iso2', dest: 'Country/Region Code', label: 'Country_Iso2 → Country/Region Code' },
    { src: 'Tax_Registration_Number', dest: 'VAT Registration No.', label: 'Tax_Registration_Number → VAT Registration No.' },
    { src: 'Credit_Limit_Usd', dest: 'Credit Limit (LCY)', label: 'Credit_Limit_Usd → Credit Limit (LCY)' },
    { src: 'Payment_Terms_Code', dest: 'Payment Terms Code', label: 'Payment_Terms_Code → Payment Terms Code' },
    { src: 'Salesperson_Code', dest: 'Salesperson Code', label: 'Salesperson_Code → Salesperson Code' },
  ].filter(
    s => unmappedSourceFields.some(f => f.fieldName === s.src) &&
         unmappedTargetFields.some(f => f.fieldName === s.dest)
  );

  // Dynamic quick mapping suggestion generator
  const handleQuickMap = (source: string, target: string) => {
    const createdRule: DualMappingRule = {
      id: `m-custom-${Date.now()}`,
      mode: activeMode,
      mappingType: 'One-to-One',
      sourceFields: [source],
      targetFields: [target],
      confidence: 1.0,
      isRequired: false,
      reasoning: `Quick-added suggestion: mapped ${source} to ${target}`,
      transformations: [],
      lookups: [],
      businessRules: [],
      calculatedFormula: '',
    };
    setDualRules((prev) => [createdRule, ...prev]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Primary Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
              Dual Mapping Engine Platform &bull; Direct &amp; CDM Strategies
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Workflow className="w-6 h-6 text-indigo-600" />
            Enterprise Dual Mapping Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supports Direct Entity Mapping and Canonical Data Model (CDM) mapping across heterogeneous enterprise source systems.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="map-proceed-validation-btn"
            onClick={onProceedToValidation}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <span>Proceed to Validation Rules</span>
          </button>
        </div>
      </div>

      {/* Main Dual Mapping Engine Sub-Tab Navigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-1 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('MAPPING_CANVAS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'MAPPING_CANVAS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Workflow className="w-4 h-4" />
          <span>1. Mapping Studio Canvas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('STRATEGY_ENGINE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'STRATEGY_ENGINE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>2. Strategy Engine</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CDM_REPOSITORY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'CDM_REPOSITORY'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3. CDM Repository (15 Entities)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('TEMPLATES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'TEMPLATES'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>4. Templates Manager</span>
        </button>

        <button
          onClick={() => setActiveSubTab('IMPORT_PROFILES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'IMPORT_PROFILES'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>5. Import Profiles</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PIPELINE_INSPECTOR')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'PIPELINE_INSPECTOR'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>6. 11-Stage Pipeline</span>
        </button>

        <button
          onClick={() => setActiveSubTab('VERSION_CONTROL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'VERSION_CONTROL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>7. Mapping Version Control</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ANALYTICS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'ANALYTICS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>8. Intelligence Analytics</span>
        </button>
      </div>

      {/* SUB-VIEW 1: MAPPING CANVAS & STUDIO */}
      {activeSubTab === 'MAPPING_CANVAS' && (
        <div className="space-y-6">
          {/* Overview Stat Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Source Entity</span>
                <p className="text-xs font-bold text-slate-900 truncate" title={SOURCE_CUSTOMER_SCHEMA.name}>{SOURCE_CUSTOMER_SCHEMA.name}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Destination ERP Entity</span>
                <p className="text-xs font-bold text-slate-900 truncate" title={TARGET_BC_CUSTOMER_SCHEMA.name}>{TARGET_BC_CUSTOMER_SCHEMA.name}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Overall Mapping Accuracy</span>
                <p className="text-xs font-bold text-slate-900 font-mono">
                  {Math.round(overallConfidence * 100)}% ({dualRules.length} Rules)
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">PII Security Masking</span>
                <p className="text-xs font-bold text-slate-900 font-mono">
                  {maskedCount} / {dualRules.length} Masked
                </p>
              </div>
            </div>
          </div>

          {/* Mapping Analytics & Schema Coverage Dashboard */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div 
              onClick={() => setIsDashboardExpanded(!isDashboardExpanded)}
              className="p-5 flex items-center justify-between border-b border-slate-100 cursor-pointer hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Mapping Analytics &amp; Schema Coverage Dashboard</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
                      {averageCoverage}% Total Coverage
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Live analysis of rule distributions, completeness checks, and click-to-map optimization recommendations.
                  </p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer">
                {isDashboardExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {isDashboardExpanded && (
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/30">
                {/* Column 1: Mapping Type Distribution */}
                <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <PieChart className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mapping Type Distribution</h4>
                  </div>

                  {totalRulesCount === 0 ? (
                    <div className="text-center py-10 text-slate-400 italic text-xs">
                      No active rules defined yet. Add some rules to see analytics.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Interactive Stacked Multi-Segment Bar */}
                      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        {directPct > 0 && (
                          <div 
                            style={{ width: `${directPct}%` }} 
                            className="bg-emerald-500 h-full transition-all duration-300" 
                            title={`Direct Mapping: ${directPct}% (${directCount} rules)`}
                          />
                        )}
                        {conditionalPct > 0 && (
                          <div 
                            style={{ width: `${conditionalPct}%` }} 
                            className="bg-amber-500 h-full transition-all duration-300" 
                            title={`Conditional Mapping: ${conditionalPct}% (${conditionalCount} rules)`}
                          />
                        )}
                        {calculatedPct > 0 && (
                          <div 
                            style={{ width: `${calculatedPct}%` }} 
                            className="bg-purple-500 h-full transition-all duration-300" 
                            title={`Calculated / Formulas: ${calculatedPct}% (${calculatedCount} rules)`}
                          />
                        )}
                        {lookupPct > 0 && (
                          <div 
                            style={{ width: `${lookupPct}%` }} 
                            className="bg-blue-500 h-full transition-all duration-300" 
                            title={`Lookup Mapping: ${lookupPct}% (${lookupCount} rules)`}
                          />
                        )}
                        {constantPct > 0 && (
                          <div 
                            style={{ width: `${constantPct}%` }} 
                            className="bg-slate-400 h-full transition-all duration-300" 
                            title={`Constants / Defaults: ${constantPct}% (${constantCount} rules)`}
                          />
                        )}
                      </div>

                      {/* Legends & Progress Rows */}
                      <div className="space-y-3.5 text-xs">
                        {/* Direct row */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                              Direct Mapping (1:1, 1:N, N:1)
                            </span>
                            <span className="font-mono text-slate-500">{directCount} rules ({directPct}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div style={{ width: `${directPct}%` }} className="bg-emerald-500 h-full rounded-full transition-all" />
                          </div>
                        </div>

                        {/* Conditional row */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                              Conditional Mapping
                            </span>
                            <span className="font-mono text-slate-500">{conditionalCount} rules ({conditionalPct}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div style={{ width: `${conditionalPct}%` }} className="bg-amber-500 h-full rounded-full transition-all" />
                          </div>
                        </div>

                        {/* Calculated row */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <span className="w-2.5 h-2.5 rounded bg-purple-500" />
                              Calculated Fields &amp; Formulas
                            </span>
                            <span className="font-mono text-slate-500">{calculatedCount} rules ({calculatedPct}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div style={{ width: `${calculatedPct}%` }} className="bg-purple-500 h-full rounded-full transition-all" />
                          </div>
                        </div>

                        {/* Lookup row */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                              Lookup Crosswalks
                            </span>
                            <span className="font-mono text-slate-500">{lookupCount} rules ({lookupPct}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div style={{ width: `${lookupPct}%` }} className="bg-blue-500 h-full rounded-full transition-all" />
                          </div>
                        </div>

                        {/* Constant/Default row */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <span className="w-2.5 h-2.5 rounded bg-slate-400" />
                              Constants &amp; Fallback Defaults
                            </span>
                            <span className="font-mono text-slate-500">{constantCount} rules ({constantPct}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div style={{ width: `${constantPct}%` }} className="bg-slate-400 h-full rounded-full transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 2: Coverage & Recommendations */}
                <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Schema Field Coverage</h4>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Total Fields: {totalSourceFields} Src / {totalTargetFields} Dest</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Source Coverage Bar */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide block">Source Field Coverage</span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-bold font-mono text-slate-800">{sourceCoverage}%</span>
                          <span className="text-xs text-slate-500 font-mono">({mappedSourceCount} / {totalSourceFields} mapped)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div style={{ width: `${sourceCoverage}%` }} className="bg-indigo-600 h-full rounded-full transition-all" />
                        </div>
                      </div>

                      {/* Destination Coverage Bar */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide block">Destination Field Coverage</span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-bold font-mono text-slate-800">{targetCoverage}%</span>
                          <span className="text-xs text-slate-500 font-mono">({mappedTargetCount} / {totalTargetFields} mapped)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div style={{ width: `${targetCoverage}%` }} className="bg-indigo-600 h-full rounded-full transition-all" />
                        </div>
                      </div>
                    </div>

                    {/* Coverage optimization insights */}
                    <div className="p-3.5 rounded-xl border flex gap-3 text-xs leading-relaxed transition-colors duration-150 bg-slate-50 border-slate-200">
                      <div className="mt-0.5">
                        {averageCoverage < 50 ? (
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-50 text-rose-600">
                            <AlertCircle className="w-4 h-4" />
                          </span>
                        ) : averageCoverage < 80 ? (
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-50 text-amber-600">
                            <Info className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        {averageCoverage < 50 ? (
                          <div>
                            <span className="font-bold text-rose-950 uppercase tracking-wide text-[10px] block">⚠️ Low Coverage Warning</span>
                            <p className="text-slate-600 mt-0.5">
                              Less than 50% of your schema fields have mapping rules. Direct transfer may experience errors due to unmapped mandatory ERP inputs like <strong className="font-mono text-slate-800">No.</strong> or <strong className="font-mono text-slate-800">Name</strong>.
                            </p>
                          </div>
                        ) : averageCoverage < 80 ? (
                          <div>
                            <span className="font-bold text-amber-950 uppercase tracking-wide text-[10px] block">⚡ Good Progress</span>
                            <p className="text-slate-600 mt-0.5">
                              Over half of your legacy fields are successfully matched. Review cross-walk lookups or conditional formulas to bridge any remaining field gaps.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-emerald-950 uppercase tracking-wide text-[10px] block">🎉 Highly Robust Mapping Schema</span>
                            <p className="text-slate-600 mt-0.5">
                              Outstanding! More than 80% of your source and destination schema fields are mapped. Your data pipeline is highly stable and prepared for production validation.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Suggestion / Unmapped Interactive List */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Smart Auto-Map Suggestions ({suggestions.length})</span>
                    {suggestions.length === 0 ? (
                      <div className="text-slate-400 italic text-[11px]">
                        No matching unmapped schema names found. Schema optimization is maximized!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[110px] overflow-y-auto pr-1">
                        {suggestions.map((s) => (
                          <div key={s.src} className="flex items-center justify-between p-2 bg-indigo-50/50 border border-indigo-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-[11px]">
                            <span className="font-mono text-indigo-950 truncate max-w-[80%]" title={s.label}>{s.label}</span>
                            <button
                              type="button"
                              onClick={() => handleQuickMap(s.src, s.dest)}
                              className="p-1 bg-white hover:bg-indigo-600 hover:text-white rounded-md border border-indigo-200 text-indigo-600 transition-all cursor-pointer flex items-center justify-center"
                              title="Click to automatically map these fields"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mapping Mode Selection Bar (Mode 1, Mode 2, Mode 3) - Polished Light Theme */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                <Sliders className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                Select Mapping Mode
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto p-1 bg-slate-50 border border-slate-100 rounded-xl">
              <button
                onClick={() => setActiveMode('SourceToDestination')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  activeMode === 'SourceToDestination'
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                Mode 1: Source &rarr; Destination
              </button>

              <button
                onClick={() => setActiveMode('SourceToCanonical')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  activeMode === 'SourceToCanonical'
                    ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-500'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                Mode 2: Source &rarr; Canonical
              </button>

              <button
                onClick={() => setActiveMode('CanonicalToDestination')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  activeMode === 'CanonicalToDestination'
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                Mode 3: Canonical &rarr; Destination
              </button>
            </div>
          </div>

          {/* Main Field Mapping Canvas Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-3 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-indigo-600" />
                  Configured Dual Mapping Rules ({filteredRulesByMode.length} active in {activeMode})
                </h2>
                <p className="text-xs text-slate-500">
                  Supports 9 Mapping Types: 1:1, 1:Many, Many:1, Constant, Default, Lookup, Conditional, Formula, Composite.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAddRule}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Mapping Rule</span>
                </button>

                {/* AI Model Engine Selector */}
                <select
                  value={selectedAiProvider}
                  onChange={(e: any) => setSelectedAiProvider(e.target.value)}
                  className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="gemini">Google Gemini (Gemini 2.5 Flash)</option>
                  <option value="openai">OpenAI GPT (GPT-4o Omni)</option>
                  <option value="anthropic">Anthropic Claude (Claude 3.5 Sonnet)</option>
                  <option value="kimi">Moonshot Kimi (Kimi-Chat 200k)</option>
                  <option value="glm">Zhipu GLM (GLM-4-Plus)</option>
                  <option value="qwen">Alibaba Qwen (Qwen-2.5-72B)</option>
                </select>

                <button
                  id="map-run-ai-btn"
                  onClick={handleRunAiAutoMap}
                  disabled={isAiLoading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isAiLoading ? 'animate-spin' : ''}`} />
                  <span>{isAiLoading ? 'AI Mapping...' : `Auto-Map (${MAPPING_AI_PROVIDERS[selectedAiProvider].name.split(' ')[0]})`}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Source Field(s)</th>
                    <th className="py-3 px-4">Mapping Type</th>
                    <th className="py-3 px-4">Target / CDM Field</th>
                    <th className="py-3 px-4">Expression / Value</th>
                    <th className="py-3 px-4">Security Masking (PII)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-mono">
                  {filteredRulesByMode.map((rule) => {
                    const mask = rule.maskingConfig;
                    const sampleRaw = DEFAULT_SAMPLE_VALUES[rule.sourceFields[0]] || 'SAMPLE_DATA_123';
                    const sampleMasked = getMaskedSampleValue(sampleRaw, mask);

                    return (
                      <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{rule.sourceFields.join(' + ') || '(No Source Field)'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={rule.mappingType}
                            onChange={(e) => handleUpdateRuleType(rule.id, e.target.value as any)}
                            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-indigo-900 font-bold focus:outline-none"
                          >
                            <option value="One-to-One">One-to-One (1:1)</option>
                            <option value="One-to-Many">One-to-Many (1:N)</option>
                            <option value="Many-to-One">Many-to-One (N:1)</option>
                            <option value="Constant Value">Constant Value</option>
                            <option value="Default Value">Default Value</option>
                            <option value="Lookup Mapping">Lookup Mapping</option>
                            <option value="Conditional Mapping">Conditional Mapping</option>
                            <option value="Formula Mapping">Formula Mapping</option>
                            <option value="Composite Mapping">Composite Mapping</option>
                          </select>
                        </td>

                        <td className="py-3 px-4 font-bold text-indigo-950">
                          {activeMode === 'SourceToCanonical'
                            ? rule.canonicalField || 'CustomerName'
                            : rule.targetFields.join(', ') || 'No.'}
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-sans text-[11px]">
                          {rule.formulaExpression && (
                            <span className="font-mono bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200 block truncate">
                              Formula: {rule.formulaExpression}
                            </span>
                          )}
                          {rule.conditionExpression && (
                            <span className="font-mono bg-purple-50 text-purple-900 px-1.5 py-0.5 rounded border border-purple-200 block truncate">
                              If: {rule.conditionExpression}
                            </span>
                          )}
                          {rule.constantValue && (
                            <span className="font-mono bg-emerald-50 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-200 block">
                              Const: '{rule.constantValue}'
                            </span>
                          )}
                          {!rule.formulaExpression && !rule.conditionExpression && !rule.constantValue && (
                            <span>Direct Transfer</span>
                          )}
                        </td>

                        {/* Security Masking Cell */}
                        <td className="py-3 px-4 font-sans">
                          <button
                            type="button"
                            onClick={() => handleOpenMaskingModal(rule)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                              mask?.isEnabled
                                ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-bold'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {mask?.isEnabled ? (
                              <>
                                <Lock className="w-3.5 h-3.5 text-purple-600" />
                                <span>Masked ({mask.piiCategory || 'PII'})</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                                <span>+ Mask PII</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right flex items-center justify-end gap-1">
                          <button
                            title="Edit Advanced Rules"
                            onClick={() => {
                              setSelectedRule({ ...rule });
                              setIsRuleEditorOpen(true);
                              if (rule.mappingType === 'Lookup Mapping') {
                                setActiveEditorTab('lookups');
                              } else if (rule.mappingType === 'Conditional Mapping') {
                                setActiveEditorTab('conditional_mapping');
                              } else if (rule.mappingType === 'Formula Mapping') {
                                setActiveEditorTab('calculated_fields');
                              } else {
                                setActiveEditorTab('mapping');
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveRule(rule.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: MIGRATION STRATEGY ENGINE */}
      {activeSubTab === 'STRATEGY_ENGINE' && (
        <MigrationStrategyDecisionEngine
          currentStrategy={activeStrategy}
          onStrategySelect={(stg) => setActiveStrategy(stg)}
        />
      )}

      {/* SUB-VIEW 3: CDM REPOSITORY */}
      {activeSubTab === 'CDM_REPOSITORY' && <CanonicalDataModelRepository />}

      {/* SUB-VIEW 4: TEMPLATES MANAGER */}
      {activeSubTab === 'TEMPLATES' && <MappingTemplateManager />}

      {/* SUB-VIEW 5: IMPORT PROFILES */}
      {activeSubTab === 'IMPORT_PROFILES' && <ImportProfilesConfigurator />}

      {/* SUB-VIEW 6: 11-STAGE PIPELINE INSPECTOR */}
      {activeSubTab === 'PIPELINE_INSPECTOR' && <TransformationPipelineMonitor />}

      {/* SUB-VIEW 7: MAPPING VERSION CONTROL */}
      {activeSubTab === 'VERSION_CONTROL' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Snapshot Repository Header - Polished White Theme */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm shrink-0">
                <GitBranch className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Mapping Rule Snapshot Repository</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Save, compare, or rollback to historical mapping versions to coordinate updates across deployments.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl shadow-inner shrink-0">
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Active Rules in Canvas</div>
              <div className="text-sm font-black text-indigo-700 font-mono">{dualRules.length} Rules</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel: Historical snapshot list */}
            <div className="col-span-1 lg:col-span-8 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Version Snapshots Timeline</h4>

              <div className="space-y-3.5">
                {versions.map((ver) => (
                  <div key={ver.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-mono font-bold rounded-lg">
                            {ver.versionId}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">{ver.title}</h4>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            ver.status === 'Published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ver.status === 'Approved'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {ver.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{ver.description}</p>
                      </div>

                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono whitespace-nowrap">
                        <Calendar className="w-3 h-3" />
                        {new Date(ver.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-3 border-t border-slate-100 text-slate-600 gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Author: <strong>{ver.author}</strong></span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="w-3.5 h-3.5 text-slate-400" />
                          <span>Rules: <strong>{ver.rulesCount} Configured</strong></span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setComparingVersion(ver)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-xl transition-all cursor-pointer"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                          <span>Compare Diff</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!ver.rules || ver.rules.length === 0) {
                              alert('This version snapshot contains no rule data to rollback to.');
                              return;
                            }
                            
                            // Simulate a "Real-time" checkout process
                            const btn = document.activeElement as HTMLButtonElement;
                            const originalContent = btn.innerHTML;
                            btn.innerHTML = '<span class="animate-spin mr-1">⌛</span> Checking out...';
                            btn.disabled = true;

                            setTimeout(() => {
                              // 1. Restore the rules
                              setDualRules(JSON.parse(JSON.stringify(ver.rules)));
                              
                              // 2. Intelligently switch to the most relevant mode for this snapshot
                              if (ver.rules[0]?.mode) {
                                setActiveMode(ver.rules[0].mode as MappingMode);
                              }
                              
                              // 3. Switch back to the Mapping Canvas to see the results
                              setActiveSubTab('MAPPING_CANVAS');
                              
                              // Reset button
                              btn.innerHTML = originalContent;
                              btn.disabled = false;
                              
                              // Visual confirmation
                              const notification = document.createElement('div');
                              notification.className = 'fixed bottom-4 right-4 bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-[9999] animate-in slide-in-from-bottom duration-300 flex items-center gap-3 font-bold border border-indigo-400';
                              notification.innerHTML = `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg> Checked out ${ver.versionId} successfully!`;
                              document.body.appendChild(notification);
                              
                              setTimeout(() => {
                                notification.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom');
                                setTimeout(() => notification.remove(), 300);
                              }, 3000);
                            }, 800);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Checkout / Rollback</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel: Save current canvas snapshot */}
            <div className="col-span-1 lg:col-span-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 h-fit">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Save className="w-4 h-4 text-indigo-600" />
                  Save Rule Snapshot
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Clone current canvas rules state into a durable local repository version snapshot.
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Target Version ID:</label>
                  <input
                    type="text"
                    placeholder="e.g. v1.3.0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 font-bold focus:outline-none focus:border-slate-300"
                    id="new-version-id"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Snapshot Title:</label>
                  <input
                    type="text"
                    value={newVersionTitle}
                    onChange={(e) => setNewVersionTitle(e.target.value)}
                    placeholder="e.g. Applied Netsuite Net60 Terms"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-sans focus:outline-none focus:border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Description / Changelog:</label>
                  <textarea
                    rows={3}
                    value={newVersionDesc}
                    onChange={(e) => setNewVersionDesc(e.target.value)}
                    placeholder="Explain structural changes made to the mapping canvas..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-sans focus:outline-none focus:border-slate-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const verIdInput = document.getElementById('new-version-id') as HTMLInputElement | null;
                    const verId = verIdInput?.value?.trim() || `v1.${versions.length + 1}.0`;
                    if (!newVersionTitle.trim()) {
                      alert('Please specify a title for your mapping rule snapshot.');
                      return;
                    }

                    const newSnapshot = {
                      id: `ver-custom-${Date.now()}`,
                      versionId: verId,
                      title: newVersionTitle.trim(),
                      description: newVersionDesc.trim() || 'No description provided.',
                      updatedAt: new Date().toISOString(),
                      author: 'Fayas Ahmed (Platform Owner)',
                      rulesCount: dualRules.length,
                      status: 'Draft',
                      rules: JSON.parse(JSON.stringify(dualRules))
                    };

                    setVersions((prev) => [newSnapshot, ...prev]);
                    setNewVersionTitle('');
                    setNewVersionDesc('');
                    if (verIdInput) verIdInput.value = '';
                    alert(`Success: Snapshot ${verId} created and saved in repository local storage.`);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Create Snapshot</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 8: MAPPING ANALYTICS DASHBOARD */}
      {activeSubTab === 'ANALYTICS' && (
        <MappingAnalyticsDashboard />
      )}

      {/* Interactive Rule Designer Modal */}
      {isRuleEditorOpen && selectedRule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl">
                  <Workflow className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Advanced Mapping Rule Designer</h3>
                  <p className="text-xs text-indigo-200">
                    Rule ID: <span className="font-mono text-amber-300">{selectedRule.id}</span> &bull; Mode: <span className="font-mono">{selectedRule.mode}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRuleEditorOpen(false);
                  setSelectedRule(null);
                }}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Left Nav + Right Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col gap-1 overflow-y-auto">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 px-2">Configuration Steps</span>
                
                <button
                  onClick={() => setActiveEditorTab('mapping')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    activeEditorTab === 'mapping'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Workflow className="w-4 h-4" />
                  <span>1. Source &amp; Destination</span>
                </button>

                <button
                  onClick={() => setActiveEditorTab('transformations')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    activeEditorTab === 'transformations'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>2. Transformation Rules</span>
                </button>

                <button
                  onClick={() => setActiveEditorTab('lookups')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    activeEditorTab === 'lookups'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>3. Lookup Crosswalks</span>
                </button>

                <button
                  onClick={() => setActiveEditorTab('business_rules')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    activeEditorTab === 'business_rules'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>4. Business Validations</span>
                </button>

                <button
                  onClick={() => setActiveEditorTab('calculated_fields')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    activeEditorTab === 'calculated_fields'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  <span>5. Calculated Fields</span>
                </button>

                <button
                  onClick={() => setActiveEditorTab('conditional_mapping')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    activeEditorTab === 'conditional_mapping'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>6. Conditional Logic</span>
                </button>

                {/* Info summary */}
                <div className="mt-auto bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 text-slate-600 text-[11px] space-y-1.5">
                  <div className="font-bold text-indigo-950 flex items-center gap-1 uppercase tracking-wider text-[9px]">
                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                    Live Helper
                  </div>
                  <p className="leading-relaxed">
                    This designer maps data values through our 11-stage pipeline, applying sanitizations and business constraints.
                  </p>
                </div>
              </div>

              {/* Main Content Pane */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {activeEditorTab === 'mapping' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-indigo-600" />
                        Source &amp; Destination Field Mapping
                      </h4>
                      <p className="text-xs text-slate-500">
                        Bind source database/file columns to the destination schema fields or Canonical Model representation.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Source Fields Config */}
                      <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <label className="text-xs font-bold text-slate-800 block uppercase tracking-wider">Source Fields Selection</label>
                        
                        <div className="space-y-2">
                          <span className="text-[11px] text-slate-400 block font-sans">
                            Select one or more fields from {SOURCE_CUSTOMER_SCHEMA.name}:
                          </span>
                          <div className="max-h-[180px] overflow-y-auto border border-slate-200 rounded-xl bg-white p-2.5 space-y-1.5">
                            {SOURCE_CUSTOMER_SCHEMA.fields.map((f) => {
                              const isSelected = selectedRule.sourceFields.includes(f.fieldName);
                              return (
                                <label key={f.fieldName} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        if (selectedRule.sourceFields.length > 1) {
                                          setSelectedRule({
                                            ...selectedRule,
                                            sourceFields: selectedRule.sourceFields.filter(sf => sf !== f.fieldName)
                                          });
                                        }
                                      } else {
                                        setSelectedRule({
                                          ...selectedRule,
                                          sourceFields: [...selectedRule.sourceFields, f.fieldName]
                                        });
                                      }
                                    }}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <div className="flex-1 flex items-center justify-between">
                                    <span className="text-slate-800">{f.fieldName}</span>
                                    <span className="text-[10px] text-slate-400 font-sans italic">({f.dataType})</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                          <span className="font-bold text-slate-800 block">Currently Selected:</span>
                          <p className="font-mono bg-slate-50 px-2 py-1 rounded border text-indigo-700 font-bold">
                            {selectedRule.sourceFields.join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Target Field Config */}
                      <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <label className="text-xs font-bold text-slate-800 block uppercase tracking-wider">
                          {selectedRule.mode === 'SourceToCanonical' ? 'Canonical CDM Field' : 'Destination ERP Field'}
                        </label>

                        {selectedRule.mode === 'SourceToCanonical' ? (
                          <div>
                            <label className="text-[11px] text-slate-500 block mb-1">CDM Attribute:</label>
                            <input
                              type="text"
                              value={selectedRule.canonicalField || ''}
                              onChange={(e) => setSelectedRule({ ...selectedRule, canonicalField: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-indigo-900 focus:outline-none"
                              placeholder="e.g. CustomerName"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="text-[11px] text-slate-500 block mb-1">Target ERP Field Selection:</label>
                            <select
                              value={selectedRule.targetFields[0] || ''}
                              onChange={(e) => setSelectedRule({ ...selectedRule, targetFields: [e.target.value] })}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-indigo-900 focus:outline-none"
                            >
                              {TARGET_BC_CUSTOMER_SCHEMA.fields.map((f) => (
                                <option key={f.fieldName} value={f.fieldName}>
                                  {f.fieldName} ({f.dataType}) {!f.isNullable ? '• Required' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Rule Mapping Type Selection */}
                        <div className="pt-2">
                          <label className="text-xs font-bold text-slate-800 block mb-1 uppercase tracking-wider">Mapping Mechanism</label>
                          <select
                            value={selectedRule.mappingType}
                            onChange={(e) => {
                              const newType = e.target.value as MappingType;
                              setSelectedRule({ ...selectedRule, mappingType: newType });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                          >
                            <option value="One-to-One">One-to-One Direct Transfer</option>
                            <option value="Constant Value">Constant Default String</option>
                            <option value="Default Value">Fallback Default Value</option>
                            <option value="Lookup Mapping">Lookup Cross-walk Translation</option>
                            <option value="Conditional Mapping">Conditional Mapping Rule</option>
                            <option value="Formula Mapping">Formula &amp; Calculated Field</option>
                            <option value="Composite Mapping">Composite Multi-Field Mapping</option>
                          </select>
                        </div>

                        {/* Constant / Default Inputs */}
                        {(selectedRule.mappingType === 'Constant Value' || selectedRule.mappingType === 'Default Value') && (
                          <div className="pt-2">
                            <label className="text-xs font-bold text-indigo-900 block mb-1">
                              {selectedRule.mappingType === 'Constant Value' ? 'Constant Value:' : 'Default Fallback Value:'}
                            </label>
                            <input
                              type="text"
                              value={selectedRule.constantValue || selectedRule.defaultValue || ''}
                              onChange={(e) => {
                                if (selectedRule.mappingType === 'Constant Value') {
                                  setSelectedRule({ ...selectedRule, constantValue: e.target.value, defaultValue: undefined });
                                } else {
                                  setSelectedRule({ ...selectedRule, defaultValue: e.target.value, constantValue: undefined });
                                }
                              }}
                              placeholder="e.g. DOMESTIC or US"
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-emerald-900 font-bold focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeEditorTab === 'transformations' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                          Transformation Rules Pipeline
                        </h4>
                        <p className="text-xs text-slate-500">
                          Apply progressive cleaning, case-casting, or format adjustments on this specific field.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const currentTransforms = selectedRule.transformations || [];
                          setSelectedRule({
                            ...selectedRule,
                            transformations: [...currentTransforms, { type: 'Uppercase' }]
                          });
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Transformation Step</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="col-span-1 md:col-span-7 space-y-3">
                        {(!selectedRule.transformations || selectedRule.transformations.length === 0) ? (
                          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 italic text-xs">
                            No active transformation rules. Values will pass through raw.
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {selectedRule.transformations.map((t, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="w-5 h-5 flex items-center justify-center bg-indigo-600 text-white font-mono text-[10px] font-bold rounded-full">
                                  {idx + 1}
                                </span>

                                <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5">Algorithm</label>
                                    <select
                                      value={t.type}
                                      onChange={(e) => {
                                        const newType = e.target.value as any;
                                        const copy = [...(selectedRule.transformations || [])];
                                        copy[idx] = { ...copy[idx], type: newType };
                                        setSelectedRule({ ...selectedRule, transformations: copy });
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-mono font-bold text-slate-800 focus:outline-none"
                                    >
                                      <option value="Uppercase">Uppercase</option>
                                      <option value="Lowercase">Lowercase</option>
                                      <option value="Trim">Trim Whitespace</option>
                                      <option value="Prefix">Add Prefix</option>
                                      <option value="Suffix">Add Suffix</option>
                                      <option value="Replace">Replace Value</option>
                                    </select>
                                  </div>

                                  {(t.type === 'Prefix' || t.type === 'Suffix' || t.type === 'Replace') && (
                                    <div>
                                      <label className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5">Parameter</label>
                                      <input
                                        type="text"
                                        value={t.param || ''}
                                        onChange={(e) => {
                                          const copy = [...(selectedRule.transformations || [])];
                                          copy[idx] = { ...copy[idx], param: e.target.value };
                                          setSelectedRule({ ...selectedRule, transformations: copy });
                                        }}
                                        placeholder={t.type === 'Replace' ? 'find->replace' : 'e.g. CUST-'}
                                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-mono focus:outline-none"
                                      />
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const copy = [...(selectedRule.transformations || [])];
                                    copy.splice(idx, 1);
                                    setSelectedRule({ ...selectedRule, transformations: copy });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="col-span-1 md:col-span-5 p-4 bg-indigo-50/35 rounded-2xl border border-indigo-100 space-y-4">
                        <h5 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          Live Simulator Preview
                        </h5>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          See the real-time outcome of this transformation pipeline using a representative database mock record.
                        </p>

                        <div className="space-y-3 font-mono text-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 block font-sans">Raw Source Value:</span>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800 break-all font-bold">
                              "{DEFAULT_SAMPLE_VALUES[selectedRule.sourceFields[0]] || 'Acme Enterprise Global Corp'}"
                            </div>
                          </div>

                          <div className="flex justify-center my-1 text-slate-300">
                            <ArrowRight className="w-5 h-5 rotate-90" />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-indigo-500 block font-sans font-bold">Transformed Output Payload:</span>
                            <div className="bg-indigo-950 text-indigo-300 p-3 rounded-xl border border-indigo-850 break-all font-bold">
                              "{simulateTransformations(
                                DEFAULT_SAMPLE_VALUES[selectedRule.sourceFields[0]] || 'Acme Enterprise Global Corp',
                                selectedRule.transformations
                              )}"
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeEditorTab === 'lookups' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Search className="w-4 h-4 text-indigo-600" />
                        Lookup Tables &amp; Cross-walk Code Maps
                      </h4>
                      <p className="text-xs text-slate-500">
                        Translate source-system legacy code values to target-system standard entries (e.g. NET30 to N30).
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Lookup Catalog Reference ID</label>
                          <input
                            type="text"
                            value={selectedRule.lookupTableId || ''}
                            onChange={(e) => setSelectedRule({ ...selectedRule, lookupTableId: e.target.value })}
                            placeholder="e.g. PAYMENT_TERMS_REF"
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono font-bold focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Unmatched Fallback Behavior</label>
                          <select
                            value={selectedRule.lookupFallback || 'Pass-through'}
                            onChange={(e) => setSelectedRule({ ...selectedRule, lookupFallback: e.target.value as any })}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono focus:outline-none"
                          >
                            <option value="Pass-through">Pass-through Raw Value</option>
                            <option value="Default">Use Default Constant Fallback</option>
                            <option value="Fail">Halt &amp; Report Validation Failure</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="col-span-1 md:col-span-7 space-y-3">
                          <label className="text-xs font-bold text-slate-800 block uppercase tracking-wider">Defined Translations</label>
                          
                          {(!selectedRule.lookups || selectedRule.lookups.length === 0) ? (
                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 italic text-xs">
                              No custom lookup translations configured. Values pass through unaltered.
                            </div>
                          ) : (
                            <div className="max-h-[220px] overflow-y-auto border border-slate-200 rounded-2xl bg-white divide-y divide-slate-100 text-xs font-mono">
                              {selectedRule.lookups.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3.5 hover:bg-slate-50">
                                  <div className="flex items-center gap-4">
                                    <span className="font-bold text-slate-800">Source: "{item.source}"</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-bold text-indigo-700">Target: "{item.target}"</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const copy = [...(selectedRule.lookups || [])];
                                      copy.splice(idx, 1);
                                      setSelectedRule({ ...selectedRule, lookups: copy });
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="col-span-1 md:col-span-5 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/60 space-y-3 text-xs">
                          <span className="font-bold text-indigo-950 uppercase tracking-wider block">Add Code Translation</span>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="text-slate-600 mb-0.5 block font-medium">Source Legacy Code:</label>
                              <input
                                type="text"
                                value={newLookupSource}
                                onChange={(e) => setNewLookupSource(e.target.value)}
                                placeholder="e.g. NET30"
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-slate-600 mb-0.5 block font-medium">Target Standard Code:</label>
                              <input
                                type="text"
                                value={newLookupTarget}
                                onChange={(e) => setNewLookupTarget(e.target.value)}
                                placeholder="e.g. N30"
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono font-bold focus:outline-none"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (!newLookupSource.trim() || !newLookupTarget.trim()) return;
                                const current = selectedRule.lookups || [];
                                setSelectedRule({
                                  ...selectedRule,
                                  lookups: [...current, { source: newLookupSource.trim(), target: newLookupTarget.trim() }]
                                });
                                setNewLookupSource('');
                                setNewLookupTarget('');
                              }}
                              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl cursor-pointer"
                            >
                              <PlusCircle className="w-4 h-4" />
                              <span>Insert Translation Pair</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeEditorTab === 'business_rules' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-indigo-600" />
                        Business Constraint &amp; Validation Rules
                      </h4>
                      <p className="text-xs text-slate-500">
                        Assert database-level integrity checks, mandatory bounds, or regex format compliance on input values.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="col-span-1 md:col-span-7 space-y-3">
                        <label className="text-xs font-bold text-slate-800 block uppercase tracking-wider">Configured Business Rules</label>
                        
                        {(!selectedRule.businessRules || selectedRule.businessRules.length === 0) ? (
                          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 italic text-xs">
                            No active business rules. Database engine defaults will apply.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedRule.businessRules.map((r, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                                    r.severity === 'Fail' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {r.severity === 'Fail' ? 'Critical Block' : 'Soft Warning'}
                                  </span>
                                  <div>
                                    <span className="font-bold text-slate-800 font-mono block">
                                      {r.type} {r.value ? `: "${r.value}"` : ''}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const copy = [...(selectedRule.businessRules || [])];
                                    copy.splice(idx, 1);
                                    setSelectedRule({ ...selectedRule, businessRules: copy });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="col-span-1 md:col-span-5 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/60 space-y-3 text-xs">
                        <span className="font-bold text-indigo-950 uppercase tracking-wider block">Add Validation Rule</span>

                        <div className="space-y-3">
                          <div>
                            <label className="text-slate-600 mb-0.5 block font-medium">Check Type:</label>
                            <select
                              value={newBizRuleType}
                              onChange={(e) => setNewBizRuleType(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none"
                            >
                              <option value="Required">Required Check (Is Not Empty)</option>
                              <option value="RegexMatch">Regex Pattern Matching</option>
                              <option value="MinLength">Minimum Character Length</option>
                              <option value="MaxLength">Maximum Character Length</option>
                              <option value="RangeMin">Value Numeric Range Minimum</option>
                              <option value="RangeMax">Value Numeric Range Maximum</option>
                            </select>
                          </div>

                          {newBizRuleType !== 'Required' && (
                            <div>
                              <label className="text-slate-600 mb-0.5 block font-medium">Comparison Constraint Value:</label>
                              <input
                                type="text"
                                value={newBizRuleValue}
                                onChange={(e) => setNewBizRuleValue(e.target.value)}
                                placeholder={newBizRuleType === 'RegexMatch' ? 'e.g. ^\\d{5}$' : 'e.g. 5000'}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono focus:outline-none"
                              />
                            </div>
                          )}

                          <div>
                            <label className="text-slate-600 mb-0.5 block font-medium">Failure Response Action:</label>
                            <select
                              value={newBizRuleSeverity}
                              onChange={(e) => setNewBizRuleSeverity(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none"
                            >
                              <option value="Warn">Flag Soft Warning (Allow Row Import)</option>
                              <option value="Fail">Halt Pipeline Import (Reject Row Record)</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const current = selectedRule.businessRules || [];
                              setSelectedRule({
                                ...selectedRule,
                                businessRules: [
                                  ...current,
                                  {
                                    type: newBizRuleType,
                                    value: newBizRuleType !== 'Required' ? newBizRuleValue.trim() : undefined,
                                    severity: newBizRuleSeverity,
                                  }
                                ]
                              });
                              setNewBizRuleValue('');
                            }}
                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>Apply Business Constraint</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeEditorTab === 'calculated_fields' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-indigo-600" />
                        Math &amp; String Formula Generator (Calculated Field)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Combine or calculate target values dynamically from one or multiple source database elements.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <label className="text-xs font-bold text-slate-800 block uppercase tracking-wider">Formula Canvas Editor</label>
                        
                        <textarea
                          rows={3}
                          value={selectedRule.calculatedFormula || selectedRule.formulaExpression || ''}
                          onChange={(e) => setSelectedRule({ ...selectedRule, calculatedFormula: e.target.value, formulaExpression: e.target.value })}
                          placeholder="e.g. First_Name + ' ' + Last_Name"
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 font-mono font-bold text-indigo-955 focus:outline-none focus:border-indigo-500"
                        />

                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Insert Source Variable:</span>
                          {SOURCE_CUSTOMER_SCHEMA.fields.slice(0, 6).map((f) => (
                            <button
                              type="button"
                              key={f.fieldName}
                              onClick={() => {
                                const current = selectedRule.calculatedFormula || selectedRule.formulaExpression || '';
                                const appended = current + ` ${f.fieldName}`;
                                setSelectedRule({ ...selectedRule, calculatedFormula: appended, formulaExpression: appended });
                              }}
                              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 text-[11px] font-mono font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              {f.fieldName}
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[10px] text-indigo-500 font-bold uppercase">Insert Helper Function:</span>
                          {['CONCAT()', 'COALESCE()', 'MATH.ROUND()', 'TRIM()', 'CURRENCY_CONVERT_EUR()'].map((func) => (
                            <button
                              type="button"
                              key={func}
                              onClick={() => {
                                const current = selectedRule.calculatedFormula || selectedRule.formulaExpression || '';
                                const appended = current + ` ${func}`;
                                setSelectedRule({ ...selectedRule, calculatedFormula: appended, formulaExpression: appended });
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-700 text-[11px] font-mono font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              {func}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 bg-indigo-50/25 rounded-2xl border border-indigo-100 text-slate-600 text-xs space-y-1.5 leading-relaxed">
                        <span className="font-bold text-indigo-950 flex items-center gap-1 uppercase tracking-wide">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          Syntax Checker Info
                        </span>
                        <p>
                          Calculated fields execute dynamically inside our Node.js runtime parsing engine. Variables are loaded from standard transaction records and sandboxed safely to prevent downstream injection vectors.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeEditorTab === 'conditional_mapping' && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-indigo-600" />
                        Conditional Rule Builder (If-Then-Else)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Inject decision trees directly into your mapping. Values are assigned based on custom assertions.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-bold text-slate-800 uppercase tracking-wide">IF</span>
                          
                          <select
                            id="cond-field-select"
                            className="p-2 bg-white border border-slate-200 rounded-xl font-mono font-bold focus:outline-none"
                            onChange={(e) => {
                              const current = selectedRule.conditionalMapping?.[0] || { field: 'Risk_Rating', operator: '==', value: 'HIGH', thenVal: 'Credit_Limit * 0.5', elseVal: 'Credit_Limit' };
                              setSelectedRule({
                                ...selectedRule,
                                conditionalMapping: [{ ...current, field: e.target.value }]
                              });
                            }}
                            value={selectedRule.conditionalMapping?.[0]?.field || 'Risk_Rating'}
                          >
                            {SOURCE_CUSTOMER_SCHEMA.fields.map(f => (
                              <option key={f.fieldName} value={f.fieldName}>{f.fieldName}</option>
                            ))}
                          </select>

                          <select
                            id="cond-op-select"
                            className="p-2 bg-white border border-slate-200 rounded-xl font-mono font-bold focus:outline-none"
                            onChange={(e) => {
                              const current = selectedRule.conditionalMapping?.[0] || { field: 'Risk_Rating', operator: '==', value: 'HIGH', thenVal: 'Credit_Limit * 0.5', elseVal: 'Credit_Limit' };
                              setSelectedRule({
                                ...selectedRule,
                                conditionalMapping: [{ ...current, operator: e.target.value }]
                              });
                            }}
                            value={selectedRule.conditionalMapping?.[0]?.operator || '=='}
                          >
                            <option value="==">== (Equals)</option>
                            <option value="!=">!= (Not Equals)</option>
                            <option value=">">&gt; (Greater Than)</option>
                            <option value="<">&lt; (Less Than)</option>
                            <option value="CONTAINS">CONTAINS</option>
                          </select>

                          <input
                            type="text"
                            placeholder="HIGH"
                            className="p-2 bg-white border border-slate-200 rounded-xl font-mono w-28 focus:outline-none"
                            onChange={(e) => {
                              const current = selectedRule.conditionalMapping?.[0] || { field: 'Risk_Rating', operator: '==', value: 'HIGH', thenVal: 'Credit_Limit * 0.5', elseVal: 'Credit_Limit' };
                              setSelectedRule({
                                ...selectedRule,
                                conditionalMapping: [{ ...current, value: e.target.value }]
                              });
                            }}
                            value={selectedRule.conditionalMapping?.[0]?.value || 'HIGH'}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-bold text-slate-800 uppercase tracking-wide">THEN ASSIGN VALUE</span>
                          <input
                            type="text"
                            placeholder="Credit_Limit * 0.5"
                            className="p-2 bg-white border border-slate-200 rounded-xl font-mono w-64 font-bold text-indigo-700 focus:outline-none"
                            onChange={(e) => {
                              const current = selectedRule.conditionalMapping?.[0] || { field: 'Risk_Rating', operator: '==', value: 'HIGH', thenVal: 'Credit_Limit * 0.5', elseVal: 'Credit_Limit' };
                              setSelectedRule({
                                ...selectedRule,
                                conditionalMapping: [{ ...current, thenVal: e.target.value }]
                              });
                            }}
                            value={selectedRule.conditionalMapping?.[0]?.thenVal || 'Credit_Limit * 0.5'}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-bold text-slate-800 uppercase tracking-wide">ELSE ASSIGN VALUE</span>
                          <input
                            type="text"
                            placeholder="Credit_Limit"
                            className="p-2 bg-white border border-slate-200 rounded-xl font-mono w-64 font-bold text-emerald-700 focus:outline-none"
                            onChange={(e) => {
                              const current = selectedRule.conditionalMapping?.[0] || { field: 'Risk_Rating', operator: '==', value: 'HIGH', thenVal: 'Credit_Limit * 0.5', elseVal: 'Credit_Limit' };
                              setSelectedRule({
                                ...selectedRule,
                                conditionalMapping: [{ ...current, elseVal: e.target.value }]
                              });
                            }}
                            value={selectedRule.conditionalMapping?.[0]?.elseVal || 'Credit_Limit'}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const cond = selectedRule.conditionalMapping?.[0] || { field: 'Risk_Rating', operator: '==', value: 'HIGH', thenVal: 'Credit_Limit * 0.5', elseVal: 'Credit_Limit' };
                            const generatedString = `IF ${cond.field} ${cond.operator} '${cond.value}' THEN ${cond.thenVal} ELSE ${cond.elseVal}`;
                            setSelectedRule({
                              ...selectedRule,
                              conditionExpression: generatedString
                            });
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-colors cursor-pointer mt-2"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Synchronize &amp; Compile Expression</span>
                        </button>
                      </div>

                      <div className="p-4 bg-purple-50/25 border border-purple-100 rounded-2xl space-y-2 text-xs text-slate-600">
                        <span className="font-bold text-purple-950 block">Calculated Expression Output:</span>
                        <pre className="p-3 bg-purple-950 text-purple-200 rounded-xl font-mono font-bold border border-purple-850 break-all whitespace-pre-wrap">
                          {selectedRule.conditionExpression || 'No Compiled Condition Present'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Changes persist only after clicking Save Rule Configuration.
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setIsRuleEditorOpen(false);
                    setSelectedRule(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedRule}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Rule Configuration</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Comparison Modal */}
      {comparingVersion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl">
                  <GitCompare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Visual Schema Mapping Difference Inspector</h3>
                  <p className="text-xs text-indigo-200">
                    Comparing <span className="font-mono text-amber-300">Active Canvas</span> vs <span className="font-mono text-indigo-300">{comparingVersion.versionId}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setComparingVersion(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diff content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Canvas Rules</span>
                  <span className="text-2xl font-mono font-bold text-slate-800">{dualRules.length}</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Comparing Snapshot ({comparingVersion.versionId})</span>
                  <span className="text-2xl font-mono font-bold text-slate-800">{comparingVersion.rulesCount}</span>
                </div>
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-950">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase block">Net Rule Shift</span>
                  <span className="text-2xl font-mono font-bold text-indigo-800 font-bold">
                    {dualRules.length - comparingVersion.rulesCount >= 0 ? `+${dualRules.length - comparingVersion.rulesCount}` : dualRules.length - comparingVersion.rulesCount}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-slate-700">
                  Detailed Differences Map
                </div>
                <div className="divide-y divide-slate-100 font-mono">
                  {dualRules.map((rule) => {
                    const matchedHistoricalRule = comparingVersion.rules.find((r: any) => r.id === rule.id);
                    if (!matchedHistoricalRule) {
                      return (
                        <div key={rule.id} className="p-4 bg-emerald-50/20 hover:bg-emerald-50/40 flex items-center justify-between">
                          <div className="space-y-1 font-mono text-xs">
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase mr-2 font-sans">Added Rule</span>
                            <span className="font-bold text-slate-800">{rule.sourceFields.join(', ')} &rarr; {rule.targetFields.join(', ')}</span>
                            <p className="text-[10px] font-sans text-slate-400 italic font-medium">{rule.reasoning}</p>
                          </div>
                          <span className="text-slate-400 text-[11px] font-bold font-sans">Conf: {Math.round(rule.confidence * 100)}%</span>
                        </div>
                      );
                    }

                    const hasChanges = matchedHistoricalRule.mappingType !== rule.mappingType ||
                      matchedHistoricalRule.sourceFields.join(',') !== rule.sourceFields.join(',') ||
                      matchedHistoricalRule.targetFields.join(',') !== rule.targetFields.join(',') ||
                      matchedHistoricalRule.constantValue !== rule.constantValue ||
                      matchedHistoricalRule.conditionExpression !== rule.conditionExpression;

                    if (hasChanges) {
                      return (
                        <div key={rule.id} className="p-4 bg-amber-50/20 hover:bg-amber-50/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold uppercase font-sans">Modified Rule ({rule.id})</span>
                            <span className="text-[11px] font-bold font-sans text-slate-500">Mismatched configs detected</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-1 text-[11px]">
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150">
                              <span className="text-[9px] text-slate-400 font-bold block mb-1">COMPARING SNAPSHOT</span>
                              <p className="font-bold text-slate-700">{matchedHistoricalRule.sourceFields.join(', ')} &rarr; {matchedHistoricalRule.targetFields.join(', ')}</p>
                              <p className="text-[10px] text-slate-500 mt-1">Type: {matchedHistoricalRule.mappingType}</p>
                            </div>
                            <div className="p-2.5 bg-indigo-50/30 rounded-xl border border-indigo-150">
                              <span className="text-[9px] text-indigo-400 font-bold block mb-1">ACTIVE CANVAS</span>
                              <p className="font-bold text-indigo-900">{rule.sourceFields.join(', ')} &rarr; {rule.targetFields.join(', ')}</p>
                              <p className="text-[10px] text-indigo-600 mt-1 font-bold font-bold">Type: {rule.mappingType}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 text-[9px] font-bold uppercase font-sans">Identical</span>
                          <span className="text-slate-600">{rule.sourceFields.join(', ')} &rarr; {rule.targetFields.join(', ')}</span>
                        </div>
                        <span className="text-slate-400 font-sans font-medium text-[10px] italic">No differences</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button
                type="button"
                onClick={() => setComparingVersion(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Security Masking Configuration Modal */}
      {editingMaskRule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Lock className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">PII Security Masking Configuration</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Target: {editingMaskRule.targetFields.join(', ') || 'No.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingMaskRule(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Enforce Enterprise PII Masking</span>
                <span className="text-[11px] text-slate-500">Mask sensitive fields before writing payload</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempMaskConfig.isEnabled}
                  onChange={(e) =>
                    setTempMaskConfig((prev) => ({ ...prev, isEnabled: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            {tempMaskConfig.isEnabled && (
              <div className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">PII Data Category</label>
                    <select
                      value={tempMaskConfig.piiCategory || 'GeneralPII'}
                      onChange={(e) =>
                        setTempMaskConfig((prev) => ({
                          ...prev,
                          piiCategory: e.target.value as any,
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                    >
                      <option value="Email">Email Address</option>
                      <option value="Phone">Phone Number</option>
                      <option value="SSN/Tax">SSN / Tax ID</option>
                      <option value="CreditCard">Credit Card</option>
                      <option value="Address">Street Address</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Masking Algorithm</label>
                    <select
                      value={tempMaskConfig.ruleType}
                      onChange={(e) =>
                        setTempMaskConfig((prev) => ({
                          ...prev,
                          ruleType: e.target.value as any,
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                    >
                      <option value="PartialMask">Partial Character Masking (*)</option>
                      <option value="HashSHA256">Salted SHA-256 Hash</option>
                      <option value="FullRedact">Full Redaction ([REDACTED])</option>
                      <option value="Tokenize">Deterministic Tokenization</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setEditingMaskRule(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMaskingConfig}
                className="px-5 py-2 bg-purple-600 text-white font-semibold rounded-xl shadow-xs cursor-pointer"
              >
                Save Masking Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
