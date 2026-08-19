import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { MigrationJob } from '../types';
import { OverflowTableWrapper } from './OverflowTableWrapper';
import {
  Clock,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Zap,
  ArrowRight,
  Database,
  Search,
  Filter,
  X,
  ExternalLink,
  RotateCcw,
  Sliders,
  ChevronRight,
  Sparkles,
  Server,
  Info,
  RefreshCw,
  Plus,
  Terminal,
  Flame,
  ShieldCheck,
  Check,
  Edit3,
  Trash2,
  Settings,
  Timer,
  Bell,
  Layers,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MigrationTimelineProps {
  jobs: MigrationJob[];
  onToggleJobStatus?: (jobId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export interface ScheduledJobItem extends MigrationJob {
  scheduledTime?: string;
  timeSlot?: string;
  category: 'Scheduled' | 'Ongoing' | 'Completed' | 'Paused/Failed';
  nextRunSeconds?: number;
  frequency?: 'Daily' | 'Hourly' | 'Weekly' | 'Monthly' | 'Custom Cron';
  autoRetry?: boolean;
  notifyOnFailure?: boolean;
  concurrencyLimit?: number;
  lastExecutionTimestamp?: string;
}

export interface LiveStreamLog {
  id: string;
  timestamp: string;
  jobId: string;
  jobName: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  message: string;
}

// Utility to convert seconds into HH:MM:SS format
const formatCountdown = (seconds?: number): string => {
  if (seconds === undefined || seconds < 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Utility to parse standard cron expressions into human labels
const parseCronLabel = (cron?: string): string => {
  if (!cron) return 'Every day at 12:00 PM';
  if (cron === '0 18 * * *') return 'Every day at 06:00 PM UTC';
  if (cron === '0 22 * * *') return 'Every day at 10:00 PM UTC';
  if (cron === '0 * * * *') return 'Every hour at :00';
  if (cron === '*/15 * * * *') return 'Every 15 minutes';
  if (cron === '0 0 * * 0') return 'Every Sunday at Midnight';
  return `Custom Cron: ${cron}`;
};

export interface RealtimeEntityItem {
  name: string;
  label: string;
  records: string;
  type: string;
}

export const SYSTEM_OPTIONS = [
  { id: 'SAP S/4HANA', name: 'SAP S/4HANA Cloud Engine', category: 'ERP' },
  { id: 'Business Central', name: 'Dynamics 365 Business Central (Prod)', category: 'ERP' },
  { id: 'Salesforce', name: 'Salesforce Enterprise CRM', category: 'CRM' },
  { id: 'SQL Server', name: 'SQL Server - Legacy ERP DB', category: 'Database' },
  { id: 'Dynamics 365 F&O', name: 'Dynamics 365 Finance & Operations', category: 'ERP' },
  { id: 'Customer Master Excel', name: 'Customer Master Excel (.xlsx)', category: 'Files' },
  { id: 'PostgreSQL Staging', name: 'PostgreSQL Staging Warehouse', category: 'Database' },
  { id: 'Legacy HRMS REST API', name: 'Legacy HRMS REST API Endpoint', category: 'Custom API' },
];

export const REALTIME_ENTITIES_MAP: Record<string, RealtimeEntityItem[]> = {
  'SAP S/4HANA': [
    { name: 'ANLA_AssetMaster', label: 'ANLA_AssetMaster (Fixed Assets Master Record)', records: '18,420 rows', type: 'OData v4' },
    { name: 'MARA_Material_Master', label: 'MARA_Material_Master (General Material Data)', records: '45,200 rows', type: 'OData v4' },
    { name: 'BSEG_AccountingDocument', label: 'BSEG_AccountingDocument (Accounting Segment)', records: '120,400 rows', type: 'OData v4' },
    { name: 'KNA1_CustomerMaster', label: 'KNA1_CustomerMaster (Customer General Data)', records: '14,250 rows', type: 'OData v4' },
    { name: 'LFA1_VendorMaster', label: 'LFA1_VendorMaster (Vendor General Data)', records: '9,800 rows', type: 'OData v4' },
    { name: 'GL_Transactions', label: 'GL_Transactions (General Ledger Line Items)', records: '310,500 rows', type: 'OData v4' },
    { name: 'VBAK_SalesHeader', label: 'VBAK_SalesHeader (Sales Order Header)', records: '28,400 rows', type: 'OData v4' },
    { name: 'VBAP_SalesItem', label: 'VBAP_SalesItem (Sales Order Item Details)', records: '89,100 rows', type: 'OData v4' },
  ],
  'Business Central': [
    { name: 'FA_FixedAsset', label: 'FA_FixedAsset (Fixed Assets v2.0 API)', records: '12,500 rows', type: 'REST API' },
    { name: 'Customer', label: 'Customer (Business Central Customers API v2.0)', records: '8,420 rows', type: 'REST API' },
    { name: 'Vendor', label: 'Vendor (Business Central Vendors API v2.0)', records: '6,150 rows', type: 'REST API' },
    { name: 'SalesHeader', label: 'SalesHeader (Sales Invoice & Order Headers)', records: '19,800 rows', type: 'REST API' },
    { name: 'SalesLine', label: 'SalesLine (Sales Invoice & Order Lines)', records: '64,200 rows', type: 'REST API' },
    { name: 'GL_Entry', label: 'GL_Entry (General Ledger Entries)', records: '280,000 rows', type: 'REST API' },
    { name: 'ItemMaster', label: 'ItemMaster (Inventory Items Catalog)', records: '31,200 rows', type: 'REST API' },
    { name: 'GeneralJournalLine', label: 'GeneralJournalLine (GL Journal Lines)', records: '4,500 rows', type: 'REST API' },
  ],
  'Salesforce': [
    { name: 'Account', label: 'Account (Salesforce Business Accounts)', records: '22,100 rows', type: 'sObject' },
    { name: 'Contact', label: 'Contact (Customer Contact Directory)', records: '48,900 rows', type: 'sObject' },
    { name: 'Opportunity', label: 'Opportunity (Sales Pipeline Deals)', records: '15,400 rows', type: 'sObject' },
    { name: 'Lead', label: 'Lead (Prospect Inbound Leads)', records: '38,200 rows', type: 'sObject' },
    { name: 'Case', label: 'Case (Customer Support Tickets)', records: '12,000 rows', type: 'sObject' },
  ],
  'SQL Server': [
    { name: 'dbo.tbl_CustomerMaster', label: 'dbo.tbl_CustomerMaster (Customer Records)', records: '14,250 rows', type: 'SQL Table' },
    { name: 'dbo.tbl_GL_Ledger_Archive', label: 'dbo.tbl_GL_Ledger_Archive (Historical Ledger)', records: '520,000 rows', type: 'SQL Table' },
    { name: 'dbo.tbl_SalesOrder_Header', label: 'dbo.tbl_SalesOrder_Header (Sales Orders)', records: '34,100 rows', type: 'SQL Table' },
    { name: 'dbo.tbl_SalesOrder_Detail', label: 'dbo.tbl_SalesOrder_Detail (Line Items)', records: '112,000 rows', type: 'SQL Table' },
  ],
  'Dynamics 365 F&O': [
    { name: 'CustCustomerV3Entity', label: 'CustCustomerV3Entity (Customers V3)', records: '16,500 rows', type: 'OData Entity' },
    { name: 'VendVendorV2Entity', label: 'VendVendorV2Entity (Vendors V2)', records: '8,900 rows', type: 'OData Entity' },
    { name: 'SalesOrderHeaderCDSEntity', label: 'SalesOrderHeaderCDSEntity (Sales Orders)', records: '41,200 rows', type: 'OData Entity' },
    { name: 'AssetFixedAssetEntity', label: 'AssetFixedAssetEntity (Fixed Assets V2)', records: '14,100 rows', type: 'OData Entity' },
  ],
  'Customer Master Excel': [
    { name: 'Sheet1_Customer_Master', label: 'Sheet1_Customer_Master (Primary Sheet)', records: '14,250 rows', type: 'Worksheet' },
    { name: 'Sheet2_Addresses', label: 'Sheet2_Addresses (Addresses Sheet)', records: '14,250 rows', type: 'Worksheet' },
    { name: 'Sheet3_CreditLimits', label: 'Sheet3_CreditLimits (Credit Limits)', records: '14,250 rows', type: 'Worksheet' },
  ],
  'PostgreSQL Staging': [
    { name: 'public.stg_customers_raw', label: 'public.stg_customers_raw (Raw Customers)', records: '14,250 rows', type: 'PG Table' },
    { name: 'public.stg_financial_journal', label: 'public.stg_financial_journal (Financial Journal)', records: '180,000 rows', type: 'PG Table' },
    { name: 'public.stg_products_catalog', label: 'public.stg_products_catalog (Products Catalog)', records: '24,000 rows', type: 'PG Table' },
  ],
  'Legacy HRMS REST API': [
    { name: 'employees_v1', label: 'employees_v1 (Employee Resource)', records: '3,400 rows', type: 'REST API' },
    { name: 'payroll_runs', label: 'payroll_runs (Payroll Run History)', records: '850 rows', type: 'REST API' },
  ],
};

export const MigrationTimeline: React.FC<MigrationTimelineProps> = ({
  jobs,
  onToggleJobStatus,
  onNavigateTab,
}) => {
  // Local dynamic job state initialized with props + standard enterprise scheduled jobs
  const [timelineJobs, setTimelineJobs] = useState<ScheduledJobItem[]>(() => {
    const list: ScheduledJobItem[] = jobs.map((j) => {
      let category: ScheduledJobItem['category'] = 'Ongoing';
      if (j.status === 'Running') category = 'Ongoing';
      else if (j.status === 'Completed') category = 'Completed';
      else if (j.status === 'Idle') category = 'Scheduled';
      else category = 'Paused/Failed';

      return {
        ...j,
        category,
        scheduledTime: j.cronSchedule ? `Cron: ${j.cronSchedule}` : j.startTime || '12:00 PM',
        timeSlot: j.status === 'Completed' ? '08:00 AM - 08:30 AM' : j.status === 'Running' ? '09:00 AM - Present' : '02:00 PM - Scheduled',
        nextRunSeconds: category === 'Scheduled' ? Math.floor(Math.random() * 7200) + 1800 : undefined,
        frequency: 'Daily',
        autoRetry: true,
        notifyOnFailure: true,
        concurrencyLimit: 4,
      };
    });

    // Ensure baseline scheduled jobs exist
    const hasFinancialSync = list.some((j) => j.id === 'job-sched-1' || j.jobName.includes('Financial Ledger'));
    if (!hasFinancialSync) {
      list.push({
        id: 'job-sched-1',
        jobName: 'Financial Ledger Month-End Audit Sync',
        sourceConnectorId: 'conn-sap-s4',
        sourceConnectorName: 'SAP S/4HANA',
        sourceEntity: 'ACDOCA_Ledger',
        destConnectorId: 'conn-bc-prod',
        destConnectorName: 'Business Central',
        destEntity: 'GL_Entry',
        mode: 'Incremental',
        status: 'Idle',
        progressPct: 0,
        totalRecords: 125000,
        processedRecords: 0,
        errorCount: 0,
        warningCount: 0,
        throughputRps: 0,
        cronSchedule: '0 18 * * *',
        startTime: '2026-08-06 18:00:00',
        scheduledTime: 'Today 06:00 PM',
        timeSlot: '06:00 PM - Scheduled',
        category: 'Scheduled',
        nextRunSeconds: 3240, // ~54 minutes remaining
        frequency: 'Daily',
        autoRetry: true,
        notifyOnFailure: true,
        concurrencyLimit: 8,
      });
    }

    const hasPayrollSync = list.some((j) => j.id === 'job-sched-2' || j.jobName.includes('Payroll & Employee'));
    if (!hasPayrollSync) {
      list.push({
        id: 'job-sched-2',
        jobName: 'Payroll & Employee Master Batch Import',
        sourceConnectorId: 'conn-custom-rest',
        sourceConnectorName: 'Legacy HRMS API',
        sourceEntity: 'Employees',
        destConnectorId: 'conn-d365-fo',
        destConnectorName: 'Dynamics 365 F&O',
        destEntity: 'HcmWorkerEntity',
        mode: 'Full',
        status: 'Idle',
        progressPct: 0,
        totalRecords: 8500,
        processedRecords: 0,
        errorCount: 0,
        warningCount: 0,
        throughputRps: 0,
        cronSchedule: '0 22 * * *',
        startTime: '2026-08-06 22:00:00',
        scheduledTime: 'Today 10:00 PM',
        timeSlot: '10:00 PM - Scheduled',
        category: 'Scheduled',
        nextRunSeconds: 12600, // ~3.5 hours remaining
        frequency: 'Daily',
        autoRetry: true,
        notifyOnFailure: true,
        concurrencyLimit: 4,
      });
    }

    return list;
  });

  // UI state variables
  const [selectedJob, setSelectedJob] = useState<ScheduledJobItem | null>(null);
  const [rescheduleJobTarget, setRescheduleJobTarget] = useState<ScheduledJobItem | null>(null);
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Scheduled' | 'Ongoing' | 'Completed' | 'Paused'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeHorizon, setTimeHorizon] = useState<'24h' | 'shift' | '7d'>('24h');
  const [isAutoSchedulerEnabled, setIsAutoSchedulerEnabled] = useState<boolean>(true);
  const [isLiveLogConsoleOpen, setIsLiveLogConsoleOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);

  // Real-time system clock state (updates every second)
  const [currentClock, setCurrentClock] = useState<Date>(new Date());

  const formattedCurrentTime = useMemo(() => {
    return currentClock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  }, [currentClock]);

  const formattedCurrentTimeShort = useMemo(() => {
    return currentClock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }, [currentClock]);

  const formattedCurrentDate = useMemo(() => {
    return currentClock.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }, [currentClock]);

  const currentDecimalHour = useMemo(() => {
    return currentClock.getHours() + currentClock.getMinutes() / 60 + currentClock.getSeconds() / 3600;
  }, [currentClock]);

  const currentTimePercent = useMemo(() => {
    return Math.min(Math.max((currentDecimalHour / 24) * 100, 2), 98);
  }, [currentDecimalHour]);

  // Real-time connector & entity fetching state for schedule modal
  const [selectedSourceSystem, setSelectedSourceSystem] = useState<string>('SAP S/4HANA');
  const [selectedSourceEntity, setSelectedSourceEntity] = useState<string>('ANLA_AssetMaster');
  const [isFetchingSourceEntities, setIsFetchingSourceEntities] = useState<boolean>(false);
  const [sourceCustomMode, setSourceCustomMode] = useState<boolean>(false);

  const [selectedDestSystem, setSelectedDestSystem] = useState<string>('Business Central');
  const [selectedDestEntity, setSelectedDestEntity] = useState<string>('FA_FixedAsset');
  const [isFetchingDestEntities, setIsFetchingDestEntities] = useState<boolean>(false);
  const [destCustomMode, setDestCustomMode] = useState<boolean>(false);

  // Scroll detection state & ref for Modal 2 (Schedule New Pipeline)
  const scheduleFormScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollModalDown, setCanScrollModalDown] = useState<boolean>(true);
  const [canScrollModalUp, setCanScrollModalUp] = useState<boolean>(false);

  const updateScheduleModalScrollState = () => {
    if (!scheduleFormScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scheduleFormScrollRef.current;
    const maxScroll = scrollHeight - clientHeight;
    setCanScrollModalDown(maxScroll > 10 && scrollTop < maxScroll - 15);
    setCanScrollModalUp(scrollTop > 15);
  };

  useEffect(() => {
    if (isNewScheduleModalOpen) {
      const timer = setTimeout(() => {
        updateScheduleModalScrollState();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isNewScheduleModalOpen, selectedSourceSystem, selectedDestSystem]);

  const handleScrollModalDown = () => {
    if (scheduleFormScrollRef.current) {
      scheduleFormScrollRef.current.scrollBy({ top: 240, behavior: 'smooth' });
      setTimeout(updateScheduleModalScrollState, 300);
    }
  };

  const handleScrollModalToBottom = () => {
    if (scheduleFormScrollRef.current) {
      scheduleFormScrollRef.current.scrollTo({
        top: scheduleFormScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setTimeout(updateScheduleModalScrollState, 300);
    }
  };

  const handleScrollModalToTop = () => {
    if (scheduleFormScrollRef.current) {
      scheduleFormScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(updateScheduleModalScrollState, 300);
    }
  };

  const getSourceEntitiesList = (sysName: string = selectedSourceSystem): RealtimeEntityItem[] => {
    return REALTIME_ENTITIES_MAP[sysName] || REALTIME_ENTITIES_MAP['SAP S/4HANA'];
  };

  const getDestEntitiesList = (sysName: string = selectedDestSystem): RealtimeEntityItem[] => {
    return REALTIME_ENTITIES_MAP[sysName] || REALTIME_ENTITIES_MAP['Business Central'];
  };

  const triggerSourceEntityFetch = (sysName: string) => {
    setIsFetchingSourceEntities(true);
    setTimeout(() => {
      setIsFetchingSourceEntities(false);
      const list = REALTIME_ENTITIES_MAP[sysName] || REALTIME_ENTITIES_MAP['SAP S/4HANA'];
      if (list && list.length > 0) {
        setSelectedSourceEntity(list[0].name);
      }
    }, 380);
  };

  const triggerDestEntityFetch = (sysName: string) => {
    setIsFetchingDestEntities(true);
    setTimeout(() => {
      setIsFetchingDestEntities(false);
      const list = REALTIME_ENTITIES_MAP[sysName] || REALTIME_ENTITIES_MAP['Business Central'];
      if (list && list.length > 0) {
        setSelectedDestEntity(list[0].name);
      }
    }, 380);
  };

  const handleSourceSystemChange = (sysName: string) => {
    setSelectedSourceSystem(sysName);
    setSourceCustomMode(false);
    triggerSourceEntityFetch(sysName);
  };

  const handleDestSystemChange = (sysName: string) => {
    setSelectedDestSystem(sysName);
    setDestCustomMode(false);
    triggerDestEntityFetch(sysName);
  };

  const handleManualRefreshSourceSchema = () => {
    setIsFetchingSourceEntities(true);
    setTimeout(() => {
      setIsFetchingSourceEntities(false);
      showToast(`Refreshed live metadata schema for ${selectedSourceSystem}!`, 'info');
    }, 450);
  };

  const handleManualRefreshDestSchema = () => {
    setIsFetchingDestEntities(true);
    setTimeout(() => {
      setIsFetchingDestEntities(false);
      showToast(`Refreshed live metadata schema for ${selectedDestSystem}!`, 'info');
    }, 450);
  };

  // Live execution logs terminal state
  const [liveLogs, setLiveLogs] = useState<LiveStreamLog[]>([
    {
      id: 'log-0',
      timestamp: new Date().toLocaleTimeString(),
      jobId: 'system',
      jobName: 'Scheduler Daemon',
      level: 'INFO',
      message: 'Real-time Migration Scheduler Service active. Polling cron intervals...',
    },
  ]);

  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const addLog = (jobId: string, jobName: string, level: LiveStreamLog['level'], message: string) => {
    const newLog: LiveStreamLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      jobId,
      jobName,
      level,
      message,
    };
    setLiveLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // 1. REAL-TIME COUNTDOWN TICKER & CLOCK REFRESH (Runs every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClock(new Date());

      setTimelineJobs((prevJobs) =>
        prevJobs.map((job) => {
          if (job.category !== 'Scheduled' || job.status !== 'Idle' || job.nextRunSeconds === undefined) {
            return job;
          }

          const newSeconds = job.nextRunSeconds - 1;

          // Check if trigger time reached
          if (newSeconds <= 0) {
            if (isAutoSchedulerEnabled) {
              addLog(
                job.id,
                job.jobName,
                'SUCCESS',
                `⏰ Cron schedule trigger activated! Starting job "${job.jobName}" automatically.`
              );
              showToast(`⚡ Auto-Scheduler triggered "${job.jobName}"!`, 'success');

              return {
                ...job,
                status: 'Running',
                category: 'Ongoing',
                nextRunSeconds: undefined,
                progressPct: 2,
                processedRecords: Math.floor(job.totalRecords * 0.02),
                throughputRps: 120,
                timeSlot: 'Running Now',
                lastExecutionTimestamp: new Date().toLocaleTimeString(),
              };
            } else {
              // Reset countdown if auto-scheduler paused
              return {
                ...job,
                nextRunSeconds: 60,
              };
            }
          }

          return {
            ...job,
            nextRunSeconds: newSeconds,
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoSchedulerEnabled]);

  // 2. REAL-TIME JOB PROGRESS ANIMATION ENGINE (Runs every 2 seconds for Running jobs)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimelineJobs((prevJobs) =>
        prevJobs.map((job) => {
          if (job.status !== 'Running') return job;

          const batchSize = Math.floor(Math.random() * 400) + 150;
          const nextProcessed = Math.min(job.totalRecords, job.processedRecords + batchSize);
          const nextPct = Math.round((nextProcessed / job.totalRecords) * 100);
          const currentRps = Math.floor(Math.random() * 80) + 110;

          // Add a periodic log line
          if (Math.random() > 0.5) {
            addLog(
              job.id,
              job.jobName,
              'INFO',
              `Processing batch: ${nextProcessed.toLocaleString()} / ${job.totalRecords.toLocaleString()} rows (${nextPct}%) @ ${currentRps} rps`
            );
          }

          const isDone = nextProcessed >= job.totalRecords;
          if (isDone) {
            addLog(
              job.id,
              job.jobName,
              'SUCCESS',
              `✅ Migration job "${job.jobName}" completed successfully! Rescheduling next cron run.`
            );
            showToast(`🎉 Job "${job.jobName}" completed successfully!`, 'success');

            return {
              ...job,
              status: 'Completed',
              category: 'Completed',
              progressPct: 100,
              processedRecords: job.totalRecords,
              throughputRps: 0,
              endTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
              nextRunSeconds: 86400, // Schedule for tomorrow
            };
          }

          return {
            ...job,
            processedRecords: nextProcessed,
            progressPct: nextPct,
            throughputRps: currentRps,
          };
        })
      );
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  // Filtered jobs pool
  const filteredJobs = useMemo(() => {
    return timelineJobs.filter((job) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        job.jobName.toLowerCase().includes(q) ||
        job.sourceConnectorName.toLowerCase().includes(q) ||
        job.destConnectorName.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'Scheduled') return job.category === 'Scheduled';
      if (statusFilter === 'Ongoing') return job.category === 'Ongoing';
      if (statusFilter === 'Completed') return job.category === 'Completed';
      if (statusFilter === 'Paused') return job.category === 'Paused/Failed';
      // Default 'All' view now excludes completed jobs to focus on active pipelines
      return job.category !== 'Completed';
    });
  }, [timelineJobs, searchQuery, statusFilter]);

  // Metric counts
  const scheduledCount = timelineJobs.filter((j) => j.category === 'Scheduled').length;
  const ongoingCount = timelineJobs.filter((j) => j.category === 'Ongoing').length;
  const completedCount = timelineJobs.filter((j) => j.category === 'Completed').length;
  const pausedCount = timelineJobs.filter((j) => j.category === 'Paused/Failed').length;
  const activePipelinesCount = timelineJobs.filter((j) => j.category !== 'Completed').length;

  // ACTION: Trigger Immediate Run
  const handleRunNow = (jobId: string) => {
    setTimelineJobs((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          addLog(
            job.id,
            job.jobName,
            'SUCCESS',
            `⚡ Manual override: Execution started immediately for "${job.jobName}".`
          );
          showToast(`⚡ Started immediate execution for "${job.jobName}"!`, 'success');
          if (onToggleJobStatus && job.status !== 'Running') {
            onToggleJobStatus(job.id);
          }
          return {
            ...job,
            status: 'Running',
            category: 'Ongoing',
            progressPct: Math.max(job.progressPct, 1),
            processedRecords: job.processedRecords === job.totalRecords ? 0 : job.processedRecords,
            throughputRps: 180,
            timeSlot: 'Running Now',
            nextRunSeconds: undefined,
            lastExecutionTimestamp: new Date().toLocaleTimeString(),
          };
        }
        return job;
      })
    );
  };

  // ACTION: Pause / Resume Scheduled Job
  const handleToggleSchedulePause = (jobId: string) => {
    setTimelineJobs((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          const isCurrentlyPaused = job.status === 'Paused';
          const newStatus = isCurrentlyPaused ? 'Idle' : 'Paused';
          const newCategory = isCurrentlyPaused ? 'Scheduled' : 'Paused/Failed';
          addLog(
            job.id,
            job.jobName,
            isCurrentlyPaused ? 'INFO' : 'WARN',
            `Schedule status changed for "${job.jobName}": ${newStatus}`
          );
          showToast(`Schedule ${isCurrentlyPaused ? 'Resumed' : 'Paused'} for "${job.jobName}"`, 'info');
          return {
            ...job,
            status: newStatus,
            category: newCategory,
            nextRunSeconds: isCurrentlyPaused ? 3600 : undefined,
          };
        }
        return job;
      })
    );
  };

  // ACTION: Quick Postpone Schedule by 1 Hour
  const handlePostponeSchedule = (jobId: string) => {
    setTimelineJobs((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          const currentNext = job.nextRunSeconds || 0;
          const updatedNext = currentNext + 3600;
          addLog(
            job.id,
            job.jobName,
            'INFO',
            `Postponed execution by +1 hour for "${job.jobName}". Next run in ${formatCountdown(updatedNext)}`
          );
          showToast(`Postponed "${job.jobName}" by +1 hour`, 'info');
          return {
            ...job,
            nextRunSeconds: updatedNext,
            scheduledTime: `Postponed (+1h)`,
          };
        }
        return job;
      })
    );
  };

  // ACTION: Fast Forward to Next Scheduled Job
  const handleFastForwardNextJob = () => {
    const nextScheduled = timelineJobs
      .filter((j) => j.category === 'Scheduled' && j.status === 'Idle' && j.nextRunSeconds !== undefined)
      .sort((a, b) => (a.nextRunSeconds || 0) - (b.nextRunSeconds || 0))[0];

    if (!nextScheduled) {
      showToast('No pending scheduled jobs to trigger.', 'warn');
      return;
    }

    handleRunNow(nextScheduled.id);
  };

  // ACTION: Save Rescheduled Parameters
  const handleSaveReschedule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rescheduleJobTarget) return;

    const formData = new FormData(e.currentTarget);
    const cron = formData.get('cronSchedule') as string;
    const freq = formData.get('frequency') as ScheduledJobItem['frequency'];
    const mode = formData.get('mode') as MigrationJob['mode'];
    const timeSlotStr = formData.get('timeSlot') as string;
    const concurrency = parseInt((formData.get('concurrencyLimit') as string) || '4', 10);

    setTimelineJobs((prev) =>
      prev.map((j) => {
        if (j.id === rescheduleJobTarget.id) {
          addLog(
            j.id,
            j.jobName,
            'SUCCESS',
            `Updated schedule parameters: Cron = "${cron}", Frequency = ${freq}, Mode = ${mode}`
          );
          showToast(`Updated schedule configuration for "${j.jobName}"`, 'success');
          return {
            ...j,
            cronSchedule: cron,
            frequency: freq,
            mode,
            timeSlot: timeSlotStr,
            scheduledTime: parseCronLabel(cron),
            concurrencyLimit: concurrency,
            nextRunSeconds: 3600, // reset timer
            status: 'Idle',
            category: 'Scheduled',
          };
        }
        return j;
      })
    );

    setRescheduleJobTarget(null);
  };

  // ACTION: Create New Scheduled Migration Pipeline
  const handleCreateNewSchedule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const jobName = (formData.get('jobName') as string) || 'Custom Migration Pipeline';
    const sourceName = (formData.get('sourceConnectorName') as string) || selectedSourceSystem || 'SAP S/4HANA';
    const sourceEntity = (formData.get('sourceEntity') as string) || selectedSourceEntity || 'ANLA_AssetMaster';
    const destName = (formData.get('destConnectorName') as string) || selectedDestSystem || 'Business Central';
    const destEntity = (formData.get('destEntity') as string) || selectedDestEntity || 'FA_FixedAsset';
    const cron = (formData.get('cronSchedule') as string) || '0 18 * * *';
    const mode = ((formData.get('mode') as string) || 'Incremental') as MigrationJob['mode'];

    const newJob: ScheduledJobItem = {
      id: `job-sched-${Date.now()}`,
      jobName,
      sourceConnectorId: `conn-src-${Date.now()}`,
      sourceConnectorName: sourceName,
      sourceEntity,
      destConnectorId: `conn-dest-${Date.now()}`,
      destConnectorName: destName,
      destEntity,
      mode,
      status: 'Idle',
      category: 'Scheduled',
      progressPct: 0,
      totalRecords: 50000,
      processedRecords: 0,
      errorCount: 0,
      warningCount: 0,
      throughputRps: 0,
      cronSchedule: cron,
      scheduledTime: parseCronLabel(cron),
      timeSlot: '18:00 UTC - Scheduled',
      nextRunSeconds: 1800,
      frequency: 'Daily',
      autoRetry: true,
      notifyOnFailure: true,
      concurrencyLimit: 4,
    };

    setTimelineJobs((prev) => [newJob, ...prev]);
    addLog(newJob.id, newJob.jobName, 'SUCCESS', `Created new scheduled migration pipeline "${jobName}".`);
    showToast(`Scheduled new migration pipeline "${jobName}"!`, 'success');
    setIsNewScheduleModalOpen(false);
  };

  // ACTION: Delete Scheduled Job
  const handleDeleteJob = (jobId: string) => {
    setTimelineJobs((prev) => prev.filter((j) => j.id !== jobId));
    showToast('Scheduled migration pipeline removed.', 'info');
    if (selectedJob?.id === jobId) setSelectedJob(null);
  };

  // Helper to render status badge
  const renderStatusBadge = (status: MigrationJob['status'], category?: ScheduledJobItem['category']) => {
    if (status === 'Running' || category === 'Ongoing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
          Ongoing / Executing
        </span>
      );
    }
    if (status === 'Completed' || category === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Completed
        </span>
      );
    }
    if (status === 'Idle' || category === 'Scheduled') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Scheduled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <Pause className="w-3.5 h-3.5 text-slate-500" />
        Paused
      </span>
    );
  };

  // Position along 24h axis for visualization relative to real current time
  const getTimelinePosition = (job: ScheduledJobItem, index: number) => {
    if (job.status === 'Running') {
      const offset = (index - 0.5) * 5;
      return Math.min(Math.max(currentTimePercent + offset, 4), 92);
    }
    if (job.status === 'Completed' || job.category === 'Completed') {
      const pos = Math.max(4, currentTimePercent - 18 - index * 10);
      return Math.min(pos, 85);
    }
    if (job.category === 'Scheduled') {
      const pos = Math.min(94, currentTimePercent + 12 + index * 9);
      return Math.max(pos, 8);
    }
    return Math.min(Math.max(currentTimePercent + (index % 2 === 0 ? -15 : 15), 5), 90);
  };

  return (
    <div id="migration-interactive-timeline-root" className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Calendar className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Real-Time Scheduled Migration Pipeline & Cron Manager
              </h2>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Real-Time Scheduler Engine Active
              </span>
              <span className="text-[11px] font-mono bg-slate-900 text-emerald-400 px-3 py-0.5 rounded-full border border-slate-800 font-extrabold flex items-center gap-1.5 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>System Real-Time: <strong className="text-white">{formattedCurrentTime}</strong> <span className="text-slate-400">({formattedCurrentDate})</span></span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Automated real-time cron scheduler, trigger engine, countdown timers, and live data migration timeline controls.
            </p>
          </div>

          {/* Quick Real-Time Action Header Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-Scheduler Daemon Toggle */}
            <button
              onClick={() => {
                const nextState = !isAutoSchedulerEnabled;
                setIsAutoSchedulerEnabled(nextState);
                showToast(`Auto-Scheduler Daemon ${nextState ? 'Enabled' : 'Paused'}`, 'info');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                isAutoSchedulerEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title="Toggle automatic cron execution engine daemon"
            >
              <Timer className={`w-3.5 h-3.5 ${isAutoSchedulerEnabled ? 'text-emerald-600 animate-spin' : 'text-slate-400'}`} />
              <span>Daemon: {isAutoSchedulerEnabled ? 'ACTIVE' : 'PAUSED'}</span>
            </button>

            {/* Fast Forward / Run Next Scheduled Job */}
            <button
              onClick={handleFastForwardNextJob}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Trigger the next upcoming scheduled job immediately"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Run Next Scheduled Job</span>
            </button>

            {/* Schedule New Migration Pipeline */}
            <button
              onClick={() => setIsNewScheduleModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Migration</span>
            </button>

            {/* Toggle Live Log Terminal */}
            <button
              onClick={() => setIsLiveLogConsoleOpen(!isLiveLogConsoleOpen)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isLiveLogConsoleOpen ? 'bg-slate-900 text-emerald-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title="Toggle real-time streaming execution log console"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Metric Summary Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'All'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Active Pipelines</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-700/20 text-[10px]">{activePipelinesCount}</span>
            </button>

            <button
              onClick={() => setStatusFilter('Scheduled')}
              className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Scheduled'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Scheduled</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-200/60 text-[10px] font-mono">{scheduledCount}</span>
            </button>

            <button
              onClick={() => setStatusFilter('Ongoing')}
              className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Ongoing'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>Ongoing</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-200/50 text-[10px] font-mono">{ongoingCount}</span>
            </button>

            <button
              onClick={() => setStatusFilter('Completed')}
              className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Completed'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/70'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-200/50 text-[10px] font-mono">{completedCount}</span>
            </button>

            {pausedCount > 0 && (
              <button
                onClick={() => setStatusFilter('Paused')}
                className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'Paused'
                    ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Paused</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-300 text-[10px] font-mono">{pausedCount}</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scheduled pipelines..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Horizontal Timeline & Scheduled Job Swimlanes */}
      <OverflowTableWrapper hintLabel="Scroll horizontally to inspect job scheduling swimlanes and timeline windows" containerClassName="p-5 space-y-6">
        {/* Horizontal Visual Time Axis Header */}
        <div className="min-w-[750px] relative">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 text-[11px] font-mono font-bold text-slate-400 tracking-wider">
            <span>00:00 AM</span>
            <span>04:00 AM</span>
            <span>08:00 AM</span>
            <span>12:00 PM</span>
            <span>04:00 PM</span>
            <span>08:00 PM</span>
            <span>24:00 PM</span>
          </div>

          {/* Dynamic Real-Time Current Time Marker Line & Floating Pulse Badge */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center transition-all duration-1000 ease-linear"
            style={{ left: `${currentTimePercent}%` }}
          >
            <div className="-mt-3.5 px-2.5 py-1 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-extrabold shadow-lg flex items-center gap-1.5 whitespace-nowrap border border-indigo-300 ring-2 ring-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>CURRENT TIME ({formattedCurrentTimeShort})</span>
            </div>
            <div className="w-0.5 h-full bg-gradient-to-b from-indigo-600 via-indigo-500 to-indigo-400/20 shadow-xs" />
          </div>

          {/* Time Marker Vertical Rules / Grid Lines */}
          <div className="absolute inset-0 top-6 pointer-events-none grid grid-cols-6 h-full opacity-25 border-l border-slate-200">
            <div className="border-r border-dashed border-slate-300"></div>
            <div className="border-r border-dashed border-slate-300"></div>
            <div className="border-r border-dashed border-slate-300"></div>
            <div className="border-r border-dashed border-slate-300"></div>
            <div className="border-r border-dashed border-slate-300"></div>
            <div className="border-r border-dashed border-slate-300"></div>
          </div>

          {/* Interactive Scheduled Job Swimlanes */}
          <div className="mt-4 space-y-3 min-w-[750px]">
            {filteredJobs.length === 0 ? (
              <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No migration pipelines match the selected filters</p>
                <p className="text-[11px] text-slate-400 mt-1">Try switching status filter tabs or clearing search query.</p>
              </div>
            ) : (
              filteredJobs.map((job, idx) => {
                const pos = getTimelinePosition(job, idx);
                const isSelected = selectedJob?.id === job.id;
                const isScheduled = job.category === 'Scheduled';

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20 shadow-md'
                        : isScheduled
                        ? 'bg-amber-50/20 hover:bg-amber-50/50 border-amber-200/80 hover:border-amber-300 hover:shadow-2xs'
                        : 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    {/* Left Connector Architecture info */}
                    <div className="flex items-center gap-3 min-w-[280px] max-w-[340px] shrink-0">
                      <div className={`p-2.5 rounded-xl ${isScheduled ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'} group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors`}>
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {job.jobName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                          <span className="font-semibold text-slate-700">{job.sourceConnectorName}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-700">{job.destConnectorName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                          <span>Source: {job.sourceEntity}</span>
                          <span>➔</span>
                          <span>Target: {job.destEntity}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Interactive Track with Live Countdown or Progress */}
                    <div className="flex-1 relative h-9 bg-slate-100/80 rounded-xl border border-slate-200 overflow-hidden flex items-center px-2">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/30 via-indigo-50/30 to-amber-50/30 opacity-60"></div>

                      <div
                        style={{ left: `${pos}%` }}
                        className={`absolute px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-2 shadow-xs transition-transform group-hover:scale-102 ${
                          job.status === 'Running'
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-indigo-400 ring-2 ring-indigo-500/30 animate-pulse'
                            : job.status === 'Completed'
                            ? 'bg-emerald-600 text-white border border-emerald-400'
                            : isScheduled
                            ? 'bg-amber-500 text-slate-950 border border-amber-300 font-extrabold'
                            : 'bg-slate-700 text-white border border-slate-600'
                        }`}
                      >
                        {job.status === 'Running' && <Zap className="w-3.5 h-3.5 text-amber-300 fill-current animate-bounce" />}
                        {job.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        {isScheduled && <Clock className="w-3.5 h-3.5 text-slate-950" />}

                        <span className="font-mono text-[11px]">
                          {job.status === 'Running' ? (
                            `${job.progressPct}% (${job.processedRecords.toLocaleString()} rows)`
                          ) : job.status === 'Completed' ? (
                            'Done (100%)'
                          ) : (
                            <span className="flex items-center gap-1">
                              <span>Next Trigger in:</span>
                              <strong className="underline decoration-slate-950">{formatCountdown(job.nextRunSeconds)}</strong>
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Right Real-Time Scheduling Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                      {/* DIRECT REAL-TIME "RUN NOW" BUTTON */}
                      {isScheduled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRunNow(job.id);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer transform hover:scale-105"
                          title="Execute this scheduled migration immediately in real time"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
                          <span>Run Now</span>
                        </button>
                      )}

                      {/* RESCHEDULE BUTTON */}
                      {isScheduled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRescheduleJobTarget(job);
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          title="Configure real-time schedule & cron parameters"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="hidden sm:inline">Reschedule</span>
                        </button>
                      )}

                      {/* POSTPONE +1H BUTTON */}
                      {isScheduled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePostponeSchedule(job.id);
                          }}
                          className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          title="Delay scheduled execution by +1 hour"
                        >
                          +1h
                        </button>
                      )}

                      {/* PAUSE / RESUME SCHEDULE */}
                      {isScheduled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSchedulePause(job.id);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                          title={job.status === 'Paused' ? 'Resume Schedule' : 'Pause Schedule'}
                        >
                          {job.status === 'Paused' ? <Play className="w-3.5 h-3.5 text-indigo-600" /> : <Pause className="w-3.5 h-3.5 text-slate-600" />}
                        </button>
                      )}

                      {renderStatusBadge(job.status, job.category)}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJob(job);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Inspect Job Telemetry & Real-Time Logs"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </OverflowTableWrapper>

      {/* REAL-TIME LIVE STREAMING LOG TERMINAL CONSOLE */}
      {isLiveLogConsoleOpen && (
        <div className="bg-slate-950 border-t border-slate-800 text-slate-200 p-4 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-white">
                Real-Time Scheduler Daemon Execution Stream
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono border border-emerald-800/80">
                LIVE LOGS ({liveLogs.length})
              </span>
            </div>
            <button
              onClick={() => setIsLiveLogConsoleOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-40 overflow-y-auto font-mono text-[11px] space-y-1.5 p-2 bg-slate-900 rounded-xl border border-slate-800/80">
            {liveLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                <span
                  className={`font-bold px-1.5 rounded text-[10px] shrink-0 ${
                    log.level === 'SUCCESS'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : log.level === 'WARN'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : log.level === 'ERROR'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-slate-300 font-bold shrink-0">[{log.jobName}]:</span>
                <span className="text-slate-200">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info Legend */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            Timeline Legend:
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Scheduled (Countdown Active)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Ongoing Executing
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            Completed
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Real-time auto-trigger daemon runs live. Click &quot;Run Now&quot; to execute scheduled migrations immediately.
        </div>
      </div>

      {/* MODAL 1: RESCHEDULE & CRON CONFIGURATOR */}
      {rescheduleJobTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-sm tracking-tight">
                  Reschedule Migration: {rescheduleJobTarget.jobName}
                </h3>
              </div>
              <button
                onClick={() => setRescheduleJobTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Execution Frequency</label>
                <select
                  name="frequency"
                  defaultValue={rescheduleJobTarget.frequency || 'Daily'}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  <option value="Daily">Daily (Recurring Batch)</option>
                  <option value="Hourly">Hourly Delta Sync</option>
                  <option value="Weekly">Weekly Full Audit</option>
                  <option value="Monthly">Monthly Reconciliation</option>
                  <option value="Custom Cron">Custom Cron Expression</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cron Expression (UTC)</label>
                <input
                  type="text"
                  name="cronSchedule"
                  defaultValue={rescheduleJobTarget.cronSchedule || '0 18 * * *'}
                  placeholder="e.g. 0 18 * * * or */15 * * * *"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Format: `Minute Hour Day Month DayOfWeek`.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Migration Mode</label>
                  <select
                    name="mode"
                    defaultValue={rescheduleJobTarget.mode}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="Incremental">Incremental Sync</option>
                    <option value="Full">Full Data Load</option>
                    <option value="Delta">Delta Stream</option>
                    <option value="RealTime">RealTime Stream</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Slot Window</label>
                  <input
                    type="text"
                    name="timeSlot"
                    defaultValue={rescheduleJobTarget.timeSlot || '06:00 PM - Scheduled'}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Concurrency Limit</label>
                <input
                  type="number"
                  name="concurrencyLimit"
                  defaultValue={rescheduleJobTarget.concurrencyLimit || 4}
                  min="1"
                  max="16"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleJobTarget(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  Save Schedule Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SCHEDULE NEW MIGRATION PIPELINE */}
      {isNewScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-sm tracking-tight">Schedule New Data Migration Pipeline</h3>
              </div>
              <div className="flex items-center gap-2">
                {canScrollModalDown && (
                  <button
                    type="button"
                    onClick={handleScrollModalToBottom}
                    className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/80 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                    title="Click to scroll down to bottom functions and submit actions"
                  >
                    <ChevronDown className="w-3 h-3 text-indigo-400 animate-bounce" />
                    <span>Scroll to Bottom</span>
                  </button>
                )}
                <button
                  onClick={() => setIsNewScheduleModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateNewSchedule} className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
              <div
                ref={scheduleFormScrollRef}
                onScroll={updateScheduleModalScrollState}
                className="flex-1 overflow-y-auto custom-modal-scrollbar p-4 sm:p-6 space-y-4 text-xs"
              >
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pipeline Name</label>
                  <input
                    type="text"
                    name="jobName"
                    required
                    placeholder="e.g. Fixed Assets & Depreciation Sync"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* SOURCE SYSTEM & REALTIME SOURCE ENTITY FETCH */}
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-extrabold text-slate-800 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                      <Server className="w-3.5 h-3.5 text-indigo-600" />
                      Source Connection & Schema
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Real-time Connected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Source System</label>
                      <select
                        name="sourceConnectorName"
                        value={selectedSourceSystem}
                        onChange={(e) => handleSourceSystemChange(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                      >
                        {SYSTEM_OPTIONS.map((sys) => (
                          <option key={sys.id} value={sys.id}>
                            {sys.name} ({sys.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700">Source Entity</label>
                        <button
                          type="button"
                          onClick={handleManualRefreshSourceSchema}
                          disabled={isFetchingSourceEntities}
                          className="text-[10px] font-mono text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                          title="Re-query Live OData/API Endpoint Schema"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${isFetchingSourceEntities ? 'animate-spin' : ''}`} />
                          {isFetchingSourceEntities ? 'Fetching...' : 'Fetch Live'}
                        </button>
                      </div>

                      {!sourceCustomMode ? (
                        <div className="space-y-1">
                          <select
                            name="sourceEntity"
                            value={selectedSourceEntity}
                            onChange={(e) => {
                              if (e.target.value === '__CUSTOM__') {
                                setSourceCustomMode(true);
                                setSelectedSourceEntity('');
                              } else {
                                setSelectedSourceEntity(e.target.value);
                              }
                            }}
                            disabled={isFetchingSourceEntities}
                            className={`w-full p-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs ${
                              isFetchingSourceEntities ? 'opacity-60 cursor-wait' : ''
                            }`}
                          >
                            {getSourceEntitiesList().map((ent) => (
                              <option key={ent.name} value={ent.name}>
                                {ent.name} ({ent.type})
                              </option>
                            ))}
                            <option value="__CUSTOM__">✏️ Custom Entity Name...</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            name="sourceEntity"
                            required
                            value={selectedSourceEntity}
                            onChange={(e) => setSelectedSourceEntity(e.target.value)}
                            placeholder="e.g. ANLA_AssetMaster"
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setSourceCustomMode(false)}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-[10px] font-mono cursor-pointer"
                          >
                            List
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Source Metadata Indicator */}
                  <div className="flex items-center justify-between bg-slate-900 text-slate-200 p-2 rounded-xl text-[10px] font-mono border border-slate-800">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold truncate">
                      <Database className="w-3 h-3 text-emerald-400 shrink-0" />
                      Live Entity: <span className="underline">{selectedSourceEntity || 'None'}</span>
                    </span>
                    <span className="text-slate-400 font-medium shrink-0">
                      {getSourceEntitiesList().find((e) => e.name === selectedSourceEntity)?.records || 'Live API Endpoint'}
                    </span>
                  </div>
                </div>

                {/* DESTINATION SYSTEM & REALTIME DESTINATION ENTITY FETCH */}
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="font-extrabold text-slate-800 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5 text-indigo-600" />
                      Destination Connection & Target Endpoint
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Real-time Connected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Destination System</label>
                      <select
                        name="destConnectorName"
                        value={selectedDestSystem}
                        onChange={(e) => handleDestSystemChange(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                      >
                        {SYSTEM_OPTIONS.map((sys) => (
                          <option key={sys.id} value={sys.id}>
                            {sys.name} ({sys.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700">Destination Entity</label>
                        <button
                          type="button"
                          onClick={handleManualRefreshDestSchema}
                          disabled={isFetchingDestEntities}
                          className="text-[10px] font-mono text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                          title="Re-query Live OData/API Endpoint Schema"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${isFetchingDestEntities ? 'animate-spin' : ''}`} />
                          {isFetchingDestEntities ? 'Fetching...' : 'Fetch Live'}
                        </button>
                      </div>

                      {!destCustomMode ? (
                        <div className="space-y-1">
                          <select
                            name="destEntity"
                            value={selectedDestEntity}
                            onChange={(e) => {
                              if (e.target.value === '__CUSTOM__') {
                                setDestCustomMode(true);
                                setSelectedDestEntity('');
                              } else {
                                setSelectedDestEntity(e.target.value);
                              }
                            }}
                            disabled={isFetchingDestEntities}
                            className={`w-full p-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs ${
                              isFetchingDestEntities ? 'opacity-60 cursor-wait' : ''
                            }`}
                          >
                            {getDestEntitiesList().map((ent) => (
                              <option key={ent.name} value={ent.name}>
                                {ent.name} ({ent.type})
                              </option>
                            ))}
                            <option value="__CUSTOM__">✏️ Custom Entity Name...</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            name="destEntity"
                            required
                            value={selectedDestEntity}
                            onChange={(e) => setSelectedDestEntity(e.target.value)}
                            placeholder="e.g. FA_FixedAsset"
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 font-bold text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setDestCustomMode(false)}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-[10px] font-mono cursor-pointer"
                          >
                            List
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Destination Metadata Indicator */}
                  <div className="flex items-center justify-between bg-slate-900 text-slate-200 p-2 rounded-xl text-[10px] font-mono border border-slate-800">
                    <span className="flex items-center gap-1.5 text-indigo-400 font-bold truncate">
                      <Database className="w-3 h-3 text-indigo-400 shrink-0" />
                      Target Entity: <span className="underline">{selectedDestEntity || 'None'}</span>
                    </span>
                    <span className="text-slate-400 font-medium shrink-0">
                      {getDestEntitiesList().find((e) => e.name === selectedDestEntity)?.records || 'Live Target Endpoint'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cron Expression</label>
                    <input
                      type="text"
                      name="cronSchedule"
                      defaultValue="0 18 * * *"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Migration Mode</label>
                    <select
                      name="mode"
                      defaultValue="Incremental"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      <option value="Incremental">Incremental</option>
                      <option value="Full">Full Load</option>
                      <option value="Delta">Delta Stream</option>
                    </select>
                  </div>
                </div>

                {/* ADVANCED PIPELINE CONTROL FUNCTIONS & ERROR POLICY */}
                <div className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-extrabold text-indigo-300 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      Advanced Pipeline Controls & Error Policy
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      Enterprise Profile
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Batch Chunk Size</label>
                      <select
                        name="batchSize"
                        defaultValue="5000"
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="1000">1,000 records / payload (Safe)</option>
                        <option value="5000">5,000 records / payload (Recommended)</option>
                        <option value="15000">15,000 records / payload (High speed)</option>
                        <option value="50000">50,000 records / payload (Bulk Stream)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Auto Retry & Error Policy</label>
                      <select
                        name="retryPolicy"
                        defaultValue="3x-backoff"
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl font-semibold text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="3x-backoff">Auto Retry 3x (Exponential Backoff)</option>
                        <option value="5x-aggressive">Auto Retry 5x (Aggressive Retry)</option>
                        <option value="skip-log">Skip Faulty Rows & Log to Error Center</option>
                        <option value="fail-fast">Fail Immediately & Alert Ops</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Max Concurrency Limit</label>
                      <select
                        name="concurrencyLimit"
                        defaultValue="4"
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-slate-100 text-xs cursor-pointer"
                      >
                        <option value="1">1 Thread (Sequential)</option>
                        <option value="2">2 Concurrent Threads</option>
                        <option value="4">4 Concurrent Threads (Recommended)</option>
                        <option value="8">8 Parallel Stream Workers</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Alert Email / Webhook</label>
                      <input
                        type="text"
                        name="alertEmail"
                        placeholder="e.g. devops-alerts@enterprise.com"
                        defaultValue="data-ops@enterprise.internal"
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer font-medium text-xs">
                      <input type="checkbox" defaultChecked className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                      <span>Pre-flight Live Schema Verification before starting batch execution</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer font-medium text-xs">
                      <input type="checkbox" className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                      <span>Dry-Run Simulation Mode (verify mapping logic without writing to destination)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* FLOATING ANIMATED SCROLL BUTTONS OVERLAY */}
              {canScrollModalDown && (
                <button
                  type="button"
                  onClick={handleScrollModalDown}
                  className="absolute bottom-16 right-6 z-30 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-full shadow-2xl border border-indigo-300 flex items-center gap-2 transition-all animate-bounce cursor-pointer group active:scale-95"
                  title="Click to scroll down to view remaining functions and action buttons"
                >
                  <span>Scroll Down for More Functions</span>
                  <ChevronDown className="w-4 h-4 text-white group-hover:translate-y-0.5 transition-transform" />
                </button>
              )}

              {canScrollModalUp && (
                <button
                  type="button"
                  onClick={handleScrollModalToTop}
                  className="absolute top-4 right-6 z-30 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-950 text-slate-200 font-bold text-[11px] rounded-full shadow-lg border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md active:scale-95"
                  title="Scroll back to top"
                >
                  <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Top</span>
                </button>
              )}

              {/* STICKY FOOTER ACTION BUTTONS & QUICK SCROLL NAVIGATION */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={handleScrollModalToTop}
                    disabled={!canScrollModalUp}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
                      canScrollModalUp
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 cursor-pointer shadow-2xs'
                        : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
                    }`}
                    title="Scroll form to top"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Top</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleScrollModalToBottom}
                    disabled={!canScrollModalDown}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
                      canScrollModalDown
                        ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 cursor-pointer shadow-2xs'
                        : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
                    }`}
                    title="Scroll form to bottom"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Bottom</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewScheduleModalOpen(false)}
                    className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 shadow-2xs transition-colors cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer text-xs active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Schedule</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CLICK-TO-VIEW JOB TELEMETRY & LIVE LOGS */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    <Database className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-300">Job ID: {selectedJob.id}</span>
                  {renderStatusBadge(selectedJob.status, selectedJob.category)}
                </div>
                <h3 className="text-lg font-extrabold tracking-tight">{selectedJob.jobName}</h3>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Architecture Endpoint Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Source System</div>
                  <div className="text-sm font-extrabold text-slate-900">{selectedJob.sourceConnectorName}</div>
                  <div className="text-xs text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                    Entity: {selectedJob.sourceEntity}
                  </div>
                </div>

                <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Destination System</div>
                  <div className="text-sm font-extrabold text-slate-900">{selectedJob.destConnectorName}</div>
                  <div className="text-xs text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                    Entity: {selectedJob.destEntity}
                  </div>
                </div>
              </div>

              {/* Real-time Countdown Banner if Scheduled */}
              {selectedJob.category === 'Scheduled' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center justify-between text-amber-950">
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-amber-600 animate-spin" />
                    <div>
                      <div className="font-extrabold text-xs">Scheduled Execution Countdown</div>
                      <div className="text-[11px] text-amber-800">{selectedJob.scheduledTime || parseCronLabel(selectedJob.cronSchedule)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-mono font-extrabold text-amber-900">
                      {formatCountdown(selectedJob.nextRunSeconds)}
                    </div>
                    <div className="text-[10px] text-amber-700 uppercase font-mono font-bold">Remaining</div>
                  </div>
                </div>
              )}

              {/* Progress & Ingestion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>Data Ingestion Progress</span>
                  <span className="font-mono text-indigo-600">{selectedJob.progressPct}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedJob.progressPct}%` }}
                    transition={{ type: 'spring', stiffness: 55, damping: 14 }}
                    className={`h-full rounded-full relative ${
                      selectedJob.status === 'Running'
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 animate-pulse'
                        : selectedJob.status === 'Completed'
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                  >
                    {selectedJob.status === 'Running' && (
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.25)_50%,transparent_100%)] bg-[length:200%_100%] animate-pulse" />
                    )}
                  </motion.div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Processed: {selectedJob.processedRecords.toLocaleString()} rows</span>
                  <span>Total Target: {selectedJob.totalRecords.toLocaleString()} rows</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Throughput Rate</div>
                  <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                    {selectedJob.throughputRps || 0} <span className="text-[10px] font-normal text-slate-500">rec/sec</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Migration Mode</div>
                  <div className="text-xs font-extrabold text-indigo-600 font-mono mt-0.5">{selectedJob.mode}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Concurrency Limit</div>
                  <div className="text-base font-extrabold text-slate-800 font-mono mt-0.5">
                    {selectedJob.concurrencyLimit || 4} <span className="text-[10px] text-slate-400 font-normal">threads</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cron Trigger</div>
                  <div className="text-xs font-extrabold text-slate-700 font-mono mt-0.5 truncate" title={selectedJob.cronSchedule}>
                    {selectedJob.cronSchedule || 'On-Demand'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedJob.category === 'Scheduled' && (
                  <button
                    onClick={() => {
                      handleRunNow(selectedJob.id);
                      setSelectedJob(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
                    <span>Run Now (Real-Time)</span>
                  </button>
                )}

                {selectedJob.category === 'Scheduled' && (
                  <button
                    onClick={() => {
                      setRescheduleJobTarget(selectedJob);
                      setSelectedJob(null);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Reschedule Config</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteJob(selectedJob.id)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Schedule</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
