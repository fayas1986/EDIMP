import React, { useState, useEffect } from 'react';
import { ValidationRule, CleansingRule } from '../types';
import { SAMPLE_SOURCE_ROWS } from '../data/mockData';
import { DataQualityAlertsPanel } from './DataQualityAlertsPanel';
import { DataQualityHeatmap } from './DataQualityHeatmap';
import { OverflowTableWrapper } from './OverflowTableWrapper';
import { DataQualityScorecard } from './DataQualityScorecard';
import {
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sparkles,
  Zap,
  Filter,
  BellRing,
  Sliders,
  Grid,
  Check,
  X,
  AlertCircle,
  Settings,
  Eye,
  EyeOff,
  UserCheck,
  CopyX,
  Mail,
  Phone,
  MapPin,
  Link2,
  Scale,
  Terminal,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ValidationCleansingViewProps {
  onProceedToWizard: () => void;
}

// ---------------- Dirty Data Types & Local Records ----------------
interface DirtyRecord {
  id: string;
  Cust_No: string;
  Cust_Name: string;
  Street_Address_1: string;
  City: string;
  State_Region: string;
  Zip_Postal_Code: string;
  Country_Iso2: string;
  Contact_Phone: string;
  Contact_Email: string;
  Tax_Registration_Number: string;
  Credit_Limit_Usd: string;
  Payment_Terms_Code: string;
  Salesperson_Code: string;
}

const INITIAL_RECORDS: DirtyRecord[] = [
  {
    id: 'rec-1',
    Cust_No: 'CUS-10029',
    Cust_Name: '  acme logistics & trade corp  ',
    Street_Address_1: '742 Evergreen Terrace, Suite 400',
    City: 'Springfield',
    State_Region: 'IL',
    Zip_Postal_Code: '62704',
    Country_Iso2: 'us',
    Contact_Phone: '+1 (555) 234-5678',
    Contact_Email: ' billing@acmelogistics.com  ',
    Tax_Registration_Number: 'US-883921049',
    Credit_Limit_Usd: '250000.00',
    Payment_Terms_Code: 'NET30',
    Salesperson_Code: 'JS-102'
  },
  {
    id: 'rec-2',
    Cust_No: 'CUS-10030',
    Cust_Name: 'Global Tech Innovations Ltd',
    Street_Address_1: '100 King Street West',
    City: 'Toronto',
    State_Region: 'ON',
    Zip_Postal_Code: 'M5X 1A9',
    Country_Iso2: 'CA',
    Contact_Phone: '4165550192',
    Contact_Email: 'finance@globaltech.ca',
    Tax_Registration_Number: 'CA-102938475',
    Credit_Limit_Usd: '500000.00',
    Payment_Terms_Code: 'NET60',
    Salesperson_Code: 'MK-204'
  },
  {
    id: 'rec-3',
    Cust_No: 'CUS-10031',
    Cust_Name: 'vandenberg heavy industries gmbh',
    Street_Address_1: 'Industriestrasse 42',
    City: 'Frankfurt',
    State_Region: 'HE',
    Zip_Postal_Code: '60311',
    Country_Iso2: 'DE',
    Contact_Phone: '+49 69 1234 5678',
    Contact_Email: 'accounts@vandenberg.de',
    Tax_Registration_Number: 'DE123456789',
    Credit_Limit_Usd: '1000000.00',
    Payment_Terms_Code: '', // Missing reference lookup
    Salesperson_Code: 'JS-102'
  },
  {
    id: 'rec-4',
    Cust_No: 'CUS-10029', // DUPLICATE Customer Number
    Cust_Name: 'Acme Logistics & Trade Corp',
    Street_Address_1: '742 Evergreen Terrace, Suite 400',
    City: 'Springfield',
    State_Region: 'IL',
    Zip_Postal_Code: '62704',
    Country_Iso2: 'US',
    Contact_Phone: '+1 (555) 234-5678',
    Contact_Email: 'billing@acmelogistics.com',
    Tax_Registration_Number: 'US-883921049',
    Credit_Limit_Usd: '250000.00',
    Payment_Terms_Code: 'NET30',
    Salesperson_Code: 'JS-102'
  },
  {
    id: 'rec-5',
    Cust_No: 'CUS-10033',
    Cust_Name: 'Apex Medical Supplies Inc',
    Street_Address_1: '450 Healthcare Way',
    City: 'Boston',
    State_Region: 'MA',
    Zip_Postal_Code: '02115',
    Country_Iso2: 'US',
    Contact_Phone: '617-INVALID', // Invalid Phone format
    Contact_Email: 'orders_at_apexmed.com', // Invalid Email format
    Tax_Registration_Number: 'INVALID_TAX',
    Credit_Limit_Usd: '75000.00',
    Payment_Terms_Code: 'NET30',
    Salesperson_Code: 'JS-102'
  },
  {
    id: 'rec-6',
    Cust_No: 'CUS-10034',
    Cust_Name: 'Infinite Energy Solutions',
    Street_Address_1: 'P.O. Box 123', // Incomplete Address format (No street number/identifier)
    City: 'San Jose',
    State_Region: 'CA',
    Zip_Postal_Code: 'ABCDE', // Invalid US Zip pattern
    Country_Iso2: 'US',
    Contact_Phone: '+1 (800) 555-0144',
    Contact_Email: 'support@infinite-energy.com',
    Tax_Registration_Number: 'US-921028341',
    Credit_Limit_Usd: '300000.00',
    Payment_Terms_Code: 'INVALID_PT', // Invalid Reference lookup code
    Salesperson_Code: 'XX-999' // Invalid Reference lookup code
  },
  {
    id: 'rec-7',
    Cust_No: 'CUS-10035',
    Cust_Name: 'Ultra Luxury Cars GMBH',
    Street_Address_1: '100 Michigan Avenue',
    City: 'Chicago',
    State_Region: 'IL',
    Zip_Postal_Code: '60611',
    Country_Iso2: 'US',
    Contact_Phone: '+1 (312) 555-9876',
    Contact_Email: 'ceo@ultraluxurycars.de',
    Tax_Registration_Number: 'US-382910283',
    Credit_Limit_Usd: '2500000.00', // Exceeds Max Limit for State IL ($1,000,000)
    Payment_Terms_Code: 'NET15', // Violates rule: Limits > $500k require Net 30 or 60
    Salesperson_Code: 'JS-102'
  }
];

// ---------------- Pipeline Run Output Types ----------------
interface EvaluatedRecord {
  id: string;
  original: DirtyRecord;
  cleaned: DirtyRecord;
  status: 'Clean' | 'Warning' | 'Error' | 'DuplicateRemoved';
  standardizationsApplied: string[];
  emailIssues: string[];
  phoneIssues: string[];
  addressIssues: string[];
  referenceIssues: string[];
  businessRuleIssues: string[];
  isKept: boolean;
  duplicateResolutionMessage?: string;
}

export const ValidationCleansingView: React.FC<ValidationCleansingViewProps> = ({
  onProceedToWizard,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'rules' | 'heatmap' | 'alerts' | 'scorecard'>('rules');
  const [activeConfigSection, setActiveConfigSection] = useState<number>(0);
  const [filterSandboxStatus, setFilterSandboxStatus] = useState<'All' | 'Clean' | 'Issues' | 'Duplicates'>('All');

  // --- 1. Standardization Settings ---
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [capitalizeNames, setCapitalizeNames] = useState(true);
  const [uppercaseCountryIso, setUppercaseCountryIso] = useState(true);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('NET30');

  // --- 2. Duplicate Removal Settings ---
  const [dedupKey, setDedupKey] = useState<'Cust_No' | 'Contact_Email' | 'Contact_Phone'>('Cust_No');
  const [dedupStrategy, setDedupStrategy] = useState<'KeepFirst' | 'KeepLast' | 'FlagAll'>('KeepFirst');

  // --- 3. Email Validation Settings ---
  const [checkEmailSyntax, setCheckEmailSyntax] = useState(true);
  const [checkDisposableEmail, setCheckDisposableEmail] = useState(true);
  const [disposableList, setDisposableList] = useState('tempmail.com, mailinator.com, trashmail.com');

  // --- 4. Phone Validation Settings ---
  const [enforcePhoneDigitsCount, setEnforcePhoneDigitsCount] = useState(true);
  const [minPhoneDigits, setMinPhoneDigits] = useState(7);
  const [standardizeE164, setStandardizeE164] = useState(true);

  // --- 5. Address Validation Settings ---
  const [requireStreetNumber, setRequireStreetNumber] = useState(true);
  const [validateZipFormat, setValidateZipFormat] = useState(true);
  const [validateStateAbbreviations, setValidateStateAbbreviations] = useState(true);

  // --- 6. Reference Validation Settings ---
  const [validateSalespersons, setValidateSalespersons] = useState(true);
  const [validateTermsLookup, setValidateTermsLookup] = useState(true);
  const [allowedSalespersons, setAllowedSalespersons] = useState('JS-102, MK-204, AL-301');
  const [allowedTerms, setAllowedTerms] = useState('NET15, NET30, NET60');

  // --- 7. Business Rule Validation Settings ---
  const [maxCreditLimitByState, setMaxCreditLimitByState] = useState(true);
  const [maxCreditLimitStateTarget, setMaxCreditLimitStateTarget] = useState('IL');
  const [maxCreditLimitValue, setMaxCreditLimitValue] = useState(1000000);
  const [requireLongTermsForHighLimit, setRequireLongTermsForHighLimit] = useState(true);
  const [highLimitThreshold, setHighLimitThreshold] = useState(500000);

  // --- Pipeline Engine Execution States ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [pipelineResults, setPipelineResults] = useState<EvaluatedRecord[] | null>(null);

  // --- Summary Metrics of Run ---
  const [summaryMetrics, setSummaryMetrics] = useState<{
    total: number;
    clean: number;
    standardizedCount: number;
    warnings: number;
    errors: number;
    duplicatesPruned: number;
    slaPercent: number;
  } | null>(null);

  // Helper utility to capitalize names properly
  const performNameCapitalization = (name: string): string => {
    return name
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Run the full cleansing and validation pipeline on demand
  const handleExecuteCleansingPipeline = () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setPipelineLogs([]);
    setPipelineResults(null);

    const logs: string[] = [];
    const recordCount = INITIAL_RECORDS.length;

    logs.push(`[${new Date().toLocaleTimeString()}] [SYSTEM] Starting Data Quality & Cleansing Engine pipeline run...`);
    logs.push(`[${new Date().toLocaleTimeString()}] [METRIC] Detected ${recordCount} source records queued for migration.`);

    // Simulate stepping through records
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = Math.min(100, Math.round((currentStep / (recordCount + 1)) * 100));
      setProcessingProgress(progress);

      if (currentStep <= recordCount) {
        const record = INITIAL_RECORDS[currentStep - 1];
        logs.push(`[${new Date().toLocaleTimeString()}] [PROCESSING] Row #${currentStep} (${record.Cust_No}) - Analyzing constraints...`);
      } else {
        logs.push(`[${new Date().toLocaleTimeString()}] [ANALYSIS] Performing cluster duplicate detection using key [${dedupKey}]...`);
        logs.push(`[${new Date().toLocaleTimeString()}] [SYSTEM] Pipeline complete! Generating clean dataset output.`);
        clearInterval(interval);
        evaluatePipelineData(logs);
      }
      setPipelineLogs([...logs]);
    }, 250);
  };

  const evaluatePipelineData = (currentLogs: string[]) => {
    const results: EvaluatedRecord[] = [];
    const seenKeys = new Map<string, string>(); // key value -> id of record

    // First, scan to identify duplicate rows depending on strategy
    const duplicatesMap = new Map<string, boolean>(); // id -> is duplicate that gets removed
    const keyRecordsMap = new Map<string, DirtyRecord[]>();

    INITIAL_RECORDS.forEach((rec) => {
      let val = '';
      if (dedupKey === 'Cust_No') val = rec.Cust_No.trim();
      else if (dedupKey === 'Contact_Email') val = rec.Contact_Email.trim().toLowerCase();
      else if (dedupKey === 'Contact_Phone') val = rec.Contact_Phone.replace(/\D/g, '');

      if (val) {
        if (!keyRecordsMap.has(val)) {
          keyRecordsMap.set(val, []);
        }
        keyRecordsMap.get(val)!.push(rec);
      }
    });

    keyRecordsMap.forEach((recs, keyValue) => {
      if (recs.length > 1) {
        if (dedupStrategy === 'KeepFirst') {
          recs.forEach((r, idx) => {
            if (idx > 0) duplicatesMap.set(r.id, true); // remove other copies
          });
        } else if (dedupStrategy === 'KeepLast') {
          recs.forEach((r, idx) => {
            if (idx < recs.length - 1) duplicatesMap.set(r.id, true); // remove preceding copies
          });
        } else {
          recs.forEach((r) => {
            duplicatesMap.set(r.id, true); // remove/flag all copies
          });
        }
      }
    });

    // Parse configuration values
    const disposableDomains = disposableList.split(',').map(d => d.trim().toLowerCase());
    const salespersonCodes = allowedSalespersons.split(',').map(s => s.trim().toUpperCase());
    const paymentTermsCodes = allowedTerms.split(',').map(p => p.trim().toUpperCase());

    // Counter metrics
    let standardizedTotal = 0;
    let warningsTotal = 0;
    let errorsTotal = 0;
    let duplicatesRemovedCount = 0;

    INITIAL_RECORDS.forEach((original) => {
      const cleaned = { ...original };
      const standardizationsApplied: string[] = [];
      const emailIssues: string[] = [];
      const phoneIssues: string[] = [];
      const addressIssues: string[] = [];
      const referenceIssues: string[] = [];
      const businessRuleIssues: string[] = [];

      const isDuplicate = duplicatesMap.has(original.id);

      if (isDuplicate) {
        duplicatesRemovedCount++;
        currentLogs.push(`[${new Date().toLocaleTimeString()}] [DUPLICATE_REMOVED] Pruned duplicate record with ID "${original.id}" under key "${original[dedupKey]}".`);
        results.push({
          id: original.id,
          original,
          cleaned: original,
          status: 'DuplicateRemoved',
          standardizationsApplied: [],
          emailIssues: [],
          phoneIssues: [],
          addressIssues: [],
          referenceIssues: [],
          businessRuleIssues: [],
          isKept: false,
          duplicateResolutionMessage: `Duplicate record under key '${dedupKey}' value '${original[dedupKey]}'. Resolved with ${dedupStrategy === 'KeepFirst' ? 'Keep First' : dedupStrategy === 'KeepLast' ? 'Keep Last' : 'Flag/Remove All'} strategy.`
        });
        return;
      }

      // --- 1. Standardization Action Execution ---
      if (trimWhitespace) {
        // Trim string inputs
        Object.keys(cleaned).forEach((key) => {
          const val = cleaned[key as keyof DirtyRecord];
          if (typeof val === 'string' && val.trim() !== val) {
            cleaned[key as keyof DirtyRecord] = val.trim();
            if (!standardizationsApplied.includes('Trim whitespace')) {
              standardizationsApplied.push('Trim whitespace');
            }
          }
        });
      }

      if (capitalizeNames && cleaned.Cust_Name) {
        const cap = performNameCapitalization(cleaned.Cust_Name);
        if (cap !== cleaned.Cust_Name) {
          cleaned.Cust_Name = cap;
          standardizationsApplied.push('Capitalized customer legal name');
        }
      }

      if (uppercaseCountryIso && cleaned.Country_Iso2) {
        const upper = cleaned.Country_Iso2.toUpperCase();
        if (upper !== cleaned.Country_Iso2) {
          cleaned.Country_Iso2 = upper;
          standardizationsApplied.push('Normalized Country ISO code to uppercase');
        }
      }

      // Apply default payment term if empty
      if (!cleaned.Payment_Terms_Code) {
        cleaned.Payment_Terms_Code = defaultPaymentTerms;
        standardizationsApplied.push(`Missing payment terms default coerced to [${defaultPaymentTerms}]`);
      }

      // --- 2. Email Validation Action ---
      if (cleaned.Contact_Email) {
        if (checkEmailSyntax) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(cleaned.Contact_Email)) {
            emailIssues.push(`RFC-5322 Syntax failure: "${cleaned.Contact_Email}" is invalid`);
          }
        }

        if (checkDisposableEmail) {
          const domain = cleaned.Contact_Email.split('@')[1]?.toLowerCase().trim();
          if (domain && disposableDomains.some(d => domain.includes(d))) {
            emailIssues.push(`Flagged Disposable email domain: "${domain}" is blacklisted`);
          }
        }
      } else {
        emailIssues.push('Mandatory email contact field is blank');
      }

      // --- 3. Phone Validation Action ---
      if (cleaned.Contact_Phone) {
        const digitsOnly = cleaned.Contact_Phone.replace(/\D/g, '');
        if (enforcePhoneDigitsCount && digitsOnly.length < minPhoneDigits) {
          phoneIssues.push(`Phone too short: has ${digitsOnly.length} digits, requires at least ${minPhoneDigits}`);
        }

        if (/[A-Za-z]/.test(cleaned.Contact_Phone)) {
          phoneIssues.push(`Invalid phone digits: contains non-numeric alphabetical characters "${cleaned.Contact_Phone}"`);
        }

        if (standardizeE164 && digitsOnly.length >= 7 && !phoneIssues.length) {
          // Standardize visual representation: +1 (XXX) XXX-XXXX or global format
          if (digitsOnly.length === 10) {
            cleaned.Contact_Phone = `+1 (${digitsOnly.slice(0,3)}) ${digitsOnly.slice(3,6)}-${digitsOnly.slice(6)}`;
          } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
            cleaned.Contact_Phone = `+1 (${digitsOnly.slice(1,4)}) ${digitsOnly.slice(4,7)}-${digitsOnly.slice(7)}`;
          } else if (digitsOnly.startsWith('49')) {
            cleaned.Contact_Phone = `+49 ${digitsOnly.slice(2,4)} ${digitsOnly.slice(4,8)} ${digitsOnly.slice(8)}`;
          }
          if (cleaned.Contact_Phone !== original.Contact_Phone) {
            standardizationsApplied.push('Normalized phone number format');
          }
        }
      }

      // --- 4. Address Validation Action ---
      if (cleaned.Street_Address_1) {
        if (requireStreetNumber) {
          // Street must contain at least one digit representing building number
          const hasDigit = /\d/.test(cleaned.Street_Address_1);
          if (!hasDigit) {
            addressIssues.push(`Address warning: Street address lacks a clear building/suite number`);
          }
        }
      } else {
        addressIssues.push('Mandatory street address is empty');
      }

      if (validateZipFormat && cleaned.Zip_Postal_Code) {
        if (cleaned.Country_Iso2 === 'US') {
          const usZipRegex = /^\d{5}(-\d{4})?$/;
          if (!usZipRegex.test(cleaned.Zip_Postal_Code)) {
            addressIssues.push(`Invalid US Zip format: "${cleaned.Zip_Postal_Code}" must be exactly 5 numeric digits`);
          }
        } else if (cleaned.Country_Iso2 === 'CA') {
          const caZipRegex = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;
          if (!caZipRegex.test(cleaned.Zip_Postal_Code)) {
            addressIssues.push(`Invalid Canadian Postal code: "${cleaned.Zip_Postal_Code}" lacks proper Alphanumeric A1A 1A1 schema`);
          }
        }
      }

      if (validateStateAbbreviations && cleaned.State_Region && cleaned.Country_Iso2 === 'US') {
        const validStates = ['IL', 'MA', 'CA', 'NY', 'TX', 'WA', 'FL', 'OR', 'CO'];
        if (!validStates.includes(cleaned.State_Region.toUpperCase())) {
          addressIssues.push(`State Code mismatch: "${cleaned.State_Region}" is not a recognized US regional abbreviation`);
        }
      }

      // --- 5. Reference Verification Action ---
      if (validateSalespersons && cleaned.Salesperson_Code) {
        if (!salespersonCodes.includes(cleaned.Salesperson_Code.toUpperCase())) {
          referenceIssues.push(`Referential integrity failure: Salesperson "${cleaned.Salesperson_Code}" is not registered in the target master CRM database`);
        }
      }

      if (validateTermsLookup && cleaned.Payment_Terms_Code) {
        if (!paymentTermsCodes.includes(cleaned.Payment_Terms_Code.toUpperCase())) {
          referenceIssues.push(`Referential integrity failure: Payment terms "${cleaned.Payment_Terms_Code}" do not exist in Business Central dictionary lookup`);
        }
      }

      // --- 6. Business Rule Validation Action ---
      if (cleaned.Credit_Limit_Usd) {
        const limitVal = parseFloat(cleaned.Credit_Limit_Usd);
        
        if (maxCreditLimitByState && cleaned.State_Region?.toUpperCase() === maxCreditLimitStateTarget.toUpperCase()) {
          if (limitVal > maxCreditLimitValue) {
            businessRuleIssues.push(`Corporate Business Rule Violation: Credit limit of $${limitVal.toLocaleString()} exceeds $${maxCreditLimitValue.toLocaleString()} cap for high-risk state [${maxCreditLimitStateTarget}]`);
          }
        }

        if (requireLongTermsForHighLimit && limitVal > highLimitThreshold) {
          if (cleaned.Payment_Terms_Code === 'NET15') {
            businessRuleIssues.push(`Corporate Risk Policy Breach: High credit accounts exceeding $${highLimitThreshold.toLocaleString()} are restricted from using fast terms (NET15). Net 30 or 60 required.`);
          }
        }
      }

      // Determine record aggregate validation status
      const hasErrors = emailIssues.length > 0 || referenceIssues.length > 0 || phoneIssues.some(p => p.includes('too short') || p.includes('invalid characters'));
      const hasWarnings = addressIssues.length > 0 || phoneIssues.some(p => !p.includes('too short') && !p.includes('invalid characters')) || businessRuleIssues.length > 0 || emailIssues.some(e => e.includes('Disposable'));

      let status: 'Clean' | 'Warning' | 'Error' = 'Clean';
      if (hasErrors) {
        status = 'Error';
        errorsTotal++;
      } else if (hasWarnings) {
        status = 'Warning';
        warningsTotal++;
      }

      if (standardizationsApplied.length > 0) {
        standardizedTotal++;
      }

      results.push({
        id: original.id,
        original,
        cleaned,
        status,
        standardizationsApplied,
        emailIssues,
        phoneIssues,
        addressIssues,
        referenceIssues,
        businessRuleIssues,
        isKept: true
      });
    });

    setPipelineResults(results);

    // Calculate quality score KPI
    const totalRecordsScanned = INITIAL_RECORDS.length;
    const recordsWithIssues = results.filter(r => r.status === 'Error' || r.status === 'Warning').length;
    const perfectRecords = results.filter(r => r.status === 'Clean').length;
    const slaPercent = Math.round(((perfectRecords) / (totalRecordsScanned - duplicatesRemovedCount)) * 100);

    setSummaryMetrics({
      total: totalRecordsScanned,
      clean: perfectRecords,
      standardizedCount: standardizedTotal,
      warnings: warningsTotal,
      errors: errorsTotal,
      duplicatesPruned: duplicatesRemovedCount,
      slaPercent
    });

    setIsProcessing(false);
  };

  const getRuleIconForSection = (idx: number) => {
    switch (idx) {
      case 0: return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 1: return <CopyX className="w-4 h-4 text-indigo-600" />;
      case 2: return <Mail className="w-4 h-4 text-blue-600" />;
      case 3: return <Phone className="w-4 h-4 text-cyan-600" />;
      case 4: return <MapPin className="w-4 h-4 text-amber-600" />;
      case 5: return <Link2 className="w-4 h-4 text-purple-600" />;
      case 6: return <Scale className="w-4 h-4 text-rose-600" />;
      default: return <Sliders className="w-4 h-4" />;
    }
  };

  const getSectionTitle = (idx: number) => {
    switch (idx) {
      case 0: return 'Standardization Actions';
      case 1: return 'Duplicate Removal Controls';
      case 2: return 'Email Validation Rules';
      case 3: return 'Phone Validation Rules';
      case 4: return 'Address Validation Rules';
      case 5: return 'Reference & Foreign Key Lookups';
      case 6: return 'Business Rule Constraints';
      default: return 'Rule Panel';
    }
  };

  // Filtered sandbox output depending on user selections
  const filteredSandboxResults = pipelineResults?.filter(res => {
    if (filterSandboxStatus === 'All') return true;
    if (filterSandboxStatus === 'Clean') return res.status === 'Clean';
    if (filterSandboxStatus === 'Issues') return res.status === 'Warning' || res.status === 'Error';
    if (filterSandboxStatus === 'Duplicates') return res.status === 'DuplicateRemoved';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-100 uppercase tracking-wider">
              Module 17, 18 & 19 – Pre-Flight Quality Engine
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5.5 h-5.5 text-indigo-600" />
            Data Quality & Automated Cleansing Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Formulate multi-layered standardization rules, duplicate detection, advanced schema validations, and enterprise business constraints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onProceedToWizard}
            className="flex items-center gap-1.5 px-4.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <span>Proceed to Migration Wizard</span>
            <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
          </button>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveMainTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeMainTab === 'rules'
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Interactive Quality Studio</span>
          <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[9px] font-extrabold uppercase">
            Active
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('heatmap')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeMainTab === 'heatmap'
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Data Quality Heatmap</span>
          <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[9px] font-extrabold">
            D3 Matrix
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeMainTab === 'alerts'
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Quality Alerts & Webhooks</span>
          <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-extrabold">
            Realtime SLA
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('scorecard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeMainTab === 'scorecard'
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Data Quality Scorecard</span>
          <span className="px-1.5 py-0.2 bg-indigo-500 text-white rounded-full text-[9px] font-extrabold">
            4D Metrics
          </span>
        </button>
      </div>

      {/* Workspace Area */}
      {activeMainTab === 'heatmap' ? (
        <DataQualityHeatmap />
      ) : activeMainTab === 'alerts' ? (
        <DataQualityAlertsPanel />
      ) : activeMainTab === 'scorecard' ? (
        <DataQualityScorecard />
      ) : (
        <div className="space-y-6">
          {/* Top KPI row of Current Live Rules Parameters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-200/80">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Standardizers</span>
              <strong className="text-base font-extrabold text-slate-900 mt-1 block">
                {([trimWhitespace, capitalizeNames, uppercaseCountryIso].filter(Boolean).length) + 1} Configured
              </strong>
              <p className="text-[9px] text-slate-400 mt-0.5">Trimming, casing, and defaulting lookup keys.</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Duplicate Key</span>
              <strong className="text-base font-extrabold text-indigo-700 mt-1 block">
                {dedupKey}
              </strong>
              <p className="text-[9px] text-slate-400 mt-0.5">Strategy: {dedupStrategy === 'KeepFirst' ? 'Keep first record' : 'Keep last record'}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Format Validations</span>
              <strong className="text-base font-extrabold text-slate-900 mt-1 block">
                {([checkEmailSyntax, checkDisposableEmail, enforcePhoneDigitsCount, validateZipFormat].filter(Boolean).length)} Checks Active
              </strong>
              <p className="text-[9px] text-slate-400 mt-0.5">RFC email validation and E.164 phone normalization.</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Referential constraints</span>
              <strong className="text-base font-extrabold text-emerald-700 mt-1 block">
                {([validateSalespersons, validateTermsLookup].filter(Boolean).length)} Lookups Active
              </strong>
              <p className="text-[9px] text-slate-400 mt-0.5">Auditing against active ERP CRM codes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Hand: Interactive Cleansing Rules Form Configurator (Width: 5/12) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div>
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-indigo-500" />
                    Configure Cleansing Pipeline Rules
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Activate and configure live rules across 7 data cleansing layers below.
                  </p>
                </div>

                {/* 7 Feature Layer Accordion Panels */}
                <div className="space-y-2 border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                    const isOpen = activeConfigSection === idx;
                    return (
                      <div key={idx} className="bg-white">
                        <button
                          type="button"
                          onClick={() => setActiveConfigSection(isOpen ? -1 : idx)}
                          className={`w-full flex items-center justify-between p-3.5 text-left text-xs font-bold transition-all cursor-pointer ${
                            isOpen ? 'bg-slate-50 text-indigo-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {getRuleIconForSection(idx)}
                            <span>{getSectionTitle(idx)}</span>
                          </div>
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 bg-slate-50/40 border-t border-slate-100 space-y-3.5 text-xs font-sans text-slate-600">
                                {/* SECTION 0: STANDARDIZATION */}
                                {idx === 0 && (
                                  <div className="space-y-2.5">
                                    <div className="flex items-start gap-2.5">
                                      <input
                                        type="checkbox"
                                        id="std-trim"
                                        checked={trimWhitespace}
                                        onChange={(e) => setTrimWhitespace(e.target.checked)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                      />
                                      <div>
                                        <label htmlFor="std-trim" className="font-bold text-slate-700 cursor-pointer">Trim Whitespace</label>
                                        <p className="text-[10px] text-slate-400">Trims leading and trailing whitespace characters on all parsed fields.</p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-2.5">
                                      <input
                                        type="checkbox"
                                        id="std-caps"
                                        checked={capitalizeNames}
                                        onChange={(e) => setCapitalizeNames(e.target.checked)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                      />
                                      <div>
                                        <label htmlFor="std-caps" className="font-bold text-slate-700 cursor-pointer">Smart Capitalization</label>
                                        <p className="text-[10px] text-slate-400">Normalizes case formats by capitalizing first letter of words in Cust_Name.</p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-2.5">
                                      <input
                                        type="checkbox"
                                        id="std-country"
                                        checked={uppercaseCountryIso}
                                        onChange={(e) => setUppercaseCountryIso(e.target.checked)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                      />
                                      <div>
                                        <label htmlFor="std-country" className="font-bold text-slate-700 cursor-pointer">Uppercase Country ISO Codes</label>
                                        <p className="text-[10px] text-slate-400">Forces Country ISO strings (e.g. "us" to "US") to match ISO-3166 norms.</p>
                                      </div>
                                    </div>

                                    <div className="space-y-1 pt-1 border-t border-slate-200/50">
                                      <label className="font-bold text-slate-700 block text-[11px]">Payment Terms Default Coercion</label>
                                      <select
                                        value={defaultPaymentTerms}
                                        onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                                        className="w-full px-2 py-1.5 bg-white border border-slate-250 rounded-lg text-slate-800 font-semibold focus:outline-hidden"
                                      >
                                        <option value="NET30">NET30 (Default term)</option>
                                        <option value="NET15">NET15 (Expedited)</option>
                                        <option value="NET60">NET60 (Extended)</option>
                                      </select>
                                      <p className="text-[10px] text-slate-400">Coerces empty record payment codes to this term value.</p>
                                    </div>
                                  </div>
                                )}

                                {/* SECTION 1: DUPLICATE REMOVAL */}
                                {idx === 1 && (
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <label className="font-bold text-slate-700 block">Deduplication Key Column</label>
                                      <div className="flex gap-2">
                                        {(['Cust_No', 'Contact_Email', 'Contact_Phone'] as const).map(key => (
                                          <button
                                            key={key}
                                            type="button"
                                            onClick={() => setDedupKey(key)}
                                            className={`flex-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer text-center ${
                                              dedupKey === key ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-extrabold' : 'bg-white border-slate-200 text-slate-600'
                                            }`}
                                          >
                                            {key}
                                          </button>
                                        ))}
                                      </div>
                                      <p className="text-[10px] text-slate-400">Identify duplicate instances using this specific database field.</p>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="font-bold text-slate-700 block">Duplicate Resolution Strategy</label>
                                      <select
                                        value={dedupStrategy}
                                        onChange={(e) => setDedupStrategy(e.target.value as any)}
                                        className="w-full px-2 py-1.5 bg-white border border-slate-250 rounded-lg text-slate-800 font-semibold focus:outline-hidden"
                                      >
                                        <option value="KeepFirst">Keep First (Retain earlier, discard subsequent)</option>
                                        <option value="KeepLast">Keep Last (Retain latest record in file sequence)</option>
                                        <option value="FlagAll">Flag & Quarantine All Duplicates</option>
                                      </select>
                                    </div>
                                  </div>
                                )}

                                {/* SECTION 2: EMAIL VALIDATION */}
                                {idx === 2 && (
                                  <div className="space-y-2.5">
                                    <div className="flex items-start gap-2.5">
                                      <input
                                        type="checkbox"
                                        id="val-email-syntax"
                                        checked={checkEmailSyntax}
                                        onChange={(e) => setCheckEmailSyntax(e.target.checked)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 cursor-pointer"
                                      />
                                      <div>
                                        <label htmlFor="val-email-syntax" className="font-bold text-slate-700 cursor-pointer">RFC-5322 Syntax Compliance</label>
                                        <p className="text-[10px] text-slate-400">Validate format layout is valid name@domain.tld syntax.</p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-2.5">
                                      <input
                                        type="checkbox"
                                        id="val-email-disposable"
                                        checked={checkDisposableEmail}
                                        onChange={(e) => setCheckDisposableEmail(e.target.checked)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 cursor-pointer"
                                      />
                                      <div>
                                        <label htmlFor="val-email-disposable" className="font-bold text-slate-700 cursor-pointer">Block Disposable/Temp Mail</label>
                                        <p className="text-[10px] text-slate-400">Detect and flag burner emails matching disposable blacklist registries.</p>
                                      </div>
                                    </div>

                                    <div className="space-y-1 pt-1 border-t border-slate-200/50">
                                      <label className="font-bold text-slate-700 block text-[10px]">Disposable Domains Blacklist</label>
                                      <input
                                        type="text"
                                        value={disposableList}
                                        onChange={(e) => setDisposableList(e.target.value)}
                                        placeholder="Comma-separated domains"
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden font-mono text-[10px]"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* SECTION 3: PHONE VALIDATION */}
                                {idx === 3 && (
                                  <div className="space-y-3">
                                    <div className="flex items-start gap-2.5">
                                      <input
                                        type="checkbox"
                                        id="val-phone-digits"
                                        checked={enforcePhoneDigitsCount}
                                        onChange={(e) => setEnforcePhoneDigitsCount(e.target.checked)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 cursor-pointer"
                                      />
                                      <div>
                                        <label htmlFor="val-phone-digits" className="font-bold text-slate-700 cursor-pointer">Enforce Numeric Digits Count</label>
                                        <p className="text-[10px] text-slate-400">Flag phone records missing standard minimum digit count.</p>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="font-bold text-slate-700 block text-[10px]">Minimum Phone Digits Required</label>
                                      <input
                                        type="number"
                                        value={minPhoneDigits}
                                        onChange={(e) => setMinPhoneDigits(parseInt(e.target.value) || 7)}
                                        className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                                      />
                                    </div>

                                    <div className="flex items-start gap-2.5 pt-1 border-t border-slate-200/50">
                                      <input
                                        type="checkbox"
                                        id="val-phone-e164"
                                        checked={standardizeE164}
                                        onChange={(e) => setStandardizeE164(e.target.checked)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 cursor-pointer"
                                      />
                                      <div>
                                        <label htmlFor="val-phone-e164" className="font-bold text-slate-700 cursor-pointer">Format to E.164-like Display</label>
                                        <p className="text-[10px] text-slate-400">Standardizes telephone visual pattern spacing (e.g. +1 (XXX) XXX-XXXX).</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* SECTION 4: ADDRESS VALIDATION */}
                                {idx === 4 && (
                                  <div className="space-y-2.5">
                                    <div className="flex items-start gap-2.5">
                                      <input
                                        type="checkbox"
                                        id="val-addr-street"
                                        checked={requireStreetNumber}
                                        onChange={(e) => setRequireStreetNumber(e.target.checked)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 cursor-pointer"
                                      />
                                      <div>
                                        <label htmlFor="val-addr-street" className="font-bold text-slate-700 cursor-pointer">Verify House/Street Number Presence</label>
                                        <p className="text-[10px] text-slate-400">Audits street address text to verify it contains numeric building identifiers.</p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-2.5">
                                      <input
                                        type="checkbox"
                                        id="val-addr-zip"
                                        checked={validateZipFormat}
                                        onChange={(e) => setValidateZipFormat(e.target.checked)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 cursor-pointer"
                                      />
                                      <div>
                                        <label htmlFor="val-addr-zip" className="font-bold text-slate-700 cursor-pointer">Verify Regional ZIP Patterns</label>
                                        <p className="text-[10px] text-slate-400">Validates Postal Code formats against ISO standard schemas (US: 5-digits, CA: A1A 1A1).</p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-2.5">
                                      <input
                                        type="checkbox"
                                        id="val-addr-state"
                                        checked={validateStateAbbreviations}
                                        onChange={(e) => setValidateStateAbbreviations(e.target.checked)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 cursor-pointer"
                                      />
                                      <div>
                                        <label htmlFor="val-addr-state" className="font-bold text-slate-700 cursor-pointer">Enforce ISO US State Codes</label>
                                        <p className="text-[10px] text-slate-400">Flags non-matching two-character state abbreviations for US records.</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* SECTION 5: REFERENCE LOOKUPS */}
                                {idx === 5 && (
                                  <div className="space-y-3">
                                    <div className="flex items-start gap-2.5">
                                      <input
                                        type="checkbox"
                                        id="val-ref-sales"
                                        checked={validateSalespersons}
                                        onChange={(e) => setValidateSalespersons(e.target.checked)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 cursor-pointer"
                                      />
                                      <div>
                                        <label htmlFor="val-ref-sales" className="font-bold text-slate-700 cursor-pointer">Verify CRM Salesperson Integrity</label>
                                        <p className="text-[10px] text-slate-400">Validates Salesperson codes match primary registers in target database.</p>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="font-bold text-slate-700 block text-[10px]">Valid Salesperson Dictionary Allowlist</label>
                                      <input
                                        type="text"
                                        value={allowedSalespersons}
                                        onChange={(e) => setAllowedSalespersons(e.target.value)}
                                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-850 font-mono text-[10px]"
                                      />
                                    </div>

                                    <div className="flex items-start gap-2.5 pt-1 border-t border-slate-200/50">
                                      <input
                                        type="checkbox"
                                        id="val-ref-terms"
                                        checked={validateTermsLookup}
                                        onChange={(e) => setValidateTermsLookup(e.target.checked)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 cursor-pointer"
                                      />
                                      <div>
                                        <label htmlFor="val-ref-terms" className="font-bold text-slate-700 cursor-pointer">Verify Payment Terms Lookup Key</label>
                                        <p className="text-[10px] text-slate-400">Audits codes against lookup tables in D365 Business Central.</p>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="font-bold text-slate-700 block text-[10px]">Valid Payment Terms Allowed</label>
                                      <input
                                        type="text"
                                        value={allowedTerms}
                                        onChange={(e) => setAllowedTerms(e.target.value)}
                                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-850 font-mono text-[10px]"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* SECTION 6: BUSINESS RULES */}
                                {idx === 6 && (
                                  <div className="space-y-3">
                                    <div className="flex items-start gap-2.5">
                                      <input
                                        type="checkbox"
                                        id="val-biz-state"
                                        checked={maxCreditLimitByState}
                                        onChange={(e) => setMaxCreditLimitByState(e.target.checked)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 cursor-pointer"
                                      />
                                      <div>
                                        <label htmlFor="val-biz-state" className="font-bold text-slate-700 cursor-pointer">State Max Credit Limit Validation</label>
                                        <p className="text-[10px] text-slate-400">Enforces regional credit caps based on headquarters location risk profiles.</p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase">Target State</label>
                                        <input
                                          type="text"
                                          maxLength={2}
                                          value={maxCreditLimitStateTarget}
                                          onChange={(e) => setMaxCreditLimitStateTarget(e.target.value.toUpperCase())}
                                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 uppercase font-bold"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase">Max Credit USD</label>
                                        <input
                                          type="number"
                                          value={maxCreditLimitValue}
                                          onChange={(e) => setMaxCreditLimitValue(parseInt(e.target.value) || 0)}
                                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold font-mono"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/50">
                                      <input
                                        type="checkbox"
                                        id="val-biz-terms"
                                        checked={requireLongTermsForHighLimit}
                                        onChange={(e) => setRequireLongTermsForHighLimit(e.target.checked)}
                                        className="mt-0.5 h-3.5 w-3.5 rounded-sm border-slate-300 text-indigo-600 cursor-pointer"
                                      />
                                      <div>
                                        <label htmlFor="val-biz-terms" className="font-bold text-slate-700 cursor-pointer">Audit High Limit Payment Terms</label>
                                        <p className="text-[10px] text-slate-400">Checks that large accounts (exceeding custom USD cap) are restricted from fast terms like NET15.</p>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-500 uppercase">High Limit Threshold (USD)</label>
                                      <input
                                        type="number"
                                        value={highLimitThreshold}
                                        onChange={(e) => setHighLimitThreshold(parseInt(e.target.value) || 0)}
                                        className="w-32 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold font-mono"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  id="sandbox-evaluate-btn"
                  onClick={handleExecuteCleansingPipeline}
                  disabled={isProcessing}
                  className={`w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isProcessing ? 'bg-indigo-400 cursor-not-allowed' : ''
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Streaming Cleansing pipeline...' : 'Execute Cleansing & Validation Pipeline'}</span>
                </button>
              </div>

              {/* Processing Terminal Box */}
              {pipelineLogs.length > 0 && (
                <div className="bg-slate-900 text-white rounded-2xl p-4.5 border border-slate-800 space-y-2 font-mono text-[10px] shadow-md">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      Transformation Cluster Worker Logs
                    </span>
                    <span className="text-[8px] text-slate-500">HOST: quality-v17</span>
                  </div>

                  <div className="h-40 overflow-y-auto space-y-1 select-none pr-1 scrollbar-thin">
                    {pipelineLogs.map((log, idx) => {
                      let color = 'text-slate-300';
                      if (log.includes('[SYSTEM]')) color = 'text-indigo-400 font-bold';
                      else if (log.includes('[DUPLICATE_REMOVED]')) color = 'text-rose-400 font-semibold';
                      else if (log.includes('[PROCESSING]')) color = 'text-slate-400';
                      else if (log.includes('[METRIC]')) color = 'text-sky-400 font-medium';

                      return (
                        <div key={idx} className={color}>
                          {log}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Hand: Comparative Sandbox Output (Width: 7/12) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Dashboard metrics shown after a pipeline run */}
              {summaryMetrics ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-indigo-200 shadow-2xs">
                  <div className="text-center p-2 rounded-xl bg-slate-50">
                    <span className="text-[9px] text-slate-500 block font-bold uppercase">SLA PASS RATE</span>
                    <strong className={`text-lg font-extrabold block mt-0.5 ${summaryMetrics.slaPercent >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {summaryMetrics.slaPercent}%
                    </strong>
                  </div>

                  <div className="text-center p-2 rounded-xl bg-slate-50">
                    <span className="text-[9px] text-slate-500 block font-bold uppercase">STANDARDISERS APPLIED</span>
                    <strong className="text-lg font-extrabold text-indigo-700 block mt-0.5">
                      {summaryMetrics.standardizedCount} rows
                    </strong>
                  </div>

                  <div className="text-center p-2 rounded-xl bg-slate-50">
                    <span className="text-[9px] text-slate-500 block font-bold uppercase">DUPLICATES REMOVED</span>
                    <strong className="text-lg font-extrabold text-rose-600 block mt-0.5">
                      {summaryMetrics.duplicatesPruned} rows
                    </strong>
                  </div>

                  <div className="text-center p-2 rounded-xl bg-slate-50">
                    <span className="text-[9px] text-slate-500 block font-bold uppercase">ACTIVE WARNINGS / ERRORS</span>
                    <strong className="text-lg font-extrabold text-amber-600 block mt-0.5">
                      {summaryMetrics.warnings} / {summaryMetrics.errors}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-indigo-500 mx-auto animate-pulse" />
                  <h3 className="text-xs font-bold text-slate-800">Cleansing Pipeline Pending Run</h3>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Click the blue button on the left to execute the live validation & cleansing pipeline on our dirty ERP customer test records.
                  </p>
                </div>
              )}

              {/* Data Table Workspace */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Grid className="w-4 h-4 text-slate-500" />
                      Comparative Data Cleansing Sandbox
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">Before vs. After validation comparison rows</p>
                  </div>

                  {pipelineResults && (
                    <div className="flex bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-semibold">
                      {(['All', 'Clean', 'Issues', 'Duplicates'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setFilterSandboxStatus(tab)}
                          className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                            filterSandboxStatus === tab ? 'bg-slate-100 text-indigo-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-1 max-h-[460px] overflow-y-auto">
                  {!pipelineResults ? (
                    // Display initial dirty data preview
                    <OverflowTableWrapper hintLabel="Scroll horizontally to inspect the unprocessed dirty source records">
                      <table className="w-full text-left border-collapse text-[11px] font-sans">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[9px] tracking-wider">
                            <th className="py-2 px-3">No</th>
                            <th className="py-2 px-3">Cust Name (Standardization)</th>
                            <th className="py-2 px-3">Contact Email</th>
                            <th className="py-2 px-3">Contact Phone</th>
                            <th className="py-2 px-3 text-center">Country</th>
                            <th className="py-2 px-3">State</th>
                            <th className="py-2 px-3">ZIP</th>
                            <th className="py-2 px-3 text-right">Credit Limit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                          {INITIAL_RECORDS.map((rec, idx) => (
                            <tr key={rec.id} className="hover:bg-slate-50/50 text-slate-600">
                              <td className="py-2 px-3 text-slate-400 font-bold">{rec.Cust_No}</td>
                              <td className="py-2 px-3 font-sans font-medium text-slate-800 whitespace-nowrap">
                                "{rec.Cust_Name}"
                              </td>
                              <td className="py-2 px-3 text-slate-500 font-sans">"{rec.Contact_Email}"</td>
                              <td className="py-2 px-3 whitespace-nowrap">{rec.Contact_Phone}</td>
                              <td className="py-2 px-3 text-center font-bold text-amber-700 bg-amber-50/30">"{rec.Country_Iso2}"</td>
                              <td className="py-2 px-3 text-center">{rec.State_Region}</td>
                              <td className="py-2 px-3">{rec.Zip_Postal_Code}</td>
                              <td className="py-2 px-3 text-right font-bold text-slate-700">${parseFloat(rec.Credit_Limit_Usd).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </OverflowTableWrapper>
                  ) : (
                    // Display comparative processed results
                    <div className="space-y-4">
                      {filteredSandboxResults && filteredSandboxResults.map((res) => {
                        const isDup = res.status === 'DuplicateRemoved';
                        const isErr = res.status === 'Error';
                        const isWarn = res.status === 'Warning';
                        const isClean = res.status === 'Clean';

                        return (
                          <div
                            key={res.id}
                            className={`p-3.5 rounded-xl border text-xs space-y-3 transition-all ${
                              isDup
                                ? 'bg-slate-50 border-slate-200/60 opacity-65 grayscale'
                                : isErr
                                ? 'bg-rose-50/30 border-rose-200'
                                : isWarn
                                ? 'bg-amber-50/20 border-amber-200'
                                : 'bg-emerald-50/20 border-emerald-200'
                            }`}
                          >
                            {/* Row Metadata Header */}
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 font-mono text-[11px]">
                                  ID: {res.original.Cust_No}
                                </span>
                                <span className={`px-2 py-0.2 rounded text-[9px] font-bold border ${
                                  isClean
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : isErr
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : isWarn
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  {res.status.toUpperCase()}
                                </span>
                              </div>

                              {isDup && (
                                <span className="text-[10px] text-rose-600 font-bold font-sans">
                                  Pruned Duplicate Row
                                </span>
                              )}
                            </div>

                            {/* comparative card grid */}
                            {!isDup ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                                {/* Left side original dirty record */}
                                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/50 space-y-1">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase font-sans">Source Dirty Record</span>
                                  <div>Name: <span className="text-slate-500 font-sans">"{res.original.Cust_Name}"</span></div>
                                  <div>Email: <span className="text-slate-500">"{res.original.Contact_Email}"</span></div>
                                  <div>Phone: <span className="text-slate-500">"{res.original.Contact_Phone}"</span></div>
                                  <div>Address: <span className="text-slate-500">"{res.original.Street_Address_1}, {res.original.City}, {res.original.State_Region} {res.original.Zip_Postal_Code}"</span></div>
                                  <div>Country: <span className="text-slate-500 font-bold">"{res.original.Country_Iso2}"</span></div>
                                  <div>Salesperson: <span className="text-slate-500">"{res.original.Salesperson_Code}"</span></div>
                                  <div>Terms: <span className="text-slate-500">"{res.original.Payment_Terms_Code || 'NULL'}"</span></div>
                                  <div>Limit: <span className="text-slate-500">${parseFloat(res.original.Credit_Limit_Usd).toLocaleString()}</span></div>
                                </div>

                                {/* Right side cleaned/standardized output record */}
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                                  <span className="text-[9px] text-indigo-500 font-bold block uppercase font-sans">Cleansed Processed Output</span>
                                  <div>Name: <span className={`font-sans font-bold ${res.cleaned.Cust_Name !== res.original.Cust_Name ? 'text-emerald-700 bg-emerald-50 px-1 rounded' : 'text-slate-800'}`}>"{res.cleaned.Cust_Name}"</span></div>
                                  <div>Email: <span className={`${res.cleaned.Contact_Email !== res.original.Contact_Email ? 'text-emerald-700 bg-emerald-50 px-1 rounded' : 'text-slate-800'}`}>"{res.cleaned.Contact_Email}"</span></div>
                                  <div>Phone: <span className={`${res.cleaned.Contact_Phone !== res.original.Contact_Phone ? 'text-emerald-700 bg-emerald-50 px-1 rounded' : 'text-slate-800'}`}>"{res.cleaned.Contact_Phone}"</span></div>
                                  <div>Address: <span className="text-slate-800">"{res.cleaned.Street_Address_1}, {res.cleaned.City}, {res.cleaned.State_Region} {res.cleaned.Zip_Postal_Code}"</span></div>
                                  <div>Country: <span className={`font-bold ${res.cleaned.Country_Iso2 !== res.original.Country_Iso2 ? 'text-emerald-700 bg-emerald-50 px-1 rounded' : 'text-slate-800'}`}>"{res.cleaned.Country_Iso2}"</span></div>
                                  <div>Salesperson: <span className="text-slate-800">"{res.cleaned.Salesperson_Code}"</span></div>
                                  <div>Terms: <span className={`font-semibold ${res.cleaned.Payment_Terms_Code !== res.original.Payment_Terms_Code ? 'text-emerald-700 bg-emerald-50 px-1 rounded font-bold' : 'text-slate-800'}`}>"{res.cleaned.Payment_Terms_Code}"</span></div>
                                  <div>Limit: <span className="text-slate-800 font-bold">${parseFloat(res.cleaned.Credit_Limit_Usd).toLocaleString()}</span></div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 bg-rose-50/50 rounded-lg text-[11px] text-rose-700 font-sans leading-relaxed border border-rose-100 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                                <span>{res.duplicateResolutionMessage}</span>
                              </div>
                            )}

                            {/* Issues and Standardizers Detail Badges */}
                            {!isDup && (
                              <div className="space-y-1.5 pt-1">
                                {res.standardizationsApplied.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 items-center">
                                    <span className="text-[10px] text-indigo-500 font-bold font-sans">Standardizations:</span>
                                    {res.standardizationsApplied.map((std, sIdx) => (
                                      <span key={sIdx} className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-medium font-sans">
                                        {std}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Specific validation failures */}
                                {(res.emailIssues.length > 0 || res.phoneIssues.length > 0 || res.addressIssues.length > 0 || res.referenceIssues.length > 0 || res.businessRuleIssues.length > 0) && (
                                  <div className="space-y-1 border-t border-slate-100 pt-2 text-[10px] font-sans">
                                    <span className="font-bold text-slate-500 block">Rule Violations & Exceptions Detected:</span>
                                    
                                    {res.emailIssues.map((e, eIdx) => (
                                      <div key={eIdx} className="flex items-center gap-1.5 text-rose-600 font-medium">
                                        <Mail className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                                        <span>[Email Validation] {e}</span>
                                      </div>
                                    ))}

                                    {res.phoneIssues.map((p, pIdx) => (
                                      <div key={pIdx} className="flex items-center gap-1.5 text-rose-600 font-medium">
                                        <Phone className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                                        <span>[Phone Validation] {p}</span>
                                      </div>
                                    ))}

                                    {res.addressIssues.map((a, aIdx) => (
                                      <div key={aIdx} className="flex items-center gap-1.5 text-amber-600 font-medium">
                                        <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                                        <span>[Address Validation] {a}</span>
                                      </div>
                                    ))}

                                    {res.referenceIssues.map((rf, rIdx) => (
                                      <div key={rIdx} className="flex items-center gap-1.5 text-rose-600 font-medium font-bold">
                                        <Link2 className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                                        <span>[Reference lookup] {rf}</span>
                                      </div>
                                    ))}

                                    {res.businessRuleIssues.map((b, bIdx) => (
                                      <div key={bIdx} className="flex items-center gap-1.5 text-amber-600 font-medium">
                                        <Scale className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                                        <span>[Business Rule] {b}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {res.status === 'Clean' && (
                                  <div className="flex items-center gap-1.5 text-emerald-700 text-[10px] font-bold font-sans">
                                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Successfully validated against all configured SLA checks and constraints. Ready to migrate.</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {filteredSandboxResults && filteredSandboxResults.length === 0 && (
                        <div className="py-8 text-center text-slate-400 font-sans text-xs">
                          No processed rows match the current sandbox filter selection.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
