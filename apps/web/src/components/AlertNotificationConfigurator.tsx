import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Webhook,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  Sliders,
  Sparkles,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Database,
  Cpu,
  HardDrive,
} from 'lucide-react';

export interface AlertNotificationConfiguratorProps {
  initialCpuThreshold?: number;
  initialRamThreshold?: number;
  onThresholdsChange?: (cpu: number, ram: number) => void;
}

interface TriggeredAlertLog {
  id: string;
  metric: 'CPU' | 'RAM';
  measuredValue: string;
  thresholdValue: string;
  channel: 'Email' | 'Webhook' | 'Email & Webhook';
  destination: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
  timestamp: string;
}

export const AlertNotificationConfigurator: React.FC<AlertNotificationConfiguratorProps> = ({
  initialCpuThreshold = 85,
  initialRamThreshold = 80,
  onThresholdsChange,
}) => {
  // Threshold States
  const [cpuThreshold, setCpuThreshold] = useState<number>(initialCpuThreshold);
  const [ramThreshold, setRamThreshold] = useState<number>(initialRamThreshold);
  const [evalWindowMins, setEvalWindowMins] = useState<number>(2);
  const [autoRemedyEnabled, setAutoRemedyEnabled] = useState<boolean>(true);

  // Email Config State
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState<boolean>(true);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([
    'ops-lead@enterprise.com',
    'oncall-migration@enterprise.com',
  ]);
  const [newEmailInput, setNewEmailInput] = useState<string>('');
  const [emailMinSeverity, setEmailMinSeverity] = useState<'CRITICAL' | 'WARNING' | 'INFO'>('WARNING');

  // Webhook Config State
  const [webhookAlertsEnabled, setWebhookAlertsEnabled] = useState<boolean>(true);
  const [webhookProvider, setWebhookProvider] = useState<'Slack' | 'MSTeams' | 'PagerDuty' | 'Generic'>('Slack');
  const [webhookUrl, setWebhookUrl] = useState<string>(
    'https://hooks.slack.com/services/T0000/B0000/xX928a38b10c9'
  );
  const [webhookSecret, setWebhookSecret] = useState<string>('whsec_9a8f7c6e5d4c3b2a10');
  const [showWebhookPayloadPreview, setShowWebhookPayloadPreview] = useState<boolean>(false);

  // Feedback Toasts & Testing State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(
    null
  );
  const [isSendingTestEmail, setIsSendingTestEmail] = useState<boolean>(false);
  const [isSendingTestWebhook, setIsSendingTestWebhook] = useState<boolean>(false);

  // Triggered Alerts History Log
  const [alertLogs, setAlertLogs] = useState<TriggeredAlertLog[]>([
    {
      id: 'log-101',
      metric: 'CPU',
      measuredValue: '88.4%',
      thresholdValue: '85.0%',
      channel: 'Email & Webhook',
      destination: 'Slack #migration-alerts, ops-lead@enterprise.com',
      status: 'DELIVERED',
      timestamp: '10:24:12 AM',
    },
    {
      id: 'log-102',
      metric: 'RAM',
      measuredValue: '82.1%',
      thresholdValue: '80.0%',
      channel: 'Webhook',
      destination: 'PagerDuty Event v2 Queue',
      status: 'DELIVERED',
      timestamp: '08:15:00 AM',
    },
  ]);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddEmail = () => {
    if (!newEmailInput.trim() || !newEmailInput.includes('@')) {
      showToast('Please enter a valid email address.', 'info');
      return;
    }
    if (emailRecipients.includes(newEmailInput.trim())) {
      setNewEmailInput('');
      return;
    }
    const updated = [...emailRecipients, newEmailInput.trim()];
    setEmailRecipients(updated);
    setNewEmailInput('');
    showToast(`Added recipient ${newEmailInput.trim()}`);
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmailRecipients(emailRecipients.filter((e) => e !== emailToRemove));
  };

  const handleCpuChange = (val: number) => {
    setCpuThreshold(val);
    if (onThresholdsChange) onThresholdsChange(val, ramThreshold);
  };

  const handleRamChange = (val: number) => {
    setRamThreshold(val);
    if (onThresholdsChange) onThresholdsChange(cpuThreshold, val);
  };

  const handleSendTestEmail = () => {
    setIsSendingTestEmail(true);
    setTimeout(() => {
      setIsSendingTestEmail(false);
      showToast(`Test email dispatched to ${emailRecipients.length} recipients!`);
      const newLog: TriggeredAlertLog = {
        id: `log-${Date.now()}`,
        metric: 'CPU',
        measuredValue: 'SIMULATED TEST',
        thresholdValue: `${cpuThreshold}%`,
        channel: 'Email',
        destination: emailRecipients[0] || 'Email Recipients',
        status: 'DELIVERED',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setAlertLogs((prev) => [newLog, ...prev]);
    }, 1200);
  };

  const handleSendTestWebhook = () => {
    setIsSendingTestWebhook(true);
    setTimeout(() => {
      setIsSendingTestWebhook(false);
      showToast(`Test webhook payload dispatched to ${webhookProvider} endpoint (HTTP 200 OK)!`);
      const newLog: TriggeredAlertLog = {
        id: `log-${Date.now()}`,
        metric: 'RAM',
        measuredValue: 'SIMULATED TEST',
        thresholdValue: `${ramThreshold}%`,
        channel: 'Webhook',
        destination: `${webhookProvider} Endpoint`,
        status: 'DELIVERED',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setAlertLogs((prev) => [newLog, ...prev]);
    }, 1200);
  };

  const sampleWebhookJson = JSON.stringify(
    {
      event: 'SYSTEM_RESOURCE_THRESHOLD_EXCEEDED',
      timestamp: new Date().toISOString(),
      cluster: 'prod-migration-k8s-01',
      metric: 'CPU_UTILIZATION',
      current_value_pct: 88.4,
      threshold_pct: cpuThreshold,
      evaluation_window_mins: evalWindowMins,
      remedy_action_triggered: autoRemedyEnabled ? 'WORKER_POD_AUTO_SCALE' : 'NONE',
    },
    null,
    2
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Enterprise Safety Thresholds & Notification Channels
            </h2>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold font-mono rounded-full">
              Live Alerting System
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure real-time automated Email and Webhook dispatch policies when CPU or RAM utilization breaches enterprise safety thresholds during high-throughput migration workloads.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              showToast('Enterprise Alert Rules & Notification Channels Saved!');
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Notification Rules</span>
          </button>
        </div>
      </div>

      {/* Grid: Threshold Controls + Notification Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Configurable Safety Thresholds */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              Safety Threshold Sliders
            </span>
            <span className="text-[10px] font-mono text-slate-400">Eval Window: {evalWindowMins}m</span>
          </div>

          {/* CPU Threshold Control */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                CPU Saturation Alert Limit
              </span>
              <span className="font-mono font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {cpuThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="98"
              step="1"
              value={cpuThreshold}
              onChange={(e) => handleCpuChange(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>50% (Conservative)</span>
              <span>85% (Recommended)</span>
              <span>98% (Critical)</span>
            </div>
          </div>

          {/* RAM Threshold Control */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-purple-600" />
                RAM Heap Saturation Alert Limit
              </span>
              <span className="font-mono font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {ramThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="98"
              step="1"
              value={ramThreshold}
              onChange={(e) => handleRamChange(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>50% (Conservative)</span>
              <span>80% (Recommended)</span>
              <span>98% (OOM Danger)</span>
            </div>
          </div>

          {/* Evaluation Window & Auto-Remedy */}
          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Consecutive Evaluation Window
              </label>
              <select
                value={evalWindowMins}
                onChange={(e) => setEvalWindowMins(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-semibold"
              >
                <option value={1}>1 Minute (Immediate Alert)</option>
                <option value={2}>2 Minutes (Standard)</option>
                <option value={5}>5 Minutes (Sustained Load)</option>
                <option value={10}>10 Minutes (Batch Stabilization)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <div>
                <strong className="text-indigo-900 block font-bold text-xs">Auto-Remedy Integration</strong>
                <p className="text-[10px] text-indigo-700">Trigger pod auto-scaler upon alert dispatch</p>
              </div>
              <input
                type="checkbox"
                checked={autoRemedyEnabled}
                onChange={(e) => setAutoRemedyEnabled(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Column 2: Email Notifications Config */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              Email Notification Channel
            </span>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlertsEnabled}
                onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Recipient Email List</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="add-email@enterprise.com"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
                <button
                  onClick={handleAddEmail}
                  className="px-3 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recipients List Chips */}
            <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
              {emailRecipients.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-700"
                >
                  <span className="truncate max-w-[200px]">{email}</span>
                  <button
                    onClick={() => handleRemoveEmail(email)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Min Severity</span>
                <select
                  value={emailMinSeverity}
                  onChange={(e: any) => setEmailMinSeverity(e.target.value)}
                  className="p-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 font-mono"
                >
                  <option value="CRITICAL">Critical Only</option>
                  <option value="WARNING">Warning &amp; Above</option>
                  <option value="INFO">All Severity Levels</option>
                </select>
              </div>

              <button
                onClick={handleSendTestEmail}
                disabled={isSendingTestEmail || !emailAlertsEnabled}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                <Send className="w-3 h-3 text-blue-400" />
                <span>{isSendingTestEmail ? 'Sending...' : 'Test Email'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Column 3: Webhook Integrations Config */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Webhook className="w-4 h-4 text-emerald-600" />
              Webhook Integration
            </span>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={webhookAlertsEnabled}
                onChange={(e) => setWebhookAlertsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Target Webhook Provider</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Slack', 'MSTeams', 'PagerDuty', 'Generic'] as const).map((prov) => (
                  <button
                    key={prov}
                    onClick={() => setWebhookProvider(prov)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                      webhookProvider === prov
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {prov === 'MSTeams' ? 'MS Teams' : prov}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Webhook Endpoint URL</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setShowWebhookPayloadPreview(!showWebhookPayloadPreview)}
                className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showWebhookPayloadPreview ? 'Hide Payload' : 'Preview Payload JSON'}</span>
              </button>

              <button
                onClick={handleSendTestWebhook}
                disabled={isSendingTestWebhook || !webhookAlertsEnabled}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>{isSendingTestWebhook ? 'Posting...' : 'Test Webhook'}</span>
              </button>
            </div>

            {showWebhookPayloadPreview && (
              <pre className="p-2.5 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[10px] overflow-x-auto border border-slate-800 max-h-[100px]">
                {sampleWebhookJson}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Triggered Threshold Alert Audit Log Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Threshold Violation Alert Audit Log
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">{alertLogs.length} Events Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase">
                <th className="py-2 px-3 font-semibold">Timestamp</th>
                <th className="py-2 px-3 font-semibold">Metric Breached</th>
                <th className="py-2 px-3 font-semibold">Measured vs Limit</th>
                <th className="py-2 px-3 font-semibold">Channel</th>
                <th className="py-2 px-3 font-semibold">Target Destination</th>
                <th className="py-2 px-3 font-semibold text-right">Dispatch Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {alertLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">{log.timestamp}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                        log.metric === 'CPU'
                          ? 'bg-indigo-100 text-indigo-700 font-extrabold'
                          : 'bg-purple-100 text-purple-700 font-extrabold'
                      }`}
                    >
                      {log.metric} Saturation
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-rose-600">{log.measuredValue}</span>{' '}
                    <span className="text-slate-400">&gt;</span>{' '}
                    <span className="text-slate-600">{log.thresholdValue}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-sans font-semibold">{log.channel}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-[220px]">
                    {log.destination}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl border border-indigo-500/50 shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-mono">{toastMessage.text}</div>
        </div>
      )}
    </div>
  );
};
