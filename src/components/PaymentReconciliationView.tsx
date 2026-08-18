import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  ArrowRight,
  FileText,
  Check,
  X,
  Sparkles,
  Download,
  Info,
  Clock,
  Building2,
  CreditCard,
  Lock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export interface ReconciliationRecord {
  id: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  settlementDate: string;
  invoiceAmount: number;
  bankReceiptAmount: number;
  discrepancyDelta: number; // positive = overpaid / fee added, negative = short paid
  currency: string;
  status: 'MISMATCH_FLAGGED' | 'AUTO_MATCHED' | 'RESOLVED_MANUAL';
  flagReason: string;
  paymentMethod: string;
  bankReference: string;
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionType?: string;
}

export interface PaymentReconciliationViewProps {
  onShowToast?: (msg: string) => void;
}

export const INITIAL_RECONCILIATION_RECORDS: ReconciliationRecord[] = [
  {
    id: 'REC-9081',
    invoiceNumber: 'INV-2026-0881',
    customerName: 'Nordic Manufacturing Group',
    invoiceDate: '2026-08-01',
    settlementDate: '2026-08-03',
    invoiceAmount: 14800.0,
    bankReceiptAmount: 14755.0,
    discrepancyDelta: -45.0,
    currency: 'USD',
    status: 'MISMATCH_FLAGGED',
    flagReason: 'Intermediary Wire Transfer Fee ($45.00) deducted by correspondent bank',
    paymentMethod: 'SWIFT / ACH Wire Transfer',
    bankReference: 'BK-TR-88192039',
  },
  {
    id: 'REC-9082',
    invoiceNumber: 'INV-2026-0882',
    customerName: 'Apex Health Systems',
    invoiceDate: '2026-08-02',
    settlementDate: '2026-08-04',
    invoiceAmount: 22500.0,
    bankReceiptAmount: 22120.0,
    discrepancyDelta: -380.0,
    currency: 'USD',
    status: 'MISMATCH_FLAGGED',
    flagReason: 'FX Conversion variance (EUR to USD settlement rate mismatch)',
    paymentMethod: 'International Wire',
    bankReference: 'BK-TR-99210411',
  },
  {
    id: 'REC-9083',
    invoiceNumber: 'INV-2026-0883',
    customerName: 'FinTech Dynamics Europe',
    invoiceDate: '2026-08-03',
    settlementDate: '2026-08-03',
    invoiceAmount: 18900.0,
    bankReceiptAmount: 18900.0,
    discrepancyDelta: 0.0,
    currency: 'USD',
    status: 'AUTO_MATCHED',
    flagReason: 'Exact match verified via Stripe Connect automated feed',
    paymentMethod: 'Stripe Credit Card',
    bankReference: 'ch_3M981029310',
  },
  {
    id: 'REC-9084',
    invoiceNumber: 'INV-2026-0884',
    customerName: 'Logistics One Global',
    invoiceDate: '2026-08-04',
    settlementDate: '2026-08-06',
    invoiceAmount: 9500.0,
    bankReceiptAmount: 9350.0,
    discrepancyDelta: -150.0,
    currency: 'USD',
    status: 'MISMATCH_FLAGGED',
    flagReason: 'Customer applied unapproved Early Payment Discount ($150.00)',
    paymentMethod: 'FedNow / ACH',
    bankReference: 'BK-TR-10293844',
  },
  {
    id: 'REC-9085',
    invoiceNumber: 'INV-2026-0885',
    customerName: 'Retail Corp Enterprises',
    invoiceDate: '2026-08-05',
    settlementDate: '2026-08-05',
    invoiceAmount: 31200.0,
    bankReceiptAmount: 31200.0,
    discrepancyDelta: 0.0,
    currency: 'USD',
    status: 'AUTO_MATCHED',
    flagReason: 'Exact match verified with bank statement entry',
    paymentMethod: 'ACH Direct Debit',
    bankReference: 'BK-TR-77210923',
  },
  {
    id: 'REC-9086',
    invoiceNumber: 'INV-2026-0886',
    customerName: 'AeroSpace Systems Inc.',
    invoiceDate: '2026-07-28',
    settlementDate: '2026-07-30',
    invoiceAmount: 12400.0,
    bankReceiptAmount: 12380.0,
    discrepancyDelta: -20.0,
    currency: 'USD',
    status: 'RESOLVED_MANUAL',
    flagReason: 'Minor wire fee ($20.00) variance',
    paymentMethod: 'ACH Wire',
    bankReference: 'BK-TR-44810293',
    resolutionNote: 'Absorbed $20 wire fee into Banking Expenses Account (GL 6210)',
    resolvedAt: '2026-07-31 14:22 UTC',
    resolvedBy: 'Sarah Jenkins (Partner Lead Auditor)',
    resolutionType: 'Expense Absorption',
  },
];

export const PaymentReconciliationView: React.FC<PaymentReconciliationViewProps> = ({ onShowToast }) => {
  const [records, setRecords] = useState<ReconciliationRecord[]>(INITIAL_RECONCILIATION_RECORDS);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FLAGGED' | 'MATCHED' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Selected Record for Resolve Modal
  const [activeResolvingRecord, setActiveResolvingRecord] = useState<ReconciliationRecord | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'EXPENSE' | 'CREDIT_MEMO' | 'REQUEST_BALANCE' | 'MANUAL_OVERRIDE'>('EXPENSE');
  const [auditorNote, setAuditorNote] = useState<string>('');

  // Filter Logic
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Status Filter
      if (statusFilter === 'FLAGGED' && rec.status !== 'MISMATCH_FLAGGED') return false;
      if (statusFilter === 'MATCHED' && rec.status !== 'AUTO_MATCHED') return false;
      if (statusFilter === 'RESOLVED' && rec.status !== 'RESOLVED_MANUAL') return false;

      // Search Query Filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        rec.invoiceNumber.toLowerCase().includes(q) ||
        rec.customerName.toLowerCase().includes(q) ||
        rec.flagReason.toLowerCase().includes(q) ||
        rec.bankReference.toLowerCase().includes(q) ||
        rec.invoiceAmount.toString().includes(q) ||
        rec.bankReceiptAmount.toString().includes(q)
      );
    });
  }, [records, statusFilter, searchQuery]);

  // Aggregate Stats
  const totalInvoiced = useMemo(() => records.reduce((sum, r) => sum + r.invoiceAmount, 0), [records]);
  const totalSettled = useMemo(() => records.reduce((sum, r) => sum + r.bankReceiptAmount, 0), [records]);
  const flaggedCount = useMemo(() => records.filter((r) => r.status === 'MISMATCH_FLAGGED').length, [records]);
  const flaggedTotalDelta = useMemo(
    () => records.filter((r) => r.status === 'MISMATCH_FLAGGED').reduce((sum, r) => sum + Math.abs(r.discrepancyDelta), 0),
    [records]
  );
  const matchedCount = useMemo(() => records.filter((r) => r.status === 'AUTO_MATCHED').length, [records]);
  const resolvedCount = useMemo(() => records.filter((r) => r.status === 'RESOLVED_MANUAL').length, [records]);

  // Trigger AI Auto-Reconciliation Scan
  const handleRunAutoReconcileScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Auto-resolve any record with delta <= $20 or simulate newly matched record
      setRecords((prev) =>
        prev.map((r) => {
          if (r.status === 'MISMATCH_FLAGGED' && Math.abs(r.discrepancyDelta) <= 50) {
            return {
              ...r,
              status: 'RESOLVED_MANUAL',
              resolutionNote: 'Auto-reconciled via tolerance rule matching (< $50 threshold)',
              resolvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
              resolvedBy: 'AI Audit Reconciliation Bot',
              resolutionType: 'Auto-Tolerance Tolerance Rule',
            };
          }
          return r;
        })
      );
      if (onShowToast) {
        onShowToast('✨ Automated AI reconciliation scan completed! Small variances auto-matched.');
      }
    }, 1200);
  };

  // Submit Resolution Modal Form
  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResolvingRecord) return;

    let resTypeLabel = 'Banking Expense Surcharge';
    if (resolutionAction === 'CREDIT_MEMO') resTypeLabel = 'Adjustment Credit Memo Issued';
    if (resolutionAction === 'REQUEST_BALANCE') resTypeLabel = 'Outstanding Balance Invoice Issued';
    if (resolutionAction === 'MANUAL_OVERRIDE') resTypeLabel = 'Auditor Manual Ledger Override';

    const defaultNote = auditorNote.trim() || `Resolved discrepancy delta of $${Math.abs(activeResolvingRecord.discrepancyDelta).toFixed(2)} (${resTypeLabel}).`;

    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === activeResolvingRecord.id) {
          return {
            ...rec,
            status: 'RESOLVED_MANUAL',
            resolutionNote: defaultNote,
            resolvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
            resolvedBy: 'Partner Finance Specialist',
            resolutionType: resTypeLabel,
          };
        }
        return rec;
      })
    );

    if (onShowToast) {
      onShowToast(`✅ Discrepancy for ${activeResolvingRecord.invoiceNumber} successfully resolved!`);
    }

    setActiveResolvingRecord(null);
    setAuditorNote('');
  };

  // Export Audit Ledger Report
  const handleExportReconciliationReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        [
          'Record ID',
          'Invoice #',
          'Customer Name',
          'Invoice Amount ($)',
          'Bank Receipt Amount ($)',
          'Discrepancy Delta ($)',
          'Status',
          'Flag Reason',
          'Resolution Note',
          'Resolved By',
          'Resolved At',
        ].join(','),
        ...records.map((r) =>
          [
            r.id,
            r.invoiceNumber,
            `"${r.customerName}"`,
            r.invoiceAmount,
            r.bankReceiptAmount,
            r.discrepancyDelta,
            r.status,
            `"${r.flagReason}"`,
            `"${r.resolutionNote || ''}"`,
            `"${r.resolvedBy || ''}"`,
            `"${r.resolvedAt || ''}"`,
          ].join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Payment_Reconciliation_Audit_Ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) {
      onShowToast('📊 Payment reconciliation audit report exported to CSV!');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Automated Payment Reconciliation &amp; Discrepancy Audit
                </h3>
                {flaggedCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-mono font-black border border-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    {flaggedCount} Mismatches Flagged
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Automatically verify processed invoice totals against incoming SWIFT wire receipts, Stripe feeds, and bank settlement statements.
              </p>
            </div>
          </div>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunAutoReconcileScan}
            disabled={isScanning}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 border border-indigo-400 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Running AI Scan...' : 'Re-Run AI Auto-Match'}</span>
          </button>

          <button
            onClick={handleExportReconciliationReport}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Invoiced vs Settled Volume</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            ${totalSettled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Invoiced Total: ${totalInvoiced.toLocaleString()}
          </div>
        </div>

        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-amber-800 flex items-center justify-between">
            <span>Pending Flagged Mismatches</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-900 font-mono">
            ${flaggedTotalDelta.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-700 font-medium font-mono font-bold">
            {flaggedCount} transaction{flaggedCount === 1 ? '' : 's'} require auditor resolution
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Auto-Matching Precision</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">
            96.4%
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {matchedCount} auto-verified exact matches
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Resolved Audit Items</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">
            {resolvedCount} items
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Fully signed &amp; posted to GL ledger
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Records ({records.length})
          </button>

          <button
            onClick={() => setStatusFilter('FLAGGED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'FLAGGED'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Flagged Mismatches ({flaggedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('MATCHED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === 'MATCHED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Auto-Matched ({matchedCount})
          </button>

          <button
            onClick={() => setStatusFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === 'RESOLVED'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, customer name, bank reference..."
            className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* RECONCILIATION TABLE */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] uppercase text-slate-500">
            <tr>
              <th className="py-3 px-4 font-bold">Invoice &amp; Customer</th>
              <th className="py-3 px-4 font-bold">Invoiced Amount</th>
              <th className="py-3 px-4 font-bold">Bank Receipt</th>
              <th className="py-3 px-4 font-bold">Discrepancy Delta</th>
              <th className="py-3 px-4 font-bold">Status &amp; Flag Reason</th>
              <th className="py-3 px-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500 space-y-2">
                  <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-800">No reconciliation records match your current filter</p>
                  <p className="text-xs text-slate-400">Try switching tabs or clearing your search term.</p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => {
                const isMismatch = rec.status === 'MISMATCH_FLAGGED';
                const isMatched = rec.status === 'AUTO_MATCHED';
                const isResolved = rec.status === 'RESOLVED_MANUAL';

                return (
                  <tr
                    key={rec.id}
                    className={`transition-colors ${
                      isMismatch ? 'bg-amber-50/40 hover:bg-amber-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Customer & Invoice */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono">{rec.invoiceNumber}</div>
                      <div className="text-xs text-slate-600 font-medium">{rec.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Settled: {rec.settlementDate} • {rec.paymentMethod}
                      </div>
                    </td>

                    {/* Invoiced Amount */}
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900 text-sm">
                      ${rec.invoiceAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Bank Receipt */}
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-800">
                      ${rec.bankReceiptAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      <div className="text-[10px] text-slate-400 font-mono font-normal">
                        Ref: {rec.bankReference}
                      </div>
                    </td>

                    {/* Discrepancy Delta */}
                    <td className="py-3.5 px-4">
                      {rec.discrepancyDelta === 0 ? (
                        <span className="text-emerald-600 font-mono font-extrabold text-xs">
                          $0.00 (Matched)
                        </span>
                      ) : (
                        <span
                          className={`font-mono font-black text-sm px-2 py-0.5 rounded-lg inline-block border ${
                            rec.discrepancyDelta < 0
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {rec.discrepancyDelta > 0 ? '+' : ''}
                          ${rec.discrepancyDelta.toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* Status & Flag Reason */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {isMismatch && (
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            MISMATCH FLAGGED
                          </span>
                          <p className="text-[11px] text-amber-900 font-medium leading-tight">
                            {rec.flagReason}
                          </p>
                        </div>
                      )}

                      {isMatched && (
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            AUTO MATCHED
                          </span>
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {rec.flagReason}
                          </p>
                        </div>
                      )}

                      {isResolved && (
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-indigo-600" />
                            RESOLVED MANUAL
                          </span>
                          <p className="text-[11px] text-slate-700 font-medium leading-tight">
                            {rec.resolutionNote}
                          </p>
                          <div className="text-[10px] text-slate-400 font-mono">
                            By {rec.resolvedBy} on {rec.resolvedAt}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right">
                      {isMismatch ? (
                        <button
                          onClick={() => {
                            setActiveResolvingRecord(rec);
                            setAuditorNote('');
                            setResolutionAction('EXPENSE');
                          }}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl shadow-xs text-xs cursor-pointer transition-all flex items-center gap-1.5 ml-auto border border-amber-400"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve Mismatch</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (onShowToast) {
                              onShowToast(`Audit details verified for ${rec.invoiceNumber}. Ledger balanced.`);
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" /> Audit Log
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* RESOLVE MISMATCH MODAL */}
      {activeResolvingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-100 rounded-xl text-amber-700">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Resolve Payment Discrepancy
                  </h4>
                  <p className="text-xs text-slate-500">
                    {activeResolvingRecord.invoiceNumber} • {activeResolvingRecord.customerName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveResolvingRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mismatch Detail Summary Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono">Invoice Total:</span>
                <strong className="text-slate-900 font-mono text-sm">
                  ${activeResolvingRecord.invoiceAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-mono">Bank Wire Receipt Total:</span>
                <strong className="text-slate-900 font-mono text-sm">
                  ${activeResolvingRecord.bankReceiptAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="font-extrabold text-amber-900">Unresolved Discrepancy Variance:</span>
                <strong className="text-rose-600 font-mono text-base font-black">
                  ${Math.abs(activeResolvingRecord.discrepancyDelta).toFixed(2)}
                </strong>
              </div>

              <p className="text-[11px] text-slate-600 pt-1 italic">
                Flag Reason: "{activeResolvingRecord.flagReason}"
              </p>
            </div>

            {/* Form Actions */}
            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-800">
                  Select Reconciliation Resolution Action
                </label>

                <div className="space-y-2">
                  <label
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      resolutionAction === 'EXPENSE'
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolutionAction"
                      checked={resolutionAction === 'EXPENSE'}
                      onChange={() => setResolutionAction('EXPENSE')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Write Off Variance as Banking / Wire Fee Expense
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal">
                        Absorb ${Math.abs(activeResolvingRecord.discrepancyDelta).toFixed(2)} into GL Account 6210 (Bank Wire &amp; Merchant Processing Surcharges).
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      resolutionAction === 'CREDIT_MEMO'
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolutionAction"
                      checked={resolutionAction === 'CREDIT_MEMO'}
                      onChange={() => setResolutionAction('CREDIT_MEMO')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Issue Adjustment Credit Memo to Customer
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal">
                        Generate official credit memo CM-{activeResolvingRecord.invoiceNumber} to balance customer accounts receivable ledger.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      resolutionAction === 'REQUEST_BALANCE'
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolutionAction"
                      checked={resolutionAction === 'REQUEST_BALANCE'}
                      onChange={() => setResolutionAction('REQUEST_BALANCE')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Request Outstanding Balance (${Math.abs(activeResolvingRecord.discrepancyDelta).toFixed(2)}) from Customer
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal">
                        Send supplemental short-pay invoice notice to customer AP department with bank reference details.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Auditor Note */}
              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-slate-800">
                  Auditor Resolution Note (For SOC 2 Compliance Log)
                </label>
                <textarea
                  value={auditorNote}
                  onChange={(e) => setAuditorNote(e.target.value)}
                  placeholder="Optional notes e.g., Verified wire receipt document from Chase bank portal..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveResolvingRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm &amp; Sign Off Ledger</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
