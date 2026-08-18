import React, { useState } from 'react';
import { TeamMember, MigrationProject } from '../types';
import { OverflowTableWrapper } from './OverflowTableWrapper';
import {
  Flame,
  Snowflake,
  AlertTriangle,
  CheckCircle2,
  Users,
  Grid,
  Calendar,
  Filter,
  ArrowRightLeft,
  Info,
  Timer,
  ChevronRight,
  TrendingUp,
  Sliders,
  X,
  UserCheck,
  Zap,
  Tag,
  Award,
  Sparkles,
} from 'lucide-react';

export interface WorkloadHeatmapProps {
  teamMembers: TeamMember[];
  projects: MigrationProject[];
  allResourceAssignments: Array<{
    memberId: string;
    memberName: string;
    role: string;
    projectId: string;
    projectCode: string;
    projectName: string;
    allocationPct: number;
    allocatedHours: number;
    workedHours: number;
    utilizationPct: number;
    status: 'optimal' | 'over' | 'under';
  }>;
  onSelectMember?: (memberId: string) => void;
  onReassignTrigger?: (projectId: string, sourceMemberId: string) => void;
  onLogHoursTrigger?: (projectId: string, memberId: string) => void;
}

export const WorkloadHeatmap: React.FC<WorkloadHeatmapProps> = ({
  teamMembers,
  projects,
  allResourceAssignments,
  onSelectMember,
  onReassignTrigger,
  onLogHoursTrigger,
}) => {
  // Dimension mode: 'projects' (Member x Project) or 'timeline' (Member x Week Horizon)
  const [dimensionMode, setDimensionMode] = useState<'projects' | 'timeline'>('projects');
  
  // Workload filter: 'all' | 'high' (>90% Red) | 'optimal' (70-90%) | 'under' (<70% Blue)
  const [filterThreshold, setFilterThreshold] = useState<'all' | 'high' | 'optimal' | 'under'>('all');

  // Search & Skill filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('all');

  // Unique list of skills from all team members
  const allAvailableSkills = Array.from(
    new Set(teamMembers.flatMap((m) => m.skills || []))
  ).sort();

  // Selected member for detail drawer/popover
  const [inspectedMemberId, setInspectedMemberId] = useState<string | null>(null);

  // Weeks for timeline view
  const timelineWeeks = [
    { key: 'w1', label: 'Week 1', dateRange: 'Aug 10 - Aug 16' },
    { key: 'w2', label: 'Week 2', dateRange: 'Aug 17 - Aug 23' },
    { key: 'w3', label: 'Week 3', dateRange: 'Aug 24 - Aug 30' },
    { key: 'w4', label: 'Week 4', dateRange: 'Aug 31 - Sep 6' },
    { key: 'w5', label: 'Week 5', dateRange: 'Sep 7 - Sep 13' },
    { key: 'w6', label: 'Week 6', dateRange: 'Sep 14 - Sep 20' },
  ];

  // Aggregate stats per team member
  const memberWorkloadMap = new Map<
    string,
    {
      member: TeamMember;
      totalAllocationPct: number;
      totalAllocatedHours: number;
      totalWorkedHours: number;
      projectAllocations: Map<string, { pct: number; hours: number; code: string; name: string }>;
      riskCategory: 'danger' | 'near_capacity' | 'optimal' | 'under_utilized';
    }
  >();

  teamMembers.forEach((member) => {
    // Gather all assignments for this member
    const assignments = allResourceAssignments.filter((a) => a.memberId === member.id);
    const totalAllocatedHours = assignments.reduce((sum, a) => sum + a.allocatedHours, 0);
    const totalWorkedHours = assignments.reduce((sum, a) => sum + a.workedHours, 0);

    // Calculate total allocation percentage
    // If assigned to multiple projects, total allocation is the sum of project allocation percentages
    const totalAllocationPct = assignments.reduce((sum, a) => sum + a.allocationPct, 0);

    const projectAllocations = new Map<string, { pct: number; hours: number; code: string; name: string }>();
    assignments.forEach((a) => {
      projectAllocations.set(a.projectId, {
        pct: a.allocationPct,
        hours: a.allocatedHours,
        code: a.projectCode,
        name: a.projectName,
      });
    });

    let riskCategory: 'danger' | 'near_capacity' | 'optimal' | 'under_utilized' = 'optimal';
    if (totalAllocationPct > 90) {
      riskCategory = 'danger'; // RED (>90%)
    } else if (totalAllocationPct >= 80) {
      riskCategory = 'near_capacity'; // AMBER (80-90%)
    } else if (totalAllocationPct >= 70) {
      riskCategory = 'optimal'; // EMERALD (70-80%)
    } else {
      riskCategory = 'under_utilized'; // BLUE (<70%)
    }

    memberWorkloadMap.set(member.id, {
      member,
      totalAllocationPct,
      totalAllocatedHours,
      totalWorkedHours,
      projectAllocations,
      riskCategory,
    });
  });

  const memberWorkloadList = Array.from(memberWorkloadMap.values());

  // High-level counts
  const dangerCount = memberWorkloadList.filter((m) => m.totalAllocationPct > 90).length;
  const optimalCount = memberWorkloadList.filter(
    (m) => m.totalAllocationPct >= 70 && m.totalAllocationPct <= 90
  ).length;
  const underUtilizedCount = memberWorkloadList.filter((m) => m.totalAllocationPct < 70).length;

  // Filter list by selected tab, skill filter, & search
  const filteredMemberList = memberWorkloadList.filter((item) => {
    // Skill filter
    if (selectedSkillFilter !== 'all') {
      const memberSkills = item.member.skills || [];
      if (!memberSkills.includes(selectedSkillFilter)) return false;
    }

    // Search query filter (matches name, role, or technical skills)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.member.name.toLowerCase().includes(q);
      const matchRole = item.member.role.toLowerCase().includes(q);
      const matchSkill = item.member.skills?.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchRole && !matchSkill) return false;
    }

    // Threshold filter
    if (filterThreshold === 'high') return item.totalAllocationPct > 90;
    if (filterThreshold === 'optimal') return item.totalAllocationPct >= 70 && item.totalAllocationPct <= 90;
    if (filterThreshold === 'under') return item.totalAllocationPct < 70;
    return true;
  });

  // Helper function to pick styling based on allocation %
  const getHeatTileStyle = (pct: number) => {
    if (pct > 90) {
      // Dangerously High Workload (>90%) - RED
      return {
        bg: 'bg-rose-50 hover:bg-rose-100',
        border: 'border-rose-200',
        text: 'text-rose-900 font-extrabold',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        icon: <Flame className="w-3 h-3 text-rose-600 shrink-0" />,
        label: 'Overloaded',
        barColor: 'bg-rose-600',
      };
    }
    if (pct >= 80) {
      // Near Capacity (80%-90%) - AMBER
      return {
        bg: 'bg-amber-50 hover:bg-amber-100',
        border: 'border-amber-200',
        text: 'text-amber-900 font-bold',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />,
        label: 'Near Limit',
        barColor: 'bg-amber-500',
      };
    }
    if (pct >= 70) {
      // Optimal Target (70%-80%) - EMERALD
      return {
        bg: 'bg-emerald-50 hover:bg-emerald-100',
        border: 'border-emerald-200',
        text: 'text-emerald-900 font-semibold',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />,
        label: 'Optimal',
        barColor: 'bg-emerald-600',
      };
    }
    if (pct > 0) {
      // Under-Utilized (<70%) - BLUE
      return {
        bg: 'bg-sky-50 hover:bg-sky-100',
        border: 'border-sky-200',
        text: 'text-sky-900 font-semibold',
        badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
        icon: <Snowflake className="w-3 h-3 text-sky-600 shrink-0" />,
        label: 'Under-Utilized',
        barColor: 'bg-sky-500',
      };
    }
    // Zero / Unassigned - LIGHT SLATE
    return {
      bg: 'bg-slate-50 hover:bg-slate-100',
      border: 'border-slate-200',
      text: 'text-slate-400 font-normal',
      badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: null,
      label: 'Free',
      barColor: 'bg-slate-300',
    };
  };

  const inspectedMemberData = inspectedMemberId ? memberWorkloadMap.get(inspectedMemberId) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 border border-slate-200 rounded-xl text-slate-800 shadow-xs">
              <Flame className="w-5 h-5 text-rose-600 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-mono tracking-tight flex items-center gap-2">
                <span>Team Workload Heatmap Matrix</span>
                <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-mono rounded-full font-extrabold uppercase">
                  Overload Guard
                </span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Visual workload distribution highlighting dangerously high allocation (<span className="text-rose-700 font-bold">&gt;90% Red</span>) and under-utilized capacity (<span className="text-sky-700 font-bold">&lt;70% Blue</span>).
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dimension Mode Toggle */}
          <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-xl text-xs font-mono">
            <button
              onClick={() => setDimensionMode('projects')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                dimensionMode === 'projects'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>By Projects ({projects.length})</span>
            </button>
            <button
              onClick={() => setDimensionMode('timeline')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                dimensionMode === 'timeline'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>6-Week Timeline</span>
            </button>
          </div>

          {/* Skill / Technical Proficiency Filter */}
          <div className="relative flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-mono">
            <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <select
              value={selectedSkillFilter}
              onChange={(e) => setSelectedSkillFilter(e.target.value)}
              className="bg-transparent text-slate-900 text-xs outline-none cursor-pointer border-none font-mono py-0.5"
            >
              <option value="all" className="bg-white text-slate-900">
                All Skills ({allAvailableSkills.length})
              </option>
              {allAvailableSkills.map((sk) => (
                <option key={sk} value={sk} className="bg-white text-slate-900">
                  Skill: {sk}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search member, role, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 transition w-48"
            />
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Threshold Filter Tabs & Color Legend Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs">
        {/* Workload Risk Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono">
          <span className="text-slate-500 text-[11px] font-semibold mr-1">Workload Filter:</span>
          <button
            onClick={() => setFilterThreshold('all')}
            className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
              filterThreshold === 'all'
                ? 'bg-slate-800 text-white font-bold'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            All Members ({memberWorkloadList.length})
          </button>
          <button
            onClick={() => setFilterThreshold('high')}
            className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
              filterThreshold === 'high'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <Flame className="w-3 h-3 text-rose-600" />
            <span>Overloaded &gt;90% ({dangerCount})</span>
          </button>
          <button
            onClick={() => setFilterThreshold('optimal')}
            className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
              filterThreshold === 'optimal'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Optimal 70-90% ({optimalCount})</span>
          </button>
          <button
            onClick={() => setFilterThreshold('under')}
            className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer ${
              filterThreshold === 'under'
                ? 'bg-sky-600 text-white font-bold'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
            }`}
          >
            <Snowflake className="w-3 h-3 text-sky-600" />
            <span>Under-Utilized &lt;70% ({underUtilizedCount})</span>
          </button>
        </div>

        {/* Heat Map Swatch Gradient Legend */}
        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-500">
          <span className="text-[10px] uppercase text-slate-500">Legend:</span>
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-md text-[10px] font-bold">
              &lt;70% Blue
            </span>
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-[10px] font-bold">
              70-80% Green
            </span>
            <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-[10px] font-bold">
              80-90% Amber
            </span>
            <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-[10px] font-extrabold animate-pulse">
              &gt;90% Red
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Matrix Grid Table */}
      <OverflowTableWrapper
        showScrollButtons={true}
        showScrollHint={true}
        hintLabel="Scroll horizontally to view all project / timeline columns"
        theme="light"
      >
        <table className="w-full text-left border-collapse font-sans min-w-[780px]">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase tracking-wider bg-slate-50">
              <th className="py-3 px-4 w-60 sticky left-0 z-20 bg-slate-50 border-r border-slate-200">
                Team Member &amp; Role
              </th>
              <th className="py-3 px-3 w-32 text-center border-r border-slate-200">
                Total Allocation
              </th>

              {/* Dynamic Headers */}
              {dimensionMode === 'projects' ? (
                projects.map((prj) => (
                  <th key={prj.id} className="py-3 px-3 text-center border-r border-slate-200 min-w-[120px]">
                    <div className="font-bold text-slate-900 text-[11px] truncate">{prj.code}</div>
                    <div className="text-[9px] text-slate-500 truncate max-w-[110px] mx-auto">{prj.projectName}</div>
                  </th>
                ))
              ) : (
                timelineWeeks.map((wk) => (
                  <th key={wk.key} className="py-3 px-3 text-center border-r border-slate-200 min-w-[110px]">
                    <div className="font-bold text-slate-900 text-[11px]">{wk.label}</div>
                    <div className="text-[9px] text-slate-500">{wk.dateRange}</div>
                  </th>
                ))
              )}

              <th className="py-3 px-4 text-center w-28 sticky right-0 z-20 bg-slate-50 border-l border-slate-200">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {filteredMemberList.length === 0 ? (
              <tr>
                <td
                  colSpan={dimensionMode === 'projects' ? projects.length + 3 : timelineWeeks.length + 3}
                  className="py-12 text-center text-slate-500 font-mono"
                >
                  No team members matching current filter criteria.
                </td>
              </tr>
            ) : (
              filteredMemberList.map((item) => {
                const totalStyle = getHeatTileStyle(item.totalAllocationPct);

                return (
                  <tr
                    key={item.member.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                    onClick={() => setInspectedMemberId(item.member.id)}
                  >
                    {/* Member Info Sticky Column */}
                    <td className="py-3 px-4 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 transition">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={item.member.avatar}
                            alt={item.member.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                              item.totalAllocationPct > 90
                                ? 'bg-rose-600'
                                : item.totalAllocationPct < 70
                                ? 'bg-sky-600'
                                : 'bg-emerald-600'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-600 transition flex items-center gap-1.5">
                            <span>{item.member.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{item.member.role}</div>
                          {item.member.skills && item.member.skills.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {item.member.skills.slice(0, 2).map((sk) => (
                                <span
                                  key={sk}
                                  className="px-1.5 py-0.2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] rounded font-mono truncate max-w-[90px]"
                                >
                                  {sk}
                                </span>
                              ))}
                              {item.member.skills.length > 2 && (
                                <span className="text-[9px] text-slate-400 font-mono">
                                  +{item.member.skills.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="text-[9px] text-slate-400 font-mono truncate mt-0.5">
                            {item.totalAllocatedHours}h total allocated
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total Allocation Cell */}
                    <td className="py-3 px-3 text-center border-r border-slate-200 font-mono">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 border font-mono ${totalStyle.badgeBg}`}
                        >
                          {totalStyle.icon}
                          <span className="font-extrabold">{item.totalAllocationPct}%</span>
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                          {totalStyle.label}
                        </span>
                      </div>
                    </td>

                    {/* Dynamic Columns */}
                    {dimensionMode === 'projects' ? (
                      projects.map((prj) => {
                        const projAlloc = item.projectAllocations.get(prj.id);
                        const pct = projAlloc ? projAlloc.pct : 0;
                        const hours = projAlloc ? projAlloc.hours : 0;
                        const tileStyle = getHeatTileStyle(pct);

                        return (
                          <td key={prj.id} className="py-2.5 px-2 text-center border-r border-slate-200">
                            <div
                              className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 min-h-[52px] ${tileStyle.bg} ${tileStyle.border}`}
                              title={
                                projAlloc
                                  ? `${item.member.name}: ${pct}% (${hours}h) allocated on ${prj.projectName}`
                                  : `${item.member.name}: Not assigned to ${prj.projectName}`
                              }
                            >
                              {pct > 0 ? (
                                <>
                                  <div className="flex items-center gap-1">
                                    {pct > 90 ? (
                                      <Flame className="w-3 h-3 text-rose-600 animate-pulse" />
                                    ) : pct < 70 ? (
                                      <Snowflake className="w-3 h-3 text-sky-600" />
                                    ) : (
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    )}
                                    <span className={`text-xs font-mono ${tileStyle.text}`}>{pct}%</span>
                                  </div>
                                  <span className="text-[10px] text-slate-600 font-mono font-medium">{hours}h/wk</span>
                                  {/* Micro Progress Bar */}
                                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-0.5">
                                    <div
                                      className={`h-full ${tileStyle.barColor}`}
                                      style={{ width: `${Math.min(100, pct)}%` }}
                                    />
                                  </div>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono">—</span>
                              )}
                            </div>
                          </td>
                        );
                      })
                    ) : (
                      timelineWeeks.map((wk, wkIdx) => {
                        const basePct = item.totalAllocationPct;
                        let wkPct = basePct;
                        if (wkIdx >= 4) {
                          wkPct = Math.max(30, Math.round(basePct * 0.75));
                        }
                        const tileStyle = getHeatTileStyle(wkPct);

                        return (
                          <td key={wk.key} className="py-2.5 px-2 text-center border-r border-slate-200">
                            <div
                              className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 min-h-[52px] ${tileStyle.bg} ${tileStyle.border}`}
                              title={`${item.member.name} forecast for ${wk.label}: ${wkPct}% workload`}
                            >
                              <div className="flex items-center gap-1">
                                {wkPct > 90 ? (
                                  <Flame className="w-3 h-3 text-rose-600" />
                                ) : wkPct < 70 ? (
                                  <Snowflake className="w-3 h-3 text-sky-600" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                )}
                                <span className={`text-xs font-mono ${tileStyle.text}`}>{wkPct}%</span>
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono">{Math.round(wkPct * 1.6)}h</span>
                              <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-0.5">
                                <div
                                  className={`h-full ${tileStyle.barColor}`}
                                  style={{ width: `${Math.min(100, wkPct)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        );
                      })
                    )}

                    {/* Action Column Sticky Right */}
                    <td
                      className="py-3 px-4 text-center sticky right-0 z-10 bg-white group-hover:bg-slate-50 border-l border-slate-200 transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setInspectedMemberId(item.member.id)}
                        className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-indigo-700 border border-slate-200 font-mono text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-2xs"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </OverflowTableWrapper>

      {/* Summary Highlights Footer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 font-mono text-xs">
        {/* Red Risk Highlight Box */}
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <Flame className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="text-[10px] text-rose-800 uppercase tracking-wider font-bold">Overloaded Members (&gt;90%)</div>
              <div className="text-slate-600 text-[11px]">Requires immediate rebalancing or offloading</div>
            </div>
          </div>
          <span className="text-xl font-black text-rose-700 font-mono">{dangerCount}</span>
        </div>

        {/* Emerald Optimal Box */}
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-emerald-800 uppercase tracking-wider font-bold">Optimal Target (70-90%)</div>
              <div className="text-slate-600 text-[11px]">Healthy productivity velocity zone</div>
            </div>
          </div>
          <span className="text-xl font-black text-emerald-700 font-mono">{optimalCount}</span>
        </div>

        {/* Blue Under-Utilized Box */}
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
              <Snowflake className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-sky-800 uppercase tracking-wider font-bold">Under-Utilized (&lt;70%)</div>
              <div className="text-slate-600 text-[11px]">Available capacity ready for incoming tasks</div>
            </div>
          </div>
          <span className="text-xl font-black text-sky-700 font-mono">{underUtilizedCount}</span>
        </div>
      </div>

      {/* Member Inspector Detail Popover Modal */}
      {inspectedMemberData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-5 space-y-4 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={inspectedMemberData.member.avatar}
                  alt={inspectedMemberData.member.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-indigo-200"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-mono flex items-center gap-2">
                    <span>{inspectedMemberData.member.name}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold border ${
                        getHeatTileStyle(inspectedMemberData.totalAllocationPct).badgeBg
                      }`}
                    >
                      {inspectedMemberData.totalAllocationPct}% Allocated
                    </span>
                  </h3>
                  <p className="text-slate-500 text-xs">{inspectedMemberData.member.role} • {inspectedMemberData.member.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectedMemberId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overall Allocation Gauge */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Total Workload Allocation Intensity:</span>
                <span
                  className={`font-bold ${
                    inspectedMemberData.totalAllocationPct > 90
                      ? 'text-rose-700'
                      : inspectedMemberData.totalAllocationPct < 70
                      ? 'text-sky-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {inspectedMemberData.totalAllocationPct > 90
                    ? 'Dangerously Overloaded (>90%)'
                    : inspectedMemberData.totalAllocationPct < 70
                    ? 'Under-Utilized (<70%)'
                    : 'Optimal Workload Level'}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden border border-slate-300 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    inspectedMemberData.totalAllocationPct > 90
                      ? 'bg-gradient-to-r from-rose-600 to-red-500'
                      : inspectedMemberData.totalAllocationPct < 70
                      ? 'bg-gradient-to-r from-sky-600 to-cyan-500'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-500'
                  }`}
                  style={{ width: `${Math.min(100, inspectedMemberData.totalAllocationPct)}%` }}
                />
              </div>
            </div>

            {/* Technical Proficiencies & Skill-Set Tags */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-800 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Technical Proficiencies &amp; Skill Tags</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {inspectedMemberData.member.skills?.length || 0} Tags Configured
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {inspectedMemberData.member.skills && inspectedMemberData.member.skills.length > 0 ? (
                  inspectedMemberData.member.skills.map((sk) => (
                    <span
                      key={sk}
                      className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-lg font-bold flex items-center gap-1"
                    >
                      <Award className="w-3 h-3 text-indigo-600" />
                      <span>{sk}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-xs italic">No technical skills configured for this member.</span>
                )}
              </div>
            </div>

            {/* Assigned Project Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider flex items-center justify-between">
                <span>Assigned Projects Breakdown</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {inspectedMemberData.projectAllocations.size} Projects Active
                </span>
              </h4>

              {inspectedMemberData.projectAllocations.size === 0 ? (
                <div className="p-4 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs font-mono">
                  No active project assignments. Member is completely available.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {Array.from(inspectedMemberData.projectAllocations.entries()).map(([prjId, alloc]) => {
                    const prjObj = projects.find((p) => p.id === prjId);
                    const tileStyle = getHeatTileStyle(alloc.pct);

                    return (
                      <div
                        key={prjId}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[10px] rounded border border-indigo-200">
                              {alloc.code}
                            </span>
                            <span className="truncate">{prjObj?.projectName || alloc.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Customer: {prjObj?.customerName || 'Enterprise Account'}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 font-mono">
                          <div className="text-right">
                            <div className={`text-xs font-bold ${tileStyle.text}`}>{alloc.pct}% Alloc</div>
                            <div className="text-[10px] text-slate-500">{alloc.hours}h / week</div>
                          </div>

                          {onReassignTrigger && (
                            <button
                              type="button"
                              onClick={() => {
                                onReassignTrigger(prjId, inspectedMemberData.member.id);
                                setInspectedMemberId(null);
                              }}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer"
                              title="Rebalance or reassign workload"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                {inspectedMemberData.totalWorkedHours}h worked so far across all projects
              </span>

              <button
                type="button"
                onClick={() => setInspectedMemberId(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
