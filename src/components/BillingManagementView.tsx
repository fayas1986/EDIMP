import React, { useState, useMemo } from 'react';
import { CreditCard, DollarSign, CheckCircle2, AlertCircle, Download, Plus, Trash2, ShieldCheck, Calendar, FileText, Sparkles, ExternalLink, Lock, RefreshCw, X, Copy, Check, Receipt, Building2, Zap, Clock, ArrowRight, ChevronRight, Percent, Sliders, Shield, TrendingUp, BarChart2, BarChart3, Flame, Search, Filter, ShieldAlert, ListOrdered, BellRing, Calculator, KeyRound, UserCheck, Users, Box, Briefcase, ArrowRightLeft } from 'lucide-react';
import { PartnerSpendForecastChart } from './PartnerSpendForecastChart';
import { D3ConsumptionForecastChart } from './D3ConsumptionForecastChart';
import { MigrationUsageHeatmap } from './MigrationUsageHeatmap';
import { PaymentReconciliationView } from './PaymentReconciliationView';
import { TransactionLogsView } from './TransactionLogsView';
import { BillingAlertSettingsView } from './BillingAlertSettingsView';
import { TaxEstimatePreviewComponent } from './TaxEstimatePreviewComponent';

export interface BillingManagementViewProps {
  onNavigateTab?: (tab: string) => void;
}

export interface PaymentMethod {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'ach';
  last4: string;
  expMonth: string;
  expYear: string;
  holderName: string;
  isDefault: boolean;
  bankName?: string;
}

export interface InvoiceItem {
  id: string;
  number: string;
  date: string;
  period: string;
  amount: number;
  status: 'paid' | 'open' | 'processing';
  paymentMethod: string;
  stripeChargeId: string;
  pdfUrl?: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
}

export const BillingManagementView: React.FC<BillingManagementViewProps> = ({ onNavigateTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'plans' | 'analytics' | 'forecast-trend' | 'heatmap' | 'payment-methods' | 'invoices' | 'reconciliation' | 'transactions' | 'alerts' | 'tax-estimate' | 'usage'>('plans');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [currentTier, setCurrentTier] = useState<string>('Enterprise Agency');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Saved Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'pm_1M9281',
      brand: 'visa',
      last4: '4242',
      expMonth: '12',
      expYear: '2028',
      holderName: 'Global Systems Integrator LLC',
      isDefault: true,
    },
    {
      id: 'pm_1M8923',
      brand: 'mastercard',
      last4: '8821',
      expMonth: '08',
      expYear: '2027',
      holderName: 'GSI Treasury Dept',
      isDefault: false,
    },
    {
      id: 'pm_ach_091',
      brand: 'ach',
      last4: '9912',
      expMonth: '--',
      expYear: '--',
      holderName: 'JP Morgan Chase Corporate Operating',
      isDefault: false,
      bankName: 'JPMorgan Chase Bank, N.A.',
    },
  ]);

  // Mock Stripe Invoice History
  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    {
      id: 'in_1M9001',
      number: 'INV-2026-0801',
      date: 'Aug 01, 2026',
      period: 'Aug 1, 2026 – Aug 31, 2026',
      amount: 14800,
      status: 'paid',
      paymentMethod: 'Visa ending in 4242',
      stripeChargeId: 'ch_3M9001928371',
      lineItems: [
        { description: 'Enterprise Agency Tier Subscription (Annual Rate)', quantity: 1, unitPrice: 14800, amount: 14800 },
        { description: '50 Customer Workspaces Allocation', quantity: 1, unitPrice: 0, amount: 0 },
        { description: '100 TB Migration Storage Quota', quantity: 1, unitPrice: 0, amount: 0 },
        { description: 'Enterprise Annual Contract 20% Discount', quantity: 1, unitPrice: -3700, amount: -3700 },
      ],
    },
    {
      id: 'in_1M8002',
      number: 'INV-2026-0701',
      date: 'Jul 01, 2026',
      period: 'Jul 1, 2026 – Jul 31, 2026',
      amount: 14800,
      status: 'paid',
      paymentMethod: 'Visa ending in 4242',
      stripeChargeId: 'ch_3M8002812733',
      lineItems: [
        { description: 'Enterprise Agency Tier Subscription', quantity: 1, unitPrice: 14800, amount: 14800 },
        { description: 'Dedicated Multi-Region CDC Relay Add-on', quantity: 1, unitPrice: 0, amount: 0 },
      ],
    },
    {
      id: 'in_1M7003',
      number: 'INV-2026-0601',
      date: 'Jun 01, 2026',
      period: 'Jun 1, 2026 – Jun 30, 2026',
      amount: 14800,
      status: 'paid',
      paymentMethod: 'ACH Direct Debit (*9912)',
      stripeChargeId: 'ch_3M7003091823',
      lineItems: [
        { description: 'Enterprise Agency Tier Subscription', quantity: 1, unitPrice: 14800, amount: 14800 },
      ],
    },
    {
      id: 'in_1M6004',
      number: 'INV-2026-0501',
      date: 'May 01, 2026',
      period: 'May 1, 2026 – May 31, 2026',
      amount: 8500,
      status: 'paid',
      paymentMethod: 'Mastercard ending in 8821',
      stripeChargeId: 'ch_3M6004110293',
      lineItems: [
        { description: 'Pro Partner Tier Subscription', quantity: 1, unitPrice: 8500, amount: 8500 },
      ],
    },
  ]);

  // Modal States
  const [showAddCardModal, setShowAddCardModal] = useState<boolean>(false);
  const [showManagePaymentModal, setShowManagePaymentModal] = useState<boolean>(false);
  const [autoPayEnabled, setAutoPayEnabled] = useState<boolean>(true);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<InvoiceItem | null>(null);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<any | null>(null);
  const [isProcessingStripePayment, setIsProcessingStripePayment] = useState<boolean>(false);
  const [copiedChargeId, setCopiedChargeId] = useState<string | null>(null);

  // Add Card Form State
  const [cardForm, setCardForm] = useState({
    number: '',
    expMonth: '12',
    expYear: '2028',
    cvc: '',
    name: 'Global Systems Integrator LLC',
    zip: '90210',
    country: 'United States',
    isDefault: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyChargeId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedChargeId(id);
    setTimeout(() => setCopiedChargeId(null), 2000);
  };

  const handleSetDefaultPaymentMethod = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((pm) => ({
        ...pm,
        isDefault: pm.id === id,
      }))
    );
    showToast('Primary default payment method updated successfully.');
  };

  const handleDeletePaymentMethod = (id: string) => {
    if (paymentMethods.length <= 1) {
      showToast('You must keep at least one active payment method on file.');
      return;
    }
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    showToast('Payment method removed from Stripe vault.');
  };

  const handleDownloadInvoicePdf = (inv: InvoiceItem) => {
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice - ${inv.number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 40px; background: #ffffff; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: 900; color: #4f46e5; letter-spacing: -0.5px; }
    .sub-logo { font-size: 12px; color: #64748b; margin-top: 2px; }
    .badge { background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; display: inline-block; letter-spacing: 0.5px; }
    .inv-title { margin: 8px 0 0; font-size: 22px; font-weight: 800; color: #0f172a; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 13px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; }
    .box-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
    th { text-align: left; padding: 12px 10px; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 10px; font-weight: 800; color: #475569; letter-spacing: 0.5px; }
    td { padding: 14px 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
    .total-row { font-weight: 900; font-size: 15px; background: #e0e7ff; }
    .total-row td { border-bottom: none; }
    .footer { font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">EDIMP Partner Platform</div>
      <div class="sub-logo">Enterprise Data Integration & Migration Platform</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">PAID IN FULL</span>
      <h2 class="inv-title">${inv.number}</h2>
      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Issue Date: ${inv.date}</div>
    </div>
  </div>

  <div class="grid">
    <div class="box">
      <div class="box-title">Billed To</div>
      <strong style="font-size: 14px;">Global Systems Integrator LLC</strong><br/>
      Corporate Treasury & Accounts Payable<br/>
      Tax ID / VAT: US-9921827
    </div>
    <div class="box">
      <div class="box-title">Payment & Charge Reference</div>
      Stripe Charge ID: <code style="color: #4f46e5; font-weight: bold;">${inv.stripeChargeId}</code><br/>
      Payment Method: ${inv.paymentMethod}<br/>
      Service Period: ${inv.period}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Unit Price</th>
        <th style="text-align: right;">Total Amount</th>
      </tr>
    </thead>
    <tbody>
      ${inv.lineItems
        .map(
          (item) => `
        <tr>
          <td><strong>${item.description}</strong></td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">$${item.unitPrice.toLocaleString()}</td>
          <td style="text-align: right; font-weight: bold;">$${item.amount.toLocaleString()}</td>
        </tr>
      `
        )
        .join('')}
      <tr class="total-row">
        <td colspan="3" style="text-align: right; font-weight: 800;">TOTAL PAID:</td>
        <td style="text-align: right; color: #4f46e5;">$${inv.amount.toLocaleString()} USD</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Processed & Vaulted by Stripe Payments Inc. PCI-DSS Level 1 Compliant.<br/>
    Thank you for your business with EDIMP Enterprise Migration Platform.
  </div>
</body>
</html>
    `;

    const blob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${inv.number}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`📥 Generated and downloaded PDF summary for ${inv.number}`);
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingStripePayment(true);

    setTimeout(() => {
      setIsProcessingStripePayment(false);
      const cleanNum = cardForm.number.replace(/\s+/g, '');
      const last4 = cleanNum.length >= 4 ? cleanNum.slice(-4) : '4242';

      const newPm: PaymentMethod = {
        id: `pm_${Date.now().toString().slice(-6)}`,
        brand: cleanNum.startsWith('5') ? 'mastercard' : cleanNum.startsWith('3') ? 'amex' : 'visa',
        last4,
        expMonth: cardForm.expMonth,
        expYear: cardForm.expYear,
        holderName: cardForm.name || 'Partner Billing Account',
        isDefault: cardForm.isDefault,
      };

      if (cardForm.isDefault) {
        setPaymentMethods((prev) =>
          prev.map((pm) => ({ ...pm, isDefault: false })).concat(newPm)
        );
      } else {
        setPaymentMethods((prev) => [...prev, newPm]);
      }

      setShowAddCardModal(false);
      setShowManagePaymentModal(false);
      setCardForm({
        number: '',
        expMonth: '12',
        expYear: '2028',
        cvc: '',
        name: 'Global Systems Integrator LLC',
        zip: '90210',
        country: 'United States',
        isDefault: true,
      });
      showToast(`⚡ Stripe Tokenized! Card ending in ${last4} added successfully.`);
    }, 1500);
  };

  const handleConfirmPlanChange = () => {
    if (!selectedPlanForUpgrade) return;
    setIsProcessingStripePayment(true);

    setTimeout(() => {
      setIsProcessingStripePayment(false);
      const planName = selectedPlanForUpgrade.name;
      const amount = billingCycle === 'annual' ? selectedPlanForUpgrade.annualPrice : selectedPlanForUpgrade.monthlyPrice;
      setCurrentTier(planName);

      // Add new invoice record
      const newInv: InvoiceItem = {
        id: `in_${Date.now().toString().slice(-6)}`,
        number: `INV-2026-080${invoices.length + 1}`,
        date: 'Today',
        period: 'Aug 10, 2026 – Aug 09, 2027',
        amount: amount,
        status: 'paid',
        paymentMethod: paymentMethods.find((p) => p.isDefault)?.holderName + ` (${paymentMethods.find((p) => p.isDefault)?.last4})` || 'Visa 4242',
        stripeChargeId: `ch_3M${Math.random().toString(36).substring(2, 10)}`,
        lineItems: [
          { description: `${planName} Tier (${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Subscription)`, quantity: 1, unitPrice: amount, amount: amount },
          { description: 'Prorated Plan Upgrade Adjustment', quantity: 1, unitPrice: 0, amount: 0 },
        ],
      };

      setInvoices((prev) => [newInv, ...prev]);
      setSelectedPlanForUpgrade(null);
      showToast(`🎉 Subscription Plan updated to "${planName}" ($${amount.toLocaleString()}/mo)! Payment intent charged via Stripe.`);
    }, 1800);
  };

  // Plan tiers configuration
  const planTiers = [
    {
      id: 'trial',
      name: 'Trial',
      badge: 'Evaluation',
      monthlyPrice: 0,
      annualPrice: 0,
      workspaces: '1 Workspace',
      storage: '10 GB Storage',
      throughput: '10 MB/s Stream',
      support: 'Community Support',
      features: [
        '1 Customer Tenant Workspace',
        'Basic Connectors',
        'Standard Mapping Engine',
        'Community Forum Access',
      ],
    },
    {
      id: 'starter',
      name: 'Starter',
      badge: 'Small Teams',
      monthlyPrice: 499,
      annualPrice: 399,
      workspaces: 'Up to 3 Workspaces',
      storage: '1 TB Storage',
      throughput: '50 MB/s Stream',
      support: 'Email Support',
      features: [
        '3 Customer Tenant Workspaces',
        'Standard ERP Connectors',
        'Basic Mapping & Cleansing Engine',
        'Email Technical Support',
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      badge: 'Popular',
      monthlyPrice: 1999,
      annualPrice: 1599,
      workspaces: 'Up to 10 Workspaces',
      storage: '10 TB Storage',
      throughput: '250 MB/s Stream',
      support: '24/7 Support',
      features: [
        '10 Customer Tenant Workspaces',
        'All Enterprise ERP & Cloud Connectors',
        'AI-Powered Auto Mapping',
        'Role Based Access (RBAC)',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      badge: 'Large Scale',
      monthlyPrice: 4999,
      annualPrice: 3999,
      workspaces: 'Up to 50 Workspaces',
      storage: '50 TB Storage',
      throughput: '1 GB/s Relay',
      support: 'Dedicated TAM',
      features: [
        '50 Customer Tenant Workspaces',
        'Dedicated Multi-Region Relay Nodes',
        'Real-time PII Anonymization',
        'White-label Branded Portals',
        'Dedicated Technical Account Manager (TAM)',
      ],
    },
    {
      id: 'partner',
      name: 'Partner',
      badge: 'Agencies & SIs',
      monthlyPrice: 8999,
      annualPrice: 7599,
      workspaces: 'Up to 100 Workspaces',
      storage: '100 TB Storage',
      throughput: '2.5 GB/s Relay',
      support: 'Priority SLA',
      isCurrent: true,
      features: [
        '100 Customer Tenant Workspaces',
        'Partner Co-branding Options',
        'Partner Portal Access',
        'Priority SLA Support',
        'Advanced Analytics',
      ],
    },
    {
      id: 'unlimited',
      name: 'Unlimited',
      badge: 'Custom',
      monthlyPrice: 25000,
      annualPrice: 20000,
      workspaces: 'Unlimited Workspaces',
      storage: 'Unlimited Storage',
      throughput: 'Custom',
      support: 'Executive SLA',
      features: [
        'Unlimited Customer Tenant Workspaces',
        'Isolated VPC & Dedicated Database Cluster',
        'Custom CNAME Domain & SSL Branding',
        'Direct Database Read Replicas',
        'Custom Connector SDK Assistance',
      ],
    },
  ];

  // Search Filtered Subscription Plan Tiers
  const filteredPlanTiers = useMemo(() => {
    if (!searchQuery.trim()) return planTiers;
    const q = searchQuery.toLowerCase().trim();
    return planTiers.filter((tier) => {
      const matchName = tier.name.toLowerCase().includes(q);
      const matchBadge = tier.badge?.toLowerCase().includes(q);
      const matchWorkspaces = tier.workspaces.toLowerCase().includes(q);
      const matchStorage = tier.storage.toLowerCase().includes(q);
      const matchThroughput = tier.throughput.toLowerCase().includes(q);
      const matchSupport = tier.support.toLowerCase().includes(q);
      const matchFeatures = tier.features.some((f) => f.toLowerCase().includes(q));
      const matchPrice =
        tier.monthlyPrice.toString().includes(q) ||
        tier.annualPrice.toString().includes(q) ||
        `$${tier.monthlyPrice}`.includes(q) ||
        `$${tier.annualPrice}`.includes(q);
      return matchName || matchBadge || matchWorkspaces || matchStorage || matchThroughput || matchSupport || matchFeatures || matchPrice;
    });
  }, [planTiers, searchQuery]);

  // Search Filtered Invoices
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase().trim();
    return invoices.filter((inv) => {
      const matchNum = inv.number.toLowerCase().includes(q);
      const matchDate = inv.date.toLowerCase().includes(q);
      const matchPeriod = inv.period.toLowerCase().includes(q);
      const matchPm = inv.paymentMethod.toLowerCase().includes(q);
      const matchStripe = inv.stripeChargeId.toLowerCase().includes(q);
      const matchStatus = inv.status.toLowerCase().includes(q);
      const matchAmount = inv.amount.toString().includes(q) || `$${inv.amount.toLocaleString()}`.toLowerCase().includes(q);
      const matchLineItems = inv.lineItems.some((item) => item.description.toLowerCase().includes(q));
      return matchNum || matchDate || matchPeriod || matchPm || matchStripe || matchStatus || matchAmount || matchLineItems;
    });
  }, [invoices, searchQuery]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Page Title & Header Banner (EMCC White Theme) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-3xs">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                Stripe Billing Vault
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-3xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                PCI-DSS Level 1 Compliant
              </span>
              <span className="text-slate-400 text-[11px] font-mono">
                Customer ID: <strong className="text-slate-700 font-bold">cus_N99281726</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Partner Subscription &amp; Billing Portal
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed font-medium">
              Manage reseller agency tiers, credit card payment methods, automated recurring invoicing, and capacity usage for <strong className="text-slate-800">Global Systems Integrator LLC</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setShowManagePaymentModal(true)}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-indigo-500/20"
            >
              <CreditCard className="w-4 h-4" />
              <span>Manage Payment Methods</span>
            </button>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3 shadow-2xs">
              <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Active Tier</div>
                <div className="text-base font-black text-slate-900 font-mono">{currentTier}</div>
                <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Auto-renews Sep 01, 2026
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Search & Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 relative z-10">
          <div className="relative flex-1 max-w-2xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoices (e.g. INV-2026, Visa, $14,800), subscription plans (e.g. Enterprise, 50 Workspaces), or line items..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-9 pr-24 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-2xs"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-slate-600 hover:text-slate-900 bg-slate-200/80 hover:bg-slate-300 rounded-lg text-xs flex items-center gap-1 font-bold cursor-pointer transition-colors border border-slate-300"
              >
                <X className="w-3 h-3" />
                <span className="text-[10px]">Clear</span>
              </button>
            ) : (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 font-mono text-[10px] font-bold border border-slate-200 pointer-events-none hidden sm:block">
                Quick Search
              </div>
            )}
          </div>

          {searchQuery.trim() && (
            <div className="flex items-center gap-2 text-xs font-mono shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                Filter Active
              </span>
              <span className="text-slate-500 text-[11px]">
                Matching: <strong className="text-slate-900">{filteredInvoices.length}</strong> invoices, <strong className="text-slate-900">{filteredPlanTiers.length}</strong> plans
              </span>
            </div>
          )}
        </div>
{/* Sub-navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-slate-200 overflow-x-auto hide-scrollbar relative z-10">
          {[
            { id: 'plans', label: 'Subscription Plans', icon: Zap, count: searchQuery ? filteredPlanTiers.length : null },
            { id: 'licenses', label: 'License Types', icon: KeyRound },
            { id: 'analytics', label: 'Spend & Usage Forecast', icon: TrendingUp },
            { id: 'forecast-trend', label: 'Forecast Trend (D3)', icon: BarChart3 },
            { id: 'heatmap', label: 'Peak Usage Heatmap', icon: Flame },
            { id: 'payment-methods', label: 'Payment Methods & Cards', icon: CreditCard },
            { id: 'invoices', label: 'Invoices & Receipts', icon: FileText, count: searchQuery ? filteredInvoices.length : null },
            { id: 'reconciliation', label: 'Payment Reconciliation', icon: ShieldAlert, badge: 'Flagged Mismatches' },
            { id: 'transactions', label: 'Transaction Logs', icon: ListOrdered },
            { id: 'alerts', label: 'Alert Settings', icon: BellRing },
            { id: 'tax-estimate', label: 'Tax & VAT Estimate', icon: Calculator },
            { id: 'usage', label: 'Capacity & Overages', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                    isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-700 text-slate-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: SUBSCRIPTION PLANS & UPGRADES */}
      {activeSubTab === 'plans' && (
        <div className="space-y-6">
          {/* Billing Cycle Switcher Banner */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Select Partner Reseller Commitment Term
              </h3>
              <p className="text-slate-500 text-xs">
                Switching to annual billing unlocks up to 20% discount on all partner workspace capacity allocations.
              </p>
            </div>

            <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-indigo-600 shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual Commitment</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-400 text-slate-950 font-black">
                  20% OFF
                </span>
              </button>
            </div>
          </div>

          {/* Plan Tier Cards Grid */}
          {filteredPlanTiers.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="text-base font-extrabold text-slate-900">No subscription plans match "{searchQuery}"</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try searching for terms like "Starter", "Pro", "Enterprise", "Storage", or "Workspaces".
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredPlanTiers.map((tier) => {
                const isCurrent = currentTier === tier.name;
                const price = billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice;

              return (
                <div
                  key={tier.id}
                  className={`bg-white rounded-3xl border p-6 flex flex-col justify-between space-y-6 transition-all ${
                    isCurrent
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xl relative overflow-hidden'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black uppercase font-mono px-3 py-1 rounded-bl-2xl">
                      Active Plan
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold">
                        {tier.badge}
                      </span>
                      <h4 className="text-lg font-black text-slate-900 mt-2">{tier.name}</h4>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                          ${price.toLocaleString()}
                        </span>
                        <span className="text-slate-500 text-xs font-medium">/mo</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {billingCycle === 'annual' ? 'Billed annually ($' + (price * 12).toLocaleString() + '/yr)' : 'Billed monthly'}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="font-extrabold text-slate-900 uppercase text-[10px] font-mono text-slate-400">
                        Included Allocation:
                      </div>
                      <div className="space-y-1.5 font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{tier.workspaces}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{tier.storage}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{tier.support}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <div className="font-extrabold text-slate-900 uppercase text-[10px] font-mono text-slate-400">
                        Key Capabilities:
                      </div>
                      <ul className="space-y-2 text-[11px] text-slate-600">
                        {tier.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-2.5 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Current Active Plan</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedPlanForUpgrade(tier)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Upgrade / Change Plan</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* Real-time Tax Estimate & Registered Business Location Preview */}
          <div className="pt-2">
            <TaxEstimatePreviewComponent
              initialSubtotal={1250}
              initialBillingCycle={billingCycle}
              onShowToast={showToast}
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PAYMENT METHODS & STRIPE CARD MANAGEMENT */}
      {activeSubTab === 'payment-methods' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Stripe Tokenized Payment Vault
                </h3>
                <p className="text-slate-500 text-xs">
                  Your payment information is tokenized and stored securely inside Stripe PCI-Level 1 vaults. No raw card numbers are stored on EDIMP servers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div
                  onClick={() => {
                    const nextState = !autoPayEnabled;
                    setAutoPayEnabled(nextState);
                    showToast(
                      nextState
                        ? '⚡ Auto-Pay enabled! Recurring subscription charges will automatically bill your primary payment method.'
                        : '⏸️ Auto-Pay paused. Invoices will require manual payment settlement.'
                    );
                  }}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                    autoPayEnabled
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                  title="Click to toggle Auto-Pay automation"
                >
                  <Zap className={`w-4 h-4 ${autoPayEnabled ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <span>Auto-Pay: {autoPayEnabled ? 'ENABLED' : 'PAUSED'}</span>
                  <div className={`w-3 h-3 rounded-full ${autoPayEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                </div>

                <button
                  onClick={() => setShowManagePaymentModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0 border border-indigo-400/30"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Manage Payment Methods</span>
                </button>
              </div>
            </div>

            {/* Saved Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className={`bg-white text-slate-900 p-6 rounded-3xl border shadow-2xs relative flex flex-col justify-between h-52 transition-all ${
                    pm.isDefault ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold font-mono text-sm tracking-wider uppercase text-indigo-600">
                        {pm.brand === 'visa' ? 'VISA' : pm.brand === 'mastercard' ? 'MASTERCARD' : pm.brand === 'ach' ? 'ACH DEBIT' : 'AMEX'}
                      </span>
                      {pm.isDefault && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 font-mono">{pm.bankName || 'Corporate Credit Card'}</div>
                    <div className="text-xl font-black font-mono tracking-widest text-slate-900">
                      •••• •••• •••• <span className="text-indigo-600">{pm.last4}</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between text-xs pt-2 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">CARDHOLDER</div>
                      <div className="font-bold text-slate-800 truncate max-w-[180px]">{pm.holderName}</div>
                    </div>
                    {pm.expMonth !== '--' && (
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-mono">EXPIRES</div>
                        <div className="font-bold text-slate-800 font-mono">{pm.expMonth}/{pm.expYear}</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    {!pm.isDefault ? (
                      <button
                        onClick={() => handleSetDefaultPaymentMethod(pm.id)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                      >
                        Set as Primary Default
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Primary Default Method
                      </span>
                    )}

                    <button
                      onClick={() => handleDeletePaymentMethod(pm.id)}
                      className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                      title="Delete card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: INVOICES & STATEMENTS */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Stripe Invoice History &amp; Receipts
                </h3>
                <p className="text-slate-500 text-xs">
                  All subscription charges, renewals, and overage invoices generated for Global Systems Integrator LLC.
                </p>
              </div>

              <button
                onClick={() => showToast('📥 Exporting full annual billing statement (CSV/PDF)...')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Export Statement</span>
              </button>
            </div>

            {/* Invoice Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono font-bold uppercase text-[10px]">
                    <th className="pb-3">Invoice ID</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Billing Period</th>
                    <th className="pb-3">Payment Method</th>
                    <th className="pb-3">Stripe Charge ID</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 space-y-2">
                        <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700">No invoices matched "{searchQuery}"</p>
                        <p className="text-xs text-slate-400">Try searching by Invoice ID (e.g. INV-2026), Stripe Charge ID, date, or card number.</p>
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-2 px-3.5 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs hover:bg-indigo-500 transition-colors"
                        >
                          Clear Search
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 font-mono font-bold text-slate-900">{inv.number}</td>
                        <td className="py-3.5 text-slate-600 font-medium">{inv.date}</td>
                        <td className="py-3.5 text-slate-600 font-mono text-[11px]">{inv.period}</td>
                        <td className="py-3.5 text-slate-700 font-medium">{inv.paymentMethod}</td>
                        <td className="py-3.5">
                          <button
                            onClick={() => handleCopyChargeId(inv.stripeChargeId)}
                            className="font-mono text-[11px] text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{inv.stripeChargeId}</span>
                            {copiedChargeId === inv.stripeChargeId ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 font-mono font-black text-slate-900 text-sm">
                          ${inv.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {inv.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 text-right space-x-2">
                          <button
                            onClick={() => setSelectedInvoiceForModal(inv)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1"
                          >
                            <Receipt className="w-3 h-3" /> Details
                          </button>
                          <button
                            onClick={() => handleDownloadInvoicePdf(inv)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors"
                            title="Download PDF Invoice"
                          >
                            <Download className="w-3 h-3" /> Download Invoice
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: LICENSE TYPES & QUOTAS */}
      {(activeSubTab as any) === 'licenses' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-indigo-600" />
                    Available License Types & Entitlements
                  </h3>
                  <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                    Request Custom Quota
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { type: 'Named User', code: 'L-NAMED', count: 1250, limit: 5000, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { type: 'Concurrent User', code: 'L-CONC', count: 45, limit: 100, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { type: 'Per Tenant', code: 'L-TENANT', count: 48, limit: 100, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { type: 'Per Project', code: 'L-PROJ', count: 12, limit: 25, color: 'text-sky-600', bg: 'bg-sky-50' },
                    { type: 'Per Migration', code: 'L-MIGR', count: 86, limit: 150, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { type: 'Consumption Based', code: 'L-CONS', count: 850, limit: 1000, color: 'text-violet-600', bg: 'bg-violet-50', unit: 'GB' },
                  ].map((license, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg ${license.bg} ${license.color}`}>
                          <Box className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{license.code}</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{license.type}</div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-xl font-black text-slate-900">
                            {license.count.toLocaleString()}
                            {license.unit && <span className="text-[10px] ml-1 font-normal text-slate-500">{license.unit}</span>}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400">OF {license.limit.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${license.bg.replace('bg-', 'bg-').replace('-50', '-500')}`} 
                          style={{ width: `${(license.count / license.limit) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 text-slate-900 space-y-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Enterprise License Optimizer</h4>
                    <p className="text-slate-500 text-xs mt-0.5">AI-driven recommendations for license consolidation</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs leading-relaxed text-slate-700">
                  <strong className="text-slate-900">Observation:</strong> You have 240 unused "Named User Licenses" across 4 inactive tenants. Consolidating these could save approximately <span className="text-emerald-700 font-bold">$1,200/month</span> on your next renewal cycle.
                </div>
                <button className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-xs cursor-pointer">
                  Run Consolidation Wizard
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Compliance Summary</h4>
                <div className="space-y-4">
                  {[
                    { label: 'Audit Readiness', value: 'Level 4 (High)', color: 'text-emerald-600' },
                    { label: 'License Overages', value: '0 Detected', color: 'text-slate-600' },
                    { label: 'Risk Exposure', value: 'Low', color: 'text-emerald-600' },
                    { label: 'Next Renewal', value: 'Oct 15, 2026', color: 'text-indigo-600' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                      <span className="text-xs text-slate-500">{item.label}</span>
                      <span className={`text-xs font-bold ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer">
                  Download Full Audit
                </button>
              </div>

              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Upcoming Expirations
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-amber-700">
                    <span>SAP Connector (Test)</span>
                    <span className="font-bold">2 Days Left</span>
                  </div>
                  <div className="w-full bg-amber-200 h-1 rounded-full">
                    <div className="bg-amber-600 h-full w-[90%]" />
                  </div>
                </div>
                <p className="text-[10px] text-amber-600 leading-tight">
                  3 licenses are set to expire within 14 days. Enable auto-renewal in settings to prevent service interruption.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: SPEND & USAGE FORECAST ANALYTICS */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <PartnerSpendForecastChart
            currentTierName={currentTier}
            onUpgradeClick={() => setActiveSubTab('plans')}
            onShowToast={showToast}
          />
        </div>
      )}

      {/* SUB-TAB: D3 CONSUMPTION FORECAST TREND */}
      {activeSubTab === 'forecast-trend' && (
        <div className="space-y-6">
          <D3ConsumptionForecastChart
            currentTierName={currentTier}
            onUpgradeClick={() => setActiveSubTab('plans')}
            onShowToast={showToast}
          />
        </div>
      )}

      {/* SUB-TAB: MIGRATION DATA USAGE HEATMAP */}
      {activeSubTab === 'heatmap' && (
        <div className="space-y-6">
          <MigrationUsageHeatmap
            onShowToast={showToast}
            onUpgradeClick={() => setActiveSubTab('plans')}
          />
        </div>
      )}

      {/* SUB-TAB: PAYMENT RECONCILIATION & DISCREPANCY AUDIT */}
      {activeSubTab === 'reconciliation' && (
        <div className="space-y-6">
          <PaymentReconciliationView onShowToast={showToast} />
        </div>
      )}

      {/* SUB-TAB: TRANSACTION LOGS */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-6">
          <TransactionLogsView onShowToast={showToast} />
        </div>
      )}

      {/* SUB-TAB: ALERT SETTINGS */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-6">
          <BillingAlertSettingsView onShowToast={showToast} />
        </div>
      )}

      {/* SUB-TAB: TAX & VAT ESTIMATE */}
      {activeSubTab === 'tax-estimate' && (
        <div className="space-y-6">
          <TaxEstimatePreviewComponent
            initialSubtotal={1250}
            initialBillingCycle={billingCycle}
            onShowToast={showToast}
          />
        </div>
      )}

      {/* SUB-TAB 4: USAGE & CAPACITY OVERAGES */}
      {activeSubTab === 'usage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Workspaces Gauge */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-slate-500 font-mono text-[10px] font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-indigo-600" /> Active Workspaces
                </span>
                <span className="text-slate-900 font-extrabold">38 / 50 Used</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">76% Allocated</div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full w-[76%]" />
              </div>
              <div className="text-[11px] text-slate-500">
                12 customer workspace slots available under Enterprise Agency plan.
              </div>
            </div>

            {/* Storage Quota Gauge */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-slate-500 font-mono text-[10px] font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-emerald-600" /> Storage Capacity
                </span>
                <span className="text-slate-900 font-extrabold">64.2 / 100 TB</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">64.2 TB Used</div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[64.2%]" />
              </div>
              <div className="text-[11px] text-slate-500">
                Overage rate: $150 / TB for capacity exceeding 100 TB baseline.
              </div>
            </div>

            {/* CDC Stream Gauge */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-slate-500 font-mono text-[10px] font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-600" /> CDC Streaming Relay
                </span>
                <span className="text-slate-900 font-extrabold">1.8 / 2.5 GB/s</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">1.8 GB/s Bandwidth</div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full w-[72%]" />
              </div>
              <div className="text-[11px] text-slate-500">
                Dedicated multi-region CDC streaming nodes operating within normal limits.
              </div>
            </div>
          </div>

          <PartnerSpendForecastChart
            currentTierName={currentTier}
            onUpgradeClick={() => setActiveSubTab('plans')}
            onShowToast={showToast}
          />
        </div>
      )}

      {/* MODAL: MANAGE PAYMENT METHODS */}
      {showManagePaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 text-indigo-400">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-white">Manage Payment Methods</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      PCI-DSS Level 1
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Select primary billing method or add new tokenized card details</p>
                </div>
              </div>

              <button
                onClick={() => setShowManagePaymentModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* SECTION 0: AUTOMATIC RECURRING BILLING TOGGLE */}
              <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-indigo-500/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${
                    autoPayEnabled
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  }`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-white">Enable Auto-Pay</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        autoPayEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {autoPayEnabled ? 'AUTOMATED' : 'MANUAL BILLING'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                      Automatically settle monthly recurring subscription charges on the 1st of each month using your primary vaulted card.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !autoPayEnabled;
                      setAutoPayEnabled(nextState);
                      showToast(
                        nextState
                          ? '⚡ Auto-Pay enabled! Recurring subscription charges will automatically bill your primary payment method.'
                          : '⏸️ Auto-Pay paused. Monthly invoices will require manual settlement.'
                      );
                    }}
                    className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      autoPayEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={autoPayEnabled}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        autoPayEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* SECTION 1: PRIMARY BILLING METHOD SELECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Saved Payment Vault &amp; Primary Selection
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {paymentMethods.length} Saved {paymentMethods.length === 1 ? 'Method' : 'Methods'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      onClick={() => handleSetDefaultPaymentMethod(pm.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        pm.isDefault
                          ? 'bg-slate-900 text-white border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-mono font-bold uppercase ${pm.isDefault ? 'text-indigo-400' : 'text-slate-600'}`}>
                          {pm.brand === 'visa' ? 'VISA' : pm.brand === 'mastercard' ? 'MASTERCARD' : pm.brand === 'ach' ? 'ACH DEBIT' : 'AMEX'}
                        </span>
                        {pm.isDefault ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PRIMARY DEFAULT
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefaultPaymentMethod(pm.id);
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            Set as Primary
                          </button>
                        )}
                      </div>

                      <div className="font-mono text-base font-black tracking-wider mb-1">
                        •••• •••• •••• {pm.last4}
                      </div>

                      <div className="flex items-center justify-between text-[11px] opacity-80 pt-2 border-t border-slate-200/20">
                        <span className="truncate max-w-[140px] font-medium">{pm.holderName}</span>
                        {pm.expMonth !== '--' && <span>Expires {pm.expMonth}/{pm.expYear}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* SECTION 2: INPUT NEW CARD DETAILS */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  Input New Card Details
                </h4>

                <form onSubmit={handleAddCardSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Global Systems Integrator LLC"
                      value={cardForm.name}
                      onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Credit Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={19}
                        placeholder="4242 4242 4242 4242"
                        value={cardForm.number}
                        onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 tracking-wider"
                      />
                      <CreditCard className="w-5 h-5 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Exp Month</label>
                      <select
                        value={cardForm.expMonth}
                        onChange={(e) => setCardForm({ ...cardForm, expMonth: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                      >
                        {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Exp Year</label>
                      <select
                        value={cardForm.expYear}
                        onChange={(e) => setCardForm({ ...cardForm, expYear: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                      >
                        {['2026', '2027', '2028', '2029', '2030', '2031'].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">CVC / CVV</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="123"
                        value={cardForm.cvc}
                        onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Zip / Postal Code</label>
                      <input
                        type="text"
                        required
                        placeholder="90210"
                        value={cardForm.zip}
                        onChange={(e) => setCardForm({ ...cardForm, zip: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Country</label>
                      <select
                        value={cardForm.country}
                        onChange={(e) => setCardForm({ ...cardForm, country: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                      >
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Germany">Germany</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="defaultManageCheck"
                      checked={cardForm.isDefault}
                      onChange={(e) => setCardForm({ ...cardForm, isDefault: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="defaultManageCheck" className="text-slate-700 font-bold cursor-pointer">
                      Set as primary default payment method for auto-renewal
                    </label>
                  </div>

                  <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 text-[11px] text-indigo-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Card details will be tokenized directly via Stripe Elements. Zero plain-text card storage.</span>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowManagePaymentModal(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Done / Close
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessingStripePayment}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all"
                    >
                      {isProcessingStripePayment ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Tokenizing via Stripe...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Save &amp; Set Primary Method</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: MOCK STRIPE CHECKOUT ADD CARD */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Stripe Card Vaulting</h3>
                  <p className="text-[11px] text-slate-400">Tokenize &amp; store credit card for auto-renewal</p>
                </div>
              </div>

              <button
                onClick={() => setShowAddCardModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCardSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  required
                  placeholder="Global Systems Integrator LLC"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Credit Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    value={cardForm.number}
                    onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 tracking-wider"
                  />
                  <CreditCard className="w-5 h-5 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exp Month</label>
                  <select
                    value={cardForm.expMonth}
                    onChange={(e) => setCardForm({ ...cardForm, expMonth: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                  >
                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exp Year</label>
                  <select
                    value={cardForm.expYear}
                    onChange={(e) => setCardForm({ ...cardForm, expYear: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                  >
                    {['2026', '2027', '2028', '2029', '2030', '2031'].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CVC / CVV</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="123"
                    value={cardForm.cvc}
                    onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Zip / Postal Code</label>
                  <input
                    type="text"
                    required
                    placeholder="90210"
                    value={cardForm.zip}
                    onChange={(e) => setCardForm({ ...cardForm, zip: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Country</label>
                  <select
                    value={cardForm.country}
                    onChange={(e) => setCardForm({ ...cardForm, country: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Germany">Germany</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={cardForm.isDefault}
                  onChange={(e) => setCardForm({ ...cardForm, isDefault: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="defaultCheck" className="text-slate-700 font-bold cursor-pointer">
                  Set as primary default payment method for auto-renewal
                </label>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[10px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Test Card Ready: Use 4242 4242 4242 4242 to simulate successful Stripe card verification.</span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingStripePayment}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  {isProcessingStripePayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Tokenizing via Stripe...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Save Payment Method</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM PLAN CHANGE / UPGRADE */}
      {selectedPlanForUpgrade && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                Confirm Subscription Plan Change
              </h3>
              <button
                onClick={() => setSelectedPlanForUpgrade(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 space-y-2">
                <div className="text-[10px] uppercase font-mono font-bold text-indigo-700">Selected Plan</div>
                <div className="text-xl font-black text-indigo-950">{selectedPlanForUpgrade.name}</div>
                <div className="text-lg font-bold font-mono text-indigo-600">
                  ${(billingCycle === 'annual' ? selectedPlanForUpgrade.annualPrice : selectedPlanForUpgrade.monthlyPrice).toLocaleString()} / month
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  {selectedPlanForUpgrade.workspaces} • {selectedPlanForUpgrade.storage}
                </div>
              </div>

              <div className="space-y-2 text-slate-700">
                <div className="font-bold">Payment Summary:</div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Prorated Adjustment Today:</span>
                  <span className="font-mono font-bold text-slate-900">$0.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Next Invoice Date:</span>
                  <span className="font-mono font-bold text-slate-900">September 1, 2026</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Charged to Default Method:</span>
                  <span className="font-mono font-bold text-indigo-600">Visa ending in 4242</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPlanForUpgrade(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPlanChange}
                  disabled={isProcessingStripePayment}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  {isProcessingStripePayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Charging Stripe Intent...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm &amp; Authorize Charge</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ITEMIZED INVOICE RECEIPT */}
      {selectedInvoiceForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="text-[10px] font-mono font-bold text-indigo-600 uppercase">Stripe Invoice Receipt</div>
                <h3 className="font-extrabold text-lg text-slate-900">{selectedInvoiceForModal.number}</h3>
              </div>
              <button
                onClick={() => setSelectedInvoiceForModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">Billed To</span>
                  <span className="font-extrabold text-slate-900 block">Global Systems Integrator LLC</span>
                  <span className="text-slate-500 block">Tax ID: US-9921827</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">Charge ID</span>
                  <span className="font-mono font-bold text-indigo-600 block">{selectedInvoiceForModal.stripeChargeId}</span>
                  <span className="text-emerald-600 font-bold block mt-0.5">Paid via {selectedInvoiceForModal.paymentMethod}</span>
                </div>
              </div>

              <div>
                <span className="font-extrabold text-slate-900 block mb-2 uppercase font-mono text-[10px] text-slate-400">
                  Itemized Line Items
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {selectedInvoiceForModal.lineItems.map((line, i) => (
                    <div key={i} className="p-3 flex items-center justify-between bg-white text-xs">
                      <span className="font-medium text-slate-800">{line.description}</span>
                      <span className="font-mono font-bold text-slate-900">${line.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="p-3 bg-slate-50 flex items-center justify-between font-extrabold text-sm border-t border-slate-200">
                    <span>Total Amount Charged:</span>
                    <span className="font-mono text-emerald-600">${selectedInvoiceForModal.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono">
                  Processed securely by Stripe Payments Inc.
                </span>
                <button
                  onClick={() => {
                    handleDownloadInvoicePdf(selectedInvoiceForModal);
                    setSelectedInvoiceForModal(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingManagementView;
