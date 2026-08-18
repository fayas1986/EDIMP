import React, { useState } from 'react';
import { AlertTriangle, KeyRound, Users, Box, CheckCircle2, TrendingUp, AlertCircle, RefreshCw, ChevronRight, Sparkles, ShieldCheck, Zap, Globe, Briefcase, X, BarChart3, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export function LicenseComplianceView() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTierComparison, setShowTierComparison] = useState(false);
  const [showQuickUpgrade, setShowQuickUpgrade] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const handleQuickUpgrade = () => {
    setIsUpgrading(true);
    // Simulate API call for tier transition
    setTimeout(() => {
      setIsUpgrading(false);
      setUpgradeSuccess(true);
    }, 2000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const licenseData = [
    { type: 'Named User', consumed: 4250, limit: 5000, status: 'ok', icon: Users, color: 'indigo' },
    { type: 'Concurrent User', consumed: 85, limit: 100, status: 'warning', icon: Users, color: 'amber' },
    { type: 'Per Tenant', consumed: 48, limit: 50, status: 'critical', icon: Box, color: 'rose' },
    { type: 'Per Project', consumed: 12, limit: 25, status: 'ok', icon: Briefcase, color: 'sky' },
    { type: 'Per Migration', consumed: 86, limit: 150, status: 'ok', icon: RefreshCw, color: 'emerald' },
    { type: 'Consumption Based', consumed: 850, limit: 1000, status: 'warning', icon: TrendingUp, color: 'amber' },
  ];

  const historicalUsageData = [
    { month: 'Mar 2026', namedUsers: 3200, concurrentUsers: 65, tenants: 32, projects: 8, migrations: 45, consumption: 520 },
    { month: 'Apr 2026', namedUsers: 3500, concurrentUsers: 72, tenants: 38, projects: 10, migrations: 58, consumption: 610 },
    { month: 'May 2026', namedUsers: 3800, concurrentUsers: 78, tenants: 42, projects: 11, migrations: 72, consumption: 720 },
    { month: 'Jun 2026', namedUsers: 4050, concurrentUsers: 82, tenants: 45, projects: 12, migrations: 78, consumption: 780 },
    { month: 'Jul 2026', namedUsers: 4150, concurrentUsers: 84, tenants: 47, projects: 12, migrations: 82, consumption: 810 },
    { month: 'Aug 2026', namedUsers: 4250, concurrentUsers: 85, tenants: 48, projects: 12, migrations: 86, consumption: 850 },
  ];

  const tierComparisonData = [
    { subject: 'Named Users', trial: 50, starter: 500, professional: 2000, enterprise: 5000, partner: 15000, unlimited: 100000, fullMark: 100000 },
    { subject: 'Tenants', trial: 1, starter: 5, professional: 20, enterprise: 50, partner: 200, unlimited: 1000, fullMark: 1000 },
    { subject: 'Concurrent', trial: 5, starter: 20, professional: 50, enterprise: 200, partner: 500, unlimited: 5000, fullMark: 5000 },
    { subject: 'Projects', trial: 2, starter: 10, professional: 25, enterprise: 100, partner: 500, unlimited: 2000, fullMark: 2000 },
    { subject: 'Migrations', trial: 10, starter: 50, professional: 150, enterprise: 500, partner: 2500, unlimited: 10000, fullMark: 10000 },
    { subject: 'Storage (TB)', trial: 0.5, starter: 5, professional: 20, enterprise: 100, partner: 500, unlimited: 5000, fullMark: 5000 },
  ];

  const tierFeatures = [
    { feature: 'Core ETL Engine', trial: true, starter: true, professional: true, enterprise: true, partner: true, unlimited: true },
    { feature: 'Job Scheduling', trial: false, starter: true, professional: true, enterprise: true, partner: true, unlimited: true },
    { feature: 'AI Schema Mapping', trial: false, starter: false, professional: true, enterprise: true, partner: true, unlimited: true },
    { feature: 'Multi-Org RBAC', trial: false, starter: false, professional: false, enterprise: true, partner: true, unlimited: true },
    { feature: 'Dedicated Compute', trial: false, starter: false, professional: false, enterprise: true, partner: true, unlimited: true },
    { feature: 'White Labeling', trial: false, starter: false, professional: false, enterprise: false, partner: true, unlimited: true },
    { feature: 'Global DR Clusters', trial: false, starter: false, professional: false, enterprise: false, partner: false, unlimited: true },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent"></div>
        <div className="relative z-10 space-y-2 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <KeyRound className="w-8 h-8 text-indigo-600" />
            License Compliance
          </h2>
          <p className="text-slate-500 text-sm">
            Monitor current license consumption versus your active Enterprise tier limits.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setShowQuickUpgrade(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-2 border-b-2 border-amber-600 active:translate-y-[1px] active:border-b-0"
          >
            <Zap className="w-4 h-4 fill-current" />
            Quick Upgrade
          </button>
          <button
            onClick={() => setShowTierComparison(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer transition-all flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Compare Tiers
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Sync Status'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Alerts */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-extrabold text-rose-900">Approaching Tenant License Limit</h4>
                <p className="text-xs text-rose-700 mt-1">
                  You have consumed 48 out of 50 available Tenant licenses. Provisioning new tenants may fail soon. Consider upgrading to the Unlimited tier.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowQuickUpgrade(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2 shrink-0 ml-4"
            >
              <Zap className="w-4 h-4 fill-current" />
              Upgrade Now
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {licenseData.map((item, idx) => {
              const Icon = item.icon;
              const percentage = (item.consumed / item.limit) * 100;
              
              return (
                <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl bg-${item.color}-50 text-${item.color}-600`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900">{item.type}</h3>
                    </div>
                    {item.status === 'ok' ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                      </span>
                    ) : item.status === 'warning' ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5" /> Warning
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" /> Critical
                      </span>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex justify-between items-end mb-2">
                      <div className="text-sm text-slate-500 font-medium">Consumption</div>
                      <div className="text-base font-black text-slate-900">
                        {item.consumed.toLocaleString()} <span className="text-slate-400 text-sm font-medium">/ {item.limit.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.status === 'ok' ? 'bg-emerald-500' : item.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                      <span>{item.type} usage</span>
                      <span className="font-bold">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1">
          {/* Historical Usage Trend */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col h-full min-h-[400px]">
            <div className="mb-6">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                6-Month Trend
              </h3>
              <p className="text-xs text-slate-500 mt-1">Growth of license consumption across all categories.</p>
            </div>
            
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '12px', 
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ padding: '2px 0' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '10px', fontWeight: 700, paddingBottom: '20px' }}
                  />
                  <Area 
                    name="Named Users"
                    type="monotone" 
                    dataKey="namedUsers" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                  <Area 
                    name="Consumption (GB)"
                    type="monotone" 
                    dataKey="consumption" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorConsumption)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Comparison Overlay Modal */}
      {showTierComparison ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950 bg-opacity-80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-500" />
                  Subscription Tier & Quota Comparison
                </h3>
                <p className="text-xs text-slate-500 font-medium">Compare your current Enterprise plan with available upgrades.</p>
              </div>
              <button 
                onClick={() => setShowTierComparison(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      Quota Expansion Matrix
                    </h4>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Starter</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Enterprise</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Partner</div>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={tierComparisonData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar
                          name="Starter"
                          dataKey="starter"
                          stroke="#94a3b8"
                          fill="#94a3b8"
                          fillOpacity={0.1}
                        />
                        <Radar
                          name="Enterprise (Current)"
                          dataKey="enterprise"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.2}
                        />
                        <Radar
                          name="Partner"
                          dataKey="partner"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.2}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: 'none', 
                            borderRadius: '12px', 
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Tier Capabilities Matrix
                  </h4>
                  <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter">Capabilities</th>
                          <th className="px-3 py-3 font-black text-slate-400 text-center uppercase tracking-tighter">Starter</th>
                          <th className="px-3 py-3 font-black text-indigo-600 text-center uppercase tracking-tighter bg-indigo-50">Enterprise</th>
                          <th className="px-3 py-3 font-black text-slate-400 text-center uppercase tracking-tighter">Partner</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {tierFeatures.map((f, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-700">{f.feature}</td>
                            <td className="px-3 py-3 text-center">
                              {f.starter ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                            </td>
                            <td className="px-3 py-3 text-center bg-indigo-50">
                              {f.enterprise ? <CheckCircle2 className="w-4 h-4 text-indigo-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {f.partner ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
                    <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-indigo-800 leading-relaxed">
                      <strong>Pro-tip:</strong> Moving from Enterprise to the Partner tier unlocks the reseller dashboard and white-labeling capabilities, ideal for agencies managing multiple customer projects simultaneously.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Enterprise', status: 'Current Plan', color: 'indigo', desc: 'Full migration suite with multi-tenant support.' },
                  { name: 'Partner', status: 'Recommended', color: 'emerald', desc: 'Reseller capabilities and high-volume migration pools.' },
                  { name: 'Unlimited', status: 'Max Capacity', color: 'amber', desc: 'No-limit quotas for global hyperscale enterprises.' },
                ].map((t, idx) => (
                  <div key={idx} className={`p-6 rounded-3xl border-2 ${t.name === 'Enterprise' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white'} relative overflow-hidden group hover:shadow-lg transition-all`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${t.name === 'Enterprise' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {t.status}
                      </span>
                      {t.name !== 'Enterprise' && <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />}
                    </div>
                    <h5 className="text-xl font-black text-slate-900 mb-1">{t.name} Tier</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
                    {t.name !== 'Enterprise' && (
                      <button className="mt-4 w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-indigo-600 transition-colors cursor-pointer">
                        Request Upgrade Info
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {/* Quick Upgrade One-Click Modal */}
      {showQuickUpgrade && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 relative">
            {!upgradeSuccess ? (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mb-6 animate-bounce">
                  <Zap className="w-10 h-10 text-amber-600 fill-amber-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Instant Capacity Upgrade</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-8">
                  We've detected you're at <span className="text-rose-600 font-bold">96% Tenant capacity</span>. 
                  Upgrade to the <span className="text-indigo-600 font-bold">Partner Tier</span> now to unlock 200+ tenants and 500 TB storage instantly.
                </p>

                <div className="w-full space-y-3 mb-8">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase">Current Tier</span>
                    <span className="text-sm font-black text-slate-900">Enterprise</span>
                  </div>
                  <div className="flex justify-center">
                    <ChevronRight className="w-5 h-5 text-slate-300 rotate-90" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-600 uppercase">Target Tier</span>
                    <span className="text-sm font-black text-indigo-900">Partner Upgrade</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button 
                    onClick={() => setShowQuickUpgrade(false)}
                    disabled={isUpgrading}
                    className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-2xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Maybe Later
                  </button>
                  <button 
                    onClick={handleQuickUpgrade}
                    disabled={isUpgrading}
                    className="py-3 px-6 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:bg-slate-700"
                  >
                    {isUpgrading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Upgrade Now'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10 flex flex-col items-center text-center bg-gradient-to-b from-emerald-50 to-white">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-200 animate-in zoom-in spin-in-90 duration-500">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2">Upgrade Successful!</h3>
                <p className="text-sm text-slate-600 mb-8 leading-relaxed">
                  Your workspace has been migrated to the <span className="font-bold text-emerald-600">Partner Tier</span>. 
                  All quota limits have been expanded by 400%.
                </p>
                <button 
                  onClick={() => {
                    setShowQuickUpgrade(false);
                    setUpgradeSuccess(false);
                  }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg transition-all cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
