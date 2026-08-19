import React, { useState } from 'react';
import {
  BellRing,
  DollarSign,
  AlertTriangle,
  Mail,
  Sliders,
  CheckCircle2,
  Send,
  Save,
  ShieldAlert,
  Zap,
  HardDrive,
  Users,
  Activity,
  Webhook,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';

export interface BillingAlertRule {
  id: string;
  category: 'SPEND' | 'CAPACITY' | 'ANOMALY';
  title: string;
  description: string;
  enabled: boolean;
  thresholdValue: number;
  unit: string;
  notificationChannels: {
    email: boolean;
    webhook: boolean;
    sms: boolean;
  };
}

export interface BillingAlertSettingsViewProps {
  onShowToast?: (msg: string) => void;
}

export const INITIAL_ALERT_RULES: BillingAlertRule[] = [
  {
    id: 'rule-spend-soft',
    category: 'SPEND',
    title: 'Soft Budget Threshold Warning',
    description: 'Trigger notification when monthly expenditure reaches a percentage of total budget.',
    enabled: true,
    thresholdValue: 80,
    unit: '%',
    notificationChannels: { email: true, webhook: true, sms: false },
  },
  {
    id: 'rule-spend-hard',
    category: 'SPEND',
    title: 'Hard Monthly Budget Cap',
    description: 'Critical alert when total billable spend reaches monthly commitment cap ($15,000.00).',
    enabled: true,
    thresholdValue: 100,
    unit: '%',
    notificationChannels: { email: true, webhook: true, sms: true },
  },
  {
    id: 'rule-spend-surge',
    category: 'SPEND',
    title: '24-Hour Spend Surge Velocity',
    description: 'Flag anomalous spend spikes exceeding expected daily velocity baseline.',
    enabled: true,
    thresholdValue: 25,
    unit: '% surge',
    notificationChannels: { email: true, webhook: true, sms: false },
  },
  {
    id: 'rule-capacity-seats',
    category: 'CAPACITY',
    title: 'Workspace Seat Allocation Ceiling',
    description: 'Alert partner admin when workspace seat allocation exceeds safe capacity.',
    enabled: true,
    thresholdValue: 90,
    unit: '% capacity',
    notificationChannels: { email: true, webhook: false, sms: false },
  },
  {
    id: 'rule-capacity-storage',
    category: 'CAPACITY',
    title: 'NVMe High-Speed Storage Limit',
    description: 'Notify infrastructure team when shared SSD storage usage nears tier limit.',
    enabled: true,
    thresholdValue: 85,
    unit: '% used',
    notificationChannels: { email: true, webhook: true, sms: false },
  },
  {
    id: 'rule-capacity-api',
    category: 'CAPACITY',
    title: 'API Throughput & Rate Limit Ceiling',
    description: 'Send warning when daily API call throughput approaches quota ceiling.',
    enabled: false,
    thresholdValue: 95,
    unit: '% quota',
    notificationChannels: { email: true, webhook: false, sms: false },
  },
];

export const BillingAlertSettingsView: React.FC<BillingAlertSettingsViewProps> = ({ onShowToast }) => {
  const [rules, setRules] = useState<BillingAlertRule[]>(INITIAL_ALERT_RULES);
  const [primaryEmail, setPrimaryEmail] = useState<string>('finance@partneragency.com');
  const [secondaryEmail, setSecondaryEmail] = useState<string>('ops-alerts@partneragency.com');
  const [webhookUrl, setWebhookUrl] = useState<string>('https://hooks.slack.com/services/T00/B00/X0019283');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Toggle Rule Enable State
  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  // Update Threshold Value
  const handleUpdateThreshold = (id: string, val: number) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, thresholdValue: val } : r))
    );
  };

  // Toggle Channel
  const handleToggleChannel = (id: string, channel: 'email' | 'webhook' | 'sms') => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            notificationChannels: {
              ...r.notificationChannels,
              [channel]: !r.notificationChannels[channel],
            },
          };
        }
        return r;
      })
    );
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      if (onShowToast) {
        onShowToast('🔔 Billing alert thresholds and notification settings successfully saved!');
      }
    }, 800);
  };

  // Send Test Notification
  const handleSendTestAlert = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      if (onShowToast) {
        onShowToast(`📧 Test alert notification dispatched to ${primaryEmail} and Slack Webhook!`);
      }
    }, 1000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-8">
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
              <BellRing className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Billing &amp; Usage Threshold Alert Settings
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-mono font-extrabold border border-emerald-200">
                  Active Monitoring
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Configure real-time automated triggers for monthly budget thresholds, capacity caps, and unexpected spend spikes.
              </p>
            </div>
          </div>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSendTestAlert}
            disabled={isTesting}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce text-indigo-600' : ''}`} />
            <span>{isTesting ? 'Sending...' : 'Test Alert Trigger'}</span>
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 border border-indigo-400 disabled:opacity-50"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Saving...' : 'Save Alert Rules'}</span>
          </button>
        </div>
      </div>

      {/* RECIPIENT NOTIFICATION DESTINATIONS FORM */}
      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
          <Mail className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-extrabold text-slate-900">
            Notification Delivery Destinations
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary Finance Email */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Primary Finance Email
            </label>
            <input
              type="email"
              value={primaryEmail}
              onChange={(e) => setPrimaryEmail(e.target.value)}
              placeholder="finance@company.com"
              className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Secondary Escalation Email */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Escalation / Ops Email
            </label>
            <input
              type="email"
              value={secondaryEmail}
              onChange={(e) => setSecondaryEmail(e.target.value)}
              placeholder="ops@company.com"
              className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Webhook Endpoint */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
              <Webhook className="w-3 h-3 text-slate-500" /> Slack / PagerDuty Webhook
            </label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full bg-white border border-slate-200 text-slate-900 font-mono text-[11px] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>
      </div>

      {/* ALERT RULES CONFIGURATION GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            Configured Threshold Alert Triggers ({rules.filter((r) => r.enabled).length} Enabled)
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            Evaluated continuously every 5 minutes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => {
            return (
              <div
                key={rule.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  rule.enabled
                    ? 'bg-white border-slate-200 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 opacity-60'
                }`}
              >
                {/* Rule Header & Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-1.5 rounded-lg text-xs ${
                          rule.category === 'SPEND'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {rule.category === 'SPEND' ? (
                          <DollarSign className="w-3.5 h-3.5" />
                        ) : (
                          <Activity className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <h5 className="font-extrabold text-slate-900 text-sm">{rule.title}</h5>
                    </div>
                    <p className="text-xs text-slate-500 leading-tight">{rule.description}</p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      rule.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        rule.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Slider / Value Control */}
                {rule.enabled && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 font-bold">Trigger Threshold:</span>
                      <span className="font-black text-indigo-600 text-sm bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        {rule.thresholdValue} {rule.unit}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={10}
                      max={120}
                      step={5}
                      value={rule.thresholdValue}
                      onChange={(e) => handleUpdateThreshold(rule.id, parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />

                    {/* Delivery Channel Toggles */}
                    <div className="flex items-center justify-between pt-2 text-[11px] font-mono">
                      <span className="text-slate-400 font-bold">Delivery Channels:</span>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rule.notificationChannels.email}
                            onChange={() => handleToggleChannel(rule.id, 'email')}
                            className="text-indigo-600 rounded cursor-pointer"
                          />
                          <span className="text-slate-700">Email</span>
                        </label>

                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rule.notificationChannels.webhook}
                            onChange={() => handleToggleChannel(rule.id, 'webhook')}
                            className="text-indigo-600 rounded cursor-pointer"
                          />
                          <span className="text-slate-700">Webhook</span>
                        </label>

                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rule.notificationChannels.sms}
                            onChange={() => handleToggleChannel(rule.id, 'sms')}
                            className="text-indigo-600 rounded cursor-pointer"
                          />
                          <span className="text-slate-700">SMS</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
