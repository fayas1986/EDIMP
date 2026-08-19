import React, { useState, useEffect, Suspense } from 'react';
import { useAppStore } from './store/useAppStore';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import { Header, AppTheme } from './components/Header';
import { Sidebar } from './components/Sidebar';
const DashboardView = React.lazy(() => import('./components/DashboardView').then(module => ({ default: module.DashboardView })));
const ConnectorsView = React.lazy(() => import('./components/ConnectorsView').then(module => ({ default: module.ConnectorsView })));
const DiscoveryView = React.lazy(() => import('./components/DiscoveryView').then(module => ({ default: module.DiscoveryView })));
const DataDictionaryView = React.lazy(() => import('./components/DataDictionaryView').then(module => ({ default: module.DataDictionaryView })));
const MappingStudioView = React.lazy(() => import('./components/MappingStudioView').then(module => ({ default: module.MappingStudioView })));
const MigrationWorkflowDesigner = React.lazy(() => import('./components/MigrationWorkflowDesigner').then(module => ({ default: module.MigrationWorkflowDesigner })));
const ValidationCleansingView = React.lazy(() => import('./components/ValidationCleansingView').then(module => ({ default: module.ValidationCleansingView })));
const DataQualityAuditView = React.lazy(() => import('./components/DataQualityAuditView').then(module => ({ default: module.DataQualityAuditView })));
const DataAnonymizationView = React.lazy(() => import('./components/DataAnonymizationView').then(module => ({ default: module.DataAnonymizationView })));
const ExportManagementView = React.lazy(() => import('./components/ExportManagementView').then(module => ({ default: module.ExportManagementView })));
const MigrationWizardView = React.lazy(() => import('./components/MigrationWizardView').then(module => ({ default: module.MigrationWizardView })));
const ErrorCenterView = React.lazy(() => import('./components/ErrorCenterView').then(module => ({ default: module.ErrorCenterView })));
const BatchProcessingEngineView = React.lazy(() => import('./components/BatchProcessingEngineView'));
const GlobalLoadBalancerView = React.lazy(() => import('./components/GlobalLoadBalancerView'));
const LoadBalancerAuditView = React.lazy(() => import('./components/LoadBalancerAuditView').then(module => ({ default: module.LoadBalancerAuditView })));
const DecisionLogExplorerView = React.lazy(() => import('./components/DecisionLogExplorerView'));
const RealTimeSyncView = React.lazy(() => import('./components/RealTimeSyncView'));
const ConnectorSdkView = React.lazy(() => import('./components/ConnectorSdkView'));
const RestApiPlatformView = React.lazy(() => import('./components/RestApiPlatformView'));
const AiAssistantView = React.lazy(() => import('./components/AiAssistantView').then(module => ({ default: module.AiAssistantView })));
const AuditSchedulerView = React.lazy(() => import('./components/AuditSchedulerView').then(module => ({ default: module.AuditSchedulerView })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then(module => ({ default: module.SettingsView })));
const TenantManagementView = React.lazy(() => import('./components/TenantManagementView').then(module => ({ default: module.TenantManagementView })));
const CustomerProjectManagementView = React.lazy(() => import('./components/CustomerProjectManagementView').then(module => ({ default: module.CustomerProjectManagementView })));
const PartnerPortalView = React.lazy(() => import('./components/PartnerPortalView').then(module => ({ default: module.PartnerPortalView })));
const BillingManagementView = React.lazy(() => import('./components/BillingManagementView').then(module => ({ default: module.BillingManagementView })));
const UserRoleManagementView = React.lazy(() => import('./components/UserRoleManagementView').then(module => ({ default: module.UserRoleManagementView })));
const LicenseComplianceView = React.lazy(() => import('./components/LicenseComplianceView').then(module => ({ default: module.LicenseComplianceView })));
const DataLineageView = React.lazy(() => import('./components/DataLineageView').then(module => ({ default: module.DataLineageView })));
const DataDependencyExplorerView = React.lazy(() => import('./components/DataDependencyExplorerView').then(module => ({ default: module.DataDependencyExplorerView })));
const AuditReportingView = React.lazy(() => import('./components/AuditReportingView').then(module => ({ default: module.AuditReportingView })));
const ComplianceDashboardView = React.lazy(() => import('./components/ComplianceDashboardView').then(module => ({ default: module.ComplianceDashboardView })));
const MigrationSimulationView = React.lazy(() => import('./components/MigrationSimulationView').then(module => ({ default: module.MigrationSimulationView })));
const MigrationReplayView = React.lazy(() => import('./components/MigrationReplayView').then(module => ({ default: module.MigrationReplayView })));
const SchemaComparisonView = React.lazy(() => import('./components/SchemaComparisonView').then(module => ({ default: module.SchemaComparisonView })));
const SchemaRegistryView = React.lazy(() => import('./components/SchemaRegistryView').then(module => ({ default: module.SchemaRegistryView })));
const JobComparisonView = React.lazy(() => import('./components/JobComparisonView').then(module => ({ default: module.JobComparisonView })));
const SystemHealthView = React.lazy(() => import('./components/SystemHealthView').then(module => ({ default: module.SystemHealthView })));
const ResourceAllocationView = React.lazy(() => import('./components/ResourceAllocationView').then(module => ({ default: module.ResourceAllocationView })));
const GlobalConnectionHealthView = React.lazy(() => import('./components/GlobalConnectionHealthView').then(module => ({ default: module.GlobalConnectionHealthView })));
const NotificationCenterView = React.lazy(() => import('./components/NotificationCenterView').then(module => ({ default: module.NotificationCenterView })));
const AdministrationHubView = React.lazy(() => import('./components/AdministrationHubView').then(module => ({ default: module.AdministrationHubView })));
const EnterpriseArchitecturePlanView = React.lazy(() => import('./components/EnterpriseArchitecturePlanView').then(module => ({ default: module.EnterpriseArchitecturePlanView })));
const CodeArchitectureReviewView = React.lazy(() => import('./components/CodeArchitectureReviewView').then(module => ({ default: module.CodeArchitectureReviewView })));
import { ErrorBoundary } from './components/ErrorBoundary';
import { SessionManager } from './components/SessionManager';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { GlobalQuickActionModal } from './components/GlobalQuickActionModal';
import { AuthSessionManagerModal } from './components/AuthSessionManagerModal';
import { LoginView } from './components/LoginView';
import { AccessDeniedView } from './components/AccessDeniedView';
import { isRoleAllowedForTab } from './services/rbacService';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
import { offlineCacheService } from './services/offlineCacheService';
import { generateAutomatedDataProfile } from './services/dataProfilingService';
import { MOCK_CONNECTORS, MOCK_MIGRATION_JOBS } from './data/mockData';
import { Connector, ThrottlingConfig, MigrationJob, UserRole } from './types';
import { MOCK_ALL_USERS, UserIdentity } from './data/mockUsers';
import { useQuery } from '@tanstack/react-query';
import { connectorsApi } from './api/connectors';
import { jobsApi } from './api/jobs';

export function App() {
  
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.replace('/', '') || 'dashboard';
  const setActiveTab = (tab: string) => navigate('/' + tab);


  const connectors = useAppStore(state => state.connectors);
  const setConnectors = useAppStore(state => state.setConnectors);
  const jobs = useAppStore(state => state.jobs);
  const setJobs = useAppStore(state => state.setJobs);
  const hasGeminiKey = useAppStore(state => state.hasGeminiKey);
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const currentUser = useAppStore(state => state.currentUser);
  const userRole = useAppStore(state => state.userRole);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [quickActionsModalOpen, setQuickActionsModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [screenReaderAnnouncement, setScreenReaderAnnouncementLocal] = useState('');
  
  const handleLoginSuccess = useAppStore(state => state.handleLoginSuccess);
  const handleLogout = useAppStore(state => state.handleLogout);
  const setHasGeminiKey = useAppStore(state => state.setHasGeminiKey);
  const handleSelectUser = useAppStore(state => state.handleSelectUser);
  const setUserRole = useAppStore(state => state.setUserRole);

  const setScreenReaderAnnouncement = (msg: string) => {
    setScreenReaderAnnouncementLocal(msg);
  };

  const { data: fetchedConnectors } = useQuery({
    queryKey: ['connectors'],
    queryFn: () => connectorsApi.list()
  });

  useEffect(() => {
    if (fetchedConnectors && fetchedConnectors.length > 0) {
      setConnectors(fetchedConnectors);
    }
  }, [fetchedConnectors, setConnectors]);

  const { data: fetchedJobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.list()
  });

  useEffect(() => {
    if (fetchedJobs && fetchedJobs.length > 0) {
      setJobs(fetchedJobs);
    }
  }, [fetchedJobs, setJobs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K for Quick Actions
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setQuickActionsModalOpen(true);
        return;
      }


      // Alt + M to jump to main content
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        const mainEl = document.getElementById('main-content');
        if (mainEl) {
          mainEl.focus();
          setScreenReaderAnnouncement('Moved focus to main content area.');
        }
        return;
      }

      // Alt + 1-8 for quick navigation tabs
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const tabMap: Record<string, { id: string; name: string }> = {
          '1': { id: 'dashboard', name: 'Dashboard Overview' },
          '2': { id: 'connectors', name: 'Connectors' },
          '3': { id: 'mapping', name: 'Mapping Studio' },
          '4': { id: 'validation', name: 'Validation & Cleansing' },
          '5': { id: 'wizard', name: 'Migration Wizard' },
          '6': { id: 'error-center', name: 'Error Center' },
          '7': { id: 'ai-assistant', name: 'AI Co-Pilot' },
          '8': { id: 'settings', name: 'Settings' },
        };

        if (tabMap[e.key]) {
          e.preventDefault();
          const targetTab = tabMap[e.key];
          setActiveTab(targetTab.id);
          setScreenReaderAnnouncement(`Navigated to ${targetTab.name}.`);
          return;
        }
      }

      // Escape to close mobile sidebar or modal
      if (e.key === 'Escape') {
        if (mobileSidebarOpen) {
          setMobileSidebarOpen(false);
          setScreenReaderAnnouncement('Closed mobile navigation sidebar.');
        }
        if (shortcutsModalOpen) {
          setShortcutsModalOpen(false);
          setScreenReaderAnnouncement('Closed keyboard shortcuts modal.');
        }
        if (quickActionsModalOpen) {
          setQuickActionsModalOpen(false);
          setScreenReaderAnnouncement('Closed quick actions command palette.');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileSidebarOpen, shortcutsModalOpen, quickActionsModalOpen]);

  // Check health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasGeminiKey === 'boolean') {
          setHasGeminiKey(data.hasGeminiKey);
        }
      })
      .catch(() => {
        // Fallback default
      });
  }, []);

  // Real-time job processing simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setJobs((prevJobs: any) =>
        prevJobs.map((job: any) => {
          if (job.status !== 'Running') return job;

          // Check if batch processing is enabled for this job
          const isBatch = job.batchProcessingEnabled;
          const increment = isBatch
            ? (job.batchSize || 1000)
            : (Math.floor(Math.random() * 140) + 80);

          const nextProcessed = Math.min(job.totalRecords, job.processedRecords + increment);
          
          // Calculate new percentage
          const nextPct = Math.round((nextProcessed / job.totalRecords) * 100);
          
          // Speed fluctuates slightly (with a higher baseline for batch processing)
          const baseSpeed = isBatch ? 1200 : (job.throughputRps || 120);
          const speedFluc = Math.floor(Math.random() * 60) - 30;
          const currentSpeed = Math.max(60, baseSpeed + speedFluc);

          // Simulate occasional new warnings or errors
          let errInc = 0;
          let warnInc = 0;
          if (Math.random() > 0.85) {
            errInc = Math.random() > 0.7 ? 1 : 0;
            warnInc = Math.floor(Math.random() * 3);
          }

          // If reached 100%, set status to Completed
          const isFinished = nextProcessed >= job.totalRecords;
          const nextStatus = isFinished ? 'Completed' : 'Running';

          return {
            ...job,
            processedRecords: nextProcessed,
            progressPct: nextPct,
            status: nextStatus,
            throughputRps: currentSpeed,
            errorCount: job.errorCount + errInc,
            warningCount: job.warningCount + warnInc,
            endTime: isFinished ? new Date().toISOString().replace('T', ' ').substring(0, 19) : job.endTime
          };
        })
      );
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  const handleNaturalQueryFromHeader = (query: string) => {
    setActiveTab('ai-assistant');
  };

  const handleTestConnector = (connectorId: string) => {
    setConnectors((prev: any) =>
      prev.map((c: any) =>
        c.id === connectorId ? { ...c, lastTested: 'Just now', status: 'Connected' } : c
      )
    );
  };

  const handleUpdateConnectorThrottling = (connectorId: string, throttlingConfig: ThrottlingConfig) => {
    setConnectors((prev: any) =>
      prev.map((c: any) => (c.id === connectorId ? { ...c, throttlingConfig } : c))
    );
  };

  const handleAddConnector = (newConn: Partial<Connector>) => {
    const dataProfile = newConn.dataProfile || generateAutomatedDataProfile(newConn);
    const created: Connector = {
      id: newConn.id || `conn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newConn.name || 'New Connector',
      category: newConn.category || 'ERP',
      systemType: newConn.systemType || 'Both',
      provider: newConn.provider || 'Custom API',
      status: newConn.status || 'Connected',
      authType: newConn.authType || 'OAuth 2.0',
      latencyMs: newConn.latencyMs ?? 28,
      icon: newConn.icon || 'Database',
      hostUrl: newConn.hostUrl || 'https://api.enterprise.com',
      lastTested: newConn.lastTested || 'Just now',
      isTransferring: newConn.isTransferring,
      transferRateKbps: newConn.transferRateKbps,
      activeJobName: newConn.activeJobName,
      throttlingConfig: newConn.throttlingConfig,
      isAutoDiscovered: newConn.isAutoDiscovered,
      discoveryTimestamp: newConn.discoveryTimestamp,
      dataProfile,
    };
    setConnectors((prev: any) => {
      // Prevent duplicate additions if ID already exists
      if (prev.some((c: any) => c.id === created.id)) {
        return prev.map((c: any) => (c.id === created.id ? { ...c, ...created } : c));
      }
      return [created, ...prev];
    });
  };

  const handleToggleJobStatus = (jobId: string) => {
    setJobs((prev: any) =>
      prev.map((j: any) => {
        if (j.id === jobId) {
          const nextStatus = j.status === 'Running' ? 'Paused' : 'Running';
          return { ...j, status: nextStatus };
        }
        return j;
      })
    );
  };

  const handleAddNewJob = (job: MigrationJob) => {
    setJobs((prev: any) => [job, ...prev]);
  };

  const handleRollbackJob = (jobId: string) => {
    setJobs((prev: any) =>
      prev.map((job: any) =>
        job.id === jobId
          ? {
              ...job,
              status: 'Rolled Back',
              isRolledBack: true,
              lastRunStatus: 'Failed',
              processedRecords: 0,
            }
          : job
      )
    );
  };

  // Render Login authentication portal if not authenticated
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const isCurrentTabAllowed = isRoleAllowedForTab(activeTab, userRole);

  return (
    <SessionManager>
      <div
        id="app-root-wrapper"
        className={`min-h-screen bg-slate-950 text-slate-900 font-sans antialiased flex selection:bg-indigo-500 selection:text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 transition-colors duration-300 ${
          currentTheme !== 'default' ? currentTheme : ''
        }`}
      >
        {/* Left Sidebar Menu */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
          userRole={userRole}
          onUserRoleChange={setUserRole}
          currentUser={currentUser}
        />

        {/* Main Container Area */}
        <div className={`flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden transition-all duration-500 ${
          currentTheme === 'theme-emerald' ? 'bg-emerald-50/60' :
          currentTheme === 'theme-sapphire' ? 'bg-blue-50/60' :
          currentTheme === 'theme-titanium' ? 'bg-slate-200/50' :
          'bg-slate-100/95'
        }`}>
          {/* Top Header Bar */}
          <Header
            onNaturalQuerySubmit={handleNaturalQueryFromHeader}
            hasGeminiKey={hasGeminiKey}
            onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
            mobileSidebarOpen={mobileSidebarOpen}
            currentTheme={currentTheme as AppTheme}
            onThemeChange={setCurrentTheme}
            onOpenShortcuts={() => setShortcutsModalOpen(true)}
            onOpenQuickActions={() => setQuickActionsModalOpen(true)}
            currentUser={currentUser}
            onOpenAuthModal={() => setAuthModalOpen(true)}
            onLogout={handleLogout}
          />

          {/* Offline / Service Worker Status Banner */}
          <OfflineStatusBanner />

          {/* Screen Reader Live Region for Announcements */}
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {screenReaderAnnouncement}
          </div>

          {/* View Content */}
          <main id="main-content" tabIndex={-1} className="flex-1 pb-12 focus:outline-none">
            <ErrorBoundary onReset={() => setActiveTab('dashboard')}>
              {!isCurrentTabAllowed ? (
                <AccessDeniedView
                  currentRole={userRole}
                  currentUser={currentUser}
                  forbiddenTabId={activeTab}
                  onNavigateHome={() => setActiveTab('dashboard')}
                  onOpenAuthModal={() => setAuthModalOpen(true)}
                />
              ) : (
                <Suspense fallback={<div className="p-8 text-white">Loading...</div>}>
<Routes>
<Route path="/dashboard" element={
                <DashboardView
                  connectors={connectors}
                  jobs={jobs}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onToggleJobStatus={handleToggleJobStatus}
                />
              } />

          <Route path="/connectors" element={
            <ConnectorsView
              connectors={connectors}
              onTestConnector={handleTestConnector}
              onAddConnector={handleAddConnector}
              onUpdateConnectorThrottling={handleUpdateConnectorThrottling}
            />
          } />

          <Route path="/discovery" element={
            <DiscoveryView onProceedToMapping={() => setActiveTab('mapping')} connectors={connectors} />
              } />

          <Route path="/data-dictionary" element={<DataDictionaryView />} />

          <Route path="/mapping" element={
            <MappingStudioView onProceedToValidation={() => setActiveTab('validation')} />
              } />

          <Route path="/schema-comparison" element={
            <SchemaComparisonView connectors={connectors} />
          } />

          <Route path="/schema-registry" element={<SchemaRegistryView />} />

          <Route path="/workflow-designer" element={<MigrationWorkflowDesigner jobs={jobs} setJobs={setJobs} />} />

          <Route path="/lineage" element={<DataLineageView />} />

          <Route path="/dependency-explorer" element={<DataDependencyExplorerView />} />

          <Route path="/data-quality-audit" element={
            <DataQualityAuditView connectors={connectors} />
          } />

          <Route path="/validation" element={
            <ValidationCleansingView onProceedToWizard={() => setActiveTab('wizard')} />
              } />

          <Route path="/data-anonymization" element={<DataAnonymizationView />} />

          <Route path="/export-management" element={<ExportManagementView />} />

          <Route path="/wizard" element={
            <MigrationWizardView
              connectors={connectors}
              jobs={jobs}
              onAddNewJob={handleAddNewJob}
              onRollbackJob={handleRollbackJob}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
              } />

          <Route path="/simulation" element={
            <MigrationSimulationView onCommitFullMigration={() => setActiveTab('wizard')} />
              } />

          <Route path="/migration-replay" element={<MigrationReplayView connectors={connectors} />} />

          <Route path="/error-center" element={<ErrorCenterView />} />
          <Route path="/notifications" element={<NotificationCenterView />} />
          <Route path="/batch-processing" element={<BatchProcessingEngineView />} />
          <Route path="/global-load-balancer" element={<GlobalLoadBalancerView onNavigateTab={setActiveTab} />} />
          <Route path="/load-balancer-audit" element={<LoadBalancerAuditView />} />
          <Route path="/decision-log-explorer" element={<DecisionLogExplorerView />} />
          <Route path="/job-comparison" element={
            <JobComparisonView jobs={jobs} onNavigateTab={(tab) => setActiveTab(tab)} />
              } />
          <Route path="/real-time-sync" element={<RealTimeSyncView />} />
          <Route path="/connector-sdk" element={<ConnectorSdkView />} />
          <Route path="/rest-api-platform" element={<RestApiPlatformView />} />
          <Route path="/partner-portal" element={
            <PartnerPortalView onNavigateTab={(tab) => setActiveTab(tab)} />
              } />
          <Route path="/billing-management" element={
            <BillingManagementView onNavigateTab={(tab) => setActiveTab(tab)} />
              } />
          <Route path="/license-compliance" element={
            <LicenseComplianceView />
          } />
          <Route path="/customer-projects" element={
            <CustomerProjectManagementView onNavigateTab={(tab) => setActiveTab(tab)} />
              } />
          <Route path="/tenant-management" element={
            <TenantManagementView userRole={userRole} />
          } />
          <Route path="/user-management" element={
            <UserRoleManagementView currentUser={currentUser} />
          } />

          <Route path="/ai-assistant" element={<AiAssistantView />} />

          <Route path="/audit" element={<AuditSchedulerView />} />

          <Route path="/audit-reporting" element={<AuditReportingView />} />

          <Route path="/compliance-dashboard" element={<ComplianceDashboardView />} />

          <Route path="/system-health" element={<SystemHealthView />} />

          <Route path="/resource-allocation" element={<ResourceAllocationView jobs={jobs} />} />

          <Route path="/connection-health" element={
            <GlobalConnectionHealthView
              connectors={connectors}
              jobs={jobs}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onTestConnector={handleTestConnector}
              onUpdateConnectorThrottling={handleUpdateConnectorThrottling}
            />
              } />

          <Route path="/settings" element={<SettingsView hasGeminiKey={hasGeminiKey} />} />

          <Route path="/admin-hub" element={<AdministrationHubView onNavigateTab={setActiveTab} />} />

          <Route path="/architecture-plan" element={<EnterpriseArchitecturePlanView />} />

          <Route path="/code-architecture-review" element={<CodeArchitectureReviewView />} />
            
<Route path="*" element={<Navigate to="/dashboard" replace />} />
</Routes>
</Suspense>
              )}
            </ErrorBoundary>
        </main>

        {/* Global Enterprise Footer */}
        <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-4 mt-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">EDIMP Platform v3.4</span>
              <span>•</span>
              <span>Enterprise Data Integration & Migration Platform</span>
            </div>
          </div>
        </footer>
        {/* Global Keyboard Shortcuts Help Modal */}
        <KeyboardShortcutsModal
          isOpen={shortcutsModalOpen}
          onClose={() => setShortcutsModalOpen(false)}
        />

        {/* Global Quick Actions Command Palette Modal (Ctrl+K / Cmd+K) */}
        <GlobalQuickActionModal
          isOpen={quickActionsModalOpen}
          onClose={() => setQuickActionsModalOpen(false)}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            setScreenReaderAnnouncement(`Navigated to ${tab}.`);
          }}
        />

        {/* Enterprise Auth & Identity Manager Modal */}
        <AuthSessionManagerModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          currentUser={currentUser}
          onSelectUser={handleSelectUser}
          onRoleChange={setUserRole}
        />
      </div>
    </div>
    </SessionManager>
  );
}

export default App;

