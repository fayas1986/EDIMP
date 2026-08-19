import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RefreshCw, Layers, Database, Cpu, Server, Play, HelpCircle } from 'lucide-react';
import { FieldLineageMap } from './DataLineageView';

interface FieldLineageD3GraphProps {
  activeFieldDetail: FieldLineageMap;
  selectedEntity: string;
}

interface FieldNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'Source' | 'Transform' | 'Target';
  systemOrLogic: string;
  value: string;
  dataType?: string;
  stepNumber?: number;
}

interface FieldEdge {
  id: string;
  source: string | FieldNode;
  target: string | FieldNode;
}

export const FieldLineageD3Graph: React.FC<FieldLineageD3GraphProps> = ({
  activeFieldDetail,
  selectedEntity,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 320 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredNodeData, setHoveredNodeData] = useState<FieldNode | null>(null);

  // Parse nodes and edges from the activeFieldDetail
  const { nodes, edges } = useMemo(() => {
    const list: FieldNode[] = [];

    // 1. Source Node
    list.push({
      id: 'source-node',
      label: activeFieldDetail.sourceField,
      type: 'Source',
      systemOrLogic: `${activeFieldDetail.sourceSystem || 'Source System'} • ${activeFieldDetail.sourceTable || 'Table'}`,
      value: activeFieldDetail.sampleBefore,
      dataType: activeFieldDetail.sourceType,
    });

    // 2. Transform Step Nodes
    if (activeFieldDetail.transformationSteps && activeFieldDetail.transformationSteps.length > 0) {
      activeFieldDetail.transformationSteps.forEach((step) => {
        list.push({
          id: `step-node-${step.stepNumber}`,
          label: step.title,
          type: 'Transform',
          systemOrLogic: step.logic,
          value: step.outputSample,
          stepNumber: step.stepNumber,
        });
      });
    } else {
      list.push({
        id: 'transform-node-default',
        label: activeFieldDetail.transformationType,
        type: 'Transform',
        systemOrLogic: activeFieldDetail.transformationLogic,
        value: activeFieldDetail.sampleAfter,
        stepNumber: 1,
      });
    }

    // 3. Target Node
    list.push({
      id: 'target-node',
      label: activeFieldDetail.targetField,
      type: 'Target',
      systemOrLogic: `${activeFieldDetail.targetSystem || 'Target System'} • ${activeFieldDetail.targetTable || 'Table'}`,
      value: activeFieldDetail.sampleAfter,
      dataType: activeFieldDetail.targetType,
    });

    // Link sequentially
    const links: FieldEdge[] = [];
    for (let i = 0; i < list.length - 1; i++) {
      links.push({
        id: `link-${i}`,
        source: list[i].id,
        target: list[i + 1].id,
      });
    }

    return { nodes: list, edges: links };
  }, [activeFieldDetail]);

  // Handle ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    let resizeTimer: NodeJS.Timeout;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setDimensions({
          width: Math.max(width, 500),
          height: 320,
        });
      }, 100);
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      clearTimeout(resizeTimer);
    };
  }, []);

  // Set up the D3 Simulation and elements
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;

    // Deep copy nodes and edges to avoid mutation of state/memo
    const nodesCopy: FieldNode[] = JSON.parse(JSON.stringify(nodes));
    const edgesCopy: FieldEdge[] = JSON.parse(JSON.stringify(edges));

    const mainGroup = svg.append('g').attr('class', 'field-graph-group');

    // Zoom/pan handler
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2.5])
      .on('zoom', (event) => {
        mainGroup.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    const zoomIn = () => {
      svg.transition().duration(250).call(zoomBehavior.scaleBy, 1.25);
    };

    const zoomOut = () => {
      svg.transition().duration(250).call(zoomBehavior.scaleBy, 1 / 1.25);
    };

    const resetZoom = () => {
      svg.transition()
        .duration(500)
        .call(zoomBehavior.transform, d3.zoomIdentity.translate(0, 0).scale(1));
    };

    (window as any).zoomInFieldLineage = zoomIn;
    (window as any).zoomOutFieldLineage = zoomOut;
    (window as any).resetFieldLineageZoom = resetZoom;

    // Setup arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'field-arrow')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 106) // Adjust to point nicely at card border
      .attr('refY', 5)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#6366f1');

    // Left-to-right force simulation setup
    const simulation = d3.forceSimulation<FieldNode>(nodesCopy)
      .force('x', d3.forceX<FieldNode>()
        .x((d, idx) => {
          // Space out sequentially from left to right
          const ratio = idx / (nodesCopy.length - 1);
          return width * (0.15 + ratio * 0.7);
        })
        .strength(2.0)
      )
      .force('y', d3.forceY<FieldNode>().y(height / 2).strength(0.6))
      .force('charge', d3.forceManyBody<FieldNode>().strength(-120))
      .force('collide', d3.forceCollide<FieldNode>().radius(95)) // Prevent node cards from overlapping
      .force('link', d3.forceLink<FieldNode, FieldEdge>(edgesCopy)
        .id((d) => d.id)
        .distance(180)
        .strength(1.0)
      );

    const linkGroup = mainGroup.append('g').attr('class', 'field-edges');

    // Static link background paths
    const linkPaths = linkGroup.selectAll('.field-edge-path')
      .data(edgesCopy)
      .enter()
      .append('path')
      .attr('class', 'field-edge-path')
      .attr('fill', 'none')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#field-arrow)');

    // Flowing animated particles
    const flowPaths = linkGroup.selectAll('.field-flow-path')
      .data(edgesCopy)
      .enter()
      .append('path')
      .attr('class', 'field-flow-path field-flow-animation-line')
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '8, 16')
      .style('opacity', 0.6);

    // Node container group
    const nodeGroup = mainGroup.append('g').attr('class', 'field-nodes')
      .selectAll('.field-node-item')
      .data(nodesCopy)
      .enter()
      .append('g')
      .attr('class', 'field-node-item')
      .style('cursor', 'grab')
      .call(drag(simulation) as any);

    const cardWidth = 190;
    const cardHeight = 84;

    // Node Card Body
    const cards = nodeGroup.append('rect')
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('x', -cardWidth / 2)
      .attr('y', -cardHeight / 2)
      .attr('fill', '#ffffff')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1.5)
      .style('transition', 'stroke 0.2s, stroke-width 0.2s, fill 0.2s');

    // Node Card Header Badge
    nodeGroup.append('rect')
      .attr('width', 75)
      .attr('height', 15)
      .attr('rx', 4)
      .attr('x', -cardWidth / 2 + 10)
      .attr('y', -cardHeight / 2 + 10)
      .attr('fill', (d) => {
        if (d.type === 'Source') return '#dbeafe';
        if (d.type === 'Target') return '#d1fae5';
        return '#f3e8ff';
      });

    // Node Card Header Label
    nodeGroup.append('text')
      .attr('x', -cardWidth / 2 + 47.5)
      .attr('y', -cardHeight / 2 + 21)
      .attr('fill', (d) => {
        if (d.type === 'Source') return '#1e40af';
        if (d.type === 'Target') return '#065f46';
        return '#6b21a8';
      })
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .text((d) => {
        if (d.type === 'Source') return 'SRC ORIGIN';
        if (d.type === 'Target') return 'TRG TARGET';
        return d.stepNumber ? `HOP STEP #${d.stepNumber}` : 'TRANSFORM';
      });

    // Data Type Badge for Source and Target
    nodeGroup.filter(d => !!d.dataType)
      .append('text')
      .attr('x', cardWidth / 2 - 12)
      .attr('y', -cardHeight / 2 + 21)
      .attr('fill', '#94a3b8')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'end')
      .text(d => d.dataType || '');

    // Title / Field/Step Name
    nodeGroup.append('text')
      .attr('x', -cardWidth / 2 + 12)
      .attr('y', -cardHeight / 2 + 40)
      .attr('fill', '#0f172a')
      .attr('font-size', '10.5px')
      .attr('font-family', 'sans-serif')
      .attr('font-weight', 'bold')
      .text((d) => {
        const len = d.label.length;
        return len > 22 ? d.label.substring(0, 20) + '...' : d.label;
      });

    // Detail / Logic Description
    nodeGroup.append('text')
      .attr('x', -cardWidth / 2 + 12)
      .attr('y', -cardHeight / 2 + 53)
      .attr('fill', '#64748b')
      .attr('font-size', '8.5px')
      .attr('font-family', 'monospace')
      .text((d) => {
        const val = d.systemOrLogic;
        return val.length > 28 ? val.substring(0, 26) + '...' : val;
      });

    // Divider Line
    nodeGroup.append('line')
      .attr('x1', -cardWidth / 2 + 10)
      .attr('y1', -cardHeight / 2 + 60)
      .attr('x2', cardWidth / 2 - 10)
      .attr('y2', -cardHeight / 2 + 60)
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 0.8);

    // Dynamic value indicator text
    nodeGroup.append('text')
      .attr('x', -cardWidth / 2 + 12)
      .attr('y', -cardHeight / 2 + 73)
      .attr('fill', '#059669')
      .attr('font-size', '8.5px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text((d) => {
        const val = d.value || '';
        const displayVal = val.length > 22 ? `'${val.substring(0, 20)}...'` : `'${val}'`;
        return `Val: ${displayVal}`;
      });

    // Simulation updates coordinates
    simulation.on('tick', () => {
      linkPaths.attr('d', getPath);
      flowPaths.attr('d', getPath);
      nodeGroup.attr('transform', (d) => `translate(${d.x}, ${d.y})`);
    });

    // Bezier curve calculations for clean link routing
    function getPath(d: any) {
      const sourceX = d.source.x;
      const sourceY = d.source.y;
      const targetX = d.target.x;
      const targetY = d.target.y;

      const dx = targetX - sourceX;
      const cx1 = sourceX + dx * 0.45;
      const cy1 = sourceY;
      const cx2 = sourceX + dx * 0.55;
      const cy2 = targetY;

      return `M ${sourceX} ${sourceY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${targetX} ${targetY}`;
    }

    // Interactive Hover Highlights
    const updateHighlights = (hoveredId: string | null) => {
      cards.attr('stroke', (d) => {
        if (d.id === hoveredId) return '#6366f1';
        return '#e2e8f0';
      })
      .attr('stroke-width', (d) => {
        if (d.id === hoveredId) return 2.0;
        return 1.5;
      })
      .attr('fill', (d) => {
        if (d.id === hoveredId) return '#f8fafc';
        return '#ffffff';
      });

      if (hoveredId) {
        const connectedIds = new Set<string>([hoveredId]);
        const connectedLinkIds = new Set<string>();

        edgesCopy.forEach((e) => {
          const sId = typeof e.source === 'object' ? (e.source as any).id : e.source;
          const tId = typeof e.target === 'object' ? (e.target as any).id : e.target;

          if (sId === hoveredId) {
            connectedIds.add(tId);
            connectedLinkIds.add(e.id);
          } else if (tId === hoveredId) {
            connectedIds.add(sId);
            connectedLinkIds.add(e.id);
          }
        });

        nodeGroup.style('opacity', (d) => connectedIds.has(d.id) ? 1.0 : 0.25);
        linkPaths.attr('stroke', (e) => connectedLinkIds.has(e.id) ? '#6366f1' : '#f1f5f9')
          .attr('stroke-width', (e) => connectedLinkIds.has(e.id) ? 3.0 : 1.0);
        flowPaths.style('opacity', (e) => connectedLinkIds.has(e.id) ? 1.0 : 0.05);
      } else {
        nodeGroup.style('opacity', 1.0);
        linkPaths.attr('stroke', '#cbd5e1').attr('stroke-width', 2);
        flowPaths.style('opacity', 0.85);
      }
    };

    // Card drag behaviors
    nodeGroup.on('mousedown', function () {
      d3.select(this).style('cursor', 'grabbing');
    })
    .on('mouseup', function () {
      d3.select(this).style('cursor', 'grab');
    })
    .on('mouseenter', (event, d) => {
      setHoveredNodeId(d.id);
      setHoveredNodeData(d);
      updateHighlights(d.id);
    })
    .on('mouseleave', () => {
      setHoveredNodeId(null);
      setHoveredNodeData(null);
      updateHighlights(null);
    });

    updateHighlights(null);

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, dimensions]);

  // Drag simulation helpers
  function drag(simulation: d3.Simulation<FieldNode, undefined>) {
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.2).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    // Sticky drag ends let them float freely again or snap back
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  return (
    <div className="relative w-full border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-2.5 shadow-inner" ref={containerRef}>
      <style>{`
        @keyframes d3fieldflow {
          to {
            stroke-dashoffset: -24;
          }
        }
        .field-flow-animation-line {
          animation: d3fieldflow 1.0s linear infinite;
        }
      `}</style>

      {/* Dynamic Header Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center justify-between w-[calc(100%-24px)] pointer-events-none">
        <div className="flex items-center gap-1.5 bg-white/90 border border-slate-200 px-2.5 py-1.5 rounded-xl pointer-events-auto shadow-sm">
          <button
            onClick={() => {
              if ((window as any).zoomInFieldLineage) (window as any).zoomInFieldLineage();
            }}
            title="Zoom In"
            className="p-1 hover:bg-slate-50 text-indigo-600 rounded transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if ((window as any).zoomOutFieldLineage) (window as any).zoomOutFieldLineage();
            }}
            title="Zoom Out"
            className="p-1 hover:bg-slate-50 text-indigo-600 rounded transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if ((window as any).resetFieldLineageZoom) (window as any).resetFieldLineageZoom();
            }}
            title="Reset Zoom"
            className="p-1 hover:bg-slate-50 text-indigo-600 rounded transition-colors cursor-pointer flex items-center gap-1.5 text-[9px] font-bold"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-white/90 border border-slate-200 px-3 py-1.5 rounded-xl text-[9px] text-slate-500 shadow-sm">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Source</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>Hops</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Target</span>
          </div>
        </div>
      </div>

      {/* Dynamic Hover Node Inspector Overlay */}
      {hoveredNodeId && hoveredNodeData && (
        <div className="absolute bottom-3 left-3 z-10 p-3 bg-white/95 border border-indigo-200 rounded-xl shadow-xl max-w-xs text-[10.5px] text-slate-700 animate-fade-in space-y-1 font-sans pointer-events-none">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-900 text-[11px]">{hoveredNodeData.label}</span>
            <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold ${
              hoveredNodeData.type === 'Source'
                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                : hoveredNodeData.type === 'Target'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-purple-50 text-purple-700 border border-purple-100'
            }`}>
              {hoveredNodeData.type.toUpperCase()}
            </span>
          </div>
          <p className="text-indigo-900 font-mono text-[9.5px] bg-indigo-50/30 p-1 rounded border border-indigo-100/50 leading-snug break-all max-h-16 overflow-y-auto italic">
            "{hoveredNodeData.systemOrLogic}"
          </p>
          <div className="pt-1 flex items-center justify-between text-[9px] font-mono text-slate-500">
            <span>Value:</span>
            <span className="text-emerald-600 font-bold truncate max-w-[140px]" title={hoveredNodeData.value}>
              '{hoveredNodeData.value}'
            </span>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full block bg-slate-50 rounded-xl select-none"
      />
    </div>
  );
};
