import React, { useState, useMemo } from 'react';
import {
  Flame,
  Clock,
  Calendar,
  Building2,
  Zap,
  Info,
  Download,
  Filter,
  Layers,
  Activity,
  BarChart2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { MOCK_PARTNER_CUSTOMERS } from '../data/partnerPortalData';

export interface HeatmapCell {
  dayIndex: number; // 0=Mon, 6=Sun
  dayName: string;
  hour: number; // 0..23
  hourLabel: string; // "00:00", "01:00", etc.
  valueGB: number; // GB transferred in this hour slot
  cdcEventsK: number; // thousands of CDC events
  peakCustomerName: string;
  primaryEntityType: string;
  intensity: 'idle' | 'low' | 'moderate' | 'high' | 'peak';
}

export interface MigrationUsageHeatmapProps {
  onShowToast?: (msg: string) => void;
  onUpgradeClick?: () => void;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);

export const MigrationUsageHeatmap: React.FC<MigrationUsageHeatmapProps> = ({
  onShowToast,
  onUpgradeClick,
}) => {
  // Filter States
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [metricMode, setMetricMode] = useState<'throughput' | 'cdc' | 'cost'>('throughput');
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [timezone, setTimezone] = useState<'UTC' | 'EST' | 'CET' | 'PST'>('UTC');

  // Seeded Heatmap Grid Generator
  const heatmapData = useMemo(() => {
    const customerSeed = selectedCustomerId === 'ALL' ? 1 : selectedCustomerId.charCodeAt(selectedCustomerId.length - 1);

    const cells: HeatmapCell[] = [];

    DAYS_OF_WEEK.forEach((dayName, dayIndex) => {
      HOURS_24.forEach((hour) => {
        // Deterministic pseudo-random generation simulating real migration patterns
        // Peak times usually occur midnight to 05:00 UTC (batch jobs) and 18:00 - 22:00 UTC (end-of-day syncs)
        const isNightBatch = hour >= 1 && hour <= 4;
        const isEveningSync = hour >= 18 && hour <= 21;
        const isMidweek = dayIndex >= 1 && dayIndex <= 4; // Tue-Fri peak

        let baseVal = (Math.sin(hour * 0.5 + dayIndex + customerSeed) + 1) * 25;
        if (isNightBatch) baseVal += isMidweek ? 120 : 60;
        if (isEveningSync) baseVal += isMidweek ? 85 : 40;
        if (dayIndex === 2 && hour === 3) baseVal += 160; // Ultimate Wednesday 03:00 peak

        // Scale per customer filter
        if (selectedCustomerId !== 'ALL') {
          baseVal = baseVal * 0.75 + (customerSeed % 5) * 10;
        }

        const valueGB = Math.round(Math.max(2, baseVal));
        const cdcEventsK = Math.round(valueGB * 14.2);

        let intensity: HeatmapCell['intensity'] = 'idle';
        if (valueGB > 150) intensity = 'peak';
        else if (valueGB > 100) intensity = 'high';
        else if (valueGB > 50) intensity = 'moderate';
        else if (valueGB > 15) intensity = 'low';

        // Customer & Entity Attribution
        const customerList = MOCK_PARTNER_CUSTOMERS;
        const custIdx = (hour + dayIndex + customerSeed) % customerList.length;
        const peakCustomerName = customerList[custIdx].name;

        const entities = [
          'SAP ECC General Ledger (ACDOCA)',
          'Oracle EBS Inventory Batches',
          'Dynamics 365 Sales Orders CDC',
          'PostgreSQL Customer DB Dump',
          'Infor LN Aerospace Serial Registry',
          'DB2 AS400 Warehouse Log Delta',
        ];
        const primaryEntityType = entities[(hour * 3 + dayIndex) % entities.length];

        const hourLabel = `${hour.toString().padStart(2, '0')}:00`;

        cells.push({
          dayIndex,
          dayName,
          hour,
          hourLabel,
          valueGB,
          cdcEventsK,
          peakCustomerName,
          primaryEntityType,
          intensity,
        });
      });
    });

    return cells;
  }, [selectedCustomerId]);

  // Aggregate Metrics
  const peakCell = useMemo(() => {
    return [...heatmapData].sort((a, b) => b.valueGB - a.valueGB)[0];
  }, [heatmapData]);

  const totalWeeklyGB = useMemo(() => {
    return heatmapData.reduce((acc, c) => acc + c.valueGB, 0);
  }, [heatmapData]);

  const averageHourlyGB = useMemo(() => {
    return Math.round(totalWeeklyGB / heatmapData.length);
  }, [totalWeeklyGB, heatmapData]);

  // Cell Color Mapping
  const getCellColor = (intensity: HeatmapCell['intensity'], isHovered: boolean) => {
    switch (intensity) {
      case 'peak':
        return isHovered
          ? 'bg-rose-600 border-2 border-slate-900 shadow-lg shadow-rose-500/30 scale-110 z-10 text-white'
          : 'bg-rose-500 hover:bg-rose-600 border border-rose-400/30 text-white animate-pulse';
      case 'high':
        return isHovered
          ? 'bg-amber-600 border-2 border-slate-900 shadow-lg shadow-amber-500/30 scale-110 z-10 text-white'
          : 'bg-amber-500 hover:bg-amber-600 border border-amber-400/30 text-white';
      case 'moderate':
        return isHovered
          ? 'bg-indigo-700 border-2 border-slate-900 shadow-lg shadow-indigo-500/30 scale-110 z-10 text-white'
          : 'bg-indigo-600 hover:bg-indigo-700 border border-indigo-400/30 text-white';
      case 'low':
        return isHovered
          ? 'bg-cyan-600 border-2 border-slate-900 shadow-lg shadow-cyan-500/30 scale-110 z-10 text-white'
          : 'bg-cyan-100 hover:bg-cyan-200 border border-cyan-200 text-cyan-800';
      case 'idle':
      default:
        return isHovered
          ? 'bg-slate-300 border-2 border-slate-900 shadow-md scale-110 z-10 text-slate-800'
          : 'bg-slate-100/90 hover:bg-slate-200 border border-slate-200/80 text-slate-400';
    }
  };

  const handleExportHeatmapReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        ['Day', 'Hour (UTC)', 'Throughput (GB)', 'CDC Events (K)', 'Peak Customer', 'Primary Entity Payload'].join(','),
        ...heatmapData.map((c) =>
          [
            c.dayName,
            c.hourLabel,
            c.valueGB,
            c.cdcEventsK,
            `"${c.peakCustomerName}"`,
            `"${c.primaryEntityType}"`,
          ].join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Migration_Peak_Usage_Heatmap_${selectedCustomerId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) {
      onShowToast('📊 Heatmap audit dataset exported successfully!');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-rose-50 rounded-2xl text-rose-600 border border-rose-100">
              <Flame className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Migration Traffic &amp; Peak Usage Heatmap
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-mono font-extrabold border border-rose-200">
                  24x7 Surge Grid
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Pinpoint high-concurrency CDC sync windows and heavy batch migration extract hours across all connected partner customer tenants.
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Customer Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">Customer:</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-transparent font-extrabold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Partner Accounts</option>
              {MOCK_PARTNER_CUSTOMERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setMetricMode('throughput')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                metricMode === 'throughput'
                  ? 'bg-rose-600 text-white font-extrabold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GB / Hour
            </button>
            <button
              onClick={() => setMetricMode('cdc')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                metricMode === 'cdc'
                  ? 'bg-rose-600 text-white font-extrabold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CDC Events (K)
            </button>
          </div>

          {/* Timezone Selector */}
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
          >
            <option value="UTC">Timezone: UTC</option>
            <option value="EST">Timezone: EST (UTC-5)</option>
            <option value="CET">Timezone: CET (UTC+1)</option>
            <option value="PST">Timezone: PST (UTC-8)</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportHeatmapReport}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Grid</span>
          </button>
        </div>
      </div>

      {/* KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Peak Migration Surge Window</span>
            <Flame className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 font-mono">
            {peakCell.dayName} at {peakCell.hourLabel} {timezone}
          </div>
          <div className="text-[11px] text-slate-500 font-medium truncate">
            {peakCell.valueGB} GB/hr • {peakCell.peakCustomerName}
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Weekly Migration Volume</span>
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {(totalWeeklyGB / 1024).toFixed(2)} TB / wk
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Avg {averageHourlyGB} GB / hour throughput
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Optimal Maintenance Window</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">
            Sun 13:00 – 17:00 {timezone}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Zero concurrency collision predicted
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Bandwidth Concurrency Safety</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">
            Optimal (94.2%)
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Unthrottled CDC Pipe Allocation
          </div>
        </div>
      </div>

      {/* COLOR LEGEND BAR (White Theme) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white text-slate-900 p-3.5 rounded-2xl border border-slate-200 text-xs font-mono shadow-2xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-slate-700 font-bold">Data Usage Intensity Scale:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-300 inline-block" />
            <span className="text-slate-500">&lt; 15 GB (Idle)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-cyan-100 border border-cyan-300 inline-block" />
            <span className="text-cyan-800 font-medium">15 - 50 GB (Light)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-indigo-600 inline-block" />
            <span className="text-indigo-900 font-medium">50 - 100 GB (Moderate)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-500 inline-block" />
            <span className="text-amber-900 font-medium">100 - 150 GB (High Surge)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-rose-500 inline-block animate-pulse" />
            <span className="text-rose-700 font-bold">&gt; 150 GB (Peak Load)</span>
          </div>
        </div>
      </div>

      {/* HEATMAP GRID DISPLAY (White Theme) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 overflow-x-auto shadow-2xs relative">
        {/* Hour Header Axis */}
        <div className="min-w-[780px]">
          <div className="grid grid-cols-25 gap-1.5 mb-2 text-center text-[10px] font-mono font-bold text-slate-500">
            <div className="text-left pl-1">Day \ Hr</div>
            {HOURS_24.map((hr) => (
              <div key={hr} className="truncate">
                {hr.toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Grid Rows per Day */}
          <div className="space-y-1.5">
            {DAYS_OF_WEEK.map((dayName, dayIndex) => {
              const dayCells = heatmapData.filter((c) => c.dayIndex === dayIndex);

              return (
                <div key={dayName} className="grid grid-cols-25 gap-1.5 items-center">
                  {/* Day Label */}
                  <div className="text-xs font-mono font-black text-slate-800 tracking-wider">
                    {dayName}
                  </div>

                  {/* 24 Hour Blocks */}
                  {dayCells.map((cell) => {
                    const isHovered =
                      hoveredCell?.dayIndex === cell.dayIndex && hoveredCell?.hour === cell.hour;

                    const displayVal =
                      metricMode === 'throughput' ? `${cell.valueGB}G` : `${cell.cdcEventsK}K`;

                    return (
                      <div
                        key={cell.hour}
                        onMouseEnter={() => setHoveredCell(cell)}
                        className={`h-9 rounded-lg flex items-center justify-center font-mono text-[9px] font-bold transition-all duration-150 cursor-pointer relative ${getCellColor(
                          cell.intensity,
                          isHovered
                        )}`}
                      >
                        <span className="truncate px-0.5">{displayVal}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Tooltip Hover Inspector */}
        {hoveredCell && (
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 text-slate-900 p-4 rounded-2xl shadow-xl space-y-2 max-w-sm w-full mx-auto mt-4 text-xs font-mono animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-600" />
                <span className="font-extrabold text-slate-900 text-sm">
                  {hoveredCell.dayName} at {hoveredCell.hourLabel} {timezone}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                  hoveredCell.intensity === 'peak'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : hoveredCell.intensity === 'high'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                {hoveredCell.intensity} Load
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
              <div>
                <span className="text-slate-500 block text-[10px]">Data Throughput</span>
                <strong className="text-emerald-700 text-sm">{hoveredCell.valueGB} GB / hr</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">CDC Streaming Events</span>
                <strong className="text-indigo-700 text-sm">{hoveredCell.cdcEventsK.toLocaleString()} K events</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Peak Customer:</span>
                <span className="font-bold text-slate-900">{hoveredCell.peakCustomerName}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Primary Entity:</span>
                <span className="font-bold text-indigo-700 truncate max-w-[180px]">{hoveredCell.primaryEntityType}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADVISORY CARD (White Theme) */}
      <div className="bg-white text-slate-900 p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h4 className="font-extrabold text-sm text-slate-900">Migration Bandwidth Concurrency Insights</h4>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-mono font-bold">
            Zero Bottlenecks Detected
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Peak migration traffic occurs during mid-week night batch runs between 01:00 and 04:00 UTC, driven heavily by <strong>Nordic Manufacturing Group</strong> and <strong>Apex Health Systems</strong> ERP extracts. Consider staggering scheduled CDC full-refresh passes to off-peak Sunday windows to maximize CDC stream throughput and prevent overage spikes.
        </p>
      </div>
    </div>
  );
};
