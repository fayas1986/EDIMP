import React, { useState, useMemo } from 'react';
import {
  ListOrdered,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
  Copy,
  Check,
  RefreshCw,
  Info,
  DollarSign,
  ShieldCheck,
  Building2,
  CreditCard,
  X,
  Eye,
  Terminal,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

export interface PaymentTransactionEvent {
  id: string; // e.g. txn_3M98201938
  invoiceNumber: string;
  customerName: string;
  timestamp: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  paymentMethod: string;
  gatewayProvider: string;
  failureReason?: string;
  ipAddress: string;
  cardLast4?: string;
  metadata?: Record<string, string>;
}

export interface TransactionLogsViewProps {
  onShowToast?: (msg: string) => void;
}

export const MOCK_TRANSACTION_EVENTS: PaymentTransactionEvent[] = [
  {
    id: 'txn_9081230491',
    invoiceNumber: 'INV-2026-0881',
    customerName: 'Nordic Manufacturing Group',
    timestamp: '2026-08-10 02:35:12 UTC',
    amount: 14800.0,
    currency: 'USD',
    status: 'COMPLETED',
    paymentMethod: 'SWIFT Wire Transfer',
    gatewayProvider: 'JPMorgan Chase ACH Direct',
    ipAddress: '194.210.89.12',
    metadata: { route: 'Wire #88192039', authorizationCode: 'AUTH-99201' },
  },
  {
    id: 'txn_9081230492',
    invoiceNumber: 'INV-2026-0882',
    customerName: 'Apex Health Systems',
    timestamp: '2026-08-10 01:14:02 UTC',
    amount: 22500.0,
    currency: 'USD',
    status: 'PENDING',
    paymentMethod: 'International SWIFT Wire',
    gatewayProvider: 'Deutsche Bank Clearing',
    ipAddress: '82.165.197.1',
    metadata: { route: 'SEPA Direct', authorizationCode: 'PEND-SEPA-812' },
  },
  {
    id: 'txn_9081230493',
    invoiceNumber: 'INV-2026-0883',
    customerName: 'FinTech Dynamics Europe',
    timestamp: '2026-08-09 21:40:55 UTC',
    amount: 18900.0,
    currency: 'USD',
    status: 'COMPLETED',
    paymentMethod: 'Corporate Visa **** 9081',
    gatewayProvider: 'Stripe Connect',
    ipAddress: '185.220.101.4',
    cardLast4: '9081',
    metadata: { network: 'Visa Business', authorizationCode: 'AUTH-77123' },
  },
  {
    id: 'txn_9081230494',
    invoiceNumber: 'INV-2026-0884',
    customerName: 'Logistics One Global',
    timestamp: '2026-08-09 18:22:19 UTC',
    amount: 9500.0,
    currency: 'USD',
    status: 'FAILED',
    paymentMethod: 'Corporate Mastercard **** 4410',
    gatewayProvider: 'Stripe Connect',
    failureReason: 'Card Declined: Insufficient Funds for cross-border settlement limits (Code: card_declined)',
    ipAddress: '104.28.192.8',
    cardLast4: '4410',
    metadata: { declineCode: 'insufficient_funds', riskScore: '12' },
  },
  {
    id: 'txn_9081230495',
    invoiceNumber: 'INV-2026-0885',
    customerName: 'Retail Corp Enterprises',
    timestamp: '2026-08-09 15:05:40 UTC',
    amount: 31200.0,
    currency: 'USD',
    status: 'COMPLETED',
    paymentMethod: 'ACH Direct Debit',
    gatewayProvider: 'Plaid / ACH Batch',
    ipAddress: '64.233.160.1',
    metadata: { traceNumber: 'ACH-TRACE-001293', settlementBatch: 'B-20260809' },
  },
  {
    id: 'txn_9081230496',
    invoiceNumber: 'INV-2026-0886',
    customerName: 'AeroSpace Systems Inc.',
    timestamp: '2026-08-09 11:30:00 UTC',
    amount: 12400.0,
    currency: 'USD',
    status: 'COMPLETED',
    paymentMethod: 'FedNow Real-time Rail',
    gatewayProvider: 'Federal Reserve FedNow',
    ipAddress: '12.180.22.90',
    metadata: { fedNowRef: 'FN-9901823', clearanceTime: '120ms' },
  },
  {
    id: 'txn_9081230497',
    invoiceNumber: 'INV-2026-0887',
    customerName: 'Global Cloud Logistics',
    timestamp: '2026-08-08 23:12:08 UTC',
    amount: 6800.0,
    currency: 'USD',
    status: 'FAILED',
    paymentMethod: 'Corporate Visa **** 1192',
    gatewayProvider: 'Stripe Connect',
    failureReason: '3D Secure 2.0 Authentication Timed Out (Code: authentication_required)',
    ipAddress: '89.160.20.11',
    cardLast4: '1192',
    metadata: { '3dsStatus': 'timeout', riskScore: '45' },
  },
  {
    id: 'txn_9081230498',
    invoiceNumber: 'INV-2026-0888',
    customerName: 'BioHealth Research Labs',
    timestamp: '2026-08-08 19:45:33 UTC',
    amount: 16500.0,
    currency: 'USD',
    status: 'PENDING',
    paymentMethod: 'ACH Batch Debit',
    gatewayProvider: 'Wells Fargo ACH Gateway',
    ipAddress: '152.179.80.22',
    metadata: { achHoldTime: '1 business day clearance' },
  },
];

export const TransactionLogsView: React.FC<TransactionLogsViewProps> = ({ onShowToast }) => {
  const [transactions, setTransactions] = useState<PaymentTransactionEvent[]>(MOCK_TRANSACTION_EVENTS);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedTxnId, setCopiedTxnId] = useState<string | null>(null);
  const [inspectedTxn, setInspectedTxn] = useState<PaymentTransactionEvent | null>(null);
  const [retryingTxnId, setRetryingTxnId] = useState<string | null>(null);

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Status Filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

      // Search Query Filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        t.id.toLowerCase().includes(q) ||
        t.invoiceNumber.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.paymentMethod.toLowerCase().includes(q) ||
        t.gatewayProvider.toLowerCase().includes(q) ||
        t.amount.toString().includes(q) ||
        (t.failureReason && t.failureReason.toLowerCase().includes(q)) ||
        (t.cardLast4 && t.cardLast4.includes(q))
      );
    });
  }, [transactions, statusFilter, searchQuery]);

  // Aggregate Metrics
  const totalVolume = useMemo(() => transactions.reduce((acc, t) => acc + t.amount, 0), [transactions]);
  const completedCount = useMemo(() => transactions.filter((t) => t.status === 'COMPLETED').length, [transactions]);
  const pendingCount = useMemo(() => transactions.filter((t) => t.status === 'PENDING').length, [transactions]);
  const failedCount = useMemo(() => transactions.filter((t) => t.status === 'FAILED').length, [transactions]);
  const successRate = useMemo(() => Math.round((completedCount / transactions.length) * 100), [completedCount, transactions]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedTxnId(id);
    setTimeout(() => setCopiedTxnId(null), 2000);
    if (onShowToast) {
      onShowToast(`📋 Copied transaction ID: ${id}`);
    }
  };

  const handleRetryTransaction = (txn: PaymentTransactionEvent) => {
    setRetryingTxnId(txn.id);
    setTimeout(() => {
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === txn.id) {
            return {
              ...t,
              status: 'COMPLETED',
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
              failureReason: undefined,
            };
          }
          return t;
        })
      );
      setRetryingTxnId(null);
      if (onShowToast) {
        onShowToast(`⚡ Transaction ${txn.id} retried and processed successfully!`);
      }
    }, 1200);
  };

  const handleExportLogsCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        [
          'Transaction ID',
          'Invoice #',
          'Customer Name',
          'Timestamp',
          'Amount ($)',
          'Currency',
          'Status',
          'Payment Method',
          'Gateway Provider',
          'Failure Reason',
          'IP Address',
        ].join(','),
        ...transactions.map((t) =>
          [
            t.id,
            t.invoiceNumber,
            `"${t.customerName}"`,
            `"${t.timestamp}"`,
            t.amount,
            t.currency,
            t.status,
            `"${t.paymentMethod}"`,
            `"${t.gatewayProvider}"`,
            `"${t.failureReason || 'N/A'}"`,
            t.ipAddress,
          ].join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Payment_Transaction_Events_Log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) {
      onShowToast('📊 Transaction logs exported to CSV!');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
              <ListOrdered className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Detailed Payment Event &amp; Transaction Logs
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-mono font-extrabold border border-indigo-200">
                  Real-time Ledger Feed
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Inspect atomic payment execution events, gateway webhooks, card authorization attempts, and decline details.
              </p>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportLogsCsv}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Log</span>
          </button>
        </div>
      </div>

      {/* KPI TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Total Payment Volume</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Across {transactions.length} total event logs
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
            <span>Authorization Success Rate</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 font-mono">
            {successRate}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {completedCount} succeeded • {pendingCount} pending
          </div>
        </div>

        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-amber-800 flex items-center justify-between">
            <span>Pending Settlements</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-900 font-mono">
            {pendingCount} Pending
          </div>
          <div className="text-[11px] text-amber-700 font-medium font-mono">
            Awaiting ACH / Wire clearing
          </div>
        </div>

        <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold text-rose-800 flex items-center justify-between">
            <span>Declines &amp; Failures</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-900 font-mono">
            {failedCount} Failed
          </div>
          <div className="text-[11px] text-rose-700 font-medium">
            Action required to retry card charge
          </div>
        </div>
      </div>

      {/* FILTER BAR & SEARCH */}
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
            All Logs ({transactions.length})
          </button>

          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed ({completedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('FAILED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'FAILED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Failed ({failedCount})</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transaction ID, invoice #, card last4, decline reason..."
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

      {/* TRANSACTION LOGS TABLE */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] uppercase text-slate-500">
            <tr>
              <th className="py-3 px-4 font-bold">Transaction ID &amp; Time</th>
              <th className="py-3 px-4 font-bold">Customer Account</th>
              <th className="py-3 px-4 font-bold">Amount</th>
              <th className="py-3 px-4 font-bold">Payment Gateway &amp; Method</th>
              <th className="py-3 px-4 font-bold">Status &amp; Event Details</th>
              <th className="py-3 px-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 space-y-2">
                  <ListOrdered className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-800">No payment transaction events match your filter</p>
                  <p className="text-xs text-slate-400">Try searching for a different ID, customer, or clear search filters.</p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn) => {
                const isCompleted = txn.status === 'COMPLETED';
                const isPending = txn.status === 'PENDING';
                const isFailed = txn.status === 'FAILED';

                return (
                  <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* ID & Timestamp */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyId(txn.id)}
                          className="font-mono text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{txn.id}</span>
                          {copiedTxnId === txn.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {txn.timestamp}
                      </div>
                    </td>

                    {/* Customer Account */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{txn.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Invoice: <strong className="text-slate-700">{txn.invoiceNumber}</strong>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">
                      ${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Payment Gateway & Method */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-bold">{txn.paymentMethod}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Gateway: {txn.gatewayProvider}
                      </div>
                    </td>

                    {/* Status & Failure Details */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {isCompleted && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          COMPLETED
                        </span>
                      )}

                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          PENDING SETTLEMENT
                        </span>
                      )}

                      {isFailed && (
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            FAILED DECLINE
                          </span>
                          {txn.failureReason && (
                            <p className="text-[10px] text-rose-900 font-mono leading-tight bg-rose-50/80 p-1.5 rounded-lg border border-rose-200">
                              {txn.failureReason}
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setInspectedTxn(txn)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Payload
                      </button>

                      {isFailed && (
                        <button
                          onClick={() => handleRetryTransaction(txn)}
                          disabled={retryingTxnId === txn.id}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${retryingTxnId === txn.id ? 'animate-spin' : ''}`} />
                          <span>Retry Charge</span>
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

      {/* WEBHOOK PAYLOAD INSPECTOR MODAL */}
      {inspectedTxn && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-800 shadow-2xl font-mono text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <h4 className="font-extrabold text-sm text-white">
                  Payment Event Webhook Payload
                </h4>
              </div>
              <button
                onClick={() => setInspectedTxn(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-slate-300 space-y-2 overflow-x-auto text-[11px]">
              <div>
                <span className="text-slate-500">"event":</span> "payment_intent.succeeded",
              </div>
              <div>
                <span className="text-slate-500">"id":</span> "{inspectedTxn.id}",
              </div>
              <div>
                <span className="text-slate-500">"customer_account":</span> "{inspectedTxn.customerName}",
              </div>
              <div>
                <span className="text-slate-500">"amount":</span> {inspectedTxn.amount},
              </div>
              <div>
                <span className="text-slate-500">"status":</span> "{inspectedTxn.status.toLowerCase()}",
              </div>
              <div>
                <span className="text-slate-500">"payment_method":</span> "{inspectedTxn.paymentMethod}",
              </div>
              <div>
                <span className="text-slate-500">"gateway":</span> "{inspectedTxn.gatewayProvider}",
              </div>
              <div>
                <span className="text-slate-500">"client_ip":</span> "{inspectedTxn.ipAddress}",
              </div>
              {inspectedTxn.failureReason && (
                <div>
                  <span className="text-slate-500">"decline_reason":</span> "{inspectedTxn.failureReason}",
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedTxn(null)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
