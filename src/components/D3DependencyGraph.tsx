import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  Cpu,
  Layers,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Filter,
  Info,
  Maximize2,
  RefreshCw,
  Zap,
  GitFork,
  Activity,
  ChevronRight,
  Eye,
  ListFilter,
  Sliders,
  Flame,
  Radio,
  Workflow,
  ArrowUpRight,
} from 'lucide-react';

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  category: 'source' | 'transformation' | 'destination';
  system: string;
  recordCount: number;
  primaryKey: string;
  type: string;
  status: 'active' | 'warning' | 'error' | 'syncing';
  fieldsCount: number;
  description: string;
  // d3 properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  type: 'fk' | 'transform' | 'data_flow' | 'view_dependency';
  isMandatory?: boolean;
  hasConflict?: boolean;
  throughput?: string;
}

export interface ComputedLinkPath {
  id: string;
  sourceId: string;
  targetId: string;
  sourceName: string;
  targetName: string;
  d: string;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
  throughput?: string;
  throughputVal: number;
  hasConflict?: boolean;
  type: string;
  label: string;
}

const FramerMotionPathFlow: React.FC<{
  link: ComputedLinkPath;
  isMigrationActive: boolean;
  flowSpeed: number;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ link, isMigrationActive, flowSpeed, isSelected, onSelect }) => {
  const isConflict = link.hasConflict;
  const isHighVolume = link.throughputVal >= 1000000;

  const strokeColor = isConflict
    ? '#f43f5e'
    : isHighVolume
    ? '#38bdf8'
    : '#10b981';

  const filterGlow = isConflict
    ? 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.9))'
    : isHighVolume
    ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))'
    : 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.7))';

  const throughputSpeedFactor = isHighVolume ? 1.8 : 1.0;
  const animDuration = 3.5 / (flowSpeed * throughputSpeedFactor);

  return (
    <g className="framer-link-flow-item" onClick={onSelect} style={{ cursor: 'pointer' }}>
      {/* 1. Underlying animated glowing stroke path */}
      <motion.path
        d={link.d}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isConflict ? 3.5 : isHighVolume ? 3.0 : 2.0}
        strokeDasharray={isConflict ? '6 6' : isHighVolume ? '12 8' : '8 6'}
        initial={{ strokeDashoffset: 0 }}
        animate={
          isMigrationActive
            ? {
                strokeDashoffset: [0, -48],
                strokeOpacity: [0.6, 1.0, 0.6],
              }
            : { strokeDashoffset: 0, strokeOpacity: 0.3 }
        }
        transition={{
          strokeDashoffset: {
            repeat: Infinity,
            duration: animDuration,
            ease: 'linear',
          },
          strokeOpacity: {
            repeat: Infinity,
            duration: 1.8,
            ease: 'easeInOut',
          },
        }}
        style={{ filter: filterGlow }}
      />

      {/* 2. Framer Motion Pulsing Data Packet Particles */}
      {isMigrationActive && (
        <>
          <motion.circle
            r={isConflict ? 4.5 : isHighVolume ? 4.0 : 3.0}
            fill={isConflict ? '#fb7185' : isHighVolume ? '#7dd3fc' : '#6ee7b7'}
            style={{
              offsetPath: `path("${link.d}")`,
              filter: isConflict
                ? 'drop-shadow(0 0 10px #f43f5e)'
                : 'drop-shadow(0 0 10px #38bdf8)',
            }}
            animate={{
              offsetDistance: ['0%', '100%'],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              offsetDistance: {
                repeat: Infinity,
                duration: animDuration * 1.2,
                ease: 'linear',
              },
              scale: {
                repeat: Infinity,
                duration: 0.8,
                ease: 'easeInOut',
              },
            }}
          />

          {/* Second offset particle for high volume streams */}
          {isHighVolume && (
            <motion.circle
              r={3.0}
              fill="#c084fc"
              style={{
                offsetPath: `path("${link.d}")`,
                filter: 'drop-shadow(0 0 8px #a855f7)',
              }}
              animate={{
                offsetDistance: ['0%', '100%'],
              }}
              transition={{
                offsetDistance: {
                  repeat: Infinity,
                  duration: animDuration * 1.2,
                  delay: animDuration * 0.6,
                  ease: 'linear',
                },
              }}
            />
          )}
        </>
      )}

      {/* 3. Interactive Stream Pulse Halo when selected */}
      {isSelected && (
        <motion.path
          d={link.d}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={6}
          strokeOpacity={0.6}
          animate={{ strokeOpacity: [0.2, 0.8, 0.2] }}
          transition={{ repeat: Infinity, duration: 1 }}
          style={{ filter: 'drop-shadow(0 0 12px #f59e0b)' }}
        />
      )}
    </g>
  );
};

const DEFAULT_NODES: GraphNode[] = [
  // Source Tables
  {
    id: 'src-cust-master',
    name: 'Customer_Master',
    category: 'source',
    system: 'Source (SAP / D365)',
    recordCount: 48250,
    primaryKey: 'Cust_ID',
    type: 'SQL Table',
    status: 'active',
    fieldsCount: 38,
    description: 'Master customer accounts and address hierarchy from legacy ERP',
  },
  {
    id: 'src-vendor-master',
    name: 'Vendor_Master',
    category: 'source',
    system: 'Source (SAP / D365)',
    recordCount: 12400,
    primaryKey: 'Vendor_No',
    type: 'SQL Table',
    status: 'active',
    fieldsCount: 29,
    description: 'Supplier and vendor master catalog with payment methods',
  },
  {
    id: 'src-item-catalog',
    name: 'Item_Catalog',
    category: 'source',
    system: 'Source (SAP ERP)',
    recordCount: 185000,
    primaryKey: 'Item_SKU',
    type: 'OData Table',
    status: 'active',
    fieldsCount: 42,
    description: 'Material master with unit prices, weights, and category codes',
  },
  {
    id: 'src-sales-order-hdr',
    name: 'Sales_Order_Header',
    category: 'source',
    system: 'Source (SAP ERP)',
    recordCount: 1420000,
    primaryKey: 'Order_No',
    type: 'SQL Table',
    status: 'warning',
    fieldsCount: 54,
    description: 'Transactional order headers containing timestamps and total amounts',
  },
  {
    id: 'src-sales-order-line',
    name: 'Sales_Order_Line',
    category: 'source',
    system: 'Source (SAP ERP)',
    recordCount: 5800000,
    primaryKey: 'Order_Line_ID',
    type: 'SQL Table',
    status: 'active',
    fieldsCount: 22,
    description: 'Line item breakdown referencing Order_Header and Item_SKU',
  },
  {
    id: 'src-pay-terms',
    name: 'Payment_Terms',
    category: 'source',
    system: 'Source (SAP Config)',
    recordCount: 45,
    primaryKey: 'Term_Code',
    type: 'Reference Table',
    status: 'active',
    fieldsCount: 8,
    description: 'Payment terms lookup table (e.g. Net 30, Due on Receipt)',
  },

  // Transformation Pipelines
  {
    id: 'tx-cust-dedupe',
    name: 'ETL_Customer_Dedupe',
    category: 'transformation',
    system: 'PySpark / Lakehouse Pipeline',
    recordCount: 48250,
    primaryKey: 'Transform_Rule_01',
    type: 'Data Cleanse',
    status: 'active',
    fieldsCount: 12,
    description: 'Fuzzy matching & address normalization rule to deduplicate customer accounts',
  },
  {
    id: 'tx-order-enricher',
    name: 'Order_Header_Enricher',
    category: 'transformation',
    system: 'dbt Transformation Engine',
    recordCount: 1420000,
    primaryKey: 'Transform_Rule_02',
    type: 'Aggregation & Join',
    status: 'warning',
    fieldsCount: 18,
    description: 'Joins Sales Orders with Customer Master and Item SKUs for currency conversion',
  },
  {
    id: 'tx-vendor-mapping',
    name: 'Vendor_UUID_Resolver',
    category: 'transformation',
    system: 'Spark ETL Engine',
    recordCount: 12400,
    primaryKey: 'Transform_Rule_03',
    type: 'Key Mapper',
    status: 'active',
    fieldsCount: 6,
    description: 'Converts legacy INT64 Vendor_No into destination UUID format',
  },
  {
    id: 'tx-invoice-calc',
    name: 'Invoice_Tax_Calculator',
    category: 'transformation',
    system: 'Streaming Pipeline',
    recordCount: 1290000,
    primaryKey: 'Transform_Rule_04',
    type: 'Business Logic Rule',
    status: 'error',
    fieldsCount: 15,
    description: 'Calculates tax jurisdictions and revenue recognition rules for invoice headers',
  },
  {
    id: 'tx-inventory-allocator',
    name: 'Inventory_Stock_Mapper',
    category: 'transformation',
    system: 'Real-Time Event Stream',
    recordCount: 185000,
    primaryKey: 'Transform_Rule_05',
    type: 'Stream Transformer',
    status: 'active',
    fieldsCount: 10,
    description: 'Maps warehouse stock quantities to online sales channels',
  },

  // Destination Schemas
  {
    id: 'dst-crm-account',
    name: 'Account_Master_CRM',
    category: 'destination',
    system: 'Destination (Salesforce)',
    recordCount: 52000,
    primaryKey: 'Account_ID',
    type: 'REST Endpoint',
    status: 'active',
    fieldsCount: 64,
    description: 'Target CRM Account record with 360-degree customer details',
  },
  {
    id: 'dst-s4-invoice-hdr',
    name: 'Invoice_Header',
    category: 'destination',
    system: 'Destination (S/4HANA)',
    recordCount: 1290000,
    primaryKey: 'Invoice_Doc_No',
    type: 'OData v4 Target',
    status: 'error',
    fieldsCount: 48,
    description: 'S/4HANA target financial invoice header table',
  },
  {
    id: 'dst-bc-fixed-asset',
    name: 'FA_FixedAsset',
    category: 'destination',
    system: 'Destination (Dynamics 365 BC)',
    recordCount: 12500,
    primaryKey: 'No.',
    type: 'Business Central API',
    status: 'active',
    fieldsCount: 32,
    description: 'Fixed Asset ledger endpoint in Business Central Cloud',
  },
  {
    id: 'dst-sales-order-target',
    name: 'SalesOrder_Target',
    category: 'destination',
    system: 'Destination (S/4HANA)',
    recordCount: 1420000,
    primaryKey: 'SalesOrder_ID',
    type: 'OData Endpoint',
    status: 'active',
    fieldsCount: 50,
    description: 'Target S/4HANA Sales Order document table',
  },
  {
    id: 'dst-cust-360-view',
    name: 'Customer_360_Analytics',
    category: 'destination',
    system: 'Destination (BigQuery)',
    recordCount: 200000,
    primaryKey: 'Customer_Key',
    type: 'BigQuery Materialized View',
    status: 'active',
    fieldsCount: 110,
    description: 'Analytical data lakehouse view aggregating customer orders and lifetime value',
  },
];

const DEFAULT_LINKS: GraphLink[] = [
  // Source to Transformation
  {
    id: 'l-1',
    source: 'src-cust-master',
    target: 'tx-cust-dedupe',
    label: 'Extract & Cleanse',
    type: 'data_flow',
    throughput: '48.2k rec/s',
  },
  {
    id: 'l-2',
    source: 'src-pay-terms',
    target: 'src-cust-master',
    label: 'FK: Term_Code',
    type: 'fk',
    isMandatory: false,
  },
  {
    id: 'l-3',
    source: 'src-cust-master',
    target: 'src-sales-order-hdr',
    label: 'FK: Cust_ID (1:N)',
    type: 'fk',
    isMandatory: true,
  },
  {
    id: 'l-4',
    source: 'src-sales-order-hdr',
    target: 'tx-order-enricher',
    label: 'Stream Header Batch',
    type: 'data_flow',
    throughput: '1.4M rec/s',
  },
  {
    id: 'l-5',
    source: 'src-item-catalog',
    target: 'tx-order-enricher',
    label: 'Lookup SKU Details',
    type: 'transform',
  },
  {
    id: 'l-6',
    source: 'src-sales-order-line',
    target: 'tx-order-enricher',
    label: 'Join Order Lines',
    type: 'data_flow',
    throughput: '5.8M rec/s',
  },
  {
    id: 'l-7',
    source: 'src-vendor-master',
    target: 'tx-vendor-mapping',
    label: 'Map Vendor Keys',
    type: 'data_flow',
  },
  {
    id: 'l-8',
    source: 'src-item-catalog',
    target: 'tx-inventory-allocator',
    label: 'Stock Quantity Sync',
    type: 'data_flow',
  },

  // Transformation to Transformation / Destination
  {
    id: 'l-9',
    source: 'tx-cust-dedupe',
    target: 'dst-crm-account',
    label: 'UPSERT Account API',
    type: 'data_flow',
    throughput: '12k rec/s',
  },
  {
    id: 'l-10',
    source: 'tx-cust-dedupe',
    target: 'dst-cust-360-view',
    label: 'Populate LTV View',
    type: 'view_dependency',
  },
  {
    id: 'l-11',
    source: 'tx-order-enricher',
    target: 'dst-sales-order-target',
    label: 'Load Sales Orders',
    type: 'data_flow',
  },
  {
    id: 'l-12',
    source: 'tx-order-enricher',
    target: 'tx-invoice-calc',
    label: 'Pass Order Totals',
    type: 'transform',
    hasConflict: true,
  },
  {
    id: 'l-13',
    source: 'tx-invoice-calc',
    target: 'dst-s4-invoice-hdr',
    label: 'Post Financial Docs',
    type: 'data_flow',
    hasConflict: true,
  },
  {
    id: 'l-14',
    source: 'tx-vendor-mapping',
    target: 'dst-bc-fixed-asset',
    label: 'Sync Vendor Assets',
    type: 'data_flow',
  },
  {
    id: 'l-15',
    source: 'tx-inventory-allocator',
    target: 'dst-cust-360-view',
    label: 'Stock Inventory Feed',
    type: 'view_dependency',
  },

  // Circular / Conflict dependency link
  {
    id: 'l-16',
    source: 'dst-s4-invoice-hdr',
    target: 'src-sales-order-hdr',
    label: 'LOOP: Circular Ref_Order_No',
    type: 'fk',
    hasConflict: true,
  },
];

interface D3DependencyGraphProps {
  onSelectNode?: (node: GraphNode) => void;
  searchQuery?: string;
  systemFilter?: string;
}

export const D3DependencyGraph: React.FC<D3DependencyGraphProps> = ({ 
  onSelectNode,
  searchQuery = '',
  systemFilter = 'All'
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('src-cust-master');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simulatedFieldRename, setSimulatedFieldRename] = useState<string>('Cust_ID');
  const [showSimulateModal, setShowSimulateModal] = useState<boolean>(false);

  // Framer Motion Flow Tracing States
  const [isMigrationFlowActive, setIsMigrationFlowActive] = useState<boolean>(true);
  const [flowSpeedMultiplier, setFlowSpeedMultiplier] = useState<number>(1);
  const [flowIntensityFilter, setFlowIntensityFilter] = useState<'all' | 'high' | 'conflicts'>('all');
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>('l-6');
  const [linkPaths, setLinkPaths] = useState<ComputedLinkPath[]>([]);
  const rafRef = useRef<number | null>(null);
  const reactZoomGroupRef = useRef<SVGGElement | null>(null);

  // Trace mode: 'both' | 'upstream' | 'downstream'
  const [traceDirection, setTraceDirection] = useState<'both' | 'upstream' | 'downstream'>('both');

  // Compute Upstream & Downstream Sets for the selected node
  const activeFocusId = hoveredNodeId || selectedNodeId;

  const { upstreamNodeIds, downstreamNodeIds, highlightedLinkIds } = useMemo(() => {
    if (!activeFocusId) {
      return { upstreamNodeIds: new Set<string>(), downstreamNodeIds: new Set<string>(), highlightedLinkIds: new Set<string>() };
    }

    const upNodes = new Set<string>();
    const downNodes = new Set<string>();
    const activeLinks = new Set<string>();

    // Helper BFS for upstream (parents / sources)
    const findUpstream = (currId: string) => {
      DEFAULT_LINKS.forEach((link) => {
        const sId = typeof link.source === 'object' ? link.source.id : link.source;
        const tId = typeof link.target === 'object' ? link.target.id : link.target;

        if (tId === currId && !upNodes.has(sId)) {
          upNodes.add(sId);
          activeLinks.add(link.id);
          findUpstream(sId);
        }
      });
    };

    // Helper BFS for downstream (children / targets)
    const findDownstream = (currId: string) => {
      DEFAULT_LINKS.forEach((link) => {
        const sId = typeof link.source === 'object' ? link.source.id : link.source;
        const tId = typeof link.target === 'object' ? link.target.id : link.target;

        if (sId === currId && !downNodes.has(tId)) {
          downNodes.add(tId);
          activeLinks.add(link.id);
          findDownstream(tId);
        }
      });
    };

    if (traceDirection === 'both' || traceDirection === 'upstream') {
      findUpstream(activeFocusId);
    }
    if (traceDirection === 'both' || traceDirection === 'downstream') {
      findDownstream(activeFocusId);
    }

    return { upstreamNodeIds: upNodes, downstreamNodeIds: downNodes, highlightedLinkIds: activeLinks };
  }, [activeFocusId, traceDirection]);

  const selectedNodeObj = useMemo(() => {
    return DEFAULT_NODES.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId]);

  const filteredLinkPaths = useMemo(() => {
    return linkPaths.filter((link) => {
      // If a node is focused, we only show paths that are part of the active trace
      if (activeFocusId && !highlightedLinkIds.has(link.id)) {
        return false;
      }
      
      // Filter by intensity/conflict
      if (flowIntensityFilter === 'high') return link.throughputVal >= 1000000;
      if (flowIntensityFilter === 'conflicts') return link.hasConflict;
      return true;
    });
  }, [linkPaths, flowIntensityFilter, activeFocusId, highlightedLinkIds]);

  const totalLinkCount = DEFAULT_LINKS.length;

  const selectedLinkObj = useMemo(() => {
    return linkPaths.find((l) => l.id === selectedLinkId) || null;
  }, [linkPaths, selectedLinkId]);

  // Main D3 Rendering Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = 640;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Create deep copies of nodes and links for D3 simulation
    // Filter nodes based on searchQuery and systemFilter
    const filteredNodesData = DEFAULT_NODES.filter((n) => {
      const matchesSystem = systemFilter === 'All' || n.system.toLowerCase().includes(systemFilter.toLowerCase());
      const matchesSearch = 
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.primaryKey.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSystem && matchesSearch;
    });

    const nodesData: GraphNode[] = filteredNodesData.map((n) => ({ ...n }));
    
    // Filter links to only those whose source and target exist in filteredNodesData
    const activeNodeIds = new Set(filteredNodesData.map(n => n.id));
    const filteredLinksData = DEFAULT_LINKS.filter(l => {
      const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return activeNodeIds.has(sId) && activeNodeIds.has(tId);
    });

    const linksData: GraphLink[] = filteredLinksData.map((l) => ({ ...l }));

    // Define column X targets to layout Source (Left), Transformation (Center), Destination (Right)
    const colSourceX = width * 0.18;
    const colTransformX = width * 0.50;
    const colDestX = width * 0.82;

    nodesData.forEach((node, idx) => {
      if (node.category === 'source') {
        node.x = colSourceX;
        node.y = 80 + (idx % 6) * 75;
      } else if (node.category === 'transformation') {
        node.x = colTransformX;
        node.y = 80 + (idx % 5) * 90;
      } else {
        node.x = colDestX;
        node.y = 80 + (idx % 5) * 90;
      }
    });

    // Root Group for Zoom
    const g = svg.append('g').attr('class', 'zoom-group');

    // Setup D3 Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        if (reactZoomGroupRef.current) {
          d3.select(reactZoomGroupRef.current).attr('transform', event.transform);
        }
      });

    svg.call(zoom);

    // SVG Definitions (Arrowheads, Gradients, Filters)
    const defs = svg.append('defs');

    // Grid pattern
    const pattern = defs.append('pattern')
      .attr('id', 'd3-grid')
      .attr('width', 24)
      .attr('height', 24)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('path')
      .attr('d', 'M 24 0 L 0 0 0 24')
      .attr('fill', 'none')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 0.5);

    // Standard Arrow Marker
    defs.append('marker')
      .attr('id', 'marker-default')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#64748b');

    // Upstream Active Arrow Marker
    defs.append('marker')
      .attr('id', 'marker-upstream')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#f59e0b');

    // Downstream Active Arrow Marker
    defs.append('marker')
      .attr('id', 'marker-downstream')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#10b981');

    // Conflict Arrow Marker
    defs.append('marker')
      .attr('id', 'marker-conflict')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#f43f5e');

    // Draw background grid
    g.append('rect')
      .attr('x', -width * 2)
      .attr('y', -height * 2)
      .attr('width', width * 5)
      .attr('height', height * 5)
      .attr('fill', 'url(#d3-grid)');

    // Column Header Background Bands
    const bandGroup = g.append('g').attr('class', 'column-bands');

    const bands = [
      { label: 'SOURCE TABLES', x: colSourceX, color: '#6366f1', textCol: '#4338ca', sub: 'Legacy ERP & Databases' },
      { label: 'TRANSFORMATION PIPELINES', x: colTransformX, color: '#3b82f6', textCol: '#1d4ed8', sub: 'dbt, Spark & Stream Rules' },
      { label: 'DESTINATION SCHEMAS', x: colDestX, color: '#10b981', textCol: '#047857', sub: 'CRM, Lakehouse & Cloud Targets' },
    ];

    bands.forEach((b) => {
      bandGroup.append('rect')
        .attr('x', b.x - 120)
        .attr('y', 10)
        .attr('width', 240)
        .attr('height', height - 20)
        .attr('rx', 24)
        .attr('fill', b.color)
        .attr('fill-opacity', 0.04)
        .attr('stroke', '#e2e8f0')
        .attr('stroke-dasharray', '8 4')
        .attr('stroke-width', 1);

      bandGroup.append('text')
        .attr('x', b.x)
        .attr('y', 36)
        .attr('text-anchor', 'middle')
        .attr('fill', b.textCol)
        .attr('font-size', '10px')
        .attr('font-weight', '900')
        .attr('letter-spacing', '0.1em')
        .attr('font-family', 'monospace')
        .text(b.label);

      bandGroup.append('text')
        .attr('x', b.x)
        .attr('y', 48)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .attr('font-family', 'sans-serif')
        .text(b.sub);
    });

    // Setup Force Simulation
    const simulation = d3.forceSimulation<GraphNode>(nodesData)
      .force(
        'link',
        d3.forceLink<GraphNode, GraphLink>(linksData)
          .id((d) => d.id)
          .distance(160)
          .strength(0.2)
      )
      .force('charge', d3.forceManyBody().strength(-380))
      .force('collide', d3.forceCollide().radius(50))
      .force(
        'x',
        d3.forceX<GraphNode>((d) => {
          if (d.category === 'source') return colSourceX;
          if (d.category === 'transformation') return colTransformX;
          return colDestX;
        }).strength(0.8)
      )
      .force(
        'y',
        d3.forceY<GraphNode>(() => height / 2).strength(0.08)
      );

    // Draw Links Group
    const linkGroup = g.append('g').attr('class', 'links-group');

    const linkPath = linkGroup
      .selectAll<SVGPathElement, GraphLink>('path')
      .data(linksData)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke-width', (d) => (d.hasConflict ? 2.5 : 1.8))
      .attr('opacity', (d) => {
        // Link visibility logic: Trace + Filter
        if (activeFocusId && !highlightedLinkIds.has(d.id)) return 0.05;
        
        if (flowIntensityFilter === 'high') {
          let tpVal = 0;
          if (d.throughput) {
            if (d.throughput.includes('M')) tpVal = parseFloat(d.throughput) * 1000000;
            else if (d.throughput.includes('k')) tpVal = parseFloat(d.throughput) * 1000;
          }
          if (tpVal < 1000000) return 0.1;
        }
        
        if (flowIntensityFilter === 'conflicts' && !d.hasConflict) return 0.1;
        
        return 1;
      })
      .attr('marker-end', (d) => {
        if (d.hasConflict) return 'url(#marker-conflict)';
        if (highlightedLinkIds.has(d.id)) {
          const sId = typeof d.source === 'object' ? d.source.id : d.source;
          return upstreamNodeIds.has(sId) ? 'url(#marker-upstream)' : 'url(#marker-downstream)';
        }
        return 'url(#marker-default)';
      })
      .attr('stroke', (d) => {
        if (d.hasConflict) return '#f43f5e';
        if (highlightedLinkIds.has(d.id)) {
          const sId = typeof d.source === 'object' ? d.source.id : d.source;
          return upstreamNodeIds.has(sId) ? '#f59e0b' : '#10b981';
        }
        return '#cbd5e1';
      })
      .attr('stroke-dasharray', (d) => (d.hasConflict ? '5,5' : d.type === 'view_dependency' ? '3,3' : 'none'));

    // Link Labels
    const linkLabelGroup = g.append('g').attr('class', 'link-labels-group');

    const linkLabels = linkLabelGroup
      .selectAll<SVGTextElement, GraphLink>('text')
      .data(linksData)
      .enter()
      .append('text')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('text-anchor', 'middle')
      .attr('opacity', (d) => {
        if (!activeFocusId) return 1;
        return highlightedLinkIds.has(d.id) || d.hasConflict ? 1 : 0.05;
      })
      .attr('fill', (d) => (d.hasConflict ? '#f43f5e' : highlightedLinkIds.has(d.id) ? '#475569' : '#94a3b8'))
      .attr('font-weight', (d) => (highlightedLinkIds.has(d.id) || d.hasConflict ? 'bold' : 'normal'))
      .text((d) => d.label);

    // Draw Nodes Group
    const nodeGroup = g.append('g').attr('class', 'nodes-group');

    const nodesSel = nodeGroup
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodesData)
      .enter()
      .append('g')
      .attr('class', 'node-item')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNodeId(d.id);
        if (onSelectNode) onSelectNode(d);
      })
      .on('mouseenter', (event, d) => {
        setHoveredNodeId(d.id);
      })
      .on('mouseleave', () => {
        setHoveredNodeId(null);
      });

    // Drag behavior
    const dragBehavior = d3
      .drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active && isSimulating) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active && isSimulating) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodesSel.call(dragBehavior);

    // Node Container Rectangles
    nodesSel
      .append('rect')
      .attr('width', 160)
      .attr('height', 52)
      .attr('rx', 12)
      .attr('x', -80)
      .attr('y', -26)
      .attr('opacity', (d) => {
        if (!activeFocusId) return 1;
        return d.id === activeFocusId || upstreamNodeIds.has(d.id) || downstreamNodeIds.has(d.id) ? 1 : 0.2;
      })
      .attr('fill', (d) => {
        if (d.id === activeFocusId) return '#ffffff';
        if (upstreamNodeIds.has(d.id)) return '#fffbeb';
        if (downstreamNodeIds.has(d.id)) return '#f0fdf4';
        return '#ffffff';
      })
      .attr('stroke', (d) => {
        if (d.id === selectedNodeId) return '#6366f1';
        if (d.id === hoveredNodeId) return '#38bdf8';
        if (upstreamNodeIds.has(d.id)) return '#f59e0b';
        if (downstreamNodeIds.has(d.id)) return '#10b981';
        if (d.status === 'error') return '#f43f5e';
        if (d.status === 'warning') return '#f59e0b';
        return d.category === 'source' ? '#3b82f6' : d.category === 'transformation' ? '#06b6d4' : '#10b981';
      })
      .attr('stroke-width', (d) => (d.id === activeFocusId || d.id === selectedNodeId ? 2.5 : 1.5))
      .attr('filter', (d) => (d.id === activeFocusId ? 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.15))' : 'none'));

    // Category Color Pill Icon
    nodesSel
      .append('circle')
      .attr('cx', -64)
      .attr('cy', -8)
      .attr('r', 5)
      .attr('opacity', (d) => {
        if (!activeFocusId) return 1;
        return d.id === activeFocusId || upstreamNodeIds.has(d.id) || downstreamNodeIds.has(d.id) ? 1 : 0.2;
      })
      .attr('fill', (d) => (d.category === 'source' ? '#3b82f6' : d.category === 'transformation' ? '#06b6d4' : '#10b981'));

    // Node Name Text
    nodesSel
      .append('text')
      .attr('x', -54)
      .attr('y', -5)
      .attr('opacity', (d) => {
        if (!activeFocusId) return 1;
        return d.id === activeFocusId || upstreamNodeIds.has(d.id) || downstreamNodeIds.has(d.id) ? 1 : 0.2;
      })
      .attr('fill', '#1e293b')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif')
      .text((d) => (d.name.length > 18 ? d.name.substring(0, 16) + '..' : d.name));

    // Node Subtitle / Records Count
    nodesSel
      .append('text')
      .attr('x', -54)
      .attr('y', 12)
      .attr('opacity', (d) => {
        if (!activeFocusId) return 1;
        return d.id === activeFocusId || upstreamNodeIds.has(d.id) || downstreamNodeIds.has(d.id) ? 1 : 0.2;
      })
      .attr('fill', (d) => (upstreamNodeIds.has(d.id) ? '#b45309' : downstreamNodeIds.has(d.id) ? '#047857' : '#64748b'))
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text((d) => `${d.recordCount.toLocaleString()} recs • PK: ${d.primaryKey}`);

    // Upstream / Downstream Badge Tag
    nodesSel
      .filter((d) => d.id === activeFocusId || upstreamNodeIds.has(d.id) || downstreamNodeIds.has(d.id))
      .append('rect')
      .attr('x', 30)
      .attr('y', -24)
      .attr('width', 46)
      .attr('height', 14)
      .attr('rx', 4)
      .attr('fill', (d) => (d.id === activeFocusId ? '#4f46e5' : upstreamNodeIds.has(d.id) ? '#b45309' : '#047857'));

    nodesSel
      .filter((d) => d.id === activeFocusId || upstreamNodeIds.has(d.id) || downstreamNodeIds.has(d.id))
      .append('text')
      .attr('x', 53)
      .attr('y', -14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '8px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif')
      .text((d) => (d.id === activeFocusId ? 'FOCUS' : upstreamNodeIds.has(d.id) ? 'UPSTREAM' : 'DOWNSTREAM'));

    // Simulation Ticker
    simulation.on('tick', () => {
      const currentLinkPaths: ComputedLinkPath[] = [];

      linkPath.attr('d', (d) => {
        const s = d.source as GraphNode;
        const t = d.target as GraphNode;
        if (!s.x || !s.y || !t.x || !t.y) return '';

        // Curved bezier path
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const cx1 = s.x + dx * 0.4;
        const cy1 = s.y;
        const cx2 = s.x + dx * 0.6;
        const cy2 = t.y;
        const pathD = `M ${s.x} ${s.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${t.x} ${t.y}`;

        let tpVal = 1000;
        if (d.throughput) {
          if (d.throughput.includes('M')) tpVal = parseFloat(d.throughput) * 1000000;
          else if (d.throughput.includes('k')) tpVal = parseFloat(d.throughput) * 1000;
        }

        const sName = typeof d.source === 'object' ? d.source.name : String(d.source);
        const tName = typeof d.target === 'object' ? d.target.name : String(d.target);

        currentLinkPaths.push({
          id: d.id,
          sourceId: s.id,
          targetId: t.id,
          sourceName: sName,
          targetName: tName,
          d: pathD,
          sx: s.x,
          sy: s.y,
          tx: t.x,
          ty: t.y,
          cx1,
          cy1,
          cx2,
          cy2,
          throughput: d.throughput,
          throughputVal: tpVal,
          hasConflict: d.hasConflict,
          type: d.type,
          label: d.label,
        });

        return pathD;
      });

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setLinkPaths(currentLinkPaths);
          rafRef.current = null;
        });
      }

      linkLabels
        .attr('x', (d) => {
          const s = d.source as GraphNode;
          const t = d.target as GraphNode;
          return s.x && t.x ? (s.x + t.x) / 2 : 0;
        })
        .attr('y', (d) => {
          const s = d.source as GraphNode;
          const t = d.target as GraphNode;
          return s.y && t.y ? (s.y + t.y) / 2 - 4 : 0;
        });

      nodesSel.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    if (!isSimulating) {
      simulation.stop();
    }

    return () => {
      simulation.stop();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    activeFocusId,
    upstreamNodeIds,
    downstreamNodeIds,
    highlightedLinkIds,
    isSimulating,
    onSelectNode,
    selectedNodeId,
    hoveredNodeId,
    flowIntensityFilter,
    searchQuery,
    systemFilter,
  ]);

  // Handle Zoom In / Zoom Out / Reset manually
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.2);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.8);
  };

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(400).call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
  };

  return (
    <div className="space-y-4">
      {/* Interactive Control Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
            <Workflow className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              D3.JS LINEAGE & IMPACT VISUALIZER
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl font-medium leading-relaxed">
              Click any node or animated path stream to trace <span className="text-indigo-600 font-bold">upstream source dependencies</span>, <span className="text-emerald-600 font-bold">downstream impacts</span>, and live transfer intensity.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Trace Direction Toggle */}
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setTraceDirection('both')}
              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] cursor-pointer transition-all flex items-center gap-1.5 uppercase tracking-tighter ${
                traceDirection === 'both' ? 'bg-indigo-600 text-white shadow-sm scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white'
              }`}
            >
              <GitFork className={`w-3 h-3 ${traceDirection === 'both' ? 'text-white' : 'text-slate-400'}`} />
              Full Trace
            </button>
            <button
              type="button"
              onClick={() => setTraceDirection('upstream')}
              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] cursor-pointer transition-all flex items-center gap-1.5 uppercase tracking-tighter ${
                traceDirection === 'upstream' ? 'bg-amber-600 text-white shadow-sm scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white'
              }`}
            >
              <ArrowUpRight className={`w-3 h-3 ${traceDirection === 'upstream' ? 'text-white' : 'text-slate-400'}`} />
              Upstream
            </button>
            <button
              type="button"
              onClick={() => setTraceDirection('downstream')}
              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] cursor-pointer transition-all flex items-center gap-1.5 uppercase tracking-tighter ${
                traceDirection === 'downstream' ? 'bg-emerald-600 text-white shadow-sm scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white'
              }`}
            >
              <ArrowRight className={`w-3 h-3 ${traceDirection === 'downstream' ? 'text-white' : 'text-slate-400'}`} />
              Downstream
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowSimulateModal(true);
              // Brief animation trigger
              const btn = document.activeElement as HTMLElement;
              btn?.classList.add('animate-ping');
              setTimeout(() => btn?.classList.remove('animate-ping'), 400);
            }}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-xl border border-indigo-200 flex items-center gap-2 cursor-pointer transition-all shadow-2xs uppercase tracking-tighter"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Simulate Schema Drift</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`p-2 rounded-xl font-bold flex items-center justify-center transition-all border cursor-pointer shadow-2xs ${
              isSimulating ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-emerald-600 text-white border-emerald-500'
            }`}
            title={isSimulating ? 'Pause physics layout' : 'Play physics layout'}
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Framer Motion Migration Data Flow Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsMigrationFlowActive(!isMigrationFlowActive)}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-all border shadow-2xs ${
              isMigrationFlowActive
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            <Radio className={`w-4 h-4 ${isMigrationFlowActive ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />
            <span>{isMigrationFlowActive ? 'Live Stream Active' : 'Stream Paused'}</span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Velocity Speed Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Velocity:</span>
            {[
              { label: '1XBATCH', val: 1 },
              { label: '2XPIPELINE', val: 2 },
              { label: '5XTURBO', val: 5 },
            ].map((sp) => (
              <button
                key={sp.val}
                type="button"
                onClick={() => setFlowSpeedMultiplier(sp.val)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all border shadow-2xs tracking-tighter ${
                  flowSpeedMultiplier === sp.val
                    ? 'bg-indigo-600 text-white border-indigo-500 scale-105 shadow-md'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Intensity Filter */}
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Flow Filter:</span>
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setFlowIntensityFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all tracking-tighter flex items-center gap-2 ${
                flowIntensityFilter === 'all' 
                  ? 'bg-slate-100 text-indigo-700 shadow-inner' 
                  : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <Filter className={`w-3 h-3 ${flowIntensityFilter === 'all' ? 'text-indigo-600' : 'text-slate-400'}`} />
              ALL ({totalLinkCount})
            </button>
            <button
              type="button"
              onClick={() => setFlowIntensityFilter('high')}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all tracking-tighter flex items-center gap-2 ${
                flowIntensityFilter === 'high' 
                  ? 'bg-emerald-600 text-white shadow-md scale-105' 
                  : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <Zap className={`w-3 h-3 ${flowIntensityFilter === 'high' ? 'text-white' : 'text-emerald-500'}`} />
              HIGH VOL
            </button>
            <button
              type="button"
              onClick={() => setFlowIntensityFilter('conflicts')}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all tracking-tighter flex items-center gap-2 ${
                flowIntensityFilter === 'conflicts' 
                  ? 'bg-rose-600 text-white shadow-md scale-105' 
                  : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
              }`}
            >
              <ShieldAlert className={`w-3 h-3 ${flowIntensityFilter === 'conflicts' ? 'text-white' : 'text-rose-500'}`} />
              CONFLICTS
            </button>
          </div>
        </div>
      </div>


      {/* Main Grid: D3 SVG Canvas (Left) + Upstream/Downstream Impact Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: D3 Interactive SVG Canvas with Framer Motion Path Overlay */}
        <div ref={containerRef} className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden relative flex flex-col justify-between min-h-[640px]">
          {/* Floating Zoom Bar */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 text-slate-600 shadow-sm">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-indigo-600" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-indigo-600" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-indigo-600"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* SVG Canvas Element */}
          <svg ref={svgRef} className="w-full h-[640px] select-none">
            {/* Grid Pattern Background */}
            <defs>
              <pattern id="grid-light" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-light)" />
            
            {/* Framer Motion Animated Path Tracing Overlay */}
            <g ref={reactZoomGroupRef} className="framer-motion-flow-overlay">
              {filteredLinkPaths.map((link) => (
                <FramerMotionPathFlow
                  key={link.id}
                  link={link}
                  isMigrationActive={isMigrationFlowActive}
                  flowSpeed={flowSpeedMultiplier}
                  isSelected={selectedLinkId === link.id}
                  onSelect={() => setSelectedLinkId(link.id)}
                />
              ))}
            </g>
          </svg>

          {/* Bottom Canvas Footer Legend */}
          <div className="bg-white/80 backdrop-blur-md px-5 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
                Source Tables ({DEFAULT_NODES.filter((n) => n.category === 'source').length})
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
                Pipelines ({DEFAULT_NODES.filter((n) => n.category === 'transformation').length})
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                Destinations ({DEFAULT_NODES.filter((n) => n.category === 'destination').length})
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-indigo-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Active Streams: {filteredLinkPaths.length}
              </span>
              <span className="text-amber-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Upstream: {upstreamNodeIds.size}
              </span>
              <span className="text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Downstream: {downstreamNodeIds.size}
              </span>
            </div>
          </div>
        </div>


        {/* Right 1 Col: Upstream & Downstream Impact Trace Inspector */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                  Impact Trace Inspector
                </h3>
              </div>
              {selectedNodeObj && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border uppercase ${
                    selectedNodeObj.category === 'source'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : selectedNodeObj.category === 'transformation'
                      ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {selectedNodeObj.category}
                </span>
              )}
            </div>

            {selectedNodeObj ? (
              <div className="space-y-4">
                {/* Node Focus Header */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between relative z-10">
                    <span className="font-bold text-xs text-indigo-600 flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 rounded-lg">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      {selectedNodeObj.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100 shadow-sm">
                      PK: {selectedNodeObj.primaryKey}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium relative z-10">{selectedNodeObj.description}</p>
                  <div className="flex items-center justify-between pt-2 text-[10px] font-bold text-slate-500 border-t border-slate-100 relative z-10">
                    <span className="uppercase tracking-wider">System: {selectedNodeObj.system}</span>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      {selectedNodeObj.recordCount.toLocaleString()} rows
                    </span>
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full -mr-8 -mt-8" />
                </div>


                {/* Upstream Dependencies Box */}
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                    <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-amber-600 rotate-180" />
                      Upstream Sources ({upstreamNodeIds.size})
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-700">Origin Data</span>
                  </div>

                  {upstreamNodeIds.size > 0 ? (
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {Array.from(upstreamNodeIds).map((upId) => {
                        const upNode = DEFAULT_NODES.find((n) => n.id === upId);
                        if (!upNode) return null;
                        return (
                          <div
                            key={upId}
                            onClick={() => setSelectedNodeId(upId)}
                            className="p-2 bg-white rounded-lg border border-amber-200/80 hover:border-amber-400 text-xs flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900 font-mono text-[11px]">{upNode.name}</span>
                              <span className="block text-[10px] text-slate-500 font-sans">{upNode.system}</span>
                            </div>
                            <span className="text-[10px] font-mono text-amber-700 font-bold">
                              {upNode.recordCount.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-800 italic">No upstream tables. This node is a root data source.</p>
                  )}
                </div>

                {/* Downstream Impact Box */}
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                    <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                      Downstream Impacted ({downstreamNodeIds.size})
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700">Affected Targets</span>
                  </div>

                  {downstreamNodeIds.size > 0 ? (
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {Array.from(downstreamNodeIds).map((downId) => {
                        const downNode = DEFAULT_NODES.find((n) => n.id === downId);
                        if (!downNode) return null;
                        return (
                          <div
                            key={downId}
                            onClick={() => setSelectedNodeId(downId)}
                            className="p-2 bg-white rounded-lg border border-emerald-200/80 hover:border-emerald-400 text-xs flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900 font-mono text-[11px]">{downNode.name}</span>
                              <span className="block text-[10px] text-slate-500 font-sans">{downNode.system}</span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-700 font-bold">
                              {downNode.recordCount.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-800 italic">No downstream dependencies. This is a terminal target node.</p>
                  )}
                </div>

                {/* Active Data Stream Inspector Box */}
                {selectedLinkObj && (
                  <div className="p-3 bg-slate-900 text-slate-100 rounded-xl border border-cyan-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5 font-mono">
                        <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        Selected Stream: {selectedLinkObj.id}
                      </span>
                      <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px] font-mono font-bold rounded">
                        {selectedLinkObj.throughput || '1.2M rec/s'}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Route:</span>
                        <span className="font-bold text-white truncate max-w-[170px]">
                          {selectedLinkObj.sourceName} &rarr; {selectedLinkObj.targetName}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Label:</span>
                        <span className="text-cyan-200 font-bold">{selectedLinkObj.label}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Stream Status:</span>
                        <span className={selectedLinkObj.hasConflict ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {selectedLinkObj.hasConflict ? 'CIRCULAR HAZARD' : 'STREAMING ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Select any node on the D3 network graph to inspect detailed lineage impacts.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-[10px] text-indigo-600 font-bold">D3 Force Layout Active</span>
            <span className="text-[10px] text-slate-400">Drag nodes to rearrange</span>
          </div>
        </div>
      </div>

      {/* Field Schema Rename / Change Simulation Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm tracking-tight">Simulate Upstream Schema Field Change</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Source Field to Modify</label>
                <select
                  value={simulatedFieldRename}
                  onChange={(e) => setSimulatedFieldRename(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                >
                  <option value="Cust_ID">Customer_Master.Cust_ID (Primary Key Rename)</option>
                  <option value="Order_No">Sales_Order_Header.Order_No (Foreign Key Type Shift)</option>
                  <option value="Item_SKU">Item_Catalog.Item_SKU (Composite Key Splitting)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-xs text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Predicted Downstream Impact Summary</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] font-mono text-amber-800">
                  <li>3 Transformation rules will require re-mapping (`ETL_Customer_Dedupe`, `Order_Header_Enricher`).</li>
                  <li>2 Destination schemas (`Account_Master_CRM`, `Customer_360_Analytics`) will experience null lookup errors.</li>
                  <li>Total affected records: ~1,520,250 rows across 5 dependent systems.</li>
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSimulateModal(false);
                    setSelectedNodeId('src-cust-master');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Highlight Impact Path
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
