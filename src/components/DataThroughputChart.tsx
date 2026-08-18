import React, { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Activity, TrendingUp, Zap } from 'lucide-react';

interface DataPoint {
  time: string;
  throughput: number;
  total: number;
}

export const DataThroughputChart: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    // Initialize with 60 minutes of mock data
    const initialData: DataPoint[] = [];
    const now = new Date();
    
    for (let i = 59; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000);
      initialData.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        throughput: Math.floor(Math.random() * 500) + 800 + (Math.sin(i / 5) * 200),
        total: 14000 + (60 - i) * 100,
      });
    }
    setData(initialData);

    // Real-time update every 10 seconds
    const interval = setInterval(() => {
      setData(prev => {
        const lastPoint = prev[prev.length - 1];
        const nextTime = new Date();
        const newPoint: DataPoint = {
          time: nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          throughput: Math.floor(Math.random() * 400) + 900 + (Math.sin(Date.now() / 10000) * 150),
          total: lastPoint.total + Math.floor(Math.random() * 50),
        };
        return [...prev.slice(1), newPoint];
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const currentThroughput = data.length > 0 ? data[data.length - 1].throughput : 0;
  const avgThroughput = useMemo(() => 
    data.length > 0 ? Math.round(data.reduce((acc, d) => acc + d.throughput, 0) / data.length) : 0
  , [data]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Real-Time Data Throughput
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Processing velocity tracking (Records/sec) across all active worker clusters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Rate</p>
            <p className="text-lg font-black text-slate-900 font-mono tracking-tight flex items-center justify-end gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
              {currentThroughput.toLocaleString()} <span className="text-[10px] font-bold text-slate-500 uppercase">rec/s</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Velocity</p>
            <p className="text-lg font-black text-emerald-600 font-mono tracking-tight flex items-center justify-end gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {avgThroughput.toLocaleString()} <span className="text-[10px] font-bold text-slate-500 uppercase">rec/s</span>
            </p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              minTickGap={30}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '11px',
                fontWeight: 'bold'
              }}
              itemStyle={{ color: '#10b981' }}
              cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="throughput" 
              stroke="#10b981" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorThroughput)" 
              animationDuration={1500}
              name="Throughput (rec/s)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Window: Last 60 Minutes</span>
        <span className="flex items-center gap-1 text-emerald-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Live Stream Active
        </span>
      </div>
    </div>
  );
};
