import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  ExternalLink,
  Trash2,
  CheckCircle2,
  MoreVertical,
  RotateCcw,
  Sparkles,
  Zap,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ErrorLog, ErrorCategory, PatternCluster } from '../types';
import { fetchAiErrorExplanation } from '../services/aiService';
import { CATEGORY_CONFIG, getErrorCategory } from './ErrorCenter/CategoryConfig';
import { INITIAL_EXTENDED_ERRORS, ERROR_RCA_REGISTRY } from './ErrorCenter/ErrorData';
import { StatusBadge, CategoryBadge } from './ErrorCenter/ErrorBadges';
import { ErrorImpactPanel, ConnectedSystemImpact, MigrationJobImpact } from './ErrorCenter/ErrorImpactPanel';
import { ErrorTrendChart, HourlyTrendPoint } from './ErrorCenter/ErrorTrendChart';
import { ErrorDetailModal } from './ErrorCenter/ErrorDetailModal';
import { ErrorExportModal } from './ErrorCenter/ErrorExportModal';
import { ErrorResolvePatternModal } from './ErrorCenter/ErrorResolvePatternModal';

export const ErrorCenterView: React.FC = () => {
  const [errors, setErrors] = useState<ErrorLog[]>(INITIAL_EXTENDED_ERRORS);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [suggestedFix, setSuggestedFix] = useState<any | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isRetryingAll, setIsRetryingAll] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);

  // Error Center Configuration and Policy States
  const [errorCenterTab, setErrorCenterTab] = useState<'logs' | 'policy'>('logs');
  const [isRetryingFailedOnly, setIsRetryingFailedOnly] = useState<boolean>(false);
  const [retryPolicies, setRetryPolicies] = useState([
    { id: 'pol-1', category: 'API Error', retryLimit: 3, waitSeconds: 5, enabled: true, action: 'Auto-Retry with Backoff' },
    { id: 'pol-2', category: 'Validation Error', retryLimit: 1, waitSeconds: 0, enabled: false, action: 'Route to Quarantine on failure' },
    { id: 'pol-3', category: 'Database lock timeout', retryLimit: 5, waitSeconds: 15, enabled: true, action: 'Queue & Retry sequentially' }
  ]);
  const [newPolicyCat, setNewPolicyCat] = useState<string>('API Error');
  const [newPolicyLimit, setNewPolicyLimit] = useState<number>(3);
  const [newPolicyWait, setNewPolicyWait] = useState<number>(10);
  const [newPolicyAction, setNewPolicyAction] = useState<string>('Auto-Retry with Backoff');

  // Enhanced Error Center Features State
  const [selectedErrorIds, setSelectedErrorIds] = useState<Set<string>>(new Set());
  const [retryingErrorIds, setRetryingErrorIds] = useState<Set<string>>(new Set());
  const [isBulkActionPending, setIsBulkActionPending] = useState<boolean>(false);
  const [isRetryingSelected, setIsRetryingSelected] = useState<boolean>(false);
  const [isRcaDashboardExpanded, setIsRcaDashboardExpanded] = useState<boolean>(true);

  // Download / Export Modal & Temporal Date-Range State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportPreset, setExportPreset] = useState<'all' | '15m' | '1h' | '24h' | '7d' | 'custom'>('all');
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [exportSeverity, setExportSeverity] = useState<string>('All');
  const [exportStatus, setExportStatus] = useState<string>('All');
  const [exportCategory, setExportCategory] = useState<string>('All');

  // Auto-Resolve Pattern Modal & Action State
  const [isPatternModalOpen, setIsPatternModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Impact Prediction Panel State
  const [isImpactPanelOpen, setIsImpactPanelOpen] = useState<boolean>(true);
  const [impactTab, setImpactTab] = useState<'systems' | 'jobs' | 'patterns'>('systems');

  // 24-Hour Historical Trends Chart State
  const [isChartPanelOpen, setIsChartPanelOpen] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [highlightPeaks, setHighlightPeaks] = useState<boolean>(true);
  const [selectedHourFilter, setSelectedHourFilter] = useState<number | null>(null);
  const [trendDisplayMode, setTrendDisplayMode] = useState<'combined' | 'chart' | 'heatmap'>('combined');
  const [hoveredHeatmapHour, setHoveredHeatmapHour] = useState<number | null>(null);

  // Expanded row IDs & Detail Modal state
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [detailModalError, setDetailModalError] = useState<ErrorLog | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'stackTrace' | 'rawMetadata'>('stackTrace');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleErrorStatus = (errId: string) => {
    setErrors((prev) =>
      prev.map((err) => {
        if (err.id !== errId) return err;
        const currentIsOpen = err.status === 'Open' || err.status === 'Unresolved';
        const newStatus: 'Open' | 'Resolved' = currentIsOpen ? 'Resolved' : 'Open';
        triggerToast(`Status changed to ${newStatus} for Error [${err.id}].`);
        return { ...err, status: newStatus };
      })
    );
  };

  const categoryStats = useMemo(() => {
    return (Object.keys(CATEGORY_CONFIG) as ErrorCategory[]).map((cat) => {
      const catErrors = errors.filter((e) => getErrorCategory(e) === cat);
      const activeCount = catErrors.filter((e) => e.status === 'Open' || e.status === 'Unresolved').length;
      const resolvedCount = catErrors.filter((e) => e.status === 'Resolved').length;
      return { category: cat, active: activeCount, resolved: resolvedCount };
    });
  }, [errors]);

  const trendData: HourlyTrendPoint[] = useMemo(() => {
    const hours = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];
    return hours.map((h, i) => {
      const isPeak = h === '10' || h === '12';
      return {
        hourLabel: `${h}:00`,
        hourNumber: parseInt(h),
        critical: isPeak ? 120 + Math.random() * 50 : 10 + Math.random() * 20,
        error: isPeak ? 300 + Math.random() * 100 : 40 + Math.random() * 50,
        warning: 80 + Math.random() * 40,
        total: 0, // will calculate
        isPeakPeriod: isPeak,
        topErrorCode: isPeak ? 'ERR_TIMEOUT_LOCK' : 'VAL-STRING-TRIM',
        primaryJob: 'Master_Material_Ingestion',
        affectedRecords: isPeak ? 45000 : 2100,
      };
    }).map(d => ({ ...d, total: d.critical + d.error + d.warning }));
  }, []);

  const systemImpacts: ConnectedSystemImpact[] = useMemo(() => [
    {
      id: 'sys-1',
      systemName: 'Dynamics 365 BC',
      systemType: 'Target ERP',
      status: 'DEGRADED',
      riskLevel: 'High',
      recordsBlockedCount: 14205,
      affectedJobs: ['Job_101_Cust', 'Job_104_Orders'],
      primaryPatternTrigger: 'Foreign Key Miss (FK-LOOKUP-004)',
      predictionReason: 'Target API returning high rate of 429 errors during Material Master peak sync. Estimated 45% reduction in throughput.',
      estimatedDelayMinutes: 120,
      recommendedAction: 'Trigger throttling auto-cooldown or reduce parallel worker threads to 4.'
    },
    {
      id: 'sys-2',
      systemName: 'Azure SQL Staging',
      systemType: 'Staging DB',
      status: 'BLOCKED',
      riskLevel: 'Critical',
      recordsBlockedCount: 42100,
      affectedJobs: ['Historical_Load_P1', 'Ledger_Sync'],
      primaryPatternTrigger: 'Table Lock Timeout (ERR_TIMEOUT_LOCK)',
      predictionReason: 'Concurrent writes to material_ledger causing transaction deadlocks. Write buffers are at 98% capacity.',
      estimatedDelayMinutes: 340,
      recommendedAction: 'Suspend historical partition migration for 2 hours to allow transaction pool recovery.'
    },
    {
      id: 'sys-3',
      systemName: 'GCP Pub/Sub Ingress',
      systemType: 'Data Lake',
      status: 'HEALTHY',
      riskLevel: 'Low',
      recordsBlockedCount: 0,
      affectedJobs: ['CDC_Realtime_Stream'],
      primaryPatternTrigger: 'None',
      predictionReason: 'Ingress pipeline functioning within standard latency bounds ( < 150ms ).',
      estimatedDelayMinutes: 0,
      recommendedAction: 'None'
    }
  ], []);

  const jobImpacts: MigrationJobImpact[] = useMemo(() => [
    {
      jobId: 'job-101',
      jobTitle: 'Customers_Master_Sync',
      entityName: 'Customers',
      activeErrorCount: 4,
      failureProbability: 82,
      blastRadiusCategory: 'High Risk - Ingress Blocked',
      affectedDownstreamModule: 'Sales Invoicing',
      riskLevel: 'Critical',
      mitigationRecommendation: 'Auto-resolve email format errors using RFC cleanser.'
    },
    {
      jobId: 'job-102',
      jobTitle: 'Material_Ledger_Bulk',
      entityName: 'ItemLedger',
      activeErrorCount: 2,
      failureProbability: 45,
      blastRadiusCategory: 'Medium Risk - Format Latency',
      affectedDownstreamModule: 'Inventory Mgmt',
      riskLevel: 'High',
      mitigationRecommendation: 'Retry after 15m exponential backoff.'
    }
  ], []);

  const patternClusters: PatternCluster[] = useMemo(() => [
    {
      id: 'cluster-1',
      patternTitle: 'Dynamics 365 BC Lookup Failure (NET90_CUSTOM)',
      ruleCategory: 'Reference Failure',
      heuristicReason: 'Detected 42 instances of Payment Terms "NET90_CUSTOM" failing lookup. This value exists in legacy but is not configured in BC target.',
      confidenceScore: 98,
      suggestedAction: 'Bulk Auto-Resolve',
      matchedErrors: errors.filter(e => e.errorCode === 'FK-LOOKUP-004')
    },
    {
      id: 'cluster-2',
      patternTitle: 'Material Master DB Lock Collision',
      ruleCategory: 'Constraint Collision',
      heuristicReason: 'High frequency table lock timeouts on material ledger. Likely caused by concurrent parallel workers exceeding target DB IOPS.',
      confidenceScore: 92,
      suggestedAction: 'Bulk Auto-Resolve',
      matchedErrors: errors.filter(e => e.errorCode === 'ERR_TIMEOUT_LOCK')
    },
    {
      id: 'cluster-3',
      patternTitle: 'Email Format Sanitization Rule',
      ruleCategory: 'Formatting Typo',
      heuristicReason: 'Multiple entries contain consecutive dots in email fields. Pattern suggests legacy system did not enforce strict RFC validation.',
      confidenceScore: 88,
      suggestedAction: 'Bulk Auto-Resolve',
      matchedErrors: errors.filter(e => e.errorCode === 'VAL-EMAIL-001')
    }
  ], [errors]);

  const filteredErrors = useMemo(() => {
    return errors.filter((err) => {
      const matchSeverity = filterSeverity === 'All' || err.severity === filterSeverity;
      const matchStatus = filterStatus === 'All' || err.status === filterStatus;
      const matchCategory = filterCategory === 'All' || err.category === filterCategory;
      const matchHour = selectedHourFilter === null; // Temporal chart filtering logic would go here
      return matchSeverity && matchStatus && matchCategory && matchHour;
    });
  }, [errors, filterSeverity, filterStatus, filterCategory, selectedHourFilter]);

  // Standardize severity mapping for consistent filtering and visualization
  const severityLevels: Record<string, number> = { 
    'Critical': 4, 'High': 4, 
    'Error': 3, 'Medium': 3, 
    'Warning': 2, 'Low': 2, 
    'Info': 1, 
    'Healthy': 0 
  };
  
  const exportFilteredErrors = useMemo(() => {
    return errors.filter((err) => {
      if (exportSeverity !== 'All') {
        const minLevel = severityLevels[exportSeverity as any] || 0;
        const errLevel = severityLevels[err.severity as any] || 0;
        if (errLevel < minLevel) return false;
      }
      const matchStatus = exportStatus === 'All' || err.status === exportStatus;
      const matchCategory = exportCategory === 'All' || err.category === exportCategory;
      return matchStatus && matchCategory;
    });
  }, [errors, exportSeverity, exportStatus, exportCategory]);

  const handleExplainError = async (errLog: ErrorLog) => {
    setIsExplaining(true);
    setAiExplanation(null);
    setSuggestedFix(null);

    try {
      const res = await fetchAiErrorExplanation(
        errLog,
        'Legacy Dynamics NAV (SQL Server)',
        'Dynamics 365 Business Central Online'
      );
      
      if (res.success) {
        setAiExplanation(res.rootCause || 'Error analyzed by Gemini AI');
        setSuggestedFix(res.remediationSteps || []);
      } else {
        const fallbackRca = ERROR_RCA_REGISTRY[errLog.errorCode];
        if (fallbackRca) {
          setAiExplanation(fallbackRca.rootCause);
          setSuggestedFix(fallbackRca.remediation);
        } else {
          setAiExplanation('Unable to provide AI analysis at this time. Please check system logs.');
        }
      }
    } catch (err) {
      console.warn('AI error explanation failed:', err);
      const fallbackRca = ERROR_RCA_REGISTRY[errLog.errorCode];
      if (fallbackRca) {
        setAiExplanation(fallbackRca.rootCause);
        setSuggestedFix(fallbackRca.remediation);
      }
    } finally {
      setIsExplaining(false);
    }
  };

  const handleApplyFix = (errId: string) => {
    setErrors((prev) => prev.map((e) => (e.id === errId ? { ...e, status: 'Resolved' } : e)));
    setSelectedError(null);
    setDetailModalError(null);
    triggerToast(`Error [${errId}] successfully repaired and set to Resolved.`);
  };

  const handleBulkIgnorePattern = (cluster: PatternCluster) => {
    const idsToIgnore = new Set(cluster.matchedErrors.map((e) => e.id));
    setErrors((prev) =>
      prev.map((err) => (idsToIgnore.has(err.id) ? { ...err, status: 'Ignored' } : err))
    );
    triggerToast(`Bulk Ignored ${cluster.matchedErrors.length} noise records matching "${cluster.patternTitle}".`);
  };

  const handleBulkFlagPattern = (cluster: PatternCluster) => {
    const idsToFlag = new Set(cluster.matchedErrors.map((e) => e.id));
    setErrors((prev) =>
      prev.map((err) => (idsToFlag.has(err.id) ? { ...err, isFlagged: true, severity: 'Warning' } : err))
    );
    triggerToast(`Bulk Flagged ${cluster.matchedErrors.length} records for review in "${cluster.patternTitle}".`);
  };

  const handleBulkAutoResolvePattern = (cluster: PatternCluster) => {
    const idsToResolve = new Set(cluster.matchedErrors.map((e) => e.id));
    setErrors((prev) =>
      prev.map((err) => (idsToResolve.has(err.id) ? { ...err, status: 'Resolved' } : err))
    );
    triggerToast(`Bulk Auto-Resolved ${cluster.matchedErrors.length} records in pattern "${cluster.patternTitle}".`);
  };

  const handleAutoResolveAllHighConfidence = () => {
    const highConfClusters = patternClusters.filter((c) => c.confidenceScore >= 85);
    if (highConfClusters.length === 0) {
      triggerToast('No active high-confidence pattern clusters available to auto-resolve.');
      return;
    }

    let totalCount = 0;
    setErrors((prev) => {
      let updated = [...prev];
      highConfClusters.forEach((cluster) => {
        const ids = new Set(cluster.matchedErrors.map((e) => e.id));
        totalCount += ids.size;
        updated = updated.map((err) => {
          if (!ids.has(err.id)) return err;
          if (cluster.suggestedAction === 'Bulk Auto-Resolve') {
            return { ...err, status: 'Resolved' };
          }
          if (cluster.suggestedAction === 'Bulk Ignore') {
            return { ...err, status: 'Ignored' };
          }
          return { ...err, isFlagged: true };
        });
      });
      return updated;
    });

    triggerToast(`Auto-Resolved & Ignored ${totalCount} noise items across ${highConfClusters.length} high-confidence pattern clusters!`);
    setIsPatternModalOpen(false);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setLastRefreshed(new Date());
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handleRetryAll = () => {
    if (isRetryingAll) return;
    setIsRetryingAll(true);
    triggerToast('Initiating bulk retry for all Unresolved errors across worker nodes...');
    setTimeout(() => {
      setIsRetryingAll(false);
      triggerToast('Bulk retry complete. 0 records resolved, 13 records persisted (Permanent failures).');
    }, 2000);
  };

  const handleRetryFailedOnly = () => {
    if (isRetryingFailedOnly) return;
    
    const targetErrors = errors.filter((err) => {
      if (err.status !== 'Unresolved' && err.status !== 'Open') return false;
      const cat = err.category?.toLowerCase() || '';
      const code = err.errorCode?.toLowerCase() || '';
      const msg = err.errorMessage?.toLowerCase() || '';
      return cat === 'validation' || cat === 'network' || cat === 'auth' || code.includes('val') || code.includes('api') || msg.includes('validation') || msg.includes('api') || msg.includes('timeout') || msg.includes('lock');
    });

    if (targetErrors.length === 0) {
      triggerToast('No active Validation or API error records found to retry.');
      return;
    }

    setIsRetryingFailedOnly(true);
    triggerToast(`Initiating targeted hot-swap retry of ${targetErrors.length} Validation & API error records...`);

    setTimeout(() => {
      let resolvedCount = 0;
      const nextErrors = errors.map((err) => {
        const isTarget = targetErrors.some(te => te.id === err.id);
        if (isTarget && Math.random() < 0.85) {
          resolvedCount++;
          return { ...err, status: 'Resolved' as const };
        }
        return err;
      });

      setErrors(nextErrors);
      setIsRetryingFailedOnly(false);
      triggerToast(`Retry complete! Successfully repaired & committed ${resolvedCount} records. ${targetErrors.length - resolvedCount} records routed to manual review queue.`);
    }, 1500);
  };

  const handleRetrySelected = () => {
    if (isRetryingSelected) return;
    if (selectedErrorIds.size === 0) {
      triggerToast('Please select at least one error record to retry.');
      return;
    }

    const selectedErrors = errors.filter(err => selectedErrorIds.has(err.id));
    const activeUnresolvedErrors = selectedErrors.filter(err => err.status === 'Unresolved' || err.status === 'Open');

    if (activeUnresolvedErrors.length === 0) {
      triggerToast('None of the selected records are eligible for retry (they must be in "Open" or "Unresolved" status).');
      return;
    }

    setIsRetryingSelected(true);
    triggerToast(`Applying retry policy parameters and processing ${activeUnresolvedErrors.length} selected error records...`);

    setTimeout(() => {
      let resolvedCount = 0;
      let quarantinedCount = 0;
      let unresolvedCount = 0;

      const updatedErrors = errors.map((err) => {
        if (!selectedErrorIds.has(err.id) || (err.status !== 'Unresolved' && err.status !== 'Open')) {
          return err;
        }

        const cat = err.category?.toLowerCase() || '';
        const msg = err.errorMessage?.toLowerCase() || '';
        const code = err.errorCode?.toLowerCase() || '';

        // Match with retryPolicies categories
        const matchedPolicy = retryPolicies.find((p) => {
          const pCat = p.category.toLowerCase();
          if (pCat.includes('validation') && (cat.includes('validation') || code.includes('val') || msg.includes('validation'))) return true;
          if (pCat.includes('api') && (cat.includes('api') || cat.includes('network') || cat.includes('auth') || code.includes('api') || msg.includes('api') || msg.includes('token') || msg.includes('auth'))) return true;
          if (pCat.includes('database') && (cat.includes('database') || msg.includes('lock') || msg.includes('database') || code.includes('db'))) return true;
          return false;
        });

        // Honor matched policy or fallback to defaults
        const policyLimit = matchedPolicy && matchedPolicy.enabled ? matchedPolicy.retryLimit : 3;
        const policyAction = matchedPolicy && matchedPolicy.enabled ? matchedPolicy.action : 'Auto-Retry with Backoff';

        // Success probability is proportional to retryLimit
        const isSuccess = Math.random() < (policyLimit >= 3 ? 0.90 : 0.60);

        if (isSuccess) {
          resolvedCount++;
          return { ...err, status: 'Resolved' as const };
        } else {
          if (policyAction.toLowerCase().includes('quarantine')) {
            quarantinedCount++;
            return { ...err, status: 'Ignored' as const, isFlagged: true }; // Flag and quarantine
          } else {
            unresolvedCount++;
            return err;
          }
        }
      });

      setErrors(updatedErrors);
      setSelectedErrorIds(new Set());
      setIsRetryingSelected(false);

      let summaryMessage = `Bulk policy-driven retry complete: Successfully resolved ${resolvedCount} records.`;
      if (quarantinedCount > 0) {
        summaryMessage += ` Routed ${quarantinedCount} to Quarantine Staging.`;
      }
      if (unresolvedCount > 0) {
        summaryMessage += ` ${unresolvedCount} records exceeded thresholds and remain active.`;
      }
      triggerToast(summaryMessage);
    }, 2000);
  };

  const handleExecuteExport = () => {
    triggerToast(`Exporting ${exportFilteredErrors.length} records as ${exportFormat.toUpperCase()}...`);
    setIsExportModalOpen(false);
  };

  const handleSelectExportPreset = (preset: 'all' | '15m' | '1h' | '24h' | '7d' | 'custom') => {
    setExportPreset(preset);
    if (preset !== 'custom') {
      setExportStartDate('');
      setExportEndDate('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 relative overflow-hidden">
      {/* Dynamic Toast Message */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-200">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
            </div>
            <p className="text-xs font-bold tracking-tight">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Primary Navigation Bar */}
      <div className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
              Error Control Center
              <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse tracking-widest">
                LIVE
              </span>
            </h1>
            <p className="text-[10px] text-slate-600 font-mono flex items-center gap-1.5 uppercase font-bold tracking-wider">
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Last Polled: {lastRefreshed.toLocaleTimeString()} • {errors.length} Active Records
            </p>
          </div>

          <div className="h-8 w-px bg-slate-100 hidden md:block" />

          <div className="hidden lg:flex items-center gap-6">
            {categoryStats.slice(0, 3).map((stat) => (
              <div key={stat.category} className="flex flex-col">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                  {stat.category}
                </span>
                <span className={`text-xs font-mono font-black ${stat.active > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                  {stat.active} Active
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative group hidden sm:block">
            <button
              onClick={() => setIsDownloadOpen(!isDownloadOpen)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-slate-200 shadow-3xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            {isDownloadOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <button 
                  onClick={() => { setIsDownloadOpen(false); setIsExportModalOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-black text-slate-800">Standard Audit Log</span>
                    <span className="block text-[9px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">CSV / JSON Format</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-all cursor-pointer border border-transparent"
            title="Force Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {selectedErrorIds.size > 0 && (
            <button
              onClick={handleRetrySelected}
              disabled={isRetryingSelected}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer bg-violet-600 hover:bg-violet-500 text-white animate-in fade-in zoom-in-95 duration-200 border border-violet-500/25`}
              title="Retry Checked Records using Defined Policy Thresholds"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetryingSelected ? 'animate-spin' : ''}`} />
              <span>Bulk Retry Selected ({selectedErrorIds.size})</span>
            </button>
          )}

          <button
            onClick={handleRetryFailedOnly}
            disabled={isRetryingFailedOnly}
            className={`px-4.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-sm cursor-pointer border border-emerald-500/20 ${
              isRetryingFailedOnly 
                ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title="Retry Validation & API Errors Only"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetryingFailedOnly ? 'animate-spin' : ''}`} />
            Retry Failed
          </button>

          <button
            onClick={handleRetryAll}
            disabled={isRetryingAll}
            className={`px-5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-sm cursor-pointer border border-indigo-500/20 ${
              isRetryingAll 
                ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRetryingAll ? 'animate-spin' : ''}`} />
            Bulk Retry
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-6 gap-6 custom-modal-scrollbar overflow-y-auto">
        {/* Top Section: Dashboard Panels */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 shrink-0">
          <div className="xl:col-span-8 h-[395px]">
            <ErrorTrendChart 
              trendData={trendData}
              chartType={chartType}
              setChartType={setChartType}
              trendDisplayMode={trendDisplayMode}
              setTrendDisplayMode={setTrendDisplayMode}
              selectedHourFilter={selectedHourFilter}
              setSelectedHourFilter={setSelectedHourFilter}
            />
          </div>
          <div className="xl:col-span-4 h-[395px]">
            <ErrorImpactPanel 
              systemImpacts={systemImpacts}
              jobImpacts={jobImpacts}
              activeTab={impactTab}
              setActiveTab={setImpactTab}
            />
          </div>
        </div>

        {/* Action Banner: AI Patterns */}
        <div className="bg-gradient-to-r from-indigo-50/70 via-indigo-50/40 to-indigo-50/70 rounded-2xl p-5 border border-indigo-100/60 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center relative overflow-hidden group">
              <Sparkles className="w-6 h-6 text-indigo-600 relative z-10" />
            </div>
            <div>
              <h3 className="text-slate-900 text-sm font-extrabold flex items-center gap-2 uppercase">
                Gemini Pattern Clustering Active
                <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-widest font-black">
                  Auto-Resolve Enabled
                </span>
              </h3>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed mt-1 font-bold">
                The statistical analyzer has identified <span className="text-indigo-600 font-black">3 recurring failure patterns</span> across {errors.length} records. Confidence score for auto-resolution is <span className="text-emerald-600 font-black">98%</span>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPatternModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer shrink-0 border border-indigo-500/30"
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            Launch Resolver
          </button>
        </div>

        {/* Main Error Data Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col flex-1 min-h-[500px] overflow-hidden">
          {/* Sub Navigation Tabs */}
          <div className="border-b border-slate-100 px-6 py-3 flex items-center justify-between bg-slate-50/50 gap-4 shrink-0">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
              <button
                onClick={() => setErrorCenterTab('logs')}
                className={`px-4.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  errorCenterTab === 'logs'
                    ? 'bg-white text-slate-800 shadow-2xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-700'
                }`}
              >
                Active Error Logs ({filteredErrors.length})
              </button>
              <button
                onClick={() => setErrorCenterTab('policy')}
                className={`px-4.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  errorCenterTab === 'policy'
                    ? 'bg-white text-slate-800 shadow-2xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-700'
                }`}
              >
                Auto-Retry Policies ({retryPolicies.length})
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-slate-600">
              {errorCenterTab === 'policy' ? (
                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded border border-indigo-150 uppercase tracking-widest">
                  Self-Healing Active
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded border border-slate-200 uppercase tracking-widest">
                  Log Analyzer Ready
                </span>
              )}
            </div>
          </div>

          {errorCenterTab === 'logs' ? (
            <>
              {/* Table Toolbar */}
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/10">
            <div className="flex items-center gap-4 flex-1 min-w-[300px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input 
                  id="error-logs-search"
                  type="text" 
                  placeholder="Search error messages, job IDs, or codes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-colors shadow-3xs font-bold"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-3xs">
                  {(['All', 'Critical', 'Error', 'Warning'] as const).map((sev) => (
                    <button
                      id={`filter-severity-${sev}`}
                      key={sev}
                      onClick={() => setFilterSeverity(sev)}
                      className={`px-3 py-1 text-[10px] font-black rounded-md transition-all uppercase tracking-tighter ${
                        filterSeverity === sev ? 'bg-white text-slate-800 shadow-2xs border border-slate-200/60' : 'text-slate-600 hover:text-slate-700'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select 
                id="filter-category-select"
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold outline-none cursor-pointer hover:border-slate-300 transition-colors shadow-3xs"
              >
                <option value="All">All Categories</option>
                <option value="Network">Infrastructure/Net</option>
                <option value="Auth">Security/Auth</option>
                <option value="Schema">Type Schema</option>
                <option value="Data Mapping">MappingStudio</option>
                <option value="Database">DB Level</option>
                <option value="Validation">Logical Check</option>
              </select>
              <select 
                id="filter-status-select"
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold outline-none cursor-pointer hover:border-slate-300 transition-colors shadow-3xs"
              >
                <option value="All">All Statuses</option>
                <option value="Unresolved">Active / Open</option>
                <option value="Resolved">Resolved</option>
                <option value="Ignored">Ignored Noise</option>
              </select>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-50/80">
            <div className="col-span-1 flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={filteredErrors.length > 0 && filteredErrors.every(err => selectedErrorIds.has(err.id))}
                onChange={() => {
                  const isAllSelected = filteredErrors.length > 0 && filteredErrors.every(err => selectedErrorIds.has(err.id));
                  const next = new Set(selectedErrorIds);
                  if (isAllSelected) {
                    filteredErrors.forEach(err => next.delete(err.id));
                  } else {
                    filteredErrors.forEach(err => next.add(err.id));
                  }
                  setSelectedErrorIds(next);
                }}
                className="rounded-md border-slate-350 bg-white text-indigo-600 focus:ring-indigo-500 focus:ring-offset-white cursor-pointer" 
              />
              <span>ID</span>
            </div>
            <div className="col-span-2">Job Context</div>
            <div className="col-span-4">Signature & Analysis</div>
            <div className="col-span-2 text-center">Disposition</div>
            <div className="col-span-2 text-right">Telemetry</div>
            <div className="col-span-1" />
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto custom-modal-scrollbar">
            {filteredErrors.length > 0 ? filteredErrors.map((err) => {
              const isExpanded = expandedRowIds.has(err.id);
              const rca = ERROR_RCA_REGISTRY[err.errorCode];
              
              return (
                <div key={err.id} className={`group border-b border-slate-100 hover:bg-slate-50/45 transition-colors ${err.isFlagged ? 'bg-amber-50/30' : ''}`}>
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                    <div className="col-span-1 flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selectedErrorIds.has(err.id)}
                        onChange={() => {
                          const next = new Set(selectedErrorIds);
                          if (next.has(err.id)) next.delete(err.id);
                          else next.add(err.id);
                          setSelectedErrorIds(next);
                        }}
                        className="rounded-md border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500 focus:ring-offset-white" 
                      />
                      <span className="text-[11px] font-mono font-black text-slate-600 group-hover:text-indigo-600 transition-colors">
                        {err.id.replace('err-', '')}
                      </span>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-700">{err.jobId}</span>
                        {err.isFlagged && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" title="Flagged for Review" />}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-bold">
                        <span className="truncate">{err.entityName}</span>
                        <span className="text-slate-700">•</span>
                        <span className="font-mono uppercase tracking-tighter text-slate-600">Row {err.rowNumber || err.recordRowNumber}</span>
                      </div>
                    </div>

                    <div className="col-span-4 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded font-mono font-black text-[9px] border ${
                          err.severity === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                          err.severity === 'Error' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {err.errorCode}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{err.errorMessage}</h4>
                      </div>
                      {rca && (
                        <div className="flex items-start gap-1.5 text-[10px] text-slate-600 italic bg-amber-50/30 p-1.5 rounded-lg border border-amber-100/50">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="line-clamp-1"><span className="text-slate-500 not-italic font-black uppercase tracking-tighter mr-1">{rca.title}:</span> {rca.rootCause}</p>
                        </div>
                      )}
                    </div>

                    <div className="col-span-2 flex flex-col items-center gap-1.5">
                      <StatusBadge status={err.status} onClick={() => handleToggleErrorStatus(err.id)} />
                      <CategoryBadge category={err.category || 'Validation'} />
                    </div>

                    <div className="col-span-2 text-right space-y-0.5">
                      <span className="text-[10px] font-black text-slate-600 block">{err.timestamp}</span>
                      <span className="text-[9px] text-slate-600 font-mono block truncate" title={err.rawValue}>
                        Val: {err.rawValue}
                      </span>
                    </div>

                    <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setDetailModalError(err);
                          handleExplainError(err);
                        }}
                        className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="AI Analysis"
                      >
                        <BrainCircuitIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toggleRowExpansion(err.id)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Context Drawer */}
                  {isExpanded && (
                    <div className="px-6 pb-4 pt-1 bg-slate-50/50 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-1" />
                        <div className="col-span-11 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col sm:flex-row">
                          <div className="p-4 flex-1 space-y-3 bg-white">
                            <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                              <ExternalLink className="w-3 h-3 text-slate-600" />
                              Detailed RCA Registry
                            </h5>
                            {rca ? (
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Estimated Root Cause:</p>
                                  <p className="text-xs text-slate-700 leading-relaxed font-bold">{rca.rootCause}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Remediation Action:</p>
                                  <p className="text-xs text-emerald-800 leading-relaxed font-bold bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 italic">
                                    {rca.remediation}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="py-4 flex flex-col items-center justify-center text-center space-y-2 bg-white">
                                <AlertCircle className="w-6 h-6 text-slate-700" />
                                <p className="text-[10px] text-slate-600 italic">No static registry entry for this code. Launch AI analysis for dynamic RCA.</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-4 bg-slate-50/50 border-l border-slate-100 min-w-[240px] flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono font-bold text-slate-600 uppercase">Context Metadata</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(JSON.stringify(err, null, 2));
                                  triggerToast('Context copied to clipboard.');
                                }}
                                className="text-indigo-600 hover:text-indigo-500 cursor-pointer"
                              >
                                <CopyIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <pre className="text-[10px] font-mono text-slate-600 leading-tight flex-1">
                              {JSON.stringify({
                                errorCode: err.errorCode,
                                field: err.fieldName,
                                value: err.rawValue,
                                severity: err.severity,
                                status: err.status
                              }, null, 2)}
                            </pre>
                            <button 
                              onClick={() => {
                                  setDetailModalError(err);
                                  handleExplainError(err);
                              }}
                              className="mt-4 w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm cursor-pointer transition-all active:scale-[0.98] border border-indigo-500/30"
                            >
                              Open AI Detail View
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Layers className="w-10 h-10 text-slate-700" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800">No matching records found</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Adjust your filters or temporal boundaries to locate the desired error logs.
                </p>
                <button 
                  onClick={() => {
                    setFilterSeverity('All');
                    setFilterStatus('All');
                    setFilterCategory('All');
                    setSelectedHourFilter(null);
                  }}
                  className="mt-6 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Table Pagination Placeholder */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold text-slate-500">
              Showing <span className="text-slate-800">{filteredErrors.length}</span> of {errors.length} active logs
            </span>
            <div className="flex items-center gap-2">
              <button disabled className="p-1.5 rounded-lg border border-slate-200 text-slate-700 cursor-not-allowed"><ChevronLeftIcon className="w-4 h-4" /></button>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-lg bg-indigo-600 text-white shadow-sm">1</button>
                <button className="w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">2</button>
              </div>
              <button className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"><ChevronRightIcon className="w-4 h-4" /></button>
            </div>
          </div>
            </>
          ) : (
            /* DYNAMIC AUTO-RETRY POLICY MANAGER */
            <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-modal-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form to configure new policy rule */}
                <div className="lg:col-span-1 p-5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Configure New Rule
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Define self-healing parameters to process high-throughput batch stream operations automatically.
                  </p>

                  <div className="space-y-3.5 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block uppercase">Error Classification</label>
                      <select 
                        value={newPolicyCat}
                        onChange={(e) => setNewPolicyCat(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-indigo-400"
                      >
                        <option value="API Error">API Exception/Throttling</option>
                        <option value="Validation Error">Format Schema Validation</option>
                        <option value="Database lock timeout">Database Locks/Timeouts</option>
                        <option value="Network Fault">Network Timeout (TCP/HTTP)</option>
                        <option value="Security Violation">Authentication Exception</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 block uppercase">Retry Limit</label>
                        <input 
                          type="number"
                          min="0"
                          max="10"
                          value={newPolicyLimit}
                          onChange={(e) => setNewPolicyLimit(parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 block uppercase">Wait (Seconds)</label>
                        <input 
                          type="number"
                          min="0"
                          max="300"
                          value={newPolicyWait}
                          onChange={(e) => setNewPolicyWait(parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block uppercase">Failure Action Mode</label>
                      <select 
                        value={newPolicyAction}
                        onChange={(e) => setNewPolicyAction(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-indigo-400"
                      >
                        <option value="Auto-Retry with Backoff">Auto-Retry with Exponential Backoff</option>
                        <option value="Route to Quarantine on failure">Route to Quarantine Queue Immediately</option>
                        <option value="Queue & Retry sequentially">Queue &amp; Re-run Sequentially</option>
                        <option value="Alert Ops Team & Pause">Alert Operations Team &amp; Hold Job</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        const newRule = {
                          id: `pol-${Date.now()}`,
                          category: newPolicyCat,
                          retryLimit: newPolicyLimit,
                          waitSeconds: newPolicyWait,
                          enabled: true,
                          action: newPolicyAction
                        };
                        setRetryPolicies([...retryPolicies, newRule]);
                        triggerToast(`Added Retry Policy threshold rule for "${newPolicyCat}"!`);
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Add Threshold Rule
                    </button>
                  </div>
                </div>

                {/* Display current policy thresholds table */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">Active Threshold Registers</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded font-bold uppercase">
                        Active Monitoring
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      {retryPolicies.map((policy) => (
                        <div key={policy.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-800 text-sm">{policy.category}</span>
                              <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {policy.retryLimit}x Retries
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 text-slate-600" />
                                Backoff Interval: <strong className="text-slate-700">{policy.waitSeconds}s</strong>
                              </span>
                              <span>•</span>
                              <span className="text-indigo-600 font-semibold">{policy.action}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            {/* Switch Component Toggle */}
                            <button
                              onClick={() => {
                                const updated = retryPolicies.map(p => p.id === policy.id ? { ...p, enabled: !p.enabled } : p);
                                setRetryPolicies(updated);
                                triggerToast(`Policy for "${policy.category}" is now ${!policy.enabled ? 'Enabled' : 'Disabled'}.`);
                              }}
                              className={`w-10 h-5.5 rounded-full p-0.5 transition-all outline-none border cursor-pointer ${
                                policy.enabled 
                                  ? 'bg-indigo-600 border-indigo-700 flex justify-end' 
                                  : 'bg-slate-200 border-slate-300 flex justify-start'
                              }`}
                            >
                              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                            </button>

                            <button
                              onClick={() => {
                                setRetryPolicies(retryPolicies.filter(p => p.id !== policy.id));
                                triggerToast(`Deleted policy threshold rule.`);
                              }}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                              title="Delete Rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operational architecture overview block */}
                  <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/20 flex gap-3">
                    <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-900 block">How Automatic Recovery Thresholds Work</span>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        The self-healing listener actively intercepts error cursors on live Kafka, EventGrid, or Spark endpoints. If an incoming failure matches an active policy registry classification:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-[10px] text-indigo-950 pt-1">
                        <li>The system delays the transaction context for the designated <strong>Wait Seconds</strong> interval.</li>
                        <li>An automated targeted re-try execution is initiated up to the specified <strong>Retry Limit</strong>.</li>
                        <li>If persistent failure continues beyond the limit, records are routed to the <strong>Quarantine Staging Area</strong> to prevent database blocking.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer System Status Bar */}
      <div className="h-10 bg-white border-t border-slate-100 px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Inference Engine: <span className="text-emerald-600 font-black">Stable</span></span>
          </div>
          <div className="h-3 w-px bg-slate-100" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Worker Load: <span className="text-indigo-600 font-black">32%</span></span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-slate-600">System Uptime: 42d 18h 12m</span>
          <button className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 hover:text-indigo-600 transition-colors">
            Node Status Registry
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Detail Modal Layer */}
      {detailModalError && (
        <ErrorDetailModal 
          error={detailModalError}
          onClose={() => setDetailModalError(null)}
          onToggleStatus={handleToggleErrorStatus}
          aiExplanation={aiExplanation}
          suggestedFix={suggestedFix}
          isExplaining={isExplaining}
          onExplain={handleExplainError}
          onApplyFix={handleApplyFix}
          activeDetailTab={activeDetailTab}
          setActiveDetailTab={setActiveDetailTab}
          copiedField={copiedField}
          setCopiedField={setCopiedField}
        />
      )}

      {/* Export Modal Layer */}
      {isExportModalOpen && (
        <ErrorExportModal 
          onClose={() => setIsExportModalOpen(false)}
          errors={errors}
          exportFilteredErrors={exportFilteredErrors}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          exportPreset={exportPreset}
          handleSelectExportPreset={handleSelectExportPreset}
          exportStartDate={exportStartDate}
          setExportStartDate={setExportStartDate}
          exportEndDate={exportEndDate}
          setExportEndDate={setExportEndDate}
          exportSeverity={exportSeverity}
          setExportSeverity={setExportSeverity}
          exportStatus={exportStatus}
          setExportStatus={setExportStatus}
          exportCategory={exportCategory}
          setExportCategory={setExportCategory}
          onExecuteExport={handleExecuteExport}
        />
      )}

      {/* Pattern Modal Layer */}
      {isPatternModalOpen && (
        <ErrorResolvePatternModal 
          onClose={() => setIsPatternModalOpen(false)}
          clusters={patternClusters}
          onBulkIgnore={handleBulkIgnorePattern}
          onBulkFlag={handleBulkFlagPattern}
          onBulkAutoResolve={handleBulkAutoResolvePattern}
          onAutoResolveAll={handleAutoResolveAllHighConfidence}
        />
      )}
    </div>
  );
};

// Inline specialized micro-icons
const BrainCircuitIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
    <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>
    <path d="M12 7l0 2"/>
    <path d="M12 15l0 2"/>
    <path d="M7 12l2 0"/>
    <path d="M15 12l2 0"/>
  </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
