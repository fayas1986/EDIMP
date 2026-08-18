import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OverflowTableWrapper } from './OverflowTableWrapper';
import {
  Layers,
  Activity,
  Play,
  Pause,
  FastForward,
  RefreshCw,
  Server,
  Cpu,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  Terminal,
  Settings,
  Sliders,
  Download,
  Zap,
  ChevronRight,
  ChevronDown,
  X,
  RotateCcw,
  FileText,
  Database,
  Sparkles,
  ShieldAlert,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  BarChart2,
  CornerDownRight,
  Gauge,
  ListFilter,
  Minimize2,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Radio,
  Grid,
  Network,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { BatchSchedulerStudio } from './BatchSchedulerStudio';
import { DataCompressionLayer, CompressionAlgorithm } from './DataCompressionLayer';
import { MigrationJob } from '../types';
import { MOCK_MIGRATION_JOBS } from '../data/mockData';

// Types for Batch Processing Engine
export interface BatchChunk {
  chunkId: string;
  chunkIndex: number;
  startRow: number;
  endRow: number;
  recordCount: number;
  status: 'Completed' | 'Processing' | 'Queued' | 'Failed_DLQ' | 'Retrying';
  progressPct: number;
  assignedWorker: string;
  processedInMs: number;
  errorReason?: string;
  failedRecordSample?: Record<string, any>;
}

export interface BatchQueue {
  id: string;
  name: string;
  entityName: string;
  sourceConnector: string;
  destConnector: string;
  status: 'Running' | 'Paused' | 'Completed' | 'Failed';
  totalRecords: number;
  processedRecords: number;
  chunkSize: number;
  concurrencyWorkers: number;
  throughputRps: number;
  errorCount: number;
  dlqCount: number;
  startTime: string;
  etaSeconds: number;
  chunks: BatchChunk[];
  isAtRisk?: boolean;
  riskReason?: string;
}

export interface WorkerNode {
  id: string;
  name: string;
  status: 'Active' | 'Idle' | 'High_Load' | 'Offline';
  cpuUsagePct: number;
  memoryUsageMb: number;
  currentChunkId?: string;
  currentJobName?: string;
  processedTotal: number;
  rps: number;
  isNewlyProvisioned?: boolean;
  provisionedAt?: string;
}

export interface ScalingEvent {
  id: string;
  type: 'SCALE_UP' | 'SCALE_DOWN';
  delta: number;
  reason: string;
  timestamp: string;
  previousCount: number;
  newCount: number;
}

export interface DlqItem {
  id: string;
  jobId: string;
  jobName: string;
  chunkId: string;
  errorCode: string;
  errorMessage: string;
  recordIndex: number;
  payload: Record<string, any>;
  timestamp: string;
  retryAttempts: number;
  status: 'Unresolved' | 'Retried' | 'Purged';
}

export const BatchProcessingEngineView: React.FC = () => {
  // Engine Global Controls State
  const [engineState, setEngineState] = useState<'Running' | 'Paused'>('Running');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'queues' | 'workers' | 'dlq' | 'schedule' | 'logs' | 'compression'>('queues');
  const [activeCompressionAlgo, setActiveCompressionAlgo] = useState<CompressionAlgorithm>('ZSTD');
  const [activeCompressionRatio, setActiveCompressionRatio] = useState<number>(4.15);

  // Overall Global Telemetry Metrics
  const [globalThroughputRps, setGlobalThroughputRps] = useState<number>(14500);
  const [globalMbps, setGlobalMbps] = useState<number>(38.4);
  const [queueBacklog, setQueueBacklog] = useState<number>(2420000);
  const [totalProcessed, setTotalProcessed] = useState<number>(8520000);
  const [minWorkers, setMinWorkers] = useState<number>(8);
  const [maxWorkers, setMaxWorkers] = useState<number>(128);
  const [activeWorkersCount, setActiveWorkersCount] = useState<number>(24);
  const [autoScaleEnabled, setAutoScaleEnabled] = useState<boolean>(true);
  const [autoScaleMode, setAutoScaleMode] = useState<'Reactive' | 'Predictive' | 'Scheduled'>('Reactive');
  const [podViewMode, setPodViewMode] = useState<'grid' | 'topology'>('grid');

  // Last Scaling Event tracking
  const [lastScalingEvent, setLastScalingEvent] = useState<ScalingEvent | null>({
    id: 'scale-init-1',
    type: 'SCALE_UP',
    delta: 8,
    reason: 'Autoscaler Controller: High Queue Backlog (> 2.0M records)',
    timestamp: 'Just now',
    previousCount: 16,
    newCount: 24,
  });
  const [scalingHistory, setScalingHistory] = useState<ScalingEvent[]>([]);

  // Active Batch Queues Data
  const [queues, setQueues] = useState<BatchQueue[]>([
    {
      id: 'bq-101',
      name: 'Daily Customer Sync (Master Partition A)',
      entityName: 'Customers & Accounts',
      sourceConnector: 'PostgreSQL Production',
      destConnector: 'Snowflake Data Warehouse',
      status: 'Running',
      totalRecords: 1200000,
      processedRecords: 840000,
      chunkSize: 5000,
      concurrencyWorkers: 16,
      throughputRps: 5200,
      errorCount: 12,
      dlqCount: 4,
      startTime: '10 mins ago',
      etaSeconds: 68,
      chunks: Array.from({ length: 12 }).map((_, i) => ({
        chunkId: `chunk-101-${i + 1}`,
        chunkIndex: i + 1,
        startRow: i * 5000 + 1,
        endRow: (i + 1) * 5000,
        recordCount: 5000,
        status: i < 7 ? 'Completed' : i === 7 ? 'Processing' : i === 8 ? 'Failed_DLQ' : 'Queued',
        progressPct: i < 7 ? 100 : i === 7 ? 62 : 0,
        assignedWorker: `Worker-Pod-${(i % 8) + 1}`,
        processedInMs: i < 7 ? 940 : 0,
        errorReason: i === 8 ? 'Primary key constraint violation: Duplicate customer_uuid' : undefined,
      })),
    },
    {
      id: 'bq-102',
      name: 'Historical Invoice Ledger Delta Sync',
      entityName: 'Invoices & Ledger',
      sourceConnector: 'Oracle ERP Cloud',
      destConnector: 'PostgreSQL Enterprise',
      status: 'Running',
      totalRecords: 3500000,
      processedRecords: 1850000,
      chunkSize: 10000,
      concurrencyWorkers: 24,
      throughputRps: 6800,
      errorCount: 8,
      dlqCount: 2,
      startTime: '25 mins ago',
      etaSeconds: 240,
      isAtRisk: true,
      riskReason: 'Predictive Model: High risk of Target DB lock contention in next 10 mins due to concurrent batch volume.',
      chunks: Array.from({ length: 10 }).map((_, i) => ({
        chunkId: `chunk-102-${i + 1}`,
        chunkIndex: i + 1,
        startRow: i * 10000 + 1,
        endRow: (i + 1) * 10000,
        recordCount: 10000,
        status: i < 5 ? 'Completed' : i === 5 ? 'Processing' : 'Queued',
        progressPct: i < 5 ? 100 : i === 5 ? 44 : 0,
        assignedWorker: `Worker-Pod-${(i % 12) + 9}`,
        processedInMs: i < 5 ? 1420 : 0,
      })),
    },
    {
      id: 'bq-103',
      name: 'Salesforce CRM Contacts Stream',
      entityName: 'Contacts & Leads',
      sourceConnector: 'Salesforce REST API',
      destConnector: 'BigQuery Analytics',
      status: 'Running',
      totalRecords: 450000,
      processedRecords: 390000,
      chunkSize: 2500,
      concurrencyWorkers: 8,
      throughputRps: 1800,
      errorCount: 3,
      dlqCount: 1,
      startTime: '5 mins ago',
      etaSeconds: 32,
      chunks: Array.from({ length: 8 }).map((_, i) => ({
        chunkId: `chunk-103-${i + 1}`,
        chunkIndex: i + 1,
        startRow: i * 2500 + 1,
        endRow: (i + 1) * 2500,
        recordCount: 2500,
        status: i < 6 ? 'Completed' : i === 6 ? 'Processing' : 'Queued',
        progressPct: i < 6 ? 100 : i === 6 ? 88 : 0,
        assignedWorker: `Worker-Pod-${(i % 4) + 1}`,
        processedInMs: i < 6 ? 680 : 0,
      })),
    },
    {
      id: 'bq-104',
      name: 'SAP ERP Material Master Batch Partition',
      entityName: 'Product Catalog',
      sourceConnector: 'SAP S/4HANA',
      destConnector: 'MongoDB Cluster',
      status: 'Paused',
      totalRecords: 800000,
      processedRecords: 240000,
      chunkSize: 2000,
      concurrencyWorkers: 12,
      throughputRps: 0,
      errorCount: 15,
      dlqCount: 5,
      startTime: 'Paused 2h ago',
      etaSeconds: 0,
      chunks: Array.from({ length: 8 }).map((_, i) => ({
        chunkId: `chunk-104-${i + 1}`,
        chunkIndex: i + 1,
        startRow: i * 2000 + 1,
        endRow: (i + 1) * 2000,
        recordCount: 2000,
        status: i < 2 ? 'Completed' : 'Queued',
        progressPct: i < 2 ? 100 : 0,
        assignedWorker: `Worker-Pod-${(i % 6) + 1}`,
        processedInMs: i < 2 ? 820 : 0,
      })),
    }
  ]);

  // Selected Queue for Detailed Inspector
  const [selectedQueueId, setSelectedQueueId] = useState<string>('bq-101');
  const selectedQueue = queues.find((q) => q.id === selectedQueueId) || queues[0];

  // Selected Chunk Modal
  const [selectedChunk, setSelectedChunk] = useState<BatchChunk | null>(null);

  // Worker Pods Cluster State
  const [workerPods, setWorkerPods] = useState<WorkerNode[]>(
    Array.from({ length: 24 }).map((_, i) => ({
      id: `worker-${i + 1}`,
      name: `Worker-Pod-${i + 1}`,
      status: i < 18 ? (i % 3 === 0 ? 'High_Load' : 'Active') : 'Idle',
      cpuUsagePct: i < 18 ? Math.floor(Math.random() * 40) + 45 : 12,
      memoryUsageMb: i < 18 ? Math.floor(Math.random() * 300) + 400 : 120,
      currentChunkId: i < 18 ? `chunk-10${(i % 3) + 1}-${(i % 5) + 1}` : undefined,
      currentJobName: i < 18 ? (i % 2 === 0 ? 'Daily Customer Sync' : 'Invoice Ledger Delta') : undefined,
      processedTotal: Math.floor(Math.random() * 500000) + 200000,
      rps: i < 18 ? Math.floor(Math.random() * 300) + 400 : 0,
      isNewlyProvisioned: i >= 16,
      provisionedAt: 'Just now',
    }))
  );

  // Dead Letter Queue (DLQ) Items
  const [dlqItems, setDlqItems] = useState<DlqItem[]>([
    {
      id: 'dlq-801',
      jobId: 'bq-101',
      jobName: 'Daily Customer Sync',
      chunkId: 'chunk-101-9',
      errorCode: 'ERR_PRIMARY_KEY_VIOLATION',
      errorMessage: 'Duplicate uuid key collision on record #4021: customer_uuid="cust_9921_dup"',
      recordIndex: 4021,
      payload: { customer_id: 9921, name: 'Acme Corp', tax_id: 'US-9912004', email: 'billing@acme.com' },
      timestamp: '2 mins ago',
      retryAttempts: 3,
      status: 'Unresolved',
    },
    {
      id: 'dlq-802',
      jobId: 'bq-101',
      jobName: 'Daily Customer Sync',
      chunkId: 'chunk-101-9',
      errorCode: 'ERR_TYPE_MISMATCH',
      errorMessage: 'Field "credit_limit" expects Numeric, received string "NaN_OVERRIDE"',
      recordIndex: 4182,
      payload: { customer_id: 9940, name: 'Global Tech', credit_limit: 'NaN_OVERRIDE' },
      timestamp: '4 mins ago',
      retryAttempts: 2,
      status: 'Unresolved',
    },
    {
      id: 'dlq-803',
      jobId: 'bq-104',
      jobName: 'SAP ERP Material Master',
      chunkId: 'chunk-104-3',
      errorCode: 'ERR_TIMEOUT_LOCK',
      errorMessage: 'Target database table lock wait timeout exceeded after 30000ms',
      recordIndex: 1200,
      payload: { material_code: 'MAT-88402', unit_price: 140.50, stock_qty: 400 },
      timestamp: '15 mins ago',
      retryAttempts: 1,
      status: 'Unresolved',
    }
  ]);

  // New Batch Job Modal State
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState<boolean>(false);
  const [newJobForm, setNewJobForm] = useState({
    name: '',
    entityName: 'Orders & Line Items',
    sourceConnector: 'PostgreSQL Production',
    destConnector: 'Snowflake Warehouse',
    totalRecords: 1000000,
    chunkSize: 5000,
    workers: 16,
  });

  // Jobs for Scheduler Studio
  const [jobsForScheduler, setJobsForScheduler] = useState<MigrationJob[]>(MOCK_MIGRATION_JOBS);

  // Live Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<
    { id: string; time: string; level: 'INFO' | 'WARN' | 'ERROR' | 'COMMIT'; msg: string }[]
  >([
    { id: 'log-1', time: new Date().toLocaleTimeString(), level: 'INFO', msg: 'Batch Processing Engine initialized with 64 worker pods.' },
    { id: 'log-2', time: new Date().toLocaleTimeString(), level: 'COMMIT', msg: 'Queue [bq-101]: Chunk #7 committed (5,000 records, 940ms, 0 errors).' },
    { id: 'log-3', time: new Date().toLocaleTimeString(), level: 'INFO', msg: 'Queue [bq-102]: Dispatched Chunk #6 (10,000 records) to Worker-Pod-11.' },
    { id: 'log-4', time: new Date().toLocaleTimeString(), level: 'WARN', msg: 'Queue [bq-101]: Chunk #9 hit constraint violation. Routed 1 record to DLQ.' },
  ]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [logFilter, setLogFilter] = useState<string>('ALL');

  // Copied alert
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Helper to add log
  const addLog = (level: 'INFO' | 'WARN' | 'ERROR' | 'COMMIT', msg: string) => {
    const newEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      time: new Date().toLocaleTimeString(),
      level,
      msg,
    };
    setTerminalLogs((prev) => [...prev.slice(-100), newEntry]);
  };

  // Auto scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // Real-time Engine Processing Loop
  useEffect(() => {
    if (engineState !== 'Running') return;

    const interval = setInterval(() => {
      const effSpeed = speedMultiplier;

      // 1. Fluctuate global metrics
      const throughputDelta = Math.floor(Math.random() * 600) - 300;
      setGlobalThroughputRps((prev) => Math.max(8000, Math.min(28000, prev + throughputDelta)));
      setGlobalMbps((prev) => +(Math.max(20, Math.min(80, prev + (throughputDelta / 3000))).toFixed(1)));

      // 2. Advance batch queues processing
      setQueues((prevQueues: any) =>
        prevQueues.map((q: any) => {
          if (q.status !== 'Running') return q;

          // Process records
          const deltaRecords = Math.floor((q.throughputRps / 2) * effSpeed);
          const nextProcessed = Math.min(q.totalRecords, q.processedRecords + deltaRecords);

          // Update chunks progress
          let chunkCompletedThisTick = false;
          let completedChunkIndex = 0;

          const updatedChunks = q.chunks.map((ch) => {
            if (ch.status === 'Completed') return ch;
            if (ch.status === 'Processing') {
              const nextPct = Math.min(100, ch.progressPct + Math.floor(15 * effSpeed));
              if (nextPct >= 100) {
                chunkCompletedThisTick = true;
                completedChunkIndex = ch.chunkIndex;
                return { ...ch, progressPct: 100, status: 'Completed', processedInMs: Math.floor(Math.random() * 400) + 800 };
              }
              return { ...ch, progressPct: nextPct };
            }
            if (ch.status === 'Queued' && chunkCompletedThisTick) {
              return { ...ch, status: 'Processing', progressPct: 10 };
            }
            return ch;
          });

          // Check if queue completed
          const isQueueDone = nextProcessed >= q.totalRecords;

          if (chunkCompletedThisTick) {
            addLog('COMMIT', `Queue [${q.name}]: Chunk #${completedChunkIndex} committed successfully (${q.chunkSize} records).`);
          }

          return {
            ...q,
            processedRecords: nextProcessed,
            status: isQueueDone ? 'Completed' : q.status,
            chunks: updatedChunks,
            etaSeconds: isQueueDone ? 0 : Math.max(0, Math.round((q.totalRecords - nextProcessed) / (q.throughputRps || 1))),
          };
        })
      );

      // Decrement queue backlog & increment total processed
      setQueueBacklog((prev) => Math.max(0, prev - Math.floor(2500 * effSpeed)));
      setTotalProcessed((prev) => prev + Math.floor(2500 * effSpeed));

      // Fluctuate worker pod metrics
      setWorkerPods((prevWorkers) =>
        prevWorkers.map((w) => {
          if (w.status === 'Idle') return w;
          const cpuDelta = Math.floor(Math.random() * 10) - 5;
          const rpsDelta = Math.floor(Math.random() * 40) - 20;
          return {
            ...w,
            cpuUsagePct: Math.max(20, Math.min(98, w.cpuUsagePct + cpuDelta)),
            rps: Math.max(200, Math.min(800, w.rps + rpsDelta)),
            processedTotal: w.processedTotal + Math.floor(300 * effSpeed),
          };
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [engineState, speedMultiplier]);

  // Automatic Autoscaling Controller Policy Loop
  useEffect(() => {
    if (engineState !== 'Running' || !autoScaleEnabled) return;

    const autoScaleInterval = setInterval(() => {
      // Evaluate active cluster conditions
      const currentCount = activeWorkersCount;
      const avgCpu = workerPods.length > 0
        ? Math.round(workerPods.reduce((sum, p) => sum + p.cpuUsagePct, 0) / workerPods.length)
        : 50;

      // Scale Up Condition: Backlog > 2.0M records or Cluster CPU > 78%
      if ((queueBacklog > 2000000 || avgCpu > 78) && currentCount < maxWorkers) {
        const step = currentCount + 8 <= maxWorkers ? 8 : maxWorkers - currentCount;
        if (step > 0) {
          handleScaleWorkers(step, `Autoscaler Controller: High Queue Backlog (${(queueBacklog / 1000000).toFixed(2)}M rec) & Cluster CPU (${avgCpu}%)`);
        }
      }
      // Scale Down Condition: Backlog < 900K and Cluster CPU < 45%
      else if (queueBacklog < 900000 && avgCpu < 45 && currentCount > minWorkers) {
        const step = currentCount - 4 >= minWorkers ? -4 : minWorkers - currentCount;
        if (step < 0) {
          handleScaleWorkers(step, `Autoscaler Controller: Workload normalized (Backlog ${(queueBacklog / 1000000).toFixed(2)}M rec, CPU ${avgCpu}%)`);
        }
      }
    }, 8000);

    return () => clearInterval(autoScaleInterval);
  }, [engineState, autoScaleEnabled, queueBacklog, activeWorkersCount, workerPods, maxWorkers, minWorkers]);

  // Actions
  const handleToggleEngine = () => {
    const next = engineState === 'Running' ? 'Paused' : 'Running';
    setEngineState(next);
    addLog('INFO', `Engine state toggled to [${next.toUpperCase()}].`);
  };

  const handleToggleQueueStatus = (queueId: string) => {
    setQueues((prev) =>
      prev.map((q) => {
        if (q.id === queueId) {
          const nextStatus = q.status === 'Running' ? 'Paused' : 'Running';
          addLog('INFO', `Batch Queue [${q.name}] set to ${nextStatus}.`);
          return { ...q, status: nextStatus, throughputRps: nextStatus === 'Running' ? 5000 : 0 };
        }
        return q;
      })
    );
  };

  const handleScaleWorkers = (delta: number, reason: string = 'Manual Controller Command') => {
    setActiveWorkersCount((prev) => {
      const next = Math.max(minWorkers, Math.min(maxWorkers, prev + delta));
      const actualDelta = next - prev;
      if (actualDelta === 0) return prev;

      const eventType = actualDelta > 0 ? 'SCALE_UP' : 'SCALE_DOWN';
      const timestamp = new Date().toLocaleTimeString();

      const newEvent: ScalingEvent = {
        id: `scale-evt-${Date.now()}`,
        type: eventType,
        delta: actualDelta,
        reason,
        timestamp,
        previousCount: prev,
        newCount: next,
      };

      setLastScalingEvent(newEvent);
      setScalingHistory((prevHist) => [newEvent, ...prevHist.slice(0, 19)]);

      addLog(
        actualDelta > 0 ? 'INFO' : 'WARN',
        `[AUTOSCALER] Controller executed ${eventType} (${actualDelta > 0 ? '+' : ''}${actualDelta} pods). Pool resized ${prev} → ${next}. Reason: ${reason}`
      );

      // Update workerPods list with smooth animation metadata
      setWorkerPods((currentPods) => {
        if (actualDelta > 0) {
          const newlyCreated: WorkerNode[] = Array.from({ length: actualDelta }).map((_, i) => {
            const podIndex = currentPods.length + i + 1;
            return {
              id: `worker-${podIndex}`,
              name: `Worker-Pod-${podIndex}`,
              status: Math.random() > 0.3 ? 'Active' : 'High_Load',
              cpuUsagePct: Math.floor(Math.random() * 35) + 40,
              memoryUsageMb: Math.floor(Math.random() * 200) + 350,
              currentChunkId: `chunk-10${(podIndex % 3) + 1}-${(podIndex % 4) + 1}`,
              currentJobName: podIndex % 2 === 0 ? 'Daily Customer Sync' : 'Invoice Ledger Delta',
              processedTotal: Math.floor(Math.random() * 100000) + 50000,
              rps: Math.floor(Math.random() * 250) + 350,
              isNewlyProvisioned: true,
              provisionedAt: timestamp,
            };
          });
          return [...currentPods, ...newlyCreated];
        } else {
          return currentPods.slice(0, next);
        }
      });

      return next;
    });
  };

  const handleReplayDlqItem = (item: DlqItem) => {
    setDlqItems((prev) =>
      prev.map((d) => (d.id === item.id ? { ...d, status: 'Retried', retryAttempts: d.retryAttempts + 1 } : d))
    );
    addLog('COMMIT', `DLQ Record [${item.id}] replayed into active pipeline queue [${item.jobName}].`);
  };

  const handlePurgeDlqItem = (itemId: string) => {
    setDlqItems((prev) => prev.filter((d) => d.id !== itemId));
    addLog('WARN', `DLQ Record [${itemId}] purged from error store.`);
  };

  const handleQuickRetryFailedChunks = (queueId: string) => {
    setQueues((prevQueues) =>
      prevQueues.map((q) => {
        if (q.id !== queueId) return q;

        const failedChunksCount = q.chunks.filter((ch) => ch.status === 'Failed_DLQ').length;
        if (failedChunksCount === 0) return q;

        addLog('INFO', `Quick Retry initiated for Queue [${q.name}]: Re-running ${failedChunksCount} failed subsets.`);

        const updatedChunks = q.chunks.map((ch) => {
          if (ch.status === 'Failed_DLQ') {
            return {
              ...ch,
              status: 'Processing' as const,
              progressPct: 0,
              errorReason: undefined,
              assignedWorker: `Worker-Pod-${Math.floor(Math.random() * 8) + 1} (Retry)`,
            };
          }
          return ch;
        });

        // Sync selectedChunk if it was failed and is in this queue
        if (selectedChunk && q.chunks.some((ch) => ch.chunkId === selectedChunk.chunkId && ch.status === 'Failed_DLQ')) {
          setSelectedChunk((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'Processing' as const,
                  progressPct: 0,
                  errorReason: undefined,
                  assignedWorker: `Worker-Pod-Retry`,
                }
              : null
          );
        }

        const nextStatus = q.status === 'Paused' ? 'Running' : q.status;

        return {
          ...q,
          status: nextStatus,
          chunks: updatedChunks,
          errorCount: Math.max(0, q.errorCount - failedChunksCount),
          dlqCount: Math.max(0, q.dlqCount - failedChunksCount),
        };
      })
    );
  };

  const handleRetrySingleChunk = (queueId: string, chunkId: string) => {
    setQueues((prevQueues) =>
      prevQueues.map((q) => {
        if (q.id !== queueId) return q;

        const updatedChunks = q.chunks.map((ch) => {
          if (ch.chunkId === chunkId) {
            addLog('INFO', `Retrying single chunk #${ch.chunkIndex} (${ch.chunkId}) in Queue [${q.name}].`);
            return {
              ...ch,
              status: 'Processing' as const,
              progressPct: 0,
              errorReason: undefined,
              assignedWorker: `Worker-Pod-${Math.floor(Math.random() * 8) + 1} (Retry)`,
            };
          }
          return ch;
        });

        if (selectedChunk && selectedChunk.chunkId === chunkId) {
          setSelectedChunk((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'Processing' as const,
                  progressPct: 0,
                  errorReason: undefined,
                  assignedWorker: `Worker-Pod-Retry`,
                }
              : null
          );
        }

        const nextStatus = q.status === 'Paused' ? 'Running' : q.status;

        return {
          ...q,
          status: nextStatus,
          chunks: updatedChunks,
          errorCount: Math.max(0, q.errorCount - 1),
          dlqCount: Math.max(0, q.dlqCount - 1),
        };
      })
    );
  };

  const handleCreateNewJob = (e: React.FormEvent) => {
    e.preventDefault();
    const newQueue: BatchQueue = {
      id: `bq-${Date.now().toString().slice(-3)}`,
      name: newJobForm.name || 'Ad-Hoc Batch Job Stream',
      entityName: newJobForm.entityName,
      sourceConnector: newJobForm.sourceConnector,
      destConnector: newJobForm.destConnector,
      status: 'Running',
      totalRecords: newJobForm.totalRecords,
      processedRecords: 0,
      chunkSize: newJobForm.chunkSize,
      concurrencyWorkers: newJobForm.workers,
      throughputRps: 4200,
      errorCount: 0,
      dlqCount: 0,
      startTime: 'Just now',
      etaSeconds: Math.round(newJobForm.totalRecords / 4200),
      chunks: Array.from({ length: 8 }).map((_, i) => ({
        chunkId: `chunk-${Date.now().toString().slice(-3)}-${i + 1}`,
        chunkIndex: i + 1,
        startRow: i * newJobForm.chunkSize + 1,
        endRow: (i + 1) * newJobForm.chunkSize,
        recordCount: newJobForm.chunkSize,
        status: i === 0 ? 'Processing' : 'Queued',
        progressPct: i === 0 ? 15 : 0,
        assignedWorker: `Worker-Pod-${(i % 8) + 1}`,
        processedInMs: 0,
      })),
    };

    setQueues((prev) => [newQueue, ...prev]);
    setIsNewJobModalOpen(false);
    addLog('INFO', `New high-throughput batch job [${newQueue.name}] queued with ${newQueue.totalRecords.toLocaleString()} records.`);
  };

  const filteredLogs = terminalLogs.filter((l) => logFilter === 'ALL' || l.level === logFilter);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Engine Top Title Bar & Global Controls (Migration Replay White Theme) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-mono font-semibold rounded-full border border-indigo-100">
              Module 14 – High-Throughput Batch Processing Engine
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-mono font-semibold rounded-full border border-emerald-100 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              Real-Time Chunk Partitioning
            </span>
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-mono font-semibold rounded-full border border-purple-100 flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-purple-500" />
              {activeWorkersCount} Worker Pods Active
            </span>
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-mono font-semibold rounded-full border border-amber-100 flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-amber-500" />
              {(queueBacklog / 1000000).toFixed(2)}M Backlog Records
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5 text-slate-900">
            <Layers className="w-6 h-6 text-indigo-600" />
            Batch Processing Engine
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono tracking-wider ml-1 ${
              engineState === 'Running'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {engineState}
            </span>
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            High-throughput distributed chunk worker engine, real-time partitioning, &amp; dead-letter queue with sub-second parallel chunk dispatching across worker pods.
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          {/* Speed Multiplier */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
            <span className="px-2 text-slate-500 text-[10px] font-bold">SPEED:</span>
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  speedMultiplier === s
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Engine Play/Pause Toggle */}
          <button
            type="button"
            onClick={handleToggleEngine}
            className={`px-4 py-2.5 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              engineState === 'Running'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {engineState === 'Running' ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Engine</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Resume Engine</span>
              </>
            )}
          </button>

          {/* Create Batch Job Button */}
          <button
            type="button"
            onClick={() => setIsNewJobModalOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-3xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>New Batch Queue</span>
          </button>
        </div>
      </div>

      {/* Live Global Telemetry Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Global Throughput */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
            <Zap className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold block">Global Throughput</span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">{globalMbps} MB/s</span>
            </div>
            <span className="text-xl font-extrabold text-slate-900 font-mono block">
              {globalThroughputRps.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">rec/s</span>
            </span>
            <span className="text-[11px] text-slate-500 truncate block mt-0.5">
              Across {queues.filter((q) => q.status === 'Running').length} active streams
            </span>
          </div>
        </div>

        {/* Metric 2: Active Worker Pods */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <span className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 shrink-0">
            <Server className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold block">Active Worker Pods</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleScaleWorkers(-8)}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer transition-colors"
                  title="Scale Down Worker Pods (-8)"
                >
                  -8
                </button>
                <button
                  onClick={() => handleScaleWorkers(8)}
                  className="px-1.5 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded text-[10px] font-bold cursor-pointer transition-colors"
                  title="Scale Up Worker Pods (+8)"
                >
                  +8
                </button>
              </div>
            </div>
            <span className="text-xl font-extrabold text-purple-600 font-mono block">
              {activeWorkersCount}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">/ {maxWorkers} Max</span>
            </span>
            <span className="text-[11px] text-slate-500 truncate block mt-0.5">Auto-Scaling: Active (Rebalance)</span>
          </div>
        </div>

        {/* Metric 3: Queue Backlog */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <span className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
            <HardDrive className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold block">Queue Backlog</span>
              <span className="text-[10px] font-mono text-amber-600 font-bold">Total Queue</span>
            </div>
            <span className="text-xl font-extrabold text-amber-600 font-mono block">
              {(queueBacklog / 1000000).toFixed(2)}M{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">records</span>
            </span>
            <span className="text-[11px] text-slate-500 truncate block mt-0.5">
              Processed: {(totalProcessed / 1000000).toFixed(2)}M
            </span>
          </div>
        </div>

        {/* Metric 4: Dead-Letter Queue (DLQ) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <span className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold block">Dead-Letter Queue</span>
              <span className="text-[10px] font-mono text-rose-600 font-bold">DLQ</span>
            </div>
            <span className="text-xl font-extrabold text-rose-600 font-mono block">
              {dlqItems.filter((d) => d.status === 'Unresolved').length}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">records</span>
            </span>
            <span className="text-[11px] text-slate-500 truncate block mt-0.5">0.001% Exception error rate</span>
          </div>
        </div>
      </div>

      {/* Primary Sub-Tab Navigation Bar */}
      <div className="flex items-center justify-between bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('queues')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'queues'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Active Batch Streams ({queues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('workers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'workers'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Worker Pods Grid ({activeWorkersCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('dlq')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'dlq'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Dead-Letter Store ({dlqItems.filter((d) => d.status === 'Unresolved').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Batch Schedule Planner</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Execution Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('compression')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'compression'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Minimize2 className="w-4 h-4 text-emerald-500" />
            <span>45+ TB Payload Compression</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-mono font-black border border-emerald-300">
              {activeCompressionRatio.toFixed(1)}x Ratio
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: ACTIVE BATCH QUEUES & CHUNK VISUALIZER */}
      {activeTab === 'queues' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Queues List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Active Batch Queue Streams
                </h3>
                <span className="text-xs text-slate-500 font-mono">Real-time chunk dispatching</span>
              </div>

              <div className="space-y-3">
                {queues.map((queue) => {
                  const isSelected = queue.id === selectedQueueId;
                  const pct = Math.round((queue.processedRecords / queue.totalRecords) * 100);

                  return (
                    <div
                      key={queue.id}
                      onClick={() => setSelectedQueueId(queue.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? 'bg-indigo-50/60 border-indigo-400 shadow-xs'
                          : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/80'
                      }`}
                    >
                      {/* Top Queue Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{queue.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              queue.status === 'Running'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {queue.status}
                            </span>
                            {queue.isAtRisk && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-rose-100 text-rose-800 border border-rose-200 animate-pulse flex items-center gap-1" title={queue.riskReason}>
                                <AlertTriangle className="w-3 h-3" /> At-Risk
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {queue.sourceConnector} → {queue.destConnector} • <span className="font-semibold text-slate-800">{queue.entityName}</span>
                          </p>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleQueueStatus(queue.id);
                          }}
                          className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                            queue.status === 'Running'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title={queue.status === 'Running' ? 'Pause Queue' : 'Resume Queue'}
                        >
                          {queue.status === 'Running' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Progress Bar & Numerical Stats */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-700 font-bold">
                            {queue.processedRecords.toLocaleString()} / {queue.totalRecords.toLocaleString()} rec
                          </span>
                          <span className="text-indigo-600 font-bold">{pct}%</span>
                        </div>

                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              queue.status === 'Running' ? 'bg-indigo-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Queue Metrics Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 font-mono pt-1">
                        <span>Speed: <strong className="text-slate-900">{queue.throughputRps.toLocaleString()} rec/s</strong></span>
                        <span>Chunk Size: <strong className="text-slate-900">{queue.chunkSize.toLocaleString()}</strong></span>
                        <span>Workers: <strong className="text-indigo-600 font-bold">{queue.concurrencyWorkers} Pods</strong></span>
                        <span>ETA: <strong className="text-emerald-600 font-bold">{queue.etaSeconds}s</strong></span>
                      </div>

                      {queue.isAtRisk && (
                        <div className="mt-2 flex items-start gap-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-[10px] text-amber-900 font-mono">
                            <strong className="block font-bold">Predictive Model Alert</strong>
                            {queue.riskReason}
                          </div>
                        </div>
                      )}

                      {queue.chunks.some((ch) => ch.status === 'Failed_DLQ') && (
                        <div className="mt-2 flex items-center justify-between gap-2 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="text-[10px] text-rose-700 font-bold">
                              {queue.chunks.filter((ch) => ch.status === 'Failed_DLQ').length} Failed Subset(s)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickRetryFailedChunks(queue.id);
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Quick Retry</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Chunk Inspector for Selected Queue */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white text-slate-900 rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] text-indigo-600 font-mono uppercase tracking-wider font-bold">
                    Chunk Partition Stream
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">{selectedQueue.name}</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono font-semibold border border-slate-200">
                  {selectedQueue.chunks.length} Chunks
                </span>
              </div>

              {/* Quick Retry Banner */}
              {(() => {
                const failedChunksCount = selectedQueue.chunks.filter((ch) => ch.status === 'Failed_DLQ').length;
                if (failedChunksCount > 0) {
                  return (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <span className="font-bold text-rose-800">{failedChunksCount} Failed Subset{failedChunksCount > 1 ? 's' : ''} Detected</span>
                          <p className="text-[10px] text-slate-600 font-sans mt-0.5">Errors found during the initial pipeline run.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickRetryFailedChunks(selectedQueue.id)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors shrink-0 shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Quick Retry</span>
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Chunk Blocks Grid Visualizer */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Chunk Blocks Topology</span>
                  <span className="text-[10px] text-slate-500">Click block to inspect payload</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {selectedQueue.chunks.map((ch) => {
                    const isCompleted = ch.status === 'Completed';
                    const isProcessing = ch.status === 'Processing';
                    const isFailed = ch.status === 'Failed_DLQ';

                    return (
                      <button
                        key={ch.chunkId}
                        onClick={() => setSelectedChunk(ch)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden space-y-1 ${
                          isCompleted
                            ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300 text-emerald-800'
                            : isProcessing
                            ? 'bg-indigo-50 border-indigo-300 hover:border-indigo-400 text-indigo-800 ring-1 ring-indigo-300'
                            : isFailed
                            ? 'bg-rose-50 border-rose-300 text-rose-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                          <span>#{ch.chunkIndex}</span>
                          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          {isProcessing && <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />}
                          {isFailed && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                        </div>

                        <div className="text-[10px] font-mono truncate font-semibold">
                          {ch.recordCount} rec
                        </div>

                        {/* Processing progress bar overlay */}
                        {isProcessing && (
                          <div className="w-full bg-indigo-100 h-1 rounded-full overflow-hidden mt-1">
                            <div className="bg-indigo-600 h-full transition-all" style={{ width: `${ch.progressPct}%` }} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Processing</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" /> Queued</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> DLQ Error</span>
              </div>

              {/* Chunk Inspector Card if selected */}
              {selectedChunk && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 font-mono">
                    <span>Chunk Details: #{selectedChunk.chunkIndex} ({selectedChunk.chunkId})</span>
                    <button onClick={() => setSelectedChunk(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
                    <div>Row Range: <span className="text-slate-900 font-bold">{selectedChunk.startRow} - {selectedChunk.endRow}</span></div>
                    <div>Record Count: <span className="text-slate-900 font-bold">{selectedChunk.recordCount}</span></div>
                    <div>Assigned Pod: <span className="text-indigo-600 font-bold">{selectedChunk.assignedWorker}</span></div>
                    <div>Status: <span className={`font-bold ${selectedChunk.status === 'Failed_DLQ' ? 'text-rose-600' : 'text-emerald-600'}`}>{selectedChunk.status}</span></div>
                  </div>
                  {selectedChunk.errorReason && (
                    <div className="p-2 rounded bg-rose-50 border border-rose-200 text-[10px] text-rose-800 font-mono">
                      <strong>Exception:</strong> {selectedChunk.errorReason}
                    </div>
                  )}
                  {selectedChunk.status === 'Failed_DLQ' && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRetrySingleChunk(selectedQueue.id, selectedChunk.chunkId)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry Chunk Subset</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKER PODS CLUSTER MAP & AUTOSCALING CONTROLLER */}
      {activeTab === 'workers' && (
        <div className="space-y-5">
          {/* Autoscaling Controller Control Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                    <Cpu className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      Autoscaling Controller &amp; Worker Pod Orchestrator
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        {activeWorkersCount} Pods Active
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Real-time Kubernetes pod auto-scaling engine with smooth layout transitions during scale-up and scale-down events.
                    </p>
                  </div>
                </div>
              </div>

              {/* View Mode & Auto-Scaler Toggles */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Auto-Scaler Switch */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !autoScaleEnabled;
                    setAutoScaleEnabled(next);
                    addLog('INFO', `Autoscaling Controller policy ${next ? 'ENABLED' : 'DISABLED'}.`);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    autoScaleEnabled
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${autoScaleEnabled ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
                  <span>Autoscaler: {autoScaleEnabled ? 'ACTIVE' : 'OFF'}</span>
                </button>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
                  <button
                    onClick={() => setPodViewMode('grid')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      podViewMode === 'grid'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Card Grid</span>
                  </button>
                  <button
                    onClick={() => setPodViewMode('topology')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      podViewMode === 'topology'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>Topology Map</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Autoscaling Action Triggers & Scenario Simulator */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Manual Scale Controls:</span>
                <button
                  type="button"
                  onClick={() => handleScaleWorkers(-8, 'Manual Scale Down Trigger (-8 Pods)')}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowDown className="w-3 h-3 text-amber-600" /> -8 Pods
                </button>
                <button
                  type="button"
                  onClick={() => handleScaleWorkers(-4, 'Manual Scale Down Trigger (-4 Pods)')}
                  className="px-2.5 py-1 bg-amber-50/70 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowDown className="w-3 h-3 text-amber-600" /> -4 Pods
                </button>
                <button
                  type="button"
                  onClick={() => handleScaleWorkers(4, 'Manual Scale Up Trigger (+4 Pods)')}
                  className="px-2.5 py-1 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowUp className="w-3 h-3 text-emerald-600" /> +4 Pods
                </button>
                <button
                  type="button"
                  onClick={() => handleScaleWorkers(8, 'Manual Scale Up Trigger (+8 Pods)')}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowUp className="w-3 h-3 text-emerald-600" /> +8 Pods
                </button>
              </div>

              {/* Workload Simulation Shortcuts */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQueueBacklog((prev) => prev + 1500000);
                    handleScaleWorkers(8, 'Simulated Workload Spike (+1.5M Queue Backlog)');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Simulate Traffic Surge (+1.5M)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQueueBacklog(450000);
                    handleScaleWorkers(-4, 'Simulated Workload Drain (Backlog < 500K records)');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
                >
                  <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>Simulate Workload Drain</span>
                </button>
              </div>
            </div>
          </div>

          {/* Proactive Scale Event Notification Banner */}
          <AnimatePresence mode="wait">
            {lastScalingEvent && (
              <motion.div
                key={lastScalingEvent.id}
                initial={{ opacity: 0, y: -15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className={`p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  lastScalingEvent.type === 'SCALE_UP'
                    ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-emerald-500/5 border-emerald-300/80 text-emerald-950'
                    : 'bg-gradient-to-r from-amber-500/10 via-amber-50 to-amber-500/5 border-amber-300/80 text-amber-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`p-2.5 rounded-xl border shrink-0 ${
                    lastScalingEvent.type === 'SCALE_UP'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                      : 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                  }`}>
                    {lastScalingEvent.type === 'SCALE_UP' ? (
                      <TrendingUp className="w-5 h-5 animate-bounce" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-extrabold text-sm">
                        AUTOSCALE CONTROLLER: {lastScalingEvent.type === 'SCALE_UP' ? 'SCALE UP EVENT' : 'SCALE DOWN EVENT'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        lastScalingEvent.type === 'SCALE_UP'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}>
                        {lastScalingEvent.type === 'SCALE_UP' ? `+${lastScalingEvent.delta} PODS` : `${lastScalingEvent.delta} PODS`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-0.5 font-medium">
                      {lastScalingEvent.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center font-mono text-xs border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Cluster Transition</span>
                    <span className="font-extrabold text-slate-900">
                      {lastScalingEvent.previousCount} Pods → <span className={lastScalingEvent.type === 'SCALE_UP' ? 'text-emerald-700' : 'text-amber-700'}>{lastScalingEvent.newCount} Pods</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-white/80 px-2 py-1 rounded border border-slate-200">
                    {lastScalingEvent.timestamp}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* VIEW 1: DETAILED POD CARDS GRID WITH MOTION LAYOUT ANIMATIONS */}
          {podViewMode === 'grid' && (
            <AnimatePresence mode="popLayout">
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {workerPods.map((pod) => (
                  <motion.div
                    key={pod.id}
                    layout
                    initial={{ opacity: 0, scale: 0.7, y: 25 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7, y: -25 }}
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 25,
                      mass: 0.8,
                    }}
                    className={`p-4 rounded-2xl border shadow-2xs space-y-3 relative overflow-hidden transition-shadow hover:shadow-md ${
                      pod.isNewlyProvisioned
                        ? 'bg-gradient-to-b from-indigo-50/90 to-white border-indigo-300 ring-2 ring-indigo-200/60'
                        : 'bg-white border-slate-200/80'
                    }`}
                  >
                    {/* Top Pod Title & Status Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg border ${
                          pod.isNewlyProvisioned
                            ? 'bg-indigo-600 text-white border-indigo-700'
                            : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                          <Server className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs text-slate-900">{pod.name}</h4>
                            {pod.isNewlyProvisioned && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                                PROVISIONED
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{pod.status}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        pod.cpuUsagePct > 75
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {pod.cpuUsagePct}% CPU
                      </span>
                    </div>

                    {/* Pod Metrics */}
                    <div className="space-y-1 font-mono text-[11px] text-slate-600">
                      <div className="flex justify-between">
                        <span>Memory Heap:</span>
                        <strong className="text-slate-900">{pod.memoryUsageMb} MB</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Stream:</span>
                        <strong className="text-indigo-600 truncate max-w-[110px]">{pod.currentJobName || 'Idle'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Throughput:</span>
                        <strong className="text-emerald-600 font-bold">{pod.rps} rec/s</strong>
                      </div>
                    </div>

                    {/* CPU Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>CPU Load</span>
                        <span>{pod.cpuUsagePct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            pod.cpuUsagePct > 75 ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${pod.cpuUsagePct}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* VIEW 2: COMPACT WORKER POD TOPOLOGY CLUSTER MAP */}
          {podViewMode === 'topology' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-bold text-xs text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-600" />
                  Cluster Topology Node Matrix ({activeWorkersCount} Worker Pods)
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Live Kubernetes Pod Mesh
                </span>
              </div>

              <AnimatePresence mode="popLayout">
                <motion.div
                  layout
                  className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
                >
                  {workerPods.map((pod) => (
                    <motion.div
                      key={`topo-${pod.id}`}
                      layout
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                      className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-colors relative group ${
                        pod.isNewlyProvisioned
                          ? 'bg-indigo-50/90 border-indigo-300 text-indigo-900 ring-2 ring-indigo-200/60'
                          : pod.cpuUsagePct > 75
                          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                          : 'bg-slate-50/80 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono font-extrabold">
                        <span>P-{pod.id.replace('worker-', '')}</span>
                        <span className={`w-2 h-2 rounded-full ${
                          pod.cpuUsagePct > 75 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                        }`} />
                      </div>

                      <div className="text-[11px] font-mono font-bold truncate">
                        {pod.cpuUsagePct}% CPU
                      </div>

                      <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pod.cpuUsagePct > 75 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                          style={{ width: `${pod.cpuUsagePct}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEAD-LETTER QUEUE (DLQ) & REMEDIATION */}
      {activeTab === 'dlq' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Dead-Letter Queue (DLQ) Exceptions &amp; Replay
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Inspect records that triggered validation errors or constraint collisions. Replay into batch queue after fixing payload.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 font-bold text-xs rounded-lg font-mono">
              {dlqItems.filter((d) => d.status === 'Unresolved').length} Unresolved Errors
            </span>
          </div>

          <OverflowTableWrapper hintLabel="Scroll horizontally to inspect dead letter queue records">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase font-mono">
                  <th className="py-3 px-4">Error ID</th>
                  <th className="py-3 px-4">Job / Queue</th>
                  <th className="py-3 px-4">Error Code</th>
                  <th className="py-3 px-4">Exception Reason</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {dlqItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.id}</td>
                    <td className="py-3 px-4 text-slate-600">{item.jobName}</td>
                    <td className="py-3 px-4 text-rose-600 font-bold">{item.errorCode}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{item.errorMessage}</td>
                    <td className="py-3 px-4">{item.retryAttempts}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'Unresolved' ? (
                          <>
                            <button
                              onClick={() => handleReplayDlqItem(item)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Replay</span>
                            </button>
                            <button
                              onClick={() => handlePurgeDlqItem(item.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg text-xs cursor-pointer transition-colors border border-slate-200 hover:border-rose-200"
                            >
                              Purge
                            </button>
                          </>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Replayed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </OverflowTableWrapper>
        </div>
      )}

      {/* TAB 4: BATCH SCHEDULER STUDIO */}
      {activeTab === 'schedule' && (
        <BatchSchedulerStudio jobs={jobsForScheduler} setJobs={setJobsForScheduler} />
      )}

      {/* TAB 5: LIVE EXECUTION TERMINAL */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-sans">
              <Terminal className="w-4 h-4 text-indigo-600" />
              Real-time Batch Engine Console Output
            </div>

            <div className="flex items-center gap-2">
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="bg-slate-50 text-xs text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ALL">All Log Levels</option>
                <option value="INFO">INFO Only</option>
                <option value="COMMIT">COMMIT Only</option>
                <option value="WARN">WARN Only</option>
                <option value="ERROR">ERROR Only</option>
              </select>

              <button
                onClick={() => setTerminalLogs([])}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg border border-slate-200 cursor-pointer transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div
            ref={logContainerRef}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 h-80 overflow-y-auto space-y-1.5 text-xs leading-relaxed text-slate-800 font-mono shadow-inner"
          >
            {filteredLogs.map((l) => (
              <div key={l.id} className="flex items-start gap-2 py-0.5 hover:bg-slate-100/70 px-1.5 rounded transition-colors">
                <span className="text-slate-400 text-[10px] shrink-0 mt-0.5">{l.time}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                  l.level === 'COMMIT'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : l.level === 'WARN'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : l.level === 'ERROR'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                }`}>
                  {l.level}
                </span>
                <span className="text-slate-800 font-medium">{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: DATA COMPRESSION LAYER FOR 45+ TB DATASETS */}
      {activeTab === 'compression' && (
        <DataCompressionLayer
          uncompressedTotalTb={48.6}
          globalRps={globalThroughputRps}
          onApplyProfileToEngine={(algo, ratio) => {
            setActiveCompressionAlgo(algo);
            setActiveCompressionRatio(ratio);
            addLog('INFO', `Data Compression Layer updated to [${algo}] (${ratio.toFixed(2)}x payload size reduction ratio).`);
          }}
        />
      )}

      {/* NEW BATCH JOB MODAL */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Dispatch New High-Volume Batch Stream
              </h3>
              <button onClick={() => setIsNewJobModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewJob} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Queue Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Inventory Delta Stream"
                  value={newJobForm.name}
                  onChange={(e) => setNewJobForm({ ...newJobForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Entity Name</label>
                <input
                  type="text"
                  required
                  value={newJobForm.entityName}
                  onChange={(e) => setNewJobForm({ ...newJobForm, entityName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Record Count</label>
                  <input
                    type="number"
                    value={newJobForm.totalRecords}
                    onChange={(e) => setNewJobForm({ ...newJobForm, totalRecords: parseInt(e.target.value) || 100000 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chunk Size (Records)</label>
                  <input
                    type="number"
                    value={newJobForm.chunkSize}
                    onChange={(e) => setNewJobForm({ ...newJobForm, chunkSize: parseInt(e.target.value) || 5000 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs transition-colors"
                >
                  Dispatch Batch Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchProcessingEngineView;
