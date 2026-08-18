import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MigrationJob } from '../types';
import { MOCK_MIGRATION_JOBS } from '../data/mockData';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType,
  Node,
  Edge,
  Connection,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Workflow,
  Plus,
  Play,
  RotateCcw,
  Save,
  Download,
  Upload,
  Database,
  ArrowRight,
  ShieldCheck,
  Filter,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Settings,
  Trash2,
  Copy,
  Info,
  Sparkles,
  Sliders,
  FileCode,
  HardDrive,
  RefreshCw,
  Search,
  Pause,
  Terminal,
  Check,
  X,
  LayoutGrid,
  List,
  CalendarDays,
  Clock,
  GitFork,
  GitBranch,
  ShieldAlert,
  Network,
  ExternalLink,
  Activity,
  ChevronRight,
  AlertCircle,
  Eye,
  Share2,
} from 'lucide-react';

import { ChronologicalWorkflowTimeline } from './ChronologicalWorkflowTimeline';
import { BatchSchedulerStudio } from './BatchSchedulerStudio';

// Impact Analysis Interfaces
export interface MappingRuleImpact {
  system: string;
  process: string;
  field: string;
  riskDescription: string;
}

export interface MappingRule {
  id: string;
  ruleName: string;
  sourceField: string;
  targetField: string;
  transformationType: string;
  expression?: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  downstreamImpacts: MappingRuleImpact[];
}

export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  category: 'source' | 'transform' | 'validation' | 'cleansing' | 'sink';
  system: string;
  recordsCount?: number;
  status: 'idle' | 'running' | 'success' | 'error' | 'warning';
  config?: Record<string, any>;
  iconType?: string;
  description?: string;
  errorRate?: number;
  mappingRules?: MappingRule[];
  isImpacted?: boolean;
  impactLevel?: 'Critical' | 'High' | 'Medium' | 'Low';
  impactReason?: string;
  isImpactSource?: boolean;
}

export interface ImpactAnalysisResult {
  impactedNodeIds: Set<string>;
  impactedEdgeIds: Set<string>;
  affectedSystems: Array<{ name: string; category: string; description: string; risk: string }>;
  affectedProcesses: Array<{ name: string; ownerNode: string; riskLevel: string; detail: string }>;
  affectedFields: Array<{ sourceField: string; targetField: string; downstreamConsumer: string; issue: string }>;
  nodeImpactDetails: Record<string, { riskLevel: 'Critical' | 'High' | 'Medium' | 'Low'; reason: string }>;
  overallRiskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  totalImpactedCount: number;
}

export function computeDownstreamImpact(
  sourceNodeId: string | null,
  selectedRuleId: string | null,
  nodes: Node<CustomNodeData>[],
  edges: Edge[]
): ImpactAnalysisResult | null {
  if (!sourceNodeId) return null;

  const impactedNodeIds = new Set<string>();
  const impactedEdgeIds = new Set<string>();
  const nodeImpactDetails: Record<string, { riskLevel: 'Critical' | 'High' | 'Medium' | 'Low'; reason: string }> = {};

  const sourceNode = nodes.find((n) => n.id === sourceNodeId);
  const rules = sourceNode?.data.mappingRules || [];
  const targetRule = selectedRuleId ? rules.find((r) => r.id === selectedRuleId) : rules[0];

  const queue: string[] = [sourceNodeId];
  const visited = new Set<string>([sourceNodeId]);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const outgoing = edges.filter((e) => e.source === currentId);
    for (const edge of outgoing) {
      impactedEdgeIds.add(edge.id);
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        impactedNodeIds.add(edge.target);
        queue.push(edge.target);

        const targetNode = nodes.find((n) => n.id === edge.target);
        if (targetNode) {
          const cat = targetNode.data.category;
          let riskLevel: 'Critical' | 'High' | 'Medium' | 'Low' = targetRule?.riskLevel || 'High';
          let reason = `Mapping rule '${targetRule?.ruleName || 'Schema Rule'}' modification cascades downstream to ${targetNode.data.label}.`;

          if (cat === 'sink') {
            reason = `Critical Target Sink: Modification affects ingest schema & live data commits in ${targetNode.data.system}.`;
          } else if (cat === 'validation') {
            reason = `Validation Node: Changing mapping rule triggers potential rule mismatch or false positive rejections.`;
          } else if (cat === 'transform') {
            reason = `Transformation Pipeline: Field mapping change cascades into OData payload structural layout.`;
          } else if (cat === 'cleansing') {
            reason = `Data Cleansing Engine: Anonymization regex or mask adjustment impacts sanitization accuracy.`;
          }

          nodeImpactDetails[targetNode.id] = { riskLevel, reason };
        }
      }
    }
  }

  const affectedSystemsSet = new Map<string, { name: string; category: string; description: string; risk: string }>();
  const affectedProcessesList: Array<{ name: string; ownerNode: string; riskLevel: string; detail: string }> = [];
  const affectedFieldsList: Array<{ sourceField: string; targetField: string; downstreamConsumer: string; issue: string }> = [];

  if (targetRule && targetRule.downstreamImpacts) {
    targetRule.downstreamImpacts.forEach((imp) => {
      affectedSystemsSet.set(imp.system, {
        name: imp.system,
        category: 'Enterprise System',
        description: `Direct downstream consumer of field '${imp.field}'`,
        risk: targetRule.riskLevel,
      });

      affectedProcessesList.push({
        name: imp.process,
        ownerNode: sourceNode?.data.label || 'Workflow Node',
        riskLevel: targetRule.riskLevel,
        detail: imp.riskDescription,
      });

      affectedFieldsList.push({
        sourceField: targetRule.sourceField,
        targetField: targetRule.targetField,
        downstreamConsumer: imp.system,
        issue: imp.riskDescription,
      });
    });
  }

  impactedNodeIds.forEach((nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      if (!affectedSystemsSet.has(node.data.system)) {
        affectedSystemsSet.set(node.data.system, {
          name: node.data.system,
          category: node.data.category.toUpperCase(),
          description: node.data.description || 'Connected DAG Pipeline Node',
          risk: nodeImpactDetails[nodeId]?.riskLevel || 'High',
        });
      }

      affectedProcessesList.push({
        name: `${node.data.label} Processing Stream`,
        ownerNode: node.data.label,
        riskLevel: nodeImpactDetails[nodeId]?.riskLevel || 'Medium',
        detail: nodeImpactDetails[nodeId]?.reason || 'Propagated downstream mapping update.',
      });
    }
  });

  return {
    impactedNodeIds,
    impactedEdgeIds,
    affectedSystems: Array.from(affectedSystemsSet.values()),
    affectedProcesses: affectedProcessesList,
    affectedFields: affectedFieldsList,
    nodeImpactDetails,
    overallRiskLevel: targetRule?.riskLevel || 'High',
    totalImpactedCount: impactedNodeIds.size,
  };
}

// Custom Node Component
const PipelineNode: React.FC<{ data: CustomNodeData; selected?: boolean }> = ({ data, selected }) => {
  const getCategoryStyles = () => {
    switch (data.category) {
      case 'source':
        return {
          bg: 'bg-white border-indigo-200',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          accent: 'from-indigo-600 to-blue-600',
        };
      case 'transform':
        return {
          bg: 'bg-white border-purple-200',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          accent: 'from-purple-600 to-pink-600',
        };
      case 'validation':
        return {
          bg: 'bg-white border-amber-200',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          accent: 'from-amber-600 to-orange-600',
        };
      case 'cleansing':
        return {
          bg: 'bg-white border-cyan-200',
          badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          accent: 'from-cyan-600 to-teal-600',
        };
      case 'sink':
        return {
          bg: 'bg-white border-emerald-200',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          accent: 'from-emerald-600 to-green-600',
        };
      default:
        return {
          bg: 'bg-white border-slate-200',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          accent: 'from-slate-700 to-slate-800',
        };
    }
  };

  const style = getCategoryStyles();

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25,
        mass: 1
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`relative min-w-[220px] max-w-[260px] rounded-xl border p-3 shadow-lg transition-all duration-300 text-slate-700 ${
        style.bg
      } ${
        data.isImpactSource
          ? 'ring-4 ring-indigo-500 border-indigo-500 shadow-indigo-200/80 scale-[1.04]'
          : data.isImpacted
          ? 'ring-4 ring-rose-500/80 border-rose-500 shadow-rose-200/80 scale-[1.02] bg-rose-50/30'
          : selected
          ? 'ring-2 ring-indigo-500 shadow-indigo-100 scale-[1.02]'
          : 'hover:border-slate-300'
      }`}
    >
      {/* Target Connection Handle (Left) */}
      {data.category !== 'source' && (
        <Handle
          type="target"
          position={Position.Left}
          className={`w-3.5 h-3.5 !border-2 !border-white hover:scale-125 transition-transform ${
            data.isImpacted ? '!bg-rose-600' : '!bg-indigo-600'
          }`}
        />
      )}

      {/* Header Accent Bar */}
      <div className={`h-1 w-full rounded-t-xl bg-gradient-to-r ${style.accent} -mt-3 -mx-3 mb-2.5`} />

      {/* Node Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${style.badge}`}>
            {data.category}
          </span>
          <h4 className="font-bold text-xs text-slate-900 mt-1.5 flex items-center gap-1.5">
            {data.label}
          </h4>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{data.system}</p>
        </div>

        {/* Status Indicator */}
        <div className="shrink-0">
          {data.status === 'running' && (
            <div className="flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Syncing</span>
            </div>
          )}
          {data.status === 'success' && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              <span>OK</span>
            </div>
          )}
          {data.status === 'error' && (
            <div className="flex items-center gap-1 text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              <XCircle className="w-3 h-3" />
              <span>Failed</span>
            </div>
          )}
          {data.status === 'idle' && (
            <span className="w-2 h-2 rounded-full bg-slate-200 block" title="Idle Node" />
          )}
        </div>
      </div>

      {/* Impact Badges */}
      {data.isImpactSource && (
        <div className="mt-2 bg-indigo-600 text-white rounded-lg p-1.5 text-[9px] font-bold flex items-center justify-between gap-1 shadow-xs animate-pulse">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-300 shrink-0" />
            <span>Rule Edit Origin</span>
          </span>
          <span className="bg-indigo-800 px-1.5 py-0.2 rounded font-mono text-[8px]">
            {data.mappingRules?.length || 0} Rules
          </span>
        </div>
      )}

      {data.isImpacted && (
        <div className="mt-2 bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-300 text-rose-900 rounded-lg p-1.5 text-[9px] font-bold space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-rose-700">
              <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0 animate-bounce" />
              <span>Downstream Impact</span>
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[8px] uppercase font-black ${
                data.impactLevel === 'Critical'
                  ? 'bg-rose-600 text-white'
                  : data.impactLevel === 'High'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-white'
              }`}
            >
              {data.impactLevel || 'High'}
            </span>
          </div>
          {data.impactReason && (
            <p className="text-[8.5px] font-mono text-slate-600 line-clamp-2 leading-tight">
              {data.impactReason}
            </p>
          )}
        </div>
      )}

      {/* Description / Metrics */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>Records:</span>
        <strong className="text-slate-900">
          {data.recordsCount ? data.recordsCount.toLocaleString() : '0'}
        </strong>
      </div>

      {/* Progress Bar Overlay */}
      {data.recordsCount !== undefined && data.recordsCount > 0 && (
        <div className="mt-2 space-y-1">
          <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden border border-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                data.status === 'success'
                  ? 'bg-indigo-600'
                  : data.status === 'running'
                  ? 'bg-amber-500 animate-pulse'
                  : data.status === 'error'
                  ? 'bg-rose-500'
                  : 'bg-slate-200'
              }`}
              style={{ width: `${Math.min(100, (data.recordsCount / 250000) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>Progress:</span>
            <span className="text-slate-700 font-bold">{Math.min(100, Math.round((data.recordsCount / 250000) * 100))}%</span>
          </div>
        </div>
      )}

      {data.errorRate !== undefined && data.errorRate > 0 && (
        <div className="mt-1 flex items-center justify-between text-[10px] text-rose-600 font-mono">
          <span>Error Rate:</span>
          <strong>{(data.errorRate * 100).toFixed(1)}%</strong>
        </div>
      )}

      {/* Source Connection Handle (Right) */}
      {data.category !== 'sink' && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3.5 h-3.5 !bg-indigo-600 !border-2 !border-white hover:scale-125 transition-transform"
        />
      )}
    </motion.div>
  );
};

const nodeTypes = {
  pipelineNode: PipelineNode,
};

// Initial Preset Workflow Blueprint
const initialNodes: Node<CustomNodeData>[] = [
  {
    id: 'node-1',
    type: 'pipelineNode',
    position: { x: 50, y: 150 },
    data: {
      label: 'SAP ECC 6.0 Extractor',
      category: 'source',
      system: 'KNA1 & VBRK Tables',
      recordsCount: 250000,
      status: 'success',
      config: { batchSize: 5000, parallelThreads: 4, auth: 'RFC / SAP NetWeaver' },
      description: 'Extract customer master and billing records directly from SAP ECC DB views.',
      mappingRules: [
        {
          id: 'rule-1-1',
          ruleName: 'Tax Registration Number Extraction',
          sourceField: 'KNA1.STCD1',
          targetField: 'TaxRegistrationNo',
          transformationType: 'Regex Clean & Format',
          expression: 'Regex.Replace(input, @"[^A-Z0-9]", "")',
          riskLevel: 'High',
          downstreamImpacts: [
            {
              system: 'Tax ID Anonymizer',
              process: 'PII Scrubbing & VAT Sanitization',
              field: 'VatRegNo',
              riskDescription: 'Altering tax regex pattern may bypass PII scrubbing or fail EU VAT format validation.',
            },
            {
              system: 'OData Field Mapper',
              process: 'OData V4 Payload Transformation',
              field: 'VATRegistrationNo',
              riskDescription: 'Type format change triggers schema validation error during batch build.',
            },
            {
              system: 'Dynamics 365 BC Sink',
              process: 'Production Customer Ledger Creation',
              field: 'Tax_Registration_No',
              riskDescription: 'Invalid VAT format causes API HTTP 422 Unprocessable Entity response.',
            },
            {
              system: 'Power BI Analytics',
              process: 'Tax Compliance & VAT Audit Dashboard',
              field: 'Tax_ID_Hash',
              riskDescription: 'Hash mismatch invalidates historical tax compliance reporting.',
            },
          ],
        },
        {
          id: 'rule-1-2',
          ruleName: 'Customer Master ID Mapping',
          sourceField: 'KNA1.KUNNR',
          targetField: 'CustomerNo',
          transformationType: 'Zero-Pad 10 Digits',
          expression: "input.PadLeft(10, '0')",
          riskLevel: 'Critical',
          downstreamImpacts: [
            {
              system: 'Foreign Key Resolver',
              process: 'D365 Account Group Resolution',
              field: 'PostingAccountNo',
              riskDescription: 'Altering padding breaks FK lookup against General Ledger posting table.',
            },
            {
              system: 'OData Field Mapper',
              process: 'Customer Identity Aggregation',
              field: 'No',
              riskDescription: 'PrimaryKey mapping mismatch produces orphan customer records in payload.',
            },
            {
              system: 'Dynamics 365 BC Sink',
              process: 'Customer Account Creation',
              field: 'No',
              riskDescription: 'Duplicate primary key collision rejects incoming batch.',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'node-2',
    type: 'pipelineNode',
    position: { x: 340, y: 80 },
    data: {
      label: 'Foreign Key Resolver',
      category: 'validation',
      system: 'Validation Rule Engine',
      recordsCount: 248500,
      status: 'success',
      config: { fallbackPostingGroup: 'GEN-DOM', strictFKCheck: true },
      description: 'Validates and maps legacy SAP posting groups to Dynamics 365 Posting Accounts.',
      mappingRules: [
        {
          id: 'rule-2-1',
          ruleName: 'Posting Group Account Lookup',
          sourceField: 'KNA1.KDGRP',
          targetField: 'CustomerPostingGroup',
          transformationType: 'Dynamic Crosswalk Matrix',
          expression: 'CrosswalkTable.Lookup("SAP_KDGRP", input, default: "GEN-DOM")',
          riskLevel: 'High',
          downstreamImpacts: [
            {
              system: 'OData Field Mapper',
              process: 'Customer Financial Attributes Mapping',
              field: 'CustomerPostingGroup',
              riskDescription: 'Unmapped posting group causes fallback to default GEN-DOM account.',
            },
            {
              system: 'Dynamics 365 BC Sink',
              process: 'General Ledger Ingestion',
              field: 'Customer_Posting_Group',
              riskDescription: 'Invalid group blocks invoice posting in D365 GL subledger.',
            },
            {
              system: 'Financial Audit System',
              process: 'Revenue Classification Audit',
              field: 'GL_Account_Code',
              riskDescription: 'Incorrect GL account assignment misclassifies revenue entries.',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'node-3',
    type: 'pipelineNode',
    position: { x: 340, y: 240 },
    data: {
      label: 'Tax ID & Email Anonymizer',
      category: 'cleansing',
      system: 'PII Scrub Module',
      recordsCount: 250000,
      status: 'success',
      config: { maskTaxId: true, normalizeEmail: true },
      description: 'Scrubs sensitive PII fields and formats VAT registration numbers.',
      mappingRules: [
        {
          id: 'rule-3-1',
          ruleName: 'PII Email Hashing & Masking',
          sourceField: 'KNA1.SMTP_ADDR',
          targetField: 'EmailAnonymized',
          transformationType: 'SHA-256 HMAC Masking',
          expression: 'HMAC_SHA256(Lowercase(input), SecretKey)',
          riskLevel: 'Medium',
          downstreamImpacts: [
            {
              system: 'OData Field Mapper',
              process: 'Contact Detail Construction',
              field: 'E_Mail',
              riskDescription: 'Format modification may break email RFC 5322 validation regex.',
            },
            {
              system: 'Dynamics 365 BC Sink',
              process: 'Customer Contact Creation',
              field: 'E_Mail',
              riskDescription: 'Non-standard string format causes soft API warnings.',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'node-4',
    type: 'pipelineNode',
    position: { x: 640, y: 160 },
    data: {
      label: 'OData Field Mapper',
      category: 'transform',
      system: 'Business Central Schema',
      recordsCount: 248500,
      status: 'success',
      config: { targetEntity: 'Customer', autoCoerceTypes: true },
      description: 'Transforms source JSON attributes into Business Central OData V4 payload structures.',
      mappingRules: [
        {
          id: 'rule-4-1',
          ruleName: 'OData V4 Payload Type Coercion',
          sourceField: 'VBRK.NETWR',
          targetField: 'Amount_LCY',
          transformationType: 'Decimal Precision (18, 4)',
          expression: 'Convert.ToDecimal(input).Round(4)',
          riskLevel: 'Critical',
          downstreamImpacts: [
            {
              system: 'Dynamics 365 BC Sink',
              process: 'OData Batch Transaction Commit',
              field: 'Amount_LCY',
              riskDescription: 'Decimal truncation results in penny rounding discrepancies in financial ledger.',
            },
            {
              system: 'Snowflake Data Lake',
              process: 'Financial Reconciliation Pipeline',
              field: 'Invoice_Amount',
              riskDescription: 'Variance exceeds automated reconciliation threshold ($0.01 limit).',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'node-5',
    type: 'pipelineNode',
    position: { x: 940, y: 160 },
    data: {
      label: 'Dynamics 365 BC Sink',
      category: 'sink',
      system: 'OData Batch Ingestion',
      recordsCount: 248500,
      status: 'success',
      config: { batchIngestRate: 480, retryAttempts: 3 },
      description: 'Commits migrated records directly into Business Central Cloud tenant.',
      mappingRules: [
        {
          id: 'rule-5-1',
          ruleName: 'Target Entity Ingestion Guard',
          sourceField: 'Payload.Customer',
          targetField: 'OData_V4_Customer',
          transformationType: 'HTTP Batch POST Ingest',
          expression: 'ODataClient.PostBatchAsync(payload)',
          riskLevel: 'Critical',
          downstreamImpacts: [
            {
              system: 'Dynamics 365 Cloud ERP',
              process: 'Live Master Database Ingestion',
              field: 'Customer_Entity',
              riskDescription: 'Direct impact on live production ledger and customer accounting records.',
            },
          ],
        },
      ],
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: 'node-1',
    target: 'node-2',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
  },
  {
    id: 'e1-3',
    source: 'node-1',
    target: 'node-3',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
  },
  {
    id: 'e2-4',
    source: 'node-2',
    target: 'node-4',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
  },
  {
    id: 'e3-4',
    source: 'node-3',
    target: 'node-4',
    animated: true,
    style: { stroke: '#a855f7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
  },
  {
    id: 'e4-5',
    source: 'node-4',
    target: 'node-5',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
  },
];

// Available Node Palette Templates to Drag or Add
const NODE_PALETTE = [
  {
    label: 'Oracle EBS Extractor',
    category: 'source' as const,
    system: 'Oracle DB Connector',
    description: 'Extract GL journals and supplier tables from Oracle EBS v12.',
  },
  {
    label: 'Salesforce CRM Source',
    category: 'source' as const,
    system: 'REST / Bulk API 2.0',
    description: 'Pull Account, Contact, and Lead records from Salesforce Org.',
  },
  {
    label: 'Regex Validator',
    category: 'validation' as const,
    system: 'Validation Engine',
    description: 'Ensures tax IDs, emails, and phone numbers match international standards.',
  },
  {
    label: 'Duplicate Deduplicator',
    category: 'cleansing' as const,
    system: 'Fuzzy Matching Engine',
    description: 'Identifies and merges duplicate records using Levenshtein distance.',
  },
  {
    label: 'Currency & Unit Normalizer',
    category: 'transform' as const,
    system: 'Transformation Service',
    description: 'Converts legacy currency codes and metric/imperial measurement units.',
  },
  {
    label: 'Dead Letter Queue (DLQ)',
    category: 'cleansing' as const,
    system: 'Quarantine Storage',
    description: 'Routes invalid or rejected records to isolated JSON inspection storage.',
  },
  {
    label: 'Snowflake Data Lake Sink',
    category: 'sink' as const,
    system: 'Snowpipe Ingestion',
    description: 'Streams staging data into Snowflake analytical data warehouse.',
  },
  {
    label: 'SAP S/4HANA OData Sink',
    category: 'sink' as const,
    system: 'Business Partner API',
    description: 'Writes clean records into S/4HANA Cloud via core OData REST services.',
  },
];

const WORKFLOW_TEMPLATES = [
  {
    id: 'etl-standard',
    name: 'ETL Pipeline',
    description: 'Classic Extract-Transform-Load with data cleansing and schema mapping.',
    icon: Layers,
    nodes: [
      { label: 'Cloud Storage Source', category: 'source', system: 'AWS S3 / Azure Blob', x: 0, y: 100 },
      { label: 'Data Cleanser', category: 'cleansing', system: 'PII Scrub Engine', x: 300, y: 100 },
      { label: 'Schema Transformer', category: 'transform', system: 'OData Mapper', x: 600, y: 100 },
      { label: 'Data Warehouse Sink', category: 'sink', system: 'Snowflake / BigQuery', x: 900, y: 100 },
    ],
    edges: [
      { from: 0, to: 1, color: '#6366f1' },
      { from: 1, to: 2, color: '#a855f7' },
      { from: 2, to: 3, color: '#10b981' },
    ]
  },
  {
    id: 'data-sync',
    name: 'Master Data Sync',
    description: 'Bi-directional synchronization with intelligent conflict resolution.',
    icon: RefreshCw,
    nodes: [
      { label: 'CRM Source', category: 'source', system: 'Salesforce', x: 0, y: 0 },
      { label: 'ERP Source', category: 'source', system: 'SAP S/4HANA', x: 0, y: 200 },
      { label: 'Conflict Resolver', category: 'validation', system: 'Logic Engine', x: 300, y: 100 },
      { label: 'Unified Master Hub', category: 'sink', system: 'MDM Service', x: 650, y: 100 },
    ],
    edges: [
      { from: 0, to: 2, color: '#6366f1' },
      { from: 1, to: 2, color: '#6366f1' },
      { from: 2, to: 3, color: '#10b981' },
    ]
  },
  {
    id: 'db-migration',
    name: 'Database Migration',
    description: 'Direct legacy SQL to Cloud SQL migration with schema validation.',
    icon: Database,
    nodes: [
      { label: 'Legacy SQL Extractor', category: 'source', system: 'SQL Server 2008', x: 0, y: 100 },
      { label: 'Schema Validator', category: 'validation', system: 'Type Checker', x: 320, y: 100 },
      { label: 'Cloud SQL Sink', category: 'sink', system: 'PostgreSQL 15', x: 640, y: 100 },
    ],
    edges: [
      { from: 0, to: 1, color: '#6366f1' },
      { from: 1, to: 2, color: '#10b981' },
    ]
  }
];

interface MigrationWorkflowDesignerContentProps {
  jobs: MigrationJob[];
  setJobs: React.Dispatch<React.SetStateAction<MigrationJob[]>>;
}

export const MigrationWorkflowDesignerContent: React.FC<MigrationWorkflowDesignerContentProps> = ({ jobs, setJobs }) => {
  const [activeStudioSection, setActiveStudioSection] = useState<'all' | 'canvas' | 'scheduler' | 'timeline' | 'bulk'>('all');
  const [paletteTab, setPaletteTab] = useState<'nodes' | 'templates'>('nodes');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CustomNodeData>>(initialNodes as Node<CustomNodeData>[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-1');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1000);
  const [paletteSearch, setPaletteSearch] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [showMiniMap, setShowMiniMap] = useState<boolean>(true);

  // Downstream Impact Analysis State
  const [activeImpactRuleId, setActiveImpactRuleId] = useState<string | null>('rule-1-1');
  const [isImpactAnalysisActive, setIsImpactAnalysisActive] = useState<boolean>(true);
  const [showImpactModal, setShowImpactModal] = useState<boolean>(false);
  const [inspectorTab, setInspectorTab] = useState<'config' | 'mappingRules'>('mappingRules');
  const [editingRule, setEditingRule] = useState<MappingRule | null>(null);
  const [isCreatingRule, setIsCreatingRule] = useState<boolean>(false);
  const [impactReportTab, setImpactReportTab] = useState<'systems' | 'fields' | 'safeguards'>('systems');
  const [activeSafeguards, setActiveSafeguards] = useState<Record<string, boolean>>({
    notifyOwners: true,
    autoSchemaContract: true,
    triggerRegressionTests: true,
    auditLog: true,
  });

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Downstream Impact Calculation
  const impactResult = useMemo(() => {
    if (!isImpactAnalysisActive || !selectedNodeId) return null;
    return computeDownstreamImpact(selectedNodeId, activeImpactRuleId, nodes, edges);
  }, [selectedNodeId, activeImpactRuleId, nodes, edges, isImpactAnalysisActive]);

  // Dynamic Edges with Impact Highlighting
  const displayEdges = useMemo(() => {
    if (!isImpactAnalysisActive || !impactResult) return edges;
    return edges.map((e) => {
      const isImpactEdge = impactResult.impactedEdgeIds.has(e.id);
      if (isImpactEdge) {
        return {
          ...e,
          animated: true,
          style: { stroke: '#f43f5e', strokeWidth: 3.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f43f5e' },
        };
      }
      return {
        ...e,
        style: { stroke: '#cbd5e1', strokeWidth: 1.5, opacity: 0.35 },
      };
    });
  }, [edges, isImpactAnalysisActive, impactResult]);

  // Dynamic Nodes with Impact Indicators
  const displayNodes = useMemo(() => {
    if (!isImpactAnalysisActive || !impactResult) return nodes;
    return nodes.map((n) => {
      const isSource = n.id === selectedNodeId;
      const isImpacted = impactResult.impactedNodeIds.has(n.id);
      const detail = impactResult.nodeImpactDetails[n.id];

      return {
        ...n,
        data: {
          ...n.data,
          isImpactSource: isSource,
          isImpacted,
          impactLevel: detail?.riskLevel || 'High',
          impactReason: detail?.reason || 'Receives downstream payload from modified mapping rule.',
        },
        style: {
          ...n.style,
          opacity: isSource || isImpacted ? 1 : 0.35,
        },
      };
    });
  }, [nodes, isImpactAnalysisActive, impactResult, selectedNodeId]);

  // Mapping Rule Handlers
  const handleSaveRule = (updatedRule: MappingRule) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          const existingRules = n.data.mappingRules || [];
          const exists = existingRules.some((r) => r.id === updatedRule.id);
          const newRules = exists
            ? existingRules.map((r) => (r.id === updatedRule.id ? updatedRule : r))
            : [...existingRules, updatedRule];
          return {
            ...n,
            data: {
              ...n.data,
              mappingRules: newRules,
            },
          };
        }
        return n;
      })
    );
    setActiveImpactRuleId(updatedRule.id);
    setIsImpactAnalysisActive(true);
    setEditingRule(null);
    setIsCreatingRule(false);
    showNotification(`Mapping rule '${updatedRule.ruleName}' updated & downstream impact recalculated!`);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              mappingRules: (n.data.mappingRules || []).filter((r) => r.id !== ruleId),
            },
          };
        }
        return n;
      })
    );
    if (activeImpactRuleId === ruleId) {
      setActiveImpactRuleId(null);
    }
    showNotification('Mapping rule removed.');
  };

  // Drag and Drop Logic
  const onDragStart = (event: React.DragEvent, type: string, data: any) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.setData('application/nodeData', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const rawData = event.dataTransfer.getData('application/nodeData');

      if (!type || !rawData) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const data = JSON.parse(rawData);

      if (type === 'template') {
        applyTemplate(data, position);
      } else {
        const newNodeId = `node-${Date.now()}`;
        const newNode: Node<CustomNodeData> = {
          id: newNodeId,
          type: 'pipelineNode',
          position,
          data: {
            ...data,
            recordsCount: 0,
            status: 'idle',
            config: { created: new Date().toISOString() },
          },
        };
        setNodes((nds) => nds.concat(newNode));
        setSelectedNodeId(newNodeId);
        showNotification(`Added ${data.label} to pipeline`);
      }
    },
    [screenToFlowPosition, setNodes]
  );

  const applyTemplate = (templateId: string, position: { x: number; y: number }) => {
    const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const timestamp = Date.now();
    const nodeMap: Record<number, string> = {};

    const newNodes: Node<CustomNodeData>[] = template.nodes.map((node, index) => {
      const id = `node-tpl-${timestamp}-${index}`;
      nodeMap[index] = id;
      return {
        id,
        type: 'pipelineNode',
        position: {
          x: position.x + node.x,
          y: position.y + node.y,
        },
        data: {
          label: node.label,
          category: node.category as any,
          system: node.system,
          recordsCount: 0,
          status: 'idle',
          config: { template: template.name },
        },
      };
    });

    const newEdges: Edge[] = template.edges.map((edge, index) => ({
      id: `edge-tpl-${timestamp}-${index}`,
      source: nodeMap[edge.from],
      target: nodeMap[edge.to],
      animated: true,
      style: { stroke: edge.color, strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: edge.color },
    }));

    setNodes((nds) => nds.concat(newNodes));
    setEdges((eds) => eds.concat(newEdges));
    showNotification(`Imported "${template.name}" workflow template`);
  };

  // Bulk Operations State
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [bulkSearchQuery, setBulkSearchQuery] = useState('');
  const [bulkStatusFilter, setBulkStatusFilter] = useState<'All' | 'Running' | 'Paused' | 'Completed' | 'Failed'>('All');
  const [consoleLogs, setConsoleLogs] = useState<Array<{ timestamp: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>>([
    { timestamp: new Date().toLocaleTimeString(), message: 'Bulk Operations Command Center initialized.', type: 'info' }
  ]);
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const logToConsole = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setConsoleLogs(prev => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString(), message, type }
    ]);
  }, []);

  // Sync Simulation Traffic for active jobs
  useEffect(() => {
    if (!isSimulatingTraffic) return;

    const interval = setInterval(() => {
      setJobs(prev => prev.map(job => {
        if (job.status === 'Running') {
          const increment = Math.floor(Math.random() * 800) + 200;
          const nextProcessed = Math.min(job.totalRecords, job.processedRecords + increment);
          const nextPct = Math.round((nextProcessed / job.totalRecords) * 100);
          const nextStatus = nextProcessed >= job.totalRecords ? 'Completed' : 'Running';

          if (nextStatus === 'Completed') {
            logToConsole(`SUCCESS: Migration completed for "${job.jobName}". All ${job.totalRecords.toLocaleString()} records processed successfully.`, 'success');
          }

          return {
            ...job,
            processedRecords: nextProcessed,
            progressPct: nextPct,
            status: nextStatus
          };
        }
        return job;
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimulatingTraffic, setJobs, logToConsole]);

  // Filtered jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.jobName.toLowerCase().includes(bulkSearchQuery.toLowerCase()) ||
                          job.sourceConnectorName.toLowerCase().includes(bulkSearchQuery.toLowerCase()) ||
                          job.destConnectorName.toLowerCase().includes(bulkSearchQuery.toLowerCase());
    const matchesStatus = bulkStatusFilter === 'All' || job.status === bulkStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Toggle selection
  const handleToggleSelectJob = (id: string) => {
    setSelectedJobIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle Select All
  const handleToggleSelectAll = () => {
    const visibleIds = filteredJobs.map(j => j.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedJobIds.includes(id));
    if (allSelected) {
      setSelectedJobIds(prev => prev.filter(id => !visibleIds.includes(id)));
      logToConsole('Deselected all jobs on current page.', 'info');
    } else {
      setSelectedJobIds(prev => Array.from(new Set([...prev, ...visibleIds])));
      logToConsole(`Selected ${visibleIds.length} jobs.`, 'info');
    }
  };

  // Bulk Actions
  const handleBulkPause = () => {
    const selectedRunning = filteredJobs.filter(j => selectedJobIds.includes(j.id) && j.status === 'Running');
    if (selectedRunning.length === 0) {
      logToConsole('BULK COMMAND WARNING: No running jobs selected for pause.', 'warning');
      showNotification('No running jobs selected to pause');
      return;
    }

    logToConsole(`COMMAND: Bulk PAUSE initiated for ${selectedRunning.length} jobs...`, 'info');

    setJobs(prev => prev.map(job => {
      if (selectedJobIds.includes(job.id) && job.status === 'Running') {
        logToConsole(`SUCCESS: Paused job: "${job.jobName}" (ID: ${job.id})`, 'success');
        return { ...job, status: 'Paused' };
      }
      return job;
    }));

    showNotification(`Bulk paused ${selectedRunning.length} jobs`);
  };

  const handleBulkResume = () => {
    const selectedPaused = filteredJobs.filter(j => selectedJobIds.includes(j.id) && (j.status === 'Paused' || j.status === 'Idle'));
    if (selectedPaused.length === 0) {
      logToConsole('BULK COMMAND WARNING: No paused or idle jobs selected for resume.', 'warning');
      showNotification('No paused/idle jobs selected to resume');
      return;
    }

    logToConsole(`COMMAND: Bulk RESUME initiated for ${selectedPaused.length} jobs...`, 'info');

    setJobs(prev => prev.map(job => {
      if (selectedJobIds.includes(job.id) && (job.status === 'Paused' || job.status === 'Idle')) {
        logToConsole(`SUCCESS: Resumed job: "${job.jobName}" (ID: ${job.id})`, 'success');
        return { ...job, status: 'Running' };
      }
      return job;
    }));

    showNotification(`Bulk resumed ${selectedPaused.length} jobs`);
  };

  const handleBulkReset = () => {
    const selected = filteredJobs.filter(j => selectedJobIds.includes(j.id));
    if (selected.length === 0) {
      logToConsole('BULK COMMAND WARNING: No jobs selected for reset.', 'warning');
      showNotification('No jobs selected to reset');
      return;
    }

    logToConsole(`COMMAND: Bulk RESET initiated for ${selected.length} jobs...`, 'info');

    setJobs(prev => prev.map(job => {
      if (selectedJobIds.includes(job.id)) {
        logToConsole(`SUCCESS: Reset statistics for: "${job.jobName}"`, 'success');
        return { 
          ...job, 
          status: 'Idle', 
          progressPct: 0, 
          processedRecords: 0, 
          errorCount: 0, 
          warningCount: 0 
        };
      }
      return job;
    }));

    setSelectedJobIds([]);
    showNotification(`Bulk reset ${selected.length} jobs`);
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `e-${params.source}-${params.target}`,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Selected Node Reference
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Add Node from Palette
  const handleAddNodeFromPalette = (template: typeof NODE_PALETTE[0]) => {
    const newId = `node-${Date.now()}`;
    const newPosition = {
      x: 150 + Math.random() * 300,
      y: 150 + Math.random() * 200,
    };

    const newNode: Node<CustomNodeData> = {
      id: newId,
      type: 'pipelineNode',
      position: newPosition,
      data: {
        label: template.label,
        category: template.category,
        system: template.system,
        recordsCount: 0,
        status: 'idle',
        config: { created: new Date().toISOString() },
        description: template.description,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newId);
    showNotification(`Added node "${template.label}" to visual canvas`);
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
    showNotification('Node deleted from pipeline');
  };

  const handleUpdateSelectedNodeConfig = (key: string, value: any) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data.config,
                [key]: value,
              },
            },
          };
        }
        return node;
      })
    );
  };

  // Run Simulation Process
  const getSortedSteps = () => {
    const nodeLevels: Record<string, number> = {};
    nodes.forEach((node) => {
      if (node.data.category === 'source') nodeLevels[node.id] = 0;
      else if (node.data.category === 'cleansing') nodeLevels[node.id] = 1;
      else if (node.data.category === 'validation') nodeLevels[node.id] = 2;
      else if (node.data.category === 'transform') nodeLevels[node.id] = 3;
      else if (node.data.category === 'sink') nodeLevels[node.id] = 4;
      else nodeLevels[node.id] = 2;
    });

    for (let i = 0; i < 3; i++) {
      edges.forEach((edge) => {
        const srcLevel = nodeLevels[edge.source];
        const tgtLevel = nodeLevels[edge.target];
        if (srcLevel !== undefined && tgtLevel !== undefined) {
          if (tgtLevel <= srcLevel) {
            nodeLevels[edge.target] = srcLevel + 1;
          }
        }
      });
    }

    return nodes
      .map((node) => {
        const level = nodeLevels[node.id] ?? 2;
        return {
          id: node.id,
          label: node.data.label,
          category: node.data.category,
          system: node.data.system,
          status: node.data.status,
          recordsCount: node.data.recordsCount || 0,
          description: node.data.description || '',
          config: node.data.config || {},
          level,
        };
      })
      .sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.label.localeCompare(b.label);
      });
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    showNotification('Pipeline Simulation Started - Streaming Records...');

    const sortedSteps = getSortedSteps();

    // Set all nodes to 'idle' with 0 records first
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, status: 'idle' as const, recordsCount: 0 },
      }))
    );

    let activeStepIndex = 0;
    let stepProgress = 0;

    const interval = setInterval(() => {
      if (activeStepIndex >= sortedSteps.length) {
        clearInterval(interval);
        setIsSimulating(false);
        showNotification('Pipeline Simulation Completed Successfully! 250,000 Records Processed.');
        return;
      }

      const activeStep = sortedSteps[activeStepIndex];
      stepProgress += 50000;

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === activeStep.id) {
            const currentRecords = Math.min(250000, stepProgress);
            const isDone = currentRecords >= 250000;
            return {
              ...n,
              data: {
                ...n.data,
                status: isDone ? ('success' as const) : ('running' as const),
                recordsCount: currentRecords,
              },
            };
          }
          // Keep previous completed steps as 'success' and subsequent steps as 'idle'
          const stepIndexInSorted = sortedSteps.findIndex((s) => s.id === n.id);
          if (stepIndexInSorted < activeStepIndex) {
            return {
              ...n,
              data: { ...n.data, status: 'success' as const, recordsCount: 250000 },
            };
          }
          return n;
        })
      );

      if (stepProgress >= 250000) {
        activeStepIndex++;
        stepProgress = 0;
      }
    }, 400);
  };

  const handleResetCanvas = () => {
    setNodes(initialNodes as Node<CustomNodeData>[]);
    setEdges(initialEdges);
    setSelectedNodeId('node-4');
    showNotification('Workflow reset to standard SAP -> Business Central blueprint.');
  };

  const handleExportBlueprint = () => {
    const blueprint = {
      version: '1.0',
      created: new Date().toISOString(),
      nodes,
      edges,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(blueprint, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `pipeline_blueprint_${Date.now()}.json`;
    a.click();
    a.remove();
    showNotification('Exported pipeline blueprint JSON');
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const filteredPalette = NODE_PALETTE.filter(
    (item) =>
      item.label.toLowerCase().includes(paletteSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(paletteSearch.toLowerCase()) ||
      item.system.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <Workflow className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Migration Workflow Designer</h2>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              React Flow DAG Pipeline Engine
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Build, configure, and simulate end-to-end data pipelines with visual drag-and-drop transformation, validation, and cleansing nodes.
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isSimulating ? 'Simulating Pipeline...' : 'Test Run Workflow'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetCanvas}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            title="Reset to default pipeline layout"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMiniMap(!showMiniMap)}
            className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs ${
              showMiniMap ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Mini-Map View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{showMiniMap ? 'Hide Map' : 'Show Map'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportBlueprint}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export DAG</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {notification && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 text-xs font-medium flex items-center gap-2 animate-fade-in shadow-sm">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Studio View Section Module Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-200 shadow-2xs font-mono text-xs font-bold">
        <button
          onClick={() => setActiveStudioSection('all')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeStudioSection === 'all'
              ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>All Studio Modules</span>
        </button>

        <button
          onClick={() => setActiveStudioSection('canvas')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeStudioSection === 'canvas'
              ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Workflow className="w-4 h-4" />
          <span>DAG Visual Canvas</span>
        </button>

        <button
          onClick={() => setActiveStudioSection('scheduler')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeStudioSection === 'scheduler'
              ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          <span>Batch Drag & Drop Scheduler</span>
          <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px]">
            New
          </span>
        </button>

        <button
          onClick={() => setActiveStudioSection('timeline')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeStudioSection === 'timeline'
              ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Chronological Audit Timeline</span>
        </button>

        <button
          onClick={() => setActiveStudioSection('bulk')}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeStudioSection === 'bulk'
              ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Bulk Operations Control</span>
        </button>
      </div>

      {/* 1. Interactive Drag-and-Drop Batch Job Schedule Planner */}
      {(activeStudioSection === 'all' || activeStudioSection === 'scheduler') && (
        <BatchSchedulerStudio jobs={jobs} setJobs={setJobs} logToConsole={logToConsole} />
      )}

      {/* 2. Main Designer Studio Grid Layout (DAG Canvas) */}
      {(activeStudioSection === 'all' || activeStudioSection === 'canvas') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Side: Palette of Transformation / Validation Nodes */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col space-y-4 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Library
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
              <button
                onClick={() => setPaletteTab('nodes')}
                className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${paletteTab === 'nodes' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
              >
                Nodes
              </button>
              <button
                onClick={() => setPaletteTab('templates')}
                className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${paletteTab === 'templates' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
              >
                Templates
              </button>
            </div>
          </div>

          {/* Search Palette */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={paletteTab === 'nodes' ? "Search nodes..." : "Search templates..."}
              value={paletteSearch}
              onChange={(e) => setPaletteSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 shadow-inner"
            />
          </div>

          {/* Palette Items List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[520px] pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {paletteTab === 'nodes' ? (
              filteredPalette.map((template, idx) => {
                const getCategoryBadge = (cat: string) => {
                  switch (cat) {
                    case 'source': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                    case 'transform': return 'bg-purple-50 text-purple-700 border-purple-200';
                    case 'validation': return 'bg-amber-50 text-amber-700 border-amber-200';
                    case 'cleansing': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
                    case 'sink': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    default: return 'bg-slate-100 text-slate-700 border-slate-200';
                  }
                };

                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.01, borderColor: '#818cf8' }}
                    whileTap={{ scale: 0.98 }}
                    draggable
                    onDragStart={(e: any) => onDragStart(e, 'node', template)}
                    onClick={() => handleAddNodeFromPalette(template)}
                    className="group p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 cursor-grab active:cursor-grabbing transition-all duration-200 shadow-2xs relative"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${getCategoryBadge(template.category)}`}>
                        {template.category}
                      </span>
                      <Plus className="w-3 h-3 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {template.label}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{template.system}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1.5">{template.description}</p>
                  </motion.div>
                );
              })
            ) : (
              WORKFLOW_TEMPLATES
                .filter(t => t.name.toLowerCase().includes(paletteSearch.toLowerCase()) || t.description.toLowerCase().includes(paletteSearch.toLowerCase()))
                .map((template, idx) => {
                const Icon = template.icon;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02, borderColor: '#6366f1' }}
                    whileTap={{ scale: 0.98 }}
                    draggable
                    onDragStart={(e: any) => onDragStart(e, 'template', template.id)}
                    onClick={() => applyTemplate(template.id, { x: 100, y: 100 })}
                    className="group p-4 bg-white hover:bg-indigo-50/30 rounded-2xl border-2 border-slate-100 cursor-grab active:cursor-grabbing transition-all duration-200 shadow-sm relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Icon className="w-12 h-12 text-indigo-900" />
                    </div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-xs text-slate-900">
                        {template.name}
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {template.description}
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
                        {template.nodes.length} Nodes • {template.edges.length} Edges
                      </span>
                      <Plus className="w-3 h-3 text-indigo-500" />
                    </div>
                  </motion.div>
                );
              })
            )}
            {paletteTab === 'nodes' && filteredPalette.length === 0 && (
              <div className="py-12 text-center space-y-3">
                <Search className="w-8 h-8 text-slate-200 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">No matching components</p>
              </div>
            )}
          </div>
        </div>

        {/* Center: Interactive React Flow Canvas */}
        <div className="lg:col-span-6 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative shadow-sm flex flex-col min-h-[550px]">
          {/* Floating Impact Analysis Status Banner */}
          {isImpactAnalysisActive && impactResult && (
            <div className="absolute top-3 left-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl border border-slate-700 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40 shrink-0">
                  <ShieldAlert className="w-5 h-5 animate-pulse text-rose-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2 py-0.5 rounded">
                      Downstream Impact Active
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Risk: <strong className="text-rose-400">{impactResult.overallRiskLevel}</strong>
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-100 mt-0.5 line-clamp-1">
                    Flagging downstream impacts for modified rule across <span className="text-indigo-300 font-bold">{impactResult.totalImpactedCount} nodes</span> & <span className="text-amber-300 font-bold">{impactResult.affectedSystems.length} systems</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowImpactModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Full Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsImpactAnalysisActive(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
                  title="Close Impact Visualizer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div
            ref={reactFlowWrapper}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className="w-full h-full flex-1"
            style={{ height: '100%', minHeight: '520px' }}
          >
            <ReactFlow
              nodes={displayNodes}
              edges={displayEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
              className="bg-slate-50"
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
              <Controls className="!bg-white !border-slate-200 !text-slate-600 !fill-slate-600 shadow-sm" />
              
              {showMiniMap && (
                <Panel position="bottom-right" className="!m-6 bg-white rounded-2xl border-2 border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                  <div className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
                      Bird's Eye View
                    </div>
                  </div>
                  <div className="w-[200px] h-[140px] relative">
                    <MiniMap
                      className="!m-0 !w-full !h-full !static !bg-white"
                      zoomable
                      pannable
                      nodeColor={(n) => {
                        if (n.type === 'pipelineNode') {
                          const cat = (n.data as unknown as CustomNodeData)?.category;
                          if (cat === 'source') return '#4f46e5';
                          if (cat === 'sink') return '#059669';
                          if (cat === 'validation') return '#d97706';
                          if (cat === 'transform') return '#9333ea';
                          return '#0891b2';
                        }
                        return '#e2e8f0';
                      }}
                      nodeStrokeWidth={3}
                      nodeBorderRadius={4}
                      maskColor="rgba(99, 102, 241, 0.08)"
                    />
                  </div>
                </Panel>
              )}

              <Panel position="top-right" className="bg-white/90 backdrop-blur-md border border-slate-200 p-2 rounded-xl text-[10px] text-slate-600 flex items-center gap-3 shadow-sm">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" /> Source
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-600" /> Validation
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-600" /> Transform
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> Sink
                </span>
              </Panel>
            </ReactFlow>
          </div>
        </div>

        {/* Right Side: Selected Node Inspector & Configuration Drawer */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm space-y-4">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-900">Node Inspector</h3>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteSelectedNode}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Node"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Sub-Navigation Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setInspectorTab('mappingRules')}
                  className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    inspectorTab === 'mappingRules'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>Impact Analysis</span>
                  <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full text-[9px] font-mono">
                    {selectedNode.data.mappingRules?.length || 0}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab('config')}
                  className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    inspectorTab === 'config'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Config</span>
                </button>
              </div>

              {inspectorTab === 'mappingRules' ? (
                /* Downstream Impact & Mapping Rules Tab */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Mapping Rules & Impacts
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newRule: MappingRule = {
                          id: `rule-${Date.now()}`,
                          ruleName: 'New Field Transformation',
                          sourceField: 'SOURCE.FIELD',
                          targetField: 'TARGET.FIELD',
                          transformationType: 'Direct Copy',
                          expression: 'input',
                          riskLevel: 'Medium',
                          downstreamImpacts: [
                            {
                              system: 'Downstream Service',
                              process: 'Batch Record Ingestion',
                              field: 'TargetAttribute',
                              riskDescription: 'Field modification propagates to downstream API payload.',
                            },
                          ],
                        };
                        setEditingRule(newRule);
                        setIsCreatingRule(true);
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100"
                    >
                      <Plus className="w-3 h-3" />
                      Add Rule
                    </button>
                  </div>

                  {/* List of Mapping Rules */}
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                    {(selectedNode.data.mappingRules && selectedNode.data.mappingRules.length > 0) ? (
                      selectedNode.data.mappingRules.map((rule) => {
                        const isSelectedForImpact = isImpactAnalysisActive && activeImpactRuleId === rule.id;
                        return (
                          <div
                            key={rule.id}
                            className={`p-2.5 rounded-xl border transition-all space-y-2 ${
                              isSelectedForImpact
                                ? 'bg-gradient-to-r from-rose-50/60 to-indigo-50/60 border-rose-400 shadow-xs ring-2 ring-rose-400/30'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <h5 className="font-bold text-xs text-slate-900 line-clamp-1">{rule.ruleName}</h5>
                              <span
                                className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border shrink-0 ${
                                  rule.riskLevel === 'Critical'
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : rule.riskLevel === 'High'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                }`}
                              >
                                {rule.riskLevel}
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-600 font-mono bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
                              <span className="text-indigo-600 font-semibold">{rule.sourceField}</span>
                              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="text-purple-600 font-semibold">{rule.targetField}</span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[9px] text-slate-500 font-medium px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                                {rule.transformationType}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveImpactRuleId(rule.id);
                                    setIsImpactAnalysisActive(true);
                                    showNotification(`Flagging downstream impact for rule '${rule.ruleName}'`);
                                  }}
                                  className={`px-2 py-1 text-[9px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
                                    isSelectedForImpact
                                      ? 'bg-rose-600 text-white shadow-2xs'
                                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                                  }`}
                                >
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>{isSelectedForImpact ? 'Flagged' : 'Analyze Impact'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRule(rule);
                                    setIsCreatingRule(false);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded cursor-pointer"
                                  title="Edit Rule"
                                >
                                  <Sliders className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                  title="Delete Rule"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
                        <p className="text-xs text-slate-400 font-medium">No mapping rules configured on this node.</p>
                      </div>
                    )}
                  </div>

                  {/* Impact Summary Quick Box */}
                  {isImpactAnalysisActive && impactResult && (
                    <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2.5 shadow-md">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                          <ShieldAlert className="w-4 h-4 animate-pulse" />
                          <span>Downstream Impact</span>
                        </div>
                        <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.2 rounded font-mono font-bold">
                          {impactResult.totalImpactedCount} Nodes
                        </span>
                      </div>

                      <div className="space-y-1 text-[10px] font-mono text-slate-300">
                        <div className="flex justify-between">
                          <span>Target Systems:</span>
                          <span className="text-amber-300 font-bold">{impactResult.affectedSystems.length} Affected</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Business Processes:</span>
                          <span className="text-indigo-300 font-bold">{impactResult.affectedProcesses.length} Affected</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowImpactModal(true)}
                        className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Full Impact Report</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Standard Config Tab */
                <div className="space-y-4">
                  {/* Node Title & System Info */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Node Title & Label
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.label}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((nds) =>
                          nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, label: val } } : n))
                        );
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Connected System
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.system}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((nds) =>
                          nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, system: val } } : n))
                        );
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  {/* Category selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Category Type
                    </label>
                    <select
                      value={selectedNode.data.category}
                      onChange={(e) => {
                        const cat = e.target.value as any;
                        setNodes((nds) =>
                          nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, category: cat } } : n))
                        );
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="source">Source Connector</option>
                      <option value="validation">Validation Node</option>
                      <option value="cleansing">Cleansing Node</option>
                      <option value="transform">Transformation Node</option>
                      <option value="sink">Target Sink</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Node Description
                    </label>
                    <textarea
                      rows={2}
                      value={selectedNode.data.description || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((nds) =>
                          nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, description: val } } : n))
                        );
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  {/* Dynamic Configuration Settings */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-indigo-600" />
                      Runtime Configuration
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-slate-500">Strict Error Quarantine</span>
                        <input
                          type="checkbox"
                          checked={(selectedNode.data.config as Record<string, any>)?.strictQuarantine ?? true}
                          onChange={(e) => handleUpdateSelectedNodeConfig('strictQuarantine', e.target.checked)}
                          className="accent-indigo-600 rounded cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-slate-500">Parallel Worker Threads</span>
                        <select
                          value={(selectedNode.data.config as Record<string, any>)?.threads || 4}
                          onChange={(e) => handleUpdateSelectedNodeConfig('threads', Number(e.target.value))}
                          className="bg-slate-50 text-slate-900 rounded px-2 py-0.5 border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
                        >
                          <option value={1}>1 Thread</option>
                          <option value={4}>4 Threads</option>
                          <option value={8}>8 Threads</option>
                          <option value={16}>16 Threads</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-slate-500">Batch Ingestion Size</span>
                        <input
                          type="number"
                          value={(selectedNode.data.config as Record<string, any>)?.batchSize || 1000}
                          onChange={(e) => handleUpdateSelectedNodeConfig('batchSize', Number(e.target.value))}
                          className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-900 text-right text-xs focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6 space-y-3">
              <Sliders className="w-10 h-10 opacity-30 animate-pulse text-indigo-600" />
              <p className="text-xs">Click any node on the canvas to inspect or adjust its runtime parameters.</p>
            </div>
          )}

          {/* Bottom Execution Stats */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[10px] text-slate-500 font-mono shadow-2xs">
            <div className="flex justify-between">
              <span>Total Pipeline Nodes:</span>
              <strong className="text-slate-900">{nodes.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Active DAG Edges:</span>
              <strong className="text-slate-900">{edges.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <strong className={isSimulating ? 'text-amber-600 animate-pulse' : 'text-emerald-600'}>
                {isSimulating ? 'EXECUTING SIMULATION' : 'READY / VALIDATED'}
              </strong>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* MODAL 1: Mapping Rule Editor Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-2xl border border-indigo-400/30 text-indigo-300">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-100">
                    {isCreatingRule ? 'Create Mapping Rule' : 'Edit Mapping Rule'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define schema transformations & downstream dependency impacts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingRule(null);
                  setIsCreatingRule(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs scrollbar-thin">
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider block">
                  Rule Designation Name
                </label>
                <input
                  type="text"
                  value={editingRule.ruleName}
                  onChange={(e) => setEditingRule({ ...editingRule, ruleName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-hidden focus:border-indigo-500"
                  placeholder="e.g. Tax Registration Number Cleaning"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider block">
                    Source Field
                  </label>
                  <input
                    type="text"
                    value={editingRule.sourceField}
                    onChange={(e) => setEditingRule({ ...editingRule, sourceField: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider block">
                    Target System Field
                  </label>
                  <input
                    type="text"
                    value={editingRule.targetField}
                    onChange={(e) => setEditingRule({ ...editingRule, targetField: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider block">
                    Transformation Operator
                  </label>
                  <select
                    value={editingRule.transformationType}
                    onChange={(e) => setEditingRule({ ...editingRule, transformationType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Direct Copy">Direct Copy / Passthrough</option>
                    <option value="Regex Clean & Format">Regex Clean & Format</option>
                    <option value="Type Cast & Coerce">Type Cast & Coerce</option>
                    <option value="Formula Expression">Formula Expression</option>
                    <option value="Lookup / Cross-Ref">Lookup / Cross-Ref</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider block">
                    Schema Change Risk Level
                  </label>
                  <select
                    value={editingRule.riskLevel}
                    onChange={(e) => setEditingRule({ ...editingRule, riskLevel: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                    <option value="Critical">Critical Risk</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider block">
                  Transformation Formula / Expression
                </label>
                <textarea
                  rows={2}
                  value={editingRule.expression || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, expression: e.target.value })}
                  className="w-full bg-slate-900 text-indigo-300 font-mono text-xs rounded-xl p-3 border border-slate-800 focus:outline-hidden focus:border-indigo-500"
                  placeholder="e.g. REPLACE(REGEX_REPLACE(input, '[^0-9]', ''), '^0+', '')"
                />
              </div>

              {/* Downstream Impact Annotations */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider block">
                    Downstream System Impact Annotations
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [
                        ...(editingRule.downstreamImpacts || []),
                        {
                          system: 'New Target Consumer',
                          process: 'Downstream Processing',
                          field: 'TargetField',
                          riskDescription: 'New downstream schema dependency.',
                        },
                      ];
                      setEditingRule({ ...editingRule, downstreamImpacts: updated });
                    }}
                    className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Downstream Impact Item
                  </button>
                </div>

                <div className="space-y-2">
                  {editingRule.downstreamImpacts?.map((imp, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={imp.system}
                          onChange={(e) => {
                            const copy = [...(editingRule.downstreamImpacts || [])];
                            copy[idx].system = e.target.value;
                            setEditingRule({ ...editingRule, downstreamImpacts: copy });
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 font-medium"
                          placeholder="Target System"
                        />
                        <input
                          type="text"
                          value={imp.process}
                          onChange={(e) => {
                            const copy = [...(editingRule.downstreamImpacts || [])];
                            copy[idx].process = e.target.value;
                            setEditingRule({ ...editingRule, downstreamImpacts: copy });
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 font-medium"
                          placeholder="Impacted Process"
                        />
                        <input
                          type="text"
                          value={imp.field}
                          onChange={(e) => {
                            const copy = [...(editingRule.downstreamImpacts || [])];
                            copy[idx].field = e.target.value;
                            setEditingRule({ ...editingRule, downstreamImpacts: copy });
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 font-mono"
                          placeholder="Target Field"
                        />
                      </div>
                      <input
                        type="text"
                        value={imp.riskDescription}
                        onChange={(e) => {
                          const copy = [...(editingRule.downstreamImpacts || [])];
                          copy[idx].riskDescription = e.target.value;
                          setEditingRule({ ...editingRule, downstreamImpacts: copy });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
                        placeholder="Risk Description"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingRule(null);
                  setIsCreatingRule(false);
                }}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveRule(editingRule)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Save Rule & Analyze Impact</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Downstream Impact Assessment Report Modal */}
      {showImpactModal && impactResult && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-700 shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Report Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/40 shrink-0">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-950 border border-rose-800 px-2 py-0.5 rounded">
                      Vulnerability Assessment
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Origin: <strong className="text-indigo-300">{(impactResult as any).sourceNodeLabel}</strong>
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white mt-1">
                    Downstream Impact Assessment Report
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Blast radius simulation for modified mapping rule: <strong className="text-slate-200">{(impactResult as any).ruleName}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(impactResult, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', dataStr);
                    downloadAnchor.setAttribute('download', `downstream_impact_report_${Date.now()}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    showNotification('Impact Assessment Report exported as JSON!');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowImpactModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Top KPI Metric Cards */}
            <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/50 border-b border-slate-800">
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Impacted Downstream Nodes
                </span>
                <div className="text-2xl font-black text-rose-400 font-mono">
                  {impactResult.totalImpactedCount} Nodes
                </div>
                <span className="text-[10px] text-slate-500">
                  {impactResult.totalImpactedCount > 0 ? 'Direct & indirect graph reachable' : 'Isolated node'}
                </span>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Affected Target Systems
                </span>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {impactResult.affectedSystems.length} Systems
                </div>
                <span className="text-[10px] text-slate-500">
                  {impactResult.affectedSystems.slice(0, 2).join(', ')}
                </span>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Business Processes
                </span>
                <div className="text-2xl font-black text-indigo-400 font-mono">
                  {impactResult.affectedProcesses.length} Processes
                </div>
                <span className="text-[10px] text-slate-500">
                  Production ERP & Analytics
                </span>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Vulnerability Level
                </span>
                <div className="text-2xl font-black text-rose-500 font-mono uppercase">
                  {impactResult.overallRiskLevel} RISK
                </div>
                <span className="text-[10px] text-rose-400/80 font-medium">
                  Requires Governance Sign-off
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 pt-4 border-b border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setImpactReportTab('systems')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  impactReportTab === 'systems'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Impacted Systems & Processes</span>
              </button>
              <button
                type="button"
                onClick={() => setImpactReportTab('fields')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  impactReportTab === 'fields'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitBranch className="w-4 h-4" />
                <span>Field Lineage & Schema Drift</span>
              </button>
              <button
                type="button"
                onClick={() => setImpactReportTab('safeguards')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  impactReportTab === 'safeguards'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Mitigation & Safeguards Checklist</span>
              </button>
            </div>

            {/* Report Tab Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 scrollbar-thin">
              {impactReportTab === 'systems' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          <th className="p-3">Target System</th>
                          <th className="p-3">Downstream Process</th>
                          <th className="p-3">Target Field</th>
                          <th className="p-3">Risk Level</th>
                          <th className="p-3">Impact & Vulnerability Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {(impactResult as any).affectedProcesses.map((imp: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-bold text-indigo-300">{imp.system}</td>
                            <td className="p-3 text-slate-200 font-medium">{imp.process}</td>
                            <td className="p-3 font-mono text-purple-300">{imp.field}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-950 text-rose-300 border border-rose-800">
                                High Risk
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 text-xs">{imp.riskDescription}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {impactReportTab === 'fields' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-indigo-400" />
                      Visual Field Lineage & Data Flow
                    </h4>
                    
                    <div className="flex flex-col md:flex-row items-center gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
                      <div className="p-3 bg-indigo-950 border border-indigo-800 rounded-xl text-indigo-200 flex-1 w-full">
                        <span className="text-[9px] text-indigo-400 uppercase font-bold block">1. Origin Source Node</span>
                        <div className="font-bold text-white text-sm">{(impactResult as any).sourceNodeLabel}</div>
                        <div className="text-slate-400 mt-1">Field: <span className="text-indigo-300 font-bold">KNA1.STCD1 (VAT / Tax ID)</span></div>
                      </div>

                      <ChevronRight className="w-6 h-6 text-slate-500 shrink-0 hidden md:block" />

                      <div className="p-3 bg-purple-950 border border-purple-800 rounded-xl text-purple-200 flex-1 w-full">
                        <span className="text-[9px] text-purple-400 uppercase font-bold block">2. Applied Mapping Rule</span>
                        <div className="font-bold text-white text-sm">{(impactResult as any).ruleName}</div>
                        <div className="text-slate-400 mt-1">Transform: <span className="text-purple-300 font-bold">Regex Clean & Format</span></div>
                      </div>

                      <ChevronRight className="w-6 h-6 text-slate-500 shrink-0 hidden md:block" />

                      <div className="p-3 bg-rose-950 border border-rose-800 rounded-xl text-rose-200 flex-1 w-full">
                        <span className="text-[9px] text-rose-400 uppercase font-bold block">3. Downstream Receiver</span>
                        <div className="font-bold text-white text-sm">D365 BC Production Ledger</div>
                        <div className="text-slate-400 mt-1">Attribute: <span className="text-rose-300 font-bold">TaxRegistrationNo</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {impactReportTab === 'safeguards' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Automated Governance & Safeguard Controls
                    </h4>

                    <div className="space-y-2 text-xs">
                      <label className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-200">Notify Downstream System Owners</span>
                          <p className="text-[11px] text-slate-400">Send webhook notifications to Slack #data-governance & Dynamics admin team.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={activeSafeguards.notifyOwners}
                          onChange={(e) => setActiveSafeguards({ ...activeSafeguards, notifyOwners: e.target.checked })}
                          className="accent-indigo-500 h-4 w-4 rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-200">Auto-Generate Schema Migration Contract</span>
                          <p className="text-[11px] text-slate-400">Create OpenAPI v3.0 & Avro schema contract updates automatically.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={activeSafeguards.autoSchemaContract}
                          onChange={(e) => setActiveSafeguards({ ...activeSafeguards, autoSchemaContract: e.target.checked })}
                          className="accent-indigo-500 h-4 w-4 rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-200">Trigger Downstream Regression Test Suite</span>
                          <p className="text-[11px] text-slate-400">Run automated validation jobs in staging prior to production deployment.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={activeSafeguards.triggerRegressionTests}
                          onChange={(e) => setActiveSafeguards({ ...activeSafeguards, triggerRegressionTests: e.target.checked })}
                          className="accent-indigo-500 h-4 w-4 rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-200">Log Data Governance Change Audit</span>
                          <p className="text-[11px] text-slate-400">Persist compliance record to immutable audit log for SOC 2 / GDPR audits.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={activeSafeguards.auditLog}
                          onChange={(e) => setActiveSafeguards({ ...activeSafeguards, auditLog: e.target.checked })}
                          className="accent-indigo-500 h-4 w-4 rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Report Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Status: <strong className="text-emerald-400">ANALYSIS COMPLETE (0 CRITICAL ERRORS)</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImpactModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white font-bold transition-all cursor-pointer"
                >
                  Close Report
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImpactModal(false);
                    showNotification('Rule modifications & safeguards applied to active pipeline workflow!');
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Acknowledge & Deploy Safeguards</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chronological Steps Execution Timeline with AI Audit Copilot */}
      {(activeStudioSection === 'all' || activeStudioSection === 'timeline') && (
        <ChronologicalWorkflowTimeline
          nodes={nodes}
          edges={edges}
          isSimulating={isSimulating}
          onRunSimulation={handleRunSimulation}
          onResetCanvas={handleResetCanvas}
        />
      )}

      {/* Bulk Operations Control Center */}
      {(activeStudioSection === 'all' || activeStudioSection === 'bulk') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Migration Jobs Bulk Operations Control Center
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Select multiple migration jobs to pause, resume, or reset statistics simultaneously. Use filters to narrow down target jobs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                id="btn-view-cards"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                id="btn-view-table"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table List View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            <button
              type="button"
              id="btn-simulate-traffic"
              onClick={() => {
                setIsSimulatingTraffic(prev => !prev);
                logToConsole(isSimulatingTraffic ? 'Live traffic simulation paused.' : 'Live traffic simulation enabled. Active jobs will begin progress.', isSimulatingTraffic ? 'warning' : 'success');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isSimulatingTraffic 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20' 
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingTraffic ? 'animate-spin' : ''}`} />
              <span>{isSimulatingTraffic ? 'Active Traffic Simulating' : 'Simulate Live Traffic'}</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Bulk Actions */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-2xs">
          {/* Left: Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                id="inp-bulk-search"
                placeholder="Search jobs or pathways..."
                value={bulkSearchQuery}
                onChange={(e) => setBulkSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Status:
              </span>
              <select
                id="sel-bulk-status-filter"
                value={bulkStatusFilter}
                onChange={(e: any) => setBulkStatusFilter(e.target.value)}
                className="bg-white text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer shadow-2xs"
              >
                <option value="All">All Statuses</option>
                <option value="Running">Running</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Right: Selected Summary & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">
              Selected: <strong className="text-indigo-600 font-bold" id="selected-jobs-count">{selectedJobIds.length}</strong> / {filteredJobs.length} jobs
            </span>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <button
                type="button"
                id="btn-bulk-pause"
                onClick={handleBulkPause}
                disabled={selectedJobIds.length === 0}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 disabled:opacity-50 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Bulk Pause</span>
              </button>

              <button
                type="button"
                id="btn-bulk-resume"
                onClick={handleBulkResume}
                disabled={selectedJobIds.length === 0}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-50 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Bulk Resume</span>
              </button>

              <button
                type="button"
                id="btn-bulk-reset"
                onClick={handleBulkReset}
                disabled={selectedJobIds.length === 0}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-50 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Bulk Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table/Cards of Jobs */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.length === 0 ? (
              <div className="col-span-full border border-slate-200 rounded-2xl p-8 text-center text-slate-500 bg-slate-50">
                No active migration jobs match your search or filter options.
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = selectedJobIds.includes(job.id);
                return (
                  <div
                    key={job.id}
                    id={`job-card-${job.id}`}
                    onClick={() => handleToggleSelectJob(job.id)}
                    className={`group relative bg-white rounded-2xl border p-4.5 hover:bg-slate-50 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden shadow-sm hover:border-slate-300 ${
                      isSelected ? 'border-indigo-600 ring-2 ring-indigo-600/10 shadow-md' : 'border-slate-200'
                    }`}
                  >
                    {/* Top Accent Progress Overlay Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          job.status === 'Completed' ? 'bg-indigo-600' :
                          job.status === 'Paused' ? 'bg-amber-500' :
                          job.status === 'Failed' ? 'bg-rose-500' : 'bg-indigo-600 animate-pulse'
                        }`}
                        style={{ width: `${job.progressPct}%` }}
                      />
                    </div>

                    <div className="space-y-4">
                      {/* Header Title & Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectJob(job.id)}
                              className="accent-indigo-600 h-4 w-4 rounded border-slate-300 bg-white text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                              {job.jobName}
                            </h4>
                            <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                              ID: {job.id} • {job.mode} Mode
                            </span>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 border ${
                          job.status === 'Running' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          job.status === 'Paused' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          job.status === 'Completed' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          job.status === 'Failed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {job.status === 'Running' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                          {job.status}
                        </span>
                      </div>

                      {/* Pathways & Entity Information */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 font-mono text-[10px] shadow-2xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="font-bold text-slate-900">{job.sourceConnectorName}</span>
                          <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span className="font-bold text-slate-900">{job.destConnectorName}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 flex justify-between">
                          <span>Entity: {job.sourceEntity}</span>
                          <span>→ {job.destEntity}</span>
                        </div>
                      </div>

                      {/* Progress Bar Overlay */}
                      <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                          <span className="font-semibold text-slate-700">Tasks Completion</span>
                          <span className="text-indigo-600 font-bold text-xs">{job.progressPct}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300/30">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              job.status === 'Completed' ? 'bg-indigo-600' :
                              job.status === 'Paused' ? 'bg-amber-500' :
                              job.status === 'Failed' ? 'bg-rose-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${job.progressPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                          <span>Processed: {job.processedRecords.toLocaleString()}</span>
                          <span>Total: {job.totalRecords.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Controls & Stats Row */}
                    <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100 text-[10px] font-mono">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-500">Throughput</span>
                        <span className="text-slate-900 font-bold">
                          {job.status === 'Running' ? `${job.throughputRps} rps` : '—'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5 items-end">
                        <span className="text-slate-500">Errors • Warnings</span>
                        <span className="text-slate-900 font-bold">
                          <strong className={job.errorCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>{job.errorCount}</strong> • <strong className={job.warningCount > 0 ? 'text-amber-600 font-bold' : 'text-slate-500'}>{job.warningCount}</strong>
                        </span>
                      </div>

                      <div className="pl-3 border-l border-slate-200" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setJobs(prev => prev.map(item => {
                              if (item.id === job.id) {
                                const newStatus = item.status === 'Running' ? 'Paused' : 'Running';
                                logToConsole(`SUCCESS: Toggled job "${item.jobName}" to ${newStatus}`, 'info');
                                return { ...item, status: newStatus };
                              }
                              return item;
                            }));
                          }}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs ${
                            job.status === 'Running' 
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                          title={job.status === 'Running' ? 'Pause Job' : 'Resume Job'}
                        >
                          {job.status === 'Running' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        id="chk-master-select"
                        checked={filteredJobs.length > 0 && filteredJobs.every(j => selectedJobIds.includes(j.id))}
                        onChange={handleToggleSelectAll}
                        className="accent-indigo-600 rounded cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Migration Job Title</th>
                    <th className="p-3">Source & Destination Pathways</th>
                    <th className="p-3 w-40">Progress Bar</th>
                    <th className="p-3">Processed / Total</th>
                    <th className="p-3 text-right">Speed (RPS)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No active migration jobs match your search or filter options.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => {
                      const isSelected = selectedJobIds.includes(job.id);
                      return (
                        <tr 
                          key={job.id} 
                          id={`job-row-${job.id}`}
                          className={`hover:bg-slate-50 transition-colors ${
                            isSelected ? 'bg-indigo-50/50' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectJob(job.id)}
                              className="accent-indigo-600 rounded cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-semibold">
                            <div className="flex flex-col">
                              <span className="text-slate-900">{job.jobName}</span>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {job.id} • {job.mode} Mode</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-[10px]">
                            <div className="flex items-center gap-1 text-slate-500">
                              <span className="text-slate-700 font-semibold">{job.sourceConnectorName}</span>
                              <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0" />
                              <span className="text-slate-700 font-semibold">{job.destConnectorName}</span>
                            </div>
                            <div className="text-[9px] text-slate-500 mt-0.5">
                              Entity: {job.sourceEntity} → {job.destEntity}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>{job.progressPct}%</span>
                                {job.status === 'Running' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    job.status === 'Completed' ? 'bg-indigo-600' :
                                    job.status === 'Paused' ? 'bg-amber-500' :
                                    job.status === 'Failed' ? 'bg-rose-500' : 'bg-indigo-600'
                                  }`}
                                  style={{ width: `${job.progressPct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-xs">
                            <div className="flex flex-col">
                              <span className="text-slate-700">{job.processedRecords.toLocaleString()} / {job.totalRecords.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                Errors: <strong className={job.errorCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>{job.errorCount}</strong> • 
                                Warnings: <strong className={job.warningCount > 0 ? 'text-amber-600 font-bold' : 'text-slate-500'}>{job.warningCount}</strong>
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700">
                            {job.status === 'Running' ? `${job.throughputRps} rps` : '—'}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              job.status === 'Running' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              job.status === 'Paused' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              job.status === 'Completed' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              job.status === 'Failed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {job.status === 'Running' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                              {job.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setJobs(prev => prev.map(item => {
                                  if (item.id === job.id) {
                                    const newStatus = item.status === 'Running' ? 'Paused' : 'Running';
                                    logToConsole(`SUCCESS: Toggled job "${item.jobName}" to ${newStatus}`, 'info');
                                    return { ...item, status: newStatus };
                                  }
                                  return item;
                                }));
                              }}
                              className={`p-1 rounded-md border transition-all cursor-pointer shadow-2xs ${
                                job.status === 'Running' 
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' 
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                              title={job.status === 'Running' ? 'Pause Job' : 'Resume Job'}
                            >
                              {job.status === 'Running' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Realtime Execution Terminal Console Logs */}
        <div className="bg-slate-900 rounded-xl border border-slate-200 p-4 space-y-2 shadow-inner">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-800/20 pb-2">
            <span className="flex items-center gap-1.5 font-bold text-slate-200">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              Execution Control Console Output
            </span>
            <button
              type="button"
              onClick={() => {
                setConsoleLogs([
                  { timestamp: new Date().toLocaleTimeString(), message: 'Console logs cleared.', type: 'info' }
                ]);
              }}
              className="text-[10px] hover:text-white transition-colors cursor-pointer"
            >
              Clear Output
            </button>
          </div>
          
          <div className="font-mono text-[11px] space-y-1 max-h-[140px] overflow-y-auto pr-2 scrollbar-thin">
            {consoleLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                <span className={`break-all ${
                  log.type === 'success' ? 'text-emerald-400' :
                  log.type === 'warning' ? 'text-amber-400' :
                  log.type === 'error' ? 'text-rose-400' :
                  'text-slate-200'
                }`}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

    </div>
  );
};

interface MigrationWorkflowDesignerProps {
  jobs?: MigrationJob[];
  setJobs?: React.Dispatch<React.SetStateAction<MigrationJob[]>>;
}

export const MigrationWorkflowDesigner: React.FC<MigrationWorkflowDesignerProps> = ({ jobs: propJobs, setJobs: propSetJobs }) => {
  const [localJobs, setLocalJobs] = useState<MigrationJob[]>(MOCK_MIGRATION_JOBS);
  const jobs = propJobs !== undefined ? propJobs : localJobs;
  const setJobs = propSetJobs !== undefined ? propSetJobs : setLocalJobs;

  return (
    <ReactFlowProvider>
      <div id="migration-workflow-designer-view" className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <MigrationWorkflowDesignerContent jobs={jobs} setJobs={setJobs} />
      </div>
    </ReactFlowProvider>
  );
};
