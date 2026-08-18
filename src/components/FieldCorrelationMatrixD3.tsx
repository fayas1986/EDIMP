import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import {
  Connector,
  ConnectorDataProfile,
  EntityProfileSummary,
  EntityCorrelationMatrix,
  FieldCorrelationCell,
  MultivariateDependency,
} from '../types';
import {
  generateEntityCorrelationMatrix,
  DATA_TYPE_COLORS,
} from '../services/dataProfilingService';
import {
  Network,
  Filter,
  ArrowUpDown,
  Sliders,
  Search,
  Download,
  Info,
  Sparkles,
  Layers,
  HelpCircle,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  Activity,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  FileSpreadsheet,
  ChevronRight,
  RefreshCw,
  Share2,
} from 'lucide-react';

interface FieldCorrelationMatrixD3Props {
  connector: Connector;
  profile: ConnectorDataProfile;
}

type SortMode = 'schema' | 'alpha' | 'clustered' | 'type';
type PaletteMode = 'indigo-red' | 'emerald-rose' | 'sky-amber';

// Framer Motion staggered entrance variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export const FieldCorrelationMatrixD3: React.FC<FieldCorrelationMatrixD3Props> = ({
  connector,
  profile,
}) => {
  // Available entities
  const entities = profile.entityProfiles || [];
  const [selectedEntityName, setSelectedEntityName] = useState<string>(
    entities[0]?.entityName || 'Entity_Master'
  );

  // Active Entity and its correlation matrix
  const activeEntity: EntityProfileSummary | undefined = useMemo(() => {
    return entities.find((e) => e.entityName === selectedEntityName) || entities[0];
  }, [entities, selectedEntityName]);

  const activeMatrix: EntityCorrelationMatrix = useMemo(() => {
    const fromProfile = profile.correlationMatrices?.find(
      (m) => m.entityName === selectedEntityName
    );
    if (fromProfile) return fromProfile;

    if (activeEntity) {
      return generateEntityCorrelationMatrix(activeEntity, connector.category || 'ERP');
    }

    return {
      entityName: selectedEntityName,
      fields: [],
      fieldTypes: {},
      correlations: [],
      calculatedAt: new Date().toISOString(),
      strongestCorrelations: [],
      multivariateDependencies: [],
    };
  }, [profile.correlationMatrices, selectedEntityName, activeEntity, connector.category]);

  // Controls State
  const [sortMode, setSortMode] = useState<SortMode>('clustered');
  const [threshold, setThreshold] = useState<number>(0.0);
  const [filterType, setFilterType] = useState<'all' | 'numeric' | 'categorical' | 'strong' | 'negative'>('all');
  const [fieldSearch, setFieldSearch] = useState<string>('');
  const [palette, setPalette] = useState<PaletteMode>('indigo-red');
  const [hoveredCell, setHoveredCell] = useState<FieldCorrelationCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<FieldCorrelationCell | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'strongest' | 'multivariate'>('matrix');

  // SVG & Tooltip Refs
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const scatterSvgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(750);

  // Resize Observer to handle dynamic container widths
  useEffect(() => {
    if (!svgContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.max(580, Math.floor(entry.contentRect.width)));
        }
      }
    });
    observer.observe(svgContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Ordered fields based on sortMode
  const orderedFields = useMemo(() => {
    const rawFields = [...activeMatrix.fields];
    if (rawFields.length === 0) return [];

    if (sortMode === 'alpha') {
      return rawFields.sort((a, b) => a.localeCompare(b));
    }

    if (sortMode === 'type') {
      return rawFields.sort((a, b) => {
        const tA = activeMatrix.fieldTypes[a] || '';
        const tB = activeMatrix.fieldTypes[b] || '';
        if (tA === tB) return a.localeCompare(b);
        return tA.localeCompare(tB);
      });
    }

    if (sortMode === 'clustered') {
      // Simple hierarchical clustering heuristic: sort by average correlation vector similarity
      const avgCorr: Record<string, number> = {};
      rawFields.forEach((f1) => {
        let sum = 0;
        let count = 0;
        activeMatrix.correlations.forEach((c) => {
          if (c.sourceField === f1 && c.targetField !== f1) {
            sum += c.coefficient;
            count++;
          }
        });
        avgCorr[f1] = count > 0 ? sum / count : 0;
      });
      return rawFields.sort((a, b) => (avgCorr[b] || 0) - (avgCorr[a] || 0));
    }

    // Default 'schema'
    return rawFields;
  }, [activeMatrix, sortMode]);

  // Color Interpolator Setup
  const colorScale = useMemo(() => {
    if (palette === 'emerald-rose') {
      return d3.scaleDiverging<string>()
        .domain([-1, 0, 1])
        .interpolator((t) => {
          // t from 0 to 1
          // 0 is -1 (Rose #f43f5e), 0.5 is 0 (Neutral #f8fafc), 1 is +1 (Emerald #10b981)
          if (t < 0.5) {
            return d3.interpolateRgb('#f43f5e', '#f8fafc')(t * 2);
          }
          return d3.interpolateRgb('#f8fafc', '#10b981')((t - 0.5) * 2);
        });
    }

    if (palette === 'sky-amber') {
      return d3.scaleDiverging<string>()
        .domain([-1, 0, 1])
        .interpolator((t) => {
          if (t < 0.5) {
            return d3.interpolateRgb('#f59e0b', '#f8fafc')(t * 2);
          }
          return d3.interpolateRgb('#f8fafc', '#0284c7')((t - 0.5) * 2);
        });
    }

    // Standard 'indigo-red'
    return d3.scaleDiverging<string>()
      .domain([-1, 0, 1])
      .interpolator((t) => {
        if (t < 0.5) {
          return d3.interpolateRgb('#ef4444', '#f8fafc')(t * 2);
        }
        return d3.interpolateRgb('#f8fafc', '#4f46e5')((t - 0.5) * 2);
      });
  }, [palette]);

  // Map of cells for O(1) coordinate lookup
  const cellMap = useMemo(() => {
    const map = new Map<string, FieldCorrelationCell>();
    activeMatrix.correlations.forEach((cell) => {
      map.set(`${cell.sourceField}:::${cell.targetField}`, cell);
    });
    return map;
  }, [activeMatrix.correlations]);

  // Render Main D3 Correlation Heatmap Matrix
  useEffect(() => {
    if (!svgRef.current || orderedFields.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const n = orderedFields.length;
    // Calculate sizing
    const margin = { top: 120, right: 30, bottom: 40, left: 140 };
    const availableWidth = containerWidth - margin.left - margin.right;
    
    // Adaptive cell size: minimum 32px, max 54px
    const dynamicCellSize = Math.max(30, Math.min(54, Math.floor(availableWidth / n)));
    const matrixWidth = dynamicCellSize * n;
    const matrixHeight = dynamicCellSize * n;
    const totalSvgWidth = matrixWidth + margin.left + margin.right;
    const totalSvgHeight = matrixHeight + margin.top + margin.bottom;

    svg
      .attr('width', totalSvgWidth)
      .attr('height', totalSvgHeight)
      .attr('viewBox', `0 0 ${totalSvgWidth} ${totalSvgHeight}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // D3 Band Scales
    const x = d3.scaleBand().domain(orderedFields).range([0, matrixWidth]).padding(0.06);
    const y = d3.scaleBand().domain(orderedFields).range([0, matrixHeight]).padding(0.06);

    // Crosshair Guides Layer
    const crosshairGroup = g.append('g').attr('class', 'crosshair-guides');
    const colGuide = crosshairGroup
      .append('rect')
      .attr('class', 'col-guide')
      .attr('fill', '#e0e7ff')
      .attr('opacity', 0)
      .attr('y', 0)
      .attr('height', matrixHeight)
      .attr('pointer-events', 'none')
      .attr('rx', 4);

    const rowGuide = crosshairGroup
      .append('rect')
      .attr('class', 'row-guide')
      .attr('fill', '#e0e7ff')
      .attr('opacity', 0)
      .attr('x', 0)
      .attr('width', matrixWidth)
      .attr('pointer-events', 'none')
      .attr('rx', 4);

    // Grid Cells Layer
    const cellsGroup = g.append('g').attr('class', 'heatmap-cells');

    // Build data list for all pairs
    const gridData: Array<{
      source: string;
      target: string;
      cell: FieldCorrelationCell;
      x: number;
      y: number;
      w: number;
      h: number;
      isDiagonal: boolean;
    }> = [];

    orderedFields.forEach((f1) => {
      orderedFields.forEach((f2) => {
        const cellData = cellMap.get(`${f1}:::${f2}`) || {
          sourceField: f1,
          targetField: f2,
          sourceType: activeMatrix.fieldTypes[f1] || 'String',
          targetType: activeMatrix.fieldTypes[f2] || 'String',
          coefficient: f1 === f2 ? 1.0 : 0.0,
          absCoefficient: f1 === f2 ? 1.0 : 0.0,
          pVal: 0.001,
          sampleSize: activeEntity?.rowCount || 1000,
          strength: f1 === f2 ? 'Very Strong' : 'None',
          metricMethod: 'Pearson (Numeric)',
          relationshipCategory: 'Orthogonal / Independent',
          significance: 'Low / Insignificant',
          description: '',
        };

        const cellX = x(f2) || 0;
        const cellY = y(f1) || 0;
        const w = x.bandwidth();
        const h = y.bandwidth();

        gridData.push({
          source: f1,
          target: f2,
          cell: cellData,
          x: cellX,
          y: cellY,
          w,
          h,
          isDiagonal: f1 === f2,
        });
      });
    });

    // Draw Heatmap Rectangles
    const cellSelection = cellsGroup
      .selectAll('g.matrix-cell')
      .data(gridData)
      .enter()
      .append('g')
      .attr('class', 'matrix-cell')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer');

    cellSelection
      .append('rect')
      .attr('width', (d) => d.w)
      .attr('height', (d) => d.h)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', (d) => {
        if (d.isDiagonal) return '#e2e8f0'; // Clean slate diagonal
        return colorScale(d.cell.coefficient);
      })
      .attr('stroke', (d) => {
        if (
          selectedCell &&
          selectedCell.sourceField === d.source &&
          selectedCell.targetField === d.target
        ) {
          return '#1e1b4b'; // Selected highlight ring
        }
        return '#ffffff';
      })
      .attr('stroke-width', (d) => {
        if (
          selectedCell &&
          selectedCell.sourceField === d.source &&
          selectedCell.targetField === d.target
        ) {
          return 2.5;
        }
        return 1;
      })
      .attr('opacity', (d) => {
        // Filter rules
        if (d.isDiagonal) return 0.9;
        const absCoeff = d.cell.absCoefficient;

        if (absCoeff < threshold) return 0.18;

        if (filterType === 'numeric' && (d.cell.sourceType !== 'Decimal' && d.cell.sourceType !== 'Integer')) {
          return 0.18;
        }
        if (filterType === 'categorical' && !d.cell.metricMethod.includes('Cramér')) {
          return 0.18;
        }
        if (filterType === 'strong' && absCoeff < 0.6) {
          return 0.18;
        }
        if (filterType === 'negative' && d.cell.coefficient >= 0) {
          return 0.18;
        }

        // Search filter highlight
        if (fieldSearch.trim()) {
          const s = fieldSearch.toLowerCase();
          const matchSource = d.source.toLowerCase().includes(s);
          const matchTarget = d.target.toLowerCase().includes(s);
          if (!matchSource && !matchTarget) return 0.15;
        }

        return 1;
      })
      .on('mouseenter', function (event, d) {
        setHoveredCell(d.cell);
        // Highlight crosshairs
        colGuide
          .attr('x', d.x)
          .attr('width', d.w)
          .attr('opacity', 0.25);

        rowGuide
          .attr('y', d.y)
          .attr('height', d.h)
          .attr('opacity', 0.25);

        d3.select(this)
          .attr('stroke', '#4338ca')
          .attr('stroke-width', 2.5)
          .raise();
      })
      .on('mouseleave', function (event, d) {
        setHoveredCell(null);
        colGuide.attr('opacity', 0);
        rowGuide.attr('opacity', 0);

        const isCurrentSelected =
          selectedCell &&
          selectedCell.sourceField === d.source &&
          selectedCell.targetField === d.target;

        d3.select(this)
          .attr('stroke', isCurrentSelected ? '#1e1b4b' : '#ffffff')
          .attr('stroke-width', isCurrentSelected ? 2.5 : 1);
      })
      .on('click', (event, d) => {
        setSelectedCell(d.cell);
      });

    // Correlation Values Text inside cells (when cell size >= 32px)
    if (dynamicCellSize >= 32) {
      cellSelection
        .append('text')
        .attr('x', (d) => d.w / 2)
        .attr('y', (d) => d.h / 2 + 3.5)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
        .attr('font-size', dynamicCellSize >= 44 ? '11px' : '9.5px')
        .attr('font-weight', '700')
        .attr('pointer-events', 'none')
        .attr('fill', (d) => {
          if (d.isDiagonal) return '#475569';
          const coeff = d.cell.coefficient;
          // Calculate high-contrast text color based on background luminance
          if (coeff > 0.45 || coeff < -0.45) return '#ffffff';
          return '#1e293b';
        })
        .text((d) => {
          if (d.isDiagonal) return '1.0';
          const r = d.cell.coefficient;
          return r > 0 ? `+${r.toFixed(2)}` : r.toFixed(2);
        });
    }

    // Top X Column Headers (Rotated -45 degrees)
    const colLabels = g
      .append('g')
      .attr('class', 'column-headers')
      .selectAll('g.col-header')
      .data(orderedFields)
      .enter()
      .append('g')
      .attr('class', 'col-header')
      .attr('transform', (f: string) => `translate(${(x(f) || 0) + x.bandwidth() / 2}, 0)`);

    colLabels
      .append('text')
      .attr('transform', 'rotate(-42)')
      .attr('x', 6)
      .attr('y', -6)
      .attr('text-anchor', 'start')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('font-size', '11px')
      .attr('font-weight', (f: string) => (hoveredCell?.targetField === f ? '800' : '600'))
      .attr('fill', (f: string) => {
        if (hoveredCell?.targetField === f || selectedCell?.targetField === f) {
          return '#4338ca';
        }
        if (fieldSearch && f.toLowerCase().includes(fieldSearch.toLowerCase())) {
          return '#4338ca';
        }
        return '#334155';
      })
      .text((f: string) => (f.length > 18 ? f.substring(0, 16) + '…' : f))
      .style('cursor', 'pointer')
      .on('click', (e: any, f: string) => {
        setFieldSearch(f);
      });

    // Left Y Row Headers
    const rowLabels = g
      .append('g')
      .attr('class', 'row-headers')
      .selectAll('g.row-header')
      .data(orderedFields)
      .enter()
      .append('g')
      .attr('class', 'row-header')
      .attr('transform', (f: string) => `translate(0, ${(y(f) || 0) + y.bandwidth() / 2})`);

    rowLabels
      .append('text')
      .attr('x', -8)
      .attr('y', 3.5)
      .attr('text-anchor', 'end')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('font-size', '11px')
      .attr('font-weight', (f: string) => (hoveredCell?.sourceField === f ? '800' : '600'))
      .attr('fill', (f: string) => {
        if (hoveredCell?.sourceField === f || selectedCell?.sourceField === f) {
          return '#4338ca';
        }
        if (fieldSearch && f.toLowerCase().includes(fieldSearch.toLowerCase())) {
          return '#4338ca';
        }
        return '#334155';
      })
      .text((f: string) => (f.length > 18 ? f.substring(0, 16) + '…' : f))
      .style('cursor', 'pointer')
      .on('click', (e: any, f: string) => {
        setFieldSearch(f);
      });
  }, [
    orderedFields,
    activeMatrix,
    cellMap,
    containerWidth,
    colorScale,
    threshold,
    filterType,
    fieldSearch,
    hoveredCell,
    selectedCell,
    activeEntity,
  ]);

  // Render D3 Scatter Plot in Deep-Dive Panel
  useEffect(() => {
    if (!scatterSvgRef.current || !selectedCell) return;

    const scatterSvg = d3.select(scatterSvgRef.current);
    scatterSvg.selectAll('*').remove();

    const w = 320;
    const h = 180;
    const margin = { top: 20, right: 20, bottom: 35, left: 40 };
    const innerW = w - margin.left - margin.right;
    const innerH = h - margin.top - margin.bottom;

    scatterSvg.attr('width', w).attr('height', h).attr('viewBox', `0 0 ${w} ${h}`);

    const g = scatterSvg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const points: any = selectedCell.scatterPreview || [];

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '2,2')
      .call(d3.axisLeft(yScale).ticks(4).tickSize(-innerW).tickFormat(() => ''));

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .attr('font-size', '9px')
      .attr('color', '#64748b');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(4))
      .attr('font-size', '9px')
      .attr('color', '#64748b');

    // Trend Regression Line
    const r = selectedCell.coefficient;
    const lineX1 = 5;
    const lineY1 = r >= 0 ? 5 * r + 50 * (1 - r) : 95 * Math.abs(r) + 50 * (1 - Math.abs(r));
    const lineX2 = 95;
    const lineY2 = r >= 0 ? 95 * r + 50 * (1 - r) : 5 * Math.abs(r) + 50 * (1 - Math.abs(r));

    g.append('line')
      .attr('x1', xScale(lineX1))
      .attr('y1', yScale(lineY1))
      .attr('x2', xScale(lineX2))
      .attr('y2', yScale(lineY2))
      .attr('stroke', r >= 0 ? '#4f46e5' : '#ef4444')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '4,3');

    // Points
    g.selectAll('circle.scatter-point')
      .data(points)
      .enter()
      .append('circle')
      .attr('class', 'scatter-point')
      .attr('cx', (d: { x: number; y: number }) => xScale(d.x))
      .attr('cy', (d: { x: number; y: number }) => yScale(d.y))
      .attr('r', 3.8)
      .attr('fill', r >= 0 ? '#6366f1' : '#f43f5e')
      .attr('fill-opacity', 0.75)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1);
  }, [selectedCell]);

  // Export Matrix as CSV
  const handleExportCSV = () => {
    const headers = ['Field', ...orderedFields];
    const rows = orderedFields.map((f1) => {
      const rowVals = orderedFields.map((f2) => {
        const cell = cellMap.get(`${f1}:::${f2}`);
        return cell ? cell.coefficient.toFixed(2) : '0.00';
      });
      return [f1, ...rowVals].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${connector.name.replace(/\s+/g, '_')}_${selectedEntityName}_Correlation_Matrix.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export SVG graphic
  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${connector.name.replace(/\s+/g, '_')}_Correlation_Heatmap.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
      id="field-correlation-matrix-root"
    >
      {/* Top Header Card */}
      <motion.div
        variants={itemVariants as any}
        className="p-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl text-white shadow-md border border-indigo-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold bg-indigo-500/30 text-indigo-200 rounded border border-indigo-400/30 flex items-center gap-1">
              <Network className="w-3 h-3 text-indigo-300" />
              D3.js Vector Heatmap
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 rounded border border-emerald-400/30">
              Pearson + Cramér’s V + Covariance
            </span>
          </div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Field Correlation & Dependency Matrix</span>
          </h2>
          <p className="text-xs text-indigo-200/90 max-w-2xl leading-relaxed">
            Interactive pairwise covariance and statistical dependency matrix across schema fields.
            Detect linear relationships, categorical associations, co-occurrence patterns, and potential ETL multicollinearity risks.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="export-correlation-csv-btn"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            id="export-correlation-svg-btn"
            onClick={handleExportSVG}
            className="px-3 py-1.5 text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Export SVG</span>
          </button>
        </div>
      </motion.div>

      {/* Primary Toolbar: Entity Select + Filter / Sorter Bars */}
      <motion.div
        variants={itemVariants as any}
        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-3"
      >
        {/* Row 1: Entity Tabs & View Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Entity Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Target Entity:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              {entities.map((ent) => (
                <button
                  key={ent.entityName}
                  onClick={() => {
                    setSelectedEntityName(ent.entityName);
                    setSelectedCell(null);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    selectedEntityName === ent.entityName
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ent.entityName}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-Tabs: Matrix / Top Correlations / Multivariate */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveSubTab('matrix')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'matrix'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3 h-3" />
              <span>Correlation Grid ({orderedFields.length}x{orderedFields.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('strongest')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'strongest'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Top Dependencies ({activeMatrix.strongestCorrelations.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('multivariate')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'multivariate'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitCommit className="w-3 h-3 text-emerald-600" />
              <span>Multivariate ($R^2$)</span>
            </button>
          </div>
        </div>

        {/* Row 2: Matrix Visual & Sorting Controls */}
        {activeSubTab === 'matrix' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* Sorting */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-indigo-500" />
                Axis Sorting:
              </label>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="clustered">Correlation Clustered (Hierarchical)</option>
                <option value="schema">Schema Definition Order</option>
                <option value="alpha">Alphabetical (A - Z)</option>
                <option value="type">Grouped by Data Type</option>
              </select>
            </div>

            {/* Threshold Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-indigo-500" />
                  Min Correlation (|r|):
                </label>
                <span className="font-mono font-bold text-indigo-600 text-[11px]">
                  {threshold > 0 ? `≥ ${threshold.toFixed(2)}` : 'Show All'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Filter Type */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Filter className="w-3 h-3 text-indigo-500" />
                Relationship Focus:
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Relationships</option>
                <option value="strong">Strong Signals (|r| ≥ 0.60)</option>
                <option value="numeric">Numeric Pearson Only</option>
                <option value="categorical">Categorical Cramér’s V Only</option>
                <option value="negative">Inverse Negative Only (r &lt; 0)</option>
              </select>
            </div>

            {/* Field Search */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Search className="w-3 h-3 text-indigo-500" />
                Highlight Field:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  placeholder="Filter field name..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-7 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
                {fieldSearch && (
                  <button
                    onClick={() => setFieldSearch('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Sub-Views with Animated Transitions */}
      <AnimatePresence mode="wait">
        {/* SUB-VIEW 1: D3 MATRIX & DEEP-DIVE DRAWER */}
        {activeSubTab === 'matrix' && (
          <motion.div
            key={`matrix-${selectedEntityName}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-5"
          >
            {/* Main SVG Heatmap Container */}
            <div
              className={`${
                selectedCell ? 'lg:col-span-8' : 'lg:col-span-12'
              } bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all flex flex-col`}
            >
              {/* Color Ramp Legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-slate-700">Diverging Scale:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-rose-600">-1.0 (Inverse)</span>
                    <div
                      className="w-32 h-3 rounded-full border border-slate-200"
                      style={{
                        background:
                          palette === 'emerald-rose'
                            ? 'linear-gradient(to right, #f43f5e, #f8fafc, #10b981)'
                            : palette === 'sky-amber'
                            ? 'linear-gradient(to right, #f59e0b, #f8fafc, #0284c7)'
                            : 'linear-gradient(to right, #ef4444, #f8fafc, #4f46e5)',
                      }}
                    />
                    <span className="text-[10px] font-mono font-bold text-indigo-600">+1.0 (Direct)</span>
                  </div>
                </div>

                {/* Palette Selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Theme:</span>
                  <button
                    onClick={() => setPalette('indigo-red')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      palette === 'indigo-red'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Indigo/Red
                  </button>
                  <button
                    onClick={() => setPalette('emerald-rose')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      palette === 'emerald-rose'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Emerald/Rose
                  </button>
                </div>
              </div>

              {/* Scrollable / Responsive D3 SVG Container */}
              <div
                ref={svgContainerRef}
                className="w-full overflow-x-auto overflow-y-auto py-2 flex justify-center min-h-[480px]"
              >
                <svg ref={svgRef} className="select-none mx-auto" />
              </div>

              {/* Hover Info Footer */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  {hoveredCell ? (
                    <span>
                      <strong className="text-slate-800">{hoveredCell.sourceField}</strong> ↔{' '}
                      <strong className="text-slate-800">{hoveredCell.targetField}</strong>:{' '}
                      <span className="font-mono font-bold text-indigo-600">
                        r = {hoveredCell.coefficient > 0 ? `+${hoveredCell.coefficient.toFixed(2)}` : hoveredCell.coefficient.toFixed(2)}
                      </span>{' '}
                      ({hoveredCell.strength} • {hoveredCell.metricMethod})
                    </span>
                  ) : (
                    <span>Hover over any cell for instant correlation coefficient, or click to open deep-dive analysis.</span>
                  )}
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  {activeEntity?.rowCount.toLocaleString()} profiled records
                </span>
              </div>
            </div>

            {/* Deep-Dive Inspection Drawer (Opens when cell selected) */}
            <AnimatePresence>
              {selectedCell && (
                <motion.div
                  key="deep-dive-drawer"
                  initial={{ opacity: 0, x: 20, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="lg:col-span-4 bg-white p-4 rounded-2xl border border-indigo-200 shadow-md space-y-4 flex flex-col"
                >
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        Dependency Deep Dive
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">Pairwise Relationship</h3>
                    </div>
                    <button
                      onClick={() => setSelectedCell(null)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Field Pair Banner */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: DATA_TYPE_COLORS[selectedCell.sourceType] || '#6366f1',
                          }}
                        />
                        <span className="font-bold text-slate-800">{selectedCell.sourceField}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-600">
                        {selectedCell.sourceType}
                      </span>
                    </div>

                    <div className="flex items-center justify-center text-slate-400 text-xs font-mono">
                      ↕ Covariance Linkage
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: DATA_TYPE_COLORS[selectedCell.targetType] || '#6366f1',
                          }}
                        />
                        <span className="font-bold text-slate-800">{selectedCell.targetField}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-600">
                        {selectedCell.targetType}
                      </span>
                    </div>
                  </div>

                  {/* Key Statistical Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-0.5">
                      <span className="text-[10px] text-indigo-700 font-semibold uppercase font-mono">Coefficient (r)</span>
                      <div className="text-lg font-mono font-bold text-indigo-900">
                        {selectedCell.coefficient > 0 ? `+${selectedCell.coefficient.toFixed(2)}` : selectedCell.coefficient.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-indigo-600">{selectedCell.strength}</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase font-mono">Significance</span>
                      <div className="text-xs font-mono font-bold text-slate-800">{selectedCell.significance}</div>
                      <span className="text-[10px] text-slate-500">Method: {selectedCell.metricMethod.split(' ')[0]}</span>
                    </div>
                  </div>

                  {/* D3 Mini Scatter Plot Canvas */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                        Joint Scatter & Regression Curve:
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">N=32 sample bins</span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex justify-center">
                      <svg ref={scatterSvgRef} className="overflow-visible" />
                    </div>
                  </div>

                  {/* Business & ETL Implications */}
                  <div className="space-y-2 text-xs">
                    <span className="font-bold text-slate-700">Data Engineering Interpretation:</span>
                    <p className="p-2.5 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 leading-relaxed text-[11.5px]">
                      {selectedCell.description || 'Continuous variance co-distribution observed across profiled sample records.'}
                    </p>

                    {selectedCell.absCoefficient >= 0.85 && selectedCell.sourceField !== selectedCell.targetField && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">Multicollinearity Warning:</strong>
                          These fields share &gt;72% common variance. If generating training features or denormalized analytics tables, consider consolidating.
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* SUB-VIEW 2: TOP STRONGEST DEPENDENCIES RANKING */}
        {activeSubTab === 'strongest' && (
          <motion.div
            key={`strongest-${selectedEntityName}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Strongest Field Correlations Identified</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ranked by absolute correlation magnitude (|r|), highlighting both direct linear linkages and inverse relationships.
                  </p>
                </div>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                {activeMatrix.strongestCorrelations.map((pair, idx) => {
                  const isPositive = pair.coefficient >= 0;
                  return (
                    <motion.div
                      key={idx}
                      variants={itemVariants as any}
                      className="p-4 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all space-y-3 cursor-pointer group"
                      onClick={() => {
                        setSelectedCell(pair);
                        setActiveSubTab('matrix');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          Rank #{idx + 1}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            isPositive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          r = {pair.coefficient > 0 ? `+${pair.coefficient.toFixed(2)}` : pair.coefficient.toFixed(2)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          {pair.sourceField} ↔ {pair.targetField}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{pair.metricMethod}</span>
                          <span>•</span>
                          <span>{pair.strength}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-white p-2 rounded-lg border border-slate-200/60">
                        {pair.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-indigo-600 font-semibold">
                        <span>Inspect in Matrix</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SUB-VIEW 3: MULTIVARIATE DEPENDENCIES & FORMULAS */}
        {activeSubTab === 'multivariate' && (
          <motion.div
            key={`multivariate-${selectedEntityName}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-emerald-600" />
                  <span>Multivariate Predictability & Functional Dependencies</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Automated regression analysis calculating multi-column determinism ($R^2$) to identify calculated columns, composite keys, or redundant attributes.
                </p>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {activeMatrix.multivariateDependencies.map((dep, idx) => (
                  <motion.div
                    key={idx}
                    variants={itemVariants as any}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                          Target: {dep.targetField}
                        </span>
                        <span className="text-slate-400 font-mono text-xs">← depends on</span>
                        <div className="flex flex-wrap items-center gap-1">
                          {dep.dependentOn.map((cov, cIdx) => (
                            <span
                              key={cIdx}
                              className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200"
                            >
                              {cov}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                          R² = {dep.rSquared.toFixed(2)} ({(dep.rSquared * 100).toFixed(0)}% predictable)
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            dep.riskFactor === 'High'
                              ? 'bg-rose-100 text-rose-800'
                              : dep.riskFactor === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {dep.riskFactor} Migration Risk
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {dep.explanation}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
