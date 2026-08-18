import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Sparkles,
  Zap,
  Building2,
  AlertCircle,
  Sliders,
  ArrowUpRight,
  ShieldCheck,
  BarChart2,
  Download,
  Info,
} from 'lucide-react';

export interface PartnerSpendForecastChartProps {
  currentTierName?: string;
  onUpgradeClick?: () => void;
  onShowToast?: (msg: string) => void;
}

export interface SpendDataPoint {
  month: string;
  isForecast: boolean;
  baseSubscription: number;
  storageOverages: number;
  cdcAddons: number;
  partnerDiscount: number;
  totalNetSpend: number;
  storageTB: number;
  workspacesCount: number;
  upperConfidenceBound?: number;
  lowerConfidenceBound?: number;
}

export const PartnerSpendForecastChart: React.FC<PartnerSpendForecastChartProps> = ({
  currentTierName = 'Enterprise Agency',
  onUpgradeClick,
  onShowToast,
}) => {
  const [metricView, setMetricView] = useState<'spend' | 'capacity' | 'combined'>('spend');
  const [timeHorizon, setTimeHorizon] = useState<'6m' | '12m' | 'ytd'>('12m');
  const [forecastScenario, setForecastScenario] = useState<'baseline' | 'aggressive' | 'conservative'>('baseline');
  const [selectedMonthDetails, setSelectedMonthDetails] = useState<SpendDataPoint | null>(null);

  // Generate dataset based on timeHorizon and forecastScenario
  const data: SpendDataPoint[] = useMemo(() => {
    // Multipliers for forecast scenarios
    const scenarioMultiplier =
      forecastScenario === 'aggressive' ? 1.22 : forecastScenario === 'conservative' ? 1.03 : 1.10;

    const baseData: SpendDataPoint[] = [
      {
        month: 'Jan 2026',
        isForecast: false,
        baseSubscription: 14800,
        storageOverages: 0,
        cdcAddons: 1200,
        partnerDiscount: -3200,
        totalNetSpend: 12800,
        storageTB: 42.5,
        workspacesCount: 22,
      },
      {
        month: 'Feb 2026',
        isForecast: false,
        baseSubscription: 14800,
        storageOverages: 0,
        cdcAddons: 1200,
        partnerDiscount: -3200,
        totalNetSpend: 12800,
        storageTB: 46.1,
        workspacesCount: 25,
      },
      {
        month: 'Mar 2026',
        isForecast: false,
        baseSubscription: 14800,
        storageOverages: 300,
        cdcAddons: 1500,
        partnerDiscount: -3320,
        totalNetSpend: 13280,
        storageTB: 51.0,
        workspacesCount: 28,
      },
      {
        month: 'Apr 2026',
        isForecast: false,
        baseSubscription: 14800,
        storageOverages: 450,
        cdcAddons: 1500,
        partnerDiscount: -3350,
        totalNetSpend: 13400,
        storageTB: 55.4,
        workspacesCount: 31,
      },
      {
        month: 'May 2026',
        isForecast: false,
        baseSubscription: 14800,
        storageOverages: 600,
        cdcAddons: 1800,
        partnerDiscount: -3440,
        totalNetSpend: 13760,
        storageTB: 58.8,
        workspacesCount: 33,
      },
      {
        month: 'Jun 2026',
        isForecast: false,
        baseSubscription: 14800,
        storageOverages: 750,
        cdcAddons: 1800,
        partnerDiscount: -3470,
        totalNetSpend: 13880,
        storageTB: 61.2,
        workspacesCount: 35,
      },
      {
        month: 'Jul 2026',
        isForecast: false,
        baseSubscription: 14800,
        storageOverages: 900,
        cdcAddons: 2000,
        partnerDiscount: -3540,
        totalNetSpend: 14160,
        storageTB: 63.8,
        workspacesCount: 37,
      },
      {
        month: 'Aug 2026',
        isForecast: false,
        baseSubscription: 14800,
        storageOverages: 1050,
        cdcAddons: 2000,
        partnerDiscount: -3570,
        totalNetSpend: 14280,
        storageTB: 64.2,
        workspacesCount: 38,
      },
      // Forecast Months
      {
        month: 'Sep 2026*',
        isForecast: true,
        baseSubscription: 14800,
        storageOverages: Math.round(1500 * scenarioMultiplier),
        cdcAddons: Math.round(2200 * scenarioMultiplier),
        partnerDiscount: -3700,
        totalNetSpend: Math.round(14800 + 1500 * scenarioMultiplier + 2200 * scenarioMultiplier - 3700),
        storageTB: Number((68.5 * (scenarioMultiplier > 1.1 ? 1.08 : 1.04)).toFixed(1)),
        workspacesCount: Math.round(41 * (scenarioMultiplier > 1.1 ? 1.08 : 1)),
        upperConfidenceBound: Math.round(16800 * scenarioMultiplier),
        lowerConfidenceBound: Math.round(13900 * scenarioMultiplier),
      },
      {
        month: 'Oct 2026*',
        isForecast: true,
        baseSubscription: 14800,
        storageOverages: Math.round(2100 * scenarioMultiplier),
        cdcAddons: Math.round(2400 * scenarioMultiplier),
        partnerDiscount: -3860,
        totalNetSpend: Math.round(14800 + 2100 * scenarioMultiplier + 2400 * scenarioMultiplier - 3860),
        storageTB: Number((74.2 * (scenarioMultiplier > 1.1 ? 1.12 : 1.05)).toFixed(1)),
        workspacesCount: Math.round(44 * (scenarioMultiplier > 1.1 ? 1.12 : 1.02)),
        upperConfidenceBound: Math.round(18200 * scenarioMultiplier),
        lowerConfidenceBound: Math.round(14400 * scenarioMultiplier),
      },
      {
        month: 'Nov 2026*',
        isForecast: true,
        baseSubscription: 14800,
        storageOverages: Math.round(2800 * scenarioMultiplier),
        cdcAddons: Math.round(2600 * scenarioMultiplier),
        partnerDiscount: -4040,
        totalNetSpend: Math.round(14800 + 2800 * scenarioMultiplier + 2600 * scenarioMultiplier - 4040),
        storageTB: Number((81.0 * (scenarioMultiplier > 1.1 ? 1.15 : 1.06)).toFixed(1)),
        workspacesCount: Math.round(47 * (scenarioMultiplier > 1.1 ? 1.15 : 1.03)),
        upperConfidenceBound: Math.round(19500 * scenarioMultiplier),
        lowerConfidenceBound: Math.round(14900 * scenarioMultiplier),
      },
      {
        month: 'Dec 2026*',
        isForecast: true,
        baseSubscription: 14800,
        storageOverages: Math.round(3600 * scenarioMultiplier),
        cdcAddons: Math.round(3000 * scenarioMultiplier),
        partnerDiscount: -4280,
        totalNetSpend: Math.round(14800 + 3600 * scenarioMultiplier + 3000 * scenarioMultiplier - 4280),
        storageTB: Number((88.5 * (scenarioMultiplier > 1.1 ? 1.18 : 1.08)).toFixed(1)),
        workspacesCount: Math.round(50 * (scenarioMultiplier > 1.1 ? 1.18 : 1.05)),
        upperConfidenceBound: Math.round(21000 * scenarioMultiplier),
        lowerConfidenceBound: Math.round(15500 * scenarioMultiplier),
      },
    ];

    if (timeHorizon === '6m') {
      return baseData.slice(6); // Jul to Dec
    } else if (timeHorizon === 'ytd') {
      return baseData.filter((d) => !d.isForecast); // Jan to Aug
    }
    return baseData; // 12m full scope
  }, [timeHorizon, forecastScenario]);

  // Financial aggregates
  const totalActualYtdSpend = useMemo(() => {
    return data.filter((d) => !d.isForecast).reduce((sum, d) => sum + d.totalNetSpend, 0);
  }, [data]);

  const totalForecastedQ4Spend = useMemo(() => {
    return data.filter((d) => d.isForecast).reduce((sum, d) => sum + d.totalNetSpend, 0);
  }, [data]);

  const projectedYearEndTB = useMemo(() => {
    const dec = data.find((d) => d.month.startsWith('Dec'));
    return dec ? dec.storageTB : 88.5;
  }, [data]);

  const avgMonthlySpend = useMemo(() => {
    return Math.round(data.reduce((sum, d) => sum + d.totalNetSpend, 0) / (data.length || 1));
  }, [data]);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item: SpendDataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white p-4 rounded-2xl shadow-2xl text-xs space-y-2 max-w-xs z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-mono font-extrabold text-indigo-400 text-sm">{label}</span>
            {item.isForecast ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                PROJECTED FORECAST
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                ACTUAL STRIPE SETTLED
              </span>
            )}
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span>Base Subscription Fee:</span>
              <span className="font-bold text-white">${item.baseSubscription.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Storage Overages (&gt;100 TB):</span>
              <span className="font-bold text-amber-400">${item.storageOverages.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>CDC Streaming Add-ons:</span>
              <span className="font-bold text-indigo-300">${item.cdcAddons.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Partner Tier Discount (20%):</span>
              <span className="font-bold">${item.partnerDiscount.toLocaleString()}</span>
            </div>

            <div className="border-t border-slate-800 pt-2 flex justify-between font-black text-sm text-indigo-300">
              <span>Net Monthly Spend:</span>
              <span>${item.totalNetSpend.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 space-y-1 mt-2">
            <div className="flex justify-between">
              <span>Capacity Storage:</span>
              <span className="text-white font-bold">{item.storageTB} TB / 100 TB</span>
            </div>
            <div className="flex justify-between">
              <span>Active Workspaces:</span>
              <span className="text-white font-bold">{item.workspacesCount} Workspaces</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Partner Spend &amp; Capacity Usage Forecast
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-mono font-extrabold">
              AI Forecast Engine v2.4
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Historical Stripe subscription billing trends blended with machine-learning capacity overage projections.
          </p>
        </div>

        {/* CONTROLS & TOGGLES */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Horizon Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(
              [
                { id: '6m', label: '6 Months' },
                { id: '12m', label: '12 Months (Full)' },
                { id: 'ytd', label: 'YTD Settled' },
              ] as const
            ).map((th) => (
              <button
                key={th.id}
                onClick={() => setTimeHorizon(th.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeHorizon === th.id
                    ? 'bg-white text-indigo-600 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {th.label}
              </button>
            ))}
          </div>

          {/* Metric View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(
              [
                { id: 'spend', label: 'Spend ($)', icon: DollarSign },
                { id: 'capacity', label: 'Storage (TB)', icon: Zap },
                { id: 'combined', label: 'Combined', icon: BarChart2 },
              ] as const
            ).map((mv) => {
              const Icon = mv.icon;
              return (
                <button
                  key={mv.id}
                  onClick={() => setMetricView(mv.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    metricView === mv.id
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mv.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scenario Selector */}
          <select
            value={forecastScenario}
            onChange={(e) => setForecastScenario(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="baseline">📈 Scenario: Baseline (+10% MoM)</option>
            <option value="aggressive">🚀 Scenario: High Reseller Onboarding (+22% MoM)</option>
            <option value="conservative">🛡️ Scenario: Conservative Flat Usage (+3% MoM)</option>
          </select>
        </div>
      </div>

      {/* KPI METRIC HIGHLIGHT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Avg Monthly Spend</span>
            <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            ${avgMonthlySpend.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Includes 20% Partner Reseller Margin
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Forecasted Q4 Total Spend</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-indigo-700 font-mono">
            ${totalForecastedQ4Spend.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Projected Sep – Dec 2026 Commitment
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Dec 2026 Projected Storage</span>
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {projectedYearEndTB} TB
          </div>
          <div className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> 88.5% of 100 TB Included Baseline
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Reseller Annual Margin</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">
            $44,400 / yr
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            20% Contract Discount Retained
          </div>
        </div>
      </div>

      {/* RECHARTS MAIN VISUALIZATION CANVAS (White Theme) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
              <span className="w-3 h-3 rounded-xs bg-indigo-600 inline-block"></span> Base Subscription
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 font-bold">
              <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block"></span> Overages / Add-ons
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span> Net Spend Trend
            </span>
            <span className="flex items-center gap-1.5 text-cyan-700 font-bold">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-500 inline-block"></span> AI Forecast Interval
            </span>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:block">
            *Dashed regions indicate AI predictive trends
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 15, right: 20, bottom: 20, left: 10 }}>
              <defs>
                <linearGradient id="netSpendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>

                <linearGradient id="forecastBoundsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.01} />
                </linearGradient>

                <linearGradient id="storageAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 'bold' }}
                dy={10}
              />
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#475569' }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />

              {metricView === 'combined' && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#10b981"
                  tick={{ fontSize: 11, fill: '#059669' }}
                  tickFormatter={(val) => `${val} TB`}
                />
              )}

              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: '#475569' }} />

              <ReferenceLine
                yAxisId="left"
                y={14800}
                stroke="#6366f1"
                strokeDasharray="4 4"
                label={{
                  value: 'Enterprise Base Tier Limit ($14,800)',
                  fill: '#818cf8',
                  fontSize: 10,
                  position: 'insideTopLeft',
                }}
              />

              {metricView === 'spend' && (
                <>
                  <Bar
                    yAxisId="left"
                    dataKey="baseSubscription"
                    name="Base Subscription"
                    fill="#4f46e5"
                    stackId="a"
                    radius={[0, 0, 4, 4]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="storageOverages"
                    name="Storage Overages"
                    fill="#f59e0b"
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="cdcAddons"
                    name="CDC Streaming Add-ons"
                    fill="#06b6d4"
                    stackId="a"
                  />

                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="upperConfidenceBound"
                    name="Forecast Upper Bound"
                    stroke="#38bdf8"
                    strokeDasharray="3 3"
                    fill="url(#forecastBoundsGradient)"
                  />

                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalNetSpend"
                    name="Net Monthly Total ($)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#022c22' }}
                    activeDot={{ r: 7 }}
                  />
                </>
              )}

              {metricView === 'capacity' && (
                <>
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="storageTB"
                    name="Storage Volume (TB)"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#storageAreaGradient)"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="workspacesCount"
                    name="Active Workspaces"
                    stroke="#818cf8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <ReferenceLine
                    yAxisId="left"
                    y={100}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    label={{
                      value: '100 TB Baseline Quota Limit',
                      fill: '#f87171',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                </>
              )}

              {metricView === 'combined' && (
                <>
                  <Bar
                    yAxisId="left"
                    dataKey="totalNetSpend"
                    name="Net Monthly Spend ($)"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="storageTB"
                    name="Storage Volume (TB)"
                    stroke="#34d399"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#34d399' }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FORECAST INSIGHTS & CAPACITY ADVISORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
              Capacity Advisory: Storage Quota Threshold
            </h4>
            <p className="text-xs text-amber-900 leading-relaxed">
              Under current partner workspace growth, capacity storage will reach <strong>88.5 TB</strong> by December 2026. Transitioning to the <strong>Global Platform Tier (+250 TB baseline)</strong> avoids overage charges.
            </p>
            {onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className="mt-2 text-xs font-extrabold text-amber-800 hover:text-amber-950 underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Review Tier Upgrade Options</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200/80 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
              Partner Revenue Share Optimization
            </h4>
            <p className="text-xs text-indigo-900 leading-relaxed">
              Your active 20% annual reseller discount provides <strong>$3,700/mo in margin credits</strong>. Additional customer tenant onboardings in Q4 qualify for tier-2 rebate tiers up to 25%.
            </p>
            <button
              onClick={() => onShowToast && onShowToast('📊 Exported financial projection summary CSV.')}
              className="mt-2 text-xs font-extrabold text-indigo-700 hover:text-indigo-900 underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Financial Projection (.CSV)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
