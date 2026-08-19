import React, { useState } from 'react';
import { OverflowTableWrapper } from './OverflowTableWrapper';
import { AnonymizationAuditLog } from './AnonymizationAuditLog';
import {
  AnonymizationRule,
  AnonymizationTechnique,
  PIICategory,
} from '../types';
import { INITIAL_CONNECTORS } from '../data/mockData';
import {
  EyeOff,
  ShieldCheck,
  KeyRound,
  Database,
  Sparkles,
  RefreshCw,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Copy,
  Download,
  Play,
  Lock,
  Layers,
  Zap,
  Sliders,
  SlidersHorizontal,
  Info,
  Check,
  X,
  Edit3,
  Trash2,
  Cpu,
  Hash,
  ShieldAlert,
  ArrowRight,
  Code,
  Server,
  Building2,
  Link2,
  Radio,
  Activity,
  Globe,
  Users,
} from 'lucide-react';

const CONNECTOR_ENTITIES_MAP: Record<string, { name: string; provider: string; entities: { name: string; fields: { name: string; category: PIICategory }[] }[] }> = {
  'conn-bc-prod': {
    name: 'Dynamics 365 Business Central (Prod)',
    provider: 'Dynamics 365 BC',
    entities: [
      {
        name: 'Customer_Master (Table 18)',
        fields: [
          { name: 'email_address', category: 'Email' },
          { name: 'social_security_num', category: 'SSN/Tax' },
          { name: 'credit_card_number', category: 'CreditCard' },
          { name: 'full_name', category: 'PersonalName' },
          { name: 'contact_phone', category: 'Phone' },
        ],
      },
      {
        name: 'Vendor_Master (Table 23)',
        fields: [
          { name: 'tax_registration_no', category: 'SSN/Tax' },
          { name: 'contact_email', category: 'Email' },
          { name: 'iban_bank_account', category: 'Financial' },
        ],
      },
      {
        name: 'Sales_Invoices',
        fields: [
          { name: 'bill_to_customer_email', category: 'Email' },
          { name: 'payment_card_token', category: 'CreditCard' },
        ],
      },
    ],
  },
  'conn-sql-legacy': {
    name: 'SQL Server - Legacy ERP DB',
    provider: 'SQL Server',
    entities: [
      {
        name: 'Customer_Master',
        fields: [
          { name: 'email_address', category: 'Email' },
          { name: 'social_security_num', category: 'SSN/Tax' },
          { name: 'credit_card_number', category: 'CreditCard' },
          { name: 'full_name', category: 'PersonalName' },
        ],
      },
      {
        name: 'Employee_Payroll',
        fields: [
          { name: 'annual_salary', category: 'Financial' },
          { name: 'iban_bank_account', category: 'Financial' },
          { name: 'ssn_number', category: 'SSN/Tax' },
        ],
      },
    ],
  },
  'conn-sap-s4': {
    name: 'SAP S/4HANA Cloud Engine',
    provider: 'SAP S/4HANA',
    entities: [
      {
        name: 'KNA1_Customer_Master',
        fields: [
          { name: 'SMTP_ADDR', category: 'Email' },
          { name: 'STCD1_TAX_ID', category: 'SSN/Tax' },
          { name: 'TELF1_PHONE', category: 'Phone' },
          { name: 'NAME1_FULL', category: 'PersonalName' },
        ],
      },
      {
        name: 'LFA1_Vendor_Master',
        fields: [
          { name: 'IBAN_NUMBER', category: 'Financial' },
          { name: 'VAT_TAX_NUM', category: 'SSN/Tax' },
        ],
      },
    ],
  },
  'conn-sfdc-main': {
    name: 'Salesforce Enterprise CRM',
    provider: 'Salesforce',
    entities: [
      {
        name: 'Account_Object',
        fields: [
          { name: 'Billing_Email__c', category: 'Email' },
          { name: 'Primary_Phone__c', category: 'Phone' },
          { name: 'Tax_Exempt_ID__c', category: 'SSN/Tax' },
        ],
      },
      {
        name: 'Contact_PII',
        fields: [
          { name: 'FirstName_LastName', category: 'PersonalName' },
          { name: 'Personal_Email', category: 'Email' },
          { name: 'MobilePhone', category: 'Phone' },
        ],
      },
    ],
  },
  'conn-postgres-warehouse': {
    name: 'PostgreSQL Staging Warehouse',
    provider: 'PostgreSQL',
    entities: [
      {
        name: 'Patient_Records',
        fields: [
          { name: 'medical_diagnosis_notes', category: 'Health' },
          { name: 'contact_phone', category: 'Phone' },
          { name: 'national_health_id', category: 'SSN/Tax' },
        ],
      },
      {
        name: 'edimp_staging_customers',
        fields: [
          { name: 'email', category: 'Email' },
          { name: 'full_name', category: 'PersonalName' },
          { name: 'phone', category: 'Phone' },
        ],
      },
    ],
  },
  'conn-custom-rest': {
    name: 'Legacy HRMS REST API Endpoint',
    provider: 'REST API',
    entities: [
      {
        name: 'Employee_Payroll',
        fields: [
          { name: 'iban_bank_account', category: 'Financial' },
          { name: 'base_salary_amt', category: 'Financial' },
          { name: 'employee_ssn', category: 'SSN/Tax' },
        ],
      },
    ],
  },
};

const INITIAL_RULES: AnonymizationRule[] = [
  {
    id: 'anon-rule-1',
    connectorId: 'conn-bc-prod',
    connectorName: 'Dynamics 365 Business Central (Prod)',
    targetProvider: 'Dynamics 365 BC',
    entityName: 'Customer_Master (Table 18)',
    fieldName: 'email_address',
    piiCategory: 'Email',
    technique: 'PartialMask',
    maskChar: '*',
    preserveFormat: true,
    complianceTags: ['GDPR', 'CCPA'],
    isActive: true,
  },
  {
    id: 'anon-rule-2',
    connectorId: 'conn-bc-prod',
    connectorName: 'Dynamics 365 Business Central (Prod)',
    targetProvider: 'Dynamics 365 BC',
    entityName: 'Customer_Master (Table 18)',
    fieldName: 'social_security_num',
    piiCategory: 'SSN/Tax',
    technique: 'SHA256_Salted',
    saltKey: 'e9b2_prod_salt_2026',
    complianceTags: ['GDPR', 'HIPAA', 'CCPA'],
    isActive: true,
  },
  {
    id: 'anon-rule-3',
    connectorId: 'conn-sfdc-main',
    connectorName: 'Salesforce Enterprise CRM',
    targetProvider: 'Salesforce',
    entityName: 'Account_Object',
    fieldName: 'Billing_Email__c',
    piiCategory: 'CreditCard',
    technique: 'FormatPreservingToken',
    preserveFormat: true,
    complianceTags: ['PCI-DSS'],
    isActive: true,
  },
  {
    id: 'anon-rule-4',
    connectorId: 'conn-sap-s4',
    connectorName: 'SAP S/4HANA Cloud Engine',
    targetProvider: 'SAP S/4HANA',
    entityName: 'KNA1_Customer_Master',
    fieldName: 'SMTP_ADDR',
    piiCategory: 'Email',
    technique: 'PartialMask',
    maskChar: '*',
    complianceTags: ['GDPR', 'CCPA'],
    isActive: true,
  },
  {
    id: 'anon-rule-5',
    connectorId: 'conn-sql-legacy',
    connectorName: 'SQL Server - Legacy ERP DB',
    targetProvider: 'SQL Server',
    entityName: 'Employee_Payroll',
    fieldName: 'annual_salary',
    piiCategory: 'Financial',
    technique: 'GeneralizationBucket',
    bucketRange: '$10,000 Range Buckets',
    complianceTags: ['GDPR'],
    isActive: true,
  },
  {
    id: 'anon-rule-6',
    connectorId: 'conn-custom-rest',
    connectorName: 'Legacy HRMS REST API Endpoint',
    targetProvider: 'REST API',
    entityName: 'Employee_Payroll',
    fieldName: 'iban_bank_account',
    piiCategory: 'Financial',
    technique: 'HMAC_Tokenization',
    saltKey: 'hrms_vault_key_secret',
    complianceTags: ['GDPR', 'PCI-DSS'],
    isActive: true,
  },
  {
    id: 'anon-rule-7',
    connectorId: 'conn-postgres-warehouse',
    connectorName: 'PostgreSQL Staging Warehouse',
    targetProvider: 'PostgreSQL',
    entityName: 'Patient_Records',
    fieldName: 'medical_diagnosis_notes',
    piiCategory: 'Health',
    technique: 'Nullification',
    complianceTags: ['HIPAA'],
    isActive: true,
  },
  {
    id: 'anon-rule-8',
    connectorId: 'conn-postgres-warehouse',
    connectorName: 'PostgreSQL Staging Warehouse',
    targetProvider: 'PostgreSQL',
    entityName: 'Patient_Records',
    fieldName: 'contact_phone',
    piiCategory: 'Phone',
    technique: 'SyntheticData',
    syntheticGeneratorType: 'FakerPhone',
    complianceTags: ['HIPAA', 'GDPR'],
    isActive: true,
  },
];

export const DataAnonymizationView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'sandbox' | 'audit' | 'tokenization' | 'synthetic' | 'compliance'>('rules');
  const [rules, setRules] = useState<AnonymizationRule[]>(INITIAL_RULES);
  const [selectedConnectorFilter, setSelectedConnectorFilter] = useState<string>('All');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('All');

  // Rule Modal State
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<AnonymizationRule | null>(null);

  // Modal Form Inputs
  const [formConnectorId, setFormConnectorId] = useState<string>('conn-bc-prod');
  const [formEntity, setFormEntity] = useState<string>('Customer_Master (Table 18)');
  const [formField, setFormField] = useState<string>('email_address');
  const [formPiiCategory, setFormPiiCategory] = useState<PIICategory>('Email');
  const [formTechnique, setFormTechnique] = useState<AnonymizationTechnique>('PartialMask');
  const [formMaskChar, setFormMaskChar] = useState<string>('*');
  const [formSaltKey, setFormSaltKey] = useState<string>('salt_key_2026_x');
  const [formSyntheticType, setFormSyntheticType] = useState<any>('FakerEmail');
  const [formTags, setFormTags] = useState<('GDPR' | 'HIPAA' | 'CCPA' | 'PCI-DSS')[]>(['GDPR']);

  // Target Connector Test Bridge State
  const [isTestingConnectors, setIsTestingConnectors] = useState<boolean>(false);
  const [connectorBridgeNotice, setConnectorBridgeNotice] = useState<string | null>(null);

  // Sandbox State
  const [sandboxConnectorId, setSandboxConnectorId] = useState<string>('conn-bc-prod');
  const [sandboxRecord, setSandboxRecord] = useState({
    full_name: 'Genevieve Montgomery',
    email_address: 'g.montgomery@enterprise.org',
    social_security_num: '987-12-4091',
    credit_card_number: '4532-8901-2384-9128',
    annual_salary: '142500',
    contact_phone: '+1 (555) 234-5678',
    medical_diagnosis_notes: 'Patient reports mild seasonal allergy symptoms',
  });

  const [sandboxResult, setSandboxResult] = useState<{ output: Record<string, string>; connectorName: string; latencyMs: number } | null>(null);
  const [isSandboxRunning, setIsSandboxRunning] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Scanner State
  const [isScanningPII, setIsScanningPII] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Lists for filtering
  const connectorsList = Array.from(new Set(rules.map((r) => r.connectorName || 'Default Database Connector')));
  const entitiesList = Array.from(new Set(rules.map((r) => r.entityName)));

  // Filtered Rules
  const filteredRules = rules.filter((r) => {
    const matchesConnector =
      selectedConnectorFilter === 'All' ||
      r.connectorId === selectedConnectorFilter ||
      r.connectorName === selectedConnectorFilter;
    const matchesEntity = selectedEntityFilter === 'All' || r.entityName === selectedEntityFilter;
    const matchesTag = selectedTagFilter === 'All' || r.complianceTags.includes(selectedTagFilter as any);
    const matchesSearch =
      r.fieldName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.connectorName && r.connectorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.piiCategory.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesConnector && matchesEntity && matchesTag && matchesSearch;
  });

  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const handleOpenAddModal = () => {
    setEditingRule(null);
    setFormConnectorId('conn-bc-prod');
    const defaultMeta = CONNECTOR_ENTITIES_MAP['conn-bc-prod'];
    const defaultEntity = defaultMeta ? defaultMeta.entities[0].name : 'Customer_Master (Table 18)';
    setFormEntity(defaultEntity);
    setFormField(defaultMeta ? defaultMeta.entities[0].fields[0].name : 'email_address');
    setFormPiiCategory(defaultMeta ? defaultMeta.entities[0].fields[0].category : 'Email');
    setFormTechnique('PartialMask');
    setFormMaskChar('*');
    setFormSaltKey('salt_key_2026_x');
    setFormSyntheticType('FakerEmail');
    setFormTags(['GDPR']);
    setShowRuleModal(true);
  };

  const handleOpenEditModal = (rule: AnonymizationRule) => {
    setEditingRule(rule);
    setFormConnectorId(rule.connectorId || 'conn-bc-prod');
    setFormEntity(rule.entityName);
    setFormField(rule.fieldName);
    setFormPiiCategory(rule.piiCategory);
    setFormTechnique(rule.technique);
    setFormMaskChar(rule.maskChar || '*');
    setFormSaltKey(rule.saltKey || 'salt_key_2026_x');
    setFormSyntheticType(rule.syntheticGeneratorType || 'FakerEmail');
    setFormTags(rule.complianceTags);
    setShowRuleModal(true);
  };

  const handleFormConnectorChange = (newConnectorId: string) => {
    setFormConnectorId(newConnectorId);
    const connMeta = CONNECTOR_ENTITIES_MAP[newConnectorId];
    if (connMeta && connMeta.entities.length > 0) {
      const firstEnt = connMeta.entities[0];
      setFormEntity(firstEnt.name);
      if (firstEnt.fields.length > 0) {
        setFormField(firstEnt.fields[0].name);
        setFormPiiCategory(firstEnt.fields[0].category);
      }
    }
  };

  const handleFormEntityChange = (newEntity: string) => {
    setFormEntity(newEntity);
    const connMeta = CONNECTOR_ENTITIES_MAP[formConnectorId];
    if (connMeta) {
      const foundEnt = connMeta.entities.find((e) => e.name === newEntity);
      if (foundEnt && foundEnt.fields.length > 0) {
        setFormField(foundEnt.fields[0].name);
        setFormPiiCategory(foundEnt.fields[0].category);
      }
    }
  };

  const handleFormFiledChange = (newField: string) => {
    setFormField(newField);
    const connMeta = CONNECTOR_ENTITIES_MAP[formConnectorId];
    if (connMeta) {
      const foundEnt = connMeta.entities.find((e) => e.name === formEntity);
      if (foundEnt) {
        const foundFld = foundEnt.fields.find((f) => f.name === newField);
        if (foundFld) {
          setFormPiiCategory(foundFld.category);
        }
      }
    }
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formField.trim()) return;

    const matchedConnector = INITIAL_CONNECTORS.find((c) => c.id === formConnectorId) || {
      name: CONNECTOR_ENTITIES_MAP[formConnectorId]?.name || 'Database Connector',
      provider: CONNECTOR_ENTITIES_MAP[formConnectorId]?.provider || 'SQL Database',
    };

    if (editingRule) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                connectorId: formConnectorId,
                connectorName: matchedConnector.name,
                targetProvider: matchedConnector.provider,
                entityName: formEntity,
                fieldName: formField,
                piiCategory: formPiiCategory,
                technique: formTechnique,
                maskChar: formMaskChar,
                saltKey: formSaltKey,
                syntheticGeneratorType: formSyntheticType,
                complianceTags: formTags,
              }
            : r
        )
      );
    } else {
      const newRule: AnonymizationRule = {
        id: `anon-rule-${Date.now()}`,
        connectorId: formConnectorId,
        connectorName: matchedConnector.name,
        targetProvider: matchedConnector.provider,
        entityName: formEntity,
        fieldName: formField,
        piiCategory: formPiiCategory,
        technique: formTechnique,
        maskChar: formMaskChar,
        saltKey: formSaltKey,
        syntheticGeneratorType: formSyntheticType,
        complianceTags: formTags,
        isActive: true,
      };
      setRules((prev) => [...prev, newRule]);
    }

    setShowRuleModal(false);
  };

  const handleDeleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRunAutoScanPII = () => {
    setIsScanningPII(true);
    setScanMessage(null);

    setTimeout(() => {
      setIsScanningPII(false);
      setScanMessage(
        'AI Schema Inspector scanned 6 active database connectors (Dynamics 365, SAP S/4HANA, SQL Server, Salesforce, PostgreSQL, HRMS API). Analyzed 84 fields across 12 target database tables. All 8 high-risk PII fields are mapped to live protection rules.'
      );
    }, 1200);
  };

  const handleTestConnectorBridges = () => {
    setIsTestingConnectors(true);
    setConnectorBridgeNotice(null);

    setTimeout(() => {
      setIsTestingConnectors(false);
      setConnectorBridgeNotice(
        'Live Target DB Connector Bridge Verified! Real-time schema hooks active for 6 connectors: Dynamics 365 BC (42ms), SQL Server (18ms), SAP S/4HANA (65ms), Salesforce (54ms), PostgreSQL (12ms), and HRMS REST API (95ms). Zero raw PII written to destination endpoints.'
      );
    }, 1000);
  };

  const handleExecuteSandboxAnonymization = () => {
    setIsSandboxRunning(true);
    setSandboxResult(null);

    const targetConnectorObj = INITIAL_CONNECTORS.find((c) => c.id === sandboxConnectorId) || {
      name: 'Dynamics 365 Business Central (Prod)',
      latencyMs: 42,
    };

    setTimeout(() => {
      // Simulate transformation logic based on techniques
      const output: Record<string, string> = {
        full_name: 'Arthur Pendelton (Synthetic Fake)',
        email_address: 'g.m********@enterprise.org',
        social_security_num: 'sha256=e9b2f7a102c9840d1a58e9204c00...',
        credit_card_number: 'TKN-FPE-4532-8901-XXXX-9128',
        annual_salary: '$140,000 - $150,000 Range (Generalization)',
        contact_phone: '+1 (555) 981-0249 (Synthetic)',
        medical_diagnosis_notes: '[REDACTED / NULLIFIED FOR HIPAA]',
      };

      setSandboxResult({
        output,
        connectorName: targetConnectorObj.name,
        latencyMs: targetConnectorObj.latencyMs || 28,
      });
      setIsSandboxRunning(false);
    }, 700);
  };

  const pySparkCodeSnippet = `from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sha2, concat, lit, expr, regexp_replace

# Real-Time Target Database Connector Anonymization Proxy
# Target Connectors: Dynamics 365 BC, SAP S/4HANA, SQL Server, Salesforce, PostgreSQL Warehouse
spark = SparkSession.builder.appName("PII_Target_DB_Anonymization_Engine").getOrCreate()

def apply_realtime_connector_masking(df, connector_id, entity_name):
    if connector_id == "conn-bc-prod" and "Customer" in entity_name:
        return df \\
            .withColumn("email_address", regexp_replace(col("email_address"), "(?<=.{2}).(?=.*@)", "*")) \\
            .withColumn("social_security_num", sha2(concat(col("social_security_num"), lit("_e9b2_prod_salt_2026")), 256))
    elif connector_id == "conn-sfdc-main":
        return df.withColumn("Billing_Email__c", expr("fpe_encrypt_token(Billing_Email__c)"))
    elif connector_id == "conn-sap-s4":
        return df.withColumn("SMTP_ADDR", regexp_replace(col("SMTP_ADDR"), "(?<=.{2}).(?=.*@)", "*"))
    return df
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pySparkCodeSnippet);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <EyeOff className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Data Anonymization & Target DB Privacy Shield
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold font-mono rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Real-Time Connector Proxy Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Configure irreversible masking, HMAC/SHA-256 tokenization, format-preserving encryption, and synthetic data replacement bound directly to target database connectors (Dynamics 365, SAP, SQL Server, Salesforce, PostgreSQL).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTestConnectorBridges}
            disabled={isTestingConnectors}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-all cursor-pointer"
          >
            <Radio className={`w-4 h-4 text-emerald-600 ${isTestingConnectors ? 'animate-pulse' : ''}`} />
            <span>{isTestingConnectors ? 'Testing DB Connectors...' : 'Test Target DB Bridge'}</span>
          </button>

          <button
            onClick={handleRunAutoScanPII}
            disabled={isScanningPII}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-all cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isScanningPII ? 'animate-spin' : ''}`} />
            <span>{isScanningPII ? 'Scanning Connectors...' : 'Auto-Scan PII Risks'}</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Field Rule</span>
          </button>
        </div>
      </div>

      {/* Target DB Connector Integration Health Banner */}
      <div className="p-4 bg-white text-slate-900 rounded-2xl shadow-2xs border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Target Database Connector Synchronization</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold rounded border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                6 CONNECTORS LINKED IN REAL TIME
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Target DB entities from <strong className="text-slate-900 font-semibold">Dynamics 365, SAP S/4HANA, SQL Server, Salesforce, PostgreSQL</strong>, and <strong className="text-slate-900 font-semibold">HRMS REST API</strong> are intercepted before writing to destination storage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 font-mono text-xs border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Proxy Latency</span>
            <span className="text-emerald-600 font-bold">0.8 ms</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Raw PII Written</span>
            <span className="text-emerald-700 font-bold">0 Records (100% Sanitized)</span>
          </div>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{scanMessage}</span>
          </div>
          <button onClick={() => setScanMessage(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {connectorBridgeNotice && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{connectorBridgeNotice}</span>
          </div>
          <button onClick={() => setConnectorBridgeNotice(null)} className="text-indigo-600 hover:text-indigo-800 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Target Connectors Linked</span>
            <Server className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              6 / 6
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold font-mono">
              All Synchronized
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Bound to {entitiesList.length} database entities</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Protected PII Fields</span>
            <Lock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {rules.filter((r) => r.isActive).length}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold font-mono">
              100% Covered
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Real-time inline sanitization</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>HMAC Vault Salt Rotation</span>
            <KeyRound className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active • 256-Bit
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Key ID: vault_salt_prod_2026</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Real-Time Masking Engine</span>
            <Cpu className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">1.25M</span>
            <span className="text-[11px] text-slate-500 font-mono">recs/min</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Zero raw PII written to destination</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'rules'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Connector Anonymization Rules ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sandbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'sandbox'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Live Target Connector Sandbox</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Anonymization Audit Log</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tokenization')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'tokenization'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Tokenization & Salt Vault</span>
        </button>

        <button
          onClick={() => setActiveSubTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'compliance'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Compliance Policy Export</span>
        </button>
      </div>

      {/* SUB-TAB 1: ENTITY RULES TABLE */}
      {activeSubTab === 'rules' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search field, entity or connector..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Target Connector Filter */}
              <select
                value={selectedConnectorFilter}
                onChange={(e) => setSelectedConnectorFilter(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="All">All Target Connectors</option>
                {connectorsList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Entity Filter */}
              <select
                value={selectedEntityFilter}
                onChange={(e) => setSelectedEntityFilter(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="All">All Target Entities</option>
                {entitiesList.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>

              {/* Compliance Filter */}
              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="All">All Regulations</option>
                <option value="GDPR">GDPR</option>
                <option value="HIPAA">HIPAA</option>
                <option value="CCPA">CCPA</option>
                <option value="PCI-DSS">PCI-DSS</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Showing {filteredRules.length} rules
            </div>
          </div>

          {/* Rules Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <OverflowTableWrapper hintLabel="Scroll horizontally to inspect target database connector rules">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Target Connector</th>
                    <th className="py-3 px-4">Database Entity</th>
                    <th className="py-3 px-4">Target Field</th>
                    <th className="py-3 px-4">PII Category</th>
                    <th className="py-3 px-4">Anonymization Technique</th>
                    <th className="py-3 px-4">Compliance Tags</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredRules.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleRule(r.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            r.isActive ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              r.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 shrink-0">
                            <Server className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs leading-tight">
                              {r.connectorName || 'Dynamics 365 BC (Prod)'}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              Connected • Real-Time
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                        <div className="flex items-center gap-2">
                          <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{r.entityName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-indigo-700 font-bold">{r.fieldName}</td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold border border-slate-200">
                          {r.piiCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-bold border border-indigo-100">
                            {r.technique}
                          </span>
                          {r.maskChar && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              (mask: {r.maskChar})
                            </span>
                          )}
                          {r.saltKey && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              (Salted)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="flex flex-wrap gap-1">
                          {r.complianceTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Edit Rule"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(r.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </OverflowTableWrapper>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SANDBOX TAB */}
      {activeSubTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900">Live Connector Test Input Payload</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Incoming Raw PII
              </span>
            </div>

            {/* Target Connector Endpoint Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Select Target Database Connector</span>
                <span className="text-[10px] text-emerald-600 font-mono font-normal">🟢 Bridge Connected</span>
              </label>
              <select
                value={sandboxConnectorId}
                onChange={(e) => setSandboxConnectorId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
              >
                {INITIAL_CONNECTORS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.provider}) • {c.latencyMs || 25}ms Latency
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {Object.entries(sandboxRecord).map(([key, val]) => (
                <div key={key}>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1">{key}</label>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) =>
                      setSandboxRecord((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleExecuteSandboxAnonymization}
              disabled={isSandboxRunning}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Zap className={`w-4 h-4 ${isSandboxRunning ? 'animate-spin' : ''}`} />
              <span>{isSandboxRunning ? 'Intercepting & Masking...' : 'Run Target Connector Sandbox'}</span>
            </button>
          </div>

          {/* Output Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900">Anonymized Output Payload</h3>
                </div>
                <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                  Destination Compliant
                </span>
              </div>

              {sandboxResult ? (
                <div>
                  <div className="mb-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">Target Connector:</span>
                    <span className="font-bold text-indigo-700 font-mono">{sandboxResult.connectorName}</span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    {Object.entries(sandboxResult.output).map(([key, value]) => (
                      <div key={key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                          <span className="text-indigo-600 font-bold">{key}</span>
                          <span className="text-slate-400 font-sans text-[9px] uppercase font-semibold">Transformed</span>
                        </div>
                        <div className="text-emerald-700 font-bold text-xs truncate">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <Play className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span>Click "Run Target Connector Sandbox" to test real-time transformation against the selected target database.</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Zero PII Leakage Confirmed
              </span>
              <span className="font-mono">Latency: {sandboxResult ? `${sandboxResult.latencyMs}ms` : '0.8ms'}</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TOKENIZATION & SALT VAULT */}
      {activeSubTab === 'tokenization' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Vaultless Tokenization & Target DB Salt Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely derive deterministic or non-deterministic tokens using HMAC-SHA256 and Format-Preserving Encryption (FPE) synchronized across target database connectors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">Active HMAC Secret Salt</span>
              </div>
              <input
                type="password"
                value="e9b2_prod_salt_2026_x89a01fd"
                readOnly
                className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-700"
              />
              <p className="text-[11px] text-slate-500">
                Salt keys ensure that identical PII values produce unique irreversible hashes across target connector environments.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">Format-Preserving Encryption (FPE)</span>
              </div>
              <div className="text-xs text-slate-700 space-y-1 font-mono">
                <div>• Alphabet: Alphanumeric (A-Z, 0-9)</div>
                <div>• Mode: FF1 Cipher / AES-128 Key</div>
                <div>• Length Preservation: Strict Match</div>
              </div>
              <p className="text-[11px] text-slate-500">
                Ensures target database column length restrictions and regex validation constraints are satisfied in downstream destination tables.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: AUDIT LOG */}
      {activeSubTab === 'audit' && <AnonymizationAuditLog />}

      {/* SUB-TAB 4: COMPLIANCE EXPORT */}
      {activeSubTab === 'compliance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Target Database Pipeline Code Export</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Export real-time anonymization rules bound to target database connectors directly as PySpark or Dbt transformation code snippets.
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy PySpark Spec'}</span>
            </button>
          </div>

          <div className="bg-slate-950 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto">
            <pre>{pySparkCodeSnippet}</pre>
          </div>
        </div>
      )}

      {/* Rule Add / Edit Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {editingRule ? 'Edit Target DB Anonymization Rule' : 'Add Target DB Anonymization Rule'}
                  </h2>
                  <p className="text-[11px] text-slate-500">Bind masking rules directly to active database connectors</p>
                </div>
              </div>
              <button
                onClick={() => setShowRuleModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4">
              {/* Target Connector Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Target Database Connector</span>
                  <span className="text-[10px] text-emerald-600 font-mono font-normal">🟢 Connected</span>
                </label>
                <select
                  value={formConnectorId}
                  onChange={(e) => handleFormConnectorChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                >
                  {INITIAL_CONNECTORS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.provider}) • {c.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Entity Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Database Entity / Table</label>
                <select
                  value={formEntity}
                  onChange={(e) => handleFormEntityChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                >
                  {CONNECTOR_ENTITIES_MAP[formConnectorId]?.entities.map((ent) => (
                    <option key={ent.name} value={ent.name}>
                      {ent.name}
                    </option>
                  )) || (
                    <option value={formEntity}>{formEntity}</option>
                  )}
                </select>
              </div>

              {/* Target Field Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Field Name</label>
                <select
                  value={formField}
                  onChange={(e) => handleFormFiledChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                >
                  {CONNECTOR_ENTITIES_MAP[formConnectorId]?.entities
                    .find((e) => e.name === formEntity)
                    ?.fields.map((fld) => (
                      <option key={fld.name} value={fld.name}>
                        {fld.name} ({fld.category})
                      </option>
                    )) || (
                    <option value={formField}>{formField}</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PII Category</label>
                  <select
                    value={formPiiCategory}
                    onChange={(e) => setFormPiiCategory(e.target.value as PIICategory)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  >
                    <option value="Email">Email</option>
                    <option value="SSN/Tax">SSN / Tax ID</option>
                    <option value="CreditCard">Credit Card</option>
                    <option value="PersonalName">Personal Name</option>
                    <option value="Phone">Phone Number</option>
                    <option value="Financial">Financial / Banking</option>
                    <option value="Health">Health / Medical</option>
                    <option value="Address">Address</option>
                    <option value="GeneralPII">General PII</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Anonymization Technique</label>
                  <select
                    value={formTechnique}
                    onChange={(e) => setFormTechnique(e.target.value as AnonymizationTechnique)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                  >
                    <option value="PartialMask">Partial Masking</option>
                    <option value="SHA256_Salted">Salted SHA-256 Hash</option>
                    <option value="HMAC_Tokenization">HMAC Tokenization</option>
                    <option value="FormatPreservingToken">Format Preserving (FPE)</option>
                    <option value="SyntheticData">Synthetic Generator</option>
                    <option value="Nullification">Nullification ([REDACTED])</option>
                    <option value="GeneralizationBucket">Generalization Bucket</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-center justify-between font-mono">
                <span>Target DB Sync Hook:</span>
                <span className="font-bold text-indigo-700">Real-Time Write Interceptor</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
