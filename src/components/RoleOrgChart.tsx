import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ExtendedRole } from './UserRoleManagementView';

interface RoleNode {
  name: ExtendedRole;
  description: string;
  scope: string;
  children?: RoleNode[];
}

const ROLE_HIERARCHY: RoleNode = {
  name: 'Super Administrator',
  description: 'Unrestricted administrative access to the entire multi-tenant system.',
  scope: 'System-wide / Cross-Tenant',
  children: [
    {
      name: 'Platform Administrator',
      description: 'Configures cloud clusters, migration pipelines, and connector libraries.',
      scope: 'Platform / Infrastructure',
      children: [
        {
          name: 'Auditor',
          description: 'Independent read-only verification of pipeline logs.',
          scope: 'Compliance & Logs Only',
        }
      ]
    },
    {
      name: 'Partner Administrator',
      description: 'Manages user accounts, projects, and custom mapping definitions.',
      scope: 'Partner Organization',
      children: [
        {
          name: 'Customer Administrator',
          description: 'Controls configuration and localized user assignments.',
          scope: 'Single Client Tenant',
          children: [
            {
              name: 'Project Manager',
              description: 'Oversees migration schedules, coordinates approvals.',
              scope: 'Migration Project Scope',
              children: [
                {
                  name: 'Migration Consultant',
                  description: 'Bridges target system configurations and mapping dictionaries.',
                  scope: 'Functional & Design',
                  children: [
                    {
                      name: 'Data Engineer',
                      description: 'Writes and optimizes transformation scripts.',
                      scope: 'Technical Pipeline & DBs',
                    },
                    {
                      name: 'Functional Consultant',
                      description: 'Configures business rules, general ledger codes.',
                      scope: 'Business Rules Scope',
                    }
                  ]
                }
              ]
            },
            {
              name: 'Business User',
              description: 'Monitors client dashboards, submits ad-hoc queries.',
              scope: 'Enterprise Analytics',
            }
          ]
        }
      ]
    },
    {
      name: 'Read Only',
      description: 'Restricted to basic view-only permissions on active migration metrics.',
      scope: 'Dashboard View-Only',
    }
  ]
};

export const RoleOrgChart: React.FC = () => {
  const d3Container = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number, y: number, name: string, desc: string, scope: string, visible: boolean }>({ x: 0, y: 0, name: '', desc: '', scope: '', visible: false });

  useEffect(() => {
    if (!d3Container.current) return;

    d3.select(d3Container.current).selectAll('*').remove();

    const width = d3Container.current.clientWidth || 800;
    const height = 600;
    const margin = { top: 40, right: 120, bottom: 40, left: 140 };

    const svg = d3.select(d3Container.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .style('max-width', '100%')
      .style('height', 'auto')
      .style('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace');

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const tree = d3.tree<RoleNode>().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

    const root = d3.hierarchy<RoleNode>(ROLE_HIERARCHY);
    tree(root);

    // Initial transform to center tree - shift a bit to the right if needed, but margin.left should suffice
    const initialTransform = d3.zoomIdentity.translate(margin.left, margin.top);
    svg.call(zoom.transform, initialTransform);

    // Add links
    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<d3.HierarchyPointLink<RoleNode>, d3.HierarchyPointNode<RoleNode>>()
        .x(d => d.y)
        .y(d => d.x)
      )
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 4');

    // Add nodes
    const node = g.selectAll('.node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .style('cursor', 'pointer');

    const getNodeColor = (depth: number) => {
      switch (depth) {
        case 0: return '#7c3aed'; // violet-600
        case 1: return '#4f46e5'; // indigo-600
        case 2: return '#0284c7'; // sky-600
        case 3: return '#059669'; // emerald-600
        case 4: return '#d97706'; // amber-600
        default: return '#dc2626'; // red-600
      }
    };

    // Add node background pill
    node.append('rect')
      .attr('x', d => d.children ? -120 : 15)
      .attr('y', -14)
      .attr('width', 140)
      .attr('height', 28)
      .attr('rx', 6)
      .attr('fill', d => getNodeColor(d.depth))
      .attr('opacity', 0.1)
      .attr('stroke', d => getNodeColor(d.depth))
      .attr('stroke-width', 1);

    // Add node circles
    node.append('circle')
      .attr('r', 6)
      .attr('fill', d => getNodeColor(d.depth))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add node text
    node.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.children ? -15 : 20)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.name)
      .attr('fill', d => getNodeColor(d.depth))
      .attr('font-size', '10px')
      .attr('font-weight', '900')
      .attr('font-family', 'inherit');

    // Interactivity
    node.on('mouseenter', (event, d) => {
        d3.select(event.currentTarget).select('circle')
          .attr('r', 8)
          .attr('stroke', '#1e293b');
          
        setTooltip({
          visible: true,
          x: event.pageX,
          y: event.pageY,
          name: d.data.name,
          desc: d.data.description,
          scope: d.data.scope
        });
      })
      .on('mouseleave', (event, d) => {
        d3.select(event.currentTarget).select('circle')
          .attr('r', 6)
          .attr('stroke', '#fff');
          
        setTooltip(prev => ({ ...prev, visible: false }));
      });
      
  }, []);

  return (
    <div className="relative w-full h-[600px] bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner flex flex-col">
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-3 rounded-xl border border-slate-200 shadow-sm z-10 pointer-events-none">
        <h3 className="text-[11px] font-black uppercase text-slate-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          RBAC Interactive Hierarchy
        </h3>
        <p className="text-[9px] font-mono text-slate-500 mt-1">
          Scroll to zoom &middot; Drag to pan &middot; Hover nodes for details
        </p>
      </div>
      
      <div ref={d3Container} className="w-full h-full cursor-move" />
      
      {tooltip.visible && (
        <div 
          className="fixed z-50 pointer-events-none bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/50 transition-opacity duration-150"
          style={{
            top: tooltip.y + 15,
            left: tooltip.x + 15,
            width: '260px'
          }}
        >
          <div className="text-[11px] font-black uppercase tracking-wider mb-1.5 text-indigo-300">{tooltip.name}</div>
          <div className="text-[10px] font-mono font-bold text-slate-300 mb-2 pb-2 border-b border-slate-700/50">
            Scope: {tooltip.scope}
          </div>
          <div className="text-[11px] leading-relaxed text-slate-400">
            {tooltip.desc}
          </div>
        </div>
      )}
    </div>
  );
};
