import React, { useRef, useEffect, useState } from 'react';
import { ColumnProfile } from '../types';
import * as d3 from 'd3';
import {
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Grid,
  Info,
  ChevronRight,
  TrendingUp,
  Percent,
} from 'lucide-react';

interface DataProfilingSummaryProps {
  columnProfiles: ColumnProfile[];
}

export const DataProfilingSummary: React.FC<DataProfilingSummaryProps> = ({ columnProfiles }) => {
  const [selectedColName, setSelectedColName] = useState<string>(
    columnProfiles[0]?.columnName || ''
  );

  const selectedCol = columnProfiles.find((c) => c.columnName === selectedColName) || columnProfiles[0];

  // Calculate quick metrics
  const totalCols = columnProfiles.length;
  const anomalousCols = columnProfiles.filter((c) => c.hasAnomalies).length;
  
  const highestNullCol = [...columnProfiles].sort((a, b) => b.nullPercentage - a.nullPercentage)[0];
  const mostUniqueCol = [...columnProfiles].sort((a, b) => b.uniquenessPercentage - a.uniquenessPercentage)[0];

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 rounded-2xl border border-slate-100">
      {/* Overview Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Columns</span>
            <span className="text-xl font-bold text-slate-800 font-mono">{totalCols}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">Anomalies Detected</span>
            <span className="text-xl font-bold text-amber-600 font-mono">{anomalousCols} cols</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Percent className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Highest Null Rate</span>
            <span className="text-xs font-bold text-slate-800 font-mono truncate block">
              {highestNullCol?.columnName || '-'} ({highestNullCol?.nullPercentage || 0}%)
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Most Unique Column</span>
            <span className="text-xs font-bold text-slate-800 font-mono truncate block">
              {mostUniqueCol?.columnName || '-'} ({mostUniqueCol?.uniquenessPercentage || 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* D3 Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Data Type Distribution (Donut Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs lg:col-span-4 flex flex-col min-h-[350px]">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <PieChart className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800">Column Types</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center">
            <DataTypeDonutChart columnProfiles={columnProfiles} />
          </div>
          <div className="mt-2 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            Proportion of SQL/ERP primitive datatypes
          </div>
        </div>

        {/* Chart 2: Completeness / Null Breakdown (Horizontal Stacked Bar Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs lg:col-span-8 flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-800">Completeness & Null Analysis (%)</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
                Populated
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-400 inline-block" />
                Missing (Null)
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-[250px]">
            <CompletenessChart columnProfiles={columnProfiles} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 3: Uniqueness & Distinct Cardinality Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs lg:col-span-8 flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-500" />
              <h3 className="text-sm font-bold text-slate-800">Cardinality & Uniqueness Rate</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">100% indicates Primary Key candidate</span>
          </div>
          <div className="flex-1 min-h-[220px]">
            <UniquenessChart columnProfiles={columnProfiles} />
          </div>
        </div>

        {/* Selected Column Quality Inspector */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-800">Column Inspector</h3>
            </div>
            
            {/* Column Selector Selector */}
            <div className="mb-4">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                Select Active Column
              </label>
              <select
                value={selectedColName}
                onChange={(e) => setSelectedColName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-all focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                {columnProfiles.map((col) => (
                  <option key={col.columnName} value={col.columnName}>
                    {col.columnName} ({col.dataType})
                  </option>
                ))}
              </select>
            </div>

            {/* Quality Breakdown */}
            {selectedCol && (
              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider font-mono">Completeness</span>
                    <span className="font-mono font-bold text-slate-800">{100 - selectedCol.nullPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${100 - selectedCol.nullPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider font-mono">Uniqueness / Distinct</span>
                    <span className="font-mono font-bold text-slate-800">{selectedCol.uniquenessPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${selectedCol.uniquenessPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1.5">
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Sample Records</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCol.sampleValues.map((val, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-mono border border-slate-200/50 max-w-full truncate"
                        title={val}
                      >
                        {val || '""'}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedCol.hasAnomalies && (
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-amber-800 mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Anomaly Flagged</span>
                    </div>
                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                      {selectedCol.anomalyDescription}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[11px] text-indigo-600 font-bold shrink-0">
            <span className="text-slate-400 font-normal">Active Selection</span>
            <span className="font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {selectedCol?.columnName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- SUB-COMPONENTS FOR D3 CHARTS --- */

/**
 * 1. Data Type Distribution Donut Chart using D3
 */
const DataTypeDonutChart: React.FC<{ columnProfiles: ColumnProfile[] }> = ({ columnProfiles }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || columnProfiles.length === 0) return;

    // Aggregate counts of data types
    const typeCounts: Record<string, number> = {};
    columnProfiles.forEach((col) => {
      typeCounts[col.dataType] = (typeCounts[col.dataType] || 0) + 1;
    });

    const data = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
    }));

    // Setup dimensions
    const width = 200;
    const height = 200;
    const radius = Math.min(width, height) / 2;

    // Clear previous elements
    d3.select(containerRef.current).selectAll('*').remove();

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Define colors with elegant non-slop scheme
    const color = d3
      .scaleOrdinal<string>()
      .domain(data.map((d) => d.type))
      .range(['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#64748b']);

    // Setup pie layout
    const pie = d3
      .pie<any>()
      .value((d) => d.count)
      .sort(null);

    // Setup arc generators
    const arc = d3
      .arc<any>()
      .innerRadius(radius * 0.6) // Donut chart thickness
      .outerRadius(radius * 0.9);

    const hoverArc = d3
      .arc<any>()
      .innerRadius(radius * 0.58)
      .outerRadius(radius * 0.95);

    // Draw slices
    const path = svg
      .selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data.type))
      .attr('stroke', '#ffffff')
      .style('stroke-width', '2px')
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease-in-out');

    // Add tooltip text/label dynamically in center on hover
    const centerText = svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .style('font-family', 'monospace')
      .style('fill', '#1e293b')
      .text(columnProfiles.length);

    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', '#64748b')
      .style('text-transform', 'uppercase')
      .style('letter-spacing', '0.05em')
      .text('Columns');

    // Interactivity
    path.on('mouseover', function (event, d) {
      d3.select(this).attr('d', hoverArc);
      centerText.text(d.data.count).style('fill', color(d.data.type));
    });

    path.on('mouseout', function () {
      d3.select(this).attr('d', arc);
      centerText.text(columnProfiles.length).style('fill', '#1e293b');
    });

    // Simple custom key list below the chart inside container
    const keyContainer = d3
      .select(containerRef.current)
      .append('div')
      .attr('class', 'flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-4 text-[10px] font-semibold text-slate-500');

    keyContainer
      .selectAll('.legend-item')
      .data(data)
      .enter()
      .append('div')
      .attr('class', 'flex items-center gap-1')
      .html(
        (d) =>
          `<span style="background-color: ${color(d.type)}" class="w-2.5 h-2.5 rounded-full inline-block"></span> <span>${d.type}: ${d.count}</span>`
      );
  }, [columnProfiles]);

  return <div ref={containerRef} className="flex flex-col items-center justify-center w-full" />;
};

/**
 * 2. Completeness Horizontal Stacked Bar Chart using D3
 */
const CompletenessChart: React.FC<{ columnProfiles: ColumnProfile[] }> = ({ columnProfiles }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || columnProfiles.length === 0) return;

    // Dimensions
    const margin = { top: 10, right: 30, bottom: 20, left: 140 };
    const width = 500;
    const itemHeight = 24;
    const height = columnProfiles.length * itemHeight + margin.top + margin.bottom;

    // Clear previous contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    const chartGroup = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scale
    const xScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([0, width - margin.left - margin.right]);

    const yScale = d3
      .scaleBand()
      .domain(columnProfiles.map((d) => d.columnName))
      .range([0, height - margin.top - margin.bottom])
      .padding(0.25);

    // Draw populating bars
    chartGroup
      .selectAll('.complete-bar')
      .data(columnProfiles)
      .enter()
      .append('rect')
      .attr('class', 'complete-bar')
      .attr('y', (d: any) => yScale(d.columnName) || 0)
      .attr('x', 0)
      .attr('height', yScale.bandwidth())
      .attr('width', (d: any) => xScale(100 - d.nullPercentage))
      .attr('fill', '#4f46e5') // Elegant Indigo
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .style('transition', 'fill 0.15s ease');

    // Draw null bars
    chartGroup
      .selectAll('.null-bar')
      .data(columnProfiles)
      .enter()
      .append('rect')
      .attr('class', 'null-bar')
      .attr('y', (d: any) => yScale(d.columnName) || 0)
      .attr('x', (d: any) => xScale(100 - d.nullPercentage))
      .attr('height', yScale.bandwidth())
      .attr('width', (d: any) => xScale(d.nullPercentage))
      .attr('fill', '#fda4af') // Elegant Soft Rose for missing values
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .style('transition', 'fill 0.15s ease');

    // Add exact null values labels
    chartGroup
      .selectAll('.label')
      .data(columnProfiles)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('y', (d: any) => (yScale(d.columnName) || 0) + yScale.bandwidth() / 2 + 3.5)
      .attr('x', (d: any) => width - margin.left - margin.right + 5)
      .style('font-size', '9px')
      .style('font-family', 'monospace')
      .style('font-weight', 'bold')
      .style('fill', (d: any) => (d.nullPercentage > 0 ? '#e11d48' : '#64748b'))
      .text((d: any) => (d.nullPercentage > 0 ? `${d.nullPercentage}%` : '100%'));

    // Draw Y-axis text
    chartGroup
      .selectAll('.axis-label')
      .data(columnProfiles)
      .enter()
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', -8)
      .attr('y', (d: any) => (yScale(d.columnName) || 0) + yScale.bandwidth() / 2 + 3)
      .attr('text-anchor', 'end')
      .style('font-size', '10px')
      .style('font-family', 'monospace')
      .style('font-weight', '600')
      .style('fill', '#334155')
      .text((d: any) => d.columnName)
      .style('cursor', 'pointer')
      .on('mouseover', function () {
        d3.select(this).style('fill', '#4f46e5');
      })
      .on('mouseout', function () {
        d3.select(this).style('fill', '#334155');
      });

    // Add interactive animations on bars
    chartGroup
      .selectAll('rect')
      .on('mouseover', function () {
        d3.select(this).attr('opacity', 0.85);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 1.0);
      });
  }, [columnProfiles]);

  return (
    <div className="w-full h-full overflow-y-auto max-h-[300px]">
      <svg ref={svgRef} className="w-full" />
    </div>
  );
};

/**
 * 3. Distinct Count / Uniqueness Rate Vertical Bar Chart using D3
 */
const UniquenessChart: React.FC<{ columnProfiles: ColumnProfile[] }> = ({ columnProfiles }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || columnProfiles.length === 0) return;

    // Dimensions
    const margin = { top: 15, right: 10, bottom: 40, left: 35 };
    const width = 600;
    const height = 180;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    const chartGroup = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scale
    const xScale = d3
      .scaleBand()
      .domain(columnProfiles.map((d) => d.columnName))
      .range([0, width - margin.left - margin.right])
      .padding(0.35);

    const yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([height - margin.top - margin.bottom, 0]);

    // Draw columns
    chartGroup
      .selectAll('.bar')
      .data(columnProfiles)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d: any) => xScale(d.columnName) || 0)
      .attr('y', (d: any) => yScale(d.uniquenessPercentage))
      .attr('width', xScale.bandwidth())
      .attr('height', (d: any) => height - margin.top - margin.bottom - yScale(d.uniquenessPercentage))
      .attr('fill', (d: any) => (d.uniquenessPercentage === 100 ? '#10b981' : '#0ea5e9')) // Green for unique keys, blue for other
      .attr('rx', 2.5)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.15s ease')
      .on('mouseover', function () {
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 1.0);
      });

    // Add labels on top of bars
    chartGroup
      .selectAll('.bar-label')
      .data(columnProfiles)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', (d: any) => (xScale(d.columnName) || 0) + xScale.bandwidth() / 2)
      .attr('y', (d: any) => yScale(d.uniquenessPercentage) - 4)
      .attr('text-anchor', 'middle')
      .style('font-size', '8px')
      .style('font-family', 'monospace')
      .style('font-weight', 'bold')
      .style('fill', '#475569')
      .text((d: any) => `${Math.round(d.uniquenessPercentage)}%`);

    // Draw X-axis
    chartGroup
      .selectAll('.col-label')
      .data(columnProfiles)
      .enter()
      .append('text')
      .attr('class', 'col-label')
      .attr('x', (d: any) => (xScale(d.columnName) || 0) + xScale.bandwidth() / 2)
      .attr('y', height - margin.top - margin.bottom + 12)
      .attr('text-anchor', 'middle')
      .style('font-size', '8px')
      .style('font-family', 'monospace')
      .style('font-weight', '600')
      .style('fill', '#64748b')
      .style('text-transform', 'none')
      .text((d: any) => (d.columnName.length > 10 ? `${d.columnName.substring(0, 8)}..` : d.columnName));

    // Y-Axis ticks
    chartGroup
      .append('g')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(4)
          .tickFormat((d: any) => `${d}%`)
      )
      .style('font-size', '8px')
      .style('font-family', 'monospace')
      .style('color', '#94a3b8')
      .selectAll('line')
      .style('stroke', '#cbd5e1');

    chartGroup.select('.domain').style('stroke', '#cbd5e1');
  }, [columnProfiles]);

  return <svg ref={svgRef} className="w-full" />;
};
