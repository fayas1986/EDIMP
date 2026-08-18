import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Building2,
  Globe,
  MapPin,
  Percent,
  DollarSign,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  FileText,
  Info,
  ArrowRight,
  Sparkles,
  Receipt,
  Download,
} from 'lucide-react';

export interface RegionalTaxRate {
  countryCode: string;
  countryName: string;
  regions: {
    code: string;
    name: string;
    taxRate: number; // percentage
    taxName: string; // e.g., "Sales Tax", "HST", "VAT", "GST"
  }[];
  defaultTaxRate: number;
  defaultTaxName: string;
  vatRequiresId: boolean;
}

export const REGIONAL_TAX_DATABASE: RegionalTaxRate[] = [
  {
    countryCode: 'US',
    countryName: 'United States',
    defaultTaxRate: 6.5,
    defaultTaxName: 'State & Local Sales Tax',
    vatRequiresId: false,
    regions: [
      { code: 'CA', name: 'California (CA)', taxRate: 8.825, taxName: 'CA State & District Sales Tax' },
      { code: 'NY', name: 'New York (NY)', taxRate: 8.875, taxName: 'NY State & City Combined Tax' },
      { code: 'TX', name: 'Texas (TX)', taxRate: 8.25, taxName: 'TX State & Local Sales Tax' },
      { code: 'FL', name: 'Florida (FL)', taxRate: 7.0, taxName: 'FL State Sales Tax' },
      { code: 'IL', name: 'Illinois (IL)', taxRate: 10.25, taxName: 'IL Chicago Metropolitan Tax' },
      { code: 'WA', name: 'Washington (WA)', taxRate: 9.3, taxName: 'WA Sales & Business Tax' },
      { code: 'OR', name: 'Oregon (OR)', taxRate: 0.0, taxName: 'No State Sales Tax Zone' },
      { code: 'DE', name: 'Delaware (DE)', taxRate: 0.0, taxName: 'No State Sales Tax Zone' },
    ],
  },
  {
    countryCode: 'CA',
    countryName: 'Canada',
    defaultTaxRate: 5.0,
    defaultTaxName: 'GST',
    vatRequiresId: false,
    regions: [
      { code: 'ON', name: 'Ontario (ON)', taxRate: 13.0, taxName: 'HST (Harmonized Sales Tax)' },
      { code: 'BC', name: 'British Columbia (BC)', taxRate: 12.0, taxName: 'GST (5%) + PST (7%)' },
      { code: 'QC', name: 'Quebec (QC)', taxRate: 14.975, taxName: 'GST (5%) + QST (9.975%)' },
      { code: 'AB', name: 'Alberta (AB)', taxRate: 5.0, taxName: 'GST Only' },
    ],
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    defaultTaxRate: 20.0,
    defaultTaxName: 'UK Standard VAT',
    vatRequiresId: true,
    regions: [
      { code: 'UK-ALL', name: 'All UK Regions', taxRate: 20.0, taxName: 'UK Standard VAT (20%)' },
    ],
  },
  {
    countryCode: 'DE',
    countryName: 'Germany (European Union)',
    defaultTaxRate: 19.0,
    defaultTaxName: 'MwSt. / EU VAT',
    vatRequiresId: true,
    regions: [
      { code: 'DE-ALL', name: 'All German States', taxRate: 19.0, taxName: 'Standard MwSt. (19%)' },
    ],
  },
  {
    countryCode: 'FR',
    countryName: 'France (European Union)',
    defaultTaxRate: 20.0,
    defaultTaxName: 'TVA / EU VAT',
    vatRequiresId: true,
    regions: [
      { code: 'FR-ALL', name: 'All French Regions', taxRate: 20.0, taxName: 'Standard TVA (20%)' },
    ],
  },
  {
    countryCode: 'AU',
    countryName: 'Australia',
    defaultTaxRate: 10.0,
    defaultTaxName: 'GST',
    vatRequiresId: true,
    regions: [
      { code: 'AU-ALL', name: 'All Australian States', taxRate: 10.0, taxName: 'Australian GST (10%)' },
    ],
  },
  {
    countryCode: 'SG',
    countryName: 'Singapore',
    defaultTaxRate: 9.0,
    defaultTaxName: 'GST',
    vatRequiresId: true,
    regions: [
      { code: 'SG-ALL', name: 'Singapore Island', taxRate: 9.0, taxName: 'Singapore GST (9%)' },
    ],
  },
];

export interface TaxEstimatePreviewProps {
  initialSubtotal?: number;
  initialBillingCycle?: 'monthly' | 'annual';
  onApplyTaxToAccount?: (estimatedRate: number, totalAmount: number) => void;
  onShowToast?: (msg: string) => void;
}

export const TaxEstimatePreviewComponent: React.FC<TaxEstimatePreviewProps> = ({
  initialSubtotal = 1250,
  initialBillingCycle = 'monthly',
  onApplyTaxToAccount,
  onShowToast,
}) => {
  // Address State
  const [countryCode, setCountryCode] = useState<string>('US');
  const [regionCode, setRegionCode] = useState<string>('CA');
  const [postalCode, setPostalCode] = useState<string>('94103');
  const [city, setCity] = useState<string>('San Francisco');
  const [taxIdNumber, setTaxIdNumber] = useState<string>('');
  const [isTaxExemptChecked, setIsTaxExemptChecked] = useState<boolean>(false);

  // Pricing State
  const [planAmount, setPlanAmount] = useState<number>(initialSubtotal);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(initialBillingCycle);

  // Selected Country & Region Data
  const selectedCountry = useMemo(() => {
    return REGIONAL_TAX_DATABASE.find((c) => c.countryCode === countryCode) || REGIONAL_TAX_DATABASE[0];
  }, [countryCode]);

  const selectedRegion = useMemo(() => {
    return selectedCountry.regions.find((r) => r.code === regionCode) || selectedCountry.regions[0];
  }, [selectedCountry, regionCode]);

  // Tax Validation Logic
  const hasValidVatExemption = useMemo(() => {
    if (isTaxExemptChecked) return true;
    if (!taxIdNumber.trim()) return false;
    // Simple EU/B2B VAT format validation e.g. GB123456789, DE123456789, EU123456789 or 9 digit EIN
    const cleaned = taxIdNumber.trim().toUpperCase();
    return cleaned.length >= 8;
  }, [taxIdNumber, isTaxExemptChecked]);

  // Tax Rate Calculation
  const effectiveTaxRate = useMemo(() => {
    if (hasValidVatExemption && (selectedCountry.vatRequiresId || isTaxExemptChecked)) {
      return 0.0; // Reverse charge / exempt
    }
    return selectedRegion ? selectedRegion.taxRate : selectedCountry.defaultTaxRate;
  }, [hasValidVatExemption, selectedCountry, selectedRegion, isTaxExemptChecked]);

  const effectiveTaxName = useMemo(() => {
    if (hasValidVatExemption && (selectedCountry.vatRequiresId || isTaxExemptChecked)) {
      return 'B2B Reverse Charge / Exempt (0%)';
    }
    return selectedRegion ? selectedRegion.taxName : selectedCountry.defaultTaxName;
  }, [hasValidVatExemption, selectedCountry, selectedRegion, isTaxExemptChecked]);

  // Financial Totals
  const subtotal = useMemo(() => {
    return billingCycle === 'annual' ? planAmount * 12 : planAmount;
  }, [planAmount, billingCycle]);

  const taxAmount = useMemo(() => {
    return (subtotal * effectiveTaxRate) / 100;
  }, [subtotal, effectiveTaxRate]);

  const grandTotal = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    const countryObj = REGIONAL_TAX_DATABASE.find((c) => c.countryCode === newCountryCode);
    if (countryObj && countryObj.regions.length > 0) {
      setRegionCode(countryObj.regions[0].code);
    }
  };

  const handleApplyTaxSettings = () => {
    if (onApplyTaxToAccount) {
      onApplyTaxToAccount(effectiveTaxRate, grandTotal);
    }
    if (onShowToast) {
      onShowToast(
        `✅ Registered business tax profile updated! Applied ${effectiveTaxName} (${effectiveTaxRate}%).`
      );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
            <Calculator className="w-6 h-6" />
          </span>
          <div>
            <h4 className="text-lg font-black text-slate-900">
              Real-Time Regional Tax Estimate &amp; Business Address
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculate exact regional sales tax, HST, and EU VAT reverse charges based on your registered business entity location.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Cycle
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
              billingCycle === 'annual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Annual (15% Disc)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: BUSINESS ADDRESS & TAX ID INPUTS */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Registered Business Location</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Country Selection */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Country / Jurisdiction</label>
                <select
                  value={countryCode}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                >
                  {REGIONAL_TAX_DATABASE.map((c) => (
                    <option key={c.countryCode} value={c.countryCode}>
                      {c.countryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* State / Province Selection */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">State / Province / Region</label>
                <select
                  value={regionCode}
                  onChange={(e) => setRegionCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                >
                  {selectedCountry.regions.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name} ({r.taxRate}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* City Name */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="San Francisco"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Postal / ZIP Code */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Postal / ZIP Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="94103"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            {/* B2B Tax ID / VAT Registration Field */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Tax Registration Number (VAT / GST / EIN)
                </label>
                {hasValidVatExemption && (
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                    <ShieldCheck className="w-3 h-3" /> Valid Tax ID Verified
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={taxIdNumber}
                  onChange={(e) => setTaxIdNumber(e.target.value)}
                  placeholder="e.g. DE123456789 or EIN 12-3456789"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isTaxExemptChecked}
                  onChange={(e) => setIsTaxExemptChecked(e.target.checked)}
                  className="text-indigo-600 rounded cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Organization is tax-exempt or holds a Reseller Certificate
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME TAX BREAKDOWN & FINAL TOTALS (White Theme) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white text-slate-900 rounded-2xl p-5 border border-slate-200 space-y-4 shadow-2xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-indigo-600" /> Real-Time Tax Estimate
              </span>
              <span className="px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold border border-indigo-200/80 shadow-3xs">
                LIVE CALCULATION
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Plan Base Amount:</span>
                <span className="font-bold text-slate-900 text-sm">
                  ${planAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} / mo
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Billing Period:</span>
                <span className="font-bold text-slate-800 uppercase">
                  {billingCycle} ({billingCycle === 'annual' ? '12 Months' : '1 Month'})
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Subtotal Before Tax:</span>
                <span className="font-bold text-slate-900 text-sm">
                  ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Tax Rate Line */}
              <div className="flex items-start justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div>
                  <div className="text-[11px] font-bold text-indigo-900">
                    {effectiveTaxName}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Jurisdiction: {selectedCountry.countryName} ({selectedRegion?.name})
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-amber-600">
                    +{effectiveTaxRate}%
                  </div>
                  <div className="text-[11px] font-bold text-amber-700">
                    +${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GRAND TOTAL BOX */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-mono text-slate-500 font-bold">Estimated Invoice Total:</span>
              <span className="text-2xl font-black text-emerald-600 font-mono">
                ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={handleApplyTaxSettings}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 border border-indigo-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Registered Tax Profile To Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
