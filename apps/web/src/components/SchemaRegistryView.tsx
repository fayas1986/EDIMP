import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { SchemaRegistryItem, SchemaVersion, SchemaVersionDiff, SchemaFieldDefinition } from '../types';
import { MOCK_SCHEMA_REGISTRY } from '../data/mockSchemaRegistry';
import { computeSchemaVersionDiff } from '../utils/schemaDiff';
import { CDMEntity, CDMAttribute, CDMEntityName } from '../types/dualMapping';
import { INITIAL_CDM_ENTITIES } from '../data/dualMappingData';
import { OverflowTableWrapper } from './OverflowTableWrapper';
import {
  GitCommit,
  GitCompare,
  History,
  Layers,
  Database,
  ShieldAlert,
  Plus,
  Check,
  ArrowRight,
  AlertTriangle,
  Download,
  Calendar,
  User,
  Sparkles,
  FileCode,
  Sliders,
  X,
  Lock,
  Search,
  CheckCircle2,
  Tag,
  Briefcase,
  Wrench,
  GitFork,
  CornerDownRight,
  RefreshCw,
  Info,
  ShieldCheck,
  AlertOctagon,
  GitBranch,
  Activity,
  FileText,
  Brain,
  CheckSquare,
  Trash2,
  Settings,
  AlertCircle,
  Shield,
  LayoutGrid,
  List,
  GripVertical,
  Zap
} from 'lucide-react';

// Interfaces for new features
interface DriftEvent {
  id: string;
  timestamp: string;
  systemName: string;
  entityName: string;
  changeType: 'Added Column' | 'Data Type Altered' | 'Nullability Breach' | 'PrimaryKey Drop' | 'Tag Constraint Deviation';
  fieldName: string;
  sourceValue: string;
  targetValue: string;
  severity: 'High' | 'Medium' | 'Low';
  detectedBy: string;
  reconciliationStatus: 'Pending' | 'Applied' | 'Ignored';
  reconciliationScript: string;
}

export const SchemaRegistryView: React.FC = () => {
  // Core state
  const [registryItems, setRegistryItems] = useState<SchemaRegistryItem[]>(MOCK_SCHEMA_REGISTRY);
  const [selectedSystemId, setSelectedSystemId] = useState<string>(MOCK_SCHEMA_REGISTRY[0].id);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const selectedSystem = registryItems.find((s) => s.id === selectedSystemId) || registryItems[0];

  // Sync logic
  const handleRegistrySync = () => {
    setIsSyncing(true);
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  // Compare version state
  const [baseVersionId, setBaseVersionId] = useState<string>(
    selectedSystem.versions[selectedSystem.versions.length - 1]?.versionId || 'v1.0.0'
  );
  const [targetVersionId, setTargetVersionId] = useState<string>(
    selectedSystem.versions[0]?.versionId || 'v2.4.0'
  );

  // Active Hub Tab
  const [activeTab, setActiveTab] = useState<'diff' | 'timeline' | 'fields' | 'change-detection' | 'metadata-repo' | 'ai-analysis' | 'bulk-export' | 'ddl-editor'>('diff');

  // DDL Editor States
  const [ddlEditorMode, setDdlEditorMode] = useState<'builder' | 'manual'>('builder');
  const [ddlFields, setDdlFields] = useState<SchemaFieldDefinition[]>([]);
  const [ddlTableName, setDdlTableName] = useState<string>('');
  const [ddlDialect, setDdlDialect] = useState<string>('postgresql');
  const [ddlCasing, setDdlCasing] = useState<'original' | 'snake' | 'upper_snake' | 'camel'>('original');
  const [ddlIncludeDrop, setDdlIncludeDrop] = useState<boolean>(false);
  const [ddlIncludeComments, setDdlIncludeComments] = useState<boolean>(true);
  const [ddlPkPolicy, setDdlPkPolicy] = useState<'inline' | 'constraint'>('inline');
  const [ddlNamespace, setDdlNamespace] = useState<string>('public');
  const [manualDdlCode, setManualDdlCode] = useState<string>('');
  const [ddlSearch, setDdlSearch] = useState<string>('');
  const [prevSelectedSystemId, setPrevSelectedSystemId] = useState<string>('');

  // Bulk Export States
  const [selectedExportSystemIds, setSelectedExportSystemIds] = useState<string[]>(() => MOCK_SCHEMA_REGISTRY.map(s => s.id));
  const [exportSystemVersions, setExportSystemVersions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    MOCK_SCHEMA_REGISTRY.forEach(s => {
      initial[s.id] = s.versions[0]?.versionId || 'v1.0.0';
    });
    return initial;
  });
  const [exportTableNames, setExportTableNames] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    MOCK_SCHEMA_REGISTRY.forEach(s => {
      initial[s.id] = s.entityName;
    });
    return initial;
  });
  const [exportFormat, setExportFormat] = useState<'sql' | 'json'>('sql');
  const [exportSqlDialect, setExportSqlDialect] = useState<string>('postgresql');
  const [exportJsonType, setExportJsonType] = useState<'raw' | 'openapi' | 'bigquery_json'>('raw');
  const [exportSchemaNamespace, setExportSchemaNamespace] = useState<string>('public');
  const [exportColumnCasing, setExportColumnCasing] = useState<'original' | 'snake' | 'upper_snake' | 'camel'>('original');
  const [exportIncludeDropTable, setExportIncludeDropTable] = useState<boolean>(false);
  const [exportIncludeComments, setExportIncludeComments] = useState<boolean>(true);
  const [exportPrimaryKeyPolicy, setExportPrimaryKeyPolicy] = useState<'inline' | 'constraint'>('inline');
  
  const [customTableTemplate, setCustomTableTemplate] = useState<string>(
    `-- CUSTOM DDL TEMPLATE FOR TABLE {{tableName}}\nCREATE TABLE {{schema}}.{{tableName}} (\n{{columnDefinitions}}\n);`
  );
  const [customColumnTemplate, setCustomColumnTemplate] = useState<string>(
    `  {{fieldName}} {{dataType}}{{constraints}}{{descriptionComment}}`
  );

  const [exportSearchQuery, setExportSearchQuery] = useState<string>('');
  const [previewActiveSystemId, setPreviewActiveSystemId] = useState<string>(MOCK_SCHEMA_REGISTRY[0].id);

  // Filter for diff table
  const [diffFilter, setDiffFilter] = useState<'all' | 'added' | 'removed' | 'modified' | 'breaking'>('all');
  const [compareViewMode, setCompareViewMode] = useState<'changelog' | 'side-by-side'>('side-by-side');
  const [diffSearchQuery, setDiffSearchQuery] = useState('');

  // Initialization logic for DDL Editor
  const loadActiveSchemaToDdlEditor = (sys: SchemaRegistryItem) => {
    const version = sys.versions[0];
    if (version) {
      setDdlFields(version.fields.map(f => ({ ...f })));
      setDdlTableName(sys.entityName);
      setDdlDialect(exportSqlDialect === 'custom' ? 'postgresql' : exportSqlDialect);
      setDdlCasing(exportColumnCasing);
      setDdlIncludeDrop(exportIncludeDropTable);
      setDdlIncludeComments(exportIncludeComments);
      setDdlPkPolicy(exportPrimaryKeyPolicy);
      setDdlNamespace(exportSchemaNamespace);
      setDdlEditorMode('builder');
    }
  };

  useEffect(() => {
    if (selectedSystem.id !== prevSelectedSystemId) {
      setPrevSelectedSystemId(selectedSystem.id);
      loadActiveSchemaToDdlEditor(selectedSystem);
    }
  }, [selectedSystem.id, prevSelectedSystemId, exportSqlDialect, exportColumnCasing, exportIncludeDropTable, exportIncludeComments, exportPrimaryKeyPolicy, exportSchemaNamespace]);

  const generateDdlFromEditorState = (): string => {
    if (ddlEditorMode === 'manual') {
      return manualDdlCode;
    }

    const tName = applyCasing(ddlTableName || 'custom_table', ddlCasing);
    const pks: string[] = [];
    const lines: string[] = [];

    ddlFields.forEach((f) => {
      const fName = applyCasing(f.fieldName, ddlCasing);
      const fType = mapDataTypeToDialect(f.dataType, ddlDialect);

      let colDef = '';
      if (ddlDialect === 'mysql') {
        colDef = `  \`${fName}\` ${fType}`;
      } else if (ddlDialect === 'sqlserver') {
        colDef = `  [${fName}] ${fType}`;
      } else {
        colDef = `  "${fName}" ${fType}`;
      }

      if (!f.isNullable) {
        colDef += ' NOT NULL';
      } else {
        if (ddlDialect === 'mysql' || ddlDialect === 'sqlserver') {
          colDef += ' NULL';
        }
      }

      if (f.isPrimaryKey) {
        pks.push(fName);
        if (ddlPkPolicy === 'inline') {
          colDef += ' PRIMARY KEY';
        }
      }

      if (ddlIncludeComments && f.description && ddlDialect !== 'oracle' && ddlDialect !== 'postgresql') {
        if (ddlDialect === 'mysql') {
          colDef += ` COMMENT '${f.description.replace(/'/g, "''")}'`;
        } else {
          colDef += ` -- ${f.description}`;
        }
      }

      lines.push(colDef);
    });

    if (ddlPkPolicy === 'constraint' && pks.length > 0) {
      const pkList = pks.map(pk => ddlDialect === 'mysql' ? `\`${pk}\`` : ddlDialect === 'sqlserver' ? `[${pk}]` : `"${pk}"`).join(', ');
      lines.push(`  CONSTRAINT "pk_${tName}" PRIMARY KEY (${pkList})`);
    }

    let ddl = '';

    if (ddlIncludeDrop) {
      if (ddlDialect === 'oracle') {
        ddl += `BEGIN\n  EXECUTE IMMEDIATE 'DROP TABLE "${ddlNamespace}"."${tName}"';\nEXCEPTION\n  WHEN OTHERS THEN NULL;\nEND;\n/\n\n`;
      } else if (ddlDialect === 'mysql') {
        const schemaPrefix = ddlNamespace ? `\`${ddlNamespace}\`.` : '';
        ddl += `DROP TABLE IF EXISTS ${schemaPrefix}\`${tName}\`;\n\n`;
      } else if (ddlDialect === 'sqlserver') {
        const schemaPrefix = ddlNamespace ? `[${ddlNamespace}].` : '';
        ddl += `IF OBJECT_ID('${schemaPrefix}[${tName}]', 'U') IS NOT NULL DROP TABLE ${schemaPrefix}[${tName}];\n\n`;
      } else {
        ddl += `DROP TABLE IF EXISTS "${ddlNamespace}"."${tName}" CASCADE;\n\n`;
      }
    }

    if (ddlDialect === 'mysql') {
      const sanitizedSchema = ddlNamespace ? `\`${ddlNamespace}\`.` : '';
      ddl += `CREATE TABLE ${sanitizedSchema}\`${tName}\` (\n${lines.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    } else if (ddlDialect === 'sqlserver') {
      const sanitizedSchema = ddlNamespace ? `[${ddlNamespace}].` : '';
      ddl += `CREATE TABLE ${sanitizedSchema}[${tName}] (\n${lines.join(',\n')}\n);`;
    } else if (ddlDialect === 'oracle') {
      ddl += `CREATE TABLE "${ddlNamespace}"."${tName}" (\n${lines.join(',\n')}\n);\n`;
    } else if (ddlDialect === 'bigquery') {
      const dataset = ddlNamespace ? `\`${ddlNamespace}\`.` : '';
      ddl += `CREATE TABLE ${dataset}\`${tName}\` (\n${lines.join(',\n')}\n);`;
    } else {
      ddl += `CREATE TABLE "${ddlNamespace}"."${tName}" (\n${lines.join(',\n')}\n);`;
    }

    if (ddlIncludeComments) {
      const commentLines: string[] = [];
      ddlFields.forEach((f) => {
        const fName = applyCasing(f.fieldName, ddlCasing);
        if (f.description) {
          if (ddlDialect === 'postgresql') {
            commentLines.push(`COMMENT ON COLUMN "${ddlNamespace}"."${tName}"."${fName}" IS '${f.description.replace(/'/g, "''")}';`);
          } else if (ddlDialect === 'oracle') {
            commentLines.push(`COMMENT ON COLUMN "${ddlNamespace}"."${tName}"."${fName}" IS '${f.description.replace(/'/g, "''")}';`);
          }
        }
      });
      if (commentLines.length > 0) {
        ddl += `\n\n${commentLines.join('\n')}`;
      }
    }

    return ddl;
  };

  const handleToggleEditorMode = (mode: 'builder' | 'manual') => {
    if (mode === 'manual' && ddlEditorMode === 'builder') {
      setManualDdlCode(generateDdlFromEditorState());
    }
    setDdlEditorMode(mode);
  };

  const handleDdlAddField = () => {
    const newField: SchemaFieldDefinition = {
      fieldName: `column_${ddlFields.length + 1}`,
      dataType: 'VARCHAR(255)',
      isNullable: true,
      isPrimaryKey: false,
      description: 'Custom column added via live designer'
    };
    setDdlFields(prev => [...prev, newField]);
    showToast('New column added to the schema.');
  };

  const handleDdlUpdateField = (index: number, key: keyof SchemaFieldDefinition, value: any) => {
    setDdlFields(prev => prev.map((f, idx) => {
      if (idx === index) {
        return { ...f, [key]: value };
      }
      return f;
    }));
  };

  const handleDdlDeleteField = (index: number) => {
    setDdlFields(prev => prev.filter((_, idx) => idx !== index));
    showToast('Column deleted from the schema.');
  };

  const handleDownloadDdlFile = () => {
    const code = generateDdlFromEditorState();
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${applyCasing(ddlTableName || 'schema', 'snake')}_ddl.sql`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('DDL script downloaded successfully.');
  };



  // New Version Registration Modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState('v2.5.0');
  const [newCommitMessage, setNewCommitMessage] = useState('Updated field nullability and added partner code field');
  const [newMigrationJobRef, setNewMigrationJobRef] = useState('JOB-2026-DELTA-P2');
  const [newAuthor, setNewAuthor] = useState('Enterprise Architect');
  const [newFieldName, setNewFieldName] = useState('PARTNER_CODE');
  const [newFieldDataType, setNewFieldDataType] = useState('VARCHAR(20)');

  // Conflict Resolution Modal State
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictStrategy, setConflictStrategy] = useState<'override' | 'patch' | 'fork'>('patch');
  const [customPatchTag, setCustomPatchTag] = useState('v2.4.1-patch');
  const [customForkName, setCustomForkName] = useState('');
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);
  const [conflictToast, setConflictToast] = useState<string | null>(null);

  // Details of detected conflict
  const [conflictContext, setConflictContext] = useState<{
    conflictingVersionTag: string;
    existingVersion: SchemaVersion;
    incomingVersion: SchemaVersion;
    reason: string;
    breakingFields: { fieldName: string; changeType: string; description: string }[];
  } | null>(null);

  // Metadata Repository (CDM) State
  const [cdmEntities, setCdmEntities] = useState<CDMEntity[]>(INITIAL_CDM_ENTITIES);
  const [selectedCdmEntityId, setSelectedCdmEntityId] = useState<string>('cdm-cust');
  const [cdmSearchQuery, setCdmSearchQuery] = useState<string>('');
  const [isAddingCdmAttr, setIsAddingCdmAttr] = useState<boolean>(false);
  
  // New CDM Attribute Form
  const [newCdmAttrName, setNewCdmAttrName] = useState<string>('');
  const [newCdmAttrDisplayName, setNewCdmAttrDisplayName] = useState<string>('');
  const [newCdmAttrDataType, setNewCdmAttrDataType] = useState<CDMAttribute['dataType']>('String');
  const [newCdmAttrRequired, setNewCdmAttrRequired] = useState<boolean>(false);
  const [newCdmAttrDesc, setNewCdmAttrDesc] = useState<string>('');

  // Target Fields inline editor states
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingFieldDesc, setEditingFieldDesc] = useState<string>('');
  const [editingFieldPii, setEditingFieldPii] = useState<string>('');
  const [editingFieldNullable, setEditingFieldNullable] = useState<boolean>(false);

  // Drag and Drop reordering states
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);
  const [dragOverFieldIndex, setDragOverFieldIndex] = useState<number | null>(null);

  // Auto-Detect Data Types states
  const [isAutoDetectOpen, setIsAutoDetectOpen] = useState(false);
  const [selectedSampleSource, setSelectedSampleSource] = useState<string>('sample-cust-excel');
  const [pastedSampleData, setPastedSampleData] = useState<string>('');
  const [customParseError, setCustomParseError] = useState<string | null>(null);
  const [selectedDetectedFields, setSelectedDetectedFields] = useState<Record<string, boolean>>({});
  const [detectionResults, setDetectionResults] = useState<{
    fieldName: string;
    detectedType: string;
    confidence: number;
    sampleValues: string[];
    currentType: string;
  }[]>([]);

  // Change Detection & Drift State
  const [driftAnalysisStatus, setDriftAnalysisStatus] = useState<'idle' | 'scanning' | 'clean' | 'drift-detected'>('idle');
  const [driftLogs, setDriftLogs] = useState<DriftEvent[]>([
    {
      id: 'drift-001',
      timestamp: '2026-08-08T11:20:00Z',
      systemName: 'SAP ECC 6.0 (KNA1 Customer Master)',
      entityName: 'Customer',
      changeType: 'Data Type Altered',
      fieldName: 'TELF1',
      sourceValue: 'VARCHAR(16)',
      targetValue: 'VARCHAR(25)',
      severity: 'Medium',
      detectedBy: 'Cron Catalog Scan Engine',
      reconciliationStatus: 'Pending',
      reconciliationScript: 'ALTER TABLE Customer ALTER COLUMN TELF1 TYPE VARCHAR(25);'
    },
    {
      id: 'drift-002',
      timestamp: '2026-08-07T09:45:00Z',
      systemName: 'Salesforce CRM (Account Object)',
      entityName: 'Account',
      changeType: 'PrimaryKey Drop',
      fieldName: 'Id',
      sourceValue: 'ID(18) NOT NULL PRIMARY KEY',
      targetValue: 'ID(18) NULL',
      severity: 'High',
      detectedBy: 'Real-time Webhook Parser',
      reconciliationStatus: 'Pending',
      reconciliationScript: 'ALTER TABLE Account ADD PRIMARY KEY (Id);'
    },
    {
      id: 'drift-003',
      timestamp: '2026-08-05T14:10:00Z',
      systemName: 'SAP ECC 6.0 (KNA1 Customer Master)',
      entityName: 'Customer',
      changeType: 'Added Column',
      fieldName: 'EUSER_EU_VAT',
      sourceValue: 'N/A (Dropped)',
      targetValue: 'VARCHAR(24) NULL',
      severity: 'Low',
      detectedBy: 'Manual DDL Reconciliation Engine',
      reconciliationStatus: 'Applied',
      reconciliationScript: 'ALTER TABLE Customer ADD COLUMN EUSER_EU_VAT VARCHAR(24) NULL;'
    }
  ]);

  // AI Schema Analyst State
  const [aiAuditObjective, setAiAuditObjective] = useState<'breaking-changes' | 'compliance-pii' | 'normalization-quality'>('breaking-changes');
  const [aiAuditProvider, setAiAuditProvider] = useState<string>('gemini');
  const [aiAuditModel, setAiAuditModel] = useState<string>('Gemini 2.5 Flash');
  const [aiIsAuditing, setAiIsAuditing] = useState<boolean>(false);
  const [aiAuditProgressStep, setAiAuditProgressStep] = useState<string>('');
  const [aiAuditReport, setAiAuditReport] = useState<{
    score: number;
    title: string;
    summary: string;
    vulnerabilities: { field: string; issue: string; severity: 'High' | 'Medium' | 'Low'; advice: string }[];
    reconcileSql: string;
    piiTagSuggestions: { field: string; detectedType: string; reason: string }[];
  } | null>(null);

  const showToast = (msg: string) => {
    setConflictToast(msg);
    setTimeout(() => setConflictToast(null), 4500);
  };

  // Selected versions objects
  const baseVerObj =
    selectedSystem.versions.find((v) => v.versionId === baseVersionId) ||
    selectedSystem.versions[selectedSystem.versions.length - 1];
  const targetVerObj =
    selectedSystem.versions.find((v) => v.versionId === targetVersionId) ||
    selectedSystem.versions[0];

  // Calculate schema diff
  const schemaDiff: SchemaVersionDiff = computeSchemaVersionDiff(baseVerObj, targetVerObj);

  // Open Conflict Resolution Modal with prefilled parameters
  const openConflictResolutionModal = (specifiedTag?: string) => {
    const targetTag = specifiedTag || targetVerObj.versionId;
    const existingVer = selectedSystem.versions.find((v) => v.versionId === targetTag) || targetVerObj;

    const breaking = schemaDiff.breakingChanges.map((bc, idx) => ({
      fieldName: schemaDiff.modifiedFields[idx]?.fieldName || schemaDiff.removedFields[idx]?.fieldName || 'CREDIT_LIMIT',
      changeType: bc.includes('type') ? 'Type Mismatch' : bc.includes('Removed') ? 'Dropped Field' : 'Constraint Alteration',
      description: bc,
    }));

    const defaultBreaking = [
      { fieldName: 'PAYMENT_STATUS', changeType: 'Type Mismatch', description: 'VARCHAR(20) changed to INTEGER' },
      { fieldName: 'PII_SSN_HASH', changeType: 'Dropped Field', description: 'Column removed in incoming version schema' },
      { fieldName: 'CUSTOMER_ID', changeType: 'Nullability Mismatch', description: 'NULL changed to NOT NULL' },
    ];

    setConflictContext({
      conflictingVersionTag: targetTag,
      existingVersion: existingVer,
      incomingVersion: {
        ...existingVer,
        versionId: `${targetTag}-incoming`,
        publishedAt: new Date().toISOString(),
        publishedBy: 'Conflict Resolution Engine',
        commitMessage: 'Incoming Source Schema Delta with Breaking Shifts',
        breakingChangesCount: schemaDiff.breakingChanges.length || 3,
      },
      reason: schemaDiff.breakingChanges.length > 0
        ? `Detected ${schemaDiff.breakingChanges.length} breaking structural schema mismatch(es) between base ${baseVerObj.versionId} and target ${targetVerObj.versionId}.`
        : `Version tag collision or mismatch detected for '${targetTag}' in system '${selectedSystem.systemName}'.`,
      breakingFields: breaking.length > 0 ? breaking : defaultBreaking,
    });

    setCustomPatchTag(`${targetTag}.1-patch`);
    setCustomForkName(`${selectedSystem.systemName} (Forked ${targetTag})`);
    setConflictStrategy('patch');
    setOverrideConfirmed(false);
    setIsConflictModalOpen(true);
  };

  // Execute Conflict Resolution Strategy
  const handleApplyConflictStrategy = () => {
    if (!conflictContext) return;

    const targetTag = conflictContext.conflictingVersionTag;

    if (conflictStrategy === 'override') {
      if (!overrideConfirmed) return;

      // Override existing version directly
      setRegistryItems((prev) =>
        prev.map((item) => {
          if (item.id === selectedSystem.id) {
            const updatedVersions = item.versions.map((v) => {
              if (v.versionId === targetTag) {
                return {
                  ...v,
                  commitMessage: `[OVERRIDDEN] Force overwrite resolved conflict - ${v.commitMessage}`,
                  publishedAt: new Date().toISOString(),
                  publishedBy: 'Enterprise Architect (Overridden)',
                  breakingChangesCount: 0,
                };
              }
              return v;
            });
            return {
              ...item,
              updatedAt: new Date().toISOString(),
              versions: updatedVersions,
            };
          }
          return item;
        })
      );

      showToast(`OVERRIDE STRATEGY APPLIED: Version '${targetTag}' forcibly replaced in ${selectedSystem.systemName} registry.`);
    } else if (conflictStrategy === 'patch') {
      // Patch strategy: Create a non-breaking semantic patch release
      const patchTag = customPatchTag.trim() || `${targetTag}.1-patch`;
      const patchVersionObj: SchemaVersion = {
        versionId: patchTag,
        publishedAt: new Date().toISOString(),
        publishedBy: 'Schema Governance Copilot',
        commitMessage: `[PATCH] Semantic non-breaking patch release resolving ${targetTag} conflict`,
        migrationJobRef: 'JOB-2026-PATCH-RESOLVER',
        breakingChangesCount: 0,
        fieldCount: conflictContext.existingVersion.fieldCount + 1,
        fields: [
          ...conflictContext.existingVersion.fields,
          {
            fieldName: 'COMPATIBILITY_PATCH_REF',
            dataType: 'VARCHAR(64)',
            isNullable: true,
            isPrimaryKey: false,
            description: 'Auto-injected backward-compatibility mapping column',
          },
        ],
      };

      setRegistryItems((prev) =>
        prev.map((item) => {
          if (item.id === selectedSystem.id) {
            return {
              ...item,
              latestVersion: patchTag,
              updatedAt: patchVersionObj.publishedAt,
              versions: [patchVersionObj, ...item.versions],
            };
          }
          return item;
        })
      );

      setTargetVersionId(patchTag);
      showToast(`PATCH STRATEGY APPLIED: Registered backward-compatible patch version '${patchTag}'.`);
    } else if (conflictStrategy === 'fork') {
      // Fork strategy: Create an isolated system variant branch
      const forkName = customForkName.trim() || `${selectedSystem.systemName} (Forked ${targetTag})`;
      const forkedSystemId = `sys-fork-${Date.now()}`;

      const forkedVersion: SchemaVersion = {
        ...conflictContext.existingVersion,
        versionId: `${targetTag}-fork-v1`,
        publishedAt: new Date().toISOString(),
        commitMessage: `[FORK] Forked system branch from ${selectedSystem.systemName} (${targetTag})`,
      };

      const forkedSystem: SchemaRegistryItem = {
        ...selectedSystem,
        id: forkedSystemId,
        systemName: forkName,
        latestVersion: forkedVersion.versionId,
        updatedAt: new Date().toISOString(),
        versions: [forkedVersion, ...selectedSystem.versions],
      };

      setRegistryItems((prev) => [forkedSystem, ...prev]);
      setSelectedSystemId(forkedSystemId);
      setTargetVersionId(forkedVersion.versionId);
      setBaseVersionId(forkedVersion.versionId);

      showToast(`FORK STRATEGY APPLIED: Created isolated schema branch '${forkName}'.`);
    }

    setIsConflictModalOpen(false);
  };

  // Handle publishing a new version
  const handlePublishNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newVersionTag.trim() || `v${Date.now()}`;
    const exists = selectedSystem.versions.some((v) => v.versionId === tag);

    if (exists) {
      setIsPublishModalOpen(false);
      openConflictResolutionModal(tag);
      return;
    }

    const newField: SchemaFieldDefinition = {
      fieldName: newFieldName.trim() || 'CUSTOM_FIELD_NEW',
      dataType: newFieldDataType || 'VARCHAR(50)',
      isNullable: true,
      isPrimaryKey: false,
      description: 'Newly registered version field extension',
    };

    const newVersionObj: SchemaVersion = {
      versionId: tag,
      publishedAt: new Date().toISOString(),
      publishedBy: newAuthor,
      commitMessage: newCommitMessage,
      migrationJobRef: newMigrationJobRef,
      breakingChangesCount: 0,
      fieldCount: targetVerObj.fields.length + 1,
      fields: [...targetVerObj.fields, newField],
    };

    setRegistryItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedSystem.id) {
          return {
            ...item,
            latestVersion: newVersionObj.versionId,
            updatedAt: newVersionObj.publishedAt,
            versions: [newVersionObj, ...item.versions],
          };
        }
        return item;
      })
    );

    setTargetVersionId(newVersionObj.versionId);
    setIsPublishModalOpen(false);
    showToast(`Registered new schema version '${tag}' successfully.`);
  };

  // Switch system handler
  const handleSelectSystem = (id: string) => {
    setSelectedSystemId(id);
    const sys = registryItems.find((s) => s.id === id);
    if (sys && sys.versions.length >= 2) {
      setBaseVersionId(sys.versions[sys.versions.length - 1].versionId);
      setTargetVersionId(sys.versions[0].versionId);
    } else if (sys && sys.versions.length === 1) {
      setBaseVersionId(sys.versions[0].versionId);
      setTargetVersionId(sys.versions[0].versionId);
    }
  };

  // Export SQL DDL Migration Delta script
  const handleExportDdlScript = () => {
    let script = `-- Enterprise Schema Registry Migration Script\n`;
    script += `-- Target System: ${selectedSystem.systemName}\n`;
    script += `-- Comparing Base (${schemaDiff.baseVersion}) -> Target (${schemaDiff.targetVersion})\n`;
    script += `-- Generated on: ${new Date().toLocaleString()}\n\n`;

    schemaDiff.addedFields.forEach((f) => {
      script += `ALTER TABLE ${selectedSystem.entityName} ADD COLUMN ${f.fieldName} ${f.dataType} ${
        f.isNullable ? 'NULL' : 'NOT NULL'
      };\n`;
    });

    schemaDiff.modifiedFields.forEach((m) => {
      script += `-- Modify ${m.fieldName}: ${m.changes.join(', ')}\n`;
      if (m.newType) {
        script += `ALTER TABLE ${selectedSystem.entityName} ALTER COLUMN ${m.fieldName} TYPE ${m.newType};\n`;
      }
    });

    schemaDiff.removedFields.forEach((f) => {
      script += `-- WARNING: Removing field '${f.fieldName}' (Breaking change!)\n`;
      script += `-- ALTER TABLE ${selectedSystem.entityName} DROP COLUMN ${f.fieldName};\n`;
    });

    const blob = new Blob([script], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema_migration_${selectedSystem.id}_${schemaDiff.baseVersion}_to_${schemaDiff.targetVersion}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Bulk Export helpers and handlers
  const mapDataTypeToDialect = (type: string, dialect: string): string => {
    const cleanType = type.toUpperCase().trim();
    
    // Extract length if present, e.g. VARCHAR(255) -> 255, Code[20] -> 20
    let lengthStr = '';
    const match = cleanType.match(/[\[\(](\d+(?:\s*,\s*\d+)?)[\]\)]/);
    if (match) {
      lengthStr = match[1];
    }
    
    const isString = cleanType.includes('CHAR') || cleanType.includes('TEXT') || cleanType.includes('CODE') || cleanType.includes('STRING') || cleanType.includes('VARCHAR');
    const isInt = cleanType.includes('INT') || cleanType.includes('INTEGER') || cleanType.includes('SMALLINT') || cleanType.includes('BIGINT');
    const isDecimal = cleanType.includes('DECIMAL') || cleanType.includes('NUMERIC') || cleanType.includes('NUMBER') || cleanType.includes('FLOAT') || cleanType.includes('DOUBLE');
    const isDate = cleanType.includes('DATE') || cleanType.includes('TIME') || cleanType.includes('TIMESTAMP');
    const isBool = cleanType.includes('BOOL') || cleanType.includes('BOOLEAN');

    switch (dialect) {
      case 'postgresql':
        if (isString) return `VARCHAR(${lengthStr || '255'})`;
        if (isInt) return cleanType.includes('BIG') ? 'BIGINT' : 'INTEGER';
        if (isDecimal) return `NUMERIC(${lengthStr || '18,2'})`;
        if (isDate) return cleanType.includes('TIME') ? 'TIMESTAMPTZ' : 'DATE';
        if (isBool) return 'BOOLEAN';
        return cleanType;
        
      case 'mysql':
        if (isString) return `VARCHAR(${lengthStr || '255'})`;
        if (isInt) return cleanType.includes('BIG') ? 'BIGINT' : 'INT';
        if (isDecimal) return `DECIMAL(${lengthStr || '18,2'})`;
        if (isDate) return cleanType.includes('TIME') ? 'DATETIME' : 'DATE';
        if (isBool) return 'TINYINT(1)';
        return cleanType;
        
      case 'oracle':
        if (isString) return `VARCHAR2(${lengthStr || '255'})`;
        if (isInt) return 'NUMBER(19)';
        if (isDecimal) return `NUMBER(${lengthStr || '18,2'})`;
        if (isDate) return 'TIMESTAMP';
        if (isBool) return 'NUMBER(1)';
        return cleanType;
        
      case 'sqlserver':
        if (isString) return `NVARCHAR(${lengthStr || '255'})`;
        if (isInt) return cleanType.includes('BIG') ? 'BIGINT' : 'INT';
        if (isDecimal) return `DECIMAL(${lengthStr || '18,2'})`;
        if (isDate) return cleanType.includes('TIME') ? 'DATETIME2' : 'DATE';
        if (isBool) return 'BIT';
        return cleanType;
        
      case 'snowflake':
        if (isString) return `VARCHAR(${lengthStr || '16777216'})`;
        if (isInt) return 'NUMBER';
        if (isDecimal) return `NUMBER(${lengthStr || '38,0'})`;
        if (isDate) return 'TIMESTAMP_TZ';
        if (isBool) return 'BOOLEAN';
        return cleanType;
        
      case 'bigquery':
        if (isString) return 'STRING';
        if (isInt) return 'INT64';
        if (isDecimal) return 'NUMERIC';
        if (isDate) return cleanType.includes('TIME') ? 'TIMESTAMP' : 'DATE';
        if (isBool) return 'BOOL';
        return 'STRING';
        
      default:
        return cleanType;
    }
  };

  const applyCasing = (name: string, casing: string): string => {
    const cleanName = name.replace(/[\[\]`"'.]/g, '');
    
    switch (casing) {
      case 'snake':
        return cleanName
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          .replace(/[\s-]+/g, '_')
          .toLowerCase();
      case 'upper_snake':
        return cleanName
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          .replace(/[\s-]+/g, '_')
          .toUpperCase();
      case 'camel':
        return cleanName
          .replace(/[\s-_]+(\w)/g, (_, c) => c.toUpperCase())
          .replace(/^(\w)/, (c) => c.toLowerCase());
      case 'original':
      default:
        return name;
    }
  };

  const generateSqlDdlForSystem = (system: SchemaRegistryItem, versionId: string, customTableName: string): string => {
    const version = system.versions.find((v) => v.versionId === versionId) || system.versions[0];
    const tName = applyCasing(customTableName || system.entityName, exportColumnCasing);
    
    if (exportSqlDialect === 'custom') {
      const colDefinitions = version.fields.map((f) => {
        const fName = applyCasing(f.fieldName, exportColumnCasing);
        const fType = f.dataType;
        const isNull = f.isNullable ? 'NULL' : 'NOT NULL';
        const isPk = f.isPrimaryKey ? 'PRIMARY KEY' : '';
        const constraintsList = [isNull, isPk].filter(Boolean).join(' ');
        
        return customColumnTemplate
          .replace(/\{\{fieldName\}\}/g, fName)
          .replace(/\{\{dataType\}\}/g, fType)
          .replace(/\{\{constraints\}\}/g, constraintsList ? ' ' + constraintsList : '')
          .replace(/\{\{descriptionComment\}\}/g, f.description ? ` -- ${f.description}` : '');
      }).join(',\n');
      
      return customTableTemplate
        .replace(/\{\{schema\}\}/g, exportSchemaNamespace)
        .replace(/\{\{tableName\}\}/g, tName)
        .replace(/\{\{columnDefinitions\}\}/g, colDefinitions);
    }
    
    const pks: string[] = [];
    const lines: string[] = [];
    
    version.fields.forEach((f) => {
      const fName = applyCasing(f.fieldName, exportColumnCasing);
      const fType = mapDataTypeToDialect(f.dataType, exportSqlDialect);
      
      let colDef = '';
      if (exportSqlDialect === 'mysql') {
        colDef = `  \`${fName}\` ${fType}`;
      } else if (exportSqlDialect === 'sqlserver') {
        colDef = `  [${fName}] ${fType}`;
      } else {
        colDef = `  "${fName}" ${fType}`;
      }
      
      if (!f.isNullable) {
        colDef += ' NOT NULL';
      } else {
        if (exportSqlDialect === 'mysql' || exportSqlDialect === 'sqlserver') {
          colDef += ' NULL';
        }
      }
      
      if (f.isPrimaryKey) {
        pks.push(fName);
        if (exportPrimaryKeyPolicy === 'inline') {
          colDef += ' PRIMARY KEY';
        }
      }
      
      if (exportIncludeComments && f.description && exportSqlDialect !== 'oracle' && exportSqlDialect !== 'postgresql') {
        if (exportSqlDialect === 'mysql') {
          colDef += ` COMMENT '${f.description.replace(/'/g, "''")}'`;
        } else {
          colDef += ` -- ${f.description}`;
        }
      }
      
      lines.push(colDef);
    });
    
    if (exportPrimaryKeyPolicy === 'constraint' && pks.length > 0) {
      const pkList = pks.map(pk => exportSqlDialect === 'mysql' ? `\`${pk}\`` : exportSqlDialect === 'sqlserver' ? `[${pk}]` : `"${pk}"`).join(', ');
      lines.push(`  CONSTRAINT "pk_${tName}" PRIMARY KEY (${pkList})`);
    }
    
    let ddl = '';
    
    if (exportIncludeDropTable) {
      if (exportSqlDialect === 'oracle') {
        ddl += `BEGIN\n  EXECUTE IMMEDIATE 'DROP TABLE "${exportSchemaNamespace}"."${tName}"';\nEXCEPTION\n  WHEN OTHERS THEN NULL;\nEND;\n/\n\n`;
      } else if (exportSqlDialect === 'mysql') {
        const schemaPrefix = exportSchemaNamespace ? `\`${exportSchemaNamespace}\`.` : '';
        ddl += `DROP TABLE IF EXISTS ${schemaPrefix}\`${tName}\`;\n\n`;
      } else if (exportSqlDialect === 'sqlserver') {
        const schemaPrefix = exportSchemaNamespace ? `[${exportSchemaNamespace}].` : '';
        ddl += `IF OBJECT_ID('${schemaPrefix}[${tName}]', 'U') IS NOT NULL DROP TABLE ${schemaPrefix}[${tName}];\n\n`;
      } else {
        ddl += `DROP TABLE IF EXISTS "${exportSchemaNamespace}"."${tName}" CASCADE;\n\n`;
      }
    }
    
    if (exportSqlDialect === 'mysql') {
      const sanitizedSchema = exportSchemaNamespace ? `\`${exportSchemaNamespace}\`.` : '';
      ddl += `CREATE TABLE ${sanitizedSchema}\`${tName}\` (\n${lines.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    } else if (exportSqlDialect === 'sqlserver') {
      const sanitizedSchema = exportSchemaNamespace ? `[${exportSchemaNamespace}].` : '';
      ddl += `CREATE TABLE ${sanitizedSchema}[${tName}] (\n${lines.join(',\n')}\n);`;
    } else if (exportSqlDialect === 'oracle') {
      ddl += `CREATE TABLE "${exportSchemaNamespace}"."${tName}" (\n${lines.join(',\n')}\n);\n`;
    } else if (exportSqlDialect === 'bigquery') {
      const dataset = exportSchemaNamespace ? `\`${exportSchemaNamespace}\`.` : '';
      ddl += `CREATE TABLE ${dataset}\`${tName}\` (\n${lines.join(',\n')}\n);`;
    } else {
      ddl += `CREATE TABLE "${exportSchemaNamespace}"."${tName}" (\n${lines.join(',\n')}\n);`;
    }
    
    if (exportIncludeComments) {
      const commentLines: string[] = [];
      version.fields.forEach((f) => {
        const fName = applyCasing(f.fieldName, exportColumnCasing);
        if (f.description) {
          if (exportSqlDialect === 'postgresql') {
            commentLines.push(`COMMENT ON COLUMN "${exportSchemaNamespace}"."${tName}"."${fName}" IS '${f.description.replace(/'/g, "''")}';`);
          } else if (exportSqlDialect === 'oracle') {
            commentLines.push(`COMMENT ON COLUMN "${exportSchemaNamespace}"."${tName}"."${fName}" IS '${f.description.replace(/'/g, "''")}';`);
          }
        }
      });
      if (commentLines.length > 0) {
        ddl += `\n\n${commentLines.join('\n')}`;
      }
    }
    
    return ddl;
  };

  const generateJsonForSystem = (system: SchemaRegistryItem, versionId: string, customTableName: string): string => {
    const version = system.versions.find((v) => v.versionId === versionId) || system.versions[0];
    const tName = applyCasing(customTableName || system.entityName, exportColumnCasing);

    if (exportJsonType === 'raw') {
      return JSON.stringify({
        schemaId: system.id,
        systemName: system.systemName,
        entityName: system.entityName,
        versionId: versionId,
        publishedAt: version.publishedAt,
        publishedBy: version.publishedBy,
        commitMessage: version.commitMessage,
        fields: version.fields.map(f => ({
          fieldName: applyCasing(f.fieldName, exportColumnCasing),
          dataType: f.dataType,
          isNullable: f.isNullable,
          isPrimaryKey: f.isPrimaryKey,
          description: f.description || '',
          piiTag: f.piiTag || ''
        }))
      }, null, 2);
    } else if (exportJsonType === 'openapi') {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      version.fields.forEach((f) => {
        const fName = applyCasing(f.fieldName, exportColumnCasing);
        const cleanType = f.dataType.toLowerCase();
        
        let typeStr = 'string';
        if (cleanType.includes('int') || cleanType.includes('integer')) {
          typeStr = 'integer';
        } else if (cleanType.includes('decimal') || cleanType.includes('numeric') || cleanType.includes('float') || cleanType.includes('number')) {
          typeStr = 'number';
        } else if (cleanType.includes('bool') || cleanType.includes('boolean')) {
          typeStr = 'boolean';
        }

        properties[fName] = {
          type: typeStr,
          description: f.description || ''
        };

        if (!f.isNullable) {
          required.push(fName);
        }
      });

      const openApiSchema = {
        type: "object",
        title: tName,
        description: `Auto-generated OpenAPI schema for ${system.systemName} (${versionId})`,
        properties,
        ...(required.length > 0 ? { required } : {})
      };

      return JSON.stringify(openApiSchema, null, 2);
    } else if (exportJsonType === 'bigquery_json') {
      const bqSchema = version.fields.map((f) => {
        const cleanType = f.dataType.toUpperCase();
        let typeStr = 'STRING';
        if (cleanType.includes('INT') || cleanType.includes('INTEGER')) {
          typeStr = 'INTEGER';
        } else if (cleanType.includes('DECIMAL') || cleanType.includes('NUMERIC') || cleanType.includes('NUMBER')) {
          typeStr = 'NUMERIC';
        } else if (cleanType.includes('BOOL') || cleanType.includes('BOOLEAN')) {
          typeStr = 'BOOLEAN';
        } else if (cleanType.includes('DATE')) {
          typeStr = 'DATE';
        } else if (cleanType.includes('TIME') || cleanType.includes('TIMESTAMP')) {
          typeStr = 'TIMESTAMP';
        }

        return {
          name: applyCasing(f.fieldName, exportColumnCasing),
          type: typeStr,
          mode: f.isPrimaryKey || !f.isNullable ? 'REQUIRED' : 'NULLABLE',
          description: f.description || ''
        };
      });

      return JSON.stringify(bqSchema, null, 2);
    }

    return '';
  };

  const handleDownloadZip = async () => {
    if (selectedExportSystemIds.length === 0) {
      showToast("Please select at least one schema to export!");
      return;
    }
    
    const zip = new JSZip();
    
    selectedExportSystemIds.forEach((sysId) => {
      const system = registryItems.find((s) => s.id === sysId);
      if (!system) return;
      
      const verId = exportSystemVersions[sysId] || system.versions[0].versionId;
      const customTableName = exportTableNames[sysId] || system.entityName;
      const sanitizedTableName = applyCasing(customTableName, exportColumnCasing);
      
      if (exportFormat === 'sql') {
        const ddlContent = generateSqlDdlForSystem(system, verId, customTableName);
        zip.file(`${sanitizedTableName}.sql`, ddlContent);
      } else {
        const jsonContent = generateJsonForSystem(system, verId, customTableName);
        zip.file(`${sanitizedTableName}.json`, jsonContent);
      }
    });
    
    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schema_bulk_export_${exportFormat}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Successfully downloaded ZIP archive containing ${selectedExportSystemIds.length} schema files!`);
    } catch (error) {
      console.error("Failed to generate ZIP archive:", error);
      showToast("Error generating ZIP archive. Fallback to individual download.");
    }
  };

  const handleDownloadCombinedFile = () => {
    if (selectedExportSystemIds.length === 0) {
      showToast("Please select at least one schema to export!");
      return;
    }

    let combinedContent = '';
    const fileExt = exportFormat === 'sql' ? 'sql' : 'json';
    
    if (exportFormat === 'sql') {
      combinedContent = `-- Bulk Schema Export Combined DDL Script\n`;
      combinedContent += `-- Dialect: ${exportSqlDialect.toUpperCase()}\n`;
      combinedContent += `-- Generated on: ${new Date().toLocaleString()}\n\n`;
      
      selectedExportSystemIds.forEach((sysId) => {
        const system = registryItems.find((s) => s.id === sysId);
        if (!system) return;
        
        const verId = exportSystemVersions[sysId] || system.versions[0].versionId;
        const customTableName = exportTableNames[sysId] || system.entityName;
        
        combinedContent += `-- ==========================================\n`;
        combinedContent += `-- Table: ${applyCasing(customTableName, exportColumnCasing)} (from ${system.systemName} ${verId})\n`;
        combinedContent += `-- ==========================================\n`;
        combinedContent += generateSqlDdlForSystem(system, verId, customTableName);
        combinedContent += `\n\n`;
      });
    } else {
      const combinedObj: Record<string, any> = {};
      selectedExportSystemIds.forEach((sysId) => {
        const system = registryItems.find((s) => s.id === sysId);
        if (!system) return;
        
        const verId = exportSystemVersions[sysId] || system.versions[0].versionId;
        const customTableName = exportTableNames[sysId] || system.entityName;
        const key = applyCasing(customTableName, exportColumnCasing);
        
        try {
          combinedObj[key] = JSON.parse(generateJsonForSystem(system, verId, customTableName));
        } catch (e) {
          combinedObj[key] = { error: "Parse error" };
        }
      });
      combinedContent = JSON.stringify(combinedObj, null, 2);
    }

    const blob = new Blob([combinedContent], { type: exportFormat === 'sql' ? 'text/sql' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema_combined_export.${fileExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Successfully downloaded combined schema script!`);
  };

  // Target Fields Edit inline handler
  const handleStartEditField = (f: SchemaFieldDefinition) => {
    setEditingFieldId(f.fieldName);
    setEditingFieldDesc(f.description || '');
    setEditingFieldPii(f.piiTag || '');
    setEditingFieldNullable(f.isNullable);
  };

  const handleSaveFieldMetadata = (fieldName: string) => {
    setRegistryItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedSystem.id) {
          return {
            ...item,
            versions: item.versions.map((ver) => {
              if (ver.versionId === targetVersionId) {
                return {
                  ...ver,
                  fields: ver.fields.map((field) => {
                    if (field.fieldName === fieldName) {
                      return {
                        ...field,
                        description: editingFieldDesc,
                        piiTag: editingFieldPii || undefined,
                        isNullable: editingFieldNullable
                      };
                    }
                    return field;
                  })
                };
              }
              return ver;
            })
          };
        }
        return item;
      })
    );
    setEditingFieldId(null);
    showToast(`Saved updated metadata for field '${fieldName}' successfully.`);
  };
  
  const handleReorderFields = (draggedIndex: number, hoverIndex: number) => {
    setRegistryItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedSystem.id) {
          return {
            ...item,
            versions: item.versions.map((ver) => {
              if (ver.versionId === targetVersionId) {
                const updatedFields = [...ver.fields];
                const [removed] = updatedFields.splice(draggedIndex, 1);
                updatedFields.splice(hoverIndex, 0, removed);
                return {
                  ...ver,
                  fields: updatedFields
                };
              }
              return ver;
            })
          };
        }
        return item;
      })
    );
  };

  const AUTO_DETECT_DATASETS = [
    {
      id: 'sample-cust-excel',
      name: 'Customer Master Excel (Cust_No, Cust_Name, Credit_Limit...)',
      data: [
        { Cust_No: 'CUS-10029', Cust_Name: 'Acme Logistics & Trade Corp', Street_Address_1: '742 Evergreen Terrace, Suite 400', City: 'Springfield', State_Region: 'IL', Zip_Postal_Code: '62704', Country_Iso2: 'US', Contact_Phone: '+1 (555) 234-5678', Contact_Email: 'billing@acmelogistics.com', Tax_Registration_Number: 'US-883921049', Credit_Limit_Usd: '250000.00', Payment_Terms_Code: 'NET30', Salesperson_Code: 'JS-102', Is_Active: 'true', Created_At: '2026-08-01' },
        { Cust_No: 'CUS-10030', Cust_Name: 'Global Tech Innovations Ltd', Street_Address_1: '100 King Street West', City: 'Toronto', State_Region: 'ON', Zip_Postal_Code: 'M5X 1A9', Country_Iso2: 'CA', Contact_Phone: '4165550192', Contact_Email: 'finance@globaltech.ca', Tax_Registration_Number: 'CA-102938475', Credit_Limit_Usd: '500000.00', Payment_Terms_Code: 'NET60', Salesperson_Code: 'MK-204', Is_Active: 'true', Created_At: '2026-07-20' },
        { Cust_No: 'CUS-10031', Cust_Name: 'Vandenberg Heavy Industries GMBH', Street_Address_1: 'Industriestrasse 42', City: 'Frankfurt', State_Region: 'HE', Zip_Postal_Code: '60311', Country_Iso2: 'DE', Contact_Phone: '+49 69 1234 5678', Contact_Email: 'accounts@vandenberg.de', Tax_Registration_Number: 'DE123456789', Credit_Limit_Usd: '1000000.00', Payment_Terms_Code: 'NET30', Salesperson_Code: 'JS-102', Is_Active: 'false', Created_At: '2026-06-15' }
      ]
    },
    {
      id: 'sample-ledgers',
      name: 'High-Performance Financial Ledger Feed (JournalNo, Amount, IsReconciled...)',
      data: [
        { JournalNo: '100012', PostingDate: '2026-08-01', DocumentType: 'Invoice', Amount: '4500.50', Currency: 'USD', IsReconciled: 'true', ApproverCode: 'APP-99' },
        { JournalNo: '100013', PostingDate: '2026-08-02', DocumentType: 'Payment', Amount: '-4500.50', Currency: 'USD', IsReconciled: 'true', ApproverCode: 'APP-99' },
        { JournalNo: '100014', PostingDate: '2026-08-03', DocumentType: 'Adjustment', Amount: '120.00', Currency: 'EUR', IsReconciled: 'false', ApproverCode: 'APP-12' }
      ]
    },
    {
      id: 'sample-sfdc',
      name: 'Salesforce Accounts CRM API Export (Id, Name, AnnualRevenue, IsActive...)',
      data: [
        { Id: '0018000000xFabc', Name: 'GenePoint Corp', AccountNumber: 'GP-9921', BillingStreet: '345 Shoreline Park', BillingCity: 'Mountain View', BillingState: 'CA', BillingPostalCode: '94043', Phone: '(650) 555-0100', AnnualRevenue: '35000000', IsActive: 'true' },
        { Id: '0018000000xFxyz', Name: 'United Oil & Gas', AccountNumber: 'UO-4412', BillingStreet: '1301 Avenue of the Americas', BillingCity: 'New York', BillingState: 'NY', BillingPostalCode: '10019', Phone: '(212) 555-0140', AnnualRevenue: '240000000', IsActive: 'true' }
      ]
    }
  ];

  const getFuzzyMatch = (fieldName: string, sampleKeys: string[]): string | undefined => {
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fieldClean = clean(fieldName);

    // Exact match first
    const exact = sampleKeys.find(k => clean(k) === fieldClean);
    if (exact) return exact;

    // Fuzzy dictionary mappings for ERP/CRM compatibility
    const dict: Record<string, string[]> = {
      kunnr: ['custno', 'no', 'id', 'customerid', 'accountid', 'journalno'],
      name1: ['custname', 'name', 'companyname', 'company'],
      name2: ['subname', 'name2'],
      stras: ['streetaddress1', 'street', 'address', 'billingstreet'],
      ort01: ['city', 'billingcity'],
      regio: ['state', 'region', 'stateregion', 'billingstate', 'postingdate'],
      pstlz: ['zip', 'postalcode', 'zippostalcode', 'billingpostalcode'],
      land1: ['country', 'countryiso2', 'countrycode', 'countryregioncode', 'currency'],
      telf1: ['contactphone', 'phone', 'phoneno', 'primaryphone'],
      smtp_addr: ['contactemail', 'email', 'primarycontactemail', 'documenttype'],
      stcd1: ['taxregistrationnumber', 'vatregistrationno', 'taxid'],
      creditlimit: ['creditlimitusd', 'creditlimitlcy', 'creditlimit', 'amount'],
    };

    for (const [key, aliases] of Object.entries(dict)) {
      if (fieldClean.includes(key) || key.includes(fieldClean)) {
        const found = sampleKeys.find(k => {
          const ck = clean(k);
          return aliases.some(a => ck.includes(a) || a.includes(ck));
        });
        if (found) return found;
      }
    }

    return sampleKeys.find(k => clean(k).includes(fieldClean) || fieldClean.includes(clean(k)));
  };

  const detectTypeForValues = (values: string[]): { type: string; confidence: number } => {
    if (values.length === 0) return { type: 'VARCHAR(255)', confidence: 50 };

    // Check if Boolean
    const booleans = ['true', 'false', 'yes', 'no', '0', '1'];
    const isBool = values.every(v => booleans.includes(v.toLowerCase()));
    if (isBool) {
      const isOnlyZeroOne = values.every(v => v === '0' || v === '1');
      return { type: 'BOOLEAN', confidence: isOnlyZeroOne ? 80 : 95 };
    }

    // Check if Numeric (Integer or Decimal)
    const isNumeric = values.every(v => !isNaN(Number(v)) && v.trim() !== '');
    if (isNumeric) {
      const hasDecimal = values.some(v => v.includes('.'));
      if (hasDecimal) {
        return { type: 'DECIMAL(18,2)', confidence: 95 };
      } else {
        const maxVal = Math.max(...values.map(v => parseInt(v, 10)));
        if (maxVal > 2147483647) {
          return { type: 'BIGINT', confidence: 90 };
        }
        return { type: 'INTEGER', confidence: 92 };
      }
    }

    // Check if Date/Timestamp
    const datePattern = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/;
    const isDate = values.every(v => datePattern.test(v.trim()));
    if (isDate) {
      return { type: 'DATE', confidence: 95 };
    }

    // Default String VARCHAR sizing based on max found length
    const lengths = values.map(v => v.length);
    const maxLen = Math.max(...lengths);

    if (maxLen <= 10 && values.every(v => /^[A-Za-z0-9_-]+$/.test(v))) {
      return { type: 'VARCHAR(20)', confidence: 80 };
    } else if (maxLen <= 50) {
      return { type: 'VARCHAR(100)', confidence: 85 };
    } else if (maxLen <= 100) {
      return { type: 'VARCHAR(150)', confidence: 85 };
    } else {
      return { type: 'VARCHAR(255)', confidence: 90 };
    }
  };

  const handleRunTypeDetection = () => {
    setCustomParseError(null);
    let rows: Record<string, string>[] = [];

    if (selectedSampleSource === 'custom-pasted') {
      if (!pastedSampleData.trim()) {
        setCustomParseError('Please paste some sample CSV or JSON data first.');
        return;
      }
      const trimmed = pastedSampleData.trim();
      if (trimmed.startsWith('[')) {
        try {
          rows = JSON.parse(trimmed);
          if (!Array.isArray(rows)) {
            setCustomParseError('Pasted JSON must be an array of objects.');
            return;
          }
        } catch (err: any) {
          setCustomParseError(`Invalid JSON format: ${err.message}`);
          return;
        }
      } else {
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          setCustomParseError('Pasted CSV must have at least a header row and one data row.');
          return;
        }
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        rows = lines.slice(1).map(line => {
          const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
          const obj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            obj[h] = parts[idx] || '';
          });
          return obj;
        });
      }
    } else {
      const found = AUTO_DETECT_DATASETS.find(d => d.id === selectedSampleSource);
      if (found) {
        rows = found.data;
      }
    }

    if (rows.length === 0) {
      setCustomParseError('No sample records available to analyze.');
      return;
    }

    const sampleKeys = Object.keys(rows[0]);

    const results = targetVerObj.fields.map(field => {
      const matchedKey = getFuzzyMatch(field.fieldName, sampleKeys);
      let detectedType = 'VARCHAR(255)';
      let confidence = 50;
      let sampleValues: string[] = [];

      if (matchedKey) {
        const values = rows.map(r => r[matchedKey]?.toString() || '').filter(Boolean);
        sampleValues = values.slice(0, 3);
        const detection = detectTypeForValues(values);
        detectedType = detection.type;
        confidence = detection.confidence;
      }

      return {
        fieldName: field.fieldName,
        detectedType,
        confidence,
        sampleValues,
        currentType: field.dataType,
      };
    });

    setDetectionResults(results);

    const initialSelected: Record<string, boolean> = {};
    results.forEach(r => {
      if (r.detectedType.toUpperCase() !== r.currentType.toUpperCase()) {
        initialSelected[r.fieldName] = true;
      }
    });
    setSelectedDetectedFields(initialSelected);
  };

  // CDM Repository handlers
  const selectedCdmEntity = cdmEntities.find((e) => e.id === selectedCdmEntityId) || cdmEntities[0];

  const handleAddCdmAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCdmAttrName) return;

    const newAttr: CDMAttribute = {
      id: `cx-${Date.now()}`,
      attributeName: newCdmAttrName.replace(/\s+/g, '_').toUpperCase(),
      displayName: newCdmAttrDisplayName || newCdmAttrName,
      dataType: newCdmAttrDataType,
      isRequired: newCdmAttrRequired,
      isExtension: true,
      description: newCdmAttrDesc || 'Customer-specific CDM extension attribute.',
    };

    setCdmEntities((prev) =>
      prev.map((ent) => {
        if (ent.id === selectedCdmEntity.id) {
          return {
            ...ent,
            customAttributes: [...ent.customAttributes, newAttr],
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return ent;
      })
    );

    setNewCdmAttrName('');
    setNewCdmAttrDisplayName('');
    setNewCdmAttrDesc('');
    setIsAddingCdmAttr(false);
    showToast(`Added extension "${newAttr.attributeName}" to ${selectedCdmEntity.entityName} Canonical Model.`);
  };

  const handleRemoveCdmCustomAttribute = (attrId: string) => {
    setCdmEntities((prev) =>
      prev.map((ent) => {
        if (ent.id === selectedCdmEntity.id) {
          return {
            ...ent,
            customAttributes: ent.customAttributes.filter((a) => a.id !== attrId),
          };
        }
        return ent;
      })
    );
    showToast(`Removed attribute extension from Canonical Model.`);
  };

  const handleExportCdmSchema = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedCdmEntity, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CDM_${selectedCdmEntity.entityName}_Schema.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported Canonical ${selectedCdmEntity.entityName} model to JSON.`);
  };

  // Change Detection & Drift Handlers
  const handleScanPhysicalCatalogs = () => {
    setDriftAnalysisStatus('scanning');
    setTimeout(() => {
      // Intentionally simulated drift scan
      setDriftAnalysisStatus('drift-detected');
      showToast(`DRIFT DISCOVERED: Found two discrepancies between live database tables and registered schemas.`);
    }, 2000);
  };

  const handleApplyReconciliationScript = (driftId: string) => {
    setDriftLogs((prev) =>
      prev.map((log) => (log.id === driftId ? { ...log, reconciliationStatus: 'Applied' } : log))
    );
    showToast(`RECONCILIATION SUCCESSFUL: Physical drift corrected. Database schema synced with registry.`);
  };

  // AI Schema Analyst Engine
  const handleRunAiSchemaAudit = () => {
    setAiIsAuditing(true);
    setAiAuditProgressStep(`Parsing registered entities for ${aiAuditProvider.toUpperCase()} (${aiAuditModel})...`);
    
    setTimeout(() => {
      setAiAuditProgressStep(`Querying ${aiAuditProvider.toUpperCase()} (${aiAuditModel}) semantic constraints rules...`);
    }, 800);

    setTimeout(() => {
      setAiAuditProgressStep('Generating compliance matrices and SQL transformation recommendations...');
    }, 1600);

    setTimeout(() => {
      const fieldList = targetVerObj.fields;
      let score = 95;
      const vulnerabilities: any[] = [];
      const piiTagSuggestions: any[] = [];

      // Dynamic check of the selected system's active fields
      const hasSsn = fieldList.some(f => f.fieldName.toLowerCase().includes('ssn') || f.fieldName.toLowerCase().includes('tax'));
      const hasEmail = fieldList.some(f => f.fieldName.toLowerCase().includes('email') || f.fieldName.toLowerCase().includes('smtp'));
      const hasPhone = fieldList.some(f => f.fieldName.toLowerCase().includes('telf') || f.fieldName.toLowerCase().includes('phone'));

      if (aiAuditObjective === 'breaking-changes') {
        score = 88;
        vulnerabilities.push({
          field: 'NAME1 / Name',
          issue: 'Length truncation risk during direct mapping (VARCHAR(35) vs Text[100])',
          severity: 'Medium',
          advice: 'Verify source data doesn\'t contain fields exceeding 35 characters, or alter target to match.'
        });
        vulnerabilities.push({
          field: 'STRAS / Address',
          issue: 'Nullability constraint violation: Source allows NULL, Target is NOT NULL',
          severity: 'High',
          advice: 'Apply COALESCE(STRAS, "N/A - Unspecified") to prevent insert query exceptions.'
        });
      } else if (aiAuditObjective === 'compliance-pii') {
        score = 72;
        if (hasEmail) {
          vulnerabilities.push({
            field: 'SMTP_ADDR / E-Mail',
            issue: 'Sensitive email address exposed in raw replication payload without mask / hash rules',
            severity: 'High',
            advice: 'Enable partial masking (first character + domain) or execute SHA256 hashing during ingest.'
          });
          piiTagSuggestions.push({
            field: 'SMTP_ADDR',
            detectedType: 'Email Address',
            reason: 'Matches corporate email patterns (SMTP prefix).'
          });
        }
        if (hasPhone) {
          vulnerabilities.push({
            field: 'TELF1 / Phone No.',
            issue: 'Telephone number lacks anonymization or country prefix normalization',
            severity: 'Medium',
            advice: 'Implement Regex masking rules to obscure last 4 digits.'
          });
          piiTagSuggestions.push({
            field: 'TELF1',
            detectedType: 'Phone Number',
            reason: 'Matches phone metadata pattern.'
          });
        }
      } else {
        score = 91;
        vulnerabilities.push({
          field: 'EUSER_EU_VAT',
          issue: 'Un-indexed key field used for foreign relationships in nested VAT procedures',
          severity: 'Low',
          advice: 'Register secondary index index_eu_vat_validated on target ERP schemas.'
        });
      }

      setAiAuditReport({
        score,
        title: aiAuditObjective === 'breaking-changes'
          ? `Structural Alignment & Compatibility Audit`
          : aiAuditObjective === 'compliance-pii'
          ? `PII Data Protection & Privacy Compliance Check`
          : `Schema Normalization & Indexes Quality Audit`,
        summary: `AI Governance Auditor evaluated ${fieldList.length} registered schema fields in version ${targetVerObj.versionId} of '${selectedSystem.systemName}'. Database structure is compliant with GDPR standards overall, but contains critical design-level constraints that require auto-reconciliation.`,
        vulnerabilities,
        reconcileSql: `-- AI Auto-generated reconciliation scripts\n` +
          `ALTER TABLE ${selectedSystem.entityName} ALTER COLUMN ${fieldList[1]?.fieldName || 'NAME'} TYPE VARCHAR(100);\n` +
          `ALTER TABLE ${selectedSystem.entityName} ALTER COLUMN ${fieldList[3]?.fieldName || 'STRAS'} SET DEFAULT 'N/A';`,
        piiTagSuggestions
      });
      setAiIsAuditing(false);
      showToast(`AI AUDIT COMPLETED: Dynamic security and compatibility check generated.`);
    }, 2500);
  };

  const getUnifiedFields = () => {
    const baseFields = baseVerObj?.fields || [];
    const targetFields = targetVerObj?.fields || [];

    const baseMap = new Map<string, { field: SchemaFieldDefinition; index: number }>(
      baseFields.map((f, i) => [f.fieldName, { field: f, index: i }])
    );
    const targetMap = new Map<string, { field: SchemaFieldDefinition; index: number }>(
      targetFields.map((f, i) => [f.fieldName, { field: f, index: i }])
    );

    const allFieldNames = new Set<string>();
    // Preserving current (target) order first
    targetFields.forEach(f => allFieldNames.add(f.fieldName));
    // Appending historical fields that were removed
    baseFields.forEach(f => allFieldNames.add(f.fieldName));

    let fields = Array.from(allFieldNames).map(name => {
      const baseData = baseMap.get(name);
      const targetData = targetMap.get(name);

      const isAdded = !baseData && !!targetData;
      const isRemoved = !!baseData && !targetData;
      
      const hasTypeChanged = !!baseData && !!targetData && baseData.field.dataType !== targetData.field.dataType;
      const hasNullabilityChanged = !!baseData && !!targetData && baseData.field.isNullable !== targetData.field.isNullable;
      const hasPiiChanged = !!baseData && !!targetData && (baseData.field.piiTag || '') !== (targetData.field.piiTag || '');
      const hasPkChanged = !!baseData && !!targetData && baseData.field.isPrimaryKey !== targetData.field.isPrimaryKey;
      const hasDescChanged = !!baseData && !!targetData && (baseData.field.description || '') !== (targetData.field.description || '');

      const isModified = hasTypeChanged || hasNullabilityChanged || hasPiiChanged || hasPkChanged || hasDescChanged;
      const isOrderShifted = !!baseData && !!targetData && baseData.index !== targetData.index;

      return {
        fieldName: name,
        baseField: baseData?.field || null,
        baseIndex: baseData !== undefined ? baseData.index : null,
        targetField: targetData?.field || null,
        targetIndex: targetData !== undefined ? targetData.index : null,
        isAdded,
        isRemoved,
        isModified,
        isOrderShifted,
        hasTypeChanged,
        hasNullabilityChanged,
        hasPiiChanged,
        hasPkChanged,
        hasDescChanged
      };
    });

    // Apply search filter
    if (diffSearchQuery.trim() !== '') {
      const q = diffSearchQuery.toLowerCase();
      fields = fields.filter(f => f.fieldName.toLowerCase().includes(q));
    }

    // Apply filter button constraints if applicable in side-by-side
    if (diffFilter === 'added') {
      fields = fields.filter(f => f.isAdded);
    } else if (diffFilter === 'removed') {
      fields = fields.filter(f => f.isRemoved);
    } else if (diffFilter === 'modified') {
      fields = fields.filter(f => f.isModified || f.isOrderShifted);
    }

    return fields;
  };

  const filteredSystems = registryItems.filter((s) =>
    s.systemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.entityName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCdmEntities = cdmEntities.filter(
    (e) =>
      e.entityName.toLowerCase().includes(cdmSearchQuery.toLowerCase()) ||
      e.displayName.toLowerCase().includes(cdmSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification Banner */}
      {conflictToast && (
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-indigo-500/50 shadow-xl flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{conflictToast}</span>
          </div>
          <button onClick={() => setConflictToast(null)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 flex items-center gap-1">
              <Database className="w-3.5 h-3.5" />
              Unified Schema & Metadata Governance Hub
            </span>
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-black rounded-full border border-amber-100 uppercase tracking-tight flex items-center gap-1">
              <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
              Real-time Stream Engine Active
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Schema Version Registry & Metadata Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare source vs destination schemas, track real-time structural shifts, browse Canonical Models, and deploy semantic correction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRegistrySync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-3.5 py-2 ${isSyncing ? 'bg-slate-50 text-slate-400' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'} text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs`}
          >
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" /> : <RefreshCw className="w-4 h-4 text-emerald-500" />}
            <span>{isSyncing ? `Discovering (${syncProgress}%)` : 'Sync 9 Connections'}</span>
          </button>

          <button
            onClick={() => openConflictResolutionModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            title="Trigger Schema Version Mismatch & Conflict Resolution Modal"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Resolve Schema Mismatch</span>
          </button>
          
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Register New Version</span>
          </button>
        </div>
      </div>

      {/* System Selection Cards Bar (Visible for main registry tabs) */}
      {activeTab !== 'metadata-repo' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Registered System Schemas ({registryItems.length})
              </span>
              
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-3xs">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 shadow-3xs' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600 shadow-3xs' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search systems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredSystems.map((sys) => {
                const isSelected = sys.id === selectedSystem.id;
                return (
                  <div
                    key={sys.id}
                    onClick={() => handleSelectSystem(sys.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-900 text-white border-indigo-700 shadow-md ring-2 ring-indigo-500/30'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sys.systemType === 'Source'
                            ? isSelected
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                            : isSelected
                            ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {sys.systemType} System
                      </span>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Latest: {sys.latestVersion}
                      </span>
                    </div>

                    <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {sys.systemName}
                    </h3>

                    <div className={`text-xs mt-2 flex items-center justify-between ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                      <span>Entity: <strong className="font-mono">{sys.entityName}</strong></span>
                      <span>{sys.versions.length} Versions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">System Name</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Environment</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Latest</th>
                    <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Versions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSystems.map((sys) => {
                    const isSelected = sys.id === selectedSystem.id;
                    return (
                      <tr 
                        key={sys.id} 
                        onClick={() => handleSelectSystem(sys.id)}
                        className={`group cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`} />
                            <span className={`text-xs font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>
                              {sys.systemName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                            sys.systemType === 'Source' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {sys.systemType}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-medium text-slate-600 font-mono">
                            {sys.entityName}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                            sys.environment === 'Production' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {sys.environment}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-500">
                          {sys.latestVersion}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600 transition-colors">
                            {sys.versions.length} Ver.
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Selected System Main Work Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Header bar with controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {activeTab === 'metadata-repo' ? 'Canonical Metadata Repository' : selectedSystem.systemName}
              </h2>
              <p className="text-xs text-slate-500">
                {activeTab === 'metadata-repo' ? (
                  <span>Explore and extend global business models (CDM)</span>
                ) : (
                  <span>Environment: <strong className="text-slate-700">{selectedSystem.environment}</strong> &bull; Updated: {new Date(selectedSystem.updatedAt).toLocaleDateString()}</span>
                )}
              </p>
            </div>
          </div>

          {/* Navigation Tabs - ENHANCED to 6 tabs representing requested features */}
          <div className="flex flex-wrap items-center gap-1 bg-white p-1 border border-slate-200 rounded-xl">
            <button
              onClick={() => setActiveTab('diff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'diff'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Schema Compare</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Version History ({activeTab === 'metadata-repo' ? 'CDM' : selectedSystem.versions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('fields')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'fields'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Schema Registry</span>
            </button>

            <button
              onClick={() => setActiveTab('change-detection')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'change-detection'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Change Detection</span>
            </button>

            <button
              onClick={() => setActiveTab('metadata-repo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'metadata-repo'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Metadata Repository</span>
            </button>

            <button
              onClick={() => setActiveTab('ai-analysis')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ai-analysis'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Gemini AI Analyst</span>
            </button>

            <button
              onClick={() => setActiveTab('bulk-export')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'bulk-export'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Bulk Export</span>
            </button>

            <button
              onClick={() => setActiveTab('ddl-editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ddl-editor'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>SQL DDL Editor</span>
            </button>
          </div>
        </div>

        {/* TAB 1: SCHEMA VERSION DIFF COMPARISON */}
        {activeTab === 'diff' && (
          <div className="p-6 space-y-6">
            {/* Version Selector Select Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
              {/* Base Version */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Base / Historical Version (Past Snapshot)
                </label>
                <select
                  value={baseVersionId}
                  onChange={(e) => setBaseVersionId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-mono font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  {selectedSystem.versions.map((v) => (
                    <option key={v.versionId} value={v.versionId}>
                      {v.versionId} ({new Date(v.publishedAt).toLocaleDateString()}) &ndash; {v.commitMessage}
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>Author: {baseVerObj.publishedBy}</span>
                  <span>&bull;</span>
                  <span>Fields: {baseVerObj.fieldCount}</span>
                </div>
              </div>

              {/* Target Version */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  Target / Comparison Version (Active)
                </label>
                <select
                  value={targetVersionId}
                  onChange={(e) => setTargetVersionId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-mono font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  {selectedSystem.versions.map((v) => (
                    <option key={v.versionId} value={v.versionId}>
                      {v.versionId} ({new Date(v.publishedAt).toLocaleDateString()}) &ndash; {v.commitMessage}
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>Author: {targetVerObj.publishedBy}</span>
                  <span>&bull;</span>
                  <span>Fields: {targetVerObj.fieldCount}</span>
                </div>
              </div>
            </div>

            {/* Diff Summary Stat Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                    Added Fields
                  </span>
                  <p className="text-lg font-bold text-emerald-950 font-mono">
                    +{schemaDiff.addedFields.length}
                  </p>
                </div>
                <div className="p-2 bg-emerald-200/60 text-emerald-800 rounded-lg">
                  <Plus className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
                    Modified Fields
                  </span>
                  <p className="text-lg font-bold text-amber-950 font-mono">
                    ~{schemaDiff.modifiedFields.length}
                  </p>
                </div>
                <div className="p-2 bg-amber-200/60 text-amber-800 rounded-lg">
                  <Sliders className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider block">
                    Removed Fields
                  </span>
                  <p className="text-lg font-bold text-rose-950 font-mono">
                    -{schemaDiff.removedFields.length}
                  </p>
                </div>
                <div className="p-2 bg-rose-200/60 text-rose-800 rounded-lg">
                  <X className="w-4 h-4" />
                </div>
              </div>

              <div className={`p-3 border rounded-xl flex items-center justify-between ${
                schemaDiff.breakingChanges.length > 0
                  ? 'bg-rose-100 border-rose-300'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                    schemaDiff.breakingChanges.length > 0 ? 'text-rose-900' : 'text-slate-600'
                  }`}>
                    Breaking Risk Alerts
                  </span>
                  <p className={`text-lg font-bold font-mono ${
                    schemaDiff.breakingChanges.length > 0 ? 'text-rose-950' : 'text-slate-800'
                  }`}>
                    {schemaDiff.breakingChanges.length} Risks
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${
                  schemaDiff.breakingChanges.length > 0 ? 'bg-rose-200 text-rose-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Breaking Changes Warning Box */}
            {schemaDiff.breakingChanges.length > 0 && (
              <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Breaking Schema Mismatch Detected between {schemaDiff.baseVersion} and {schemaDiff.targetVersion}</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-amber-900 space-y-0.5">
                    {schemaDiff.breakingChanges.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => openConflictResolutionModal()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-200" />
                  <span>Resolve Conflict (Override / Patch / Fork)</span>
                </button>
              </div>
            )}

            {/* View Mode & Filter Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-2 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* View Mode Buttons */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                  <button
                    onClick={() => setCompareViewMode('side-by-side')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      compareViewMode === 'side-by-side'
                        ? 'bg-white text-indigo-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Side-by-Side Comparison</span>
                  </button>
                  <button
                    onClick={() => setCompareViewMode('changelog')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      compareViewMode === 'changelog'
                        ? 'bg-white text-indigo-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Structural Changelog</span>
                  </button>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDiffFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      diffFilter === 'all'
                        ? 'bg-slate-950 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    All ({schemaDiff.addedFields.length + schemaDiff.modifiedFields.length + schemaDiff.removedFields.length})
                  </button>
                  <button
                    onClick={() => setDiffFilter('added')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      diffFilter === 'added'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/60 border border-emerald-200/60'
                    }`}
                  >
                    Added (+{schemaDiff.addedFields.length})
                  </button>
                  <button
                    onClick={() => setDiffFilter('modified')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      diffFilter === 'modified'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50/50 text-amber-700 hover:bg-amber-100/60 border border-amber-200/60'
                    }`}
                  >
                    Modified (~{schemaDiff.modifiedFields.length})
                  </button>
                  <button
                    onClick={() => setDiffFilter('removed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      diffFilter === 'removed'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50/50 text-rose-700 hover:bg-rose-100/60 border border-rose-200/60'
                    }`}
                  >
                    Removed (-{schemaDiff.removedFields.length})
                  </button>
                </div>
              </div>

              {/* Search and comparison indicator */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search compared fields..."
                    value={diffSearchQuery}
                    onChange={(e) => setDiffSearchQuery(e.target.value)}
                    className="w-full sm:w-48 bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                  {diffSearchQuery && (
                    <button
                      onClick={() => setDiffSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-slate-400 font-mono text-right bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-150">
                  Comparing <strong className="text-slate-700">{baseVerObj.versionId}</strong> vs <strong className="text-indigo-700">{targetVerObj.versionId}</strong>
                </span>
              </div>
            </div>

            {compareViewMode === 'side-by-side' ? (
              <div className="space-y-4">
                {/* Legend explanation */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] bg-indigo-50/30 border border-indigo-100/40 p-3 rounded-2xl text-slate-600">
                  <span className="font-bold text-indigo-950 flex items-center gap-1 uppercase tracking-wide">
                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                    Comparison Guide:
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Added Field</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Removed Field</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Type / Constraint Shift</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Order Position Shift</span>
                  </span>
                </div>

                {/* Split Column Panel */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                  {/* Panel Header */}
                  <div className="hidden md:grid grid-cols-12 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left divide-x divide-slate-200">
                    <div className="col-span-5 py-3 px-4 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      <span>Base Schema ({baseVerObj.versionId})</span>
                    </div>
                    <div className="col-span-2 py-3 px-2 text-center flex items-center justify-center gap-1 bg-slate-100/50">
                      <span>Field & Diff Status</span>
                    </div>
                    <div className="col-span-5 py-3 px-4 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      <span>Target Schema ({targetVerObj.versionId})</span>
                    </div>
                  </div>

                  {/* Rows list */}
                  <div className="divide-y divide-slate-150 bg-slate-50/10">
                    {getUnifiedFields().length === 0 ? (
                      <div className="py-12 text-center text-slate-400 italic text-xs">
                        No fields found matching current query or filters.
                      </div>
                    ) : (
                      getUnifiedFields().map((row) => {
                        return (
                          <div
                            key={row.fieldName}
                            className={`grid grid-cols-1 md:grid-cols-12 text-xs transition-all hover:bg-slate-50/40 divide-y md:divide-y-0 md:divide-x divide-slate-150 ${
                              row.isAdded ? 'bg-emerald-50/15' : row.isRemoved ? 'bg-rose-50/15' : row.isModified ? 'bg-amber-50/15' : ''
                            }`}
                          >
                            {/* Left Column: Base Field Definition */}
                            <div className="col-span-5 p-4 space-y-2">
                              <div className="block md:hidden text-[10px] text-slate-400 font-bold uppercase mb-1">
                                Base Schema ({baseVerObj.versionId})
                              </div>
                              {row.baseField ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-bold text-slate-800 break-all">{row.fieldName}</span>
                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-mono rounded font-bold" title="Field index in original schema">
                                      Pos: #{row.baseIndex !== null ? row.baseIndex + 1 : '-'}
                                    </span>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                                      row.hasTypeChanged ? 'bg-amber-100 text-amber-800 line-through border border-amber-200' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      {row.baseField.dataType}
                                    </span>

                                    {row.baseField.isNullable ? (
                                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                                        row.hasNullabilityChanged ? 'bg-amber-100 text-amber-800 line-through border border-amber-200' : 'bg-slate-100 text-slate-500'
                                      }`}>
                                        NULLABLE
                                      </span>
                                    ) : (
                                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                                        row.hasNullabilityChanged ? 'bg-amber-100 text-amber-800 line-through border border-amber-200' : 'bg-rose-50 text-rose-700'
                                      }`}>
                                        NOT NULL
                                      </span>
                                    )}

                                    {row.baseField.isPrimaryKey && (
                                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                                        row.hasPkChanged ? 'bg-amber-100 text-amber-800 line-through border border-amber-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}>
                                        PRIMARY KEY
                                      </span>
                                    )}

                                    {row.baseField.piiTag && (
                                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full flex items-center gap-0.5 ${
                                        row.hasPiiChanged ? 'bg-amber-100 text-amber-800 line-through border border-amber-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                                      }`}>
                                        <Lock className="w-2.5 h-2.5" />
                                        {row.baseField.piiTag}
                                      </span>
                                    )}
                                  </div>

                                  {row.baseField.description && (
                                    <p className={`text-[10px] text-slate-500 italic line-clamp-1 ${row.hasDescChanged ? 'line-through opacity-60' : ''}`}>
                                      {row.baseField.description}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center p-3 text-slate-400 italic text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                  Field does not exist in Base Schema
                                </div>
                              )}
                            </div>

                            {/* Middle Connection and Diff Badge */}
                            <div className="col-span-2 p-3 flex flex-row md:flex-col items-center justify-center gap-1.5 bg-slate-50/60 self-stretch min-h-[50px]">
                              {row.isAdded && (
                                <>
                                  <div className="p-1 bg-emerald-100 text-emerald-800 rounded-full">
                                    <Plus className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wider">
                                    + Added
                                  </span>
                                </>
                              )}
                              {row.isRemoved && (
                                <>
                                  <div className="p-1 bg-rose-100 text-rose-800 rounded-full">
                                    <X className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-bold uppercase tracking-wider">
                                    - Removed
                                  </span>
                                </>
                              )}
                              {!row.isAdded && !row.isRemoved && (
                                <>
                                  {row.isModified ? (
                                    <div className="flex flex-col items-center gap-1 w-full text-center">
                                      <div className="p-1 bg-amber-100 text-amber-800 rounded-full">
                                        <Sliders className="w-3.5 h-3.5" />
                                      </div>
                                      <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[8px] font-bold uppercase tracking-wider block">
                                        ~ Modified
                                      </span>
                                      
                                      <div className="flex flex-col gap-0.5 mt-0.5">
                                        {row.hasTypeChanged && (
                                          <span className="text-[8px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1 rounded">
                                            Type Mismatch
                                          </span>
                                        )}
                                        {row.hasNullabilityChanged && (
                                          <span className="text-[8px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1 rounded">
                                            Nullability Altered
                                          </span>
                                        )}
                                        {row.hasPiiChanged && (
                                          <span className="text-[8px] font-bold text-purple-900 bg-purple-50 border border-purple-200 px-1 rounded">
                                            PII Tag Shifted
                                          </span>
                                        )}
                                        {row.hasPkChanged && (
                                          <span className="text-[8px] font-bold text-red-900 bg-red-50 border border-red-200 px-1 rounded">
                                            PK Status Shifted
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ) : null}

                                  {row.isOrderShifted ? (
                                    <div className="flex flex-col items-center gap-1 w-full mt-1 text-center">
                                      <div className="p-1 bg-blue-100 text-blue-800 rounded-full" title={`Order shifted from position #${row.baseIndex! + 1} to #${row.targetIndex! + 1}`}>
                                        <History className="w-3.5 h-3.5" />
                                      </div>
                                      <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[8px] font-bold uppercase tracking-wider block">
                                        ↕ Order Shift
                                      </span>
                                      <span className="text-[9px] font-mono font-bold text-blue-900 bg-blue-50 px-1 rounded border border-blue-200">
                                        #{row.baseIndex! + 1} ➔ #{row.targetIndex! + 1}
                                      </span>
                                    </div>
                                  ) : null}

                                  {!row.isModified && !row.isOrderShifted && (
                                    <>
                                      <div className="p-1 bg-slate-100 text-slate-400 rounded-full">
                                        <Check className="w-3.5 h-3.5" />
                                      </div>
                                      <span className="text-[9px] font-medium text-slate-400">
                                        Identical
                                      </span>
                                    </>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Right Column: Target Field Definition */}
                            <div className="col-span-5 p-4 space-y-2">
                              <div className="block md:hidden text-[10px] text-indigo-400 font-bold uppercase mb-1">
                                Target Schema ({targetVerObj.versionId})
                              </div>
                              {row.targetField ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-bold text-slate-950 break-all">{row.fieldName}</span>
                                    <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded font-bold ${
                                      row.isOrderShifted ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-600'
                                    }`} title="Field index in target schema">
                                      Pos: #{row.targetIndex !== null ? row.targetIndex + 1 : '-'}
                                    </span>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                      row.hasTypeChanged ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' : 'bg-indigo-50 text-indigo-900 border border-indigo-100'
                                    }`}>
                                      {row.targetField.dataType}
                                    </span>

                                    {row.targetField.isNullable ? (
                                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                                        row.hasNullabilityChanged ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-500'
                                      }`}>
                                        NULLABLE
                                      </span>
                                    ) : (
                                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                                        row.hasNullabilityChanged ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' : 'bg-rose-100 text-rose-800'
                                      }`}>
                                        NOT NULL
                                      </span>
                                    )}

                                    {row.targetField.isPrimaryKey && (
                                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                                        row.hasPkChanged ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-100 text-amber-800 border border-amber-200'
                                      }`}>
                                        PRIMARY KEY
                                      </span>
                                    )}

                                    {row.targetField.piiTag && (
                                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full flex items-center gap-0.5 ${
                                        row.hasPiiChanged ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-purple-50 text-purple-700 border border-purple-200'
                                      }`}>
                                        <Lock className="w-2.5 h-2.5" />
                                        {row.targetField.piiTag}
                                      </span>
                                    )}
                                  </div>

                                  {row.targetField.description && (
                                    <p className={`text-[10px] text-slate-600 italic line-clamp-1 ${row.hasDescChanged ? 'font-bold text-indigo-900 bg-indigo-50/50 p-1 rounded' : ''}`}>
                                      {row.targetField.description}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center p-3 text-slate-400 italic text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                  Field dropped from Target Schema
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Schema Diff Table (Original layout) */
              <OverflowTableWrapper>
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Diff Status</th>
                      <th className="py-2.5 px-4">Field Name</th>
                      <th className="py-2.5 px-4">Base Schema ({schemaDiff.baseVersion})</th>
                      <th className="py-2.5 px-4">Target Schema ({schemaDiff.targetVersion})</th>
                      <th className="py-2.5 px-4">Details & Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Added Fields */}
                    {(diffFilter === 'all' || diffFilter === 'added') &&
                      schemaDiff.addedFields
                        .filter(f => f.fieldName.toLowerCase().includes(diffSearchQuery.toLowerCase()))
                        .map((field) => (
                          <tr key={`add-${field.fieldName}`} className="bg-emerald-50/40 hover:bg-emerald-50">
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                                + Added
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                              {field.fieldName}
                            </td>
                            <td className="py-2.5 px-4 text-slate-400 font-mono italic">
                              (Not present)
                            </td>
                            <td className="py-2.5 px-4 font-mono text-emerald-950 font-bold">
                              {field.dataType} {field.isNullable ? '(NULL)' : '(NOT NULL)'}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">
                              {field.description || 'New field introduced in target version.'}
                            </td>
                          </tr>
                        ))}

                    {/* Modified Fields */}
                    {(diffFilter === 'all' || diffFilter === 'modified') &&
                      schemaDiff.modifiedFields
                        .filter(mod => mod.fieldName.toLowerCase().includes(diffSearchQuery.toLowerCase()))
                        .map((mod) => (
                          <tr key={`mod-${mod.fieldName}`} className="bg-amber-50/40 hover:bg-amber-50">
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] uppercase">
                                ~ Modified
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                              {mod.fieldName}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-600">
                              {mod.oldType || 'Previous Type'}{' '}
                              {mod.oldNullable !== undefined && (mod.oldNullable ? '(NULL)' : '(NOT NULL)')}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-amber-950 font-bold">
                              {mod.newType || 'New Type'}{' '}
                              {mod.newNullable !== undefined && (mod.newNullable ? '(NULL)' : '(NOT NULL)')}
                            </td>
                            <td className="py-2.5 px-4 text-amber-900 font-semibold">
                              {mod.changes.join(' | ')}
                            </td>
                          </tr>
                        ))}

                    {/* Removed Fields */}
                    {(diffFilter === 'all' || diffFilter === 'removed') &&
                      schemaDiff.removedFields
                        .filter(f => f.fieldName.toLowerCase().includes(diffSearchQuery.toLowerCase()))
                        .map((field) => (
                          <tr key={`rem-${field.fieldName}`} className="bg-rose-50/40 hover:bg-rose-50">
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px] uppercase">
                                - Removed
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-rose-900 line-through">
                              {field.fieldName}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-700">
                              {field.dataType} {field.isNullable ? '(NULL)' : '(NOT NULL)'}
                            </td>
                            <td className="py-2.5 px-4 text-rose-400 font-mono italic">
                              (Dropped)
                            </td>
                            <td className="py-2.5 px-4 text-rose-800 font-semibold">
                              Field removed in target version. Data migration mapping will drop this column.
                            </td>
                          </tr>
                        ))}

                    {schemaDiff.addedFields.filter(f => f.fieldName.toLowerCase().includes(diffSearchQuery.toLowerCase())).length === 0 &&
                      schemaDiff.modifiedFields.filter(mod => mod.fieldName.toLowerCase().includes(diffSearchQuery.toLowerCase())).length === 0 &&
                      schemaDiff.removedFields.filter(f => f.fieldName.toLowerCase().includes(diffSearchQuery.toLowerCase())).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                            No structural differences found matching the query.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </OverflowTableWrapper>
            )}
          </div>
        )}

        {/* TAB 2: VERSION TIMELINE & HISTORY */}
        {activeTab === 'timeline' && (
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              Version Commit History ({selectedSystem.versions.length} Releases)
            </h3>

            <div className="relative border-l-2 border-indigo-100 ml-4 pl-6 space-y-6">
              {selectedSystem.versions.map((ver, idx) => {
                const isLatest = idx === 0;
                return (
                  <div key={ver.versionId} className="relative group animate-in fade-in slide-in-from-left-2 duration-150">
                    {/* Timeline Node Icon */}
                    <div
                      className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                        isLatest ? 'bg-indigo-600 ring-4 ring-indigo-100' : 'bg-slate-400'
                      }`}
                    >
                      <GitCommit className="w-3.5 h-3.5" />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono text-slate-900">
                            {ver.versionId}
                          </span>
                          {isLatest && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                              Active / Latest
                            </span>
                          )}
                          {ver.migrationJobRef && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono rounded-md">
                              Job: {ver.migrationJobRef}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(ver.publishedAt).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {ver.publishedBy}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 font-medium">
                        "{ver.commitMessage}"
                      </p>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Contains <strong className="text-slate-800 font-mono">{ver.fieldCount}</strong> fields
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setBaseVersionId(ver.versionId);
                              setActiveTab('diff');
                            }}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            Set as Base
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => {
                              setTargetVersionId(ver.versionId);
                              setActiveTab('diff');
                            }}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            Set as Target
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TARGET FIELDS LIST WITH METADATA EDITOR */}
        {activeTab === 'fields' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  Active Fields in Version {targetVerObj.versionId} ({targetVerObj.fields.length} Fields)
                </h3>
                <p className="text-xs text-slate-500">Drag and drop field handles to reorder governance sequence, or click "Edit Metadata" to modify properties live.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsAutoDetectOpen(!isAutoDetectOpen);
                    if (!isAutoDetectOpen) {
                      setTimeout(() => {
                        handleRunTypeDetection();
                      }, 100);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer ${
                    isAutoDetectOpen
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : 'bg-white hover:bg-slate-50 text-indigo-700 border-indigo-200'
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAutoDetectOpen ? 'text-amber-300' : 'text-indigo-600 animate-pulse'}`} />
                  <span>{isAutoDetectOpen ? 'Close Type Analyzer' : 'Auto-Detect Types'}</span>
                </button>
                <span className="text-xs text-slate-400 font-mono hidden md:inline">
                  Published by {targetVerObj.publishedBy}
                </span>
              </div>
            </div>

            {isAutoDetectOpen && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-indigo-100 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-2 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      AI Data Type Suggestion Engine
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Select a sample payload or paste your raw dataset to automatically identify database types and lengths.</p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <select
                      value={selectedSampleSource}
                      onChange={(e) => {
                        setSelectedSampleSource(e.target.value);
                        if (e.target.value !== 'custom-pasted') {
                          setTimeout(() => {
                            handleRunTypeDetection();
                          }, 50);
                        }
                      }}
                      className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="sample-cust-excel">Source Excel Sample (Customer Master)</option>
                      <option value="sample-ledgers">Postgres Ledger Stream Sample</option>
                      <option value="sample-sfdc">Salesforce Accounts API Export</option>
                      <option value="custom-pasted">[Paste Custom CSV or JSON Data]</option>
                    </select>

                    <button
                      onClick={handleRunTypeDetection}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Scan Data</span>
                    </button>
                  </div>
                </div>

                {selectedSampleSource === 'custom-pasted' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 block">Paste Sample JSON array or raw CSV rows:</label>
                    <textarea
                      value={pastedSampleData}
                      onChange={(e) => setPastedSampleData(e.target.value)}
                      placeholder={`Paste JSON array like:\n[\n  {"id": 1, "name": "Alice", "balance": 120.50, "is_active": true},\n  {"id": 2, "name": "Bob", "balance": 450.00, "is_active": false}\n]\n\nOr Paste CSV like:\nNo.,Name,Balance,IsActive\n1,Alice,120.50,true\n2,Bob,450.00,false`}
                      rows={5}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    />
                    {customParseError && (
                      <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {customParseError}
                      </p>
                    )}
                  </div>
                )}

                {detectionResults.length > 0 ? (
                  <div className="space-y-3">
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[250px] overflow-y-auto bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
                          <tr>
                            <th className="py-2 px-3 w-10 text-center">Apply</th>
                            <th className="py-2 px-3">Field Name</th>
                            <th className="py-2 px-3">Current Type</th>
                            <th className="py-2 px-3 text-indigo-700">Detected Suggestion</th>
                            <th className="py-2 px-3">Match Confidence</th>
                            <th className="py-2 px-3">Inspected Samples</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detectionResults.map((r) => {
                            const isSelected = !!selectedDetectedFields[r.fieldName];
                            const isUnchanged = r.detectedType.toUpperCase() === r.currentType.toUpperCase();
                            return (
                              <tr key={r.fieldName} className={`hover:bg-indigo-50/10 ${isUnchanged ? 'opacity-60' : ''}`}>
                                <td className="py-2 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isUnchanged}
                                    onChange={(e) => {
                                      setSelectedDetectedFields(prev => ({
                                        ...prev,
                                        [r.fieldName]: e.target.checked
                                      }));
                                    }}
                                    className="rounded text-indigo-600 disabled:opacity-30 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-slate-900">{r.fieldName}</td>
                                <td className="py-2 px-3 font-mono text-slate-500">{r.currentType}</td>
                                <td className="py-2 px-3 font-mono font-bold text-indigo-700">
                                  <div className="flex items-center gap-1.5">
                                    <span>{r.detectedType}</span>
                                    {!isUnchanged && (
                                      <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 text-[9px] rounded font-semibold animate-pulse">
                                        New
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    r.confidence >= 90
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : r.confidence >= 80
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                                  }`}>
                                    {r.confidence}% Match
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-500 italic max-w-[200px] truncate">
                                  {r.sampleValues.length > 0 ? r.sampleValues.join(', ') : <span className="text-slate-300">N/A</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="text-[11px] text-slate-500">
                        Selected <strong className="text-slate-700 font-mono">{Object.values(selectedDetectedFields).filter(Boolean).length}</strong> type updates out of {detectionResults.length} fields.
                      </div>
                      <div className="flex items-center gap-2 self-end">
                        <button
                          onClick={() => {
                            const newSelected: Record<string, boolean> = {};
                            detectionResults.forEach(r => {
                              if (r.detectedType.toUpperCase() !== r.currentType.toUpperCase()) {
                                newSelected[r.fieldName] = true;
                              }
                            });
                            setSelectedDetectedFields(newSelected);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-850 transition-colors"
                        >
                          Select All Changes
                        </button>
                        <button
                          onClick={() => setSelectedDetectedFields({})}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-850 transition-colors"
                        >
                          Clear Selection
                        </button>
                        <button
                          onClick={() => {
                            setRegistryItems((prev) =>
                              prev.map((item) => {
                                if (item.id === selectedSystem.id) {
                                  return {
                                    ...item,
                                    versions: item.versions.map((ver) => {
                                      if (ver.versionId === targetVersionId) {
                                        return {
                                          ...ver,
                                          fields: ver.fields.map((field) => {
                                            const detection = detectionResults.find(d => d.fieldName === field.fieldName);
                                            if (detection && selectedDetectedFields[field.fieldName]) {
                                              return {
                                                ...field,
                                                dataType: detection.detectedType
                                              };
                                            }
                                            return field;
                                          })
                                        };
                                      }
                                      return ver;
                                    })
                                  };
                                }
                                return item;
                              })
                            );
                            setIsAutoDetectOpen(false);
                            const count = Object.values(selectedDetectedFields).filter(Boolean).length;
                            showToast(`Successfully applied ${count} data type updates from dataset scanning!`);
                          }}
                          disabled={Object.values(selectedDetectedFields).filter(Boolean).length === 0}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer transition-all"
                        >
                          Apply Selected Suggestions
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 italic text-xs">
                    No detection results. Select a dataset and click "Scan Data".
                  </div>
                )}
              </div>
            )}

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <OverflowTableWrapper>
                <table className="w-full text-left text-xs min-w-[800px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">Order</th>
                      <th className="py-2.5 px-4">Field Name</th>
                      <th className="py-2.5 px-4">Data Type</th>
                      <th className="py-2.5 px-4">Nullable</th>
                      <th className="py-2.5 px-4">PK</th>
                      <th className="py-2.5 px-4">PII Sensitivity Tag</th>
                      <th className="py-2.5 px-4">Governance Description</th>
                      <th className="py-2.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {targetVerObj.fields.map((f, idx) => {
                      const isEditing = editingFieldId === f.fieldName;
                      const isBeingDragged = draggedFieldIndex === idx;
                      const isOver = dragOverFieldIndex === idx;
                      
                      return (
                        <tr
                          key={`${f.fieldName}-${idx}`}
                          draggable={!isEditing}
                          onDragStart={(e) => {
                            setDraggedFieldIndex(idx);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (draggedFieldIndex !== null && draggedFieldIndex !== idx) {
                              setDragOverFieldIndex(idx);
                            }
                          }}
                          onDragEnd={() => {
                            setDraggedFieldIndex(null);
                            setDragOverFieldIndex(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedFieldIndex !== null && draggedFieldIndex !== idx) {
                              handleReorderFields(draggedFieldIndex, idx);
                            }
                            setDraggedFieldIndex(null);
                            setDragOverFieldIndex(null);
                          }}
                          className={`hover:bg-slate-50/50 transition-all ${
                            isBeingDragged ? 'opacity-30 bg-indigo-50/30 select-none' : ''
                          } ${
                            isOver ? 'border-t-2 border-indigo-500 bg-indigo-50/10' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center text-slate-400">
                            <div className="flex items-center justify-center cursor-grab active:cursor-grabbing hover:text-indigo-600 transition-colors p-1" title="Drag to reorder field">
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                            {f.fieldName}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-indigo-900 font-semibold">
                            {f.dataType}
                          </td>
                          <td className="py-2.5 px-4 font-mono">
                            {isEditing ? (
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingFieldNullable}
                                  onChange={(e) => setEditingFieldNullable(e.target.checked)}
                                  className="rounded text-indigo-600 cursor-pointer"
                                />
                                <span className="text-[10px] font-bold text-slate-700">NULLABLE</span>
                              </label>
                            ) : f.isNullable ? (
                              <span className="text-slate-500">NULLABLE</span>
                            ) : (
                              <span className="text-rose-700 font-bold">NOT NULL</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {f.isPrimaryKey && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                                PK
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {isEditing ? (
                              <select
                                value={editingFieldPii}
                                onChange={(e) => setEditingFieldPii(e.target.value)}
                                className="bg-white border border-slate-200 text-slate-800 rounded px-1.5 py-0.5 text-[11px] font-semibold focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                              >
                                <option value="">None / Public</option>
                                <option value="Personal Name">Personal Name</option>
                                <option value="Email">Email</option>
                                <option value="Phone">Phone</option>
                                <option value="Address">Address</option>
                                <option value="SSN/Tax">SSN/Tax ID</option>
                                <option value="Internal ID">Internal ID</option>
                                <option value="Financial">Financial Value</option>
                              </select>
                            ) : f.piiTag ? (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold rounded-full flex items-center gap-1 w-fit">
                                <Lock className="w-3 h-3 text-purple-600" />
                                {f.piiTag}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">None</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 max-w-[280px] truncate">
                            {isEditing ? (
                              <input
                                  type="text"
                                  value={editingFieldDesc}
                                  onChange={(e) => setEditingFieldDesc(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-800 focus:outline-hidden focus:border-indigo-500"
                                />
                            ) : (
                              f.description || <span className="text-slate-400 italic">No description</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleSaveFieldMetadata(f.fieldName)}
                                  className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg cursor-pointer transition-colors"
                                  title="Save Changes"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingFieldId(null)}
                                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEditField(f)}
                                className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                              >
                                Edit Metadata
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </OverflowTableWrapper>
            </div>
          </div>
        )}

        {/* TAB 4: CHANGE DETECTION & DRIFT ENGINE */}
        {activeTab === 'change-detection' && (
          <div className="p-6 space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Live Schema Drift Status</span>
                  <p className="text-base font-bold flex items-center gap-1.5">
                    {driftAnalysisStatus === 'idle' && (
                      <>
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">Catalog Not Scanned</span>
                      </>
                    )}
                    {driftAnalysisStatus === 'scanning' && (
                      <>
                        <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                        <span className="text-amber-400 font-medium">Scanning Catalogs...</span>
                      </>
                    )}
                    {driftAnalysisStatus === 'clean' && (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">In-Sync / Perfect</span>
                      </>
                    )}
                    {driftAnalysisStatus === 'drift-detected' && (
                      <>
                        <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
                        <span className="text-rose-400 font-bold">2 Schema Drifts Found</span>
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleScanPhysicalCatalogs}
                  disabled={driftAnalysisStatus === 'scanning'}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Scan Database
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Schema Volatility Index</span>
                  <p className="text-lg font-bold text-slate-800 font-mono">14.8% <span className="text-xs font-normal text-emerald-600 font-sans">&darr; Low</span></p>
                </div>
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Last Drift Audit Run</span>
                  <p className="text-xs font-semibold text-slate-800 mt-1">Today, {new Date().toLocaleTimeString()}</p>
                </div>
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Simulated Live Scan results */}
            {driftAnalysisStatus === 'drift-detected' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <h4 className="text-xs font-bold text-rose-950">
                    Live Drifts Discovered on Physical Database System Mapping:
                  </h4>
                </div>
                <p className="text-[11px] text-rose-800">
                  The actual database catalog currently has altered structural constraints compared to the registered version <strong className="font-mono">{targetVersionId}</strong> schemas. This may cause physical ingest failures.
                </p>
              </div>
            )}

            {/* Audit Logs Trail */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Schema Change & Drift Detection Audit Logs ({driftLogs.length} Events)
                </span>
                <span className="text-slate-400 text-[10px] font-mono">Catalog: sys-catalog-production</span>
              </div>

              <div className="space-y-4">
                {driftLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 bg-white ${
                      log.reconciliationStatus === 'Applied'
                        ? 'border-slate-200 opacity-80'
                        : log.severity === 'High'
                        ? 'border-rose-300 shadow-2xs hover:shadow-xs'
                        : 'border-amber-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            log.reconciliationStatus === 'Applied'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : log.severity === 'High'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {log.reconciliationStatus === 'Applied' ? 'Reconciled / Corrected' : `${log.severity} Severity`}
                        </span>

                        <span className="text-slate-400 text-xs font-mono">&bull; Event: {log.changeType}</span>
                        <span className="text-slate-400 text-xs font-mono">&bull; {new Date(log.timestamp).toLocaleString()}</span>
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono">
                        Source: <span className="font-semibold text-slate-600">{log.detectedBy}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block uppercase">Field Name & Object</span>
                        <p className="text-xs font-bold text-slate-900 font-mono flex items-center gap-1">
                          <CornerDownRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          {log.fieldName} <span className="font-sans text-slate-500 font-normal">({log.entityName} Table)</span>
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block uppercase">Registry Registered State</span>
                        <p className="text-xs font-mono text-slate-600 font-semibold">{log.sourceValue}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block uppercase">Physical Catalog State</span>
                        <p className="text-xs font-mono text-rose-700 font-bold">{log.targetValue}</p>
                      </div>
                    </div>

                    {/* Reconciliation panel */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 p-2.5 rounded-xl">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-indigo-800 uppercase block">Reconciliation Correction Patch SQL</span>
                        <code className="text-[11px] font-mono text-slate-700 block">{log.reconciliationScript}</code>
                      </div>

                      {log.reconciliationStatus === 'Pending' && (
                        <button
                          onClick={() => handleApplyReconciliationScript(log.id)}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Check className="w-3.5 h-3.5 text-amber-300" />
                          <span>Apply Patch Reconciliation</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CANONICAL METADATA REPOSITORY (CDM) */}
        {activeTab === 'metadata-repo' && (
          <div className="p-6 space-y-6">
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Canonical Data Model (CDM) Directory
                </h3>
                <p className="text-xs text-slate-400 mt-1">Browse standardized enterprise entities, define HIPAA/GDPR sensitive tags, and register schema attribute extensions.</p>
              </div>
              <button
                onClick={handleExportCdmSchema}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CDM Schema (JSON)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left sidebar with CDM list */}
              <div className="space-y-3 lg:col-span-1 border-r border-slate-200 pr-4">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search CDM entities..."
                    value={cdmSearchQuery}
                    onChange={(e) => setCdmSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  {filteredCdmEntities.map((ent) => {
                    const isSelected = ent.id === selectedCdmEntity.id;
                    return (
                      <div
                        key={ent.id}
                        onClick={() => setSelectedCdmEntityId(ent.id)}
                        className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-950 border border-indigo-200 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="space-y-0.5 truncate">
                          <span className="text-xs truncate block">{ent.displayName}</span>
                          <span className="text-[10px] text-slate-400 block font-mono font-normal">Entity: {ent.entityName}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {ent.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right panel with CDM Attributes List */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{selectedCdmEntity.displayName} Entity</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedCdmEntity.description}</p>
                  </div>

                  <button
                    onClick={() => setIsAddingCdmAttr(true)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4 text-amber-300" />
                    <span>Add Custom Schema Extension</span>
                  </button>
                </div>

                {/* CDM Attributes Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <OverflowTableWrapper>
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4">Attribute Name</th>
                          <th className="py-2.5 px-4">Data Type</th>
                          <th className="py-2.5 px-4">Constraint</th>
                          <th className="py-2.5 px-4">Origin Status</th>
                          <th className="py-2.5 px-4">Governance Guidelines</th>
                          <th className="py-2.5 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {/* Standard Attributes */}
                        {selectedCdmEntity.standardAttributes.map((attr) => (
                          <tr key={attr.id} className="hover:bg-slate-50/40">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                              {attr.attributeName}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-indigo-900 font-semibold">
                              {attr.dataType}
                            </td>
                            <td className="py-2.5 px-4">
                              {attr.isRequired ? (
                                <span className="text-rose-700 font-bold">REQUIRED</span>
                              ) : (
                                <span className="text-slate-400">OPTIONAL</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-bold">
                                CDM Standard Baseline
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">
                              {attr.description || 'Standard canonical ERP mapping attribute guidelines.'}
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-400 italic">
                              Immutable
                            </td>
                          </tr>
                        ))}

                        {/* Custom Attributes */}
                        {selectedCdmEntity.customAttributes.map((attr) => (
                          <tr key={attr.id} className="bg-purple-50/30 hover:bg-purple-50">
                            <td className="py-2.5 px-4 font-mono font-bold text-purple-900">
                              {attr.attributeName}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-purple-950 font-semibold">
                              {attr.dataType}
                            </td>
                            <td className="py-2.5 px-4">
                              {attr.isRequired ? (
                                <span className="text-rose-700 font-bold">REQUIRED</span>
                              ) : (
                                <span className="text-slate-400">OPTIONAL</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded text-[9px] font-bold">
                                Enterprise Extension
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-700">
                              {attr.description}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                onClick={() => handleRemoveCdmCustomAttribute(attr.id)}
                                className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-100 cursor-pointer"
                                title="Remove Attribute Extension"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {selectedCdmEntity.customAttributes.length === 0 && (
                          <tr className="border-t border-slate-100">
                            <td colSpan={6} className="py-3.5 px-4 text-center text-slate-400 italic">
                              No custom enterprise extensions defined for this canonical entity. Use the add extension form.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </OverflowTableWrapper>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MULTI-MODEL SCHEMA AI ANALYST */}
        {activeTab === 'ai-analysis' && (
          <div className="p-6 space-y-6">
            <div className="p-5 bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-2xl border border-indigo-700 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
              <div className="space-y-1.5 max-w-xl">
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold rounded-full flex items-center gap-1 w-fit uppercase">
                  <Brain className="w-3.5 h-3.5 text-amber-300" />
                  AI Multi-Model Co-Pilot ({aiAuditProvider.toUpperCase()})
                </span>
                <h3 className="text-base font-bold">Autonomous Schema Compliance & Compatibility Auditor</h3>
                <p className="text-xs text-indigo-200">Select an auditing focus and target model engine to evaluate '{selectedSystem.systemName}' version {targetVerObj.versionId} metadata schema configurations.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <select
                  value={aiAuditProvider}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    setAiAuditProvider(val);
                    if (val === 'gemini') setAiAuditModel('Gemini 2.5 Flash');
                    if (val === 'openai') setAiAuditModel('GPT-4o (Omni)');
                    if (val === 'anthropic') setAiAuditModel('Claude 3.5 Sonnet');
                    if (val === 'kimi') setAiAuditModel('Kimi-Chat 200k');
                    if (val === 'glm') setAiAuditModel('GLM-4-Plus');
                    if (val === 'qwen') setAiAuditModel('Qwen-2.5-72B');
                  }}
                  className="bg-indigo-900/90 border border-indigo-600 text-white text-xs font-semibold rounded-xl px-2.5 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI GPT</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="kimi">Moonshot Kimi</option>
                  <option value="glm">Zhipu GLM</option>
                  <option value="qwen">Alibaba Qwen</option>
                </select>

                <select
                  value={aiAuditObjective}
                  onChange={(e: any) => setAiAuditObjective(e.target.value)}
                  className="bg-indigo-950 border border-indigo-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="breaking-changes">Breaking Alterations Check</option>
                  <option value="compliance-pii">PII / GDPR Compliance</option>
                  <option value="normalization-quality">Normalization & Indexes Quality</option>
                </select>

                <button
                  onClick={handleRunAiSchemaAudit}
                  disabled={aiIsAuditing}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                >
                  {aiIsAuditing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Auditing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>Run Schema Audit</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Progress Loader */}
            {aiIsAuditing && (
              <div className="p-12 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-4 animate-pulse">
                <Brain className="w-12 h-12 text-indigo-600 animate-bounce" />
                <div className="space-y-1 text-center">
                  <p className="text-xs font-bold text-slate-800">Analyzing schema fields compliance constraints...</p>
                  <p className="text-[11px] text-slate-500 font-mono italic">{aiAuditProgressStep}</p>
                </div>
              </div>
            )}

            {/* AI Generated Audit Report */}
            {aiAuditReport && !aiIsAuditing && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {/* Score and Summary card */}
                <div className="lg:col-span-1 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">AI Evaluation Score</span>
                    
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 flex items-center justify-center bg-indigo-100 rounded-full border-2 border-indigo-400 text-indigo-950 font-mono font-bold text-xl">
                        {aiAuditReport.score}%
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{aiAuditReport.title}</h4>
                        <span className="text-[10px] text-slate-400">Governance Grade: {aiAuditReport.score >= 90 ? 'A+' : aiAuditReport.score >= 80 ? 'B' : 'C-'}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      "{aiAuditReport.summary}"
                    </p>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-[11px] text-indigo-900 font-semibold space-y-1">
                    <span className="text-[10px] text-indigo-800 font-bold uppercase tracking-wider block">AI Recommendation Summary</span>
                    <span>Deploy auto-reconciliation patch script immediately to bypass ingestion failures.</span>
                  </div>
                </div>

                {/* Audit Findings */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Detailed vulnerabilities list */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Audit Vulnerabilities / Discrepancies Found ({aiAuditReport.vulnerabilities.length})</span>
                    
                    <div className="space-y-3">
                      {aiAuditReport.vulnerabilities.map((vuln, idx) => (
                        <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-indigo-600" />
                              Field: {vuln.field}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              vuln.severity === 'High' ? 'bg-rose-100 text-rose-800' : vuln.severity === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {vuln.severity} Risk
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium">{vuln.issue}</p>
                          <div className="text-[11px] text-slate-500 pl-4 border-l border-indigo-300 italic">
                            Correction: {vuln.advice}
                          </div>
                        </div>
                      ))}

                      {aiAuditReport.vulnerabilities.length === 0 && (
                        <div className="p-6 text-center text-slate-400 italic">No design vulnerabilities detected! Perfect normalization structure.</div>
                      )}
                    </div>
                  </div>

                  {/* Suggeted PII tags */}
                  {aiAuditReport.piiTagSuggestions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Suggested PII Governance Sensitivities</span>
                      <div className="bg-purple-50/50 border border-purple-200 p-3.5 rounded-xl space-y-2 text-xs">
                        {aiAuditReport.piiTagSuggestions.map((sugg, idx) => (
                          <div key={idx} className="flex items-center justify-between font-mono">
                            <span>Field <strong className="text-purple-900 font-bold">{sugg.field}</strong> matches <strong className="text-purple-950">{sugg.detectedType}</strong></span>
                            <span className="text-[11px] text-slate-500">Reason: {sugg.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reconcile code */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Deployable Ingestion Fix SQL Patch</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(aiAuditReport.reconcileSql);
                          showToast(`Copied AI reconciliation SQL script to clipboard!`);
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Copy Script</span>
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-xl overflow-x-auto">
                      {aiAuditReport.reconcileSql}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* AI Ingest Advice placeholder */}
            {!aiAuditReport && !aiIsAuditing && (
              <div className="p-12 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-3">
                <Brain className="w-10 h-10 text-slate-300" />
                <h4 className="text-sm font-bold text-slate-700">Schema AI Analyst is Idle</h4>
                <p className="text-xs text-slate-400 text-center max-w-md">Choose an audit goal and run the security, compliance, or structural normalization scan above to evaluate metadata schemas.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bulk-export' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Left Column: Export Configuration & Settings */}
              <div className="w-full lg:w-5/12 space-y-6">
                
                {/* Format and dialect selection */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-indigo-600" />
                      Export Parameters
                    </h3>
                  </div>

                  {/* Format Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Output File Format</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/60 rounded-xl">
                      <button
                        onClick={() => setExportFormat('sql')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          exportFormat === 'sql'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        SQL DDL script
                      </button>
                      <button
                        onClick={() => setExportFormat('json')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          exportFormat === 'json'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Structured JSON
                      </button>
                    </div>
                  </div>

                  {exportFormat === 'sql' ? (
                    <>
                      {/* SQL Dialect selection */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Target Database Dialect</label>
                        <select
                          value={exportSqlDialect}
                          onChange={(e) => setExportSqlDialect(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium"
                        >
                          <option value="postgresql">PostgreSQL</option>
                          <option value="mysql">MySQL (InnoDB)</option>
                          <option value="sqlserver">Microsoft SQL Server</option>
                          <option value="oracle">Oracle Database</option>
                          <option value="snowflake">Snowflake (DWH)</option>
                          <option value="bigquery">Google BigQuery (SQL)</option>
                          <option value="custom">-- Custom Template Format --</option>
                        </select>
                      </div>

                      {/* SQL Namespace */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Schema Namespace (Prefix)</label>
                        <input
                          type="text"
                          value={exportSchemaNamespace}
                          onChange={(e) => setExportSchemaNamespace(e.target.value)}
                          placeholder="e.g. public or custom schema"
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-mono"
                        />
                      </div>

                      {/* Primary Key Constraints Policy */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Primary Key Mapping</label>
                        <select
                          value={exportPrimaryKeyPolicy}
                          onChange={(e) => setExportPrimaryKeyPolicy(e.target.value as 'inline' | 'constraint')}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium"
                        >
                          <option value="inline">Inline column constraints (PRIMARY KEY)</option>
                          <option value="constraint">Separate block constraint (CONSTRAINT pk_table)</option>
                        </select>
                      </div>

                      {/* Options Checkboxes */}
                      <div className="pt-2 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={exportIncludeDropTable}
                            onChange={(e) => setExportIncludeDropTable(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span>Include "DROP TABLE IF EXISTS" statement</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={exportIncludeComments}
                            onChange={(e) => setExportIncludeComments(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span>Generate comments / inline descriptions</span>
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* JSON Schema specific type */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">JSON Output Pattern</label>
                        <select
                          value={exportJsonType}
                          onChange={(e) => setExportJsonType(e.target.value as 'raw' | 'openapi' | 'bigquery_json')}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium"
                        >
                          <option value="raw">Enterprise Schema Registry format (Raw JSON)</option>
                          <option value="openapi">OpenAPI 3.0 Component Schema</option>
                          <option value="bigquery_json">BigQuery JSON Schema (Array structure)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Column Name Casing Strategy */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Identifier Normalization (Casing)</label>
                    <select
                      value={exportColumnCasing}
                      onChange={(e) => setExportColumnCasing(e.target.value as any)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium"
                    >
                      <option value="original">Original System Casing (Unchanged)</option>
                      <option value="snake">snake_case (Recommended for PostgreSQL)</option>
                      <option value="upper_snake">UPPER_SNAKE_CASE (Recommended for Snowflake/Oracle)</option>
                      <option value="camel">camelCase (Recommended for MongoDB/JSON APIs)</option>
                    </select>
                  </div>
                </div>

                {/* Custom Templates Options Panel */}
                {exportFormat === 'sql' && exportSqlDialect === 'custom' && (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-amber-600" />
                        Custom Dialect Templates
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Table DDL Structure Template</label>
                        <textarea
                          rows={4}
                          value={customTableTemplate}
                          onChange={(e) => setCustomTableTemplate(e.target.value)}
                          className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2"
                        />
                        <span className="text-[10px] text-slate-400 block">
                          Placeholders: <code className="bg-slate-200 px-1 rounded">{"{{schema}}"}</code>, <code className="bg-slate-200 px-1 rounded">{"{{tableName}}"}</code>, <code className="bg-slate-200 px-1 rounded">{"{{columnDefinitions}}"}</code>
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Column Definition Template</label>
                        <textarea
                          rows={3}
                          value={customColumnTemplate}
                          onChange={(e) => setCustomColumnTemplate(e.target.value)}
                          className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2"
                        />
                        <span className="text-[10px] text-slate-400 block">
                          Placeholders: <code className="bg-slate-200 px-1 rounded">{"{{fieldName}}"}</code>, <code className="bg-slate-200 px-1 rounded">{"{{dataType}}"}</code>, <code className="bg-slate-200 px-1 rounded">{"{{constraints}}"}</code>, <code className="bg-slate-200 px-1 rounded">{"{{descriptionComment}}"}</code>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Tip */}
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex gap-3 text-xs text-indigo-900">
                  <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Bulk Download Zip</p>
                    <p className="text-indigo-700 leading-normal">
                      Downloading as ZIP compiles individual files for each selected schema, matching your targeted dialect datatypes and naming policies seamlessly!
                    </p>
                  </div>
                </div>

              </div>

              {/* Right Column: Schema List Selector & Code Live Preview */}
              <div className="w-full lg:w-7/12 space-y-6">
                
                {/* Schema Selection Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Select Schemas ({selectedExportSystemIds.length} / {registryItems.length})
                      </h3>
                    </div>

                    {/* Search filter inside Export */}
                    <div className="relative max-w-xs w-full">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search schemas..."
                        value={exportSearchQuery}
                        onChange={(e) => setExportSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="p-1 max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold">
                          <th className="py-2.5 px-4 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={selectedExportSystemIds.length === registryItems.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedExportSystemIds(registryItems.map(s => s.id));
                                } else {
                                  setSelectedExportSystemIds([]);
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                          </th>
                          <th className="py-2.5 px-2">Schema Origin / System</th>
                          <th className="py-2.5 px-2">Target Table Name</th>
                          <th className="py-2.5 px-2">Target Version</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {registryItems
                          .filter(s => 
                            s.systemName.toLowerCase().includes(exportSearchQuery.toLowerCase()) ||
                            s.entityName.toLowerCase().includes(exportSearchQuery.toLowerCase())
                          )
                          .map((sys) => {
                            const isChecked = selectedExportSystemIds.includes(sys.id);
                            return (
                              <tr
                                key={sys.id}
                                className={`hover:bg-slate-50/80 transition-colors ${
                                  isChecked ? 'bg-indigo-50/20' : ''
                                }`}
                              >
                                <td className="py-3 px-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedExportSystemIds(prev => [...prev, sys.id]);
                                      } else {
                                        setSelectedExportSystemIds(prev => prev.filter(id => id !== sys.id));
                                      }
                                    }}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                </td>
                                <td className="py-3 px-2">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800">{sys.systemName}</span>
                                    <span className="text-[10px] text-slate-400">{sys.environment} &bull; {sys.versions.length} versions available</span>
                                  </div>
                                </td>
                                <td className="py-3 px-2">
                                  <input
                                    type="text"
                                    value={exportTableNames[sys.id] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setExportTableNames(prev => ({
                                        ...prev,
                                        [sys.id]: val
                                      }));
                                    }}
                                    placeholder={sys.entityName}
                                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded px-2 py-1 max-w-[160px] focus:border-indigo-400 focus:outline-hidden"
                                  />
                                </td>
                                <td className="py-3 px-2">
                                  <select
                                    value={exportSystemVersions[sys.id] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setExportSystemVersions(prev => ({
                                        ...prev,
                                        [sys.id]: val
                                      }));
                                    }}
                                    className="text-xs bg-white border border-slate-200 rounded px-1 py-1 font-mono focus:border-indigo-400 focus:outline-hidden"
                                  >
                                    {sys.versions.map(v => (
                                      <option key={v.versionId} value={v.versionId}>{v.versionId}</option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2.5 justify-end">
                    <button
                      onClick={handleDownloadCombinedFile}
                      disabled={selectedExportSystemIds.length === 0}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileCode className="w-4 h-4" />
                      <span>Download Combined File</span>
                    </button>
                    <button
                      onClick={handleDownloadZip}
                      disabled={selectedExportSystemIds.length === 0}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Bulk ZIP</span>
                    </button>
                  </div>
                </div>

                {/* Code Live Preview Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                  <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider pl-2 border-l border-slate-800">
                        Active Generation Live Preview
                      </span>
                    </div>

                    {/* Preview Tabs */}
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 border border-slate-800 rounded-lg">
                      {selectedExportSystemIds.map((sysId) => {
                        const sys = registryItems.find(s => s.id === sysId);
                        if (!sys) return null;
                        const isActive = previewActiveSystemId === sysId;
                        return (
                          <button
                            key={sysId}
                            onClick={() => setPreviewActiveSystemId(sysId)}
                            className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {sys.entityName}
                          </button>
                        );
                      })}
                      {selectedExportSystemIds.length === 0 && (
                        <span className="text-[10px] text-slate-500 px-2 py-1">No schemas selected</span>
                      )}
                    </div>
                  </div>

                  {selectedExportSystemIds.length > 0 && registryItems.find(s => s.id === previewActiveSystemId) ? (
                    (() => {
                      const sys = registryItems.find(s => s.id === previewActiveSystemId)!;
                      const verId = exportSystemVersions[sys.id] || sys.versions[0].versionId;
                      const customTableName = exportTableNames[sys.id] || sys.entityName;
                      const previewContent = exportFormat === 'sql'
                        ? generateSqlDdlForSystem(sys, verId, customTableName)
                        : generateJsonForSystem(sys, verId, customTableName);

                      return (
                        <div className="relative">
                          {/* Copy code overlay */}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(previewContent);
                              showToast(`Copied ${sys.entityName} preview code to clipboard!`);
                            }}
                            className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                          >
                            <FileCode className="w-3.5 h-3.5" />
                            <span>Copy Preview</span>
                          </button>

                          <pre className="p-5 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-[380px] leading-relaxed">
                            {previewContent}
                          </pre>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-12 text-center text-slate-500 text-xs italic">
                      Select one or more schemas above to render interactive code preview
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 7: SQL DDL EDITOR */}
        {activeTab === 'ddl-editor' && (
          <div className="p-6 space-y-6 animate-in fade-in duration-200">
            {/* Header info banner */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
              <div className="space-y-1.5 max-w-2xl">
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold rounded-full flex items-center gap-1 w-fit uppercase">
                  <Database className="w-3.5 h-3.5 text-amber-300" />
                  SQL DDL Compiler & Schema Builder
                </span>
                <h3 className="text-base font-bold text-white">Interactive DDL Schema Designer</h3>
                <p className="text-xs text-slate-300 font-sans">
                  Design custom tables and structures dynamically or write direct raw statements. Generates safe, dialect-optimized column configurations with live preview updates.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  onClick={() => {
                    loadActiveSchemaToDdlEditor(selectedSystem);
                    showToast('Reset schema editor parameters to registry baseline.');
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset to Baseline Schema</span>
                </button>
              </div>
            </div>

            {/* Main designer layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Left Side: Builder Interface or Manual Text Input */}
              <div className="w-full lg:w-6/12 space-y-6">
                
                {/* Control Panel: Mode Toggles */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-indigo-600" />
                      Designer Input Mode
                    </h3>
                    
                    {/* Mode selector */}
                    <div className="bg-slate-200 p-0.5 rounded-lg flex gap-1 border border-slate-300">
                      <button
                        onClick={() => handleToggleEditorMode('builder')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                          ddlEditorMode === 'builder'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Visual Builder
                      </button>
                      <button
                        onClick={() => handleToggleEditorMode('manual')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                          ddlEditorMode === 'manual'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Manual Editor
                      </button>
                    </div>
                  </div>

                  {ddlEditorMode === 'builder' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-slate-700 font-bold block">Target Namespace / Schema</label>
                        <input
                          type="text"
                          value={ddlNamespace}
                          onChange={(e) => setDdlNamespace(e.target.value)}
                          placeholder="e.g. public"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-indigo-500 font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-700 font-bold block">Table Identifier Name</label>
                        <input
                          type="text"
                          value={ddlTableName}
                          onChange={(e) => setDdlTableName(e.target.value)}
                          placeholder="e.g. customers"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-indigo-500 font-mono text-xs font-bold"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 leading-normal font-sans">
                      Manual Editor allows you to write custom SQL statements directly. Direct structural compiler updates will be suspended until you return to Visual Builder.
                    </p>
                  )}
                </div>

                {/* Main panel content */}
                {ddlEditorMode === 'builder' ? (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs space-y-4">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Design Columns / Attributes ({ddlFields.length} Columns)
                      </span>

                      {/* Column Search filter */}
                      <div className="relative max-w-xs w-full sm:w-48">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search column..."
                          value={ddlSearch}
                          onChange={(e) => setDdlSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-indigo-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="p-1 max-h-[500px] overflow-y-auto scrollbar-thin">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                            <th className="py-2.5 px-3">Column Name</th>
                            <th className="py-2.5 px-3">DataType</th>
                            <th className="py-2.5 px-3 text-center">PK</th>
                            <th className="py-2.5 px-3 text-center">Null</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3 text-center">Remove</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {ddlFields
                            .filter(f => f.fieldName.toLowerCase().includes(ddlSearch.toLowerCase()))
                            .map((field, idx) => {
                              const originalIdx = ddlFields.findIndex(f => f.fieldName === field.fieldName);
                              return (
                                <tr key={`${field.fieldName}-${originalIdx}`} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-2 px-2">
                                    <input
                                      type="text"
                                      value={field.fieldName}
                                      onChange={(e) => handleDdlUpdateField(originalIdx, 'fieldName', e.target.value)}
                                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-indigo-400 focus:outline-hidden"
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <select
                                      value={field.dataType}
                                      onChange={(e) => handleDdlUpdateField(originalIdx, 'dataType', e.target.value)}
                                      className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-indigo-900 focus:bg-white focus:outline-hidden cursor-pointer"
                                    >
                                      <option value="VARCHAR(255)">VARCHAR(255)</option>
                                      <option value="VARCHAR(50)">VARCHAR(50)</option>
                                      <option value="TEXT">TEXT</option>
                                      <option value="INTEGER">INTEGER</option>
                                      <option value="BIGINT">BIGINT</option>
                                      <option value="DECIMAL(10,2)">DECIMAL(10,2)</option>
                                      <option value="BOOLEAN">BOOLEAN</option>
                                      <option value="TIMESTAMP">TIMESTAMP</option>
                                      <option value="DATE">DATE</option>
                                      <option value="UUID">UUID</option>
                                    </select>
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={field.isPrimaryKey}
                                      onChange={(e) => handleDdlUpdateField(originalIdx, 'isPrimaryKey', e.target.checked)}
                                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={field.isNullable}
                                      onChange={(e) => handleDdlUpdateField(originalIdx, 'isNullable', e.target.checked)}
                                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input
                                      type="text"
                                      value={field.description || ''}
                                      onChange={(e) => handleDdlUpdateField(originalIdx, 'description', e.target.value)}
                                      placeholder="Comment..."
                                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:bg-white focus:border-indigo-400 focus:outline-hidden placeholder:italic"
                                    />
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <button
                                      onClick={() => handleDdlDeleteField(originalIdx)}
                                      className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                      title="Delete column"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          {ddlFields.filter(f => f.fieldName.toLowerCase().includes(ddlSearch.toLowerCase())).length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 italic font-sans">
                                No columns matching the search query.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Column button */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-start">
                      <button
                        onClick={handleDdlAddField}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                      >
                        <Plus className="w-4 h-4 text-amber-300" />
                        <span>Add New Column</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Manual DDL Text Area */
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                    <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      <span>Interactive SQL Scratchpad</span>
                      <span className="text-[10px] text-amber-400 font-bold">Manual Override Active</span>
                    </div>
                    <textarea
                      rows={16}
                      value={manualDdlCode}
                      onChange={(e) => setManualDdlCode(e.target.value)}
                      className="p-5 w-full bg-slate-950 text-emerald-400 font-mono text-[12px] leading-relaxed focus:outline-hidden focus:ring-0 border-0 resize-none h-[420px]"
                      placeholder="-- Type or edit raw SQL DDL script directly here..."
                    />
                  </div>
                )}
              </div>

              {/* Right Side: Active SQL Preview & Configuration */}
              <div className="w-full lg:w-6/12 space-y-6">
                
                {/* Visual Export Configuration Panel */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-3 font-sans">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    DDL Compiler Parameters
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Dialect */}
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-bold block">Target SQL Dialect</label>
                      <select
                        value={ddlDialect}
                        onChange={(e) => setDdlDialect(e.target.value)}
                        disabled={ddlEditorMode === 'manual'}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="postgresql">PostgreSQL (Standard)</option>
                        <option value="mysql">MySQL (InnoDB)</option>
                        <option value="sqlserver">MS SQL Server</option>
                        <option value="oracle">Oracle PL/SQL</option>
                        <option value="bigquery">Google BigQuery</option>
                        <option value="sqlite">SQLite</option>
                      </select>
                    </div>

                    {/* Column Casing */}
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-bold block">Naming Convention / Casing</label>
                      <select
                        value={ddlCasing}
                        onChange={(e: any) => setDdlCasing(e.target.value)}
                        disabled={ddlEditorMode === 'manual'}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="original">Preserve Original (Registry Default)</option>
                        <option value="snake">snake_case (Standard)</option>
                        <option value="upper_snake">UPPER_SNAKE_CASE (Enterprise)</option>
                        <option value="camel">camelCase (App Objects)</option>
                      </select>
                    </div>

                    {/* Primary Key Policy */}
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-bold block">Primary Key Policy</label>
                      <select
                        value={ddlPkPolicy}
                        onChange={(e: any) => setDdlPkPolicy(e.target.value)}
                        disabled={ddlEditorMode === 'manual'}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="inline">Inline column constraints (PK)</option>
                        <option value="constraint">Standard separate table CONSTRAINT</option>
                      </select>
                    </div>

                    {/* Configuration Toggles */}
                    <div className="space-y-2 pt-2 font-sans">
                      <label className="flex items-center gap-2 text-slate-700 font-bold cursor-pointer disabled:opacity-50">
                        <input
                          type="checkbox"
                          checked={ddlIncludeComments}
                          disabled={ddlEditorMode === 'manual'}
                          onChange={(e) => setDdlIncludeComments(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        />
                        <span>Embed columns description comments</span>
                      </label>

                      <label className="flex items-center gap-2 text-slate-700 font-bold cursor-pointer disabled:opacity-50">
                        <input
                          type="checkbox"
                          checked={ddlIncludeDrop}
                          disabled={ddlEditorMode === 'manual'}
                          onChange={(e) => setDdlIncludeDrop(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        />
                        <span>Prepend DROP TABLE statement</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* SQL Live Preview Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                  <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider pl-2 border-l border-slate-800">
                        Live DDL Preview
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-sans">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generateDdlFromEditorState());
                          showToast('DDL preview copied to clipboard!');
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Copy DDL code to clipboard"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copy DDL</span>
                      </button>

                      <button
                        onClick={handleDownloadDdlFile}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        title="Download DDL script file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Script</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="p-5 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-[400px] min-h-[300px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                      {generateDdlFromEditorState()}
                    </pre>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}
      </div>

      {/* REGISTER / PUBLISH NEW SCHEMA VERSION MODAL */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Plus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Register New Schema Version
                  </h3>
                  <p className="text-xs text-slate-500">
                    Publish a new version for <strong className="font-mono text-indigo-600">{selectedSystem.systemName}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishNewVersion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Version Tag</label>
                  <input
                    type="text"
                    required
                    value={newVersionTag}
                    onChange={(e) => setNewVersionTag(e.target.value)}
                    placeholder="e.g. v2.5.0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Author / Engineer</label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Migration Job Reference</label>
                <input
                  type="text"
                  value={newMigrationJobRef}
                  onChange={(e) => setNewMigrationJobRef(e.target.value)}
                  placeholder="JOB-2026-DELTA-P2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Commit / Version Changelog Notes</label>
                <textarea
                  rows={2}
                  required
                  value={newCommitMessage}
                  onChange={(e) => setNewCommitMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 uppercase block">
                  Add Sample Extended Field
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 text-[10px] block">Field Name</label>
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 text-[10px] block">Data Type</label>
                    <input
                      type="text"
                      value={newFieldDataType}
                      onChange={(e) => setNewFieldDataType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Publish Version to Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFLICT RESOLUTION MODAL */}
      {isConflictModalOpen && conflictContext && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto scrollbar-thin text-xs">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl border border-amber-200">
                  <ShieldAlert className="w-6 h-6 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Schema Version Conflict & Mismatch Resolver
                    </h3>
                    <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-[10px] font-bold font-mono">
                      CONFLICT DETECTED
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    System: <strong className="font-mono text-indigo-700">{selectedSystem.systemName}</strong> &bull; Version Tag: <strong className="font-mono text-slate-800">{conflictContext.conflictingVersionTag}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsConflictModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conflict Reason Banner */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{conflictContext.reason}</span>
              </div>
              <p className="text-[11px] text-amber-800/90 pl-6">
                The incoming source schema definition contains breaking column alterations or tag collisions compared to the registry baseline. Select a resolution strategy below to proceed.
              </p>
            </div>

            {/* Conflicting Fields Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Conflicting Schema Fields ({conflictContext.breakingFields.length})
              </span>
              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2 px-3">Field Name</th>
                      <th className="py-2 px-3">Mismatch Type</th>
                      <th className="py-2 px-3">Impact Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {conflictContext.breakingFields.map((f, i) => (
                      <tr key={i} className="hover:bg-amber-50/50">
                        <td className="py-2 px-3 font-bold text-slate-900">{f.fieldName}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-[10px] font-bold">
                            {f.changeType}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{f.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Strategy Selection Cards */}
            <div className="space-y-2.5 text-xs">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Select Conflict Resolution Strategy
              </label>

              {/* Strategy 1: Override */}
              <div
                onClick={() => setConflictStrategy('override')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  conflictStrategy === 'override'
                    ? 'bg-rose-50/60 border-rose-400 ring-2 ring-rose-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="strategy"
                      checked={conflictStrategy === 'override'}
                      onChange={() => setConflictStrategy('override')}
                      className="text-rose-600 focus:ring-rose-500 h-4 w-4 text-xs"
                    />
                    <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                      <RefreshCw className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span>Override Strategy</span>
                        <span className="px-2 py-0.2 bg-rose-100 text-rose-800 border border-rose-200 rounded text-[9px] font-mono font-bold">
                          DESTRUCTIVE / FORCE
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Force overwrite existing schema version directly in the registry with force flag.
                      </p>
                    </div>
                  </div>
                </div>

                {conflictStrategy === 'override' && (
                  <div className="mt-2 pt-2 border-t border-rose-200/60 pl-8 space-y-2 text-xs">
                    <p className="text-[11px] text-rose-800 font-medium">
                      ⚠️ Warning: This will replace column types and field constraints in version <strong className="font-mono">{conflictContext.conflictingVersionTag}</strong>.
                    </p>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overrideConfirmed}
                        onChange={(e) => setOverrideConfirmed(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                      />
                      <span>I confirm force override of existing schema metadata</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Strategy 2: Patch */}
              <div
                onClick={() => setConflictStrategy('patch')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 text-xs ${
                  conflictStrategy === 'patch'
                    ? 'bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="strategy"
                      checked={conflictStrategy === 'patch'}
                      onChange={() => setConflictStrategy('patch')}
                      className="text-indigo-600 focus:ring-indigo-500 h-4 w-4 text-xs"
                    />
                    <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                      <Wrench className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span>Patch Strategy</span>
                        <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[9px] font-mono font-bold">
                          RECOMMENDED / SAFE
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Publish a non-breaking semantic patch version. Retains legacy fields with backward-compatible default values.
                      </p>
                    </div>
                  </div>
                </div>

                {conflictStrategy === 'patch' && (
                  <div className="mt-2 pt-2 border-t border-indigo-200/60 pl-8 space-y-1.5 text-xs">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Semantic Patch Version Tag:
                    </label>
                    <input
                      type="text"
                      value={customPatchTag}
                      onChange={(e) => setCustomPatchTag(e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-indigo-900 font-bold focus:outline-hidden focus:border-indigo-500 w-full max-w-sm"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Creates a new version release without breaking downstream consumers.
                    </span>
                  </div>
                )}
              </div>

              {/* Strategy 3: Fork */}
              <div
                onClick={() => setConflictStrategy('fork')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 text-xs ${
                  conflictStrategy === 'fork'
                    ? 'bg-purple-50/60 border-purple-400 ring-2 ring-purple-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="strategy"
                      checked={conflictStrategy === 'fork'}
                      onChange={() => setConflictStrategy('fork')}
                      className="text-purple-600 focus:ring-purple-500 h-4 w-4 text-xs"
                    />
                    <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                      <GitFork className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span>Fork Strategy</span>
                        <span className="px-2 py-0.2 bg-purple-100 text-purple-800 border border-purple-200 rounded text-[9px] font-mono font-bold">
                          ISOLATED SYSTEM BRANCH
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Branch the schema into an isolated parallel system variant. Leaves original baseline untouched.
                      </p>
                    </div>
                  </div>
                </div>

                {conflictStrategy === 'fork' && (
                  <div className="mt-2 pt-2 border-t border-purple-200/60 pl-8 space-y-1.5 text-xs">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Forked System Name:
                    </label>
                    <input
                      type="text"
                      value={customForkName}
                      onChange={(e) => setCustomForkName(e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-purple-950 font-bold focus:outline-hidden focus:border-purple-500 w-full"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Will create a dedicated isolated schema registry entry.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsConflictModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyConflictStrategy}
                disabled={conflictStrategy === 'override' && !overrideConfirmed}
                className={`px-5 py-2 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                  conflictStrategy === 'override'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50'
                    : conflictStrategy === 'patch'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  Apply {conflictStrategy.toUpperCase()} Strategy
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CDM EXTENSION ADD ATTRIBUTE MODAL */}
      {isAddingCdmAttr && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Plus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Add Canonical Schema Extension Attribute
                  </h3>
                  <p className="text-xs text-slate-500">
                    Register custom entity extension properties for <strong className="font-mono text-purple-600">{selectedCdmEntity.displayName}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddingCdmAttr(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCdmAttribute} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Attribute Tech Name</label>
                  <input
                    type="text"
                    required
                    value={newCdmAttrName}
                    onChange={(e) => setNewCdmAttrName(e.target.value)}
                    placeholder="e.g. PARTNER_COMPANY_CODE"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs focus:outline-hidden focus:border-purple-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Display Label</label>
                  <input
                    type="text"
                    required
                    value={newCdmAttrDisplayName}
                    onChange={(e) => setNewCdmAttrDisplayName(e.target.value)}
                    placeholder="e.g. Partner Company Code"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-purple-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Data Type</label>
                  <select
                    value={newCdmAttrDataType}
                    onChange={(e: any) => setNewCdmAttrDataType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-purple-500 text-slate-800"
                  >
                    <option value="String">String</option>
                    <option value="Integer">Integer</option>
                    <option value="Decimal">Decimal</option>
                    <option value="Boolean">Boolean</option>
                    <option value="Date">Date</option>
                    <option value="DateTime">DateTime</option>
                    <option value="Enum">Enum</option>
                    <option value="Lookup">Lookup Relationship</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={newCdmAttrRequired}
                      onChange={(e) => setNewCdmAttrRequired(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                    />
                    <span>Is Required (Mandatory attribute)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Extension Description / Guideline</label>
                <textarea
                  rows={2}
                  required
                  value={newCdmAttrDesc}
                  onChange={(e) => setNewCdmAttrDesc(e.target.value)}
                  placeholder="Enterprise specific metadata documentation guideline..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-purple-500 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCdmAttr(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Publish Custom Extension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
