import React, { useState } from 'react';
import {
  Database,
  FileCode,
  Table,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Copy,
  Layers,
  ArrowRight,
  Sparkles,
  Key,
  ShieldAlert,
  FileSpreadsheet,
  Zap,
  RefreshCw,
  Sliders,
  Check,
  ChevronDown,
  HardDrive,
  Code,
  HelpCircle,
  FileText,
  Building2,
  Tag
} from 'lucide-react';
import { ExportSchedule, ExportFormat, StorageDestinationType } from '../types';

export interface FieldMappingDetail {
  id: string;
  sourceEntity: string;
  sourceField: string;
  sourceDataType: string;
  targetExportField: string;
  targetDataType: string;
  transformationRule: string;
  piiMasking: 'SHA-256 Salted Hash' | 'Partial Masking' | 'Format-Preserving Token' | 'Unmasked / Public' | 'HMAC Tokenization';
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  sampleOutputValue: string;
  validationStatus: 'Valid' | 'Warning' | 'Transformed';
}

export interface ExportSchemaConfig {
  id: string;
  name: string;
  category: 'Snapshot Feed' | 'CSV Output Dataset' | 'Ad-hoc Export';
  format: ExportFormat;
  destinationType: StorageDestinationType;
  destinationUri: string;
  compression: string;
  encryption: string;
  partitioning: string;
  targetEntities: {
    entityName: string;
    description: string;
    fieldMappings: FieldMappingDetail[];
  }[];
}

// Sample Comprehensive Export Schemas Data
export const MOCK_EXPORT_SCHEMAS: ExportSchemaConfig[] = [
  {
    id: 'sch-101',
    name: 'Daily Parquet Data Lake Sync',
    category: 'Snapshot Feed',
    format: 'Parquet (Snappy)',
    destinationType: 'AWS S3',
    destinationUri: 's3://enterprise-data-lake-prod/snapshots/daily/',
    compression: 'Snappy High',
    encryption: 'AES-256 KMS',
    partitioning: 'year={YYYY}/month={MM}/day={DD}',
    targetEntities: [
      {
        entityName: 'Customer Master (KNA1)',
        description: 'SAP Customer Master & Sales Area Data with PII Anonymization',
        fieldMappings: [
          {
            id: 'f1',
            sourceEntity: 'SAP_ECC.KNA1',
            sourceField: 'KUNNR',
            sourceDataType: 'CHAR(10)',
            targetExportField: 'customer_account_id',
            targetDataType: 'String',
            transformationRule: 'Trim whitespace & prefix CUST-',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: 'CUST-10029',
            validationStatus: 'Valid',
          },
          {
            id: 'f2',
            sourceEntity: 'SAP_ECC.KNA1',
            sourceField: 'NAME1',
            sourceDataType: 'VARCHAR(35)',
            targetExportField: 'customer_name',
            targetDataType: 'String',
            transformationRule: 'TitleCase & Strip Special Chars',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: 'Acme Global Corporation',
            validationStatus: 'Transformed',
          },
          {
            id: 'f3',
            sourceEntity: 'SAP_ECC.KNA1',
            sourceField: 'STCEG',
            sourceDataType: 'VARCHAR(20)',
            targetExportField: 'tax_identifier_hash',
            targetDataType: 'String (SHA256)',
            transformationRule: 'SHA-256 Salted Hashing (GDPR Compliant)',
            piiMasking: 'SHA-256 Salted Hash',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: true,
            sampleOutputValue: 'e3b0c44298fc1c149afbf4c8996fb924',
            validationStatus: 'Valid',
          },
          {
            id: 'f4',
            sourceEntity: 'SAP_ECC.KNA1',
            sourceField: 'STRAS',
            sourceDataType: 'VARCHAR(60)',
            targetExportField: 'street_address',
            targetDataType: 'String',
            transformationRule: 'Trim & Coalesce Nulls -> "N/A"',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: true,
            sampleOutputValue: '100 Enterprise Way',
            validationStatus: 'Valid',
          },
          {
            id: 'f5',
            sourceEntity: 'SAP_ECC.KNA1',
            sourceField: 'PSTLZ',
            sourceDataType: 'VARCHAR(10)',
            targetExportField: 'postal_code',
            targetDataType: 'String',
            transformationRule: 'Pad 5 Digits',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: '02138',
            validationStatus: 'Valid',
          },
          {
            id: 'f6',
            sourceEntity: 'SAP_ECC.KNA1',
            sourceField: 'LAND1',
            sourceDataType: 'CHAR(2)',
            targetExportField: 'country_code_iso2',
            targetDataType: 'String',
            transformationRule: 'Uppercase ISO 3166-1',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: 'US',
            validationStatus: 'Valid',
          },
          {
            id: 'f7',
            sourceEntity: 'SAP_ECC.KNA1',
            sourceField: 'TELF1',
            sourceDataType: 'VARCHAR(16)',
            targetExportField: 'primary_phone_masked',
            targetDataType: 'String',
            transformationRule: 'Partial Masking (Keep Last 4 Digits)',
            piiMasking: 'Partial Masking',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: true,
            sampleOutputValue: '+1 (555) ***-8900',
            validationStatus: 'Transformed',
          },
          {
            id: 'f8',
            sourceEntity: 'SAP_ECC.KNA1',
            sourceField: 'SMTP_ADDR',
            sourceDataType: 'VARCHAR(241)',
            targetExportField: 'contact_email_masked',
            targetDataType: 'String',
            transformationRule: 'Mask Local Part',
            piiMasking: 'Partial Masking',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: true,
            sampleOutputValue: 'c****@acme.com',
            validationStatus: 'Transformed',
          },
          {
            id: 'f9',
            sourceEntity: 'SAP_ECC.KNA1',
            sourceField: 'ERDAT',
            sourceDataType: 'DATE',
            targetExportField: 'created_date_utc',
            targetDataType: 'Date (ISO8601)',
            transformationRule: 'Format YYYY-MM-DD UTC',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: '2024-03-15',
            validationStatus: 'Valid',
          },
          {
            id: 'f10',
            sourceEntity: 'SAP_ECC.KNA1',
            sourceField: 'UMSAT',
            sourceDataType: 'DECIMAL(15,2)',
            targetExportField: 'annual_revenue_usd',
            targetDataType: 'Double',
            transformationRule: 'Convert Currency EUR -> USD @ 1.085',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: true,
            sampleOutputValue: '14250000.00',
            validationStatus: 'Transformed',
          },
        ],
      },
      {
        entityName: 'SAP Sales Orders (VBAK)',
        description: 'Sales Order Headers and Billing Totals',
        fieldMappings: [
          {
            id: 'so1',
            sourceEntity: 'SAP_ECC.VBAK',
            sourceField: 'VBELN',
            sourceDataType: 'CHAR(10)',
            targetExportField: 'sales_order_number',
            targetDataType: 'String',
            transformationRule: 'Trim & Prefix SO-',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: 'SO-992011',
            validationStatus: 'Valid',
          },
          {
            id: 'so2',
            sourceEntity: 'SAP_ECC.VBAK',
            sourceField: 'KUNNR',
            sourceDataType: 'CHAR(10)',
            targetExportField: 'sold_to_customer_id',
            targetDataType: 'String',
            transformationRule: 'FK Mapping to Customer Master',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false,
            sampleOutputValue: 'CUST-10029',
            validationStatus: 'Valid',
          },
          {
            id: 'so3',
            sourceEntity: 'SAP_ECC.VBAK',
            sourceField: 'AUDAT',
            sourceDataType: 'DATE',
            targetExportField: 'order_date_utc',
            targetDataType: 'Date (ISO8601)',
            transformationRule: 'ISO-8601 UTC Date Conversion',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: '2026-08-11',
            validationStatus: 'Valid',
          },
          {
            id: 'so4',
            sourceEntity: 'SAP_ECC.VBAK',
            sourceField: 'NETWR',
            sourceDataType: 'DECIMAL(15,2)',
            targetExportField: 'net_order_amount_usd',
            targetDataType: 'Double',
            transformationRule: 'Round to 2 Decimal Places',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: '45200.50',
            validationStatus: 'Valid',
          },
          {
            id: 'so5',
            sourceEntity: 'SAP_ECC.VBAK',
            sourceField: 'WAERK',
            sourceDataType: 'CHAR(3)',
            targetExportField: 'currency_code',
            targetDataType: 'String',
            transformationRule: 'ISO Currency Code Standard',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: 'USD',
            validationStatus: 'Valid',
          },
        ],
      },
    ],
  },
  {
    id: 'sch-102',
    name: 'Weekly Cleansed Audit Feed',
    category: 'Snapshot Feed',
    format: 'CSV (Zip Compressed)',
    destinationType: 'Google Cloud Storage',
    destinationUri: 'gs://edimp-migration-audit-bucket/weekly-zip/',
    compression: 'Zip Archive Standard',
    encryption: 'Standard TLS + KMS',
    partitioning: 'system={SRC_SYS}/entity={ENTITY}',
    targetEntities: [
      {
        entityName: 'Quarantined Error Records',
        description: 'Validation Exceptions, FK Failures, and Type Violations',
        fieldMappings: [
          {
            id: 'e1',
            sourceEntity: 'STAGE_VAL.ERR_LOG',
            sourceField: 'ERR_ID',
            sourceDataType: 'VARCHAR(32)',
            targetExportField: 'error_record_id',
            targetDataType: 'String',
            transformationRule: 'Exact Pass-through',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: 'ERR-9012',
            validationStatus: 'Valid',
          },
          {
            id: 'e2',
            sourceEntity: 'STAGE_VAL.ERR_LOG',
            sourceField: 'TENANT_ID',
            sourceDataType: 'VARCHAR(20)',
            targetExportField: 'tenant_code',
            targetDataType: 'String',
            transformationRule: 'Uppercase Tenant Identifier',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false,
            sampleOutputValue: 'TENANT-ACME',
            validationStatus: 'Valid',
          },
          {
            id: 'e3',
            sourceEntity: 'STAGE_VAL.ERR_LOG',
            sourceField: 'SRC_SYS',
            sourceDataType: 'VARCHAR(30)',
            targetExportField: 'source_system_type',
            targetDataType: 'String',
            transformationRule: 'System Name Standardizer',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: 'SAP ECC 6.0',
            validationStatus: 'Valid',
          },
          {
            id: 'e4',
            sourceEntity: 'STAGE_VAL.ERR_LOG',
            sourceField: 'ERR_CAT',
            sourceDataType: 'VARCHAR(40)',
            targetExportField: 'error_category',
            targetDataType: 'String',
            transformationRule: 'Categorization Enum Match',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: 'FK Constraint Violation',
            validationStatus: 'Valid',
          },
          {
            id: 'e5',
            sourceEntity: 'STAGE_VAL.ERR_LOG',
            sourceField: 'FAIL_FLD',
            sourceDataType: 'VARCHAR(50)',
            targetExportField: 'failed_field_name',
            targetDataType: 'String',
            transformationRule: 'Physical Column Identifier',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: 'KUNNR',
            validationStatus: 'Valid',
          },
          {
            id: 'e6',
            sourceEntity: 'STAGE_VAL.ERR_LOG',
            sourceField: 'ORIG_VAL',
            sourceDataType: 'TEXT',
            targetExportField: 'original_failed_value',
            targetDataType: 'String',
            transformationRule: 'HMAC Salted Tokenization',
            piiMasking: 'HMAC Tokenization',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: true,
            sampleOutputValue: 'HMAC_TOK_88391024',
            validationStatus: 'Transformed',
          },
        ],
      },
    ],
  },
  {
    id: 'sch-103',
    name: 'Monthly Finance Ledger Snapshot',
    category: 'Snapshot Feed',
    format: 'Parquet (ZSTD)',
    destinationType: 'Azure Blob Storage',
    destinationUri: 'azure://financesnapshots.blob.core.windows.net/monthly-ledger/',
    compression: 'ZSTD Max Level 9',
    encryption: 'PGP Key Encryption',
    partitioning: 'year={YYYY}/period={MM}',
    targetEntities: [
      {
        entityName: 'GL Balances (GL_BALANCES)',
        description: 'General Ledger Accounts and Consolidated Balances',
        fieldMappings: [
          {
            id: 'gl1',
            sourceEntity: 'FIN_STAGE.GL_BAL',
            sourceField: 'ACC_NUM',
            sourceDataType: 'VARCHAR(15)',
            targetExportField: 'gl_account_number',
            targetDataType: 'String',
            transformationRule: 'Zero Pad 10 Digits',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: '0010002040',
            validationStatus: 'Transformed',
          },
          {
            id: 'gl2',
            sourceEntity: 'FIN_STAGE.GL_BAL',
            sourceField: 'BAL_AMT',
            sourceDataType: 'NUMERIC(18,4)',
            targetExportField: 'balance_amount_usd',
            targetDataType: 'Double',
            transformationRule: 'Round 4 Decimals',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: '8492011.4500',
            validationStatus: 'Valid',
          },
          {
            id: 'gl3',
            sourceEntity: 'FIN_STAGE.GL_BAL',
            sourceField: 'FISCAL_YR',
            sourceDataType: 'INT',
            targetExportField: 'fiscal_year',
            targetDataType: 'Integer',
            transformationRule: 'Range Validation 2000-2030',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: '2026',
            validationStatus: 'Valid',
          },
          {
            id: 'gl4',
            sourceEntity: 'FIN_STAGE.GL_BAL',
            sourceField: 'PERIOD',
            sourceDataType: 'INT',
            targetExportField: 'fiscal_period',
            targetDataType: 'Integer',
            transformationRule: 'Month Number 1-12',
            piiMasking: 'Unmasked / Public',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            sampleOutputValue: '8',
            validationStatus: 'Valid',
          },
        ],
      },
    ],
  },
];

interface DataSchemaPreviewToolProps {
  initialConfigId?: string;
  onClose?: () => void;
}

export const DataSchemaPreviewTool: React.FC<DataSchemaPreviewToolProps> = ({
  initialConfigId,
  onClose,
}) => {
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>(
    initialConfigId || MOCK_EXPORT_SCHEMAS[0].id
  );
  const [selectedEntityIndex, setSelectedEntityIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [piiFilter, setPiiFilter] = useState<'All' | 'PII Only' | 'Public Only'>('All');
  const [keyFilter, setKeyFilter] = useState<'All' | 'Primary Keys' | 'Foreign Keys'>('All');
  const [activeViewMode, setActiveViewMode] = useState<'table' | 'json' | 'ddl' | 'sampleRow'>('table');
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);

  // Loading skeleton animation state
  const [isLoadingSchema, setIsLoadingSchema] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(100);
  const [loadingStepText, setLoadingStepText] = useState<string>('Schema metadata loaded successfully');

  // Simulated Async Schema Fetch with Loading Skeleton
  const triggerSchemaLoad = (newSchemaId?: string, newEntityIdx?: number) => {
    setIsLoadingSchema(true);
    setLoadingProgress(15);
    setLoadingStepText('Connecting to Schema Catalog & Metadata Repository...');

    if (newSchemaId !== undefined) {
      setSelectedSchemaId(newSchemaId);
      setSelectedEntityIndex(0);
    } else if (newEntityIdx !== undefined) {
      setSelectedEntityIndex(newEntityIdx);
    }

    setTimeout(() => {
      setLoadingProgress(55);
      setLoadingStepText('Compiling source-to-target field mapping definitions...');
    }, 200);

    setTimeout(() => {
      setLoadingProgress(85);
      setLoadingStepText('Applying PII masking rules & generating live sample values...');
    }, 400);

    setTimeout(() => {
      setLoadingProgress(100);
      setLoadingStepText('Schema verified & rendered successfully.');
      setIsLoadingSchema(false);
    }, 600);
  };

  const selectedSchema =
    MOCK_EXPORT_SCHEMAS.find((s) => s.id === selectedSchemaId) || MOCK_EXPORT_SCHEMAS[0];

  const currentEntity =
    selectedSchema.targetEntities[selectedEntityIndex] || selectedSchema.targetEntities[0];

  // Filter mappings
  const filteredMappings = currentEntity.fieldMappings.filter((m) => {
    const matchesSearch =
      m.sourceField.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.targetExportField.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.transformationRule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sourceDataType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPii =
      piiFilter === 'All'
        ? true
        : piiFilter === 'PII Only'
        ? m.piiMasking !== 'Unmasked / Public'
        : m.piiMasking === 'Unmasked / Public';

    const matchesKey =
      keyFilter === 'All'
        ? true
        : keyFilter === 'Primary Keys'
        ? m.isPrimaryKey
        : m.isForeignKey;

    return matchesSearch && matchesPii && matchesKey;
  });

  // Calculate Metrics
  const totalFields = currentEntity.fieldMappings.length;
  const piiCount = currentEntity.fieldMappings.filter((m) => m.piiMasking !== 'Unmasked / Public').length;
  const transformedCount = currentEntity.fieldMappings.filter((m) => m.validationStatus === 'Transformed').length;
  const pkCount = currentEntity.fieldMappings.filter((m) => m.isPrimaryKey).length;

  // Generate JSON Schema Representation
  const generateJsonSchema = () => {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    currentEntity.fieldMappings.forEach((m) => {
      properties[m.targetExportField] = {
        type: m.targetDataType.toLowerCase().includes('int')
          ? 'integer'
          : m.targetDataType.toLowerCase().includes('double') || m.targetDataType.toLowerCase().includes('decimal')
          ? 'number'
          : 'string',
        description: `Source: ${m.sourceEntity}.${m.sourceField} (${m.sourceDataType}). Rule: ${m.transformationRule}`,
        piiMasking: m.piiMasking,
        sampleValue: m.sampleOutputValue,
      };
      if (!m.isNullable) {
        required.push(m.targetExportField);
      }
    });

    return JSON.stringify(
      {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        title: `${selectedSchema.name} - ${currentEntity.entityName}`,
        type: 'object',
        exportFormat: selectedSchema.format,
        destination: selectedSchema.destinationType,
        properties,
        required,
      },
      null,
      2
    );
  };

  // Generate SQL DDL Representation
  const generateSqlDdl = () => {
    const lines = currentEntity.fieldMappings.map((m) => {
      const sqlName = m.targetExportField.padEnd(28, ' ');
      let sqlType = 'VARCHAR(255)';
      if (m.targetDataType.includes('Integer')) sqlType = 'INT';
      else if (m.targetDataType.includes('Double')) sqlType = 'NUMERIC(18,4)';
      else if (m.targetDataType.includes('Date')) sqlType = 'TIMESTAMP_NTZ';

      const nullability = m.isNullable ? 'NULL    ' : 'NOT NULL';
      const pkTag = m.isPrimaryKey ? ' PRIMARY KEY' : '';
      return `  ${sqlName} ${sqlType.padEnd(16, ' ')} ${nullability}${pkTag}`;
    });

    return `-- Generated Export Schema DDL Spec for ${selectedSchema.name}
-- Target Format: ${selectedSchema.format} | Partitioning: ${selectedSchema.partitioning}
CREATE TABLE export_${currentEntity.entityName.toLowerCase().replace(/[^a-z0-9]/g, '_')} (
${lines.join(',\n')}
);`;
  };

  // Copy Schema Text
  const handleCopySchema = () => {
    const textToCopy = activeViewMode === 'json' ? generateJsonSchema() : generateSqlDdl();
    navigator.clipboard.writeText(textToCopy);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  // Download Schema Spec File
  const handleDownloadSchemaSpec = () => {
    const isJson = activeViewMode === 'json';
    const content = isJson ? generateJsonSchema() : generateSqlDdl();
    const extension = isJson ? 'json' : 'sql';
    const mimeType = isJson ? 'application/json' : 'text/plain';

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export_schema_${selectedSchema.id}_${currentEntity.entityName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-purple-600" /> Export Data Schema Previewer
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Schema Verified &amp; Mapped
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" /> Export Field Mapping Structure Tool
          </h2>

          <p className="text-slate-500 text-xs max-w-3xl">
            Inspect source-to-target field mapping definitions, data type conversions, PII masking rules, and live output sample values prior to generating export files.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all self-start md:self-auto"
          >
            Close Preview
          </button>
        )}
      </div>

      {/* Configuration Selector Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-purple-600" /> Select Export Configuration Schedule:
            </label>

            <div className="flex items-center gap-2">
              <select
                value={selectedSchemaId}
                onChange={(e) => triggerSchemaLoad(e.target.value)}
                disabled={isLoadingSchema}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[280px] disabled:opacity-50"
              >
                {MOCK_EXPORT_SCHEMAS.map((sch) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.name} ({sch.format} → {sch.destinationType})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => triggerSchemaLoad()}
                disabled={isLoadingSchema}
                className="p-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
                title="Reload Data Schema & Fetch Live Metadata"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingSchema ? 'animate-spin text-purple-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Active Config Overview Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-[10px] uppercase block font-sans">Format</span>
              <span className="font-bold text-slate-800">{selectedSchema.format}</span>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-[10px] uppercase block font-sans">Destination</span>
              <span className="font-bold text-purple-700">{selectedSchema.destinationType}</span>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-[10px] uppercase block font-sans">Compression</span>
              <span className="font-bold text-emerald-700">{selectedSchema.compression}</span>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-[10px] uppercase block font-sans">Encryption</span>
              <span className="font-bold text-indigo-700">{selectedSchema.encryption}</span>
            </div>
          </div>
        </div>

        {/* Target Entity Tabs */}
        {selectedSchema.targetEntities.length > 1 && (
          <div className="flex items-center gap-2 border-t border-slate-200 pt-3 font-mono text-xs">
            <span className="text-slate-500 font-sans font-bold text-xs">Entities in Export:</span>
            {selectedSchema.targetEntities.map((ent, idx) => (
              <button
                key={ent.entityName}
                type="button"
                disabled={isLoadingSchema}
                onClick={() => triggerSchemaLoad(undefined, idx)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedEntityIndex === idx
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {ent.entityName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SKELETON ANIMATION LOADING STATE vs REAL RENDER */}
      {isLoadingSchema ? (
        <div className="space-y-6">
          {/* Progress Step Banner */}
          <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-900">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
                <span>{loadingStepText}</span>
              </span>
              <span>{loadingProgress}%</span>
            </div>
            <div className="w-full bg-purple-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>

          {/* KPI Skeleton Highlight Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 animate-pulse">
                <div className="h-3.5 w-24 bg-slate-200 rounded" />
                <div className="h-7 w-12 bg-slate-300 rounded" />
                <div className="h-3 w-32 bg-slate-200 rounded" />
              </div>
            ))}
          </div>

          {/* Toolbar Skeleton */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-48 bg-slate-100 rounded-xl animate-pulse border border-slate-200" />
              <div className="h-8 w-28 bg-slate-100 rounded-xl animate-pulse border border-slate-200" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-56 bg-slate-100 rounded-xl animate-pulse border border-slate-200" />
              <div className="h-8 w-20 bg-purple-100 rounded-xl animate-pulse border border-purple-200" />
            </div>
          </div>

          {/* Table / Schema Data Skeleton Rows */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="h-9 bg-slate-200 rounded-lg animate-pulse w-full" />
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="flex items-center justify-between gap-4 p-3 bg-white border border-slate-200 rounded-lg animate-pulse">
                <div className="space-y-1 grow">
                  <div className="h-3.5 w-36 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
                <div className="h-5 w-20 bg-purple-100 rounded" />
                <div className="space-y-1 grow">
                  <div className="h-3.5 w-40 bg-slate-200 rounded" />
                  <div className="h-3 w-48 bg-slate-100 rounded" />
                </div>
                <div className="h-5 w-24 bg-amber-100 rounded" />
                <div className="h-5 w-28 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Summary KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Mapped Fields</span>
            <Table className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{totalFields}</div>
          <p className="text-[10px] text-slate-500">Target columns defined in export</p>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-amber-800 text-xs font-medium">
            <span>PII Masked Fields</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">{piiCount}</div>
          <p className="text-[10px] text-amber-700">SHA256, HMAC or Partial Masked</p>
        </div>

        <div className="bg-indigo-50/60 border border-indigo-200 p-3.5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-indigo-800 text-xs font-medium">
            <span>Transformed Rules</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900 font-mono">{transformedCount}</div>
          <p className="text-[10px] text-indigo-700">Active format conversions</p>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-medium">
            <span>Primary Keys (PK)</span>
            <Key className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono">{pkCount}</div>
          <p className="text-[10px] text-emerald-700">Unique identifier attributes</p>
        </div>
      </div>

      {/* Toolbar: Search, Filters & View Toggle Mode */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search field names or rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* PII Filter */}
          <select
            value={piiFilter}
            onChange={(e) => setPiiFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="All">All Security Scopes</option>
            <option value="PII Only">PII Masked Only</option>
            <option value="Public Only">Unmasked / Public Only</option>
          </select>

          {/* Key Filter */}
          <select
            value={keyFilter}
            onChange={(e) => setKeyFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="All">All Key Types</option>
            <option value="Primary Keys">Primary Keys Only</option>
            <option value="Foreign Keys">Foreign Keys Only</option>
          </select>
        </div>

        {/* Mode Toggle & Export Schema */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveViewMode('table')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeViewMode === 'table'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Mapping Table</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('json')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeViewMode === 'json'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON Schema</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('ddl')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeViewMode === 'ddl'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>SQL DDL</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopySchema}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
            title="Copy schema definition"
          >
            {copiedStatus ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedStatus ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSchemaSpec}
            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Spec</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE CONTENT */}
      {activeViewMode === 'table' && (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider font-mono border-b border-slate-200">
                <th className="py-3 px-4">Source System &amp; Field</th>
                <th className="py-3 px-4">Src Type</th>
                <th className="py-3 px-4">Target Export Field Name</th>
                <th className="py-3 px-4">Target Type</th>
                <th className="py-3 px-4">Transformation &amp; Format Rule</th>
                <th className="py-3 px-4">PII Anonymization</th>
                <th className="py-3 px-4">Sample Output Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-mono">
                    No field mapping entries match the search/filter criteria.
                  </td>
                </tr>
              ) : (
                filteredMappings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Source Field */}
                    <td className="py-3 px-4">
                      <div className="font-bold font-mono text-slate-900 flex items-center gap-1.5">
                        {m.isPrimaryKey && (
                          <span
                            className="p-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold"
                            title="Primary Key"
                          >
                            PK
                          </span>
                        )}
                        {m.isForeignKey && (
                          <span
                            className="p-0.5 bg-indigo-100 text-indigo-800 rounded text-[9px] font-bold"
                            title="Foreign Key"
                          >
                            FK
                          </span>
                        )}
                        <span>{m.sourceField}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.sourceEntity}</div>
                    </td>

                    {/* Source Type */}
                    <td className="py-3 px-4 font-mono text-slate-600">{m.sourceDataType}</td>

                    {/* Target Export Field */}
                    <td className="py-3 px-4 font-bold font-mono text-purple-700">{m.targetExportField}</td>

                    {/* Target Type */}
                    <td className="py-3 px-4 font-mono text-slate-800">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold">
                        {m.targetDataType}
                      </span>
                    </td>

                    {/* Transformation Rule */}
                    <td className="py-3 px-4 text-slate-700">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="text-xs font-medium">{m.transformationRule}</span>
                      </div>
                    </td>

                    {/* PII Masking */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {m.piiMasking === 'Unmasked / Public' ? (
                        <span className="text-slate-500">Public</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-bold text-[10px] flex items-center gap-1 w-max">
                          <ShieldCheck className="w-3 h-3 text-amber-600" />
                          {m.piiMasking}
                        </span>
                      )}
                    </td>

                    {/* Sample Value */}
                    <td className="py-3 px-4 font-mono text-slate-900">
                      <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-bold text-emerald-700">
                        {m.sampleOutputValue}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeViewMode === 'json' && (
        <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
          <code>{generateJsonSchema()}</code>
        </pre>
      )}

      {activeViewMode === 'ddl' && (
        <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 overflow-x-auto leading-relaxed">
          <code>{generateSqlDdl()}</code>
        </pre>
      )}
        </>
      )}
    </div>
  );
};
