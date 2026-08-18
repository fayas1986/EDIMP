import React, { useState, useMemo } from 'react';
import {
  MOCK_CUSTOMERS,
  MOCK_PROJECTS,
  MOCK_PROJECT_TEMPLATES,
  MOCK_TEAM_MEMBERS,
} from '../data/customerProjectData';
import {
  CustomerAccount,
  MigrationProject,
  Milestone,
  ProjectTemplate,
  TeamMember,
} from '../types';
import { WorkloadHeatmap } from './WorkloadHeatmap';
import {
  Building2,
  FolderKanban,
  Users,
  Calendar,
  Sparkles,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Layers,
  Activity,
  FileText,
  UserPlus,
  BarChart2,
  PieChart,
  Briefcase,
  X,
  Database,
  RefreshCw,
  Sliders,
  Download,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  Trash2,
  Edit3,
  Timer,
  UserCheck,
  Zap,
  Eye,
  GripVertical,
  Move,
  RotateCcw,
  Tag,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';

interface CustomerProjectManagementViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const CustomerProjectManagementView: React.FC<CustomerProjectManagementViewProps> = ({
  onNavigateTab,
}) => {
  // Navigation Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'customers' | 'projects' | 'timeline' | 'team' | 'templates'
  >('dashboard');

  // Core State
  const [customers, setCustomers] = useState<CustomerAccount[]>(MOCK_CUSTOMERS);
  const [projects, setProjects] = useState<MigrationProject[]>(MOCK_PROJECTS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(MOCK_TEAM_MEMBERS);
  const [templates] = useState<ProjectTemplate[]>(MOCK_PROJECT_TEMPLATES);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');

  // Selected Detail Views
  const [activeProject, setActiveProject] = useState<MigrationProject | null>(projects[0] || null);
  const [activeCustomer, setActiveCustomer] = useState<CustomerAccount | null>(null);

  // Modals State
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplateForInstantiate, setSelectedTemplateForInstantiate] = useState<ProjectTemplate | null>(null);
  const [isTeamAssignModalOpen, setIsTeamAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // New Customer Form State
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    code: '',
    industry: 'Financial Services' as CustomerAccount['industry'],
    tierSla: 'Enterprise Gold (99.99%)' as CustomerAccount['tierSla'],
    primaryContact: '',
    contactEmail: '',
    contactPhone: '',
    accountManager: 'Rachel Adams',
    region: 'North America (US-East)' as CustomerAccount['region'],
    targetCutoverDate: '2026-12-31',
    notes: '',
  });

  // New Project Form State
  const [newProject, setNewProject] = useState({
    customerId: '',
    projectName: '',
    code: '',
    description: '',
    templateId: '',
    sourceConnectorName: 'SAP ECC6 Production ERP',
    targetConnectorName: 'SAP S/4HANA Cloud Tenant',
    startDate: new Date().toISOString().split('T')[0],
    targetCutoverDate: '2026-11-30',
    totalRecordsToMigrate: 5000000,
    riskLevel: 'Low' as MigrationProject['riskLevel'],
  });

  // Quick Status Transition Form State
  const [statusUpdateForm, setStatusUpdateForm] = useState<{
    projectId: string;
    newStatus: MigrationProject['status'];
    progressPct: number;
    logNote: string;
  }>({
    projectId: '',
    newStatus: 'In Progress',
    progressPct: 50,
    logNote: '',
  });

  // Team Assignment Form State
  const [teamAssignForm, setTeamAssignForm] = useState<{
    projectId: string;
    memberId: string;
    role: string;
    allocationPct: number;
  }>({
    projectId: '',
    memberId: '',
    role: 'Data Engineer',
    allocationPct: 50,
  });

  // Computed Metrics
  const totalCustomersCount = customers.length;
  const totalProjectsCount = projects.length;
  const inProgressProjectsCount = projects.filter((p) => p.status === 'In Progress' || p.status === 'In Cutover').length;
  const highRiskProjectsCount = projects.filter((p) => p.riskLevel === 'High' || p.riskLevel === 'Critical').length;
  const totalRecordsToMigrateSum = projects.reduce((acc, p) => acc + p.totalRecordsToMigrate, 0);
  const totalRecordsMigratedSum = projects.reduce((acc, p) => acc + p.recordsMigrated, 0);
  const overallProgressPct = Math.round((totalRecordsMigratedSum / (totalRecordsToMigrateSum || 1)) * 100);

  // Filtered Projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCustomer = selectedCustomerId === 'all' || p.customerId === selectedCustomerId;
    const matchesStatus = selectedStatusFilter === 'all' || p.status === selectedStatusFilter;
    const matchesRisk = selectedRiskFilter === 'all' || p.riskLevel === selectedRiskFilter;
    return matchesSearch && matchesCustomer && matchesStatus && matchesRisk;
  });

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.primaryContact.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Resource Allocation State & Computations
  const [selectedResourceProjectId, setSelectedResourceProjectId] = useState<string>('all');
  const [selectedResourceStatusFilter, setSelectedResourceStatusFilter] = useState<'all' | 'optimal' | 'over' | 'under'>('all');
  const [isForecastMode, setIsForecastMode] = useState<boolean>(false);
  const [forecastHorizonDays, setForecastHorizonDays] = useState<30 | 60 | 90>(30);
  const [isLogHoursModalOpen, setIsLogHoursModalOpen] = useState(false);
  const [selectedDrillDownMemberId, setSelectedDrillDownMemberId] = useState<string | null>(null);
  const [isExportReportModalOpen, setIsExportReportModalOpen] = useState<boolean>(false);

  // Skill-Set Tagging & Skill Search Filter State
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('all');
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>('');
  const [newSkillInput, setNewSkillInput] = useState<string>('');

  // Extract all unique skills across teamMembers
  const allAvailableSkillsList = useMemo(() => {
    return Array.from(new Set(teamMembers.flatMap((m) => m.skills || []))).sort();
  }, [teamMembers]);

  const handleAddSkillToMember = (memberId: string, skill: string) => {
    if (!skill.trim()) return;
    const trimmed = skill.trim();
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          const currentSkills = m.skills || [];
          if (currentSkills.includes(trimmed)) return m;
          return { ...m, skills: [...currentSkills, trimmed] };
        }
        return m;
      })
    );
    setNewSkillInput('');
  };

  const handleRemoveSkillFromMember = (memberId: string, skillToRemove: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          return {
            ...m,
            skills: (m.skills || []).filter((s) => s !== skillToRemove),
          };
        }
        return m;
      })
    );
  };

  // Drag & Drop Workload Rebalancing State
  const [draggedAssignment, setDraggedAssignment] = useState<{
    projectId: string;
    sourceMemberId: string;
    projectName: string;
    projectCode: string;
    memberName: string;
    allocationPct: number;
  } | null>(null);

  const [dragOverTargetMemberId, setDragOverTargetMemberId] = useState<string | null>(null);

  const [activeQuickReassignCardId, setActiveQuickReassignCardId] = useState<string | null>(null);

  const [rebalanceToast, setRebalanceToast] = useState<{
    message: string;
    timestamp: number;
    undoData?: {
      projectId: string;
      previousTeam: MigrationProject['team'];
    };
  } | null>(null);

  // Drill-Down Computation for Selected Team Member
  const drillDownMemberData = useMemo(() => {
    if (!selectedDrillDownMemberId) return null;

    const memberInfo = teamMembers.find((m) => m.id === selectedDrillDownMemberId);

    const memberAssignments = projects.flatMap((prj) =>
      prj.team
        .filter((tm) => tm.memberId === selectedDrillDownMemberId)
        .map((tm) => {
          const allocated = tm.allocatedHours ?? Math.round(tm.allocationPct * 2);
          const worked = tm.workedHours ?? Math.round(tm.allocationPct * 1.8);
          const utilization = allocated > 0 ? Math.round((worked / allocated) * 100) : 0;
          const burnRate = allocated > 0 ? Number((worked / allocated).toFixed(2)) : 1.0;
          const progressPct = prj.progressPct ?? 65;
          const remainingProgress = Math.max(0, 100 - progressPct);
          const estimatedDaysToComplete = Math.max(4, Math.round((remainingProgress * 0.45) * (burnRate > 1.1 ? 1.25 : 0.85)));
          const rollOffDate = new Date();
          rollOffDate.setDate(rollOffDate.getDate() + estimatedDaysToComplete);
          const rollOffFormatted = rollOffDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

          return {
            ...tm,
            projectId: prj.id,
            projectName: prj.projectName,
            projectCode: prj.code,
            customerName: prj.customerName,
            allocatedHours: allocated,
            workedHours: worked,
            utilizationPct: utilization,
            burnRate,
            progressPct,
            estimatedDaysToComplete,
            rollOffFormatted,
          };
        })
    );

    const memberName = memberInfo?.name || memberAssignments[0]?.memberName || 'Team Member';
    const role = memberInfo?.role || memberAssignments[0]?.role || 'Engineer';
    const avatar = memberInfo?.avatar || memberAssignments[0]?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    const skills = memberInfo?.skills || [];

    const totalAllocated = memberAssignments.reduce((acc, a) => acc + a.allocatedHours, 0);
    const totalWorked = memberAssignments.reduce((acc, a) => acc + a.workedHours, 0);
    const overallUtil = totalAllocated > 0 ? Math.round((totalWorked / totalAllocated) * 100) : 0;
    const totalAllocPct = memberAssignments.reduce((acc, a) => acc + a.allocationPct, 0);

    const weeklyBaseline = 40;
    const weeklyAllocatedHours = Math.round((totalAllocPct / 100) * weeklyBaseline);
    const weeklyWorkedHours = Math.round((totalWorked / Math.max(1, totalAllocated || 1)) * weeklyAllocatedHours);

    const weeklyLoadSchedule = [
      { weekLabel: 'Week 1 (Current)', alloc: Math.round(weeklyAllocatedHours * 1.0), worked: Math.round(weeklyWorkedHours * 1.08), status: weeklyWorkedHours * 1.08 > weeklyAllocatedHours ? 'Over Capacity' : 'Optimal' },
      { weekLabel: 'Week 2 (+7d Horizon)', alloc: Math.round(weeklyAllocatedHours * 1.0), worked: Math.round(weeklyWorkedHours * 1.0), status: weeklyWorkedHours > weeklyAllocatedHours ? 'Over Capacity' : 'Optimal' },
      { weekLabel: 'Week 3 (+14d Horizon)', alloc: Math.round(weeklyAllocatedHours * 0.9), worked: Math.round(weeklyWorkedHours * 0.85), status: 'Optimal' },
      { weekLabel: 'Week 4 (+21d Roll-Off)', alloc: Math.round(weeklyAllocatedHours * 0.75), worked: Math.round(weeklyWorkedHours * 0.7), status: 'Capacity Freed' },
    ];

    return {
      memberInfo,
      memberName,
      role,
      avatar,
      skills,
      memberAssignments,
      totalAllocated,
      totalWorked,
      overallUtil,
      totalAllocPct,
      weeklyBaseline,
      weeklyAllocatedHours,
      weeklyWorkedHours,
      weeklyLoadSchedule,
    };
  }, [selectedDrillDownMemberId, projects, teamMembers]);
  const [logHoursForm, setLogHoursForm] = useState<{
    projectId: string;
    memberId: string;
    hoursToAdd: number;
    hoursType: 'worked' | 'allocated';
    note: string;
  }>({
    projectId: projects[0]?.id || '',
    memberId: '',
    hoursToAdd: 10,
    hoursType: 'worked',
    note: '',
  });

  // Projects relevant to resource view
  const resourceProjects = selectedResourceProjectId === 'all'
    ? projects
    : projects.filter((p) => p.id === selectedResourceProjectId);

  // All team member assignments across selected resource projects
  const allResourceAssignments = resourceProjects.flatMap((prj) =>
    prj.team.map((tm) => {
      const allocated = tm.allocatedHours ?? Math.round(tm.allocationPct * 2);
      const worked = tm.workedHours ?? Math.round(tm.allocationPct * 1.8);
      const utilization = allocated > 0 ? Math.round((worked / allocated) * 100) : 0;
      const variance = worked - allocated;
      let status: 'optimal' | 'over' | 'under' = 'optimal';
      if (utilization > 105) status = 'over';
      else if (utilization < 80) status = 'under';

      const memberObj = teamMembers.find((m) => m.id === tm.memberId);
      const memberSkills = memberObj?.skills || [];

      // Forecast Mock Calculations
      const progressPct = prj.progressPct ?? 65;
      const burnRate = allocated > 0 ? Number((worked / allocated).toFixed(2)) : 1.0;
      const remainingProgress = Math.max(0, 100 - progressPct);
      const estimatedDaysToComplete = Math.max(4, Math.round((remainingProgress * 0.45) * (burnRate > 1.1 ? 1.25 : 0.85)));
      
      const rollOffDate = new Date();
      rollOffDate.setDate(rollOffDate.getDate() + estimatedDaysToComplete);
      const rollOffFormatted = rollOffDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const isRollingOff = estimatedDaysToComplete <= forecastHorizonDays;
      const freedHoursPerWeek = isRollingOff ? Math.round((tm.allocationPct / 100) * 40) : 0;
      const projectedRemainingHours = Math.round(
        Math.max(0, allocated - worked) * (burnRate > 1.0 ? burnRate : 1.0)
      );

      return {
        ...tm,
        skills: memberSkills,
        allocatedHours: allocated,
        workedHours: worked,
        utilizationPct: utilization,
        varianceHours: variance,
        status,
        projectId: prj.id,
        projectName: prj.projectName,
        projectCode: prj.code,
        customerName: prj.customerName,
        // Forecast props
        progressPct,
        burnRate,
        estimatedDaysToComplete,
        rollOffFormatted,
        isRollingOff,
        freedHoursPerWeek,
        projectedRemainingHours,
      };
    })
  );

  // Dynamic Drag & Drop Workload Rebalancing Handler
  const handleReassignProjectAssignment = (
    projectId: string,
    sourceMemberId: string,
    targetMemberId: string
  ) => {
    if (sourceMemberId === targetMemberId) return;

    const targetMember = teamMembers.find((m) => m.id === targetMemberId);
    if (!targetMember) return;

    let prjName = '';
    let sourceMemberName = '';
    let prevTeamState: MigrationProject['team'] = [];

    setProjects((prevProjects) =>
      prevProjects.map((prj) => {
        if (prj.id !== projectId) return prj;

        prevTeamState = [...prj.team];
        prjName = prj.projectName;

        const sourceAssignment = prj.team.find((tm) => tm.memberId === sourceMemberId);
        if (!sourceAssignment) return prj;

        sourceMemberName = sourceAssignment.memberName;

        // Remove source member from project team
        const remainingTeam = prj.team.filter((tm) => tm.memberId !== sourceMemberId);

        // Check if target member is already assigned to this project
        const targetExisting = prj.team.find((tm) => tm.memberId === targetMemberId);

        let updatedTeam;
        if (targetExisting) {
          updatedTeam = remainingTeam.map((tm) => {
            if (tm.memberId === targetMemberId) {
              const combinedAlloc = Math.min(100, tm.allocationPct + sourceAssignment.allocationPct);
              return {
                ...tm,
                allocationPct: combinedAlloc,
                allocatedHours: (tm.allocatedHours ?? 80) + (sourceAssignment.allocatedHours ?? 80),
                workedHours: (tm.workedHours ?? 70) + (sourceAssignment.workedHours ?? 70),
              };
            }
            return tm;
          });
        } else {
          const newAssignment = {
            memberId: targetMember.id,
            memberName: targetMember.name,
            memberEmail: targetMember.email,
            avatar: targetMember.avatar,
            role: targetMember.role || sourceAssignment.role,
            allocationPct: sourceAssignment.allocationPct,
            allocatedHours: sourceAssignment.allocatedHours ?? Math.round(sourceAssignment.allocationPct * 2),
            workedHours: sourceAssignment.workedHours ?? Math.round(sourceAssignment.allocationPct * 1.8),
          };
          updatedTeam = [...remainingTeam, newAssignment];
        }

        return {
          ...prj,
          team: updatedTeam,
        };
      })
    );

    setRebalanceToast({
      message: `Rebalanced "${prjName}" workload from ${sourceMemberName} to ${targetMember.name}`,
      timestamp: Date.now(),
      undoData: {
        projectId,
        previousTeam: prevTeamState,
      },
    });
  };

  const handleUndoRebalance = () => {
    if (!rebalanceToast?.undoData) return;
    const { projectId, previousTeam } = rebalanceToast.undoData;

    setProjects((prevProjects) =>
      prevProjects.map((prj) => (prj.id === projectId ? { ...prj, team: previousTeam } : prj))
    );

    setRebalanceToast(null);
  };

  // Filtered list by status ('all', 'optimal', 'over', 'under'), skill filter, and search query
  const filteredResourceAssignments = allResourceAssignments.filter((a) => {
    if (selectedResourceStatusFilter !== 'all' && a.status !== selectedResourceStatusFilter) {
      return false;
    }
    if (selectedSkillFilter !== 'all' && !a.skills?.includes(selectedSkillFilter)) {
      return false;
    }
    if (skillSearchQuery.trim()) {
      const q = skillSearchQuery.toLowerCase();
      const matchName = a.memberName.toLowerCase().includes(q);
      const matchRole = a.role.toLowerCase().includes(q);
      const matchSkill = a.skills?.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchRole && !matchSkill) return false;
    }
    return true;
  });

  // Resource Allocation Metrics
  const totalResourceAllocatedHours = allResourceAssignments.reduce((acc, a) => acc + a.allocatedHours, 0);
  const totalResourceWorkedHours = allResourceAssignments.reduce((acc, a) => acc + a.workedHours, 0);
  const overallResourceUtilizationPct = totalResourceAllocatedHours > 0
    ? Math.round((totalResourceWorkedHours / totalResourceAllocatedHours) * 100)
    : 0;
  const overAllocatedCount = allResourceAssignments.filter((a) => a.status === 'over').length;

  // Forecast Aggregates
  const totalRollOffsInHorizon = allResourceAssignments.filter((a) => a.isRollingOff).length;
  const totalFreedCapacityHours = allResourceAssignments.reduce((acc, a) => acc + a.freedHoursPerWeek, 0);
  const avgBurnRate = allResourceAssignments.length > 0
    ? (allResourceAssignments.reduce((acc, a) => acc + a.burnRate, 0) / allResourceAssignments.length).toFixed(2)
    : '1.00';
  const overloadRiskCountForecast = allResourceAssignments.filter((a) => a.burnRate > 1.15 || a.projectedRemainingHours > a.allocatedHours * 1.2).length;

  // Chart Data Preparation:
  const resourceChartDataMap = new Map<
    string,
    { memberName: string; role: string; allocated: number; worked: number; projectsCount: number }
  >();
  allResourceAssignments.forEach((a) => {
    const existing = resourceChartDataMap.get(a.memberId);
    if (existing) {
      existing.allocated += a.allocatedHours;
      existing.worked += a.workedHours;
      existing.projectsCount += 1;
    } else {
      resourceChartDataMap.set(a.memberId, {
        memberName: a.memberName,
        role: a.role,
        allocated: a.allocatedHours,
        worked: a.workedHours,
        projectsCount: 1,
      });
    }
  });

  const resourceBarChartData = Array.from(resourceChartDataMap.values()).map((item) => ({
    name: item.memberName,
    shortName: item.memberName.split(' ')[0],
    role: item.role,
    'Allocated Hours': item.allocated,
    'Hours Worked': item.worked,
    utilization: item.allocated > 0 ? Math.round((item.worked / item.allocated) * 100) : 0,
  }));

  // Forecast Bar Chart Data Preparation
  const forecastChartDataMap = new Map<
    string,
    { memberName: string; worked: number; projectedRemaining: number; freedCapacity: number }
  >();
  allResourceAssignments.forEach((a) => {
    const existing = forecastChartDataMap.get(a.memberId);
    if (existing) {
      existing.worked += a.workedHours;
      existing.projectedRemaining += a.projectedRemainingHours;
      existing.freedCapacity += a.freedHoursPerWeek;
    } else {
      forecastChartDataMap.set(a.memberId, {
        memberName: a.memberName,
        worked: a.workedHours,
        projectedRemaining: a.projectedRemainingHours,
        freedCapacity: a.freedHoursPerWeek,
      });
    }
  });

  const forecastBarChartData = Array.from(forecastChartDataMap.values()).map((item) => ({
    name: item.memberName,
    shortName: item.memberName.split(' ')[0],
    'Hours Worked': item.worked,
    'Projected Remaining': item.projectedRemaining,
    'Freed Capacity (h/wk)': item.freedCapacity,
  }));

  // Export Team Utilization Data to CSV Spreadsheet
  const handleExportCSV = () => {
    const headers = [
      'Member Name',
      'Role',
      'Project Code',
      'Project Name',
      'Customer Name',
      'Allocation Capacity %',
      'Allocated Hours',
      'Hours Worked',
      'Utilization %',
      'Variance Hours',
      'Utilization Status',
      'Burn Velocity Rate',
      'Est Roll-Off Date',
      'Freed Capacity (h/wk)',
    ];

    const rows = filteredResourceAssignments.map((ra) => [
      `"${ra.memberName.replace(/"/g, '""')}"`,
      `"${ra.role.replace(/"/g, '""')}"`,
      `"${ra.projectCode.replace(/"/g, '""')}"`,
      `"${ra.projectName.replace(/"/g, '""')}"`,
      `"${ra.customerName.replace(/"/g, '""')}"`,
      ra.allocationPct,
      ra.allocatedHours,
      ra.workedHours,
      `${ra.utilizationPct}%`,
      ra.varianceHours,
      ra.status.toUpperCase(),
      `${ra.burnRate}x`,
      `"${ra.rollOffFormatted}"`,
      `${ra.freedHoursPerWeek}h`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `Team_Resource_Utilization_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLogHoursSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logHoursForm.projectId || !logHoursForm.memberId || !logHoursForm.hoursToAdd) return;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === logHoursForm.projectId) {
          const targetMember = p.team.find((t) => t.memberId === logHoursForm.memberId);
          if (!targetMember) return p;

          const currentAllocated = targetMember.allocatedHours ?? Math.round(targetMember.allocationPct * 2);
          const currentWorked = targetMember.workedHours ?? Math.round(targetMember.allocationPct * 1.8);

          const updatedTeam = p.team.map((t) => {
            if (t.memberId === logHoursForm.memberId) {
              if (logHoursForm.hoursType === 'worked') {
                return { ...t, workedHours: currentWorked + Number(logHoursForm.hoursToAdd) };
              } else {
                return { ...t, allocatedHours: currentAllocated + Number(logHoursForm.hoursToAdd) };
              }
            }
            return t;
          });

          return {
            ...p,
            team: updatedTeam,
            auditLogs: [
              {
                id: `al-${Date.now()}`,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                user: targetMember.memberName,
                action: logHoursForm.hoursType === 'worked' ? 'HOURS_LOGGED' : 'ALLOCATION_ADJUSTED',
                details: `${logHoursForm.hoursType === 'worked' ? 'Logged' : 'Added'} ${logHoursForm.hoursToAdd} hours for ${targetMember.memberName}. ${logHoursForm.note}`,
              },
              ...p.auditLogs,
            ],
          };
        }
        return p;
      })
    );

    setIsLogHoursModalOpen(false);
  };

  // Handlers
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;

    const createdCust: CustomerAccount = {
      id: `cust-${Date.now()}`,
      name: newCustomer.name,
      code: newCustomer.code || `CUST-${newCustomer.name.substring(0, 4).toUpperCase()}`,
      industry: newCustomer.industry,
      tierSla: newCustomer.tierSla,
      primaryContact: newCustomer.primaryContact || 'Primary Contact',
      contactEmail: newCustomer.contactEmail || 'contact@organization.com',
      contactPhone: newCustomer.contactPhone || '+1 (555) 000-0000',
      accountManager: newCustomer.accountManager,
      region: newCustomer.region,
      healthScore: 95,
      targetCutoverDate: newCustomer.targetCutoverDate,
      status: 'Active',
      projectsCount: 0,
      totalRecordsToMigrate: 0,
      notes: newCustomer.notes || 'Newly onboarded enterprise customer.',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCustomers((prev) => [createdCust, ...prev]);
    setIsCreateCustomerOpen(false);
    setNewCustomer({
      name: '',
      code: '',
      industry: 'Financial Services',
      tierSla: 'Enterprise Gold (99.99%)',
      primaryContact: '',
      contactEmail: '',
      contactPhone: '',
      accountManager: 'Rachel Adams',
      region: 'North America (US-East)',
      targetCutoverDate: '2026-12-31',
      notes: '',
    });
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.projectName || !newProject.customerId) return;

    const targetCust = customers.find((c) => c.id === newProject.customerId);
    const template = templates.find((t) => t.id === newProject.templateId);

    // Build default milestones from template if available
    const defaultMilestones: Milestone[] = template
      ? template.phases.map((ph, idx) => ({
          id: `ms-gen-${Date.now()}-${idx}`,
          title: `${ph.name}: ${ph.description.substring(0, 40)}...`,
          description: ph.description,
          phase: (ph.name.includes('Phase 1')
            ? 'Phase 1: Discovery'
            : ph.name.includes('Phase 2')
            ? 'Phase 2: Mapping & Cleansing'
            : ph.name.includes('Phase 3')
            ? 'Phase 3: Validation & Dry-Run'
            : ph.name.includes('Phase 4')
            ? 'Phase 4: Cutover & Sync'
            : 'Phase 5: Signoff & Audit') as Milestone['phase'],
          dueDate: newProject.targetCutoverDate,
          status: idx === 0 ? 'In Progress' : 'Upcoming',
          completionPct: idx === 0 ? 10 : 0,
          assignedTeamMemberIds: ['team-1'],
        }))
      : [
          {
            id: `ms-def-1`,
            title: 'Initial Schema Profiling & Discovery',
            description: 'Inspect source tables and analyze data field types.',
            phase: 'Phase 1: Discovery',
            dueDate: newProject.startDate,
            status: 'In Progress',
            completionPct: 15,
            assignedTeamMemberIds: ['team-1'],
          },
        ];

    const createdProj: MigrationProject = {
      id: `prj-${Date.now()}`,
      customerId: newProject.customerId,
      customerName: targetCust ? targetCust.name : 'Enterprise Client',
      projectName: newProject.projectName,
      code: newProject.code || `PRJ-${Date.now().toString().slice(-4)}`,
      description: newProject.description || 'Migration project provisioned for enterprise customer.',
      templateId: newProject.templateId || undefined,
      status: 'Planned',
      riskLevel: newProject.riskLevel,
      progressPct: 0,
      sourceConnectorName: newProject.sourceConnectorName,
      targetConnectorName: newProject.targetConnectorName,
      startDate: newProject.startDate,
      targetCutoverDate: newProject.targetCutoverDate,
      totalRecordsToMigrate: Number(newProject.totalRecordsToMigrate),
      recordsMigrated: 0,
      team: [
        {
          memberId: 'team-1',
          memberName: 'Sarah Jenkins',
          memberEmail: 'sarah.jenkins@edimp.io',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          role: 'Lead Architect',
          allocationPct: 50,
        },
      ],
      milestones: defaultMilestones,
      auditLogs: [
        {
          id: `al-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          user: 'System Admin',
          action: 'PROJECT_CREATED',
          details: `Migration project ${newProject.projectName} created for ${targetCust?.name}.`,
        },
      ],
    };

    setProjects((prev) => [createdProj, ...prev]);

    // Update customer project count
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === newProject.customerId
          ? {
              ...c,
              projectsCount: c.projectsCount + 1,
              totalRecordsToMigrate: c.totalRecordsToMigrate + Number(newProject.totalRecordsToMigrate),
            }
          : c
      )
    );

    setIsCreateProjectOpen(false);
    setActiveProject(createdProj);
  };

  const handleStatusUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateForm.projectId) return;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === statusUpdateForm.projectId) {
          const recordsMigrated = Math.round(
            (p.totalRecordsToMigrate * statusUpdateForm.progressPct) / 100
          );
          return {
            ...p,
            status: statusUpdateForm.newStatus,
            progressPct: statusUpdateForm.progressPct,
            recordsMigrated,
            auditLogs: [
              {
                id: `al-${Date.now()}`,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                user: 'Lead Architect',
                action: 'STATUS_TRANSITION',
                details: `Status set to ${statusUpdateForm.newStatus} (${statusUpdateForm.progressPct}% complete). ${statusUpdateForm.logNote}`,
              },
              ...p.auditLogs,
            ],
          };
        }
        return p;
      })
    );

    setIsStatusModalOpen(false);
  };

  const handleAssignTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamAssignForm.projectId || !teamAssignForm.memberId) return;

    const memberObj = teamMembers.find((m) => m.id === teamAssignForm.memberId);
    if (!memberObj) return;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === teamAssignForm.projectId) {
          const exists = p.team.some((t) => t.memberId === teamAssignForm.memberId);
          const updatedTeam = exists
            ? p.team.map((t) =>
                t.memberId === teamAssignForm.memberId
                  ? { ...t, role: teamAssignForm.role, allocationPct: Number(teamAssignForm.allocationPct) }
                  : t
              )
            : [
                ...p.team,
                {
                  memberId: memberObj.id,
                  memberName: memberObj.name,
                  memberEmail: memberObj.email,
                  avatar: memberObj.avatar,
                  role: teamAssignForm.role,
                  allocationPct: Number(teamAssignForm.allocationPct),
                },
              ];

          return {
            ...p,
            team: updatedTeam,
            auditLogs: [
              {
                id: `al-${Date.now()}`,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                user: 'Project Manager',
                action: 'TEAM_MEMBER_ASSIGNED',
                details: `Assigned ${memberObj.name} as ${teamAssignForm.role} (${teamAssignForm.allocationPct}% capacity).`,
              },
              ...p.auditLogs,
            ],
          };
        }
        return p;
      })
    );

    setIsTeamAssignModalOpen(false);
  };

  const handleToggleMilestoneStatus = (projectId: string, milestoneId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const updatedMs = p.milestones.map((m) => {
            if (m.id === milestoneId) {
              const nextStatus: Milestone['status'] =
                m.status === 'Completed'
                  ? 'In Progress'
                  : m.status === 'In Progress'
                  ? 'Completed'
                  : 'In Progress';
              return {
                ...m,
                status: nextStatus,
                completionPct: nextStatus === 'Completed' ? 100 : 50,
              };
            }
            return m;
          });

          // Recalculate project progressPct based on milestones
          const totalMs = updatedMs.length;
          const completedMs = updatedMs.filter((m) => m.status === 'Completed').length;
          const newPct = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : p.progressPct;

          return {
            ...p,
            milestones: updatedMs,
            progressPct: newPct,
          };
        }
        return p;
      })
    );
  };

  // Recharts Chart Data
  const statusPieData = [
    { name: 'In Progress', value: projects.filter((p) => p.status === 'In Progress').length, color: '#6366f1' },
    { name: 'In Cutover', value: projects.filter((p) => p.status === 'In Cutover').length, color: '#10b981' },
    { name: 'Planned', value: projects.filter((p) => p.status === 'Planned').length, color: '#3b82f6' },
    { name: 'Testing', value: projects.filter((p) => p.status === 'Testing').length, color: '#8b5cf6' },
    { name: 'Completed', value: projects.filter((p) => p.status === 'Completed').length, color: '#059669' },
    { name: 'Delayed / Hold', value: projects.filter((p) => p.status === 'Delayed' || p.status === 'On Hold').length, color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  const customerVolumeBarData = customers.map((c) => ({
    name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
    records: Math.round(c.totalRecordsToMigrate / 1000000), // in Millions
    projects: c.projectsCount,
  }));

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-2xs relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                <Briefcase className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Customer &amp; Migration Project Management</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enterprise tenant onboarding, multi-project timeline tracking, team capacity allocation, and blueprint template instantiation.
                </p>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCreateCustomerOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>Create Customer</span>
            </button>
            <button
              onClick={() => setIsCreateProjectOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Migration Project</span>
            </button>
          </div>
        </div>

        {/* METRICS SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200">
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Enterprise Customers</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">{totalCustomersCount}</span>
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> 100% SLA
              </span>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Active Migration Projects</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-indigo-700 font-mono">{totalProjectsCount}</span>
              <span className="text-[11px] text-indigo-800 font-medium">{inProgressProjectsCount} In Flight</span>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Total Volume Progress</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-700 font-mono">{overallProgressPct}%</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {(totalRecordsMigratedSum / 1000000).toFixed(1)}M / {(totalRecordsToMigrateSum / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Risk Posture</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-700 font-mono">{highRiskProjectsCount}</span>
              <span className="text-[11px] text-slate-600 font-medium">High Risk Flagged</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TAB NAVIGATION BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center justify-between gap-2 overflow-x-auto shadow-xs">
        <div className="flex items-center gap-1 min-w-max">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BarChart2 className={`w-3.5 h-3.5 ${activeSubTab === 'dashboard' ? 'text-white' : 'text-indigo-600'}`} />
            <span>Project Dashboard</span>
          </button>

          <button
            onClick={() => setActiveSubTab('customers')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'customers'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building2 className={`w-3.5 h-3.5 ${activeSubTab === 'customers' ? 'text-white' : 'text-sky-600'}`} />
            <span>Customers ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('projects')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'projects'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FolderKanban className={`w-3.5 h-3.5 ${activeSubTab === 'projects' ? 'text-white' : 'text-indigo-600'}`} />
            <span>Migration Projects ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'timeline'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 ${activeSubTab === 'timeline' ? 'text-white' : 'text-emerald-600'}`} />
            <span>Project Timeline & Milestones</span>
          </button>

          <button
            onClick={() => setActiveSubTab('team')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'team'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${activeSubTab === 'team' ? 'text-white' : 'text-amber-600'}`} />
            <span>Team Allocation</span>
          </button>

          <button
            onClick={() => setActiveSubTab('templates')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'templates'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeSubTab === 'templates' ? 'text-white' : 'text-purple-600'}`} />
            <span>Blueprints & Templates</span>
          </button>
        </div>

        {/* Global Search Box in Tab Bar */}
        <div className="relative min-w-[200px] hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers, projects..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PROJECT DASHBOARD TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Project Status Distribution */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-600" />
                  <span>Project Status Distribution</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{projects.length} Total</span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {statusPieData.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 font-medium text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
                    <span className="truncate">{st.name}:</span>
                    <span className="font-bold text-slate-900 font-mono">{st.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Volume by Customer */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  <span>Migration Volume by Customer (Millions)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Records Target</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerVolumeBarData}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="records" fill="#6366f1" radius={[6, 6, 0, 0]} name="Target Records (M)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RESOURCE ALLOCATION & UTILIZATION SECTION */}
          {/* ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-2xs space-y-6">
            {/* Header with Project Selector, Forecast Toggle & Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border transition ${
                  isForecastMode ? 'bg-purple-50 border-purple-200' : 'bg-indigo-50 border-indigo-100'
                }`}>
                  {isForecastMode ? (
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Users className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {isForecastMode ? 'Capacity & Team Availability Forecast' : 'Resource Allocation & Real-Time Utilization'}
                    </h3>
                    <span className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded-full border ${
                      isForecastMode
                        ? 'bg-purple-50 border-purple-200 text-purple-700'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    }`}>
                      {isForecastMode ? '🔮 Predictive Horizon' : 'Live Utilization Hub'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isForecastMode
                      ? 'Forecasted team availability, estimated roll-off dates, and freed capacity based on current burn rate and project completion velocity.'
                      : 'Real-time team utilization across migration projects with hours worked vs allocated breakdown and capacity alerts.'}
                  </p>
                </div>
              </div>

              {/* Controls: Mode Toggle, Horizon Selector, Project Filter & Log Hours */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Mode Toggle Switch */}
                <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setIsForecastMode(false)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      !isForecastMode
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Actual Utilization</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsForecastMode(true)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isForecastMode
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    <span>Forecast Availability</span>
                  </button>
                </div>

                {/* Horizon Selector (Visible in Forecast Mode) */}
                {isForecastMode && (
                  <div className="flex items-center gap-1 bg-purple-50 border border-purple-200 p-1 rounded-xl text-xs">
                    <span className="text-[10px] text-purple-800 font-mono font-bold px-2 uppercase">Horizon:</span>
                    <button
                      type="button"
                      onClick={() => setForecastHorizonDays(30)}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition cursor-pointer ${
                        forecastHorizonDays === 30 ? 'bg-purple-600 text-white' : 'text-purple-700 hover:text-purple-900'
                      }`}
                    >
                      30d
                    </button>
                    <button
                      type="button"
                      onClick={() => setForecastHorizonDays(60)}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition cursor-pointer ${
                        forecastHorizonDays === 60 ? 'bg-purple-600 text-white' : 'text-purple-700 hover:text-purple-900'
                      }`}
                    >
                      60d
                    </button>
                    <button
                      type="button"
                      onClick={() => setForecastHorizonDays(90)}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition cursor-pointer ${
                        forecastHorizonDays === 90 ? 'bg-purple-600 text-white' : 'text-purple-700 hover:text-purple-900'
                      }`}
                    >
                      90d
                    </button>
                  </div>
                )}

                {/* Project Filter Dropdown */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                  <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-slate-500 font-medium">Project:</span>
                  <select
                    value={selectedResourceProjectId}
                    onChange={(e) => setSelectedResourceProjectId(e.target.value)}
                    className="bg-transparent text-slate-900 font-bold outline-none cursor-pointer text-xs"
                  >
                    <option value="all" className="bg-white text-slate-900">All Migration Projects ({projects.length})</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-white text-slate-900">
                        {p.code} - {p.projectName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Export Report Action Buttons */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    title="Export resource utilization to CSV file"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExportReportModalOpen(true)}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    title="Generate printable stakeholder PDF report"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-700" />
                    <span>Stakeholder Report</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    const defaultProj = selectedResourceProjectId === 'all' ? projects[0]?.id : selectedResourceProjectId;
                    const defaultMem = projects.find(p => p.id === defaultProj)?.team[0]?.memberId || '';
                    setLogHoursForm({
                      projectId: defaultProj || '',
                      memberId: defaultMem,
                      hoursToAdd: 10,
                      hoursType: 'worked',
                      note: '',
                    });
                    setIsLogHoursModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Timer className="w-4 h-4" />
                  <span>Log / Adjust Hours</span>
                </button>
              </div>
            </div>

            {/* AI Forecast Mode Banner */}
            {isForecastMode && (
              <div className="p-4 bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 border border-purple-200 rounded-lg text-purple-700 shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-900 text-sm flex items-center gap-2">
                      <span>Upcoming Team Availability Forecast ({forecastHorizonDays}-Day Window)</span>
                      <span className="px-2 py-0.5 bg-purple-100 border border-purple-200 text-purple-800 text-[10px] font-mono rounded-full font-bold">
                        Burn Velocity Engine
                      </span>
                    </h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Estimating member roll-off dates, projected capacity release, and workload burn rate based on project timelines and historical velocity.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right shrink-0">
                  <div className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-[11px] font-mono">
                    <span className="text-slate-500 block text-[9px] uppercase">Avg Velocity</span>
                    <span className="font-black text-purple-700">{avgBurnRate}x Allocation Rate</span>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            {!isForecastMode ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Allocated Hours</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-indigo-700 font-mono">{totalResourceAllocatedHours}</span>
                    <span className="text-[10px] text-slate-500">Hours</span>
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Hours Worked</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-emerald-700 font-mono">{totalResourceWorkedHours}</span>
                    <span className="text-[10px] text-slate-500">Hours</span>
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Avg Utilization</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-slate-900 font-mono">{overallResourceUtilizationPct}%</span>
                    <span className={`text-[10px] font-bold ${overallResourceUtilizationPct > 100 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {overallResourceUtilizationPct > 100 ? 'Over Allocated' : 'Optimal'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Capacity Variance</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className={`text-xl font-black font-mono ${totalResourceWorkedHours - totalResourceAllocatedHours > 0 ? 'text-amber-700' : 'text-sky-700'}`}>
                      {totalResourceWorkedHours - totalResourceAllocatedHours > 0 ? `+${totalResourceWorkedHours - totalResourceAllocatedHours}` : `${totalResourceWorkedHours - totalResourceAllocatedHours}`}
                    </span>
                    <span className="text-[10px] text-slate-500">hrs</span>
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 col-span-2 md:col-span-1">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Over-Capacity Risk</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className={`text-xl font-black font-mono ${overAllocatedCount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {overAllocatedCount}
                    </span>
                    <span className="text-[10px] text-slate-500">Members &gt;100%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-50/80 border border-purple-200 rounded-xl p-3.5">
                  <span className="text-[10px] text-purple-700 font-mono uppercase tracking-wider block">Projected Roll-Offs</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-purple-800 font-mono">{totalRollOffsInHorizon}</span>
                    <span className="text-[10px] text-slate-500">Members in {forecastHorizonDays}d</span>
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-purple-200 rounded-xl p-3.5">
                  <span className="text-[10px] text-purple-700 font-mono uppercase tracking-wider block">Upcoming Capacity Freed</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-cyan-700 font-mono">+{totalFreedCapacityHours}</span>
                    <span className="text-[10px] text-slate-500">hrs/week</span>
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-purple-200 rounded-xl p-3.5">
                  <span className="text-[10px] text-purple-700 font-mono uppercase tracking-wider block">Burn Velocity Ratio</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-emerald-700 font-mono">{avgBurnRate}x</span>
                    <span className="text-[10px] text-slate-500">Worked / Alloc</span>
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-purple-200 rounded-xl p-3.5">
                  <span className="text-[10px] text-purple-700 font-mono uppercase tracking-wider block">Overload Risk Warnings</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className={`text-xl font-black font-mono ${overloadRiskCountForecast > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {overloadRiskCountForecast}
                    </span>
                    <span className="text-[10px] text-slate-500">Burn &gt;1.15x</span>
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-purple-200 rounded-xl p-3.5 col-span-2 md:col-span-1">
                  <span className="text-[10px] text-purple-700 font-mono uppercase tracking-wider block">Forecast Horizon</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-slate-900 font-mono">{forecastHorizonDays}</span>
                    <span className="text-[10px] text-slate-500">Days Out</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bar Chart: Hours Worked vs Allocated OR Forecast Capacity Bar Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className={`w-4 h-4 ${isForecastMode ? 'text-purple-600' : 'text-indigo-600'}`} />
                  <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                    {isForecastMode
                      ? `Availability Forecast Bar Chart: Remaining Work vs. Freed Capacity (${forecastHorizonDays}d)`
                      : 'Resource Utilization Bar Chart: Hours Worked vs. Allocated'}
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  {!isForecastMode ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-indigo-600 rounded-xs" />
                        <span className="text-slate-600 font-medium">Allocated Hours</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs" />
                        <span className="text-slate-600 font-medium">Hours Worked</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs" />
                        <span className="text-slate-600 font-medium">Worked So Far</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-purple-600 rounded-xs" />
                        <span className="text-slate-600 font-medium">Projected Remaining</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-cyan-600 rounded-xs" />
                        <span className="text-slate-600 font-medium">Freed Capacity (h/wk)</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {!isForecastMode ? (
                    <BarChart data={resourceBarChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="h" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                        formatter={(value: any, name: any) => [`${value} hrs`, name]}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', color: '#475569' }} />
                      <Bar dataKey="Allocated Hours" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Allocated Hours" />
                      <Bar dataKey="Hours Worked" fill="#059669" radius={[4, 4, 0, 0]} name="Hours Worked" />
                    </BarChart>
                  ) : (
                    <BarChart data={forecastBarChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="h" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                        formatter={(value: any, name: any) => [`${value} hrs`, name]}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', color: '#475569' }} />
                      <Bar dataKey="Hours Worked" fill="#059669" radius={[4, 4, 0, 0]} name="Hours Worked So Far" />
                      <Bar dataKey="Projected Remaining" fill="#9333ea" radius={[4, 4, 0, 0]} name="Projected Remaining Hours" />
                      <Bar dataKey="Freed Capacity (h/wk)" fill="#0891b2" radius={[4, 4, 0, 0]} name="Freed Capacity (h/wk)" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Team Workload & Capacity Heatmap Visual Matrix */}
            <WorkloadHeatmap
              teamMembers={teamMembers}
              projects={projects}
              allResourceAssignments={allResourceAssignments}
              onLogHoursTrigger={(projectId, memberId) => {
                setLogHoursForm({
                  projectId,
                  memberId,
                  hoursToAdd: 10,
                  hoursType: 'worked',
                  note: 'Adjusted via Heatmap inspector',
                });
                setIsLogHoursModalOpen(true);
              }}
            />

            {/* Real-time Team Utilization Details Roster OR Forecast Availability Roster */}
            <div className="space-y-4">
              {/* DRAG & DROP WORKLOAD REBALANCING CONTROL BAR & TARGET DOCK */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 shrink-0 mt-0.5">
                      <GripVertical className="w-5 h-5 animate-pulse text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-xs uppercase font-mono tracking-wider">
                          Dynamic Workload Rebalancer
                        </h4>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-bold rounded-full">
                          Drag &amp; Drop Ready
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Drag any project assignment card by its grip handle and drop it onto a team member below to dynamically balance workloads in real time.
                      </p>
                    </div>
                  </div>

                  {draggedAssignment && (
                    <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-300 text-indigo-800 rounded-xl font-mono text-xs flex items-center gap-2 shrink-0 animate-bounce shadow-xs">
                      <Move className="w-4 h-4 text-indigo-600" />
                      <span>Moving <strong>{draggedAssignment.projectCode}</strong> ({draggedAssignment.memberName})</span>
                    </div>
                  )}
                </div>

                {/* Team Rebalance Drop Dock */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {teamMembers.map((member) => {
                    const isHoveredTarget = dragOverTargetMemberId === member.id;
                    const memberAssignedHours = allResourceAssignments
                      .filter((a) => a.memberId === member.id)
                      .reduce((sum, a) => sum + a.allocatedHours, 0);

                    return (
                      <div
                        key={member.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggedAssignment && draggedAssignment.sourceMemberId !== member.id) {
                            setDragOverTargetMemberId(member.id);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverTargetMemberId === member.id) setDragOverTargetMemberId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedAssignment) {
                            handleReassignProjectAssignment(
                              draggedAssignment.projectId,
                              draggedAssignment.sourceMemberId,
                              member.id
                            );
                            setDraggedAssignment(null);
                            setDragOverTargetMemberId(null);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                          isHoveredTarget
                            ? 'bg-indigo-100 border-indigo-500 scale-105 shadow-md'
                            : draggedAssignment
                            ? 'bg-slate-50 border-indigo-300 hover:border-indigo-400 hover:bg-indigo-50/50'
                            : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-7 h-7 rounded-full border border-slate-200 object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 text-[11px] truncate leading-tight">{member.name}</div>
                          <div className="text-[9px] text-slate-500 font-mono truncate">{memberAssignedHours}h Allocated</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skill Search & Technical Proficiency Filter Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                  <div className="flex items-center gap-1 text-slate-500 font-semibold mr-1">
                    <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="text-[11px]">Skill Filter:</span>
                  </div>
                  <button
                    onClick={() => setSelectedSkillFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                      selectedSkillFilter === 'all'
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    All Skills ({allAvailableSkillsList.length})
                  </button>
                  {allAvailableSkillsList.map((sk) => (
                    <button
                      key={sk}
                      onClick={() => setSelectedSkillFilter(selectedSkillFilter === sk ? 'all' : sk)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1 ${
                        selectedSkillFilter === sk
                          ? 'bg-indigo-600 text-white font-bold border border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      <Award className="w-3 h-3 text-indigo-600" />
                      <span>{sk}</span>
                    </button>
                  ))}
                </div>

                {/* Search Filter Input */}
                <div className="relative shrink-0">
                  <input
                    type="text"
                    placeholder="Search member, role, or skill..."
                    value={skillSearchQuery}
                    onChange={(e) => setSkillSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 transition w-full lg:w-56 font-mono"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  {skillSearchQuery && (
                    <button
                      onClick={() => setSkillSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  {isForecastMode ? (
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  )}
                  <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                    {isForecastMode
                      ? `Team Availability & Roll-Off Predictions (${filteredResourceAssignments.length})`
                      : `Assigned Member Utilization Roster (${filteredResourceAssignments.length})`}
                  </h4>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-lg text-[11px] font-mono">
                  <button
                    onClick={() => setSelectedResourceStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      selectedResourceStatusFilter === 'all' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({allResourceAssignments.length})
                  </button>
                  <button
                    onClick={() => setSelectedResourceStatusFilter('optimal')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      selectedResourceStatusFilter === 'optimal' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Optimal (80-100%)
                  </button>
                  <button
                    onClick={() => setSelectedResourceStatusFilter('over')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      selectedResourceStatusFilter === 'over' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Over-Allocated ({overAllocatedCount})
                  </button>
                  <button
                    onClick={() => setSelectedResourceStatusFilter('under')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      selectedResourceStatusFilter === 'under' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Under-Utilized
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredResourceAssignments.map((ra, idx) => {
                  const cardKey = `${ra.projectId}-${ra.memberId}-${idx}`;
                  const isQuickReassignOpen = activeQuickReassignCardId === cardKey;

                  return (
                    <div
                      key={cardKey}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          'text/plain',
                          JSON.stringify({ projectId: ra.projectId, sourceMemberId: ra.memberId })
                        );
                        setDraggedAssignment({
                          projectId: ra.projectId,
                          sourceMemberId: ra.memberId,
                          projectName: ra.projectName,
                          projectCode: ra.projectCode,
                          memberName: ra.memberName,
                          allocationPct: ra.allocationPct,
                        });
                      }}
                      onDragEnd={() => {
                        setDraggedAssignment(null);
                        setDragOverTargetMemberId(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedAssignment && draggedAssignment.sourceMemberId !== ra.memberId) {
                          setDragOverTargetMemberId(ra.memberId);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverTargetMemberId === ra.memberId) setDragOverTargetMemberId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedAssignment) {
                          handleReassignProjectAssignment(
                            draggedAssignment.projectId,
                            draggedAssignment.sourceMemberId,
                            ra.memberId
                          );
                          setDraggedAssignment(null);
                          setDragOverTargetMemberId(null);
                        }
                      }}
                      className={`bg-white border transition-all rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs relative ${
                        dragOverTargetMemberId === ra.memberId
                          ? 'border-2 border-indigo-500 bg-indigo-50 scale-102 shadow-md'
                          : draggedAssignment?.projectId === ra.projectId && draggedAssignment?.sourceMemberId === ra.memberId
                          ? 'opacity-40 border-dashed border-indigo-500 scale-98'
                          : isForecastMode && ra.isRollingOff
                          ? 'border-purple-300 bg-purple-50/50'
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="cursor-grab active:cursor-grabbing p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition shrink-0"
                              title="Drag assignment card to drop onto another team member"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <button
                              onClick={() => setSelectedDrillDownMemberId(ra.memberId)}
                              className="flex items-center gap-2 text-left group cursor-pointer transition"
                              title="Click to view full workload & project assignment drill-down"
                            >
                              <img
                                src={ra.avatar}
                                alt={ra.memberName}
                                className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0 group-hover:border-indigo-500 transition"
                              />
                              <div>
                                <h5 className="font-bold text-slate-900 text-xs leading-tight group-hover:text-indigo-600 transition flex items-center gap-1">
                                  <span>{ra.memberName}</span>
                                  <Eye className="w-3 h-3 text-indigo-600 opacity-0 group-hover:opacity-100 transition" />
                                </h5>
                                <span className="text-[10px] text-slate-500 block font-mono">{ra.role}</span>
                                {ra.skills && ra.skills.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1 mt-1">
                                    {ra.skills.map((sk) => (
                                      <span
                                        key={sk}
                                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border transition ${
                                          selectedSkillFilter === sk || (skillSearchQuery && sk.toLowerCase().includes(skillSearchQuery.toLowerCase()))
                                            ? 'bg-indigo-100 text-indigo-800 border-indigo-300 shadow-2xs'
                                            : 'bg-slate-100 text-indigo-700 border-slate-200'
                                        }`}
                                      >
                                        {sk}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </button>
                          </div>

                          {!isForecastMode ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                                ra.status === 'over'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : ra.status === 'optimal'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-sky-100 text-sky-800 border border-sky-300'
                              }`}
                            >
                              {ra.utilizationPct}% Utilized
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 flex items-center gap-1 ${
                                ra.isRollingOff
                                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                  : ra.burnRate > 1.15
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {ra.isRollingOff
                                ? `Available in ${ra.estimatedDaysToComplete}d`
                                : `Booked >${forecastHorizonDays}d`}
                            </span>
                          )}
                        </div>

                        {/* Project Badge */}
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[10px] font-mono text-slate-700">
                          <span className="text-slate-500">Project:</span>
                          <span className="font-bold text-indigo-700 truncate max-w-[180px]">{ra.projectCode} - {ra.projectName}</span>
                        </div>
                      </div>

                      {!isForecastMode ? (
                        /* Progress Bar & Hours breakdown */
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-600">
                              Worked: <strong className="text-emerald-700">{ra.workedHours}h</strong> / Alloc: <strong className="text-indigo-700">{ra.allocatedHours}h</strong>
                            </span>
                            <span className={ra.varianceHours > 0 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                              {ra.varianceHours > 0 ? `+${ra.varianceHours}h Over` : `${ra.varianceHours}h`}
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                ra.utilizationPct > 105
                                  ? 'bg-amber-500'
                                  : ra.utilizationPct >= 80
                                  ? 'bg-emerald-500'
                                  : 'bg-sky-500'
                              }`}
                              style={{ width: `${Math.min(ra.utilizationPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        /* Forecast Availability & Roll-off Metrics */
                        <div className="space-y-2 pt-1 font-mono text-[10px]">
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-purple-600" />
                                <span>Est. Roll-Off Date:</span>
                              </span>
                              <span className="font-bold text-purple-700">{ra.rollOffFormatted}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-600" />
                                <span>Burn Rate Velocity:</span>
                              </span>
                              <span className={`font-bold ${ra.burnRate > 1.1 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {ra.burnRate}x ({ra.burnRate > 1.1 ? 'High Velocity' : 'On Schedule'})
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                              <span className="text-slate-500">Projected Freed Capacity:</span>
                              <span className="font-bold text-cyan-700">+{ra.freedHoursPerWeek} hrs/week</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">Remaining Required Work:</span>
                            <span className="font-bold text-purple-700">{ra.projectedRemainingHours}h</span>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {isForecastMode ? `Completion: ${ra.progressPct}%` : `Assigned: ${ra.allocationPct}% Capacity`}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {/* Quick Reassign Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveQuickReassignCardId(
                                  isQuickReassignOpen ? null : cardKey
                                )
                              }
                              className="text-[10px] text-purple-700 hover:text-purple-900 font-mono font-bold flex items-center gap-1 cursor-pointer bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded-lg transition"
                              title="Quickly reassign workload to another team member"
                            >
                              <RefreshCw className="w-3 h-3 text-purple-600" />
                              <span>Reassign</span>
                            </button>

                            {isQuickReassignOpen && (
                              <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-30 space-y-1 text-xs">
                                <div className="text-[10px] text-slate-500 font-mono font-bold px-2 py-1 border-b border-slate-100">
                                  Reassign Workload To:
                                </div>
                                {teamMembers
                                  .filter((tm) => tm.id !== ra.memberId)
                                  .map((targetTm) => (
                                    <button
                                      key={targetTm.id}
                                      type="button"
                                      onClick={() => {
                                        handleReassignProjectAssignment(ra.projectId, ra.memberId, targetTm.id);
                                        setActiveQuickReassignCardId(null);
                                      }}
                                      className="w-full text-left px-2 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg flex items-center gap-2 transition cursor-pointer text-[11px]"
                                    >
                                      <img src={targetTm.avatar} alt={targetTm.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                                      <span className="truncate">{targetTm.name}</span>
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => setSelectedDrillDownMemberId(ra.memberId)}
                            className="text-[10px] text-indigo-700 hover:text-indigo-900 font-mono font-bold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg transition"
                            title="Open detailed project assignments & weekly load modal"
                          >
                            <Eye className="w-3 h-3 text-indigo-600" />
                            <span>Drill Down</span>
                          </button>
                          <button
                            onClick={() => {
                              setLogHoursForm({
                                projectId: ra.projectId,
                                memberId: ra.memberId,
                                hoursToAdd: 5,
                                hoursType: 'worked',
                                note: isForecastMode ? 'Forecast re-calculation adjustment' : '',
                              });
                              setIsLogHoursModalOpen(true);
                            }}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-mono font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Timer className="w-3 h-3" />
                            <span>Log Hours</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
        </div>

          {/* Active Projects Cards Overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-600" />
                <span>Enterprise Migration Projects ({filteredProjects.length})</span>
              </h3>
              <button
                onClick={() => setActiveSubTab('projects')}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View Detailed Table</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {filteredProjects.map((prj) => (
                <div
                  key={prj.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">
                          {prj.customerName} • {prj.code}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{prj.projectName}</h4>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                          prj.status === 'In Cutover'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : prj.status === 'In Progress'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                            : prj.status === 'Planned'
                            ? 'bg-slate-100 text-slate-700 border border-slate-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {prj.status}
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">{prj.description}</p>
                  </div>

                  {/* Systems Badge */}
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-600 font-medium truncate max-w-[45%]">{prj.sourceConnectorName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-indigo-700 font-bold truncate max-w-[45%]">{prj.targetConnectorName}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono font-bold">
                      <span className="text-slate-600">Completion: {prj.progressPct}%</span>
                      <span className="text-slate-500">
                        {prj.recordsMigrated.toLocaleString()} / {prj.totalRecordsToMigrate.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          prj.progressPct > 80
                            ? 'bg-emerald-500'
                            : prj.progressPct > 40
                            ? 'bg-indigo-600'
                            : 'bg-sky-500'
                        }`}
                        style={{ width: `${prj.progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer & Team Avatars */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-mono uppercase">Target:</span>
                      <span className="font-mono font-bold text-slate-700 text-[11px]">{prj.targetCutoverDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {prj.team.slice(0, 3).map((tm, idx) => (
                          <img
                            key={idx}
                            src={tm.avatar}
                            alt={tm.memberName}
                            title={`${tm.memberName} (${tm.role})`}
                            className="w-6 h-6 rounded-full border-2 border-white object-cover"
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setActiveProject(prj);
                          setActiveSubTab('timeline');
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                      >
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Timeline</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CUSTOMERS DIRECTORY TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Enterprise Customer Accounts ({filteredCustomers.length})</h3>
                <p className="text-xs text-slate-500">Manage client SLAs, primary contacts, regions, and active migration quotas.</p>
              </div>

              <button
                onClick={() => setIsCreateCustomerOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
              >
                <Building2 className="w-4 h-4" />
                <span>+ Add Customer</span>
              </button>
            </div>

            {/* Customers Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono uppercase text-[10px]">
                    <th className="p-3 font-bold">Customer Account</th>
                    <th className="p-3 font-bold">Industry & Region</th>
                    <th className="p-3 font-bold">SLA Tier</th>
                    <th className="p-3 font-bold">Primary Contact</th>
                    <th className="p-3 font-bold">Account Lead</th>
                    <th className="p-3 font-bold text-center">Projects</th>
                    <th className="p-3 font-bold text-right">Target Volume</th>
                    <th className="p-3 font-bold text-center">Health</th>
                    <th className="p-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs font-mono">
                            {c.code.substring(5, 7)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{c.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{c.code}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-slate-700">
                        <span className="font-medium block">{c.industry}</span>
                        <span className="text-[10px] text-slate-400">{c.region}</span>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded font-bold text-[10px] font-mono">
                          {c.tierSla}
                        </span>
                      </td>

                      <td className="p-3 text-slate-700">
                        <span className="font-bold block text-slate-800">{c.primaryContact}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{c.contactEmail}</span>
                      </td>

                      <td className="p-3 text-slate-700 font-medium">{c.accountManager}</td>

                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold rounded-full text-[11px]">
                          {c.projectsCount}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        {(c.totalRecordsToMigrate / 1000000).toFixed(1)}M
                      </td>

                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold rounded text-[10px]">
                          {c.healthScore}%
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setActiveSubTab('projects');
                            }}
                            className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer"
                            title="View Customer Projects"
                          >
                            <FolderKanban className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MIGRATION PROJECTS TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'projects' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* Customer Filter Dropdown */}
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                >
                  <option value="all">All Customers ({customers.length})</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Testing">Testing</option>
                  <option value="In Cutover">In Cutover</option>
                  <option value="Completed">Completed</option>
                </select>

                {/* Risk Filter */}
                <select
                  value={selectedRiskFilter}
                  onChange={(e) => setSelectedRiskFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                </select>
              </div>

              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            </div>

            {/* Detailed Projects List Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono uppercase text-[10px]">
                    <th className="p-3 font-bold">Project Name & Code</th>
                    <th className="p-3 font-bold">Customer Account</th>
                    <th className="p-3 font-bold">Source ➔ Target Systems</th>
                    <th className="p-3 font-bold text-center">Status</th>
                    <th className="p-3 font-bold text-center">Progress</th>
                    <th className="p-3 font-bold text-right">Target Records</th>
                    <th className="p-3 font-bold text-center">Target Cutover</th>
                    <th className="p-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-medium">
                        <div>
                          <span className="font-bold text-slate-900 block">{p.projectName}</span>
                          <span className="text-[10px] font-mono text-slate-400">{p.code}</span>
                        </div>
                      </td>

                      <td className="p-3 font-bold text-slate-800">{p.customerName}</td>

                      <td className="p-3 font-mono text-[11px]">
                        <span className="text-slate-600">{p.sourceConnectorName}</span>
                        <span className="mx-1 text-slate-400">➔</span>
                        <span className="text-indigo-700 font-bold">{p.targetConnectorName}</span>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                            p.status === 'In Cutover'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : p.status === 'In Progress'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="w-28 space-y-1 mx-auto">
                          <div className="flex justify-between text-[10px] font-mono font-bold text-slate-700">
                            <span>{p.progressPct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${p.progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        {p.totalRecordsToMigrate.toLocaleString()}
                      </td>

                      <td className="p-3 text-center font-mono text-slate-700 font-bold">{p.targetCutoverDate}</td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setStatusUpdateForm({
                                projectId: p.id,
                                newStatus: p.status,
                                progressPct: p.progressPct,
                                logNote: '',
                              });
                              setIsStatusModalOpen(true);
                            }}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[10px] cursor-pointer"
                          >
                            Transition
                          </button>
                          <button
                            onClick={() => {
                              setActiveProject(p);
                              setActiveSubTab('timeline');
                            }}
                            className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer"
                            title="Timeline & Milestones"
                          >
                            <Calendar className="w-4 h-4 text-indigo-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PROJECT TIMELINE & MILESTONES TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-6">
          {/* Project Switcher Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                  Active Timeline View
                </span>
                <h3 className="font-bold text-base text-slate-900">{activeProject?.projectName || 'Select a Migration Project'}</h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">Select Project:</span>
              <select
                value={activeProject?.id || ''}
                onChange={(e) => {
                  const prj = projects.find((p) => p.id === e.target.value);
                  if (prj) setActiveProject(prj);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white text-slate-900">
                    {p.customerName} - {p.projectName} ({p.progressPct}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeProject && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Milestones Roadmaps */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Project Phases & Milestones Checklist</span>
                  </h4>
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                    {activeProject.progressPct}% Overall Complete
                  </span>
                </div>

                {/* Milestone Checklist Items */}
                <div className="space-y-3">
                  {activeProject.milestones.map((ms) => (
                    <div
                      key={ms.id}
                      className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        ms.status === 'Completed'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : ms.status === 'In Progress'
                          ? 'bg-indigo-50/50 border-indigo-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleMilestoneStatus(activeProject.id, ms.id)}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition ${
                            ms.status === 'Completed'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300 text-transparent hover:border-slate-400'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 block">
                            {ms.phase}
                          </span>
                          <h5 className="font-bold text-slate-900 text-xs">{ms.title}</h5>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{ms.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-mono block">Due Date</span>
                          <span className="font-mono font-bold text-slate-800 text-[11px]">{ms.dueDate}</span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                            ms.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ms.status === 'In Progress'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {ms.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Trail & Team List Sidebar */}
              <div className="space-y-6">
                {/* Team Members assigned */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Assigned Migration Team</span>
                    </span>
                    <button
                      onClick={() => {
                        setTeamAssignForm({
                          projectId: activeProject.id,
                          memberId: teamMembers[0]?.id || '',
                          role: 'Data Engineer',
                          allocationPct: 50,
                        });
                        setIsTeamAssignModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Assign</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {activeProject.team.map((tm, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <img src={tm.avatar} alt={tm.memberName} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{tm.memberName}</span>
                            <span className="text-[10px] text-slate-500 block">{tm.role}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] rounded border border-indigo-200">
                          {tm.allocationPct}% Cap
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit Activity Log */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono block border-b border-slate-100 pb-3">
                    Project Audit Log
                  </span>
                  <div className="space-y-2.5 text-xs">
                    {activeProject.auditLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span className="font-bold text-slate-700">{log.user}</span>
                          <span>{log.timestamp}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] font-sans leading-relaxed">{log.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TEAM ALLOCATION TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'team' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Migration Engineering & Architecture Team</h3>
                <p className="text-xs text-slate-500">Resource capacity allocation and project assignment overview.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((tm) => (
                <div key={tm.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={tm.avatar} alt={tm.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{tm.name}</h4>
                      <span className="text-[11px] text-indigo-600 font-bold block">{tm.role}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{tm.email}</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-200/80">
                    <div className="flex justify-between text-[11px] font-mono font-bold">
                      <span className="text-slate-600">Capacity Allocation:</span>
                      <span className="text-indigo-600">{tm.capacityPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          tm.capacityPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${tm.capacityPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PROJECT TEMPLATES & BLUEPRINTS TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'templates' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Enterprise Project Templates & Migration Blueprints</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pre-configured industry migration standard templates with defined phase milestones, required connectors, and team roles.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-purple-300 transition shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px] font-mono">
                        {tmpl.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Est: {tmpl.estimatedDurationDays} Days</span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{tmpl.name}</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">{tmpl.description}</p>
                  </div>

                  <div className="space-y-1.5 text-xs pt-3 border-t border-slate-200">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">Required Connectors:</span>
                    <div className="flex flex-wrap gap-1">
                      {tmpl.defaultConnectorsRequired.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[10px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTemplateForInstantiate(tmpl);
                      setNewProject((prev) => ({
                        ...prev,
                        templateId: tmpl.id,
                        projectName: `${tmpl.name} Instance`,
                      }));
                      setIsTemplateModalOpen(true);
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Instantiate Project</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE CUSTOMER */}
      {/* ========================================================================= */}
      {isCreateCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 p-5 text-slate-900 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Onboard New Customer Account</h3>
              </div>
              <button onClick={() => setIsCreateCustomerOpen(false)} className="text-slate-400 hover:text-slate-700 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Customer Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="e.g. Apex Global Logistics"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Customer Code</label>
                  <input
                    type="text"
                    value={newCustomer.code}
                    onChange={(e) => setNewCustomer({ ...newCustomer, code: e.target.value })}
                    placeholder="e.g. CUST-APEX"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Industry Vertical</label>
                  <select
                    value={newCustomer.industry}
                    onChange={(e) => setNewCustomer({ ...newCustomer, industry: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer text-slate-900"
                  >
                    <option value="Financial Services">Financial Services</option>
                    <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                    <option value="Manufacturing & Retail">Manufacturing & Retail</option>
                    <option value="Logistics & Supply">Logistics & Supply</option>
                    <option value="Technology & SaaS">Technology & SaaS</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">SLA Tier</label>
                  <select
                    value={newCustomer.tierSla}
                    onChange={(e) => setNewCustomer({ ...newCustomer, tierSla: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer text-slate-900"
                  >
                    <option value="Enterprise Gold (99.99%)">Enterprise Gold (99.99%)</option>
                    <option value="Enterprise Platinum (24/7)">Enterprise Platinum (24/7)</option>
                    <option value="Standard Business">Standard Business</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Primary Contact Name</label>
                  <input
                    type="text"
                    value={newCustomer.primaryContact}
                    onChange={(e) => setNewCustomer({ ...newCustomer, primaryContact: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Contact Email</label>
                  <input
                    type="email"
                    value={newCustomer.contactEmail}
                    onChange={(e) => setNewCustomer({ ...newCustomer, contactEmail: e.target.value })}
                    placeholder="jdoe@organization.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateCustomerOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW PROJECT */}
      {/* ========================================================================= */}
      {(isCreateProjectOpen || isTemplateModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 p-5 text-slate-900 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  {isTemplateModalOpen ? `Instantiate Template: ${selectedTemplateForInstantiate?.name}` : 'Create Migration Project'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateProjectOpen(false);
                  setIsTemplateModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Target Customer Account *</label>
                <select
                  required
                  value={newProject.customerId}
                  onChange={(e) => setNewProject({ ...newProject, customerId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer text-slate-900"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={newProject.projectName}
                    onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                    placeholder="e.g. Core General Ledger Sync"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target Records Volume</label>
                  <input
                    type="number"
                    value={newProject.totalRecordsToMigrate}
                    onChange={(e) => setNewProject({ ...newProject, totalRecordsToMigrate: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Source System Connector</label>
                  <input
                    type="text"
                    value={newProject.sourceConnectorName}
                    onChange={(e) => setNewProject({ ...newProject, sourceConnectorName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target System Connector</label>
                  <input
                    type="text"
                    value={newProject.targetConnectorName}
                    onChange={(e) => setNewProject({ ...newProject, targetConnectorName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateProjectOpen(false);
                    setIsTemplateModalOpen(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  Provision Migration Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUICK STATUS TRANSITION */}
      {/* ========================================================================= */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 p-5 text-slate-900 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Update Project Status Transition</h3>
              </div>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStatusUpdateSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">New Status</label>
                <select
                  value={statusUpdateForm.newStatus}
                  onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, newStatus: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer text-slate-900"
                >
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Testing">Testing</option>
                  <option value="In Cutover">In Cutover</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Completion Percentage ({statusUpdateForm.progressPct}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={statusUpdateForm.progressPct}
                  onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, progressPct: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Audit Log Note</label>
                <textarea
                  value={statusUpdateForm.logNote}
                  onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, logNote: e.target.value })}
                  placeholder="Reason for status transition..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN TEAM MEMBER */}
      {/* ========================================================================= */}
      {isTeamAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 p-5 text-slate-900 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Assign Engineer to Project</h3>
              </div>
              <button onClick={() => setIsTeamAssignModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignTeamMember} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Team Member</label>
                <select
                  value={teamAssignForm.memberId}
                  onChange={(e) => setTeamAssignForm({ ...teamAssignForm, memberId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer font-mono text-slate-900"
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role}) - Skills: {(m.skills || []).join(', ')}
                    </option>
                  ))}
                </select>
                {(() => {
                  const selMember = teamMembers.find((m) => m.id === teamAssignForm.memberId);
                  if (!selMember?.skills?.length) return null;
                  return (
                    <div className="flex flex-wrap items-center gap-1 pt-1.5">
                      <span className="text-[10px] text-slate-500 font-mono font-semibold">Technical Proficiencies:</span>
                      {selMember.skills.map((sk) => (
                        <span key={sk} className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono rounded font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assigned Project Role</label>
                <input
                  type="text"
                  value={teamAssignForm.role}
                  onChange={(e) => setTeamAssignForm({ ...teamAssignForm, role: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Workload Allocation % ({teamAssignForm.allocationPct}%)</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={teamAssignForm.allocationPct}
                  onChange={(e) => setTeamAssignForm({ ...teamAssignForm, allocationPct: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTeamAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  Assign Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG / ADJUST HOURS */}
      {/* ========================================================================= */}
      {isLogHoursModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 p-5 text-slate-900 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Log & Adjust Member Hours</h3>
              </div>
              <button onClick={() => setIsLogHoursModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogHoursSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Target Migration Project</label>
                <select
                  value={logHoursForm.projectId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const proj = projects.find(p => p.id === pid);
                    const firstMem = proj?.team[0]?.memberId || '';
                    setLogHoursForm(prev => ({ ...prev, projectId: pid, memberId: firstMem }));
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer text-slate-900"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assigned Team Member</label>
                <select
                  value={logHoursForm.memberId}
                  onChange={(e) => setLogHoursForm(prev => ({ ...prev, memberId: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer text-slate-900"
                  required
                >
                  {projects
                    .find(p => p.id === logHoursForm.projectId)
                    ?.team.map((t) => (
                      <option key={t.memberId} value={t.memberId}>
                        {t.memberName} ({t.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Log Type</label>
                  <select
                    value={logHoursForm.hoursType}
                    onChange={(e) => setLogHoursForm(prev => ({ ...prev, hoursType: e.target.value as any }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer text-slate-900"
                  >
                    <option value="worked">Hours Worked (Actual)</option>
                    <option value="allocated">Allocated Hours (Budget)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Hours to Add</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={logHoursForm.hoursToAdd}
                    onChange={(e) => setLogHoursForm(prev => ({ ...prev, hoursToAdd: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Work Note / Task Reference</label>
                <textarea
                  rows={2}
                  value={logHoursForm.note}
                  onChange={(e) => setLogHoursForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="e.g. Completed SAP BSEG table dry-run mapping and validation..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogHoursModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  Save &amp; Update Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL: TEAM MEMBER WORKLOAD & ASSIGNMENT DRILL-DOWN */}
      {/* ========================================================================= */}
      {selectedDrillDownMemberId && drillDownMemberData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto my-auto">
            {/* Header with Avatar & Capacity Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5">
                <img
                  src={drillDownMemberData.avatar}
                  alt={drillDownMemberData.memberName}
                  className="w-12 h-12 rounded-full border-2 border-indigo-500 object-cover shadow-sm shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{drillDownMemberData.memberName}</h3>
                    <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[10px] font-bold rounded-full">
                      Member Workload Drill-Down
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
                    <span>{drillDownMemberData.role}</span>
                    <span>•</span>
                    <span className="text-indigo-700 font-semibold">{drillDownMemberData.memberAssignments.length} Active Migration Projects</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                    drillDownMemberData.overallUtil > 105
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : drillDownMemberData.overallUtil >= 80
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-sky-100 text-sky-800 border border-sky-300'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  {drillDownMemberData.overallUtil}% Utilization ({drillDownMemberData.overallUtil > 105 ? 'Over-Allocated' : 'Optimal Capacity'})
                </span>

                <button
                  onClick={() => setSelectedDrillDownMemberId(null)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick KPI Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Total Allocated</span>
                <div className="text-lg font-black text-indigo-700 font-mono mt-0.5">{drillDownMemberData.totalAllocated} hrs</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Total Worked</span>
                <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">{drillDownMemberData.totalWorked} hrs</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Weekly Capacity</span>
                <div className="text-lg font-black text-purple-700 font-mono mt-0.5">
                  {drillDownMemberData.weeklyWorkedHours}h / {drillDownMemberData.weeklyAllocatedHours}h wk
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Weekly Load %</span>
                <div className="text-lg font-black text-cyan-700 font-mono mt-0.5">{drillDownMemberData.totalAllocPct}%</div>
              </div>
            </div>

            {/* Technical Proficiencies & Skill-Set Tagging System */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600 shrink-0" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Technical Proficiencies &amp; Skill Tags ({drillDownMemberData.skills.length})
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500">
                  Click 'X' to remove tag or type a new skill below
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {drillDownMemberData.skills.length > 0 ? (
                  drillDownMemberData.skills.map((sk) => (
                    <span
                      key={sk}
                      className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-lg font-bold flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <Award className="w-3 h-3 text-indigo-600" />
                      <span>{sk}</span>
                      <button
                        onClick={() => selectedDrillDownMemberId && handleRemoveSkillFromMember(selectedDrillDownMemberId, sk)}
                        className="text-indigo-600 hover:text-rose-600 ml-0.5 cursor-pointer"
                        title={`Remove '${sk}' tag`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-xs italic">No technical skills configured yet.</span>
                )}

                {/* Add New Skill Tag Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (selectedDrillDownMemberId) {
                      handleAddSkillToMember(selectedDrillDownMemberId, newSkillInput);
                    }
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    placeholder="+ Add skill (e.g. PySpark)..."
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 transition w-44 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!newSkillInput.trim()}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Add Tag
                  </button>
                </form>
              </div>
            </div>

            {/* SECTION 1: SPECIFIC PROJECT ASSIGNMENTS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                    Assigned Migration Projects &amp; Allocation Breakdown
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {drillDownMemberData.memberAssignments.length} Assigned Project(s)
                </span>
              </div>

              <div className="space-y-2.5">
                {drillDownMemberData.memberAssignments.map((assignment, idx) => (
                  <div
                    key={`${assignment.projectId}-${idx}`}
                    className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 hover:border-indigo-300 transition shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold rounded-md border border-indigo-200">
                            {assignment.projectCode}
                          </span>
                          <h5 className="font-bold text-slate-900 text-sm">{assignment.projectName}</h5>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">Customer: {assignment.customerName}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px] font-bold rounded-lg">
                          Role: {assignment.role}
                        </span>
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-[10px] font-bold rounded-lg">
                          {assignment.allocationPct}% Load
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Hours Worked / Alloc</span>
                        <span className="font-bold text-slate-800">
                          <strong className="text-emerald-700">{assignment.workedHours}h</strong> / <strong className="text-indigo-700">{assignment.allocatedHours}h</strong>
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px]">Burn Rate Velocity</span>
                        <span className={`font-bold ${assignment.burnRate > 1.1 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {assignment.burnRate}x
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px]">Project Progress</span>
                        <span className="font-bold text-purple-700">{assignment.progressPct}%</span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px]">Est. Roll-Off Date</span>
                        <span className="font-bold text-cyan-700">{assignment.rollOffFormatted}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div className="flex-1 mr-4">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              assignment.utilizationPct > 105 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(assignment.utilizationPct, 100)}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setLogHoursForm({
                            projectId: assignment.projectId,
                            memberId: selectedDrillDownMemberId,
                            hoursToAdd: 5,
                            hoursType: 'worked',
                            note: `Adjustment for ${assignment.projectName}`,
                          });
                          setIsLogHoursModalOpen(true);
                        }}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-mono font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Timer className="w-3 h-3" />
                        <span>Log Hours</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: INDIVIDUAL WEEKLY LOAD SCHEDULE & FORECAST */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                    Individual Weekly Workload Schedule &amp; Capacity Forecast
                  </h4>
                </div>
                <span className="text-[10px] text-purple-700 font-mono font-bold bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  4-Week Horizon
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                {drillDownMemberData.weeklyLoadSchedule.map((wk, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">{wk.weekLabel}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                          wk.status === 'Over Capacity'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : wk.status === 'Capacity Freed'
                            ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {wk.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Workload Load:</span>
                        <span className="font-bold text-slate-800">{wk.worked}h / {wk.alloc}h</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300">
                        <div
                          className={`h-full rounded-full ${
                            wk.worked > wk.alloc ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(100, (wk.worked / Math.max(1, wk.alloc)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Workload Reallocation Insight Alert */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-3 text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h5 className="font-bold text-indigo-900">Resource Optimization Recommendation</h5>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {drillDownMemberData.overallUtil > 105
                      ? `${drillDownMemberData.memberName} is currently operating at ${drillDownMemberData.overallUtil}% capacity across ${drillDownMemberData.memberAssignments.length} active projects. Reallocating 5-10 hours/week to junior resources in Week 2 will normalize project burn velocity.`
                      : `${drillDownMemberData.memberName} maintains optimal balance (${drillDownMemberData.overallUtil}% utilization). Rolling off from key milestones in Week 4 will liberate ~${Math.round(drillDownMemberData.weeklyAllocatedHours * 0.25)} hrs/week for incoming customer migrations.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-mono">
                Member ID: {drillDownMemberData.memberInfo?.id || selectedDrillDownMemberId}
              </span>
              <button
                onClick={() => setSelectedDrillDownMemberId(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                Close Drill-Down
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STAKEHOLDER PDF REPORT & EXPORT SUMMARY */}
      {/* ========================================================================= */}
      {isExportReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto my-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0">
            {/* Header / Brand & Document Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 font-mono text-[10px] font-bold rounded-lg uppercase">
                    Executive Stakeholder Report
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Generated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                  Team Resource Utilization &amp; Capacity Forecast
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Scope: {selectedResourceProjectId === 'all' ? 'All Active Migration Projects' : projects.find(p => p.id === selectedResourceProjectId)?.projectName} | {filteredResourceAssignments.length} Assignments
                </p>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  title="Download CSV raw dataset"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Download CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Print or Save as PDF"
                >
                  <FileText className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>

                <button
                  onClick={() => setIsExportReportModalOpen(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Executive KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Total Allocated Hours</span>
                <div className="text-xl font-black text-indigo-700 font-mono mt-0.5">{totalResourceAllocatedHours} hrs</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Total Hours Worked</span>
                <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">{totalResourceWorkedHours} hrs</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Overall Utilization Rate</span>
                <div className="text-xl font-black text-purple-700 font-mono mt-0.5">{overallResourceUtilizationPct}%</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Over-Capacity Alerts</span>
                <div className="text-xl font-black text-amber-700 font-mono mt-0.5">
                  {allResourceAssignments.filter(a => a.status === 'over').length} Members
                </div>
              </div>
            </div>

            {/* Utilization & Capacity Roster Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Team Member Utilization &amp; Project Roster</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  Showing {filteredResourceAssignments.length} Records
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider">
                      <th className="p-3">Team Member</th>
                      <th className="p-3">Project / Customer</th>
                      <th className="p-3 text-center">Load %</th>
                      <th className="p-3 text-right">Worked / Alloc</th>
                      <th className="p-3 text-center">Utilization</th>
                      <th className="p-3 text-center">Burn Velocity</th>
                      <th className="p-3 text-right">Est. Roll-Off</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredResourceAssignments.map((ra, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-medium text-slate-900">
                          <div className="font-bold text-xs">{ra.memberName}</div>
                          <div className="text-[10px] text-slate-500">{ra.role}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-indigo-700 font-bold">{ra.projectCode} - {ra.projectName}</div>
                          <div className="text-[10px] text-slate-500">{ra.customerName}</div>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          {ra.allocationPct}%
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-emerald-700 font-bold">{ra.workedHours}h</span> / <span className="text-slate-500">{ra.allocatedHours}h</span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ra.status === 'over'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : ra.status === 'under'
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {ra.utilizationPct}% ({ra.status.toUpperCase()})
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-purple-700">
                          {ra.burnRate}x
                        </td>
                        <td className="p-3 text-right text-cyan-700 font-bold">
                          {ra.rollOffFormatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Strategic Resource Guidance */}
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-2 text-indigo-900 font-bold">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Executive Summary &amp; Capacity Optimization Insights</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                The overall migration workload is operating at <strong className="text-indigo-700">{overallResourceUtilizationPct}% average utilization</strong> across {projects.length} migration initiatives. {allResourceAssignments.filter(a => a.status === 'over').length} team members are over-allocated (&gt;105% capacity). Rolling off high-velocity leads upon reaching 85%+ completion will liberate ~{allResourceAssignments.reduce((a, b) => a + b.freedHoursPerWeek, 0)} hours/week over the next {forecastHorizonDays} days.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500 print:hidden">
              <span className="font-mono">Report ID: RPT-UTIL-{new Date().getTime().toString().slice(-6)}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer font-bold"
                >
                  Export Raw CSV
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportReportModalOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING WORKLOAD REBALANCE TOAST NOTIFICATION */}
      {rebalanceToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-indigo-200 text-slate-900 p-4 rounded-2xl shadow-xl max-w-md flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <p className="text-xs font-mono leading-snug text-slate-700">{rebalanceToast.message}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {rebalanceToast.undoData && (
              <button
                type="button"
                onClick={handleUndoRebalance}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold font-mono rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setRebalanceToast(null)}
              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
