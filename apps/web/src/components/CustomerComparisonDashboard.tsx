import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Users,
  BarChart3,
  TrendingUp,
  Cpu,
  Server,
  Zap,
  Activity,
  AlertTriangle,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Building2,
  Layers,
  ArrowUpDown,
  PieChart,
  Maximize2,
  Sliders,
  Shield,
  Clock,
} from 'lucide-react';
import { PartnerCustomer, PartnerTenant, GanttMigrationJob, MOCK_GANTT_MIGRATION_JOBS } from '../data/partnerPortalData';

export interface CustomerComparisonDashboardProps {
  customers: PartnerCustomer[];
  tenants: PartnerTenant[];
  ganttJobs?: GanttMigrationJob[];
  onSelectCustomerWorkspace?: (customer: PartnerCustomer) => void;
}

export interface CustomerWorkloadMetric {
  customer: PartnerCustomer;
  allocatedVCPUs: number;
  allocatedRamGb: number;
  dataMigratedTb: number;
  activeJobsCount: number;
  cdcOpsSec: number;
  throughputGbSec: number;
  tenantCount: number;
  intensityScore: number; // 0 - 100
  intensityLevel: 'CRITICAL' | 'HEAVY' | 'MODERATE' | 'LIGHT';
}

export const CustomerComparisonDashboard: React.FC<CustomerComparisonDashboardProps> = ({
  customers,
  tenants,
  ganttJobs = MOCK_GANTT_MIGRATION_JOBS,
  onSelectCustomerWorkspace,
}) => {
  const [selectedErpFilter, setSelectedErpFilter] = useState<string>('ALL');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeChartType, setActiveChartType] = useState<'BAR' | 'BUBBLE' | 'STACKED'>('BAR');
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'vcpu' | 'ram' | 'data'>('all');
  const [hoveredCustomer, setHoveredCustomer] = useState<CustomerWorkloadMetric | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Compute rich workload metrics per customer
  const customerMetrics: CustomerWorkloadMetric[] = customers.map((cust) => {
    const custTenants = tenants.filter((t) => t.customerId === cust.id);
    const custJobs = ganttJobs.filter((j) => j.customerId === cust.id);

    const allocatedVCPUs = custTenants.reduce((acc, t) => acc + (t.allocatedNodes * 4), 0) +
      custJobs.reduce((acc, j) => acc + j.allocatedVCPUs, 0) || Math.floor(cust.dataMigratedTb * 1.5) + 8;

    const allocatedRamGb = custTenants.reduce((acc, t) => acc + t.allocatedMemoryGb, 0) +
      custJobs.reduce((acc, j) => acc + j.allocatedMemoryGb, 0) || Math.floor(cust.dataMigratedTb * 6) + 32;

    const activeJobsCount = custJobs.length || ((cust.status as any) === 'Active Sync' ? 2 : 1);

    const throughputGbSec = custJobs.reduce((acc, j) => acc + j.throughputGbSec, 0) ||
      parseFloat((cust.dataMigratedTb * 0.12).toFixed(2));

    const cdcOpsSec = Math.floor(throughputGbSec * 4200) + ((cust.status as any) === 'Active Sync' ? 1800 : 600);

    // Engineered Load Intensity Score (0-100)
    const rawScore =
      (allocatedVCPUs / 40) * 30 +
      (allocatedRamGb / 160) * 25 +
      (cust.dataMigratedTb / 30) * 25 +
      (throughputGbSec / 5) * 20;

    const intensityScore = Math.min(99, Math.max(15, Math.round(rawScore)));

    let intensityLevel: CustomerWorkloadMetric['intensityLevel'] = 'LIGHT';
    if (intensityScore >= 80) intensityLevel = 'CRITICAL';
    else if (intensityScore >= 60) intensityLevel = 'HEAVY';
    else if (intensityScore >= 40) intensityLevel = 'MODERATE';

    return {
      customer: cust,
      allocatedVCPUs,
      allocatedRamGb,
      dataMigratedTb: cust.dataMigratedTb,
      activeJobsCount,
      cdcOpsSec,
      throughputGbSec,
      tenantCount: custTenants.length || 1,
      intensityScore,
      intensityLevel,
    };
  });

  // Filter metrics
  const filteredMetrics = customerMetrics.filter((item) => {
    if (selectedErpFilter !== 'ALL' && item.customer.erpEcosystem !== selectedErpFilter) return false;
    if (selectedRegionFilter !== 'ALL' && item.customer.region !== selectedRegionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.customer.name.toLowerCase().includes(q);
      const matchCode = item.customer.code.toLowerCase().includes(q);
      const matchErp = item.customer.erpEcosystem.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchErp) return false;
    }
    return true;
  });

  // Sorted by load intensity
  const sortedByIntensity = [...filteredMetrics].sort((a, b) => b.intensityScore - a.intensityScore);

  // Highest workload customer
  const topIntensityCustomer = sortedByIntensity[0];

  // Global aggregates
  const totalVCPUs = filteredMetrics.reduce((acc, m) => acc + m.allocatedVCPUs, 0);
  const totalRam = filteredMetrics.reduce((acc, m) => acc + m.allocatedRamGb, 0);
  const totalDataTb = filteredMetrics.reduce((acc, m) => acc + m.dataMigratedTb, 0);
  const totalOps = filteredMetrics.reduce((acc, m) => acc + m.cdcOpsSec, 0);

  // Render D3 Visualization Chart
  useEffect(() => {
    if (!svgRef.current || filteredMetrics.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear canvas

    const containerWidth = svgRef.current.parentElement?.clientWidth || 800;
    const height = 380;
    const margin = { top: 40, right: 30, bottom: 65, left: 60 };
    const width = containerWidth - margin.left - margin.right;

    svg.attr('viewBox', `0 0 ${containerWidth} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // D3 Grouped Bar Chart Mode
    if (activeChartType === 'BAR') {
      const x0 = d3
        .scaleBand()
        .domain(filteredMetrics.map((d) => d.customer.code))
        .rangeRound([0, width])
        .paddingInner(0.2);

      const keys = ['Allocated vCPU', 'RAM (x2 GB)', 'Data (TB x2)'];
      const x1 = d3.scaleBand().domain(keys).rangeRound([0, x0.bandwidth()]).padding(0.08);

      const maxY = d3.max(filteredMetrics, (d) =>
        Math.max(d.allocatedVCPUs, d.allocatedRamGb / 2, d.dataMigratedTb * 2)
      ) || 100;

      const y = d3.scaleLinear().domain([0, maxY * 1.15]).nice().rangeRound([height - margin.top - margin.bottom, 0]);

      const color = d3.scaleOrdinal<string>()
        .domain(keys)
        .range(['#6366f1', '#10b981', '#8b5cf6']);

      // Gridlines
      g.append('g')
        .attr('class', 'grid')
        .call(
          d3.axisLeft(y)
            .ticks(5)
            .tickSize(-width)
            .tickFormat(() => '')
        )
        .selectAll('line')
        .attr('stroke', '#f1f5f9')
        .attr('stroke-dasharray', '3,3');

      // X Axis
      const xAxis = g
        .append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x0));

      xAxis.selectAll('text')
        .attr('font-weight', '700')
        .attr('font-size', '11px')
        .attr('fill', '#334155');

      // Y Axis
      g.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .selectAll('text')
        .attr('font-weight', '600')
        .attr('font-size', '10px')
        .attr('fill', '#64748b');

      // Bars Group
      g.append('g')
        .selectAll('g')
        .data(filteredMetrics)
        .join('g')
        .attr('transform', (d) => `translate(${x0(d.customer.code)},0)`)
        .selectAll('rect')
        .data((d) => [
          { key: 'Allocated vCPU', value: d.allocatedVCPUs, metric: d },
          { key: 'RAM (x2 GB)', value: d.allocatedRamGb / 2, metric: d },
          { key: 'Data (TB x2)', value: d.dataMigratedTb * 2, metric: d },
        ])
        .join('rect')
        .attr('x', (d) => x1(d.key) || 0)
        .attr('y', y(0))
        .attr('width', x1.bandwidth())
        .attr('height', 0)
        .attr('rx', 4)
        .attr('fill', (d) => color(d.key))
        .on('mouseenter', (event, d) => {
          setHoveredCustomer(d.metric);
        })
        .on('mouseleave', () => setHoveredCustomer(null))
        .transition()
        .duration(800)
        .delay((_, i) => i * 50)
        .attr('y', (d) => y(d.value))
        .attr('height', (d) => y(0) - y(d.value));

      // Legend
      const legend = svg
        .append('g')
        .attr('transform', `translate(${margin.left}, 15)`);

      keys.forEach((key, idx) => {
        const legendItem = legend
          .append('g')
          .attr('transform', `translate(${idx * 160}, 0)`);

        legendItem
          .append('rect')
          .attr('width', 12)
          .attr('height', 12)
          .attr('rx', 3)
          .attr('fill', color(key));

        legendItem
          .append('text')
          .attr('x', 18)
          .attr('y', 10)
          .attr('font-size', '11px')
          .attr('font-weight', '700')
          .attr('fill', '#475569')
          .text(key);
      });
    }

    // D3 Load Intensity Bubble Chart Mode
    else if (activeChartType === 'BUBBLE') {
      const maxX = d3.max(filteredMetrics, (d) => d.dataMigratedTb) || 30;
      const maxY = d3.max(filteredMetrics, (d) => d.cdcOpsSec) || 20000;

      const x = d3.scaleLinear().domain([0, maxX * 1.15]).range([0, width]);
      const y = d3.scaleLinear().domain([0, maxY * 1.15]).range([height - margin.top - margin.bottom, 0]);
      const r = d3.scaleSqrt().domain([0, 100]).range([8, 32]);

      const colorMap: Record<string, string> = {
        CRITICAL: '#ef4444',
        HEAVY: '#f59e0b',
        MODERATE: '#6366f1',
        LIGHT: '#10b981',
      };

      // Axes & Grid
      g.append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat((d) => `${d} TB`))
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('fill', '#475569');

      g.append('g')
        .call(d3.axisLeft(y).ticks(6).tickFormat((d) => `${d} ops/s`))
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('fill', '#475569');

      // Bubbles
      g.selectAll('circle')
        .data(filteredMetrics)
        .join('circle')
        .attr('cx', (d) => x(d.dataMigratedTb))
        .attr('cy', (d) => y(d.cdcOpsSec))
        .attr('r', 0)
        .attr('fill', (d) => colorMap[d.intensityLevel] || '#6366f1')
        .attr('opacity', 0.8)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d) => setHoveredCustomer(d))
        .on('mouseleave', () => setHoveredCustomer(null))
        .transition()
        .duration(800)
        .attr('r', (d) => r(d.intensityScore));

      // Bubble Text Labels
      g.selectAll('.bubble-label')
        .data(filteredMetrics)
        .join('text')
        .attr('class', 'bubble-label')
        .attr('x', (d) => x(d.dataMigratedTb))
        .attr('y', (d) => y(d.cdcOpsSec) + 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', '900')
        .attr('fill', '#ffffff')
        .style('pointer-events', 'none')
        .text((d) => d.customer.code);

      // Legend
      const legend = svg
        .append('g')
        .attr('transform', `translate(${margin.left}, 15)`);

      Object.entries(colorMap).forEach(([lvl, c], idx) => {
        const item = legend.append('g').attr('transform', `translate(${idx * 140}, 0)`);
        item.append('circle').attr('r', 6).attr('cx', 6).attr('cy', 6).attr('fill', c);
        item.append('text').attr('x', 18).attr('y', 10).attr('font-size', '11px').attr('font-weight', '700').attr('fill', '#475569').text(`${lvl} LOAD`);
      });
    }

    // D3 Horizontal Stacked Workload Bar Mode
    else if (activeChartType === 'STACKED') {
      const y0 = d3
        .scaleBand()
        .domain(filteredMetrics.map((d) => d.customer.code))
        .rangeRound([0, height - margin.top - margin.bottom])
        .padding(0.25);

      const x = d3.scaleLinear().domain([0, 100]).range([0, width]);

      // Normalize components to 100% stack
      const stackedData = filteredMetrics.map((d) => {
        const sum = d.allocatedVCPUs * 2 + d.allocatedRamGb + d.dataMigratedTb * 3;
        const pCpu = ((d.allocatedVCPUs * 2) / sum) * 100;
        const pRam = ((d.allocatedRamGb) / sum) * 100;
        const pData = ((d.dataMigratedTb * 3) / sum) * 100;
        return {
          metric: d,
          pCpu,
          pRam,
          pData,
        };
      });

      // Y Axis
      g.append('g')
        .call(d3.axisLeft(y0))
        .selectAll('text')
        .attr('font-weight', '700')
        .attr('font-size', '11px')
        .attr('fill', '#334155');

      // X Axis
      g.append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat((d) => `${d}%`))
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('fill', '#64748b');

      // Stacked Bars
      stackedData.forEach((d) => {
        const yPos = y0(d.metric.customer.code) || 0;
        const barH = y0.bandwidth();

        // CPU segment
        g.append('rect')
          .attr('x', 0)
          .attr('y', yPos)
          .attr('height', barH)
          .attr('width', 0)
          .attr('fill', '#6366f1')
          .on('mouseenter', () => setHoveredCustomer(d.metric))
          .on('mouseleave', () => setHoveredCustomer(null))
          .transition()
          .duration(700)
          .attr('width', x(d.pCpu));

        // RAM segment
        g.append('rect')
          .attr('x', x(d.pCpu))
          .attr('y', yPos)
          .attr('height', barH)
          .attr('width', 0)
          .attr('fill', '#10b981')
          .on('mouseenter', () => setHoveredCustomer(d.metric))
          .on('mouseleave', () => setHoveredCustomer(null))
          .transition()
          .duration(700)
          .attr('width', x(d.pRam));

        // Data segment
        g.append('rect')
          .attr('x', x(d.pCpu + d.pRam))
          .attr('y', yPos)
          .attr('height', barH)
          .attr('width', 0)
          .attr('fill', '#8b5cf6')
          .on('mouseenter', () => setHoveredCustomer(d.metric))
          .on('mouseleave', () => setHoveredCustomer(null))
          .transition()
          .duration(700)
          .attr('width', x(d.pData));
      });

      // Legend
      const legend = svg.append('g').attr('transform', `translate(${margin.left}, 15)`);
      [
        { name: 'Compute vCPUs Share', color: '#6366f1' },
        { name: 'RAM Memory Share', color: '#10b981' },
        { name: 'Storage Data Share', color: '#8b5cf6' },
      ].forEach((item, idx) => {
        const group = legend.append('g').attr('transform', `translate(${idx * 170}, 0)`);
        group.append('rect').attr('width', 12).attr('height', 12).attr('rx', 3).attr('fill', item.color);
        group.append('text').attr('x', 18).attr('y', 10).attr('font-size', '11px').attr('font-weight', '700').attr('fill', '#475569').text(item.name);
      });
    }
  }, [activeChartType, filteredMetrics]);

  return (
    <div className="space-y-6">
      {/* Top Workload Overview Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-[10px] font-bold uppercase font-mono flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            Total Compute vCPUs
          </span>
          <div className="text-3xl font-black text-slate-900 font-mono">{totalVCPUs} vCPUs</div>
          <div className="text-xs text-indigo-600 font-bold">{totalRam} GB Total RAM Allocated</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-[10px] font-bold uppercase font-mono flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-emerald-600" />
            Migrated Storage Volume
          </span>
          <div className="text-3xl font-black text-emerald-600 font-mono">{totalDataTb.toFixed(1)} TB</div>
          <div className="text-xs text-slate-500 font-medium">Replicated across staging clusters</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-[10px] font-bold uppercase font-mono flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-amber-600" />
            CDC Replication Stream
          </span>
          <div className="text-3xl font-black text-amber-600 font-mono">{totalOps.toLocaleString()} ops/s</div>
          <div className="text-xs text-amber-700 font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500 animate-pulse" /> Live delta CDC catchup active
          </div>
        </div>

        {topIntensityCustomer ? (
          <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl border border-indigo-900 shadow-md space-y-1">
            <span className="text-indigo-300 text-[10px] font-bold uppercase font-mono flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Highest Load Workload
            </span>
            <div className="text-xl font-black text-white truncate" title={topIntensityCustomer.customer.name}>
              {topIntensityCustomer.customer.name}
            </div>
            <div className="text-xs text-rose-300 font-extrabold flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 font-mono">
                SCORE: {topIntensityCustomer.intensityScore}/100
              </span>
              <span>{topIntensityCustomer.allocatedVCPUs} vCPUs</span>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-400">No workload selected</span>
          </div>
        )}
      </div>

      {/* Control & Chart Switcher Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Filter Selectors */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* ERP Ecosystem */}
          <div className="w-full sm:w-48">
            <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1">
              ERP Ecosystem
            </label>
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedErpFilter}
                onChange={(e) => setSelectedErpFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">All ERP Engines</option>
                <option value="Dynamics 365 F&O">Dynamics 365 F&amp;O</option>
                <option value="SAP S/4HANA">SAP S/4HANA</option>
                <option value="Oracle Fusion Cloud">Oracle Fusion Cloud</option>
                <option value="Infor CloudSuite">Infor CloudSuite</option>
              </select>
            </div>
          </div>

          {/* Region */}
          <div className="w-full sm:w-44">
            <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1">
              Cloud Region
            </label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedRegionFilter}
                onChange={(e) => setSelectedRegionFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Regions</option>
                <option value="Azure US East">Azure US East</option>
                <option value="Azure EU West">Azure EU West</option>
                <option value="Azure AP East">Azure AP East</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Chart Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveChartType('BAR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeChartType === 'BAR'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Grouped Bar</span>
          </button>

          <button
            onClick={() => setActiveChartType('BUBBLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeChartType === 'BUBBLE'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Load Matrix Scatter</span>
          </button>

          <button
            onClick={() => setActiveChartType('STACKED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeChartType === 'STACKED'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Stacked Share</span>
          </button>
        </div>
      </div>

      {/* D3 Visualizer Canvas Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 space-y-4 relative">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              D3.js Resource Utilization Visualizer ({activeChartType === 'BAR' ? 'Grouped Compute & Storage' : activeChartType === 'BUBBLE' ? 'Data Volume vs CDC Rate Matrix' : 'Normalized Workload Share'})
            </h3>
          </div>

          <span className="text-xs text-slate-500 font-mono font-bold">
            Rendering {filteredMetrics.length} customer workloads
          </span>
        </div>

        {/* Hover Tooltip Floating Card */}
        {hoveredCustomer && (
          <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1 border border-indigo-500/40 animate-in fade-in duration-150">
            <div className="font-extrabold text-indigo-300 flex items-center justify-between gap-4">
              <span>{hoveredCustomer.customer.name} ({hoveredCustomer.customer.code})</span>
              <span className="font-mono text-emerald-400 font-black">LOAD INDEX: {hoveredCustomer.intensityScore}/100</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-slate-300 pt-1">
              <div>Allocated vCPUs: <strong className="text-white">{hoveredCustomer.allocatedVCPUs} vCPUs</strong></div>
              <div>RAM Memory: <strong className="text-white">{hoveredCustomer.allocatedRamGb} GB</strong></div>
              <div>Migrated Data: <strong className="text-white">{hoveredCustomer.dataMigratedTb} TB</strong></div>
              <div>CDC Stream Ops: <strong className="text-white">{hoveredCustomer.cdcOpsSec.toLocaleString()} ops/s</strong></div>
            </div>
          </div>
        )}

        {/* D3 SVG Canvas */}
        <div className="w-full overflow-hidden">
          <svg ref={svgRef} className="w-full h-auto text-slate-800" />
        </div>
      </div>

      {/* Customer Workload Intensity Ranking Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h4 className="font-extrabold text-sm text-slate-900">Customer Migration Workload Intensity Ranking</h4>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Sorted by Load Score (Compute + Storage + CDC throughput)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase font-mono text-[10px]">
                <th className="p-3.5">Customer / Code</th>
                <th className="p-3.5">Load Index</th>
                <th className="p-3.5">Allocated vCPU</th>
                <th className="p-3.5">RAM GB</th>
                <th className="p-3.5">Migrated Data</th>
                <th className="p-3.5">CDC Throughput</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedByIntensity.map((item, idx) => {
                let badgeClass = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
                if (item.intensityLevel === 'CRITICAL') badgeClass = 'bg-rose-500/10 text-rose-700 border-rose-500/30';
                else if (item.intensityLevel === 'HEAVY') badgeClass = 'bg-amber-500/10 text-amber-700 border-amber-500/30';
                else if (item.intensityLevel === 'MODERATE') badgeClass = 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30';

                return (
                  <tr key={item.customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] flex items-center justify-center font-bold">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-extrabold text-slate-900">{item.customer.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.customer.code} • {item.customer.erpEcosystem}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-black font-mono ${badgeClass}`}>
                            {item.intensityLevel} ({item.intensityScore}/100)
                          </span>
                        </div>
                        <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.intensityLevel === 'CRITICAL' ? 'bg-rose-500' :
                              item.intensityLevel === 'HEAVY' ? 'bg-amber-500' :
                              item.intensityLevel === 'MODERATE' ? 'bg-indigo-600' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${item.intensityScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono font-bold text-slate-800">{item.allocatedVCPUs} vCPUs</td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">{item.allocatedRamGb} GB</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-600">{item.dataMigratedTb} TB</td>
                    <td className="p-3.5 font-mono text-slate-700">
                      <div className="font-bold">{item.throughputGbSec} GB/s</div>
                      <div className="text-[10px] text-slate-400">{item.cdcOpsSec.toLocaleString()} ops/s</div>
                    </td>

                    <td className="p-3.5 text-right">
                      {onSelectCustomerWorkspace && (
                        <button
                          onClick={() => onSelectCustomerWorkspace(item.customer)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Workspace</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
