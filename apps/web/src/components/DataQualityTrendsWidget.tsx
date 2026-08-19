import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Sliders,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  BarChart2,
  Info,
} from 'lucide-react';
import { MigrationJob } from '../types';

interface DataQualityTrendsWidgetProps {
  jobs?: MigrationJob[];
}

interface DailyQualityMetric {
  day: string;
  dateStr: string;
  overallScore: number;
  schemaValidityPct: number;
  referentialIntegrityPct: number;
  uniquenessPct: number;
  recordsAudited: number;
  aiCorrections: number;
  anomalyFlag?: string;
}

export const DataQualityTrendsWidget: React.FC<DataQualityTrendsWidgetProps> = ({ jobs = [] }) => {
  const [selectedMetric, setSelectedMetric] = useState<
    'overallScore' | 'schemaValidityPct' | 'referentialIntegrityPct' | 'uniquenessPct'
  >('overallScore');
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'30d' | '14d' | '7d'>('30d');

  // Generate 30 days of historical quality data leading up to today
  const generate30DayData = (): DailyQualityMetric[] => {
    const data: DailyQualityMetric[] = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 29);

    for (let i = 0; i < 30; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Calculate baseline with gradual improvement curve + slight random variance
      const progress = i / 29; // 0 to 1
      const baseScore = 82 + progress * 11.5 + (Math.sin(i * 0.8) * 1.8);
      const schema = Math.min(99.5, Math.max(80, baseScore + 2 + Math.random() * 1.5));
      const refIntegrity = Math.min(98.5, Math.max(78, baseScore - 1.5 + Math.random() * 2));
      const uniqueness = Math.min(99.9, Math.max(88, 93 + progress * 5 + Math.random()));
      const audited = Math.floor(120000 + i * 4500 + Math.random() * 10000);
      const corrections = Math.floor(450 - progress * 280 + Math.random() * 30);

      let anomalyFlag: string | undefined = undefined;
      if (i === 12) {
        anomalyFlag = 'FK Constraint Exception on SAP BAPI Sync';
      } else if (i === 22) {
        anomalyFlag = 'Address Format Standardization Patch';
      }

      data.push({
        day: `Day ${i + 1}`,
        dateStr,
        overallScore: Number(Math.min(99.2, Math.max(75, baseScore)).toFixed(1)),
        schemaValidityPct: Number(schema.toFixed(1)),
        referentialIntegrityPct: Number(refIntegrity.toFixed(1)),
        uniquenessPct: Number(uniqueness.toFixed(1)),
        recordsAudited: audited,
        aiCorrections: corrections,
        anomalyFlag,
      });
    }

    return data;
  };

  const [full30DayData] = useState<DailyQualityMetric[]>(generate30DayData());

  // Filter by time range
  const displayData = React.useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    return full30DayData.slice(-days);
  }, [full30DayData, timeRange]);

  // Derived Summary Metrics
  const currentScore = displayData[displayData.length - 1]?.overallScore || 93.5;
  const startScore = displayData[0]?.overallScore || 82.0;
  const scoreDelta = (currentScore - startScore).toFixed(1);
  const avgScore = (
    displayData.reduce((acc, curr) => acc + curr[selectedMetric], 0) / displayData.length
  ).toFixed(1);
  const peakScore = Math.max(...displayData.map((d) => d[selectedMetric])).toFixed(1);
  const totalAudited30d = displayData.reduce((acc, curr) => acc + curr.recordsAudited, 0);

  const getMetricTitle = () => {
    switch (selectedMetric) {
      case 'overallScore':
        return 'Overall AI Quality Score';
      case 'schemaValidityPct':
        return 'Schema Validity %';
      case 'referentialIntegrityPct':
        return 'Referential Integrity %';
      case 'uniquenessPct':
        return 'Duplicate-Free Uniqueness %';
      default:
        return 'Quality Score';
    }
  };

  const getMetricColor = () => {
    switch (selectedMetric) {
      case 'overallScore':
        return '#4f46e5'; // Indigo
      case 'schemaValidityPct':
        return '#10b981'; // Emerald
      case 'referentialIntegrityPct':
        return '#8b5cf6'; // Purple
      case 'uniquenessPct':
        return '#06b6d4'; // Cyan
      default:
        return '#6366f1';
    }
  };

  return (
    <div id="data-quality-trends-widget" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-mono font-bold rounded-full border border-indigo-100 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Real-time Telemetry
            </span>
            <span className="text-slate-400 text-xs font-mono">
              30-Day Historical Trend Analysis
            </span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            Data Quality Trends & Automated Cleansing Velocity
          </h2>
        </div>

        {/* Filters & Control Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Job Filter */}
          {jobs.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Migration Jobs (Aggregate)</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.jobName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['7d', '14d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stats Row & Metric Dimension Toggles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric Card 1: Overall Score */}
        <button
          onClick={() => setSelectedMetric('overallScore')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedMetric === 'overallScore'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-2xs'
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Overall Score</span>
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight font-mono mt-1">
            {currentScore}%
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span>+{scoreDelta}% in {timeRange}</span>
          </div>
        </button>

        {/* Metric Card 2: Schema Validity */}
        <button
          onClick={() => setSelectedMetric('schemaValidityPct')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedMetric === 'schemaValidityPct'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-2xs'
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Schema Validity</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight font-mono mt-1">
            {displayData[displayData.length - 1]?.schemaValidityPct}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            0 Structural Mismatches
          </div>
        </button>

        {/* Metric Card 3: Referential Integrity */}
        <button
          onClick={() => setSelectedMetric('referentialIntegrityPct')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedMetric === 'referentialIntegrityPct'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-2xs'
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>FK Integrity</span>
            <Layers className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight font-mono mt-1">
            {displayData[displayData.length - 1]?.referentialIntegrityPct}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            FK Lookup Pass: 98.2%
          </div>
        </button>

        {/* Metric Card 4: Uniqueness */}
        <button
          onClick={() => setSelectedMetric('uniquenessPct')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedMetric === 'uniquenessPct'
              ? 'bg-cyan-50/80 border-cyan-300 ring-2 ring-cyan-500/20 shadow-2xs'
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Uniqueness</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight font-mono mt-1">
            {displayData[displayData.length - 1]?.uniquenessPct}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Duplicates Deduplicated
          </div>
        </button>
      </div>

      {/* Main Recharts Sparkline Area Chart */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getMetricColor() }} />
            <span className="text-xs font-bold text-white font-mono">
              {getMetricTitle()} — {timeRange.toUpperCase()} Sparkline Trend View
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div>
              Average: <strong className="text-white">{avgScore}%</strong>
            </div>
            <div>
              Peak: <strong className="text-emerald-400">{peakScore}%</strong>
            </div>
            <div>
              Audited: <strong className="text-indigo-300">{(totalAudited30d / 1000000).toFixed(2)}M rec</strong>
            </div>
          </div>
        </div>

        {/* Interactive Area Sparkline Chart */}
        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getMetricColor()} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={getMetricColor()} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="dateStr"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                domain={[70, 100]}
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                tickFormatter={(val) => `${val}%`}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DailyQualityMetric;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono text-white space-y-1.5 z-50">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1 gap-4">
                          <span className="font-bold text-indigo-300">{data.dateStr} ({data.day})</span>
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                            Audited: {data.recordsAudited.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-400 font-bold">
                          <span>{getMetricTitle()}:</span>
                          <span className="text-sm">{data[selectedMetric]}%</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          AI Auto-Corrections: {data.aiCorrections} records
                        </div>
                        {data.anomalyFlag && (
                          <div className="text-[10px] text-amber-300 bg-amber-500/10 p-1.5 rounded border border-amber-500/20 flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{data.anomalyFlag}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <ReferenceLine y={90} stroke="#10b981" strokeDasharray="3 3" opacity={0.6} />

              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke={getMetricColor()}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#qualityGradient)"
                activeDot={{ r: 6, fill: '#ffffff', stroke: getMetricColor(), strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Legend & Anomaly Highlights */}
        <div className="flex flex-wrap items-center justify-between pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
              Target Quality SLA (90.0% Grade A Threshold)
            </span>
            <span className="flex items-center gap-1.5 text-indigo-300">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              AI Automated Rules Active
            </span>
          </div>

          <div className="text-slate-500">
            Last Telemetry Sync: <span className="text-slate-300">Just Now (0.4s ago)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
