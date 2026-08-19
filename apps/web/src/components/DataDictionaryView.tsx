import React, { useState, useEffect } from 'react';
import { DataDictionaryEntity, DataDictionaryField, DataDictionaryVersion } from '../types';
import { MOCK_CONNECTORS } from '../data/mockData';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Sparkles,
  ShieldCheck,
  History,
  Download,
  Copy,
  Check,
  Database,
  Layers,
  Key,
  Lock,
  Tag,
  Clock,
  ArrowRight,
  FileCode,
  Sliders,
  X,
  Edit3,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Globe,
  Award,
  Zap,
} from 'lucide-react';

// Expanded Enterprise Data Dictionary Entities covering all 9 systems
const SAMPLE_DICTIONARY_ENTITIES: DataDictionaryEntity[] = [
  {
    id: 'entity-sap-cust',
    entityName: 'Customer Master (KNA1)',
    system: 'SAP S/4HANA',
    category: 'Master Data',
    version: 'v2.1-Active',
    lastUpdated: '2026-07-28',
    description: 'Central customer repository for SAP S/4HANA Cloud environment.',
    tags: ['SAP', 'Customer', 'PII'],
    versionHistory: [{ version: 'v2.1', releasedAt: '2026-07-28', author: 'Data Governance', changesDescription: 'Initial SAP S/4HANA baseline.', fieldCount: 12 }],
    governance: { classification: 'Confidential', piiRisk: 'High', complianceScope: ['GDPR'], ownerDepartment: 'Finance' },
    fields: [
      { id: 'f-sap-1', fieldName: 'Customer ID', physicalColumn: 'KUNNR', dataType: 'CHAR(10)', isNullable: false, isPrimaryKey: true, isForeignKey: false, piiSensitivity: 'Internal', description: 'Unique customer identification.' }
    ]
  },
  {
    id: 'entity-bc-cust',
    entityName: 'Customer Entity (API v2.0)',
    system: 'Microsoft Dynamics 365 Business Central',
    category: 'Master Data',
    version: 'v1.4-Active',
    lastUpdated: '2026-08-01',
    description: 'Public API surface for customer management in Business Central.',
    tags: ['BC', 'API', 'Cloud'],
    versionHistory: [],
    fields: [{ id: 'f-bc-1', fieldName: 'No.', physicalColumn: 'No', dataType: 'CODE20', isNullable: false, isPrimaryKey: true, isForeignKey: false, piiSensitivity: 'Internal', description: 'Primary key.' }]
  },
  {
    id: 'entity-sf-acc',
    entityName: 'Account Object',
    system: 'Salesforce',
    category: 'Master Data',
    version: 'v4.0-Active',
    lastUpdated: '2026-07-20',
    description: 'Standard Account object for CRM pipeline management.',
    tags: ['Salesforce', 'CRM'],
    versionHistory: [],
    fields: [{ id: 'f-sf-1', fieldName: 'Account ID', physicalColumn: 'Id', dataType: 'ID', isNullable: false, isPrimaryKey: true, isForeignKey: false, piiSensitivity: 'Internal', description: 'SFDC Unique ID.' }]
  },
  {
    id: 'entity-sql-inv',
    entityName: 'Inventory Ledger',
    system: 'SQL Server',
    category: 'Transactional Data',
    version: 'v1.0-Legacy',
    lastUpdated: '2026-06-15',
    description: 'Historical inventory transactions from legacy SQL database.',
    tags: ['SQL Server', 'Legacy'],
    versionHistory: [],
    fields: [{ id: 'f-sql-1', fieldName: 'Transaction ID', physicalColumn: 'TX_ID', dataType: 'INT', isNullable: false, isPrimaryKey: true, isForeignKey: false, piiSensitivity: 'Internal', description: 'Identity column.' }]
  },
  {
    id: 'entity-sfdc-opp',
    entityName: 'Opportunity & Pipeline Header',
    system: 'Salesforce CRM Org',
    category: 'Transactional Data',
    version: 'v1.4-Active',
    lastUpdated: '2026-07-20',
    description: 'Tracks revenue pipeline opportunities, stage progressions, expected close dates, and contract values.',
    tags: ['Salesforce', 'Pipeline', 'Revenue', 'CRM-Core'],
    versionHistory: [
      {
        version: 'v1.4-Active',
        releasedAt: '2026-07-01',
        author: 'Revenue Ops Architect',
        changesDescription: 'Added currency ISO code normalization rules for multi-currency pipeline aggregation.',
        fieldCount: 6,
      },
    ],
    governance: {
      classification: 'Confidential / Commercial',
      piiRisk: 'Medium (Includes sales rep IDs and deal notes)',
      complianceScope: ['SOC 2 Type II', 'ASC 606 Revenue Recognition'],
      ownerDepartment: 'Global Revenue Operations',
    },
    aiSummary:
      'The Opportunity object is the core financial driver in Salesforce. It stores expected revenue amounts, stage progression milestones, and probability factors. Essential for pipeline forecasting during CRM consolidation.',
    fields: [
      {
        id: 'f-201',
        fieldName: 'Opportunity ID',
        physicalColumn: 'Id',
        dataType: 'VARCHAR(18)',
        isNullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        piiSensitivity: 'Internal',
        description: '18-character Salesforce globally unique identifier.',
        exampleValue: '0065g000003kL9aAAE',
      },
      {
        id: 'f-202',
        fieldName: 'Opportunity Name',
        physicalColumn: 'Name',
        dataType: 'VARCHAR(120)',
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        piiSensitivity: 'Internal',
        description: 'Descriptive title of the sales opportunity deal.',
        exampleValue: '2026 Enterprise Migration Suite Expansion',
      },
      {
        id: 'f-203',
        fieldName: 'Contract Amount',
        physicalColumn: 'Amount',
        dataType: 'DECIMAL(18,2)',
        isNullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
        piiSensitivity: 'Confidential',
        description: 'Total estimated gross financial deal value.',
        validationRule: 'Amount > 0',
        exampleValue: '450000.00',
      },
      {
        id: 'f-204',
        fieldName: 'Stage Name',
        physicalColumn: 'StageName',
        dataType: 'VARCHAR(40)',
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        piiSensitivity: 'Public',
        description: 'Current sales pipeline stage (e.g., Prospecting, Proposal, Closed Won).',
        validationRule: 'Enum match',
        exampleValue: 'Closed Won',
      },
    ],
  },
  {
    id: 'entity-oracle-gl',
    entityName: 'General Ledger Balances (GL_BALANCES)',
    system: 'Oracle EBS R12',
    category: 'Transactional Data',
    version: 'v3.0-Production',
    lastUpdated: '2026-06-12',
    description: 'Summarizes monthly actual, budget, and encumbrance balances per chart-of-accounts combination.',
    tags: ['Oracle-EBS', 'Financials', 'SOX-Mandatory', 'G/L'],
    versionHistory: [
      {
        version: 'v3.0-Production',
        releasedAt: '2026-06-12',
        author: 'Lead Financial Engineer',
        changesDescription: 'Final SOX audit baseline validation for SAP S/4HANA Finance migration.',
        fieldCount: 5,
      },
    ],
    governance: {
      classification: 'Highly Restricted / SOX Controlled',
      piiRisk: 'Low (Aggregated financial ledgers)',
      complianceScope: ['SOX 404', 'US GAAP', 'IFRS 15'],
      ownerDepartment: 'Corporate Financial Controllership',
    },
    aiSummary:
      'GL_BALANCES holds period-to-date and year-to-date summary balances across code combinations in Oracle Financials. Crucial for trial balance validation and historical audit compliance.',
    fields: [
      {
        id: 'f-301',
        fieldName: 'Ledger ID',
        physicalColumn: 'LEDGER_ID',
        dataType: 'NUMBER(15)',
        isNullable: false,
        isPrimaryKey: true,
        isForeignKey: true,
        foreignTable: 'GL_LEDGERS',
        piiSensitivity: 'Internal',
        description: 'References the primary accounting set of books.',
        exampleValue: '2021',
      },
      {
        id: 'f-302',
        fieldName: 'Code Combination ID',
        physicalColumn: 'CODE_COMBINATION_ID',
        dataType: 'NUMBER(15)',
        isNullable: false,
        isPrimaryKey: true,
        isForeignKey: true,
        foreignTable: 'GL_CODE_COMBINATIONS',
        piiSensitivity: 'Internal',
        description: 'Surrogate key representing the full Chart of Accounts segment string.',
        exampleValue: '1049281',
      },
      {
        id: 'f-303',
        fieldName: 'Period Name',
        physicalColumn: 'PERIOD_NAME',
        dataType: 'VARCHAR(15)',
        isNullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        piiSensitivity: 'Public',
        description: 'Accounting period string (e.g., Jul-26).',
        exampleValue: 'Jul-26',
      },
      {
        id: 'f-304',
        fieldName: 'Period Net DR/CR Balance',
        physicalColumn: 'PERIOD_NET_DR',
        dataType: 'NUMBER(22,2)',
        isNullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
        piiSensitivity: 'Confidential',
        description: 'Total period debit balance in local ledger currency.',
        exampleValue: '1240500.50',
      },
    ],
  },
];

export const DataDictionaryView: React.FC = () => {
  const [entities, setEntities] = useState<DataDictionaryEntity[]>(SAMPLE_DICTIONARY_ENTITIES);
  const [selectedEntityId, setSelectedEntityId] = useState<string>(SAMPLE_DICTIONARY_ENTITIES[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSystem, setSelectedSystem] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'glossary' | 'governance' | 'history'>('glossary');
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);
  const [showDiffModal, setShowDiffModal] = useState<boolean>(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Discovery logic
  const handleDiscoverySync = () => {
    setIsSyncing(true);
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          // Add 5 more entities dynamically to reach 9+ total
          const discoveryEntities: DataDictionaryEntity[] = [
            { id: 'disc-1', entityName: 'Employee Master', system: 'REST API', category: 'Master Data', version: 'v1.0', lastUpdated: 'Just now', description: 'Discovered from HRMS API.', fields: [], tags: ['New'], versionHistory: [] },
            { id: 'disc-2', entityName: 'GL Accounts', system: 'Dynamics 365 F&O', category: 'Master Data', version: 'v1.0', lastUpdated: 'Just now', description: 'Discovered from D365 Finance.', fields: [], tags: ['New'], versionHistory: [] },
            { id: 'disc-3', entityName: 'Staging Customers', system: 'PostgreSQL', category: 'Master Data', version: 'v1.0', lastUpdated: 'Just now', description: 'Warehouse staging table.', fields: [], tags: ['New'], versionHistory: [] },
            { id: 'disc-4', entityName: 'Project Docs', system: 'SharePoint', category: 'Transactional Data', version: 'v1.0', lastUpdated: 'Just now', description: 'Document metadata repository.', fields: [], tags: ['New'], versionHistory: [] },
            { id: 'disc-5', entityName: 'Excel Leads', system: 'Excel', category: 'Master Data', version: 'v1.0', lastUpdated: 'Just now', description: 'Imported leads from local files.', fields: [], tags: ['New'], versionHistory: [] },
          ];
          setEntities(prev => [...prev, ...discoveryEntities]);
          return 100;
        }
        return p + 20;
      });
    }, 400);
  };
  
  // New Field Form State
  const [newFieldName, setNewFieldName] = useState<string>('');
  const [newPhysicalCol, setNewPhysicalCol] = useState<string>('');
  const [newDataType, setNewDataType] = useState<string>('VARCHAR(50)');
  const [newPii, setNewPii] = useState<'Public' | 'Internal' | 'Confidential' | 'PII/Sensitive'>('Internal');
  const [newDesc, setNewDesc] = useState<string>('');

  const selectedEntity = entities.find((e) => e.id === selectedEntityId) || entities[0];

  // Filtered Entities list
  const filteredEntities = entities.filter((entity) => {
    // System Filter
    if (selectedSystem !== 'ALL' && entity.system !== selectedSystem) {
      return false;
    }
    // Category Filter
    if (selectedCategory !== 'ALL' && entity.category !== selectedCategory) {
      return false;
    }
    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = entity.entityName.toLowerCase().includes(q);
      const matchSystem = entity.system.toLowerCase().includes(q);
      const matchDesc = entity.description.toLowerCase().includes(q);
      const matchTags = entity.tags.some((t) => t.toLowerCase().includes(q));
      const matchFields = entity.fields.some(
        (f) =>
          f.fieldName.toLowerCase().includes(q) ||
          f.physicalColumn.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.dataType.toLowerCase().includes(q) ||
          f.piiSensitivity.toLowerCase().includes(q)
      );
      return matchName || matchSystem || matchDesc || matchTags || matchFields;
    }
    return true;
  });

  // Calculate high-level summary metrics
  const totalEntities = entities.length;
  const totalFieldsCount = entities.reduce((sum, e) => sum + e.fields.length, 0);
  const piiFieldsCount = entities.reduce(
    (sum, e) => sum + e.fields.filter((f) => f.piiSensitivity === 'PII/Sensitive' || f.piiSensitivity === 'Confidential').length,
    0
  );

  // Trigger AI Summary Generation
  const handleGenerateAiSummary = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/data-dictionary-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityName: selectedEntity.entityName,
          system: selectedEntity.system,
          category: selectedEntity.category,
          fields: selectedEntity.fields.map((f) => ({
            fieldName: f.fieldName,
            dataType: f.dataType,
            pii: f.piiSensitivity,
            description: f.description,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEntities((prev) =>
          prev.map((ent) => {
            if (ent.id === selectedEntity.id) {
              return {
                ...ent,
                aiSummary: data.summary,
                governance: data.governance || ent.governance,
              };
            }
            return ent;
          })
        );
      }
    } catch (err) {
      console.error('Failed to generate AI data dictionary summary:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCopyCode = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFieldId(fieldId);
    setTimeout(() => setCopiedFieldId(null), 2000);
  };

  const handleAddFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim() || !newPhysicalCol.trim()) return;

    const newField: DataDictionaryField = {
      id: `f-${Date.now()}`,
      fieldName: newFieldName,
      physicalColumn: newPhysicalCol.toUpperCase(),
      dataType: newDataType,
      isNullable: true,
      isPrimaryKey: false,
      isForeignKey: false,
      piiSensitivity: newPii,
      description: newDesc || 'User defined custom dictionary element.',
    };

    setEntities((prev) =>
      prev.map((ent) => {
        if (ent.id === selectedEntity.id) {
          return {
            ...ent,
            fields: [...ent.fields, newField],
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        }
        return ent;
      })
    );

    // Reset Form & Close Modal
    setNewFieldName('');
    setNewPhysicalCol('');
    setNewDesc('');
    setShowAddFieldModal(false);
  };

  const getPiiBadge = (pii: string) => {
    switch (pii) {
      case 'PII/Sensitive':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Confidential':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Internal':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Public':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div id="data-dictionary-module" className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-slate-900">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Enterprise Data Dictionary</h2>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-3xs">
              Version-Controlled Glossary
            </span>
          </div>
          <p className="text-slate-600 text-xs mt-1 font-medium">
            Searchable catalog of enterprise metadata, entity definitions, PII governance rules, and field-level schemas across all connected systems.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDiscoverySync}
            disabled={isSyncing}
            className={`px-4 py-2 ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'} font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all relative overflow-hidden`}
          >
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
            <span>{isSyncing ? `Syncing (${syncProgress}%)` : 'Sync Real-time Discovery'}</span>
          </button>
          <button
            type="button"
            onClick={handleGenerateAiSummary}
            disabled={isGeneratingAi}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isGeneratingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            <span>{isGeneratingAi ? 'Synthesizing...' : 'Generate AI Entity Summary'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 shadow-2xs">
          <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Database className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-500 font-black uppercase block tracking-wider">Cataloged Entities</span>
            <span className="text-xl font-black text-slate-900">{totalEntities}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 shadow-2xs">
          <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Layers className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-500 font-black uppercase block tracking-wider">Attributes</span>
            <span className="text-xl font-black text-slate-900">{totalFieldsCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 shadow-2xs">
          <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-500 font-black uppercase block tracking-wider">PII Guarded</span>
            <span className="text-xl font-black text-rose-600">{piiFieldsCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 shadow-2xs">
          <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Globe className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] text-slate-500 font-black uppercase block tracking-wider">Systems Integrated</span>
            <span className="text-xl font-black text-emerald-600">9 Connected</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search tables, schema types, sensitive tags, or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        {/* Dropdowns & Category Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* System Dropdown */}
          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-hidden focus:border-indigo-500 cursor-pointer shadow-3xs"
          >
            <option value="ALL">All Systems</option>
            {Array.from(new Set(MOCK_CONNECTORS.map(c => c.provider))).map(provider => (
              <option key={provider} value={provider}>{provider}</option>
            ))}
          </select>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            {['ALL', 'Master Data', 'Transactional Data'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white text-indigo-600 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid: Entity Selector (Left) + Detail Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
        {/* Left Col: Entity List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Entities ({filteredEntities.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select to inspect</span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredEntities.map((entity) => {
              const isSelected = entity.id === selectedEntityId;
              return (
                <div
                  key={entity.id}
                  onClick={() => setSelectedEntityId(entity.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-100'
                      : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-wider shadow-3xs">
                        {entity.system}
                      </span>
                      <h4 className="font-black text-xs text-slate-900 mt-1.5 flex items-center gap-1.5">
                        {entity.entityName}
                      </h4>
                    </div>

                    <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-3xs">
                      {entity.version}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-2 leading-relaxed font-medium">
                    {entity.description}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-bold tracking-tight">
                    <span>{entity.fields.length} Attributes</span>
                    <span>Updated: {entity.lastUpdated}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Entity Detailed Glossary & AI Documentation */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-2xs flex flex-col justify-between">
          {selectedEntity && (
            <div className="space-y-5">
              {/* Entity Main Title & Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase tracking-wider shadow-3xs">
                      {selectedEntity.category}
                    </span>
                    <span className="text-slate-300 text-xs">•</span>
                    <span className="text-slate-500 text-xs font-black tracking-tight uppercase">{selectedEntity.system}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                    {selectedEntity.entityName}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFieldModal(true)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-3xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Add Attribute</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDiffModal(true)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-3xs"
                  >
                    <History className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Version History</span>
                  </button>
                </div>
              </div>

              {/* AI Documentation Summary Box */}
              <div className="p-5 bg-indigo-50/40 rounded-2xl border border-indigo-100 shadow-3xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h4 className="font-black text-xs text-indigo-900 tracking-wide uppercase">
                      AI Generated Documentation Summary
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAiSummary}
                    disabled={isGeneratingAi}
                    className="text-[10px] text-indigo-600 font-black hover:underline flex items-center gap-1 cursor-pointer uppercase"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                    <span>Refresh Summary</span>
                  </button>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedEntity.aiSummary ||
                    'Click "Generate AI Entity Summary" above to perform generative LLM architectural profiling of this entity schema.'}
                </p>

                {selectedEntity.governance && (
                  <div className="mt-4 pt-4 border-t border-indigo-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100 shadow-3xs">
                      <span className="text-slate-500 font-bold uppercase text-[9px]">Classification</span>
                      <strong className="text-amber-700 font-black">{selectedEntity.governance.classification}</strong>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100 shadow-3xs">
                      <span className="text-slate-500 font-bold uppercase text-[9px]">PII Risk Rating</span>
                      <strong className="text-rose-700 font-black">{selectedEntity.governance.piiRisk}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Glossary Tabs & Field Count */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 w-full pb-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('glossary')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      activeTab === 'glossary'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Field Glossary ({selectedEntity.fields.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('governance')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      activeTab === 'governance'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Governance & Compliance Scope
                  </button>
                </div>
              </div>

              {/* Tab Content 1: Field Glossary Table */}
              {activeTab === 'glossary' && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-3xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[9px] border-b border-slate-200 tracking-wider">
                      <tr>
                        <th className="p-4">Attribute Name</th>
                        <th className="p-4">Physical Column</th>
                        <th className="p-4">Data Type</th>
                        <th className="p-4">Keys</th>
                        <th className="p-4">PII Sensitivity</th>
                        <th className="p-4">Description & Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {selectedEntity.fields.map((field) => (
                        <tr key={field.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Attribute Name */}
                          <td className="p-4 font-sans font-black text-slate-900">
                            {field.fieldName}
                          </td>

                          {/* Physical Column */}
                          <td className="p-4 font-mono text-indigo-600 font-bold">
                            <code>{field.physicalColumn}</code>
                          </td>

                          {/* Data Type */}
                          <td className="p-4 text-slate-600 font-medium">
                            {field.dataType}
                          </td>

                          {/* Keys (PK / FK) */}
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              {field.isPrimaryKey && (
                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-black shadow-3xs">
                                  PK
                                </span>
                              )}
                              {field.isForeignKey && (
                                <span
                                  className="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[9px] font-black shadow-3xs"
                                  title={`FK -> ${field.foreignTable}`}
                                >
                                  FK
                                </span>
                              )}
                              {!field.isPrimaryKey && !field.isForeignKey && (
                                <span className="text-slate-300 font-black tracking-widest">---</span>
                              )}
                            </div>
                          </td>

                          {/* PII Sensitivity */}
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border tracking-wider shadow-3xs ${getPiiBadge(field.piiSensitivity)}`}>
                              {field.piiSensitivity.toUpperCase()}
                            </span>
                          </td>

                          {/* Description & Rules */}
                          <td className="p-4 font-sans text-slate-600 text-[11px] leading-relaxed font-medium">
                            <p>{field.description}</p>
                            {field.validationRule && (
                              <p className="text-[10px] font-mono text-slate-400 mt-1.5 border-t border-slate-100 pt-1.5">
                                <span className="uppercase text-[9px] font-black tracking-tighter opacity-70">Rule: </span>
                                <span className="text-indigo-600 font-bold">{field.validationRule}</span>
                              </p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab Content 2: Governance & Compliance Scope */}
              {activeTab === 'governance' && selectedEntity.governance && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Data Protection & Regulatory Constraints
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-3xs space-y-1.5">
                      <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Data Stewardship Dept</span>
                      <strong className="text-sm text-slate-900 font-black">{selectedEntity.governance.ownerDepartment}</strong>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-3xs space-y-1.5">
                      <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">PII & Risk Score</span>
                      <strong className="text-sm text-rose-700 font-black">{selectedEntity.governance.piiRisk}</strong>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Compliance Frameworks</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntity.governance.complianceScope.map((scope, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold shadow-3xs">
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Custom Attribute Modal */}
      {showAddFieldModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Add Attribute to {selectedEntity.entityName}</h3>
              <button
                type="button"
                onClick={() => setShowAddFieldModal(false)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFieldSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-500 font-black uppercase tracking-wider block mb-1.5 text-[10px]">Business Attribute Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Credit Limit Amount"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-slate-500 font-black uppercase tracking-wider block mb-1.5 text-[10px]">Physical Column Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., KLIMT"
                  value={newPhysicalCol}
                  onChange={(e) => setNewPhysicalCol(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono focus:outline-hidden focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-black uppercase tracking-wider block mb-1.5 text-[10px]">Data Type</label>
                  <input
                    type="text"
                    value={newDataType}
                    onChange={(e) => setNewDataType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-mono focus:outline-hidden focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-black uppercase tracking-wider block mb-1.5 text-[10px]">PII Sensitivity</label>
                  <select
                    value={newPii}
                    onChange={(e) => setNewPii(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-indigo-500 transition-all font-bold cursor-pointer"
                  >
                    <option value="Public">Public</option>
                    <option value="Internal">Internal</option>
                    <option value="Confidential">Confidential</option>
                    <option value="PII/Sensitive">PII/Sensitive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-black uppercase tracking-wider block mb-1.5 text-[10px]">Business Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Explain the purpose and business rule of this column..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-hidden focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black hover:bg-slate-200 cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black cursor-pointer shadow-lg shadow-indigo-600/20 transition-all"
                >
                  Save Attribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History & Diff Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Version Changelog - {selectedEntity.entityName}</h3>
              <button
                type="button"
                onClick={() => setShowDiffModal(false)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {selectedEntity.versionHistory.map((v, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{v.version}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{v.releasedAt}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{v.changesDescription}</p>
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-tighter pt-1 flex items-center gap-2">
                    <span>Author: <span className="text-slate-900">{v.author}</span></span>
                    <span className="text-slate-300">•</span>
                    <span>Attributes: <span className="text-indigo-600 font-black">{v.fieldCount}</span></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDiffModal(false)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 cursor-pointer transition-all shadow-sm"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
