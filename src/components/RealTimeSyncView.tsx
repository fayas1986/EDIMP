import React, { useState, useEffect, useRef } from 'react';
import { RealTime45TbTransferEngine } from './RealTime45TbTransferEngine';
import {
  Activity,
  RefreshCcw,
  Wifi,
  Server,
  Play,
  Pause,
  Plus,
  Search,
  Filter,
  Database,
  Zap,
  Radio,
  Terminal,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  Eye,
  Globe,
  Cpu,
  TrendingUp,
  Gauge,
  Send,
  Code,
  Sliders,
  Layers,
  Sparkles,
  Download,
  X,
  ArrowRightLeft,
  Bell
} from 'lucide-react';
import { OverflowTableWrapper } from './OverflowTableWrapper';
import { SyncHealthHeatmap } from './SyncHealthHeatmap';
import { ReconciliationView } from './ReconciliationView';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
  Legend
} from 'recharts';

interface CDCStream {
  id: string;
  name: string;
  source: string;
  sourceType: string;
  targetTopic: string;
  status: 'Streaming' | 'Backpressured' | 'Paused' | 'Degraded';
  latencyMs: number;
  eventsPerSec: number;
  totalEvents: number;
  queueLag: number;
  lastSync: string;
}

interface CDCEvent {
  id: string;
  timestamp: string;
  streamId: string;
  streamName: string;
  opType: 'INSERT' | 'UPDATE' | 'DELETE' | 'DDL';
  table: string;
  txId: string;
  lsn: string;
  payloadBefore?: Record<string, any>;
  payloadAfter?: Record<string, any>;
  latencyMs: number;
  status: 'Delivered' | 'In-Flight' | 'Retry';
}

interface PacketLogEntry {
  id: string;
  timestamp: string;
  direction: 'INBOUND' | 'OUTBOUND';
  packetType: 'Ingress' | 'Egress' | 'Transformation' | 'Error';
  sourceOrTarget: string;
  protocol: 'CDC-WAL' | 'WebSocket-Delta' | 'REST-JSON' | 'Avro-Kafka' | 'OData-v4' | 'Engine-XForm';
  packetSize: string;
  latencyMs: number;
  correlationId: string;
  tableOrEntity: string;
  opType: 'INSERT' | 'UPDATE' | 'DELETE' | 'DDL' | 'ACK' | 'SYNC_EMIT' | 'MAP_XFORM';
  syncState: 'Synced to UI' | 'Buffered' | 'Filtered' | 'Schema Mismatch' | 'Dropped' | 'Transformed';
  syncDiagnosticNote: string;
  payloadBefore?: Record<string, any> | null;
  payloadAfter?: Record<string, any> | null;
}

interface WebhookSubscription {
  id: string;
  name: string;
  targetUrl: string;
  topicsFilter: string[];
  status: 'Active' | 'Failing' | 'Disabled';
  deliveryRate: number;
  lastStatusCode: number;
  lastLatencyMs: number;
  hmacEnabled: boolean;
  retryPolicy: string;
}

interface BrokerNode {
  id: string;
  name: string;
  role: 'Leader' | 'Follower';
  status: 'Healthy' | 'Degraded';
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  partitionCount: number;
}

export default function RealTimeSyncView() {
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [activeTab, setActiveTab] = useState<'cdc-streams' | 'live-feed' | 'packet-log' | 'webhooks' | 'broker-health' | 'dlq-queue' | 'reconciliation'>('cdc-streams');
  
  // Real-Time Packet Logging & Diagnostic States
  const [packetDirectionFilter, setPacketDirectionFilter] = useState<'ALL' | 'INBOUND' | 'OUTBOUND' | 'DIAGNOSTIC_ALERTS'>('ALL');
  const [selectedPacketTypes, setSelectedPacketTypes] = useState<('Ingress' | 'Egress' | 'Transformation' | 'Error')[]>([
    'Ingress',
    'Egress',
    'Transformation',
    'Error'
  ]);
  const [packetSearchTerm, setPacketSearchTerm] = useState('');
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const [selectedPacketModal, setSelectedPacketModal] = useState<PacketLogEntry | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Latency Heatmap Visualization States
  const [heatmapViewMode, setHeatmapViewMode] = useState<'heatmap' | 'timeline' | 'protocols' | 'phases' | 'forecast'>('heatmap');
  const [selectedHeatmapProtocolFilter, setSelectedHeatmapProtocolFilter] = useState<string>('ALL');

  // Diagnostic Trace Tool States
  const [diagnosticTraceInput, setDiagnosticTraceInput] = useState('ronald.policarpio@aujan.com.sa');
  const [diagnosticResult, setDiagnosticResult] = useState<{
    query: string;
    found: boolean;
    streamName: string;
    correlationId: string;
    latencyMs: number;
    steps: { name: string; status: 'SUCCESS' | 'WARNING' | 'FAILED'; detail: string }[];
    verdict: string;
  } | null>({
    query: 'ronald.policarpio@aujan.com.sa',
    found: true,
    streamName: 'PostgreSQL Customer Master CDC',
    correlationId: 'corr-00941029',
    latencyMs: 14,
    steps: [
      { name: '1. Ingress WAL Packet Capture', status: 'SUCCESS', detail: 'WAL record #0/16C82B0 received from prod-postgres-db.internal in 14ms.' },
      { name: '2. Schema Mapping Validation', status: 'SUCCESS', detail: 'Source field "Email Address" correctly bound to target "Customer.Email".' },
      { name: '3. Broker Event Bus Queue', status: 'SUCCESS', detail: 'Published to topic cdc.customers.v1 partition #2. Queue lag: 0 msgs.' },
      { name: '4. UI Socket State Emitter', status: 'SUCCESS', detail: 'Dispatched to active browser iframe preview session via WebSocket-Delta.' }
    ],
    verdict: 'HEALTHY: Data packet captured, mapped, and broadcast to UI components in 14ms.'
  });
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);

  // Real-Time Packet Logs List State
  const [packetLogs, setPacketLogs] = useState<PacketLogEntry[]>([
    {
      id: 'pkt-in-9901',
      timestamp: new Date().toISOString().substring(11, 23),
      direction: 'INBOUND',
      packetType: 'Ingress',
      sourceOrTarget: 'PostgreSQL WAL (prod-pg-01)',
      protocol: 'CDC-WAL',
      packetSize: '1.2 KB',
      latencyMs: 14,
      correlationId: 'corr-00941029',
      tableOrEntity: 'Customers (Email_KSA_Aligned)',
      opType: 'UPDATE',
      syncState: 'Synced to UI',
      syncDiagnosticNote: 'Row updated: ronald.policarpio@aujan.com.sa -> credit_limit=35000. Reflected in UI state tree in 3ms.',
      payloadBefore: { customer_id: 'CUST-1049', email: 'ronald.policarpio@aujan.com.sa', credit_limit: 25000 },
      payloadAfter: { customer_id: 'CUST-1049', email: 'ronald.policarpio@aujan.com.sa', credit_limit: 35000, updated_at: '2026-08-07T03:25:00Z' }
    },
    {
      id: 'pkt-out-9902',
      timestamp: new Date(Date.now() - 400).toISOString().substring(11, 23),
      direction: 'OUTBOUND',
      packetType: 'Egress',
      sourceOrTarget: 'WebSocket UI Client (#a819)',
      protocol: 'WebSocket-Delta',
      packetSize: '840 B',
      latencyMs: 6,
      correlationId: 'corr-00941029',
      tableOrEntity: 'RealTimeSyncView',
      opType: 'SYNC_EMIT',
      syncState: 'Synced to UI',
      syncDiagnosticNote: 'Broadcast payload delta to active iframe preview window. State rendered successfully.',
      payloadAfter: { target_component: 'MigrationWizardView', entity_count: 466, active_filters: [] }
    },
    {
      id: 'pkt-xform-9908',
      timestamp: new Date(Date.now() - 800).toISOString().substring(11, 23),
      direction: 'INBOUND',
      packetType: 'Transformation',
      sourceOrTarget: 'Stream Processing Engine',
      protocol: 'Engine-XForm',
      packetSize: '1.4 KB',
      latencyMs: 8,
      correlationId: 'corr-00941029',
      tableOrEntity: 'Customer_Master_Mapping',
      opType: 'MAP_XFORM',
      syncState: 'Transformed',
      syncDiagnosticNote: 'Transformation Rule #42 Applied: Phone number normalized to E.164 format (+966) & Tax ID enriched.',
      payloadBefore: { phone: '0501234567', tax_reg: '300123456700003' },
      payloadAfter: { phone_e164: '+966501234567', vat_reg_no: '300123456700003', zatca_compliant: true }
    },
    {
      id: 'pkt-in-9903',
      timestamp: new Date(Date.now() - 1200).toISOString().substring(11, 23),
      direction: 'INBOUND',
      packetType: 'Ingress',
      sourceOrTarget: 'Business Central OData v4',
      protocol: 'OData-v4',
      packetSize: '2.4 KB',
      latencyMs: 48,
      correlationId: 'corr-00941030',
      tableOrEntity: 'SalesHeader',
      opType: 'INSERT',
      syncState: 'Synced to UI',
      syncDiagnosticNote: 'New Sales Order SO-2026-0941 parsed and matched to Customer CUST-1049.',
      payloadAfter: { document_no: 'SO-2026-0941', customer_no: 'CUST-1049', total_amount: 14250.00 }
    },
    {
      id: 'pkt-err-9904',
      timestamp: new Date(Date.now() - 2100).toISOString().substring(11, 23),
      direction: 'INBOUND',
      packetType: 'Error',
      sourceOrTarget: 'MS SQL Server Inventory Agent',
      protocol: 'Avro-Kafka',
      packetSize: '1.8 KB',
      latencyMs: 88,
      correlationId: 'corr-00941031',
      tableOrEntity: 'ItemJournalLine',
      opType: 'UPDATE',
      syncState: 'Schema Mismatch',
      syncDiagnosticNote: 'Schema Mismatch Error: Field "warehouse_bin_code" is not present in target schema. Quarantined to DLQ.',
      payloadBefore: { item_no: 'SKU-8821', warehouse_bin_code: 'BIN-A12' },
      payloadAfter: { item_no: 'SKU-8821', warehouse_bin_code: 'BIN-A12', quantity: 120 }
    },
    {
      id: 'pkt-out-9905',
      timestamp: new Date(Date.now() - 3100).toISOString().substring(11, 23),
      direction: 'OUTBOUND',
      packetType: 'Egress',
      sourceOrTarget: 'ERP Integration Engine Webhook',
      protocol: 'REST-JSON',
      packetSize: '1.1 KB',
      latencyMs: 62,
      correlationId: 'corr-00941029',
      tableOrEntity: 'Webhook Endpoint',
      opType: 'ACK',
      syncState: 'Synced to UI',
      syncDiagnosticNote: 'HTTP 200 OK acknowledged by external endpoint https://api.mycompany.com/v1/webhooks/cdc-receiver.',
      payloadAfter: { status: 200, response: 'ACK_ACCEPTED', process_time_ms: 12 }
    },
    {
      id: 'pkt-err-9906',
      timestamp: new Date(Date.now() - 4200).toISOString().substring(11, 23),
      direction: 'OUTBOUND',
      packetType: 'Error',
      sourceOrTarget: 'Partner API Webhook Bridge',
      protocol: 'REST-JSON',
      packetSize: '920 B',
      latencyMs: 5002,
      correlationId: 'corr-00941032',
      tableOrEntity: 'PartnerSalesSync',
      opType: 'ACK',
      syncState: 'Dropped',
      syncDiagnosticNote: 'Network Error: HTTP 504 Gateway Timeout while emitting payload to api.partner.org/v2/orders.',
      payloadAfter: { error_code: 'GATEWAY_TIMEOUT', retry_count: 3, max_retries_exceeded: true }
    }
  ]);

  // Auto-scroll packet logs to top when new packets arrive, unless paused
  useEffect(() => {
    if (!isAutoScrollPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [packetLogs, isAutoScrollPaused]);
  
  // Stats
  const [activeCdcStreamsCount, setActiveCdcStreamsCount] = useState(14);
  const [avgLatency, setAvgLatency] = useState(42);
  const [messagesPerSec, setMessagesPerSec] = useState(3240);
  const [totalProcessedEvents, setTotalProcessedEvents] = useState(14829302);
  const [reconciliationScanned, setReconciliationScanned] = useState(3382904);
  const [reconciliationExceptions, setReconciliationExceptions] = useState(22454);
  const [showReconciliationAlertModal, setShowReconciliationAlertModal] = useState(false);
  const [reconWarningThreshold, setReconWarningThreshold] = useState(500);
  const [reconCriticalThreshold, setReconCriticalThreshold] = useState(5000);
  const [reconciliationData, setReconciliationData] = useState([
    { id: 'sap-cust', integration: 'SAP → Dynamics 365', entity: 'Customers', source: 125420, target: 125418, migrated: 125418, matched: 99.98, exceptions: 2, status: 'syncing' },
    { id: 'sap-vend', integration: 'SAP → Dynamics 365', entity: 'Vendors', source: 32810, target: 32810, migrated: 32810, matched: 100.0, exceptions: 0, status: 'synced' },
    { id: 'sf-leads', integration: 'Salesforce → Snowflake', entity: 'Leads', source: 2450912, target: 2450890, migrated: 2450890, matched: 99.99, exceptions: 22, status: 'syncing' },
    { id: 'sf-opps', integration: 'Salesforce → Snowflake', entity: 'Opportunities', source: 89012, target: 89012, migrated: 89012, matched: 100.0, exceptions: 0, status: 'synced' },
    { id: 'stripe-tx', integration: 'Stripe → NetSuite', entity: 'Transactions', source: 8912440, target: 8890099, migrated: 8890099, matched: 99.75, exceptions: 22341, status: 'warning' },
    { id: 'shop-ord', integration: 'Shopify → ERP', entity: 'Orders', source: 450231, target: 450120, migrated: 450120, matched: 99.97, exceptions: 111, status: 'syncing' },
    { id: 'wk-emp', integration: 'Workday → Active Directory', entity: 'Employees', source: 14050, target: 14050, migrated: 14050, matched: 100.0, exceptions: 0, status: 'synced' },
    { id: 'pg-events', integration: 'PostgreSQL → Kafka', entity: 'Events', source: 12059330, target: 12059330, migrated: 12059330, matched: 100.0, exceptions: 0, status: 'synced' },
    { id: 'mdb-docs', integration: 'MongoDB → ElasticSearch', entity: 'Documents', source: 410293, target: 410190, migrated: 410190, matched: 99.97, exceptions: 103, status: 'syncing' },
  ]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [opFilter, setOpFilter] = useState<'ALL' | 'INSERT' | 'UPDATE' | 'DELETE' | 'DDL'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Notification and Toast states
  const [actionToast, setActionToast] = useState<{ message: string; type: 'burst' | 'ddl' | 'webhook' | 'info' | 'alert' } | null>(null);

  // Dead Letter Queue items state
  const [dlqItems, setDlqItems] = useState([
    {
      id: 'dlq-evt-88192',
      streamName: 'PostgreSQL Customer Master CDC',
      errorReason: 'TypeMismatch: Column credit_limit expected INTEGER, received STRING ("25000.00USD")',
      failCount: '3 retries',
      capturedTime: '14m ago',
      color: 'rose'
    },
    {
      id: 'dlq-evt-88195',
      streamName: 'MS SQL Inventory Ledger Capture',
      errorReason: 'SchemaDrift: Unmapped column warehouse_bin_code detected in target table ItemJournalLine',
      failCount: '1 retry',
      capturedTime: '2m ago',
      color: 'amber'
    }
  ]);

  // Modal states
  const [selectedEventModal, setSelectedEventModal] = useState<CDCEvent | null>(null);
  const [isCreateStreamOpen, setIsCreateStreamOpen] = useState(false);
  const [isCreateWebhookOpen, setIsCreateWebhookOpen] = useState(false);
  const [webhookPingStatus, setWebhookPingStatus] = useState<string | null>(null);

  // CDC Streams initial state
  const [cdcStreams, setCdcStreams] = useState<CDCStream[]>([
    {
      id: 'cdc-pg-cust-01',
      name: 'PostgreSQL Customer Master CDC',
      source: 'prod-postgres-db.internal',
      sourceType: 'PostgreSQL Debezium',
      targetTopic: 'cdc.customers.v1',
      status: 'Streaming',
      latencyMs: 38,
      eventsPerSec: 1240,
      totalEvents: 4820192,
      queueLag: 12,
      lastSync: 'Just now'
    },
    {
      id: 'cdc-bc-orders-02',
      name: 'Business Central Orders Streaming',
      source: 'bc-erp-us.cloud.dynamics.com',
      sourceType: 'Business Central OData Webhook',
      targetTopic: 'cdc.sales_orders.v2',
      status: 'Streaming',
      latencyMs: 48,
      eventsPerSec: 890,
      totalEvents: 3109201,
      queueLag: 4,
      lastSync: 'Just now'
    },
    {
      id: 'cdc-mssql-inv-03',
      name: 'MS SQL Inventory Ledger Capture',
      source: 'mssql-warehouse-cluster.internal',
      sourceType: 'MS SQL CDC Agent',
      targetTopic: 'cdc.inventory_ledger.v1',
      status: 'Backpressured',
      latencyMs: 142,
      eventsPerSec: 620,
      totalEvents: 2940182,
      queueLag: 384,
      lastSync: '2s ago'
    },
    {
      id: 'cdc-mongo-payments-04',
      name: 'MongoDB Payment Audit Oplog',
      source: 'mongo-billing-atlas.mongodb.net',
      sourceType: 'MongoDB Change Streams',
      targetTopic: 'cdc.payments_audit.v1',
      status: 'Streaming',
      latencyMs: 29,
      eventsPerSec: 490,
      totalEvents: 1840192,
      queueLag: 0,
      lastSync: 'Just now'
    },
    {
      id: 'cdc-sfdc-leads-05',
      name: 'Salesforce CRM Change Events',
      source: 'mycompany.my.salesforce.com',
      sourceType: 'SFDC Streaming API',
      targetTopic: 'cdc.crm_leads.v1',
      status: 'Degraded',
      latencyMs: 210,
      eventsPerSec: 110,
      totalEvents: 549200,
      queueLag: 128,
      lastSync: '12s ago'
    }
  ]);

  // Initial live events list
  const [liveEvents, setLiveEvents] = useState<CDCEvent[]>([
    {
      id: 'evt-90821',
      timestamp: new Date().toISOString().substring(11, 23),
      streamId: 'cdc-pg-cust-01',
      streamName: 'PostgreSQL Customer Master CDC',
      opType: 'UPDATE',
      table: 'Customers',
      txId: 'tx-00941029',
      lsn: '0/16C82B0',
      latencyMs: 34,
      status: 'Delivered',
      payloadBefore: { customer_id: 'CUST-1049', credit_limit: 25000, status: 'Active' },
      payloadAfter: { customer_id: 'CUST-1049', credit_limit: 35000, status: 'Active', updated_at: '2026-08-07T03:04:12Z' }
    },
    {
      id: 'evt-90822',
      timestamp: new Date(Date.now() - 800).toISOString().substring(11, 23),
      streamId: 'cdc-bc-orders-02',
      streamName: 'Business Central Orders Streaming',
      opType: 'INSERT',
      table: 'SalesHeader',
      txId: 'tx-00941030',
      lsn: '0/16C82E4',
      latencyMs: 41,
      status: 'Delivered',
      payloadBefore: null,
      payloadAfter: { document_no: 'SO-2026-0941', customer_no: 'CUST-1049', total_amount: 14250.00, currency: 'USD' }
    },
    {
      id: 'evt-90823',
      timestamp: new Date(Date.now() - 1500).toISOString().substring(11, 23),
      streamId: 'cdc-mssql-inv-03',
      streamName: 'MS SQL Inventory Ledger Capture',
      opType: 'UPDATE',
      table: 'ItemJournalLine',
      txId: 'tx-00941031',
      lsn: '0/16C8310',
      latencyMs: 88,
      status: 'Delivered',
      payloadBefore: { item_no: 'SKU-8821', quantity: 150, location: 'WH-01' },
      payloadAfter: { item_no: 'SKU-8821', quantity: 120, location: 'WH-01', reserved_quantity: 30 }
    },
    {
      id: 'evt-90824',
      timestamp: new Date(Date.now() - 2200).toISOString().substring(11, 23),
      streamId: 'cdc-mongo-payments-04',
      streamName: 'MongoDB Payment Audit Oplog',
      opType: 'INSERT',
      table: 'payment_transactions',
      txId: 'tx-00941032',
      lsn: '0/16C834A',
      latencyMs: 27,
      status: 'Delivered',
      payloadBefore: null,
      payloadAfter: { payment_id: 'PAY-883192', order_ref: 'SO-2026-0941', status: 'COMPLETED', gateway: 'Stripe' }
    }
  ]);

  // Webhook Subscriptions
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([
    {
      id: 'wh-webhook-01',
      name: 'ERP Integration Engine Webhook',
      targetUrl: 'https://api.mycompany.com/v1/webhooks/cdc-receiver',
      topicsFilter: ['cdc.customers.v1', 'cdc.sales_orders.v2'],
      status: 'Active',
      deliveryRate: 99.98,
      lastStatusCode: 200,
      lastLatencyMs: 62,
      hmacEnabled: true,
      retryPolicy: 'Exponential (5 retries)'
    },
    {
      id: 'wh-webhook-02',
      name: 'Data Warehouse Snowflake Ingestion',
      targetUrl: 'https://snowflake-pipe.internal.net/v1/ingest',
      topicsFilter: ['*'],
      status: 'Active',
      deliveryRate: 100.0,
      lastStatusCode: 200,
      lastLatencyMs: 84,
      hmacEnabled: true,
      retryPolicy: 'Linear (3 retries)'
    },
    {
      id: 'wh-webhook-03',
      name: 'Third-Party Logistics (3PL) Sync',
      targetUrl: 'https://api.shipfast3pl.com/events/orders',
      topicsFilter: ['cdc.inventory_ledger.v1'],
      status: 'Failing',
      deliveryRate: 92.4,
      lastStatusCode: 504,
      lastLatencyMs: 3100,
      hmacEnabled: false,
      retryPolicy: 'Exponential (10 retries)'
    }
  ]);

  // Kafka Broker Cluster Nodes
  const [brokers] = useState<BrokerNode[]>([
    { id: 'broker-1', name: 'kafka-node-01.us-east.internal', role: 'Leader', status: 'Healthy', cpuUsage: 28, memoryUsage: 42, activeConnections: 182, partitionCount: 48 },
    { id: 'broker-2', name: 'kafka-node-02.us-east.internal', role: 'Follower', status: 'Healthy', cpuUsage: 31, memoryUsage: 44, activeConnections: 164, partitionCount: 48 },
    { id: 'broker-3', name: 'kafka-node-03.us-east.internal', role: 'Leader', status: 'Healthy', cpuUsage: 25, memoryUsage: 39, activeConnections: 195, partitionCount: 48 },
    { id: 'broker-4', name: 'kafka-node-04.us-east.internal', role: 'Follower', status: 'Healthy', cpuUsage: 34, memoryUsage: 48, activeConnections: 152, partitionCount: 48 },
  ]);

  // Telemetry Chart Data
  const [telemetryHistory, setTelemetryHistory] = useState([
    { time: '03:00', throughput: 3120, latency: 45, queueLag: 18 },
    { time: '03:01', throughput: 3250, latency: 41, queueLag: 14 },
    { time: '03:02', throughput: 3180, latency: 43, queueLag: 12 },
    { time: '03:03', throughput: 3410, latency: 39, queueLag: 8 },
    { time: '03:04', throughput: 3290, latency: 44, queueLag: 15 },
    { time: '03:05', throughput: 3240, latency: 42, queueLag: 10 },
  ]);

  const [connectorThroughputHistory, setConnectorThroughputHistory] = useState(() => {
    const data = [];
    let baseTime = new Date();
    baseTime.setSeconds(baseTime.getSeconds() - 60);
    for(let i=0; i<15; i++) {
      baseTime.setSeconds(baseTime.getSeconds() + 4);
      data.push({
        time: baseTime.toISOString().substring(11, 19),
        incoming: Math.floor(18000 + Math.random() * 4000),
        outgoing: Math.floor(17800 + Math.random() * 4000)
      });
    }
    return data;
  });

  // Real-time Simulation Interval Effect
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      const tables = ['Customers', 'SalesHeader', 'SalesLine', 'ItemLedger', 'PaymentTerms', 'VendorMaster'];
      const opTypes: ('INSERT' | 'UPDATE' | 'DELETE' | 'DDL')[] = ['UPDATE', 'INSERT', 'UPDATE', 'DELETE', 'UPDATE'];
      const streams = cdcStreams;
      
      const randomStream = streams[Math.floor(Math.random() * streams.length)];
      const randomTable = tables[Math.floor(Math.random() * tables.length)];
      const randomOp = opTypes[Math.floor(Math.random() * opTypes.length)];
      const nowStr = new Date().toISOString().substring(11, 23);
      const newEvtId = `evt-${Math.floor(10000 + Math.random() * 90000)}`;
      const newTx = `tx-00${Math.floor(941000 + Math.random() * 999)}`;
      const newLsn = `0/${(0x16C820 + Math.floor(Math.random() * 5000)).toString(16).toUpperCase()}`;
      const newLatency = Math.floor(25 + Math.random() * 35);

      const newEvent: CDCEvent = {
        id: newEvtId,
        timestamp: nowStr,
        streamId: randomStream.id,
        streamName: randomStream.name,
        opType: randomOp,
        table: randomTable,
        txId: newTx,
        lsn: newLsn,
        latencyMs: newLatency,
        status: 'Delivered',
        payloadBefore: randomOp !== 'INSERT' ? { record_id: `REC-${Math.floor(1000 + Math.random() * 9000)}`, status: 'PENDING' } : undefined,
        payloadAfter: { record_id: `REC-${Math.floor(1000 + Math.random() * 9000)}`, status: 'PROCESSED', sync_ts: new Date().toISOString() }
      };

      // Add event to live feed (keep max 40)
      setLiveEvents(prev => [newEvent, ...prev.slice(0, 39)]);

      // Append real-time packets (Inbound WAL & Outbound UI Sync)
      const inboundPkt: PacketLogEntry = {
        id: `pkt-in-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: nowStr,
        direction: 'INBOUND',
        packetType: 'Ingress',
        sourceOrTarget: randomStream.source,
        protocol: randomStream.sourceType.includes('PostgreSQL') ? 'CDC-WAL' : randomStream.sourceType.includes('Business') ? 'OData-v4' : 'Avro-Kafka',
        packetSize: `${(0.9 + Math.random() * 1.5).toFixed(1)} KB`,
        latencyMs: newLatency,
        correlationId: `corr-${newTx}`,
        tableOrEntity: `${randomTable} (${newEvtId})`,
        opType: randomOp,
        syncState: 'Synced to UI',
        syncDiagnosticNote: `Ingested ${randomOp} packet from ${randomStream.name}. Latency: ${newLatency}ms. Schema validated & synced.`,
        payloadBefore: newEvent.payloadBefore,
        payloadAfter: newEvent.payloadAfter
      };

      const outboundPkt: PacketLogEntry = {
        id: `pkt-out-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString().substring(11, 23),
        direction: 'OUTBOUND',
        packetType: 'Egress',
        sourceOrTarget: 'WebSocket UI Session (#a819)',
        protocol: 'WebSocket-Delta',
        packetSize: `${(0.4 + Math.random() * 0.8).toFixed(1)} KB`,
        latencyMs: Math.max(3, Math.floor(newLatency / 4)),
        correlationId: `corr-${newTx}`,
        tableOrEntity: 'RealTimeSyncView UI',
        opType: 'SYNC_EMIT',
        syncState: 'Synced to UI',
        syncDiagnosticNote: 'Broadcast delta payload to UI frame. State tree re-rendered in 3ms.',
        payloadAfter: { target_table: randomTable, event_id: newEvtId, synced_at: new Date().toISOString() }
      };

      // Occasionally add a Transformation or Error event
      const extraPkts: PacketLogEntry[] = [];
      const dice = Math.random();
      if (dice < 0.12) {
        extraPkts.push({
          id: `pkt-xform-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString().substring(11, 23),
          direction: 'INBOUND',
          packetType: 'Transformation',
          sourceOrTarget: 'Stream Processing Engine',
          protocol: 'Engine-XForm',
          packetSize: '1.2 KB',
          latencyMs: 5,
          correlationId: `corr-${newTx}`,
          tableOrEntity: `${randomTable}_Transformer`,
          opType: 'MAP_XFORM',
          syncState: 'Transformed',
          syncDiagnosticNote: `Executed rule: Coerced and mapped ${randomTable} schema fields for UI consistency.`,
          payloadAfter: { transformed_fields: ['phone_e164', 'tax_reg_no'], rule_applied: 'STD_KSA_FORMAT' }
        });
      } else if (dice > 0.88) {
        extraPkts.push({
          id: `pkt-err-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString().substring(11, 23),
          direction: 'INBOUND',
          packetType: 'Error',
          sourceOrTarget: `${randomStream.source} Quarantine`,
          protocol: 'CDC-WAL',
          packetSize: '2.1 KB',
          latencyMs: 120,
          correlationId: `corr-${newTx}`,
          tableOrEntity: `${randomTable}_DLQ`,
          opType: randomOp,
          syncState: 'Schema Mismatch',
          syncDiagnosticNote: `Warning: Unrecognized field in ${randomTable} row payload. Diverted to quarantine log.`,
          payloadAfter: { unmapped_column: 'temp_bin_code', status: 'QUARANTINED' }
        });
      }

      setPacketLogs(prev => [inboundPkt, outboundPkt, ...extraPkts, ...prev.slice(0, 48)]);

      // Mutate live stats slightly
      const newThroughput = Math.floor(3100 + Math.random() * 300);
      setMessagesPerSec(newThroughput);
      setAvgLatency(newLatency);
      setTotalProcessedEvents(prev => prev + Math.floor(3 + Math.random() * 8));
      setReconciliationScanned(prev => prev + Math.floor(800 + Math.random() * 500));
      if (Math.random() > 0.8) {
        setReconciliationExceptions(prev => prev + Math.floor(1 + Math.random() * 3));
      }

      // Update reconciliation table randomly
      if (Math.random() > 0.3) {
        setReconciliationData(prev => prev.map(row => {
          if (row.status === 'syncing' && Math.random() > 0.5) {
            const addedSource = Math.floor(10 + Math.random() * 100);
            const addedTarget = addedSource - (Math.random() > 0.8 ? Math.floor(1 + Math.random() * 3) : 0);
            
            const newSource = row.source + addedSource;
            const newTarget = row.target + addedTarget;
            const newExceptions = row.exceptions + (addedSource - addedTarget);
            const newMatched = Number(((newTarget / newSource) * 100).toFixed(2));
            
            return {
              ...row,
              source: newSource,
              target: newTarget,
              migrated: newTarget,
              matched: newMatched,
              exceptions: newExceptions,
            };
          }
          return row;
        }));
      }

      // Update telemetry history
      setTelemetryHistory(prev => {
        const nextTime = new Date().toISOString().substring(11, 16);
        const updated = [...prev.slice(1), { time: nextTime, throughput: newThroughput, latency: newLatency, queueLag: Math.floor(5 + Math.random() * 15) }];
        return updated;
      });

      setConnectorThroughputHistory(prev => {
        const nextTime = new Date().toISOString().substring(11, 19);
        const newIncoming = Math.floor(18000 + Math.random() * 4000);
        const lag = Math.random() > 0.6 ? Math.floor(Math.random() * 800) : 0;
        const newOutgoing = newIncoming - lag + Math.floor(Math.random() * 200 - 100);
        return [...prev.slice(1), {
          time: nextTime,
          incoming: newIncoming,
          outgoing: newOutgoing > 0 ? newOutgoing : 0
        }];
      });

      // Update CDC Streams stats
      setCdcStreams(prev => prev.map(s => {
        if (s.id === randomStream.id) {
          return {
            ...s,
            totalEvents: s.totalEvents + 1,
            eventsPerSec: Math.floor(s.eventsPerSec + (Math.random() * 20 - 10)),
            lastSync: 'Just now'
          };
        }
        return s;
      }));

    }, 1800);

    return () => clearInterval(interval);
  }, [isLiveStreaming, cdcStreams]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Simulate High Burst (8x)
  const handleSimulateBurst = () => {
    const burstEvents: CDCEvent[] = [];
    const now = Date.now();
    for (let i = 0; i < 8; i++) {
      burstEvents.push({
        id: `burst-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date(now - i * 80).toISOString().substring(11, 23),
        streamId: 'cdc-pg-cust-01',
        streamName: 'PostgreSQL Customer Master CDC [BURST]',
        opType: 'UPDATE',
        table: 'CustomerLedgerEntry',
        txId: `tx-burst-${i}`,
        lsn: `0/17C${i}A9`,
        latencyMs: 12 + Math.floor(Math.random() * 8),
        status: 'Delivered',
        payloadBefore: { entry_no: 8490 + i, open: true, balance: 12500 },
        payloadAfter: { entry_no: 8490 + i, open: false, balance: 0, closed_at: new Date().toISOString() }
      });
    }
    setLiveEvents(prev => [...burstEvents, ...prev]);
    setMessagesPerSec(8420);
    setTotalProcessedEvents(prev => prev + 8);

    // Immediately spike the telemetry area chart
    setTelemetryHistory(prev => {
      const nextTime = new Date().toISOString().substring(11, 16);
      return [
        ...prev.slice(2),
        { time: nextTime, throughput: 7600, latency: 14, queueLag: 6 },
        { time: nextTime, throughput: 8420, latency: 18, queueLag: 9 }
      ];
    });

    // Update cdc stream stats
    setCdcStreams(prev => prev.map(s => {
      if (s.id === 'cdc-pg-cust-01') {
        return {
          ...s,
          totalEvents: s.totalEvents + 8,
          eventsPerSec: 2840,
          lastSync: 'Just now'
        };
      }
      return s;
    }));

    // Auto-switch to live-feed tab & reset filters so new events are immediately visible
    setActiveTab('live-feed');
    setOpFilter('ALL');

    // Show visual confirmation toast
    setActionToast({
      message: '⚡ High-Throughput Burst Injected! 8 UPDATE events pushed to stream @ 8,420 msg/sec.',
      type: 'burst'
    });
  };

  // Simulate DDL Schema Change
  const handleInjectDDL = () => {
    const ddlEvent: CDCEvent = {
      id: `ddl-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString().substring(11, 23),
      streamId: 'cdc-pg-cust-01',
      streamName: 'PostgreSQL Customer Master CDC',
      opType: 'DDL',
      table: 'Customers',
      txId: 'tx-ddl-001',
      lsn: '0/18A001F',
      latencyMs: 11,
      status: 'Delivered',
      payloadBefore: { query: 'ALTER TABLE Customers ADD COLUMN e_invoice_registration_id VARCHAR(64);' },
      payloadAfter: { schema_version: 'v2.4.1', columns_added: ['e_invoice_registration_id'] }
    };
    setLiveEvents(prev => [ddlEvent, ...prev]);
    setTotalProcessedEvents(prev => prev + 1);

    // Update telemetry graph point
    setTelemetryHistory(prev => {
      const nextTime = new Date().toISOString().substring(11, 16);
      return [
        ...prev.slice(1),
        { time: nextTime, throughput: 4200, latency: 11, queueLag: 14 }
      ];
    });

    // Auto-switch to live-feed tab & reset filters so DDL event is immediately visible
    setActiveTab('live-feed');
    setOpFilter('ALL');

    // Show visual confirmation toast
    setActionToast({
      message: '🛠️ DDL Schema Event Injected: ALTER TABLE Customers ADD COLUMN e_invoice_registration_id VARCHAR(64);',
      type: 'ddl'
    });
  };

  // DLQ Re-drive message handler
  const handleRedriveDlq = (id: string) => {
    setDlqItems(prev => prev.filter(item => item.id !== id));
    setTotalProcessedEvents(prev => prev + 1);
    setActionToast({
      message: `Re-driven event ${id} back into CDC stream with type coercion patch applied!`,
      type: 'burst'
    });
  };

  // DLQ Auto-migrate schema handler
  const handleAutoMigrateDlq = (id: string) => {
    setDlqItems(prev => prev.filter(item => item.id !== id));
    setTotalProcessedEvents(prev => prev + 1);
    setActionToast({
      message: `Auto-applied schema migration for ${id} and synchronized stream partitions!`,
      type: 'ddl'
    });
  };

  // Test Webhook Ping
  const handlePingWebhook = (wh: WebhookSubscription) => {
    setWebhookPingStatus(`Pinging ${wh.name}...`);
    setTimeout(() => {
      setWebhookPingStatus(`Success 200 OK (${wh.lastLatencyMs}ms) - Payload signature verified HMAC-SHA256`);
      setTimeout(() => setWebhookPingStatus(null), 4000);
    }, 900);
  };

  // Toggle Stream status
  const handleToggleStream = (streamId: string) => {
    setCdcStreams(prev => prev.map(s => {
      if (s.id === streamId) {
        const nextStatus = s.status === 'Streaming' ? 'Paused' : 'Streaming';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  // Filtered Events
  const filteredEvents = liveEvents.filter(evt => {
    const matchesSearch = evt.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          evt.streamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          evt.txId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOp = opFilter === 'ALL' || evt.opType === opFilter;
    return matchesSearch && matchesOp;
  });

  // Run Diagnostic UI Synchronization Trace
  const handleRunDiagnosticTrace = (queryOverride?: string) => {
    const query = (queryOverride || diagnosticTraceInput).trim();
    if (!query) return;
    setIsRunningDiagnostic(true);

    setTimeout(() => {
      setIsRunningDiagnostic(false);
      
      // Check if it's an injected packet or in logs
      const foundPkt = packetLogs.find(p => p.id === query || p.correlationId === query);
      if (foundPkt) {
        if (foundPkt.packetType === 'Ingress') {
          setDiagnosticResult({
            query,
            found: true,
            streamName: 'PostgreSQL WAL Ingress (prod-pg-01)',
            correlationId: foundPkt.correlationId,
            latencyMs: foundPkt.latencyMs,
            steps: [
              { name: '1. Ingress WAL Packet Capture', status: 'SUCCESS', detail: `Captured record from PostgreSQL WAL offset in ${foundPkt.latencyMs}ms.` },
              { name: '2. Schema Mapping Validation', status: 'SUCCESS', detail: 'All source fields successfully matched to target schema.' },
              { name: '3. Broker Event Bus Queue', status: 'SUCCESS', detail: 'Published to topic cdc.customers.v1 partition #2.' },
              { name: '4. UI Socket State Emitter', status: 'SUCCESS', detail: 'WebSocket delta dispatched and reflected in UI state.' }
            ],
            verdict: `HEALTHY: Manual Ingress test packet "${foundPkt.id}" verified and synchronized to UI in ${foundPkt.latencyMs}ms.`
          });
        } else if (foundPkt.packetType === 'Egress') {
          setDiagnosticResult({
            query,
            found: true,
            streamName: 'WebSocket UI Session Broadcast',
            correlationId: foundPkt.correlationId,
            latencyMs: foundPkt.latencyMs,
            steps: [
              { name: '1. Ingress WAL Packet Capture', status: 'SUCCESS', detail: 'Bypassed for outbound packet emission.' },
              { name: '2. Schema Mapping Validation', status: 'SUCCESS', detail: 'Egress broadcast frame payload structure verified.' },
              { name: '3. Broker Event Bus Queue', status: 'SUCCESS', detail: 'Direct websocket channel used (bypassed Kafka queue).' },
              { name: '4. UI Socket State Emitter', status: 'SUCCESS', detail: 'Egress delta broadcast successfully sent to frontend view state.' }
            ],
            verdict: `HEALTHY: Manual Egress outbound delta broadcast "${foundPkt.id}" emitted and acknowledged in ${foundPkt.latencyMs}ms.`
          });
        } else if (foundPkt.packetType === 'Transformation') {
          setDiagnosticResult({
            query,
            found: true,
            streamName: 'Stream Processing Engine',
            correlationId: foundPkt.correlationId,
            latencyMs: foundPkt.latencyMs,
            steps: [
              { name: '1. Ingress WAL Packet Capture', status: 'SUCCESS', detail: 'Captured raw CDC record from PG database.' },
              { name: '2. Schema Mapping Validation', status: 'SUCCESS', detail: 'Executed "Customer_Data_Sanitizer" mapping.' },
              { name: '3. Broker Event Bus Queue', status: 'SUCCESS', detail: 'Transformed payload published to "transformed.customers.v1" topic.' },
              { name: '4. UI Socket State Emitter', status: 'SUCCESS', detail: `Transformed record successfully projected to UI state in ${foundPkt.latencyMs}ms.` }
            ],
            verdict: `HEALTHY: Manual Transformation packet "${foundPkt.id}" successfully normalized and synced to UI state.`
          });
        } else {
          setDiagnosticResult({
            query,
            found: true,
            streamName: 'Validation Pipeline Quarantine',
            correlationId: foundPkt.correlationId,
            latencyMs: foundPkt.latencyMs,
            steps: [
              { name: '1. Ingress WAL Packet Capture', status: 'SUCCESS', detail: 'Captured record from source DB.' },
              { name: '2. Schema Mapping Validation', status: 'FAILED', detail: `Validation failed: column "invalid_type" with value "XYZ" is invalid.` },
              { name: '3. Broker Event Bus Queue', status: 'WARNING', detail: 'Message diverted to Dead Letter Queue (DLQ).' },
              { name: '4. UI Socket State Emitter', status: 'FAILED', detail: 'Update suppressed from UI state tree to prevent React state mismatch.' }
            ],
            verdict: `CRITICAL: Schema validation failed. Packet "${foundPkt.id}" quarantined to DLQ to preserve UI state consistency.`
          });
        }
        return;
      }

      const isKnownFailure = query.toLowerCase().includes('fail') || query.toLowerCase().includes('error') || query.toLowerCase().includes('bin');
      if (isKnownFailure) {
        setDiagnosticResult({
          query,
          found: true,
          streamName: 'MS SQL Inventory Ledger Capture',
          correlationId: 'corr-00941031',
          latencyMs: 88,
          steps: [
            { name: '1. Ingress WAL Packet Capture', status: 'SUCCESS', detail: 'Packet captured from source DB.' },
            { name: '2. Schema Mapping Validation', status: 'FAILED', detail: 'Column "warehouse_bin_code" is unmapped in target entity ItemJournalLine.' },
            { name: '3. Broker Event Bus Queue', status: 'WARNING', detail: 'Message diverted to Dead Letter Queue (DLQ).' },
            { name: '4. UI Socket State Emitter', status: 'FAILED', detail: 'Update suppressed from UI state tree to prevent React state mismatch.' }
          ],
          verdict: 'ATTENTION: Data is NOT reflecting in the UI because column "warehouse_bin_code" fails target schema mapping. Use the DLQ panel to re-drive with type coercion.'
        });
      } else {
        setDiagnosticResult({
          query,
          found: true,
          streamName: 'PostgreSQL Customer Master CDC',
          correlationId: `corr-${Math.floor(100000 + Math.random() * 800000)}`,
          latencyMs: 12,
          steps: [
            { name: '1. Ingress WAL Packet Capture', status: 'SUCCESS', detail: `Captured record for "${query}" from WAL offset.` },
            { name: '2. Schema Mapping Validation', status: 'SUCCESS', detail: 'All 9 source fields successfully matched to target schema.' },
            { name: '3. Broker Event Bus Queue', status: 'SUCCESS', detail: 'Stream queue lag: 0 msgs. Processing overhead: 4ms.' },
            { name: '4. UI Socket State Emitter', status: 'SUCCESS', detail: 'WebSocket delta dispatched and acknowledged by active UI session.' }
          ],
          verdict: `HEALTHY: Data packet for "${query}" is synchronized to UI components. If not visible, check active search or opType tab filters.`
        });
      }
    }, 600);
  };

  // Toggle Packet Type Visibility
  const togglePacketType = (type: 'Ingress' | 'Egress' | 'Transformation' | 'Error') => {
    setSelectedPacketTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const selectAllPacketTypes = () => {
    setSelectedPacketTypes(['Ingress', 'Egress', 'Transformation', 'Error']);
  };

  const clearAllPacketTypes = () => {
    setSelectedPacketTypes([]);
  };

  // Packet Type Counts
  const packetTypeCounts = {
    Ingress: packetLogs.filter(p => p.packetType === 'Ingress').length,
    Egress: packetLogs.filter(p => p.packetType === 'Egress').length,
    Transformation: packetLogs.filter(p => p.packetType === 'Transformation').length,
    Error: packetLogs.filter(p => p.packetType === 'Error').length
  };

  // Inject Custom Test Packet and automatically trace it in UI
  const handleInjectTestPacket = (type: 'Ingress' | 'Egress' | 'Transformation' | 'Error' = 'Ingress') => {
    const nowStr = new Date().toISOString().substring(11, 23);
    const pktId = `pkt-${type.toLowerCase()}-test-${Math.floor(100 + Math.random() * 900)}`;

    let newPkt: PacketLogEntry;
    if (type === 'Ingress') {
      newPkt = {
        id: pktId,
        timestamp: nowStr,
        direction: 'INBOUND',
        packetType: 'Ingress',
        sourceOrTarget: 'PostgreSQL WAL Ingress (prod-pg-01)',
        protocol: 'CDC-WAL',
        packetSize: '1.5 KB',
        latencyMs: 12,
        correlationId: `corr-test-${Date.now().toString().slice(-6)}`,
        tableOrEntity: 'Customers (Diagnostic Test)',
        opType: 'UPDATE',
        syncState: 'Synced to UI',
        syncDiagnosticNote: 'Manual Ingress test packet injected. Parsed and verified.',
        payloadBefore: { customer_id: 'CUST-TEST', status: 'PENDING' },
        payloadAfter: { customer_id: 'CUST-TEST', status: 'ACTIVE', email: 'ronald.policarpio@aujan.com.sa' }
      };
    } else if (type === 'Egress') {
      newPkt = {
        id: pktId,
        timestamp: nowStr,
        direction: 'OUTBOUND',
        packetType: 'Egress',
        sourceOrTarget: 'WebSocket UI Session Broadcast',
        protocol: 'WebSocket-Delta',
        packetSize: '720 B',
        latencyMs: 4,
        correlationId: `corr-test-${Date.now().toString().slice(-6)}`,
        tableOrEntity: 'UI Preview Iframe',
        opType: 'SYNC_EMIT',
        syncState: 'Synced to UI',
        syncDiagnosticNote: 'Manual Egress outbound delta broadcast emitted to frontend view state.',
        payloadAfter: { rendered_component: 'RealTimeSyncView', status: 'SUCCESS' }
      };
    } else if (type === 'Transformation') {
      newPkt = {
        id: pktId,
        timestamp: nowStr,
        direction: 'INBOUND',
        packetType: 'Transformation',
        sourceOrTarget: 'Stream Processing Engine',
        protocol: 'Engine-XForm',
        packetSize: '1.3 KB',
        latencyMs: 6,
        correlationId: `corr-test-${Date.now().toString().slice(-6)}`,
        tableOrEntity: 'Customer_Data_Sanitizer',
        opType: 'MAP_XFORM',
        syncState: 'Transformed',
        syncDiagnosticNote: 'Manual Transformation test executed: Normalized phone numbers to E.164 and trimmed spaces.',
        payloadBefore: { phone: '  0509876543  ' },
        payloadAfter: { phone_e164: '+966509876543', normalized: true }
      };
    } else {
      newPkt = {
        id: pktId,
        timestamp: nowStr,
        direction: 'INBOUND',
        packetType: 'Error',
        sourceOrTarget: 'Validation Pipeline Quarantine',
        protocol: 'Avro-Kafka',
        packetSize: '2.0 KB',
        latencyMs: 140,
        correlationId: `corr-test-${Date.now().toString().slice(-6)}`,
        tableOrEntity: 'Unmapped_Column_Log',
        opType: 'UPDATE',
        syncState: 'Schema Mismatch',
        syncDiagnosticNote: 'Manual Error test packet: Schema mismatch caught by validator and sent to DLQ.',
        payloadBefore: { invalid_type: 'XYZ' },
        payloadAfter: { error: 'TYPE_CAST_FAILURE', quarantined: true }
      };
    }

    setPacketLogs(prev => [newPkt, ...prev]);
    setDiagnosticTraceInput(pktId);
    
    // Automatically trigger run trace of injected packet with dynamic content
    setIsRunningDiagnostic(true);
    setTimeout(() => {
      setIsRunningDiagnostic(false);
      if (type === 'Ingress') {
        setDiagnosticResult({
          query: pktId,
          found: true,
          streamName: 'PostgreSQL WAL Ingress (prod-pg-01)',
          correlationId: newPkt.correlationId,
          latencyMs: 12,
          steps: [
            { name: '1. Ingress WAL Packet Capture', status: 'SUCCESS', detail: 'Captured record from PostgreSQL WAL offset in 12ms.' },
            { name: '2. Schema Mapping Validation', status: 'SUCCESS', detail: 'All source fields successfully matched to target schema.' },
            { name: '3. Broker Event Bus Queue', status: 'SUCCESS', detail: 'Published to topic cdc.customers.v1 partition #2.' },
            { name: '4. UI Socket State Emitter', status: 'SUCCESS', detail: 'WebSocket delta dispatched and reflected in UI state.' }
          ],
          verdict: `HEALTHY: Manual Ingress test packet "${pktId}" verified and synchronized to UI in 12ms.`
        });
      } else if (type === 'Egress') {
        setDiagnosticResult({
          query: pktId,
          found: true,
          streamName: 'WebSocket UI Session Broadcast',
          correlationId: newPkt.correlationId,
          latencyMs: 4,
          steps: [
            { name: '1. Ingress WAL Packet Capture', status: 'SUCCESS', detail: 'Bypassed for outbound packet emission.' },
            { name: '2. Schema Mapping Validation', status: 'SUCCESS', detail: 'Egress broadcast frame payload structure verified.' },
            { name: '3. Broker Event Bus Queue', status: 'SUCCESS', detail: 'Direct websocket channel used (bypassed Kafka queue).' },
            { name: '4. UI Socket State Emitter', status: 'SUCCESS', detail: 'Egress delta broadcast successfully sent to frontend view state.' }
          ],
          verdict: `HEALTHY: Manual Egress outbound delta broadcast "${pktId}" emitted and acknowledged in 4ms.`
        });
      } else if (type === 'Transformation') {
        setDiagnosticResult({
          query: pktId,
          found: true,
          streamName: 'Stream Processing Engine',
          correlationId: newPkt.correlationId,
          latencyMs: 6,
          steps: [
            { name: '1. Ingress WAL Packet Capture', status: 'SUCCESS', detail: 'Captured raw CDC record from PG database.' },
            { name: '2. Schema Mapping Validation', status: 'SUCCESS', detail: 'Executed "Customer_Data_Sanitizer" mapping.' },
            { name: '3. Broker Event Bus Queue', status: 'SUCCESS', detail: 'Transformed payload published to "transformed.customers.v1" topic.' },
            { name: '4. UI Socket State Emitter', status: 'SUCCESS', detail: 'Transformed record successfully projected to UI state in 6ms.' }
          ],
          verdict: `HEALTHY: Manual Transformation packet "${pktId}" successfully normalized and synced to UI state.`
        });
      } else {
        setDiagnosticResult({
          query: pktId,
          found: true,
          streamName: 'Validation Pipeline Quarantine',
          correlationId: newPkt.correlationId,
          latencyMs: 140,
          steps: [
            { name: '1. Ingress WAL Packet Capture', status: 'SUCCESS', detail: 'Captured record from source DB.' },
            { name: '2. Schema Mapping Validation', status: 'FAILED', detail: 'Validation failed: column "invalid_type" with value "XYZ" is invalid.' },
            { name: '3. Broker Event Bus Queue', status: 'WARNING', detail: 'Message diverted to Dead Letter Queue (DLQ).' },
            { name: '4. UI Socket State Emitter', status: 'FAILED', detail: 'Update suppressed from UI state tree to prevent React state mismatch.' }
          ],
          verdict: `CRITICAL: Schema validation failed. Packet "${pktId}" quarantined to DLQ to preserve UI state consistency.`
        });
      }
    }, 600);

    setActionToast({
      message: `⚡ Test ${type} Packet Injected (${pktId})!`,
      type: type === 'Error' ? 'alert' : 'info'
    });
  };

  // Filtered Packet Logs
  const filteredPacketLogs = packetLogs.filter(pkt => {
    const matchesType = selectedPacketTypes.includes(pkt.packetType);

    const matchesDir =
      packetDirectionFilter === 'ALL' ||
      (packetDirectionFilter === 'INBOUND' && pkt.direction === 'INBOUND') ||
      (packetDirectionFilter === 'OUTBOUND' && pkt.direction === 'OUTBOUND') ||
      (packetDirectionFilter === 'DIAGNOSTIC_ALERTS' && (pkt.syncState === 'Schema Mismatch' || pkt.syncState === 'Filtered' || pkt.syncState === 'Dropped' || pkt.packetType === 'Error'));

    const searchLower = packetSearchTerm.toLowerCase();
    const matchesSearch =
      !packetSearchTerm ||
      pkt.id.toLowerCase().includes(searchLower) ||
      pkt.packetType.toLowerCase().includes(searchLower) ||
      pkt.correlationId.toLowerCase().includes(searchLower) ||
      pkt.tableOrEntity.toLowerCase().includes(searchLower) ||
      pkt.sourceOrTarget.toLowerCase().includes(searchLower) ||
      pkt.syncDiagnosticNote.toLowerCase().includes(searchLower) ||
      JSON.stringify(pkt.payloadAfter || {}).toLowerCase().includes(searchLower);

    return matchesType && matchesDir && matchesSearch;
  });

  // Latency Heatmap Protocol Matrix Data
  const latencyHeatmapData = React.useMemo(() => {
    const protocolsList = ['CDC-WAL', 'OData-v4', 'Avro-Kafka', 'WebSocket-Delta', 'REST-JSON', 'Engine-XForm'];
    
    return protocolsList.map(proto => {
      const protoPkts = packetLogs.filter(p => p.protocol === proto || (proto === 'REST-JSON' && p.protocol.includes('REST')));
      const count = protoPkts.length;
      
      let avg = 0;
      let peak = 0;
      let min = 999;
      let optimalCount = 0;   // <= 20ms
      let normalCount = 0;    // 21-50ms
      let moderateCount = 0;  // 51-100ms
      let severeCount = 0;    // > 100ms

      if (count > 0) {
        let sum = 0;
        protoPkts.forEach(p => {
          sum += p.latencyMs;
          if (p.latencyMs > peak) peak = p.latencyMs;
          if (p.latencyMs < min) min = p.latencyMs;

          if (p.latencyMs <= 20) optimalCount++;
          else if (p.latencyMs <= 50) normalCount++;
          else if (p.latencyMs <= 100) moderateCount++;
          else severeCount++;
        });
        avg = Math.round(sum / count);
      } else {
        min = 4;
        if (proto === 'CDC-WAL') { avg = 14; peak = 38; optimalCount = 18; normalCount = 4; }
        else if (proto === 'OData-v4') { avg = 48; peak = 92; normalCount = 12; moderateCount = 6; }
        else if (proto === 'Avro-Kafka') { avg = 22; peak = 88; optimalCount = 8; normalCount = 10; moderateCount = 2; }
        else if (proto === 'WebSocket-Delta') { avg = 6; peak = 18; optimalCount = 25; }
        else if (proto === 'REST-JSON') { avg = 112; peak = 5002; moderateCount = 3; severeCount = 2; }
        else { avg = 8; peak = 24; optimalCount = 20; }
      }

      let congestionLevel = 'OPTIMAL';
      let levelColor = '#10b981';
      if (avg > 80 || peak > 1000) {
        congestionLevel = 'SEVERE CONGESTION';
        levelColor = '#f43f5e';
      } else if (avg > 40 || peak > 80) {
        congestionLevel = 'MODERATE LAG';
        levelColor = '#f59e0b';
      } else if (avg > 18) {
        congestionLevel = 'NORMAL';
        levelColor = '#06b6d4';
      }

      return {
        protocol: proto,
        avgLatency: avg,
        peakLatency: peak,
        minLatency: min === 999 ? 2 : min,
        totalPackets: count || (optimalCount + normalCount + moderateCount + severeCount),
        optimalCount,
        normalCount,
        moderateCount,
        severeCount,
        congestionLevel,
        levelColor
      };
    });
  }, [packetLogs]);

  // Timeline Latency Data
  const timelineLatencyData = React.useMemo(() => {
    const chronPkts = [...packetLogs].reverse();
    return chronPkts.map((pkt, i) => ({
      seq: i + 1,
      id: pkt.id,
      timestamp: pkt.timestamp,
      latencyMs: pkt.latencyMs,
      visualLatency: Math.min(pkt.latencyMs, 220),
      protocol: pkt.protocol,
      direction: pkt.direction,
      packetType: pkt.packetType,
      isCongested: pkt.latencyMs > 50,
      sla50: 50,
      sla100: 100
    }));
  }, [packetLogs]);

  // Overall Congestion Overview Metrics
  const congestionOverview = React.useMemo(() => {
    if (packetLogs.length === 0) return { avg: 14, peak: 38, congestedCount: 0, healthPct: 100 };
    let sum = 0;
    let peak = 0;
    let congestedCount = 0;
    packetLogs.forEach(p => {
      sum += p.latencyMs;
      if (p.latencyMs > peak) peak = p.latencyMs;
      if (p.latencyMs > 50) congestedCount++;
    });
    const avg = Math.round(sum / packetLogs.length);
    const healthPct = Math.max(0, Math.round(((packetLogs.length - congestedCount) / packetLogs.length) * 100));
    return { avg, peak, congestedCount, healthPct };
  }, [packetLogs]);

  // Latency Breakdown Categorized by Pipeline Phases: Network, Transformation, Destination Commit
  const phaseBreakdownData = React.useMemo(() => {
    return latencyHeatmapData.map(item => {
      let networkPct = 35;
      let transformPct = 30;
      let commitPct = 35;
      let bottleneckDesc = 'Optimal Path (Balanced)';
      let dominantPhase: 'network' | 'transformation' | 'destination commit' = 'network';
      let bottleneckBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      let recommendation = 'Pipeline operating within optimal SLA limits (<20ms latency).';

      if (item.protocol === 'REST-JSON') {
        networkPct = 15;
        transformPct = 20;
        commitPct = 65;
        dominantPhase = 'destination commit';
        bottleneckDesc = 'Destination DB Commit & Row Lock Contention';
        bottleneckBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
        recommendation = 'Increase target upsert batch size & verify index maintenance on target primary keys.';
      } else if (item.protocol === 'OData-v4') {
        networkPct = 55;
        transformPct = 25;
        commitPct = 20;
        dominantPhase = 'network';
        bottleneckDesc = 'Network Transport & Wire Payload Overhead';
        bottleneckBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
        recommendation = 'Enable HTTP/2 stream multiplexing & GZIP packet payload compression.';
      } else if (item.protocol === 'Engine-XForm') {
        networkPct = 25;
        transformPct = 50;
        commitPct = 25;
        dominantPhase = 'transformation';
        bottleneckDesc = 'CDC Schema Mapping & Script Expression Eval';
        bottleneckBadgeColor = 'bg-cyan-50 text-cyan-700 border-cyan-200';
        recommendation = 'Cache compiled transformation AST and bypass unnecessary string regex filters.';
      } else if (item.protocol === 'Avro-Kafka') {
        networkPct = 40;
        transformPct = 30;
        commitPct = 30;
        dominantPhase = 'network';
        bottleneckDesc = 'Broker Queue Fetch Transport';
        bottleneckBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
        recommendation = 'Adjust Kafka consumer fetch.min.bytes and consumer group partition balance.';
      } else if (item.avgLatency > 30) {
        networkPct = 40;
        transformPct = 25;
        commitPct = 35;
        dominantPhase = 'network';
        bottleneckDesc = 'Moderate Network Buffer Queueing';
        bottleneckBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
        recommendation = 'Monitor WAN connectivity and increase streaming window memory.';
      } else {
        dominantPhase = 'destination commit';
      }

      const networkMs = Math.round((item.avgLatency * networkPct) / 100);
      const transformMs = Math.round((item.avgLatency * transformPct) / 100);
      const commitMs = Math.round((item.avgLatency * commitPct) / 100);

      return {
        ...item,
        networkMs,
        networkPct,
        transformMs,
        transformPct,
        commitMs,
        commitPct,
        dominantPhase,
        bottleneckDesc,
        bottleneckBadgeColor,
        recommendation
      };
    });
  }, [latencyHeatmapData]);

  // Global Pipeline Phase Averages Across All Streams
  const pipelinePhaseTotals = React.useMemo(() => {
    if (phaseBreakdownData.length === 0) {
      return { avgNetworkMs: 8, avgTransformMs: 6, avgCommitMs: 12, totalAvgMs: 26 };
    }
    const sumNetwork = phaseBreakdownData.reduce((acc, curr) => acc + curr.networkMs, 0);
    const sumTransform = phaseBreakdownData.reduce((acc, curr) => acc + curr.transformMs, 0);
    const sumCommit = phaseBreakdownData.reduce((acc, curr) => acc + curr.commitMs, 0);
    const len = phaseBreakdownData.length;

    const avgNetworkMs = Math.round(sumNetwork / len);
    const avgTransformMs = Math.round(sumTransform / len);
    const avgCommitMs = Math.round(sumCommit / len);
    const totalAvgMs = Math.max(1, avgNetworkMs + avgTransformMs + avgCommitMs);

    return { avgNetworkMs, avgTransformMs, avgCommitMs, totalAvgMs };
  }, [phaseBreakdownData]);

  // Throughput & Latency 60-Minute Forecast Model
  const throughputForecastData = React.useMemo(() => {
    const now = new Date();
    const formatTime = (dateObj: Date) =>
      dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    // Historical Time Points (-50m to NOW)
    const historicalPoints = [
      {
        timeLabel: formatTime(new Date(now.getTime() - 50 * 60000)),
        period: '-50m',
        actualLatency: 14,
        forecastLatency: null,
        actualThroughput: 1250,
        forecastThroughput: null,
        isForecast: false,
        riskLevel: 'OPTIMAL',
        riskColor: '#10b981',
        confidenceInterval: '12-16 ms'
      },
      {
        timeLabel: formatTime(new Date(now.getTime() - 40 * 60000)),
        period: '-40m',
        actualLatency: 18,
        forecastLatency: null,
        actualThroughput: 1480,
        forecastThroughput: null,
        isForecast: false,
        riskLevel: 'OPTIMAL',
        riskColor: '#10b981',
        confidenceInterval: '15-21 ms'
      },
      {
        timeLabel: formatTime(new Date(now.getTime() - 30 * 60000)),
        period: '-30m',
        actualLatency: 22,
        forecastLatency: null,
        actualThroughput: 1620,
        forecastThroughput: null,
        isForecast: false,
        riskLevel: 'NORMAL',
        riskColor: '#06b6d4',
        confidenceInterval: '18-25 ms'
      },
      {
        timeLabel: formatTime(new Date(now.getTime() - 20 * 60000)),
        period: '-20m',
        actualLatency: 16,
        forecastLatency: null,
        actualThroughput: 1510,
        forecastThroughput: null,
        isForecast: false,
        riskLevel: 'OPTIMAL',
        riskColor: '#10b981',
        confidenceInterval: '13-19 ms'
      },
      {
        timeLabel: formatTime(new Date(now.getTime() - 10 * 60000)),
        period: '-10m',
        actualLatency: 28,
        forecastLatency: null,
        actualThroughput: 1980,
        forecastThroughput: null,
        isForecast: false,
        riskLevel: 'NORMAL',
        riskColor: '#06b6d4',
        confidenceInterval: '24-32 ms'
      },
      {
        timeLabel: `${formatTime(now)} (NOW)`,
        period: 'NOW',
        actualLatency: congestionOverview.avg || 24,
        forecastLatency: congestionOverview.avg || 24, // Bridge point
        actualThroughput: 2150,
        forecastThroughput: 2150, // Bridge point
        isForecast: false,
        riskLevel: 'CURRENT STREAM',
        riskColor: '#6366f1',
        confidenceInterval: `${(congestionOverview.avg || 24) - 2}-${(congestionOverview.avg || 24) + 2} ms`
      }
    ];

    // Predicted Future Points (+10m to +60m)
    const futurePoints = [
      {
        timeLabel: `+10m (${formatTime(new Date(now.getTime() + 10 * 60000))})`,
        period: '+10m',
        actualLatency: null,
        forecastLatency: 34,
        actualThroughput: null,
        forecastThroughput: 2680,
        isForecast: true,
        riskLevel: 'LOW RISK',
        riskColor: '#10b981',
        confidenceInterval: '28-39 ms'
      },
      {
        timeLabel: `+20m (${formatTime(new Date(now.getTime() + 20 * 60000))})`,
        period: '+20m',
        actualLatency: null,
        forecastLatency: 54,
        actualThroughput: null,
        forecastThroughput: 3420,
        isForecast: true,
        riskLevel: 'MODERATE LAG',
        riskColor: '#f59e0b',
        confidenceInterval: '46-62 ms'
      },
      {
        timeLabel: `+30m (${formatTime(new Date(now.getTime() + 30 * 60000))})`,
        period: '+30m',
        actualLatency: null,
        forecastLatency: 88, // Peak congestion surge
        actualThroughput: null,
        forecastThroughput: 4950, // Peak volume surge
        isForecast: true,
        riskLevel: 'PEAK CONGESTION SURGE',
        riskColor: '#f43f5e',
        confidenceInterval: '78-98 ms'
      },
      {
        timeLabel: `+40m (${formatTime(new Date(now.getTime() + 40 * 60000))})`,
        period: '+40m',
        actualLatency: null,
        forecastLatency: 62,
        actualThroughput: null,
        forecastThroughput: 3800,
        isForecast: true,
        riskLevel: 'MODERATE LAG',
        riskColor: '#f59e0b',
        confidenceInterval: '52-71 ms'
      },
      {
        timeLabel: `+50m (${formatTime(new Date(now.getTime() + 50 * 60000))})`,
        period: '+50m',
        actualLatency: null,
        forecastLatency: 36,
        actualThroughput: null,
        forecastThroughput: 2750,
        isForecast: true,
        riskLevel: 'LOW RISK',
        riskColor: '#10b981',
        confidenceInterval: '30-42 ms'
      },
      {
        timeLabel: `+60m (${formatTime(new Date(now.getTime() + 60 * 60000))})`,
        period: '+60m',
        actualLatency: null,
        forecastLatency: 21,
        actualThroughput: null,
        forecastThroughput: 1850,
        isForecast: true,
        riskLevel: 'OPTIMAL RECOVERY',
        riskColor: '#10b981',
        confidenceInterval: '17-26 ms'
      }
    ];

    return [...historicalPoints, ...futurePoints];
  }, [congestionOverview]);

  // Forecast High-Level Summary Metrics
  const forecastSummary = React.useMemo(() => {
    const peakPoint = throughputForecastData.find(p => p.period === '+30m') || throughputForecastData[8];
    const totalProjectedVolume = throughputForecastData
      .filter(p => p.isForecast)
      .reduce((acc, curr) => acc + (curr.forecastThroughput || 0) * 600, 0); // 10 min * 60 sec * pkts/s

    return {
      peakLatencyMs: peakPoint?.forecastLatency || 88,
      peakThroughput: peakPoint?.forecastThroughput || 4950,
      peakTimeLabel: peakPoint?.timeLabel || '+30m',
      totalProjectedPkts: totalProjectedVolume,
      confidenceScore: '96.4%',
      recommendation: 'Pre-scale CDC engine workers before the +20m mark to absorb the predicted 4.95k pkts/s batch surge.'
    };
  }, [throughputForecastData]);

  // Export Filtered Packet Logs as CSV
  const handleExportCSV = () => {
    if (filteredPacketLogs.length === 0) {
      setActionToast({
        message: '⚠️ No packet logs available to export under current filters.',
        type: 'info'
      });
      return;
    }

    const headers = [
      'Packet ID',
      'Timestamp',
      'Packet Type',
      'Direction',
      'Source/Target',
      'Protocol',
      'Size',
      'Latency (ms)',
      'Correlation ID',
      'Table/Entity',
      'Op Type',
      'Sync State',
      'Diagnostic Note',
      'Payload Before',
      'Payload After'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvLines = [
      headers.join(','),
      ...filteredPacketLogs.map(pkt => [
        escapeCsv(pkt.id),
        escapeCsv(pkt.timestamp),
        escapeCsv(pkt.packetType),
        escapeCsv(pkt.direction),
        escapeCsv(pkt.sourceOrTarget),
        escapeCsv(pkt.protocol),
        escapeCsv(pkt.packetSize),
        escapeCsv(pkt.latencyMs),
        escapeCsv(pkt.correlationId),
        escapeCsv(pkt.tableOrEntity),
        escapeCsv(pkt.opType),
        escapeCsv(pkt.syncState),
        escapeCsv(pkt.syncDiagnosticNote),
        escapeCsv(pkt.payloadBefore ? JSON.stringify(pkt.payloadBefore) : ''),
        escapeCsv(pkt.payloadAfter ? JSON.stringify(pkt.payloadAfter) : '')
      ].join(','))
    ];

    const csvData = csvLines.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timeStampStr = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('download', `realtime_sync_event_logs_${timeStampStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setActionToast({
      message: `📥 Successfully exported ${filteredPacketLogs.length} packet logs to CSV!`,
      type: 'info'
    });
  };

  // Threshold alert watcher
  useEffect(() => {
    if (reconciliationExceptions >= reconCriticalThreshold) {
      setActionToast({
        message: `🚨 CRITICAL ALERT: Reconciliation exceptions (${reconciliationExceptions.toLocaleString()}) exceeded critical threshold of ${reconCriticalThreshold.toLocaleString()}.`,
        type: 'alert'
      });
    } else if (reconciliationExceptions >= reconWarningThreshold) {
      // Don't show toast if there's already an active alert to prevent spam, 
      // but if the user wants to see it, we can trigger a warning toast.
      // We'll just set it if it crosses the exact boundary (rough simulation)
      if (reconciliationExceptions === reconWarningThreshold || Math.random() < 0.05) {
        setActionToast({
          message: `⚠️ WARNING: Reconciliation exceptions (${reconciliationExceptions.toLocaleString()}) exceeded warning threshold of ${reconWarningThreshold.toLocaleString()}.`,
          type: 'ddl' // Using ddl type as it's an amber warning color
        });
      }
    }
  }, [reconciliationExceptions, reconWarningThreshold, reconCriticalThreshold]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* HEADER SECTION: HIGH-CONTRAST WHITE THEME */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 text-[10px] font-black uppercase tracking-widest">
              Module 14 - Real-Time Synchronization Engine
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              Real-Time CDC Partitioning
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
            <Layers className="w-8 h-8 text-indigo-600" />
            Real-Time Synchronization
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase font-mono tracking-widest ml-1 animate-pulse">
              Running
            </span>
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed font-medium">
            Bi-directional Change Data Capture (CDC) engine, streaming WAL logs, multi-topic partitioning, & real-time webhook propagation with sub-second replication latency across hybrid cloud brokers.
          </p>
        </div>

        {/* Global Control Bench */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
            <span className="px-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">SPEED:</span>
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                  s === 1
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`px-5 py-2.5 font-black rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              isLiveStreaming
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isLiveStreaming ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Engine</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Resume Engine</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsCreateStreamOpen(true)}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-3xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Sync Topic</span>
          </button>
        </div>
      </div>

      {/* TOP REAL-TIME STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* STAT 1: Active CDC Streams */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active CDC Streams</div>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
              {activeCdcStreamsCount}
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Live
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">5 Connectors Active</div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* STAT 2: Avg Event Replication Latency */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Avg Latency</div>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
              {avgLatency}ms
              <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> -4ms
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">End-to-End Replication</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Gauge className="w-6 h-6" />
          </div>
        </div>

        {/* STAT 3: Messages / sec */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Messages / sec</div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {messagesPerSec.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Total: {(totalProcessedEvents / 1000000).toFixed(2)}M events</div>
          </div>
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl border border-cyan-100">
            <Wifi className="w-6 h-6" />
          </div>
        </div>

        {/* STAT 4: Kafka Brokers & Cluster Health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Kafka Brokers</div>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
              4 Online
              <span className="text-xs font-bold text-emerald-600">100% SLA</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">192 Partitions Managed</div>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl border border-slate-200">
            <Server className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TELEMETRY SPARKLINE GRAPH & QUICK ACTION BENCH */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-3xs border border-slate-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
              <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                Live Stream Throughput & Queue Latency Monitor
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time Kafka Broker Ingestion Metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateBurst}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] font-black rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-200" />
              <span>Simulate Burst (8x)</span>
            </button>

            <button
              type="button"
              onClick={handleInjectDDL}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-[11px] font-black rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Code className="w-3.5 h-3.5 text-amber-200" />
              <span>Inject DDL Schema Event</span>
            </button>
          </div>
        </div>

        {/* Action Toast Notification Feedback Banner */}
        {actionToast && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-black transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            actionToast.type === 'burst'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
              : actionToast.type === 'alert'
              ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
              : actionToast.type === 'ddl'
              ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
          }`}>
            <div className="flex items-center gap-3">
              {actionToast.type === 'burst' && <Zap className="w-5 h-5 text-indigo-500 shrink-0" />}
              {actionToast.type === 'alert' && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />}
              {actionToast.type === 'ddl' && <Code className="w-5 h-5 text-amber-500 shrink-0" />}
              {actionToast.type === 'webhook' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
              <span className="tracking-tight">{actionToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionToast(null)}
              className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Recharts Area Chart */}
        <div className="h-40 w-full px-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={telemetryHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', color: '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'black', color: '#4f46e5', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="throughput" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorThroughput)" name="Events/sec" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NAVIGATION TABS BAR */}
      <div className="border-b border-slate-100 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none px-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('cdc-streams')}
            className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'cdc-streams'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>CDC Connectors ({cdcStreams.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live-feed')}
            className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'live-feed'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Live Payload Feed</span>
            <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[9px] font-black">
              {liveEvents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('packet-log')}
            className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'packet-log'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Packet Diagnostic Log</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black">
              {packetLogs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('webhooks')}
            className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'webhooks'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Webhook Subscriptions ({webhooks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broker-health')}
            className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'broker-health'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Broker Cluster Health</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: CDC CONNECTORS TABLE */}
      {activeTab === 'cdc-streams' && (
        <div className="space-y-6">
          {/* Bi-Directional Sync Health Heatmap Panel */}
          <SyncHealthHeatmap />

          {/* Aggregate Throughput Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                Live Throughput Dashboard
              </h4>
              <span className="text-xs font-bold text-slate-500">Across 9 Active Connectors</span>
            </div>
            <div className="p-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={connectorThroughputHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dx={-10} tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="incoming" name="Incoming Rate (ops/sec)" stroke="#818CF8" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#818CF8' }} />
                  <Line type="monotone" dataKey="outgoing" name="Outgoing Rate (ops/sec)" stroke="#34D399" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#34D399' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Existing CDC Connectors Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <OverflowTableWrapper hintLabel="Scroll horizontally to inspect full CDC stream parameters" theme="light">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="p-3.5">CDC Stream Name</th>
                    <th className="p-3.5">Source & Connector Type</th>
                    <th className="p-3.5">Target Topic</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Throughput</th>
                    <th className="p-3.5 text-right">Latency</th>
                    <th className="p-3.5 text-right">Queue Lag</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                  {cdcStreams.map(stream => (
                    <tr key={stream.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <Database className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>{stream.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{stream.id}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{stream.source}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{stream.sourceType}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px]">
                          {stream.targetTopic}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
                          stream.status === 'Streaming'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : stream.status === 'Backpressured'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : stream.status === 'Degraded'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            stream.status === 'Streaming' ? 'bg-emerald-500 animate-ping' : 'bg-current'
                          }`} />
                          {stream.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {stream.eventsPerSec.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">evt/s</span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        {stream.latencyMs}ms
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          stream.queueLag > 100 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {stream.queueLag} msgs
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStream(stream.id)}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              stream.status === 'Streaming'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title={stream.status === 'Streaming' ? 'Pause Stream' : 'Resume Stream'}
                          >
                            {stream.status === 'Streaming' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </OverflowTableWrapper>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: LIVE PAYLOAD EVENT FEED */}
      {activeTab === 'live-feed' && (
        <div className="space-y-6">
          {/* SEARCH & FILTER BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-3xs">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by Table, Stream, or TxID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto scrollbar-none">
                {(['ALL', 'INSERT', 'UPDATE', 'DELETE', 'DDL'] as const).map(op => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setOpFilter(op)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      opFilter === op
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              Showing {filteredEvents.length} events
            </div>
          </div>

          {/* EVENTS LIST VIEW */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs overflow-hidden divide-y divide-slate-100 font-mono text-xs">
            {filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">
                No CDC events matching current filters.
              </div>
            ) : (
              filteredEvents.map(evt => (
                <div key={evt.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-slate-400 font-bold text-[10px] tracking-tight">{evt.timestamp}</span>
                      
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                        evt.opType === 'INSERT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        evt.opType === 'UPDATE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        evt.opType === 'DELETE' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {evt.opType}
                      </span>

                      <span className="text-slate-900 font-black text-sm tracking-tight font-sans">{evt.table}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] border border-slate-200">TX: {evt.txId}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] border border-slate-200">LSN: {evt.lsn}</span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium font-sans flex items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-slate-400" />
                        Stream: <strong className="text-indigo-600">{evt.streamName}</strong>
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-emerald-500" />
                        Latency: <strong className="text-emerald-600 font-black">{evt.latencyMs}ms</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedEventModal(evt)}
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-3xs"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Inspect JSON</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: REAL-TIME PACKET STREAM & EVENT DIAGNOSTIC LOG */}
      {activeTab === 'packet-log' && (
        <div className="space-y-5">
          {/* TOP REAL-TIME PACKET FLOW METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white text-slate-900 p-5 rounded-3xl border border-slate-200/80 shadow-3xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Inbound Data Packets
                </div>
                <div className="text-2xl font-black font-mono mt-1 text-slate-900">
                  {packetLogs.filter(p => p.direction === 'INBOUND').length * 420 + 3820} <span className="text-xs font-bold text-slate-400">pkts/s</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">CDC WAL, OData v4, Avro Kafka</div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div className="bg-white text-slate-900 p-5 rounded-3xl border border-slate-200/80 shadow-3xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Outbound Sync Packets
                </div>
                <div className="text-2xl font-black font-mono mt-1 text-slate-900">
                  {packetLogs.filter(p => p.direction === 'OUTBOUND').length * 410 + 3810} <span className="text-xs font-bold text-slate-400">pkts/s</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">WebSocket Sockets, Webhooks</div>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                <Zap className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white text-slate-900 p-5 rounded-3xl border border-slate-200/80 shadow-3xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-cyan-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Sync Latency
                </div>
                <div className="text-2xl font-black font-mono mt-1 text-slate-900">
                  12ms <span className="text-xs font-black text-emerald-600 font-sans tracking-tight">(-2ms UI delta)</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Zero Buffer Congestion</div>
              </div>
              <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl border border-cyan-100">
                <Gauge className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white text-slate-900 p-5 rounded-3xl border border-slate-200/80 shadow-3xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  UI Sync Health
                </div>
                <div className="text-2xl font-black font-mono mt-1 text-emerald-600">
                  100% Verified
                </div>
                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">0 Dropped UI Frames</div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* UI SYNCHRONIZATION DIAGNOSTIC SCANNER CARD */}
          <div className="bg-white text-slate-900 p-6 rounded-3xl border border-indigo-100 shadow-3xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                    Real-Time UI Synchronization Diagnostic Tool
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black border border-indigo-100 rounded-md tracking-widest uppercase">
                      DIAGNOSTIC ENGINE
                    </span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Diagnose why a specific record or payload is or isn't reflecting as expected.
                  </p>
                </div>
              </div>

              {/* Action buttons for packet injection */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleInjectTestPacket('Ingress')}
                  className="px-4 py-2 bg-emerald-50/40 hover:bg-emerald-100/60 text-emerald-700 border border-emerald-200 hover:border-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  <span>+ INGRESS</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInjectTestPacket('Egress')}
                  className="px-4 py-2 bg-indigo-50/40 hover:bg-indigo-100/60 text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <ArrowUpRight className="w-4 h-4 text-indigo-600" />
                  <span>+ EGRESS</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInjectTestPacket('Transformation')}
                  className="px-4 py-2 bg-amber-50/40 hover:bg-amber-100/60 text-amber-700 border border-amber-200 hover:border-amber-300 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <RefreshCcw className="w-4 h-4 text-amber-600" />
                  <span>+ XFORM</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInjectTestPacket('Error')}
                  className="px-4 py-2 bg-rose-50/40 hover:bg-rose-100/60 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>+ ERROR</span>
                </button>
              </div>
            </div>

            {/* DIAGNOSTIC SEARCH FORM */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Enter email address, Customer ID, document number, or keyword..."
                  value={diagnosticTraceInput}
                  onChange={(e) => setDiagnosticTraceInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunDiagnosticTrace()}
                  className="w-full pl-4 pr-32 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleRunDiagnosticTrace()}
                  disabled={isRunningDiagnostic}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-xs"
                >
                  {isRunningDiagnostic ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>Run Trace</span>
                </button>
              </div>

              {/* Preset Diagnostic Quick Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono shrink-0">
                <span className="text-slate-500">Quick Test:</span>
                {[
                  'ronald.policarpio@aujan.com.sa',
                  'CUST-1049',
                  'SO-2026-0941',
                  'warehouse_bin_code (Fail Test)'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setDiagnosticTraceInput(preset);
                      handleRunDiagnosticTrace(preset);
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    {preset.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* DIAGNOSTIC TRACE RESULT BREAKDOWN */}
            {diagnosticResult && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-3xs space-y-4 font-mono text-xs animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Target Query:</span>
                    <strong className="text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 shadow-3xs">{diagnosticResult.query}</strong>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>Stream: <strong className="text-slate-900">{diagnosticResult.streamName}</strong></span>
                    <span>CorrID: <strong className="text-slate-600">{diagnosticResult.correlationId}</strong></span>
                    <span>Latency: <strong className="text-emerald-600 font-black">{diagnosticResult.latencyMs}ms</strong></span>
                  </div>
                </div>

                {/* STEPS PIPELINE LIST */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                  {diagnosticResult.steps.map((st, sIdx) => (
                    <div key={sIdx} className={`p-4 rounded-2xl border text-[11px] space-y-2 shadow-3xs transition-all ${
                      st.status === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' :
                      st.status === 'WARNING' ? 'bg-amber-50 border-amber-100 text-amber-900' :
                      'bg-rose-50 border-rose-100 text-rose-900'
                    }`}>
                      <div className="flex items-center justify-between font-black uppercase tracking-tight">
                        <span>{st.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${
                          st.status === 'SUCCESS' ? 'bg-white text-emerald-700 border-emerald-200 shadow-3xs' :
                          st.status === 'WARNING' ? 'bg-white text-amber-700 border-amber-200 shadow-3xs' :
                          'bg-white text-rose-700 border-rose-200 shadow-3xs'
                        }`}>
                          {st.status}
                        </span>
                      </div>
                      <p className="text-[10px] leading-tight font-bold text-slate-500 uppercase tracking-tight">{st.detail}</p>
                    </div>
                  ))}
                </div>

                {/* VERDICT SUMMARY BANNER */}
                <div className={`p-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-3xs transition-all ${
                  diagnosticResult.verdict.startsWith('HEALTHY')
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-200/50'
                    : 'bg-rose-600 border-rose-500 text-white shadow-rose-200/50'
                }`}>
                  {diagnosticResult.verdict.startsWith('HEALTHY') ? (
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-white shrink-0" />
                  )}
                  <span>{diagnosticResult.verdict}</span>
                </div>
              </div>
            )}
          </div>

          {/* REAL-TIME PACKET LATENCY HEATMAP & CONGESTION VISUALIZATION PANEL */}
          <div className="bg-white text-slate-900 p-6 rounded-3xl border border-slate-200/80 shadow-3xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                    Real-Time Packet Latency Heatmap & Congestion Detector
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black border border-indigo-100 rounded-md tracking-widest uppercase">
                      RECHARTS HEATMAP
                    </span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Heatmap matrix & latency trend over time to identify protocol bottlenecks.
                  </p>
                </div>
              </div>

              {/* View Mode Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setHeatmapViewMode('heatmap')}
                  className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    heatmapViewMode === 'heatmap'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Protocol Heatmap</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapViewMode('timeline')}
                  className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    heatmapViewMode === 'timeline'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Latency Timeline</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapViewMode('protocols')}
                  className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    heatmapViewMode === 'protocols'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>SLA Bands</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapViewMode('phases')}
                  className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    heatmapViewMode === 'phases'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Phase Breakdown</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapViewMode('forecast')}
                  className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    heatmapViewMode === 'forecast'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-100 animate-pulse" />
                  <span>60m Forecast</span>
                </button>
              </div>
            </div>

            {/* QUICK HEATMAP STATUS LEGEND & METRICS BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
                <div>
                  <div className="text-slate-400">Optimal (≤20ms)</div>
                  <strong className="text-emerald-600 font-black">
                    {latencyHeatmapData.reduce((acc, curr) => acc + curr.optimalCount, 0)} pkts
                  </strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-cyan-500 shrink-0" />
                <div>
                  <div className="text-slate-400">Normal (21–50ms)</div>
                  <strong className="text-cyan-600 font-black">
                    {latencyHeatmapData.reduce((acc, curr) => acc + curr.normalCount, 0)} pkts
                  </strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500 shrink-0" />
                <div>
                  <div className="text-slate-400">Moderate Lag (51–100ms)</div>
                  <strong className="text-amber-600 font-black">
                    {latencyHeatmapData.reduce((acc, curr) => acc + curr.moderateCount, 0)} pkts
                  </strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-rose-500 shrink-0 animate-pulse" />
                <div>
                  <div className="text-slate-400">Peak Congestion (&gt;100ms)</div>
                  <strong className="text-rose-600 font-black">
                    {latencyHeatmapData.reduce((acc, curr) => acc + curr.severeCount, 0)} pkts
                  </strong>
                </div>
              </div>
            </div>

            {/* CHART RENDER: VIEW MODE 1 - PROTOCOL LATENCY HEATMAP */}
            {heatmapViewMode === 'heatmap' && (
              <div className="space-y-3">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={latencyHeatmapData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="protocol" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fill: '#94a3b8' }} unit="ms" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl text-xs font-mono text-slate-100 shadow-xl space-y-1">
                                <div className="font-bold text-indigo-300 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
                                  <span>Protocol: {data.protocol}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] text-white" style={{ backgroundColor: data.levelColor }}>
                                    {data.congestionLevel}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[11px]">
                                  <div>Avg Latency: <strong className="text-white">{data.avgLatency} ms</strong></div>
                                  <div>Peak Latency: <strong className="text-rose-400">{data.peakLatency} ms</strong></div>
                                  <div>Optimal (≤20ms): <span className="text-emerald-400">{data.optimalCount}</span></div>
                                  <div>Normal (21-50ms): <span className="text-cyan-400">{data.normalCount}</span></div>
                                  <div>Lag (51-100ms): <span className="text-amber-400">{data.moderateCount}</span></div>
                                  <div>Peak (&gt;100ms): <span className="text-rose-400">{data.severeCount}</span></div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="avgLatency" name="Average Latency (ms)" radius={[6, 6, 0, 0]}>
                        {latencyHeatmapData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.levelColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Heatmap Grid Matrix Blocks Below Bar Chart */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {latencyHeatmapData.map((item) => (
                    <div
                      key={item.protocol}
                      className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-200 transition-all font-mono text-xs space-y-1.5 shadow-3xs"
                    >
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-900">{item.protocol}</span>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.levelColor }}
                        />
                      </div>
                      <div className="text-xl font-black text-slate-900">
                        {item.avgLatency} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ms avg</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between pt-1">
                        <span>Peak: <strong className="text-rose-600">{item.peakLatency}ms</strong></span>
                        <span>{item.totalPackets} pkts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHART RENDER: VIEW MODE 2 - LATENCY TIMELINE WITH CONGESTION SLA THRESHOLDS */}
            {heatmapViewMode === 'timeline' && (
              <div className="space-y-2">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timelineLatencyData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="timestamp" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fill: '#94a3b8' }} unit="ms" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl text-xs font-mono text-slate-100 shadow-xl space-y-1">
                                <div className="font-bold text-indigo-300 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
                                  <span>Packet ID: {data.id}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] text-white ${data.isCongested ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                                    {data.isCongested ? 'LAG SPIKE' : 'NORMAL'}
                                  </span>
                                </div>
                                <div className="space-y-0.5 pt-1 text-[11px]">
                                  <div>Time: <span className="text-slate-300">{data.timestamp}</span></div>
                                  <div>Protocol: <span className="text-slate-300">{data.protocol}</span></div>
                                  <div>Exact Latency: <strong className={data.isCongested ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{data.latencyMs} ms</strong></div>
                                  <div>Packet Type: <span className="text-slate-300">{data.packetType}</span></div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '50ms SLA Lag Warning', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }} />
                      <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '100ms Critical Congestion', fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }} />
                      <Area type="monotone" dataKey="visualLatency" name="Latency (ms)" fill="url(#colorLatency)" stroke="#6366f1" strokeWidth={2} />
                      <defs>
                        <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART RENDER: VIEW MODE 3 - SLA LATENCY BANDS BREAKDOWN */}
            {heatmapViewMode === 'protocols' && (
              <div className="space-y-2">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={latencyHeatmapData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="protocol" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }} />
                      <Bar dataKey="optimalCount" name="Optimal (≤20ms)" stackId="a" fill="#10b981" />
                      <Bar dataKey="normalCount" name="Normal (21-50ms)" stackId="a" fill="#06b6d4" />
                      <Bar dataKey="moderateCount" name="Moderate (51-100ms)" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="severeCount" name="Severe (&gt;100ms)" stackId="a" fill="#f43f5e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART RENDER: VIEW MODE 4 - PIPELINE PHASE STACKED LATENCY BREAKDOWN */}
            {heatmapViewMode === 'phases' && (
              <div className="space-y-3">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={phaseBreakdownData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="protocol" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fill: '#94a3b8' }} unit="ms" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl text-xs font-mono text-slate-100 shadow-xl space-y-1.5">
                                <div className="font-bold text-indigo-300 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
                                  <span>{data.protocol} Phase Breakdown</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${data.bottleneckBadgeColor}`}>
                                    {data.dominantPhase.toUpperCase()} BOTTLENECK
                                  </span>
                                </div>
                                <div className="space-y-1 text-[11px] pt-1">
                                  <div className="flex justify-between gap-4">
                                    <span className="text-blue-400">1. Network Transport:</span>
                                    <strong>{data.networkMs} ms ({data.networkPct}%)</strong>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-cyan-400">2. CDC Transformation:</span>
                                    <strong>{data.transformMs} ms ({data.transformPct}%)</strong>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-purple-400">3. Destination Commit:</span>
                                    <strong>{data.commitMs} ms ({data.commitPct}%)</strong>
                                  </div>
                                  <div className="border-t border-slate-800 pt-1 font-bold text-white flex justify-between">
                                    <span>Total Latency:</span>
                                    <span>{data.avgLatency} ms</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }} />
                      <Bar dataKey="networkMs" name="1. Network Transport (ms)" stackId="phase" fill="#3b82f6" />
                      <Bar dataKey="transformMs" name="2. CDC Transformation (ms)" stackId="phase" fill="#06b6d4" />
                      <Bar dataKey="commitMs" name="3. Destination Batch Commit (ms)" stackId="phase" fill="#a855f7" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART RENDER: VIEW MODE 5 - 60-MINUTE THROUGHPUT & LATENCY FORECAST TREND */}
            {heatmapViewMode === 'forecast' && (
              <div className="space-y-6 font-mono">
                {/* FORECAST SUMMARY METRICS KPI HEADER */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-200/80 text-xs shadow-3xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-3xs">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peak Pred. Latency</div>
                      <strong className="text-rose-600 font-black text-base tracking-tight">
                        {forecastSummary.peakLatencyMs} ms
                      </strong>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Window: {forecastSummary.peakTimeLabel}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100 shadow-3xs">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peak Pred. Throughput</div>
                      <strong className="text-cyan-600 font-black text-base tracking-tight">
                        {forecastSummary.peakThroughput.toLocaleString()} p/s
                      </strong>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Predicted Batch Surge</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-3xs">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">60-Min Total Volume</div>
                      <strong className="text-indigo-600 font-black text-base tracking-tight">
                        {(forecastSummary.totalProjectedPkts / 1000000).toFixed(2)}M pkts
                      </strong>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Projected Stream Flow</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-3xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ARIMA Confidence</div>
                      <strong className="text-emerald-600 font-black text-base tracking-tight">
                        {forecastSummary.confidenceScore}
                      </strong>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">95% Confidence Interval</div>
                    </div>
                  </div>
                </div>

                {/* DUAL-AXIS FORECAST CHART (LATENCY VS THROUGHPUT) */}
                <div className="h-80 w-full bg-white p-4 rounded-3xl border border-slate-200/80 shadow-3xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={throughputForecastData} margin={{ top: 15, right: 20, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="forecastLatencyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis
                        yAxisId="left"
                        stroke="#f43f5e"
                        tick={{ fontSize: 10, fill: '#f43f5e', fontWeight: 700 }}
                        unit="ms"
                        domain={[0, 110]}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: '#f43f5e', fontSize: 10, fontWeight: 900 }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#06b6d4"
                        tick={{ fontSize: 10, fill: '#06b6d4', fontWeight: 700 }}
                        unit=" p/s"
                        domain={[0, 6000]}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Throughput (p/s)', angle: 90, position: 'insideRight', fill: '#06b6d4', fontSize: 10, fontWeight: 900 }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white border border-slate-200 p-4 rounded-2xl text-xs font-mono text-slate-900 shadow-xl space-y-2 ring-1 ring-slate-100">
                                <div className="font-black text-indigo-700 border-b border-slate-100 pb-2 flex items-center justify-between gap-4 uppercase tracking-widest text-[10px]">
                                  <span>Time Window: {data.timeLabel}</span>
                                  <span className="px-2 py-0.5 rounded-md text-[9px] text-white font-black" style={{ backgroundColor: data.riskColor }}>
                                    {data.riskLevel}
                                  </span>
                                </div>
                                <div className="space-y-1.5 text-[11px] pt-1">
                                  {data.actualLatency !== null && (
                                    <div className="flex justify-between gap-6">
                                      <span className="text-slate-500 font-bold uppercase tracking-tight">Actual Hist. Latency:</span>
                                      <strong className="text-slate-900 font-black">{data.actualLatency} ms</strong>
                                    </div>
                                  )}
                                  {data.forecastLatency !== null && (
                                    <div className="flex justify-between gap-6">
                                      <span className="text-rose-600 font-black uppercase tracking-tight">Predicted Latency:</span>
                                      <strong className="text-rose-600 font-black">{data.forecastLatency} ms</strong>
                                    </div>
                                  )}
                                  {data.actualThroughput !== null && (
                                    <div className="flex justify-between gap-6">
                                      <span className="text-slate-500 font-bold uppercase tracking-tight">Actual Throughput:</span>
                                      <strong className="text-slate-900 font-black">{data.actualThroughput.toLocaleString()} p/s</strong>
                                    </div>
                                  )}
                                  {data.forecastThroughput !== null && (
                                    <div className="flex justify-between gap-6">
                                      <span className="text-cyan-600 font-black uppercase tracking-tight">Predicted Throughput:</span>
                                      <strong className="text-cyan-600 font-black">{data.forecastThroughput.toLocaleString()} p/s</strong>
                                    </div>
                                  )}
                                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest pt-2 border-t border-slate-50 mt-2">
                                    Confidence Range: <span className="text-emerald-600">{data.confidenceInterval}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', paddingTop: '20px' }} />
                      <ReferenceLine yAxisId="left" y={50} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={2} label={{ value: '50ms SLA Threshold', fill: '#f59e0b', fontSize: 9, fontWeight: 900, position: 'insideTopLeft' }} />
                      <ReferenceLine yAxisId="left" y={100} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={2} label={{ value: '100ms Critical Buffer Limit', fill: '#ef4444', fontSize: 9, fontWeight: 900, position: 'insideTopLeft' }} />
                      
                      {/* Historical Latency */}
                      <Line yAxisId="left" type="monotone" dataKey="actualLatency" name="Historical Latency" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      
                      {/* Forecast Latency (Dashed Trend Line) */}
                      <Line yAxisId="left" type="monotone" dataKey="forecastLatency" name="Forecast Latency Trend" stroke="#f43f5e" strokeWidth={4} strokeDasharray="8 4" dot={{ r: 5, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                      
                      {/* Historical Throughput */}
                      <Bar yAxisId="right" dataKey="actualThroughput" name="Historical Throughput" fill="#3b82f6" opacity={0.2} barSize={20} radius={[4, 4, 0, 0]} />
                      
                      {/* Forecast Throughput Trend Line */}
                      <Line yAxisId="right" type="monotone" dataKey="forecastThroughput" name="Forecast Throughput" stroke="#06b6d4" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* PREEMPTIVE AUTO-SCALING RECOMMENDATION BANNER */}
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-3xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-emerald-200/50 shadow-lg">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-black text-emerald-700 text-xs uppercase tracking-widest">AI Preemptive Pipeline Advice:</span>
                      <p className="text-[11px] text-emerald-800 font-bold mt-1 tracking-tight leading-relaxed">{forecastSummary.recommendation}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActionToast({
                        message: '⚡ Preemptive scaling command triggered! Provisioned 2 additional CDC stream workers.',
                        type: 'info'
                      });
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shadow-lg shadow-emerald-100 shrink-0 self-start sm:self-auto"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Auto-Scale Workers Now</span>
                  </button>
                </div>

                {/* 60-MINUTE FORECAST TIME WINDOW BREAKDOWN TABLE */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black text-slate-900 tracking-widest uppercase flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>Predicted 10-Minute Window Trajectory</span>
                    </h4>
                  </div>
                  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs overflow-hidden">
                    <OverflowTableWrapper hintLabel="Scroll horizontally to inspect 10-minute forecast window confidence bounds">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                            <th className="py-4 px-5">Time Window</th>
                            <th className="py-4 px-5">Forecast Horizon</th>
                            <th className="py-4 px-5 text-center">Predicted Throughput</th>
                            <th className="py-4 px-5 text-center">Predicted Latency</th>
                            <th className="py-4 px-5">Confidence Interval</th>
                            <th className="py-4 px-5">Predicted Risk Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs">
                          {throughputForecastData.map((row) => (
                            <tr key={row.period} className={`hover:bg-slate-50/80 transition-colors ${row.isForecast ? 'bg-indigo-50/20' : ''}`}>
                              <td className="py-4 px-5 font-black text-slate-900 tracking-tight">
                                {row.timeLabel}
                              </td>
                              <td className="py-4 px-5">
                                {row.isForecast ? (
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                    FORECAST
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                    HISTORICAL
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-5 text-center font-black text-cyan-600">
                                {row.actualThroughput ? row.actualThroughput.toLocaleString() : row.forecastThroughput?.toLocaleString()} <span className="text-[10px] font-bold text-slate-400 uppercase">p/s</span>
                              </td>
                              <td className="py-4 px-5 text-center font-black text-rose-600">
                                {row.actualLatency !== null ? row.actualLatency : row.forecastLatency} <span className="text-[10px] font-bold text-slate-400 uppercase">ms</span>
                              </td>
                              <td className="py-4 px-5 text-slate-500 font-bold text-[11px] tracking-tight">
                                {row.confidenceInterval}
                              </td>
                              <td className="py-4 px-5">
                                <span className="px-3 py-1 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-3xs" style={{ backgroundColor: row.riskColor }}>
                                  {row.riskLevel}
                                </span>
                              </td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </OverflowTableWrapper>
                </div>
              </div>
            </div>
          )}

          </div>

          {/* PIPELINE LATENCY CATEGORIZATION & BOTTLENECK BREAKDOWN TABLE */}
          <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden relative space-y-6 font-mono">
            {/* Elegant Cron Manager styled Header Banner */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                </span>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                  Pipeline Phase Latency Breakdown & Bottleneck Analysis
                </h4>
              </div>
              <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/80 border border-slate-200/60 px-3 py-1.5 rounded-full shadow-2xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-3xs" /> Network</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-3xs" /> Transformation</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-3xs" /> Commit</span>
              </div>
            </div>

            {/* Inner Content Padding */}
            <div className="p-6 space-y-6">
              {/* OVERALL PHASE AVERAGES KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-gradient-to-br from-blue-50/40 via-white to-blue-50/10 rounded-2xl border border-blue-100 space-y-2 shadow-3xs">
                  <div className="text-[10px] text-blue-600 font-black uppercase tracking-widest flex items-center justify-between">
                    <span>Phase 1: Network Ingestion</span>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-slate-900 flex items-baseline justify-between tracking-tight">
                    <span>{pipelinePhaseTotals.avgNetworkMs} ms</span>
                    <span className="text-[10px] font-bold text-blue-600 uppercase">
                      {Math.round((pipelinePhaseTotals.avgNetworkMs / pipelinePhaseTotals.totalAvgMs) * 100)}% total
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-tight">
                    TLS handshake, socket frame transmit, WAN propagation
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-cyan-50/40 via-white to-cyan-50/10 rounded-2xl border border-cyan-100 space-y-2 shadow-3xs">
                  <div className="text-[10px] text-cyan-600 font-black uppercase tracking-widest flex items-center justify-between">
                    <span>Phase 2: CDC Transformation</span>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-slate-900 flex items-baseline justify-between tracking-tight">
                    <span>{pipelinePhaseTotals.avgTransformMs} ms</span>
                    <span className="text-[10px] font-bold text-cyan-600 uppercase">
                      {Math.round((pipelinePhaseTotals.avgTransformMs / pipelinePhaseTotals.totalAvgMs) * 100)}% total
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-tight">
                    Schema mapping, JSON parsing, delta diff decoding
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50/40 via-white to-purple-50/10 rounded-2xl border border-purple-100 space-y-2 shadow-3xs">
                  <div className="text-[10px] text-purple-600 font-black uppercase tracking-widest flex items-center justify-between">
                    <span>Phase 3: Destination Commit</span>
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black text-slate-900 flex items-baseline justify-between tracking-tight">
                    <span>{pipelinePhaseTotals.avgCommitMs} ms</span>
                    <span className="text-[10px] font-bold text-purple-600 uppercase">
                      {Math.round((pipelinePhaseTotals.avgCommitMs / pipelinePhaseTotals.totalAvgMs) * 100)}% total
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-tight">
                    Target database UPSERT, table locks, WAL disk sync
                  </p>
                </div>
              </div>

              {/* DETAILED PROTOCOL PHASE BREAKDOWN TABLE */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs overflow-hidden">
                <OverflowTableWrapper hintLabel="Scroll horizontally to view protocol phase latency details & optimization advice">
                  <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                        <th className="py-4 px-5">Protocol / Stream Engine</th>
                        <th className="py-4 px-5 text-center">Avg Latency</th>
                        <th className="py-4 px-5">1. Network Phase</th>
                        <th className="py-4 px-5">2. Transformation Phase</th>
                        <th className="py-4 px-5">3. Destination Commit</th>
                        <th className="py-4 px-5">Identified Bottleneck</th>
                        <th className="py-4 px-5">Optimization Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {phaseBreakdownData.map((row) => (
                        <tr key={row.protocol} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-5 font-black text-slate-900 tracking-tight">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full shadow-3xs" style={{ backgroundColor: row.levelColor }} />
                              <span>{row.protocol}</span>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-center font-black text-slate-900">
                            {row.avgLatency} <span className="text-[9px] font-bold text-slate-400 uppercase">ms</span>
                          </td>

                          {/* Network Phase */}
                          <td className={`py-4 px-5 ${row.dominantPhase === 'network' ? 'bg-blue-50/50 text-blue-700' : 'text-slate-600'}`}>
                            <div className="flex items-center justify-between text-[11px] mb-2 font-bold tracking-tight">
                              <span>{row.networkMs} ms</span>
                              <span className="text-[10px] text-slate-400">{row.networkPct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-3xs">
                              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${row.networkPct}%` }} />
                            </div>
                          </td>

                          {/* Transformation Phase */}
                          <td className={`py-4 px-5 ${row.dominantPhase === 'transformation' ? 'bg-cyan-50/50 text-cyan-700' : 'text-slate-600'}`}>
                            <div className="flex items-center justify-between text-[11px] mb-2 font-bold tracking-tight">
                              <span>{row.transformMs} ms</span>
                              <span className="text-[10px] text-slate-400">{row.transformPct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-3xs">
                              <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${row.transformPct}%` }} />
                            </div>
                          </td>

                          {/* Destination Commit Phase */}
                          <td className={`py-4 px-5 ${row.dominantPhase === 'destination commit' ? 'bg-purple-50/50 text-purple-700' : 'text-slate-600'}`}>
                            <div className="flex items-center justify-between text-[11px] mb-2 font-bold tracking-tight">
                              <span>{row.commitMs} ms</span>
                              <span className="text-[10px] text-slate-400">{row.commitPct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-3xs">
                              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${row.commitPct}%` }} />
                            </div>
                          </td>

                          <td className="py-4 px-5">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-3xs ${row.bottleneckBadgeColor}`}>
                              {row.bottleneckDesc}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed max-w-[200px]">
                              {row.recommendation}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </OverflowTableWrapper>
              </div>

              {/* PEAK CONGESTION DETECTOR ALERT & FILTER SHORTCUT */}
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-3xl text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-3xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shadow-3xs">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                  </div>
                  <span className="font-bold text-amber-900 tracking-tight leading-relaxed">
                    <strong className="font-black uppercase tracking-widest text-[10px] block mb-0.5">Congestion Audit Status:</strong>
                    {congestionOverview.congestedCount} packet(s) exceeded 50ms SLA threshold out of {packetLogs.length} stream logs.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPacketSearchTerm('');
                    setPacketDirectionFilter('DIAGNOSTIC_ALERTS');
                    setActionToast({
                      message: '🔍 Filtered event stream table to show high-latency & diagnostic alert packets!',
                      type: 'info'
                    });
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shadow-lg shadow-indigo-100 self-start sm:self-auto shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span>Isolate Congested Packets</span>
                </button>
              </div>
            </div>
          </div>

          {/* PACKET TYPE VISIBILITY TOGGLES PANEL */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-3xs text-slate-900">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 font-mono mr-2 uppercase tracking-widest">
                <Filter className="w-4 h-4 text-indigo-500" />
                <span>Packet Type Filters:</span>
              </div>

              {/* TOGGLE: INGRESS */}
              <button
                type="button"
                onClick={() => togglePacketType('Ingress')}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 border shadow-3xs ${
                  selectedPacketTypes.includes('Ingress')
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50'
                }`}
              >
                <ArrowDownLeft className={`w-3.5 h-3.5 ${selectedPacketTypes.includes('Ingress') ? 'text-white' : 'text-emerald-500'}`} />
                <span>Ingress</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                  selectedPacketTypes.includes('Ingress') ? 'bg-emerald-700/50 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {packetTypeCounts.Ingress}
                </span>
              </button>

              {/* TOGGLE: EGRESS */}
              <button
                type="button"
                onClick={() => togglePacketType('Egress')}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 border shadow-3xs ${
                  selectedPacketTypes.includes('Egress')
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50'
                }`}
              >
                <ArrowUpRight className={`w-3.5 h-3.5 ${selectedPacketTypes.includes('Egress') ? 'text-white' : 'text-indigo-500'}`} />
                <span>Egress</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                  selectedPacketTypes.includes('Egress') ? 'bg-indigo-700/50 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {packetTypeCounts.Egress}
                </span>
              </button>

              {/* TOGGLE: TRANSFORMATION */}
              <button
                type="button"
                onClick={() => togglePacketType('Transformation')}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 border shadow-3xs ${
                  selectedPacketTypes.includes('Transformation')
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-amber-200 hover:bg-amber-50/50'
                }`}
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${selectedPacketTypes.includes('Transformation') ? 'text-white' : 'text-amber-500'}`} />
                <span>Transformation</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                  selectedPacketTypes.includes('Transformation') ? 'bg-amber-700/50 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {packetTypeCounts.Transformation}
                </span>
              </button>

              {/* TOGGLE: ERROR */}
              <button
                type="button"
                onClick={() => togglePacketType('Error')}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 border shadow-3xs ${
                  selectedPacketTypes.includes('Error')
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-rose-200 hover:bg-rose-50/50'
                }`}
              >
                <AlertTriangle className={`w-3.5 h-3.5 ${selectedPacketTypes.includes('Error') ? 'text-white' : 'text-rose-500'}`} />
                <span>Error</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                  selectedPacketTypes.includes('Error') ? 'bg-rose-700/50 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {packetTypeCounts.Error}
                </span>
              </button>
            </div>

            {/* QUICK ACTION BUTTONS: SELECT ALL / CLEAR ALL */}
            <div className="flex items-center gap-2 shrink-0 text-[10px] font-black uppercase tracking-widest">
              <button
                type="button"
                onClick={selectAllPacketTypes}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer border border-slate-200 shadow-3xs"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAllPacketTypes}
                className="px-3.5 py-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer border border-slate-100 shadow-3xs"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* FILTER & SEARCH TOOLBAR FOR PACKETS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-3xs">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search log streams..."
                  value={packetSearchTerm}
                  onChange={(e) => setPacketSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-[11px] bg-slate-50 border border-slate-100 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-sans font-medium placeholder:text-slate-400 transition-all shadow-inner shadow-slate-100"
                />
              </div>

              {/* DIRECTION FILTER CHIPS */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'ALL', label: 'All Streams' },
                  { id: 'INBOUND', label: '📥 Inbound' },
                  { id: 'OUTBOUND', label: '📤 Outbound' },
                  { id: 'DIAGNOSTIC_ALERTS', label: '⚠️ Alerts' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPacketDirectionFilter(item.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap shadow-3xs ${
                      packetDirectionFilter === item.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0">
              {/* PAUSE AUTO-SCROLL TOGGLE SWITCH */}
              <button
                type="button"
                onClick={() => setIsAutoScrollPaused(!isAutoScrollPaused)}
                className={`px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 border shadow-3xs ${
                  isAutoScrollPaused
                    ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                    : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                }`}
                title={isAutoScrollPaused ? "Auto-scroll is PAUSED. Click to resume auto-scrolling on new logs." : "Auto-scroll is ACTIVE. Click to pause auto-scroll and lock position."}
              >
                {/* Switch Graphic Track */}
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center ${isAutoScrollPaused ? 'bg-amber-500 justify-end' : 'bg-emerald-500 justify-start'}`}>
                  <div className="w-4 h-4 rounded-full bg-white shadow-3xs" />
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  {isAutoScrollPaused ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Auto-scroll: <strong className="text-amber-800">PAUSED</strong></span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Auto-scroll: <strong className="text-emerald-700">ACTIVE</strong></span>
                    </>
                  )}
                </div>
              </button>

              {/* EXPORT LOGS CSV BUTTON */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-slate-200/50 shrink-0"
                title="Export currently displayed event logs as a CSV file for auditing"
              >
                <Download className="w-4 h-4 text-indigo-300" />
                <span>Export CSV</span>
              </button>

              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest shrink-0 flex items-center gap-3 whitespace-nowrap border-l border-slate-100 pl-4 ml-1">
                <span>Displaying {filteredPacketLogs.length} / {packetLogs.length} events</span>
              </div>
            </div>
          </div>


          {/* PAUSED AUTO-SCROLL NOTIFICATION BANNER */}
          {isAutoScrollPaused && (
            <div className="px-4 py-2.5 bg-amber-950/80 border border-amber-800/90 text-amber-200 rounded-xl text-xs font-mono flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-md">
              <div className="flex items-center gap-2">
                <Pause className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span>
                  <strong>Auto-scroll Paused:</strong> Live stream entries will continue buffering, but view position is locked for inspection.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoScrollPaused(false)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Resume Auto-scroll</span>
              </button>
            </div>
          )}

          {/* PACKET LOG STREAM GRID TABLE */}
          <div ref={logContainerRef} className="bg-white text-slate-900 rounded-3xl border border-slate-200/80 shadow-3xs overflow-x-auto max-h-[550px] overflow-y-auto font-mono text-xs">
            <OverflowTableWrapper hintLabel="Scroll horizontally to view packet protocols and payloads" theme="light">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
                    <th className="p-4">Time & ID</th>
                    <th className="p-4">Packet Type</th>
                    <th className="p-4">Flow Direction</th>
                    <th className="p-4">Source / Destination</th>
                    <th className="p-4">Protocol</th>
                    <th className="p-4 text-center">Entity</th>
                    <th className="p-4 text-right">Size</th>
                    <th className="p-4 text-right">Latency</th>
                    <th className="p-4">Diagnostic Status</th>
                    <th className="p-4 text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[11px]">
                  {filteredPacketLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-12 text-center text-slate-400 font-sans font-medium uppercase tracking-widest text-[10px]">
                        No real-time packets found matching the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPacketLogs.map(pkt => (
                      <tr key={pkt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-black text-slate-900 tracking-tight">{pkt.timestamp}</div>
                          <div className="text-[9px] text-slate-400 font-mono tracking-tighter uppercase">{pkt.id}</div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-max border shadow-3xs ${
                            pkt.packetType === 'Ingress'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : pkt.packetType === 'Egress'
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                              : pkt.packetType === 'Transformation'
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {pkt.packetType === 'Ingress' && <ArrowDownLeft className="w-3 h-3" />}
                            {pkt.packetType === 'Egress' && <ArrowUpRight className="w-3 h-3" />}
                            {pkt.packetType === 'Transformation' && <RefreshCcw className="w-3 h-3" />}
                            {pkt.packetType === 'Error' && <AlertTriangle className="w-3 h-3" />}
                            <span>{pkt.packetType}</span>
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-max border shadow-3xs ${
                            pkt.direction === 'INBOUND'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>
                            {pkt.direction === 'INBOUND' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            <span>{pkt.direction}</span>
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap font-sans font-black text-slate-900 tracking-tight">
                          {pkt.sourceOrTarget}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest border border-slate-200">
                            {pkt.protocol}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap font-black text-slate-900 text-center tracking-tight">
                          {pkt.tableOrEntity}
                        </td>
                        <td className="p-4 text-right text-slate-500 font-bold whitespace-nowrap">
                          {pkt.packetSize}
                        </td>
                        <td className="p-4 text-right font-black text-emerald-600 whitespace-nowrap tracking-tight">
                          {pkt.latencyMs} <span className="text-[9px] text-slate-400 uppercase">ms</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap border shadow-3xs ${
                              pkt.syncState === 'Synced to UI'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : pkt.syncState === 'Buffered' || pkt.syncState === 'Transformed'
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                              {pkt.syncState}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 font-sans truncate max-w-[180px] uppercase tracking-tight" title={pkt.syncDiagnosticNote}>
                              {pkt.syncDiagnosticNote}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedPacketModal(pkt)}
                            className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all cursor-pointer shadow-lg shadow-slate-200/50 mx-auto group"
                          >
                            <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </OverflowTableWrapper>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: WEBHOOK SUBSCRIPTIONS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          {webhookPingStatus && (
            <div className="p-3 bg-white border border-slate-200/80 text-emerald-600 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center gap-2 animate-in fade-in shadow-3xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{webhookPingStatus}</span>
            </div>
          )}

          <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200/80 shadow-3xs">
            <div>
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Streaming Webhook Destinations</h3>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Push live CDC events to external HTTP endpoints with HMAC SHA-256 signatures.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateWebhookOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-2xs cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Webhook</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {webhooks.map(wh => (
              <div key={wh.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                      wh.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {wh.status}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HTTP {wh.lastStatusCode}</span>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{wh.name}</h4>
                    <div className="mt-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-mono text-slate-500 truncate">
                      {wh.targetUrl}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Rate</span>
                      <span className="font-black font-mono text-[11px] text-slate-900">{wh.deliveryRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HMAC Auth</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${wh.hmacEnabled ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {wh.hmacEnabled ? 'Enabled' : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handlePingWebhook(wh)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all cursor-pointer flex items-center gap-2 border border-slate-100"
                  >
                    <Send className="w-3 h-3 text-indigo-600" />
                    <span>Ping Test</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">{wh.lastLatencyMs}ms lat</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: BROKER CLUSTER HEALTH */}
      {activeTab === 'broker-health' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {brokers.map(broker => (
              <div key={broker.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-slate-50 text-slate-900 rounded-2xl border border-slate-100 shadow-3xs">
                    <Server className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {broker.status}
                  </span>
                </div>

                <div>
                  <div className="font-black text-slate-900 text-[13px] uppercase tracking-tight truncate">{broker.name}</div>
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{broker.id} • {broker.role}</div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
                      <span>CPU Load</span>
                      <span className="text-slate-900">{broker.cpuUsage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${broker.cpuUsage > 80 ? 'bg-rose-500' : 'bg-slate-900'}`} 
                        style={{ width: `${broker.cpuUsage}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
                      <span>Memory Heap</span>
                      <span className="text-slate-900">{broker.memoryUsage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${broker.memoryUsage > 85 ? 'bg-amber-500' : 'bg-indigo-600'}`} 
                        style={{ width: `${broker.memoryUsage}%` }} 
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Partitions</span>
                    <span className="font-mono text-slate-900 font-black text-xs">{broker.partitionCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: DEAD LETTER QUEUE & SCHEMA DRIFT ALERTS */}
      {activeTab === 'dlq-queue' && (
        <div className="space-y-4">
          <div className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-3xs flex items-start gap-4">
            <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-100">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Dead Letter Queue & Schema Mismatch</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Messages that fail validation or encounter schema drift are quarantined here. Inspect, patch, or redrive them back into the event stream after resolution.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs overflow-hidden">
            <OverflowTableWrapper hintLabel="Scroll horizontally to inspect quarantined events" theme="light">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4 px-6">Event ID</th>
                    <th className="p-4 px-6">Source Stream</th>
                    <th className="p-4 px-6">Error Reason</th>
                    <th className="p-4 px-6">Fail Count</th>
                    <th className="p-4 px-6">Captured Time</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700 font-mono">
                  {dlqItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500 font-sans">
                        <div className="p-3 bg-emerald-50 rounded-full w-fit mx-auto mb-4 border border-emerald-100">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="font-black text-[13px] text-slate-900 uppercase tracking-tight">Dead Letter Queue Clean</p>
                        <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest font-black">All quarantined CDC messages have been resolved.</p>
                      </td>
                    </tr>
                  ) : (
                    dlqItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                        <td className={`p-4 px-6 font-black ${item.color === 'rose' ? 'text-rose-600' : 'text-amber-600'}`}>
                          {item.id}
                        </td>
                        <td className="p-4 px-6 font-black uppercase tracking-tight text-slate-900 font-sans text-xs">
                          {item.streamName}
                        </td>
                        <td className={`p-4 px-6 font-black uppercase tracking-tight text-[10px] font-sans ${item.color === 'rose' ? 'text-rose-500' : 'text-amber-600'}`}>
                          {item.errorReason}
                        </td>
                        <td className="p-4 px-6 font-black text-slate-900 text-xs">{item.failCount}</td>
                        <td className="p-4 px-6 text-slate-400 font-black uppercase tracking-widest text-[9px] font-sans">{item.capturedTime}</td>
                        <td className="p-4 px-6 text-center font-sans">
                          {item.color === 'rose' ? (
                            <button
                              type="button"
                              onClick={() => handleRedriveDlq(item.id)}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-black text-[9px] uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-3xs active:scale-95"
                            >
                              Re-drive Message
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAutoMigrateDlq(item.id)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-3xs active:scale-95"
                            >
                              Auto-Migrate & Sync
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </OverflowTableWrapper>
          </div>
        </div>
      )}

      {activeTab === 'reconciliation' && (
        <ReconciliationView />
      )}

      {/* 45+ TB Petabyte Data Sync & Multi-Source to Multi-Destination Real-Time Engine Hub */}
      <RealTime45TbTransferEngine />

      {/* INSPECT PAYLOAD MODAL */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-2xl w-full shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <Code className="w-5 h-5 text-slate-900" />
                </div>
                <h3 className="font-black text-[11px] text-slate-900 uppercase tracking-widest">
                  CDC Event Payload Inspector — {selectedEventModal.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest">
                <div><span className="text-slate-400">Operation:</span> <strong className="text-emerald-600 ml-1">{selectedEventModal.opType}</strong></div>
                <div><span className="text-slate-400">Table:</span> <strong className="text-slate-900 ml-1">{selectedEventModal.table}</strong></div>
                <div><span className="text-slate-400">TxID:</span> <span className="text-slate-600 ml-1">{selectedEventModal.txId}</span></div>
                <div><span className="text-slate-400">LSN Offset:</span> <span className="text-slate-600 ml-1">{selectedEventModal.lsn}</span></div>
              </div>

              {selectedEventModal.payloadBefore && (
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-1">State BEFORE Change</div>
                  <pre className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 overflow-x-auto text-[11px] font-mono leading-relaxed">
                    {JSON.stringify(selectedEventModal.payloadBefore, null, 2)}
                  </pre>
                </div>
              )}

              {selectedEventModal.payloadAfter && (
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">State AFTER Change</div>
                  <pre className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 overflow-x-auto text-[11px] font-mono leading-relaxed">
                    {JSON.stringify(selectedEventModal.payloadAfter, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-3xs cursor-pointer active:scale-95 transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT PACKET MODAL */}
      {selectedPacketModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-2xl w-full shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
                </div>
                <h3 className="font-black text-[11px] text-slate-900 uppercase tracking-widest">
                  Packet Frame Inspector — {selectedPacketModal.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPacketModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest">
                <div>
                  <span className="text-slate-400">Packet Type:</span>{' '}
                  <strong className={`ml-1 ${
                    selectedPacketModal.packetType === 'Ingress' ? 'text-emerald-600' :
                    selectedPacketModal.packetType === 'Egress' ? 'text-indigo-600' :
                    selectedPacketModal.packetType === 'Transformation' ? 'text-amber-600' :
                    'text-rose-600'
                  }`}>
                    {selectedPacketModal.packetType}
                  </strong>
                </div>
                <div><span className="text-slate-400">Direction:</span> <strong className={`ml-1 ${selectedPacketModal.direction === 'INBOUND' ? 'text-emerald-600' : 'text-indigo-600'}`}>{selectedPacketModal.direction}</strong></div>
                <div><span className="text-slate-400">Protocol:</span> <strong className="text-slate-900 ml-1">{selectedPacketModal.protocol}</strong></div>
                <div><span className="text-slate-400">Source / Target:</span> <span className="text-slate-600 ml-1">{selectedPacketModal.sourceOrTarget}</span></div>
                <div><span className="text-slate-400">Correlation ID:</span> <span className="text-slate-600 ml-1">{selectedPacketModal.correlationId}</span></div>
                <div><span className="text-slate-400">Packet Size:</span> <span className="text-slate-600 ml-1">{selectedPacketModal.packetSize}</span></div>
                <div><span className="text-slate-400">Latency:</span> <span className="text-emerald-600 font-black ml-1">{selectedPacketModal.latencyMs}ms</span></div>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900 text-[11px] leading-relaxed">
                <div className="font-black uppercase tracking-widest text-indigo-400 mb-1 text-[9px]">Sync Diagnostic Note</div>
                <p className="font-medium">{selectedPacketModal.syncDiagnosticNote}</p>
              </div>

              {selectedPacketModal.payloadBefore && (
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-1">Payload BEFORE Transformation</div>
                  <pre className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 overflow-x-auto text-[11px] font-mono leading-relaxed">
                    {JSON.stringify(selectedPacketModal.payloadBefore, null, 2)}
                  </pre>
                </div>
              )}

              {selectedPacketModal.payloadAfter && (
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">Payload AFTER Transformation</div>
                  <pre className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 overflow-x-auto text-[11px] font-mono leading-relaxed">
                    {JSON.stringify(selectedPacketModal.payloadAfter, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPacketModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-3xs cursor-pointer active:scale-95 transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CDC STREAM MODAL */}
      {isCreateStreamOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 max-w-lg w-full shadow-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <Plus className="w-5 h-5 text-slate-900" />
                </div>
                <h3 className="font-black text-[11px] text-slate-900 uppercase tracking-widest">
                  Configure New CDC Pipeline
                </h3>
              </div>
              <button type="button" onClick={() => setIsCreateStreamOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-1 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 bg-white">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Pipeline Name</label>
                <input 
                  type="text" 
                  defaultValue="Dynamics BC Customer CDC Stream" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-black uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Source Connection</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-black uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all appearance-none cursor-pointer font-mono">
                  <option>PostgreSQL Debezium Plugin (prod-pg-01)</option>
                  <option>Business Central Webhook Listener</option>
                  <option>MS SQL Server CDC Agent</option>
                  <option>MongoDB Change Stream</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Target Event Topic</label>
                <input 
                  type="text" 
                  defaultValue="cdc.business_central.customers.v1" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all" 
                />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateStreamOpen(false)}
                className="px-5 py-2.5 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreateStreamOpen(false);
                  setCdcStreams(prev => [
                    {
                      id: `cdc-new-${Math.floor(100 + Math.random() * 900)}`,
                      name: 'Dynamics BC Customer CDC Stream',
                      source: 'bc-erp-us.cloud.dynamics.com',
                      sourceType: 'Business Central Webhook Listener',
                      targetTopic: 'cdc.business_central.customers.v1',
                      status: 'Streaming',
                      latencyMs: 32,
                      eventsPerSec: 420,
                      totalEvents: 120,
                      queueLag: 0,
                      lastSync: 'Just now'
                    },
                    ...prev
                  ]);
                }}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-3xs transition-all active:scale-95 cursor-pointer"
              >
                Deploy Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE WEBHOOK MODAL */}
      {isCreateWebhookOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 max-w-lg w-full shadow-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <Globe className="w-5 h-5 text-slate-900" />
                </div>
                <h3 className="font-black text-[11px] text-slate-900 uppercase tracking-widest">
                  Add Webhook Destination
                </h3>
              </div>
              <button type="button" onClick={() => setIsCreateWebhookOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-1 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 bg-white">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Webhook Name</label>
                <input 
                  type="text" 
                  defaultValue="Custom Analytics Service Push" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-black uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Endpoint Target URL</label>
                <input 
                  type="text" 
                  defaultValue="https://api.myanalytics.com/v1/cdc-ingest" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all" 
                />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateWebhookOpen(false)}
                className="px-5 py-2.5 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreateWebhookOpen(false);
                  setWebhooks(prev => [
                    {
                      id: `wh-new-${Math.floor(100 + Math.random() * 900)}`,
                      name: 'Custom Analytics Service Push',
                      targetUrl: 'https://api.myanalytics.com/v1/cdc-ingest',
                      topicsFilter: ['cdc.customers.v1'],
                      status: 'Active',
                      deliveryRate: 100.0,
                      lastStatusCode: 200,
                      lastLatencyMs: 45,
                      hmacEnabled: true,
                      retryPolicy: 'Exponential (5 retries)'
                    },
                    ...prev
                  ]);
                }}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-3xs transition-all active:scale-95 cursor-pointer"
              >
                Save Destination
              </button>
            </div>
          </div>
        </div>
      )}

      {showReconciliationAlertModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-3xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200/80">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                  <Bell className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-black text-[11px] text-slate-900 uppercase tracking-widest">
                  Alert Thresholds
                </h3>
              </div>
              <button
                onClick={() => setShowReconciliationAlertModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-8 bg-white">
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Warning Threshold</p>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Low Impact</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed px-1">Trigger a warning notification if exceptions exceed this count during a sync window.</p>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={reconWarningThreshold}
                    onChange={(e) => setReconWarningThreshold(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Exceptions / Min</span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical Threshold</p>
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">High Impact</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed px-1">Trigger a critical push alert if exceptions exceed this count during a sync window.</p>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={reconCriticalThreshold}
                    onChange={(e) => setReconCriticalThreshold(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-black focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Exceptions / Min</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowReconciliationAlertModal(false)}
                className="px-5 py-2.5 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowReconciliationAlertModal(false);
                  setActionToast({
                    message: `Alert thresholds saved. Warning: ${reconWarningThreshold}, Critical: ${reconCriticalThreshold}`,
                    type: 'info'
                  });
                }}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-3xs transition-all active:scale-95 cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
