import React, { useState } from 'react';
import { OverflowTableWrapper } from './OverflowTableWrapper';
import {
  DataQualityAlertConfig,
  DataQualityAlertLog,
  QualityAlertChannel,
} from '../types';
import {
  Bell,
  BellRing,
  ShieldAlert,
  Webhook,
  Mail,
  Slack,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  X,
  Send,
  Code,
  Gauge,
  Sliders,
  Check,
  PauseCircle,
  Activity,
  ArrowRight,
  Info,
  Clock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

const INITIAL_CONFIGS: DataQualityAlertConfig[] = [
  {
    id: 'alert-cfg-1',
    pipelineId: 'job-1',
    pipelineName: 'D365 Business Central Customer Migration',
    entityName: 'Customer_Master',
    isEnabled: true,
    minQualityScoreThreshold: 90,
    alertChannels: ['Webhook', 'Email', 'Slack'],
    webhookUrl: 'https://hooks.slack.com/services/T0001/B0002/X993184',
    emailRecipients: ['data-ops@enterprise-corp.com', 'lead-architect@enterprise-corp.com'],
    slackChannel: '#data-quality-alerts-prod',
    autoPausePipelineOnBreach: true,
    consecutiveBreachTolerance: 1,
    lastAlertSentAt: '15 mins ago',
    lastScoreEvaluated: 94.2,
  },
  {
    id: 'alert-cfg-2',
    pipelineId: 'job-3',
    pipelineName: 'SAP S/4HANA Material Master',
    entityName: 'Item_Master',
    isEnabled: true,
    minQualityScoreThreshold: 85,
    alertChannels: ['Webhook', 'PagerDuty'],
    webhookUrl: 'https://events.pagerduty.com/v2/enqueue',
    emailRecipients: ['sap-migration-team@company.org'],
    autoPausePipelineOnBreach: true,
    consecutiveBreachTolerance: 2,
    lastAlertSentAt: '2 hours ago',
    lastScoreEvaluated: 88.0,
  },
  {
    id: 'alert-cfg-3',
    pipelineId: 'job-4',
    pipelineName: 'Salesforce CRM Contacts Sync',
    entityName: 'Contact_Master',
    isEnabled: false,
    minQualityScoreThreshold: 80,
    alertChannels: ['Email'],
    emailRecipients: ['crm-admin@company.org'],
    autoPausePipelineOnBreach: false,
    consecutiveBreachTolerance: 3,
    lastAlertSentAt: 'Never',
    lastScoreEvaluated: 91.5,
  },
];

const INITIAL_LOGS: DataQualityAlertLog[] = [
  {
    id: 'log-101',
    alertConfigId: 'alert-cfg-1',
    pipelineName: 'D365 Business Central Customer Migration',
    entityName: 'Customer_Master',
    triggeredAt: '2026-07-28 04:12:00',
    qualityScore: 78.4,
    thresholdScore: 90.0,
    channelUsed: 'Webhook',
    destinationTarget: 'https://hooks.slack.com/services/T0001/B0002/X993184',
    status: 'Delivered',
    payloadSummary: 'HTTP 200 OK - Slack message posted. Quality score dropped by 15.8% due to missing TaxID values.',
    isResolved: true,
    resolvedAt: '2026-07-28 04:25:00',
  },
  {
    id: 'log-102',
    alertConfigId: 'alert-cfg-2',
    pipelineName: 'SAP S/4HANA Material Master',
    entityName: 'Item_Master',
    triggeredAt: '2026-07-28 02:45:10',
    qualityScore: 81.2,
    thresholdScore: 85.0,
    channelUsed: 'PagerDuty',
    destinationTarget: 'https://events.pagerduty.com/v2/enqueue',
    status: 'Delivered',
    payloadSummary: 'PagerDuty Incident #4812 created. High null rate detected on Gross_Weight column.',
    isResolved: false,
  },
];

const PAYLOAD_TEMPLATES = {
  Default: {
    event: 'DATA_QUALITY_THRESHOLD_BREACH',
    alert_id: 'alert-cfg-1',
    pipeline_name: 'D365 Business Central Customer Migration',
    entity: 'Customer_Master',
    current_quality_score: 94.5,
    threshold_score: 90.0,
    breach_delta: '-4.5',
    evaluated_records: 500,
    failed_validation_records: 128,
    action_taken: 'PIPELINE_AUTO_PAUSED',
    timestamp: new Date().toISOString(),
    signature: 'sha256=e9b2f7a102c9840d1a58e9204c00a129f1092a01',
  },
  SAP: {
    objectType: 'BUS1001006',
    event: 'CREATED',
    data: {
      Material: 'MAT-9902',
      Description: 'High Precision Valve',
      BaseUnit: 'PC',
      MaterialGroup: '001',
    },
    metadata: {
      sourceSystem: 'SAP_S4HANA',
      timestamp: new Date().toISOString(),
    },
  },
  Salesforce: {
    sobject: {
      Id: '001d0000002tk0pAAA',
      Name: 'Acme Corp',
      Type: 'Account',
      Industry: 'Technology',
    },
    event: 'UPDATED',
    timestamp: new Date().toISOString(),
  },
  HubSpot: {
    objectId: 12345,
    propertyName: 'lifecyclestage',
    propertyValue: 'customer',
    changeSource: 'CRM_UI',
    eventId: '123456789',
    subscriptionId: 98765,
    portalId: 54321,
    subscriptionType: 'contact.propertyChange',
    occurredAt: Date.now(),
  },
};

export const DataQualityAlertsPanel: React.FC = () => {
  const [configs, setConfigs] = useState<DataQualityAlertConfig[]>(INITIAL_CONFIGS);
  const [logs, setLogs] = useState<DataQualityAlertLog[]>(INITIAL_LOGS);
  const [activeTab, setActiveTab] = useState<'configs' | 'history' | 'webhook-test'>('configs');

  // Modal State for Add / Edit
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingConfig, setEditingConfig] = useState<DataQualityAlertConfig | null>(null);

  // Form State
  const [formPipelineName, setFormPipelineName] = useState('D365 Business Central Customer Migration');
  const [formEntityName, setFormEntityName] = useState('Customer_Master');
  const [formThreshold, setFormThreshold] = useState<number>(90);
  const [formChannels, setFormChannels] = useState<QualityAlertChannel[]>(['Webhook', 'Email']);
  const [formWebhookUrl, setFormWebhookUrl] = useState('https://hooks.slack.com/services/T000/B000/X000');
  const [formEmails, setFormEmails] = useState('data-alerts@enterprise.com');
  const [formAutoPause, setFormAutoPause] = useState<boolean>(true);
  const [formBreachTolerance, setFormBreachTolerance] = useState<number>(1);

  // Simulator State
  const [simulatedScore, setSimulatedScore] = useState<number>(94.5);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationBanner, setSimulationBanner] = useState<string | null>(null);

  // Webhook Test State
  const [testWebhookUrl, setTestWebhookUrl] = useState<string>(
    'https://hooks.slack.com/services/T0001/B0002/X993184'
  );
  const [testResponseStatus, setTestResponseStatus] = useState<string | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);

  const [testPayloadJson, setTestPayloadJson] = useState<string>(JSON.stringify(PAYLOAD_TEMPLATES.Default, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleLoadTemplate = (name: keyof typeof PAYLOAD_TEMPLATES) => {
    setTestPayloadJson(JSON.stringify(PAYLOAD_TEMPLATES[name], null, 2));
  };

  // Real-time JSON Validation
  React.useEffect(() => {
    try {
      JSON.parse(testPayloadJson);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
    }
  }, [testPayloadJson]);

  const handlePrettifyJson = () => {
    try {
      const obj = JSON.parse(testPayloadJson);
      setTestPayloadJson(JSON.stringify(obj, null, 2));
    } catch (e) {
      // Ignore if invalid
    }
  };

  const handleToggleConfig = (id: string) => {
    setConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isEnabled: !c.isEnabled } : c))
    );
  };

  const handleOpenAddModal = () => {
    setEditingConfig(null);
    setFormPipelineName('D365 Business Central Customer Migration');
    setFormEntityName('Customer_Master');
    setFormThreshold(90);
    setFormChannels(['Webhook', 'Email']);
    setFormWebhookUrl('https://hooks.slack.com/services/T000/B000/X000');
    setFormEmails('data-alerts@enterprise.com');
    setFormAutoPause(true);
    setFormBreachTolerance(1);
    setShowModal(true);
  };

  const handleOpenEditModal = (cfg: DataQualityAlertConfig) => {
    setEditingConfig(cfg);
    setFormPipelineName(cfg.pipelineName);
    setFormEntityName(cfg.entityName);
    setFormThreshold(cfg.minQualityScoreThreshold);
    setFormChannels(cfg.alertChannels);
    setFormWebhookUrl(cfg.webhookUrl || '');
    setFormEmails(cfg.emailRecipients ? cfg.emailRecipients.join(', ') : '');
    setFormAutoPause(cfg.autoPausePipelineOnBreach);
    setFormBreachTolerance(cfg.consecutiveBreachTolerance);
    setShowModal(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedEmails = formEmails.split(',').map((s) => s.trim()).filter(Boolean);

    if (editingConfig) {
      setConfigs((prev) =>
        prev.map((c) =>
          c.id === editingConfig.id
            ? {
                ...c,
                pipelineName: formPipelineName,
                entityName: formEntityName,
                minQualityScoreThreshold: formThreshold,
                alertChannels: formChannels,
                webhookUrl: formWebhookUrl,
                emailRecipients: parsedEmails,
                autoPausePipelineOnBreach: formAutoPause,
                consecutiveBreachTolerance: formBreachTolerance,
              }
            : c
        )
      );
    } else {
      const newCfg: DataQualityAlertConfig = {
        id: `alert-cfg-${Date.now()}`,
        pipelineId: `job-${Date.now()}`,
        pipelineName: formPipelineName,
        entityName: formEntityName,
        isEnabled: true,
        minQualityScoreThreshold: formThreshold,
        alertChannels: formChannels,
        webhookUrl: formWebhookUrl,
        emailRecipients: parsedEmails,
        autoPausePipelineOnBreach: formAutoPause,
        consecutiveBreachTolerance: formBreachTolerance,
        lastAlertSentAt: 'Never',
        lastScoreEvaluated: 100,
      };
      setConfigs((prev) => [...prev, newCfg]);
    }
    setShowModal(false);
  };

  const handleDeleteConfig = (id: string) => {
    setConfigs((prev) => prev.filter((c) => c.id !== id));
  };

  const handleChannelToggle = (channel: QualityAlertChannel) => {
    if (formChannels.includes(channel)) {
      setFormChannels(formChannels.filter((ch) => ch !== channel));
    } else {
      setFormChannels([...formChannels, channel]);
    }
  };

  // Run live simulation of quality breach
  const handleSimulateQualityDrop = (targetScore: number) => {
    setIsSimulating(true);
    setSimulationBanner(null);

    setTimeout(() => {
      setSimulatedScore(targetScore);
      setIsSimulating(false);

      if (targetScore < 90) {
        // Trigger alert log
        const newLog: DataQualityAlertLog = {
          id: `log-${Date.now()}`,
          alertConfigId: 'alert-cfg-1',
          pipelineName: 'D365 Business Central Customer Migration',
          entityName: 'Customer_Master',
          triggeredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          qualityScore: targetScore,
          thresholdScore: 90.0,
          channelUsed: 'Webhook',
          destinationTarget: 'https://hooks.slack.com/services/T0001/B0002/X993184',
          status: 'Delivered',
          payloadSummary: `HTTP 200 OK - Quality breach detected (${targetScore}% < 90.0%). Webhook POST dispatched and pipeline auto-paused.`,
          isResolved: false,
        };

        setLogs((prev) => [newLog, ...prev]);
        setSimulationBanner(
          `ALERT BREACH TRIGGERED! Quality Score fell to ${targetScore}% (Below 90% threshold). Webhook payload dispatched to Slack & Pipeline #job-1 AUTO-PAUSED!`
        );
      } else {
        setSimulationBanner(
          `Quality score updated to ${targetScore}%. Score remains above active policy thresholds. Systems operating normally.`
        );
      }
    }, 1000);
  };

  const handleTestWebhook = () => {
    setIsTestingWebhook(true);
    setTestResponseStatus(null);

    setTimeout(() => {
      setIsTestingWebhook(false);
      setTestResponseStatus(
        'HTTP/1.1 200 OK\nContent-Type: application/json\nResponse Time: 142ms\nBody: {"ok": true, "message": "Webhook payload validated and delivered successfully"}'
      );
    }, 1200);
  };

  const handleResolveLog = (logId: string) => {
    setLogs((prev) =>
      prev.map((l) =>
        l.id === logId
          ? {
              ...l,
              isResolved: true,
              resolvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : l
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Live Quality Gauge - Polished White Theme */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
              <BellRing className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Real-Time Data Quality Alerting Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Monitors real-time dataset validation scores during migration runs. Instantly dispatches Webhook POST calls to Slack, Teams, PagerDuty, or Email endpoints when scores fall below defined SLA thresholds.
          </p>
        </div>

        {/* Realtime Monitor Box - Refined Light Theme */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs font-mono shrink-0 w-full lg:w-[380px] space-y-4 shadow-3xs">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2.5">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Monitored Pipeline</span>
            <span className="text-indigo-700 font-black font-sans tracking-tight">D365 Customer Migration</span>
          </div>

          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 block font-black uppercase tracking-widest">Current Score</span>
              <span
                className={`text-2xl font-black font-mono tracking-tighter ${
                  simulatedScore < 90 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'
                }`}
              >
                {simulatedScore}%
              </span>
            </div>

            <div className="text-center space-y-1">
              <span className="text-[9px] text-slate-400 block font-black uppercase tracking-widest">Threshold</span>
              <span className="text-2xl font-black font-mono text-slate-800 tracking-tighter">90.0%</span>
            </div>

            <div className="text-right space-y-1">
              <span className="text-[9px] text-slate-400 block font-black uppercase tracking-widest">Status</span>
              {simulatedScore < 90 ? (
                <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter">
                  <AlertTriangle className="w-2.5 h-2.5" /> BREACH
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter">
                  <CheckCircle2 className="w-2.5 h-2.5" /> HEALTHY
                </span>
              )}
            </div>
          </div>

          {/* Quick Simulation Trigger Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Simulate Batch</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSimulateQualityDrop(95.2)}
                disabled={isSimulating}
                className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg border border-slate-200 hover:border-emerald-200 shadow-4xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                PASS (95%)
              </button>
              <button
                onClick={() => handleSimulateQualityDrop(78.4)}
                disabled={isSimulating}
                className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 text-[10px] font-black rounded-lg border border-slate-200 hover:border-rose-200 shadow-4xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Zap className="w-3 h-3 fill-rose-500 text-rose-500" /> BREACH (78%)
              </button>
            </div>
          </div>
        </div>
      </div>

      {simulationBanner && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            simulatedScore < 90
              ? 'bg-rose-50 border-rose-200 text-rose-900 font-medium'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-2">
            {simulatedScore < 90 ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span>{simulationBanner}</span>
          </div>
          <button
            onClick={() => setSimulationBanner(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('configs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'configs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Alert Configurations ({configs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Alert Audit History ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('webhook-test')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'webhook-test'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Webhook className="w-4 h-4" />
            <span>Webhook Payload Simulator</span>
          </button>
        </div>

        {activeTab === 'configs' && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Alert Policy</span>
          </button>
        )}
      </div>

      {/* TAB 1: ALERT CONFIGURATIONS */}
      {activeTab === 'configs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map((cfg) => (
            <div
              key={cfg.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl border ${
                        cfg.isEnabled
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {cfg.pipelineName}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-500">
                        Entity: {cfg.entityName}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleConfig(cfg.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      cfg.isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        cfg.isEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100 my-3 font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">SLA Quality Threshold:</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                      &lt; {cfg.minQualityScoreThreshold}% Score
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">Notification Channels:</span>
                    <div className="flex gap-1">
                      {cfg.alertChannels.map((ch) => (
                        <span
                          key={ch}
                          className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">Auto-Pause Migration:</span>
                    <span
                      className={`font-semibold ${
                        cfg.autoPausePipelineOnBreach ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {cfg.autoPausePipelineOnBreach ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  {cfg.webhookUrl && (
                    <div className="pt-2 border-t border-slate-200/60 truncate text-[10px] text-slate-500">
                      <span className="text-slate-400 font-sans block">Webhook Endpoint:</span>
                      <span className="text-slate-800">{cfg.webhookUrl}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-400">
                  Last Alert: {cfg.lastAlertSentAt || 'Never'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(cfg)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteConfig(cfg.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <OverflowTableWrapper hintLabel="Scroll horizontally to view alert history columns">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Trigger Time</th>
                  <th className="py-3 px-4">Pipeline & Entity</th>
                  <th className="py-3 px-4">Quality Score vs Threshold</th>
                  <th className="py-3 px-4">Channel & Target</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-3 px-4 text-slate-500">{log.triggeredAt}</td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">
                      <div>{log.pipelineName}</div>
                      <span className="text-[11px] font-mono text-slate-400 font-normal">
                        {log.entityName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-600">
                      {log.qualityScore}% <span className="text-slate-400 text-[10px] font-normal">(SLA: {log.thresholdScore}%)</span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-800">{log.channelUsed}</div>
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]">
                        {log.destinationTarget}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {log.isResolved ? (
                        <span className="text-slate-500 text-[11px]">
                          Resolved ({log.resolvedAt})
                        </span>
                      ) : (
                        <button
                          onClick={() => handleResolveLog(log.id)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-all text-xs border border-indigo-200"
                        >
                          Acknowledge
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </OverflowTableWrapper>
        </div>
      )}

      {/* TAB 3: WEBHOOK TESTER */}
      {activeTab === 'webhook-test' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Webhook className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">Webhook POST Endpoint Config</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Endpoint URL</label>
              <input
                type="text"
                value={testWebhookUrl}
                onChange={(e) => setTestWebhookUrl(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleTestWebhook}
              disabled={isTestingWebhook || !!jsonError}
              className={`flex items-center gap-2 px-4 py-2.5 text-white text-xs font-semibold rounded-xl shadow-xs transition-all w-full justify-center ${
                jsonError 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              <Send className={`w-4 h-4 ${isTestingWebhook ? 'animate-spin' : ''}`} />
              <span>
                {isTestingWebhook 
                  ? 'Dispatching HTTP POST...' 
                  : jsonError 
                    ? 'Fix JSON Errors to Send' 
                    : 'Send Test Webhook Event'}
              </span>
            </button>

            {testResponseStatus && (
              <div className="p-3 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl border border-slate-800 whitespace-pre-wrap">
                {testResponseStatus}
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900">Interactive Payload Validator</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                  {(['SAP', 'Salesforce', 'HubSpot'] as const).map((tpl) => (
                    <button
                      key={tpl}
                      onClick={() => handleLoadTemplate(tpl)}
                      className="px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-slate-600 hover:text-indigo-600 hover:bg-white rounded transition-all"
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handlePrettifyJson}
                  className="text-[10px] text-indigo-600 font-bold hover:bg-indigo-50 px-2 py-1 rounded border border-indigo-100 transition-all"
                >
                  Prettify JSON
                </button>
                <span className="text-[10px] text-indigo-600 font-mono bg-indigo-50 px-2 py-1 rounded border border-indigo-100 font-bold uppercase">
                  POST /webhook
                </span>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={testPayloadJson}
                onChange={(e) => setTestPayloadJson(e.target.value)}
                className={`w-full h-64 p-4 font-mono text-xs bg-slate-50 border rounded-xl focus:outline-none transition-all custom-scrollbar resize-none ${
                  jsonError ? 'border-rose-300 focus:border-rose-400' : 'border-slate-200 focus:border-indigo-400'
                }`}
                spellCheck={false}
              />
              
              {/* Validation Status Badge */}
              <div className={`absolute bottom-3 right-3 px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter border ${
                jsonError 
                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {jsonError ? 'Invalid Syntax' : 'Valid JSON Schema'}
              </div>
            </div>

            {jsonError && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-[11px] animate-fadeIn">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block uppercase tracking-tight text-[10px] mb-0.5">Syntax Error Detected</span>
                  <span className="font-mono">{jsonError}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Policy Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  {editingConfig ? 'Edit Data Quality Alert Policy' : 'Create Data Quality Alert Policy'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Pipeline</label>
                <input
                  type="text"
                  value={formPipelineName}
                  onChange={(e) => setFormPipelineName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Entity / Table</label>
                <input
                  type="text"
                  value={formEntityName}
                  onChange={(e) => setFormEntityName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Minimum SLA Quality Score Threshold (%)
                  </label>
                  <span className="text-xs font-bold text-indigo-600 font-mono">
                    &lt; {formThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>50% (Lenient)</span>
                  <span>85% (Standard)</span>
                  <span>95% (Strict)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Notification Channels</label>
                <div className="flex flex-wrap gap-2">
                  {(['Webhook', 'Email', 'Slack', 'Teams', 'PagerDuty'] as QualityAlertChannel[]).map((ch) => {
                    const selected = formChannels.includes(ch);
                    return (
                      <button
                        type="button"
                        key={ch}
                        onClick={() => handleChannelToggle(ch)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          selected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              {formChannels.includes('Webhook') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Webhook Target URL</label>
                  <input
                    type="url"
                    value={formWebhookUrl}
                    onChange={(e) => setFormWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              )}

              {formChannels.includes('Email') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Recipients (Comma Separated)</label>
                  <input
                    type="text"
                    value={formEmails}
                    onChange={(e) => setFormEmails(e.target.value)}
                    placeholder="data-ops@company.org, lead@company.org"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Auto-Pause Pipeline on Quality Breach
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Immediately halts record migration when SLA threshold is breached.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormAutoPause(!formAutoPause)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formAutoPause ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formAutoPause ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
