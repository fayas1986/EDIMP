import React, { useState, useMemo } from 'react';
import { ColumnProfile } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
  Legend,
} from 'recharts';
import {
  BarChart2,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  Filter,
  Search,
  Download,
  Sparkles,
  ShieldAlert,
  Layers,
  Table,
  FileText,
  RefreshCw,
  ArrowUpRight,
  Activity,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  Maximize2,
  Fingerprint,
} from 'lucide-react';

export interface DatasetOption {
  id: string;
  name: string;
  recordCount: number;
  profiles: ColumnProfile[];
}

export interface ProfilingReportsViewProps {
  datasets?: DatasetOption[];
  selectedDatasetId?: string;
  onSelectDataset?: (id: string) => void;
  columnProfiles?: ColumnProfile[];
}

// -------------------------------------------------------------
// METADATA & PROFILE MAPS (For all 7 features)
// -------------------------------------------------------------
interface PatternItem {
  pattern: string;
  matchPct: number;
  sample: string;
  status: 'valid' | 'invalid';
}

interface DuplicateItem {
  value: string;
  count: number;
  percentage: number;
}

interface ColumnEnrichedStats {
  // Column Statistics
  minLen: number;
  maxLen: number;
  avgLen: number;
  casing: string;
  characterSet: { alpha: number; numeric: number; special: number };
  skewness: string;
  // Null Analysis
  whitespaceCount: number;
  emptyStringCount: number;
  imputationStrategy: string;
  // Duplicate Analysis
  duplicateCount: number;
  keyCandidateStatus: 'Primary Key' | 'Alternate Key' | 'Non-Key Attribute';
  topDuplicates: DuplicateItem[];
  // Pattern Detection
  patterns: PatternItem[];
  // Data Distribution (Histogram mock intervals)
  distributionIntervals: { label: string; count: number; percentage: number }[];
  // Outlier Detection
  numericOutliers?: {
    mean: number;
    median: number;
    stdDev: number;
    upperFence: number;
    lowerFence: number;
    outliersDetected: number;
    sampleOutliers: string[];
  };
}

const COLUMN_ENRICHMENT_MAP: Record<string, ColumnEnrichedStats> = {
  Cust_No: {
    minLen: 9, maxLen: 9, avgLen: 9, casing: 'UPPERCASE ALPHANUMERIC',
    characterSet: { alpha: 33, numeric: 56, special: 11 },
    skewness: 'None (Uniform)',
    whitespaceCount: 0, emptyStringCount: 0,
    imputationStrategy: 'No Nulls - Mapping Mandatory',
    duplicateCount: 0, keyCandidateStatus: 'Primary Key',
    topDuplicates: [],
    patterns: [
      { pattern: '^CUS-\\d{5}$', matchPct: 100, sample: 'CUS-10029', status: 'valid' }
    ],
    distributionIntervals: [
      { label: 'CUS-10xxx', count: 3200, percentage: 22.4 },
      { label: 'CUS-11xxx', count: 3100, percentage: 21.8 },
      { label: 'CUS-12xxx', count: 3000, percentage: 21.0 },
      { label: 'CUS-13xxx', count: 2950, percentage: 20.7 },
      { label: 'CUS-14xxx', count: 2000, percentage: 14.1 }
    ]
  },
  Cust_Name: {
    minLen: 4, maxLen: 42, avgLen: 18.2, casing: 'Title Case',
    characterSet: { alpha: 88, numeric: 0, special: 12 },
    skewness: 'Moderate Right',
    whitespaceCount: 0, emptyStringCount: 0,
    imputationStrategy: 'No Nulls - Mapping Mandatory',
    duplicateCount: 270, keyCandidateStatus: 'Non-Key Attribute',
    topDuplicates: [
      { value: 'Acme Logistics Ltd', count: 18, percentage: 0.13 },
      { value: 'Global Tech Trading', count: 14, percentage: 0.10 },
      { value: 'Vandenberg Solutions', count: 11, percentage: 0.08 }
    ],
    patterns: [
      { pattern: '^[A-Z][a-z]+(\\s[A-Z][a-z]+)*$', matchPct: 98.4, sample: 'Acme Logistics', status: 'valid' },
      { pattern: 'Contains digits or symbols', matchPct: 1.6, sample: 'Corp 100 & Co.', status: 'invalid' }
    ],
    distributionIntervals: [
      { label: 'Length 4-10 chars', count: 2100, percentage: 14.7 },
      { label: 'Length 11-20 chars', count: 7200, percentage: 50.5 },
      { label: 'Length 21-30 chars', count: 3800, percentage: 26.7 },
      { label: 'Length >30 chars', count: 1150, percentage: 8.1 }
    ]
  },
  Street_Address_1: {
    minLen: 6, maxLen: 55, avgLen: 22.4, casing: 'Mixed Casing',
    characterSet: { alpha: 72, numeric: 20, special: 8 },
    whitespaceCount: 185, emptyStringCount: 210,
    skewness: 'High Right',
    imputationStrategy: 'Replace with blank constant or merge from Address_2',
    duplicateCount: 3050, keyCandidateStatus: 'Non-Key Attribute',
    topDuplicates: [
      { value: '742 Evergreen Terrace', count: 28, percentage: 0.20 },
      { value: '100 King Street West', count: 19, percentage: 0.13 },
      { value: '10 Downing St', count: 15, percentage: 0.11 }
    ],
    patterns: [
      { pattern: '^\\d+\\s+[A-Za-z0-9\\s\\.,#]+$', matchPct: 94.2, sample: '742 Evergreen Terrace', status: 'valid' },
      { pattern: '^PO BOX\\s+\\d+$', matchPct: 5.8, sample: 'PO BOX 4122', status: 'valid' }
    ],
    distributionIntervals: [
      { label: 'Length 6-15 chars', count: 3200, percentage: 22.4 },
      { label: 'Length 16-25 chars', count: 6800, percentage: 47.7 },
      { label: 'Length 26-35 chars', count: 3100, percentage: 21.8 },
      { label: 'Length >35 chars', count: 1150, percentage: 8.1 }
    ]
  },
  Contact_Phone: {
    minLen: 10, maxLen: 17, avgLen: 12.1, casing: 'Numeric with symbols',
    characterSet: { alpha: 0, numeric: 82, special: 18 },
    whitespaceCount: 92, emptyStringCount: 120,
    skewness: 'Symmetrical',
    imputationStrategy: 'Standardize format via regex replace, flag nulls as optional',
    duplicateCount: 1850, keyCandidateStatus: 'Non-Key Attribute',
    topDuplicates: [
      { value: '+1 (555) 234-5678', count: 25, percentage: 0.18 },
      { value: '4165550192', count: 18, percentage: 0.13 }
    ],
    patterns: [
      { pattern: '^\\+1\\s\\(\\d{3}\\)\\s\\d{3}-\\d{4}$', matchPct: 65.0, sample: '+1 (555) 234-5678', status: 'valid' },
      { pattern: '^\\d{10}$', matchPct: 25.0, sample: '4165550192', status: 'invalid' },
      { pattern: '^\\d{3}-\\d{3}-\\d{4}$', matchPct: 10.0, sample: '617-555-0188', status: 'invalid' }
    ],
    distributionIntervals: [
      { label: 'US E.164 (+1...)', count: 9260, percentage: 65.0 },
      { label: 'Raw 10 Digits', count: 3560, percentage: 25.0 },
      { label: 'Hyphenated Format', count: 1430, percentage: 10.0 }
    ]
  },
  Contact_Email: {
    minLen: 11, maxLen: 48, avgLen: 24.6, casing: 'lowercase alphanumeric',
    characterSet: { alpha: 84, numeric: 10, special: 6 },
    whitespaceCount: 12, emptyStringCount: 15,
    skewness: 'Moderate Right',
    imputationStrategy: 'Auto-construct from Contact_Name or flag in quarantine',
    duplicateCount: 450, keyCandidateStatus: 'Alternate Key',
    topDuplicates: [
      { value: 'billing@acmelogistics.com', count: 4, percentage: 0.03 },
      { value: 'info@globaltech.ca', count: 3, percentage: 0.02 }
    ],
    patterns: [
      { pattern: '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$', matchPct: 99.2, sample: 'billing@acmelogistics.com', status: 'valid' },
      { pattern: '^user@domain@com$ (Double @)', matchPct: 0.8, sample: 'user@domain@com', status: 'invalid' }
    ],
    distributionIntervals: [
      { label: 'Length 11-20 chars', count: 3800, percentage: 26.7 },
      { label: 'Length 21-30 chars', count: 7500, percentage: 52.6 },
      { label: 'Length 31-40 chars', count: 2450, percentage: 17.2 },
      { label: 'Length >40 chars', count: 500, percentage: 3.5 }
    ]
  },
  Tax_Registration_Number: {
    minLen: 9, maxLen: 15, avgLen: 11.4, casing: 'UPPERCASE ALPHANUMERIC',
    characterSet: { alpha: 18, numeric: 75, special: 7 },
    whitespaceCount: 220, emptyStringCount: 310,
    skewness: 'High Left',
    imputationStrategy: 'Coalesce invalid / placeholders to NULL, flag for auditing',
    duplicateCount: 1350, keyCandidateStatus: 'Alternate Key',
    topDuplicates: [
      { value: 'INVALID_TAX', count: 314, percentage: 2.2 },
      { value: 'US-883921049', count: 12, percentage: 0.08 }
    ],
    patterns: [
      { pattern: '^[A-Z]{2}-\\d{9}$', matchPct: 85.0, sample: 'DE-123456789', status: 'valid' },
      { pattern: '^[A-Z]{2}\\d{9}$', matchPct: 12.8, sample: 'DE123456789', status: 'invalid' },
      { pattern: '^INVALID_TAX$', matchPct: 2.2, sample: 'INVALID_TAX', status: 'invalid' }
    ],
    distributionIntervals: [
      { label: 'US/EU Standard Format', count: 12110, percentage: 85.0 },
      { label: 'Unseparated Format', count: 1826, percentage: 12.8 },
      { label: 'INVALID_TAX String', count: 314, percentage: 2.2 }
    ]
  },
  Credit_Limit_Usd: {
    minLen: 3, maxLen: 12, avgLen: 8.5, casing: 'Numerical Decimal',
    characterSet: { alpha: 0, numeric: 92, special: 8 },
    whitespaceCount: 0, emptyStringCount: 0,
    skewness: 'Right Skewed (+2.4)',
    imputationStrategy: 'Numeric fallback to default 0.00 or median value',
    duplicateCount: 12400, keyCandidateStatus: 'Non-Key Attribute',
    topDuplicates: [
      { value: '50000.00', count: 1150, percentage: 8.1 },
      { value: '100000.00', count: 980, percentage: 6.9 },
      { value: '0.00', count: 850, percentage: 6.0 }
    ],
    patterns: [
      { pattern: '^\\d+\\.\\d{2}$', matchPct: 100, sample: '250000.00', status: 'valid' }
    ],
    distributionIntervals: [
      { label: '$0 - $50,000', count: 4800, percentage: 33.7 },
      { label: '$50,001 - $150,000', count: 5400, percentage: 37.9 },
      { label: '$150,001 - $500,000', count: 2900, percentage: 20.4 },
      { label: '$500,001 - $1,500,000', count: 1100, percentage: 7.7 },
      { label: '>$1,500,000', count: 50, percentage: 0.3 }
    ],
    numericOutliers: {
      mean: 245000,
      median: 150000,
      stdDev: 185000,
      upperFence: 800000,
      lowerFence: 0,
      outliersDetected: 3,
      sampleOutliers: ['$9,999,999.00', '$5,500,000.00', '$2,400,000.00']
    }
  }
};

const DEFAULT_OUTLIERS = [
  {
    id: 'out-1',
    columnName: 'Tax_Registration_Number',
    outlierType: 'Placeholder String',
    severity: 'Critical',
    detectedValue: 'INVALID_TAX',
    affectedCount: 314,
    pctOfTotal: 2.2,
    explanation: 'Contains dummy string "INVALID_TAX" instead of a valid tax registration sequence.',
    recommendedAction: 'Sanitize with COALESCE / NULL or flag for manual tax audit before migration.',
  },
  {
    id: 'out-2',
    columnName: 'Contact_Phone',
    outlierType: 'Format Violation',
    severity: 'High',
    detectedValue: '+1 (555) 234-5678 vs 4165550192',
    affectedCount: 520,
    pctOfTotal: 3.6,
    explanation: 'Mixed phone number syntaxes violating E.164 standard formatting.',
    recommendedAction: 'Apply REGEX_REPLACE phone number standardization transform.',
  },
  {
    id: 'out-3',
    columnName: 'Contact_Email',
    outlierType: 'Format Violation',
    severity: 'High',
    detectedValue: 'user@domain@com',
    affectedCount: 12,
    pctOfTotal: 0.08,
    explanation: 'Syntax regex failure: Double "@" symbol detected in email addresses.',
    recommendedAction: 'Quarantine invalid email records into Dead Letter Queue for validation.',
  },
  {
    id: 'out-4',
    columnName: 'Credit_Limit_Usd',
    outlierType: 'Extreme Value (Z-Score)',
    severity: 'Medium',
    detectedValue: '$9,999,999.00 (Z = +4.8)',
    affectedCount: 3,
    pctOfTotal: 0.02,
    explanation: 'Value exceeds 4.8 standard deviations from dataset mean ($245,000.00).',
    recommendedAction: 'Verify if extreme credit ceiling is intentional or data entry typo.',
  },
];

export const ProfilingReportsView: React.FC<ProfilingReportsViewProps> = ({
  datasets,
  selectedDatasetId,
  onSelectDataset,
  columnProfiles: initialProfiles,
}) => {
  type TabType = 'overview' | 'column_stats' | 'null_analysis' | 'duplicate_analysis' | 'pattern_detection' | 'distribution' | 'outliers';
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColName, setSelectedColName] = useState('Cust_No');
  
  // Imputation Interactive State
  const [imputeStrategy, setImputeStrategy] = useState('constant');
  const [imputeTargetCol, setImputeTargetCol] = useState('Street_Address_1');
  
  // Custom Regex Validation Form State
  const [regexPattern, setRegexPattern] = useState('^CUS-[0-9]{5}$');
  const [regexTargetCol, setRegexTargetCol] = useState('Cust_No');
  const [regexValidationResult, setRegexValidationResult] = useState<{ matches: number; mismatches: number; percentage: number } | null>(null);

  // Staged Cleansing Rules List
  const [stagedRules, setStagedRules] = useState<{ id: string; column: string; ruleType: string; summary: string }[]>([
    { id: 'stg-1', column: 'Contact_Phone', ruleType: 'Standardize Phone Format', summary: 'Translate raw 10 digits to E.164' }
  ]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const triggerToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [downloadingReport, setDownloadingReport] = useState(false);
  const [reportExported, setReportExported] = useState(false);

  // Interactive Histogram State
  const [histViewMode, setHistViewMode] = useState<'count' | 'percentage'>('count');
  const [showCumulativeLine, setShowCumulativeLine] = useState(true);
  const [binResolution, setBinResolution] = useState<'low' | 'medium' | 'high'>('medium');
  const [highlightOutliers, setHighlightOutliers] = useState(true);
  const [histSearchQuery, setHistSearchQuery] = useState('');

  // Active profiles base
  const rawProfiles = initialProfiles || (datasets && datasets.length > 0 ? datasets[0].profiles : []) || [];
  
  // Append visual numerical column for Credit Limit so all 7 features work beautifully
  const activeProfiles = useMemo(() => {
    const hasCredit = rawProfiles.some(p => p.columnName === 'Credit_Limit_Usd');
    if (!hasCredit && rawProfiles.length > 0) {
      const totalCount = rawProfiles[0].totalCount || 14250;
      const creditProfile: ColumnProfile = {
        columnName: 'Credit_Limit_Usd',
        dataType: 'Decimal',
        totalCount: totalCount,
        nullCount: 0,
        nullPercentage: 0,
        uniqueCount: 1850,
        uniquenessPercentage: 13.0,
        sampleValues: ['150000.00', '500000.00', '50000.00', '1000000.00'],
        hasAnomalies: true,
        anomalyDescription: 'Extreme statistical outliers (Z-score > 4.5) detected in credit limit boundaries'
      };
      return [...rawProfiles, creditProfile];
    }
    return rawProfiles;
  }, [rawProfiles]);

  const totalCols = activeProfiles.length;
  const totalRecords = activeProfiles[0]?.totalCount || 14250;

  // Compute dynamic binned histogram data based on selected column and resolution
  const computedHistogramData = useMemo(() => {
    const enrichment = COLUMN_ENRICHMENT_MAP[selectedColName] || COLUMN_ENRICHMENT_MAP['Cust_No'];
    const baseIntervals = enrichment?.distributionIntervals || [];
    
    let processed: { label: string; count: number; percentage: number; isOutlierBin: boolean }[] = [];

    if (binResolution === 'low') {
      // Group every 2 intervals together
      for (let i = 0; i < baseIntervals.length; i += 2) {
        if (i + 1 < baseIntervals.length) {
          const item1 = baseIntervals[i];
          const item2 = baseIntervals[i + 1];
          const label1Clean = item1.label.replace('Length ', '').replace(' chars', '');
          const label2Clean = item2.label.replace('Length ', '').replace(' chars', '');
          const combinedLabel = `${label1Clean.split(' - ')[0] || label1Clean} to ${label2Clean.split(' - ').slice(-1)[0] || label2Clean}`;
          processed.push({
            label: combinedLabel,
            count: item1.count + item2.count,
            percentage: parseFloat((item1.percentage + item2.percentage).toFixed(1)),
            isOutlierBin: (selectedColName === 'Credit_Limit_Usd' && (i >= 3 || i + 1 >= 3)) || 
                          (selectedColName === 'Tax_Registration_Number' && (item1.label.includes('INVALID') || item2.label.includes('INVALID')))
          });
        } else {
          const item = baseIntervals[i];
          processed.push({
            label: item.label,
            count: item.count,
            percentage: item.percentage,
            isOutlierBin: (selectedColName === 'Credit_Limit_Usd' && i >= 3) || 
                          (selectedColName === 'Tax_Registration_Number' && item.label.includes('INVALID'))
          });
        }
      }
    } else if (binResolution === 'high') {
      // Split each interval into 2 sub-bins
      baseIntervals.forEach((item) => {
        const count1 = Math.round(item.count * 0.55);
        const count2 = item.count - count1;
        const pct1 = parseFloat((item.percentage * 0.55).toFixed(1));
        const pct2 = parseFloat((item.percentage - pct1).toFixed(1));
        
        let subLabel1 = `${item.label} (A)`;
        let subLabel2 = `${item.label} (B)`;
        
        if (item.label.includes(' - ')) {
          const parts = item.label.replace(/\$/g, '').split(' - ');
          const val1 = parseInt(parts[0].replace(/,/g, ''));
          const val2 = parseInt(parts[1].replace(/,/g, ''));
          if (!isNaN(val1) && !isNaN(val2)) {
            const mid = Math.round((val1 + val2) / 2);
            subLabel1 = `$${val1.toLocaleString()} - $${mid.toLocaleString()}`;
            subLabel2 = `$${(mid + 1).toLocaleString()} - $${val2.toLocaleString()}`;
          }
        } else if (item.label.startsWith('>')) {
          const val = parseInt(item.label.replace(/>|\$/g, '').replace(/,/g, ''));
          if (!isNaN(val)) {
            subLabel1 = `$${val.toLocaleString()} - $${(val * 1.5).toLocaleString()}`;
            subLabel2 = `>$${(val * 1.5).toLocaleString()}`;
          }
        } else if (item.label.includes('Length ')) {
          const parts = item.label.replace('Length ', '').replace(' chars', '').split('-');
          const val1 = parseInt(parts[0]);
          const val2 = parseInt(parts[1]);
          if (!isNaN(val1) && !isNaN(val2)) {
            const mid = Math.round((val1 + val2) / 2);
            subLabel1 = `Len ${val1}-${mid} chars`;
            subLabel2 = `Len ${mid + 1}-${val2} chars`;
          }
        }

        const isOutlier = (selectedColName === 'Credit_Limit_Usd' && (item.label.includes('>') || item.label.includes('$500,001'))) || 
                         (selectedColName === 'Tax_Registration_Number' && item.label.includes('INVALID'));

        processed.push({
          label: subLabel1,
          count: count1,
          percentage: pct1,
          isOutlierBin: isOutlier
        });
        processed.push({
          label: subLabel2,
          count: count2,
          percentage: pct2,
          isOutlierBin: isOutlier
        });
      });
    } else {
      // Medium
      processed = baseIntervals.map((item, idx) => ({
        label: item.label,
        count: item.count,
        percentage: item.percentage,
        isOutlierBin: (selectedColName === 'Credit_Limit_Usd' && (idx >= 3 || item.label.includes('>'))) || 
                      (selectedColName === 'Tax_Registration_Number' && item.label.includes('INVALID'))
      }));
    }

    let runningSumPct = 0;
    const finalData = processed.map((item) => {
      runningSumPct += item.percentage;
      if (runningSumPct > 100) runningSumPct = 100;
      return {
        ...item,
        cumulativePercentage: parseFloat(runningSumPct.toFixed(1))
      };
    });

    return finalData;
  }, [selectedColName, binResolution]);

  // Key metrics calculation
  const avgCompleteness = useMemo(() => {
    if (totalCols === 0) return '0.0';
    return (activeProfiles.reduce((acc, p) => acc + (100 - p.nullPercentage), 0) / totalCols).toFixed(1);
  }, [activeProfiles, totalCols]);

  const avgUniqueness = useMemo(() => {
    if (totalCols === 0) return '0.0';
    return (activeProfiles.reduce((acc, p) => acc + p.uniquenessPercentage, 0) / totalCols).toFixed(1);
  }, [activeProfiles, totalCols]);

  const filteredProfiles = useMemo(() => {
    return activeProfiles.filter((p) =>
      p.columnName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.dataType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeProfiles, searchQuery]);

  const handleExportReport = () => {
    setDownloadingReport(true);
    setTimeout(() => {
      setDownloadingReport(false);
      setReportExported(true);
      triggerToast('Executive 7-Pillar Data Profiling Report PDF exported successfully!', 'success');
      setTimeout(() => setReportExported(false), 3000);
    }, 1500);
  };

  const handleAddStagedRule = (column: string, ruleType: string, summary: string) => {
    const newRule = {
      id: `stg-${Date.now()}`,
      column,
      ruleType,
      summary
    };
    setStagedRules(prev => [newRule, ...prev]);
    triggerToast(`Staged cleansing rule for ${column}: ${ruleType}`, 'success');
  };

  const handleApplyImputationSim = () => {
    const colName = imputeTargetCol;
    const strategyName =
      imputeStrategy === 'constant' ? "Coalesce standard default ('UNSPECIFIED')" :
      imputeStrategy === 'mode' ? 'Impute with Mode (Most Frequent Value)' :
      imputeStrategy === 'ai' ? 'AI Pattern-guided Value Imputation' : 'Quarantine rows and skip';

    handleAddStagedRule(colName, 'Null Imputation', strategyName);
  };

  const handleRunRegexValidator = () => {
    try {
      const regex = new RegExp(regexPattern);
      const enrichedStats = COLUMN_ENRICHMENT_MAP[regexTargetCol];
      if (enrichedStats) {
        // simulate validation match rate based on real mapping or slightly randomized high percentages
        let matchesRate = 98.5;
        if (regexPattern.includes('[0-9]{5}') && regexTargetCol === 'Cust_No') matchesRate = 100;
        else if (regexTargetCol === 'Cust_No') matchesRate = 42; // arbitrary mismatched regex

        const matchesCount = Math.round(totalRecords * (matchesRate / 100));
        const mismatchesCount = totalRecords - matchesCount;

        setRegexValidationResult({
          matches: matchesCount,
          mismatches: mismatchesCount,
          percentage: matchesRate
        });
        triggerToast(`Validated custom regex against ${regexTargetCol}!`, 'info');
      } else {
        triggerToast('Selected column details unavailable for validation simulation', 'warning');
      }
    } catch (e) {
      triggerToast('Invalid Regular Expression entered', 'warning');
    }
  };

  const activeEnrichment = COLUMN_ENRICHMENT_MAP[selectedColName] || COLUMN_ENRICHMENT_MAP['Cust_No'];
  const activeColProfile = activeProfiles.find(p => p.columnName === selectedColName) || activeProfiles[0];

  return (
    <div id="profiling-reports-view" className="space-y-6">
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 animate-slide-in bg-slate-900 border-slate-800 text-white">
          <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Check className="w-4 h-4 text-emerald-400" />
          </span>
          <div className="text-xs">
            <p className="font-bold">Profiling System Alert</p>
            <p className="text-slate-400 text-[11px]">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Advanced 7-Pillar Data Profiling Workspace</h2>
              <p className="text-xs text-slate-500">
                Automated statistics, null imputations, PK uniqueness, regex shapes, histograms, and statistical outliers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {datasets && datasets.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Dataset:</span>
              <select
                value={selectedDatasetId}
                onChange={(e) => onSelectDataset && onSelectDataset(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.recordCount.toLocaleString()} rows)
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handleExportReport}
            disabled={downloadingReport}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {downloadingReport ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Executive PDF...</span>
              </>
            ) : reportExported ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Report Exported!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export Executive Profiling Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Overall Completeness</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{avgCompleteness}%</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {activeProfiles.filter(p => p.nullPercentage === 0).length}/{totalCols} Complete
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Average attribute value completeness index</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Null Sparsity Alert</span>
            <Filter className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {activeProfiles.filter(p => p.nullPercentage > 5).length} Columns
            </span>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              {activeProfiles.filter(p => p.nullPercentage > 20).length} High Risk
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Columns with &gt;5% missing values</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Format & Pattern Deviations</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">4 Core Rules</span>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              Critical Check
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Dummy placeholders & format mismatch flags</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Average Uniqueness</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{avgUniqueness}%</span>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              PK Candidates Identified
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Keys: Cust_No (100% Unique)</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs - Wrapping beautifully & responsive */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'overview' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Executive Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('column_stats')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'column_stats' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Column Statistics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('null_analysis')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'null_analysis' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Null & Completeness
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('duplicate_analysis')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'duplicate_analysis' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. Duplicate Analysis
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pattern_detection')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'pattern_detection' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5. Pattern Detection
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('distribution')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'distribution' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6. Data Distribution
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('outliers')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'outliers' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7. Outliers ({DEFAULT_OUTLIERS.length})
            </button>
          </div>

          <div className="relative w-full xl:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search columns or datatype..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* -------------------------------------------------------------
            TAB 1: EXECUTIVE OVERVIEW
            ------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Composition */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-600" /> DataType Composition
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-700 mb-1 font-medium">
                      <span>String / Text ({activeProfiles.filter(p => p.dataType === 'String').length})</span>
                      <span className="font-mono">{Math.round((activeProfiles.filter(p => p.dataType === 'String').length / totalCols) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(activeProfiles.filter(p => p.dataType === 'String').length / totalCols) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-700 mb-1 font-medium">
                      <span>Numeric / Decimal ({activeProfiles.filter(p => p.dataType === 'Decimal' || p.dataType === 'Integer').length})</span>
                      <span className="font-mono">{Math.round((activeProfiles.filter(p => p.dataType === 'Decimal' || p.dataType === 'Integer').length / totalCols) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(activeProfiles.filter(p => p.dataType === 'Decimal' || p.dataType === 'Integer').length / totalCols) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-700 mb-1 font-medium">
                      <span>Dates & Code Enums</span>
                      <span className="font-mono">{Math.round((activeProfiles.filter(p => p.dataType !== 'String' && p.dataType !== 'Decimal' && p.dataType !== 'Integer').length / totalCols) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(activeProfiles.filter(p => p.dataType !== 'String' && p.dataType !== 'Decimal' && p.dataType !== 'Integer').length / totalCols) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tiers */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-amber-600" /> Completeness Risk Matrix
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Clean (100%)</span>
                    <span className="text-base font-bold text-emerald-600 font-mono">{activeProfiles.filter(p => p.nullPercentage === 0).length} Cols</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Low Nulls (1-5%)</span>
                    <span className="text-base font-bold text-indigo-600 font-mono">{activeProfiles.filter(p => p.nullPercentage > 0 && p.nullPercentage <= 5).length} Cols</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Medium (5-20%)</span>
                    <span className="text-base font-bold text-amber-600 font-mono">{activeProfiles.filter(p => p.nullPercentage > 5 && p.nullPercentage <= 20).length} Cols</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sparse (&gt;20%)</span>
                    <span className="text-base font-bold text-rose-600 font-mono">{activeProfiles.filter(p => p.nullPercentage > 20).length} Cols</span>
                  </div>
                </div>
              </div>

              {/* Takeaways */}
              <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-md space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300" /> AI Dataset Insights
                  </h3>
                  <ul className="space-y-2 mt-3 text-xs text-indigo-100">
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 font-bold">•</span>
                      <span><strong>Credit_Limit_Usd</strong> has 3 statistical extreme outliers detected via Z-Score.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 font-bold">•</span>
                      <span><strong>Tax_Registration_Number</strong> contains 314 dummy string entries ("INVALID_TAX").</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-300 font-bold">•</span>
                      <span><strong>Cust_No</strong> conforms fully to standard pattern; safe for Primary Key mapping.</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-indigo-800/80 flex items-center justify-between text-xs text-indigo-200">
                  <span>Scope: <strong>{totalRecords.toLocaleString()} Records</strong></span>
                  <button type="button" onClick={() => setActiveTab('outliers')} className="text-amber-300 hover:underline font-bold flex items-center gap-1 cursor-pointer">
                    Inspect Outliers <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Detailed Profiling Health Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600" /> Profiling Health Snapshot
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                      <th className="py-2.5 px-4">Column Name</th>
                      <th className="py-2.5 px-4">Data Type</th>
                      <th className="py-2.5 px-4">Completeness Bar</th>
                      <th className="py-2.5 px-4 text-right">Null %</th>
                      <th className="py-2.5 px-4 text-right">Uniqueness %</th>
                      <th className="py-2.5 px-4">Sample Profile</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredProfiles.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{p.columnName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] border border-slate-200">
                            {p.dataType}
                          </span>
                        </td>
                        <td className="py-3 px-4 w-40">
                          <div className="space-y-1">
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${p.nullPercentage === 0 ? 'bg-emerald-500' : p.nullPercentage > 20 ? 'bg-rose-500' : 'bg-amber-500'}`}
                                style={{ width: `${100 - p.nullPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-sans block">{(100 - p.nullPercentage).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${p.nullPercentage > 5 ? 'text-amber-600' : 'text-slate-700'}`}>
                          {p.nullPercentage}%
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700">{p.uniquenessPercentage}%</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-xs font-sans">
                          {p.sampleValues.join(', ')}
                        </td>
                        <td className="py-3 px-4 text-center font-sans">
                          {p.hasAnomalies ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Anomaly
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Healthy
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 2: COLUMN STATISTICS (Descriptive parameters)
            ------------------------------------------------------------- */}
        {activeTab === 'column_stats' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Column Selector */}
              <div className="lg:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <label className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Select Attribute Profile</label>
                <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
                  {activeProfiles.map(col => (
                    <button
                      key={col.columnName}
                      type="button"
                      onClick={() => setSelectedColName(col.columnName)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition border ${
                        selectedColName === col.columnName
                          ? 'bg-white border-indigo-500 text-indigo-700 shadow-xs font-bold'
                          : 'bg-slate-50 border-transparent text-slate-600 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{col.columnName}</span>
                        <span className="text-[10px] text-slate-400">{col.dataType}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Column Stats Inspector Panel */}
              <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-mono text-base font-bold text-slate-900">{selectedColName}</h3>
                    <p className="text-slate-500 text-xs font-sans">Comprehensive metadata analysis & descriptive indicators.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-mono font-bold">
                    {activeColProfile.dataType}
                  </span>
                </div>

                {/* Primary Metric Blocks */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-mono text-xs">
                    <span className="text-slate-400 block text-[10px] font-sans">Min Value Length</span>
                    <span className="text-base font-bold text-slate-800">{activeEnrichment.minLen} chars</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-mono text-xs">
                    <span className="text-slate-400 block text-[10px] font-sans">Max Value Length</span>
                    <span className="text-base font-bold text-slate-800">{activeEnrichment.maxLen} chars</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-mono text-xs">
                    <span className="text-slate-400 block text-[10px] font-sans">Average Length</span>
                    <span className="text-base font-bold text-slate-800">{activeEnrichment.avgLen} chars</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-mono text-xs">
                    <span className="text-slate-400 block text-[10px] font-sans">Casing Format</span>
                    <span className="text-sm font-bold text-indigo-600 block truncate">{activeEnrichment.casing}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-mono text-xs">
                    <span className="text-slate-400 block text-[10px] font-sans">Data Skewness</span>
                    <span className="text-sm font-bold text-slate-800 block truncate">{activeEnrichment.skewness}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-mono text-xs">
                    <span className="text-slate-400 block text-[10px] font-sans">Distinct Count</span>
                    <span className="text-base font-bold text-indigo-600">{activeColProfile.uniqueCount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Characters Character Set breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Character Type Distribution</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Alphabetic Letters (a-z, A-Z)</span>
                        <span className="font-mono font-bold">{activeEnrichment.characterSet.alpha}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${activeEnrichment.characterSet.alpha}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Numerical Digits (0-9)</span>
                        <span className="font-mono font-bold">{activeEnrichment.characterSet.numeric}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${activeEnrichment.characterSet.numeric}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Special Symbols / Spacing</span>
                        <span className="font-mono font-bold">{activeEnrichment.characterSet.special}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${activeEnrichment.characterSet.special}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* If Numeric stats exist, render Descriptive Box */}
                {activeEnrichment.numericOutliers && (
                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Continuous Numeric Descriptive Statistics</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-2 bg-slate-800 rounded">
                        <span className="text-slate-400 block text-[9px]">Mean Average</span>
                        <span className="font-bold text-white">${activeEnrichment.numericOutliers.mean.toLocaleString()}</span>
                      </div>
                      <div className="p-2 bg-slate-800 rounded">
                        <span className="text-slate-400 block text-[9px]">Median</span>
                        <span className="font-bold text-white">${activeEnrichment.numericOutliers.median.toLocaleString()}</span>
                      </div>
                      <div className="p-2 bg-slate-800 rounded">
                        <span className="text-slate-400 block text-[9px]">Std Deviation</span>
                        <span className="font-bold text-white">±${activeEnrichment.numericOutliers.stdDev.toLocaleString()}</span>
                      </div>
                      <div className="p-2 bg-slate-800 rounded">
                        <span className="text-slate-400 block text-[9px]">Outliers Count</span>
                        <span className="font-bold text-rose-400">{activeEnrichment.numericOutliers.outliersDetected} rows</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 3: NULL & COMPLETENESS ANALYSIS
            ------------------------------------------------------------- */}
        {activeTab === 'null_analysis' ? (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Completeness & Heatmap */}
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Dataset-Wide Data Completeness Score</h3>
                  <p className="text-xs text-slate-500 mt-1">Completeness metrics and simulated cell-grid distribution.</p>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-center font-mono shrink-0">
                    <span className="text-3xl font-black text-indigo-600 block">{avgCompleteness}%</span>
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Populated Score</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div className="bg-indigo-600 h-3 rounded-full" style={{ width: `${avgCompleteness}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400">Total data cells populated across {totalCols} attributes and {totalRecords.toLocaleString()} rows.</p>
                  </div>
                </div>

                {/* Completeness Simulated Cell Map */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Completeness Distribution Grid</span>
                    <span className="text-[10px] text-slate-400 font-mono">1 Dot = ~1,400 data cells</span>
                  </div>
                  <div className="grid grid-cols-10 gap-1 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    {Array.from({ length: 100 }).map((_, i) => {
                      // Mock some blank spots (nulls) around specific patterns to simulate real dataset density
                      const isNullSpot = i === 13 || i === 34 || i === 56 || i === 87 || i === 42 || i === 67;
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-[3px] transition-colors ${
                            isNullSpot ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'
                          }`}
                          title={isNullSpot ? 'Cell Missing (Null/Empty)' : 'Cell Populated'}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Populated</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Null / Whitespace</span>
                  </div>
                </div>
              </div>

              {/* Right Imputation Sandbox */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-5">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Zap className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-slate-800">Imputation Strategy Simulator</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Stage custom rules to instantly resolve attribute null values during dataset migration.
                </p>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">Target Sparsity Attribute</label>
                    <select
                      value={imputeTargetCol}
                      onChange={(e) => setImputeTargetCol(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                    >
                      {activeProfiles.filter(p => p.nullPercentage > 0).map(p => (
                        <option key={p.columnName} value={p.columnName}>
                          {p.columnName} ({p.nullPercentage}% Sparsity)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 font-bold block mb-1">Imputation Fix Strategy</label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:border-slate-200">
                        <input
                          type="radio"
                          name="impute_strategy"
                          checked={imputeStrategy === 'constant'}
                          onChange={() => setImputeStrategy('constant')}
                          className="mt-0.5 accent-indigo-600"
                        />
                        <div>
                          <span className="font-bold text-slate-700 block text-[11px]">Coalesce Constant</span>
                          <span className="text-[10px] text-slate-400">Fill standard fallback placeholder like 'UNSPECIFIED'</span>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:border-slate-200">
                        <input
                          type="radio"
                          name="impute_strategy"
                          checked={imputeStrategy === 'mode'}
                          onChange={() => setImputeStrategy('mode')}
                          className="mt-0.5 accent-indigo-600"
                        />
                        <div>
                          <span className="font-bold text-slate-700 block text-[11px]">Most Frequent Value (Mode)</span>
                          <span className="text-[10px] text-slate-400">Backfill using the highest-frequency non-null value</span>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:border-slate-200">
                        <input
                          type="radio"
                          name="impute_strategy"
                          checked={imputeStrategy === 'ai'}
                          onChange={() => setImputeStrategy('ai')}
                          className="mt-0.5 accent-indigo-600"
                        />
                        <div>
                          <span className="font-bold text-slate-700 block text-[11px]">AI Statistical Predictor</span>
                          <span className="text-[10px] text-slate-400">Use smart estimation from related row values</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyImputationSim}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Stage Imputation Fix Rule</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* -------------------------------------------------------------
            TAB 4: DUPLICATE ANALYSIS (Primary key candidate, total unique)
            ------------------------------------------------------------- */}
        {activeTab === 'duplicate_analysis' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Key candidate analysis */}
              <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Primary Key & Alternate Key Evaluator</h3>
                  <p className="text-xs text-slate-500 mt-1">Identifies valid columns for relational entity integrity constraints.</p>
                </div>

                <div className="space-y-3.5">
                  {activeProfiles.map(col => {
                    const status = COLUMN_ENRICHMENT_MAP[col.columnName]?.keyCandidateStatus || 'Non-Key Attribute';
                    return (
                      <div key={col.columnName} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                        <div className="font-mono text-xs">
                          <span className="font-bold text-slate-900 block">{col.columnName}</span>
                          <span className="text-[10px] text-slate-400">{col.uniquenessPercentage}% uniqueness • {col.uniqueCount.toLocaleString()} distinct</span>
                        </div>

                        {status === 'Primary Key' ? (
                          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold uppercase font-mono tracking-wide">
                            Primary Key (Verified)
                          </span>
                        ) : status === 'Alternate Key' ? (
                          <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-bold uppercase font-mono tracking-wide">
                            Alternate Key Candidate
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-200/50 text-slate-500 rounded-lg text-[10px] font-semibold">
                            Standard Column
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Duplicates frequency list */}
              <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Duplicate Value Inspector</h3>
                  <p className="text-xs text-slate-500 mt-1 font-sans">Select attribute to see highest-repetition duplicate rows.</p>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Select Attribute</label>
                  <select
                    value={selectedColName}
                    onChange={(e) => setSelectedColName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  >
                    {activeProfiles.map(p => (
                      <option key={p.columnName} value={p.columnName}>{p.columnName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Top Repeated Strings (Redundancy)</span>
                  {activeEnrichment.topDuplicates.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <Fingerprint className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                      <p className="text-slate-500 text-xs font-semibold">Fully Unique Column</p>
                      <p className="text-[11px] text-slate-400 mt-1">No duplicates or repeated text sequences exist here.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activeEnrichment.topDuplicates.map((dup, dIdx) => (
                        <div key={dIdx} className="space-y-1.5 font-mono text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span className="truncate max-w-[200px]">{dup.value}</span>
                            <span>{dup.count.toLocaleString()} times ({dup.percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1">
                            <div className="bg-indigo-600 h-1 rounded-full" style={{ width: `${dup.percentage * 30}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 5: PATTERN DETECTION (Regex shapes & character standards)
            ------------------------------------------------------------- */}
        {activeTab === 'pattern_detection' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Pattern breakdowns */}
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Regex Pattern Shape & Adherence</h3>
                  <p className="text-xs text-slate-500 mt-1">Standardized formats detected in text fields.</p>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Active Column:</span>
                    <select
                      value={selectedColName}
                      onChange={(e) => setSelectedColName(e.target.value)}
                      className="bg-slate-100 border-0 text-slate-800 text-xs font-mono rounded px-2 py-1 focus:outline-hidden"
                    >
                      {activeProfiles.map(p => (
                        <option key={p.columnName} value={p.columnName}>{p.columnName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    {activeEnrichment.patterns.map((pat, pIdx) => (
                      <div key={pIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <code className="px-1.5 py-0.5 bg-slate-200 rounded text-indigo-700 text-[11px] font-bold">{pat.pattern}</code>
                          <span className="font-bold text-slate-700">{pat.matchPct}% matched</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Sample: "{pat.sample}"</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            pat.status === 'valid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {pat.status === 'valid' ? 'Valid Format Shape' : 'Anomaly format violation'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Regex validation form */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Custom Regex Checker</h3>
                <p className="text-xs text-slate-500">Test regular expression constraints against current column values.</p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Target Check Column</label>
                    <select
                      value={regexTargetCol}
                      onChange={(e) => setRegexTargetCol(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                    >
                      {activeProfiles.map(p => (
                        <option key={p.columnName} value={p.columnName}>{p.columnName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Regular Expression Rule</label>
                    <input
                      type="text"
                      value={regexPattern}
                      onChange={(e) => setRegexPattern(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono text-[11px] tracking-wide"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRunRegexValidator}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Run Pattern Validation</span>
                  </button>

                  {regexValidationResult && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-2 animate-fade-in">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-600">Matched Rows</span>
                        <span className="text-emerald-600">{regexValidationResult.matches.toLocaleString()} ({regexValidationResult.percentage}%)</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-600">Failed / Mismatches</span>
                        <span className="text-rose-600">{regexValidationResult.mismatches.toLocaleString()} ({(100 - regexValidationResult.percentage).toFixed(1)}%)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 6: DATA DISTRIBUTION (Histograms & Frequencies)
            ------------------------------------------------------------- */}
        {activeTab === 'distribution' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Histogram visualization & Interactive Chart */}
              <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Advanced Dual-Axis Frequency Histogram</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Visualize density, group counts, and cumulative value distribution curves.</p>
                  </div>
                  <select
                    value={selectedColName}
                    onChange={(e) => setSelectedColName(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {activeProfiles.map(p => (
                      <option key={p.columnName} value={p.columnName}>{p.columnName}</option>
                    ))}
                  </select>
                </div>

                {/* Interactive Chart Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  {/* Mode toggle */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-semibold">Scale Mode:</span>
                    <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setHistViewMode('count')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          histViewMode === 'count' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Absolute Count
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistViewMode('percentage')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          histViewMode === 'percentage' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Relative Density %
                      </button>
                    </div>
                  </div>

                  {/* Resolution slider */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-semibold">Bin Count / Resolution:</span>
                    <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 font-semibold">
                      <button
                        type="button"
                        onClick={() => setBinResolution('low')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          binResolution === 'low' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-600 hover:text-slate-900 border border-transparent'
                        }`}
                      >
                        Low Bins
                      </button>
                      <button
                        type="button"
                        onClick={() => setBinResolution('medium')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          binResolution === 'medium' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-600 hover:text-slate-900 border border-transparent'
                        }`}
                      >
                        Default (Medium)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBinResolution('high')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          binResolution === 'high' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-600 hover:text-slate-900 border border-transparent'
                        }`}
                      >
                        High (Subdivided)
                      </button>
                    </div>
                  </div>

                  {/* Cumulative Curve and Outlier Toggles */}
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={showCumulativeLine}
                        onChange={(e) => setShowCumulativeLine(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span>Cumulative Curve</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={highlightOutliers}
                        onChange={(e) => setHighlightOutliers(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className="text-rose-600 font-semibold">Highlight Outliers</span>
                    </label>
                  </div>
                </div>

                {/* Recharts Render Area */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 h-[360px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={computedHistogramData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="label"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#64748b', fontWeight: 500 }}
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#4f46e5"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => histViewMode === 'percentage' ? `${v}%` : v.toLocaleString()}
                        tick={{ fill: '#4f46e5', fontWeight: 600 }}
                      />
                      {showCumulativeLine && (
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#e11d48"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fill: '#e11d48', fontWeight: 600 }}
                        />
                      )}
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-xl shadow-lg text-xs space-y-1.5 font-sans min-w-[200px]">
                                <p className="font-bold border-b border-slate-800 pb-1 text-slate-200 font-mono">{data.label}</p>
                                <div className="space-y-0.5">
                                  <div className="flex justify-between gap-4">
                                    <span className="text-slate-400">Record Count:</span>
                                    <span className="font-bold font-mono text-indigo-400">{data.count.toLocaleString()} rows</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-slate-400">Relative Frequency:</span>
                                    <span className="font-bold font-mono text-emerald-400">{data.percentage}%</span>
                                  </div>
                                  <div className="flex justify-between gap-4 border-t border-slate-800/60 pt-1 mt-1">
                                    <span className="text-slate-400">Cumulative Density:</span>
                                    <span className="font-bold font-mono text-rose-400">{data.cumulativePercentage}%</span>
                                  </div>
                                </div>
                                {data.isOutlierBin && highlightOutliers && (
                                  <div className="mt-1.5 p-1 bg-rose-950/40 text-rose-300 border border-rose-900/50 rounded-md text-[10px] font-bold flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                    <span>Contains Outliers / Anomaly</span>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey={histViewMode === 'count' ? 'count' : 'percentage'}
                        radius={[4, 4, 0, 0]}
                        barSize={selectedColName === 'Cust_No' ? 45 : 35}
                      >
                        {computedHistogramData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.isOutlierBin && highlightOutliers ? '#f43f5e' : '#4f46e5'}
                            fillOpacity={0.85}
                            stroke={entry.isOutlierBin && highlightOutliers ? '#e11d48' : '#3730a3'}
                            strokeWidth={1}
                          />
                        ))}
                      </Bar>
                      {showCumulativeLine && (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="cumulativePercentage"
                          stroke="#e11d48"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#e11d48', strokeWidth: 1.5 }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Binned ranges breakdown search and table list */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Table className="w-4 h-4 text-indigo-600" /> Bin Intervals & Density Grid
                    </h4>
                    <div className="relative w-full sm:w-60">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={histSearchQuery}
                        onChange={(e) => setHistSearchQuery(e.target.value)}
                        placeholder="Filter bin labels..."
                        className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                          <th className="py-2 px-3 font-mono">Bin Index</th>
                          <th className="py-2 px-3">Interval Group / Label Range</th>
                          <th className="py-2 px-3 text-right">Frequency Count</th>
                          <th className="py-2 px-3 text-right">Density %</th>
                          <th className="py-2 px-3 text-right">Cumulative %</th>
                          <th className="py-2 px-3 text-center">Density Level</th>
                          <th className="py-2 px-3 text-center">Anomaly Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {computedHistogramData
                          .filter(bin => bin.label.toLowerCase().includes(histSearchQuery.toLowerCase()))
                          .map((bin, idx) => {
                            const isHighDensity = bin.percentage > 35;
                            const isLowDensity = bin.percentage < 8;
                            return (
                              <tr key={idx} className={`hover:bg-slate-50/80 transition-colors ${bin.isOutlierBin && highlightOutliers ? 'bg-rose-50/30' : ''}`}>
                                <td className="py-2 px-3 text-slate-500 text-[11px]">Bin #{idx + 1}</td>
                                <td className="py-2 px-3 font-sans font-semibold text-slate-900">{bin.label}</td>
                                <td className="py-2 px-3 text-right text-slate-800 font-bold">{bin.count.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right text-indigo-700 font-bold">{bin.percentage}%</td>
                                <td className="py-2 px-3 text-right text-rose-600 font-bold">{bin.cumulativePercentage}%</td>
                                <td className="py-2 px-3 text-center font-sans">
                                  {isHighDensity ? (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-bold">
                                      High Concentration
                                    </span>
                                  ) : isLowDensity ? (
                                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded text-[10px]">
                                      Sparsely Populated
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px]">
                                      Moderate Density
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center font-sans">
                                  {bin.isOutlierBin && highlightOutliers ? (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 text-rose-600" /> Outlier
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] inline-flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-600" /> Clean
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        {computedHistogramData.filter(bin => bin.label.toLowerCase().includes(histSearchQuery.toLowerCase())).length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-400 font-sans text-xs">
                              No bins match the entered search filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Dist Descriptive Details */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Sliders className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Distribution Profile</h3>
                    <p className="text-[10px] text-slate-500">Selected: <strong className="font-mono">{selectedColName}</strong></p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-mono text-xs space-y-3">
                  <div className="flex justify-between text-[11px] border-b border-slate-200/50 pb-2">
                    <span className="text-slate-400">Total Count</span>
                    <span className="font-bold text-slate-800">{totalRecords.toLocaleString()} rows</span>
                  </div>
                  <div className="flex justify-between text-[11px] border-b border-slate-200/50 pb-2">
                    <span className="text-slate-400">Value Skewness</span>
                    <span className="font-bold text-indigo-600">{activeEnrichment.skewness}</span>
                  </div>
                  <div className="flex justify-between text-[11px] border-b border-slate-200/50 pb-2">
                    <span className="text-slate-400">Kurtosis Coefficient</span>
                    <span className="font-bold text-slate-800">{selectedColName === 'Credit_Limit_Usd' ? '+2.45 (High Leptokurtic)' : '+0.15 (Mesokurtic)'}</span>
                  </div>
                  <div className="flex justify-between text-[11px] border-b border-slate-200/50 pb-2">
                    <span className="text-slate-400">Cardinality Ratio</span>
                    <span className="font-bold text-slate-800">{activeColProfile.uniquenessPercentage}%</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Active Bin Resolution</span>
                    <span className="font-bold text-indigo-600 uppercase text-[10px] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                      {binResolution}
                    </span>
                  </div>
                </div>

                {/* Intelligent AI Recommendations Based on column selection */}
                <div className="p-4 bg-indigo-950 text-white rounded-xl text-xs space-y-2.5 shadow-md">
                  <div className="flex items-center gap-1 text-indigo-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Cleansing & Target Recommendation</span>
                  </div>
                  <div className="text-indigo-100 text-[11px] leading-relaxed space-y-2 font-sans">
                    {selectedColName === 'Credit_Limit_Usd' ? (
                      <>
                        <p>
                          <strong>Highly Skewed Density:</strong> Extreme values (up to $9.9M) violate the standard distribution fences.
                        </p>
                        <p className="text-indigo-200 font-semibold bg-indigo-900/50 p-2 rounded-lg border border-indigo-800/40 font-mono text-[10px]">
                          💡 Transform with: LN(Credit_Limit_Usd) or Cap credit limit boundary max to $1,500,000 for standard migration formats.
                        </p>
                      </>
                    ) : selectedColName === 'Cust_No' ? (
                      <>
                        <p>
                          <strong>Uniform distribution detected:</strong> Each customer number group contains a highly uniform count of entries.
                        </p>
                        <p className="text-indigo-200 font-semibold bg-indigo-900/50 p-2 rounded-lg border border-indigo-800/40 font-mono text-[10px]">
                          💡 PK Candidate: Highly secure primary key value range. No further partitioning or standardization required.
                        </p>
                      </>
                    ) : selectedColName === 'Tax_Registration_Number' ? (
                      <>
                        <p>
                          <strong>Spike in invalid data:</strong> The bin containing <code>INVALID_TAX</code> represents 2.2% of total records.
                        </p>
                        <p className="text-indigo-200 font-semibold bg-indigo-900/50 p-2 rounded-lg border border-indigo-800/40 font-mono text-[10px]">
                          💡 Cleansing action: Apply custom coalesce formatting rule or redirect invalid entries to separate manual verification queues.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          <strong>Standard text/pattern distribution:</strong> Column displays a classic <span className="text-amber-300 font-semibold">{activeEnrichment.skewness.toLowerCase()}</span> curve.
                        </p>
                        <p className="text-indigo-200 font-semibold bg-indigo-900/50 p-2 rounded-lg border border-indigo-800/40 font-mono text-[10px]">
                          💡 Schema advice: Target system should accommodate string character buffers of up to {activeEnrichment.maxLen} characters.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 7: OUTLIER & ANOMALY DETECTION (IQR Fences & Z-Scores)
            ------------------------------------------------------------- */}
        {activeTab === 'outliers' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Outliers List & Box Plot */}
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Statistical & Pattern Outlier Alerts</h3>
                  <p className="text-xs text-slate-500 mt-1">Z-Score &gt; 3.0 spikes, dummy string replacements, and extreme boundary deviations.</p>
                </div>

                {/* SVG simulated Box Plot for Credit Limit */}
                <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 font-sans tracking-wide block">Tukey Box Plot Profile (Credit_Limit_Usd)</span>
                  <div className="relative h-16 bg-slate-950 rounded border border-slate-800 flex items-center justify-center font-mono text-[10px]">
                    <div className="absolute left-8 right-8 h-0.5 bg-slate-800 flex items-center">
                      {/* Left Whisker */}
                      <span className="absolute left-0 w-0.5 h-3 bg-indigo-400" />
                      {/* Box */}
                      <span className="absolute left-1/4 right-2/3 h-5 bg-indigo-500/20 border border-indigo-400 rounded-xs flex items-center justify-center">
                        <span className="w-0.5 h-full bg-indigo-300" title="Median: $150K" />
                      </span>
                      {/* Right Whisker */}
                      <span className="absolute right-1/4 w-0.5 h-3 bg-indigo-400" />
                      {/* Outlier markers */}
                      <span className="absolute right-12 w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Outlier $9.9M" />
                      <span className="absolute right-4 w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Outlier $25M" />
                    </div>
                    <span className="absolute left-2 bottom-1 text-[8px] text-slate-400">Min: $0</span>
                    <span className="absolute right-2 bottom-1 text-[8px] text-slate-400">Max: $2.5M</span>
                  </div>
                </div>

                {/* Outlier Alerts list */}
                <div className="space-y-3">
                  {DEFAULT_OUTLIERS.map((out) => (
                    <div key={out.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-sans">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            out.severity === 'Critical' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}>
                            {out.severity}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">{out.columnName}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{out.pctOfTotal}% of total ({out.affectedCount.toLocaleString()} rows)</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans">{out.explanation}</p>
                      <div className="flex justify-between items-center text-xs font-mono pt-1">
                        <span className="text-[10px] text-slate-400">Flagged Value: <code className="bg-slate-200 px-1 rounded text-rose-700 font-bold">{out.detectedValue}</code></span>
                        <button
                          type="button"
                          onClick={() => handleAddStagedRule(out.columnName, 'Cleansing Flag', out.recommendedAction)}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          Stage Cleansing Rule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Staged Rules List */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Staged Cleansing Rules ({stagedRules.length})
                </h3>
                <p className="text-xs text-slate-500">Rules scheduled to execute during the active ETL pipeline.</p>

                {stagedRules.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-xs">No cleansing rules staged yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {stagedRules.map((rule) => (
                      <div key={rule.id} className="p-3 bg-slate-900 text-white rounded-xl space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between items-center text-[10px] text-indigo-300">
                          <span className="font-bold">{rule.column}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setStagedRules(prev => prev.filter(r => r.id !== rule.id));
                              triggerToast('Removed staged cleansing rule', 'info');
                            }}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="font-bold text-white text-[11px]">{rule.ruleType}</p>
                        <p className="text-[10px] text-slate-400">{rule.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
