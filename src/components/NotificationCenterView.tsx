import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Slack,
  MessageSquare,
  Phone,
  Webhook,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  Check,
  X,
  Play,
  Settings,
  Send,
  Sliders,
  Sparkles,
  FileText,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
  Timer,
  Zap,
  Calendar,
  Database,
  ArrowRight,
  VolumeX,
  Volume2,
} from 'lucide-react';

export type NotificationChannel = 'Email' | 'Teams' | 'Slack' | 'SMS' | 'Webhook';

export type NotificationEvent =
  | 'Migration Started'
  | 'Migration Completed'
  | 'Validation Failed'
  | 'Approval Pending'
  | 'Pipeline Failure';

interface NotificationRule {
  id: string;
  eventName: NotificationEvent;
  channels: Record<NotificationChannel, boolean>;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  description: string;
  nextCheckSeconds: number; // For the Cron theme countdowns
  sourceSystem: string;
  targetSystem: string;
}

interface DispatchLog {
  id: string;
  timestamp: string;
  eventName: NotificationEvent;
  jobName: string;
  jobId: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  dispatches: {
    channel: NotificationChannel;
    status: 'SENT' | 'FAILED' | 'MUTED';
    detail: string;
  }[];
  messageExcerpt: string;
}

export const NotificationCenterView: React.FC = () => {
  // Real-Time System Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedCurrentTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }).toLowerCase();
  const formattedCurrentDate = currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  // Daemon controls
  const [isAutoRouterEnabled, setIsAutoRouterEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'matrix' | 'timeline' | 'templates' | 'gateways'>('timeline');

  // Rules state with scheduling countdown details
  const [rules, setRules] = useState<NotificationRule[]>([
    {
      id: 'rule-01',
      eventName: 'Migration Started',
      channels: { Email: true, Teams: false, Slack: true, SMS: false, Webhook: false },
      severity: 'INFO',
      description: 'Triggered immediately when a data migration pipeline starts executing.',
      nextCheckSeconds: 124,
      sourceSystem: 'SAP S/4HANA',
      targetSystem: 'Business Central',
    },
    {
      id: 'rule-02',
      eventName: 'Migration Completed',
      channels: { Email: true, Teams: true, Slack: true, SMS: false, Webhook: true },
      severity: 'SUCCESS',
      description: 'Triggered when all records are successfully processed with zero fatal validation errors.',
      nextCheckSeconds: 342,
      sourceSystem: 'Oracle Financials',
      targetSystem: 'PostgreSQL DW',
    },
    {
      id: 'rule-03',
      eventName: 'Validation Failed',
      channels: { Email: true, Teams: true, Slack: true, SMS: false, Webhook: false },
      severity: 'WARNING',
      description: 'Triggered when cleansing/validation rules flag high-severity anomalies.',
      nextCheckSeconds: 58,
      sourceSystem: 'HRMS Legacy API',
      targetSystem: 'Dynamics 365',
    },
    {
      id: 'rule-04',
      eventName: 'Approval Pending',
      channels: { Email: true, Teams: false, Slack: false, SMS: true, Webhook: false },
      severity: 'WARNING',
      description: 'Requires human sign-off before schema mapping mutations are committed to destination ERP.',
      nextCheckSeconds: 589,
      sourceSystem: 'Salesforce Accounts',
      targetSystem: 'SAP Ledger',
    },
    {
      id: 'rule-05',
      eventName: 'Pipeline Failure',
      channels: { Email: true, Teams: true, Slack: true, SMS: true, Webhook: true },
      severity: 'CRITICAL',
      description: 'Critical pipeline termination due to network dropping, memory limit spikes, or database locks.',
      nextCheckSeconds: 15,
      sourceSystem: 'AWS Redshift Ingest',
      targetSystem: 'Snowflake DW',
    },
  ]);

  // Handle countdown timers tick
  useEffect(() => {
    if (!isAutoRouterEnabled) return;

    const timer = setInterval(() => {
      setRules((prevRules) =>
        prevRules.map((rule) => {
          if (rule.nextCheckSeconds <= 1) {
            // Trigger automatic background handshake when countdown expires
            setTimeout(() => {
              handleBackgroundHandshake(rule.eventName);
            }, 50);
            return {
              ...rule,
              nextCheckSeconds: Math.floor(Math.random() * 300) + 120, // Reset to random interval
            };
          }
          return {
            ...rule,
            nextCheckSeconds: rule.nextCheckSeconds - 1,
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoRouterEnabled]);

  // Format Countdown helper
  const formatCountdown = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 2. Channel Configuration States
  const [activeChannelTab, setActiveChannelTab] = useState<NotificationChannel>('Email');

  const [emailConfig, setEmailConfig] = useState({
    smtpHost: 'smtp.enterprise-mail.internal',
    smtpPort: '587',
    smtpUser: 'migration-alerts@enterprise.com',
    tls: true,
    recipients: 'oncall-migration@enterprise.com, compliance-alerts@enterprise.com',
  });

  const [teamsConfig, setTeamsConfig] = useState({
    webhookUrl: 'https://msteams.enterprise.com/webhook/v1/9a8f7c6e5d4c3b2a10',
    themeColor: '#4F46E5', // Indigo-600
    displayName: 'EDIMP Migration Bot',
  });

  const [slackConfig, setSlackConfig] = useState({
    webhookUrl: 'https://hooks.slack.com/services/T0000/B0000/xX928a38b10c9',
    channel: '#prod-migration-alerts',
    username: 'Migration Controller',
    iconEmoji: ':rocket:',
  });

  const [smsConfig, setSmsConfig] = useState({
    phoneNumbers: '+1 (555) 019-2834, +1 (555) 489-1029',
    provider: 'Twilio Gateway v2',
    accountSid: 'AC98f7c6e5d4c3b2a10e987f897f7f',
  });

  const [webhookConfig, setWebhookConfig] = useState({
    endpointUrl: 'https://api.internal-operations.com/v2/migration-events',
    method: 'POST',
    secretHeader: 'X-EDIMP-Signature',
    secretToken: 'whsec_9a8f7c6e5d4c3b2a10c9',
    retryOnFailure: true,
  });

  // 3. Notification Templates State
  const [selectedTemplateEvent, setSelectedTemplateEvent] = useState<NotificationEvent>('Pipeline Failure');
  const [templates, setTemplates] = useState<Record<NotificationEvent, { subject: string; body: string }>>({
    'Migration Started': {
      subject: '🚀 Migration Pipeline Started: {{job_name}} [ID: {{job_id}}]',
      body: 'Attention: Migration job "{{job_name}}" has been initialized by user {{actor}}.\n\n- Source System: {{source_system}}\n- Target Destination: {{target_system}}\n- Total Records Loaded: {{total_records}}\n- Triggered At: {{timestamp}}\n\nFollow real-time progress on the Live Dashboard.',
    },
    'Migration Completed': {
      subject: '✅ Migration Completed Successfully: {{job_name}}',
      body: 'Excellent News: Migration job "{{job_name}}" has finished successfully with no critical errors.\n\n- Total Records Synced: {{total_records}}\n- Throughput Speed: {{throughput_rps}} RPS\n- Errors Found: {{error_count}}\n- Completed At: {{timestamp}}\n\nAll temporary worker nodes have been scaled down and resources de-allocated.',
    },
    'Validation Failed': {
      subject: '⚠️ Data Validation Anomalies Detected: {{job_name}}',
      body: 'Data quality scanner has raised a warning for "{{job_name}}".\n\n- Impacted Job ID: {{job_id}}\n- Discovered Anomalies: {{error_count}} rows failed constraint validation\n- Primary Issue: Missing required keys or layout shape mismatches\n- Inspected Time: {{timestamp}}\n\nKindly navigate to the Cleansing and Validation tab to review logs.',
    },
    'Approval Pending': {
      subject: '🔒 Manual Approval Required for {{job_name}} Mapping Changes',
      body: 'Action Required: Migration job "{{job_name}}" is paused awaiting administrative schema alignment clearance.\n\n- Job ID: {{job_id}}\n- Action Pending: Commit schema mutations mapping to the target server\n- Initiated At: {{timestamp}}\n\nClick the "Approve/Reject" pending request panel on the Management view to resume operations.',
    },
    'Pipeline Failure': {
      subject: '🚨 CRITICAL FAILURE: Migration Job {{job_name}} Terminated',
      body: 'System Alert: Migration job "{{job_name}}" has halted abruptly with high severity errors!\n\n- Job ID: {{job_id}}\n- Fatal Reason: Network Connection Dropped / Out of Memory (OOM) on Core-02 Node\n- Unfinished Records: {{remaining_records}} / {{total_records}} remaining\n- Fault Timestamp: {{timestamp}}\n- Active Action Taken: Worker nodes paused, fallback rate limit applied.',
    },
  });

  const availableTokens = [
    { token: '{{job_name}}', desc: 'Job Name' },
    { token: '{{job_id}}', desc: 'Job ID' },
    { token: '{{timestamp}}', desc: 'Current Time' },
    { token: '{{actor}}', desc: 'Triggering User' },
    { token: '{{total_records}}', desc: 'Total Records' },
    { token: '{{remaining_records}}', desc: 'Remaining Rows' },
    { token: '{{throughput_rps}}', desc: 'RPS Throughput' },
    { token: '{{error_count}}', desc: 'Failed Constraints' },
    { token: '{{source_system}}', desc: 'Source ERP Name' },
    { token: '{{target_system}}', desc: 'Target ERP Name' },
  ];

  const handleInsertToken = (token: string) => {
    setTemplates((prev) => ({
      ...prev,
      [selectedTemplateEvent]: {
        ...prev[selectedTemplateEvent],
        body: prev[selectedTemplateEvent].body + ' ' + token,
      },
    }));
  };

  // 4. Incident Simulator Panel State
  const [simulationJobName, setSimulationJobName] = useState('SAP S/4HANA Ledger Migration');
  const [simulationJobId, setSimulationJobId] = useState('JOB-9921');
  const [simulationActor, setSimulationActor] = useState('fayasamd@gmail.com');
  const [simulationTotalRecords, setSimulationTotalRecords] = useState(250000);
  const [simulationSource, setSimulationSource] = useState('SAP S/4HANA (Source)');
  const [simulationTarget, setSimulationTarget] = useState('Salesforce Account (Target)');

  // 5. Audit logs for dispatched notifications
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([
    {
      id: 'log-001',
      timestamp: new Date(Date.now() - 300000).toLocaleString(),
      eventName: 'Pipeline Failure',
      jobName: 'Oracle Payroll to PostgreSQL Sync',
      jobId: 'JOB-3829',
      status: 'FAILED',
      dispatches: [
        { channel: 'Email', status: 'SENT', detail: 'Sent critical alert payload to oncall-migration@enterprise.com' },
        { channel: 'Teams', status: 'SENT', detail: 'Dispatched Adaptive Card to webhook channel' },
        { channel: 'Slack', status: 'SENT', detail: 'Posted rich Slack blocks to #prod-migration-alerts' },
        { channel: 'SMS', status: 'FAILED', detail: 'Twilio Provider Gateway returned error: Invalid Phone format' },
        { channel: 'Webhook', status: 'SENT', detail: 'POST returned Status 200 OK' },
      ],
      messageExcerpt: '🚨 CRITICAL FAILURE: Migration Job Oracle Payroll to PostgreSQL Sync has halted abruptly with high severity errors!',
    },
    {
      id: 'log-002',
      timestamp: new Date(Date.now() - 1200000).toLocaleString(),
      eventName: 'Migration Started',
      jobName: 'Salesforce Contact Delta Feed',
      jobId: 'JOB-4821',
      status: 'SUCCESS',
      dispatches: [
        { channel: 'Email', status: 'SENT', detail: 'Dispatched notification to oncall-migration@enterprise.com' },
        { channel: 'Slack', status: 'SENT', detail: 'Posted alert block in channel' },
        { channel: 'Teams', status: 'MUTED', detail: 'Muted (disabled in routing matrix)' },
        { channel: 'SMS', status: 'MUTED', detail: 'Muted (disabled in routing matrix)' },
        { channel: 'Webhook', status: 'MUTED', detail: 'Muted (disabled in routing matrix)' },
      ],
      messageExcerpt: '🚀 Migration Pipeline Started: Salesforce Contact Delta Feed [ID: JOB-4821]',
    },
  ]);

  const [lastNotificationToast, setLastNotificationToast] = useState<{
    show: boolean;
    eventName: NotificationEvent;
    channelsCount: number;
  }>({ show: false, eventName: 'Migration Started', channelsCount: 0 });

  // Clear toast alert
  useEffect(() => {
    if (lastNotificationToast.show) {
      const timer = setTimeout(() => {
        setLastNotificationToast((prev) => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [lastNotificationToast.show]);

  // Matrix edit helper
  const handleToggleMatrix = (eventName: NotificationEvent, channel: NotificationChannel) => {
    setRules((prevRules) =>
      prevRules.map((rule) => {
        if (rule.eventName === eventName) {
          return {
            ...rule,
            channels: {
              ...rule.channels,
              [channel]: !rule.channels[channel],
            },
          };
        }
        return rule;
      })
    );
  };

  // Background Automatic Handshake runner
  const handleBackgroundHandshake = (eventName: NotificationEvent) => {
    const rule = rules.find((r) => r.eventName === eventName);
    if (!rule) return;

    const timestampStr = new Date().toLocaleString();
    const mockId = `MOCK-HND-${Math.floor(Math.random() * 9000 + 1000)}`;

    const dispatches = (Object.keys(rule.channels) as NotificationChannel[]).map((channel) => {
      const isEnabled = rule.channels[channel];
      return {
        channel,
        status: isEnabled ? 'SENT' as const : 'MUTED' as const,
        detail: isEnabled 
          ? `[Auto-Cron Verified] Handshake connection checks validated for channel: ${channel}`
          : 'Muted (disabled in routing matrix)',
      };
    });

    const newLog: DispatchLog = {
      id: `log-${Date.now().toString().slice(-4)}`,
      timestamp: timestampStr,
      eventName,
      jobName: 'Scheduled Heartbeat Daemon Check',
      jobId: mockId,
      status: 'SUCCESS',
      dispatches,
      messageExcerpt: `⏱️ Scheduled Cron Verification: Automated routing handshake for [${eventName}] succeeded.`,
    };

    setDispatchLogs((prev) => [newLog, ...prev]);
  };

  // Channel Tester Function
  const [testingChannel, setTestingChannel] = useState<NotificationChannel | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleTestChannel = (channel: NotificationChannel) => {
    setTestingChannel(channel);
    setTestResult(null);

    setTimeout(() => {
      setTestingChannel(null);
      let success = true;
      let msg = '';

      if (channel === 'Email') {
        if (!emailConfig.smtpHost || !emailConfig.recipients) {
          success = false;
          msg = 'Failed: Please specify SMTP Host and Recipients list.';
        } else {
          msg = `Success: Dispatched test mail containing verification handshake token to ${emailConfig.recipients.split(',')[0].trim()}.`;
        }
      } else if (channel === 'Teams') {
        if (!teamsConfig.webhookUrl.startsWith('http')) {
          success = false;
          msg = 'Failed: Teams Webhook URL must be a valid HTTP/HTTPS endpoint.';
        } else {
          msg = 'Success: Incoming webhook verification payload received and acknowledged by Teams API.';
        }
      } else if (channel === 'Slack') {
        if (!slackConfig.webhookUrl.startsWith('http')) {
          success = false;
          msg = 'Failed: Slack Webhook URL must be a valid HTTP/HTTPS endpoint.';
        } else {
          msg = `Success: Posted custom webhook payload to channel ${slackConfig.channel}.`;
        }
      } else if (channel === 'SMS') {
        if (!smsConfig.phoneNumbers || !smsConfig.accountSid) {
          success = false;
          msg = 'Failed: Twilio Account SID and mobile target numbers are required.';
        } else {
          msg = `Success: Broadcast validation SMS to targets (${smsConfig.phoneNumbers.split(',')[0].trim()}). SMS code generated.`;
        }
      } else if (channel === 'Webhook') {
        if (!webhookConfig.endpointUrl.startsWith('http')) {
          success = false;
          msg = 'Failed: Custom endpoint URL is invalid.';
        } else {
          msg = `Success: POST payload dispatched. Server replied with Status 200 OK (X-EDIMP-Signature validated).`;
        }
      }

      setTestResult({ success, msg });
    }, 1200);
  };

  // Simulate notification event dispatch
  const handleSimulateEvent = (eventName: NotificationEvent) => {
    const rule = rules.find((r) => r.eventName === eventName);
    if (!rule) return;

    const template = templates[eventName];
    const timestampStr = new Date().toLocaleString();
    const variables: Record<string, string> = {
      '{{job_name}}': simulationJobName,
      '{{job_id}}': simulationJobId,
      '{{timestamp}}': timestampStr,
      '{{actor}}': simulationActor,
      '{{total_records}}': simulationTotalRecords.toLocaleString(),
      '{{remaining_records}}': Math.floor(simulationTotalRecords * 0.12).toLocaleString(),
      '{{throughput_rps}}': (Math.floor(Math.random() * 200) + 120).toString(),
      '{{error_count}}': eventName === 'Validation Failed' ? '1,492' : '0',
      '{{source_system}}': simulationSource,
      '{{target_system}}': simulationTarget,
    };

    let subject = template.subject;
    let body = template.body;

    Object.entries(variables).forEach(([key, val]) => {
      subject = subject.replaceAll(key, val);
      body = body.replaceAll(key, val);
    });

    const activeChannels = Object.entries(rule.channels)
      .filter(([_, enabled]) => enabled)
      .map(([channel]) => channel as NotificationChannel);

    const dispatches = (Object.keys(rule.channels) as NotificationChannel[]).map((channel) => {
      const isEnabled = rule.channels[channel];
      let status: 'SENT' | 'FAILED' | 'MUTED' = 'MUTED';
      let detail = 'Muted (disabled in routing matrix)';

      if (isEnabled) {
        const works = Math.random() > 0.08;
        if (works) {
          status = 'SENT';
          if (channel === 'Email') detail = `Sent message successfully to ${emailConfig.recipients.split(',')[0].trim()}`;
          else if (channel === 'Teams') detail = `Adaptive Card posted to MS Teams channel [${teamsConfig.displayName}]`;
          else if (channel === 'Slack') detail = `Rich block attachment posted to Slack ${slackConfig.channel}`;
          else if (channel === 'SMS') detail = `SMS alert broadcasted to ${smsConfig.phoneNumbers.split(',')[0].trim()}`;
          else if (channel === 'Webhook') detail = `Dispatched JSON to webhook. Server replied 200 OK`;
        } else {
          status = 'FAILED';
          detail = `Network error: Timeout trying to establish remote handshake socket with ${channel} server`;
        }
      }

      return { channel, status, detail };
    });

    const hasFailedChannel = dispatches.some((d) => d.status === 'FAILED');
    const logStatus = hasFailedChannel ? 'WARNING' : 'SUCCESS';

    const newLog: DispatchLog = {
      id: `log-${Date.now().toString().slice(-4)}`,
      timestamp: timestampStr,
      eventName,
      jobName: simulationJobName,
      jobId: simulationJobId,
      status: logStatus,
      dispatches,
      messageExcerpt: subject,
    };

    setDispatchLogs((prev) => [newLog, ...prev]);

    setLastNotificationToast({
      show: true,
      eventName,
      channelsCount: activeChannels.length,
    });
  };

  const filteredRules = rules.filter(r => 
    r.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300" id="notification-center-view-container">
      
      {/* Dynamic Toast Alert Portal */}
      {lastNotificationToast.show && (
        <div 
          id="live-alert-toast"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-indigo-500 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 w-80 sm:w-96 animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Router Triggered</span>
              <button 
                onClick={() => setLastNotificationToast(prev => ({ ...prev, show: false }))}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h5 className="text-xs font-extrabold">{lastNotificationToast.eventName}</h5>
            <p className="text-[10px] text-slate-300 leading-normal">
              Successfully matched and evaluated dynamic alert rules. Dispatched payload to <strong>{lastNotificationToast.channelsCount}</strong> active channel routes.
            </p>
          </div>
        </div>
      )}

      {/* Header Banner - Fully matching the Timeline & Cron Theme */}
      <div className="p-5 bg-gradient-to-r from-slate-50 via-white to-indigo-50/20 border border-slate-200/80 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-3xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <Bell className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Real-Time Scheduled Notification Matrix & Router Core
            </h2>
            <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-Time Router Daemon Active
            </span>
            <span className="text-[11px] font-mono bg-slate-900 text-emerald-400 px-3 py-0.5 rounded-full border border-slate-800 font-extrabold flex items-center gap-1.5 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>System Real-Time: <strong className="text-white font-mono">{formattedCurrentTime}</strong> <span className="text-slate-400">({formattedCurrentDate})</span></span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Configure matrix routing profiles, adjust SMTP credentials, edit template variables, and monitor background automatic heartbeat handshakes.
          </p>
        </div>

        {/* Quick Real-Time Action Header Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Scheduler Daemon Toggle */}
          <button
            onClick={() => {
              const nextState = !isAutoRouterEnabled;
              setIsAutoRouterEnabled(nextState);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
              isAutoRouterEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title="Toggle automatic routing handshake daemon"
          >
            <Timer className={`w-3.5 h-3.5 ${isAutoRouterEnabled ? 'text-emerald-600 animate-spin' : 'text-slate-400'}`} />
            <span>Daemon: {isAutoRouterEnabled ? 'ACTIVE' : 'PAUSED'}</span>
          </button>

          {/* Fast Forward / Run Next Simulated Handshake */}
          <button
            onClick={() => handleSimulateEvent('Pipeline Failure')}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Trigger validation test on critical route immediately"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-slate-950 animate-pulse" />
            <span>Run Handshake Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Filter & Metric Summary Bar */}
      <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
        {/* Navigation Tabs - Styled as Cron status filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Interactive Profiles</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-700/20 text-[10px]">{rules.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Routing Grid Matrix</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-200/60 text-[10px] font-mono">5x5</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100/70'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Message Templates</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-200/50 text-[10px] font-mono">5</span>
          </button>

          <button
            onClick={() => setActiveTab('gateways')}
            className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'gateways'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Channel Gateways</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-200/50 text-[10px] font-mono">5</span>
          </button>
        </div>

        {/* Global Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search routing rules..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Main Tab Content Area (Span 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* TAB 1: INTERACTIVE PIPELINE PROFILES TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Live Delivery & Diagnostics Pipelines
                </h3>
                <span className="text-[10px] font-bold text-slate-400">Click channels on cards to fast-mute</span>
              </div>

              {filteredRules.map((rule) => {
                let sevBadge = 'bg-slate-50 border-slate-100 text-slate-600';
                if (rule.severity === 'SUCCESS') sevBadge = 'bg-emerald-50 border-emerald-100 text-emerald-700';
                if (rule.severity === 'WARNING') sevBadge = 'bg-amber-50 border-amber-100 text-amber-700';
                if (rule.severity === 'CRITICAL') sevBadge = 'bg-rose-50 border-rose-100 text-rose-700';

                return (
                  <div 
                    key={rule.id}
                    className="p-5 bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl shadow-3xs hover:shadow-2xs transition-all flex flex-col gap-4"
                  >
                    {/* Card Top: Profile Architecture */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                          <Bell className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-900">{rule.eventName}</span>
                            <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded border uppercase ${sevBadge}`}>
                              {rule.severity}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 font-bold mt-1 max-w-xl leading-relaxed">
                            {rule.description}
                          </p>
                        </div>
                      </div>

                      {/* Architecture Path details */}
                      <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate-400 bg-slate-50/50 px-2.5 py-1 rounded-lg border border-slate-100 self-start sm:self-auto">
                        <span>{rule.sourceSystem}</span>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        <span>{rule.targetSystem}</span>
                      </div>
                    </div>

                    {/* Card Middle: Live Automated Handshake Check */}
                    <div className="flex-1 relative h-9 bg-slate-50 rounded-xl border border-slate-200/60 overflow-hidden flex items-center px-3">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/10 via-indigo-50/10 to-amber-50/10 opacity-60"></div>
                      <div className="flex items-center justify-between w-full z-10">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[10.5px] font-bold text-slate-500">Scheduled Diagnostic Handshake:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-mono text-[10.5px] font-black rounded-lg border border-amber-300 shadow-3xs flex items-center gap-1">
                            <Timer className="w-3 h-3 animate-spin" />
                            Next Trigger in: {formatCountdown(rule.nextCheckSeconds)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom: Integrated Delivery Channels Selection */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-50 pt-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Channels:</span>
                        {(['Email', 'Teams', 'Slack', 'SMS', 'Webhook'] as NotificationChannel[]).map((channel) => {
                          const isEnabled = rule.channels[channel];
                          return (
                            <button
                              key={channel}
                              onClick={() => handleToggleMatrix(rule.eventName, channel)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                isEnabled 
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-3xs' 
                                  : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                              }`}
                              title={`Toggle ${channel} routing route`}
                            >
                              {channel === 'Email' && <Mail className="w-3 h-3" />}
                              {channel === 'Teams' && <MessageSquare className="w-3 h-3" />}
                              {channel === 'Slack' && <Slack className="w-3 h-3" />}
                              {channel === 'SMS' && <Phone className="w-3 h-3" />}
                              {channel === 'Webhook' && <Webhook className="w-3 h-3" />}
                              <span>{channel}</span>
                              {isEnabled ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Direct Diagnostic Trigger */}
                      <button
                        onClick={() => handleSimulateEvent(rule.eventName)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10.5px] rounded-xl shadow-3xs hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer self-end sm:self-auto"
                      >
                        <Zap className="w-3 h-3 text-amber-300 fill-current" />
                        <span>Test Core</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: DETAILED GRID ROUTING MATRIX (TABLE VIEW) */}
          {activeTab === 'matrix' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                    Alert Routing Profile Table
                  </h3>
                  <p className="text-xs text-slate-400">Map active notification dispatches to available outgoing routes.</p>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-bold px-2 py-0.5 rounded-full">
                  5x5 Matrix profile
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]" id="routing-matrix-table">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-black">
                      <th className="py-2.5 w-1/3">Incident Trigger Category</th>
                      <th className="py-2.5 text-center px-2">Email</th>
                      <th className="py-2.5 text-center px-2">MS Teams</th>
                      <th className="py-2.5 text-center px-2">Slack</th>
                      <th className="py-2.5 text-center px-2">SMS</th>
                      <th className="py-2.5 text-center px-2">Webhook</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRules.map((rule) => {
                      let severityColor = 'bg-slate-100 text-slate-600 border-slate-200';
                      if (rule.severity === 'SUCCESS') severityColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                      else if (rule.severity === 'WARNING') severityColor = 'bg-amber-50 text-amber-700 border-amber-100';
                      else if (rule.severity === 'CRITICAL') severityColor = 'bg-rose-50 text-rose-700 border-rose-100';

                      return (
                        <tr key={rule.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 pr-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-800">{rule.eventName}</span>
                                <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded border ${severityColor}`}>
                                  {rule.severity}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-slate-400 font-bold leading-normal">{rule.description}</p>
                            </div>
                          </td>

                          {(['Email', 'Teams', 'Slack', 'SMS', 'Webhook'] as NotificationChannel[]).map((channel) => {
                            const isEnabled = rule.channels[channel];
                            return (
                              <td key={channel} className="py-4 text-center px-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleMatrix(rule.eventName, channel)}
                                  className={`inline-flex items-center justify-center p-2 rounded-xl border transition cursor-pointer ${
                                    isEnabled
                                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                                      : 'bg-white border-slate-200 text-slate-300 hover:bg-slate-50'
                                  }`}
                                  title={`Toggle ${channel} for ${rule.eventName}`}
                                >
                                  {channel === 'Email' && <Mail className="w-4 h-4" />}
                                  {channel === 'Teams' && <MessageSquare className="w-4 h-4" />}
                                  {channel === 'Slack' && <Slack className="w-4 h-4" />}
                                  {channel === 'SMS' && <Phone className="w-4 h-4" />}
                                  {channel === 'Webhook' && <Webhook className="w-4 h-4" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl text-[11px] text-slate-500">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-bold">
                  Delivery matrix updates instantly. Background telemetry daemons will pipe handshakes through the revised matrix targets.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: MESSAGE TEMPLATE CUSTOMIZER */}
          {activeTab === 'templates' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Customized Message Templates
                  </h3>
                  <p className="text-xs text-slate-400">Personalize outgoing alert text layouts with dynamic parameter variables.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Target Incident Category</label>
                  <select
                    value={selectedTemplateEvent}
                    onChange={(e) => setSelectedTemplateEvent(e.target.value as NotificationEvent)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Migration Started">Migration Started</option>
                    <option value="Migration Completed">Migration Completed</option>
                    <option value="Validation Failed">Validation Failed</option>
                    <option value="Approval Pending">Approval Pending</option>
                    <option value="Pipeline Failure">Pipeline Failure</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Subject Header Line</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                    value={templates[selectedTemplateEvent].subject}
                    onChange={(e) =>
                      setTemplates({
                        ...templates,
                        [selectedTemplateEvent]: {
                          ...templates[selectedTemplateEvent],
                          subject: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Message Body Layout</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono h-32 leading-relaxed"
                    value={templates[selectedTemplateEvent].body}
                    onChange={(e) =>
                      setTemplates({
                        ...templates,
                        [selectedTemplateEvent]: {
                          ...templates[selectedTemplateEvent],
                          body: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Click Variable Chip to Insert</span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTokens.map((t) => (
                      <button
                        key={t.token}
                        type="button"
                        onClick={() => handleInsertToken(t.token)}
                        className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-md border border-slate-200 hover:border-indigo-200 transition cursor-pointer"
                        title={t.desc}
                      >
                        {t.token}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHANNEL INTEGRATIONS CONFIGURATION */}
          {activeTab === 'gateways' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase">
                    <Settings className="w-4 h-4 text-indigo-600" />
                    Integration Credentials & Webhooks
                  </h3>
                  <p className="text-xs text-slate-400">Define SMTP properties, secure webhooks, and provider API targets.</p>
                </div>
              </div>

              {/* Sub Tabs for Channels */}
              <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                {(['Email', 'Teams', 'Slack', 'SMS', 'Webhook'] as NotificationChannel[]).map((channel) => {
                  const isActive = activeChannelTab === channel;
                  return (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => {
                        setActiveChannelTab(channel);
                        setTestResult(null);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {channel === 'Email' && <Mail className="w-3.5 h-3.5" />}
                      {channel === 'Teams' && <MessageSquare className="w-3.5 h-3.5" />}
                      {channel === 'Slack' && <Slack className="w-3.5 h-3.5" />}
                      {channel === 'SMS' && <Phone className="w-3.5 h-3.5" />}
                      {channel === 'Webhook' && <Webhook className="w-3.5 h-3.5" />}
                      <span>{channel} Gateway</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB PANELS FOR CONFIGURATION */}
              <div className="space-y-4">
                
                {/* EMAIL CONFIG PANEL */}
                {activeChannelTab === 'Email' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">SMTP Host Address</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                        value={emailConfig.smtpHost}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">SMTP Outgoing Port</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                        value={emailConfig.smtpPort}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Authenticated SMTP Username</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                        value={emailConfig.smtpUser}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Security Policy (TLS/SSL)</label>
                      <div className="flex items-center gap-2 h-9 pt-1">
                        <input
                          type="checkbox"
                          id="email-tls-toggle"
                          checked={emailConfig.tls}
                          onChange={(e) => setEmailConfig({ ...emailConfig, tls: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <label htmlFor="email-tls-toggle" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                          Force TLS Security Handshake
                        </label>
                      </div>
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Target Alert Recipients (Comma-Separated)</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                        value={emailConfig.recipients}
                        onChange={(e) => setEmailConfig({ ...emailConfig, recipients: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* TEAMS CONFIG PANEL */}
                {activeChannelTab === 'Teams' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Microsoft Teams Webhook URL</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                        value={teamsConfig.webhookUrl}
                        onChange={(e) => setTeamsConfig({ ...teamsConfig, webhookUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Teams Bot Display Name</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                        value={teamsConfig.displayName}
                        onChange={(e) => setTeamsConfig({ ...teamsConfig, displayName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Card Theme Accent Color (Hex)</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          className="w-9 h-9 p-0.5 border border-slate-200 rounded-xl cursor-pointer bg-slate-50"
                          value={teamsConfig.themeColor}
                          onChange={(e) => setTeamsConfig({ ...teamsConfig, themeColor: e.target.value })}
                        />
                        <input
                          type="text"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                          value={teamsConfig.themeColor}
                          onChange={(e) => setTeamsConfig({ ...teamsConfig, themeColor: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SLACK CONFIG PANEL */}
                {activeChannelTab === 'Slack' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Slack Webhook URL / Token</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                        value={slackConfig.webhookUrl}
                        onChange={(e) => setSlackConfig({ ...slackConfig, webhookUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Target Channel Name</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                        value={slackConfig.channel}
                        onChange={(e) => setSlackConfig({ ...slackConfig, channel: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Bot Username & Emoji</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                          value={slackConfig.username}
                          onChange={(e) => setSlackConfig({ ...slackConfig, username: e.target.value })}
                        />
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                          value={slackConfig.iconEmoji}
                          onChange={(e) => setSlackConfig({ ...slackConfig, iconEmoji: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SMS CONFIG PANEL */}
                {activeChannelTab === 'SMS' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Target Mobile Numbers</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                        value={smsConfig.phoneNumbers}
                        onChange={(e) => setSmsConfig({ ...smsConfig, phoneNumbers: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">API Carrier Gateway</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                        value={smsConfig.provider}
                        onChange={(e) => setSmsConfig({ ...smsConfig, provider: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Account SID / Authorization Token</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                        value={smsConfig.accountSid}
                        onChange={(e) => setSmsConfig({ ...smsConfig, accountSid: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* WEBHOOK CONFIG PANEL */}
                {activeChannelTab === 'Webhook' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Destination Webhook POST Endpoint</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                        value={webhookConfig.endpointUrl}
                        onChange={(e) => setWebhookConfig({ ...webhookConfig, endpointUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Encryption Signature Header Name</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                        value={webhookConfig.secretHeader}
                        onChange={(e) => setWebhookConfig({ ...webhookConfig, secretHeader: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Shared Secret Verification Key</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                        value={webhookConfig.secretToken}
                        onChange={(e) => setWebhookConfig({ ...webhookConfig, secretToken: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Actions & Verification Feedback */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3.5 border-t border-slate-100">
                  <div className="flex-1">
                    {testingChannel === activeChannelTab ? (
                      <span className="text-[11px] font-bold text-slate-400 animate-pulse flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Dispatching validation handshakes to active gateway...
                      </span>
                    ) : testResult ? (
                      <div className={`p-2.5 rounded-lg border text-xs font-semibold ${
                        testResult.success
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {testResult.msg}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 leading-normal font-bold uppercase">
                        Press "Verify Integration Gateway" to send a mocked event token to verify keys, API URLs, and host routes.
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTestChannel(activeChannelTab)}
                      disabled={testingChannel !== null}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-extrabold hover:bg-slate-800 transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Verify Integration Gateway</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Interactive Simulator Panel & Audit Logger Console (Span 4) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* SIMULATION CONTROLLER PANEL */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                Live Incident Simulator
              </h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Trigger simulated incidents manually to inspect matrix routing results.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Mock Job Name</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                  value={simulationJobName}
                  onChange={(e) => setSimulationJobName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Job Identifier</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                    value={simulationJobId}
                    onChange={(e) => setSimulationJobId(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Total Rows</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                    value={simulationTotalRecords}
                    onChange={(e) => setSimulationTotalRecords(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Triggering Administrator</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                  value={simulationActor}
                  onChange={(e) => setSimulationActor(e.target.value)}
                />
              </div>

              <div className="border-t border-slate-150 pt-2 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                Fire Simulated Events
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleSimulateEvent('Migration Started')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-950 hover:border-indigo-300 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                    <span>1. Migration Started</span>
                  </span>
                  <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateEvent('Migration Completed')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-950 hover:border-emerald-300 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    <span>2. Migration Completed</span>
                  </span>
                  <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateEvent('Validation Failed')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-amber-50 hover:text-amber-950 hover:border-amber-300 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>3. Validation Failed</span>
                  </span>
                  <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateEvent('Approval Pending')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-yellow-50 hover:text-yellow-950 hover:border-yellow-300 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-ping"></span>
                    <span>4. Approval Pending</span>
                  </span>
                  <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-yellow-600 transition" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateEvent('Pipeline Failure')}
                  className="w-full text-left p-2.5 bg-rose-50 hover:bg-rose-100 hover:text-rose-950 hover:border-rose-300 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-rose-700">5. Pipeline Failure</span>
                  </span>
                  <Play className="w-3.5 h-3.5 text-rose-500 group-hover:text-rose-700 transition" />
                </button>
              </div>
            </div>
          </div>

          {/* DYNAMIC NOTIFICATION AUDIT / LOG FEED */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                Dispatch Audit Console
              </span>
              <button
                type="button"
                onClick={() => setDispatchLogs([])}
                className="text-[9px] font-black text-slate-400 hover:text-slate-600 uppercase transition cursor-pointer"
              >
                Flush Console
              </button>
            </div>

            <div className="h-[390px] overflow-y-auto space-y-4 pr-1 font-mono text-[10px] leading-relaxed">
              {dispatchLogs.length === 0 ? (
                <div className="text-slate-400 text-center pt-32 font-bold">
                  Console flushed. Click any "Simulator" button to generate dispatch payloads.
                </div>
              ) : (
                dispatchLogs.map((log) => (
                  <div key={log.id} className="space-y-1.5 border-b border-slate-100 pb-3 last:border-0">
                    <div className="flex items-center justify-between gap-1.5 text-[9px] text-slate-400 font-bold">
                      <span>[{log.timestamp}]</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${
                        log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {log.eventName}
                      </span>
                    </div>

                    <p className="text-slate-700 font-bold text-[10px] line-clamp-1">
                      {log.messageExcerpt}
                    </p>

                    {/* Channel delivery details */}
                    <div className="space-y-1 pl-2 border-l border-slate-100">
                      {log.dispatches.map((d) => {
                        let badgeColor = 'text-slate-400';
                        if (d.status === 'SENT') badgeColor = 'text-emerald-600 font-black';
                        else if (d.status === 'FAILED') badgeColor = 'text-rose-600 font-black';

                        return (
                          <div key={d.channel} className="flex items-start gap-1.5 text-[9px] text-slate-500">
                            <span className="w-12 text-slate-400 font-bold uppercase">{d.channel}:</span>
                            <span className={badgeColor}>[{d.status}]</span>
                            <span className="text-slate-450 line-clamp-1 font-medium">{d.detail}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
