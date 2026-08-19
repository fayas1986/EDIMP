import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileSpreadsheet,
  Zap,
  RotateCw,
  Clock,
  ShieldCheck,
  Compass,
  ArrowRight,
  Database,
  BarChart3,
  Calendar,
  Filter,
  Activity,
  UserCheck,
  Server,
  Play
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Pipeline interfaces
interface PipelineConfig {
  id: string;
  name: string;
  source: string;
  destination: string;
  baseAccuracy: number;
  baseCompleteness: number;
  baseConsistency: number;
  baseTimeliness: number;
  totalRecords: number;
  quarantined: number;
  cleansed: number;
}

const INITIAL_PIPELINES: PipelineConfig[] = [
  {
    id: 'pipe-crm',
    name: 'Customer Records Sync',
    source: 'PostgreSQL CRM',
    destination: 'Snowflake DW',
    baseAccuracy: 99.4,
    baseCompleteness: 98.7,
    baseConsistency: 99.1,
    baseTimeliness: 99.8,
    totalRecords: 125430,
    quarantined: 142,
    cleansed: 2435
  },
  {
    id: 'pipe-inv',
    name: 'Inventory Ledger Pipeline',
    source: 'MS SQL Inventory',
    destination: 'Apache Kafka Bus',
    baseAccuracy: 98.2,
    baseCompleteness: 96.5,
    baseConsistency: 97.4,
    baseTimeliness: 98.9,
    totalRecords: 843210,
    quarantined: 1245,
    cleansed: 12903
  },
  {
    id: 'pipe-fin',
    name: 'Financial Ledgers Archive',
    source: 'Oracle Finance',
    destination: 'AWS S3 Lakehouse',
    baseAccuracy: 99.9,
    baseCompleteness: 99.8,
    baseConsistency: 99.6,
    baseTimeliness: 95.2,
    totalRecords: 45210,
    quarantined: 8,
    cleansed: 412
  },
  {
    id: 'pipe-erp',
    name: 'Enterprise S&P Integration',
    source: 'SAP S/4HANA Ledger',
    destination: 'Salesforce CRM',
    baseAccuracy: 94.2,
    baseCompleteness: 91.5,
    baseConsistency: 93.8,
    baseTimeliness: 92.1,
    totalRecords: 67120,
    quarantined: 1845,
    cleansed: 5890
  },
  {
    id: 'pipe-pay',
    name: 'Transactional Audit Stream',
    source: 'MongoDB Payments',
    destination: 'Postgres Replica',
    baseAccuracy: 99.8,
    baseCompleteness: 99.9,
    baseConsistency: 99.7,
    baseTimeliness: 99.9,
    totalRecords: 3120500,
    quarantined: 210,
    cleansed: 11450
  }
];

interface IncidentLog {
  id: string;
  timestamp: string;
  severity: 'Warning' | 'Error' | 'Info';
  ruleType: string;
  fieldName: string;
  message: string;
  impactedRows: number;
  status: 'Investigated' | 'Resolved' | 'Auto-Healed' | 'Ignored';
}

const INITIAL_INCIDENTS: Record<string, IncidentLog[]> = {
  'pipe-crm': [
    {
      id: 'inc-1',
      timestamp: '2026-08-09T08:15:00-07:00',
      severity: 'Warning',
      ruleType: 'Email Format',
      fieldName: 'Contact_Email',
      message: 'Leading/trailing whitespaces and unstandardized domain capitalization detected.',
      impactedRows: 142,
      status: 'Auto-Healed'
    },
    {
      id: 'inc-2',
      timestamp: '2026-08-09T04:20:00-07:00',
      severity: 'Error',
      ruleType: 'Referential Integrity',
      fieldName: 'Salesperson_Code',
      message: 'Value Code JS-102 did not resolve against Salesforce CRM lookup dictionary.',
      impactedRows: 15,
      status: 'Resolved'
    },
    {
      id: 'inc-3',
      timestamp: '2026-08-08T18:10:00-07:00',
      severity: 'Warning',
      ruleType: 'Phone standardizer',
      fieldName: 'Contact_Phone',
      message: 'Non-E.164 formatted contact numbers standardizer auto-applied formatting rules.',
      impactedRows: 822,
      status: 'Auto-Healed'
    }
  ],
  'pipe-inv': [
    {
      id: 'inc-4',
      timestamp: '2026-08-09T07:11:00-07:00',
      severity: 'Warning',
      ruleType: 'Completeness check',
      fieldName: 'Location_Code',
      message: 'Null value found. Defaulted to fallback location WH-01.',
      impactedRows: 421,
      status: 'Auto-Healed'
    },
    {
      id: 'inc-5',
      timestamp: '2026-08-08T22:30:00-07:00',
      severity: 'Error',
      ruleType: 'Data Type constraint',
      fieldName: 'Quantity_On_Hand',
      message: 'Negative integers parsed. Flagged as out-of-range quarantine.',
      impactedRows: 34,
      status: 'Investigated'
    }
  ],
  'pipe-fin': [
    {
      id: 'inc-6',
      timestamp: '2026-08-09T02:10:00-07:00',
      severity: 'Warning',
      ruleType: 'SLA Limit',
      fieldName: 'Timeliness',
      message: 'Micro-batch file load delayed by 8.5 minutes due to AWS S3 upload latency spike.',
      impactedRows: 1,
      status: 'Resolved'
    }
  ],
  'pipe-erp': [
    {
      id: 'inc-7',
      timestamp: '2026-08-09T09:02:00-07:00',
      severity: 'Error',
      ruleType: 'Mandatory Value',
      fieldName: 'Tax_Registration_Number',
      message: 'Missing VAT/Tax Registration Code on high-limit corporate accounts.',
      impactedRows: 812,
      status: 'Investigated'
    },
    {
      id: 'inc-8',
      timestamp: '2026-08-09T06:14:00-07:00',
      severity: 'Error',
      ruleType: 'Currency Format',
      fieldName: 'Credit_Limit_Usd',
      message: 'Parsed currency symbols ($) inside numeric payload block.',
      impactedRows: 1450,
      status: 'Auto-Healed'
    },
    {
      id: 'inc-9',
      timestamp: '2026-08-08T14:45:00-07:00',
      severity: 'Warning',
      ruleType: 'Domain Constraints',
      fieldName: 'Payment_Terms_Code',
      message: 'Terms code NET120 exceeds max corporate business guidelines limit of NET90.',
      impactedRows: 231,
      status: 'Ignored'
    }
  ],
  'pipe-pay': [
    {
      id: 'inc-10',
      timestamp: '2026-08-09T01:30:00-07:00',
      severity: 'Warning',
      ruleType: 'Hash Validation',
      fieldName: 'Transaction_Token',
      message: 'Change stream token formatting issues. Standardized to hex string.',
      impactedRows: 210,
      status: 'Auto-Healed'
    }
  ]
};

export const DataQualityScorecard: React.FC = () => {
  const [pipelines, setPipelines] = useState<PipelineConfig[]>(INITIAL_PIPELINES);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('pipe-crm');
  const [timeWindow, setTimeWindow] = useState<'24h' | '7d' | '30d'>('7d');
  const [incidents, setIncidents] = useState<Record<string, IncidentLog[]>>(INITIAL_INCIDENTS);
  
  // Simulation states
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [anomalySpikeActive, setAnomalySpikeActive] = useState<Record<string, boolean>>({});
  const [showNotification, setShowNotification] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Active selected pipeline data
  const currentPipeline = useMemo(() => {
    return pipelines.find(p => p.id === selectedPipelineId) || pipelines[0];
  }, [pipelines, selectedPipelineId]);

  // Current incident logs
  const currentIncidents = useMemo(() => {
    return incidents[selectedPipelineId] || [];
  }, [incidents, selectedPipelineId]);

  // Handle auto-clearing notification
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => setShowNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  // Generate historical data based on pipeline + timeWindow + current metric adjustments
  const historicalData = useMemo(() => {
    const pointsCount = timeWindow === '24h' ? 12 : timeWindow === '7d' ? 7 : 30;
    const data: any[] = [];
    
    const accuracyVal = currentPipeline.baseAccuracy;
    const completenessVal = currentPipeline.baseCompleteness;
    const consistencyVal = currentPipeline.baseConsistency;
    const timelinessVal = currentPipeline.baseTimeliness;

    for (let i = pointsCount - 1; i >= 0; i--) {
      let dateLabel = '';
      if (timeWindow === '24h') {
        dateLabel = `${i * 2}h ago`;
      } else if (timeWindow === '7d') {
        dateLabel = i === 0 ? 'Today' : `${i}d ago`;
      } else {
        dateLabel = i === 0 ? 'Today' : `${i}d ago`;
      }

      // Add a small randomized trend
      const progressFactor = (pointsCount - i) / pointsCount;
      const wave = Math.sin(progressFactor * Math.PI * 2) * 0.4;
      
      // Calculate random noise
      let accuracyNoise = (Math.sin(i) * 0.3) + wave;
      let completenessNoise = (Math.cos(i) * 0.4) + wave;
      let consistencyNoise = (Math.sin(i * 1.5) * 0.2) + wave;
      let timelinessNoise = (Math.cos(i * 2) * 0.3) + wave;

      // Drop metrics if anomaly spike is currently active for this pipeline
      if (anomalySpikeActive[selectedPipelineId] && i === 0) {
        accuracyNoise -= 14.5;
        completenessNoise -= 18.2;
        consistencyNoise -= 11.4;
        timelinessNoise -= 5.1;
      }

      const acc = Math.min(100, Math.max(50, Number((accuracyVal + accuracyNoise).toFixed(2))));
      const comp = Math.min(100, Math.max(50, Number((completenessVal + completenessNoise).toFixed(2))));
      const cons = Math.min(100, Math.max(50, Number((consistencyVal + consistencyNoise).toFixed(2))));
      const timeL = Math.min(100, Math.max(50, Number((timelinessVal + timelinessNoise).toFixed(2))));
      
      const overall = Number(((acc + comp + cons + timeL) / 4).toFixed(2));

      data.push({
        name: dateLabel,
        Accuracy: acc,
        Completeness: comp,
        Consistency: cons,
        Timeliness: timeL,
        Overall: overall
      });
    }

    return data;
  }, [currentPipeline, timeWindow, anomalySpikeActive, selectedPipelineId]);

  // Overall statistics
  const currentOverallScore = useMemo(() => {
    const lastData = historicalData[historicalData.length - 1];
    return lastData ? lastData.Overall : 98.0;
  }, [historicalData]);

  // Category error distribution mock data (derived based on accuracy & pipeline quality)
  const categoryErrorDistribution = useMemo(() => {
    const factor = anomalySpikeActive[selectedPipelineId] ? 3.5 : 1.0;
    switch (selectedPipelineId) {
      case 'pipe-crm':
        return [
          { name: 'Formatting', errors: Math.floor(245 * factor), color: '#6366f1' },
          { name: 'Missing Required', errors: Math.floor(112 * factor), color: '#3b82f6' },
          { name: 'Referential Check', errors: Math.floor(45 * factor), color: '#f59e0b' },
          { name: 'Duplicate Keys', errors: Math.floor(88 * factor), color: '#ef4444' }
        ];
      case 'pipe-inv':
        return [
          { name: 'Formatting', errors: Math.floor(1040 * factor), color: '#6366f1' },
          { name: 'Missing Required', errors: Math.floor(820 * factor), color: '#3b82f6' },
          { name: 'Referential Check', errors: Math.floor(180 * factor), color: '#f59e0b' },
          { name: 'Duplicate Keys', errors: Math.floor(390 * factor), color: '#ef4444' }
        ];
      case 'pipe-fin':
        return [
          { name: 'Formatting', errors: Math.floor(24 * factor), color: '#6366f1' },
          { name: 'Missing Required', errors: Math.floor(8 * factor), color: '#3b82f6' },
          { name: 'Referential Check', errors: Math.floor(15 * factor), color: '#f59e0b' },
          { name: 'Duplicate Keys', errors: Math.floor(0 * factor), color: '#ef4444' }
        ];
      case 'pipe-erp':
        return [
          { name: 'Formatting', errors: Math.floor(1890 * factor), color: '#6366f1' },
          { name: 'Missing Required', errors: Math.floor(2140 * factor), color: '#3b82f6' },
          { name: 'Referential Check', errors: Math.floor(1100 * factor), color: '#f59e0b' },
          { name: 'Duplicate Keys', errors: Math.floor(750 * factor), color: '#ef4444' }
        ];
      case 'pipe-pay':
      default:
        return [
          { name: 'Formatting', errors: Math.floor(180 * factor), color: '#6366f1' },
          { name: 'Missing Required', errors: Math.floor(25 * factor), color: '#3b82f6' },
          { name: 'Referential Check', errors: Math.floor(5 * factor), color: '#f59e0b' },
          { name: 'Duplicate Keys', errors: Math.floor(20 * factor), color: '#ef4444' }
        ];
    }
  }, [selectedPipelineId, anomalySpikeActive]);

  // Run audit simulation
  const handleRunAudit = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditProgress(0);

    const interval = setInterval(() => {
      setAuditProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAuditing(false);
          
          // Complete audit - maybe fluctuate metrics slightly
          setPipelines(prevPipes => prevPipes.map(p => {
            if (p.id === selectedPipelineId) {
              const changeAcc = (Math.random() - 0.5) * 0.4;
              const changeComp = (Math.random() - 0.5) * 0.3;
              return {
                ...p,
                baseAccuracy: Math.min(100, Math.max(80, p.baseAccuracy + changeAcc)),
                baseCompleteness: Math.min(100, Math.max(80, p.baseCompleteness + changeComp)),
                totalRecords: p.totalRecords + Math.floor(Math.random() * 2500 + 400)
              };
            }
            return p;
          }));

          setShowNotification({
            type: 'success',
            message: `Quality audit for "${currentPipeline.name}" completed successfully. 4 audit dimensions verified across full payload.`
          });

          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // Inject Anomaly Anomaly
  const handleInjectAnomaly = () => {
    setAnomalySpikeActive(prev => ({ ...prev, [selectedPipelineId]: true }));
    
    // Add custom dirty pipeline logs
    const now = new Date().toISOString();
    const newIncidents: IncidentLog[] = [
      {
        id: `inc-spike-${Date.now()}-1`,
        timestamp: now,
        severity: 'Error',
        ruleType: 'Null Violation',
        fieldName: 'Street_Address_1',
        message: 'CRITICAL CONGESTION: Massive payload spike with null primary shipping destinations detected on source broker stream.',
        impactedRows: Math.floor(currentPipeline.totalRecords * 0.12),
        status: 'Investigated'
      },
      {
        id: `inc-spike-${Date.now()}-2`,
        timestamp: now,
        severity: 'Warning',
        ruleType: 'Completeness',
        fieldName: 'Contact_Phone',
        message: 'Empty and un-parseable contact phone records detected from bulk batch import.',
        impactedRows: Math.floor(currentPipeline.totalRecords * 0.08),
        status: 'Investigated'
      }
    ];

    setIncidents(prev => ({
      ...prev,
      [selectedPipelineId]: [ ...newIncidents, ...(prev[selectedPipelineId] || []) ]
    }));

    // Update pipeline counters
    setPipelines(prev => prev.map(p => {
      if (p.id === selectedPipelineId) {
        return {
          ...p,
          quarantined: p.quarantined + Math.floor(p.totalRecords * 0.05),
          baseAccuracy: p.baseAccuracy - 4.5,
          baseCompleteness: p.baseCompleteness - 6.2
        };
      }
      return p;
    }));

    setShowNotification({
      type: 'warning',
      message: `Quality Anomaly Spike Injected! High rates of null field violations and un-parseable contact data reported on "${currentPipeline.name}".`
    });
  };

  // Apply cleansing auto-fix
  const handleApplyCleansing = () => {
    const isSpikeActive = anomalySpikeActive[selectedPipelineId];
    setAnomalySpikeActive(prev => ({ ...prev, [selectedPipelineId]: false }));

    // Reset metrics back to premium values
    setPipelines(prev => prev.map(p => {
      if (p.id === selectedPipelineId) {
        const original = INITIAL_PIPELINES.find(orig => orig.id === selectedPipelineId)!;
        return {
          ...p,
          baseAccuracy: original.baseAccuracy,
          baseCompleteness: original.baseCompleteness,
          baseConsistency: original.baseConsistency,
          baseTimeliness: original.baseTimeliness,
          cleansed: p.cleansed + (isSpikeActive ? Math.floor(p.totalRecords * 0.07) : 150)
        };
      }
      return p;
    }));

    // Update incident status
    setIncidents(prev => {
      const pIncidents = prev[selectedPipelineId] || [];
      const updated = pIncidents.map(inc => {
        if (inc.status === 'Investigated') {
          return { ...inc, status: 'Auto-Healed' as const };
        }
        return inc;
      });
      return { ...prev, [selectedPipelineId]: updated };
    });

    setShowNotification({
      type: 'success',
      message: `Automated pre-flight cleansing heuristics successfully applied. Dynamic trimmer, E.164 phone standardizer, and null-default routines resolved ${isSpikeActive ? 'all active bottlenecks' : 'minor data issues'}.`
    });
  };

  // Mock download report
  const handleDownloadReport = () => {
    setShowNotification({
      type: 'info',
      message: `Generating printable PDF Data Quality Audit Ledger for "${currentPipeline.name}"... Saved to downloads.`
    });
  };

  // Scoring pill color utilities
  const getScoreColor = (score: number) => {
    if (score >= 98) return { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', textLight: 'text-emerald-500', bar: 'bg-emerald-500' };
    if (score >= 95) return { text: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200', textLight: 'text-cyan-500', bar: 'bg-cyan-500' };
    if (score >= 90) return { text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', textLight: 'text-amber-500', bar: 'bg-amber-500' };
    return { text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', textLight: 'text-rose-500', bar: 'bg-rose-500' };
  };

  const getScoreRatingLabel = (score: number) => {
    if (score >= 98) return 'Sovereign (Excellent)';
    if (score >= 95) return 'Optimal (Robust)';
    if (score >= 90) return 'Warning (Sub-Optimal)';
    return 'Critical (High Risk)';
  };

  return (
    <div className="space-y-6" id="data-quality-scorecard-panel">
      
      {/* Alert Notifications Banner */}
      {showNotification && (
        <div 
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-md animate-fade-in transition-all ${
            showNotification.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : showNotification.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}
        >
          {showNotification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : showNotification.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <strong className="text-xs font-black uppercase tracking-wider block">
              {showNotification.type === 'success' ? 'Quality System Event' : showNotification.type === 'warning' ? 'Quality Breach Alert' : 'System Report'}
            </strong>
            <p className="text-xs font-medium leading-relaxed">{showNotification.message}</p>
          </div>
        </div>
      )}

      {/* Main Title bar and Controls */}
      <div className="bg-white text-slate-900 p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-5.5 h-5.5 text-indigo-600" />
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">
              Data Quality Scorecard Ledger
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            Audit four-dimensional data quality standards (Accuracy, Consistency, Completeness, and Timeliness) historically across production streams. Simulate anomalies, track error rates, and deploy auto-healing routines.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRunAudit}
            disabled={isAuditing}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isAuditing 
                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? `Auditing (${auditProgress}%)` : 'Verify Quality Audit'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export DQ Ledger</span>
          </button>
        </div>
      </div>

      {/* Pipeline Selector List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5" id="pipeline-scorecard-selector-strip">
        {pipelines.map((pipe) => {
          // Calculate average score dynamically
          const isSpike = anomalySpikeActive[pipe.id];
          const calculatedScore = isSpike
            ? Number(((pipe.baseAccuracy + pipe.baseCompleteness + pipe.baseConsistency + pipe.baseTimeliness - 37.2) / 4).toFixed(1))
            : Number(((pipe.baseAccuracy + pipe.baseCompleteness + pipe.baseConsistency + pipe.baseTimeliness) / 4).toFixed(1));

          const activeColors = getScoreColor(calculatedScore);
          const isSelected = pipe.id === selectedPipelineId;

          return (
            <div
              key={pipe.id}
              onClick={() => setSelectedPipelineId(pipe.id)}
              className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-28 relative ${
                isSelected 
                  ? 'bg-indigo-50/70 text-slate-900 border-indigo-600 shadow-2xs ring-2 ring-indigo-500/20 scale-[1.01]'
                  : 'bg-white text-slate-800 hover:bg-slate-50 border-slate-200 shadow-2xs'
              }`}
            >
              <div className="space-y-0.5">
                <span className={`text-[8px] font-black uppercase tracking-wider block ${isSelected ? 'text-indigo-700 font-bold' : 'text-slate-400 font-mono'}`}>
                  {pipe.source}
                </span>
                <strong className="text-[11px] font-extrabold truncate block leading-tight max-w-full text-slate-900">
                  {pipe.name}
                </strong>
              </div>

              <div className="flex items-end justify-between mt-2 pt-2 border-t border-dashed border-slate-200">
                <div>
                  <span className="text-[9px] text-slate-500 block font-mono">DQ Score</span>
                  <strong className={`text-base font-black ${activeColors.text}`}>
                    {calculatedScore}%
                  </strong>
                </div>

                <span className={`text-[8px] px-1.5 py-0.5 font-bold uppercase rounded-md border ${activeColors.bg} ${activeColors.text}`}>
                  {calculatedScore >= 98 ? 'Excel' : calculatedScore >= 95 ? 'Good' : 'Lag'}
                </span>
              </div>

              {isSpike && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Analysis Panel Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: 4 Metric Cards & Chart Telemetry (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Detailed 4-Metric Dials */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            
            {/* 1. Accuracy */}
            <div className="space-y-2 border-r border-slate-100 last:border-0 pr-4 sm:border-r">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">1. Accuracy</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-help" />
              </div>
              <div>
                <strong className="text-xl font-black text-slate-900 font-mono">
                  {(anomalySpikeActive[selectedPipelineId] ? currentPipeline.baseAccuracy - 4.5 : currentPipeline.baseAccuracy).toFixed(1)}%
                </strong>
                <span className="text-[9px] text-slate-400 block font-medium mt-0.5">Format Validation</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${getScoreColor(currentPipeline.baseAccuracy).bar}`} 
                  style={{ width: `${anomalySpikeActive[selectedPipelineId] ? currentPipeline.baseAccuracy - 4.5 : currentPipeline.baseAccuracy}%` }}
                />
              </div>
            </div>

            {/* 2. Completeness */}
            <div className="space-y-2 border-r border-slate-100 last:border-0 pr-4 sm:border-r">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">2. Completeness</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-help" />
              </div>
              <div>
                <strong className="text-xl font-black text-slate-900 font-mono">
                  {(anomalySpikeActive[selectedPipelineId] ? currentPipeline.baseCompleteness - 6.2 : currentPipeline.baseCompleteness).toFixed(1)}%
                </strong>
                <span className="text-[9px] text-slate-400 block font-medium mt-0.5">Null-Field Checks</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${getScoreColor(currentPipeline.baseCompleteness).bar}`} 
                  style={{ width: `${anomalySpikeActive[selectedPipelineId] ? currentPipeline.baseCompleteness - 6.2 : currentPipeline.baseCompleteness}%` }}
                />
              </div>
            </div>

            {/* 3. Consistency */}
            <div className="space-y-2 border-r border-slate-100 last:border-0 pr-4 sm:border-r">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">3. Consistency</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-help" />
              </div>
              <div>
                <strong className="text-xl font-black text-slate-900 font-mono">
                  {(anomalySpikeActive[selectedPipelineId] ? currentPipeline.baseConsistency - 5.4 : currentPipeline.baseConsistency).toFixed(1)}%
                </strong>
                <span className="text-[9px] text-slate-400 block font-medium mt-0.5">Referential Keys</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${getScoreColor(currentPipeline.baseConsistency).bar}`} 
                  style={{ width: `${anomalySpikeActive[selectedPipelineId] ? currentPipeline.baseConsistency - 5.4 : currentPipeline.baseConsistency}%` }}
                />
              </div>
            </div>

            {/* 4. Timeliness */}
            <div className="space-y-2 pr-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">4. Timeliness</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-help" />
              </div>
              <div>
                <strong className="text-xl font-black text-slate-900 font-mono">
                  {(anomalySpikeActive[selectedPipelineId] ? currentPipeline.baseTimeliness - 2.1 : currentPipeline.baseTimeliness).toFixed(1)}%
                </strong>
                <span className="text-[9px] text-slate-400 block font-medium mt-0.5">Processing SLA</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${getScoreColor(currentPipeline.baseTimeliness).bar}`} 
                  style={{ width: `${anomalySpikeActive[selectedPipelineId] ? currentPipeline.baseTimeliness - 2.1 : currentPipeline.baseTimeliness}%` }}
                />
              </div>
            </div>

          </div>

          {/* Time Series History Recharts Area */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  Quality Dimension Trends
                </h4>
                <p className="text-[10px] text-slate-400">
                  Tracking granular accuracy and completeness trends over time.
                </p>
              </div>

              {/* Time Window filters */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(['24h', '7d', '30d'] as const).map((win) => (
                  <button
                    key={win}
                    type="button"
                    onClick={() => setTimeWindow(win)}
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                      timeWindow === win
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {win === '24h' ? '24 Hours' : win === '7d' ? '7 Days' : '30 Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Line Graph */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={[70, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px', color: '#0f172a', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px', fontWeight: 'bold' }} />
                  <ReferenceLine y={95} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Target SLA Limit (95%)', fill: '#3b82f6', fontSize: 8, position: 'top' }} />
                  <Line type="monotone" dataKey="Accuracy" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Completeness" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Consistency" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Timeliness" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Overall" stroke="#0f172a" strokeWidth={2.5} strokeDasharray="3 3" name="Weighted overall" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Audit Logs and Incident tracking list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black uppercase text-slate-800">
                  Recent Quality Failures & Rules Audits
                </h4>
                <p className="text-[10px] text-slate-400">
                  Granular exception report on failed rows quarantined or auto-repaired.
                </p>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 font-mono font-bold">
                {currentIncidents.length} Failures Logged
              </span>
            </div>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {currentIncidents.length > 0 ? (
                currentIncidents.map((inc) => (
                  <div key={inc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-mono hover:bg-slate-100/50 transition">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase ${
                          inc.severity === 'Error'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : inc.severity === 'Warning'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {inc.severity}
                        </span>
                        <strong className="text-slate-800">{inc.ruleType}</strong>
                        <span className="text-slate-400">on field:</span>
                        <span className="bg-slate-200/80 px-1 rounded text-slate-700 font-bold">{inc.fieldName}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal font-sans font-medium">
                        {inc.message}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 gap-2">
                      <span className="text-[10px] text-slate-600 font-sans font-semibold">
                        Impacted: <strong>{inc.impactedRows.toLocaleString()} rows</strong>
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md ${
                        inc.status === 'Auto-Healed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : inc.status === 'Resolved'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : inc.status === 'Investigated'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {inc.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 space-y-1 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h5 className="font-extrabold text-xs text-slate-700">Perfect Quality Archive</h5>
                  <p className="text-[10px] text-slate-500">No rule failures or pipeline violations logged for this timeframe.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Interactive Simulation Hub, Category chart (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Simulation Tools Box */}
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider font-mono">
                Quality Studio Simulator
              </span>
              <h4 className="text-xs font-black text-slate-900 mt-0.5">
                Stress Test Pre-Flight Quality Engine
              </h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Manually trigger exceptions, ingest corrupt bulk records, and evaluate automated standardizer recovery speed.
              </p>
            </div>

            {/* Simulation Actions */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleInjectAnomaly}
                className="w-full py-2 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-[11px] font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                title="Inject dummy record payloads featuring invalid email structures, special character issues, and mismatched region lookups."
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Inject Anomaly Spike</span>
              </button>

              <button
                type="button"
                onClick={handleApplyCleansing}
                className="w-full py-2 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[11px] font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                title="Apply dynamic whitespace trim, E.164 phone logic, and country code standards."
              >
                <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Apply Auto-Fix Heuristics</span>
              </button>
            </div>

            {/* Diagnostic State Reading */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] font-mono leading-relaxed">
              <div className="text-slate-500 font-extrabold text-[9px] uppercase tracking-wider">Pipeline Health Diagnosis</div>
              <div className="flex items-center justify-between text-slate-900 text-xs font-bold pt-1">
                <span>Score Status:</span>
                <span className={getScoreColor(currentOverallScore).text}>{getScoreRatingLabel(currentOverallScore)}</span>
              </div>
              <p className="text-[10px] text-slate-600 leading-normal font-sans mt-1.5">
                {anomalySpikeActive[selectedPipelineId] 
                  ? 'CRITICAL EXCEPTION SPIKE active. Completeness and accuracy rules are heavily compromised by incoming unstandardized records. Apply Auto-Fix Heuristics to heal.'
                  : 'Overall pipeline quality aligns with regulatory frameworks. Data is validated, structured, and sanitized prior to replication.'
                }
              </p>
            </div>
          </div>

          {/* Error Category distribution Bar chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black uppercase text-slate-800">
                Rule Violation Distribution
              </h4>
              <p className="text-[10px] text-slate-400">
                Exceptions parsed by validation check categories.
              </p>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryErrorDistribution} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '10px', color: '#0f172a', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="errors" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Diagnostic stats list */}
            <div className="divide-y divide-slate-100 text-[10px] font-mono">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Total Rows Audited:</span>
                <strong className="text-slate-800">{currentPipeline.totalRecords.toLocaleString()}</strong>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Total Quarantined:</span>
                <strong className="text-rose-600 font-extrabold">{currentPipeline.quarantined.toLocaleString()}</strong>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Cleaned & Restored:</span>
                <strong className="text-emerald-600 font-extrabold">{currentPipeline.cleansed.toLocaleString()}</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
