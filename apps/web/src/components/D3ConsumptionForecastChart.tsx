import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  TrendingUp,
  Sparkles,
  Zap,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  Sliders,
  CheckCircle2,
  Calendar,
  Layers,
  BarChart3,
  Download,
  Info,
  RefreshCcw,
} from 'lucide-react';

export interface ConsumptionDataPoint {
  date: Date;
  label: string;
  isForecast: boolean;
  consumptionTB: number;
  upperTB: number;
  lowerTB: number;
  estimatedCost: number;
  eventsMillion: number;
  activeWorkspaces: number;
}

export interface D3ConsumptionForecastChartProps {
  currentTierName?: string;
  onUpgradeClick?: () => void;
  onShowToast?: (msg: string) => void;
}

// Tier threshold definitions
const TIER_THRESHOLDS = [
  { name: 'Starter Agency', limitTB: 10, cost: 2400, color: '#94a3b8' },
  { name: 'Growth Partner', limitTB: 35, cost: 6800, color: '#38bdf8' },
  { name: 'Enterprise Agency (Current)', limitTB: 85, cost: 14800, color: '#818cf8' },
  { name: 'Global Platform', limitTB: 180, cost: 28500, color: '#34d399' },
];

export const D3ConsumptionForecastChart: React.FC<D3ConsumptionForecastChartProps> = ({
  currentTierName = 'Enterprise Agency',
  onUpgradeClick,
  onShowToast,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [metric, setMetric] = useState<'storage' | 'events' | 'cost'>('storage');
  const [growthScenario, setGrowthScenario] = useState<'conservative' | 'baseline' | 'accelerated'>('baseline');
  const [showTierLines, setShowTierLines] = useState<boolean>(true);
  const [hoveredData, setHoveredData] = useState<ConsumptionDataPoint | null>(null);
  const [selectedScenarioCostDiff, setSelectedScenarioCostDiff] = useState<number>(0);

  // Generate dataset
  const dataset: ConsumptionDataPoint[] = useMemo(() => {
    const rateMultiplier = growthScenario === 'conservative' ? 1.04 : growthScenario === 'accelerated' ? 1.18 : 1.10;

    // 12 months data (Jan 2026 to Dec 2026)
    const months = [
      { monthStr: '2026-01-01', label: 'Jan 2026', isForecast: false, baseTB: 28.5, eventsM: 140, workspaces: 18 },
      { monthStr: '2026-02-01', label: 'Feb 2026', isForecast: false, baseTB: 32.1, eventsM: 155, workspaces: 21 },
      { monthStr: '2026-03-01', label: 'Mar 2026', isForecast: false, baseTB: 36.8, eventsM: 172, workspaces: 24 },
      { monthStr: '2026-04-01', label: 'Apr 2026', isForecast: false, baseTB: 41.2, eventsM: 190, workspaces: 27 },
      { monthStr: '2026-05-01', label: 'May 2026', isForecast: false, baseTB: 46.5, eventsM: 215, workspaces: 30 },
      { monthStr: '2026-06-01', label: 'Jun 2026', isForecast: false, baseTB: 51.0, eventsM: 240, workspaces: 33 },
      { monthStr: '2026-07-01', label: 'Jul 2026', isForecast: false, baseTB: 55.4, eventsM: 262, workspaces: 35 },
      { monthStr: '2026-08-01', label: 'Aug 2026', isForecast: false, baseTB: 59.8, eventsM: 285, workspaces: 38 },
      // Forecasted Months
      { monthStr: '2026-09-01', label: 'Sep 2026*', isForecast: true, baseTB: 60.0, eventsM: 290, workspaces: 40 },
      { monthStr: '2026-10-01', label: 'Oct 2026*', isForecast: true, baseTB: 60.0, eventsM: 290, workspaces: 40 },
      { monthStr: '2026-11-01', label: 'Nov 2026*', isForecast: true, baseTB: 60.0, eventsM: 290, workspaces: 40 },
      { monthStr: '2026-12-01', label: 'Dec 2026*', isForecast: true, baseTB: 60.0, eventsM: 290, workspaces: 40 },
    ];

    let currentTB = 59.8;
    let currentEvents = 285;
    let currentWorkspaces = 38;

    return months.map((m, idx) => {
      const dateObj = new Date(m.monthStr);
      if (!m.isForecast) {
        const estCost = Math.round(14800 + Math.max(0, m.baseTB - 50) * 120);
        return {
          date: dateObj,
          label: m.label,
          isForecast: false,
          consumptionTB: m.baseTB,
          upperTB: m.baseTB,
          lowerTB: m.baseTB,
          estimatedCost: estCost,
          eventsMillion: m.eventsM,
          activeWorkspaces: m.workspaces,
        };
      } else {
        const forecastStep = idx - 7; // 1, 2, 3, 4
        currentTB = Number((currentTB * rateMultiplier).toFixed(1));
        currentEvents = Math.round(currentEvents * rateMultiplier);
        currentWorkspaces = Math.round(currentWorkspaces * (rateMultiplier > 1.1 ? 1.08 : 1.03));

        const upper = Number((currentTB * (1 + forecastStep * 0.04)).toFixed(1));
        const lower = Number((currentTB * Math.max(0.7, 1 - forecastStep * 0.03)).toFixed(1));
        const estCost = Math.round(14800 + Math.max(0, currentTB - 50) * 120 + currentEvents * 1.5);

        return {
          date: dateObj,
          label: m.label,
          isForecast: true,
          consumptionTB: currentTB,
          upperTB: upper,
          lowerTB: lower,
          estimatedCost: estCost,
          eventsMillion: currentEvents,
          activeWorkspaces: currentWorkspaces,
        };
      }
    });
  }, [growthScenario]);

  // Key metrics calculations
  const augustCurrent = dataset.find((d) => d.label === 'Aug 2026') || dataset[7];
  const decemberProjected = dataset[dataset.length - 1];

  // Month when tier threshold limit (85 TB) is crossed
  const tierThresholdExceededMonth = useMemo(() => {
    return dataset.find((d) => d.consumptionTB >= 85);
  }, [dataset]);

  // Render D3 Chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear existing SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Container dimensions
    const width = containerRef.current.clientWidth || 800;
    const height = 400;
    const margin = { top: 30, right: 140, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Setup SVG
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background', '#020617')
      .style('border-radius', '1.5rem');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // D3 Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(dataset, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    let maxY = 120;
    if (metric === 'storage') {
      maxY = Math.max(120, d3.max(dataset, (d) => d.upperTB) || 120);
    } else if (metric === 'events') {
      maxY = Math.max(600, d3.max(dataset, (d) => d.eventsMillion) || 600);
    } else {
      maxY = Math.max(45000, d3.max(dataset, (d) => d.estimatedCost) || 45000);
    }

    const yScale = d3.scaleLinear().domain([0, maxY]).nice().range([innerHeight, 0]);

    // Value accessor depending on selected metric
    const getValue = (d: ConsumptionDataPoint) => {
      if (metric === 'storage') return d.consumptionTB;
      if (metric === 'events') return d.eventsMillion;
      return d.estimatedCost;
    };

    const getUpper = (d: ConsumptionDataPoint) => {
      if (metric === 'storage') return d.upperTB;
      if (metric === 'events') return d.eventsMillion * 1.12;
      return d.estimatedCost * 1.15;
    };

    const getLower = (d: ConsumptionDataPoint) => {
      if (metric === 'storage') return d.lowerTB;
      if (metric === 'events') return d.eventsMillion * 0.9;
      return d.estimatedCost * 0.88;
    };

    // Gridlines
    const yGrid = d3.axisLeft(yScale).ticks(6).tickSize(-innerWidth).tickFormat(() => '');
    g.append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3,3');

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat('%b') as any);
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(6)
      .tickFormat((d) => {
        const val = Number(d);
        if (metric === 'storage') return `${val} TB`;
        if (metric === 'events') return `${val}M`;
        return `$${(val / 1000).toFixed(0)}k`;
      });

    // Append X Axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#475569')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('dy', '10px');

    // Append Y Axis
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#475569')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold');

    // Gradient Definitions
    const defs = svg.append('defs');

    // Historical Gradient
    const histGrad = defs.append('linearGradient').attr('id', 'd3HistGrad').attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1');
    histGrad.append('stop').attr('offset', '0%').attr('stop-color', '#6366f1').attr('stop-opacity', 0.45);
    histGrad.append('stop').attr('offset', '100%').attr('stop-color', '#6366f1').attr('stop-opacity', 0.02);

    // Forecast Band Gradient
    const forecastGrad = defs.append('linearGradient').attr('id', 'd3ForecastGrad').attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1');
    forecastGrad.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.3);
    forecastGrad.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.02);

    // Split historical vs forecast
    const historicalData = dataset.filter((d) => !d.isForecast);
    const forecastData = dataset.filter((d) => d.isForecast || d.label === 'Aug 2026'); // overlap Aug for continuous line

    // 1. D3 Historical Area & Line
    const histArea = d3
      .area<ConsumptionDataPoint>()
      .x((d) => xScale(d.date))
      .y0(innerHeight)
      .y1((d) => yScale(getValue(d)))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(historicalData)
      .attr('fill', 'url(#d3HistGrad)')
      .attr('d', histArea);

    const histLine = d3
      .line<ConsumptionDataPoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(getValue(d)))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(historicalData)
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 3.5)
      .attr('d', histLine);

    // 2. D3 Forecast Confidence Interval Band (Upper/Lower Area)
    const forecastBand = d3
      .area<ConsumptionDataPoint>()
      .x((d) => xScale(d.date))
      .y0((d) => yScale(getLower(d)))
      .y1((d) => yScale(getUpper(d)))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(forecastData)
      .attr('fill', 'url(#d3ForecastGrad)')
      .attr('d', forecastBand);

    // D3 Forecast Dashed Trend Line
    const forecastLine = d3
      .line<ConsumptionDataPoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(getValue(d)))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(forecastData)
      .attr('fill', 'none')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '5,5')
      .attr('d', forecastLine);

    // Vertical Divider Line between Historical & Forecast
    const sepX = xScale(dataset[7].date);
    g.append('line')
      .attr('x1', sepX)
      .attr('y1', 0)
      .attr('x2', sepX)
      .attr('y2', innerHeight)
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3');

    g.append('text')
      .attr('x', sepX + 6)
      .attr('y', 15)
      .attr('fill', '#f59e0b')
      .attr('font-size', '10px')
      .attr('font-weight', '900')
      .text('AI FORECAST HORIZON →');

    // 3. Billing Tier Reference Threshold Lines (Storage Mode)
    if (showTierLines && metric === 'storage') {
      TIER_THRESHOLDS.forEach((tier) => {
        if (tier.limitTB <= maxY) {
          const yPos = yScale(tier.limitTB);

          g.append('line')
            .attr('x1', 0)
            .attr('y1', yPos)
            .attr('x2', innerWidth)
            .attr('y2', yPos)
            .attr('stroke', tier.color)
            .attr('stroke-dasharray', '4,4')
            .attr('stroke-opacity', 0.8)
            .attr('stroke-width', 1.5);

          g.append('rect')
            .attr('x', innerWidth + 6)
            .attr('y', yPos - 10)
            .attr('width', 125)
            .attr('height', 20)
            .attr('rx', 6)
            .attr('fill', '#0f172a')
            .attr('stroke', tier.color)
            .attr('stroke-width', 1);

          g.append('text')
            .attr('x', innerWidth + 12)
            .attr('y', yPos + 3)
            .attr('fill', tier.color)
            .attr('font-size', '9px')
            .attr('font-weight', 'bold')
            .text(`${tier.name} (${tier.limitTB} TB)`);
        }
      });
    }

    // 4. Data Dots
    g.selectAll('.data-dot')
      .data(dataset)
      .enter()
      .append('circle')
      .attr('class', 'data-dot')
      .attr('cx', (d) => xScale(d.date))
      .attr('cy', (d) => yScale(getValue(d)))
      .attr('r', (d) => (d.isForecast ? 4 : 5))
      .attr('fill', (d) => (d.isForecast ? '#06b6d4' : '#6366f1'))
      .attr('stroke', '#020617')
      .attr('stroke-width', 2);

    // 5. Interactive Crosshair & Hover Listener
    const focusLine = g
      .append('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-dasharray', '2,2')
      .attr('stroke-width', 1.5)
      .style('opacity', 0);

    const focusCircle = g
      .append('circle')
      .attr('r', 7)
      .attr('fill', '#10b981')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2.5)
      .style('opacity', 0);

    const bisectDate = d3.bisector<ConsumptionDataPoint, Date>((d) => d.date).left;

    // Overlay rect to catch mouse interactions
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', (event) => {
        const mouseX = d3.pointer(event)[0];
        const x0 = xScale.invert(mouseX);
        const i = bisectDate(dataset, x0, 1);
        const d0 = dataset[i - 1];
        const d1 = dataset[i];

        let d = d0;
        if (d1 && d0) {
          d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;
        }

        if (d) {
          const cx = xScale(d.date);
          const cy = yScale(getValue(d));

          focusLine.attr('x1', cx).attr('y1', 0).attr('x2', cx).attr('y2', innerHeight).style('opacity', 1);
          focusCircle.attr('cx', cx).attr('cy', cy).style('opacity', 1);

          setHoveredData(d);
        }
      })
      .on('mouseleave', () => {
        focusLine.style('opacity', 0);
        focusCircle.style('opacity', 0);
        setHoveredData(null);
      });
  }, [dataset, metric, growthScenario, showTierLines]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              D3 Consumption &amp; Projected Growth Forecast
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-mono font-extrabold">
              D3.js v7 Engine
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Predictive consumption analytics mapping storage volume and CDC streaming against tier thresholds to optimize reseller margins.
          </p>
        </div>

        {/* CONTROLS & TOGGLES */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric View Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(
              [
                { id: 'storage', label: 'Storage (TB)', icon: Zap },
                { id: 'events', label: 'CDC Events (M)', icon: Layers },
                { id: 'cost', label: 'Billing ($)', icon: TrendingUp },
              ] as const
            ).map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMetric(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    metric === m.id
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Growth Scenario Toggle */}
          <select
            value={growthScenario}
            onChange={(e) => setGrowthScenario(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="baseline">📈 Growth: Baseline (+10% MoM)</option>
            <option value="accelerated">🚀 Growth: Accelerated (+18% MoM)</option>
            <option value="conservative">🛡️ Growth: Conservative (+4% MoM)</option>
          </select>

          {/* Toggle Tier Threshold Lines */}
          <button
            onClick={() => setShowTierLines(!showTierLines)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
              showTierLines
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            {showTierLines ? 'Hide Tier Thresholds' : 'Show Tier Thresholds'}
          </button>
        </div>
      </div>

      {/* KPI STAT SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Aug 2026 Settled Storage</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {augustCurrent.consumptionTB} TB
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Active Tier Limit: 85 TB
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Dec 2026 Projected Storage</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <div className="text-xl font-black text-cyan-600 font-mono">
            {decemberProjected.consumptionTB} TB
          </div>
          <div className="text-[11px] text-cyan-700 font-semibold">
            Conf. Interval: {decemberProjected.lowerTB} – {decemberProjected.upperTB} TB
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Tier Threshold Horizon</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${tierThresholdExceededMonth ? 'text-amber-500' : 'text-emerald-500'}`} />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {tierThresholdExceededMonth ? tierThresholdExceededMonth.label : 'Within Quota'}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold">
            {tierThresholdExceededMonth
              ? `Crosses 85 TB limit in ${tierThresholdExceededMonth.label}`
              : 'Stays below 85 TB capacity'}
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Recommended Tier Upgrade</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            Global Platform
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            Saves ~$3,200/mo overage penalty
          </div>
        </div>
      </div>

      {/* D3 VISUALIZATION CONTAINER */}
      <div ref={containerRef} className="relative w-full overflow-hidden">
        <svg ref={svgRef} className="w-full h-auto cursor-crosshair"></svg>

        {/* Hover Details Card Popup */}
        {hoveredData && (
          <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white p-3.5 rounded-2xl shadow-2xl text-xs space-y-2 pointer-events-none w-64 z-20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-mono font-black text-cyan-400">{hoveredData.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                hoveredData.isForecast
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {hoveredData.isForecast ? 'PROJECTION' : 'SETTLED'}
              </span>
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Storage Volume:</span>
                <span className="font-bold text-white">{hoveredData.consumptionTB} TB</span>
              </div>
              {hoveredData.isForecast && (
                <div className="flex justify-between text-cyan-300 text-[10px]">
                  <span>Range:</span>
                  <span>{hoveredData.lowerTB} – {hoveredData.upperTB} TB</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">CDC Stream Events:</span>
                <span className="font-bold text-indigo-300">{hoveredData.eventsMillion}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Est. Monthly Cost:</span>
                <span className="font-bold text-emerald-400">${hoveredData.estimatedCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Workspaces:</span>
                <span className="font-bold text-slate-200">{hoveredData.activeWorkspaces}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADVISORY & TIER COMPARISON CALLOUT (White Theme) */}
      <div className="bg-white text-slate-900 p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h4 className="font-extrabold text-sm text-slate-900">Partner Capacity Planning &amp; Upgrade Advisory</h4>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Tier Limit: <strong className="text-indigo-600">85 TB</strong> | Projected: <strong className="text-cyan-700">{decemberProjected.consumptionTB} TB</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Current Tier</span>
            <div className="font-black text-slate-900">{currentTierName}</div>
            <p className="text-slate-500 text-[11px]">85 TB baseline storage quota with $120/TB overage penalty after threshold.</p>
          </div>

          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold">Recommended Upgrade</span>
            <div className="font-black text-emerald-700">Global Platform Tier</div>
            <p className="text-slate-600 text-[11px]">180 TB storage quota + unthrottled CDC streaming streams included.</p>
          </div>

          <div className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-200/80 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-indigo-700 font-bold">Reseller Margin Impact</span>
              <div className="font-black text-slate-900 text-sm">Save ~$38,400 / year</div>
            </div>
            {onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Upgrade Partner Tier</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
