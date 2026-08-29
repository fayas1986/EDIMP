import React, { useState, useEffect } from 'react';
import { ActivityFeedWidget } from './ActivityFeedWidget';
import { UserRole } from '../types';
import { 
  Globe,
  Activity,
  Database,
  Layers,
  Workflow,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Sparkles,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Server,
  GitCommit,
  FileSpreadsheet,
  Award,
  FlaskConical,
  Cpu,
  BookOpen,
  DownloadCloud,
  RotateCcw,
  GitCompare,
  History,
  EyeOff,
  Network,
  Code2,
  Combine,
  Shield,
  ShieldAlert,
  UserCheck,
  ChevronDown,
  BarChart2,
  Briefcase,
  Bell,
  CreditCard,
  KeyRound,
  HeartPulse,
  Sliders,
  Radio,
} from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string | null;
  permissions: UserRole[];
}

export interface MenuGroup {
  groupTitle: string;
  items: MenuItem[];
}

interface GroupColorTheme {
  titleColor: string;
  dotBg: string;
  badgeBg: string;
  badgeText: string;
  borderBottom: string;
}

const GROUP_THEMES: Record<string, GroupColorTheme> = {
  'Overview': {
    titleColor: 'text-sky-400',
    dotBg: 'bg-sky-400 shadow-sky-400/50',
    badgeBg: 'bg-sky-950/90',
    badgeText: 'text-sky-300 border-sky-800/80',
    borderBottom: 'border-sky-500/20',
  },
  'Data Catalog': {
    titleColor: 'text-emerald-400',
    dotBg: 'bg-emerald-400 shadow-emerald-400/50',
    badgeBg: 'bg-emerald-950/90',
    badgeText: 'text-emerald-300 border-emerald-800/80',
    borderBottom: 'border-emerald-500/20',
  },
  'Design & Mapping': {
    titleColor: 'text-indigo-400',
    dotBg: 'bg-indigo-400 shadow-indigo-400/50',
    badgeBg: 'bg-indigo-950/90',
    badgeText: 'text-indigo-300 border-indigo-800/80',
    borderBottom: 'border-indigo-500/20',
  },
  'Data Quality & Prep': {
    titleColor: 'text-amber-400',
    dotBg: 'bg-amber-400 shadow-amber-400/50',
    badgeBg: 'bg-amber-950/90',
    badgeText: 'text-amber-300 border-amber-800/80',
    borderBottom: 'border-amber-500/20',
  },
  'Migration Engine': {
    titleColor: 'text-purple-400',
    dotBg: 'bg-purple-400 shadow-purple-400/50',
    badgeBg: 'bg-purple-950/90',
    badgeText: 'text-purple-300 border-purple-800/80',
    borderBottom: 'border-purple-500/20',
  },
  'Monitoring & Audit': {
    titleColor: 'text-rose-400',
    dotBg: 'bg-rose-400 shadow-rose-400/50',
    badgeBg: 'bg-rose-950/90',
    badgeText: 'text-rose-300 border-rose-800/80',
    borderBottom: 'border-rose-500/20',
  },
  'Administration & Ops': {
    titleColor: 'text-indigo-400',
    dotBg: 'bg-indigo-400 shadow-indigo-400/50',
    badgeBg: 'bg-indigo-950/90',
    badgeText: 'text-indigo-300 border-indigo-800/80',
    borderBottom: 'border-indigo-500/20',
  },
  'Platform & AI': {
    titleColor: 'text-cyan-400',
    dotBg: 'bg-cyan-400 shadow-cyan-400/50',
    badgeBg: 'bg-cyan-950/90',
    badgeText: 'text-cyan-300 border-cyan-800/80',
    borderBottom: 'border-cyan-500/20',
  },
};

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  userRole?: UserRole;
  onUserRoleChange?: (role: UserRole) => void;
  currentUser?: any;
}

export const menuGroups: MenuGroup[] = [
    {
      groupTitle: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Activity, badge: null, permissions: ['Partner Administrator', 'Customer Administrator', 'Project Manager', 'Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Auditor', 'Business User', 'Read Only', 'Data Analyst'] },
      ],
    },
    {
      groupTitle: 'Data Catalog',
      items: [
        { id: 'connectors', label: 'Connectors', icon: Database, badge: null, permissions: ['Partner Administrator', 'Customer Administrator', 'Data Engineer'] },
        { id: 'discovery', label: 'Data Discovery', icon: Layers, badge: null, permissions: ['Partner Administrator', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Business User', 'Data Analyst'] },
        { id: 'data-dictionary', label: 'Data Dictionary', icon: BookOpen, badge: null, permissions: ['Partner Administrator', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Business User', 'Data Analyst'] },
        { id: 'schema-registry', label: 'Schema Registry', icon: History, badge: null, permissions: ['Partner Administrator', 'Customer Administrator', 'Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Business User', 'Data Analyst'] },
      ],
    },
    {
      groupTitle: 'Design & Mapping',
      items: [
        { id: 'mapping', label: 'Mapping Studio', icon: Workflow, badge: null, permissions: ['Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Data Analyst'] },
        { id: 'schema-comparison', label: 'AI Schema Comparison', icon: GitCompare, badge: null, permissions: ['Migration Consultant', 'Data Engineer', 'Data Analyst'] },
        { id: 'workflow-designer', label: 'Workflow Designer', icon: Workflow, badge: null, permissions: ['Data Engineer', 'Migration Consultant'] },
        { id: 'lineage', label: 'Data Lineage', icon: GitCommit, badge: null, permissions: ['Migration Consultant', 'Data Engineer', 'Auditor', 'Data Analyst'] },
        { id: 'dependency-explorer', label: 'Dependency Explorer', icon: Network, badge: null, permissions: ['Migration Consultant', 'Data Engineer', 'Auditor', 'Data Analyst'] },
      ],
    },
    {
      groupTitle: 'Data Quality & Prep',
      items: [
        { id: 'data-quality-audit', label: 'Data Quality Audit', icon: ShieldAlert, badge: 'NEW', permissions: ['Data Engineer', 'Functional Consultant', 'Migration Consultant', 'Data Analyst'] },
        { id: 'validation', label: 'Validation & Cleansing', icon: ShieldCheck, badge: null, permissions: ['Data Engineer', 'Functional Consultant', 'Migration Consultant', 'Data Analyst'] },
        { id: 'data-anonymization', label: 'Data Anonymization', icon: EyeOff, badge: null, permissions: ['Data Engineer', 'Auditor', 'Data Analyst'] },
        { id: 'export-management', label: 'Export Management', icon: DownloadCloud, badge: null, permissions: ['Customer Administrator', 'Project Manager', 'Business User', 'Data Engineer', 'Data Analyst'] },
      ],
    },
    {
      groupTitle: 'Migration Engine',
      items: [
        { id: 'wizard', label: 'Migration Wizard', icon: Zap, badge: null, permissions: ['Project Manager', 'Migration Consultant', 'Data Engineer', 'Customer Administrator'] },
        { id: 'simulation', label: 'Dry-Run Simulation', icon: FlaskConical, badge: null, permissions: ['Project Manager', 'Migration Consultant', 'Data Engineer', 'Customer Administrator'] },
        { id: 'control-tower', label: 'Migration Control Tower', icon: Radio, badge: 'LIVE', permissions: ['Project Manager', 'Migration Consultant', 'Data Engineer', 'Customer Administrator', 'Partner Administrator'] },
        { id: 'migration-replay', label: 'Migration Replay', icon: RotateCcw, badge: null, permissions: ['Project Manager', 'Migration Consultant', 'Data Engineer', 'Customer Administrator'] },
        { id: 'batch-processing', label: 'Batch Processing Engine', icon: Layers, badge: null, permissions: ['Data Engineer', 'Data Analyst'] },
        { id: 'global-load-balancer', label: 'Global Load Balancer', icon: Combine, badge: 'NEW', permissions: ['Data Engineer', 'Partner Administrator', 'Customer Administrator'] },
        { id: 'load-balancer-audit', label: 'Load Balancer Audit', icon: History, badge: 'NEW', permissions: ['Data Engineer', 'Partner Administrator', 'Customer Administrator', 'Auditor', 'Data Analyst'] },
        { id: 'job-comparison', label: 'Job Comparison', icon: BarChart2, badge: null, permissions: ['Project Manager', 'Migration Consultant', 'Data Analyst'] },
        { id: 'audit', label: 'Job Scheduler', icon: Calendar, badge: null, permissions: ['Data Engineer'] },
        { id: 'real-time-sync', label: 'Real-Time Synchronization', icon: Network, badge: null, permissions: ['Data Engineer'] },
      ],
    },
    {
      groupTitle: 'Monitoring & Audit',
      items: [
        { id: 'error-center', label: 'Error Center', icon: AlertTriangle, badge: null, permissions: ['Customer Administrator', 'Project Manager', 'Migration Consultant', 'Data Engineer', 'Business User', 'Partner Administrator', 'Data Analyst'] },
        { id: 'notifications', label: 'Notification Center', icon: Bell, badge: null, permissions: ['Customer Administrator', 'Project Manager', 'Migration Consultant', 'Data Engineer', 'Business User', 'Partner Administrator', 'Data Analyst'] },
        { id: 'system-health', label: 'System Health', icon: HeartPulse, badge: null, permissions: ['Data Engineer', 'Partner Administrator'] },
        { id: 'resource-allocation', label: 'Resource Allocation', icon: Sliders, badge: null, permissions: ['Data Engineer', 'Partner Administrator', 'Data Analyst'] },
        { id: 'connection-health', label: 'Connection Health', icon: Network, badge: null, permissions: ['Data Engineer', 'Partner Administrator', 'Data Analyst'] },
        { id: 'audit-reporting', label: 'Audit Reporting', icon: FileSpreadsheet, badge: null, permissions: ['Auditor', 'Partner Administrator', 'Customer Administrator', 'Data Analyst'] },
        { id: 'compliance-dashboard', label: 'Compliance Posture', icon: Award, badge: null, permissions: ['Auditor', 'Partner Administrator', 'Customer Administrator', 'Data Analyst'] },
      ],
    },
    {
      groupTitle: 'Administration & Ops',
      items: [
        { id: 'admin-hub', label: 'Administration Hub', icon: ShieldCheck, badge: null, permissions: ['Partner Administrator', 'Customer Administrator', 'Platform Administrator', 'Super Administrator'] },
        { id: 'architecture-plan', label: 'Architecture & Scale Plan', icon: Layers, badge: 'PLAN', permissions: ['Partner Administrator', 'Customer Administrator', 'Platform Administrator', 'Super Administrator', 'Migration Consultant', 'Data Engineer', 'Auditor', 'Project Manager'] },
        { id: 'code-architecture-review', label: 'Code & Refactoring Review', icon: Code2, badge: 'REVIEW', permissions: ['Partner Administrator', 'Customer Administrator', 'Platform Administrator', 'Super Administrator', 'Migration Consultant', 'Data Engineer', 'Auditor', 'Project Manager'] },
      ],
    },
    {
      groupTitle: 'Platform & AI',
      items: [
        { id: 'partner-portal', label: 'Partner Portal', icon: Briefcase, badge: null, permissions: ['Partner Administrator', 'Partner Admin'] },
        { id: 'billing-management', label: 'Billing & Subscriptions', icon: CreditCard, badge: null, permissions: ['Partner Administrator', 'Partner Admin'] },
        { id: 'license-compliance', label: 'License Compliance', icon: KeyRound, badge: null, permissions: ['Partner Administrator', 'Partner Admin'] },
        { id: 'customer-projects', label: 'Customers & Projects', icon: Briefcase, badge: null, permissions: ['Partner Administrator', 'Partner Admin', 'Customer Administrator', 'Project Manager'] },
        { id: 'tenant-management', label: 'Tenant Management', icon: Server, badge: null, permissions: ['Partner Administrator', 'Partner Admin'] },
        { id: 'user-management', label: 'Users & Roles', icon: Shield, badge: null, permissions: ['Partner Administrator', 'Partner Admin', 'Customer Administrator'] },
        { id: 'ai-assistant', label: 'AI Co-Pilot', icon: Sparkles, badge: null, permissions: ['Migration Consultant', 'Data Engineer', 'Functional Consultant', 'Project Manager', 'Business User', 'Data Analyst'] },
        { id: 'connector-sdk', label: 'Connector SDK', icon: Layers, badge: null, permissions: ['Data Engineer'] },
        { id: 'rest-api-platform', label: 'REST API Platform', icon: Globe, badge: null, permissions: ['Data Engineer'] },
        { id: 'settings', label: 'Settings', icon: Settings, badge: null, permissions: ['Partner Administrator', 'Customer Administrator'] },
      ],
    },
  ];

export const isRoleAllowed = (allowedRoles: UserRole[], role: UserRole): boolean => {
    if (
      role === 'Super Administrator' ||
      role === 'Super Admin' ||
      role === 'Platform Administrator' ||
      role === 'Admin'
    ) {
      return true;
    }

    if (allowedRoles.includes(role)) return true;

    return false;
  };

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  userRole = 'Admin',
  onUserRoleChange,
  currentUser,
}) => {
  const [internalRole, setInternalRole] = useState<UserRole>(userRole);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Collapsible menu groups state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Overview': true,
    'Data Catalog': true,
    'Design & Mapping': true,
    'Data Quality & Prep': true,
    'Migration Engine': true,
    'Monitoring & Audit': true,
    'Administration & Ops': true,
    'Platform & AI': true,
  });

  useEffect(() => {
    setInternalRole(userRole);
  }, [userRole]);

  // Ensure active tab group is expanded whenever activeTab changes
  useEffect(() => {
    const activeGroup = menuGroups.find((g) =>
      g.items.some((item) => item.id === activeTab)
    );
    if (activeGroup) {
      setExpandedGroups((prev) => ({
        ...prev,
        [activeGroup.groupTitle]: true,
      }));
    }
  }, [activeTab]);

  const currentRole = userRole || internalRole;

  const handleRoleSelect = (role: UserRole) => {
    setRoleDropdownOpen(false);
    if (onUserRoleChange) {
      onUserRoleChange(role);
    } else {
      setInternalRole(role);
    }
  };

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    menuGroups.forEach((g) => {
      allExpanded[g.groupTitle] = true;
    });
    setExpandedGroups(allExpanded);
  };

  const handleCollapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    menuGroups.forEach((g) => {
      allCollapsed[g.groupTitle] = false;
    });
    // Keep active item's group expanded
    const activeGroup = menuGroups.find((g) =>
      g.items.some((item) => item.id === activeTab)
    );
    if (activeGroup) {
      allCollapsed[activeGroup.groupTitle] = true;
    }
    setExpandedGroups(allCollapsed);
  };


  // Auto-redirect to dashboard if current activeTab is restricted for the selected user role
  useEffect(() => {
    const allowedIds = menuGroups
      .flatMap((g) => g.items)
      .filter((item) => isRoleAllowed(item.permissions, currentRole))
      .map((item) => item.id);

    if (allowedIds.length > 0 && !allowedIds.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentRole, activeTab, setActiveTab]);

  const handleSelect = (id: string) => {
    setActiveTab(id);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const getShortcutForItem = (id: string): string | undefined => {
    switch (id) {
      case 'dashboard':
        return 'Alt+1';
      case 'connectors':
        return 'Alt+2';
      case 'mapping':
        return 'Alt+3';
      case 'validation':
        return 'Alt+4';
      case 'wizard':
        return 'Alt+5';
      case 'error-center':
        return 'Alt+6';
      case 'ai-assistant':
        return 'Alt+7';
      case 'settings':
        return 'Alt+8';
      default:
        return undefined;
    }
  };

  const handleNavKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
      const navButtons = Array.from(
        e.currentTarget.querySelectorAll('[id^="sidebar-nav-"]')
      ) as HTMLButtonElement[];
      if (navButtons.length === 0) return;

      const currentIndex = navButtons.indexOf(document.activeElement as HTMLButtonElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < navButtons.length - 1 ? currentIndex + 1 : 0;
        navButtons[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : navButtons.length - 1;
        navButtons[prevIndex]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        navButtons[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        navButtons[navButtons.length - 1]?.focus();
      }
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close mobile navigation menu"
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity cursor-pointer"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
              setMobileOpen(false);
            }
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        role="navigation"
        aria-label="Primary Navigation"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 bg-slate-900 border-r border-slate-800 flex flex-col text-slate-300 transition-all duration-300 ease-in-out select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Sidebar Header / Logo Branding */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 rounded-xl shadow-lg shadow-indigo-500/20 border border-indigo-400/40 shrink-0">
              <Database className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            {!collapsed && (
              <div className="whitespace-nowrap transition-opacity duration-200">
                <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
                  EDIMP
                </span>
                <span className="text-[10px] text-indigo-400 font-mono font-semibold">Enterprise v3.4</span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            id="sidebar-collapse-toggle-btn"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Expand Sidebar Navigation (Alt + B)' : 'Collapse Sidebar Navigation (Alt + B)'}
            aria-expanded={!collapsed}
            aria-keyshortcuts="Alt+B"
            className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            title={collapsed ? 'Expand Sidebar (Alt + B)' : 'Collapse Sidebar (Alt + B)'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" aria-hidden="true" /> : <ChevronLeft className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>

        {/* Navigation Items Area - Filtered by Permissions */}
        <div
          tabIndex={0}
          onKeyDown={handleNavKeyDown}
          aria-label="Navigation menu items list. Use Up and Down arrow keys to navigate items."
          className="flex-1 overflow-y-auto py-3 px-2 space-y-4 custom-scrollbar min-h-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50 rounded-lg"
        >
          {!collapsed && (
            <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-800/40 text-[10px] font-mono text-slate-500">
              <span className="font-bold uppercase tracking-wider text-slate-400">Navigation Groups</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  aria-label="Expand all navigation groups"
                  className="hover:text-indigo-400 transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded px-1"
                  title="Expand All Groups"
                >
                  Expand All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  aria-label="Collapse all navigation groups"
                  className="hover:text-indigo-400 transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded px-1"
                  title="Collapse All Groups"
                >
                  Collapse
                </button>
              </div>
            </div>
          )}

          {menuGroups.map((group, idx) => {
            // Filter menu items by checking permission requirement for currentRole
            const allowedItems = group.items.filter((item) =>
              isRoleAllowed(item.permissions, currentRole)
            );

            if (allowedItems.length === 0) return null;

            const isExpanded = expandedGroups[group.groupTitle] ?? true;
            const hasActiveChild = allowedItems.some((item) => item.id === activeTab);
            const groupId = `nav-group-${group.groupTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

            const theme = GROUP_THEMES[group.groupTitle] || {
              titleColor: 'text-indigo-400',
              dotBg: 'bg-indigo-400 shadow-indigo-400/50',
              badgeBg: 'bg-indigo-950/90',
              badgeText: 'text-indigo-300 border-indigo-800/80',
              borderBottom: 'border-slate-800/50',
            };

            return (
              <div key={idx} className="space-y-1 font-sans">
                {!collapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.groupTitle)}
                    aria-expanded={isExpanded}
                    aria-controls={groupId}
                    aria-label={`${group.groupTitle} section, ${allowedItems.length} items. Click to ${isExpanded ? 'collapse' : 'expand'}.`}
                    className={`w-full px-2.5 pt-2 pb-1.5 mb-1 flex items-center justify-between border-b ${theme.borderBottom} hover:bg-slate-800/40 rounded-xl transition-all cursor-pointer group/title focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`w-1.5 h-1.5 rounded-full ${theme.dotBg} shrink-0`} aria-hidden="true" />
                      <span className={`text-xs font-black uppercase tracking-wider font-display ${theme.titleColor} truncate`}>
                        {group.groupTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasActiveChild && !isExpanded && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" title="Active item inside" aria-hidden="true" />
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 group-hover/title:text-slate-200 transition-transform duration-200 ${
                          isExpanded ? 'rotate-0' : '-rotate-90'
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                ) : (
                  <div className="flex justify-center py-1 border-b border-slate-800/40" title={group.groupTitle}>
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dotBg}`} aria-hidden="true" />
                  </div>
                )}

                {(isExpanded || collapsed) && (
                  <div id={groupId} role="list" className="space-y-1">
                    {allowedItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const shortcut = getShortcutForItem(item.id);

                      return (
                        <button
                          key={item.id}
                          id={`sidebar-nav-${item.id}`}
                          role="tab"
                          aria-selected={isActive}
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={`${item.label}${item.badge ? `, badge: ${item.badge}` : ''}${shortcut ? `, keyboard shortcut: ${shortcut}` : ''}`}
                          aria-keyshortcuts={shortcut || undefined}
                          onClick={() => handleSelect(item.id)}
                          title={collapsed ? `${item.label} (${currentRole})${shortcut ? ` [${shortcut}]` : ''}` : shortcut ? `Shortcut: ${shortcut}` : undefined}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-tight transition-all duration-300 group relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 font-bold border border-indigo-400/40'
                              : 'text-slate-200 hover:text-white hover:bg-slate-800/80'
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-300'
                            }`}
                            aria-hidden="true"
                          />

                          {!collapsed && (
                            <div className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap">
                              <span className="truncate group-hover:translate-x-1 transition-transform duration-300">{item.label}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {shortcut && (
                                  <span className="hidden group-hover:inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-800/90 text-indigo-300 font-mono border border-slate-700 font-bold">
                                    {shortcut}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Active Pip Indicator when Collapsed */}
                          {collapsed && isActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-400 rounded-r-full shadow-md shadow-indigo-400/50" aria-hidden="true" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Cluster Health Telemetry Widget - Pinned directly above Activity Feed */}
        {!collapsed && (
          <div className="border-t border-slate-800/80 bg-slate-950/40 p-2.5 space-y-2 shrink-0">
            <div className="px-1 flex items-center justify-between text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Cluster Telemetry</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-mono text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Optimal
              </span>
            </div>

            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/90 space-y-2 text-xs shadow-xs">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/60">
                <span className="text-slate-300 font-medium truncate">SAP ERP → D365</span>
                <span className="font-mono text-indigo-300 font-bold shrink-0">450 rec/s</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Parallel Workers</span>
                  <span className="font-mono text-indigo-300 font-bold">8 / 8 Active</span>
                </div>
                <div className="w-full bg-slate-800/90 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full w-[85%]" />
                </div>
              </div>

              <div className="space-y-1 pt-0.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Cluster RAM</span>
                  <span className="font-mono text-emerald-400 font-bold">12.4 GB / 32 GB</span>
                </div>
                <div className="w-full bg-slate-800/90 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[38%]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-Time Activity Feed Sidebar Widget */}
        <ActivityFeedWidget collapsed={collapsed} onNavigateTab={handleSelect} />

        {/* Sidebar Footer System Status & Active Role Context */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 shrink-0">
          {!collapsed ? (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-slate-200 font-semibold">Engine Status</span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate flex items-center justify-between">
                <span>Cloud Run Node.js</span>
                <span className="text-indigo-300 font-semibold">{currentRole} Mode</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`Engine Online (${currentRole})`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
